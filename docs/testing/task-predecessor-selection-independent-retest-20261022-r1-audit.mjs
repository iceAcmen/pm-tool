import assert from 'node:assert/strict'
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adaptC02, originalTestSha, sha } from './task-predecessor-selection-independent-retest-20261022-r1-adapter.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const root = join(repo, 'reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1')
const own = join(root, 'r1')
const output = join(root, 'audit-r1.json')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const digest = value => sha(JSON.stringify(value))
assert(!existsSync(output), 'Never overwrite an audit')
const sealed = json(join(own, 'sealed-evidence.json'))
for (const [name, entry] of Object.entries(sealed)) {
  const path = join(own, name)
  const stat = lstatSync(path)
  if (entry.link) {
    assert(stat.isSymbolicLink(), name)
    assert.equal(readlinkSync(path), entry.link, name)
  } else {
    const data = readFileSync(path)
    assert.equal(data.length, entry.bytes, name)
    assert.equal(sha(data), entry.sha256, name)
  }
}
const close = json(join(own, 'close.json'))
assert.equal(close.facilityError, null)
assert.equal(close.allProtectedUnchanged, true)
assert.equal(close.childExited, true)
assert.deepEqual(close.executions.map(item => item.exit), [1, 0, 0, 0, 0])
for (const item of close.executions) {
  assert.equal(item.signal, null)
  assert.equal(item.error, null)
}
const summaries = {}
for (const [name, counts] of [
  ['original-seven', [1, 7, 6, 1, 0]], ['adapted-seven', [1, 7, 7, 0, 0]],
  ['real-submit-five', [1, 5, 5, 0, 0]], ['affected', [18, 182, 182, 0, 0]],
  ['material-refs-dom', [1, 5, 5, 0, 0]],
]) {
  const summary = json(join(own, name, 'summary.json'))
  assert.deepEqual([summary.files, summary.tests, summary.green, summary.failed, summary.pending], counts)
  const rawReport = json(join(own, name, 'vitest.result.json'))
  assert.equal(rawReport.success, name !== 'original-seven')
  assert.equal(rawReport.numTodoTests, 0)
  // Vitest 2 JSON has no runtime-error count. Check the retained text, not an invented zero.
  const text = readFileSync(join(own, name, 'vitest.stdout.txt'), 'utf8') +
    readFileSync(join(own, name, 'vitest.stderr.txt'), 'utf8')
  assert(!/Unhandled Errors|Unhandled Rejection|Uncaught Exception/.test(text), name)
  summaries[name] = summary
}
assert.equal(summaries['original-seven'].cases.find(c => c.name.includes('C02 ')).status, 'failed')
assert(summaries['original-seven'].cases.filter(c => !c.name.includes('C02 ')).every(c => c.status === 'passed'))
const observations = name => readdirSync(join(own, name, 'observations')).sort().map(caseName =>
  ({ name: caseName, ...json(join(own, name, 'observations', caseName, 'observations.json')) }))
