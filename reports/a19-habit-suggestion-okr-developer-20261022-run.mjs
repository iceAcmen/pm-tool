import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a19-habit-suggestion-okr-developer-20261022'
const out = join(repo, 'reports', `${prefix}-evidence`)
const owned = '/private/tmp/pmtool-a19-habit-suggestion-okr-developer-20261022'
const pkg = 'packages/dsh-pm-tool'
const depsSource = '/private/tmp/pmtool-a19-owned-deps-20261022/node_modules'
const deps = join(owned, pkg, 'node_modules')
const expert = 'a19-habit-suggestion-okr-contract-20261022'
const expertFile = `docs/testing/${expert}-cases.test.tsx`
const expertRound = join(repo, `docs/testing/${expert}-selftmp/r1`)
const inputs = ['src', 'scripts', 'locale', 'package.json', 'pnpm-lock.yaml',
  'tsconfig.json', 'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml']
const productFile = `${pkg}/src/client/views/habits.tsx`
const authorFile = `${pkg}/src/client/views/habits-suggestion-okr.test.tsx`
const sha = data => createHash('sha256').update(data).digest('hex')
const read = file => JSON.parse(readFileSync(file, 'utf8'))
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(owned, 'home'), TMPDIR: join(owned, 'tmp'), DSH_HOME: join(owned, 'runtime'),
  XDG_CACHE_HOME: join(owned, 'cache'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1',
}
function save(name, data) {
  const file = resolve(out, name)
  assert(file.startsWith(`${out}/`))
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 })
  writeFileSync(file, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' })
}
function inventory(root) {
  const result = {}
  function walk(file) {
    const st = lstatSync(file), key = relative(root, file) || '.'
    const metadata = { bytes: st.size, mtimeMs: st.mtimeMs, inode: st.ino, dev: st.dev }
    if (st.isSymbolicLink()) result[key] = { ...metadata, link: readlinkSync(file) }
    else if (st.isDirectory()) for (const name of readdirSync(file).sort()) walk(join(file, name))
    else if (st.isFile()) result[key] = { ...metadata, sha256: sha(readFileSync(file)) }
    else throw new Error(`Unsupported input: ${file}`)
  }
  try { walk(root) } catch (error) { if (error.code !== 'ENOENT') throw error }
  return result
}
function diff(a, b, fields = ['sha256', 'bytes', 'link', 'mtimeMs', 'inode', 'dev']) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
    .filter(key => !a[key] || !b[key] || fields.some(field => a[key][field] !== b[key][field]))
    .map(path => ({ path, before: a[path], after: b[path] }))
}
const captureInputs = root => Object.fromEntries(inputs.flatMap(name =>
  Object.entries(inventory(join(root, pkg, name))).map(([key, value]) =>
    [`${pkg}/${name}${key === '.' ? '' : `/${key}`}`, value])))
