import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const prefix = 'material-progress-ref-crash-20261022-r1'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const root = join(directory, `${prefix}-selftmp`, round)
const read = name => JSON.parse(readFileSync(join(root, name), 'utf8'))
const digest = name => createHash('sha256').update(readFileSync(join(root, name))).digest('hex')
const result = read('vitest.result.json')
assert.equal(result.numTotalTests, 7)
assert.equal(result.numPassedTests, 3)
assert.equal(result.numFailedTests, 4)
const command = read('vitest.command.json')
assert.equal(command.exit, 1)
assert(command.argv.includes('--no-cache'))
const statuses = result.testResults.flatMap(t => t.assertionResults).map(t =>
  ({ name: t.fullName, status: t.status, failureMessages: t.failureMessages }))
for (const id of ['C01', 'C02', 'C03']) {
  assert.equal(statuses.find(t => t.name.includes(`${id} `)).status, 'passed')
}
const cases = Object.fromEntries(readdirSync(join(root, 'observations')).map(name =>
  [name.split('-')[1], read(`observations/${name}/observations.json`)]))
const summary = {}
for (const id of ['N01', 'N03', 'N04']) {
  const c = cases[id]
  assert.equal(c.caught.length, 1)
  assert.equal(c.caught[0].message, "Cannot read properties of null (reading 'checked')")
  assert(c.caught[0].stack.includes('task-draft-materials.tsx:431:69'))
  assert(c.caught[0].stack.includes('basicStateReducer'))
  const before = c.events.find(e => e.label.startsWith('before-click'))
  const after = c.events.find(e => e.label.startsWith('after-click'))
  assert.equal(before.shell, true)
  assert.equal(after.shell, false)
  assert.deepEqual(before.data, after.data)
  assert.deepEqual(before.tables, after.tables)
  assert.equal(c.saveCount, 0)
  if (id !== 'N01') {
    assert.equal(before.refs.length, 3)
    assert.equal(Object.keys(before.files).length, 2)
    assert.deepEqual(after.files, {})
    const deleteCalls = c.calls.filter(v => v.method === 'DELETE')
    assert.equal(deleteCalls.length, 1)
    assert.deepEqual(deleteCalls[0].response, { ok: true, removed: true })
  }
  summary[id] = { conclusion: 'FAIL_NECESSARY_RED_CURRENTTARGET', actualClick: before.label,
    beforeRefs: before.refs, shellAfter: after.shell, unchangedDomainAndData: true,
    mainSave: 'NOT_REACHED', stageCleanup: id === 'N01' ? 'NO_FILE' : 'DELETE_200_REMOVED_TRUE',
    error: c.caught[0] }
}
const links = cases.N02.events.find(e => e.label === 'before-test-cleanup')
assert.equal(links.shell, true)
assert.deepEqual(links.refs, [])
assert.equal(links.published.at(-1).envelope.draft.attachmentOps.length, 2)
assert.deepEqual(links.published.at(-1).errors, [])
assert.deepEqual(cases.N02.caught, [])
summary.N02 = { conclusion: 'FAIL_NECESSARY_RED_MISSING_REF_OPTIONS', actualClick: 'NOT_REACHED_NO_CHECKBOX',
  refs: links.refs, attachmentOps: links.published.at(-1).envelope.draft.attachmentOps,
  shellAfter: true, mainSave: 'NOT_REACHED', notClassifiedAsClickCrash: true }
const lifecycle = cases.C01.events.find(e => e.label === 'real-synthetic-event-lifecycle')
assert.deepEqual(lifecycle.afterDispatch, [null, null])
assert.deepEqual(lifecycle.nativeTypes, ['click', 'click'])
const planned = cases.C02.events.find(e => e.label === 'production-OpsSession-control')
assert.deepEqual(planned.envelope.draft.progressOps[0].refs, ['c-2', 'c-3'])
assert.equal(cases.C03.saveCount, 1)
assert.deepEqual(cases.C03.caught, [])
assert.equal(cases.C03.calls.filter(v => v.method === 'DELETE').length, 0)
const saved = cases.C03.events.find(e => e.label === 'single-main-save')
assert.equal(saved.tables.tasks.length, 1)
assert.equal(saved.tables.file_assets.length, 1)
const close = read('close.json')
assert.equal(close.childExited, true)
assert.equal(close.allProtectedUnchanged, true)
assert.deepEqual(close.mainRelatedDelta, { added: [], removed: [], changed: [] })
assert.equal(digest('frozen/packages/dsh-pm-tool/' + prefix + '-cases.test.tsx'),
  read('test-original.json').sha256)
assert.equal(createHash('sha256').update(readFileSync(join(directory, prefix + '-cases.test.tsx'))).digest('hex'),
  read('test-original.json').sha256)
const output = { scope: 'SOURCE/AUTO必要红；非GUI/修后/整项PASS', rawVitestExit: command.exit,
  controls: { count: 3, lifecycle, productionSessionPlannedRefs: ['c-2', 'c-3'],
    noRefsComponentMainSaveCount: cases.C03.saveCount }, necessaryRed: summary, statuses,
  protectedUnchanged: true, testOriginalAndFrozenUnchanged: true,
  candidate: read('candidate.json'), rawHashes: Object.fromEntries([
    'vitest.result.json', 'vitest.command.json', 'vitest.stdout.txt', 'vitest.stderr.txt', 'close.json',
    ...readdirSync(join(root, 'observations')).map(n => `observations/${n}/observations.json`),
  ].map(n => [n, digest(n)])) }
writeFileSync(join(directory, `${prefix}-audit-${round}.json`), JSON.stringify(output, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ controlsPassed: 3, necessaryRed: 4, summary, protection: 'UNCHANGED',
  rawExit: 1, auditExit: 0 }, null, 2))
