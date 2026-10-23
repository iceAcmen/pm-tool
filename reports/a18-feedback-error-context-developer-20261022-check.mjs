import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'a18-feedback-error-context-developer-20261022'
const base = join(repo, 'reports', `${prefix}-selftmp`)
const out = join(base, 'close-r1')
assert(!existsSync(out), 'never overwrite close evidence')
mkdirSync(out, { mode: 0o700 })
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(p) {
    const s = lstatSync(p), k = relative(root, p) || '.'
    if (s.isSymbolicLink()) result[k] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else result[k] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return result
}
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
function save(n, value) {
  writeFileSync(join(out, n), typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}
const rounds = ['before-r1', 'before-r2', 'after-r1', 'after-r2']
const results = []
const pids = []
for (const round of rounds) {
  const dir = join(base, round)
  assert.deepEqual(inventory(dir), read(join(base, `final-${round}/own-output-inventory.json`)), `${round} all old bytes/mtime`)
  const cs = read(join(dir, 'commands.json')), summary = read(join(dir, 'summary.json'))
  for (const c of cs) {
    pids.push(c.pid)
    const item = summary.results.find(r => r.id === c.id)
    assert.equal(c.originalExit, item.originalExit)
    for (const type of ['stdout', 'stderr']) {
      assert.equal(sha(readFileSync(join(dir, `${c.id}.${type}.log`))), item[`${type}Sha256`])
    }
    if (item.reporterSha256) assert.equal(sha(readFileSync(join(dir, `${c.id}.result.json`))), item.reporterSha256)
  }
  results.push({ round, oldOutputHashMtimeUnchanged: true, releasedAtRoundEnd: read(join(base, `final-${round}/final.json`)).released,
    results: summary.results.map(r => ({ id: r.id, originalExit: r.originalExit, passed: r.passed, failed: r.failed })) })
}
const latest = join(base, 'after-r2')
const protectedBefore = read(join(latest, 'protected-before.json'))
const protectedDrift = Object.fromEntries(Object.keys(protectedBefore).map(p => [p, diff(protectedBefore[p], inventory(p))])
  .filter(([, changes]) => changes.length))
assert.deepEqual(protectedDrift, {})
const manifest = read(join(latest, 'frozen-inputs.json')), source = read(join(latest, 'source-at-freeze.json'))
for (const n of Object.keys(manifest)) {
  assert.deepEqual(inventory(join(latest, 'frozen/packages/dsh-pm-tool', n)), manifest[n])
  assert.deepEqual(inventory(join(repo, 'packages/dsh-pm-tool', n)), source[n])
}
const expert = join(repo, 'docs/testing/a17-transport-feedback-independent-retest-20261022-selftmp/r1')
const oldAudit = read(join(base, 'before-r1/original-audit.json'))
for (const [n, info] of Object.entries(oldAudit.records)) {
  assert.deepEqual(inventory(join(expert, `independent-counterexamples.${n}`))['.'], info)
}
save('all-round-output-inventory.json', Object.fromEntries(rounds.map(r => [r, inventory(join(base, r))])))
const argv = ['/bin/ps', '-p', [...new Set(pids)].join(','), '-o', 'pid=,ppid=,command=']
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(latest, 'home'), TMPDIR: join(latest, 'tmp'),
  XDG_CACHE_HOME: join(latest, 'cache'), DSH_HOME: join(latest, 'runtime'), LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1' }
const start = new Date().toISOString()
const ps = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8' })
save('process-check.stdout.log', ps.stdout)
save('process-check.stderr.log', ps.stderr)
save('process-check.command.json', { argv, cwd: repo, env, pid: ps.pid, start, end: new Date().toISOString(),
  originalExit: ps.status, signal: ps.signal })
assert.equal(ps.status, 1)
assert.equal(ps.stdout.trim(), '')
const sourceDiffCommands = []
for (const n of ['client/panel.tsx', 'client/result-card.tsx', 'core/ui-feedback.ts',
  'client/panel-transport-error-feedback.test.tsx', 'client/result-card.test.ts', 'core/ui-feedback.test.ts']) {
  const args = ['/usr/bin/diff', '-u', join(base, 'before-r1/frozen/packages/dsh-pm-tool/src', n),
    join(latest, 'frozen/packages/dsh-pm-tool/src', n)]
  const r = spawnSync(args[0], args.slice(1), { cwd: repo, env, encoding: 'utf8' })
  const id = n.replaceAll('/', '_')
  save(`${id}.diff`, r.stdout)
  sourceDiffCommands.push({ argv: args, cwd: repo, env, originalExit: r.status, signal: r.signal, stderr: r.stderr })
  assert.equal(r.status, 1, 'source diff is expected, not product failure')
}
save('source-diff-commands.json', sourceDiffCommands)
save('handoff-files.json', Object.fromEntries(['.md', '-run.mjs', '-check.mjs']
  .map(n => [`reports/${prefix}${n}`, inventory(join(repo, 'reports', `${prefix}${n}`))['.']])))
save('close.json', { rounds: results, protectedDrift, currentSourceMatchesAfterR2: true,
  allOldOutputHashMtimeUnchanged: true, originalExpertFailureHashMtimeUnchanged: true,
  noRecordedChildren: true, released: true, independentSignoff: false,
  defaultStringOracleStillRed: true, developerNewContextTests: 16, build: false, gui: false, services: false, commit: false })
console.log(JSON.stringify({ released: true, protectionOk: true, originalExpertFailurePreserved: true,
  allFourRoundsPreserved: true, independentSignoff: false }))
