import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../..')
const prefix = 'backup-web-independent-retest-20261021'
const pkg = path.join(repo, 'packages/dsh-pm-tool')
const own = path.join(here, `${prefix}-selftmp`)
const evidence = path.join(here, `${prefix}-evidence`)
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const original = path.join(here, 'materials-files-reports-independent-auto-20261021-evidence/materials-files-reports-independent-auto-20261021-fiKpOr')
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const write = (f, data) => fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
const walk = (dir, base = dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
  a.name.localeCompare(b.name)).flatMap(e => e.isSymbolicLink() ? [] : e.isDirectory() ?
  walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]) : []
const manifest = dir => Object.fromEntries(walk(dir).map(f => [f, { sha256: hash(path.join(dir, f)), bytes: fs.statSync(path.join(dir, f)).size }]))
const git = args => {
  const x = spawnSync('git', args, { cwd: repo, encoding: 'utf8' })
  if (x.status !== 0) throw new Error(x.stderr)
  return x.stdout
}
fs.mkdirSync(own)
fs.mkdirSync(evidence)
fs.cpSync(path.join(here, 'materials-files-reports-independent-auto-20261021-guard.mjs'), path.join(own, 'guard.mjs'))
fs.cpSync(path.join(original, 'fixtures'), path.join(own, 'fixtures'), { recursive: true })
const frozen = path.join(own, 'frozen')
fs.mkdirSync(frozen)
const sourceBefore = manifest(path.join(pkg, 'src'))
fs.cpSync(path.join(pkg, 'src'), path.join(frozen, 'src'), { recursive: true })
const declarations = ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
for (const f of declarations) fs.copyFileSync(path.join(pkg, f), path.join(frozen, f))
const frozenSource = manifest(path.join(frozen, 'src'))
if (JSON.stringify(sourceBefore) !== JSON.stringify(frozenSource)) throw new Error('FREEZE_SOURCE_DRIFT')
fs.writeFileSync(path.join(evidence, 'tracked.patch'), git(['diff', '2a7603023bc54ef13d788e50069ee3fde4671bf3', '--', 'packages/dsh-pm-tool']))
const candidate = {
  time: new Date().toISOString(), head: git(['rev-parse', 'HEAD']).trim(),
  productBase: '2a7603023bc54ef13d788e50069ee3fde4671bf3',
  scope: 'frozen source/AUTO only; not whole dirty, build, host, GUI or release',
  sourceBefore, frozenSource, declarations: Object.fromEntries(declarations.map(f => [f, hash(path.join(frozen, f))])),
  newFiles: git(['ls-files', '--others', '--exclude-standard', '--', 'packages/dsh-pm-tool']).trim().split('\n'),
  dependencies: { link: deps, real: fs.realpathSync(deps), packages: Object.fromEntries(
    ['react', 'react-test-renderer', 'vitest', 'typescript', '@deepseek-ai/cordis', '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain']
      .map(name => [name, { path: fs.realpathSync(path.join(deps, name)), package: hash(path.join(deps, name, 'package.json')) }])) },
  fixtureOriginal: manifest(path.join(original, 'fixtures')), fixtureCopied: manifest(path.join(own, 'fixtures')),
  patch: hash(path.join(evidence, 'tracked.patch')), runtime: { node: process.version, executable: process.execPath, platform: process.platform, arch: process.arch },
}
write(path.join(evidence, 'candidate.json'), candidate)
const cachePath = path.join(deps, '.vite/vitest/results.json')
const cacheBefore = fs.existsSync(cachePath) ? hash(cachePath) : null
const commands = []
function command(label, cwd, args, extra = {}) {
  const started = new Date().toISOString()
  const audit = path.join(evidence, `${label}.audit.ndjson`)
  const env = {
    ...process.env, TMPDIR: own, QA_OWN: own, QA_AUDIT: audit,
    DSH_PM_FILE_ROOT: path.join(own, 'default-files'), DSH_PM_BACKUP_DIR: path.join(own, 'default-backups'),
    PM_BACKUP_WEB_TMP: path.join(own, `${label}-cases`), PM_BACKUP_FIXTURE_DIR: path.join(own, 'fixtures/F5'),
    NODE_OPTIONS: `--import=${path.join(own, 'guard.mjs')}`, ...extra,
  }
  fs.mkdirSync(env.PM_BACKUP_WEB_TMP, { recursive: true })
  const result = spawnSync(process.execPath, args, { cwd, env, encoding: 'utf8', timeout: 180000, maxBuffer: 20 * 1024 * 1024 })
  fs.writeFileSync(path.join(evidence, `${label}.stdout.txt`), result.stdout ?? '')
  fs.writeFileSync(path.join(evidence, `${label}.stderr.txt`), result.stderr ?? '')
  const record = {
    label, argv: [process.execPath, ...args], cwd, env: Object.fromEntries(Object.keys(env).filter(k =>
      ['TMPDIR', 'QA_OWN', 'QA_AUDIT', 'DSH_PM_FILE_ROOT', 'DSH_PM_BACKUP_DIR', 'PM_BACKUP_WEB_TMP', 'PM_BACKUP_FIXTURE_DIR', 'NODE_OPTIONS', 'QA_REOPEN_TARGET'].includes(k)).map(k => [k, env[k]])),
    started, ended: new Date().toISOString(), exit: result.status, signal: result.signal,
    error: result.error?.message, stdoutSha: hash(path.join(evidence, `${label}.stdout.txt`)), stderrSha: hash(path.join(evidence, `${label}.stderr.txt`)),
  }
  commands.push(record)
  fs.writeFileSync(path.join(evidence, 'commands.json'), JSON.stringify(commands, null, 2) + '\n')
  console.log(JSON.stringify({ label, exit: result.status, signal: result.signal, last: (result.stdout ?? '').slice(-600), error: result.error?.message }))
  return record
}
function setup(dir) {
  fs.symlinkSync(deps, path.join(dir, 'node_modules'))
  fs.copyFileSync(path.join(here, `${prefix}-seam.test.tsx`), path.join(dir, `${prefix}-seam.test.tsx`))
  fs.copyFileSync(path.join(here, 'bridge-panel-independent-retest-20261021-current-r3-executed-test.txt'),
    path.join(dir, 'src/client/bridge-panel-independent-retest-20261021-additional.test.tsx'))
  fs.writeFileSync(path.join(dir, 'vitest.qa.config.mjs'), [
    "export default {",
    "  cacheDir: new URL('./cache', import.meta.url).pathname,",
    "  esbuild: { jsx: 'automatic' },",
    "  test: { environment: 'node', cache: false, include: ['src/**/*.test.ts', 'src/**/*.test.tsx', '*-seam.test.tsx'],",
    "    pool: 'threads', maxWorkers: 1, minWorkers: 1, deps: { optimizer: { ssr: { enabled: false }, web: { enabled: false } } } }",
    "}",
  ].join('\n'))
  fs.writeFileSync(path.join(dir, 'tsconfig.qa.json'), JSON.stringify({
    extends: './tsconfig.json', compilerOptions: { outDir: './out', declarationDir: './out/types' },
  }, null, 2))
}
setup(frozen)
const test = (label, cwd, files) => {
  const resultFile = path.join(own, label + '.vitest.json')
  const record = command(label, cwd, [
    'node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.qa.config.mjs', '--no-cache',
    '--maxWorkers=1', '--minWorkers=1', '--reporter=default', '--reporter=json',
    `--outputFile=${resultFile}`, ...files,
  ])
  if (fs.existsSync(resultFile)) fs.copyFileSync(resultFile, path.join(evidence, path.basename(resultFile)))
  return record
}
const backendFiles = ['src/commands/backup-web.test.ts', 'src/core/backup-precheck.test.ts',
  'src/core/backup-mid-rollback.test.ts', 'src/core/file-backup.test.ts']
