/**
 * 开发侧原 F2 红绿证据采集；自有完整 src 副本、依赖只读软链、私有缓存。
 * 不构建、不安装、不操作 GUI/服务、不给独立 PASS；Main 负责整包门。
 */
import { createHash } from 'node:crypto'
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  statSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a11-overview-done-card-developer-20261021'
const phase = process.argv[2]
if (!['red', 'green', 'regression'].includes(phase)) throw new Error('参数须为 red、green 或 regression')
const evidence = join(repo, 'reports', `${prefix}-evidence`, phase)
if (existsSync(evidence)) throw new Error(`保留旧证据，拒绝覆盖：${evidence}`)
mkdirSync(evidence, { recursive: true })
const tmp = mkdtempSync(`/private/tmp/${prefix}-${phase}-`)
const pkg = join(tmp, 'packages/dsh-pm-tool')
const source = join(repo, 'packages/dsh-pm-tool')
const dependency = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const fixtureRelative = 'docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5'
mkdirSync(pkg, { recursive: true })
cpSync(join(source, 'src'), join(pkg, 'src'), { recursive: true })
for (const name of ['package.json', 'tsconfig.json']) cpSync(join(source, name), join(pkg, name))
cpSync(join(repo, 'reports', `${prefix}-vitest.config.mts`), join(pkg, 'vitest.config.mts'))
mkdirSync(join(tmp, fixtureRelative), { recursive: true })
for (const name of ['f2.json', 'f2-backup.json']) {
  cpSync(join(repo, fixtureRelative, name), join(tmp, fixtureRelative, name))
}
symlinkSync(dependency, join(pkg, 'node_modules'), 'dir')
for (const name of ['private-home', 'private-cache', 'private-tmp']) {
  mkdirSync(join(pkg, name), { recursive: true })
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
function fingerprint(path) {
  const s = statSync(path)
  return { sha256: sha(readFileSync(path)), bytes: s.size, mtimeMs: s.mtimeMs }
}
function files(root) {
  return readdirSync(root, { withFileTypes: true })
    .flatMap(entry => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)])
    .sort()
}
const manifest = Object.fromEntries(files(join(pkg, 'src'))
  .map(path => [relative(pkg, path), fingerprint(path)]))
writeFileSync(join(evidence, 'sourcehash.json'), `${JSON.stringify(manifest, null, 2)}\n`)
const overview = 'src/client/views/overview.tsx'
cpSync(join(pkg, overview), join(evidence, 'overview.tsx'))
const newTest = 'src/client/views/overview-done-card.test.tsx'
cpSync(join(pkg, newTest), join(evidence, 'overview-done-card.test.tsx'))
const git = args => spawnSync('git', args, { cwd: repo, encoding: 'utf8' })
const head = git(['rev-parse', 'HEAD']).stdout.trim()
const tracked = git(['diff', '--', `packages/dsh-pm-tool/${overview}`])
writeFileSync(join(evidence, 'tracked-overview.patch'), tracked.stdout)
const metadata = {
  phase, repo, head, tmp, pkg, dependency,
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  fixtures: Object.fromEntries(['f2.json', 'f2-backup.json']
    .map(name => [name, fingerprint(join(tmp, fixtureRelative, name))])),
  dependencies: Object.fromEntries(['react', 'react-test-renderer', 'vitest']
    .map(name => [name, JSON.parse(readFileSync(join(dependency, name, 'package.json'), 'utf8')).version])),
  newFiles: { [`packages/dsh-pm-tool/${newTest}`]: fingerprint(join(pkg, newTest)) },
  trackedDiff: { argv: ['git', 'diff', '--', `packages/dsh-pm-tool/${overview}`],
    exit: tracked.status, sha256: sha(tracked.stdout) },
  limits: ['开发侧组件自验', '无build/install/GUI/service/credentials/commit', '不代独立PASS或整包门'],
}
if (phase !== 'red') {
  const baseline = join(repo, 'reports', `${prefix}-evidence/red/overview.tsx`)
  const delta = spawnSync('/usr/bin/diff', ['-u', baseline, join(pkg, overview)], { encoding: 'utf8' })
  writeFileSync(join(evidence, 'owned-overview.patch'), delta.stdout)
  metadata.ownedDiff = { exit: delta.status, sha256: sha(delta.stdout) }
}
writeFileSync(join(evidence, 'candidate.json'), `${JSON.stringify(metadata, null, 2)}\n`)
const tests = phase === 'red'
  ? [newTest, '-t', '原 F2：']
  : [newTest, 'src/client/views/objective-consumers.test.tsx', 'src/client/views/overview-contract.test.ts']
if (phase === 'regression') tests.push(
  'src/client/panel-checklist-toggle.test.tsx',
  'src/core/progress-meta.test.ts', 'src/core/progress-clamp.test.ts',
)
for (const test of tests.filter(path => /\.test\.tsx?$/.test(path))) {
  if (!existsSync(join(pkg, test))) throw new Error(`缺少预定测试文件：${test}`)
}
const argv = [
  join(dependency, 'vitest/vitest.mjs'), 'run', '--config', join(pkg, 'vitest.config.mts'),
  ...tests, '--maxWorkers=1', '--minWorkers=1', '--no-cache',
  '--reporter=default', '--reporter=json', '--outputFile', join(evidence, 'vitest-result.json'),
]
const start = new Date().toISOString()
const result = spawnSync(process.execPath, argv, {
  cwd: pkg,
  env: { ...process.env, HOME: join(pkg, 'private-home'), TMPDIR: join(pkg, 'private-tmp'),
    XDG_CACHE_HOME: join(pkg, 'private-cache'), npm_config_cache: join(pkg, 'private-cache/npm') },
  encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 120_000,
})
writeFileSync(join(evidence, 'stdout.log'), result.stdout ?? '')
writeFileSync(join(evidence, 'stderr.log'), result.stderr ?? '')
writeFileSync(join(evidence, 'command.json'), `${JSON.stringify({
  executable: process.execPath, argv, cwd: pkg, start, end: new Date().toISOString(),
  exit: result.status, signal: result.signal, error: result.error?.message,
}, null, 2)}\n`)
const drift = Object.entries(manifest).filter(([path, record]) =>
  fingerprint(join(pkg, path)).sha256 !== record.sha256).map(([path]) => path)
writeFileSync(join(evidence, 'source-after.json'), `${JSON.stringify({ drift }, null, 2)}\n`)
console.log(JSON.stringify({ phase, tmp, evidence, exit: result.status, drift, versions: metadata.dependencies }))
console.log(result.stdout ?? '')
console.error(result.stderr ?? '')
process.exitCode = result.status ?? 1
