/**
 * 独立先行 SOURCE/AUTO；仅写本前缀 selftmp。无 install/build/GUI/service。
 * 冻结真实源码，复用已安装依赖（只读链接），显式隔离 Vite/HOME/TMP 缓存。
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a13-u4-preplan-20261021'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const root = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert(!existsSync(root), '原证不得覆盖；使用新的 rN')
const dependency = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const source = join(repo, 'packages/dsh-pm-tool')
const frozen = join(root, 'frozen')
const pkg = join(frozen, 'packages/dsh-pm-tool')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const save = (name, value) => {
  const target = resolve(root, name)
  assert(target.startsWith(`${root}/`), '写根越界')
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 })
  writeFileSync(target, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`)
}
function manifest(base) {
  const output = {}
  if (!existsSync(base)) return output
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.isFile()) output[relative(base, file)] = hash(readFileSync(file))
    }
  }
  walk(base)
  return output
}
const git = args => {
  const result = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}
const inputs = [
  'AGENTS.md', 'docs/collaboration.md',
  'docs/testing/remaining-acceptance-register-20261021.md',
  'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/b4-u4-multisort-qa-20261020.md',
  'reports/a12-u4-scope-exploration-20261021.md',
  ...['package.json', 'pnpm-lock.yaml', 'vitest.config.ts', 'tsconfig.json'].map(n => `packages/dsh-pm-tool/${n}`),
  `docs/testing/${prefix}-cases.test.tsx`,
  `docs/testing/${prefix}-run.mjs`,
]
const dependencyNames = ['react', 'react-test-renderer', 'vitest', 'typescript', 'zod']
for (const name of dependencyNames) {
  assert(existsSync(join(dependency, name, 'package.json')), `已有依赖缺失 ${name}；记 BLOCKED，不安装`)
}
mkdirSync(root, { recursive: true, mode: 0o700 })
const before = manifest(join(source, 'src'))
const inputHashes = Object.fromEntries(inputs.map(p => [p, hash(readFileSync(join(repo, p)))]))
const depsBefore = Object.fromEntries(dependencyNames.map(n => [n, manifest(join(dependency, n))]))
const dependencyCacheBefore = manifest(join(dependency, '.vite'))
save('source-before.json', before)
save('dependency-before.json', depsBefore)
for (const path of inputs) {
  mkdirSync(dirname(join(frozen, path)), { recursive: true })
  cpSync(join(repo, path), join(frozen, path))
}
cpSync(join(source, 'src'), join(pkg, 'src'), { recursive: true })
assert.deepEqual(manifest(join(pkg, 'src')), before, '冻结与主树不一致')
assert.deepEqual(manifest(join(source, 'src')), before, '冻结时源发生变化；重认领，不测混合候选')
symlinkSync(dependency, join(frozen, 'node_modules'), 'dir')
symlinkSync(dependency, join(pkg, 'node_modules'), 'dir')
const testFile = `docs/testing/${prefix}-cases.test.tsx`
const config = join(root, 'vitest.config.mjs')
save('vitest.config.mjs', `export default ${JSON.stringify({
  root: frozen, cacheDir: join(root, 'cache/vite'),
  test: { environment: 'node', include: [testFile], pool: 'forks', maxWorkers: 1, minWorkers: 1 },
}, null, 2)}\n`)
const trackedPatch = git(['diff', '--binary', 'HEAD', '--', 'packages/dsh-pm-tool/src', 'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml'])
save('tracked.patch', trackedPatch)
const added = git(['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool/src']).trim().split('\n').filter(Boolean)
save('candidate.json', {
  recordedAt: new Date().toISOString(), baselineCommit: git(['rev-parse', 'HEAD']).trim(),
  productBase: '2a7603023bc54ef13d788e50069ee3fde4671bf3',
  trackedPatchSha256: hash(trackedPatch), inputs: inputHashes, sourceCount: Object.keys(before).length,
  newSourceFiles: Object.fromEntries(added.map(p => [p, hash(readFileSync(join(repo, p)))])),
  sourceManifestSha256: hash(JSON.stringify(before)), frozen, dependencyReadOnly: dependency,
  versions: Object.fromEntries(dependencyNames.map(n => [n, JSON.parse(readFileSync(join(dependency, n, 'package.json'), 'utf8')).version])),
  environment: { node: process.version, executable: process.execPath, platform: process.platform, arch: process.arch, osRelease: os.release() },
  scope: '独立测试细化/red准备；不验运行候选，不代表GUI/总门；Main先关unicode缺陷再认领U4',
  fixture: '生产 taskWriteSchema 验证的三任务/树 React fixture；非已落盘真实 F1',
})
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(root, 'home'), TMPDIR: join(root, 'tmp'),
  XDG_CACHE_HOME: join(root, 'cache'), npm_config_cache: join(root, 'cache/npm'),
  NODE_COMPILE_CACHE: join(root, 'node-cache'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
}
for (const name of ['home', 'tmp', 'cache', 'node-cache']) mkdirSync(join(root, name))
const records = []
function execute(label, pattern) {
  const argv = [
    join(dependency, 'vitest/vitest.mjs'), 'run', '--config', config,
    '--no-cache', '--reporter=default', '--reporter=json', '--outputFile', join(root, `${label}.result.json`),
    '--testNamePattern', pattern,
  ]
  const start = new Date().toISOString()
  const result = spawnSync(process.execPath, argv, {
    cwd: frozen, env, encoding: 'utf8', timeout: 180_000, maxBuffer: 30 * 1024 * 1024,
  })
  save(`${label}.stdout.log`, result.stdout ?? '')
  save(`${label}.stderr.log`, result.stderr ?? '')
  const record = { label, argv: [process.execPath, ...argv], cwd: frozen, env, start,
    end: new Date().toISOString(), exit: result.status, signal: result.signal, error: result.error?.message }
  save(`${label}.command.json`, record)
  records.push(record)
  console.log(JSON.stringify({ label, exit: result.status, signal: result.signal }))
}
execute('fixture', '^FIXTURE')
if (records[0].exit === 0) execute('red', '^(SOURCE|AUTO|BASE)')
else console.log('BLOCKED: fixture/设施未就绪；禁止将测试加载失败算产品红例')
const frozenAfter = manifest(join(pkg, 'src'))
const liveAfter = manifest(join(source, 'src'))
const depsAfter = Object.fromEntries(dependencyNames.map(n => [n, manifest(join(dependency, n))]))
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => a[k] !== b[k])
const audit = {
  frozenSourceDrift: diff(before, frozenAfter), liveSourceDrift: diff(before, liveAfter),
  inputDrift: inputs.filter(p => hash(readFileSync(join(repo, p))) !== inputHashes[p]),
  dependencyContentDrift: dependencyNames.filter(n => JSON.stringify(depsBefore[n]) !== JSON.stringify(depsAfter[n])),
  dependencyCacheDrift: diff(dependencyCacheBefore, manifest(join(dependency, '.vite'))),
  watched: '完整冻结/主src、固定输入、五依赖物理文件、依赖.vite；不声称监控全部home/正式资产',
}
save('source-after.json', liveAfter)
save('audit.json', audit)
save('summary.json', { records, audit, endedAt: new Date().toISOString(),
  result: records[0].exit === 0 ? '已执行先行红例，按逐断言结果评审；不是产品PASS' : 'BLOCKED' })
console.log(JSON.stringify(audit))
process.exitCode = records.some(r => r.exit !== 0) || audit.frozenSourceDrift.length
  || audit.inputDrift.length || audit.dependencyContentDrift.length || audit.dependencyCacheDrift.length ? 1 : 0
