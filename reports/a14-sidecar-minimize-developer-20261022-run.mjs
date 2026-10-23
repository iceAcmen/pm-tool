import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a14-sidecar-minimize-developer-20261022'
const root = join(repo, 'reports', `${prefix}-selftmp`)
const expert = 'a14-sidecar-minimize-contract-20261022'
const expertRoot = join(repo, 'docs/testing')
const deps = '/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/node_modules'
const packagePath = 'packages/dsh-pm-tool'
const owned = ['src/client/panel.tsx', 'src/client/panel.css', 'src/client/sidecar-minimize-retention.test.tsx']
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const phase = process.argv[2]
const afterRound = process.argv[3] ?? 'after-r2'
assert.match(afterRound, /^after(?:-r[1-9]\d*)?$/)
assert(['before', 'after', 'sampling-prepare', 'sampling-run', 'sampling-before-prepare', 'sampling-before-run', 'release'].includes(phase))
function save(path, value) {
  const dest = resolve(root, path)
  assert(dest.startsWith(`${root}/`), '记录写根越界')
  mkdirSync(dirname(dest), { recursive: true, mode: 0o700 })
  writeFileSync(dest, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function git(args) {
  const result = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}
function inventory(base, times = false) {
  const result = {}
  if (!existsSync(base)) return result
  function walk(path) {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) return
    if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) walk(join(path, name))
    } else result[relative(base, path) || '.'] = {
      sha256: hash(readFileSync(path)), bytes: stat.size, ...(times ? { mtimeMs: stat.mtimeMs } : {}),
    }
  }
  walk(base)
  return result
}
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(key => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
function repositoryState() {
  const paths = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--',
    'AGENTS.md', 'README.md', 'docs', 'packages/dsh-pm-tool', 'launcher']).split('\0').filter(Boolean)
  return Object.fromEntries([...new Set(paths)].sort().filter(path => existsSync(join(repo, path))
    && !lstatSync(join(repo, path)).isSymbolicLink()).map(path => [path, {
    sha256: hash(readFileSync(join(repo, path))), bytes: lstatSync(join(repo, path)).size,
  }]))
}
const depNames = ['react', 'react-test-renderer', 'vitest', 'lucide-react', 'typescript']
function protection() {
  const roots = [
    join(repo, packagePath, 'lib'),
    '/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/lib',
    '/private/tmp/pmtool-a12-closure-20261021/packages/dsh-pm-tool/src',
    join(repo, 'reports/all-pending-evidence-20261021/A12'),
    join(repo, 'reports/all-pending-evidence-20261021/A13'),
    join(repo, 'reports/all-pending-evidence-20261021/A14/governance/mixed-r4'),
    ...depNames.map(name => realpathSync(join(deps, name))),
    ...[join(repo, packagePath, 'node_modules'), deps].flatMap(base =>
      ['.vite', '.cache', '.vite-temp'].map(name => join(base, name))),
  ]
  return Object.fromEntries(roots.map(path => [path, inventory(path, true)]))
}
function freeze(label, from) {
  const frozen = join(root, label, 'frozen')
  const pkg = join(frozen, packagePath)
  assert(!existsSync(frozen), '冻结目录不得覆盖')
  mkdirSync(pkg, { recursive: true, mode: 0o700 })
  for (const name of ['src', 'package.json', 'tsconfig.json'])
    cpSync(join(from, packagePath, name), join(pkg, name), { recursive: true })
  symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  const testPath = join(frozen, 'docs/testing', `${expert}-cases.test.tsx`)
  mkdirSync(dirname(testPath), { recursive: true })
  cpSync(join(expertRoot, `${expert}-cases.test.tsx`), testPath)
  assert.equal(hash(readFileSync(testPath)), json(join(root, 'start.json')).expertTestSha256)
  return { frozen, pkg, testPath }
}
function execute(label, executable, args, cwd, env) {
  const start = new Date().toISOString()
  const result = spawnSync(executable, args, { cwd, env, encoding: 'utf8',
    timeout: 180000, maxBuffer: 64 * 1024 * 1024 })
  save(`${label}.stdout.log`, result.stdout ?? '')
  save(`${label}.stderr.log`, result.stderr ?? '')
  const record = { label, executable, argv: [executable, ...args], cwd, env,
    start, end: new Date().toISOString(), originalExit: result.status,
    signal: result.signal, error: result.error?.message, subprocessReturned: true }
  save(`${label}.command.json`, record)
  console.log(JSON.stringify({ label, originalExit: result.status, signal: result.signal }))
  return record
}
function environment(label) {
  const self = join(root, label)
  for (const name of ['home', 'tmp', 'cache', 'runtime'])
    mkdirSync(join(self, name), { recursive: true, mode: 0o700 })
  return {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(self, 'home'), TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'),
    CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
    DSH_HOME: join(self, 'runtime'), A14_REPLAY_INPUT: join(root, 'replay-input.json'),
    A14_OBSERVATIONS: join(self, 'observations.jsonl'),
  }
}
function tests(label, frozen, include, cases) {
  const env = environment(label)
  const config = join(root, label, 'vitest.config.mjs')
  save(`${label}/vitest.config.mjs`, `export default ${JSON.stringify({
    root: frozen, cacheDir: join(root, label, 'cache/vite'),
    test: { environment: 'node', cache: false, include, pool: 'forks',
      maxWorkers: 1, minWorkers: 1, testTimeout: 15000 },
  }, null, 2)}\n`)
  return cases.map(([name, pattern]) => {
    const args = [join(deps, 'vitest/vitest.mjs'), 'run', '--config', config, '--no-cache',
      '--reporter=verbose', '--reporter=json', '--outputFile', join(root, label, `${name}.result.json`)]
    if (pattern) args.push('--testNamePattern', pattern)
    return execute(`${label}/${name}`, process.execPath, args, frozen, env)
  })
}
if (phase === 'before') {
  assert(!existsSync(root), '自有证据不得覆盖')
  const main = repositoryState()
  const protect = protection()
  const head = git(['rev-parse', 'HEAD']).trim()
  const r3 = join(expertRoot, `${expert}-selftmp/r3`)
  assert.equal(json(join(r3, 'summary.json')).executions.length, 4)
  const inputs = Object.fromEntries(['cases.test.tsx', 'run.mjs', 'plan.md', ''].map(suffix => {
    const path = suffix ? join(expertRoot, `${expert}-${suffix}`) : join(expertRoot, `${expert}.md`)
    return [path, hash(readFileSync(path))]
  }))
  save('start.json', {
    at: new Date().toISOString(), role: '限定开发SM01', head, originMain: git(['rev-parse', 'origin/main']).trim(),
    environment: { node: process.version, executable: process.execPath, os: os.release(), arch: os.arch() },
    dependencies: Object.fromEntries(depNames.map(name => [name, { root: realpathSync(join(deps, name)),
      version: json(join(deps, name, 'package.json')).version }])),
    expertTestSha256: inputs[join(expertRoot, `${expert}-cases.test.tsx`)], inputs,
    main, protect, owned: owned.map(path => `${packagePath}/${path}`),
    restrictions: '不install/build/lib/GUI/services/credentials/vendor/commit；仅开发自验，独立复验另派',
  })
  save('initial-tracked.patch', git(['diff', '--binary', 'HEAD', '--', 'packages/dsh-pm-tool']))
  save('initial-status.txt', git(['status', '--short', '--untracked-files=all']))
  save('replay-input.json', readFileSync(join(r3, 'replay-input.json'), 'utf8'))
  const { frozen, pkg } = freeze('before', repo)
  const source = inventory(join(pkg, 'src'))
  assert.deepEqual(source, inventory(join(repo, packagePath, 'src')), '复制期间源码漂移；须另轮认领')
  for (const path of ['src/client/panel.tsx', 'src/client/shared/drawers/sidecar-portal.tsx'])
    assert.equal(hash(readFileSync(join(pkg, path))),
      hash(readFileSync(join('/private/tmp/pmtool-a12-closure-20261021', packagePath, path))), '相关源码不等原r3')
  save('before/source.json', source)
  const runs = tests('before', frozen, [`docs/testing/${expert}-cases.test.tsx`],
    [['control', '^BASE'], ['SM-A01', 'SM-A01'], ['SM-A02', 'SM-A02'], ['SM-A03', 'SM-A03']])
  save('before/summary.json', { runs, sourceSha256: hash(JSON.stringify(source)), developerOnly: true })
  assert.deepEqual(runs.map(r => r.originalExit), [0, 1, 1, 1], '未复现原控制绿/三红')
} else if (phase === 'after') {
  const { frozen, pkg } = freeze(afterRound, join(root, 'before/frozen'))
  for (const path of owned) cpSync(join(repo, packagePath, path), join(pkg, path))
  const source = inventory(join(pkg, 'src'))
  const changed = diff(json(join(root, 'before/source.json')), source)
  assert.deepEqual(changed, owned.map(path => path.slice('src/'.length)).sort(), '修后冻结仅允许本批三文件变化')
  save(`${afterRound}/source.json`, source)
  for (const path of owned.slice(0, 2)) {
    const result = spawnSync('/usr/bin/git', ['diff', '--no-index', '--binary',
      join(root, 'before/frozen', packagePath, path), join(pkg, path)], { encoding: 'utf8' })
    assert.equal(result.status, 1, 'no-index差异的正常退出码应为1')
    save(`${afterRound}/sm01-${path.endsWith('tsx') ? 'panel' : 'css'}.patch`, result.stdout)
  }
  const runs = tests(afterRound, frozen, [`docs/testing/${expert}-cases.test.tsx`],
    [['control', '^BASE'], ['SM-A01', 'SM-A01'], ['SM-A02', 'SM-A02'], ['SM-A03', 'SM-A03']])
  const include = [
    `${packagePath}/src/client/panel*.test.*`,
    `${packagePath}/src/client/launch-handshake.test.ts`,
    `${packagePath}/src/client/sidecar-minimize-retention.test.tsx`,
    `${packagePath}/src/client/shared/drawers/gd-overlay-contract.test.ts`,
    `${packagePath}/src/client/shared/form-dirty.test.ts`,
    `${packagePath}/src/client/views/tasks-import-confirm.test.tsx`,
    `${packagePath}/src/core/copilot*.test.ts`,
    `${packagePath}/src/core/ask-copilot-b7.test.ts`,
    `${packagePath}/src/client/board/refresh-confirm.test.ts`,
    `${packagePath}/src/client/shared/contract-pilot.test.ts`,
  ]
  runs.push(...tests(`${afterRound}-regression`, frozen, include, [['components-bridge-confirm', null]]))
  runs.push(execute(`${afterRound}/noEmit`, process.execPath, [join(deps, 'typescript/bin/tsc'),
    '--project', join(pkg, 'tsconfig.json'), '--noEmit', '--incremental', 'false'],
    pkg, environment(`${afterRound}-noEmit`)))
  save(`${afterRound}/summary.json`, { runs, changed, sourceSha256: hash(JSON.stringify(source)), developerOnly: true })
  process.exitCode = runs.some(r => r.originalExit !== 0) ? 1 : 0
} else if (phase === 'sampling-prepare' || phase === 'sampling-before-prepare') {
  const before = phase === 'sampling-before-prepare'
  const label = before ? 'sampling-before-r1' : 'sampling-r1'
  const { frozen, pkg, testPath } = freeze(label, join(root, before ? 'before' : afterRound, 'frozen'))
  save(`${label}/preparation.json`, { frozen, testPath,
    originalTestSha256: hash(readFileSync(testPath)), source: inventory(join(pkg, 'src')),
    reason: 'SM-A03原例在模式切换卸载草稿控件后读取ReactTestInstance.props；仅修采样设施，不改动作/期望/产品',
  })
} else if (phase === 'sampling-run' || phase === 'sampling-before-run') {
  const before = phase === 'sampling-before-run'
  const label = before ? 'sampling-before-r1' : 'sampling-r1'
  const frozen = join(root, label, 'frozen')
  const testPath = join(frozen, 'docs/testing', `${expert}-cases.test.tsx`)
  const original = readFileSync(join(expertRoot, `${expert}-cases.test.tsx`), 'utf8')
  const current = readFileSync(testPath, 'utf8')
  const line = "const checks = f.m.root.findAll(node => node.type === 'input' && 'data-copilot-check' in node.props)"
  assert.equal(current, original.replace(line, `${line}.map(node => ({ props: { ...node.props } }))`),
    '采样副本只允许在原时点冻结控件props，动作与全部原期望必须不变')
  const patch = spawnSync('/usr/bin/git', ['diff', '--no-index',
    join(expertRoot, `${expert}-cases.test.tsx`), testPath], { encoding: 'utf8' })
  assert.equal(patch.status, 1)
  save(`${label}/sampling-only.patch`, patch.stdout)
  const runs = tests(label, frozen, [`docs/testing/${expert}-cases.test.tsx`],
    [['control', '^BASE'], ['SM-A01', 'SM-A01'], ['SM-A02', 'SM-A02'], ['SM-A03', 'SM-A03']])
  save(`${label}/summary.json`, { runs, originalTestSha256: hash(original),
    samplingTestSha256: hash(current), expectedAssertionsAndActionsUnchanged: true,
    literalOriginalA03Exit: 1, developerOnly: true, independentPass: false })
  const expected = before ? [0, 1, 1, 1] : [0, 0, 0, 0]
  assert.deepEqual(runs.map(r => r.originalExit), expected)
} else {
  const start = json(join(root, 'start.json'))
  const main = repositoryState()
  const protect = protection()
  const changed = diff(start.main, main)
  const ownPaths = owned.map(path => `${packagePath}/${path}`)
  const protectDrift = Object.fromEntries(Object.keys(protect).map(path =>
    [path, diff(start.protect[path], protect[path])]))
  save('release.json', {
    at: new Date().toISOString(), head: git(['rev-parse', 'HEAD']).trim(),
    main, protect, changed, ownedChanged: changed.filter(path => ownPaths.includes(path)),
    concurrentChanged: changed.filter(path => !ownPaths.includes(path)), protectDrift,
    ownCandidateMatchesMain: owned.every(path => hash(readFileSync(join(repo, packagePath, path)))
      === hash(readFileSync(join(root, afterRound, 'frozen', packagePath, path)))),
    expertOriginalMatches: hash(readFileSync(join(expertRoot, `${expert}-cases.test.tsx`))) === start.expertTestSha256,
    sourceFreezeDrift: diff(json(join(root, afterRound, 'source.json')),
      inventory(join(root, afterRound, 'frozen', packagePath, 'src'))),
    releasedTo: 'Main；正式SOURCE/AUTO及GUI独立复验另派，不自签PASS',
    noOwnedSubprocessRunning: true,
    boundary: '仅登记根的字节/mtime核验；并发A13采证差异不是本开发写入；不宣称全机或凭据/业务数据零污染',
  })
  save('final-tracked.patch', git(['diff', '--binary', 'HEAD', '--', 'packages/dsh-pm-tool']))
  console.log(JSON.stringify({ changed: changed.length, concurrentChanged: changed.filter(path => !ownPaths.includes(path)).length,
    protectDrift: Object.fromEntries(Object.entries(protectDrift).map(([path, list]) => [path, list.length])) }))
}
