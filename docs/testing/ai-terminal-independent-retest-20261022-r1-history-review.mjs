import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'ai-terminal-independent-retest-20261022-r1'
const out = join(repo, 'docs/testing', `${prefix}-evidence`)
const dev = join(repo, 'reports/all-pending-evidence-20261021/AiTerminalDevR1')
const original = join(repo, 'docs/testing/ai-terminal-failure-20261022-selftmp/r2')
const sha = b => createHash('sha256').update(b).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const jobs = [
  ['red', 'controls', 0, 8, 0], ['red', 'original-red', 1, 0, 10],
  ['testred', 'new', 1, 3, 40], ['repaired', 'new', 1, 42, 1],
  ...['repaired-r2', 'repaired-r3'].flatMap(r => [
    [r, 'controls', 0, 8, 0], [r, 'original-red', 0, 10, 0], [r, 'new', 0, 43, 0],
    [r, 'affected', 0, 175, 0], [r, 'legacy-source', 0, null, null], [r, 'noemit', 0, null, null],
  ]),
]
const records = jobs.map(([round, suite, exit, passed, failed]) => {
  const root = join(dev, round)
  const command = json(join(root, `${suite}.command.json`))
  const summary = json(join(root, `${suite}.summary.json`))
  assert.equal(command.originalExit, exit)
  assert.equal(command.signal, null)
  assert.equal(summary.originalExit, exit)
  assert.equal(summary.passed, passed)
  assert.equal(summary.failed, failed)
  const resultPath = join(root, `${suite}.result.json`)
  const result = existsSync(resultPath) ? json(resultPath) : null
  if (result) {
    assert.equal(result.numPassedTests, passed)
    assert.equal(result.numFailedTests, failed)
    const assertions = result.testResults.flatMap(s => s.assertionResults)
    assert.equal(assertions.filter(a => a.status === 'failed').length, failed)
    assert.equal(assertions.filter(a => a.status === 'passed').length, passed)
  }
  return { round, suite, originalExit: command.originalExit, passed, failed, pid: command.pid,
    start: command.start, end: command.end,
    commandSha256: sha(readFileSync(join(root, `${suite}.command.json`))),
    stdoutSha256: sha(readFileSync(join(root, `${suite}.stdout.log`))),
    stderrSha256: sha(readFileSync(join(root, `${suite}.stderr.log`))),
    resultSha256: result ? sha(readFileSync(resultPath)) : null,
    pending: result?.numPendingTests ?? null,
    failures: result?.testResults.flatMap(s => s.assertionResults).filter(a => a.status === 'failed')
      .map(a => ({ fullName: a.fullName, failureMessages: a.failureMessages })) ?? [],
    independentRerun: false, source: 'Preserved development raw artifacts, not independent PASS.' }
})
const devProtected = json(join(dev, 'red/protected-before.json'))
const independentProtected = json(join(out, 'protected-before.json'))
const historicalProtectedDrift = Object.keys(devProtected).filter(p =>
  JSON.stringify(devProtected[p]) !== JSON.stringify(independentProtected[p]))
