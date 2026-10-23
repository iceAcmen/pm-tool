import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a13-import-filename-developer-20261021'
const round = process.argv[2]
assert.match(round ?? '', /^(old|new)-r[1-9]\d*$/)
const self = join(repo, 'reports', `${prefix}-selftmp`, round)
assert(!existsSync(self), '禁止覆盖原证')
const frozen = join(self, 'frozen')
const source = join(repo, 'packages/dsh-pm-tool')
const pkg = join(frozen, 'packages/dsh-pm-tool')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const native = '/private/tmp/pmtool-a11-native-import'
const expertPrefix = 'a13-import-filename-contract-20261021'
const evidence = 'reports/all-pending-evidence-20261021/A11/materials/native-import'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
function inventory(root, timestamps = false) {
  const files = {}
  if (!existsSync(root)) return { exists: false, files }
  function walk(path) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) { files[relative(root, path)] = { symlink: realpathSync(path) }; return }
    if (st.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else files[relative(root, path) || '.'] = {
      sha256: sha(readFileSync(path)), bytes: st.size, ...(timestamps ? { mtimeMs: st.mtimeMs } : {}),
    }
  }
  walk(root)
  return { exists: true, files }
}
const changes = (a, b) => [...new Set([...Object.keys(a.files), ...Object.keys(b.files)])]
  .filter(path => JSON.stringify(a.files[path]) !== JSON.stringify(b.files[path]))
