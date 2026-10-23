import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'p2007-archive-known-gaps-red-20261023-r1'
const evidence = 'reports/all-pending-evidence-20261021/P2ArchiveReviewR1'
const combined = 'reports/all-pending-evidence-20261021/CombinedSuccessor114R1'
const hostDir = 'reports/all-pending-evidence-20261021/Successor114GuiR1'
const docs = [
  'AGENTS.md',
  'docs/collaboration.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/op-growth-final-inheritance-20261022-r1.md',
  'docs/design/deep-integration-v2-p2-dev.md',
  'docs/design/deep-integration-v2-p2-verify.md',
]
const sources = [
  'src/core/archive.ts', 'src/commands/archive.ts',
  'src/core/review-materials.ts', 'src/commands/review.ts',
  'src/core/reflect.ts', 'src/core/export.ts',
  'src/core/storage.ts', 'src/core/archive.test.ts',
].map(p => `packages/dsh-pm-tool/${p}`)
const allowed = p => docs.includes(p) || sources.includes(p)
  || p.startsWith(`${evidence}/`) || [
    `${combined}/candidate.json`, `${combined}/source-files.json`,
    `${combined}/complete-inputs.json`, `${combined}/built-artifacts.json`,
    `${hostDir}/host-start.json`, `${hostDir}/fixture-binding.json`,
  ].includes(p)
const fingerprints = {}
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fingerprint = b => ({ bytes: b.length, sha256: sha(b) })
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function read(p) {
  if (!allowed(p) || path.isAbsolute(p) || p.split('/').includes('..')) {
    throw new Error(`Forbidden input: ${p}`)
  }
  const absolute = path.join(repo, p)
  for (let check = absolute; check !== repo; check = path.dirname(check)) {
    if (fs.lstatSync(check).isSymbolicLink()) throw new Error(`Symlink input: ${check}`)
  }
  const b = fs.readFileSync(absolute)
  const fp = fingerprint(b)
  if (fingerprints[p] && !equal(fingerprints[p], fp)) throw new Error(`Input drift: ${p}`)
  fingerprints[p] = fp
  return b
}
const json = p => JSON.parse(read(p).toString('utf8'))
const ev = p => json(`${evidence}/${p}`)
const checks = []
function check(name, ok, details = {}) {
  checks.push({ name, ok: !!ok, ...details })
}
function inventory(dir) {
  const found = []
  for (const e of fs.readdirSync(path.join(repo, dir), { withFileTypes: true })) {
    if (e.isSymbolicLink()) throw new Error(`Symlink inventory: ${dir}/${e.name}`)
    if (e.isDirectory()) found.push(...inventory(`${dir}/${e.name}`))
    else found.push(`${dir}/${e.name}`)
  }
  return found.sort()
}
const mode = process.argv[2]
if (!['capture', 'seal'].includes(mode)) throw new Error('Use capture or seal')

