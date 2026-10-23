import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a13-import-filename-independent-retest-20261021'
const root = join(repo, 'docs/testing', `${prefix}-selftmp`)
const sha = value => createHash('sha256').update(value).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const save = (name, value) => writeFileSync(join(root, name),
  typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`)
if (process.argv[2] !== '--seal') {
  const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(root, 'final-home'), TMPDIR: join(root, 'final-tmp'), CI: 'true', LANG: 'en_US.UTF-8' }
  for (const path of [env.HOME, env.TMPDIR]) mkdirSync(path, { recursive: true, mode: 0o700 })
  const outerRuns = []
  for (const round of ['old-r2', 'new-r3']) {
    const args = [join(repo, 'docs/testing', `${prefix}-run.mjs`), round]
    const started = new Date().toISOString()
    const result = spawnSync(process.execPath, args, { cwd: repo, env,
      encoding: 'utf8', timeout: 240000, maxBuffer: 64 * 1024 * 1024 })
    save(`${round}.outer.stdout.log`, result.stdout ?? '')
    save(`${round}.outer.stderr.log`, result.stderr ?? '')
    const command = { round, argv: [process.execPath, ...args], cwd: repo, env,
      pid: result.pid, started, ended: new Date().toISOString(),
      originalExit: result.status, signal: result.signal, error: result.error?.message }
    save(`${round}.outer.command.json`, command)
    outerRuns.push(command)
    console.log(JSON.stringify(command))
    assert.equal(result.status, round.startsWith('old') ? 1 : 0, result.stderr)
  }
  const candidate = json(join(root, 'new-r3/candidate.json'))
  const previous = json(join(root, 'new-r2/candidate.json'))
  const summary = json(join(root, 'new-r3/summary.json'))
  const owned = Object.keys(candidate.owned)
  const liveChecks = Object.entries(candidate.source.files).map(([path, value]) => ({
    path, expected: value.sha256,
    actual: existsSync(join(repo, 'packages/dsh-pm-tool/src', path))
      ? sha(readFileSync(join(repo, 'packages/dsh-pm-tool/src', path))) : null,
  }))
  const ownedDrift = liveChecks.filter(item => owned.includes(item.path) && item.actual !== item.expected)
  assert.equal(ownedDrift.length, 0, '释放前owned变化，停止审签')
  assert(summary.executions.every(item => item.originalExit === 0))
  assert(summary.audit.protectedUnchanged && summary.audit.artifactsUnchanged)
  for (const key of ['frozenSourceDrift', 'liveOwnedDrift', 'nativeDrift', 'evidenceDrift', 'inputDrift', 'dependencyDrift']) {
    assert.equal(summary.audit[key].length, 0, key)
  }
  const verifyIndex = round => {
    const index = json(join(root, round, 'evidence-index.json'))
    const mismatches = Object.entries(index.files).filter(([path, expected]) =>
      sha(readFileSync(join(root, round, path))) !== expected.sha256)
    assert.equal(mismatches.length, 0, `冻结证据变化 ${round}`)
    return { round, files: Object.keys(index.files).length, mismatches }
  }
  const roundChecks = ['old-r1', 'new-r1', 'new-r2', 'old-r2', 'new-r3'].map(verifyIndex)
  const tests = Object.fromEntries(summary.executions.filter(item => item.label !== 'noemit').map(item => {
    const result = json(join(root, 'new-r3', `${item.label}.result.json`))
    return [item.label, { passed: result.numPassedTests, failed: result.numFailedTests,
      filteredOrPending: result.numPendingTests, originalExit: item.originalExit }]
  }))
  const result = spawnSync('/bin/ps', ['-axo', 'pid=,ppid=,command='], { encoding: 'utf8' })
  assert.equal(result.status, 0)
  const processes = result.stdout.split('\n').filter(line =>
    !new RegExp(`^\\s*(${process.pid}|${process.ppid})\\s`).test(line)
    && (line.includes(`${prefix}-run.mjs`) || (line.includes(`${prefix}-selftmp`) && line.includes('vitest'))))
  assert.equal(processes.length, 0, '自有runner/worker尚在运行')
  const final = {
    at: new Date().toISOString(), role: '独立SOURCE/AUTO限定审证',
    baselineCommit: candidate.baselineCommit, candidate: 'new-r3',
    sourceTreeSha256: candidate.sourceTreeSha256,
    candidateSha256: sha(readFileSync(join(root, 'new-r3/candidate.json'))),
    previousSourceTreeSha256: previous.sourceTreeSha256,
    twoGreenRoundsSameSource: JSON.stringify(candidate.source) === JSON.stringify(previous.source),
    owned: candidate.owned, ownedDrift,
    parallelLiveChanges: liveChecks.filter(item => !owned.includes(item.path) && item.actual !== item.expected),
    roundChecks, tests, outerRuns, noemit: summary.executions.find(item => item.label === 'noemit'),
    artifacts: summary.audit.artifactsAfter.map(item => ({
      name: item.name, count: item.checks.length, matchesOriginal: item.matchesOriginal,
    })),
    processes: { command: ['/bin/ps', '-axo', 'pid=,ppid=,command='], originalExit: result.status,
      scope: '按本前缀runner和worker路径筛选；不检查或操作服务', matches: processes },
    decision: 'SOURCE/AUTO PASS，非GUI/整项/发布', gui: 'NOT_RUN', u4: 'NOT_RUN',
  }
  save('final-check.json', final)
  console.log(JSON.stringify({ tests, artifacts: final.artifacts, sameSource: final.twoGreenRoundsSameSource,
    ownedDrift, processes, finalCheckSha256: sha(readFileSync(join(root, 'final-check.json'))) }))
}
if (process.argv[2] === '--seal') {
  const candidate = json(join(root, 'new-r3/candidate.json'))
  const summary = json(join(root, 'new-r3/summary.json'))
  const owned = Object.entries(candidate.owned).map(([path, expected]) => ({
    path, expected: expected.actual,
    actual: sha(readFileSync(join(repo, 'packages/dsh-pm-tool/src', path))),
  }))
  const evidence = ['old-r1', 'new-r1', 'new-r2', 'old-r2', 'new-r3'].map(round => {
    const index = json(join(root, round, 'evidence-index.json'))
    const drift = Object.entries(index.files).filter(([path, expected]) =>
      sha(readFileSync(join(root, round, path))) !== expected.sha256).map(([path]) => path)
    return { round, checked: Object.keys(index.files).length, drift }
  })
  const artifacts = summary.audit.artifactsAfter.map(item => ({
    name: item.name, checked: item.checks.length,
    drift: item.checks.filter(check => sha(readFileSync(join(item.root, check.file))) !== check.expected),
  }))
  const protectedDrift = []
  for (const [path, expected] of Object.entries(summary.audit.protectedAfter)) {
    if (existsSync(path) !== expected.exists) { protectedDrift.push(path); continue }
    for (const [file, value] of Object.entries(expected.files)) {
      const absolute = file === '.' ? path : join(path, file)
      if (!existsSync(absolute)) { protectedDrift.push(absolute); continue }
      const st = lstatSync(absolute)
      if (sha(readFileSync(absolute)) !== value.sha256 || st.size !== value.bytes || st.mtimeMs !== value.mtimeMs) {
        protectedDrift.push(absolute)
      }
    }
  }
  const ps = spawnSync('/bin/ps', ['-axo', 'pid=,ppid=,command='], { encoding: 'utf8' })
  assert.equal(ps.status, 0)
  const processes = ps.stdout.split('\n').filter(line =>
    !new RegExp(`^\\s*(${process.pid}|${process.ppid})\\s`).test(line)
    && (line.includes(`${prefix}-run.mjs`) || (line.includes(`${prefix}-selftmp`) && line.includes('vitest'))))
  const release = { at: new Date().toISOString(), originalExitOfProcessCheck: ps.status,
    owned, evidence, artifacts, protectedDrift, processes,
    boundary: '重核已认领文件内容/mtime；不宣称检测全机新增文件。未写任何被保护对象。',
    released: owned.every(item => item.actual === item.expected) && evidence.every(item => !item.drift.length)
      && artifacts.every(item => !item.drift.length) && !protectedDrift.length && !processes.length }
  save('release-check.json', release)
  assert(release.released, '释放检查失败，停止封存')
  console.log(JSON.stringify({ released: true, releaseCheckSha256: sha(readFileSync(join(root, 'release-check.json'))) }))
}
const files = {}
function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    const st = lstatSync(path)
    if (st.isSymbolicLink()) continue
    if (st.isDirectory()) walk(path)
    else if (path !== join(root, 'evidence-index.json')) files[relative(root, path)] = {
      sha256: sha(readFileSync(path)), bytes: st.size,
    }
  }
}
walk(root)
const authored = Object.fromEntries(readdirSync(join(repo, 'docs/testing'))
  .filter(name => name.startsWith(prefix) && lstatSync(join(repo, 'docs/testing', name)).isFile())
  .map(name => [name, { sha256: sha(readFileSync(join(repo, 'docs/testing', name))),
    bytes: lstatSync(join(repo, 'docs/testing', name)).size }]))
save('evidence-index.json', { at: new Date().toISOString(), files, authored,
  boundary: '索引自身不索引；符号链接指向只读依赖，另见candidate依赖清单',
  finalCheckSha256: sha(readFileSync(join(root, 'final-check.json'))) })
console.log(JSON.stringify({ sealedFiles: Object.keys(files).length,
  evidenceIndexSha256: sha(readFileSync(join(root, 'evidence-index.json'))) }))