function save(name, value) {
  const path = resolve(self, name)
  assert(path.startsWith(`${self}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`)
}
function git(args) {
  const result = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}
const dependencyNames = ['react', 'react-test-renderer', 'vitest', 'xlsx', 'typescript',
  '@deepseek-ai/dsh-commands', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain']
for (const name of dependencyNames) assert(existsSync(join(deps, name, 'package.json')), `依赖缺失 ${name}，不安装`)
const inputs = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/plans/2026-10-21-import-filename-closure.md',
  ...['plan.md', 'cases.md', 'red.md', 'cases.test.tsx'].map(name => `docs/testing/${expertPrefix}-${name}`),
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json',
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json',
]
const protectedRoots = [
  join(source, 'lib'), join(dirname(deps), 'lib'),
  '/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/lib',
  ...[join(source, 'node_modules'), deps].flatMap(root => ['.vite', '.cache', '.vite-temp'].map(name => join(root, name))),
]
const guard = () => Object.fromEntries(protectedRoots.map(path => [path, inventory(path, true)]))
const beforeGuard = guard()
const beforeSource = inventory(join(source, 'src'))
const beforeNative = inventory(native)
const beforeEvidence = inventory(join(repo, evidence))
const beforeInputs = Object.fromEntries(inputs.map(path => [path, sha(readFileSync(join(repo, path)))]))
const dependenciesBefore = Object.fromEntries(dependencyNames.map(name => [name, inventory(realpathSync(join(deps, name)))]))
mkdirSync(self, { recursive: true, mode: 0o700 })
cpSync(join(source, 'src'), join(pkg, 'src'), { recursive: true })
for (const name of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']) cpSync(join(source, name), join(pkg, name))
for (const path of inputs) {
  mkdirSync(dirname(join(frozen, path)), { recursive: true })
  cpSync(join(repo, path), join(frozen, path))
}
cpSync(join(repo, evidence), join(frozen, evidence), { recursive: true })
cpSync(native, join(self, 'native-input'), { recursive: true })
cpSync(join(repo, evidence, 'source-hashes.json'), join(self, 'native-input/source-hashes.json'))
assert.deepEqual(beforeSource, inventory(join(pkg, 'src')), '冻结源码不一致')
assert.deepEqual(beforeSource, inventory(join(source, 'src')), '冻结期间源码变化')
symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
const patch = git(['diff', '--binary', 'HEAD', '--', 'packages/dsh-pm-tool'])
save('tracked.patch', patch)
const added = git(['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src'])
  .trim().split('\n').filter(Boolean)
save('candidate.json', {
  role: '限定开发自验，非独立审签', round, at: new Date().toISOString(),
  baselineCommit: git(['rev-parse', 'HEAD']).trim(),
  trackedPatchSha256: sha(patch), sourceTreeSha256: sha(JSON.stringify(beforeSource)), source: beforeSource,
  newSourceFiles: added.map(path => ({ path, sha256: sha(readFileSync(join(repo, path))) })),
  inputs: beforeInputs, nativeInput: beforeNative, originalEvidence: beforeEvidence,
  dependencies: Object.fromEntries(dependencyNames.map(name => [name, {
    physicalRoot: realpathSync(join(deps, name)),
    version: JSON.parse(readFileSync(join(deps, name, 'package.json'), 'utf8')).version,
    files: dependenciesBefore[name],
  }])),
  environment: { node: process.version, executable: process.execPath, platform: process.platform,
    arch: process.arch, osRelease: os.release() },
  frozen, noInstall: true, noBuild: true, noServices: true, noGui: true,
})
for (const name of ['home', 'tmp', 'cache', 'node-cache', 'runtime']) mkdirSync(join(self, name))
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(self, 'home'), TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'),
  NODE_COMPILE_CACHE: join(self, 'node-cache'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  DSH_HOME: join(self, 'runtime/dsh-home'), DSH_PM_ISOLATED_ROOT: join(self, 'runtime'),
  DSH_PM_FILE_ROOT: join(self, 'runtime/files'), A13_NATIVE_ROOT: join(self, 'native-input'),
  A13_OBSERVATIONS: join(self, 'observations.jsonl'),
}
const commonTest = { environment: 'node', cache: false, pool: 'forks',
  maxWorkers: 1, minWorkers: 1, testTimeout: 15000 }
save('expert.config.mjs', `export default ${JSON.stringify({
  root: frozen, cacheDir: join(self, 'cache/expert'),
  test: { ...commonTest, include: [`docs/testing/${expertPrefix}-cases.test.tsx`] },
}, null, 2)}\n`)
save('related.config.mjs', `export default ${JSON.stringify({
  root: pkg, cacheDir: join(self, 'cache/related'),
  test: { ...commonTest, include: [
    'src/commands/task*.test.ts',
    'src/client/views/tasks*.test.ts', 'src/client/views/tasks*.test.tsx',
    'src/core/csv-import*.test.ts', 'src/core/task-inline.test.ts', 'src/core/task-evidence-protocol.test.ts',
  ] },
}, null, 2)}\n`)
const executions = []
function execute(label, args, cwd) {
  const started = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', timeout: 240000, maxBuffer: 48 * 1024 * 1024 })
  save(`${label}.stdout.log`, result.stdout ?? '')
  save(`${label}.stderr.log`, result.stderr ?? '')
  const execution = { label, argv: [process.execPath, ...args], cwd, env, started,
    ended: new Date().toISOString(), originalExit: result.status, signal: result.signal, error: result.error?.message }
  save(`${label}.command.json`, execution)
  executions.push(execution)
  console.log(JSON.stringify({ label, originalExit: result.status, signal: result.signal }))
}
function vitest(label, config, pattern) {
  execute(label, [join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(self, config),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(self, `${label}.result.json`),
    ...(label === 'handler' ? ['src/commands/task-import-filename.test.ts'] : []),
    ...(pattern ? ['--testNamePattern', pattern] : [])], frozen)
}
vitest('fixture', 'expert.config.mjs', '^FIXTURE')
if (executions[0].originalExit === 0) {
  vitest('base', 'expert.config.mjs', '^BASE')
  if (executions[1].originalExit === 0) vitest('names-protocol', 'expert.config.mjs', '^(AUTO|PROTOCOL)')
}
vitest('handler', 'related.config.mjs', '^A13')
if (round.startsWith('new')) {
  vitest('related', 'related.config.mjs')
  execute('noemit', [join(deps, 'typescript/bin/tsc'), '-p', join(pkg, 'tsconfig.json'), '--noEmit', '--incremental', 'false'], pkg)
}
const audit = {
  frozenSourceDrift: changes(beforeSource, inventory(join(pkg, 'src'))),
  liveSourceDrift: changes(beforeSource, inventory(join(source, 'src'))),
  nativeInputDrift: changes(beforeNative, inventory(native)),
  originalEvidenceDrift: changes(beforeEvidence, inventory(join(repo, evidence))),
  inputDrift: inputs.filter(path => beforeInputs[path] !== sha(readFileSync(join(repo, path)))),
  dependencyDrift: dependencyNames.filter(name =>
    JSON.stringify(dependenciesBefore[name]) !== JSON.stringify(inventory(realpathSync(join(deps, name))))),
  protectedUnchanged: JSON.stringify(beforeGuard) === JSON.stringify(guard()),
  protectedBefore: beforeGuard, protectedAfter: guard(),
  boundary: '仅列出的源码、合同、原件、依赖、lib/cache监测根；不称全机零写，不读取正式数据/凭据/服务',
}
save('audit.json', audit)
save('summary.json', { executions, audit, finishedAt: new Date().toISOString(),
  independentSource: 'NOT_SIGNED', gui: 'NOT_RUN', release: false })
console.log(JSON.stringify(audit, (key, value) => key.startsWith('protected') && key !== 'protectedUnchanged' ? undefined : value))
process.exitCode = executions.some(item => item.originalExit !== 0)
  || audit.frozenSourceDrift.length || audit.inputDrift.length || audit.dependencyDrift.length
  || !audit.protectedUnchanged ? 1 : 0
