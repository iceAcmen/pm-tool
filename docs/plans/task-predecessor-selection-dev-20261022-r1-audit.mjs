import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Developer checks of raw evidence, not an independent PASS decision.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const root = join(repo, 'reports/all-pending-evidence-20261021/TaskPredSelectionDevR1')
const own = join(root, 'r1')
const output = join(root, 'audit-r1.json')
const sha = data => createHash('sha256').update(data).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const digest = value => sha(JSON.stringify(value))
assert(!existsSync(output), 'Do not overwrite audit evidence')
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
assert.deepEqual(close.executions.map(entry => entry.exit), [1, 0, 0, 0])
const original = json(join(own, 'original-seven/summary.json'))
assert.deepEqual([original.files, original.tests, original.green, original.failed, original.pending], [1, 7, 6, 1, 0])
assert.equal(original.cases.find(item => item.name.includes('C02 ')).status, 'failed')
const targetCases = original.cases.filter(item => /\bN0[1-4] /.test(item.name))
assert.equal(targetCases.length, 4)
assert(targetCases.every(item => item.status === 'passed'))
const checkboxObservations = readdirSync(join(own, 'original-seven/observations')).sort().map(name => {
  const value = json(join(own, 'original-seven/observations', name, 'observations.json'))
  assert.deepEqual(value.caught, [], name)
  assert.deepEqual(value.calls, [], name)
  const fixtureHashes = value.events.filter(item => item.recordsSha256).map(item => item.recordsSha256)
  assert(fixtureHashes.every(hash => hash === value.finalRecordsSha256), name)
  return { name, caught: value.caught, calls: value.calls,
    afterClicks: value.events.filter(item => item.label?.startsWith('after-click-')).map(item => item.label) }
})
assert.equal(checkboxObservations.find(item => item.name.endsWith('-N03')).afterClicks.length, 4)
assert.equal(checkboxObservations.find(item => item.name.endsWith('-N04')).afterClicks.length, 3)
const submit = json(join(own, 'real-submit-five/summary.json'))
assert.deepEqual([submit.files, submit.tests, submit.green, submit.failed, submit.pending], [1, 5, 5, 0, 0])
const submitObservations = readdirSync(join(own, 'real-submit-five/observations')).sort().map(name => {
  const value = json(join(own, 'real-submit-five/observations', name, 'observations.json'))
  assert.equal(value.submitted, 1, name)
  assert.equal(value.initial.fixtureSha256, value.finalFixtureSha256, name)
  assert.equal(digest(value.records), value.initial.fixtureSha256, name)
  assert.deepEqual(value.caught, [], name)
  assert.deepEqual(value.calls.map(item => item.kind), ['run', 'handler-result', 'onSaved'], name)
  const run = value.calls[0]
  assert.deepEqual(run.payload.predecessorIds, ['t-0002'], name)
  assert.equal(value.calls[1].response.kind, 'success', name)
  const writes = value.writes.slice(value.initial.writes)
  assert.deepEqual(writes.map(item => [item.table, item.id]), [['tasks', 't-0004']], name)
  assert.deepEqual(writes[0].before.predecessorIds, ['t-0002'], name)
  assert.deepEqual(writes[0].after.predecessorIds, ['t-0002'], name)
  const after = value.events.find(item => item.label === 'after-primary-save-handler-complete')
  assert.deepEqual(after.taskReadback.predecessorIds, ['t-0002'], name)
  assert(after.formPresent, name)
  return { name, beforeFormData: value.beforeSubmit.formDataPredecessors,
    footer: value.beforeSubmit.footer, payload: run.payload.predecessorIds,
    coreReadback: after.taskReadback.predecessorIds, putCount: writes.length,
    submitted: value.submitted, callbacks: value.calls.map(item => item.kind), caught: value.caught }
})
const affected = json(join(own, 'affected/summary.json'))
const material = json(join(own, 'material-refs-dom/summary.json'))
assert.deepEqual([affected.files, affected.tests, affected.green, affected.failed, affected.pending], [18, 182, 182, 0, 0])
assert.deepEqual([material.files, material.tests, material.green, material.failed, material.pending], [1, 5, 5, 0, 0])
const candidate = json(join(own, 'candidate.json'))
const mainPanelSha256 = sha(readFileSync(join(repo, 'packages/dsh-pm-tool/src/client/panel.tsx')))
const result = {
  role: 'developer-evidence-audit-not-independent', node: process.version, at: new Date().toISOString(),
  sealedEntriesRechecked: Object.keys(sealed).length, sealsUnchanged: true,
  candidatePanelSha256: candidate.panelSha256, mainPanelSha256,
  mainPanelMatchesAtAudit: mainPanelSha256 === candidate.panelSha256,
  sourceInputs: candidate.sourceInputCount, packageInputs: candidate.packageInputCount,
  originalSeven: { green: original.green, failed: original.failed, exit: original.exit },
  targetFour: targetCases, checkboxObservations, submitObservations,
  affected: { files: affected.files, tests: affected.tests, exit: affected.exit },
  material: { files: material.files, tests: material.tests, exit: material.exit },
  protectedUnchanged: close.allProtectedUnchanged,
  release: 'RELEASE_STOP', acceptance: 'NOT_SIGNED',
  boundary: 'Five real TaskForm submissions use original handler/core in memory, not JSON persistence or GUI; C02 stays RED for independent contract adjudication',
}
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify(result, null, 2))