const raw = observations('original-seven')
const adapted = observations('adapted-seven')
for (const obs of [...raw, ...adapted]) {
  assert.deepEqual(obs.caught, [], obs.name)
  assert(obs.events.filter(e => e.recordsSha256).every(e => e.recordsSha256 === obs.finalRecordsSha256), obs.name)
  assert(!obs.events.some(e => ['console.error', 'console.warn', 'window.error'].includes(e.label)), obs.name)
  if (obs.name.endsWith('-C02') && adapted.includes(obs)) continue
  assert.deepEqual(obs.calls, [], obs.name)
}
const fourTargets = []
for (const name of ['N01', 'N02', 'N03', 'N04']) {
  const original = raw.find(obs => obs.name.endsWith(`-${name}`))
  const current = adapted.find(obs => obs.name.endsWith(`-${name}`))
  const clicks = obs => obs.events.filter(e => e.label?.startsWith('after-click-'))
  assert.equal(clicks(original).length, { N01: 1, N02: 1, N03: 4, N04: 3 }[name])
  assert.deepEqual(clicks(original).map(e => [e.label, e.selected, e.footer]),
    clicks(current).map(e => [e.label, e.selected, e.footer]))
  assert(clicks(current).every(e => e.formPresent))
  fourTargets.push({ name, clicks: clicks(current).map(e => ({
    label: e.label, selected: e.selected, footer: e.footer, formPresent: e.formPresent,
  })), calls: current.calls, caught: current.caught })
}
const rawC02 = raw.find(obs => obs.name.endsWith('-C02'))
assert.deepEqual(rawC02.calls, [])
const oldHidden = rawC02.events.find(e => e.label === 'after-input-候选任务1')
assert.deepEqual(oldHidden.selected, [])
assert.equal(oldHidden.footer, '已选 1 项')
assert(!rawC02.events.some(e => e.label === 'after-input-'), 'Original restore NOT_REACHED')
const correctedC02 = adapted.find(obs => obs.name.endsWith('-C02'))
const hidden = correctedC02.events.find(e => e.label === 'C02-adapted-hidden-before-restore')
assert.deepEqual(hidden.selected, [])
assert.equal(hidden.footer, '已选 1 项')
assert.deepEqual(hidden.calls, [])
const cancel = correctedC02.events.find(e => e.label === 'C02-adapted-clean-cancel-complete')
assert.deepEqual(cancel.calls, [{ kind: 'onCancel' }])
assert.deepEqual(cancel.selected, ['t-0002'])
const mapping = correctedC02.events.find(e => e.label === 'C02-adapted-real-payload-mapping')
assert.equal(mapping.submitCount, 1)
assert.deepEqual(mapping.beforeFormData, [])
assert.deepEqual(mapping.payload.predecessorIds, ['t-0002'])
assert.deepEqual(correctedC02.calls.map(c => c.kind), ['run'])
const submitObservations = observations('real-submit-five').map(obs => {
  assert.equal(obs.submitted, 1)
  assert.equal(obs.initial.fixtureSha256, obs.finalFixtureSha256)
  assert.equal(digest(obs.records), obs.initial.fixtureSha256)
  assert.deepEqual(obs.caught, [])
  assert(!obs.events.some(e => ['console.error', 'console.warn', 'window.error'].includes(e.label)))
  assert.deepEqual(obs.calls.map(c => c.kind), ['run', 'handler-result', 'onSaved'])
  assert.deepEqual(obs.calls[0].payload.predecessorIds, ['t-0002'])
  assert.equal(obs.calls[1].response.kind, 'success')
  const writes = obs.writes.slice(obs.initial.writes)
  assert.deepEqual(writes.map(w => [w.table, w.id]), [['tasks', 't-0004']])
  assert.deepEqual(writes[0].before.predecessorIds, ['t-0002'])
  assert.deepEqual(writes[0].after.predecessorIds, ['t-0002'])
  const after = obs.events.find(e => e.label === 'after-primary-save-handler-complete')
  assert.deepEqual(after.taskReadback.predecessorIds, ['t-0002'])
  assert(after.formPresent)
  return { name: obs.name, beforeFormData: obs.beforeSubmit.formDataPredecessors,
    footer: obs.beforeSubmit.footer, payload: obs.calls[0].payload.predecessorIds,
    coreReadback: after.taskReadback.predecessorIds, putCount: writes.length,
    submitted: obs.submitted, callbacks: obs.calls.map(c => c.kind) }
})
const source = join(own, 'frozen/packages/dsh-pm-tool/src/client/task-predecessor-refs-dom.test.tsx')
const original = readFileSync(source, 'utf8')
assert.equal(sha(original), originalTestSha)
assert.equal(readFileSync(join(own, 'C02-adapted-seven.test.tsx'), 'utf8'), adaptC02(original).adapted)
const stderr = Object.fromEntries(Object.keys(summaries).map(name => [
  name, readFileSync(join(own, name, 'vitest.stderr.txt'), 'utf8'),
]))
for (const name of ['adapted-seven', 'real-submit-five', 'material-refs-dom'])
  assert.equal(stderr[name], '', `${name} zero stderr`)
assert(!/\bUnhandled\b/.test(stderr.affected))
const result = {
  role: 'TaskPredSelectionRetestR1 / independent SOURCE-AUTO',
  at: new Date().toISOString(), node: process.version,
  sealedEntriesRechecked: Object.keys(sealed).length, sealedUnchanged: true,
  candidate: json(join(own, 'candidate.json')),
  executions: close.executions.map(({ name, pid, runnerPid, exit, signal, error }) =>
    ({ name, pid, runnerPid, exit, signal, error })),
  summaries: Object.fromEntries(Object.entries(summaries).map(([name, summary]) => [name, {
    files: summary.files, tests: summary.tests, green: summary.green,
    failed: summary.failed, pending: summary.pending, exit: summary.exit,
  }])),
  fourTargets, submitObservations,
  C02: {
    rawOriginalStatus: 'FAIL retained, restore/cancel NOT_REACHED',
    originalHiddenFormData: oldHidden.selected, footer: oldHidden.footer,
    independentCancelPhase: { restoredFormData: cancel.selected, calls: cancel.calls },
    separateActualSubmitMapping: mapping,
    disposition: 'Bare hidden FormData completeness is old oracle artifact, not an additional production contract; original raw failure not waived or recolored',
  },
  stderrBytes: Object.fromEntries(Object.entries(stderr).map(([name, text]) => [name, Buffer.byteLength(text)])),
  affectedWarnings: stderr.affected,
  allProtectedUnchanged: close.allProtectedUnchanged,
  mainSourceObservation: json(join(own, 'main-vs-frozen-source-observation.json')),
  release: 'RELEASE_STOP', gui: 'NOT_RUN / Main successor',
  boundary: 'This audit verifies raw evidence; scoped SOURCE/AUTO adjudication and warning scope are recorded in the independent report, not parent release/commit',
}
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({
  sealedEntries: result.sealedEntriesRechecked, summaries: result.summaries,
  allProtectedUnchanged: result.allProtectedUnchanged, C02: result.C02.disposition,
  release: result.release,
}, null, 2))
