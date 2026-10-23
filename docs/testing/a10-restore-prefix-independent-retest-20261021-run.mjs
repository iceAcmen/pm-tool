import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, symlinkSync,
  existsSync, realpathSync, readdirSync, lstatSync, readlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '../..')
const prefix = 'a10-restore-prefix-independent-retest-20261021'
const own = join(import.meta.dirname, prefix + '-selftmp')
const deps = '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules'
const pkg = 'packages/dsh-pm-tool'
const oldCore = 'docs/testing/a8-feedback-precheck-independent-retest-20261021-selftmp/frozen/' + pkg + '/src/core/ui-feedback.ts'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = file => JSON.parse(readFileSync(file, 'utf8'))
const save = (name, value) => writeFileSync(join(own, name), JSON.stringify(value, null, 2) + '\n')
function files(base, rel = '') {
  const path = join(base, rel)
  if (!existsSync(path)) return []
  return readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => entry.isDirectory() ? files(base, join(rel, entry.name)) : [join(rel, entry.name)])
}
function fingerprint(base, list, mtime = false) {
  return Object.fromEntries(list.map(path => {
    const file = join(base, path), stat = lstatSync(file)
    if (stat.isSymbolicLink()) return [path, { symlink: readlinkSync(file),
      ...(mtime ? { mtimeMs: stat.mtimeMs } : {}) }]
    const bytes = readFileSync(file)
    return [path, { bytes: bytes.length, sha256: hash(bytes), ...(mtime ? { mtimeMs: stat.mtimeMs } : {}) }]
  }))
}
function git(args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  assert.equal(r.status, 0)
  return r.stdout
}
function dependencies() {
  const req = createRequire(join(deps, '../package.json'))
  const vr = createRequire(realpathSync(req.resolve('vitest/package.json')))
  const vite = createRequire(realpathSync(vr.resolve('vite/package.json')))
  return Object.fromEntries(['react', 'react-test-renderer', 'vitest', 'typescript', 'lucide-react',
    'zod', 'react-grid-layout', 'vite', 'esbuild'].map(name => {
    const resolver = name === 'vite' ? vr : name === 'esbuild' ? vite : req
    const entry = realpathSync(resolver.resolve(name))
    const packagePath = realpathSync(resolver.resolve(name + '/package.json'))
    const directory = dirname(packagePath)
    const selected = ['package.json', ...(existsSync(join(directory, 'cjs'))
      ? files(directory, 'cjs').filter(p => p.endsWith('.js')) : [])]
    return [name, { version: json(packagePath).version, entry, packagePath,
      entrySha256: hash(readFileSync(entry)), files: fingerprint(directory, selected, true) }]
  }))
}
function guards() {
  const paths = [...files(root, pkg + '/src'), ...files(root, pkg + '/lib'),
    ...files(root, 'docs/testing').filter(p => !p.startsWith('docs/testing/' + prefix)),
    ...['AGENTS.md', 'docs/collaboration.md', 'docs/progress.md', 'docs/changelog.md',
      'docs/handoff.md', 'docs/onboarding-prompt.md', 'docs/requirements.md', 'docs/decision-log.md',
      'docs/knowledge-base.md', 'docs/issues-and-solutions.md', 'docs/plans/2026-10-21-restore-prefix-closure.md',
      ...['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts'].map(n => pkg + '/' + n)]]
  const caches = Object.fromEntries([deps, join(root, pkg, 'node_modules')].flatMap(base =>
    ['.vite', '.vitest'].map(name => {
      const path = join(base, name)
      return [path, { exists: existsSync(path), files: fingerprint(path, files(path), true) }]
    })))
  return { protected: fingerprint(root, [...new Set(paths)].sort(), true), caches }
}
function delta(before, after) {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  return keys.filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k])).map(path => ({
    path, before: before[path] ?? null, after: after[path] ?? null,
  }))
}
function postcheck(label) {
  const freeze = json(join(own, 'freeze.json'))
  const now = guards()
  const source = fingerprint(root, Object.keys(freeze.source))
  const copied = fingerprint(join(own, 'frozen'), Object.keys(freeze.source))
  const result = {
    at: new Date().toISOString(), baselineNow: git(['rev-parse', 'HEAD']).trim(),
    sourceDrift: delta(freeze.source, source),
    frozenDrift: delta(freeze.source, copied),
    protectedDrift: delta(freeze.guards.protected, now.protected),
    sharedCachesUnchanged: JSON.stringify(freeze.guards.caches) === JSON.stringify(now.caches),
    dependenciesUnchanged: JSON.stringify(freeze.dependencies) === JSON.stringify(dependencies()),
    ...(existsSync(join(own, 'success.freeze.json')) ? {
      supplementaryFrozenDrift: delta(json(join(own, 'success.freeze.json')).source,
        fingerprint(join(own, 'success-frozen'), Object.keys(json(join(own, 'success.freeze.json')).source))),
      supplementaryMainDrift: delta(json(join(own, 'success.freeze.json')).source,
        fingerprint(root, Object.keys(json(join(own, 'success.freeze.json')).source))),
    } : {}),
    watchedOnly: 'Enumerated product src/lib, other testing, listed living docs, dependency entries/CJS and four shared cache roots; not whole disk.',
  }
  save(label + '.postcheck.json', result)
  return result
}
const mode = process.argv[2]
if (mode === 'freeze') {
  assert(!existsSync(join(own, 'freeze.json')), 'Refuse to replace a frozen round')
  mkdirSync(own, { recursive: true })
  const sourcePaths = [...files(root, pkg + '/src'),
    ...['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts'].map(n => pkg + '/' + n),
    'docs/testing/board-fixture-clarification-20261021-fixture.json',
    'docs/testing/a8-gui-supplement-independent-review-20261021-repair-contract.md',
    'docs/plans/2026-10-21-restore-prefix-closure.md', oldCore,
    'docs/testing/a8-board-feedback-contract-20261021.md',
    'docs/testing/a8-board-feedback-contract-20261021-selftmp/feedback-r3.test.tsx.txt',
    'docs/testing/a8-board-feedback-contract-20261021-selftmp/freeze.json',
  ].sort()
  const source = fingerprint(root, sourcePaths), dep = dependencies(), guard = guards()
  const baseline = git(['rev-parse', 'HEAD']).trim()
  const diff = git(['diff', '--binary', '--', pkg + '/src', pkg + '/package.json', pkg + '/pnpm-lock.yaml'])
  const status = git(['status', '--short', '--untracked-files=all', '--', pkg + '/src', pkg + '/package.json', pkg + '/pnpm-lock.yaml'])
  writeFileSync(join(own, 'tracked.diff'), diff)
  writeFileSync(join(own, 'scope-status.txt'), status)
  for (const path of sourcePaths) {
    const target = join(own, 'frozen', path)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(root, path), target)
  }
  assert.deepEqual(fingerprint(root, sourcePaths), source, 'Source moved during freeze')
  assert.deepEqual(fingerprint(join(own, 'frozen'), sourcePaths), source, 'Frozen copy mismatch')
  // The package-local directory is private. Only declared dependency links target the read-only donor.
  for (const base of [own, join(own, 'frozen', pkg)]) {
    const target = join(base, 'node_modules')
    mkdirSync(target, { recursive: true })
    for (const name of readdirSync(deps)) {
      if (name.startsWith('.')) continue
      symlinkSync(join(deps, name), join(target, name))
    }
  }
  save('freeze.json', {
    at: new Date().toISOString(), candidate: 'A10-A8RV02-prefix-Main-dirty-source-frozen',
    baseline, source, dependencies: dep, guards: guard,
    trackedDiffSha256: hash(diff), scopeStatusSha256: hash(status),
    untracked: status.split('\n').filter(s => s.startsWith('?? ')).map(s => s.slice(3)),
    oldCore, writeRoots: [own, join(root, 'docs/testing/' + prefix + '*')],
    environment: { node: process.version, executable: process.execPath, platform: process.platform, arch: process.arch },
    excluded: 'No product edits, other testing/livingdocs, build, sharedcache, GUI, service, credential, commit.',
  })
  console.log(JSON.stringify({ own, baseline, sourceFiles: sourcePaths.length,
    versions: Object.fromEntries(Object.entries(dep).map(([n, v]) => [n, v.version])) }, null, 2))
} else if (mode === 'success-freeze') {
  assert(!existsSync(join(own, 'success.freeze.json')), 'Do not replace supplementary freeze')
  const list = [pkg + '/src/core/ui-feedback.ts', pkg + '/src/core/ui-feedback.test.ts',
    ...files(root, 'reports/all-pending-evidence-20261021/A10/success'),
    ...files(root, 'reports/all-pending-evidence-20261021/A10/prefix')]
  const source = fingerprint(root, list)
  for (const path of list) {
    const target = join(own, 'success-frozen', path)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(root, path), target)
  }
  assert.deepEqual(fingerprint(root, list), source)
  assert.deepEqual(fingerprint(join(own, 'success-frozen'), list), source)
  const base = join(own, 'success-frozen', pkg)
  mkdirSync(join(base, 'node_modules'), { recursive: true })
  for (const name of readdirSync(deps).filter(n => !n.startsWith('.'))) {
    symlinkSync(join(deps, name), join(base, 'node_modules', name))
  }
  save('success.freeze.json', { at: new Date().toISOString(), baseline: git(['rev-parse', 'HEAD']).trim(),
    source, dependencies: dependencies(), guards: guards(),
    scope: 'User 2026-10-21 supplemental authorization: source/examples commandAccepted only, no GUI/full gate' })
  console.log(JSON.stringify({ files: list.length, source }, null, 2))
} else if (['independent', 'independent-r2', 'author', 'author-prefix', 'author-prefix-r2', 'author-success', 'counterfactual',
  'counterfactual-prefix', 'counterfactual-prefix-r2', 'facility', 'source', 'success', 'success-r2'].includes(mode)) {
  assert(!existsSync(join(own, mode + '.execution.json')), 'Do not overwrite raw run')
  const facilityPaths = [resolve(import.meta.filename), join(own, mode === 'source' ? 'source-audit.mjs' : 'vitest.config.mjs'),
    ...(mode.startsWith('independent') ? [join(own, 'independent.test.tsx')] : []),
    ...(mode.startsWith('success') ? [join(own, 'success.test.ts')] : []),
    ...(mode === 'facility' ? [join(own, 'facility.test.tsx')] : [])]
  const facility = {}
  for (const [i, path] of facilityPaths.entries()) {
    const copy = mode + '.facility-' + i + '.txt'
    copyFileSync(path, join(own, copy))
    facility[path] = { sha256: hash(readFileSync(path)), copy }
  }
  const args = mode === 'source' ? [join(own, 'source-audit.mjs')] : [
    join(deps, 'vitest/vitest.mjs'), 'run', '--config', join(own, 'vitest.config.mjs'),
    '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile.json=' + join(own, mode + '.vitest.json')]
  const env = { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', A10_MODE: mode,
    TMPDIR: own, TMP: own, TEMP: own, NODE_COMPILE_CACHE: join(own, 'node-cache') }
  const before = guards()
  const startedAt = new Date().toISOString()
  const r = spawnSync(process.execPath, args, { cwd: own, encoding: 'utf8', timeout: 180000,
    maxBuffer: 16 * 1024 * 1024, env })
  writeFileSync(join(own, mode + '.stdout.txt'), r.stdout ?? '')
  writeFileSync(join(own, mode + '.stderr.txt'), r.stderr ?? '')
  const after = guards()
  save(mode + '.execution.json', { command: [process.execPath, ...args], cwd: own, facility, startedAt,
    endedAt: new Date().toISOString(), exit: r.status, signal: r.signal, error: r.error?.message ?? null,
    cacheDir: join(own, 'cache-' + mode), env: Object.fromEntries(
      ['NO_COLOR', 'FORCE_COLOR', 'A10_MODE', 'TMPDIR', 'TMP', 'TEMP', 'NODE_COMPILE_CACHE'].map(k => [k, env[k]])),
    stdoutSha256: hash(r.stdout ?? ''), stderrSha256: hash(r.stderr ?? ''),
    duringRunProtectedDrift: delta(before.protected, after.protected),
    duringRunSharedCachesUnchanged: JSON.stringify(before.caches) === JSON.stringify(after.caches) })
  const guard = postcheck(mode)
  console.log(r.stdout ?? '')
  console.error(r.stderr ?? '')
  console.log(JSON.stringify({ exit: r.status, frozenDrift: guard.frozenDrift.length,
    protectedDrift: guard.protectedDrift.length, sharedCachesUnchanged: guard.sharedCachesUnchanged,
    dependenciesUnchanged: guard.dependenciesUnchanged }))
  assert.equal(guard.frozenDrift.length, 0)
  assert(guard.dependenciesUnchanged && guard.sharedCachesUnchanged)
  process.exitCode = r.status ?? 1
} else if (mode === 'final') {
  const check = postcheck('final')
  const modes = ['source', 'independent', 'independent-r2', 'author', 'counterfactual', 'facility',
    'author-prefix', 'counterfactual-prefix', 'success', 'author-prefix-r2',
    'counterfactual-prefix-r2', 'author-success', 'success-r2']
  const rounds = Object.fromEntries(modes.map(mode => {
    const execution = json(join(own, mode + '.execution.json'))
    const vitest = existsSync(join(own, mode + '.vitest.json')) ? json(join(own, mode + '.vitest.json')) : null
    return [mode, { exit: execution.exit, signal: execution.signal,
      ...(vitest ? { passed: vitest.numPassedTests, failed: vitest.numFailedTests, skipped: vitest.numPendingTests } : {}),
      command: execution.command, executionSha256: hash(readFileSync(join(own, mode + '.execution.json'))),
      postcheckSha256: hash(readFileSync(join(own, mode + '.postcheck.json'))) }]
  }))
  save('summary.json', { at: new Date().toISOString(), rounds, guard: check,
    artifactHashes: fingerprint(own, files(own).filter(p => !p.includes('node_modules') &&
      !p.startsWith('cache-') && !p.startsWith('node-cache') && !p.startsWith('frozen/') &&
      !p.startsWith('success-frozen/') && !['summary.json'].includes(p))) })
  console.log(JSON.stringify({ rounds: Object.fromEntries(Object.entries(rounds).map(([name, r]) =>
    [name, { exit: r.exit, passed: r.passed, failed: r.failed, skipped: r.skipped }])),
    frozenDrift: check.frozenDrift.length, protectedDrift: check.protectedDrift.map(v => v.path),
    supplementaryFrozenDrift: check.supplementaryFrozenDrift?.length,
    supplementaryMainDrift: check.supplementaryMainDrift?.length,
    cachesUnchanged: check.sharedCachesUnchanged, dependenciesUnchanged: check.dependenciesUnchanged }, null, 2))
} else throw new Error('Use freeze/independent/author/counterfactual/facility/source/final')
