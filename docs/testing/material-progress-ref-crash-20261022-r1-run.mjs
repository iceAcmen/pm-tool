import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'material-progress-ref-crash-20261022-r1'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const own = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert(!existsSync(own), '原轮不可覆盖，改用新轮')
const source = '/private/tmp/pmtool-u4-closure-20261022-r2/packages/dsh-pm-tool'
const domSource = '/private/tmp/pmtool-f02-dom-deps-20261022'
const frozen = join(own, 'frozen/packages/dsh-pm-tool')
const domCopy = join(own, 'dom-deps')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
function scan(root) {
  const result = {}
  function walk(p, rel = '') {
    const s = lstatSync(p)
    if (s.isSymbolicLink()) result[rel] = { link: readlinkSync(p), realpath: realpathSync(p) }
    else if (s.isDirectory()) {
      for (const n of readdirSync(p).sort()) walk(join(p, n), rel ? `${rel}/${n}` : n)
    } else if (s.isFile()) {
      const b = readFileSync(p)
      result[rel] = { bytes: b.length, sha256: sha(b), dev: s.dev, ino: s.ino }
    } else throw new Error(`不支持输入类型 ${p}`)
  }
  walk(root)
  return result
}
const byteView = data => Object.fromEntries(Object.entries(data).map(([k, v]) =>
  [k, v.link ? { link: v.link } : { bytes: v.bytes, sha256: v.sha256 }]))
