import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  readlinkSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const own = join(repo, 'reports/all-pending-evidence-20261021/TaskPredCheckboxRedR1', round)
assert(!existsSync(own), '不得覆盖原轮')
const main = join(repo, 'packages/dsh-pm-tool')
const source = '/private/tmp/pmtool-combined-repair-20261022-r2/packages/dsh-pm-tool'
const domSource = join(repo, 'reports/all-pending-evidence-20261021/MaterialRefDevR1/dom-deps')
const parent = join(repo, 'reports/all-pending-evidence-20261021/CombinedRepairR1/r2')
const gui = join(repo, 'reports/all-pending-evidence-20261021/CombinedGuiR1')
const frozen = join(own, 'frozen/packages/dsh-pm-tool')
const domCopy = join(own, 'dom-deps')
const testPath = 'src/client/task-predecessor-refs-dom.test.tsx'
const sha = b => createHash('sha256').update(b).digest('hex')
function scan(root) {
  const result = {}
  function walk(p, rel = '') {
    const stat = lstatSync(p)
    if (stat.isSymbolicLink()) result[rel] = { link: readlinkSync(p), realpath: realpathSync(p) }
    else if (stat.isDirectory()) for (const n of readdirSync(p).sort())
      walk(join(p, n), rel ? `${rel}/${n}` : n)
    else if (stat.isFile()) {
      const b = readFileSync(p)
      result[rel] = { bytes: b.length, sha256: sha(b), dev: stat.dev, ino: stat.ino }
    } else throw new Error(`不支持文件 ${p}`)
  }
  walk(root)
  return result
}
const bytes = s => Object.fromEntries(Object.entries(s).map(([k, v]) =>
  [k, v.link ? { link: v.link } : { bytes: v.bytes, sha256: v.sha256 }]))
