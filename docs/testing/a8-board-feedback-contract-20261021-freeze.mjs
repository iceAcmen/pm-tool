import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, symlinkSync, existsSync, realpathSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '../..')
const own = join(import.meta.dirname, 'a8-board-feedback-contract-20261021-selftmp')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const board = 'packages/dsh-pm-tool/src/client/board/'
const inputs = [
  ...['BoardBento.tsx', 'board.css', 'editor.tsx', 'widgets.tsx', 'persist.ts',
    'types.ts', 'layout-append.ts', 'project-default-layout.ts', 'refresh-confirm.ts',
    'projection.ts', 'migration-banner.ts', 'query.ts', 'formula.ts'].map(n => board + n),
  'packages/dsh-pm-tool/src/client/panel.tsx', 'packages/dsh-pm-tool/src/client/panel.css',
  'packages/dsh-pm-tool/package.json', 'packages/dsh-pm-tool/pnpm-lock.yaml',
  'packages/dsh-pm-tool/vitest.config.ts',
  'docs/testing/board-fixture-clarification-20261021-fixture.json',
  'docs/testing/a8-board-feedback-contract-20261021.md',
]
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = p => JSON.parse(readFileSync(p, 'utf8'))
const save = (name, data) => writeFileSync(join(own, name), JSON.stringify(data, null, 2) + '\n')
const fingerprints = () => Object.fromEntries(inputs.map(p => {
  const bytes = readFileSync(join(root, p))
  return [p, { bytes: bytes.length, sha256: hash(bytes) }]
}))
function dependencies() {
  const req = createRequire(join(deps, '../package.json'))
  const result = {}
  for (const name of ['react', 'react-test-renderer', 'react-grid-layout', 'vitest', 'typescript']) {
    const entry = realpathSync(req.resolve(name))
    const pkg = realpathSync(req.resolve(name + '/package.json'))
    result[name] = { version: json(pkg).version, entry, package: pkg,
      entrySha256: hash(readFileSync(entry)), packageSha256: hash(readFileSync(pkg)) }
    if (name === 'react' || name === 'react-test-renderer') {
      result[name].cjs = Object.fromEntries(readdirSync(join(dirname(pkg), 'cjs'))
        .filter(n => n.endsWith('.js')).map(n => [n, hash(readFileSync(join(dirname(pkg), 'cjs', n)))]))
    }
  }
  return result
}
function caches() {
  // Only these enumerated cache roots are watched, not all shared dependencies.
  return Object.fromEntries([deps, join(root, 'packages/dsh-pm-tool/node_modules')].flatMap(p =>
    ['.vite', '.vitest'].map(n => {
      const path = join(p, n)
      const entries = []
      function visit(dir) {
        for (const n of readdirSync(dir)) {
          const file = join(dir, n)
          const stat = statSync(file)
          if (stat.isDirectory()) visit(file)
          else entries.push({ path: file, sha256: hash(readFileSync(file)), mtimeMs: stat.mtimeMs })
        }
      }
      if (existsSync(path)) visit(path)
      return [path, { exists: existsSync(path), entries }]
    })))
}
const mode = process.argv[2]
if (mode === 'freeze') {
  mkdirSync(own, { recursive: true })
  assert(!existsSync(join(own, 'freeze.json')), 'Refuse to overwrite frozen red evidence')
  const source = fingerprints()
  const dep = dependencies()
  const watchedCaches = caches()
  const git = args => {
    const run = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
    assert.equal(run.status, 0)
    return run.stdout
  }
  const baseline = git(['rev-parse', 'HEAD']).trim()
  const diff = git(['diff', '--', ...inputs])
  const status = git(['status', '--short', '--', ...inputs])
  writeFileSync(join(own, 'tracked.diff'), diff)
  writeFileSync(join(own, 'scope-status.txt'), status)
  for (const p of inputs) {
    const target = join(own, 'frozen', p)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(root, p), target)
    assert.equal(hash(readFileSync(target)), source[p].sha256)
  }
  if (!existsSync(join(own, 'node_modules'))) symlinkSync(deps, join(own, 'node_modules'))
  assert.deepEqual(fingerprints(), source, 'Input drift during freeze')
  save('freeze.json', { at: new Date().toISOString(), candidate: 'A8-feedback-source-before-Main-handoff',
    baseline, source, dependencies: dep, watchedCaches, trackedDiffSha256: hash(diff),
    environment: { node: process.version, executable: process.execPath, platform: process.platform, arch: process.arch },
    scope: 'Frozen SOURCE and real BoardBento only; no build, GUI, service, credentials, persistence or commit' })
  console.log(JSON.stringify({ baseline, inputs: inputs.length, dependencies: dep, own }, null, 2))
} else if (mode === 'run' || /^run-r[2-9][0-9]*$/.test(mode)) {
  const frozen = json(join(own, 'freeze.json'))
  const suffix = mode === 'run' ? '' : '-' + mode.slice(4)
  assert(!existsSync(join(own, 'run' + suffix + '.json')), 'Do not overwrite the red run')
  const args = [join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(own, 'vitest.config.mjs'),
    '--reporter=verbose', '--reporter=json', '--outputFile.json=' + join(own, 'vitest' + suffix + '.json')]
  const startedAt = new Date().toISOString()
  copyFileSync(join(own, 'feedback.test.tsx'), join(own, 'feedback' + (suffix || '-r1') + '.test.tsx.txt'))
  copyFileSync(join(own, 'vitest.config.mjs'), join(own, 'vitest' + (suffix || '-r1') + '.config.mjs.txt'))
  const result = spawnSync(process.execPath, args, { cwd: own, encoding: 'utf8',
    timeout: 180000, maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', NODE_COMPILE_CACHE: join(own, 'node-cache'),
      A8_OBSERVATIONS: 'observations' + suffix + '.json', TMPDIR: own, TEMP: own, TMP: own } })
  writeFileSync(join(own, 'run' + suffix + '.log'), (result.stdout ?? '') + (result.stderr ?? ''))
  save('run' + suffix + '.json', { command: [process.execPath, ...args], cwd: own, startedAt, endedAt: new Date().toISOString(),
    exit: result.status, signal: result.signal, error: result.error?.message ?? null,
    logSha256: hash(readFileSync(join(own, 'run' + suffix + '.log'))), cacheDir: join(own, 'cache') })
  const now = fingerprints()
  const drift = inputs.filter(p => now[p].sha256 !== frozen.source[p].sha256)
  const depUnchanged = JSON.stringify(dependencies()) === JSON.stringify(frozen.dependencies)
  const cachesUnchanged = JSON.stringify(caches()) === JSON.stringify(frozen.watchedCaches)
  const copiesUnchanged = inputs.every(p =>
    hash(readFileSync(join(own, 'frozen', p))) === frozen.source[p].sha256)
  save('postcheck' + suffix + '.json', { at: new Date().toISOString(), drift, depUnchanged, cachesUnchanged, copiesUnchanged,
    watchedOnly: Object.keys(frozen.watchedCaches), currentSource: now })
  console.log(result.stdout)
  console.error(result.stderr)
  console.log(JSON.stringify({ exit: result.status, drift, depUnchanged, cachesUnchanged, copiesUnchanged }))
  assert(copiesUnchanged && depUnchanged, 'Frozen inputs/dependencies changed')
  process.exitCode = result.status ?? 1
} else {
  throw new Error('Use freeze, run or run-r2 (new log names)')
}
