import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'docs/testing/p1-history-remaining-gui-review-20261023-r1'
const pack = 'reports/all-pending-evidence-20261021/P1HistoryRemainingR1'
const returned = 'reports/all-pending-evidence-20261021/P1HistoryReturnR1'
const prerequisites = [
  'AGENTS.md',
  'docs/collaboration.md',
  'docs/testing/op-growth-final-inheritance-20261022-r1.md',
  'docs/testing/remaining-governance-cases-20261021.md',
  'reports/all-pending-evidence-20261021/CombinedSuccessor114R1/complete-inputs.json',
]
const allowed = p => p.startsWith(pack + '/') || p.startsWith(returned + '/')
  || prerequisites.includes(p) || p.startsWith(prefix)
const inputs = {}
function read(p) {
  assert(allowed(p), `Outside reader scope: ${p}`)
  assert(!path.isAbsolute(p) && !p.split('/').includes('..'), `Unsafe path: ${p}`)
  const absolute = path.join(root, p)
  assert.equal(fs.realpathSync(absolute), absolute, `Symlink rejected: ${p}`)
  const bytes = fs.readFileSync(absolute)
  inputs[p] = { bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }
  return bytes
}
const json = p => JSON.parse(read(p))
const evidence = f => json(`${pack}/${f}`)
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => !equal(a[k], b[k])).map(file => ({ file, before: a[file] ?? null, after: b[file] ?? null }))
function write(suffix, value) {
  fs.writeFileSync(path.join(root, prefix + suffix), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function rpc(round) {
  const rows = evidence(`${round}-events.json`).rows
  return rows.filter(r => r.type === 'request').map(request => ({
    request,
    response: rows.find(r => r.type === 'response' && r.body.rpcId === request.body.rpcId),
  }))
}
const result = r => r.response?.body.result.value.result
const line = r => r.request.body.payload.args.line
const snapshot = round => JSON.parse(result(rpc(round).find(r => line(r) === '/pm web snapshot')).text)
const raw = (phase, file) => evidence(`${phase}-raw/data/pmtool/${file}`)

function capture() {
  for (const p of prerequisites) read(p)
  const index = evidence('index-r1.json')
  const sourceSeal = evidence('seal-r1.json')
  assert.equal(Object.keys(index).length, 2122)
  assert.equal(inputs[`${pack}/index-r1.json`].sha256, sourceSeal.indexSha256)
  const mismatches = []
  // Evidence configuration is opaque byte-audited, never parsed for credentials.
  for (const [file, expected] of Object.entries(index)) {
    read(`${pack}/${file}`)
    if (!equal(inputs[`${pack}/${file}`], expected)) mismatches.push(file)
  }
  assert.deepEqual(mismatches, [])
  const returnReceipt = json(`${returned}/return-receipt.json`)
  read(`${returned}/return-script.mjs`)
  const candidate = evidence('candidate-source-binding.json')
  const complete = json(candidate.completePath)
  assert.equal(inputs[candidate.completePath].sha256, candidate.completeSha256)
  assert.equal(Object.keys(complete).length, 521)
  assert.equal(candidate.sourceCount, 114)
  assert.deepEqual(candidate.flags, { e2e: '0', pilot: 'OFF' })
  assert.equal(candidate.binding.length, 12)
  for (const row of candidate.binding) {
    assert.deepEqual(inputs[`${pack}/${row.file}`], complete[row.source])
    assert.deepEqual(inputs[`${pack}/${row.file}`], { bytes: row.bytes, sha256: row.sha256 })
  }
  const host = evidence('host-start.json')
  const ready = evidence('host-ready.json')
  assert.equal(host.pid, 3133)
  assert.equal(host.port, 3267)
  assert.equal(ready.pid, host.pid)
  assert.equal(ready.port, host.port)
  const fixture = evidence('fixture-binding.json')
  const backup = evidence('original-history-backup.json')
  assert.equal(inputs[`${pack}/original-history-backup.json`].sha256,
    '6de364e671f87c661833110034f1bdf48eefe12b13a75dafda1658835f19c63e')
  assert.equal(backup.projects.length, 6)
  assert.equal(backup.tasks.length, 23)
  assert(!Object.hasOwn(backup.extra, 'sessions'))
  const mute = backup.extra.settings.find(([id]) => id === 'pmQueueMute')[1]
  assert.deepEqual(mute.value['t-0018'], { mutedAt: '2026-10-13T00:00:00.000Z', ttlDays: 7 })
  const history = backup.tasks.find(t => t.id === 't-0023')
  assert.equal(history.startDate, '2026-09-20')
  assert.equal(history.updatedAt, '2026-10-13T00:00:00.000Z')
  assert.equal(history.progress, 20)
  const precheck = rpc('round02').find(r => line(r).startsWith('/pm restore-content '))
  const restore = rpc('round04').find(r => line(r).startsWith('/pm restore-content '))
  for (const [r, confirm] of [[precheck, false], [restore, true]]) {
    const suffix = confirm ? ' confirm' : ''
    assert.equal(line(r), `/pm restore-content ${JSON.stringify(read(`${pack}/original-history-backup.json`).toString())}${suffix}`)
    assert.equal(result(r).kind, 'success')
  }
  const restored = snapshot('round04')
  assert.equal(restored.projects.length, 6)
  assert.equal(restored.tasks.length, 23)
  assert.deepEqual(rpc('round06'), [])
  const rebind = rpc('round08').filter(r => line(r).startsWith('/pm session bind '))
  assert.deepEqual(rebind.map(line), [
    '/pm session bind t-0021 s-absent "待跟进"',
    '/pm session bind t-0022 absence-only',
  ])
  assert(rebind.every(r => result(r).kind === 'success'))
  const p4 = JSON.parse(result(rpc('round08').find(r => line(r) === '/pm queue list p-0004')).text)
  const p5 = JSON.parse(result(rpc('round08').find(r => line(r) === '/pm queue list p-0005')).text)
  assert.equal(p5.top, null)
  assert.equal(p5.rest.length, 1)
  assert.equal(p5.rest[0].taskId, 't-0022')
  assert.equal(p5.rest[0].absent, true)
  assert.equal(p4.rest.find(t => t.taskId === 't-0018').muted, false)
  assert.equal(p4.rest.find(t => t.taskId === 't-0021').absent, true)
  const update = rpc('round12').filter(r => line(r).startsWith('/pm task update '))
  assert.equal(update.length, 1)
  assert.equal(result(update[0]).kind, 'success')
  const after = snapshot('round12')
  assert(![after.queue['p-0004'].top, ...after.queue['p-0004'].rest].some(t => t?.taskId === 't-0021'))
  assert.equal(after.queue['p-0005'].rest[0].taskId, 't-0022')
  const phases = [
    'round05-restored-current', 'round06-before-session-rebind', 'round08-after-rebind',
    'round08-after-command-reads', 'round10-before-add-queue', 'round10-absence-queue-added',
    'round12-followup-before-save', 'round13-followup-current', 'round16-final',
  ]
  const phaseDiffs = phases.slice(1).map((to, i) => ({
    from: phases[i], to,
    changes: diff(evidence(`${phases[i]}-roots.json`), evidence(`${to}-roots.json`)),
  }))
  assert.equal(phaseDiffs[0].changes.length, 0)
  assert.equal(phaseDiffs[1].changes.length, 2)
  assert(phaseDiffs[1].changes.every(c => c.file.startsWith('data/pmtool/sessions/')))
  assert.equal(phaseDiffs[2].changes.length, 0)
  assert.equal(phaseDiffs[4].changes.length, 1)
  assert.equal(phaseDiffs[4].changes[0].file, 'data/pmtool/settings/dashboard_project_p-0005.json')
  assert.equal(phaseDiffs[6].changes.length, 1)
  assert.equal(phaseDiffs[6].changes[0].file, 'data/pmtool/tasks/t-0021.json')
  assert.equal(phaseDiffs[7].changes.length, 0)
  const beforeTask = raw('round12-followup-before-save', 'tasks/t-0021.json')
  const afterTask = raw('round13-followup-current', 'tasks/t-0021.json')
  const changedFields = diff(beforeTask.record, afterTask.record)
  assert.deepEqual(changedFields.map(c => c.file), ['description', 'manualProgress', 'updatedAt'])
  assert.equal(afterTask.record.manualProgress, null)
  const historicalRawBefore = raw('round05-restored-current', 'tasks/t-0023.json')
  const historicalRawAfter = raw('round16-final', 'tasks/t-0023.json')
  assert.deepEqual(historicalRawAfter, historicalRawBefore)
  const muteRawBefore = raw('round05-restored-current', 'settings/pmQueueMute.json')
  const muteRawAfter = raw('round16-final', 'settings/pmQueueMute.json')
  assert.deepEqual(muteRawAfter, muteRawBefore)
  const protectedBefore = evidence('protected-before.json')
  const protectedAfter = evidence('protected-after.json')
  const protectedDiffs = Object.keys(protectedBefore).map(label => ({
    label, beforeCount: Object.keys(protectedBefore[label]).length,
    afterCount: Object.keys(protectedAfter[label]).length,
    changes: diff(protectedBefore[label], protectedAfter[label]),
  }))
  assert.deepEqual(Object.keys(protectedAfter), Object.keys(protectedBefore))
  assert(protectedDiffs.every(r => r.changes.length === 0))
  const initialUI = evidence('round11-global-queue-expanded.json')
  const reloadedUI = evidence('round14-reloaded-expanded.json')
  assert.equal(initialUI.origin, 'http://127.0.0.1:3267')
  assert.equal(reloadedUI.origin, initialUI.origin)
  assert.notEqual(reloadedUI.timeOrigin, initialUI.timeOrigin)
  assert.equal(returnReceipt.origin, 'http://127.0.0.1:3264')
  assert.equal(returnReceipt.panel, true)
  const receipts = evidence('execution-receipts.json')
  const exitCodes = Object.fromEntries(Object.entries(receipts.receipts).map(([name, r]) => [name, r.status]))
  const frameCounts = {}
  for (const n of ['round02', 'round04', 'round06', 'round08', 'round09', 'round10', 'round11', 'round12', 'round13', 'round14', 'round15', 'round16']) {
    const events = evidence(`${n}-events.json`)
    frameCounts[n] = events.frames.length
    for (const f of events.frames) assert.equal(inputs[`${pack}/${f.file}`].sha256, f.sha256)
  }
  const audit = {
    at: new Date().toISOString(), reviewer: 'trae independent GUI evidence reviewer',
    environment: { os: process.platform, node: process.version, cwd: root, productExecution: 'NOT_RUN', guiExecution: 'NOT_RUN' },
    integrity: { indexCount: 2122, indexSha256: sourceSeal.indexSha256, mismatches, sourceSeal, completeCount: 521, sourceCopies: 12 },
    candidate, host, ready, fixture,
    restore: { precheckRpc: precheck.request.body.rpcId, confirmRpc: restore.request.body.rpcId, result: result(restore), projects: 6, tasks: 23 },
    sessions: { lines: rebind.map(line), phaseChanges: phaseDiffs[1] },
    queues: { p4, p5, afterFollowup: after.queue, rowsBefore: evidence('round11-queue-rows.json'), rowsRefreshed: evidence('round13-refreshed-rows.json'), rowsReloaded: evidence('round14-reloaded-rows.json') },
    followup: { rpcId: update[0].request.body.rpcId, line: line(update[0]), result: result(update[0]), before: beforeTask, after: afterTask, changedFields },
    history: { before: historicalRawBefore, after: historicalRawAfter, equal: true, mutePreserved: true, realDay: '2026-10-23', notFlat24: true, notFLMAX: true },
    phaseDiffs, protectedDiffs, exitCodes, bootstrap: receipts.bootstrap,
    retainedExecutionFailures: receipts.failures, frameCounts,
    browser: { origin: initialUI.origin, beforeTimeOrigin: initialUI.timeOrigin, reloadedTimeOrigin: reloadedUI.timeOrigin, viewport: initialUI.viewport, returnReceipt },
    inputs,
    limits: ['Opaque exported config hashes are not credential extraction', 'No runtime/freeze/profile dereference', 'Byte checks and DOM are not independent visual verdicts', 'Not combined-six-fix or parent commit gate'],
  }
  write('-audit.json', audit)
  console.log(JSON.stringify({
    indexCount: 2122, mismatches: 0, sourceCopies: 12, completeCount: 521,
    inputCount: Object.keys(inputs).length,
    phaseDiffs: phaseDiffs.map(p => ({ from: p.from, to: p.to, changes: p.changes.map(c => c.file) })),
    protectedDiffs, exitCodes,
  }, null, 2))
}

function seal() {
  const audit = json(prefix + '-audit.json')
  const drift = []
  for (const [p, expected] of Object.entries(audit.inputs)) {
    read(p)
    if (!equal(inputs[p], expected)) drift.push(p)
  }
  assert.deepEqual(drift, [])
  const outputs = {}
  for (const suffix of ['.md', '-audit.mjs', '-audit.json', '-verdict.json']) {
    const p = prefix + suffix
    read(p)
    outputs[p] = inputs[p]
  }
  const verdict = json(prefix + '-verdict.json')
  assert.equal(verdict.parentCommitPass, false)
  assert.equal(verdict.combinedSixFixPass, false)
  write('-seal.json', {
    at: new Date().toISOString(), reviewer: 'trae independent GUI evidence reviewer',
    inputCount: Object.keys(audit.inputs).length, drift, outputs,
    originalEvidenceCount: audit.integrity.indexCount,
    originalIndexSha256: audit.integrity.indexSha256,
    decision: verdict.decision, parentCommitPass: false, combinedSixFixPass: false,
    stopped: true, writes: 'Only new files under the authorized review prefix',
  })
  console.log(JSON.stringify({ drift: 0, sealedOutputs: Object.keys(outputs).length, stopped: true }))
}

assert(['capture', 'seal'].includes(process.argv[2]), 'Expected capture or seal')
if (process.argv[2] === 'capture') capture()
else seal()
