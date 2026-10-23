import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const prefix = 'a14-preconfirm-conflict-contract-20261022'
const self = join(repo, 'docs/testing', `${prefix}-selftmp`, process.argv[2] ?? 'r1')
assert(self.startsWith(join(repo, 'docs/testing', `${prefix}-selftmp/`)))
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
function inventory(root) {
  const result = {}
  if (!existsSync(root)) return result
  function walk(path) {
    const st = lstatSync(path)
    if (st.isSymbolicLink()) result[relative(root, path) || '.'] = { link: realpathSync(path), mtimeMs: st.mtimeMs }
    else if (st.isDirectory()) for (const n of readdirSync(path).sort()) walk(join(path, n))
    else result[relative(root, path) || '.'] = { sha256: sha(readFileSync(path)), bytes: st.size, mtimeMs: st.mtimeMs }
  }
  walk(root)
  return result
}
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])]
  .filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const protectedData = read(join(self, 'protected-manifests.json'))
const drift = Object.fromEntries(Object.entries(protectedData.after).map(([p, data]) => [p, diff(data, inventory(p))]))
const mainSrc = join(repo, 'packages/dsh-pm-tool/src')
const immutableDrift = Object.entries(drift).filter(([p, changed]) => p !== mainSrc && changed.length)
const candidate = read(join(self, 'candidate.json'))
const frozenNow = inventory(join(self, 'frozen/packages/dsh-pm-tool/src'))
const sourceBytes = manifest => Object.fromEntries(Object.entries(manifest).map(([p, v]) => [p, { sha256: v.sha256, bytes: v.bytes }]))
const frozenDrift = diff(sourceBytes(candidate.sourceManifest), sourceBytes(frozenNow))
const commands = read(join(self, 'commands.json'))
const commandResults = commands.map(c => {
  const reporter = read(join(self, `${c.id}.result.json`))
  const assertions = reporter.testResults.flatMap(t => t.assertionResults).filter(a => a.status === 'passed' || a.status === 'failed')
  assert.equal(assertions.length, 1)
  assert.equal(assertions[0].status, c.id.startsWith('PC-C') ? 'passed' : 'failed')
  assert.equal(c.originalExit, c.id.startsWith('PC-C') ? 0 : 1)
  assert.equal(c.signal, null)
  return { id: c.id, exit: c.originalExit, status: assertions[0].status, originalFailure: assertions[0].failureMessages }
})
const conflict = join(repo, 'reports/all-pending-evidence-20261021/A14/final/conflict')
const draftByteEqual = Object.fromEntries(['t1', 't2', 'ledger', 'roots'].map(n =>
  [n, readFileSync(join(conflict, `initial-${n}.json`)).equals(readFileSync(join(conflict, `draft-${n}.json`)))]))
assert(Object.values(draftByteEqual).every(Boolean))
const docs = ['plan.md', 'cases.test.tsx', 'run.mjs', 'check.mjs'].map(n => `${prefix}-${n}`).concat(`${prefix}.md`)
const selfFileHashes = Object.fromEntries(docs.map(n => {
  const bytes = readFileSync(join(repo, 'docs/testing', n))
  assert(!/^[\t ]+$/m.test(bytes.toString()), `whitespace-only line: ${n}`)
  assert(!/[^\r\n][\t ]+\r?$/m.test(bytes.toString()), `trailing whitespace: ${n}`)
  return [n, sha(bytes)]
}))
const ps = spawnSync('/bin/ps', ['-axo', 'pid,ppid,command'], { encoding: 'utf8' })
assert.equal(ps.status, 0)
const processes = ps.stdout.split('\n').filter(line =>
  line.includes(`${prefix}-run.mjs`) || line.includes(`${self}/frozen`) && line.includes('vitest'))
assert.deepEqual(processes, [], 'test execution still active')
const syntax = ['run.mjs', 'check.mjs'].map(n => {
  const argv = [process.execPath, '--check', join(repo, 'docs/testing', `${prefix}-${n}`)]
  const r = spawnSync(argv[0], argv.slice(1), { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  return { argv, originalExit: r.status, stderr: r.stderr }
})
const ok = immutableDrift.length === 0 && frozenDrift.length === 0
const output = {
  at: new Date().toISOString(), commandResults, draftByteEqual, drift, frozenDrift, immutableDrift,
  selfFileHashes, processes, syntax, exitCode: ok ? 0 : 1,
  boundary: 'delivery source/protection check only; original two product FAIL remain; no GUI/repair',
}
writeFileSync(join(self, 'delivery-check.json'), `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ ok, commandResults: commandResults.map(c => ({ id: c.id, exit: c.exit, status: c.status })),
  immutableDrift, frozenDrift, mainConcurrentDrift: drift[mainSrc], processes, syntax: syntax.map(x => x.originalExit) }))
process.exitCode = ok ? 0 : 1
