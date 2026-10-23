// Isolated developer evidence runner. Never runs build/install/services/Git writes.
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync,
  symlinkSync, writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pkg = join(repo, 'packages/dsh-pm-tool')
const prefix = join(repo, 'docs/plans/2026-10-23-p1004-sidecar-handoff-')
const mode = process.argv[2]
if (!/^(seal|(red|green|affected)(-r\d+)?)$/.test(mode)) throw new Error('Use seal/red/green/affected[-rN]')
const stage = mode.split('-')[0]
const receiptPath = `${prefix}${mode}-receipt.json`
if (existsSync(receiptPath)) throw new Error(`Do not overwrite evidence: ${receiptPath}`)
if (stage === 'seal' && existsSync(`${prefix}seal.json`)) throw new Error('Do not overwrite the seal')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const fingerprint = path => {
  const bytes = readFileSync(path)
  return { bytes: bytes.length, sha256: sha(bytes) }
}
function walk(root, prefix = '') {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isSymbolicLink()) throw new Error(`Unexpected input symlink: ${path}`)
    return entry.isDirectory() ? walk(join(root, entry.name), path) : [path]
  })
}
const source = Object.fromEntries(walk(join(pkg, 'src')).map(path =>
  [`src/${path}`, fingerprint(join(pkg, 'src', path))]))
for (const path of ['package.json', 'pnpm-lock.yaml']) source[path] = fingerprint(join(pkg, path))
if (stage === 'seal') {
  const readJson = suffix => JSON.parse(readFileSync(`${prefix}${suffix}`, 'utf8'))
  const red = readJson('red-r4-source.json').source
  const green = readJson('green-r2-source.json').source
  const changed = Object.keys(source).filter(path => JSON.stringify(source[path]) !== JSON.stringify(red[path]))
  const outputDrift = Object.keys(source).filter(path => JSON.stringify(source[path]) !== JSON.stringify(green[path]))
  const vendorRoot = join(repo, 'vendor/agent-skills/mattpocock')
  const manifest = JSON.parse(readFileSync(join(vendorRoot, 'manifest.json'), 'utf8'))
  const vendor = [...manifest.rootFiles, ...manifest.skills.flatMap(skill => skill.files)].map(file => {
    const actual = fingerprint(join(vendorRoot, file.path))
    return { path: file.path, ...actual, match: actual.sha256 === file.sha256 && actual.bytes === file.bytes }
  })
  const staticRun = spawnSync(process.execPath, [join(pkg, 'scripts/verify-external-skills.mjs')], { encoding: 'utf8' })
  writeFileSync(`${prefix}vendor-final-stdout.log`, staticRun.stdout ?? '')
  writeFileSync(`${prefix}vendor-final-stderr.log`, staticRun.stderr ?? '')
  const dir = dirname(prefix)
  const stem = prefix.slice(dir.length + 1)
  const evidence = Object.fromEntries(readdirSync(dir).filter(name => name.startsWith(stem)
    && name !== `${stem}seal.json`).map(name => [name, fingerprint(join(dir, name))]))
  const ok = changed.length === 1 && changed[0] === 'src/client/panel.tsx'
    && outputDrift.length === 0 && vendor.every(file => file.match) && staticRun.status === 0
    && readJson('green-r2-receipt.json').status === 0 && readJson('affected-r2-receipt.json').status === 0
  writeFileSync(`${prefix}seal.json`, JSON.stringify({
    role: 'developer seal, not independent acceptance', at: new Date().toISOString(), node: process.version,
    ok, changedSinceUnmodifiedRed: changed, outputDrift, source, evidence,
    vendorCommit: manifest.source.commit, vendor,
    vendorStatic: { command: [process.execPath, join(pkg, 'scripts/verify-external-skills.mjs')], exit: staticRun.status },
    release: 'all task-local source/docs write claims released; STOP; no builder/GUI/Git ownership',
  }, null, 2) + '\n')
  console.log(JSON.stringify({ ok, changed, outputDrift, vendorFiles: vendor.length, evidenceFiles: Object.keys(evidence).length }))
  process.exit(ok ? 0 : 1)
}
const inputPanel = source['src/client/panel.tsx'].sha256
if (stage === 'red' && inputPanel !== '581f2882323e729afa7f7f5b7ff40e73a8a9831c2c30b9a263baad74fc7f521d') {
  throw new Error('RED requires the exact claimed unmodified dirty input')
}
const run = mkdtempSync('/tmp/pmtool-p1004-sidecar-handoff-')
cpSync(join(pkg, 'src'), join(run, 'src'), { recursive: true, dereference: false })
cpSync(join(pkg, 'package.json'), join(run, 'package.json'))
cpSync(join(pkg, 'pnpm-lock.yaml'), join(run, 'pnpm-lock.yaml'))
const dependencies = join(run, 'node_modules')
mkdirSync(dependencies)
const depRoots = []
for (const entry of readdirSync(join(pkg, 'node_modules'))) {
  if (entry.startsWith('.')) continue
  const original = join(pkg, 'node_modules', entry)
  const target = realpathSync(original)
  symlinkSync(target, join(dependencies, entry))
  depRoots.push({ name: entry, path: target })
}
const widget = join(repo, '.tmp/widget-poc/node_modules')
for (const entry of ['jsdom', 'react-dom']) {
  const target = realpathSync(join(widget, entry))
  symlinkSync(target, join(dependencies, entry))
  depRoots.push({ name: entry, path: target, ...fingerprint(join(target, 'package.json')) })
}
const react = realpathSync(join(stage === 'affected' ? join(pkg, 'node_modules') : widget, 'react'))
depRoots.push({ name: 'react-runtime', path: react, ...fingerprint(join(react, 'package.json')) })
const include = stage === 'affected' ? [
  'src/client/sidecar-minimize-retention.test.tsx',
  'src/client/copilot-error-prefix.test.tsx',
  'src/client/panel-cancel-close.test.ts',
] : ['src/client/panel-sidecar-task-handoff.test.tsx']
for (const path of include) {
  if (!existsSync(join(run, path))) throw new Error(`Missing requested test: ${path}`)
}
const config = join(run, 'p1004-vitest.config.mjs')
writeFileSync(config, `export default ${JSON.stringify({
  root: run, cacheDir: join(run, 'cache'),
  resolve: { alias: { react } },
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  test: { environment: 'node', include, pool: 'forks', poolOptions: { forks: { singleFork: true } },
    server: { deps: { inline: ['lucide-react'] } },
    reporters: ['default', 'json'], outputFile: join(run, 'vitest.json'), testTimeout: 15000 },
}, null, 2)}\n`)
const cache = join(run, 'temporary')
mkdirSync(cache)
const argv = [
  join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', config,
]
const startedAt = new Date().toISOString()
const result = spawnSync(process.execPath, argv, {
  cwd: run, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  env: { ...process.env, TMPDIR: cache, XDG_CACHE_HOME: join(run, 'xdg-cache'),
    P1004_OBSERVATIONS: join(run, 'observations.json'), CI: '1' },
})
writeFileSync(`${prefix}${mode}-stdout.log`, result.stdout ?? '')
writeFileSync(`${prefix}${mode}-stderr.log`, result.stderr ?? '')
writeFileSync(`${prefix}${mode}-source.json`, JSON.stringify({
  source, dependencyReadLinks: depRoots, config: fingerprint(config),
}, null, 2) + '\n')
if (existsSync(join(run, 'observations.json'))) cpSync(join(run, 'observations.json'),
  `${prefix}${mode}-observations.json`)
