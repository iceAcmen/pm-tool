import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, symlinkSync,
  existsSync, realpathSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '../..')
const own = join(import.meta.dirname, 'a8-feedback-precheck-independent-retest-20261021-selftmp')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const pkg = 'packages/dsh-pm-tool'
const old = 'docs/testing/a8-board-feedback-contract-20261021-selftmp'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = file => JSON.parse(readFileSync(file, 'utf8'))
const save = (name, value) => writeFileSync(join(own, name), JSON.stringify(value, null, 2) + '\n')
const git = args => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0)
  return result.stdout
}
function files(dir) {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]).sort()
}
function inputs() {
  return [...files(pkg + '/src'),
    ...['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts'].map(n => pkg + '/' + n),
    'docs/testing/board-fixture-clarification-20261021-fixture.json',
    'docs/testing/a8-board-feedback-contract-20261021.md',
    'docs/testing/a8-board-feedback-contract-20261021-review.md',
    'docs/testing/a8-board-feedback-contract-20261021-main-author.md',
    'docs/testing/a7-restore-gui-independent-review-20261021-repair-contract.md',
    'docs/plans/2026-10-21-precheck-and-board-feedback-closure.md',
    old + '/feedback-r3.test.tsx.txt', old + '/freeze.json',
    old + '/frozen/packages/dsh-pm-tool/src/client/board/BoardBento.tsx',
    old + '/frozen/packages/dsh-pm-tool/src/client/panel.tsx',
    old + '/frozen/packages/dsh-pm-tool/src/client/board/editor.tsx',
    'docs/testing/backup-web-independent-retest-20261021-evidence/Main-A7-frozen-panel.tsx.txt',
    ...files('reports/all-pending-evidence-20261021/A8/precheck'),
    ...files('reports/all-pending-evidence-20261021/A8/board-feedback'),
  ].sort()
}
function fingerprint(list, base = root) {
  return Object.fromEntries(list.map(path => {
    const bytes = readFileSync(join(base, path))
    return [path, { bytes: bytes.length, sha256: hash(bytes) }]
  }))
}
function dependencies() {
  const req = createRequire(join(deps, '../package.json'))
  const vitestReq = createRequire(realpathSync(req.resolve('vitest/package.json')))
  const viteReq = createRequire(realpathSync(vitestReq.resolve('vite/package.json')))
  return Object.fromEntries(['react', 'react-test-renderer', 'vitest', 'typescript', 'lucide-react',
    'zod', 'react-grid-layout', 'vite', 'esbuild'].map(name => {
    const resolver = name === 'vite' ? vitestReq : name === 'esbuild' ? viteReq : req
    const entry = realpathSync(resolver.resolve(name))
    const packagePath = realpathSync(resolver.resolve(name + '/package.json'))
    const value = { version: json(packagePath).version, entry, packagePath,
      entrySha256: hash(readFileSync(entry)), packageSha256: hash(readFileSync(packagePath)) }
    if (name === 'react' || name === 'react-test-renderer') {
      value.cjs = Object.fromEntries(readdirSync(join(dirname(packagePath), 'cjs'))
        .filter(n => n.endsWith('.js')).sort().map(n => [n, hash(readFileSync(join(dirname(packagePath), 'cjs', n)))]))
    }
    return [name, value]
  }))
}
function caches() {
  return Object.fromEntries([deps, join(root, pkg, 'node_modules')].flatMap(base =>
    ['.vite', '.vitest'].map(name => {
      const path = join(base, name)
      const entries = []
      function walk(dir) {
        for (const name of readdirSync(dir).sort()) {
          const file = join(dir, name), stat = statSync(file)
          if (stat.isDirectory()) walk(file)
          else entries.push({ path: file, sha256: hash(readFileSync(file)), mtimeMs: stat.mtimeMs })
        }
      }
      if (existsSync(path)) walk(path)
      return [path, { exists: existsSync(path), entries }]
    })))
}
const mode = process.argv[2]
if (mode === 'freeze') {
  assert(!existsSync(join(own, 'freeze.json')), 'Do not overwrite a frozen round')
  mkdirSync(own, { recursive: true })
  const list = inputs(), source = fingerprint(list), dep = dependencies(), watchedCaches = caches()
  const baseline = git(['rev-parse', 'HEAD']).trim()
  const diff = git(['diff', '--binary', '--', pkg + '/src', pkg + '/package.json', pkg + '/pnpm-lock.yaml'])
  const status = git(['status', '--short', '--untracked-files=all', '--', pkg + '/src', pkg + '/package.json', pkg + '/pnpm-lock.yaml'])
  writeFileSync(join(own, 'tracked.diff'), diff)
  writeFileSync(join(own, 'scope-status.txt'), status)
  for (const path of list) {
    const target = join(own, 'frozen', path)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(root, path), target)
  }
  assert.deepEqual(fingerprint(list), source, 'Source drift while freezing')
  assert.deepEqual(fingerprint(list, join(own, 'frozen')), source, 'Copy mismatch')
  symlinkSync(deps, join(own, 'node_modules'))
  copyFileSync(join(root, old, 'feedback-r3.test.tsx.txt'), join(own, 'feedback.test.tsx'))
  save('freeze.json', { at: new Date().toISOString(), candidate: 'A8-feedback-precheck-Main-new-source-independent',
    baseline, source, dependencies: dep, watchedCaches, diffSha256: hash(diff),
    scopeStatusSha256: hash(status),
    newSourceFiles: status.split('\n').filter(s => s.startsWith('?? ')).map(s => s.slice(3)),
    oldExpertTest: { path: old + '/feedback-r3.test.tsx.txt', copiedSha256: hash(readFileSync(join(own, 'feedback.test.tsx'))) },
    environment: { executable: process.execPath, node: process.version, platform: process.platform, arch: process.arch },
    writeRoots: [own], excluded: 'No build/lib, GUI, service, credentials, storage, shared cache or commit' })
  console.log(JSON.stringify({ own, baseline, inputs: list.length, dependencies: dep }, null, 2))
} else if (['expert', 'panel', 'author', 'source', 'source-r2', 'supplement'].includes(mode)) {
  const frozen = json(join(own, 'freeze.json'))
  assert(!existsSync(join(own, mode + '.execution.json')), 'Do not overwrite execution evidence')
  const isSource = mode.startsWith('source')
  const args = isSource ? [join(own, 'source-audit.mjs')] : [
    join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(own, 'vitest-' + mode + '.config.mjs'),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile.json=' + join(own, mode + '.vitest.json'),
  ]
  const facilityFiles = [join(import.meta.dirname, 'a8-feedback-precheck-independent-retest-20261021-run.mjs'),
    ...(isSource ? [join(own, 'source-audit.mjs')] : [join(own, 'vitest-' + mode + '.config.mjs')]),
    ...(mode === 'expert' ? [join(own, 'feedback.test.tsx')] : []),
    ...(mode === 'supplement' ? [join(own, 'supplement.test.tsx')] : []),
  ]
  const facility = Object.fromEntries(facilityFiles.map((path, i) => {
    copyFileSync(path, join(own, mode + '.facility-' + i + '.txt'))
    return [path, { sha256: hash(readFileSync(path)), copy: mode + '.facility-' + i + '.txt' }]
  }))
  const startedAt = new Date().toISOString()
  const result = spawnSync(process.execPath, args, { cwd: own, encoding: 'utf8', timeout: 180000,
    maxBuffer: 12 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0',
      NODE_COMPILE_CACHE: join(own, 'node-cache'), TMPDIR: own, TMP: own, TEMP: own,
      A8_OBSERVATIONS: 'expert.observations.json', A8_SOURCE_REPORT: mode + '.audit.json' } })
  writeFileSync(join(own, mode + '.stdout.txt'), result.stdout ?? '')
  writeFileSync(join(own, mode + '.stderr.txt'), result.stderr ?? '')
  save(mode + '.execution.json', { command: [process.execPath, ...args], cwd: own, facility, startedAt,
    endedAt: new Date().toISOString(), exit: result.status, signal: result.signal,
    error: result.error?.message ?? null,
    stdoutSha256: hash(result.stdout ?? ''), stderrSha256: hash(result.stderr ?? '') })
  const current = fingerprint(Object.keys(frozen.source))
  const drift = Object.keys(current).filter(path => current[path].sha256 !== frozen.source[path].sha256)
  const copiesUnchanged = JSON.stringify(fingerprint(Object.keys(frozen.source), join(own, 'frozen'))) === JSON.stringify(frozen.source)
  const depUnchanged = JSON.stringify(dependencies()) === JSON.stringify(frozen.dependencies)
  const cachesUnchanged = JSON.stringify(caches()) === JSON.stringify(frozen.watchedCaches)
  save(mode + '.postcheck.json', { at: new Date().toISOString(), drift, copiesUnchanged,
    depUnchanged, cachesUnchanged, watchedOnly: Object.keys(frozen.watchedCaches) })
  console.log(result.stdout)
  console.error(result.stderr)
  console.log(JSON.stringify({ exit: result.status, drift, copiesUnchanged, depUnchanged, cachesUnchanged }))
  assert(copiesUnchanged && depUnchanged, 'Frozen input or dependency drift')
  process.exitCode = result.status ?? 1
} else {
  throw new Error('Use freeze, expert, panel, author, source or supplement')
}
