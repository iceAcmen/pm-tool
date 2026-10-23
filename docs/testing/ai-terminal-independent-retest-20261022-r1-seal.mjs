import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testing = dirname(fileURLToPath(import.meta.url))
const repo = resolve(testing, '../..')
const prefix = 'ai-terminal-independent-retest-20261022-r1'
const out = join(testing, `${prefix}-evidence`)
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
function save(p, value) {
  assert(resolve(p).startsWith(`${testing}/${prefix}`))
  writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const close = json(join(out, 'close.json')), candidate = json(join(out, 'candidate.json'))
assert(close.released && close.stop && close.verdict === 'PASS_LIMITED_SOURCE_AUTO')
assert.equal(json(join(out, 'history-review-corrected.command.json')).originalExit, 0)
assert(json(join(out, 'history-review.json')).historicalProtectedDrift.length === 0)
assert(readFileSync(join(testing, `${prefix}-report.md`), 'utf8').includes('**PASS_LIMITED_SOURCE_AUTO**'))
assert.equal(json(join(out, 'affected.result.json')).testResults.length, 13)
assert.equal(readdirSync(join(out, 'tmp')).filter(p => p.startsWith('governance-case-')).length, 13)
const metadataRoot = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
const executionIds = [
  ['freeze', 'b1d91032e2fd70e41f02b908f34642f4'],
  ['six-sequential-tests', '38cc1fe36009ce028c57174b426a490d'],
  ['close', 'ac8027b6432e5a377b2552764edb970a'],
]
const parents = executionIds.map(([name, id]) => {
  const p = join(metadataRoot, id, 'execution.json'), m = json(p)
  assert.equal(m.status, 'exited')
  assert.equal(m.exitCode, 0)
  const ps = spawnSync('/bin/ps', ['-p', String(m.pid), '-o', 'pid=,ppid=,command='],
    { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
  assert(ps.status === 1 && !ps.stdout.trim(), 'Owned parent must be exited')
  return { name, executionId: id, pid: m.pid, status: m.status, exitCode: m.exitCode,
    metadataSha256: sha(readFileSync(p)), stdoutSha256: sha(readFileSync(join(metadataRoot, id, 'output.log'))),
    startedAt: new Date(m.startedAtMs).toISOString(), finishedAt: new Date(m.finishedAtMs).toISOString(),
    exited: true }
})
const reviewProcesses = ['history-review-facility-replay', 'history-review', 'history-review-corrected'].map(name => {
  const command = json(join(out, `${name}.command.json`))
  const ps = spawnSync('/bin/ps', ['-p', String(command.pid), '-o', 'pid=,ppid=,command='],
    { encoding: 'utf8', env: { PATH: '/usr/bin:/bin' } })
  assert(ps.status === 1 && !ps.stdout.trim())
  return { name, pid: command.pid, originalExit: command.originalExit, exited: true }
})
save(join(out, 'execution-receipts.json'), { parents, reviewProcesses, productProcesses: close.processes })
const report = `${prefix}-report.md`
const target = join(testing, `${prefix}-delivery.json`)
assert(!existsSync(target))
save(target, { at: new Date().toISOString(), role: 'independent-source-auto-expert-not-developer-not-gui',
  verdict: 'PASS_LIMITED_SOURCE_AUTO', report, candidate: relative(repo, join(out, 'candidate.json')),
  baselineCommit: candidate.baselineCommit, sourceSha256: candidate.productSha256, testSha256: candidate.newTestSha256,
  patchSha256: candidate.patchSha256, parentDeclarations: 104, successorDeclarations: 106,
  completeInputs: 973, inputReconciliation: '509 + 1 new test + 463 original lib = 973',
  scope: ['ATF-01 terminal partial rejection', 'ATF-02 stable-code Chinese classification and hard stop',
    'ATF-03 model aborted protocol does not retry'],
  repairSurface: ['packages/dsh-pm-tool/src/core/ai-client.ts', 'packages/dsh-pm-tool/src/core/ai-client-terminal.test.ts'],
  sourceReview: 'No new blocker in the narrow delivered patch; no product changes by reviewer.',
  results: close.results, totalExecutedTests: 236, protectedObjects: candidate.protectedObjects,
  original757Retained: true, protection: close.protection, ownedGovernanceTmpRoots: 13,
  developmentHistory: 'original8/10red, testred40red, firstfix42+1fail, r2outside13 retained; r3 is developer self-test only',
  ownReviewerFailures: 'Initial JSON assumption exit1, identical-byte preservation replay exit1, ANSI assumption exit1; corrected exit0. No product test edit or rerun.',
  evidence: { close: relative(repo, join(out, 'close.json')), history: relative(repo, join(out, 'history-review.json')),
    receipts: relative(repo, join(out, 'execution-receipts.json')), fullIndex: relative(repo, join(testing, `${prefix}-index.json`)) },
  nextOwner: 'Main only builder and GUI13 executor; separate independent GUI expert signs',
  gui: 'NOT_RUN_MAIN_PENDING', runtime: 'Old U4r2 3257/3258 not newly loaded or inspected',
  realModel: 'NOT_RUN', wallClock120s: 'NOT_RUN_PARAMETER_ONLY', uiCancellation: 'NOT_RUN_PROTOCOL_ONLY',
  fullVerify: 'NOT_RUN', build: 'NOT_RUN', install: 'NOT_RUN', coverage: 'NOT_RUN',
  services: 'NOT_TOUCHED', git: 'NOT_RUN', credentials: 'NOT_READ',
  wholeRAAI06: 'NOT_SIGNED', parentGoal: 'NOT_SIGNED', release: 'STOP', released: true, stop: true })
const index = {}
function walk(p) {
  const s = lstatSync(p), key = relative(repo, p)
  if (s.isSymbolicLink()) index[key] = { link: readlinkSync(p) }
  else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
  else index[key] = { bytes: s.size, sha256: sha(readFileSync(p)) }
}
for (const n of readdirSync(testing).filter(n => n.startsWith(prefix)).sort()) walk(join(testing, n))
save(join(testing, `${prefix}-index.json`), { at: new Date().toISOString(), files: index,
  indexExcludesItself: true, scope: 'Only this role prefix, including complete frozen inputs, dependencies, raw failures and runtime roots.' })
console.log(JSON.stringify({ verdict: 'PASS_LIMITED_SOURCE_AUTO', tests: 236, protectedObjects: candidate.protectedObjects,
  allOwnedProcessesExited: true, filesIndexed: Object.keys(index).length, released: true, stop: true, release: 'STOP' }))
