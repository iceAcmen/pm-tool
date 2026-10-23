import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a15-preconfirm-independent-retest-20261022'
const self = join(repo, 'docs/testing', `${prefix}-selftmp`)
const out = join(self, process.argv[2] ?? 'final-r1')
assert.match(relative(self, out), /^final-r[1-9]\d*$/)
assert(!existsSync(out))
mkdirSync(out, { mode: 0o700 })
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const save = (n, x) => writeFileSync(join(out, n), typeof x === 'string' ? x : `${JSON.stringify(x, null, 2)}\n`, { flag: 'wx' })
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
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const parentRoot = join(self, 'parent-r1')
const parent = read(join(parentRoot, 'summary.json'))
assert.equal(parent.originalExit, 1)
assert.equal(parent.expectedFailure, true)
assert.equal(parent.protectedOk, true)
const evidence = read(join(parentRoot, 'protected-manifests.json')).after
const drift = Object.fromEntries(Object.entries(evidence).map(([p, x]) => [p, diff(x, inventory(p))]))
assert.equal(Object.values(drift).flat().length, 0)
const parentFrozenNow = inventory(join(parentRoot, 'frozen/packages/dsh-pm-tool/src'))
const parentFrozenDrift = diff(parent.sourceManifest, parentFrozenNow)
assert.deepEqual(parentFrozenDrift, [])
const selfFiles = [`${prefix}.md`, ...['plan.md', 'run.mjs', 'check.mjs', 'parent-run.mjs',
  'final-check.mjs', 'cases.test.tsx', 'expansion.test.tsx'].map(n => `${prefix}-${n}`)]
const selfHashes = Object.fromEntries(selfFiles.map(n => {
  const bytes = readFileSync(join(repo, 'docs/testing', n))
  assert(!/[^\r\n][\t ]+\r?$/m.test(bytes.toString()), `trailing whitespace ${n}`)
  return [n, sha(bytes)]
}))
const env = { PATH: `${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
  HOME: join(out, 'home'), TMPDIR: join(out, 'tmp'), XDG_CACHE_HOME: join(out, 'cache'),
  DSH_HOME: join(out, 'runtime'), LANG: 'en_US.UTF-8', TZ: 'UTC', CI: 'true', NODE_DISABLE_COMPILE_CACHE: '1' }
for (const n of ['home', 'tmp', 'cache', 'runtime']) mkdirSync(join(out, n))
const commands = []
for (const n of ['run.mjs', 'check.mjs', 'parent-run.mjs', 'final-check.mjs']) {
  const argv = [process.execPath, '--check', join(repo, 'docs/testing', `${prefix}-${n}`)]
  const start = new Date().toISOString()
  const r = spawnSync(argv[0], argv.slice(1), { cwd: repo, env, encoding: 'utf8' })
  save(`${n}.stdout.log`, r.stdout)
  save(`${n}.stderr.log`, r.stderr)
  commands.push({ argv, cwd: repo, env, start, end: new Date().toISOString(), originalExit: r.status, signal: r.signal })
  assert.equal(r.status, 0)
}
const ps = spawnSync('/bin/ps', ['-axo', 'pid=,ppid=,command='], { env, encoding: 'utf8' })
assert.equal(ps.status, 0)
const processes = ps.stdout.split('\n').filter(line => {
  const command = line.replace(/^\s*\d+\s+\d+\s+/, '')
  return command.startsWith(process.execPath) && (command.includes(`${prefix}-run.mjs`) ||
    command.includes(`${prefix}-parent-run.mjs`) ||
    command.includes(self) && (command.includes('vitest') || command.includes('/tsc')))
})
assert.deepEqual(processes, [])
const finalDrift = Object.fromEntries(Object.entries(evidence).map(([p, x]) => [p, diff(x, inventory(p))]))
assert.equal(Object.values(finalDrift).flat().length, 0)
save('commands.json', commands)
save('final.json', { at: new Date().toISOString(), selfHashes, drift, finalDrift, parentFrozenDrift,
  processes, parentReporterSha256: sha(readFileSync(join(parentRoot, 'parent.result.json'))),
  parentCommandSha256: sha(readFileSync(join(parentRoot, 'command.json'))),
  parentSummarySha256: sha(readFileSync(join(parentRoot, 'summary.json'))),
  originalPCSourceAuto: 'limited PASS', extendedParentSourceAuto: 'FAIL (4/4 absent baseline)',
  newGUI: 'NOT_RUN', originalGUIConflict: 'FAIL retained',
  overallRAAI04Pass: false, released: true, checkExit: 0,
  boundary: 'audit integrity only; no product repair/build/GUI/commit, no whole-machine claim' })
console.log(JSON.stringify({ checkOk: true, processes, drift: Object.entries(finalDrift).filter(([, v]) => v.length),
  originalPCSourceAuto: 'limited PASS', extendedParentSourceAuto: 'FAIL (4/4)', overallRAAI04Pass: false, released: true }))
