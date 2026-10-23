import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync,
  realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a19-habit-card-wrap-developer-20261022'
const out = join(repo, 'reports', `${prefix}-evidence`)
const owned = '/private/tmp/pmtool-a19-habit-card-wrap-developer-20261022'
const pkg = 'packages/dsh-pm-tool'
const depsSource = '/private/tmp/pmtool-a19-owned-deps-20261022/node_modules'
const deps = join(owned, 'dependencies/node_modules')
const expert = 'docs/testing/a19-habit-card-wrap-contract-20261022-evidence'
const expertCase = `${expert}/supplement/corrected-cases.test.tsx`
const replayCase = 'docs/testing/a19-habit-card-wrap-contract-20261022-cases.test.tsx'
const inputs = ['src', 'scripts', 'locale', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
  'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml', 'README.md', '.gitignore',
  'pnpm-workspace.yaml', 'tsconfig.core.json', 'docs']
const products = [`${pkg}/src/client/panel.css`, `${pkg}/src/client/views/habits.tsx`]
const author = `${pkg}/src/client/views/habits-card-wrap.test.tsx`
const fixtures = ['docs/testing/board-fixture-clarification-20261021-fixture.json']
const affected = [
  'src/client/views/okr-model.test.ts', 'src/client/views/growth-form-props.test.ts',
  'src/client/form-validation.test.ts', 'src/client/shared/form-dirty.test.ts',
  'src/client/panel-transport-error-feedback.test.tsx', 'src/client/board/BoardBento-feedback.test.tsx',
  'src/client/views/tasks-number-feedback.test.tsx', 'src/client/result-card.test.ts',
  'src/client/result-card-copy.test.ts', 'src/core/ui-feedback.test.ts',
  'src/client/views/records/records-meeting-entry.test.tsx',
  'src/client/views/records/records-meeting-layout.test.tsx',
]
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(owned, 'home'), TMPDIR: join(owned, 'tmp'), DSH_HOME: join(owned, 'runtime'),
  XDG_CACHE_HOME: join(owned, 'cache'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1', GIT_OPTIONAL_LOCKS: '0',
}
const sha = data => createHash('sha256').update(data).digest('hex')
const read = path => JSON.parse(readFileSync(path, 'utf8'))
function save(name, value) {
  const path = resolve(out, name)
  assert(path.startsWith(`${out}/`))
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(path) {
    const st = lstatSync(path, { bigint: true }), key = relative(root, path) || '.'
    if (st.isDirectory()) {
      for (const name of readdirSync(path).sort()) walk(join(path, name))
      return
    }
    const meta = { bytes: Number(st.size), mtimeNs: String(st.mtimeNs), inode: String(st.ino), dev: String(st.dev) }
    if (st.isSymbolicLink()) result[key] = { ...meta, link: readlinkSync(path) }
    else { assert(st.isFile(), path); result[key] = { ...meta, sha256: sha(readFileSync(path)) } }
  }
  walk(root)
  return result
}
const diff = (a, b, fields = ['bytes', 'mtimeNs', 'inode', 'dev', 'sha256', 'link']) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
    .filter(p => !a[p] || !b[p] || fields.some(f => a[p][f] !== b[p][f]))
    .map(path => ({ path, before: a[path], after: b[path] }))
const sources = root => Object.fromEntries(inputs.flatMap(name =>
  Object.entries(inventory(join(root, pkg, name)))
    .map(([p, v]) => [`${pkg}/${name}${p === '.' ? '' : `/${p}`}`, v])))
const originalGui = ['width-1792634972808', 'suggestion-visible-1792634962691']
  .map(n => join(repo, 'reports/all-pending-evidence-20261021/A19/habit-association', n))
