import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const prefix = 'fc-a5-independent-retest-20261021'
const out = join(here, `${prefix}-evidence-check.json`)
assert.ok(!existsSync(out), '禁止覆盖原证')
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const modes = ['setup', 'initial', 'a2', 'a3', 'a4-original', 'a4-corrected', 'probes', 'final']
const results = modes.map(m => json(join(here, `${prefix}-${m}-result.json`)))
const initial = results[0]
for (const r of results) {
  assert.ok(r.finishedAt)
  assert.equal(r.candidateSha256, initial.candidateSha256)
  assert.equal(r.candidateAfterSha256, initial.candidateSha256)
  assert.equal(r.patchSha256, initial.patchSha256)
  assert.equal(r.patchAfterSha256, initial.patchSha256)
  assert.equal(r.patchMatchesCurrentTrackedDiff, true)
  assert.deepEqual(r.sourceChanges, [])
  assert.deepEqual(r.artifactChanges, [])
  assert.deepEqual(r.launcherChanges, [])
  assert.deepEqual(r.originalTests, initial.originalTests)
  assert.deepEqual(r.originalTestsAfter, initial.originalTests)
  assert.equal(r.sourceBefore.length, 23)
  assert.equal(r.sourceAfter.length, 23)
  assert.equal(r.artifactsBefore.length, 453)
  assert.equal(r.artifactsAfter.length, 453)
}
const commands = results.flatMap(r => r.commands)
const oldOracle = results.find(r => r.mode === 'a4-original')
assert.equal(oldOracle.expectedObsoleteOracleOnly, true)
const expectations = { launcher56: 56, dom7: 7, original8: 8, additional9: 9,
  followup10: 10, original13: 13, original26: 26, corrected26: 26, additional: 40 }
const browserPids = new Set()
for (const c of commands) {
  assert.equal(sha(join(repo, c.log)), c.sha256)
  assert.equal(c.summary.tests, expectations[c.label])
  assert.equal(c.summary.skipped, 0)
  assert.equal(c.summary.cancelled, 0)
  assert.equal(c.summary.todo, 0)
  assert.equal(c.signal, null)
  assert.equal(c.error, null)
  assert.equal(c.exit, c.label === 'original26' ? 1 : 0)
  assert.equal(c.summary.fail, c.label === 'original26' ? 1 : 0)
  const raw = readFileSync(join(repo, c.log), 'utf8')
  for (const m of raw.matchAll(/"event":"browser","pid":(\d+)/g)) browserPids.add(Number(m[1]))
}
const correction = results.find(r => r.mode === 'a4-corrected').oracleCorrection
const original = join(initial.root, 'launcher/test/fc-a4-original.test.mjs')
const corrected = join(initial.root, 'launcher/test/fc-a4-corrected.test.mjs')
assert.equal(sha(original), correction.originalSha256)
assert.equal(sha(corrected), correction.correctedSha256)
assert.equal(sha(join(repo, correction.diff)), correction.diffSha256)
const added = "    } else if (outcome === 'early-failure') {\n      assertState(f.app, 'S4', 'Chrome', true)\n      assert.equal(f.app.verifyEntered(current), false)\n"
const oldText = readFileSync(original, 'utf8')
const newText = readFileSync(corrected, 'utf8')
assert.equal(newText.split(added).length, 2)
assert.equal(newText.replace(added, ''), oldText, '只允许添加三行early-failure分支')
assert.equal(sha(join(here, 'fc-a4-independent-retest-20261021-probes.test.mjs')), correction.originalSha256)
const candidatePath = join(repo, 'reports/all-pending-evidence-20261021/A5/candidate.json')
const candidate = json(candidatePath)
assert.equal(sha(candidatePath), initial.candidateSha256)
assert.equal(sha(join(repo, 'reports/all-pending-evidence-20261021/A5/tracked.patch')), initial.patchSha256)
for (const [path, expected] of Object.entries(candidate.source)) {
  assert.equal(sha(join(repo, path)), expected.sha256)
  assert.equal(sha(join(candidate.worktree, path)), expected.sha256)
  assert.equal(sha(join(initial.root, path)), expected.sha256)
}
const artifacts = json(join(repo, 'reports/all-pending-evidence-20261021/A0/all-built-files.json'))
assert.equal(Object.keys(artifacts).length, 453)
for (const [path, expected] of Object.entries(artifacts)) assert.equal(sha(join(candidate.worktree, path)), expected)
const processChecks = [...browserPids].map(pid => {
  const r = spawnSync('ps', ['-p', String(pid), '-o', 'pid=,comm='], { encoding: 'utf8' })
  return { pid, exit: r.status, stdout: r.stdout.trim(), stderr: r.stderr.trim() }
})
assert.ok(processChecks.every(p => p.exit === 1 && !p.stdout), '自有Chrome未退出')
const processListing = spawnSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
assert.equal(processListing.status, 0)
const activeCommands = processListing.stdout.split('\n').filter(line => line.includes(`${prefix}-run.mjs`) ||
  (line.includes(initial.root) && !line.includes(`${prefix}-evidence-check.mjs`)))
