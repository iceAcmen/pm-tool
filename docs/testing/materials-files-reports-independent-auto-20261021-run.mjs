// 冻结生产源码，仅 TS 编译自有副本；依赖只读，禁止整包 build。
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const rel = 'packages/dsh-pm-tool'
const input = path.join(repo, rel)
const frozen = '/private/tmp/pmtool-all-closure-20261021'
const prefix = 'materials-files-reports-independent-auto-20261021'
const own = fs.mkdtempSync('/private/tmp/' + prefix + '-')
const pkg = path.join(own, rel)
const out = path.join(repo, 'docs/testing', prefix + '-evidence', path.basename(own))
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const save = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n')
function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? e.name === 'node_modules' || e.name === '.git' ? [] : walk(path.join(dir, e.name))
    : e.isFile() ? [path.join(dir, e.name)] : [])
}
function hashes(dir) { return Object.fromEntries(walk(dir).sort().map(f => [path.relative(dir, f), sha(f)])) }
const before = hashes(path.join(input, 'src'))
const diff = spawnSync('git', ['diff', '--binary', '--', rel + '/src', rel + '/package.json', rel + '/pnpm-lock.yaml'],
  { cwd: repo, encoding: 'utf8' })
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim()
const unknown = spawnSync('git', ['ls-files', '--others', '--exclude-standard', rel + '/src'],
  { cwd: repo, encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean)
const isolated = hashes(path.join(frozen, rel, 'src'))
const sourceDiff = Object.keys(before).filter(f => before[f] !== isolated[f]).map(f => ({
  file: f, mainSha256: before[f], isolatedSha256: isolated[f] ?? null,
}))
fs.mkdirSync(pkg, { recursive: true })
fs.cpSync(path.join(input, 'src'), path.join(pkg, 'src'), { recursive: true })
const copiedSource = hashes(path.join(pkg, 'src'))
const captureRace = [...new Set([...Object.keys(before), ...Object.keys(copiedSource)])].filter(f => before[f] !== copiedSource[f])
if (captureRace.length) throw new Error('QA_CAPTURE_RACE 请全新冻结，不签不一致副本：' + captureRace.join(','))
fs.cpSync(path.join(input, 'scripts'), path.join(pkg, 'scripts'), { recursive: true })
fs.cpSync(path.join(input, 'locale'), path.join(pkg, 'locale'), { recursive: true })
for (const f of ['package.json', 'pnpm-lock.yaml', 'cordis.patch.yml']) fs.copyFileSync(path.join(input, f), path.join(pkg, f))
fs.symlinkSync(path.join(frozen, rel, 'node_modules'), path.join(pkg, 'node_modules'), 'dir')
for (const suffix of ['guard.mjs', 'worker.mjs', 'component.test.tsx', 'root.test.ts']) {
  fs.copyFileSync(path.join(repo, 'docs/testing', prefix + '-' + suffix), path.join(pkg, suffix))
}
save(path.join(pkg, 'tsconfig.qa.json'), {
  compilerOptions: { target: 'ES2022', lib: ['ES2023', 'DOM', 'DOM.Iterable'], module: 'NodeNext',
    moduleResolution: 'NodeNext', rootDir: 'src', outDir: 'lib', declaration: false,
    strict: true, skipLibCheck: true, esModuleInterop: true, types: ['node'], jsx: 'react-jsx' },
  include: ['src/**/*.ts', 'src/**/*.tsx'], exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
})
fs.writeFileSync(path.join(pkg, 'vitest.qa.config.mjs'),
  "export default { cacheDir: './.qa-vite', esbuild: { jsx: 'automatic' }, test: { environment: 'node', include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'component.test.tsx', 'root.test.ts'], fileParallelism: false, pool: 'forks', poolOptions: { forks: { singleFork: true } } } }\n")
for (const dir of ['home', 'tmp', 'runtime', 'runtime/data', 'runtime/files', 'runtime/backups', 'runtime/exports']) {
  fs.mkdirSync(path.join(own, dir), { recursive: true })
}
const env = {
  PATH: path.dirname(process.execPath) + ':/usr/bin:/bin:/usr/sbin:/sbin',
  HOME: path.join(own, 'home'), TMPDIR: path.join(own, 'tmp'),
  DSH_HOME: path.join(own, 'home/dsh'), DSH_PM_ISOLATED_ROOT: path.join(own, 'runtime'),
  DSH_PM_FILE_ROOT: path.join(own, 'runtime/files'), DSH_PM_BACKUP_DIR: path.join(own, 'runtime/backups'),
  PM_STORAGE_ROOT: path.join(own, 'runtime/data'), NODE_ENV: 'test',
  QA_OWN: own, QA_PACKAGE: pkg, QA_AUDIT: path.join(own, 'write-audit.ndjson'),
}
save(path.join(own, 'source-before.json'), before)
fs.writeFileSync(path.join(own, 'tracked.patch'), diff.stdout)
const depNames = ['typescript', 'vitest', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage',
  '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain', 'zod', 'react', 'react-test-renderer']
const deps = Object.fromEntries(depNames.map(name => {
  const dir = fs.realpathSync(path.join(pkg, 'node_modules', name))
  return [name, { realPath: dir, version: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'))).version,
    packageSha256: sha(path.join(dir, 'package.json')) }]
}))
const previous = '/private/tmp/materials-files-reports-independent-auto-20261021-uctDgH/packages/dsh-pm-tool'
if (sha(path.join(previous, 'src/core/file-assets.ts')) !== '340c6c1bce59baf5513fce21d1d00fe3b440ea48b9cffb0ceb7da63279f747f2') {
  throw new Error('QA_PREVIOUS_SOURCE_DRIFT 不执行旧根上层反例')
}
fs.copyFileSync(path.join(previous, 'lib/core/file-assets.js'), path.join(own, 'counterexample-file-assets.old.mjs'))
fs.copyFileSync(path.join(previous, 'src/core/file-assets.ts'), path.join(own, 'counterexample-file-assets.source.ts'))
env.QA_PREVIOUS_ASSET = path.join(own, 'counterexample-file-assets.old.mjs')
save(path.join(own, 'candidate.json'), { at: new Date().toISOString(), head,
  baselineCommit: '2a7603023bc54ef13d788e50069ee3fde4671bf3', kind: '主树未提交源码独立冻结/自有TS输出',
  trackedPatchSha256: sha(path.join(own, 'tracked.patch')),
  newFiles: Object.fromEntries(unknown.map(f => [f, sha(path.join(repo, f))])), sourceDiff,
  source: before, declarations: Object.fromEntries(['package.json', 'pnpm-lock.yaml', 'cordis.patch.yml'].map(f => [f, sha(path.join(pkg, f))])),
  dependencies: deps, a0LibUsed: false, a0LibReadOnlyManifest: hashes(path.join(frozen, rel, 'lib')),
  copiedSource, captureRace,
  ownPreviousCounterexample: { source: sha(path.join(previous, 'src/core/file-assets.ts')),
    output: sha(path.join(own, 'counterexample-file-assets.old.mjs')), path: env.QA_PREVIOUS_ASSET, usedOnlyForOldRootParentCounterexample: true },
  ownFacilities: Object.fromEntries(['guard.mjs', 'worker.mjs', 'component.test.tsx', 'root.test.ts'].map(f => [f, sha(path.join(pkg, f))])),
  own, package: pkg, node: process.version, os: os.release(), env,
})
const commands = []
function run(id, args, extra = {}) {
  const start = new Date().toISOString()
  const argv = ['--import', path.join(pkg, 'guard.mjs'), ...args]
  const r = spawnSync(process.execPath, argv, {
    cwd: pkg, env: { ...env, ...extra }, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024,
  })
  fs.writeFileSync(path.join(own, id + '.stdout.txt'), r.stdout ?? '')
  fs.writeFileSync(path.join(own, id + '.stderr.txt'), r.stderr ?? '')
  commands.push({ id, executable: process.execPath, argv, cwd: pkg, start, end: new Date().toISOString(),
    exit: r.status, signal: r.signal, error: r.error ? String(r.error) : null,
    stdoutSha256: sha(path.join(own, id + '.stdout.txt')), stderrSha256: sha(path.join(own, id + '.stderr.txt')) })
  console.log(`${id}: exit=${r.status}\n${r.stdout ?? ''}${r.stderr ?? ''}`)
  return r.status
}
const historical = path.join(own, 'historical')
fs.mkdirSync(historical, { recursive: true })
const oldArchive = spawnSync('git', ['archive', '--format=tar', 'v0.7.3', rel], { cwd: repo, maxBuffer: 32 * 1024 * 1024 })
const extracted = oldArchive.status === 0 ? spawnSync('/usr/bin/tar', ['-xf', '-', '-C', historical],
  { input: oldArchive.stdout }) : { status: -1 }
const oldPkg = path.join(historical, rel)
let oldCompiled
if (extracted.status === 0) {
  fs.symlinkSync(path.join(frozen, rel, 'node_modules'), path.join(oldPkg, 'node_modules'), 'dir')
  save(path.join(oldPkg, 'tsconfig.qa.json'), {
    compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext',
      rootDir: 'src', outDir: 'lib', strict: true, skipLibCheck: true, esModuleInterop: true, types: ['node'] },
    include: ['src/core/storage.ts', 'src/core/tasks.ts'],
  })
  oldCompiled = run('historical-core-compile', [path.join(pkg, 'node_modules/typescript/bin/tsc'), '-p', path.join(oldPkg, 'tsconfig.qa.json')])
  if (oldCompiled === 0) env.QA_OLD_LIB = path.join(oldPkg, 'lib')
  save(path.join(own, 'historical-source.json'), {
    tag: 'v0.7.3', tagObject: spawnSync('git', ['rev-parse', 'v0.7.3'], { cwd: repo, encoding: 'utf8' }).stdout.trim(),
    commit: spawnSync('git', ['rev-parse', 'v0.7.3^{}'], { cwd: repo, encoding: 'utf8' }).stdout.trim(),
    version: JSON.parse(fs.readFileSync(path.join(oldPkg, 'package.json'))).version,
    source: hashes(path.join(oldPkg, 'src')), ownLib: hashes(path.join(oldPkg, 'lib')), compileExit: oldCompiled,
    scope: '历史tag源码隔离core输出，复用当前只读依赖；不是原发布bundle/正式回滚试验',
  })
}
const compiled = run('own-ts-compile', [path.join(pkg, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.qa.json'])
save(path.join(own, 'own-lib-sha256.json'), hashes(path.join(pkg, 'lib')))
if (compiled === 0) {
  run('own-domain-probes', ['worker.mjs', 'domain'])
  if (fs.existsSync(path.join(own, 'reopen.json'))) run('own-new-process', ['worker.mjs', 'reopen'])
  // 复跑作者脚本是支持证据，独立逐 ID 签字只认 worker 的具体断言。
  for (const id of ['b2-materials', 'b3-bytes', 'b6-report']) run('existing-' + id, ['scripts/verify-' + id + '.mjs'])
}
run('meaningful-existing-tests', [path.join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.qa.config.mjs',
  'src/core/task-materials.test.ts', 'src/core/task-ops.test.ts', 'src/core/file-assets.test.ts',
  'src/core/file-staging.test.ts', 'src/core/file-backup.test.ts', 'src/core/file-root.test.ts',
  'src/core/progress-report.test.ts', 'src/core/progress-report-markdown-u5.test.ts',
  'src/core/backup-precheck.test.ts', 'src/client/shared/b2-ops.test.ts',
  'src/client/shared/staged-lifecycle.test.ts', 'src/client/shared/stage-client.test.ts',
  'src/client/shared/markdown.test.ts', 'src/client/shared/report-preview-client.test.ts'])
run('own-production-component', [path.join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.qa.config.mjs',
  '--reporter=default', '--reporter=json', '--outputFile=' + path.join(own, 'component-results.json'), 'component.test.tsx'])
run('own-root-ts', [path.join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.qa.config.mjs',
  '--reporter=default', '--reporter=json', '--outputFile=' + path.join(own, 'root-results.json'), 'root.test.ts'])
const after = hashes(path.join(input, 'src'))
const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(f => before[f] !== after[f])
save(path.join(own, 'source-after.json'), after)
save(path.join(own, 'commands.json'), commands)
const summary = { own, archive: out, node: process.version, changedSource: changed,
  sourceDrift: changed.map(f => ({ file: f, before: before[f], after: after[f] ?? null })),
  commands, scope: '领域/真实命令/隔离文件/组件 AUTO；不含真实宿主认证/GUI/全盘保护/整体PASS' }
save(path.join(own, 'execution.json'), summary)
fs.mkdirSync(out, { recursive: true })
for (const f of fs.readdirSync(own, { withFileTypes: true })) {
  if (f.isFile()) fs.copyFileSync(path.join(own, f.name), path.join(out, f.name))
}
if (fs.existsSync(path.join(own, 'fixtures'))) fs.cpSync(path.join(own, 'fixtures'), path.join(out, 'fixtures'), { recursive: true })
save(path.join(out, 'evidence-sha256.json'), hashes(out))
console.log(JSON.stringify(summary, null, 2))
process.exitCode = commands.some(c => c.exit !== 0) ? 1 : 0