const oldTrees = [
  '/private/tmp/pmtool-a11-closure-20261021', '/private/tmp/pmtool-a12-closure-20261021',
  '/private/tmp/pmtool-a13-closure-20261022', '/private/tmp/pmtool-a14-closure-20261022',
  '/private/tmp/pmtool-a16-closure-20261022', '/private/tmp/pmtool-a18-closure-20261022',
  '/private/tmp/pmtool-a18-interface-output-20261022', '/private/tmp/pmtool-a19-closure-20261022',
]
const protectedRoots = [
  join(repo, pkg, 'lib'), ...oldTrees.map(root => join(root, pkg, 'lib')),
  ...['.vite', 'node_modules/.vite', 'node_modules/.cache', 'node_modules/.vite-temp']
    .map(n => join(repo, pkg, n)),
  ...inputs.map(n => join('/private/tmp/pmtool-a18-closure-20261022', pkg, n)),
  join(repo, 'AGENTS.md'), join(repo, 'docs/collaboration.md'), join(repo, 'docs/external-skills.md'),
  join(repo, 'docs/plans/2026-10-22-habit-card-wrap-closure.md'),
  join(repo, 'vendor/agent-skills'), depsSource, ...originalGui,
  ...readdirSync(join(repo, 'docs/testing')).filter(n =>
    n.startsWith('a19-habit-card-wrap-contract-20261022') ||
    n.startsWith('a19-habit-association-gui-review-20261022') ||
    n.startsWith('a19-habit-suggestion-okr-contract-20261022') ||
    n.startsWith('a19-habit-suggestion-okr-independent-retest-20261022'))
    .map(n => join(repo, 'docs/testing', n)),
  ...fixtures.map(n => join(repo, n)),
]
const protection = () => Object.fromEntries(protectedRoots.map(root => [root, inventory(root)]))
const protectionDiff = (a, b) => Object.entries(a).flatMap(([root, manifest]) =>
  diff(manifest, b[root] ?? {}).map(item => ({ root, ...item })))
function command(id, argv, cwd = repo, extra = {}) {
  const e = { ...env, ...extra }, start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env: e, encoding: 'utf8',
    timeout: 240000, maxBuffer: 128 * 1024 * 1024 })
  const receipt = { id, argv, cwd, env: e, start, end: new Date().toISOString(),
    pid: r.pid, originalExit: r.status, signal: r.signal, error: r.error?.message ?? null }
  save(`${id}.command.json`, receipt)
  save(`${id}.stdout.log`, r.stdout ?? '')
  save(`${id}.stderr.log`, r.stderr ?? '')
  console.log(JSON.stringify(receipt))
  return { ...receipt, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}