function command(id, argv, cwd = repo, extraEnv = {}) {
  const start = new Date().toISOString(), e = { ...env, ...extraEnv }
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd, env: e, encoding: 'utf8', timeout: 180000, maxBuffer: 128 * 1024 * 1024,
  })
  const record = { id, argv, cwd, env: e, start, end: new Date().toISOString(), pid: result.pid,
    originalExit: result.status, signal: result.signal, error: result.error?.message ?? null }
  save(`${id}.stdout.log`, result.stdout ?? '')
  save(`${id}.stderr.log`, result.stderr ?? '')
  save(`${id}.command.json`, record)
  console.log(JSON.stringify(record))
  return { ...record, stdout: result.stdout, stderr: result.stderr }
}
function git(id, args) {
  const result = command(id, ['/usr/bin/git', ...args], repo, { GIT_OPTIONAL_LOCKS: '0' })
  assert.equal(result.originalExit, 0, result.stderr)
  return result.stdout
}
function candidate(stage, root) {
  const manifest = captureInputs(root)
  save(`${stage}/manifest.json`, manifest)
  const patch = git(`${stage}/tracked`, ['diff', '--binary', 'HEAD'])
  save(`${stage}/full-tracked.patch`, patch)
  save(`${stage}/status.txt`, git(`${stage}/status`, ['status', '--short', '--branch']))
  const paths = git(`${stage}/new-input-paths`, ['ls-files', '--others', '--exclude-standard', '--',
    ...inputs.map(name => `${pkg}/${name}`)]).trim().split('\n').filter(Boolean).sort()
  save(`${stage}/new-inputs.json`, paths.map(path => ({ path, ...inventory(join(repo, path))['.'] })))
  save(`${stage}/candidate.json`, {
    at: new Date().toISOString(), head: git(`${stage}/head`, ['rev-parse', 'HEAD']).trim(),
    originMain: git(`${stage}/origin`, ['rev-parse', 'origin/main']).trim(),
    sourceTree: repo, frozenTree: root, completeInputs: inputs,
    inputCount: Object.keys(manifest).length, sourceCount: Object.keys(manifest).filter(p => p.startsWith(`${pkg}/src/`)).length,
    manifestSha256: sha(readFileSync(join(out, `${stage}/manifest.json`))),
    fullTrackedPatchSha256: sha(patch), newInputsSha256: sha(readFileSync(join(out, `${stage}/new-inputs.json`))),
    node: process.version, executable: process.execPath, os: os.release(), arch: os.arch(),
    build: false, gui: false, passSigned: false,
  })
  return manifest
}
function fixedProtection() {
  const roots = [
    join(repo, pkg, 'lib'),
    ...['/private/tmp/pmtool-a11-closure-20261021', '/private/tmp/pmtool-a12-closure-20261021',
      '/private/tmp/pmtool-a13-closure-20261022', '/private/tmp/pmtool-a14-closure-20261022',
      '/private/tmp/pmtool-a16-closure-20261022', '/private/tmp/pmtool-a18-closure-20261022',
      '/private/tmp/pmtool-a18-interface-output-20261022'].map(root => join(root, pkg, 'lib')),
    ...inputs.map(name => join('/private/tmp/pmtool-a18-closure-20261022', pkg, name)),
    ...readdirSync(join(repo, 'docs/testing')).filter(name => name.startsWith(expert))
      .map(name => join(repo, 'docs/testing', name)),
    join(repo, 'docs/testing/a18-interface-full-regression-review-20261022-seal.json'),
    join(repo, 'reports/a19-shared-bin-drift-diagnosis-20261022.md'),
    join(repo, 'reports/all-pending-evidence-20261021/A19/dependencies'),
    ...[join(repo, pkg, 'node_modules/.vite'), join(repo, pkg, 'node_modules/.cache'),
      join(repo, pkg, 'node_modules/.vite-temp')],
  ]
  const files = Object.keys(read(join(repo, 'docs/testing/a18-growth-more-gui-review-20261022-audit-r2.json')).protectedBefore)
  return Object.fromEntries([...new Set([...roots, ...files])].sort().map(root => [root, inventory(root)]))
}
function protectionDiff(before, after) {
  return Object.entries(before).flatMap(([root, manifest]) =>
    diff(manifest, after[root] ?? {}).map(change => ({ root, ...change })))
}
function closureProof(source, copied) {
  const sourceInodes = new Set(Object.values(source).filter(item => !item.link).map(item => `${item.dev}:${item.inode}`))
  const links = Object.entries(copied).filter(([, item]) => item.link).map(([path, item]) => {
    const target = realpathSync(join(deps, path))
    return { path, link: item.link, target, internal: target.startsWith(`${deps}/`) }
  })
  const sharedInodes = Object.entries(copied).filter(([, item]) => !item.link && sourceInodes.has(`${item.dev}:${item.inode}`))
  const contentDrift = diff(source, copied, ['sha256', 'bytes', 'link'])
  const sourceDrift = diff(source, inventory(depsSource))
  const result = { files: Object.values(copied).filter(item => item.sha256).length, links: links.length,
    linkTargets: links, externalLinks: links.filter(item => !item.internal), sharedInodes, contentDrift, sourceDrift }
  assert.equal(result.files, 13613)
  assert.equal(result.links, 1030)
  assert.equal(result.externalLinks.length + sharedInodes.length + contentDrift.length + sourceDrift.length, 0)
  return result
}
function config(stage, root) {
  const file = join(out, `${stage}/vitest.config.mjs`)
  save(`${stage}/vitest.config.mjs`, `export default ${JSON.stringify({
    root, cacheDir: join(owned, 'cache', stage), test: {
      environment: 'node', cache: false,
      include: [expertFile, `${pkg}/src/**/*.test.ts`, `${pkg}/src/**/*.test.tsx`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } },
      minWorkers: 1, maxWorkers: 1, testTimeout: 20000,
    },
  }, null, 2)}\n`)
  return file
}
function test(stage, id, root, configuration, files, pattern) {
  const result = command(`${stage}/${id}`, [
    process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', ...files,
    '--config', configuration, '--no-cache', '--reporter=verbose', '--reporter=json',
    '--outputFile', join(out, `${stage}/${id}.result.json`),
    ...(pattern ? ['--testNamePattern', pattern] : []),
  ], root, { HS_FIXTURE: join(out, 'replay-input.json'),
    HS_OBSERVATIONS: join(out, `${stage}/${id}.observations.jsonl`) })
  const reporter = read(join(out, `${stage}/${id}.result.json`))
  return { id: result.id, pid: result.pid, originalExit: result.originalExit,
    passed: reporter.numPassedTests, failed: reporter.numFailedTests, pending: reporter.numPendingTests,
    reporterSha256: sha(readFileSync(join(out, `${stage}/${id}.result.json`))) }
}
const stage = process.argv[2]
assert(['freeze', 'red', 'green', 'supplement', 'seal'].includes(stage))
if (stage === 'freeze') {
  assert(!existsSync(out) && !existsSync(owned), 'Do not overwrite any earlier evidence')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const name of ['home', 'tmp', 'runtime', 'cache']) mkdirSync(join(owned, name), { recursive: true, mode: 0o700 })
  save('protection-before.json', fixedProtection())
  save('main-before.json', captureInputs(repo))
  const source = inventory(depsSource)
  save('dependencies/source-before.json', source)
  cpSync(depsSource, deps, { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
  const copied = inventory(deps)
  save('dependencies/copy-before.json', copied)
  save('dependencies/copyproof.json', closureProof(source, copied))
  const root = join(owned, 'red')
  for (const name of inputs) cpSync(join(repo, pkg, name), join(root, pkg, name),
    { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
  const manifest = candidate('red', root)
  assert.deepEqual(diff(read(join(out, 'main-before.json')), manifest, ['sha256', 'bytes', 'link']), [])
  assert.deepEqual(diff(read(join(out, 'main-before.json')), captureInputs(repo)), [])
  cpSync(join(repo, expertFile), join(root, expertFile), { preserveTimestamps: true })
  symlinkSync(deps, join(root, pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(root, 'node_modules'), 'dir')
  const fixture = read(join(expertRound, 'replay-input.json'))
  save('replay-input.json', fixture)
  save('fixture-binding.json', { originalPath: join(expertRound, 'replay-input.json'),
    originalSha256: sha(readFileSync(join(expertRound, 'replay-input.json'))),
    originalSummarySha256: sha(readFileSync(join(expertRound, 'summary.json'))),
    originalSeal: read(join(expertRound, 'seal.json')),
    originalSharedBinDrift: read(join(expertRound, 'final-check-r2.json')).differences,
    oldEvidenceNotOverwritten: true })
  const adopted = ['verify-gantt-drag.mjs', 'verify-ui-feedback.mjs', 'feedback-context-contract.mjs']
  save('scripts3-binding.json', adopted.map(name => {
    const main = readFileSync(join(repo, pkg, 'scripts', name))
    const released = readFileSync(join('/private/tmp/pmtool-a18-interface-output-20261022', pkg, 'scripts', name))
    assert.equal(sha(main), sha(released))
    return { name, sha256: sha(main), bytes: main.length, matchesReleasedInterface: true }
  }))
  save('formal-profile-before.json', {
    path: `${os.homedir()}/.dsh/profiles/pm/node_modules/dsh-pm-tool`,
    link: readlinkSync(`${os.homedir()}/.dsh/profiles/pm/node_modules/dsh-pm-tool`),
    realpath: realpathSync(`${os.homedir()}/.dsh/profiles/pm/node_modules/dsh-pm-tool`),
  })
  command('listeners-before', ['/usr/sbin/lsof', '-nP', '-iTCP:3080', '-iTCP:3091', '-iTCP:3172', '-iTCP:3248', '-sTCP:LISTEN', '-Fpcn'])
  console.log(JSON.stringify({ stage, inputCount: Object.keys(manifest).length,
    depsFiles: 13613, internalLinks: 1030, built: false }))
} else if (stage === 'red' || stage === 'green') {
  const root = join(owned, stage)
  if (stage === 'green') {
    const delta = diff(read(join(out, 'main-before.json')), captureInputs(repo))
    assert.deepEqual(delta.map(item => item.path).sort(), [productFile, authorFile].sort())
    save('main-authorized-delta.json', delta)
    for (const name of inputs) cpSync(join(repo, pkg, name), join(root, pkg, name),
      { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
    candidate(stage, root)
    cpSync(join(repo, expertFile), join(root, expertFile), { preserveTimestamps: true })
    symlinkSync(deps, join(root, pkg, 'node_modules'), 'dir')
    symlinkSync(deps, join(root, 'node_modules'), 'dir')
  }
  assert.deepEqual(diff(read(join(out, `${stage}/manifest.json`)), captureInputs(root)), [])
  assert.deepEqual(diff(read(join(out, 'dependencies/copy-before.json')), inventory(deps)), [])
  const configuration = config(stage, root)
  const results = [
    test(stage, 'necessary', root, configuration, [expertFile], '^HS-R'),
    test(stage, 'controls', root, configuration, [expertFile], '^HS-C'),
    test(stage, 'model', root, configuration, [`${pkg}/src/client/views/habit-model.test.ts`]),
  ]
  if (stage === 'green') {
    results.push(test(stage, 'author', root, configuration, [authorFile]))
    const related = [
      'src/client/views/okr-model.test.ts', 'src/client/views/growth-form-props.test.ts',
      'src/client/form-validation.test.ts', 'src/client/shared/form-dirty.test.ts',
      'src/client/panel-transport-error-feedback.test.tsx', 'src/client/board/BoardBento-feedback.test.tsx',
      'src/client/views/tasks-number-feedback.test.tsx',
    ]
    for (const [path] of Object.entries(captureInputs(root))) {
      if (/src\/client\/.*(?:records-.*test\.tsx|feedback.*test\.tsx|ui\/.*test\.tsx)$/.test(path)) {
        const rel = path.slice(pkg.length + 1)
        if (!related.includes(rel)) related.push(rel)
      }
    }
    save('green/related-files.json', related)
    results.push(test(stage, 'affected', root, configuration, related.map(path => `${pkg}/${path}`)))
    const typecheck = command('green/typecheck', [
      process.execPath, join(deps, 'typescript/bin/tsc'), '--noEmit', '--incremental', 'false',
      '-p', join(root, pkg, 'tsconfig.json'),
    ], join(root, pkg))
    results.push({ id: typecheck.id, pid: typecheck.pid, originalExit: typecheck.originalExit })
  }
  save(`${stage}/results.json`, results)
  save(`${stage}/dependencies-after.json`, inventory(deps))
  save(`${stage}/main-after.json`, captureInputs(repo))
  save(`${stage}/frozen-after.json`, captureInputs(root))
  console.log(JSON.stringify({ stage, results, passSigned: false }))
  process.exitCode = results.some(result => result.originalExit !== 0) ? 1 : 0
} else if (stage === 'supplement') {
  const root = join(owned, 'green')
  const fixturePath = 'docs/testing/board-fixture-clarification-20261021-fixture.json'
  const before = inventory(join(repo, fixturePath))
  save('supplement/fixture-source-before.json', before)
  assert(!existsSync(join(root, fixturePath)))
  cpSync(join(repo, fixturePath), join(root, fixturePath), { preserveTimestamps: true })
  const copied = inventory(join(root, fixturePath))
  assert.deepEqual(diff(before, copied, ['sha256', 'bytes']), [])
  save('supplement/fixture-copy-before.json', copied)
  save('supplement/input-binding.json', {
    source: join(repo, fixturePath), copy: join(root, fixturePath), fingerprint: copied,
    reason: 'Existing BoardBento test reads this original fixture; first ENOENT retained; no test adapter or assertion edit',
  })
  assert.deepEqual(diff(read(join(out, 'green/manifest.json')), captureInputs(root)), [])
  const related = [...read(join(out, 'green/related-files.json')),
    'src/client/result-card.test.ts', 'src/client/result-card-copy.test.ts',
    'src/core/ui-feedback.test.ts']
  save('supplement/related-files.json', related)
  const configuration = config(stage, root)
  const result = test(stage, 'affected', root, configuration, related.map(path => `${pkg}/${path}`))
  save('supplement/results.json', [result])
  save('supplement/dependencies-after.json', inventory(deps))
  console.log(JSON.stringify({ stage, result, passSigned: false }))
  process.exitCode = result.originalExit
} else {
  const before = read(join(out, 'protection-before.json')), after = fixedProtection()
  save('protection-after.json', after)
  const sourceAfter = inventory(depsSource), copyAfter = inventory(deps)
  save('dependencies/source-after.json', sourceAfter)
  save('dependencies/copy-after.json', copyAfter)
  save('dependencies/closure-after.json', closureProof(read(join(out, 'dependencies/source-before.json')), copyAfter))
  const protectionDrift = protectionDiff(before, after)
  const depsDrift = diff(read(join(out, 'dependencies/copy-before.json')), copyAfter)
  const sourceDepsDrift = diff(read(join(out, 'dependencies/source-before.json')), sourceAfter)
  const mainDrift = diff(read(join(out, 'green/main-after.json')), captureInputs(repo))
  const redDrift = diff(read(join(out, 'red/manifest.json')), captureInputs(join(owned, 'red')))
  const greenDrift = diff(read(join(out, 'green/manifest.json')), captureInputs(join(owned, 'green')))
  const delta = diff(read(join(out, 'main-before.json')), captureInputs(repo))
  const fixturePath = 'docs/testing/board-fixture-clarification-20261021-fixture.json'
  const fixtureSourceDrift = diff(read(join(out, 'supplement/fixture-source-before.json')), inventory(join(repo, fixturePath)))
  const fixtureCopyDrift = diff(read(join(out, 'supplement/fixture-copy-before.json')), inventory(join(owned, 'green', fixturePath)))
  const pids = ['red', 'green', 'supplement'].flatMap(stage => read(join(out, `${stage}/results.json`)).map(item => item.pid)).filter(Boolean)
  const processes = command('process-check', ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command='])
  command('listeners-after', ['/usr/sbin/lsof', '-nP', '-iTCP:3080', '-iTCP:3091', '-iTCP:3172', '-iTCP:3248', '-sTCP:LISTEN', '-Fpcn'])
  const profile = read(join(out, 'formal-profile-before.json'))
  assert.equal(readlinkSync(profile.path), profile.link)
  assert.equal(realpathSync(profile.path), profile.realpath)
  const result = { at: new Date().toISOString(), protectionDrift, depsDrift, sourceDepsDrift,
    mainDrift, redDrift, greenDrift, fixtureSourceDrift, fixtureCopyDrift,
    authorizedMainDelta: delta.map(item => item.path),
    protectedEntries: Object.values(before).reduce((n, manifest) => n + Object.keys(manifest).length, 0),
    resourcesReleased: processes.originalExit === 1 && !processes.stdout.trim(),
    ownPids: pids, formalProfileUnchanged: true,
    originalA19SharedBinFailurePreserved: true, newCopyProofOnlyThisExecution: true,
    noBuild: true, noGui: true, noCommit: true, passSigned: false, stop: true,
    notWatched: 'Other ongoing Main GUI/docs/runtime and whole disk; not claimed unchanged',
  }
  save('seal.json', result)
  console.log(JSON.stringify(result))
  assert.deepEqual(delta.map(item => item.path).sort(), [productFile, authorFile].sort())
  process.exitCode = protectionDrift.length + depsDrift.length + sourceDepsDrift.length +
    mainDrift.length + redDrift.length + greenDrift.length + fixtureSourceDrift.length +
    fixtureCopyDrift.length || !result.resourcesReleased ? 1 : 0
}
