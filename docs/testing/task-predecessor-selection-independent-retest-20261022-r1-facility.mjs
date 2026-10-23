import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha } from './task-predecessor-selection-independent-retest-20261022-r1-adapter.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const root = join(repo, 'reports/all-pending-evidence-20261021/TaskPredSelectionRetestR1')
const prior = join(root, 'r1')
const revision = process.argv[2] ?? 'r2-facility'
assert(['r2-facility', 'r3-facility'].includes(revision))
const fullDocument = revision === 'r3-facility'
const own = join(root, revision)
const pkg = join(prior, 'frozen/packages/dsh-pm-tool')
const json = path => JSON.parse(readFileSync(path, 'utf8'))
assert(!existsSync(own), 'Do not overwrite followup evidence')
mkdirSync(own, { recursive: true, mode: 0o700 })
const save = (name, value) => {
  const path = join(own, name)
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
}
function scan(path, rel = '', result = {}) {
  const stat = lstatSync(path)
  if (stat.isSymbolicLink()) result[rel] = { link: readlinkSync(path) }
  else if (stat.isDirectory()) {
    for (const name of readdirSync(path).sort()) scan(join(path, name), rel ? `${rel}/${name}` : name, result)
  } else {
    const data = readFileSync(path)
    result[rel] = { bytes: data.length, sha256: sha(data) }
  }
  return result
}
const paths = Object.fromEntries(Object.entries(json(join(prior, 'protected-before.json')))
  .map(([name, value]) => [name, value.path]))
paths['own-r1'] = prior
if (fullDocument) paths['own-r2-facility'] = join(root, 'r2-facility')
const before = Object.fromEntries(Object.entries(paths).map(([name, path]) => [name, scan(path)]))
save('protected-before.json', before)
const include = [...new Set(json(join(prior, 'affected/summary.json')).cases.map(item => item.file))]
assert.equal(include.length, 18)
const config = {
  root: pkg, cacheDir: join(own, 'cache/vite'), esbuild: { jsx: 'automatic' },
  test: { environment: 'node', pool: 'forks', poolOptions: { forks: { singleFork: true } },
    minWorkers: 1, maxWorkers: 1, fileParallelism: false, testTimeout: 15000, hookTimeout: 15000,
    include, setupFiles: [join(own, 'browser-scheduler-setup.mjs')] },
}
let configText = `const config = ${JSON.stringify(config, null, 2)}\n`
if (fullDocument) {
  const fixtureFile = join(pkg, 'src/client/panel-checklist-toggle.test.tsx')
  const original = readFileSync(fixtureFile, 'utf8')
  const beforeStub = "vi.stubGlobal('document', { activeElement: null })"
  const afterStub = "vi.stubGlobal('document', globalThis.__qaSchedulerDocument)"
  assert.equal(original.split(beforeStub).length, 2)
  const adapted = original.replace(beforeStub, afterStub)
  save('checklist-document-fixture.test.tsx', adapted)
  save('fixture-adapter.json', { file: fixtureFile, originalSha256: sha(original),
    adaptedSha256: sha(adapted), beforeStub, afterStub, assertionsAndProductUnchanged: true })
  const diff = spawnSync('/usr/bin/diff', ['-u', '--label', 'original-checklist-test',
    '--label', 'independent-full-document-fixture', fixtureFile, join(own, 'checklist-document-fixture.test.tsx')],
  { encoding: 'utf8' })
  assert.equal(diff.status, 1)
  save('fixture-adapter.diff', diff.stdout)
  configText += `config.plugins = [{
  name: 'independent-test-browser-document-prerequisite',
  enforce: 'pre',
  transform(code, id) {
    if (id !== ${JSON.stringify(fixtureFile)}) return null
    return { code: ${JSON.stringify(adapted)}, map: null }
  }
}]\n`
}
save('vitest.config.mjs', configText + 'export default config\n')
save('browser-scheduler-setup.mjs', `import { beforeEach, afterAll, vi } from ${JSON.stringify(join(pkg, 'node_modules/vitest/dist/index.js'))}
import { JSDOM } from ${JSON.stringify(join(prior, 'dom-deps/node_modules/jsdom/lib/api.js'))}
// Supply a real browser scheduler only, not a product/hook/component replacement.
const scheduler = new JSDOM('', { pretendToBeVisual: true })
${fullDocument ? `// Baseline real DOM remains available to callbacks after old tests restore their globals.
globalThis.document = scheduler.window.document
globalThis.HTMLElement = scheduler.window.HTMLElement
globalThis.requestAnimationFrame = scheduler.window.requestAnimationFrame.bind(scheduler.window)
globalThis.cancelAnimationFrame = scheduler.window.cancelAnimationFrame.bind(scheduler.window)
` : ''}beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', scheduler.window.requestAnimationFrame.bind(scheduler.window))
  vi.stubGlobal('cancelAnimationFrame', scheduler.window.cancelAnimationFrame.bind(scheduler.window))
  ${fullDocument ? "vi.stubGlobal('__qaSchedulerDocument', scheduler.window.document)" : ''}
})
afterAll(() => { scheduler.window.close() })
`)
save('candidate.json', {
  parent: json(join(prior, 'candidate.json')), tests: include,
  onlyFacilityChange: 'Vitest setup provides native jsdom pretendToBeVisual RAF/cancelRAF before each test',
  fullDocumentFixture: fullDocument,
  productAndTestsWritten: false, productionTransform: 'none', role: 'independent facility confirmation',
  noHookOrComponentMock: true, release: 'RELEASE_STOP',
})
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(own, 'home'),
  TMPDIR: join(own, 'tmp'), TMP: join(own, 'tmp'), TEMP: join(own, 'tmp'),
  XDG_CACHE_HOME: join(own, 'cache'), npm_config_cache: join(own, 'cache/npm'),
  DSH_HOME: join(own, 'dsh-home'), DSH_PM_FILE_ROOT: join(own, 'files'),
  DSH_PM_BACKUP_DIR: join(own, 'backups'), PM_FILE_ATOMIC_TMP: join(own, 'tmp'),
  CI: '1', LANG: 'zh_CN.UTF-8', TZ: 'UTC', NODE_ENV: 'development',
  QA_EVIDENCE_ROOT: join(own, 'observations'),
}
for (const path of Object.values(env).filter(value => value.startsWith(`${own}/`)))
  mkdirSync(path, { recursive: true, mode: 0o700 })
