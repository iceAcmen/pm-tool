import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a15-preconfirm-independent-retest-20261022'
const original = 'a14-preconfirm-conflict-contract-20261022'
const developer = 'a15-copilot-preconfirm-developer-20261022'
const round = process.argv[2] ?? 'r1'
assert.match(round, /^r[1-9]\d*$/)
const self = join(repo, 'docs/testing', `${prefix}-selftmp`, round)
assert(!existsSync(self), 'fresh rN only; never overwrite failures')
const pkgRel = 'packages/dsh-pm-tool'
const a14 = '/private/tmp/pmtool-a14-closure-20261022'
const oldEvidence = join(repo, 'reports/all-pending-evidence-20261021/A14')
const deps = join(a14, pkgRel, 'node_modules')
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const out = {}
  if (!existsSync(root)) return out
  function walk(p) {
    const st = lstatSync(p)
    const k = relative(root, p) || '.'
    if (st.isSymbolicLink()) out[k] = { link: realpathSync(p), mtimeMs: st.mtimeMs }
    else if (st.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else out[k] = { sha256: sha(readFileSync(p)), bytes: st.size, mtimeMs: st.mtimeMs }
  }
  walk(root)
  return out
}
const delta = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const content = m => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
function save(n, data) {
  const p = resolve(self, n)
  assert(p.startsWith(`${self}/`))
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' })
}
const depNames = ['react', 'react-test-renderer', 'vitest', 'vite', 'typescript', 'lucide-react', 'zod']
const depRoots = Object.fromEntries(depNames.map(n => [n, realpathSync(n === 'vite'
  ? join(dirname(realpathSync(join(deps, 'vitest'))), 'vite') : join(deps, n))]))
const oldManifest = read(join(oldEvidence, 'candidate.json'))
const verifyOld = () => Object.entries({ ...oldManifest.sourceHashes, ...oldManifest.artifacts })
  .filter(([p, hash]) => !existsSync(join(a14, p)) || sha(readFileSync(join(a14, p))) !== hash).map(([p]) => p)
assert.deepEqual(verifyOld(), [])
assert.equal(sha(readFileSync(join(oldEvidence, 'product-tracked.patch'))), oldManifest.trackedPatchSha)
const inputNames = ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts']
const contractNames = ['AGENTS.md', 'docs/collaboration.md', 'docs/plans/2026-10-22-copilot-preconfirm-closure.md',
  'docs/testing/remaining-governance-cases-20261021.md', 'docs/testing/copilot-multistep-acceptance.md',
  'docs/product/08-copilot-multistep-design.md', 'docs/decision-log.md',
  ...['plan.md', 'cases.test.tsx', 'run.mjs', 'check.mjs'].map(n => `docs/testing/${original}-${n}`),
  `docs/testing/${original}.md`, `docs/testing/${prefix}-plan.md`,
  `docs/testing/${prefix}-cases.test.tsx`, `docs/testing/${prefix}-run.mjs`,
  `reports/${developer}.md`, `reports/${developer}-run.mjs`, `reports/${developer}-check.mjs`]
