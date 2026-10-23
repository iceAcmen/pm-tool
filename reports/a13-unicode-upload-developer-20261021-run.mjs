// A13 开发自验：仅本前缀输出，无 install/build/lib/network/GUI/service/commit。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync, execFileSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = join(repo, 'packages/dsh-pm-tool')
const prefix = 'a13-unicode-upload-developer-20261021'
const out = join(repo, 'reports', `${prefix}-selftmp`)
const owned = [
  'src/client/shared/stage-client.ts', 'src/client/shared/stage-client.test.ts',
  'src/core/http/asset-route.ts', 'src/core/http/asset-route.test.ts',
]
const tests = [owned[1], owned[3]]
const related = [
  ...tests, 'src/core/file-assets.test.ts', 'src/core/file-staging.test.ts',
  'src/core/file-root.test.ts', 'src/core/file-promotion.test.ts', 'src/core/tasks-files-atomic.test.ts',
  'src/client/shared/asset-client.test.ts', 'src/client/shared/staged-lifecycle.test.ts',
  'src/client/shared/task-draft-materials-stage.test.tsx', 'src/core/http/preview-route.test.ts',
]
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
const save = (name, value) => writeFileSync(join(out, name), `${JSON.stringify(value, null, 2)}\n`)
function tree(dir) {
  if (!existsSync(dir)) return { absent: true }
  const result = {}
  function walk(path, key) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) result[key] = { symlink: readlinkSync(path) }
    else if (st.isDirectory()) {
      result[`${key}/`] = 'directory'
      for (const entry of readdirSync(path).sort()) walk(join(path, entry), `${key}/${entry}`)
    } else if (st.isFile()) result[key] = sha(readFileSync(path))
  }
  walk(dir, '.')
  return result
}
function watch() {
  return Object.fromEntries(['packages/dsh-pm-tool/lib', 'data', 'assets', 'files', 'backups',
    'packages/dsh-pm-tool/assets'].map(p => [p, tree(join(repo, p))]))
}
function source() {
  return { src: tree(join(pkg, 'src')), config: Object.fromEntries(
    ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts'].map(p => [p, sha(readFileSync(join(pkg, p)))])),
  }
}
const readonlyDeps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
function dependencyManifest(dir) {
  return Object.fromEntries(['vitest', 'vite', 'typescript', 'react', 'react-test-renderer', 'zod',
    '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage', '@deepseek-ai/dsh-storage-json',
    '@deepseek-ai/dsh-storage-domain'].map(p => {
    const path = join(dir, p)
    return [p, existsSync(path) ? { resolved: realpathSync(path), files: tree(realpathSync(path)) } : { absent: true }]
  }))
}
function freeze(name, deps = join(pkg, 'node_modules')) {
  const dir = join(out, name)
  assert.equal(existsSync(dir), false, '冻结目录不能覆盖')
  const before = source()
  mkdirSync(dir, { recursive: true })
  cpSync(join(pkg, 'src'), join(dir, 'src'), { recursive: true })
  for (const p of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']) cpSync(join(pkg, p), join(dir, p))
  symlinkSync(deps, join(dir, 'node_modules'), 'dir')
  assert.deepEqual(source(), before, '冻结期间源码/配置漂移')
  assert.deepEqual(tree(join(dir, 'src')), before.src)
  save(`${name}-manifest.json`, before)
  save(`${name}-dependencies.json`, { root: deps, manifest: dependencyManifest(deps) })
  return dir
}
function run(name, dir, args) {
  const tmp = join(out, `${name}-tmp`)
  mkdirSync(tmp, { recursive: true })
  const env = { ...process.env, TMPDIR: tmp, PM_FILE_ATOMIC_TMP: tmp,
    DSH_PM_ISOLATED_ROOT: join(tmp, 'isolated'), DSH_PM_FILE_ROOT: join(tmp, 'files') }
  // 不加载 profile/home，不查看或记录父进程凭据。
  for (const key of ['DSH_HOME', 'DEEPSEEK_API_KEY', 'DSH_DEV']) delete env[key]
  const result = spawnSync(process.execPath, args, { cwd: dir, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const output = { command: [process.execPath, ...args], cwd: dir, exitCode: result.status,
    signal: result.signal, error: result.error?.message, stdout: result.stdout, stderr: result.stderr }
  save(`${name}.json`, output)
  console.log(JSON.stringify({ name, exitCode: result.status, signal: result.signal,
    stdout: result.stdout?.slice(-2200), stderr: result.stderr?.slice(-1800) }, null, 2))
  return result.status
}
const vitest = join(pkg, 'node_modules/vitest/vitest.mjs')
const flags = ['run', '--no-cache', '--maxWorkers=1', '--minWorkers=1', '--reporter=verbose']
const mode = process.argv[2]
if (mode === 'prepare') {
  assert.equal(existsSync(out), false)
  mkdirSync(out, { recursive: true })
  const expert = json(join(repo, 'docs/testing/a13-unicode-upload-contract-20261021-red.json'))
  for (const p of owned) assert.equal(sha(readFileSync(join(pkg, p))), expert.candidate.sourceSha256Before[`packages/dsh-pm-tool/${p}`])
  save('before.json', {
    at: new Date().toISOString(), role: 'trae / A13 限定开发，非独立审签',
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
    originMainLocalRef: execFileSync('git', ['rev-parse', 'origin/main'], { cwd: repo, encoding: 'utf8' }).trim(),
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    watch: watch(), source: source(),
    expertContract: Object.fromEntries(['plan.md', 'cases.md', 'red.md', 'red.json', 'red.mjs'].map(p => [
      p, sha(readFileSync(join(repo, 'docs/testing', `a13-unicode-upload-contract-20261021-${p}`))),
    ])),
  })
  freeze('old')
  console.log('修前候选已冻结；共享 lib/指定业务根已记指纹。')
} else if (mode === 'red') {
  const old = join(out, 'old')
  for (const p of tests) cpSync(join(pkg, p), join(old, p))
  save('red-test-manifest.json', Object.fromEntries(tests.map(p => [p, sha(readFileSync(join(old, p)))])))
  const code = run('red', old, [vitest, ...flags, ...tests])
  assert.equal(code, 1, '旧产品配新回归应红，不得是设施异常')
} else if (mode === 'green') {
  const dir = freeze('new')
  process.exitCode = run('green-related', dir, [vitest, ...flags, ...related])
} else if (mode === 'green-r2') {
  assert.ok(existsSync(join(readonlyDeps, 'react-test-renderer/package.json')))
  const dir = freeze('new-r2', readonlyDeps)
  process.exitCode = run('green-related-r2', dir, [join(readonlyDeps, 'vitest/vitest.mjs'), ...flags, ...related])
} else if (mode === 'noemit') {
  process.exitCode = run('noemit', join(out, 'new'), [join(pkg, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false'])
} else if (mode === 'noemit-r2') {
  process.exitCode = run('noemit-r2', join(out, 'new-r2'), [join(readonlyDeps, 'typescript/bin/tsc'), '-p', 'tsconfig.json', '--noEmit', '--incremental', 'false'])
} else if (mode === 'finish') {
  const before = json(join(out, 'before.json'))
  const current = source()
  const frozen = json(join(out, 'new-r2-manifest.json'))
  assert.deepEqual(current, frozen, '释放前源码与冻结候选不一致')
  const deps = json(join(out, 'new-r2-dependencies.json'))
  assert.deepEqual(dependencyManifest(deps.root), deps.manifest, '只读依赖漂移')
  for (const p of tests) assert.equal(sha(readFileSync(join(out, 'old', p))), sha(readFileSync(join(out, 'new-r2', p))), '红绿测试字节不同')
  for (const name of ['green-related-r2', 'noemit-r2']) assert.equal(json(join(out, `${name}.json`)).exitCode, 0)
  assert.deepEqual(watch(), before.watch, '共享 lib/受监视根有漂移，须暂停并交 Main')
  const changed = Object.keys(current.src).filter(p => JSON.stringify(current.src[p]) !== JSON.stringify(before.source.src[p]))
  assert.deepEqual(changed.sort(), owned.map(p => p.replace(/^src/, '.')).sort(), '本任务只允许四产品文件')
  assert.deepEqual(current.config, before.source.config)
  for (const [p, hash] of Object.entries(before.expertContract)) assert.equal(
    sha(readFileSync(join(repo, 'docs/testing', `a13-unicode-upload-contract-20261021-${p}`))), hash)
  const patch = execFileSync('git', ['diff', 'HEAD', '--', ...owned.map(p => `packages/dsh-pm-tool/${p}`)], { cwd: repo, encoding: 'utf8' })
  writeFileSync(join(out, 'four-files.patch'), patch)
  save('release.json', { at: new Date().toISOString(), head: before.head, source: current,
    ownedSha256: Object.fromEntries(owned.map(p => [p, sha(readFileSync(join(pkg, p)))])),
    patchSha256: sha(patch), watchBeforeEqualsAfter: true, expertContractUnchanged: true,
    commands: ['red', 'green-related', 'noemit', 'green-related-r2', 'noemit-r2'].map(p => ({ name: p, exitCode: json(join(out, `${p}.json`)).exitCode })),
    scope: 'SOURCE/开发自验；独立 AUTO/GUI/PASS 由专家/Main 另行执行',
    released: true, sharedLibWritten: false, serversStarted: 0, guiOperations: 0, commits: 0 })
  const report = join(repo, 'reports', `${prefix}.md`)
  const runner = fileURLToPath(import.meta.url)
  const release = json(join(out, 'release.json'))
  const text = readFileSync(report, 'utf8')
  for (const hash of Object.values(release.ownedSha256)) assert.ok(text.includes(hash), '报告指纹与实际候选不一致')
  assert.ok(text.endsWith('\n'))
  assert.equal(/[\t ]+$/m.test(text), false)
  const index = { at: release.at, reportSha256: sha(text), runnerSha256: sha(readFileSync(runner)),
    evidenceRoot: `${prefix}-selftmp`, artifacts: tree(out) }
  writeFileSync(join(repo, 'reports', `${prefix}-index.json`), `${JSON.stringify(index, null, 2)}\n`)
  console.log(JSON.stringify({ ownedSha256: release.ownedSha256,
    evidenceEntries: Object.keys(index.artifacts).length, reportSha256: index.reportSha256 }, null, 2))
} else throw new Error('使用 prepare/red/green/noemit/green-r2/noemit-r2/finish')
