import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const prefix = 'material-progress-ref-independent-retest-20261022-r1'
const here = dirname(fileURLToPath(import.meta.url))
const own = join(here, `${prefix}-selftmp/r1`)
const sha = b => createHash('sha256').update(b).digest('hex')
const index = JSON.parse(readFileSync(join(own, 'sealed-evidence.json')))
for (const [name, record] of Object.entries(index)) {
  const path = resolve(own, name)
  assert(path.startsWith(`${own}/`))
  if (record.link) {
    assert(lstatSync(path).isSymbolicLink())
    assert.equal(readlinkSync(path), record.link)
  } else {
    assert(lstatSync(path).isFile())
    const b = readFileSync(path)
    assert.equal(b.length, record.bytes)
    assert.equal(sha(b), record.sha256)
  }
}
const close = JSON.parse(readFileSync(join(own, 'close.json')))
assert.equal(close.protectedUnchanged, true)
assert.equal(close.stop, true)
const artifacts = ['plan.md', 'report.md', 'run.mjs', 'source-audit.mjs', 'finalize.mjs'].map(suffix => {
  const path = join(here, `${prefix}-${suffix}`)
  const b = readFileSync(path)
  return { path, bytes: b.length, sha256: sha(b) }
})
const out = { sealedEntries: Object.keys(index).length, sealedEntriesUnchanged: true,
  sealSha256: sha(readFileSync(join(own, 'sealed-evidence.json'))), artifacts,
  verdict: close.verdict, protectedUnchanged: true, sourceUnchanged: close.sourceUnchanged,
  release: true, stop: true, node: process.version, pid: process.pid, argv: process.argv,
  scope: '仅本修复SOURCE/AUTO，不签GUI/整域/父goalcommit',
  exitOnSuccess: 0 }
writeFileSync(join(here, `${prefix}-finalcheck.json`), `${JSON.stringify(out, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ sealedEntries: out.sealedEntries, unchanged: true,
  verdict: out.verdict, release: true, stop: true, exit: 0 }))
