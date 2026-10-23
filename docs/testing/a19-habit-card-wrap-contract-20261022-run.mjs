import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync,
  realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a19-habit-card-wrap-contract-20261022'
const out = join(repo, 'docs/testing', `${prefix}-evidence`)
const owned = '/private/tmp/pmtool-a19-hc01-contract-20261022-r1'
const frozen = join(owned, 'frozen')
const pkg = 'packages/dsh-pm-tool'
const depsSource = '/private/tmp/pmtool-a19-owned-deps-20261022/node_modules'
const deps = join(owned, 'dependencies/node_modules')
const inputs = ['src', 'scripts', 'locale', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
  'vitest.config.ts', 'tsdown.config.ts', 'cordis.patch.yml', 'README.md', '.gitignore',
  'pnpm-workspace.yaml', 'tsconfig.core.json', 'docs']
const caseFile = `docs/testing/${prefix}-cases.test.tsx`
const originalReport = 'docs/testing/a19-habit-association-gui-review-20261022.md'
const guiBase = 'reports/all-pending-evidence-20261021/A19/habit-association'
const originalDirs = ['width-1792634972808', 'suggestion-visible-1792634962691'].map(n => `${guiBase}/${n}`)
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
  assert(path.startsWith(`${out}/`), path)
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(path) {
    const st = lstatSync(path, { bigint: true }), key = relative(root, path) || '.'
    if (st.isDirectory()) {
      for (const n of readdirSync(path).sort()) walk(join(path, n))
      return
    }
    const meta = { bytes: Number(st.size), mtimeNs: String(st.mtimeNs), inode: String(st.ino), dev: String(st.dev) }
    if (st.isSymbolicLink()) result[key] = { ...meta, link: readlinkSync(path) }
    else {
      assert(st.isFile(), path)
      result[key] = { ...meta, sha256: sha(readFileSync(path)) }
    }
  }
  walk(root)
  return result
}
const fields = ['bytes', 'mtimeNs', 'inode', 'dev', 'sha256', 'link']
const diff = (a, b, compare = fields) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(p => !a[p] || !b[p] || compare.some(f => a[p][f] !== b[p][f]))
  .map(path => ({ path, before: a[path], after: b[path] }))
function sources(root) {
  return Object.fromEntries(inputs.flatMap(n => Object.entries(inventory(join(root, pkg, n)))
    .map(([p, v]) => [`${pkg}/${n}${p === '.' ? '' : `/${p}`}`, v])))
}
const protectedRoots = [
  ...inputs.map(n => join(repo, pkg, n)), join(repo, pkg, 'lib'),
  join(repo, pkg, '.vite'), join(repo, pkg, 'node_modules/.vite'), depsSource,
  ...originalDirs.map(n => join(repo, n)), join(repo, originalReport),
  join(repo, 'docs/testing/a19-habit-association-gui-review-20261022-seal.json'),
  join(repo, 'docs/testing/a19-habit-suggestion-okr-independent-retest-20261022.md'),
  join(repo, 'AGENTS.md'), join(repo, 'docs/collaboration.md'),
]
const protection = () => Object.fromEntries(protectedRoots.map(root => [root, inventory(root)]))
const protectionDiff = (a, b) => Object.entries(a).flatMap(([root, entries]) =>
  diff(entries, b[root] ?? {}).map(item => ({ root, ...item })))
function command(id, argv, cwd = frozen, extra = {}) {
  const e = { ...env, ...extra }, start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env: e, encoding: 'utf8',
    timeout: 180000, maxBuffer: 32 * 1024 * 1024 })
  const receipt = { id, argv, cwd, env: e, start, end: new Date().toISOString(),
    pid: r.pid, originalExit: r.status, signal: r.signal, error: r.error?.message ?? null }
  save(`${id}.command.json`, receipt)
  save(`${id}.stdout.log`, r.stdout ?? '')
  save(`${id}.stderr.log`, r.stderr ?? '')
  console.log(JSON.stringify(receipt))
  return { ...receipt, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}