if (mode === 'capture') {
  for (const p of [...docs, ...sources]) read(p)
  const index = ev('index-r1.json')
  const inputSeal = ev('seal-r1.json')
  const rows = Object.entries(index).map(([p, expected]) => {
    const actual = fingerprint(read(`${evidence}/${p}`))
    return { path: p, expected, actual, ok: equal(expected, actual) }
  })
  const listed = rows.map(x => `${evidence}/${x.path}`).sort()
  const actualFiles = inventory(evidence).filter(p =>
    ![`${evidence}/index-r1.json`, `${evidence}/seal-r1.json`].includes(p))
  check('192 indexed SHA256 and size', rows.length === 192 && rows.every(x => x.ok),
    { count: rows.length, mismatches: rows.filter(x => !x.ok) })
  check('Index exact inventory', equal(listed, actualFiles))
  check('Input seal index', inputSeal.files === 192
    && inputSeal.indexSha256 === fingerprints[`${evidence}/index-r1.json`].sha256
    && inputSeal.productVerdict === 'NOT_JUDGED')

  const binding = ev('candidate-source-binding.json')
  const candidate = json(`${combined}/candidate.json`)
  const complete = json(`${combined}/complete-inputs.json`)
  const sourceFiles = json(`${combined}/source-files.json`)
  const built = json(`${combined}/built-artifacts.json`)
  const host = json(`${hostDir}/host-start.json`)
  json(`${hostDir}/fixture-binding.json`)
  const bound = Object.entries(binding.binding).map(([p, expected]) => {
    const actual = fingerprint(read(p))
    const rel = p.startsWith('packages/dsh-pm-tool/') ? p.slice('packages/dsh-pm-tool/'.length) : null
    return { path: p, actual, expected,
      ok: actual.bytes === expected.bytes && actual.sha256 === expected.sha256
        && (!rel || equal(expected.frozen, complete[rel]) && equal(actual, complete[rel])) }
  })
  check('Binding metadata and six current sources versus complete-inputs', bound.every(x => x.ok),
    { count: bound.length, mismatches: bound.filter(x => !x.ok) })
  check('114/521 identity', candidate.baseline === binding.baseline
    && binding.baseline === '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd'
    && candidate.sourceCount === 114 && candidate.completeInputCount === 521
    && sourceFiles.baseline === binding.baseline && sourceFiles.count === 114
    && Object.keys(sourceFiles.source).length === 114 && Object.keys(complete).length === 521)
  const builtBundle = Object.entries(built).filter(([, v]) => v.sha256 === host.bundleSha256)
  check('Host metadata bundle hash', builtBundle.length > 0, { matchingArtifacts: builtBundle })
  check('Host metadata PID/port/flags and candidate', host.pid === 10975 && host.port === 3264
    && binding.pid === host.pid && binding.port === host.port && binding.e2e === 0
    && binding.pilot === 'OFF' && host.flags.DSH_PM_E2E === '0'
    && host.candidateSha256 === fingerprints[`${combined}/candidate.json`].sha256
    && host.sourceSha256 === fingerprints[`${combined}/source-files.json`].sha256)

  const rounds = ['round00-resume', 'round01-after-archive', 'round01-after-review', 'round02-after-file-open']
  const states = rounds.map(name => ({ name, roots: ev(`${name}-roots.json`), ui: ev(`${name}.json`) }))
  const rawProof = states.map(s => {
    const data = Object.entries(s.roots).filter(([p]) => p.startsWith('data/pmtool/'))
    const verified = data.map(([p, expected]) => ({
      path: p, ok: equal(fingerprint(read(`${evidence}/${s.name}-raw/${p}`)), expected),
    }))
    const rawInventory = inventory(`${evidence}/${s.name}-raw`)
    return { round: s.name, count: verified.length,
      ok: verified.every(x => x.ok) && equal(rawInventory,
        verified.map(x => `${evidence}/${s.name}-raw/${x.path}`).sort()) }
  })
  check('Four round DB raw bytes versus root manifests', rawProof.every(x => x.ok), { rounds: rawProof })
  const rootComparisons = states.slice(1).map(s => {
    const first = states[0].roots
    const keys = [...new Set([...Object.keys(first), ...Object.keys(s.roots)])].sort()
    return { round: s.name, rootEntryCount: keys.length,
      changed: keys.filter(p => !equal(first[p], s.roots[p])) }
  })
  check('Original data/files/backups metadata zero change', rootComparisons.every(x => x.changed.length === 0),
    { comparisons: rootComparisons, byteReadScope: 'repository raw DB only; files/backups are sealed metadata' })
  check('Recorded UI same host context', states.every(s => s.ui.origin === 'http://127.0.0.1:3264'
    && s.ui.timeOrigin === states[0].ui.timeOrigin))

  const events = ev('round01-archive-review-events.json')
  const archive = ev('round01-archive-command.json')
  const review = ev('round01-review-command.json')
  const rpc = [archive, review].map(c => {
    const requests = events.rows.filter(r => r.type === 'request' && r.body.rpcId === c.body.rpcId)
    const responses = events.rows.filter(r => r.type === 'response' && r.body.rpcId === c.body.rpcId)
    return { line: c.line, rpcId: c.body.rpcId, commandId: c.body.result.value.commandId,
      agentId: requests[0]?.body.payload.args.agentId,
      requestAt: requests[0]?.at, responseAt: responses[0]?.at,
      ok: requests.length === 1 && responses.length === 1
        && requests[0].body.method === 'commands/execute'
        && requests[0].body.payload.args.line === c.line
        && equal(responses[0].body, c.body) && responses[0].status === c.status
        && c.body.result.ok && c.body.result.value.result.kind === 'success' }
  })
  check('Real RPC request/response/command output identity', rpc.every(x => x.ok)
    && rpc[0].agentId === rpc[1].agentId, { rpc })
  const frameProof = ['round01-archive-review-events.json', 'round02-real-file-open-events.json'].map(name => {
    const e = ev(name)
    return { name, frames: e.frames.length, ok: e.frames.every(f =>
      index[f.file]?.sha256 === f.sha256), exceptions: e.rows.filter(r => r.type === 'exception').length }
  })
  check('Event frame hashes', frameProof.every(x => x.ok), { frameProof })

  const originals = ev('round02-export-originals.json')
  const originalComparisons = originals.map((o, i) => {
    const bytes = read(`${evidence}/exported-originals/${o.name}`)
    const file = ev(`round02-file-${i}.json`)
    const expectedUrl = 'file://' + host.bundle.replace(/pmtool-combined-successor114-20261022-r1\/packages\/dsh-pm-tool$/,
      'pmtool-successor114-gui-runtime-20261022-r1') + '/exports/p2-archive-review-r1/' + encodeURIComponent(o.name)
    return { name: o.name, actual: fingerprint(bytes), url: file.url,
      ok: equal(fingerprint(bytes), { bytes: o.bytes, sha256: o.sha256 })
        && file.url === expectedUrl && file.text === bytes.toString('utf8') }
  })
  check('Copied export originals versus capture hashes and file body', originalComparisons.every(x => x.ok),
    { originals: originalComparisons, runtimeReread: false })

  const pkg = ev('exported-originals/package.json')
  const reviewText = review.body.result.value.result.text
  const fenced = reviewText.match(/```json\n([\s\S]*?)\n```/)
  if (!fenced) throw new Error('Missing real review JSON')
  const reviewData = JSON.parse(fenced[1])
  const md = reviewText.slice(0, fenced.index)
  const sourceRefPaths = Object.keys(states[0].roots).filter(p => p.startsWith('data/pmtool/reflections/'))
  const refs = sourceRefPaths.map(p => json(`${evidence}/round00-resume-raw/${p}`).record)
  const comparison = refs.map(r => {
    const a = pkg.reflections.find(x => x.id === r.id)
    const v = reviewData.reflections.find(x => x.id === r.id)
    const known = r.draft.lines.filter(l => l.mark === 'known').map(l => l.text)
    return { id: r.id, projectId: r.projectId, sourceEvent: r.sourceEvent, status: r.status,
      draftAt: r.draft.at, sourceKnown: known, sourceGaps: r.draft.gaps,
      archiveKnown: a?.knownLines, archiveGaps: a?.gaps, reviewKnown: v?.knownLines,
      topLevelLinesAbsent: !Object.hasOwn(r, 'lines'), topLevelGapsAbsent: !Object.hasOwn(r, 'gaps'),
      knownMatch: equal(known, a?.knownLines), gapsMatch: equal(r.draft.gaps, a?.gaps),
      reviewMatch: equal(known, v?.knownLines) && v?.sourceEvent === r.sourceEvent
        && v?.title === r.draft.title && known.every(t => md.includes(`- ${t}`)) }
  })
  const knownCount = comparison.reduce((n, r) => n + r.sourceKnown.length, 0)
  const gapsCount = comparison.reduce((n, r) => n + r.sourceGaps.length, 0)
  check('Reflection same project and stable IDs', comparison.length === 3
    && comparison.every(r => r.projectId === 'p-0001')
    && equal(pkg.reflections.map(x => x.id).sort(), refs.map(x => x.id).sort())
    && equal(reviewData.reflections.map(x => x.id).sort(), refs.map(x => x.id).sort()))
  check('Review known-only 4+1+2 lines JSON/MD equals source', comparison.every(r => r.reviewMatch)
    && knownCount === 7 && reviewData.counts.reflectionKnownLines === knownCount
    && reviewData.period.start === '2026-10-16' && reviewData.period.end === '2026-10-23')
  check('Archive confirmed RED, not a green archive test', knownCount === 7 && gapsCount === 2
    && comparison.every(r => !r.knownMatch && r.archiveKnown.length === 0 && r.archiveGaps.length === 0)
    && comparison.filter(r => !r.gapsMatch).length === 2)
  const sourceTasks = Object.keys(states[0].roots).filter(p => p.startsWith('data/pmtool/tasks/'))
    .map(p => json(`${evidence}/round00-resume-raw/${p}`).record)
  const taskStates = sourceTasks.map(t => ({ id: t.id, projectId: t.projectId, status: t.status }))
  check('No positive done/wrapped coverage in this slice', reviewData.tasks.length === 0
    && reviewData.counts.doneTasks === 0 && reviewData.counts.wrappedTasks === 0
    && reviewData.counts.avgDoneProgress === null)
  check('Archive entity count is three, not seven known lines',
    pkg.reflections.length === 3 && archive.body.result.value.result.text.includes('known 行 3'))
  const declaredAt = pkg.archivedAt
  check('Export timestamp lies inside archive RPC', pkg.origin === 'pm-tool'
    && pkg.kind === 'pm-tool-archive' && pkg.projectId === 'p-0001'
    && pkg.exportedAt === declaredAt && declaredAt >= rpc[0].requestAt && declaredAt <= rpc[0].responseAt)

  const observations = ev('executor-observations.json')
  check('Main observations not independent PASS', observations.notIndependentPass === true)
  const result = {
    at: new Date().toISOString(), environment: { os: 'darwin', node: process.version, cwd: repo },
    role: 'independent evidence reader; no product imports/execution or GUI',
    evidence, inputSeal, binding: { baseline: binding.baseline, sourceCount: 114,
      completeInputCount: 521, port: 3264, pid: 10975, e2e: 0, pilot: 'OFF' },
    rows, bound, rootComparisons, comparison, sourceKnownCount: knownCount,
    sourceGapsCount: gapsCount, reviewCounts: reviewData.counts, taskStates, checks,
    readerChecksOk: checks.every(x => x.ok),
    verdict: { archiveKnownGaps: 'FAIL', reviewKnownSourceThisSlice: 'PASS',
      wholeP2007: 'NOT_PASS: remaining original chain', ordinaryCommit: 'NOT_AUTHORIZED_BY_THIS_REVIEW' },
    inputFingerprints: fingerprints,
  }
  fs.writeFileSync(`/tmp/${prefix}-audit-corrected.json`, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
  console.log(JSON.stringify({ readerChecksOk: result.readerChecksOk,
    checks: checks.map(x => ({ name: x.name, ok: x.ok })), indexedFiles: rows.length,
    inputFiles: Object.keys(fingerprints).length, comparison, rootComparisons,
    verdict: result.verdict }, null, 2))
  if (!result.readerChecksOk) process.exitCode = 1
} else {
  const auditPath = `/tmp/${prefix}-audit-corrected.json`
  const auditBytes = fs.readFileSync(auditPath)
  const audit = JSON.parse(auditBytes)
  const drift = Object.entries(audit.inputFingerprints).map(([p, expected]) => {
    const actual = fingerprint(read(p))
    return { path: p, expected, actual, ok: equal(expected, actual) }
  }).filter(x => !x.ok)
  const outputs = [`${prefix}.md`, `${prefix}-audit.json`, `${prefix}-reader.mjs`].map(name => {
    const p = path.join(repo, 'docs/testing', name)
    if (fs.lstatSync(p).isSymbolicLink()) throw new Error(`Symlink output: ${p}`)
    return { path: `docs/testing/${name}`, ...fingerprint(fs.readFileSync(p)) }
  })
  const copiedAudit = fs.readFileSync(path.join(repo, 'docs/testing', `${prefix}-audit.json`))
  const readerBytes = fs.readFileSync(import.meta.filename)
  const copiedReader = fs.readFileSync(path.join(repo, 'docs/testing', `${prefix}-reader.mjs`))
  const text = fs.readFileSync(path.join(repo, 'docs/testing', `${prefix}.md`), 'utf8')
  const links = [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(m => m[1])
  const brokenLinks = links.filter(link => {
    const target = path.resolve(repo, 'docs/testing', link.split('#')[0])
    if (target === path.join(repo, 'docs/testing', `${prefix}-seal.json`)) return false
    if (!target.startsWith(repo + '/')) return true
    return !fs.existsSync(target)
  })
  const documentCheck = {
    links: links.length, brokenLinks,
    trailingWhitespace: text.split('\n').some(line => /[ \t]+$/.test(line)),
    finalNewline: text.endsWith('\n'),
    balancedFences: (text.match(/^```/gm) ?? []).length % 2 === 0,
    sealLink: 'Own seal created with exclusive copy below',
  }
  const inventoryOk = equal(inventory(evidence).filter(p =>
    ![`${evidence}/index-r1.json`, `${evidence}/seal-r1.json`].includes(p)),
  audit.rows.map(x => `${evidence}/${x.path}`).sort())
  const seal = { at: new Date().toISOString(), inputs: Object.keys(audit.inputFingerprints).length,
    drift, inventoryOk, copiedAuditMatches: copiedAudit.equals(auditBytes),
    copiedReaderMatches: copiedReader.equals(readerBytes), documentCheck,
    audit: fingerprint(auditBytes), reader: fingerprint(readerBytes),
    outputs, scope: 'Explicit repository inputs only; no private frozen/runtime reads',
    released: true, resources: 'No product/build/GUI/service/Git/data locks or child processes', stop: 'STOP' }
  const sealPath = `/tmp/${prefix}-seal.json`
  fs.writeFileSync(sealPath, `${JSON.stringify(seal, null, 2)}\n`, { flag: 'wx' })
  fs.copyFileSync(sealPath, path.join(repo, 'docs/testing', `${prefix}-seal.json`), fs.constants.COPYFILE_EXCL)
  console.log(JSON.stringify(seal, null, 2))
  if (drift.length || !inventoryOk || !seal.copiedAuditMatches || !seal.copiedReaderMatches
    || brokenLinks.length || documentCheck.trailingWhitespace
    || !documentCheck.finalNewline || !documentCheck.balancedFences) process.exitCode = 1
}
