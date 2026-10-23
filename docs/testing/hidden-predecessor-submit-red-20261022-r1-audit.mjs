import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const own = join(repo, 'reports/all-pending-evidence-20261021/HiddenPredRedR1/r1')
const sha = value => createHash('sha256').update(value).digest('hex')
const load = name => JSON.parse(readFileSync(join(own, name), 'utf8'))
const sealed = load('sealed-evidence.json')
for (const [name, entry] of Object.entries(sealed)) {
  const path = join(own, name)
  if (entry.link) {
    assert(lstatSync(path).isSymbolicLink())
    assert.equal(readlinkSync(path), entry.link)
  } else {
    const data = readFileSync(path)
    assert.equal(data.length, entry.bytes, name)
    assert.equal(sha(data), entry.sha256, name)
  }
}
const close = load('close.json'), result = load('vitest.result.json')
assert.equal(close.allProtectedUnchanged, true)
assert.equal(close.childExited, true)
assert.equal(close.facilityError, null)
assert.equal(close.execution.exit, 1)
assert.equal(result.numTotalTests, 5)
assert.equal(result.numPassedTests, 3)
assert.equal(result.numFailedTests, 2)
assert.equal(result.numPendingTests, 0)
const assertions = result.testResults.flatMap(file => file.assertionResults)
const cases = []
for (const name of readdirSync(join(own, 'observations')).sort()) {
  const path = `observations/${name}/observations.json`
  const record = load(path), id = name.slice(name.indexOf('-') + 1)
  const assertion = assertions.find(item => item.title.startsWith(`${id} `))
  assert(assertion, id)
  const after = record.events.find(event => event.label === 'after-primary-save-handler-complete')
  assert(after, '必须到达生产submit与handler，不是FormData提前红')
  assert.deepEqual(record.initial.records[3].predecessorIds, ['t-0002'])
  assert.equal(record.submitted, 1)
  assert.deepEqual(record.calls.map(call => call.kind), ['run', 'handler-result', 'onSaved'])
  assert.equal(record.calls[0].taskId, 't-0004')
  assert.equal(record.calls[1].response.kind, 'success')
  assert.equal(record.beforeSubmit.footer, '已选 1 项')
  assert.equal(record.initial.fixtureSha256, record.finalFixtureSha256)
  assert.equal(record.beforeSubmit.domainSha256, sha(JSON.stringify(record.initial.snapshot)))
  assert.deepEqual(record.beforeSubmit.calls, [])
  assert.equal(record.beforeSubmit.submitted, 0)
  assert.deepEqual(record.caught, [])
  const runtimeErrors = record.events.filter(event => event.label === 'window.error' ||
    event.label?.startsWith('console.'))
  assert.deepEqual(runtimeErrors, [])
  const writeDelta = record.writes.slice(record.initial.writes)
  assert.deepEqual(writeDelta.map(write => [write.table, write.id]), [['tasks', 't-0004']])
  assert.deepEqual(writeDelta[0].before.predecessorIds, ['t-0002'])
  const necessaryRed = id.startsWith('HPS-N')
  const expectedActual = necessaryRed ? [] : ['t-0002']
  assert.equal(assertion.status, necessaryRed ? 'failed' : 'passed')
  assert.deepEqual(record.calls[0].payload.predecessorIds, expectedActual)
  assert.deepEqual(record.beforeSubmit.formDataPredecessors, expectedActual)
  assert.deepEqual(after.taskReadback.predecessorIds ?? [], expectedActual)
  assert.deepEqual(writeDelta[0].after.predecessorIds ?? [], expectedActual)
  if (necessaryRed) {
    assert.equal(assertion.failureMessages.length, 2, '必须保 payload 与真实core回读两条失败')
    assert(assertion.failureMessages.some(message => message.includes('保存 payload')))
    assert(assertion.failureMessages.some(message => message.includes('内存回读')))
  }
  cases.push({
    id, status: assertion.status, independentResult: necessaryRed ? 'FAIL_NECESSARY_RED' : 'CONTROL_PASS',
    raw: path, sha256: sha(readFileSync(join(own, path))),
    initialPredecessorIds: record.initial.records[3].predecessorIds,
    visibleCheckboxes: record.beforeSubmit.checkboxes, formDataPredecessors: record.beforeSubmit.formDataPredecessors,
    footer: record.beforeSubmit.footer, submitted: record.submitted,
    run: record.calls[0], handlerResult: record.calls[1], onSaved: record.calls[2],
    readback: after.taskReadback, writeDelta,
    fixtureUnchanged: true, preSubmitDomainUnchanged: true,
    runtimeErrors, caught: record.caught, failureMessages: assertion.failureMessages,
  })
}
const output = {
  at: new Date().toISOString(), role: 'HiddenPredRedR1，独立原源测试，非开发非GUI',
  evidenceRoot: own, sealedFilesRechecked: Object.keys(sealed).length,
  evidenceConsistent: true, auditExitMeaning: 'exit0只表示原件完整且必要红归因一致，不是产品PASS',
  originalPanelSha256: load('virtual-adapter.json').sourceSha256,
  test: load('test-binding.json'), execution: close.execution,
  total: 5, controlPassed: 3, necessaryRed: 2, skipped: 0, cases,
  protectedUnchanged: close.allProtectedUnchanged,
  boundary: '真实TaskForm submit/run命令/handler/core内存领域清除确证；JSON落盘、重启、宿主run全链、GUI与正式业务损失未测试',
  release: 'RELEASE_STOP', nextOwner: 'Main统一panel最小修TPC01+TPC02，另一专家复验；本角色STOP',
}
writeFileSync(join(repo, 'docs/testing/hidden-predecessor-submit-red-20261022-r1-audit.json'),
  JSON.stringify(output, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ total: 5, controlPassed: 3, necessaryRed: 2,
  sealedFilesRechecked: output.sealedFilesRechecked, evidenceConsistent: true, release: 'RELEASE_STOP' }))
