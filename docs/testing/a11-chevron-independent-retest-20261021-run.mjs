import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { createRequire, builtinModules } from 'node:module'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a11-chevron-independent-retest-20261021'
const round = process.argv[2] ?? ''
assert.match(round, /^(?:r[2-9])?$/)
const root = path.join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert.ok(!fs.existsSync(root), 'Use a fresh evidence directory, never overwrite a run')
fs.mkdirSync(root, { mode: 0o700 })
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const save = (name, value) => fs.writeFileSync(path.join(root, name), typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`)
const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = path.join(dir, e.name)
  return e.isDirectory() ? files(p) : e.isFile() ? [p] : []
}).sort()
const frozen = path.join(root, 'frozen')
const launcher = path.join(frozen, 'launcher')
const original = path.join(repo, 'launcher')
fs.mkdirSync(launcher, { recursive: true })
for (const name of ['src', 'bin', 'test', 'scripts', 'package.json']) {
  fs.cpSync(path.join(original, name), path.join(launcher, name), { recursive: true })
}
const oldRoot = '/private/tmp/pmtool-all-closure-20261021/launcher'
const source = fs.readFileSync(path.join(launcher, 'src/control-html.mjs'), 'utf8')
const oldSource = fs.readFileSync(path.join(oldRoot, 'src/control-html.mjs'), 'utf8')
const rule = '.browser-select>svg{width:18px;height:18px;flex:0 0 18px;color:var(--muted)}\n'
assert.equal(source.split(rule).length, 2)
assert.equal(source.replace(rule, ''), oldSource, 'Exactly one CSS rule differs from A10')
assert.equal(hash(oldSource), '3b4a30c7b6393b3c2131e62a038358763bd3f8fa20a05aa09bf7562275289a9e')
save('a10-control-html.mjs', oldSource)
try {
  execFileSync('diff', ['-u', path.join(oldRoot, 'src/control-html.mjs'), path.join(launcher, 'src/control-html.mjs')], { encoding: 'utf8' })
} catch (e) {
  assert.equal(e.status, 1)
  save('a10-to-a11.diff', e.stdout)
}
save('tracked.patch', git(['diff', '--binary', 'HEAD', '--', 'launcher']))
const manifest = files(launcher).map(p => {
  const relative = path.relative(frozen, p)
  const bytes = fs.readFileSync(p)
  const live = path.join(repo, relative)
  assert.equal(hash(bytes), hash(fs.readFileSync(live)), `Freeze consistency: ${relative}`)
  return { path: relative, bytes: bytes.length, sha256: hash(bytes) }
})
save('source-manifest.json', manifest)
const candidate = {
  frozenAt: new Date().toISOString(), head: git(['rev-parse', 'HEAD']).trim(),
  productBase: '2a7603023bc54ef13d788e50069ee3fde4671bf3',
  sourceSha256: hash(source), oldSourceSha256: hash(oldSource),
  manifestSha256: hash(JSON.stringify(manifest)), patchSha256: hash(fs.readFileSync(path.join(root, 'tracked.patch'))),
  sourceExactMinusOneCss: true,
  originalLogs: {},
}
for (const name of ['red.exit.json', 'red.stdout.txt', 'red.stderr.txt', 'green.exit.json', 'green.stdout.txt', 'green.stderr.txt']) {
  const bytes = fs.readFileSync(path.join(repo, 'reports/all-pending-evidence-20261021/A11/chevron', name))
  save(`original-${name}`, bytes.toString())
  candidate.originalLogs[name] = { bytes: bytes.length, sha256: hash(bytes) }
}
// Copy only installed package graphs. All runtime links point inside selftmp.
const graph = new Map()
function packageRoot(req, name) {
  for (const dir of req.resolve.paths(name) ?? []) {
    const p = path.join(dir, name, 'package.json')
    if (fs.existsSync(p)) return fs.realpathSync(path.dirname(p))
  }
  return null
}
function copyPackage(sourceDir) {
  if (graph.has(sourceDir)) return graph.get(sourceDir)
  const metadata = JSON.parse(fs.readFileSync(path.join(sourceDir, 'package.json'), 'utf8'))
  const key = `${metadata.name.replaceAll('/', '+')}@${metadata.version}-${hash(sourceDir).slice(0, 10)}`
  const nodeModules = path.join(root, 'dependencies', key, 'node_modules')
  const dest = path.join(nodeModules, metadata.name)
  const item = { name: metadata.name, version: metadata.version, sourceDir, dest, dependencies: {} }
  graph.set(sourceDir, item)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.cpSync(sourceDir, dest, { recursive: true, filter: p => path.basename(p) !== 'node_modules' })
  const req = createRequire(path.join(sourceDir, 'package.json'))
  for (const name of Object.keys({ ...metadata.dependencies, ...metadata.optionalDependencies, ...metadata.peerDependencies })) {
    if (builtinModules.includes(name) || name.startsWith('node:')) continue
    const dep = packageRoot(req, name)
    if (!dep) {
      assert.ok(!metadata.dependencies?.[name], `Missing installed dependency ${name}`)
      continue
    }
    const copied = copyPackage(dep)
    const link = path.join(nodeModules, name)
    fs.mkdirSync(path.dirname(link), { recursive: true })
    if (!fs.existsSync(link)) fs.symlinkSync(path.relative(path.dirname(link), copied.dest), link)
    item.dependencies[name] = { name: copied.name, version: copied.version }
  }
  const before = files(sourceDir).filter(p => !path.relative(sourceDir, p).split(path.sep).includes('node_modules'))
  item.fileCount = before.length
  item.files = before.map(p => {
    const relative = path.relative(sourceDir, p)
    const sha256 = hash(fs.readFileSync(p))
    assert.equal(hash(fs.readFileSync(path.join(dest, relative))), sha256)
    return { path: relative, sha256 }
  })
  return item
}
const installed = createRequire('/private/tmp/pmtool-a11-chevron-tests-20261021/packages/dsh-pm-tool/package.json')
const puppeteerRoot = packageRoot(installed, 'puppeteer-core')
assert.ok(puppeteerRoot)
const puppeteer = copyPackage(puppeteerRoot)
const privateModule = path.join(frozen, 'packages/dsh-pm-tool')
fs.mkdirSync(path.join(privateModule, 'node_modules'), { recursive: true })
fs.copyFileSync(path.join(repo, 'packages/dsh-pm-tool/package.json'), path.join(privateModule, 'package.json'))
fs.symlinkSync(path.relative(path.join(privateModule, 'node_modules'), puppeteer.dest), path.join(privateModule, 'node_modules/puppeteer-core'))
save('dependencies.json', [...graph.values()])
const privateEnv = {
  PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
  HOME: path.join(root, 'home'), TMPDIR: `${path.join(root, 'tmp')}/`,
  XDG_CACHE_HOME: path.join(root, 'cache'), XDG_CONFIG_HOME: path.join(root, 'config'),
  XDG_DATA_HOME: path.join(root, 'xdg-data'), PUPPETEER_CACHE_DIR: path.join(root, 'puppeteer-cache'),
  npm_config_cache: path.join(root, 'npm-cache'), COREPACK_HOME: path.join(root, 'corepack'),
  DSH_HOME: path.join(root, 'dsh-home'), LANG: 'en_US.UTF-8', TZ: 'UTC',
  A11_ROOT: root, A11_FROZEN: frozen,
}
for (const key of ['HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'PUPPETEER_CACHE_DIR', 'npm_config_cache', 'COREPACK_HOME', 'DSH_HOME']) {
  fs.mkdirSync(privateEnv[key], { recursive: true, mode: 0o700 })
}
const { renderControlHtml } = await import(pathToFileURL(path.join(launcher, 'src/control-html.mjs')))
const { renderControlHtml: renderOld } = await import(pathToFileURL(path.join(root, 'a10-control-html.mjs')))
candidate.templates = []
for (const status of ['S0', 'S1', 'S4']) {
  for (const theme of ['light', 'dark']) {
    const state = { status, view: status, confirmed: status === 'S4', theme,
      browsers: ['系统默认浏览器', 'Chrome', 'Safari'], selectedBrowser: '系统默认浏览器' }
    const html = renderControlHtml({ theme }, { initialState: state })
    const oldHtml = renderOld({ theme }, { initialState: state })
    assert.equal(html.replace(rule, ''), oldHtml)
    const inline = html.match(/<script>([\s\S]*)<\/script>/)[1]
    assert.equal(inline, oldHtml.match(/<script>([\s\S]*)<\/script>/)[1])
    const name = `template-${status}-${theme}`
    save(`${name}.html`, html)
    save(`${name}-inline.js`, inline)
    candidate.templates.push({ status, theme, htmlSha256: hash(html), inlineSha256: hash(inline), inlineUnchanged: true })
  }
}
const oldComparisons = files(path.join(launcher, 'src')).map(p => {
  const relative = path.relative(launcher, p)
  return { path: relative, same: hash(fs.readFileSync(p)) === hash(fs.readFileSync(path.join(oldRoot, relative))) }
})
assert.deepEqual(oldComparisons.filter(x => !x.same).map(x => x.path), ['src/control-html.mjs'])
candidate.a10ProductionComparison = oldComparisons
candidate.environment = { platform: process.platform, arch: process.arch, osRelease: os.release(), node: process.version,
  nodeExecutable: process.execPath, puppeteer: puppeteer.version, envKeys: Object.keys(privateEnv), roots: privateEnv }
save('candidate.json', candidate)
const preload = path.join(repo, 'docs/testing', `${prefix}-observe.mjs`)
privateEnv.NODE_OPTIONS = `--import=${pathToFileURL(preload).href}`
const records = []
async function run(label, argv, cwd = launcher) {
  const startedAt = new Date().toISOString()
  const child = spawn(process.execPath, argv, { cwd, env: privateEnv, stdio: ['ignore', 'pipe', 'pipe'] })
  const out = fs.createWriteStream(path.join(root, `${label}.stdout.txt`))
  const err = fs.createWriteStream(path.join(root, `${label}.stderr.txt`))
  const finished = [out, err].map(stream => new Promise(resolve => stream.on('finish', resolve)))
  child.stdout.pipe(out); child.stderr.pipe(err)
  console.log(JSON.stringify({ label, pid: child.pid, argv: [process.execPath, ...argv] }))
  const timeout = setTimeout(() => { child.kill('SIGTERM') }, 120000)
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (exit, signal) => resolve({ exit, signal }))
  })
  clearTimeout(timeout)
  await Promise.all(finished)
  const record = { label, pid: child.pid, startedAt, endedAt: new Date().toISOString(), cwd,
    argv: [process.execPath, ...argv], ...result,
    stdoutSha256: hash(fs.readFileSync(path.join(root, `${label}.stdout.txt`))),
    stderrSha256: hash(fs.readFileSync(path.join(root, `${label}.stderr.txt`))) }
  save(`${label}.exit.json`, record); records.push(record)
  console.log(JSON.stringify(record))
}
const packageJson = JSON.parse(fs.readFileSync(path.join(launcher, 'package.json')))
const argv56 = packageJson.scripts.test.split(' ').slice(1)
assert.equal(argv56[0], '--test')
await run('launcher56', argv56)
await run('dom8', ['--test', 'test/control-html-sync.test.mjs'])
await run('independent-dom', ['--test', path.join(repo, 'docs/testing', `${prefix}-cases.test.mjs`)])
save('live-after.json', manifest.map(item => {
  const live = path.join(repo, item.path)
  return { path: item.path, frozen: item.sha256, after: fs.existsSync(live) ? hash(fs.readFileSync(live)) : 'MISSING' }
}))
save('summary.json', { records, candidateSha256: hash(fs.readFileSync(path.join(root, 'candidate.json'))),
  frozenIntegrity: manifest.every(item => hash(fs.readFileSync(path.join(frozen, item.path))) === item.sha256),
  finishedAt: new Date().toISOString() })
process.exitCode = records.every(x => x.exit === 0) ? 0 : 1
