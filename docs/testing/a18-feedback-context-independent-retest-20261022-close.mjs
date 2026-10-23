import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a18-feedback-context-independent-retest-20261022'
const testing = join(repo, 'docs/testing'), base = join(testing, `${prefix}-selftmp`)
const out = join(base, 'close-r3'), round = join(base, 'r3')
assert(!existsSync(out), 'never overwrite close')
mkdirSync(out, { mode: 0o700 })
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
function inventory(root) {
  const m = {}
  if (!existsSync(root)) return m
  function walk(p) {
    const s = lstatSync(p), k = relative(root, p) || '.'
    if (s.isSymbolicLink()) m[k] = { link: readlinkSync(p), mtimeMs: s.mtimeMs }
    else if (s.isDirectory()) for (const n of readdirSync(p).sort()) walk(join(p, n))
    else m[k] = { sha256: sha(readFileSync(p)), bytes: s.size, mtimeMs: s.mtimeMs }
  }
  walk(root)
  return m
}
const save = (n, v) => writeFileSync(join(out, n), typeof v === 'string' ? v : `${JSON.stringify(v, null, 2)}\n`, { flag: 'wx' })
assert.deepEqual(inventory(round), read(join(base, 'final-r3/own-output-inventory.json')))
for (const [r, m] of Object.entries(read(join(base, 'review-r3/early-failed-rounds.json'))))
  assert.deepEqual(inventory(join(base, r)), m, `failed ${r} preserved`)
const protection = read(join(base, 'final-r3/protected-after.json')), drift = []
for (const [p, m] of Object.entries(protection))
  if (JSON.stringify(inventory(p)) !== JSON.stringify(m)) drift.push(p)
save('live-drift.json', drift); assert.deepEqual(drift, [])
const reportPath = join(testing, `${prefix}.md`), report = readFileSync(reportPath, 'utf8')
for (const t of ['SOURCE PASS', '原样20仍为 FAIL', 'GUI BLOCKED', '300保护根', '0/1/0/0']) assert(report.includes(t))
const commands = [...read(join(round, 'acquisition-commands.json')), ...read(join(round, 'original-commands.json')),
  ...read(join(round, 'commands.json'))]
const argv = ['/bin/ps', '-p', [...new Set(commands.map(c => c.pid))].join(','), '-o', 'pid=,ppid=,command=']
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(round, 'home'), TMPDIR: join(round, 'tmp'),
  XDG_CACHE_HOME: join(round, 'cache'), DSH_HOME: join(round, 'runtime'), LANG: 'en_US.UTF-8', TZ: 'UTC',
  NODE_DISABLE_COMPILE_CACHE: '1' }
const start = new Date().toISOString(), ps = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8' })
save('process-check.stdout.log', ps.stdout); save('process-check.stderr.log', ps.stderr)
save('process-check.command.json', { argv, env, cwd: repo, start, end: new Date().toISOString(),
  pid: ps.pid, originalExit: ps.status, signal: ps.signal })
assert.equal(ps.status, 1); assert.equal(ps.stdout.trim(), '')
save('handoff-files.json', Object.fromEntries(readdirSync(testing).filter(n => n.startsWith(prefix) && !n.endsWith('-selftmp'))
  .map(n => [n, inventory(join(testing, n))])))
save('close.json', { source: 'PASS', finiteAuto: 'PASS using documented independent adapter',
  original20: 'FAIL preserved', reportSha256: sha(report), allSealedEvidencePreserved: true,
  earlyFacilitiesFailuresPreserved: true, protectedRoots: Object.keys(protection).length, drift,
  noRecordedChildren: true, released: true, noSourceWriteOccupancy: true,
  guiSigned: false, wholeGateSigned: false, build: false, services: false, commit: false })
console.log(JSON.stringify({ source: 'PASS', finiteAuto: 'PASS', original20: 'FAIL preserved',
  protectedRoots: Object.keys(protection).length, drift, released: true, guiSigned: false }))