function git(id, args) {
  const r = command(id, ['/usr/bin/git', ...args])
  assert.equal(r.originalExit, 0, r.stderr)
  return r.stdout
}
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
    contentDrift: diff(source, copy, ['bytes', 'sha256', 'link']),
    sourceDrift: diff(source, inventory(depsSource)),
    versions: Object.fromEntries(['vitest', 'react', 'react-test-renderer', 'typescript']
      .map(n => [n, read(join(deps, n, 'package.json')).version])),
    boundary: 'Complete copy, internal symlink realpaths and disjoint regular inodes. Historical bin text not executed or modified.',
  }
  assert.equal(proof.files, 13613); assert.equal(proof.links, 1030)
  assert.equal(proof.externalLinks.length + proof.sharedInodes.length +
    proof.contentDrift.length + proof.sourceDrift.length, 0)
  return proof
}
function candidate(stage, root) {
  const manifest = sources(root)
  save(`${stage}/manifest.json`, manifest)
  save(`${stage}/full-tracked.patch`, git(`${stage}/tracked`, ['diff', '--binary', 'HEAD']))
  save(`${stage}/package-tracked.patch`, git(`${stage}/package-tracked`, ['diff', '--binary', 'HEAD', '--', pkg]))
  const paths = git(`${stage}/new-paths`, ['ls-files', '--others', '--exclude-standard', '--',
    ...inputs.map(n => `${pkg}/${n}`)]).trim().split('\n').filter(Boolean).sort()
  save(`${stage}/new-inputs.json`, paths.map(path => ({ path, ...inventory(join(repo, path))['.'] })))
  save(`${stage}/status.txt`, git(`${stage}/status`, ['status', '--short', '--', pkg]))
  save(`${stage}/candidate.json`, {
    at: new Date().toISOString(), baseline: git(`${stage}/head`, ['rev-parse', 'HEAD']).trim(),
    originObserved: git(`${stage}/origin`, ['rev-parse', 'origin/main']).trim(),
    sourceTree: repo, frozen: root, inputs, inputCount: Object.keys(manifest).length,
    sourceCount: Object.keys(manifest).filter(n => n.startsWith(`${pkg}/src/`)).length,
    manifestSha256: sha(readFileSync(join(out, `${stage}/manifest.json`))),
    fullTrackedPatchSha256: sha(readFileSync(join(out, `${stage}/full-tracked.patch`))),
    packageTrackedPatchSha256: sha(readFileSync(join(out, `${stage}/package-tracked.patch`))),
    newInputsSha256: sha(readFileSync(join(out, `${stage}/new-inputs.json`))),
    productHashes: Object.fromEntries(products.map(path => [path, manifest[path].sha256])),
    node: process.version, executable: process.execPath, os: os.release(), arch: os.arch(),
    noBuildGuiCommit: true, independentPassSigned: false,
  })
  return manifest
}
function freeze(stage) {
  const root = join(owned, stage)
  assert(!existsSync(root), 'Reject reused source freeze')
  const before = sources(repo)
  for (const n of inputs) cpSync(join(repo, pkg, n), join(root, pkg, n),
    { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
  const manifest = candidate(stage, root)
  assert.deepEqual(diff(before, manifest, ['bytes', 'sha256', 'link']), [])
  assert.deepEqual(diff(before, sources(repo)), [])
  assert(!Object.values(manifest).some(v => v.link), 'Source links need separate approval')
  cpSync(join(repo, expertCase), join(root, replayCase), { preserveTimestamps: true })
  for (const n of fixtures) cpSync(join(repo, n), join(root, n), { preserveTimestamps: true })
  symlinkSync(deps, join(root, 'node_modules'), 'dir')
  symlinkSync(deps, join(root, pkg, 'node_modules'), 'dir')
  save(`${stage}/extra-inputs.json`, Object.fromEntries([replayCase, ...fixtures]
    .map(n => [n, inventory(join(root, n))['.']])))
  save(`${stage}/vitest.config.mjs`, `export default ${JSON.stringify({
    root, cacheDir: join(owned, 'cache', stage), test: {
      include: [replayCase, `${pkg}/src/**/*.test.ts`, `${pkg}/src/**/*.test.tsx`],
      environment: 'node', cache: false, pool: 'forks',
      poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000,
    },
  }, null, 2)}\n`)
  return root
}
function test(stage, id, files, pattern) {
  const root = join(owned, stage), tool = read(join(out, 'tool-binding.json'))
  const r = command(`${stage}/${id}`, [process.execPath, tool.vitest, 'run', ...files,
    '--config', join(out, `${stage}/vitest.config.mjs`), '--no-cache',
    '--maxWorkers=1', '--minWorkers=1', '--reporter=verbose', '--reporter=json',
    '--outputFile', join(out, `${stage}/${id}.result.json`),
    ...(pattern ? ['--testNamePattern', pattern] : [])], root, {
    HC_FIXTURE: join(out, 'replay-input.json'), HC_CSS: join(root, pkg, 'src/client/panel.css'),
    HC_POSTCSS: tool.postcss, HC_OBSERVATIONS: join(out, `${stage}/${id}.observations.jsonl`),
  })
  const reporter = read(join(out, `${stage}/${id}.result.json`))
  return { id, pid: r.pid, originalExit: r.originalExit, signal: r.signal,
    passed: reporter.numPassedTests, failed: reporter.numFailedTests, pending: reporter.numPendingTests,
    failedSuites: reporter.numFailedTestSuites, assertions: reporter.testResults.flatMap(s => s.assertionResults)
      .map(a => ({ name: a.fullName, status: a.status, failureMessages: a.failureMessages })) }
}
function verifyVendor(id) {
  const r = command(id, [process.execPath, join(repo, pkg, 'scripts/verify-external-skills.mjs')])
  assert.equal(r.originalExit, 0)
  const base = join(repo, 'vendor/agent-skills/mattpocock'), manifest = read(join(base, 'manifest.json'))
  const files = manifest.skills.flatMap(s => s.files.map(f => {
    const bytes = readFileSync(join(base, f.path))
    assert.equal(sha(bytes), f.sha256); assert.equal(bytes.length, f.bytes)
    return { path: f.path, sha256: sha(bytes), bytes: bytes.length }
  }))
  save(`${id}-fingerprints.json`, { source: manifest.source, files, vendorIntegrityVerified: true,
    route: 'none', reason: 'Known trivial scoped repair; grill/tdd suppressed. HC01 independent FAIL still open; external-skills 6.1 blocks vendor loading including delivery. No vendor original loaded or setup run.' })
}
const stage = process.argv[2]
assert.equal(process.version, 'v22.23.3')
assert(['freeze', 'red', 'author-red', 'green', 'seal'].includes(stage))
if (stage === 'freeze') {
  assert(!existsSync(out) && !existsSync(owned), 'Reject earlier evidence overwrite')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'runtime', 'cache']) mkdirSync(join(owned, n), { recursive: true, mode: 0o700 })
  save('protection-before.json', protection())
  save('main-before.json', sources(repo))
  const before = inventory(depsSource)
  save('dependencies/source-before.json', before)
  cpSync(depsSource, deps, { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
  const copy = inventory(deps)
  save('dependencies/copy-before.json', copy)
  save('dependencies/copyproof.json', closure(before, copy))
  const correction = read(join(repo, expert, 'supplement/correction.json'))
  assert.equal(sha(readFileSync(join(repo, expertCase))), correction.correctedSha256)
  save('original-binding.json', { expertCase, correction, caseSha256: correction.correctedSha256,
    originalCaseSha256: sha(readFileSync(join(repo, expert, 'supplement/original-cases.test.tsx'))),
    fixtureSha256: sha(readFileSync(join(repo, expert, 'replay-input.json'))),
    expertSealSha256: sha(readFileSync(join(repo, expert, 'seal.json'))),
    originalSupplementSummarySha256: sha(readFileSync(join(repo, expert, 'supplement/summary.json'))) })
  cpSync(join(repo, expert, 'replay-input.json'), join(out, 'replay-input.json'), { preserveTimestamps: true })
  freeze('red')
  const postcssNames = readdirSync(join(deps, '.pnpm')).filter(n => n.startsWith('postcss@'))
  assert.equal(postcssNames.length, 1)
  save('tool-binding.json', { vitest: realpathSync(join(deps, 'vitest/vitest.mjs')),
    typescript: realpathSync(join(deps, 'typescript/bin/tsc')),
    postcss: join(deps, '.pnpm', postcssNames[0], 'node_modules/postcss') })
  verifyVendor('vendor-before')
  console.log('完整源/独占依赖与专家补件已冻结。')
}
if (stage === 'red') {
  assert.deepEqual(diff(read(join(out, 'main-before.json')), sources(repo)), [])
  assert.deepEqual(diff(read(join(out, 'red/manifest.json')), sources(join(owned, 'red'))), [])
  const rows = [test('red', 'necessary', [replayCase], '^HC-R'),
    test('red', 'controls', [replayCase], '^HC-C')]
  save('red/results.json', rows)
  assert.equal(rows[0].passed, 0); assert.equal(rows[0].failed, 4); assert.equal(rows[0].originalExit, 1)
  assert.equal(rows[1].passed, 9); assert.equal(rows[1].failed, 0); assert.equal(rows[1].originalExit, 0)
  save('red/dependencies-after.json', inventory(deps))
  save('red/main-after.json', sources(repo))
  save('red/protection-after.json', protection())
  assert.deepEqual(protectionDiff(read(join(out, 'protection-before.json')), read(join(out, 'red/protection-after.json'))), [])
  assert.deepEqual(diff(read(join(out, 'dependencies/copy-before.json')), inventory(deps)), [])
  process.exitCode = rows[0].originalExit
}
if (stage === 'author-red') {
  assert.deepEqual(diff(read(join(out, 'main-before.json')), sources(repo)).map(v => v.path), [author])
  const root = freeze('author-red')
  const r = test('author-red', 'author', [author])
  save('author-red/results.json', [r])
  assert(r.failed > 0 && r.originalExit === 1 && r.failedSuites > 0)
  assert.deepEqual(diff(read(join(out, 'author-red/manifest.json')), sources(root)), [])
  process.exitCode = r.originalExit
}
if (stage === 'green') {
  const delta = diff(read(join(out, 'main-before.json')), sources(repo))
  assert.deepEqual(delta.map(v => v.path).sort(), [...products, author].sort())
  save('authorized-source-delta.json', delta)
  const root = freeze('green')
  save('green/related-files.json', affected)
  const rows = [
    test('green', 'necessary', [replayCase], '^HC-R'),
    test('green', 'controls', [replayCase], '^HC-C'),
    test('green', 'author', [author]),
    test('green', 'habit-suggestion', [`${pkg}/src/client/views/habits-suggestion-okr.test.tsx`]),
    test('green', 'habit', [`${pkg}/src/client/views/habit-model.test.ts`]),
    test('green', 'affected', affected.map(n => `${pkg}/${n}`)),
  ]
  const t = command('green/typecheck', [process.execPath, read(join(out, 'tool-binding.json')).typescript,
    '--noEmit', '--incremental', 'false', '-p', join(root, pkg, 'tsconfig.json')], join(root, pkg))
  rows.push({ id: 'typecheck', pid: t.pid, originalExit: t.originalExit, signal: t.signal })
  save('green/results.json', rows)
  save('green/dependencies-after.json', inventory(deps))
  save('green/main-after.json', sources(repo))
  save('green/frozen-after.json', sources(root))
  assert.deepEqual(diff(read(join(out, 'dependencies/copy-before.json')), inventory(deps)), [])
  assert.deepEqual(diff(read(join(out, 'green/manifest.json')), sources(root)), [])
  console.log(JSON.stringify(rows.map(({ assertions, ...r }) => r)))
  process.exitCode = rows.find(r => r.originalExit !== 0)?.originalExit ?? 0
}
if (stage === 'seal') {
  verifyVendor('vendor-after')
  const before = read(join(out, 'protection-before.json')), after = protection()
  save('protection-after.json', after)
  const sourceAfter = inventory(depsSource), copyAfter = inventory(deps)
  save('dependencies/source-after.json', sourceAfter)
  save('dependencies/copy-after.json', copyAfter)
  save('dependencies/closure-after.json', closure(read(join(out, 'dependencies/source-before.json')), copyAfter))
  const rows = ['red', 'author-red', 'green'].flatMap(s => read(join(out, `${s}/results.json`)))
  const pidChecks = rows.map(r => {
    const ps = command(`release/pid-${r.pid}`, ['/bin/ps', '-o', 'pid=,ppid=,command=', '-p', String(r.pid)])
    return { pid: r.pid, originalExit: ps.originalExit, stdout: ps.stdout,
      exited: ps.originalExit === 1 && ps.stdout.trim() === '' }
  })
  const authorizedDelta = diff(read(join(out, 'main-before.json')), sources(repo))
  const sourceDrifts = ['red', 'author-red', 'green'].map(s => ({
    stage: s, delta: diff(read(join(out, `${s}/manifest.json`)), sources(join(owned, s))),
    extraDelta: Object.entries(read(join(out, `${s}/extra-inputs.json`))).flatMap(([p, v]) =>
      diff({ '.': v }, inventory(join(owned, s, p))).map(d => ({ file: p, ...d }))),
  }))
  const result = { at: new Date().toISOString(),
    protectedEntries: Object.values(before).reduce((n, v) => n + Object.keys(v).length, 0),
    protectionDrift: protectionDiff(before, after),
    dependencySourceDrift: diff(read(join(out, 'dependencies/source-before.json')), sourceAfter),
    dependencyCopyDrift: diff(read(join(out, 'dependencies/copy-before.json')), copyAfter),
    sourceDrifts, mainSinceGreenDrift: diff(read(join(out, 'green/main-after.json')), sources(repo)),
    authorizedDelta: authorizedDelta.map(d => d.path), pidChecks,
    resourcesReleased: pidChecks.every(p => p.exited), noBuildGuiCommit: true, stop: true,
    writeRoots: [out, owned, ...products.map(p => join(repo, p)), join(repo, author)],
    independentPassSigned: false,
    boundary: 'Fixed protected roots only. Main livingdocs/new GUI/live runtime and whole disk not watched; no global zero-pollution claim. Tmp retained, no deletion.',
  }
  save('seal.json', result)
  assert.deepEqual(result.authorizedDelta.sort(), [...products, author].sort())
  assert.equal(result.protectionDrift.length + result.dependencySourceDrift.length +
    result.dependencyCopyDrift.length + result.mainSinceGreenDrift.length +
    sourceDrifts.reduce((n, d) => n + d.delta.length + d.extraDelta.length, 0), 0)
  assert(result.resourcesReleased)
  console.log(JSON.stringify({ protectedEntries: result.protectedEntries,
    drift: result.protectionDrift.length, released: result.resourcesReleased }))
}
