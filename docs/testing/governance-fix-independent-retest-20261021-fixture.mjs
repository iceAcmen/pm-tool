import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from './lib/index.js'
import { collectBackup, createBackup, precheckBackupFile, restoreBackup } from './lib/core/backup.js'

const own = process.env.QA_OWN
const hash = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const save = (name, value) => fs.writeFileSync(path.join(own, name), JSON.stringify(value, null, 2) + '\n')
const original = JSON.parse(fs.readFileSync(path.join(own, 'F6-fixture.json'), 'utf8'))
const checked = await precheckBackupFile(original.path)
const ledgerSetting = checked.extra.settings.find(([id]) => id === 'pmProvenanceLedger')[1]
const entries = ledgerSetting.value.entries
const ledger = JSON.parse(fs.readFileSync(path.join(own, 'F6-nonempty-ledger.json'), 'utf8'))
const entry = entries.find(e => e.id === ledger.entries[0].id)
assert.equal(entry.refs.length, 10)
assert.equal(new Set(entry.refs.map(r => `${r.table}:${r.id}`)).size, 10)
const created = JSON.parse(fs.readFileSync(path.join(own, 'F6-created-records.json'), 'utf8')).ids
const expectedCreates = [
  ['milestones', created['AI 新里程碑']],
  ['risk_issues', created['AI 新风险']],
  ['deliverables', created['AI 新交付物']],
  ['meetings', created['AI 新会议']],
]
for (const [table, id] of expectedCreates) {
  assert.ok(id)
  assert.ok(entry.refs.some(r => r.table === table && r.id === id))
}
const originalT1 = checked.tasks.find(t => t.id === original.ids['来源任务一'])
assert.equal(originalT1.attachments.length, 1)
assert.equal(originalT1.progressLog.length, 2)
assert.equal(originalT1.progressLog[0].revisions.length, 3)
assert.equal(originalT1.progressLog[1].revisions.length, 2)
assert.ok(originalT1.progressLog[1].deletedAt)

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(path.join(own, 'F6-empty-target')))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
ctx.provide('commands', { register() { return () => {} } })
await apply(ctx)
const domain = facility.get('pmtool')
assert.equal([...domain.table('projects').keys()].length, 0)
await restoreBackup(domain, original.path, path.join(own, 'F6-empty-safety'))
const canonical = b => {
  const value = structuredClone(b)
  delete value.fileBundleId
  value.exportedAt = '2026-01-01T00:00:00.000Z'
  for (const table of Object.keys(value.extra)) value.extra[table].sort(([a], [b]) => a.localeCompare(b))
  return value
}
assert.deepEqual(canonical(collectBackup(domain)), canonical(checked))
const standard = await createBackup(domain, path.join(own, 'F6-ui-standard'))
const uiChecked = await precheckBackupFile(standard.path)
assert.deepEqual(canonical(uiChecked), canonical(checked))
await facility.closeAll()
const sidecar = `${standard.path}.files.${uiChecked.fileBundleId}`
assert.ok(fs.statSync(sidecar).isDirectory())
const ids = { ...original.ids, ...created }
const expected = {
  ledgerId: entry.id, projectId: entry.projectId, referenceCount: 10, creates: expectedCreates,
  refs: entry.refs, preservedMaterials: originalT1,
  note: '标准包保创建时 source；changed/missing 后态另在 worker 原证，不将旧缺 create 包作新 PASS。',
}
save('F6-ui-ids.json', ids)
save('F6-ui-expected.json', expected)
save('F6-ui-standard.json', {
  sourceFixturePath: original.path, sourceFixtureSha256: hash(original.path),
  path: standard.path, sha256: hash(standard.path), sidecarPath: sidecar,
  fileBundleId: uiChecked.fileBundleId, counts: standard.counts,
  precheckMethod: 'production precheckBackupFile actual path',
  emptyTargetRestore: '完整 backup 领域字段相等，仅归一化 exportedAt/传输 fileBundleId',
  idsPath: path.join(own, 'F6-ui-ids.json'), expectedPath: path.join(own, 'F6-ui-expected.json'),
  referenceCount: 10, expectedCreates, fileAssets: 0,
  runtimeUndoNotPortable: true, sessionsNotInStandardBackup: true,
})
console.log(JSON.stringify({ standard, referenceCount: 10, expectedCreates, preservedMaterials: true,
  precheckFile: true, emptyTargetRestore: true }, null, 2))