assert.deepEqual(historicalProtectedDrift, [])
const oldControls = json(join(original, 'controls.command.json'))
const oldRed = json(join(original, 'red.command.json'))
assert.equal(oldControls.originalExit, 0)
assert.equal(oldRed.originalExit, 1)
assert.equal(json(join(original, 'controls.result.json')).numPassedTests, 8)
assert.equal(json(join(original, 'red.result.json')).numFailedTests, 10)
const oldClose = json(join(original, 'close.json'))
assert(oldClose.released && oldClose.verdict === 'FAIL_NECESSARY_RED')
const followup = json(join(dev, 'facility-followup.json'))
assert.equal(followup.roots.length, 13)
assert.equal(followup.originalExit, 0)
assert.equal(followup.deleted, false)
const outsideObservations = followup.roots.map(r => {
  const p = join(r.path, 'observations.json'), b = readFileSync(p)
  assert.equal(b.length, r.observationsBytes)
  assert.equal(sha(b), r.observationsSha256)
  return { path: p, bytes: b.length, sha256: sha(b), unchangedAgainstFollowup: true }
})
const oldTest = readFileSync(join(dev, 'repaired/frozen/packages/dsh-pm-tool/src/core/ai-client-terminal.test.ts'), 'utf8')
const finalTest = readFileSync(join(dev, 'repaired-r3/frozen/packages/dsh-pm-tool/src/core/ai-client-terminal.test.ts'), 'utf8')
const fixtureFailure = records.find(r => r.round === 'repaired' && r.suite === 'new').failures
assert.equal(fixtureFailure.length, 1)
const fixtureStderr = readFileSync(join(dev, 'repaired/new.stderr.log'), 'utf8')
const fixturePlainStderr = stripVTControlCharacters(fixtureStderr)
assert(fixturePlainStderr.includes('"id"'))
assert(fixturePlainStderr.includes('expect(r.adapter.prompts[1]).toEqual(r.adapter.prompts[0])'))
assert(oldTest.includes('expect(r.adapter.prompts[1]).toEqual(r.adapter.prompts[0])'))
assert(finalTest.includes('for (const prompt of r.adapter.prompts)'))
assert(finalTest.includes('expect(prompt.system).toBe(options.system)'))
assert(finalTest.includes("role: 'user', source: { kind: 'user' }"))
assert(finalTest.includes("content: [{ type: 'text', text: options.user }]"))
assert(finalTest.includes('expect(timeout.mock.calls).toEqual([[120000], [120000]])'))
const r2Env = json(join(dev, 'repaired-r2/affected.command.json')).env
const r3Env = json(join(dev, 'repaired-r3/affected.command.json')).env
assert.equal(r2Env.PM_GOVERNANCE_TMP, undefined)
assert.equal(r3Env.PM_GOVERNANCE_TMP, join(dev, 'repaired-r3/tmp'))
const independentEnv = json(join(out, 'affected.command.json')).env
assert.equal(independentEnv.PM_GOVERNANCE_TMP, join(out, 'tmp'))
const target = join(out, 'history-review.json')
assert(!existsSync(target))
writeFileSync(target, `${JSON.stringify({
  at: new Date().toISOString(), originalIndependentR2: { controlsExit: 0, controlsPassed: 8,
    necessaryRedExit: 1, necessaryRedFailed: 10, released: oldClose.released },
  developmentHistory: records, historicalProtectedObjects: Object.keys(devProtected).length, historicalProtectedDrift,
  facilityTestCorrection: { rawFailureRetained: true, reason: 'Full prompt equality compared fresh production message UUIDs.',
    revisedAssertion: 'Both system and complete stable user/role/source/content are still asserted; only random message id is excluded.',
    oldTestSha256: sha(oldTest), finalTestSha256: sha(finalTest), fixtureStderrSha256: sha(fixtureStderr),
    verdict: 'VALID_FIXTURE_CORRECTION_NOT_WEAKENED_TERMINAL_ASSERTIONS' },
  ownReviewerFacility: { initialToolAttemptExit: 1, sameByteFacilityReplayExit: 1,
    rawReplay: 'history-review-facility-replay.command.json', preservedSource: 'history-review-initial-runner.mjs',
    secondAttemptExit: 1, secondAttemptRaw: 'history-review.command.json', secondAttemptSource: 'history-review-second-runner.mjs',
    correction: 'Use preserved stderr for UUID diff, strip ANSI via node:util for assertions only; raw stderr bytes are unchanged.',
    productTestsRerunForThisCorrection: false },
  facilityTmp: { r2MissingGovernanceTmp: true, originalLocatedOutsideRoots: 13, outsideObservations,
    r3GovernanceTmp: r3Env.PM_GOVERNANCE_TMP, independentGovernanceTmp: independentEnv.PM_GOVERNANCE_TMP,
    originalOutsideArtifactsDeleted: false,
    limitation: '13 located roots are not an exhaustive disk-wide accounting; later clean runs do not erase original isolation failure.' },
  verdict: 'HISTORY_VERIFIED_NOT_PROMOTED_TO_INDEPENDENT_PASS',
}, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ developmentExecutions: records.length, historicalProtectedObjects: Object.keys(devProtected).length,
  historicalProtectedDrift, original8And10Retained: true, testred40AndFirstFix42Plus1Retained: true,
  tmpOutsideRootsRetained: outsideObservations.length, fixtureCorrectionValid: true }))