const panelFiles = ['src/client/panel-restore-path.test.ts', 'src/client/panel-launch-handshake.test.tsx',
  'src/client/launch-handshake.test.ts', 'src/client/bridge-panel-independent-retest-20261021-additional.test.tsx']
const compile = command('current-compile', frozen, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.qa.json'])
if (compile.exit === 0) write(path.join(evidence, 'compiled-output.json'), manifest(path.join(frozen, 'out')))
test('current-backend', frozen, backendFiles)
test('current-panel-bridge', frozen, panelFiles)
test('current-seam', frozen, [`${prefix}-seam.test.tsx`])
const target = path.join(own, 'current-seam-cases/reopen-target.json')
if (compile.exit === 0 && fs.existsSync(target)) {
  fs.copyFileSync(path.join(here, `${prefix}-reopen.mjs`), path.join(frozen, 'reopen.mjs'))
  command('current-reopen', frozen, ['reopen.mjs'], { QA_REOPEN_TARGET: target })
}
const legacyBackend = path.join(own, 'legacy-backend')
fs.cpSync(frozen, legacyBackend, { recursive: true, filter: f => !['node_modules', 'out', 'cache'].includes(path.basename(f)) })
fs.symlinkSync(deps, path.join(legacyBackend, 'node_modules'))
for (const f of ['src/commands/backup.ts', 'src/core/backup.ts']) {
  fs.writeFileSync(path.join(legacyBackend, f), git(['show', `2a7603023bc54ef13d788e50069ee3fde4671bf3:packages/dsh-pm-tool/${f}`]))
}
write(path.join(evidence, 'legacy-backend-source.json'), Object.fromEntries(['src/commands/backup.ts', 'src/core/backup.ts'].map(f => [f, hash(path.join(legacyBackend, f))])))
test('legacy-backend', legacyBackend, backendFiles)
const legacyPanel = path.join(own, 'legacy-panel')
fs.cpSync(frozen, legacyPanel, { recursive: true, filter: f => !['node_modules', 'out', 'cache'].includes(path.basename(f)) })
fs.symlinkSync(deps, path.join(legacyPanel, 'node_modules'))
const oldPanel = '/private/tmp/pmtool-panel-restore-red-frozen-20261021/src/client/panel.tsx'
fs.copyFileSync(oldPanel, path.join(legacyPanel, 'src/client/panel.tsx'))
write(path.join(evidence, 'legacy-panel-source.json'), { source: oldPanel, sha256: hash(oldPanel) })
test('legacy-panel', legacyPanel, ['src/client/panel-restore-path.test.ts', 'src/client/panel-launch-handshake.test.tsx'])
test('current-stability', frozen, [...backendFiles, ...panelFiles, `${prefix}-seam.test.tsx`])
const sourceAfter = manifest(path.join(pkg, 'src'))
write(path.join(evidence, 'final-integrity.json'), {
  sourceAfter, sourceDrift: [...new Set([...Object.keys(sourceBefore), ...Object.keys(sourceAfter)])]
    .filter(f => sourceBefore[f]?.sha256 !== sourceAfter[f]?.sha256),
  frozenAfter: manifest(path.join(frozen, 'src')),
  cacheBefore, cacheAfter: fs.existsSync(cachePath) ? hash(cachePath) : null,
  fixtureAfter: manifest(path.join(original, 'fixtures')),
  tests: Object.fromEntries([`${prefix}-seam.test.tsx`, 'vitest.qa.config.mjs', 'tsconfig.qa.json']
    .map(f => [f, hash(path.join(frozen, f))])),
})
const audits = walk(evidence).filter(f => f.endsWith('.audit.ndjson')).flatMap(f =>
  fs.readFileSync(path.join(evidence, f), 'utf8').trim().split('\n').filter(Boolean).map(line => ({ file: f, ...JSON.parse(line) })))
write(path.join(evidence, 'audit-summary.json'), { operations: audits.length, denied: audits.filter(x => !x.allowed) })
write(path.join(evidence, 'evidence-sha256.json'), manifest(evidence))
const current = commands.filter(c => c.label.startsWith('current-'))
process.exitCode = current.some(c => c.exit !== 0) || audits.some(x => !x.allowed) ? 1 : 0
