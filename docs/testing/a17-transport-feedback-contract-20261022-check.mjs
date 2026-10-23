import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const prefix = 'a17-transport-feedback-contract-20261022'
const base = join(here, `${prefix}-selftmp`)
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const r1 = join(base, 'r1'), r2 = join(base, 'r2')
const a = read(join(r1, 'frozen-inputs.json')), b = read(join(r2, 'frozen-inputs.json'))
const bytes = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
for (const key of Object.keys(a)) assert.deepEqual(bytes(a[key]), bytes(b[key]))
const t1 = readFileSync(join(r1, 'frozen/docs/testing', `${prefix}-cases.test.tsx`), 'utf8')
const t2 = readFileSync(join(r2, 'frozen/docs/testing', `${prefix}-cases.test.tsx`), 'utf8')
const before = "  const message = `${buildSuccessEnvelope([`任务｜t-0001｜${title}`], detail)}\\n${buildActionLine('查看记录', 'task list p-0001')}`"
const after = "  const message = `${buildActionLine('查看记录', 'task list p-0001')}\\n${buildSuccessEnvelope([`任务｜t-0001｜${title}`], detail)}`"
assert.equal(t1.split(before).length, 2)
assert.equal(t1.replace(before, after), t2, 'only success fixture action position correction')
const necessary = t => t.slice(t.indexOf("it.each(failures)('TF-F01"), t.indexOf("it.each(['csv', 'xlsx'])('TF-C04"))
assert.equal(necessary(t1), necessary(t2))
const rounds = {}
for (const [round, root] of [['r1', r1], ['r2', r2]]) {
  const summary = read(join(root, 'summary.json'))
  assert(Object.values(summary.drift).every(v => v.length === 0))
  assert(Object.values(summary.frozenDrift).every(v => v.length === 0))
  rounds[round] = {}
  for (const c of summary.results) {
    const report = read(join(root, `${c.id}.result.json`))
    assert.equal(report.numPendingTests, c.pending)
    assert.equal(report.numFailedTests, c.failed)
    assert.equal(report.numPassedTests, c.passed)
    assert.equal(c.signal, null)
    assert.equal(c.error, null)
    const expected = {
      'success-control': round === 'r1' ? [1, 2, 3] : [0, 5, 0],
      'explicit-context-control': [0, 5, 0], 'necessary-red': [1, 0, 5],
      'recovery-control': [0, 2, 0], 'existing-regression': [0, 65, 0],
    }[c.id]
    assert.deepEqual([c.originalExit, c.passed, c.failed], expected)
    if (c.id === 'necessary-red') {
      const assertions = report.testResults.flatMap(t => t.assertionResults).filter(t => t.status === 'failed')
      assert.equal(assertions.length, 5)
      for (const t of assertions)
        assert(t.failureMessages.every(m => m.startsWith("AssertionError: expected 'status' to be 'alert'")))
      const notes = readFileSync(join(root, 'necessary-red.observations.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
      assert.equal(notes.length, 5)
      for (const n of notes) {
        assert.equal(n.accepted, false)
        assert.equal(n.duplicate, false)
        assert.equal(n.tableDisabled, false)
        assert.deepEqual(n.calls, ['web snapshot', 'task update t-0001 {}'])
        assert.deepEqual([n.card.role, n.card.live, n.card.check, n.card.triangle], ['status', 'polite', 1, 0])
        assert.equal(n.message, n.raw)
      }
    }
    rounds[round][c.id] = {
      originalExit: c.originalExit, passed: c.passed, failed: c.failed, filteredPending: c.pending,
      argv: c.argv, reporterSha256: sha(join(root, `${c.id}.result.json`)),
      stdoutSha256: sha(join(root, `${c.id}.stdout.log`)), stderrSha256: sha(join(root, `${c.id}.stderr.log`)),
    }
  }
}
const result = {
  at: new Date().toISOString(), rounds, completeCurrentInputsSameBothRounds: true,
  originalRedAndFirstControlFailuresPreserved: true, allNecessaryRedExpectationsUnchanged: true,
  onlySuccessFixtureActionPositionChanged: { before, after },
  r1CasesSha256: sha(join(r1, 'frozen/docs/testing', `${prefix}-cases.test.tsx`)),
  r2CasesSha256: sha(join(r2, 'frozen/docs/testing', `${prefix}-cases.test.tsx`)),
  necessaryRedFailureOnlyStatusInsteadOfAlert: true, noProductRepairExecuted: true,
  conclusion: '有限控制 SOURCE/AUTO PASS；当前产品 TF-F01 五红 FAIL；不签新 GUI/发布/commit',
}
writeFileSync(join(base, 'review.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ completeInputsSame: true, redUnchanged: true, controlPass: 12, regressionPass: 65, productFail: 5 }))