const protectedRoots = [
  ...inputNames.map(n => join(repo, pkgRel, n)), join(repo, pkgRel, 'lib'),
  ...['a11-closure-20261021', 'a12-closure-20261021', 'a13-closure-20261022', 'a14-closure-20261022']
    .map(n => join('/private/tmp', `pmtool-${n}`, pkgRel, 'lib')),
  join(a14, pkgRel, 'src'), oldEvidence,
  join(repo, 'docs/testing', `${original}-selftmp/r1`),
  join(repo, 'reports', `${developer}-selftmp`),
  ...contractNames.map(n => join(repo, n)), ...Object.values(depRoots),
  ...[deps, join(repo, pkgRel, 'node_modules')].flatMap(p => ['.vite', '.cache', '.vite-temp'].map(n => join(p, n))),
]
const before = Object.fromEntries(protectedRoots.map(p => [p, inventory(p)]))
const sourceBefore = before[join(repo, pkgRel, 'src')]
const gitEnv = { PATH: '/usr/bin:/bin', HOME: self, GIT_OPTIONAL_LOCKS: '0', LANG: 'en_US.UTF-8' }
const acquisitionCommands = []
const git = (id, args) => {
  const start = new Date().toISOString()
  const r = spawnSync('/usr/bin/git', args, { cwd: repo, env: gitEnv, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
  acquisitionCommands.push({ id, argv: ['/usr/bin/git', ...args], cwd: repo, env: gitEnv, start,
    end: new Date().toISOString(), originalExit: r.status, signal: r.signal, stderr: r.stderr })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout
}
mkdirSync(self, { recursive: true, mode: 0o700 })
const head = git('head', ['rev-parse', 'HEAD']).trim()
const originMain = git('origin-main', ['rev-parse', 'origin/main']).trim()
const tracked = git('candidate-diff', ['diff', '--binary', 'HEAD', '--', pkgRel, 'launcher'])
save('candidate-tracked.patch', tracked)
save('candidate-status.txt', git('status', ['status', '--short', '--branch', '--', pkgRel, 'launcher']))
const newInputs = git('new-inputs', ['ls-files', '--others', '--exclude-standard', '--',
  ...inputNames.map(n => `${pkgRel}/${n}`), 'launcher']).trim().split('\n').filter(Boolean).sort()
save('candidate-new-inputs.json', newInputs.map(p => ({ path: p, ...inventory(join(repo, p))['.'] })))
save('acquisition-commands.json', acquisitionCommands)
const inputBefore = Object.fromEntries(inputNames.map(n => [n, before[join(repo, pkgRel, n)]]))
const frozenRoots = {}
for (const phase of ['old', 'new']) {
  const frozen = join(self, phase, 'frozen')
  frozenRoots[phase] = frozen
  const pkg = join(frozen, pkgRel)
  for (const n of inputNames) {
    const from = join(phase === 'old' ? a14 : repo, pkgRel, n)
    if (existsSync(from)) cpSync(from, join(pkg, n), { recursive: true, preserveTimestamps: true })
  }
  const tests = join(frozen, 'docs/testing')
  mkdirSync(tests, { recursive: true })
  for (const n of [`${original}-cases.test.tsx`, `${prefix}-cases.test.tsx`])
    cpSync(join(repo, 'docs/testing', n), join(tests, n), { preserveTimestamps: true })
  symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
  symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
}
const frozenBefore = Object.fromEntries(Object.entries(frozenRoots).map(([phase, root]) =>
  [phase, Object.fromEntries(inputNames.map(n => [n, inventory(join(root, pkgRel, n))]))]))
for (const n of inputNames) assert.deepEqual(content(frozenBefore.new[n]), content(inputBefore[n]), `copy differs ${n}`)
assert.deepEqual(content(frozenBefore.old.src), content(before[join(a14, pkgRel, 'src')]))
save('frozen-inputs.json', frozenBefore)
const authorSource = read(join(repo, 'reports', `${developer}-selftmp/r4/after/source-manifest.json`))
const sourceDeltaFromAuthor = delta(content(authorSource), content(sourceBefore))
const oldNewSourceDelta = delta(content(frozenBefore.old.src), content(frozenBefore.new.src))
const originalCommands = read(join(repo, 'docs/testing', `${original}-selftmp/r1/commands.json`))
assert.deepEqual(originalCommands.map(c => c.originalExit), [0, 0, 1, 1])
const originalReporterAudit = originalCommands.map(c => {
  const r = read(join(repo, 'docs/testing', `${original}-selftmp/r1`, `${c.id}.result.json`))
  const executed = r.testResults.flatMap(t => t.assertionResults).filter(a => ['passed', 'failed'].includes(a.status))
  assert.equal(executed.length, 1)
  assert.equal(executed[0].status, c.id.startsWith('PC-C') ? 'passed' : 'failed')
  return { id: c.id, originalExit: c.originalExit, assertion: executed[0] }
})
save('original-reporter-audit.json', originalReporterAudit)
const replay = read(join(repo, 'docs/testing', `${original}-selftmp/r1/replay-input.json`))
save('replay-input.json', replay)
save('fixture-audit.json', {
  originalTestSha256: sha(readFileSync(join(repo, 'docs/testing', `${original}-cases.test.tsx`))),
  originalSnapshotT1: Object.fromEntries(Object.entries(replay.stepSnapshots).map(([s, snap]) =>
    [s, snap.tasks.find(t => t.id === 't-0001').updatedAt])),
  initialT1: replay.initial.tasks.find(t => t.id === 't-0001').updatedAt,
  authorPCC02: ['r1', 'r2', 'r3', 'r4'].map(r => {
    const p = join(repo, 'reports', `${developer}-selftmp/${r}/after/PC-C02.result.json`)
    const reporter = read(p)
    return { path: p, sha256: sha(readFileSync(p)), passed: reporter.numPassedTests, failed: reporter.numFailedTests }
  }),
  correction: 'independent monotonic snapshot/base-enforcing control; original expectations and evidence unchanged',
})
save('candidate.json', {
  at: new Date().toISOString(), head, originMain, sourceTree: repo, frozenRoots,
  trackedPatchSha256: sha(tracked), newInputsSha256: sha(readFileSync(join(self, 'candidate-new-inputs.json'))),
  inputManifestSha256: sha(JSON.stringify(inputBefore)), inputs: inputBefore,
  sourceDeltaFromAuthor, oldNewSourceDelta,
  oldManifestSha256: sha(readFileSync(join(oldEvidence, 'candidate.json'))),
  sourceCount: Object.keys(sourceBefore).length,
  environment: { os: os.release(), arch: os.arch(), node: process.version, executable: process.execPath },
  dependencies: Object.fromEntries(depNames.map(n => [n, { root: depRoots[n], version: read(join(depRoots[n], 'package.json')).version }])),
  writesOnly: self, productCopiesPatched: false, guiExecuted: false, built: false,
})
for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(self, n))
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: join(self, 'home'),
  TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'), DSH_HOME: join(self, 'runtime'),
  CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
  PC_INPUT: join(self, 'replay-input.json'), PC_OBSERVATIONS: join(self, 'observations.jsonl'),
}
for (const [phase, root] of Object.entries(frozenRoots)) save(`${phase}/vitest.config.mjs`,
  `export default ${JSON.stringify({ root, cacheDir: join(self, 'cache', phase),
    test: { environment: 'node', cache: false, include: ['docs/testing/*.test.tsx', `${pkgRel}/src/**/*.test.ts`, `${pkgRel}/src/**/*.test.tsx`],
      pool: 'forks', poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 } }, null, 2)}\n`)
