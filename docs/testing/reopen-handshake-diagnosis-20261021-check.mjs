import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const repo = '/Users/bytedance/Projects/dsh-pm/pm-tool'
const prefix = 'docs/testing/reopen-handshake-diagnosis-20261021'
const tmp = '/tmp/pmtool-reopen-handshake-diagnosis-20261021.uOtK7e'
const sha = b => createHash('sha256').update(b).digest('hex')
const inputs = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/external-skills.md',
  'docs/testing/fc-a3-independent-retest-20261021.md',
  'docs/testing/fc-a4-independent-retest-20261021.md',
  'reports/all-pending-evidence-20261021/A4/candidate.json',
  'reports/all-pending-evidence-20261021/A4/finder/N1-auto-S4.json',
  'reports/all-pending-evidence-20261021/A4/finder/N1-auto-S4.png',
  'reports/all-pending-evidence-20261021/A4/finder/N2-waiting.json',
  'reports/all-pending-evidence-20261021/A4/finder/N2-waiting.png',
  'reports/all-pending-evidence-20261021/A4/finder/travel-observations.json',
  'reports/all-pending-evidence-20261021/A4/finder/safe-app.json',
]
const inputManifest = Object.fromEntries(inputs.map(path => [path, sha(readFileSync(join(repo, path)))]))
const observerSource = '/private/tmp/pmtool-a4-passive-observer-20261021.mjs'
copyFileSync(observerSource, join(tmp, 'passive-observer-source.mjs'))
const execution = {
  command: process.execPath,
  args: [join(repo, `${prefix}-run.mjs`), 'r3'],
  cwd: repo,
  startedAt: new Date().toISOString(),
}
const run = spawnSync(execution.command, execution.args, {
  cwd: repo, encoding: 'utf8', timeout: 60000,
  env: { ...process.env, TMPDIR: tmp, TMP: tmp, TEMP: tmp },
})
Object.assign(execution, { finishedAt: new Date().toISOString(), exitCode: run.status,
  signal: run.signal, stdout: run.stdout, stderr: run.stderr, error: run.error?.message })
writeFileSync(join(repo, `${prefix}-r3-execution.json`), JSON.stringify(execution, null, 2) + '\n', { flag: 'wx' })
assert.equal(run.status, 1, 'red-capable contract should be red on the unchanged candidate')
const results = [1, 2, 3].map(n => JSON.parse(readFileSync(join(repo, `${prefix}-r${n}.json`), 'utf8')))
for (const result of results) {
  assert.deepEqual(result.summary, { passed: 6, failed: 4 })
  assert.deepEqual(result.tests.filter(t => t.status === 'FAIL').map(t => t.id), ['R05', 'R06', 'R07', 'R08'])
  assert.equal(result.dom.status, 'DIAGNOSIS_REPRODUCED')
  assert.equal(result.dom.pidStillPresent, false)
  assert.deepEqual(result.before, result.after)
  assert.deepEqual(result.before, results[0].before)
}
copyFileSync(join(tmp, 'r3/panel-ast.json'), join(repo, `${prefix}-panel-ast.json`))
copyFileSync(join(tmp, 'r3/dom.json'), join(repo, `${prefix}-dom.json`))
const vendorExec = spawnSync(process.execPath, [join(repo, 'packages/dsh-pm-tool/scripts/verify-external-skills.mjs')], {
  cwd: repo, encoding: 'utf8', timeout: 30000,
})
assert.equal(vendorExec.status, 0)
const a4 = JSON.parse(readFileSync(join(repo, 'reports/all-pending-evidence-20261021/A4/candidate.json'), 'utf8'))
const sourceBinding = Object.fromEntries(Object.entries(results[0].before).map(([path, currentSha256]) => {
  const baseBytes = spawnSync('git', ['show', `${a4.productBase}:${path}`], { cwd: repo })
  return [path, { currentSha256, a4ManifestSha256: a4.source[path]?.sha256 ?? null,
    productBaseSha256: baseBytes.status === 0 ? sha(baseBytes.stdout) : null,
    meaning: a4.source[path] ? 'A4 manifest-listed source' : 'Additional bridge source binding; not in A4 23-item manifest' }]
}))
const missingRaw = [
  'reports/all-pending-evidence-20261021/A4/finder/passive.ndjson',
].filter(path => !existsSync(join(repo, path)))
const index = {
  at: new Date().toISOString(),
  execution, results: results.map(r => ({ round: r.round, startedAt: r.startedAt,
    finishedAt: r.finishedAt, summary: r.summary, chromePid: r.dom.pid, chromeExited: !r.dom.pidStillPresent })),
  sourceBinding, inputManifest,
  observer: { path: observerSource, sha256: sha(readFileSync(observerSource)),
    role: 'Only explicitly allowed passive source; not executed; runtime/output root not read.' },
  vendor: { exitCode: vendorExec.status, stdout: vendorExec.stdout, stderr: vendorExec.stderr,
    taskKind: 'rootCause', skill: 'diagnosing-bugs', vendorIntegrityVerified: true,
    sourceCommit: '49dd158d1076134a641b33efb035946536778336',
    skipped: 'No product fix, HITL script, installer, globals, full regression or commit under this assignment.' },
  missingRaw,
  boundary: 'Confirmed independent source/bridge/DOM diagnosis only. Missing Main entered/OS trace and exact reload target; no complete GUI FAIL/PASS or whole Launcher verdict.',
}
writeFileSync(join(repo, `${prefix}-evidence.json`), JSON.stringify(index, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ status: 'EVIDENCE_CHECK_OK_NOT_PRODUCT_PASS', rounds: 3,
  redContractExitCode: run.status, passedPerRound: 6, failedPerRound: 4,
  vendorExitCode: vendorExec.status, missingRaw }))