const drift = Object.entries(source).filter(([path, before]) =>
  JSON.stringify(fingerprint(join(pkg, path))) !== JSON.stringify(before)).map(([path]) => path)
const summary = existsSync(join(run, 'vitest.json')) ? JSON.parse(readFileSync(join(run, 'vitest.json'), 'utf8')) : null
if (stage === 'red') {
  cpSync(join(run, 'src/client/panel.tsx'), join(run, 'baseline-panel.tsx'))
  writeFileSync(`${prefix}${mode}-baseline.json`, JSON.stringify({ root: run, panel: inputPanel }, null, 2) + '\n')
} else if (stage === 'green') {
  const baseline = JSON.parse(readFileSync(`${prefix}${process.argv[3] ?? 'red-r4'}-baseline.json`, 'utf8'))
  const before = join(baseline.root, 'baseline-panel.tsx')
  if (fingerprint(before).sha256 !== baseline.panel) throw new Error('Baseline drift')
  const delta = spawnSync('/usr/bin/diff', ['-u', '--label', 'input/panel.tsx', before,
    '--label', 'output/panel.tsx', join(run, 'src/client/panel.tsx')], { encoding: 'utf8' })
  if (![0, 1].includes(delta.status)) throw new Error('Delta generation failed')
  writeFileSync(`${prefix}${mode}-delta.patch`, delta.stdout)
}
const receipt = {
  role: 'developer, not independent acceptance', mode, node: process.version, platform: process.platform,
  startedAt, endedAt: new Date().toISOString(), cwd: run, command: [process.execPath, ...argv],
  status: result.status, signal: result.signal, error: result.error?.message ?? null,
  inputPanel, sourceCount: Object.keys(source).length, inputDrift: drift,
  tests: summary && { total: summary.numTotalTests, passed: summary.numPassedTests, failed: summary.numFailedTests,
    suites: summary.numTotalTestSuites },
  observedFiles: ['stdout', 'stderr', 'source', ...(existsSync(`${prefix}${mode}-observations.json`) ? ['observations'] : [])],
  notRun: ['build', 'install', 'full verify', 'noEmit', 'GUI', 'service', 'Git write'],
}
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n')
console.log(result.stdout)
if (result.stderr) console.error(result.stderr)
console.log(JSON.stringify(receipt, null, 2))
process.exitCode = drift.length ? 2 : result.status ?? 2
