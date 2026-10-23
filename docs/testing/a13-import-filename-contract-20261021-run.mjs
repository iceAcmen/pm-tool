import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a13-import-filename-contract-20261021'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const self = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert(!existsSync(self), '禁止覆盖原证；改用新rN')
const frozen = join(self, 'frozen')
const source = join(repo, 'packages/dsh-pm-tool')
const pkg = join(frozen, 'packages/dsh-pm-tool')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const native = '/private/tmp/pmtool-a11-native-import'
const oldEvidence = 'reports/all-pending-evidence-20261021/A11/materials/native-import'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function inventory(root, timestamps = false) {
  const files = {}
  if (!existsSync(root)) return { exists: false, files }
  function walk(path) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) return
    if (st.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else files[relative(root, path) || '.'] = {
      sha256: hash(readFileSync(path)), bytes: st.size, ...(timestamps ? { mtimeMs: st.mtimeMs } : {}),
    }
  }
  walk(root)
  return { exists: true, files }
}
const diff = (a, b) => [...new Set([...Object.keys(a.files), ...Object.keys(b.files)])]
  .filter(path => a.files[path]?.sha256 !== b.files[path]?.sha256)
function save(name, value) {
  const path = resolve(self, name)
  assert(path.startsWith(`${self}/`), '写根越界')
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`)
}
function git(args, cwd = repo) {
  const result = spawnSync('/usr/bin/git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}
const dependencyNames = ['react', 'react-test-renderer', 'vitest', 'xlsx', 'typescript',
  '@deepseek-ai/dsh-commands', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain']
for (const name of dependencyNames) assert(existsSync(join(deps, name, 'package.json')), `依赖缺失 ${name}；不得安装`)
const inputPaths = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/requirements.md', 'docs/decision-log.md',
  'docs/plans/2026-10-21-import-filename-closure.md',
  'docs/testing/a8-layer-gap-contract-review-20261021.md',
  'docs/testing/a9-existing-entries-independent-retest-20261021-plan.md',
  'docs/testing/a9-existing-entries-independent-retest-20261021.md',
  'docs/testing/a10-preflight-success-independent-retest-20261021.md',
  ...['plan.md', 'cases.md', 'cases.test.tsx', 'run.mjs'].map(name => `docs/testing/${prefix}-${name}`),
]
const dependencyBefore = Object.fromEntries(dependencyNames.map(name => [name, inventory(realpathSync(join(deps, name)))]))
const watched = [join(source, 'lib'), ...[join(source, 'node_modules'), deps].flatMap(root =>
  ['.vite', '.cache', '.vite-temp'].map(name => join(root, name)))]
const guard = () => Object.fromEntries(watched.map(path => [path, inventory(path, true)]))
const beforeGuard = guard()
const beforeSource = inventory(join(source, 'src'))
const beforeNative = inventory(native)
const beforeInputs = Object.fromEntries(inputPaths.map(path => [path, hash(readFileSync(join(repo, path)))]))
const beforeOldEvidence = inventory(join(repo, oldEvidence))
mkdirSync(self, { recursive: true, mode: 0o700 })
cpSync(join(source, 'src'), join(pkg, 'src'), { recursive: true })
for (const name of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']) {
  cpSync(join(source, name), join(pkg, name))
}
for (const path of inputPaths) {
  mkdirSync(dirname(join(frozen, path)), { recursive: true })
  cpSync(join(repo, path), join(frozen, path))
}
cpSync(join(repo, oldEvidence), join(frozen, oldEvidence), { recursive: true })
cpSync(native, join(self, 'native-input'), { recursive: true })
cpSync(join(repo, oldEvidence, 'source-hashes.json'), join(self, 'native-input/source-hashes.json'))
assert.deepEqual(beforeSource, inventory(join(pkg, 'src')), '冻结源码字节不一致')
assert.deepEqual(beforeSource, inventory(join(source, 'src')), '冻结中主源码变化；重新认领')
symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
const patch = git(['diff', '--binary', 'HEAD', '--', 'packages/dsh-pm-tool'])
save('tracked.patch', patch)
const added = git(['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src'])
  .trim().split('\n').filter(Boolean)
const commandPackage = realpathSync(join(deps, '@deepseek-ai/dsh-commands'))
const packageJson = JSON.parse(readFileSync(join(commandPackage, 'package.json'), 'utf8'))
const commandSource = '/Users/bytedance/Projects/dsh-pm/deepseek-harness/packages/interaction/commands/src/index.ts'
save('candidate.json', {
  role: '独立先行测试专家，非开发', at: new Date().toISOString(),
  baselineCommit: git(['rev-parse', 'HEAD']).trim(), trackedPatchSha256: hash(patch),
  newSourceFiles: added.map(path => ({ path, sha256: hash(readFileSync(join(repo, path))) })),
  source: beforeSource, sourceTreeSha256: hash(JSON.stringify(beforeSource)),
  inputHashes: beforeInputs, originalA11Evidence: beforeOldEvidence, nativeInput: beforeNative,
  environment: { node: process.version, executable: process.execPath, osRelease: os.release(),
    platform: process.platform, arch: process.arch },
  dependencies: Object.fromEntries(dependencyNames.map(name => [name, {
    physicalRoot: realpathSync(join(deps, name)),
    version: JSON.parse(readFileSync(join(deps, name, 'package.json'), 'utf8')).version,
  }])),
  productionCommandParser: {
    package: commandPackage, version: packageJson.version,
    actualEntrypoint: join(commandPackage, packageJson.main),
    entrySha256: hash(readFileSync(join(commandPackage, packageJson.main))),
    source: commandSource, sourceSha256: hash(readFileSync(commandSource)),
    sourceIsReferenceOnly: true,
    note: '实际已安装生产parseCommand；只解析/pm，import-content真实参数split位于冻结插件handler',
  },
  frozen, noBuild: true, noServices: true, noGui: true,
})
save('production-command-parser-source.ts', readFileSync(commandSource, 'utf8'))
for (const name of ['home', 'tmp', 'cache', 'node-cache', 'runtime']) mkdirSync(join(self, name))
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(self, 'home'), TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'),
  NODE_COMPILE_CACHE: join(self, 'node-cache'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  DSH_HOME: join(self, 'runtime/dsh-home'), DSH_PM_ISOLATED_ROOT: join(self, 'runtime'),
  DSH_PM_FILE_ROOT: join(self, 'runtime/files'), A13_NATIVE_ROOT: join(self, 'native-input'),
  A13_OBSERVATIONS: join(self, 'observations.jsonl'),
}
save('vitest.config.mjs', `export default ${JSON.stringify({
  root: frozen, cacheDir: join(self, 'cache/vite'),
  test: { environment: 'node', cache: false, include: [`docs/testing/${prefix}-cases.test.tsx`],
    pool: 'forks', maxWorkers: 1, minWorkers: 1, testTimeout: 15000 },
}, null, 2)}\n`)
const executions = []
function execute(label, pattern) {
  const args = [join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(self, 'vitest.config.mjs'),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(self, `${label}.result.json`),
    '--testNamePattern', pattern]
  const started = new Date().toISOString()
  const result = spawnSync(process.execPath, args, {
    cwd: frozen, env, encoding: 'utf8', timeout: 180000, maxBuffer: 40 * 1024 * 1024,
  })
  save(`${label}.stdout.log`, result.stdout ?? '')
  save(`${label}.stderr.log`, result.stderr ?? '')
  const execution = { label, argv: [process.execPath, ...args], cwd: frozen, env, started,
    ended: new Date().toISOString(), originalExit: result.status, signal: result.signal, error: result.error?.message }
  save(`${label}.command.json`, execution)
  executions.push(execution)
  console.log(JSON.stringify({ label, originalExit: result.status, signal: result.signal }))
}
execute('fixture', '^FIXTURE')
if (executions[0].originalExit === 0) {
  execute('base', '^BASE')
  if (executions[1].originalExit === 0) execute('red', '^(AUTO|PROTOCOL)')
  else console.log('BLOCKED: 合法/既有控制不绿；不将设施失败冒充产品红')
} else console.log('BLOCKED: 原fixture或加载不合法；未执行产品红例')
const afterGuard = guard()
const dependencyAfter = Object.fromEntries(dependencyNames.map(name => [name, inventory(realpathSync(join(deps, name)))]))
const audit = {
  frozenSourceDrift: diff(beforeSource, inventory(join(pkg, 'src'))),
  liveSourceDrift: diff(beforeSource, inventory(join(source, 'src'))),
  nativeInputDrift: diff(beforeNative, inventory(native)),
  inputDrift: inputPaths.filter(path => beforeInputs[path] !== hash(readFileSync(join(repo, path)))),
  originalA11EvidenceDrift: diff(beforeOldEvidence, inventory(join(repo, oldEvidence))),
  dependencyDrift: dependencyNames.filter(name => JSON.stringify(dependencyBefore[name]) !== JSON.stringify(dependencyAfter[name])),
  watchedUnchanged: JSON.stringify(beforeGuard) === JSON.stringify(afterGuard),
  watchedBefore: beforeGuard, watchedAfter: afterGuard,
  boundary: '只证明这些源码/输入/依赖/缓存/lib监测根；未监控全机，不访问正式数据/凭据/服务',
}
save('audit.json', audit)
save('summary.json', { executions, audit, finishedAt: new Date().toISOString(), gui: 'NOT_RUN',
  productPass: false, result: executions.length === 3 ? '先行红例已执行；逐条审证' : 'BLOCKED' })
console.log(JSON.stringify(audit, (key, value) => key.startsWith('watched') && key !== 'watchedUnchanged' ? undefined : value))
process.exitCode = executions.some(execution => execution.originalExit !== 0)
  || audit.frozenSourceDrift.length || audit.inputDrift.length || audit.dependencyDrift.length
  || !audit.watchedUnchanged ? 1 : 0
