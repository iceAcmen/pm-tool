import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a19-habit-suggestion-okr-independent-retest-20261022'
const out = join(repo, 'docs/testing', `${prefix}-selftmp`, 'r3')
const owned = '/private/tmp/pmtool-a19-independent-retest-20261022-r3'
const frozen = join(owned, 'frozen')
const pkg = 'packages/dsh-pm-tool'
const author = join(repo, 'reports/a19-habit-suggestion-okr-developer-20261022-evidence')
const authorMd = join(repo, 'reports/a19-habit-suggestion-okr-developer-20261022.md')
const depsSource = '/private/tmp/pmtool-a19-owned-deps-20261022/node_modules'
const deps = join(owned, 'dependencies/node_modules')
const expert = 'a19-habit-suggestion-okr-contract-20261022'
const expertFile = `docs/testing/${expert}-cases.test.tsx`
const independentFile = `docs/testing/${prefix}-cases.test.tsx`
const fixtureFile = 'docs/testing/board-fixture-clarification-20261021-fixture.json'
const originalRound = join(repo, `docs/testing/${expert}-selftmp/r1`)
const declaredInputs = ['src', 'scripts', 'locale', 'package.json', 'pnpm-lock.yaml',
  'tsconfig.json', 'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml']
const fullInputs = [...declaredInputs, 'README.md', '.gitignore', 'pnpm-workspace.yaml', 'tsconfig.core.json', 'docs']
const fields = ['sha256', 'bytes', 'link', 'mtimeMs', 'inode', 'dev']
const sha = data => createHash('sha256').update(data).digest('hex')
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(owned, 'home'), TMPDIR: join(owned, 'tmp'), DSH_HOME: join(owned, 'runtime'),
  XDG_CACHE_HOME: join(owned, 'cache'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1', GIT_OPTIONAL_LOCKS: '0',
}
function save(name, data) {
  const file = resolve(out, name)
  assert(file.startsWith(`${out}/`))
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 })
  writeFileSync(file, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' })
}
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(path) {
    const st = lstatSync(path), key = relative(root, path) || '.'
    const meta = { bytes: st.size, mtimeMs: st.mtimeMs, inode: st.ino, dev: st.dev }
    if (st.isSymbolicLink()) result[key] = { ...meta, link: readlinkSync(path) }
    else if (st.isDirectory()) for (const name of readdirSync(path).sort()) walk(join(path, name))
    else {
      assert(st.isFile(), path)
      result[key] = { ...meta, sha256: sha(readFileSync(path)) }
    }
  }
  walk(root)
  return result
}
function diff(a, b, compare = fields) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
    .filter(key => !a[key] || !b[key] || compare.some(field => a[key][field] !== b[key][field]))
    .map(path => ({ path, before: a[path], after: b[path] }))
}
const inputManifest = (root, inputs = fullInputs) => Object.fromEntries(inputs.flatMap(name =>
  Object.entries(inventory(join(root, pkg, name))).map(([key, value]) =>
    [`${pkg}/${name}${key === '.' ? '' : `/${key}`}`, value])))
function command(id, argv, cwd = repo, extraEnv = {}) {
  const e = { ...env, ...extraEnv }, start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), {
    cwd, env: e, encoding: 'utf8', timeout: 240000, maxBuffer: 128 * 1024 * 1024,
  })
  const record = { id, argv, cwd, env: e, start, end: new Date().toISOString(),
    pid: r.pid, originalExit: r.status, signal: r.signal, error: r.error?.message ?? null }
  save(`${id}.command.json`, record)
  save(`${id}.stdout.log`, r.stdout ?? '')
  save(`${id}.stderr.log`, r.stderr ?? '')
  console.log(JSON.stringify(record))
  return { ...record, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}
function git(id, args) {
  const r = command(id, ['/usr/bin/git', ...args])
  assert.equal(r.originalExit, 0, r.stderr)
  return r.stdout
}
function protection() {
  const roots = [...Object.keys(read(join(author, 'protection-after.json'))),
    ...fullInputs.map(name => join(repo, pkg, name)), author, authorMd,
    join(repo, 'reports/a19-habit-suggestion-okr-developer-20261022-run.mjs'),
    join(repo, 'reports/a19-habit-suggestion-okr-developer-20261022-close.mjs'),
    join(repo, 'reports/all-pending-evidence-20261021/A18/growth-more'),
    join(repo, 'launcher/src'), join(repo, 'launcher/test'), depsSource,
    join(repo, independentFile), fileURLToPath(import.meta.url)]
  return Object.fromEntries([...new Set(roots)].sort().map(root => [root, inventory(root)]))
}
const protectionDiff = (a, b) => Object.entries(a).flatMap(([root, manifest]) =>
  diff(manifest, b[root] ?? {}).map(item => ({ root, ...item })))
