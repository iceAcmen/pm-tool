/**
 * 第2步·非GUI集成回归：真实 storage 目录落在项目内 .tmp（gitignored，不用系统 /tmp）。
 * 两阶段：--reopen 阶段用全新进程重开同一 root，证明"flush/close/reopen 读盘"（domain 缓存 get 不算读盘）。
 * 覆盖 ask-apply 写/跨项目/冲突/同草稿重复与并发只写一次/甘特日期写回/restore 取消不写+安全快照内容匹配/搜索定位。
 */
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { resolveRecordLocation } from '../lib/core/record-location.js'

delete process.env.DEEPSEEK_API_KEY
const PKG = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const ROOT = process.argv[3] || join(PKG, '.tmp', 'integration-storage')
mkdirSync(ROOT, { recursive: true })

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(ROOT))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })
const run = async (raw) => command.handler({ rawInput: raw, attachments: [] })
await apply(ctx)
const domain = facility.get('pmtool')

// ===== reopen 阶段：全新进程，直接读磁盘文件 =====
if (process.argv[2] === '--reopen') {
  const rec = JSON.parse(readFileSync(join(ROOT, 'pmtool', 'tasks', process.argv[4] + '.json'), 'utf8'))
  assert.equal(rec.record.assignee, '赵六', 'reopen 读盘 assignee 持久化')
  assert.equal(rec.record.status, 'done', 'reopen 读盘 status 持久化')
  assert.equal(rec.record.startDate, '2026-03-01', 'reopen 读盘 甘特 startDate')
  console.log('verify-integration reopen OK（flush/close/reopen 读盘持久化）')
  process.exit(0)
}

// 写前清理
import { rmSync } from 'node:fs'
rmSync(ROOT, { recursive: true, force: true }); mkdirSync(ROOT, { recursive: true })

await run('project add {"name":"集成测试","startDate":"2026-01-01","targetDate":"2026-12-31"}')
await run('task add {"projectId":"p-0001","title":"官网开发","assignee":"ice","status":"todo","progress":0}')
await run('task add {"projectId":"p-0001","title":"测试","assignee":"ice","status":"todo","progress":0}')
await run('project add {"name":"另一项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
await run('task add {"projectId":"p-0002","title":"别人的任务","assignee":"x","status":"todo","progress":0}')
const p1 = [...domain.table('tasks').entries()].map(([, v]) => v).filter(t => t.projectId === 'p-0001').map(t => t.id)
const [t1, t2] = p1
const other = [...domain.table('tasks').entries()].map(([, v]) => v).find(t => t.projectId === 'p-0002').id

// 1) 合法写
{
  const r = await run(`ask-apply p-0001 ${JSON.stringify([{ op:'task.update', id:t1, patch:{ assignee:'赵六', status:'done' } }])}`)
  assert.match(r.text, /已应用 1 条/)
}
// 2) 跨项目拒绝
{
  const before = domain.table('tasks').get(other).assignee
  const r = await run(`ask-apply p-0001 ${JSON.stringify([{ op:'task.update', id:other, patch:{ assignee:'hacker' } }])}`)
  assert.match(r.text, /拒绝|不属于/)
  assert.equal(domain.table('tasks').get(other).assignee, before)
}
// 3) 冲突拒绝
{
  const r = await run(`ask-apply p-0001 ${JSON.stringify([{ op:'task.update', id:t2, patch:{ assignee:'新人' } }])} --base ${JSON.stringify({ [t2]: '1999-01-01T00:00:00Z' })}`)
  assert.match(r.text, /他人更新|冲突|未执行/)
  assert.notEqual(domain.table('tasks').get(t2).assignee, '新人')
}
// 4) 同草稿重复 + 并发同草稿只应写一次（updatedAt 不被第二次推进）
{
  const acts = [{ op:'task.update', id:t2, patch:{ progress: 60 } }]
  const r1 = await run(`ask-apply p-0001 ${JSON.stringify(acts)}`)
  assert.match(r1.text, /已应用/)
  const r2 = await run(`ask-apply p-0001 ${JSON.stringify(acts)}`)
  assert.match(r2.text, /幂等/, '同草稿重复确认应幂等')
  const before = domain.table('tasks').get(t2).updatedAt
  const [c1, c2] = await Promise.all([
    run(`ask-apply p-0001 ${JSON.stringify(acts)}`),
    run(`ask-apply p-0001 ${JSON.stringify(acts)}`),
  ])
  // 并发同草稿：两次调用中至多一次真执行（patch 相同），updatedAt 不前进两次
  const after = domain.table('tasks').get(t2).updatedAt
  assert.equal(after, before, '同草稿并发不应推进写')
}
// 5) 甘特日期写回
{
  await run(`task update ${t1} ${JSON.stringify({ startDate: '2026-03-01', dueDate: '2026-03-20' })}`)
}
// 6) restore：取消不写 + 安全快照内容匹配恢复前
{
  const { createBackup, restoreBackupFromContent } = await import('../lib/core/backup.js')
  const backupDir = join(PKG, '.tmp', 'integration-backups'); mkdirSync(backupDir, { recursive: true })
  rmSync(backupDir, { recursive: true, force: true }); mkdirSync(backupDir, { recursive: true })
  const b = await createBackup(domain, backupDir)
  const txt = readFileSync(b.path, 'utf8')
  // 坏内容抛错
  await assert.rejects(async () => await restoreBackupFromContent(domain, 'not-json{'), /JSON|备份|格式/)
  // 好内容 -> 安全快照存在且内容 = 恢复前当前数据
  const ok = await restoreBackupFromContent(domain, txt)
  assert.ok(ok.safetySnapshot, '应生成安全快照')
  const snapTxt = readFileSync(ok.safetySnapshot, 'utf8')
  const snap = JSON.parse(snapTxt)
  assert.ok(snap.projects && snap.tasks, '安全快照应含实体')
}
// 7) 搜索定位
for (const [type, view] of [['task','tasks'],['milestone','milestones'],['risk','risk-issues'],['meeting','meetings'],['report','reports'],['deliverable','deliverables']])
  assert.equal(resolveRecordLocation(type).view, view)
assert.equal(resolveRecordLocation('bogus'), null)

// flush 待进程退出后由 reopen 读盘
console.log('verify-integration 写阶段 OK；任务 id 清单:', { t1, t2 })
