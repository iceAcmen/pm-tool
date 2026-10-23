import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a13-import-filename-independent-retest-20261021'
const round = process.argv[2]
assert.match(round ?? '', /^(old|new)-r[1-9]\d*$/)
const isNew = round.startsWith('new')
const self = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert(!existsSync(self), '不覆盖原件')
const frozen = join(self, 'frozen')
const live = join(repo, 'packages/dsh-pm-tool')
const old = join(repo, 'docs/testing/a13-import-filename-contract-20261021-selftmp/r3/frozen/packages/dsh-pm-tool')
const source = isNew ? live : old
const pkg = join(frozen, 'packages/dsh-pm-tool')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const native = '/private/tmp/pmtool-a11-native-import'
const expert = 'a13-import-filename-contract-20261021'
const developer = 'reports/a13-import-filename-developer-20261021-selftmp/new-r3'
const evidence = 'reports/all-pending-evidence-20261021/A11/materials/native-import'
const sha = value => createHash('sha256').update(value).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
function inventory(root, time = false) {
  const files = {}
  if (!existsSync(root)) return { exists: false, files }
  function walk(path) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) { files[relative(root, path)] = { link: realpathSync(path) }; return }
    if (st.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else files[relative(root, path) || '.'] = {
      sha256: sha(readFileSync(path)), bytes: st.size, ...(time ? { mtimeMs: st.mtimeMs } : {}),
    }
  }
  walk(root)
  return { exists: true, files }
}
const drift = (a, b) => [...new Set([...Object.keys(a.files), ...Object.keys(b.files)])]
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
const owned = ['client/views/tasks.tsx', 'commands/task.ts',
  'client/views/tasks-import-confirm.test.tsx', 'commands/task-import-filename.test.ts']
const released = json(join(repo, developer, 'candidate.json'))
const liveBefore = inventory(join(live, 'src'))
const sourceBefore = inventory(join(source, 'src'))
if (isNew) for (const path of owned) {
  assert.equal(liveBefore.files[path]?.sha256, released.source.files[path]?.sha256, `A13 owned已变，停止 ${path}`)
}
const dependencyNames = ['react', 'react-test-renderer', 'vitest', 'xlsx', 'typescript',
  '@deepseek-ai/dsh-commands', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain']
for (const name of dependencyNames) assert(existsSync(join(deps, name, 'package.json')), `缺依赖，不install ${name}`)
const dependencies = Object.fromEntries(dependencyNames.map(name => [name, inventory(realpathSync(join(deps, name)))]))
const inputs = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/plans/2026-10-21-import-filename-closure.md',
  ...['plan.md', 'cases.md', 'red.md', 'cases.test.tsx'].map(name => `docs/testing/${expert}-${name}`),
  `docs/testing/${prefix}-plan.md`, `docs/testing/${prefix}-safety.test.ts`,
  'reports/a13-import-filename-developer-20261021.md',
  `${developer}/candidate.json`,
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json',
  'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json',
]
const inputBefore = Object.fromEntries(inputs.map(path => [path, sha(readFileSync(join(repo, path)))]))
const nativeBefore = inventory(native)
const evidenceBefore = inventory(join(repo, evidence))
const protectedRoots = [
  join(live, 'lib'), join(dirname(deps), 'lib'),
  '/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/lib',
  ...[join(live, 'node_modules'), deps].flatMap(root => ['.vite', '.cache', '.vite-temp'].map(name => join(root, name))),
  join(old, 'src'), join(repo, developer, 'frozen/packages/dsh-pm-tool/src'),
]
const guard = () => Object.fromEntries(protectedRoots.map(path => [path, inventory(path, true)]))
const protectedBefore = guard()
function artifactCheck() {
  return ['A11', 'A12'].map(name => {
    const root = name === 'A11' ? '/private/tmp/pmtool-all-closure-20261021' : '/private/tmp/pmtool-a12-closure-20261021'
    const path = join(repo, 'reports/all-pending-evidence-20261021', name, 'candidate.json')
    const candidate = json(path)
    const checks = Object.entries(candidate.artifacts).map(([file, expected]) => ({
      file, expected, actual: existsSync(join(root, file)) ? sha(readFileSync(join(root, file))) : null,
    }))
    return { name, root, candidateSha256: sha(readFileSync(path)), checks,
      matchesOriginal: checks.every(item => item.expected === item.actual) }
  })
}
const artifactsBefore = artifactCheck()
assert(artifactsBefore.every(item => item.matchesOriginal), '旧lib与原认领不一致，停止')
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
assert.deepEqual(sourceBefore, inventory(join(pkg, 'src')), '自有冻结必须同字节')
assert.deepEqual(sourceBefore, inventory(join(source, 'src')), '冻结瞬间变化，停止')
symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
const patch = git(['diff', '--binary', 'HEAD', '--', 'packages/dsh-pm-tool'])
save('tracked.patch', patch)
const added = git(['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src'])
  .trim().split('\n').filter(Boolean)
