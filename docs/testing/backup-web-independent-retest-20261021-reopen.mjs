import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec } from './out/core/storage.js'

const target = JSON.parse(fs.readFileSync(process.env.QA_REOPEN_TARGET, 'utf8'))
function manifest(dir) {
  if (!fs.existsSync(dir)) return {}
  return Object.fromEntries(fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .map(e => [e.name, e.isDirectory() ? manifest(path.join(dir, e.name)) : {
      size: fs.statSync(path.join(dir, e.name)).size,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, e.name))).digest('hex'),
    }]))
}
const before = manifest(target.root)
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(target.data))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
const domain = await facility.open(pmDomainSpec)
const expected = JSON.parse(fs.readFileSync(target.expected, 'utf8'))
const actual = JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(pmDomainSpec.tables)
  .map(name => [name, [...domain.table(name).entries()]]))))
for (const [name, rows] of Object.entries(expected.tables)) assert.deepEqual(actual[name], rows, name)
assert.deepEqual(actual.sessions, [])
assert.deepEqual(actual.checks, [])
const bytes = {}
for (const [rel, wanted] of Object.entries(expected.manifest)) {
  const buffer = fs.readFileSync(path.join(target.files, rel))
  bytes[rel] = { size: buffer.length, sha256: crypto.createHash('sha256').update(buffer).digest('hex') }
  assert.deepEqual(bytes[rel], wanted, rel)
}
await facility.closeAll()
const after = manifest(target.root)
assert.deepEqual(after, before)
assert.notEqual(process.pid, target.parentPid)
console.log(JSON.stringify({ pid: process.pid, parentPid: target.parentPid, tables: actual, bytes, before, after, readOnly: true }, null, 2))
