// PC01/PC02 开发侧冻结证据；只写本报告前缀，不构建、不操作服务。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a15-copilot-preconfirm-developer-20261022'
const original = 'a14-preconfirm-conflict-contract-20261022'
const phase = process.argv[2]
const round = process.argv[3] ?? 'r1'
assert(['before', 'after'].includes(phase))
assert.match(round, /^r[1-9]\d*$/)
const self = join(repo, 'reports', `${prefix}-selftmp`, round, phase)
assert(!existsSync(self), 'fresh evidence only; previous failures must remain')
const a14 = '/private/tmp/pmtool-a14-closure-20261022'
const pkgRel = 'packages/dsh-pm-tool'
const deps = join(a14, pkgRel, 'node_modules')
const frozen = join(self, 'frozen')
const pkg = join(frozen, pkgRel)
const product = `${pkgRel}/src/client/shared/drawers/sidecar-portal.tsx`
const newTest = `${pkgRel}/src/client/shared/drawers/copilot-preconfirm.test.tsx`
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const out = {}
  if (!existsSync(root)) return out
  function walk(p) {
    const st = lstatSync(p)
    if (st.isSymbolicLink()) out[relative(root, p) || '.'] = { link: realpathSync(p), mtimeMs: st.mtimeMs }
    else if (st.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else out[relative(root, p) || '.'] = { sha256: sha(readFileSync(p)), bytes: st.size, mtimeMs: st.mtimeMs }
  }
  walk(root)
  return out
}
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
function save(name, data) {
  const p = resolve(self, name)
  assert(p.startsWith(`${self}/`))
  mkdirSync(dirname(p), { recursive: true, mode: 0o700 })
  writeFileSync(p, typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' })
}
const git = args => {
  const r = spawnSync('/usr/bin/git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout
}
const depNames = ['react', 'react-test-renderer', 'vitest', 'vite', 'typescript', 'lucide-react', 'zod']
const depRoots = Object.fromEntries(depNames.map(n => [n, realpathSync(n === 'vite'
  ? join(dirname(realpathSync(join(deps, 'vitest'))), 'vite') : join(deps, n))]))
const oldRoot = join(repo, 'reports/all-pending-evidence-20261021/A14')
const oldManifest = read(join(oldRoot, 'candidate.json'))
const verifyOld = () => Object.entries({ ...oldManifest.sourceHashes, ...oldManifest.artifacts })
  .filter(([p, h]) => !existsSync(join(a14, p)) || sha(readFileSync(join(a14, p))) !== h).map(([p]) => p)
assert.deepEqual(verifyOld(), [])
const originals = [
  ...['plan.md', 'cases.test.tsx', 'run.mjs', 'check.mjs'].map(n => join(repo, 'docs/testing', `${original}-${n}`)),
  join(repo, 'docs/testing', `${original}.md`),
  join(repo, 'docs/testing', `${original}-selftmp/r1`),
]
const protectedRoots = [
  join(repo, pkgRel, 'src'), join(repo, pkgRel, 'lib'),
  ...['a11-closure-20261021', 'a12-closure-20261021', 'a13-closure-20261022', 'a14-closure-20261022']
    .map(n => join('/private/tmp', `pmtool-${n}`, pkgRel, 'lib')),
  join(a14, pkgRel, 'src'), oldRoot, ...originals, ...Object.values(depRoots),
  ...[deps, join(repo, pkgRel, 'node_modules')].flatMap(p => ['.vite', '.cache', '.vite-temp'].map(n => join(p, n))),
  join(repo, 'vendor/agent-skills/mattpocock'),
]
const before = Object.fromEntries(protectedRoots.map(p => [p, inventory(p)]))
mkdirSync(self, { recursive: true, mode: 0o700 })
if (phase === 'before') {
  cpSync(join(repo, pkgRel, 'src'), join(pkg, 'src'), { recursive: true, preserveTimestamps: true })
  for (const n of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts'])
    cpSync(join(repo, pkgRel, n), join(pkg, n), { preserveTimestamps: true })
  cpSync(join(repo, pkgRel, 'scripts'), join(pkg, 'scripts'), { recursive: true, preserveTimestamps: true })
} else {
  const prior = join(repo, 'reports', `${prefix}-selftmp/r1/before/frozen`, pkgRel)
  assert(existsSync(prior), 'run before first')
  for (const n of ['src', 'scripts', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vitest.config.ts'])
    cpSync(join(prior, n), join(pkg, n), { recursive: true, preserveTimestamps: true })
  cpSync(join(repo, product), join(frozen, product), { preserveTimestamps: true })
  cpSync(join(repo, newTest), join(frozen, newTest), { preserveTimestamps: true })
}
mkdirSync(join(frozen, 'docs/testing'), { recursive: true })
cpSync(join(repo, 'docs/testing', `${original}-cases.test.tsx`),
  join(frozen, 'docs/testing', `${original}-cases.test.tsx`), { preserveTimestamps: true })
symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
const frozenBefore = inventory(join(pkg, 'src'))
save('source-manifest.json', frozenBefore)
save('main-tracked.patch', git(['diff', '--binary', 'HEAD', '--', pkgRel, 'launcher']))
save('main-status.txt', git(['status', '--short', '--branch']))
save('main-new-sources.json', git(['ls-files', '--others', '--exclude-standard', '--', `${pkgRel}/src`])
  .trim().split('\n').filter(Boolean).map(p => ({ path: p, sha256: sha(readFileSync(join(repo, p))) })))
save('baseline-to-candidate.patch', git(['diff', '--binary', 'HEAD', '--', product]))
save('candidate.json', {
  at: new Date().toISOString(), phase, baseline: git(['rev-parse', 'HEAD']).trim(),
  originMain: git(['rev-parse', 'origin/main']).trim(), sourceManifestSha256: sha(JSON.stringify(frozenBefore)),
  originalManifestSha256: sha(readFileSync(join(oldRoot, 'candidate.json'))),
  originalTestSha256: sha(readFileSync(join(frozen, 'docs/testing', `${original}-cases.test.tsx`))),
  environment: { os: os.release(), arch: os.arch(), node: process.version, executable: process.execPath },
  dependencies: Object.fromEntries(depNames.map(n => [n, { root: depRoots[n], version: read(join(depRoots[n], 'package.json')).version }])),
  writesOnly: self, overlays: phase === 'after' ? [product, newTest] : [],
  boundary: 'SOURCE/AUTO developer evidence only; no GUI, build, service, commit or independent PASS',
})
save('replay-input.json', read(join(repo, 'docs/testing', `${original}-selftmp/r1/replay-input.json`)))
for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(self, n))
const env = {
  PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: join(self, 'home'),
  TMPDIR: join(self, 'tmp'), XDG_CACHE_HOME: join(self, 'cache'), DSH_HOME: join(self, 'runtime'),
  CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1',
  PC_INPUT: join(self, 'replay-input.json'), PC_OBSERVATIONS: join(self, 'observations.jsonl'),
}
save('vitest.config.mjs', `export default ${JSON.stringify({
  root: frozen, cacheDir: join(self, 'cache/vite'), test: { environment: 'node', cache: false,
    include: [`docs/testing/${original}-cases.test.tsx`, `${pkgRel}/src/**/*.test.ts`, `${pkgRel}/src/**/*.test.tsx`],
    pool: 'forks', minWorkers: 1, maxWorkers: 1, testTimeout: 15000 },
}, null, 2)}\n`)
const commands = []
function run(id, args, cwd = frozen) {
  const argv = [process.execPath, ...args]
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd, env, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024 })
  save(`${id}.stdout.log`, r.stdout ?? '')
  save(`${id}.stderr.log`, r.stderr ?? '')
  const c = { id, argv, cwd, env, start, end: new Date().toISOString(), originalExit: r.status,
    signal: r.signal, error: r.error?.message ?? null }
  commands.push(c)
  save(`${id}.command.json`, c)
  console.log(JSON.stringify({ id, originalExit: r.status, signal: r.signal }))
  return r.status
}
function test(id) {
  return run(id, [join(deps, 'vitest/vitest.mjs'), 'run', `docs/testing/${original}-cases.test.tsx`,
    '--config', join(self, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose', '--reporter=json',
    '--outputFile', join(self, `${id}.result.json`), '--testNamePattern', `^${id} `])
}
test('PC-C01'); test('PC-C02')
if (commands.every(c => c.originalExit === 0)) { test('PC-A01'); test('PC-A02') }
if (phase === 'after') {
  run('regression', [join(deps, 'vitest/vitest.mjs'), 'run',
    `${pkgRel}/src/client/shared/drawers/copilot-preconfirm.test.tsx`,
    `${pkgRel}/src/client/sidecar-minimize-retention.test.tsx`,
    `${pkgRel}/src/client/panel-checklist-toggle.test.tsx`,
    `${pkgRel}/src/client/panel-launch-handshake.test.tsx`,
    `${pkgRel}/src/client/provenance-panel.test.tsx`,
    `${pkgRel}/src/client/shared/task-draft-materials-stage.test.tsx`,
    `${pkgRel}/src/core/copilot-validate.test.ts`,
    `${pkgRel}/src/core/copilot-task-fields.test.ts`,
    `${pkgRel}/src/core/ask-projection.test.ts`,
    '--config', join(self, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose', '--reporter=json',
    '--outputFile', join(self, 'regression.result.json')])
  run('noemit', [join(deps, 'typescript/bin/tsc'), '--project', join(pkg, 'tsconfig.json'),
    '--noEmit', '--incremental', 'false'], pkg)
}
const after = Object.fromEntries(protectedRoots.map(p => [p, inventory(p)]))
const drift = Object.fromEntries(protectedRoots.map(p => [p, changes(before[p], after[p])]))
save('protected-manifests.json', { before, after })
save('commands.json', commands)
const audit = { drift, oldDeclaredDrift: verifyOld(), frozenDrift: changes(frozenBefore, inventory(join(pkg, 'src'))),
  boundary: 'listed roots only, not whole-machine pollution or service health' }
save('audit.json', audit)
const expected = commands.length === (phase === 'before' ? 4 : 6) &&
  commands.every(c => c.originalExit === (phase === 'before' && c.id.startsWith('PC-A') ? 1 : 0))
const immutableDrift = Object.entries(drift).filter(([p, paths]) => p !== join(repo, pkgRel, 'src') && paths.length)
save('summary.json', { phase, expected, commands, audit, immutableDrift,
  mainConcurrentDrift: drift[join(repo, pkgRel, 'src')], guiExecuted: false, independentSignoff: false })
process.exitCode = expected && !immutableDrift.length && !audit.oldDeclaredDrift.length && !audit.frozenDrift.length ? 0 : 1