const candidate = {
  role: '独立SOURCE/AUTO复验，非GUI/构建', round, at: new Date().toISOString(),
  baselineCommit: git(['rev-parse', 'HEAD']).trim(), sourceOrigin: source,
  trackedPatchSha256: sha(patch),
  patchBoundary: isNew ? '主树当前tracked diff；源码以完整自有冻结为准' : '主树diff仅上下文，旧源按专家r3冻结逐hash认领',
  sourceTreeSha256: sha(JSON.stringify(sourceBefore)), source: sourceBefore,
  configs: Object.fromEntries(['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
    .map(name => [name, sha(readFileSync(join(pkg, name)))])),
  newSourceFiles: added.map(path => ({ path, sha256: sha(readFileSync(join(repo, path))) })),
  owned: Object.fromEntries(owned.map(path => [path, { actual: sourceBefore.files[path]?.sha256 ?? null,
    released: released.source.files[path].sha256 }])),
  parallelChangesBeforeFreeze: isNew ? drift(released.source, liveBefore).filter(path => !owned.includes(path)) : [],
  inputs: inputBefore, native: nativeBefore, evidence: evidenceBefore,
  dependencies: Object.fromEntries(dependencyNames.map(name => [name, {
    root: realpathSync(join(deps, name)), version: json(join(deps, name, 'package.json')).version, files: dependencies[name],
  }])),
  environment: { node: process.version, executable: process.execPath, platform: process.platform,
    arch: process.arch, osRelease: os.release() }, frozen,
  noBuild: true, noInstall: true, noServices: true, noGui: true,
}
save('candidate.json', candidate)
for (const name of ['home', 'tmp', 'cache', 'node-cache', 'runtime']) mkdirSync(join(self, name))
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(self, 'home'), TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'),
  NODE_COMPILE_CACHE: join(self, 'node-cache'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  DSH_HOME: join(self, 'runtime/dsh-home'), DSH_PM_ISOLATED_ROOT: join(self, 'runtime'),
  DSH_PM_FILE_ROOT: join(self, 'runtime/files'), A13_NATIVE_ROOT: join(self, 'native-input'),
  A13_OBSERVATIONS: join(self, 'observations.jsonl'), A9_IMPORT_OBSERVATIONS: join(self, 'related-observations.jsonl'),
}
const testOptions = { environment: 'node', cache: false, pool: 'forks',
  maxWorkers: 1, minWorkers: 1, testTimeout: 15000 }
function config(name, root, include) {
  save(name, `export default ${JSON.stringify({ root, cacheDir: join(self, `cache/${name}`),
    test: { ...testOptions, include } }, null, 2)}\n`)
}
config('expert.config.mjs', frozen, [`docs/testing/${expert}-cases.test.tsx`])
config('safety.config.mjs', frozen, [`docs/testing/${prefix}-safety.test.ts`])
config('related.config.mjs', pkg, [
  'src/commands/task*.test.ts', 'src/client/views/tasks*.test.ts', 'src/client/views/tasks*.test.tsx',
  'src/core/csv-import*.test.ts', 'src/core/task-inline.test.ts', 'src/core/task-evidence-protocol.test.ts',
])
const executions = []
function execute(label, args, cwd) {
  const started = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', timeout: 240000, maxBuffer: 64 * 1024 * 1024 })
  save(`${label}.stdout.log`, result.stdout ?? '')
  save(`${label}.stderr.log`, result.stderr ?? '')
  const execution = { label, argv: [process.execPath, ...args], cwd, env, started,
    ended: new Date().toISOString(), originalExit: result.status, signal: result.signal, error: result.error?.message }
  save(`${label}.command.json`, execution)
  executions.push(execution)
  console.log(JSON.stringify({ label, originalExit: result.status, signal: result.signal }))
}
function vitest(label, cfg, pattern, filter) {
  execute(label, [join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(self, cfg),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(self, `${label}.result.json`),
    ...(pattern ? ['--testNamePattern', pattern] : []), ...(filter ? [filter] : [])], frozen)
}
vitest('fixture', 'expert.config.mjs', '^FIXTURE')
if (executions[0].originalExit === 0) {
  vitest('base', 'expert.config.mjs', '^BASE')
  if (executions[1].originalExit === 0) vitest('names-protocol', 'expert.config.mjs', '^(AUTO|PROTOCOL)')
}
if (isNew) {
  vitest('safety', 'safety.config.mjs')
  vitest('handler', 'related.config.mjs', '^A13', 'src/commands/task-import-filename.test.ts')
  vitest('related', 'related.config.mjs')
  execute('noemit', [join(deps, 'typescript/bin/tsc'), '-p', join(pkg, 'tsconfig.json'), '--noEmit', '--incremental', 'false'], pkg)
}
const liveAfter = inventory(join(live, 'src'))
const protectedAfter = guard()
const artifactsAfter = artifactCheck()
const audit = {
  frozenSourceDrift: drift(sourceBefore, inventory(join(pkg, 'src'))),
  sourceOriginDrift: drift(sourceBefore, inventory(join(source, 'src'))),
  liveOwnedDrift: owned.filter(path => liveBefore.files[path]?.sha256 !== liveAfter.files[path]?.sha256),
  liveParallelDrift: drift(liveBefore, liveAfter).filter(path => !owned.includes(path)),
  nativeDrift: drift(nativeBefore, inventory(native)),
  evidenceDrift: drift(evidenceBefore, inventory(join(repo, evidence))),
  inputDrift: inputs.filter(path => inputBefore[path] !== sha(readFileSync(join(repo, path)))),
  dependencyDrift: dependencyNames.filter(name =>
    JSON.stringify(dependencies[name]) !== JSON.stringify(inventory(realpathSync(join(deps, name))))),
  protectedUnchanged: JSON.stringify(protectedBefore) === JSON.stringify(protectedAfter),
  artifactsBefore, artifactsAfter,
  artifactsUnchanged: JSON.stringify(artifactsBefore) === JSON.stringify(artifactsAfter),
  protectedBefore, protectedAfter,
  boundary: '只证明列出的根；自有冻结与live owner分开。未读取正式数据/凭据或操作服务，不称全机零写',
}
save('audit.json', audit)
save('summary.json', { executions, audit, at: new Date().toISOString(),
  sourceDecision: 'PENDING_INDEPENDENT_REVIEW', gui: 'NOT_RUN', release: false })
const files = {}
function index(dir) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    const st = lstatSync(path)
    if (st.isSymbolicLink()) continue
    if (st.isDirectory()) index(path)
    else files[relative(self, path)] = { sha256: sha(readFileSync(path)), bytes: st.size }
  }
}
index(self)
save('evidence-index.json', { at: new Date().toISOString(), files, symlinksExcluded: true })
console.log(JSON.stringify({
  audit: Object.fromEntries(Object.entries(audit).filter(([key]) => !key.startsWith('protected') && !key.startsWith('artifactsBefore') && !key.startsWith('artifactsAfter'))),
  protectedUnchanged: audit.protectedUnchanged, sourceTreeSha256: candidate.sourceTreeSha256,
  indexedFiles: Object.keys(files).length,
}))
process.exitCode = executions.some(item => item.originalExit !== 0) || audit.frozenSourceDrift.length
  || audit.liveOwnedDrift.length || audit.nativeDrift.length || audit.evidenceDrift.length
  || audit.inputDrift.length || audit.dependencyDrift.length || !audit.protectedUnchanged || !audit.artifactsUnchanged ? 1 : 0
