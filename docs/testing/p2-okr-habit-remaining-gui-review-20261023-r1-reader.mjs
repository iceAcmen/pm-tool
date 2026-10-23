import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const base = path.join(repo, 'reports/all-pending-evidence-20261021/P2OkrRemainingR1')
const prefix = path.join(repo, 'docs/testing/p2-okr-habit-remaining-gui-review-20261023-r1')
const inherited = path.join(repo, 'reports/all-pending-evidence-20261021/CombinedSuccessor114R1')
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const inputs = {}
const errors = []
function read(file) {
  const b = fs.readFileSync(file)
  inputs[path.relative(repo, file)] = { bytes: b.length, sha256: sha(b) }
  return b
}
const json = file => JSON.parse(read(file))
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const difference = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .sort().filter(k => !equal(a[k], b[k]))
const save = (suffix, value) => fs.writeFileSync(prefix + suffix, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })

if (process.argv[2] === 'seal') {
  const audit = JSON.parse(fs.readFileSync(prefix + '-audit-r2.json'))
  const drift = []
  for (const [file, expected] of Object.entries(audit.inputs)) {
    try {
      const b = fs.readFileSync(path.join(repo, file))
      if (b.length !== expected.bytes || sha(b) !== expected.sha256) drift.push(file)
    } catch (e) { drift.push({ file, error: e.code }) }
  }
  const outputs = {}
  for (const file of fs.readdirSync(path.dirname(prefix)).filter(n => n.startsWith(path.basename(prefix)))) {
    const b = fs.readFileSync(path.join(path.dirname(prefix), file))
    outputs[file] = { bytes: b.length, sha256: sha(b) }
  }
  save('-seal.json', { at: new Date().toISOString(), inputCount: Object.keys(audit.inputs).length,
    drift, outputs, productExecuted: false, guiExecuted: false, resourcesReleased: true,
    stop: true, ordinaryCommitAuthorizedByThisReview: false })
  console.log(JSON.stringify({ drift: drift.length, outputs: Object.keys(outputs).length }))
  process.exitCode = drift.length ? 1 : 0
} else if (['audit', 'audit-r2'].includes(process.argv[2])) {
  const index = json(path.join(base, 'index-r1.json'))
  for (const [file, expected] of Object.entries(index)) {
    const resolved = path.resolve(base, file)
    if (!resolved.startsWith(base + '/') || fs.lstatSync(resolved).isSymbolicLink()) {
      errors.push({ unsafe: file })
      continue
    }
    const b = read(resolved)
    if (b.length !== expected.bytes || sha(b) !== expected.sha256) errors.push({ mismatch: file })
  }
  const actualFiles = []
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, e.name)
      if (e.isDirectory()) walk(file)
      else actualFiles.push(path.relative(base, file))
    }
  }
  walk(base)
  const unindexed = actualFiles.filter(f => !index[f])
  const seal = json(path.join(base, 'seal-r1.json'))
  if (seal.files !== Object.keys(index).length ||
      seal.indexSha256 !== inputs[path.relative(repo, path.join(base, 'index-r1.json'))].sha256) {
    errors.push({ sealIndexMismatch: true })
  }
  const binding = json(path.join(base, 'candidate-source-binding.json'))
  const complete = json(path.join(inherited, 'complete-inputs.json'))
  const source = json(path.join(inherited, 'source-files.json'))
  const candidate = json(path.join(inherited, 'candidate.json'))
  const sourceBinding = []
  for (const [file, declared] of Object.entries(binding.sourceBinding)) {
    const b = read(path.join(base, 'frozen-source', file))
    const actual = { bytes: b.length, sha256: sha(b) }
    const matches = equal(actual, complete[file]) && equal(actual, declared.declared) &&
      actual.sha256 === declared.sha256 && actual.bytes === declared.bytes
    sourceBinding.push({ file, actual, complete: complete[file], matches,
      changedSourceManifestMatch: source.source['packages/dsh-pm-tool/' + file] === actual.sha256,
      changedSourceManifestPresent: !!source.source['packages/dsh-pm-tool/' + file] })
    if (!matches) errors.push({ sourceBindingMismatch: file })
  }
  for (const file of ['AGENTS.md', 'docs/collaboration.md',
    'docs/testing/op-growth-final-inheritance-20261022-r1.md',
    'docs/testing/remaining-governance-cases-20261021.md',
    'docs/testing/combined-successor114-regression-review-20261022-r1-report.md',
    'docs/testing/copilot-prefix114-gui-retest-20261022-r1-report.md']) read(path.join(repo, file))

  const roots = []
  const skippedUiLabels = []
  for (const file of Object.keys(index).filter(f => !f.includes('/') && f.endsWith('-roots.json'))) {
    const root = json(path.join(base, file))
    if (root.origin) { skippedUiLabels.push(file); continue }
    const label = file.slice(0, -'-roots.json'.length)
    const ui = json(path.join(base, label + '.json'))
    let checked = 0
    for (const [rel, expected] of Object.entries(root)) {
      if (!rel.startsWith('data/pmtool/')) continue
      const rawPath = path.join(base, label + '-raw', rel)
      const b = read(rawPath)
      if (b.length !== expected.bytes || sha(b) !== expected.sha256) errors.push({ rootRawMismatch: label, rel })
      checked++
    }
    roots.push({ label, at: ui.at, origin: ui.origin, timeOrigin: ui.timeOrigin,
      viewport: ui.viewport, root, checked })
  }
  roots.sort((a, b) => a.at.localeCompare(b.at))
  const comparisons = roots.slice(1).map((r, i) => ({
    before: roots[i].label, after: r.label,
    changed: difference(roots[i].root, r.root),
  }))
  const changedTransitions = comparisons.filter(r => r.changed.length)
  const recordChanges = changedTransitions.map(t => ({ ...t, fields: Object.fromEntries(t.changed.map(rel => {
    const load = label => {
      const file = path.join(base, label + '-raw', rel)
      if (!fs.existsSync(file)) return {}
      const data = json(file)
      return data.record ?? data
    }
    const before = load(t.before), after = load(t.after)
    return [rel, { changedKeys: difference(before, after), before, after }]
  })) }))
  const observations = json(path.join(base, 'executor-observations.json'))
  if (!equal(comparisons, observations.comparisons)) errors.push({ observationsDifference: true })

  const rpc = [], frameCounts = {}, exceptions = []
  for (let r = 1; r <= 17; r++) {
    const round = 'round' + String(r).padStart(2, '0')
    const events = json(path.join(base, round + '-events.json'))
    const requests = events.rows.filter(x => x.type === 'request')
    const responses = events.rows.filter(x => x.type === 'response')
    frameCounts[round] = events.frames.length
    for (const frame of events.frames) {
      if (!index[frame.file] || index[frame.file].sha256 !== frame.sha256) errors.push({ frameMismatch: round, file: frame.file })
    }
    for (const event of events.rows.filter(x => !['request', 'response'].includes(x.type))) exceptions.push({ round, event })
    for (const req of requests) {
      const matched = responses.filter(res => res.body.rpcId === req.body.rpcId)
      if (matched.length !== 1) errors.push({ rpcPairMismatch: round, rpcId: req.body.rpcId })
      const res = matched[0]
      const result = res?.body?.result?.value?.result
      rpc.push({ round, rpcId: req.body.rpcId, requestAt: req.at, responseAt: res?.at,
        line: req.body.payload.args.line, status: res?.status, ok: res?.body?.result?.ok,
        kind: result?.kind, text: result?.text })
    }
    for (const res of responses) if (!requests.some(req => req.body.rpcId === res.body.rpcId)) errors.push({ orphanResponse: round })
  }
  const commands = []
  for (const file of Object.keys(index).filter(f => !f.includes('/') && /(-command|-result)\.json$/.test(f))) {
    const d = json(path.join(base, file))
    if (!d.body?.rpcId) continue
    const matched = rpc.filter(x => x.rpcId === d.body.rpcId)
    if (matched.length !== 1 || (d.line && matched[0].line !== d.line)) errors.push({ commandPairMismatch: file })
    const event = matched.length === 1
      ? json(path.join(base, matched[0].round + '-events.json')).rows.find(x => x.type === 'response' && x.body.rpcId === d.body.rpcId)
      : undefined
    if (!event || !equal(event.body, d.body) || event.status !== d.status) errors.push({ responseBodyMismatch: file })
    commands.push({ file, rpcId: d.body.rpcId, line: matched[0]?.line, kind: matched[0]?.kind })
  }
  const habitPath = 'data/pmtool/habits/habit-mvi5z84q-32ztau.json'
  const initialHabit = json(path.join(base, roots[0].label + '-raw', habitPath)).record
  const finalHabit = json(path.join(base, roots.at(-1).label + '-raw', habitPath)).record
  const snapshot = JSON.parse(rpc.find(x => x.rpcId === '1b673ec1-cd93-47ba-9365-d9c91a35ea01').text)
  const targetId = 'okr-mvk2hl7d-refwvh'
  const projection = snapshot.habits.filter(h => h.okrId === targetId)
  const result = { at: new Date().toISOString(), indexCount: Object.keys(index).length,
    indexSha256: inputs[path.relative(repo, path.join(base, 'index-r1.json'))].sha256,
    unindexed, seal, binding, inheritedCandidate: candidate,
    inheritedCompleteCount: Object.keys(complete).length, inheritedSourceCount: source.count,
    sourceBinding, rootStateCount: roots.length, rawRootChecks: roots.reduce((n, r) => n + r.checked, 0),
    rootTimeline: roots.map(({ root, ...rest }) => ({ ...rest, files: Object.keys(root).length })),
    skippedUiLabels, comparisons, recordChanges,
    overallChanged: difference(roots[0].root, roots.at(-1).root), rpc, commands, frameCounts, exceptions,
    habit: { initial: initialHabit, final: finalHabit,
      unchangedCheckIns: equal(initialHabit.checkIns, finalHabit.checkIns),
      unchangedStreak: equal(initialHabit.streak, finalHabit.streak),
      unchangedCreatedAt: initialHabit.createdAt === finalHabit.createdAt,
      changedKeys: difference(initialHabit, finalHabit) },
    readonlyProjection: { targetId, matched: projection, cycleDue: snapshot.okrs.find(o => o.id === targetId)?.cycleDue },
    receipts: json(path.join(base, 'execution-receipts.json')), errors, inputs }
  save(process.argv[2] === 'audit-r2' ? '-audit-r2.json' : '-audit.json', result)
  console.log(JSON.stringify({ files: result.indexCount, inputs: Object.keys(inputs).length,
    rootStates: roots.length, rawChecks: result.rawRootChecks, transitions: changedTransitions.length,
    overallChanged: result.overallChanged, rpcPairs: rpc.length, commandPairs: commands.length,
    frames: Object.values(frameCounts).reduce((a, b) => a + b, 0), exceptions: exceptions.length,
    errors, habit: result.habit, sourceBinding }))
  process.exitCode = errors.length ? 1 : 0
} else {
  throw new Error('Expected audit or seal')
}
