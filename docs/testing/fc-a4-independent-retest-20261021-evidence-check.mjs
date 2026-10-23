import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const prefix = 'fc-a4-independent-retest-20261021'
const round = process.argv[2] ?? ''
if (round && !/^r\d+$/.test(round)) throw new Error('未知索引轮次')
const out = join(here, `${prefix}-evidence-check${round ? '-' + round : ''}.json`)
if (existsSync(out)) throw new Error('禁止覆盖原证')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex')
const rounds = ['initial', 'a2', 'a3', 'probes', 'probes-r2', 'final']
const results = rounds.map(m => json(join(here, `${prefix}-${m}-result.json`)))
const commands = results.flatMap(r => r.commands)
const initial = results[0]
for (const r of results) {
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
}
for (const c of commands) assert.equal(sha(join(repo, c.log)), c.sha256)
const pids = new Set()
for (const c of commands) {
  for (const m of readFileSync(join(repo, c.log), 'utf8').matchAll(/"event":"browser","pid":(\d+)/g)) pids.add(Number(m[1]))
}
const processChecks = [...pids].map(pid => {
  const r = spawnSync('ps', ['-p', String(pid), '-o', 'pid=,comm='], { encoding: 'utf8' })
  return { pid, exit: r.status, stdout: r.stdout.trim(), stderr: r.stderr.trim() }
})
assert.ok(processChecks.every(p => p.exit === 1 && !p.stdout))
const a3 = json(join(repo, 'reports/all-pending-evidence-20261021/A3/candidate.json'))
const a4 = json(join(repo, 'reports/all-pending-evidence-20261021/A4/candidate.json'))
assert.equal(sha(join(repo, 'reports/all-pending-evidence-20261021/A4/candidate.json')), initial.candidateSha256)
assert.equal(sha(join(repo, 'reports/all-pending-evidence-20261021/A4/tracked.patch')), initial.patchSha256)
for (const [path, expected] of Object.entries(a4.source)) {
  assert.equal(sha(join(repo, path)), expected.sha256)
  assert.equal(sha(join(a4.worktree, path)), expected.sha256)
  assert.equal(sha(join(initial.root, path)), expected.sha256)
}
const artifacts = json(join(repo, 'reports/all-pending-evidence-20261021/A0/all-built-files.json'))
assert.equal(Object.keys(artifacts).length, 453)
for (const [path, expected] of Object.entries(artifacts)) assert.equal(sha(join(a4.worktree, path)), expected)
const changedSinceA3 = Object.keys(a4.source).filter(p => a3.source[p]?.sha256 !== a4.source[p].sha256)
assert.deepEqual(changedSinceA3.sort(), [...a4.changedSinceA3].sort())
const authorFiles = ['author-red.json', 'author-red.txt', 'author-execution.json', 'author-launcher55.txt', 'author-dom-a3.txt']
const author = authorFiles.map(name => {
  const path = join(repo, 'reports/all-pending-evidence-20261021/A4', name)
  const text = readFileSync(path, 'utf8')
  return { name, sha256: sha(path), summaries: [...text.matchAll(/^# (tests|pass|fail|skipped|cancelled) (\d+)$/gm)].map(m => ({ key: m[1], value: Number(m[2]) })) }
})
const result = {
  at: new Date().toISOString(), round, node: process.version, platform: process.platform,
  candidateSha256: initial.candidateSha256, patchSha256: initial.patchSha256,
  root: initial.root, changedSinceA3, commands, originalTests: initial.originalTests, processChecks,
  processBoundary: '只核日志明确打印的自有Chrome PID；DOM7未打印PID，不宣称其完整PID列表。所有round finishedAt存在、fixture正常清理。',
  author, authorBoundary: '只审作者日志原件，作者red未独立绑定完整红候选，不把作者exit当独立结论。',
  evidence: readdirSync(here).filter(n => n.startsWith(prefix) && n !== `${prefix}-evidence-check.json`).map(name => ({ name, sha256: sha(join(here, name)) })),
  finiteAutoVerdict: 'FAIL',
  defect: 'FC-A4-01 当前有效回告S4后迟到OS失败覆盖S6且confirmed=true，existing/owned/reopen同根因',
  boundary: '无Finder/真实dsh认证/正式服务/插件全量build或verify判定；身份审计exit0不等AUTO通过。',
}
writeFileSync(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ out, finiteAutoVerdict: result.finiteAutoVerdict, changedSinceA3, commands: commands.map(c => ({ label: c.label, exit: c.exit, summary: c.summary })), processChecks }))