function delta(a, b) {
  return { added: Object.keys(b).filter(k => !(k in a)), removed: Object.keys(a).filter(k => !(k in b)),
    changed: Object.keys(a).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])) }
}
const empty = d => Object.values(d).every(a => a.length === 0)
mkdirSync(own, { recursive: true, mode: 0o700 })
function save(name, value) {
  const path = resolve(own, name)
  assert(path.startsWith(`${own}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function copyDeps(from, to, label) {
  cpSync(from, to, { recursive: true, dereference: false, verbatimSymlinks: true })
  const a = scan(from), b = scan(to)
  assert.deepEqual(bytes(a), bytes(b), `${label}复制字节不等`)
  const shared = Object.keys(b).filter(k => !b[k].link && a[k].dev === b[k].dev && a[k].ino === b[k].ino)
  const external = Object.keys(b).filter(k => b[k].link && !b[k].realpath.startsWith(`${to}/`))
  save(`${label}-ownership.json`, { from, to, files: Object.values(b).filter(v => !v.link).length,
    links: Object.values(b).filter(v => v.link).length, sharedInodes: shared, externalLinks: external })
  save(`${label}-manifest.json`, b)
  assert.deepEqual(shared, [], '禁止共享 inode')
  assert.deepEqual(external, [], '禁止外链')
}
const protectedPaths = {
  'frozen-source': join(source, 'src'), 'frozen-scripts': join(source, 'scripts'),
  'frozen-deps': join(source, 'node_modules'), 'frozen-lib': join(source, 'lib'),
  'material-dom-deps': domSource, 'main-lib': join(main, 'lib'),
  'main-package': join(main, 'package.json'), 'main-lock': join(main, 'pnpm-lock.yaml'),
  'main-test': join(main, testPath),
}
const protection = Object.fromEntries(Object.entries(protectedPaths).map(([k, path]) =>
  [k, { path, before: scan(path) }]))
save('protected-before.json', protection)
const mainPanelBefore = bytes(scan(join(main, 'src/client/panel.tsx')))
save('main-panel-before.json', mainPanelBefore)
const guiNames = [
  'loaded-binding.json', '25-o3-console-events.json', '20r2-o3-real-edge-command.json',
  '21-o3-cycle-before-save.json', '21-o3-cycle-before-save-roots.json', '21-o3-cycle-before-save.png',
  '22r2-o3-shell-missing.json', '22r2-o3-shell-missing-roots.json', '22r2-o3-shell-missing.png',
  '23-o3-reconstructed-before-check.json', '23-o3-reconstructed-before-check-roots.json',
  '23-o3-reconstructed-before-check.png', '24-o3-after-predecessor-check.json',
  '24-o3-after-predecessor-check-roots.json', '24-o3-after-predecessor-check.png',
  '24-o3-check-events-events.json',
]
let execution, facilityError
try {
  const guiBefore = Object.fromEntries(guiNames.map(n => [n, bytes(scan(join(gui, n)))['']]))
  const loaded = readFileSync(join(gui, 'loaded-complete.js'))
  save('gui-reference-before.json', { root: gui, files: guiBefore,
    loadedComplete: { bytes: loaded.length, sha256: sha(loaded) }, boundary: '明确名单只读指纹，Main根仍在途，不封根' })
  const loadedBinding = JSON.parse(readFileSync(join(gui, 'loaded-binding.json')))
  assert.equal(sha(loaded), loadedBinding.loadedSha256)
  const guiLines = loaded.toString().split('\n')
  assert(guiLines[49298].includes('e.currentTarget.checked'))
  save('gui-handler-excerpt.txt', guiLines.slice(49288, 49306).map((l, i) => `${49289 + i}: ${l}`).join('\n') + '\n')
  const rawConsole = JSON.parse(readFileSync(join(gui, '25-o3-console-events.json')))
  const errors = rawConsole.filter(e => e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error')
  assert(errors.some(e => e.params.args.some(a =>
    a.description?.includes("Cannot read properties of null (reading 'checked')") &&
    a.description?.includes('TaskForm'))))
  save('gui-console-reference.json', { source: join(gui, '25-o3-console-events.json'),
    sha256: guiBefore['25-o3-console-events.json'].sha256, rawConsole, errors: errors.length })
  const rootDiffs = []
  for (const [a, b] of [['21-o3-cycle-before-save-roots.json', '22r2-o3-shell-missing-roots.json'],
    ['23-o3-reconstructed-before-check-roots.json', '24-o3-after-predecessor-check-roots.json']]) {
    const before = JSON.parse(readFileSync(join(gui, a))), after = JSON.parse(readFileSync(join(gui, b)))
    rootDiffs.push({ before: a, after: b, allDelta: delta(before, after),
      businessDelta: delta(Object.fromEntries(Object.entries(before).filter(([k]) => !k.startsWith('dsh/'))),
        Object.fromEntries(Object.entries(after).filter(([k]) => !k.startsWith('dsh/')))) })
  }
  save('gui-root-comparisons.json', rootDiffs)
  mkdirSync(frozen, { recursive: true })
  const entries = readdirSync(source).filter(n => ['src', 'scripts', 'locale'].includes(n) || lstatSync(join(source, n)).isFile())
  const frozenInputs = {}
  for (const name of entries) {
    cpSync(join(source, name), join(frozen, name), { recursive: true, verbatimSymlinks: true })
    const a = bytes(scan(join(source, name))), b = bytes(scan(join(frozen, name)))
    assert.deepEqual(a, b)
    for (const [key, value] of Object.entries(b)) frozenInputs[key ? `${name}/${key}` : name] = value
  }
  save('complete-inputs.json', frozenInputs)
  for (const name of ['candidate.json', 'complete-inputs.json', 'source-files.json', 'source-files.sha256',
    'tracked-product.diff', 'new-product-files.txt']) {
    mkdirSync(join(own, 'provenance'), { recursive: true })
    cpSync(join(parent, name), join(own, 'provenance', name))
  }
  const parentCandidate = JSON.parse(readFileSync(join(parent, 'candidate.json')))
  const declared = JSON.parse(readFileSync(join(parent, 'source-files.json')))
  assert.equal(sha(readFileSync(join(frozen, 'src/client/panel.tsx'))),
    declared.source['packages/dsh-pm-tool/src/client/panel.tsx'])
  const adapterSuffix = '\nexport { TaskForm }\n'
  const panelSource = readFileSync(join(frozen, 'src/client/panel.tsx'), 'utf8')
  const transformed = panelSource + adapterSuffix
  save('virtual-adapter.json', { source: 'src/client/panel.tsx', sourceSha256: sha(panelSource),
    transformedSha256: sha(transformed), additionOnly: adapterSuffix,
    originalNotEdited: true, boundary: '仅Vitest transform新增export，完整真实组件/子组件/hooks不改' })
  save('virtual-adapter-panel.tsx', transformed)
  const diff = spawnSync('/usr/bin/diff', ['-u', '--label', 'a/src/client/panel.tsx',
    '--label', 'virtual/src/client/panel.tsx', join(frozen, 'src/client/panel.tsx'), join(own, 'virtual-adapter-panel.tsx')],
  { encoding: 'utf8' })
  save('virtual-adapter-diff.command.json', { exit: diff.status, stdout: diff.stdout, stderr: diff.stderr })
  assert.equal(diff.status, 1)
  save('virtual-adapter.diff', diff.stdout)
  save('candidate.json', { parentCandidate, baselineCommit: parentCandidate.baseline,
    source, frozen, completeInputCount: Object.keys(frozenInputs).length,
    originalPanelSha256: sha(panelSource), mainPanelBefore: mainPanelBefore[''].sha256,
    mainPanelMatchesFrozen: mainPanelBefore[''].sha256 === sha(panelSource),
    testedIdentity: 'CombinedRepairR1/r2原源字节+唯一新源test+仅export虚拟adapter；不冒全主树新dirty或实例再加载',
    parentGUI: { origin: 'http://127.0.0.1:3260', loadedBinding },
    excluded: ['lib', 'coverage', 'artifacts', 'data', 'vendor', '其他在途新源tests'] })
  cpSync(join(main, testPath), join(frozen, testPath))
  save('test-binding.json', { source: join(main, testPath), sha256: sha(readFileSync(join(frozen, testPath))) })
  copyDeps(join(source, 'node_modules'), join(frozen, 'node_modules'), 'package-deps')
  mkdirSync(domCopy, { recursive: true })
  for (const name of ['package.json', 'package-lock.json']) cpSync(join(domSource, name), join(domCopy, name))
  copyDeps(join(domSource, 'node_modules'), join(domCopy, 'node_modules'), 'dom-deps')
  assert.equal(sha(readFileSync(join(domCopy, 'package-lock.json'))),
    '15fa558af385790ad5b7a1778d9e92429f8be65d48f528c2997009b49524b973')
  const versions = Object.fromEntries(['react', 'react-dom', 'jsdom'].map(name =>
    [name, JSON.parse(readFileSync(join(domCopy, 'node_modules', name, 'package.json'))).version]))
  assert.deepEqual(versions, { react: '18.3.1', 'react-dom': '18.3.1', jsdom: '25.0.1' })
  save('facility.json', { versions, vitest: JSON.parse(readFileSync(join(frozen, 'node_modules/vitest/package.json'))).version,
    originalReactDOM19Failure: JSON.parse(readFileSync(join(repo,
      'docs/testing/material-progress-ref-crash-20261022-r1-selftmp/r1/facility-react-dom19.json'))),
    noInstall: true, noHookMock: true, noProductModuleMock: true })
  const alias = ['react/jsx-dev-runtime', 'react/jsx-runtime', 'react-dom/test-utils', 'react-dom/client', 'react-dom', 'react', 'jsdom']
    .sort((a, b) => b.length - a.length).map(find => ({ find, replacement: join(domCopy, 'node_modules',
      find === 'jsdom' ? 'jsdom/lib/api.js' : ['react', 'react-dom'].includes(find) ? `${find}/index.js` : `${find}.js`) }))
  const config = { root: frozen, cacheDir: join(own, 'cache/vite'), esbuild: { jsx: 'automatic' },
    resolve: { alias }, test: { environment: 'node', include: [testPath], pool: 'forks',
      poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, fileParallelism: false,
      testTimeout: 15000, hookTimeout: 15000 } }
  const configCode = `const config = ${JSON.stringify(config, null, 2)}
config.plugins = [{
  name: 'independent-private-TaskForm-export',
  enforce: 'pre',
  transform(code, id) {
    if (id !== ${JSON.stringify(join(frozen, 'src/client/panel.tsx'))}) return null
    return {code: code + ${JSON.stringify(adapterSuffix)}, map: null}
  }
}]
export default config
`
  save('vitest.config.mjs', configCode)
  const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(own, 'home'),
    TMPDIR: join(own, 'tmp'), TMP: join(own, 'tmp'), TEMP: join(own, 'tmp'),
    XDG_CACHE_HOME: join(own, 'cache'), npm_config_cache: join(own, 'cache/npm'),
    DSH_HOME: join(own, 'dsh-home'), QA_EVIDENCE_ROOT: join(own, 'observations'),
    CI: '1', LANG: 'zh_CN.UTF-8', TZ: 'UTC', NODE_ENV: 'development' }
  for (const value of Object.values(env).filter(v => v.startsWith(`${own}/`))) mkdirSync(value, { recursive: true, mode: 0o700 })
  const args = [join(frozen, 'node_modules/vitest/vitest.mjs'), 'run', '--config', join(own, 'vitest.config.mjs'),
    '--no-cache', '--reporter=default', '--reporter=json', `--outputFile=${join(own, 'vitest.result.json')}`]
  const started = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd: frozen, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  execution = { argv: [process.execPath, ...args], cwd: frozen, env, node: process.version,
    runnerPid: process.pid, pid: result.pid, started, ended: new Date().toISOString(),
    exit: result.status, signal: result.signal, error: result.error?.message }
  save('vitest.command.json', execution)
  save('vitest.stdout.txt', result.stdout ?? '')
  save('vitest.stderr.txt', result.stderr ?? '')
  console.log(JSON.stringify(execution))
  console.log(result.stdout ?? '')
  console.error(result.stderr ?? '')
  save('gui-reference-after.json', Object.fromEntries(guiNames.map(n => [n, bytes(scan(join(gui, n)))['']])))
} catch (error) {
  facilityError = { message: error.message, stack: error.stack }
  save('runner-facility-error.json', facilityError)
  console.error(error)
} finally {
  const checks = Object.fromEntries(Object.entries(protection).map(([name, entry]) =>
    [name, delta(entry.before, scan(entry.path))]))
  save('main-panel-after.json', bytes(scan(join(main, 'src/client/panel.tsx'))))
  save('close.json', { protection: checks, allProtectedUnchanged: Object.values(checks).every(empty),
    mainPanelDelta: delta(mainPanelBefore, bytes(scan(join(main, 'src/client/panel.tsx')))),
    concurrentChangesPermitted: 'Main新dirty及renderer开发不锁；只绑定已冻结源，不给其后继PASS',
    execution, facilityError, childExited: !!execution && execution.exit !== null,
    productModified: false, scope: 'SOURCE/AUTO必要红；未build/noEmit/GUI/服务/Git/产品持久化', stop: true })
  save('sealed-evidence.json', bytes(scan(own)))
  process.exitCode = facilityError ? 2 : execution?.exit ?? 2
}
