import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a16-extension-base-developer-20261022'
const expert = 'a15-preconfirm-independent-retest-20261022'
const original = 'a14-preconfirm-conflict-contract-20261022'
const phase = process.argv[2]
const round = process.argv[3] ?? 'r1'
assert(['before', 'after', 'final'].includes(phase))
assert.match(round, /^r[1-9]\d*$/)
const self = join(repo, 'reports', `${prefix}-selftmp`, `${phase}-${round}`)
assert(!existsSync(self), 'fresh directory only; preserve every failure')
const pkgRel = 'packages/dsh-pm-tool'
const a14 = '/private/tmp/pmtool-a14-closure-20261022'
const deps = join(a14, pkgRel, 'node_modules')
const evidence = join(repo, 'reports/all-pending-evidence-20261021/A14')
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const out = {}
  if (!existsSync(root)) return out
  function walk(p) {
    const s = lstatSync(p), k = relative(root, p) || '.'
    if (s.isSymbolicLink()) out[k] = { link: realpathSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else out[k] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return out
}
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
mkdirSync(self, { recursive: true, mode: 0o700 })
function save(n, x) {
  const p = resolve(self, n)
  assert(p.startsWith(`${self}/`))
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof x === 'string' ? x : `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
}
for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(self, n))
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(self, 'home'), TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'),
  DSH_HOME: join(self, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1' }
const acquisition = []
function git(id, args) {
  const start = new Date().toISOString()
  const gitEnv = { ...env, GIT_OPTIONAL_LOCKS: '0' }
  const r = spawnSync('/usr/bin/git', args, { cwd: repo, env: gitEnv, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
  acquisition.push({ id, argv: ['/usr/bin/git', ...args], cwd: repo, env: gitEnv,
    start, end: new Date().toISOString(), originalExit: r.status, signal: r.signal, stderr: r.stderr })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout
}
const depNames = ['react', 'react-test-renderer', 'vitest', 'vite', 'typescript', 'lucide-react', 'zod']
const depRoots = Object.fromEntries(depNames.map(n => [n, realpathSync(n === 'vite'
  ? join(dirname(realpathSync(join(deps, 'vitest'))), 'vite') : join(deps, n))]))
const expertFiles = [
  ...['.md', '-plan.md', '-parent-run.mjs', '-expansion.test.tsx', '-cases.test.tsx', '-run.mjs', '-check.mjs', '-final-check.mjs']
    .map(n => join(repo, 'docs/testing', `${expert}${n}`)),
  ...['.md', '-plan.md', '-cases.test.tsx', '-run.mjs', '-check.mjs'].map(n => join(repo, 'docs/testing', `${original}${n}`)),
  ...['r1', 'parent-r1', 'final-r1', 'final-r2', 'delivery-r1'].map(n =>
    join(repo, 'docs/testing', `${expert}-selftmp`, n)),
  join(repo, 'docs/testing', `${original}-selftmp/r1`),
]
const roots = [
  ...inputs.map(n => join(repo, pkgRel, n)), join(repo, pkgRel, 'lib'),
  ...['a11-closure-20261021', 'a12-closure-20261021', 'a13-closure-20261022', 'a14-closure-20261022']
    .map(n => join('/private/tmp', `pmtool-${n}`, pkgRel, 'lib')),
  join(a14, pkgRel, 'src'), evidence, ...expertFiles, ...Object.values(depRoots),
  ...[deps, join(repo, pkgRel, 'node_modules')].flatMap(p => ['.vite', '.cache', '.vite-temp'].map(n => join(p, n))),
  join(repo, 'vendor/agent-skills/mattpocock'),
]
const before = Object.fromEntries(roots.map(p => [p, inventory(p)]))
save('protected-before.json', before)
const old = read(join(evidence, 'candidate.json'))
const verifyOld = () => Object.entries({ ...old.sourceHashes, ...old.artifacts })
  .filter(([p, h]) => !existsSync(join(a14, p)) || sha(readFileSync(join(a14, p))) !== h).map(([p]) => p)
assert.deepEqual(verifyOld(), [])
assert.equal(sha(readFileSync(join(evidence, 'product-tracked.patch'))), old.trackedPatchSha)
assert.equal(sha(readFileSync(join(repo, pkgRel, 'src/client/shared/drawers/sidecar-portal.tsx'))),
  '7cf48821e7e6ee570288c385b59897fd33f8ab0ec32da42ef87111c2c016a269')
const vendorRoot = join(repo, 'vendor/agent-skills/mattpocock')
const vendor = read(join(vendorRoot, 'manifest.json'))
const vendorFiles = [...vendor.rootFiles, ...vendor.skills.flatMap(s => s.files)]
for (const f of vendorFiles) assert.equal(sha(readFileSync(join(vendorRoot, f.path))), f.sha256, f.path)
save('vendor-integrity.json', { source: vendor.source.commit, files: vendorFiles, vendorIntegrityVerified: true,
  taskKind: 'trivial', reason: 'confirmed minimal existing-pattern collection; delivery review only, no installer' })
const head = git('head', ['rev-parse', 'HEAD']).trim()
const originMain = git('origin-main', ['rev-parse', 'origin/main']).trim()
const patch = git('tracked', ['diff', '--binary', 'HEAD', '--', pkgRel, 'launcher'])
save('candidate-tracked.patch', patch)
save('candidate-status.txt', git('status', ['status', '--short', '--branch', '--', pkgRel, 'launcher']))
const newPaths = git('new-inputs', ['ls-files', '--others', '--exclude-standard', '--',
  ...inputs.map(n => `${pkgRel}/${n}`), 'launcher']).trim().split('\n').filter(Boolean).sort()
save('candidate-new-inputs.json', newPaths.map(p => ({ path: p, ...inventory(join(repo, p))['.'] })))
save('acquisition-commands.json', acquisition)
const baselineDir = join(repo, 'reports', `${prefix}-selftmp/before-r1`)
if (phase === 'final') {
  const initial = read(join(baselineDir, 'protected-before.json'))
  const changes = Object.fromEntries(roots.map(p => [p, diff(initial[p] ?? {}, before[p])]))
  const immutableChanges = Object.fromEntries(Object.entries(changes)
    .filter(([p]) => !inputs.some(n => p === join(repo, pkgRel, n))))
  const initialSource = initial[join(repo, pkgRel, 'src')]
  const sourceChanges = diff(content(initialSource), content(before[join(repo, pkgRel, 'src')]))
  const p0 = readFileSync(join(baselineDir, 'frozen', pkgRel, 'src/client/panel.tsx'), 'utf8')
  const p1 = readFileSync(join(repo, pkgRel, 'src/client/panel.tsx'), 'utf8')
  const oldLine = "baselineMap={Object.fromEntries(tasks.map(t => [t.id, (t as { updatedAt?: string }).updatedAt ?? '']))}"
  const newLine = "baselineMap={Object.fromEntries(\n                        [...tasks, ...milestones, ...riskIssues, ...deliverables, ...meetings]\n                          .map(record => [record.id, (record as { updatedAt?: string }).updatedAt ?? '']),\n                      )}"
  const panelOnlyBaseline = p0.replace(oldLine, newLine) === p1
  const tested = read(join(repo, 'reports', `${prefix}-selftmp/after-r2/frozen-inputs.json`))
  const testedInputDrift = Object.fromEntries(inputs.map(n => [n,
    diff(content(tested[n]), content(before[join(repo, pkgRel, n)]))]))
  const pids = [...new Set(['before-r1', 'after-r1', 'after-r2'].flatMap(n =>
    read(join(repo, 'reports', `${prefix}-selftmp`, n, 'commands.json')).map(c => c.pid)))]
  const psArgv = ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command=']
  const psStart = new Date().toISOString()
  const ps = spawnSync(psArgv[0], psArgv.slice(1), { cwd: repo, env, encoding: 'utf8' })
  save('process-check.command.json', { argv: psArgv, cwd: repo, env, start: psStart,
    end: new Date().toISOString(), originalExit: ps.status, signal: ps.signal,
    stdout: ps.stdout, stderr: ps.stderr, expectedNoSuchPidExit: 1 })
  const noRecordedChildren = ps.status === 1 && !ps.stdout.trim()
  const delivered = Object.fromEntries(['.md', '-run.mjs', '-check.mjs'].map(n =>
    [`reports/${prefix}${n}`, inventory(join(repo, 'reports', `${prefix}${n}`))['.']]))
  const released = Object.values(immutableChanges).flat().length === 0 && panelOnlyBaseline &&
    sourceChanges.every(p => ['client/panel.tsx', 'client/copilot-extension-baseline.test.tsx'].includes(p)) &&
    Object.values(testedInputDrift).flat().length === 0 && noRecordedChildren
  save('final.json', { at: new Date().toISOString(), head, originMain, changes, immutableChanges, sourceChanges,
    panelOnlyBaseline, testedInputDrift, noRecordedChildren, delivered, oldDeclaredDrift: verifyOld(), released, selfSignedPass: false,
    guiExecuted: false, built: false, boundary: 'listed roots only; no full-machine protection claim' })
  console.log(JSON.stringify({ released, sourceChanges, immutableDrift: Object.entries(immutableChanges).filter(([, v]) => v.length) }))
  process.exitCode = released ? 0 : 1
} else {
  const frozen = join(self, 'frozen'), pkg = join(frozen, pkgRel)
  for (const n of inputs) cpSync(join(repo, pkgRel, n), join(pkg, n), { recursive: true, preserveTimestamps: true })
  const frozenBefore = Object.fromEntries(inputs.map(n => [n, inventory(join(pkg, n))]))
  for (const n of inputs) assert.deepEqual(content(frozenBefore[n]), content(before[join(repo, pkgRel, n)]))
  save('frozen-inputs.json', frozenBefore)
  const tests = join(frozen, 'docs/testing')
  mkdirSync(tests, { recursive: true })
  const testNames = [`${expert}-expansion.test.tsx`, `${original}-cases.test.tsx`, `${expert}-cases.test.tsx`]
  const testHashes = {}
  for (const n of testNames) {
    const from = join(repo, 'docs/testing', n), to = join(tests, n)
    cpSync(from, to, { preserveTimestamps: true })
    testHashes[n] = sha(readFileSync(to))
    assert.equal(testHashes[n], sha(readFileSync(from)))
  }
  assert.equal(testHashes[`${original}-cases.test.tsx`], '18093da170e61c626ee434abe1fb467fc7b68da0727e7b6edfdb0b8de149c0da')
  const referenceParent = join(repo, 'docs/testing', `${expert}-selftmp/parent-r1`)
  assert.equal(read(join(referenceParent, 'command.json')).originalExit, 1)
  assert.equal(read(join(referenceParent, 'parent.result.json')).numFailedTests, 4)
  assert.equal(testHashes[`${expert}-expansion.test.tsx`],
    sha(readFileSync(join(referenceParent, 'frozen/docs/testing', `${expert}-expansion.test.tsx`))))
  save('replay-input.json', read(join(repo, 'docs/testing', `${expert}-selftmp/r1/replay-input.json`)))
  const productSourceDelta = phase === 'after' ? diff(content(read(join(baselineDir, 'frozen-inputs.json')).src),
    content(frozenBefore.src)) : []
  save('candidate.json', { at: new Date().toISOString(), head, originMain, sourceTree: repo,
    frozen, inputs: frozenBefore, sourceCount: Object.keys(frozenBefore.src).length, productSourceDelta,
    trackedPatchSha256: sha(patch), newInputsSha256: sha(readFileSync(join(self, 'candidate-new-inputs.json'))),
    testHashes, oldDeclaredCount: Object.keys(old.sourceHashes).length + Object.keys(old.artifacts).length,
    environment: { os: os.release(), arch: os.arch(), node: process.version, executable: process.execPath },
    dependencies: Object.fromEntries(depNames.map(n => [n, { root: depRoots[n], version: read(join(depRoots[n], 'package.json')).version }])),
    guiExecuted: false, built: false, selfSignedPass: false })
  symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  const testEnv = { ...env, PC_INPUT: join(self, 'replay-input.json'), PC_OBSERVATIONS: join(self, 'observations.jsonl') }
  save('vitest.config.mjs', `export default ${JSON.stringify({ root: frozen, cacheDir: join(self, 'cache/vite'),
    test: { environment: 'node', cache: false, include: ['docs/testing/*.test.tsx', `${pkgRel}/src/**/*.test.ts`, `${pkgRel}/src/**/*.test.tsx`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 } }, null, 2)}\n`)
  const commands = []
  function run(id, args, cwd, runEnv = testEnv) {
    const argv = [process.execPath, ...args], start = new Date().toISOString()
    const r = spawnSync(argv[0], argv.slice(1), { cwd, env: runEnv, encoding: 'utf8', timeout: 240000, maxBuffer: 64 * 1024 * 1024 })
    save(`${id}.stdout.log`, r.stdout ?? '')
    save(`${id}.stderr.log`, r.stderr ?? '')
    const c = { id, argv, cwd, env: runEnv, start, end: new Date().toISOString(),
      originalExit: r.status, signal: r.signal, error: r.error?.message ?? null, pid: r.pid }
    commands.push(c); save(`${id}.command.json`, c)
    console.log(JSON.stringify({ id, originalExit: r.status, signal: r.signal }))
  }
  function test(id, files, pattern) {
    run(id, [join(deps, 'vitest/vitest.mjs'), 'run', ...files, '--config', join(self, 'vitest.config.mjs'),
      '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(self, `${id}.result.json`),
      ...(pattern ? ['--testNamePattern', pattern] : [])], frozen)
  }
  test('parent', [`docs/testing/${expert}-expansion.test.tsx`])
  if (phase === 'after') {
    test('developer', [`${pkgRel}/src/client/copilot-extension-baseline.test.tsx`])
    for (const id of ['PC-C01', 'PC-C02', 'PC-A01', 'PC-A02'])
      test(id, [`docs/testing/${original}-cases.test.tsx`], `^${id} `)
    test('independent', [`docs/testing/${expert}-cases.test.tsx`])
    test('regression', [
      'client/shared/drawers/copilot-preconfirm.test.tsx', 'client/sidecar-minimize-retention.test.tsx',
      'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/provenance-panel.test.tsx',
      'client/shared/task-draft-materials-stage.test.tsx', 'core/copilot-validate.test.ts',
      'core/copilot-task-fields.test.ts', 'core/ask-projection.test.ts',
    ].map(p => `${pkgRel}/src/${p}`))
    run('noemit', [join(deps, 'typescript/bin/tsc'), '--project', join(pkg, 'tsconfig.json'),
      '--noEmit', '--incremental', 'false'], pkg, env)
    run('vendor-static', [join(repo, pkgRel, 'scripts/verify-external-skills.mjs')], repo, env)
  }
  const after = Object.fromEntries(roots.map(p => [p, inventory(p)]))
  const drift = Object.fromEntries(roots.map(p => [p, diff(before[p], after[p])]))
  const frozenDrift = Object.fromEntries(inputs.map(n => [n, diff(frozenBefore[n], inventory(join(pkg, n)))]))
  save('protected-manifests.json', { before, after })
  save('commands.json', commands)
  const parent = read(join(self, 'parent.result.json'))
  const assertions = parent.testResults.flatMap(t => t.assertionResults)
  const observations = readFileSync(join(self, 'observations.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
  const parentExpected = phase === 'before' ? commands[0].originalExit === 1 && parent.numFailedTests === 4 &&
    assertions.every(a => a.status === 'failed' && a.failureMessages.some(m => m.includes('expected undefined to be'))) &&
    observations.length === 4 && observations.every(o => !Object.hasOwn(o.base, o.id)) :
    commands[0].originalExit === 0 && parent.numPassedTests === 4 && parent.numFailedTests === 0
  const protectionOk = Object.values(drift).flat().length === 0 && Object.values(frozenDrift).flat().length === 0 && verifyOld().length === 0
  const executionExpected = parentExpected && commands.slice(1).every(c => c.originalExit === 0 && c.signal === null)
  save('summary.json', { phase, parentExpected, executionExpected, protectionOk, productSourceDelta,
    originalParentExit: commands[0].originalExit, assertions, observations, commands, drift, frozenDrift,
    oldDeclaredDrift: verifyOld(), guiExecuted: false, built: false, selfSignedPass: false,
    finishedAt: new Date().toISOString(), boundary: 'developer evidence only; raw product failures retained' })
  console.log(JSON.stringify({ parentExpected, executionExpected, protectionOk, productSourceDelta,
    drift: Object.entries(drift).filter(([, v]) => v.length) }))
  process.exitCode = executionExpected && protectionOk ? 0 : 1
}