assert.deepEqual(activeCommands, [], '仍有本轮runner/自有tmp子进程')
const rawProbe = readFileSync(join(here, `${prefix}-probes-additional.txt`), 'utf8')
const events = [...rawProbe.matchAll(/^# (\{"event":.*\})$/gm)].map(m => JSON.parse(m[1]))
const s4 = events.filter(e => e.event === 'current-S4-OS-result')
const noCallback = events.filter(e => e.event === 'no-callback-OS-failure')
const ready = events.filter(e => e.event === 'ready-owned-preserved')
assert.equal(s4.length, 12)
assert.equal(noCallback.length, 9)
assert.equal(ready.length, 3)
assert.ok(s4.every(e => e.app.status === 'S4' && e.app.confirmed && e.dom.status === 'S4' && e.dom.confirmed))
assert.ok(noCallback.every(e => e.state.status === 'S6' && !e.state.confirmed && e.lateEnteredHttp === 403))
assert.ok(ready.every(e => !e.terminated.length && e.spawned === 1 && e.openCount === 2))
const authorNames = ['author-red.json', 'author-red.txt', 'author-execution.json',
  'author-launcher56.txt', 'author-dom-a4.txt', 'author-probe-boundary.md']
const author = authorNames.map(name => {
  const path = join(repo, 'reports/all-pending-evidence-20261021/A5', name)
  const text = readFileSync(path, 'utf8')
  return { name, sha256: sha(path), summaries: [...text.matchAll(/^# (tests|pass|fail|skipped|cancelled) (\d+)$/gm)]
    .map(m => ({ key: m[1], value: Number(m[2]) })) }
})
const final = results.at(-1)
const result = {
  at: new Date().toISOString(), node: process.version, platform: process.platform,
  candidateSha256: initial.candidateSha256, patchSha256: initial.patchSha256,
  baseline: initial.baseline, productBase: initial.productBase, root: initial.root,
  sourceCount: 23, artifactCount: 453, changedSinceA4: initial.changedSinceA4,
  commands, originalTests: initial.originalTests, oracleCorrection: correction,
  oracleVerdict: 'A4原26唯一旧期望FAIL原exit1保留；仅纠正副本early-failure三行，符合A4既有修复合同，非产品回归FAIL',
  processChecks, activeCommands,
  processBoundary: '只核日志打印的Chrome PID和自有root/runner残留；原DOM7不打印PID，不声明其完整PID列表',
  realTimeouts: [...s4, ...noCallback, ...ready].filter(e => e.mode === 'timeout')
    .map(e => ({ event: e.event, kind: e.kind ?? 'owned-production-controller', elapsed: e.elapsed })),
  s4Results: s4, noCallbackResults: noCallback, readyResults: ready,
  protectedChangesSinceSetup: final.protectedChangesSinceSetup,
  protectedBoundary: 'WATCH包括AGENTS/README/docs(排除自有前缀)/A4与A5原证；另23源、完整launcher和453产物。未读private/runtime/profile/业务数据，不宣称全盘零污染；并发外部改动逐项保留。',
  author, authorBoundary: '红6/7 exit1；作者56/56 exit0，合并40/41 exit1；仅审相容性，作者日志不替独立结论',
  finiteAutoVerdict: 'PASS',
  boundary: '只签FC-A4-01的A5修复与适用受影响AUTO；不签Main N1/N2、Finder、真实dsh认证、GUI总门、插件全量build/verify、发布或提交',
  evidence: modes.map(m => ({ mode: m, path: `${prefix}-${m}-result.json`, sha256: sha(join(here, `${prefix}-${m}-result.json`)) })),
}
writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ out, finiteAutoVerdict: result.finiteAutoVerdict, processChecks,
  commands: commands.map(c => ({ label: c.label, exit: c.exit, summary: c.summary })),
  realTimeouts: result.realTimeouts, protectedChanges: result.protectedChangesSinceSetup.length }))