const args = [join(pkg, 'node_modules/vitest/vitest.mjs'), 'run', '--config', join(own, 'vitest.config.mjs'),
  '--no-cache', '--reporter=default', '--reporter=json', `--outputFile=${join(own, 'vitest.result.json')}`]
const started = new Date().toISOString()
const run = spawnSync(process.execPath, args, { cwd: pkg, env, encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024, timeout: 180000 })
const command = { argv: [process.execPath, ...args], cwd: pkg, env, runnerPid: process.pid, pid: run.pid,
  started, ended: new Date().toISOString(), node: process.version, exit: run.status,
  signal: run.signal, error: run.error?.message ?? null }
save('vitest.command.json', command)
save('vitest.stdout.txt', run.stdout ?? '')
save('vitest.stderr.txt', run.stderr ?? '')
const result = existsSync(join(own, 'vitest.result.json')) ? json(join(own, 'vitest.result.json')) : null
const summary = { ...command, files: result?.testResults.length, tests: result?.numTotalTests,
  green: result?.numPassedTests, failed: result?.numFailedTests, pending: result?.numPendingTests,
  success: result?.success,
  rafReferenceErrorPresent: /requestAnimationFrame is not defined/.test(run.stderr ?? ''),
  detachedTreeWarningPresent: /commit phase error inside a detached tree/.test(run.stderr ?? ''),
  uncaughtErrorPresent: /Error: Uncaught|Unhandled Rejection|Uncaught Exception/.test(run.stderr ?? '') }
save('summary.json', summary)
const after = Object.fromEntries(Object.entries(paths).map(([name, path]) => [name, scan(path)]))
const changed = Object.keys(before).filter(name => JSON.stringify(before[name]) !== JSON.stringify(after[name]))
save('close.json', { command, protectedChanged: changed, allProtectedUnchanged: changed.length === 0,
  childExited: run.status !== null && !run.signal && !run.error, release: 'RELEASE_STOP' })
save('sealed-evidence.json', scan(own))
console.log(JSON.stringify({ files: summary.files, tests: summary.tests, green: summary.green,
  failed: summary.failed, exit: summary.exit, rafReferenceErrorPresent: summary.rafReferenceErrorPresent,
  detachedTreeWarningPresent: summary.detachedTreeWarningPresent,
  uncaughtErrorPresent: summary.uncaughtErrorPresent, protectedChanged: changed }))
process.exitCode = changed.length || run.error ? 2 : summary.uncaughtErrorPresent ? 1 : run.status ?? 2
