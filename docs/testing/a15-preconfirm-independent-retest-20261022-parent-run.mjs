import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a15-preconfirm-independent-retest-20261022'
const reference = join(repo, 'docs/testing', `${prefix}-selftmp/r1`)
const out = join(repo, 'docs/testing', `${prefix}-selftmp`, process.argv[2] ?? 'parent-r1')
assert.match(relative(join(repo, 'docs/testing', `${prefix}-selftmp`), out), /^parent-r[1-9]\d*$/)
assert(!existsSync(out))
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const candidate = read(join(reference, 'candidate.json'))
const baselineProtected = read(join(reference, 'protected-manifests.json')).after
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
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const content = x => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, { sha256: v.sha256, bytes: v.bytes, link: v.link }]))
const roots = [...Object.keys(baselineProtected), reference]
const before = Object.fromEntries(roots.map(p => [p, inventory(p)]))
for (const [p, manifest] of Object.entries(baselineProtected)) assert.deepEqual(diff(manifest, before[p]), [], `reference drift ${p}`)
const frozen = join(out, 'frozen'), pkg = join(frozen, 'packages/dsh-pm-tool')
mkdirSync(out, { recursive: true, mode: 0o700 })
const save = (name, x) => writeFileSync(join(out, name), typeof x === 'string' ? x : `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
for (const n of Object.keys(candidate.inputs)) {
  cpSync(join(repo, 'packages/dsh-pm-tool', n), join(pkg, n), { recursive: true, preserveTimestamps: true })
  assert.deepEqual(content(inventory(join(pkg, n))), content(candidate.inputs[n]))
}
const tests = join(frozen, 'docs/testing')
mkdirSync(tests, { recursive: true })
const test = `${prefix}-expansion.test.tsx`
cpSync(join(repo, 'docs/testing', test), join(tests, test), { preserveTimestamps: true })
const deps = '/private/tmp/pmtool-a14-closure-20261022/packages/dsh-pm-tool/node_modules'
symlinkSync(deps, join(pkg, 'node_modules'), 'dir')
symlinkSync(deps, join(frozen, 'node_modules'), 'dir')
const frozenBefore = Object.fromEntries(Object.keys(candidate.inputs).map(n => [n, inventory(join(pkg, n))]))
for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n))
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1', PC_INPUT: join(reference, 'replay-input.json'),
  PC_OBSERVATIONS: join(out, 'observations.jsonl') }
save('vitest.config.mjs', `export default ${JSON.stringify({ root: frozen, cacheDir: join(out, 'cache/vite'),
  test: { environment: 'node', cache: false, include: [`docs/testing/${test}`], pool: 'forks',
    poolOptions: { forks: { singleFork: true } }, minWorkers: 1, maxWorkers: 1, testTimeout: 20000 } }, null, 2)}\n`)
const argv = [process.execPath, join(deps, 'vitest/vitest.mjs'), 'run', `docs/testing/${test}`,
  '--config', join(out, 'vitest.config.mjs'), '--no-cache', '--reporter=verbose', '--reporter=json',
  '--outputFile', join(out, 'parent.result.json')]
const start = new Date().toISOString()
const r = spawnSync(argv[0], argv.slice(1), { cwd: frozen, env, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024 })
save('parent.stdout.log', r.stdout ?? '')
save('parent.stderr.log', r.stderr ?? '')
save('command.json', { argv, cwd: frozen, env, start, end: new Date().toISOString(),
  originalExit: r.status, signal: r.signal, error: r.error?.message ?? null, pid: r.pid })
const after = Object.fromEntries(roots.map(p => [p, inventory(p)]))
const drift = Object.fromEntries(roots.map(p => [p, diff(before[p], after[p])]))
const frozenDrift = Object.fromEntries(Object.keys(frozenBefore).map(n => [n, diff(frozenBefore[n], inventory(join(pkg, n)))]))
save('protected-manifests.json', { before, after })
const result = read(join(out, 'parent.result.json'))
const observations = readFileSync(join(out, 'observations.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
const assertions = result.testResults.flatMap(t => t.assertionResults)
const expectedFailure = r.status === 1 && r.signal === null && result.numFailedTests === 4 &&
  observations.length === 4 && observations.every(o => !Object.hasOwn(o.base, o.id)) &&
  assertions.every(a => a.status === 'failed' && a.failureMessages.some(m => m.includes('to be') && m.includes('undefined')))
const protectedOk = Object.values(drift).flat().length === 0 && Object.values(frozenDrift).flat().length === 0
save('summary.json', { at: new Date().toISOString(), referenceCandidate: candidate.head,
  referenceTrackedPatchSha256: candidate.trackedPatchSha256, sourceManifest: frozenBefore.src,
  sourceCount: Object.keys(frozenBefore.src).length, sameReferenceInputBytes: true,
  testSha256: sha(readFileSync(join(tests, test))), originalExit: r.status,
  assertions, observations, expectedFailure, protectedOk, drift, frozenDrift,
  productStatus: 'SOURCE/AUTO FAIL: four extension initial baselines absent from actual PmPanel',
  guiExecuted: false, built: false, productModified: false,
  boundary: 'supplement does not overwrite original PC cases or repair product; raw failures retained' })
console.log(JSON.stringify({ originalExit: r.status, failed: result.numFailedTests, expectedFailure, protectedOk,
  missingKeys: observations.map(o => o.id) }))
process.exitCode = expectedFailure && protectedOk ? 0 : 1
