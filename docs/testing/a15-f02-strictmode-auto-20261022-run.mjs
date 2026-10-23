import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  realpathSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a15-f02-strictmode-auto-20261022'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const root = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert(!existsSync(root), '原证不得覆盖，改用新的 rN')
const frozen = join(root, 'frozen')
const candidatePath = join(repo, 'reports/all-pending-evidence-20261021/A13/candidate-final.json')
const candidate = JSON.parse(readFileSync(candidatePath, 'utf8'))
assert.equal(candidate.tree, '/private/tmp/pmtool-a13-closure-20261022')
const source = candidate.tree
const dependency = realpathSync(join(source, 'packages/dsh-pm-tool/node_modules'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fingerprint = path => {
  const stat = lstatSync(path)
  const bytes = readFileSync(path)
  return { sha256: sha(bytes), bytes: bytes.length, mtimeMs: stat.mtimeMs }
}
function scan(base) {
  const result = {}
  const visited = new Set()
  function walk(path) {
    if (!existsSync(path)) return
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) {
      const actual = realpathSync(path)
      result[path] = { realpath: actual }
      walk(actual)
    } else if (stat.isDirectory()) {
      const actual = realpathSync(path)
      if (visited.has(actual)) return
      visited.add(actual)
      for (const name of readdirSync(path).sort()) walk(join(path, name))
    } else if (stat.isFile()) result[path] = fingerprint(path)
  }
  walk(base)
  return result
}
function diff(a, b) {
  return {
    added: Object.keys(b).filter(k => !(k in a)),
    removed: Object.keys(a).filter(k => !(k in b)),
    changed: Object.keys(a).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])),
  }
}
const empty = value => Object.values(value).every(values => values.length === 0)
const save = (name, value) => {
  const path = resolve(root, name)
  assert(path.startsWith(`${root}/`), '写根越界')
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`)
}
const inputs = [
  'AGENTS.md', 'docs/collaboration.md', 'docs/testing/remaining-journey-cases-20261021.md',
  'docs/testing/a15-file-fault-gui-review-20261022.md',
  'reports/all-pending-evidence-20261021/A13/candidate-final.json',
  'reports/all-pending-evidence-20261021/A13/product-tracked.patch',
  'reports/all-pending-evidence-20261021/A13/environment-final.json',
  ...['plan.md', 'run.mjs', 'cases.test.tsx'].map(s => `docs/testing/${prefix}-${s}`),
]
const records = []
mkdirSync(root, { recursive: true, mode: 0o700 })
const protection = () => {
  const result = {}
  for (const name of new Set([...Object.keys(candidate.sourceHashes), ...Object.keys(candidate.artifacts)])) {
    result[join(source, name)] = fingerprint(join(source, name))
  }
  for (const name of inputs) result[join(repo, name)] = fingerprint(join(repo, name))
  for (const name of ['task-draft-materials.tsx', 'task-draft-materials-stage.test.tsx']) {
    const path = join(repo, 'packages/dsh-pm-tool/src/client/shared', name)
    result[path] = fingerprint(path)
  }
  return result
}
const before = protection()
save('protected-before.json', before)
const depsBefore = scan(dependency)
save('dependencies-before.json', depsBefore)
const mainLibBefore = scan(join(repo, 'packages/dsh-pm-tool/lib'))
const mainCacheBefore = scan(join(repo, 'packages/dsh-pm-tool/node_modules/.vite'))
save('shared-before.json', { mainLibBefore, mainCacheBefore })
let freezeBefore
let setupError
let capability
try {
  for (const [name, expected] of Object.entries({ ...candidate.sourceHashes, ...candidate.artifacts })) {
    assert.equal(before[join(source, name)].sha256, expected, `A13 声明不匹配 ${name}`)
  }
  const material = 'packages/dsh-pm-tool/src/client/shared/task-draft-materials.tsx'
  assert.equal(candidate.sourceHashes[material], '66af8221d089a2ad65fa4d831be218c4a78d3299c23239cfaf750497c4edc2ae')
  assert.equal(before[join(repo, material)].sha256, candidate.sourceHashes[material])
  for (const name of Object.keys(candidate.sourceHashes)) {
    const target = join(frozen, name)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(source, name), target)
  }
  cpSync(join(source, 'packages/dsh-pm-tool/src'), join(frozen, 'packages/dsh-pm-tool/src'), { recursive: true })
  for (const name of inputs) {
    const target = join(frozen, name)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(repo, name), target)
  }
  for (const [name, expected] of Object.entries(candidate.sourceHashes)) {
    assert.equal(sha(readFileSync(join(frozen, name))), expected, `复制输入不一致 ${name}`)
  }
  freezeBefore = scan(join(frozen, 'packages/dsh-pm-tool/src'))
  save('frozen-source-before.json', freezeBefore)
  symlinkSync(dependency, join(frozen, 'node_modules'), 'dir')
  symlinkSync(dependency, join(frozen, 'packages/dsh-pm-tool/node_modules'), 'dir')
  const required = ['vitest', 'react', 'react-test-renderer', '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-storage', '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain']
  const versions = Object.fromEntries(required.map(name => {
    const path = join(dependency, name, 'package.json')
    assert(existsSync(path), `既有依赖缺失 ${name}，不安装`)
    return [name, JSON.parse(readFileSync(path, 'utf8')).version]
  }))
  const candidates = [dependency, join(dependency, '.pnpm/node_modules'),
    join(repo, 'packages/dsh-pm-tool/node_modules'),
    join(repo, 'packages/dsh-pm-tool/node_modules/.pnpm/node_modules')]
  const dom = candidates.map(base => ({
    base,
    jsdom: existsSync(join(base, 'jsdom/package.json')),
    reactDom: existsSync(join(base, 'react-dom/package.json'))
      ? JSON.parse(readFileSync(join(base, 'react-dom/package.json'), 'utf8')).version : null,
  }))
  capability = {
    react: versions.react, renderer: versions['react-test-renderer'], existingDom: dom,
    strictEffects: dom.some(d => d.jsdom && d.reactDom?.split('.')[0] === versions.react.split('.')[0])
      ? 'READY_REQUIRES_REAL_CREATEROOT_TEST' : 'BLOCKED',
    reason: '已有声明依赖及其传递依赖未具备 jsdom/兼容 ReactDOM createRoot；不安装、不用自建 DOM 或模型',
  }
  save('capability.json', capability)
  save('candidate.json', {
    baseline: candidate.baseline, tree: source, originalCandidateSha256: sha(readFileSync(candidatePath)),
    originalPatchSha256: sha(readFileSync(join(repo, inputs[5]))),
    sourceCount: Object.keys(candidate.sourceHashes).length, artifactsProtected: Object.keys(candidate.artifacts).length,
    frozen, dependency, versions, capability,
    environment: { node: process.version, executable: process.execPath, platform: process.platform,
      arch: process.arch, osRelease: os.release() },
    scope: 'A13 RA-F02 SOURCE/AUTO 切片；无 GUI/整门/发布签字；A16不进入产品身份',
  })
  const testFiles = [
    'packages/dsh-pm-tool/src/client/shared/task-draft-materials-stage.test.tsx',
    `docs/testing/${prefix}-cases.test.tsx`,
  ]
  save('vitest.config.mjs', `export default ${JSON.stringify({
    root: frozen, cacheDir: join(root, 'cache/vite'), esbuild: { jsx: 'automatic' },
    test: { environment: 'node', include: testFiles, pool: 'forks', maxWorkers: 1, minWorkers: 1,
      fileParallelism: false },
  }, null, 2)}\n`)
  const env = {
    PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
    HOME: join(root, 'home'), TMPDIR: join(root, 'tmp'), TMP: join(root, 'tmp'), TEMP: join(root, 'tmp'),
    XDG_CACHE_HOME: join(root, 'cache'), npm_config_cache: join(root, 'cache/npm'),
    NODE_COMPILE_CACHE: join(root, 'cache/node'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
    F02_EVIDENCE_ROOT: join(root, 'case-evidence'),
  }
  for (const path of ['home', 'tmp', 'cache', 'case-evidence']) mkdirSync(join(root, path))
  const execute = (label, file) => {
    const argv = [join(dependency, 'vitest/vitest.mjs'), 'run', file,
      '--config', join(root, 'vitest.config.mjs'), '--no-cache', '--reporter=default',
      '--reporter=json', '--outputFile', join(root, `${label}.result.json`)]
    const start = new Date().toISOString()
    const result = spawnSync(process.execPath, argv, {
      cwd: frozen, env, encoding: 'utf8', timeout: 180_000, maxBuffer: 30 * 1024 * 1024,
    })
    save(`${label}.stdout.log`, result.stdout ?? '')
    save(`${label}.stderr.log`, result.stderr ?? '')
    const record = { label, argv: [process.execPath, ...argv], cwd: frozen, env, start,
      end: new Date().toISOString(), exit: result.status, signal: result.signal, error: result.error?.message }
    records.push(record)
    save(`${label}.command.json`, record)
    console.log(JSON.stringify(record))
  }
  execute('existing-four', testFiles[0])
  execute('independent-supplement', testFiles[1])
} catch (error) {
  setupError = { message: error.message, stack: error.stack }
  save('setup-error.json', setupError)
  console.error(error)
} finally {
  const audit = {
    protected: diff(before, protection()),
    dependency: diff(depsBefore, scan(dependency)),
    mainLib: diff(mainLibBefore, scan(join(repo, 'packages/dsh-pm-tool/lib'))),
    mainCache: diff(mainCacheBefore, scan(join(repo, 'packages/dsh-pm-tool/node_modules/.vite'))),
    frozenSource: freezeBefore ? diff(freezeBefore, scan(join(frozen, 'packages/dsh-pm-tool/src'))) : null,
    watched: 'A13全声明source/artifacts、合同/归档/自有输入、主组件和原测试、依赖物理树含链接目标、main lib/.vite；不声称全HOME或正式业务根被监视',
  }
  save('protected-after.json', protection())
  save('dependencies-after.json', scan(dependency))
  save('audit.json', audit)
  save('summary.json', { records, setupError, capability, audit, endedAt: new Date().toISOString(),
    result: setupError ? 'BLOCKED_SETUP' : '按 reporter逐项审签；strict effects独立能力门不自动通过' })
  console.log(JSON.stringify({ audit, capability }))
  process.exitCode = setupError || records.some(r => r.exit !== 0)
    || Object.entries(audit).some(([key, value]) => key !== 'watched' && value && !empty(value)) ? 1 : 0
}
