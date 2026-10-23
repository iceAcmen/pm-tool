import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = join(repo, 'reports/a17-transport-feedback-developer-20261022-selftmp')
const out = join(base, 'close-check-r1')
assert(!existsSync(out))
mkdirSync(out, { mode: 0o700 })
const sha = b => createHash('sha256').update(b).digest('hex')
const read = p => JSON.parse(readFileSync(p, 'utf8'))
const save = (n, value) => writeFileSync(join(out, n), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
const originalOutput = '/Users/bytedance/Library/Application Support/Trae CN/ModularData/ai-agent/command-execution/3e633a7ada6948b2fbe09651108aebd3/output.log'
cpSync(originalOutput, join(out, 'original-read-check-failed.output.log'), { errorOnExist: true, force: false })
save('original-read-check-failure.json', {
  originalToolExit: 1, originalOutput, copiedOutputSha256: sha(readFileSync(originalOutput)),
  cause: 'Compared main-tree mtime against cpSync frozen mtime; copied timestamps lose sub-millisecond precision.',
  correction: 'Compare main-tree mtime to source-at-freeze.json; compare frozen tree to its own frozen-inputs.json.',
  notAProductFailure: true, originalOutputPreserved: true,
})
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
const source = read(join(base, 'after-r2/source-at-freeze.json'))
const sourceDrift = []
for (const [n, expected] of Object.entries(source)) {
  const actual = inventory(join(repo, 'packages/dsh-pm-tool', n))
  if (JSON.stringify(expected) !== JSON.stringify(actual)) sourceDrift.push(n)
}
const frozen = read(join(base, 'after-r2/frozen-inputs.json'))
const frozenDrift = []
for (const [n, expected] of Object.entries(frozen)) {
  const actual = inventory(join(base, 'after-r2/frozen/packages/dsh-pm-tool', n))
  if (JSON.stringify(expected) !== JSON.stringify(actual)) frozenDrift.push(n)
}
const protectedBefore = read(join(base, 'final-after-r2/protected-after.json'))
const protectedDrift = []
for (const [p, expected] of Object.entries(protectedBefore)) {
  if (JSON.stringify(expected) !== JSON.stringify(inventory(p))) protectedDrift.push(p)
}
save('close-check.json', { at: new Date().toISOString(), sourceDrift, frozenDrift, protectedDrift,
  protectedRoots: Object.keys(protectedBefore).length, sameDomainMtimeChecks: true,
  reportSha256: sha(readFileSync(join(repo, 'reports/a17-transport-feedback-developer-20261022.md'))),
  authorOnly: true, independentPass: false, noProductWrites: true })
assert.deepEqual(sourceDrift, []); assert.deepEqual(frozenDrift, []); assert.deepEqual(protectedDrift, [])
console.log(JSON.stringify({ sourceDrift, frozenDrift, protectedDrift, protectedRoots: Object.keys(protectedBefore).length,
  independentPass: false }))