const commands = []
function run(id, args, cwd) {
  const argv = [process.execPath, ...args]
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env, encoding: 'utf8', timeout: 240000, maxBuffer: 64 * 1024 * 1024 })
  save(`${id}.stdout.log`, r.stdout ?? '')
  save(`${id}.stderr.log`, r.stderr ?? '')
  const c = { id, argv, cwd, env, start, end: new Date().toISOString(), originalExit: r.status,
    signal: r.signal, error: r.error?.message ?? null }
  commands.push(c)
  save(`${id}.command.json`, c)
  console.log(JSON.stringify({ id, originalExit: r.status, signal: r.signal }))
}
function test(phase, id, files, pattern) {
  run(`${phase}-${id}`, [join(deps, 'vitest/vitest.mjs'), 'run', ...files,
    '--config', join(self, phase, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose', '--reporter=json',
    '--outputFile', join(self, `${phase}-${id}.result.json`), ...(pattern ? ['--testNamePattern', pattern] : [])], frozenRoots[phase])
}
for (const phase of ['old', 'new']) for (const id of ['PC-C01', 'PC-C02', 'PC-A01', 'PC-A02'])
  test(phase, id, [`docs/testing/${original}-cases.test.tsx`], `^${id} `)
test('new', 'independent', [`docs/testing/${prefix}-cases.test.tsx`])
const regressionFiles = [
  'client/shared/drawers/copilot-preconfirm.test.tsx', 'client/sidecar-minimize-retention.test.tsx',
  'client/panel-checklist-toggle.test.tsx', 'client/panel-launch-handshake.test.tsx', 'client/provenance-panel.test.tsx',
  'client/shared/task-draft-materials-stage.test.tsx', 'core/copilot-validate.test.ts',
  'core/copilot-task-fields.test.ts', 'core/ask-projection.test.ts',
].map(p => `${pkgRel}/src/${p}`)
test('new', 'regression', regressionFiles)
run('new-noemit', [join(deps, 'typescript/bin/tsc'), '--project', join(frozenRoots.new, pkgRel, 'tsconfig.json'),
  '--noEmit', '--incremental', 'false'], join(frozenRoots.new, pkgRel))
const after = Object.fromEntries(protectedRoots.map(p => [p, inventory(p)]))
const drift = Object.fromEntries(protectedRoots.map(p => [p, delta(before[p], after[p])]))
const frozenDrift = Object.fromEntries(Object.entries(frozenRoots).map(([phase, root]) => [phase,
  Object.fromEntries(inputNames.map(n => [n, delta(frozenBefore[phase][n], inventory(join(root, pkgRel, n)))]))]))
save('protected-manifests.json', { before, after })
save('commands.json', commands)
save('audit.json', { drift, frozenDrift, oldDeclaredDrift: verifyOld(), boundary: 'listed roots only; no whole-machine claim' })
const expected = commands.length === 11 && commands.every(c =>
  c.originalExit === (c.id === 'old-PC-A01' || c.id === 'old-PC-A02' ? 1 : 0) && c.signal === null)
const protectionOk = Object.values(drift).flat().length === 0 &&
  Object.values(frozenDrift).flatMap(x => Object.values(x).flat()).length === 0 && verifyOld().length === 0
save('summary.json', { expected, protectionOk, sourceDeltaFromAuthor, commands,
  guiExecuted: false, built: false, overallRAAI04Pass: false, finishedAt: new Date().toISOString() })
console.log(JSON.stringify({ expected, protectionOk, sourceDeltaFromAuthor,
  drift: Object.entries(drift).filter(([, v]) => v.length), frozenDrift }))
process.exitCode = expected && protectionOk ? 0 : 1