function closure(source, copy) {
  const inodes = new Set(Object.values(source).filter(v => v.sha256).map(v => `${v.dev}:${v.inode}`))
  const links = Object.entries(copy).filter(([, v]) => v.link).map(([path, v]) => {
    const target = realpathSync(join(deps, path))
    return { path, link: v.link, target, internal: target.startsWith(`${deps}/`) }
  })
  const proof = {
    files: Object.values(copy).filter(v => v.sha256).length, links: links.length, linkTargets: links,
    externalLinks: links.filter(v => !v.internal),
    sharedInodes: Object.entries(copy).filter(([, v]) => v.sha256 && inodes.has(`${v.dev}:${v.inode}`)),
    contentDrift: diff(source, copy, ['sha256', 'bytes', 'link']),
    sourceDrift: diff(source, inventory(depsSource)),
    versions: Object.fromEntries(['vitest', 'react', 'react-test-renderer', 'typescript']
      .map(name => [name, read(join(deps, name, 'package.json')).version])),
    viteVersion: read(join(dirname(realpathSync(join(deps, 'vitest'))), 'vite/package.json')).version,
    shimPrefixTextNotModifiedOrExecuted: true,
  }
  assert.equal(proof.files, 13613)
  assert.equal(proof.links, 1030)
  assert.equal(proof.externalLinks.length + proof.sharedInodes.length +
    proof.contentDrift.length + proof.sourceDrift.length, 0)
  return proof
}
function authorReview() {
  const index = read(join(author, 'close/index.json'))
  for (const [path, info] of Object.entries(index.files)) {
    assert(resolve(author, path).startsWith(`${author}/`))
    const data = readFileSync(join(author, path))
    assert.equal(data.length, info.bytes, path)
    assert.equal(sha(data), info.sha256, path)
    if (path.endsWith('.json')) JSON.parse(data.toString())
  }
  assert.equal(index.count, 153)
  assert.deepEqual(Object.keys(inventory(author)).filter(p => p !== 'close/index.json' && !index.files[p]), [])
  const seal = read(join(author, 'seal.json'))
  assert.equal(seal.protectedEntries, 8407)
  assert(seal.resourcesReleased)
  for (const key of ['protectionDrift', 'depsDrift', 'sourceDepsDrift', 'mainDrift',
    'redDrift', 'greenDrift', 'fixtureSourceDrift', 'fixtureCopyDrift']) assert.deepEqual(seal[key], [])
  const red = read(join(author, 'red/necessary.result.json'))
  assert.equal(red.numFailedTests, 13)
  assert.equal(read(join(author, 'red/necessary.command.json')).originalExit, 1)
  assert(red.testResults.flatMap(t => t.assertionResults).filter(a => a.status === 'failed')
    .every(a => a.failureMessages[0].includes('自身关联标签')))
  const ownPaths = [`${pkg}/src/client/views/habits.tsx`, `${pkg}/src/client/views/habits-suggestion-okr.test.tsx`]
  const authorDelta = diff(read(join(author, 'red/manifest.json')), read(join(author, 'green/manifest.json')),
    ['sha256', 'bytes', 'link'])
  assert.deepEqual(authorDelta.map(v => v.path).sort(), [...ownPaths].sort())
  assert.deepEqual(diff(read(join(author, 'green/manifest.json')), inputManifest(repo, declaredInputs),
    ['sha256', 'bytes', 'link']), [])
  const expected = ['f8434485002b4b6aab494655ee31613c7caec15a9a4a5a3e9b87568f07f766f3',
    '8d7220cff8f01ed9d43dd00d1e59584936f4aa7ed68612aa40b56f00ca7cc709']
  ownPaths.forEach((path, i) => assert.equal(sha(readFileSync(join(repo, path))), expected[i]))
  return { mdSha256: sha(readFileSync(authorMd)), indexSha256: sha(readFileSync(join(author, 'close/index.json'))),
    indexedFiles: index.count, seal, authorDelta, currentDeclaredInputsMatchAuthor: true,
    original13RedRetained: true, oldShared10BinBlockedPreserved: true,
    productFingerprints: ownPaths.map((path, i) => ({ path, sha256: expected[i] })) }
}
function config() {
  save('vitest.config.mjs', `export default ${JSON.stringify({
    root: frozen, cacheDir: join(owned, 'cache/vite'), test: {
      environment: 'node', cache: false,
      include: [expertFile, independentFile, `${pkg}/src/**/*.test.ts`, `${pkg}/src/**/*.test.tsx`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } },
      minWorkers: 1, maxWorkers: 1, testTimeout: 20000,
    },
  }, null, 2)}\n`)
}
function test(id, files, pattern) {
  const r = command(id, [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files,
    '--config', join(out, 'vitest.config.mjs'), '--no-cache',
    '--reporter=verbose', '--reporter=json', '--outputFile', join(out, `${id}.result.json`),
    ...(pattern ? ['--testNamePattern', pattern] : [])],
  frozen, { HS_FIXTURE: join(out, 'replay-input.json'), HS_OBSERVATIONS: join(out, `${id}.observations.jsonl`) })
  const reporter = existsSync(join(out, `${id}.result.json`)) ? read(join(out, `${id}.result.json`)) : null
  return { id, pid: r.pid, originalExit: r.originalExit, signal: r.signal,
    passed: reporter?.numPassedTests, failed: reporter?.numFailedTests, pending: reporter?.numPendingTests,
    failedSuites: reporter?.numFailedTestSuites, reporterSha256: reporter ? sha(readFileSync(join(out, `${id}.result.json`))) : null }
}
const stage = process.argv[2]
assert(['freeze', 'run', 'supplement', 'seal', 'index'].includes(stage))
if (stage === 'freeze') {
  assert(!existsSync(out) && !existsSync(owned), 'Never overwrite previous retest evidence')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const name of ['home', 'tmp', 'runtime', 'cache']) mkdirSync(join(owned, name), { recursive: true, mode: 0o700 })
  save('author-review.json', authorReview())
  save('protection-before.json', protection())
  save('source-before.json', inputManifest(repo))
  const source = inventory(depsSource)
  save('dependencies/source-before.json', source)
  cpSync(depsSource, deps, { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
  const copy = inventory(deps)
  save('dependencies/copy-before.json', copy)
  save('dependencies/copyproof.json', closure(source, copy))
  for (const name of fullInputs) cpSync(join(repo, pkg, name), join(frozen, pkg, name),
    { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
  const manifest = inputManifest(frozen)
  assert.deepEqual(diff(read(join(out, 'source-before.json')), manifest, ['sha256', 'bytes', 'link']), [])
  assert.deepEqual(diff(read(join(out, 'source-before.json')), inputManifest(repo)), [])
  save('frozen-manifest.json', manifest)
  const patch = git('acquisition/package-tracked', ['diff', '--binary', '9b1a8c5', '--', pkg])
  save('candidate-package-tracked.patch', patch)
  save('candidate-full-tracked.patch', git('acquisition/full-tracked', ['diff', '--binary', '9b1a8c5']))
  const paths = git('acquisition/new-files', ['ls-files', '--others', '--exclude-standard', '--',
    ...fullInputs.map(name => `${pkg}/${name}`)]).trim().split('\n').filter(Boolean).sort()
  save('candidate-new-inputs.json', paths.map(path => ({ path, ...inventory(join(repo, path))['.'] })))
  const head = git('acquisition/head', ['rev-parse', 'HEAD']).trim()
  const originMain = git('acquisition/origin', ['rev-parse', 'origin/main']).trim()
  const baseline = git('acquisition/baseline', ['rev-parse', '9b1a8c5']).trim()
  save('candidate-status.txt', git('acquisition/status', ['status', '--short', '--', pkg]))
  for (const path of [expertFile, independentFile]) cpSync(join(repo, path), join(frozen, path), { preserveTimestamps: true })
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir')
  const fixture = readFileSync(join(originalRound, 'replay-input.json'))
  save('replay-input.json', fixture.toString())
  save('test-bindings.json', [expertFile, independentFile].map(path => ({
    path, sourceSha256: sha(readFileSync(join(repo, path))), frozenSha256: sha(readFileSync(join(frozen, path))),
  })))
  assert.equal(sha(fixture), sha(readFileSync(join(author, 'replay-input.json'))))
  const originalSeal = read(join(originalRound, 'seal.json'))
  assert.equal(originalSeal.preserved, false)
  assert.equal(originalSeal.released, false)
  save('original-state-binding.json', {
    fixtureSha256: sha(fixture), originalSeal, originalSummarySha256: sha(readFileSync(join(originalRound, 'summary.json'))),
    originalFinalCheckSha256: sha(readFileSync(join(originalRound, 'final-check-r2.json'))),
    historicalSharedBinBlockedNotReclassified: true,
  })
  save('candidate.json', { at: new Date().toISOString(), baseline, headObservedOnly: head, originMain,
    frozen, sourceTree: repo, inputs: fullInputs, authorDeclaredInputs: declaredInputs,
    completeSourceCount: Object.keys(manifest).filter(p => p.startsWith(`${pkg}/src/`)).length,
    completeInputCount: Object.keys(manifest).length,
    frozenManifestSha256: sha(readFileSync(join(out, 'frozen-manifest.json'))),
    packagePatchSha256: sha(patch), fullTrackedPatchSha256: sha(readFileSync(join(out, 'candidate-full-tracked.patch'))),
    newInputsSha256: sha(readFileSync(join(out, 'candidate-new-inputs.json'))),
    node: process.version, executable: process.execPath, os: os.release(), platform: os.platform(), arch: os.arch(),
    built: false, gui: false, services: false, credentials: false,
    excludedGeneratedOrRuntime: ['lib', 'node_modules', 'coverage', 'artifacts', 'backup', 'backups', '.tmp', '.verify-tmp', '.verify-logs', '607474Projects'],
  })
  config()
  console.log(JSON.stringify({ stage, completeInputs: Object.keys(manifest).length, depsFiles: 13613, links: 1030 }))
} else if (stage === 'run') {
  assert.deepEqual(diff(read(join(out, 'frozen-manifest.json')), inputManifest(frozen)), [])
  assert.deepEqual(diff(read(join(out, 'dependencies/copy-before.json')), inventory(deps)), [])
  const results = [
    test('necessary', [expertFile], '^HS-R'),
    test('controls', [expertFile], '^HS-C'),
    test('model', [`${pkg}/src/client/views/habit-model.test.ts`]),
    test('author', [`${pkg}/src/client/views/habits-suggestion-okr.test.tsx`]),
    test('independent', [independentFile]),
  ]
  const related = read(join(author, 'green/related-files.json'))
  save('affected-original-files.json', related)
  assert(!existsSync(join(frozen, fixtureFile)))
  results.push(test('affected-original-missing-fixture', related.map(path => `${pkg}/${path}`)))
  const type = command('typecheck', [process.execPath, join(deps, 'typescript/bin/tsc'),
    '--noEmit', '--incremental', 'false', '-p', join(frozen, pkg, 'tsconfig.json')], join(frozen, pkg))
  results.push({ id: 'typecheck', pid: type.pid, originalExit: type.originalExit })
  save('run-results.json', results)
  console.log(JSON.stringify(results))
  process.exitCode = results.some(r => r.originalExit !== 0) ? 1 : 0
} else if (stage === 'supplement') {
  const before = inventory(join(repo, fixtureFile))
  assert(!existsSync(join(frozen, fixtureFile)))
  save('supplement/fixture-source-before.json', before)
  cpSync(join(repo, fixtureFile), join(frozen, fixtureFile), { preserveTimestamps: true })
  const copied = inventory(join(frozen, fixtureFile))
  assert.deepEqual(diff(before, copied, ['sha256', 'bytes']), [])
  save('supplement/fixture-copy-before.json', copied)
  save('supplement/reason.json', {
    source: join(repo, fixtureFile), copy: join(frozen, fixtureFile),
    reason: 'Original BoardBento suite needs its original file; preserve first ENOENT and unchanged test expectations',
    adapter: false, modifiedAssertions: false,
  })
  const related = read(join(author, 'supplement/related-files.json'))
  save('supplement/affected-files.json', related)
  const result = test('supplement/affected', related.map(path => `${pkg}/${path}`))
  save('supplement/results.json', [result])
  console.log(JSON.stringify(result))
  process.exitCode = result.originalExit
} else if (stage === 'seal') {
  const before = read(join(out, 'protection-before.json')), after = protection()
  save('protection-after.json', after)
  const source = inventory(depsSource), copy = inventory(deps)
  save('dependencies/source-after.json', source)
  save('dependencies/copy-after.json', copy)
  save('dependencies/closure-after.json', closure(read(join(out, 'dependencies/source-before.json')), copy))
  const drifts = {
    protection: protectionDiff(before, after),
    source: diff(read(join(out, 'source-before.json')), inputManifest(repo)),
    frozen: diff(read(join(out, 'frozen-manifest.json')), inputManifest(frozen)),
    sourceDependencies: diff(read(join(out, 'dependencies/source-before.json')), source),
    ownDependencies: diff(read(join(out, 'dependencies/copy-before.json')), copy),
    originalFixture: diff(read(join(out, 'supplement/fixture-source-before.json')), inventory(join(repo, fixtureFile))),
    ownFixture: diff(read(join(out, 'supplement/fixture-copy-before.json')), inventory(join(frozen, fixtureFile))),
  }
  const bindings = read(join(out, 'test-bindings.json'))
  for (const binding of bindings) {
    assert.equal(binding.sourceSha256, sha(readFileSync(join(repo, binding.path))))
    assert.equal(binding.frozenSha256, sha(readFileSync(join(frozen, binding.path))))
  }
  const commands = [...read(join(out, 'run-results.json')), ...read(join(out, 'supplement/results.json'))]
  const pids = commands.map(c => c.pid).filter(Boolean)
  const processes = command('process-check', ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command='])
  const released = processes.originalExit === 1 && !processes.stdout.trim()
  const checks = [['necessary', 13], ['controls', 10], ['model', 10], ['author', 11],
    ['independent', 15], ['supplement/affected', 131]]
  const resultChecks = checks.map(([id, count]) => {
    const r = read(join(out, `${id}.result.json`)), c = read(join(out, `${id}.command.json`))
    return { id, expected: count, passed: r.numPassedTests, failed: r.numFailedTests,
      originalExit: c.originalExit, valid: c.originalExit === 0 && r.numPassedTests === count && r.numFailedTests === 0 }
  })
  const missing = read(join(out, 'affected-original-missing-fixture.result.json'))
  const originalFailurePreserved = read(join(out, 'affected-original-missing-fixture.command.json')).originalExit === 1 &&
    readFileSync(join(out, 'affected-original-missing-fixture.stderr.log'), 'utf8').includes('ENOENT') &&
    missing.numPassedTests === 80
  const preserved = Object.values(drifts).every(v => v.length === 0)
  const typecheck = read(join(out, 'typecheck.command.json')).originalExit
  const limitedPass = preserved && released && resultChecks.every(r => r.valid) && typecheck === 0 && originalFailurePreserved
  save('seal.json', { at: new Date().toISOString(), drifts, preserved, resourcesReleased: released, ownPids: pids,
    protectedEntries: Object.values(before).reduce((n, v) => n + Object.keys(v).length, 0),
    protectedUniquePaths: new Set(Object.entries(before).flatMap(([root, v]) => Object.keys(v).map(p => resolve(root, p)))).size,
    resultChecks, typecheckOriginalExit: typecheck, originalFailurePreserved,
    SOURCE: limitedPass ? 'LIMITED_PASS' : 'FAIL_OR_BLOCKED',
    AUTO: limitedPass ? 'LIMITED_PASS' : 'FAIL_OR_BLOCKED',
    GUI: 'NOT_RUN; original A18-GM-01 GUI FAIL remains; no transferred signature',
    oldShared10Bin: 'historical BLOCKED remains', noBuild: true, noInstall: true, noServices: true,
    noCredentials: true, noCommit: true, onlyOwnPrefixAndTmpWritten: true,
    notWatched: 'Other in-flight Main GUI/docs/runtime and whole disk; zero-drift claim limited to named roots',
  })
  console.log(JSON.stringify({ preserved, released, resultChecks, typecheck, originalFailurePreserved }))
  process.exitCode = limitedPass ? 0 : 1
} else {
  assert(read(join(out, 'seal.json')).resourcesReleased)
  const entries = {}
  for (const [path, info] of Object.entries(inventory(out))) {
    assert(info.sha256, path)
    entries[path] = { sha256: info.sha256, bytes: info.bytes }
  }
  save('index.json', { at: new Date().toISOString(), files: entries, count: Object.keys(entries).length,
    selfNotIncluded: true, report: `${prefix}.md` })
  console.log(JSON.stringify({ indexedFiles: Object.keys(entries).length }))
}
