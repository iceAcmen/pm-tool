import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a19-habit-card-wrap-independent-retest-20261022'
const out = join(repo, 'docs/testing', `${prefix}-evidence`)
const supplement = join(out, 'supplement')
const owned = '/private/tmp/pmtool-a19-habit-card-wrap-independent-retest-20261022'
const frozen = join(owned, 'frozen')
const deps = join(owned, 'dependencies/node_modules')
const depsSource = '/private/tmp/pmtool-a19-owned-deps-20261022/node_modules'
const pkg = 'packages/dsh-pm-tool'
const replayCase = 'docs/testing/a19-habit-card-wrap-contract-20261022-cases.test.tsx'
const fixture = 'docs/testing/a19-habit-card-wrap-contract-20261022-evidence/replay-input.json'
const boardFixture = 'docs/testing/board-fixture-clarification-20261021-fixture.json'
const affected = [
  'src/client/views/okr-model.test.ts',
  'src/client/views/growth-form-props.test.ts',
  'src/client/form-validation.test.ts',
  'src/client/shared/form-dirty.test.ts',
  'src/client/panel-transport-error-feedback.test.tsx',
  'src/client/board/BoardBento-feedback.test.tsx',
  'src/client/views/tasks-number-feedback.test.tsx',
  'src/client/result-card.test.ts',
  'src/client/result-card-copy.test.ts',
  'src/core/ui-feedback.test.ts',
  'src/client/views/records/records-meeting-entry.test.tsx',
  'src/client/views/records/records-meeting-layout.test.tsx',
]
const expectedHashes = {
  [`${pkg}/src/client/panel.css`]: '3cc0b0ed08ea34462ded8154b05f394a46f02c6577dea5da12c495aafa0f700b',
  [`${pkg}/src/client/views/habits.tsx`]: 'ab7e625808b6c4308068c26376c02d7fae9b59fc812ab9b77484c29633bd4964',
  [`${pkg}/src/client/views/habits-card-wrap.test.tsx`]: '071c2b0488e88078d15f6436c1798cced495706c15bf8ecbfcf435c343459d0d',
}
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(owned, 'home'),
  TMPDIR: join(owned, 'tmp'),
  DSH_HOME: join(owned, 'runtime'),
  XDG_CACHE_HOME: join(owned, 'cache/supplement'),
  CI: 'true',
  LANG: 'en_US.UTF-8',
  TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1',
  GIT_OPTIONAL_LOCKS: '0',
}
const sha = data => createHash('sha256').update(data).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
function save(name, value) {
  const path = join(supplement, name)
  assert(path.startsWith(`${supplement}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(path) {
    const stat = lstatSync(path, { bigint: true })
    const key = relative(root, path) || '.'
    if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) walk(join(path, name))
      return
    }
    const common = { bytes: Number(stat.size), inode: String(stat.ino), dev: String(stat.dev) }
    if (stat.isSymbolicLink()) result[key] = { ...common, link: readlinkSync(path) }
    else result[key] = { ...common, sha256: sha(readFileSync(path)) }
  }
  walk(root)
  return result
}
function diff(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
    .filter(path => !before[path] || !after[path] ||
      ['bytes', 'sha256', 'link'].some(field => before[path][field] !== after[path][field]))
    .map(path => ({ path, before: before[path], after: after[path] }))
}
function command(id, argv, cwd = frozen, extra = {}) {
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd, env: { ...env, ...extra }, encoding: 'utf8', timeout: 240000, maxBuffer: 128 * 1024 * 1024,
  })
  const receipt = {
    id, argv, cwd, env: { ...env, ...extra }, pid: result.pid,
    exit: result.status, signal: result.signal, error: result.error?.message ?? null,
  }
  save(`commands/${id}.json`, receipt)
  save(`commands/${id}.stdout.log`, result.stdout ?? '')
  save(`commands/${id}.stderr.log`, result.stderr ?? '')
  return receipt
}
function run(id, files, pattern) {
  const tools = json(join(out, 'tool-binding.json'))
  const resultFile = join(supplement, `results/${id}.json`)
  const observation = join(supplement, `results/${id}.observations.jsonl`)
  mkdirSync(dirname(observation), { recursive: true, mode: 0o700 })
  const receipt = command(id, [
    process.execPath, tools.vitest, 'run', ...files,
    '--config', join(out, 'vitest.config.mjs'),
    '--no-cache', '--maxWorkers=1', '--minWorkers=1',
    '--reporter=verbose', '--reporter=json', '--outputFile', resultFile,
    ...(pattern ? ['--testNamePattern', pattern] : []),
  ], frozen, {
    HC_FIXTURE: join(frozen, fixture),
    HC_CSS: join(frozen, pkg, 'src/client/panel.css'),
    HC_POSTCSS: tools.postcss,
    HC_OBSERVATIONS: observation,
  })
  const report = json(resultFile)
  return {
    id, pid: receipt.pid, exit: receipt.exit, signal: receipt.signal,
    passed: report.numPassedTests, failed: report.numFailedTests,
    pending: report.numPendingTests, failedSuites: report.numFailedTestSuites,
  }
}

assert.equal(process.version, 'v22.23.3')
assert(existsSync(out) && existsSync(frozen) && existsSync(deps))
assert(!existsSync(supplement), `拒绝覆盖：${supplement}`)
mkdirSync(supplement, { recursive: true, mode: 0o700 })

for (const [path, expected] of Object.entries(expectedHashes)) {
  assert.equal(sha(readFileSync(join(repo, path))), expected, `${path} 主树漂移`)
  assert.equal(sha(readFileSync(join(frozen, path))), expected, `${path} 冻结树漂移`)
}
const sourceDepsBefore = inventory(depsSource)
const copyDepsBefore = inventory(deps)
const fixtureSource = inventory(join(repo, boardFixture))
cpSync(join(repo, boardFixture), join(frozen, boardFixture), { preserveTimestamps: true })
const fixtureCopy = inventory(join(frozen, boardFixture))
assert.deepEqual(diff(fixtureSource, fixtureCopy), [])
save('correction.json', {
  initialExpertFailure: 'runner 未预建 observations 父目录，HC-R01..04 均 ENOENT，首轮 exit 1 保留',
  initialAffectedFailure: 'BoardBento-feedback 缺既定合法 fixture，122 断言绿但套件 exit 1，首轮保留',
  correction: '仅在自有冻结树补合法 Board fixture，并在每组执行前创建 observations 目录；不改产品或原测试',
  fixture: boardFixture,
  fixtureSha256: fixtureCopy['.'].sha256,
})

const results = [
  run('expert-necessary-r2', [replayCase], '^HC-R'),
  run('expert-controls-r2', [replayCase], '^HC-C'),
  run('author-two-r2', [`${pkg}/src/client/views/habits-card-wrap.test.tsx`]),
  run('habit-suggestion-okr-eleven-r2', [`${pkg}/src/client/views/habits-suggestion-okr.test.tsx`]),
  run('habit-model-ten-r2', [`${pkg}/src/client/views/habit-model.test.ts`]),
  run('affected-r2', affected.map(path => `${pkg}/${path}`)),
]
const tools = json(join(out, 'tool-binding.json'))
const typecheck = command('typecheck-noemit-r2', [
  process.execPath, tools.typescript, '-p', join(frozen, pkg, 'tsconfig.json'),
  '--noEmit', '--incremental', 'false',
], join(frozen, pkg))
results.push({ id: 'typecheck-noemit-r2', pid: typecheck.pid, exit: typecheck.exit, signal: typecheck.signal })
save('results/summary.json', results)

const pidChecks = results.map(result => {
  const check = command(`pid-${result.pid}`, ['/bin/ps', '-o', 'pid=,ppid=,command=', '-p', String(result.pid)], repo)
  return { pid: result.pid, psExit: check.exit, exited: check.exit === 1 && readFileSync(
    join(supplement, `commands/pid-${result.pid}.stdout.log`), 'utf8').trim() === '' }
})
const seal = {
  results,
  allAutoGreen: results.every(result => result.exit === 0),
  dependencySourceDrift: diff(sourceDepsBefore, inventory(depsSource)),
  dependencyCopyDrift: diff(copyDepsBefore, inventory(deps)),
  candidateHashes: Object.fromEntries(Object.keys(expectedHashes).map(path => [
    path, sha(readFileSync(join(repo, path))),
  ])),
  pidChecks,
  resourcesReleased: pidChecks.every(check => check.exited),
  firstRunPreserved: true,
  gui: 'NOT_RUN',
  stop: true,
}
save('seal.json', seal)
assert.equal(seal.dependencySourceDrift.length + seal.dependencyCopyDrift.length, 0)
assert(seal.resourcesReleased)
process.exitCode = seal.allAutoGreen ? 0 : 1
