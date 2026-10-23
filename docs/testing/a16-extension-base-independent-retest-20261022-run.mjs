import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a16-extension-base-independent-retest-20261022'
const a15 = 'a15-preconfirm-independent-retest-20261022'
const a14 = 'a14-preconfirm-conflict-contract-20261022'
const dev = join(repo, 'reports/a16-extension-base-developer-20261022-selftmp')
const pkgRel = 'packages/dsh-pm-tool'
const inputs = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const oldA14 = '/private/tmp/pmtool-a14-closure-20261022'
const evidence = join(repo, 'reports/all-pending-evidence-20261021/A14')
const deps = join(oldA14, pkgRel, 'node_modules')
const stage = process.argv[2]
const round = process.argv[3] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
assert(['freeze', 'run', 'final'].includes(stage))
const base = join(repo, 'docs/testing', `${prefix}-selftmp`)
const out = join(base, round)
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(p) {
    const s = lstatSync(p), k = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[k] = { link: realpathSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[k] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return result
}
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
function saveAt(root, name, x) {
  const p = resolve(root, name)
  assert(p.startsWith(`${base}/`), 'owned evidence only')
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof x === 'string' ? x : `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
}
const save = (n, x) => saveAt(out, n, x)
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1' }
const pkgInventory = root => Object.fromEntries(inputs.map(n => [n, inventory(join(root, pkgRel, n))]))
const depNames = ['react', 'react-test-renderer', 'vitest', 'vite', 'typescript', 'lucide-react', 'zod']
const depRoots = Object.fromEntries(depNames.map(n => [n, realpathSync(n === 'vite'
  ? join(dirname(realpathSync(join(deps, 'vitest'))), 'vite') : join(deps, n))]))
const originalRoots = [
  ...[a14, a15].flatMap(p => readdirSync(join(repo, 'docs/testing')).filter(n => n.startsWith(p))
    .map(n => join(repo, 'docs/testing', n))),
  ...readdirSync(join(repo, 'reports')).filter(n => n.startsWith('a16-extension-base-developer-20261022'))
    .map(n => join(repo, 'reports', n)),
]
const roots = [...inputs.map(n => join(repo, pkgRel, n)), join(repo, pkgRel, 'lib'),
  ...['a11-closure-20261021', 'a12-closure-20261021', 'a13-closure-20261022', 'a14-closure-20261022']
    .map(n => join('/private/tmp', `pmtool-${n}`, pkgRel, 'lib')),
  join(oldA14, pkgRel, 'src'), evidence, ...originalRoots, ...Object.values(depRoots),
  ...[deps, join(repo, pkgRel, 'node_modules')].flatMap(p => ['.vite', '.cache', '.vite-temp'].map(n => join(p, n))),
  join(repo, 'vendor/agent-skills/mattpocock')]
const protectedNow = () => Object.fromEntries(roots.map(p => [p, inventory(p)]))
const declared = read(join(evidence, 'candidate.json'))
function verifyA14() {
  return Object.entries({ ...declared.sourceHashes, ...declared.artifacts }).filter(([p, h]) =>
    !existsSync(join(oldA14, p)) || sha(readFileSync(join(oldA14, p))) !== h).map(([p]) => p)
}
function verifySourceContract() {
  const before = readFileSync(join(dev, 'before-r1/frozen', pkgRel, 'src/client/panel.tsx'), 'utf8')
  const after = readFileSync(join(repo, pkgRel, 'src/client/panel.tsx'), 'utf8')
  const oldLine = "baselineMap={Object.fromEntries(tasks.map(t => [t.id, (t as { updatedAt?: string }).updatedAt ?? '']))}"
  const newLine = "baselineMap={Object.fromEntries(\n                        [...tasks, ...milestones, ...riskIssues, ...deliverables, ...meetings]\n                          .map(record => [record.id, (record as { updatedAt?: string }).updatedAt ?? '']),\n                      )}"
  assert.equal(before.split(oldLine).length, 2)
  assert.equal(before.replace(oldLine, newLine), after, 'panel changed beyond assigned collection')
  assert.equal(sha(readFileSync(join(repo, pkgRel, 'src/client/shared/drawers/sidecar-portal.tsx'))),
    '7cf48821e7e6ee570288c385b59897fd33f8ab0ec32da42ef87111c2c016a269')
}
function auditDeveloper() {
  const rows = []
  for (const r of ['before-r1', 'after-r1', 'after-r2']) {
    const root = join(dev, r), summary = read(join(root, 'summary.json'))
    assert.equal(summary.protectionOk, true)
    for (const c of read(join(root, 'commands.json'))) {
      const resultPath = join(root, `${c.id}.result.json`)
      const result = existsSync(resultPath) ? read(resultPath) : null
      rows.push({ round: r, ...c, resultPath: result ? resultPath : null,
        passed: result?.numPassedTests, failed: result?.numFailedTests, pending: result?.numPendingTests,
        assertions: result?.testResults.flatMap(t => t.assertionResults),
        stdoutSha256: sha(readFileSync(join(root, `${c.id}.stdout.log`))),
        stderrSha256: sha(readFileSync(join(root, `${c.id}.stderr.log`))) })
    }
  }
  for (const [id, count] of Object.entries({ parent: 4, developer: 23, independent: 23, regression: 87 })) {
    const r = rows.find(r => r.round === 'after-r2' && r.id === id)
    assert.equal(r.originalExit, 0); assert.equal(r.passed, count); assert.equal(r.failed, 0)
  }
  for (const r of rows.filter(r => /^PC-/.test(r.id))) {
    assert.equal(r.originalExit, 1); assert.equal(r.failed, 1); assert.equal(r.pending, 3)
    assert(r.assertions.filter(a => a.status === 'failed').every(a =>
      a.failureMessages.every(m => m.startsWith('AssertionError: expected { …(10) } to deeply equal { …(2) }'))))
  }
  assert.equal(rows.find(r => r.round === 'before-r1' && r.id === 'parent').failed, 4)
  const check = read(join(dev, 'check-r1/check.json'))
  assert.equal(check.vendorCorrectionCommand.originalExit, 0)
  assert.equal(read(join(dev, 'final-r1/final.json')).released, true)
  return { rows, check, final: read(join(dev, 'final-r1/final.json')),
    originalFailuresPreserved: true, notAnIndependentPass: true }
}

if (stage === 'freeze') {
  assert(!existsSync(out), 'never overwrite evidence')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n))
  const before = protectedNow()
  save('protected-before.json', before)
  assert.deepEqual(verifyA14(), [])
  verifySourceContract()
  save('developer-audit.json', auditDeveloper())
  const acquisition = []
  const git = (id, args) => {
    const e = { ...env, GIT_OPTIONAL_LOCKS: '0' }, start = new Date().toISOString()
    const r = spawnSync('/usr/bin/git', args, { cwd: repo, env: e, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
    acquisition.push({ id, argv: ['/usr/bin/git', ...args], cwd: repo, env: e, start,
      end: new Date().toISOString(), originalExit: r.status, signal: r.signal, pid: r.pid, stderr: r.stderr })
    assert.equal(r.status, 0, r.stderr)
    return r.stdout
  }
  const head = git('head', ['rev-parse', 'HEAD']).trim()
  const originMain = git('origin-main', ['rev-parse', 'origin/main']).trim()
  const patch = git('tracked', ['diff', '--binary', 'HEAD', '--', pkgRel, 'launcher'])
  save('candidate-tracked.patch', patch)
  save('candidate-status.txt', git('status', ['status', '--short', '--branch', '--', pkgRel, 'launcher']))
  const newPaths = git('new-inputs', ['ls-files', '--others', '--exclude-standard', '--',
    ...inputs.map(n => `${pkgRel}/${n}`), 'launcher']).trim().split('\n').filter(Boolean).sort()
  save('candidate-new-inputs.json', newPaths.map(p => ({ path: p, ...inventory(join(repo, p))['.'] })))
  save('acquisition-commands.json', acquisition)
  const freezeRoots = {}
  for (const [kind, source] of Object.entries({ new: repo,
    old: join(repo, 'docs/testing', `${a15}-selftmp/parent-r1/frozen`),
    a14: join(repo, 'docs/testing', `${a15}-selftmp/r1/old/frozen`) })) {
    const frozen = join(out, kind, 'frozen')
    freezeRoots[kind] = frozen
    for (const n of inputs) cpSync(join(source, pkgRel, n), join(frozen, pkgRel, n), { recursive: true, preserveTimestamps: true })
    const manifest = pkgInventory(frozen)
    const sourceManifest = pkgInventory(source)
    for (const n of inputs) assert.deepEqual(content(manifest[n]), content(sourceManifest[n]))
    save(`${kind}-inputs.json`, manifest)
    symlinkSync(deps, join(frozen, pkgRel, 'node_modules'), 'dir')
    symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
  }
  const current = read(join(out, 'new-inputs.json')), devInput = read(join(dev, 'after-r2/frozen-inputs.json'))
  const devByteDiff = Object.fromEntries(inputs.map(n => [n, diff(content(current[n]), content(devInput[n]))]))
  assert.deepEqual(Object.values(devByteDiff).flat(), [], 'complete current input differs from released developer candidate')
  const sourceDelta = diff(content(read(join(out, 'old-inputs.json')).src), content(current.src))
  assert.deepEqual(sourceDelta.sort(), ['client/copilot-extension-baseline.test.tsx', 'client/panel.tsx'].sort())
  save('replay-input.json', read(join(repo, 'docs/testing', `${a15}-selftmp/r1/replay-input.json`)))
  const parentRoot = join(repo, 'docs/testing', `${a15}-selftmp/parent-r1`)
  assert.equal(read(join(parentRoot, 'command.json')).originalExit, 1)
  assert.equal(read(join(parentRoot, 'parent.result.json')).numFailedTests, 4)
  assert.equal(sha(readFileSync(join(repo, 'docs/testing', `${a15}-expansion.test.tsx`))),
    sha(readFileSync(join(parentRoot, 'frozen/docs/testing', `${a15}-expansion.test.tsx`))))
  save('candidate.json', { at: new Date().toISOString(), head, originMain, sourceTree: repo, freezeRoots,
    sourceCounts: Object.fromEntries(Object.keys(freezeRoots).map(k => [k, Object.keys(read(join(out, `${k}-inputs.json`)).src).length])),
    sourceDelta, devByteDiff, trackedPatchSha256: sha(patch),
    newInputsSha256: sha(readFileSync(join(out, 'candidate-new-inputs.json'))),
    completeNewManifestSha256: sha(readFileSync(join(out, 'new-inputs.json'))),
    environment: { os: os.release(), arch: os.arch(), node: process.version, executable: process.execPath },
    dependencies: Object.fromEntries(depNames.map(n => [n, { root: depRoots[n], version: read(join(depRoots[n], 'package.json')).version }])),
    oldDeclaredCount: Object.keys(declared.sourceHashes).length + Object.keys(declared.artifacts).length,
    oldDeclaredDrift: verifyA14(), built: false, guiExecuted: false })
  console.log(JSON.stringify({ stage, sourceDelta, devByteDiff, completeCurrentFrozen: true }))
} else if (stage === 'run') {
  assert(existsSync(out)); assert(!existsSync(join(out, 'commands.json')))
  verifySourceContract()
  const candidate = read(join(out, 'candidate.json'))
  const tests = [`${a15}-expansion.test.tsx`, `${a14}-cases.test.tsx`, `${a15}-cases.test.tsx`,
    `${prefix}-pc-cases.test.tsx`, `${prefix}-cases.test.tsx`]
  const originalPc = readFileSync(join(repo, 'docs/testing', `${a14}-cases.test.tsx`), 'utf8')
  const revisedPc = readFileSync(join(repo, 'docs/testing', `${prefix}-pc-cases.test.tsx`), 'utf8')
  const from = "const selectedBase = () => Object.fromEntries(input.initial.tasks\n  .filter((t: any) => t.projectId === 'p-0001').map((t: any) => [t.id, t.updatedAt]))"
  const to = "const selectedBase = () => ({\n  ...Object.fromEntries(input.initial.tasks\n    .filter((t: any) => t.projectId === 'p-0001').map((t: any) => [t.id, t.updatedAt])),\n  'm-0001': input.initial.milestones.find((r: any) => r.id === 'm-0001').updatedAt,\n  'm-0002': input.initial.milestones.find((r: any) => r.id === 'm-0002').updatedAt,\n  'ri-0001': input.initial.riskIssues.find((r: any) => r.id === 'ri-0001').updatedAt,\n  'ri-0002': input.initial.riskIssues.find((r: any) => r.id === 'ri-0002').updatedAt,\n  'dlv-0001': input.initial.deliverables.find((r: any) => r.id === 'dlv-0001').updatedAt,\n  'dlv-0002': input.initial.deliverables.find((r: any) => r.id === 'dlv-0002').updatedAt,\n  'mtg-0001': input.initial.meetings.find((r: any) => r.id === 'mtg-0001').updatedAt,\n  'mtg-0002': input.initial.meetings.find((r: any) => r.id === 'mtg-0002').updatedAt,\n})"
  assert.equal(originalPc.split(from).length, 2)
  assert.equal(originalPc.replace(from, to), revisedPc, 'all original expectations/steps must remain')
  const replay = read(join(out, 'replay-input.json'))
  const keys = { milestones: ['m-0001', 'm-0002'], riskIssues: ['ri-0001', 'ri-0002'],
    deliverables: ['dlv-0001', 'dlv-0002'], meetings: ['mtg-0001', 'mtg-0002'] }
  for (const [table, ids] of Object.entries(keys)) for (const id of ids) {
    const records = replay.initial[table].filter(r => r.id === id)
    assert.equal(records.length, 1); assert.equal(records[0].projectId, 'p-0001')
    assert.equal(typeof records[0].updatedAt, 'string')
  }
  const testHashes = Object.fromEntries(tests.map(n => [n, sha(readFileSync(join(repo, 'docs/testing', n)))]))
  assert.equal(testHashes[`${a14}-cases.test.tsx`], '18093da170e61c626ee434abe1fb467fc7b68da0727e7b6edfdb0b8de149c0da')
  save('oracle-audit.json', { originalSha256: testHashes[`${a14}-cases.test.tsx`],
    revisedSha256: testHashes[`${prefix}-pc-cases.test.tsx`], from, to, onlyExplicitEightKeysAdded: true, keys,
    allOriginalTaskBaseNeedsStepsAndExpectationsUnchanged: true, tests: testHashes })
  const commands = []
  function run(id, args, cwd, e = env) {
    const argv = [process.execPath, ...args], start = new Date().toISOString()
    const r = spawnSync(argv[0], argv.slice(1), { cwd, env: e, encoding: 'utf8', timeout: 240000, maxBuffer: 64 * 1024 * 1024 })
    save(`${id}.stdout.log`, r.stdout ?? ''); save(`${id}.stderr.log`, r.stderr ?? '')
    const c = { id, argv, cwd, env: e, start, end: new Date().toISOString(),
      originalExit: r.status, signal: r.signal, error: r.error?.message ?? null, pid: r.pid }
    commands.push(c); save(`${id}.command.json`, c)
    console.log(JSON.stringify({ id, originalExit: r.status, signal: r.signal }))
  }
  for (const [kind, frozen] of Object.entries(candidate.freezeRoots)) {
    for (const n of inputs) assert.deepEqual(inventory(join(frozen, pkgRel, n)), read(join(out, `${kind}-inputs.json`))[n])
    for (const n of tests) {
      cpSync(join(repo, 'docs/testing', n), join(frozen, 'docs/testing', n), { preserveTimestamps: true })
      assert.equal(sha(readFileSync(join(frozen, 'docs/testing', n))), testHashes[n])
    }
    save(`${kind}-vitest.config.mjs`, `export default ${JSON.stringify({ root: frozen, cacheDir: join(out, `cache/${kind}-vite`),
      test: { environment: 'node', cache: false, include: ['docs/testing/*.test.tsx', `${pkgRel}/src/**/*.test.ts`, `${pkgRel}/src/**/*.test.tsx`],
        pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 } }, null, 2)}\n`)
  }
  function test(kind, id, files, pattern) {
    run(`${kind}-${id}`, [join(deps, 'vitest/vitest.mjs'), 'run', ...files, '--config', join(out, `${kind}-vitest.config.mjs`),
      '--no-cache', '--reporter=verbose', '--reporter=json', '--outputFile', join(out, `${kind}-${id}.result.json`),
      ...(pattern ? ['--testNamePattern', pattern] : [])], candidate.freezeRoots[kind],
    { ...env, PC_INPUT: join(out, 'replay-input.json'), PC_OBSERVATIONS: join(out, `${kind}-${id}.observations.jsonl`) })
  }
  test('old', 'parent', [`docs/testing/${a15}-expansion.test.tsx`])
  test('new', 'parent', [`docs/testing/${a15}-expansion.test.tsx`])
  for (const kind of ['a14', 'old', 'new']) {
    for (const id of ['PC-C01', 'PC-C02', 'PC-A01', 'PC-A02']) {
      test(kind, `original-${id}`, [`docs/testing/${a14}-cases.test.tsx`], `^${id} `)
      test(kind, `revised-${id}`, [`docs/testing/${prefix}-pc-cases.test.tsx`], `^${id} `)
    }
  }
  test('new', 'expert-parent', [`docs/testing/${prefix}-cases.test.tsx`])
  test('old', 'expert-parent', [`docs/testing/${prefix}-cases.test.tsx`])
  test('new', 'developer', [`${pkgRel}/src/client/copilot-extension-baseline.test.tsx`])
  test('new', 'independent23', [`docs/testing/${a15}-cases.test.tsx`])
  test('new', 'regression87', ['client/shared/drawers/copilot-preconfirm.test.tsx', 'client/sidecar-minimize-retention.test.tsx',
    'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/provenance-panel.test.tsx',
    'client/shared/task-draft-materials-stage.test.tsx', 'core/copilot-validate.test.ts', 'core/copilot-task-fields.test.ts',
    'core/ask-projection.test.ts'].map(n => `${pkgRel}/src/${n}`))
  run('new-noemit', [join(deps, 'typescript/bin/tsc'), '--project', join(candidate.freezeRoots.new, pkgRel, 'tsconfig.json'),
    '--noEmit', '--incremental', 'false'], join(candidate.freezeRoots.new, pkgRel))
  save('commands.json', commands)
  const after = protectedNow(), before = read(join(out, 'protected-before.json'))
  const drift = Object.fromEntries(roots.map(p => [p, diff(before[p], after[p])]))
  const frozenDrift = Object.fromEntries(Object.entries(candidate.freezeRoots).map(([kind, frozen]) =>
    [kind, Object.fromEntries(inputs.map(n => [n, diff(read(join(out, `${kind}-inputs.json`))[n], inventory(join(frozen, pkgRel, n)))]))]))
  save('protected-after.json', after)
  const results = commands.map(c => {
    const path = join(out, `${c.id}.result.json`)
    const r = existsSync(path) ? read(path) : null
    return { ...c, reporterPath: r ? path : null, reporterSha256: r ? sha(readFileSync(path)) : null,
      passed: r?.numPassedTests, failed: r?.numFailedTests, pending: r?.numPendingTests,
      assertions: r?.testResults.flatMap(t => t.assertionResults) }
  })
  save('summary.json', { at: new Date().toISOString(), results, drift, frozenDrift, oldDeclaredDrift: verifyA14(),
    built: false, guiExecuted: false, finiteScopeOnly: true, status: 'await independent evidence adjudication' })
  console.log(JSON.stringify({ finished: true, drift: Object.entries(drift).filter(([, v]) => v.length),
    results: results.map(r => ({ id: r.id, exit: r.originalExit, passed: r.passed, failed: r.failed, pending: r.pending })) }))
} else {
  const final = join(base, `final-${round}`)
  assert(!existsSync(final)); mkdirSync(final, { mode: 0o700 })
  const before = read(join(out, 'protected-before.json')), after = protectedNow()
  const drift = Object.fromEntries(roots.map(p => [p, diff(before[p], after[p])]))
  const candidate = read(join(out, 'candidate.json'))
  const newVsMain = Object.fromEntries(inputs.map(n => [n,
    diff(content(read(join(out, 'new-inputs.json'))[n]), content(inventory(join(repo, pkgRel, n))))]))
  const frozenDrift = Object.fromEntries(Object.entries(candidate.freezeRoots).map(([kind, frozen]) =>
    [kind, Object.fromEntries(inputs.map(n => [n, diff(read(join(out, `${kind}-inputs.json`))[n], inventory(join(frozen, pkgRel, n)))]))]))
  const commands = read(join(out, 'commands.json'))
  const oracleCommand = read(join(base, `check-${round}/oracle.command.json`))
  const pids = [...new Set([...commands.map(c => c.pid), oracleCommand.pid])]
  const argv = ['/bin/ps', '-p', pids.join(','), '-o', 'pid=,ppid=,command=']
  const start = new Date().toISOString()
  const ps = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8' })
  saveAt(final, 'process-check.command.json', { argv, cwd: repo, env, start, end: new Date().toISOString(),
    originalExit: ps.status, signal: ps.signal, stdout: ps.stdout, stderr: ps.stderr, expectedNoSuchPidExit: 1 })
  const noRecordedChildren = ps.status === 1 && !ps.stdout.trim()
  const own = Object.fromEntries(readdirSync(join(repo, 'docs/testing')).filter(n => n.startsWith(prefix) && n !== `${prefix}-selftmp`)
    .map(n => [n, inventory(join(repo, 'docs/testing', n))]))
  const protectionOk = Object.values(drift).flat().length === 0 && Object.values(newVsMain).flat().length === 0 &&
    Object.values(frozenDrift).flatMap(x => Object.values(x).flat()).length === 0 && verifyA14().length === 0
  saveAt(final, 'protected-after.json', after)
  saveAt(final, 'final.json', { at: new Date().toISOString(), protectionOk, drift, newVsMain, frozenDrift,
    noRecordedChildren, own, oldDeclaredDrift: verifyA14(), released: protectionOk && noRecordedChildren,
    guiExecuted: false, built: false, sharedOutputModified: false, servicesOperated: false, commitExecuted: false })
  console.log(JSON.stringify({ protectionOk, noRecordedChildren, released: protectionOk && noRecordedChildren }))
  process.exitCode = protectionOk && noRecordedChildren ? 0 : 1
}