function git(id, args) {
  const r = command(`acquisition/${id}`, ['/usr/bin/git', ...args], repo)
  assert.equal(r.originalExit, 0, r.stderr)
  return r.stdout
}
function closure(source, copy) {
  const sourceInodes = new Set(Object.values(source).filter(v => v.sha256).map(v => `${v.dev}:${v.inode}`))
  const links = Object.entries(copy).filter(([, v]) => v.link).map(([path, v]) => {
    const target = realpathSync(join(deps, path))
    return { path, link: v.link, target, internal: target.startsWith(`${deps}/`) }
  })
  const proof = {
    files: Object.values(copy).filter(v => v.sha256).length,
    links: links.length, linkTargets: links,
    externalLinks: links.filter(v => !v.internal),
    sharedInodes: Object.entries(copy).filter(([, v]) => v.sha256 && sourceInodes.has(`${v.dev}:${v.inode}`)),
    contentDrift: diff(source, copy, ['bytes', 'sha256', 'link']),
    sourceDrift: diff(source, inventory(depsSource)),
    versions: Object.fromEntries(['vitest', 'react', 'react-test-renderer'].map(n => [n, read(join(deps, n, 'package.json')).version])),
    shimTextNotExecutedOrModified: true,
    boundary: 'All lstat entries copied; symlinks resolve inside independent copy; regular inode disjoint. Not claiming arbitrary executable absolute-path closure.',
  }
  assert(proof.files > 0 && proof.links > 0)
  assert.equal(proof.externalLinks.length + proof.sharedInodes.length + proof.contentDrift.length + proof.sourceDrift.length, 0)
  return proof
}
function originalReview() {
  const expected = [
    ['width-1792634972808', 390, 900],
    ['suggestion-visible-1792634962691', 1440, 900],
  ]
  return expected.map(([n, width]) => {
    const dir = join(repo, guiBase, n), view = read(join(dir, 'view.json')), exit = read(join(dir, 'exit.json'))
    assert.equal(exit.exit, 0)
    assert.equal(view.layout.innerWidth, width)
    const png = readFileSync(join(dir, 'actual.png'))
    assert.equal(png.subarray(1, 4).toString(), 'PNG')
    assert(view.nodes.some(v => v.text.includes('F5习惯')))
    return { dir, originalExit: exit, viewport: view.layout, pngWidth: png.readUInt32BE(16),
      pngHeight: png.readUInt32BE(20), pngSha256: sha(png), viewSha256: sha(readFileSync(join(dir, 'view.json'))),
      independentlyViewedExistingImage: true, verdict: 'Original HC01 finite visual FAIL retained; no post-fix GUI performed' }
  })
}
const stage = process.argv[2]
assert(['freeze', 'run', 'supplement', 'seal', 'receipts', 'index'].includes(stage))
assert.equal(process.version, 'v22.23.3')
if (stage === 'freeze') {
  assert(!existsSync(out) && !existsSync(owned), 'Reject overwrite or reused owned root')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'runtime', 'cache']) mkdirSync(join(owned, n), { recursive: true, mode: 0o700 })
  save('protection-before.json', protection())
  save('original-review.json', originalReview())
  const before = sources(repo)
  save('source-before.json', before)
  const depBefore = inventory(depsSource)
  save('dependencies/source-before.json', depBefore)
  cpSync(depsSource, deps, { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
  const copy = inventory(deps)
  save('dependencies/copy-before.json', copy)
  save('dependencies/copyproof.json', closure(depBefore, copy))
  for (const n of inputs) cpSync(join(repo, pkg, n), join(frozen, pkg, n),
    { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
  const frozenManifest = sources(frozen)
  assert.deepEqual(diff(before, frozenManifest, ['bytes', 'sha256', 'link']), [])
  assert.deepEqual(diff(before, sources(repo)), [])
  assert(!Object.values(frozenManifest).some(v => v.link), 'Product source links need a separately approved freeze')
  save('frozen-manifest.json', frozenManifest)
  cpSync(join(repo, caseFile), join(frozen, caseFile), { preserveTimestamps: true })
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, pkg, 'node_modules'), 'dir')
  const raw = join(repo, originalDirs[0], 'raw')
  const habits = readdirSync(join(raw, 'habits')).sort().map(n => read(join(raw, 'habits', n)).record)
  const okrs = readdirSync(join(raw, 'okrs')).sort().map(n => read(join(raw, 'okrs', n)).record)
  const inbox = read(join(raw, 'settings/pmHabitInbox.json')).record.value.entries
  const title = okrs[0].title, continuous = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.repeat(2)
  assert(title.includes(continuous)); assert.equal(habits.length, 2); assert.equal(inbox.length, 4)
  save('replay-input.json', { props: { projectId: 'p-0001', habits, okrs, inbox },
    okrId: okrs[0].id, longTitle: title, continuous,
    provenance: originalDirs[0], historyControl: 'Separate component counterexample with valid old dates, not original GUI history' })
  const head = git('head', ['rev-parse', 'HEAD']).trim()
  const baseline = git('baseline', ['rev-parse', '9b1a8c5']).trim()
  save('candidate-package-tracked.patch', git('tracked', ['diff', '--binary', baseline, '--', pkg]))
  const paths = git('untracked', ['ls-files', '--others', '--exclude-standard', '--',
    ...inputs.map(n => `${pkg}/${n}`)]).trim().split('\n').filter(Boolean).sort()
  save('candidate-new-inputs.json', paths.map(path => ({ path, ...inventory(join(repo, path))['.'] })))
  save('candidate-status.txt', git('status', ['status', '--short', '--', pkg]))
  const postcssPackages = readdirSync(join(deps, '.pnpm')).filter(n => n.startsWith('postcss@'))
  assert.equal(postcssPackages.length, 1)
  const postcss = join(deps, '.pnpm', postcssPackages[0], 'node_modules/postcss')
  save('tool-binding.json', { vitest: realpathSync(join(deps, 'vitest/vitest.mjs')), postcss,
    postcssVersion: read(join(postcss, 'package.json')).version, env })
  save('vitest.config.mjs', `export default ${JSON.stringify({
    root: frozen, cacheDir: join(owned, 'cache/vite'), test: {
      include: [caseFile], environment: 'node', cache: false, pool: 'forks',
      poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 15000,
    },
  }, null, 2)}\n`)
  save('candidate.json', { at: new Date().toISOString(), baseline, headObservedOnly: head,
    sourceTree: repo, frozen, inputs, inputCount: Object.keys(frozenManifest).length,
    sourceCount: Object.keys(frozenManifest).filter(n => n.startsWith(`${pkg}/src/`)).length,
    frozenManifestSha256: sha(readFileSync(join(out, 'frozen-manifest.json'))),
    patchSha256: sha(readFileSync(join(out, 'candidate-package-tracked.patch'))),
    newInputsSha256: sha(readFileSync(join(out, 'candidate-new-inputs.json'))),
    caseSha256: sha(readFileSync(join(frozen, caseFile))),
    node: process.version, executable: process.execPath, os: os.release(), arch: os.arch(),
    noBuildInstallPnpmBinGuiServiceCredentialsCommit: true,
    boundary: 'Frozen SOURCE/AUTO contract only; baseline or source presence not GUI activation' })
  console.log('冻结完成：当前源、原两宽度证据与完整独占依赖已绑定。')
}
if (stage === 'run') {
  assert.deepEqual(diff(read(join(out, 'frozen-manifest.json')), sources(frozen)), [])
  const tool = read(join(out, 'tool-binding.json'))
  const testEnv = { HC_FIXTURE: join(out, 'replay-input.json'), HC_CSS: join(frozen, pkg, 'src/client/panel.css'),
    HC_POSTCSS: tool.postcss, HC_OBSERVATIONS: '' }
  const rows = []
  for (const [id, pattern] of [['necessary', '^HC-R'], ['controls', '^HC-C']]) {
    const argv = [process.execPath, tool.vitest, 'run', caseFile, '--config', join(out, 'vitest.config.mjs'),
      '--no-cache', '--maxWorkers=1', '--minWorkers=1', '--reporter=verbose', '--reporter=json',
      '--outputFile', join(out, `${id}.result.json`), '--testNamePattern', pattern]
    const r = command(id, argv, frozen, { ...testEnv, HC_OBSERVATIONS: join(out, `${id}.observations.jsonl`) })
    const reporter = existsSync(join(out, `${id}.result.json`)) ? read(join(out, `${id}.result.json`)) : null
    rows.push({ id, pid: r.pid, originalExit: r.originalExit, signal: r.signal,
      passed: reporter?.numPassedTests, failed: reporter?.numFailedTests, pending: reporter?.numPendingTests,
      failedSuites: reporter?.numFailedTestSuites,
      assertions: reporter?.testResults.flatMap(s => s.assertionResults).map(a => ({
        name: a.fullName, status: a.status, failureMessages: a.failureMessages })) })
  }
  const preflight = { candidateSourceUnchanged: diff(read(join(out, 'frozen-manifest.json')), sources(frozen)),
    testsUnchanged: sha(readFileSync(join(frozen, caseFile))) === read(join(out, 'candidate.json')).caseSha256 }
  save('run-summary.json', { rows, preflight, gui: 'NOT_RUN', hc01: 'FAIL retained; original necessary red, not post-fix acceptance' })
  assert.deepEqual(preflight.candidateSourceUnchanged, [])
  assert(preflight.testsUnchanged)
  process.exitCode = rows.find(r => r.originalExit !== 0)?.originalExit ?? 0
}
if (stage === 'supplement') {
  assert.deepEqual(diff(read(join(out, 'frozen-manifest.json')), sources(frozen)), [])
  const originalCase = readFileSync(join(frozen, caseFile)), updatedCase = readFileSync(join(repo, caseFile))
  save('supplement/original-cases.test.tsx', originalCase.toString())
  save('supplement/corrected-cases.test.tsx', updatedCase.toString())
  const patch = command('supplement/case-diff', ['/usr/bin/diff', '-u',
    join(frozen, caseFile), join(repo, caseFile)], repo)
  assert.equal(patch.originalExit, 1, 'Correction must be explicit, not silently no-op')
  save('supplement/correction.json', { originalSha256: sha(originalCase), correctedSha256: sha(updatedCase),
    reason: 'Only own observation serialization, missing onEdit fixture, explicit missing-style assertion diagnostics, host-only text child selection, and actually executing named title-refresh control. No original red expectation relaxed; product untouched.',
    initialOriginalReceiptsRetained: true })
  const updatedFile = `docs/testing/${prefix}-cases-r2.test.tsx`
  assert(!existsSync(join(frozen, updatedFile)))
  cpSync(join(repo, caseFile), join(frozen, updatedFile), { preserveTimestamps: true })
  save('supplement/vitest.config.mjs', `export default ${JSON.stringify({
    root: frozen, cacheDir: join(owned, 'cache/vite'), test: {
      include: [updatedFile], environment: 'node', cache: false, pool: 'forks',
      poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 15000,
    },
  }, null, 2)}\n`)
  const tool = read(join(out, 'tool-binding.json')), rows = []
  for (const [id, pattern] of [['necessary-r2', '^HC-R'], ['controls-r2', '^HC-C']]) {
    const r = command(`supplement/${id}`, [process.execPath, tool.vitest, 'run', updatedFile,
      '--config', join(out, 'supplement/vitest.config.mjs'), '--no-cache', '--maxWorkers=1', '--minWorkers=1',
      '--reporter=verbose', '--reporter=json', '--outputFile', join(out, `supplement/${id}.result.json`),
      '--testNamePattern', pattern], frozen, {
      HC_FIXTURE: join(out, 'replay-input.json'), HC_CSS: join(frozen, pkg, 'src/client/panel.css'),
      HC_POSTCSS: tool.postcss, HC_OBSERVATIONS: join(out, `supplement/${id}.observations.jsonl`),
    })
    const reporter = read(join(out, `supplement/${id}.result.json`))
    rows.push({ id, pid: r.pid, originalExit: r.originalExit, signal: r.signal,
      passed: reporter.numPassedTests, failed: reporter.numFailedTests, pending: reporter.numPendingTests,
      assertions: reporter.testResults.flatMap(s => s.assertionResults).map(a => ({
        name: a.fullName, status: a.status, failureMessages: a.failureMessages })) })
  }
  save('supplement/summary.json', { rows, productSourceDrift: diff(read(join(out, 'frozen-manifest.json')), sources(frozen)),
    originalFrozenTestRetained: sha(readFileSync(join(frozen, caseFile))) === read(join(out, 'candidate.json')).caseSha256,
    correctedFrozenTestSha256: sha(readFileSync(join(frozen, updatedFile))), gui: 'NOT_RUN' })
  process.exitCode = rows.find(r => r.originalExit !== 0)?.originalExit ?? 0
}
if (stage === 'seal') {
  const after = protection(), before = read(join(out, 'protection-before.json'))
  const src = read(join(out, 'dependencies/source-before.json')), copy = read(join(out, 'dependencies/copy-before.json'))
  const depNow = inventory(deps)
  const rows = [...read(join(out, 'run-summary.json')).rows,
    ...(existsSync(join(out, 'supplement/summary.json')) ? read(join(out, 'supplement/summary.json')).rows : [])]
  const pidChecks = rows.map(r => {
    assert(Number.isInteger(r.pid))
    const ps = command(`release/pid-${r.pid}`, ['/bin/ps', '-o', 'pid=,ppid=,command=', '-p', String(r.pid)], repo)
    return { pid: r.pid, originalExit: ps.originalExit, stdout: ps.stdout, exited: ps.originalExit === 1 && ps.stdout.trim() === '' }
  })
  const result = { at: new Date().toISOString(),
    protectedEntries: Object.values(before).reduce((n, manifest) => n + Object.keys(manifest).length, 0),
    protectionDrift: protectionDiff(before, after),
    dependencySourceDrift: diff(src, inventory(depsSource)), dependencyCopyDrift: diff(copy, depNow),
    frozenSourceDrift: diff(read(join(out, 'frozen-manifest.json')), sources(frozen)),
    closure: closure(src, depNow), pidChecks, resourcesReleased: pidChecks.every(p => p.exited),
    writeRoots: [out, owned], stop: true,
    boundary: 'Fixed roots from freeze only. No claim over live runtime, credentials, services, livingdocs, all testing or whole disk. Retain tmp evidence, no deletion.' }
  save('protection-after.json', after)
  save('seal.json', result)
  console.log(JSON.stringify({ protectedEntries: result.protectedEntries,
    drift: result.protectionDrift.length, resourcesReleased: result.resourcesReleased }))
  assert.deepEqual(result.protectionDrift, [])
  assert.deepEqual(result.dependencySourceDrift, [])
  assert.deepEqual(result.dependencyCopyDrift, [])
  assert.deepEqual(result.frozenSourceDrift, [])
  assert(result.resourcesReleased)
}
if (stage === 'index') {
  const entries = inventory(out)
  assert(!entries['index.json'], 'Reject overwrite')
  save('index.json', { at: new Date().toISOString(), count: Object.keys(entries).length, files: entries,
    documentFingerprints: Object.fromEntries(['-plan.md', '-cases.test.tsx', '-run.mjs', '.md']
      .map(n => [prefix + n, inventory(join(repo, 'docs/testing', prefix + n))['.']])) })
}
if (stage === 'receipts') {
  const root = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution'
  for (const [id, executionId] of [
    ['freeze', 'da0273ebeab5cd013b35ab06f37282a7'],
    ['seal', '727c7c83d6a73f4dfe70587dceef26a9'],
  ]) {
    const source = join(root, executionId), execution = read(join(source, 'execution.json'))
    assert.equal(execution.status, 'exited')
    assert.equal(execution.exitCode, 0)
    save(`outer/${id}.execution.json`, readFileSync(join(source, 'execution.json')).toString())
    save(`outer/${id}.output.log`, readFileSync(join(source, 'output.log')).toString())
  }
  save('outer/tool-observations.json', {
    boundary: 'run and supplement returned synchronously from exec tool, original exit1 each; child original receipts in evidence. Not invented terminal execution IDs.',
    runOriginalExit: 1, supplementOriginalExit: 1, nodeCheckOriginalExit: 0, prefixDiffCheckOriginalExit: 0,
  })
}
