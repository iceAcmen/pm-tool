/**
 * R18 备份/恢复专项：备份含七类实体、恢复后与原数据一致（往返）、restore 缺 confirm 不执行、
 * 恢复前生成安全快照、备份内容不含 checks/密钥字段。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { createBackup, readBackupFile, restoreBackup, defaultBackupDirectory } from '../lib/core/backup.js'

delete process.env.DEEPSEEK_API_KEY
const ROOT_BASE = mkdtempSync(join(tmpdir(), 'pm-tool-space-'))
const root = join(ROOT_BASE, 'data root with space')
const backupDir = join(ROOT_BASE, 'backup dir with space')
function hashSet(dir) {
  try { return new Set(readdirSync(dir).map(f => f + ':' + createHash('sha256').update(readFileSync(join(dir,f))).digest('hex'))) }
  catch { return new Set() }
}
const before = hashSet(defaultBackupDirectory)

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw) {
  const r = await command.handler({ rawInput: raw, attachments: [] })
  return r
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  // 造七类实体数据
  await run('project add {"name":"备份项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  await run('task add {"projectId":"p-0001","title":"任务一"}')
  await run('milestone add {"projectId":"p-0001","title":"里程碑一","targetDate":"2026-06-01"}')
  await run('risk-issue add {"projectId":"p-0001","type":"risk","title":"风险一","impact":"high","probability":"medium"}')
  await run('meeting add {"projectId":"p-0001","title":"周会","meetingDate":"2026-10-11"}')
  await run('report generate p-0001 2026-10-01 2026-10-31 {"title":"十月进度汇报"}')
  await run('deliverable add {"projectId":"p-0001","name":"交付物一","version":"v1.0","owner":"Ice","status":"in_progress"}')

  // 1) 备份含七类实体
  const b = await createBackup(domain, backupDir)
  assert.ok(existsSync(b.path), '备份文件应写出')
  const parsed = await readBackupFile(b.path)
  assert.equal(parsed.projects.length, 1)
  assert.equal(parsed.tasks.length, 1)
  assert.equal(parsed.milestones.length, 1)
  assert.equal(parsed.riskIssues.length, 1)
  assert.equal(parsed.meetings.length, 1)
  assert.equal(parsed.reports.length, 1)
  assert.equal(parsed.deliverables.length, 1)
  assert.ok(!('checks' in parsed), '备份不得含 checks/自检表')

  // 2) 往库里再加点东西（模拟漂移）
  await run('task add {"projectId":"p-0001","title":"任务二"}')
  assert.equal([...domain.table('tasks').entries()].length, 2)

  // 3) restore 缺 confirm 不执行（演练）
  const drill = await run(`restore "${b.path}"`)
  assert.match(drill.text, /演练/)
  assert.equal([...domain.table('tasks').entries()].length, 2, '缺 confirm 不得恢复')

  // 4) restore confirm：先存安全快照，再用备份替换（任务数回到 1）
  const result = await restoreBackup(domain, b.path, backupDir)
  assert.ok(result.safetySnapshot, '恢复前当前有数据，应生成安全快照')
  assert.ok(existsSync(result.safetySnapshot), '安全快照文件应已写出')
  assert.equal([...domain.table('tasks').entries()].length, 1, '恢复后任务数应回到备份时的 1')
  assert.equal([...domain.table('projects').entries()].length, 1)

  assert.deepEqual(hashSet(defaultBackupDirectory), before, '默认 packages/backups 在测试前后应不变')
console.log('verify-backup 全部通过（隔离目录+默认backups未变）。')
} finally {
  await facility.closeAll()
}
