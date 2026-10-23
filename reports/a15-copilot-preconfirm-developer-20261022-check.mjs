// 交付核查不签独立PASS；所有写入限定开发报告前缀。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a15-copilot-preconfirm-developer-20261022'
const root = join(repo, 'reports', `${prefix}-selftmp`)
const out = join(root, process.argv[2] ?? 'delivery-r1')
assert(relative(root, out).match(/^delivery-r[1-9]\d*$/))
assert(!existsSync(out), 'do not overwrite prior checks')
mkdirSync(out, { recursive: true, mode: 0o700 })
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const save = (name, data) => writeFileSync(join(out, name),
  typeof data === 'string' ? data : `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' })
const baseline = join(root, 'r1/before')
const candidate = join(root, 'r4/after')
const commands = []
for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n))
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: join(out, 'home'),
  TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'), DSH_HOME: join(out, 'runtime'),
  CI: 'true', LANG: 'en_US.UTF-8', TZ: 'UTC', NODE_DISABLE_COMPILE_CACHE: '1' }
function run(id, executable, args) {
  const start = new Date().toISOString()
  const r = spawnSync(executable, args, { cwd: repo, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  save(`${id}.stdout.log`, r.stdout ?? '')
  save(`${id}.stderr.log`, r.stderr ?? '')
  commands.push({ id, argv: [executable, ...args], cwd: repo, env, start, end: new Date().toISOString(),
    originalExit: r.status, signal: r.signal, error: r.error?.message ?? null })
  return r
}
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(p) {
    const s = lstatSync(p)
    if (s.isSymbolicLink()) result[relative(root, p) || '.'] = { link: realpathSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[relative(root, p) || '.'] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return result
}
const delta = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const allowed = ['client/shared/drawers/sidecar-portal.tsx', 'client/shared/drawers/copilot-preconfirm.test.tsx']
const srcBefore = read(join(baseline, 'source-manifest.json'))
const srcAfter = read(join(candidate, 'source-manifest.json'))
// 跨副本比较字节；复制可能舍入mtime。原位保护仍用上面的完整hash/mtime比较。
const sourceDelta = [...new Set([...Object.keys(srcBefore), ...Object.keys(srcAfter)])]
  .filter(k => srcBefore[k]?.sha256 !== srcAfter[k]?.sha256 || srcBefore[k]?.bytes !== srcAfter[k]?.bytes)
const copyTimestampDelta = delta(srcBefore, srcAfter).filter(k => !sourceDelta.includes(k))
assert.deepEqual(sourceDelta.sort(), [...allowed].sort())
const protectedBaseline = read(join(baseline, 'protected-manifests.json')).before
const protectedCandidate = read(join(candidate, 'protected-manifests.json')).after
const current = Object.fromEntries(Object.keys(protectedCandidate).map(p => [p, inventory(p)]))
const currentDrift = Object.fromEntries(Object.keys(current).map(p => [p, delta(protectedCandidate[p], current[p])]))
const spanningDrift = Object.fromEntries(Object.keys(protectedBaseline).map(p =>
  [p, delta(protectedBaseline[p], protectedCandidate[p])]))
const classified = []
for (const [p, paths] of Object.entries(spanningDrift).filter(([, paths]) => paths.length)) {
  const before = protectedBaseline[p]
  const after = protectedCandidate[p]
  classified.push({ root: p, added: paths.filter(k => !before[k]),
    removed: paths.filter(k => !after[k]), changed: paths.filter(k => before[k] && after[k]),
    ownership: p.endsWith('/src') ? 'developer source delta (exact two allowed files)' :
      'concurrent evidence additions observed; not written by this runner; producer not independently established' })
}
const sourceRoot = join(repo, 'packages/dsh-pm-tool/src')
assert.deepEqual(currentDrift[sourceRoot], [])
for (const p of allowed) assert.equal(sha(readFileSync(join(sourceRoot, p))), srcAfter[p].sha256)
for (const [p, paths] of Object.entries(currentDrift)) assert.deepEqual(paths, [], `delivery drift ${p}`)
const beforeCommands = read(join(baseline, 'commands.json'))
assert.deepEqual(beforeCommands.map(c => c.originalExit), [0, 0, 1, 1])
const afterCommands = read(join(candidate, 'commands.json'))
assert.equal(afterCommands.length, 6)
assert(afterCommands.every(c => c.originalExit === 0 && c.signal === null))
for (const dir of [baseline, candidate]) {
  for (const id of ['PC-C01', 'PC-C02', 'PC-A01', 'PC-A02']) {
    const r = read(join(dir, `${id}.result.json`))
    const actual = r.testResults.flatMap(t => t.assertionResults).filter(a => ['passed', 'failed'].includes(a.status))
    assert.equal(actual.length, 1)
    assert(actual[0].fullName.startsWith(id))
  }
}
const regression = read(join(candidate, 'regression.result.json'))
assert.equal(regression.numPassedTests, 87)
assert.equal(regression.numFailedTests, 0)
const audit = read(join(candidate, 'audit.json'))
assert.equal(Object.values(audit.drift).flat().length, 0)
assert.deepEqual(audit.oldDeclaredDrift, [])
assert.deepEqual(audit.frozenDrift, [])
for (const name of ['run', 'check']) assert.equal(run(`syntax-${name}`, process.execPath,
  ['--check', join(repo, 'reports', `${prefix}-${name}.mjs`)]).status, 0)
assert.equal(run('diff-check', '/usr/bin/git', ['diff', '--check', '--',
  join(sourceRoot, allowed[0])]).status, 0)
assert.equal(run('vendor-static', process.execPath,
  [join(repo, 'packages/dsh-pm-tool/scripts/verify-external-skills.mjs')]).status, 0)
const patch = run('developer-only-patch', '/usr/bin/git', ['diff', '--no-index', '--binary', '--',
  join(baseline, 'frozen/packages/dsh-pm-tool/src', allowed[0]), join(sourceRoot, allowed[0])])
assert.equal(patch.status, 1, 'no-index 1 means files differ, not a test failure')
save('developer-only.patch', patch.stdout)
save('new-test.tsx', readFileSync(join(sourceRoot, allowed[1]), 'utf8'))
const queried = run('remaining-runner-processes', '/usr/bin/pgrep', ['-fl',
  '^/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node reports/a15-copilot-preconfirm-developer-20261022-run.mjs'])
assert.equal(queried.status, 1, 'pgrep 1 means no matching runner; do not kill anything')
const finalDrift = Object.fromEntries(Object.keys(current).map(p => [p, delta(current[p], inventory(p))]))
save('protected-manifests.json', { candidate: protectedCandidate, current, finalDrift })
save('commands.json', commands)
save('delivery.json', {
  at: new Date().toISOString(), baselineCandidate: read(join(baseline, 'candidate.json')),
  fixedCandidate: read(join(candidate, 'candidate.json')), sourceDelta, copyTimestampDelta,
  sourceHashes: Object.fromEntries(allowed.map(p => [p, srcAfter[p]])), classified,
  currentDrift, finalDrift, beforeExits: beforeCommands.map(c => c.originalExit),
  afterExits: afterCommands.map(c => c.originalExit), regression: { total: regression.numTotalTests, passed: 87, failed: 0 },
  originalFailuresRetained: true, writesOnly: out, processesQueriedOnly: true,
  independentSignoff: false, guiExecuted: false,
  vendor: { sourceCommit: '49dd158d1076134a641b33efb035946536778336', staticVerified: true,
    skillsLoaded: [], reason: 'external-skills §6.1 blocks automatic loading while independent test gate remains FAIL; no vendor execution' },
})
assert.equal(Object.values(finalDrift).flat().length, 0)
console.log(JSON.stringify({ developerDeliveryCheck: true, beforeExits: [0, 0, 1, 1],
  afterExits: afterCommands.map(c => c.originalExit), regression: '87/87', independentSignoff: false }))
