import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Archive-only audit. Never import product code, contact a service, or replay a collector.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = join(repo, 'docs/testing/a19-p0008-check-remainder-review-20261022')
const evidence = join(repo, 'reports/all-pending-evidence-20261021')
const root = join(evidence, 'A19/check-remainder')
const candidatePath = join(evidence, 'A18/candidate.json')
const loadedRoot = join(evidence, 'A18/final/loaded')
const fixed = [
  'AGENTS.md',
  'docs/collaboration.md',
  'docs/testing/remaining-acceptance-delta-20261022.md',
  'docs/testing/remaining-acceptance-delta-20261022-ledger.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'docs/testing/a18-check-five-gui-review-20261022.md',
  'reports/all-pending-evidence-20261021/A18/candidate.json',
  'reports/all-pending-evidence-20261021/A18/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A18/source-auto-handoff.json',
  'reports/all-pending-evidence-20261021/A18/final/host-start.json',
  'reports/all-pending-evidence-20261021/A18/final/host-ready.json',
  'reports/all-pending-evidence-20261021/A18/final/loaded/result.json',
  'reports/all-pending-evidence-20261021/A18/final/loaded/combo-1.txt',
].map(path => join(repo, path))

const readJson = path => JSON.parse(readFileSync(path, 'utf8'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const stable = value => JSON.stringify(value, (_, item) =>
  item && !Array.isArray(item) && typeof item === 'object'
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
    : item)
const same = (left, right) => stable(left) === stable(right)
const fingerprint = path => {
  const stat = lstatSync(path, { bigint: true })
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`Not a regular file: ${path}`)
  const bytes = readFileSync(path)
  return {
    bytes: bytes.length,
    sha256: sha(bytes),
    mtimeNs: String(stat.mtimeNs),
    inode: String(stat.ino),
  }
}
const scan = (path, out = {}) => {
  const stat = lstatSync(path)
  if (stat.isSymbolicLink()) throw Error(`Refuse symlink: ${path}`)
  if (stat.isDirectory()) {
    for (const name of readdirSync(path).sort()) scan(join(path, name), out)
  } else {
    out[path] = fingerprint(path)
  }
  return out
}
const delta = (before, after) => ({
  added: Object.fromEntries(Object.keys(after).filter(key => !(key in before)).map(key => [key, after[key]])),
  removed: Object.fromEntries(Object.keys(before).filter(key => !(key in after)).map(key => [key, before[key]])),
  changed: Object.fromEntries(Object.keys(before).filter(key => key in after && !same(before[key], after[key]))
    .map(key => [key, { before: before[key], after: after[key] }])),
})
const zero = change => Object.values(change).every(group => !Object.keys(group).length)
const sessionCache = '/session_projcache/sessions/session-04548dcf-b6ba-4259-a7ad-e7957eb0593f.json'
const withoutCache = data => Object.fromEntries(Object.entries(data).filter(([path]) => path !== sessionCache))
const rootsDelta = (before, after) => Object.fromEntries(['data', 'files', 'backups', 'exports']
  .map(name => [name, delta(name === 'data' ? withoutCache(before[name]) : before[name],
    name === 'data' ? withoutCache(after[name]) : after[name])]))
const rootsZero = change => Object.values(change).every(zero)
const save = (suffix, value) => writeFileSync(prefix + suffix, JSON.stringify(value, null, 2) + '\n')
const candidate = readJson(candidatePath)

function protectedFiles() {
  const files = scan(root)
  for (const path of fixed) files[path] = fingerprint(path)
  for (const path of new Set([...Object.keys(candidate.sourceHashes), ...Object.keys(candidate.artifacts)])) {
    const absolute = join(candidate.tree, path)
    files[absolute] = fingerprint(absolute)
  }
  return files
}

function capture() {
  const files = protectedFiles()
  save('-before.json', {
    at: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    files,
    scope: 'A19/check-remainder complete archive plus A18 declared source/artifacts and archived runtime binding.',
    excluded: 'Main current tree outside named contracts, live data/profile/credentials/service/browser and unrelated evidence.',
  })
  console.log(JSON.stringify({ mode: 'capture', protectedPaths: Object.keys(files).length }))
}

function loadStep(name) {
  const dir = join(root, name)
  const optional = file => existsSync(join(dir, file)) ? readJson(join(dir, file)) : null
  const step = {
    name,
    exit: optional('exit.json'),
    actual: optional('actual.json'),
    host: optional('view.json'),
    requests: optional('requests.json') ?? [],
    events: optional('commands.json') ?? [],
    before: optional('before-roots.json'),
    after: optional('after-roots.json'),
  }
  step.rootDelta = step.before && step.after ? rootsDelta(step.before, step.after) : null
  step.raw = {}
  const rawRoot = join(dir, 'raw')
  if (existsSync(rawRoot)) {
    for (const table of readdirSync(rawRoot).sort()) {
      step.raw[table] = {}
      for (const file of readdirSync(join(rawRoot, table)).sort()) {
        step.raw[table][file.replace(/\.json$/, '')] = readJson(join(rawRoot, table, file)).record
      }
    }
  }
  step.pairs = step.events.filter(row => row.event?.type === 'command/run').map(row => {
    const run = row.event
    const done = step.events.find(item => item.event?.type === 'command/done'
      && item.event.data.commandId === run.data.commandId)?.event
    const line = `/pm${run.data.args}`
    const request = step.requests.find(item => item.body?.payload?.args?.line === line)
    return {
      line,
      run,
      done,
      request,
      valid: !!done && !!request && run.data.name === 'pm' && run.data.source.kind === 'user'
        && request.path === '/api/commands/execute'
        && request.body.type === 'client-request'
        && request.body.method === 'commands/execute'
        && request.body.payload.args.agentId === 'session-04548dcf-b6ba-4259-a7ad-e7957eb0593f'
        && same(request.body.payload.args.submittedAttachments, [])
        && done.seq > run.seq && done.time >= run.time,
    }
  })
  return step
}

function audit() {
  const checks = []
  const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail })
  const index = readJson(join(root, 'index.json'))
  const actualFiles = Object.keys(scan(root)).map(path => relative(root, path))
    .filter(path => path !== 'index.json').sort()
  const listed = Object.keys(index.files).sort()
  const indexMismatches = listed.filter(path => {
    const current = fingerprint(join(root, path))
    return current.bytes !== index.files[path].bytes || current.sha256 !== index.files[path].sha256
  })
  check('index-1107-complete-bytes-sha', listed.length === 1107
    && same(listed, actualFiles) && indexMismatches.length === 0,
  { listed: listed.length, actual: actualFiles.length, mismatches: indexMismatches })
  check('index-preserves-no-verdict-and-two-failures', index.noVerdict === true
    && index.retainedFailures?.length === 2
    && index.retainedFailures[0].includes('unsupported top-level progressLog rejected')
    && index.retainedFailures[1].includes('composer absent failed before request'),
  { noVerdict: index.noVerdict, retainedFailures: index.retainedFailures })

  const declared = {
    candidateSha: sha(readFileSync(candidatePath)),
    sourceCount: Object.keys(candidate.sourceHashes).length,
    artifactCount: Object.keys(candidate.artifacts).length,
    sourceMismatches: Object.entries(candidate.sourceHashes).filter(([path, expected]) =>
      fingerprint(join(candidate.tree, path)).sha256 !== expected).map(([path]) => path),
    artifactMismatches: Object.entries(candidate.artifacts).filter(([path, expected]) =>
      fingerprint(join(candidate.tree, path)).sha256 !== expected).map(([path]) => path),
  }
  check('a18-candidate-source-artifact-binding', declared.candidateSha
    === '2d533a1d214c0ae68739b354aac2e0d85b37ca6735c256d3dd3820bce3c191b9'
    && candidate.baseline === '9b1a8c5317774ff07cc594a0acd12a5cc7893ebd'
    && candidate.tree === '/private/tmp/pmtool-a18-closure-20261022'
    && declared.sourceCount === 520 && declared.artifactCount === 453
    && !declared.sourceMismatches.length && !declared.artifactMismatches.length, declared)
  check('a18-tracked-patch-byte-binding',
    sha(readFileSync(join(evidence, 'A18/product-tracked.patch'))) === candidate.trackedPatchSha,
    { expected: candidate.trackedPatchSha, actual: sha(readFileSync(join(evidence, 'A18/product-tracked.patch'))) })

  const loaded = readJson(join(loadedRoot, 'result.json'))
  const start = readJson(join(evidence, 'A18/final/host-start.json'))
  const ready = readJson(join(evidence, 'A18/final/host-ready.json'))
  const client = readFileSync(join(candidate.tree, 'packages/dsh-pm-tool/lib/client.js'))
  const normalized = client.toString().replace(/(?:\r?\n)?\/\/# sourceURL=([^\r\n]+)(?:\r?\n)?$/, '')
    .replace(/(?:\r?\n)?\/\/# sourceMappingURL=[^\r\n]*(?:\r?\n)?$/, '')
  const segment = Buffer.from(normalized + (normalized.endsWith('\n') ? '' : '\n') + ';\n')
  const loadEvent = loaded.events[0]
  const combo = readFileSync(join(loadedRoot, loadEvent.file))
  const first = combo.indexOf(segment)
  const second = combo.indexOf(segment, first + 1)
  check('a18-host-loaded-3248-timeorigin-binding', start.pid === 63429 && ready.pid === 63429
    && ready.port === 3248 && ready.ready === true
    && start.plugin === join(candidate.tree, 'packages/dsh-pm-tool')
    && loaded.targetId === 'BA817F66FCE81BD58357C4B50BFFDF2C'
    && loaded.state.origin === 'http://127.0.0.1:3248'
    && loaded.state.timeOrigin === 1792629512672.7
    && loadEvent.frameId === loaded.targetId && loadEvent.status === 200 && loadEvent.fromDiskCache === false
    && combo.length === loadEvent.bytes && sha(combo) === loadEvent.responseSha
    && first >= 0 && second === -1
    && loadEvent.matches.some(match => match.sourceSha === sha(client)
      && match.segmentSha === sha(segment) && match.segmentBytes === segment.length
      && match.first === first && match.second === second && match.uniqueComplete === true),
  { pid: start.pid, origin: loaded.state.origin, timeOrigin: loaded.state.timeOrigin,
    targetId: loaded.targetId, responseSha: sha(combo), clientSha: sha(client), segmentSha: sha(segment) })

  const stepNames = readdirSync(root).filter(name => existsSync(join(root, name, 'exit.json')))
    .sort((a, b) => Number(a.split('-').at(-1)) - Number(b.split('-').at(-1)))
  const steps = Object.fromEntries(stepNames.map(name => [name, loadStep(name)]))
  const archivedContextSteps = Object.values(steps).filter(step => step.actual)
  check('all-archived-actual-same-a18-origin-timeorigin', archivedContextSteps.every(step =>
    step.actual.origin === loaded.state.origin && step.actual.timeOrigin === loaded.state.timeOrigin),
  archivedContextSteps.map(step => ({ name: step.name, origin: step.actual.origin, timeOrigin: step.actual.timeOrigin })))

  const pairs = Object.values(steps).flatMap(step => step.pairs)
  check('ten-post-run-done-pairs-one-honest-command-error', pairs.length === 10
    && pairs.every(pair => pair.valid)
    && pairs.filter(pair => pair.done.data.kind === 'success').length === 9
    && pairs.filter(pair => pair.done.data.kind === 'error').length === 1
    && pairs.find(pair => pair.done.data.kind === 'error')?.line.includes('"progressLog"'),
  pairs.map(pair => ({ step: stepNames.find(name => steps[name].pairs.includes(pair)),
    line: pair.line, kind: pair.done?.data.kind, commandId: pair.run.data.commandId })))

  const rawMismatches = []
  for (const step of Object.values(steps)) {
    if (!step.after) continue
    const rawRoot = join(root, step.name, 'raw')
    if (!existsSync(rawRoot)) continue
    for (const table of readdirSync(rawRoot)) {
      for (const file of readdirSync(join(rawRoot, table))) {
        const expected = step.after.data[`/pmtool/${table}/${file}`]
        const actual = fingerprint(join(rawRoot, table, file)).sha256
        if (expected !== actual) rawMismatches.push(`${step.name}/${table}/${file}`)
      }
    }
  }
  check('all-raw-record-bytes-match-after-root', rawMismatches.length === 0, rawMismatches)

  const frameResults = []
  for (const step of Object.values(steps)) {
    const manifestPath = join(root, step.name, 'frames/frames.json')
    if (!existsSync(manifestPath)) continue
    const manifest = readJson(manifestPath)
    const frames = Array.isArray(manifest) ? manifest : manifest.frames
    for (const frame of frames) {
      const path = join(root, step.name, 'frames', frame.file)
      frameResults.push({ step: step.name, file: frame.file, at: frame.at,
        ok: existsSync(path) && fingerprint(path).sha256 === frame.sha256 })
    }
  }
  check('all-original-frame-hashes', frameResults.length > 0
    && frameResults.every(frame => frame.ok)
    && listed.filter(path => path.endsWith('.jpg')).length === frameResults.length,
  { frames: frameResults.length, matching: frameResults.filter(frame => frame.ok).length,
    firstAt: frameResults[0]?.at, lastAt: frameResults.at(-1)?.at })

  const single = steps['command-1792636226258']
  const singleText = single.pairs[0].done.data.text
  const t12 = single.raw.tasks['t-0012']
  check('single-task-entry-exact-one-open-checklist', single.pairs[0].line === '/pm check t-0012'
    && single.pairs[0].done.data.kind === 'success'
    && singleText.includes('命中 1 条提示')
    && (singleText.match(/"rule": "done-open-checklist"/g) ?? []).length === 1
    && singleText.includes('"taskId": "t-0012"')
    && t12.status === 'done' && t12.checklist.length === 5
    && t12.checklist.filter(item => item.done).length === 2
    && rootsZero(single.rootDelta),
  { line: single.pairs[0].line, status: t12.status, checklistDone: t12.checklist.filter(item => item.done).length,
    checklistTotal: t12.checklist.length, businessDelta: single.rootDelta })

  const rejected = steps['command-1792636293343']
  check('unsupported-top-level-progresslog-rejection-preserved', rejected.pairs[0].done.data.kind === 'error'
    && rejected.pairs[0].done.data.text.includes('包含不支持的字段')
    && rootsZero(rejected.rootDelta) && !('t-0013' in rejected.raw.tasks),
  { line: rejected.pairs[0].line, doneKind: rejected.pairs[0].done.data.kind,
    text: rejected.pairs[0].done.data.text, businessDelta: rejected.rootDelta })

  const finalNarrative = steps['command-1792642202499']
  const t13 = finalNarrative.raw.tasks['t-0013']
  const noMaterials = task => Array.isArray(task.attachments) && task.attachments.length === 0
    && (!task.checklist || task.checklist.length === 0)
    && (!task.evidenceUrl || task.evidenceUrl === '')
    && (!task.deliverableId || task.deliverableId === '')
  const narrativeText = finalNarrative.pairs[0].done.data.text
  check('two-genuine-narratives-remain-non-material', t13.status === 'done'
    && t13.progressLog.length === 2
    && new Set(t13.progressLog.map(item => item.id)).size === 2
    && t13.progressLog.every(item => item.author === '测试' && item.revisions.length === 1
      && item.revisions[0].content === '已经写完说明，仍需材料复核。')
    && noMaterials(t13)
    && finalNarrative.pairs[0].line === '/pm check t-0013'
    && narrativeText.includes('命中 1 条提示')
    && (narrativeText.match(/"rule": "done-missing-materials"/g) ?? []).length === 1
    && narrativeText.includes('"taskId": "t-0013"')
    && rootsZero(finalNarrative.rootDelta),
  { progressLogs: t13.progressLog.map(item => ({ id: item.id, createdAt: item.createdAt,
    revisionId: item.revisions[0].id, content: item.revisions[0].content })),
    materials: { attachments: t13.attachments, checklist: t13.checklist ?? null,
      evidenceUrl: t13.evidenceUrl ?? null, deliverableId: t13.deliverableId ?? null },
    checkLine: finalNarrative.pairs[0].line, businessDelta: finalNarrative.rootDelta })

  const nav = steps['task-nav-1792636670129']
  const open = steps['check-open-1792636703785']
  const cancel = steps['cancel-1792636741031']
  check('narrative-card-open-cancel-visual-state', nav.actual.pm.text.includes('t-0013 · QA 检查 叙事非材料')
    && nav.actual.pm.text.includes('完成但缺交付/证据材料')
    && open.exit.value === 't-0013'
    && open.actual.pm.text.includes('编辑任务')
    && open.actual.pm.text.includes('QA 检查 叙事非材料')
    && open.actual.pm.text.includes('已经写完说明，仍需材料复核。')
    && !cancel.actual.pm.text.includes('编辑任务')
    && cancel.actual.pm.text.includes('t-0013 · QA 检查 叙事非材料')
    && [nav, open, cancel].every(step => rootsZero(step.rootDelta)),
  { navAt: nav.actual.at, openAt: open.actual.at, cancelAt: cancel.actual.at,
    visualFiles: ['task-nav-1792636670129/actual.png', 'check-open-1792636703785/actual.png',
      'cancel-1792636741031/actual.png'] })

  const wrapped = steps['command-1792636606176']
  const t14 = wrapped.raw.tasks['t-0014']
  const wrappedText = wrapped.pairs[0].done.data.text
  check('wrapped-mapped-to-no-rule', wrapped.pairs[0].line === '/pm check t-0014'
    && wrapped.pairs[0].done.data.kind === 'success'
    && wrappedText.includes('未命中任何规则提示')
    && t14.status === 'wrapped' && t14.progress === 100
    && t14.startDate === '2026-10-20' && t14.dueDate === '2026-10-21'
    && nav.actual.pm.text.includes('QA 检查 已收尾不催办')
    && nav.actual.pm.text.includes('已收尾 1')
    && !nav.actual.pm.text.includes('t-0014 · QA 检查 已收尾不催办')
    && rootsZero(wrapped.rootDelta),
  { line: wrapped.pairs[0].line, task: t14, text: wrappedText, businessDelta: wrapped.rootDelta })

  const interrupted = steps['command-1792642107802']
  check('composer-absent-failure-preserved-not-promoted', interrupted.exit.exit === 1
    && interrupted.exit.error === 'Error: owned composer missing'
    && interrupted.requests.length === 0 && interrupted.events.length === 0
    && !!interrupted.before && !interrupted.after,
  { exit: interrupted.exit, requests: interrupted.requests.length, events: interrupted.events.length,
    verdict: 'BLOCKED collection attempt; later successful command is separate evidence and does not rewrite this attempt.' })

  const verdicts = {
    singleTaskEntry: {
      verdict: 'PASS',
      scope: '/pm check t-0012 returns exactly one done-open-checklist result and is business-read-only.',
    },
    narrativeNonMaterial: {
      verdict: 'PASS',
      scope: 't-0013 has two genuine progressLog entries, no completion materials, and still returns exactly one done-missing-materials result; archived card opens the same task and cancel is read-only.',
    },
    wrappedFirstMapping: {
      verdict: 'PASS',
      scope: 't-0014 is wrapped/progress100/past-due and /pm check t-0014 returns no rule; project card excludes t-0014.',
    },
    unsupportedTopLevelProgressLogAttempt: {
      verdict: 'FAIL_RETAINED',
      scope: 'Unsupported input was honestly rejected with zero business write; it is not counted as a successful fixture path.',
    },
    interruptedComposerAbsentAttempt: {
      verdict: 'BLOCKED_RETAINED',
      scope: 'Collector failed before request because its owned composer was absent; later resume evidence does not erase this attempt.',
    },
  }
  save('-result.json', {
    at: new Date().toISOString(),
    checks,
    auditConsistent: checks.every(item => item.ok),
    verdicts,
    raP0008Delta: {
      closeRequestedDelta: checks.every(item => item.ok),
      closedItems: ['task单项入口', '叙事非材料', 'wrapped先映射'],
      inheritedWithoutRerun: 'A18 five-rule 25-step limited PASS',
      notGranted: 'Whole RA-P0008, whole P0008, threshold/failure matrix, viewport/theme/zoom/read-screen, release or commit PASS.',
    },
    originalIndexSha256: fingerprint(join(root, 'index.json')).sha256,
    originalIndexedFiles: listed.length,
    originalFrameCount: frameResults.length,
  })
  console.log(JSON.stringify({ mode: 'audit', checks: checks.length,
    failures: checks.filter(item => !item.ok).map(item => item.name), verdicts }))
  if (checks.some(item => !item.ok)) process.exitCode = 1
}

function seal() {
  const before = readJson(prefix + '-before.json')
  const drift = Object.entries(before.files).flatMap(([path, expected]) => {
    try {
      const actual = fingerprint(path)
      return same(expected, actual) ? [] : [{ path, expected, actual }]
    } catch (error) {
      return [{ path, error: String(error) }]
    }
  })
  const currentProtected = protectedFiles()
  const protectedSetEqual = same(Object.keys(before.files).sort(), Object.keys(currentProtected).sort())
  const ownNames = readdirSync(dirname(prefix)).filter(name =>
    name.startsWith('a19-p0008-check-remainder-review-20261022')
    && !name.endsWith('-seal.json')).sort()
  const ownFiles = Object.fromEntries(ownNames.map(name => {
    const path = join(dirname(prefix), name)
    return [relative(repo, path), fingerprint(path)]
  }))
  const formatting = Object.keys(ownFiles).flatMap(path => {
    const text = readFileSync(join(repo, path), 'utf8')
    const issues = []
    if (!text.endsWith('\n')) issues.push({ path, issue: 'missing final newline' })
    if (/[ \t]+$/m.test(text)) issues.push({ path, issue: 'trailing whitespace' })
    return issues
  })
  save('-seal.json', {
    at: new Date().toISOString(),
    protectedSince: before.at,
    protectedPaths: Object.keys(before.files).length,
    drift,
    protectedSetEqual,
    formatting,
    ownFiles,
    resourceRelease: 'No product test/build/install/browser/service/network/credential action. Synchronous archive audit finished; no child process or session retained. No commit.',
  })
  console.log(JSON.stringify({ mode: 'seal', drift: drift.length, protectedSetEqual, formatting }))
  if (drift.length || !protectedSetEqual || formatting.length) process.exitCode = 1
}

const mode = process.argv[2]
if (mode === 'capture') capture()
else if (mode === 'audit') audit()
else if (mode === 'seal') seal()
else throw Error('Use capture, audit or seal.')
