import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from './lib/index.js'
import { collectBackup } from './lib/core/backup.js'
import { quoteBackupPath } from './lib/commands/backup.js'

const own = process.env.QA_OWN
const fixture = JSON.parse(fs.readFileSync(path.join(own, 'F6-ui-standard.json'), 'utf8'))
const source = JSON.parse(fs.readFileSync(fixture.path, 'utf8'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(path.join(own, 'F6-command-empty')))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(def) { command = def; return () => {} } })
await apply(ctx)
const domain = facility.get('pmtool')
const observations = []
const state = () => collectBackup(domain, '2026-01-01T00:00:00.000Z')
async function run(rawInput) {
  const before = state()
  const result = await command.handler({ rawInput, attachments: [] })
  observations.push({ rawInput, result, before, after: state() })
  fs.writeFileSync(path.join(own, 'F6-command-observations.json'), JSON.stringify(observations, null, 2) + '\n')
  return result
}
const initial = state()
const quoted = quoteBackupPath(fixture.path)
const preview = await run('restore ' + quoted)
assert.equal(preview.kind, 'success')
assert.match(preview.text, /尚未恢复/)
assert.deepEqual(state(), initial)
const bad = structuredClone(source)
bad.extra.habits = [['bad-habit', { id: 'bad-habit', title: '非法历史不得为 fixture 放宽' }]]
const badPath = path.join(own, 'F6-invalid-schema.json')
fs.writeFileSync(badPath, JSON.stringify(bad))
const invalid = await run('restore ' + quoteBackupPath(badPath))
assert.equal(invalid.kind, 'error')
assert.deepEqual(state(), initial)
const restored = await run('restore ' + quoted + ' confirm')
assert.equal(restored.kind, 'success')
assert.match(restored.text, /已恢复备份/)
const canonical = b => {
  const value = structuredClone(b)
  delete value.fileBundleId
  value.exportedAt = '2026-01-01T00:00:00.000Z'
  for (const name of Object.keys(value.extra)) value.extra[name].sort(([a], [b]) => a.localeCompare(b))
  return value
}
assert.deepEqual(canonical(state()), canonical(source))
const ledger = state().extra.settings.find(([id]) => id === 'pmProvenanceLedger')[1].value.entries[0]
assert.equal(ledger.refs.length, 10)
for (const [table, id] of fixture.expectedCreates) {
  assert.ok(ledger.undo.postimages.some(p => p.table === table && p.id === id && p.kind === 'create'))
  assert.ok(ledger.refs.some(p => p.table === table && p.id === id))
}
await facility.closeAll()
console.log('PASS F6 command: preview零写/cancel保持、非法schema拒零写、confirm完整恢复、4 dispatch postimages与10refs一致')