function compare(a, b) {
  return { added: Object.keys(b).filter(k => !(k in a)),
    removed: Object.keys(a).filter(k => !(k in b)),
    changed: Object.keys(a).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])) }
}
const empty = d => Object.values(d).every(v => v.length === 0)
mkdirSync(own, { recursive: true, mode: 0o700 })
function save(name, value) {
  const p = resolve(own, name)
  assert(p.startsWith(`${own}/`), '只写自有前缀')
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const packageEntries = readdirSync(source).filter(n =>
  n === 'src' || n === 'scripts' || n === 'locale' || lstatSync(join(source, n)).isFile())
const protectedRoots = Object.fromEntries([
  ['u4-src', join(source, 'src')], ['u4-scripts', join(source, 'scripts')],
  ['u4-deps', join(source, 'node_modules')], ['u4-lib', join(source, 'lib')],
  ['dom-deps', join(domSource, 'node_modules')],
  ['dom-lock', join(domSource, 'package-lock.json')],
  ['main-lib', join(repo, 'packages/dsh-pm-tool/lib')],
].map(([name, root]) => [name, { root, before: scan(root) }]))
save('protected-before.json', protectedRoots)
const related = ['client/shared/task-draft-materials.tsx', 'client/shared/b2-ops.ts',
  'client/shared/stage-client.ts', 'client/shared/staged-lifecycle.ts',
  'core/tasks.ts', 'core/task-materials.ts', 'core/http/asset-route.ts']
const relatedBefore = Object.fromEntries(related.map(n =>
  [n, scan(join(repo, 'packages/dsh-pm-tool/src', n))['']]))
save('main-related-before.json', relatedBefore)
let execution
let error
try {
  assert.equal(sha(readFileSync(join(domSource, 'package-lock.json'))),
    '15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973')
  mkdirSync(frozen, { recursive: true })
  for (const n of packageEntries) cpSync(join(source, n), join(frozen, n), { recursive: true })
  cpSync(join(source, 'node_modules'), join(frozen, 'node_modules'),
    { recursive: true, dereference: false, verbatimSymlinks: true })
  mkdirSync(domCopy, { recursive: true })
  for (const n of ['node_modules', 'package.json', 'package-lock.json']) {
    cpSync(join(domSource, n), join(domCopy, n), { recursive: true, dereference: false, verbatimSymlinks: true })
  }
  const ownership = []
  for (const [label, original, copy] of [
    ['u4-deps', join(source, 'node_modules'), join(frozen, 'node_modules')],
    ['dom-deps', join(domSource, 'node_modules'), join(domCopy, 'node_modules')],
  ]) {
    const a = scan(original), b = scan(copy)
    assert.deepEqual(byteView(a), byteView(b), `${label}复制字节差异`)
    const shared = Object.keys(b).filter(k => !b[k].link && a[k].dev === b[k].dev && a[k].ino === b[k].ino)
    const external = Object.keys(b).filter(k => b[k].link && !b[k].realpath.startsWith(`${copy}/`))
    ownership.push({ label, files: Object.values(b).filter(v => !v.link).length,
      links: Object.values(b).filter(v => v.link).length, sharedInodes: shared, externalLinks: external })
    assert.deepEqual(shared, [], '禁止硬链接共享依赖')
    assert.deepEqual(external, [], '禁止外链依赖')
    save(`${label}-copy-manifest.json`, b)
  }
  save('dependency-ownership.json', ownership)
  const candidateFiles = {}
  for (const n of packageEntries) {
    const a = scan(join(source, n)), b = scan(join(frozen, n))
    assert.deepEqual(byteView(a), byteView(b), `冻结输入不同 ${n}`)
    Object.assign(candidateFiles, Object.fromEntries(Object.entries(byteView(b)).map(([k, v]) =>
      [k ? `${n}/${k}` : n, v])))
  }
  const provenance = ['candidate-evidence-manifest.json', 'delivery-boundary.json', 'parent-increment.patch',
    'increment-files.txt', 'increment-files.sha256']
  for (const n of provenance) cpSync(join(repo, 'reports/all-pending-evidence-20261021/U4', n), join(own, n))
  const boundary = JSON.parse(readFileSync(join(own, 'delivery-boundary.json')))
  save('candidate.json', { candidate: 'U4r2-必要红源级副本，不冒新主树或GUI激活',
    baselineCommit: boundary.baselineCommit, baselineSource: 'U4/delivery-boundary.json (只读引用，未执行Git)',
    source, frozen, version: JSON.parse(readFileSync(join(frozen, 'package.json'))).version,
    inputHashes: candidateFiles, mainRelatedBefore: relatedBefore,
    sameRelatedBytes: Object.fromEntries(related.map(n => [n,
      candidateFiles[`src/${n}`].sha256 === relatedBefore[n].sha256])),
    excluded: ['lib', 'artifacts', 'coverage', 'backup', 'backups', 'Main在途GUI证据'] })
  const testName = `${prefix}-cases.test.tsx`
  cpSync(join(repo, 'docs/testing', testName), join(frozen, testName))
  save('test-original.json', { path: join(repo, 'docs/testing', testName),
    sha256: sha(readFileSync(join(frozen, testName))) })
  const env = {
    PATH: dirname(process.execPath), HOME: join(own, 'home'), TMPDIR: join(own, 'tmp'),
    XDG_CACHE_HOME: join(own, 'cache'), npm_config_cache: join(own, 'cache/npm'),
    DSH_HOME: join(own, 'dsh-home'), QA_EVIDENCE_ROOT: join(own, 'observations'),
    CI: '1', LANG: 'zh_CN.UTF-8', TZ: 'UTC', NODE_ENV: 'development',
  }
  for (const p of [env.HOME, env.TMPDIR, env.XDG_CACHE_HOME, env.DSH_HOME, env.QA_EVIDENCE_ROOT])
    mkdirSync(p, { recursive: true, mode: 0o700 })
  const probeArg = "require('./node_modules/.pnpm/node_modules/react-dom/client')"
  const probe = spawnSync(process.execPath, ['-e', probeArg], { cwd: frozen, env, encoding: 'utf8' })
  save('facility-react-dom19.json', { argv: [process.execPath, '-e', probeArg], cwd: frozen,
    exit: probe.status, stdout: probe.stdout, stderr: probe.stderr,
    conclusion: probe.status ? 'BLOCKED_FACILITY_VERSION_MISMATCH，不计产品红' : 'IMPORT_ONLY' })
  const aliases = {}
  for (const [name, file] of [['react', 'react/index.js'], ['react/jsx-runtime', 'react/jsx-runtime.js'],
    ['react/jsx-dev-runtime', 'react/jsx-dev-runtime.js'], ['react-dom', 'react-dom/index.js'],
    ['react-dom/client', 'react-dom/client.js'], ['react-dom/test-utils', 'react-dom/test-utils.js'],
    ['jsdom', 'jsdom/lib/api.js']]) aliases[name] = join(domCopy, 'node_modules', file)
  const config = {
    root: frozen, cacheDir: join(own, 'cache/vite'), esbuild: { jsx: 'automatic' },
    resolve: { alias: Object.entries(aliases).sort(([a], [b]) => b.length - a.length)
      .map(([find, replacement]) => ({ find, replacement })) },
    test: { environment: 'node', include: [testName], pool: 'forks',
      poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1,
      fileParallelism: false, testTimeout: 15000, hookTimeout: 15000 },
  }
  save('vitest.config.mjs', `export default ${JSON.stringify(config, null, 2)}\n`)
  const cli = join(frozen, 'node_modules/vitest/vitest.mjs')
  const args = [cli, 'run', '--config', join(own, 'vitest.config.mjs'), '--no-cache',
    '--reporter=default', '--reporter=json', `--outputFile=${join(own, 'vitest.result.json')}`]
  const started = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd: frozen, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  execution = { argv: [process.execPath, ...args], cwd: frozen, env, node: process.version,
    started, ended: new Date().toISOString(), pid: result.pid, exit: result.status, signal: result.signal,
    error: result.error?.message }
  save('vitest.command.json', execution)
  save('vitest.stdout.txt', result.stdout ?? '')
  save('vitest.stderr.txt', result.stderr ?? '')
  console.log(JSON.stringify(execution))
  console.log(result.stdout)
  console.error(result.stderr)
} catch (e) {
  error = { message: e.message, stack: e.stack }
  save('runner-facility-error.json', error)
  console.error(e)
} finally {
  const protection = {}
  for (const [name, value] of Object.entries(protectedRoots)) {
    protection[name] = compare(value.before, scan(value.root))
  }
  const mainAfter = Object.fromEntries(related.map(n =>
    [n, scan(join(repo, 'packages/dsh-pm-tool/src', n))['']]))
  save('main-related-after.json', mainAfter)
  save('close.json', { protection, allProtectedUnchanged: Object.values(protection).every(empty),
    mainRelatedDelta: compare(relatedBefore, mainAfter), childExited: !!execution && execution.exit !== null,
    executionExit: execution?.exit, runnerFacilityError: error,
    scope: 'SOURCE/AUTO必要红，不签GUI/整项/修后/正式数据/全盘零变', stopped: true })
  const index = byteView(scan(own))
  save('sealed-evidence.json', index)
  process.exitCode = error ? 2 : execution?.exit ?? 2
}
