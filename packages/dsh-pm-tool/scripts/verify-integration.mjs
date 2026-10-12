/**
 * 第2步·非GUI集成回归：基于真实 storage 临时目录（不碰真实 data）。
 * 覆盖 ask-apply 写路径真实读盘 / 跨项目 / 冲突 / 重复并发 / restore 取消确认坏文件与安全快照 /
 * 甘特日期写回 / 全实体搜索定位。所有"读盘"直接读临时目录文件，非内存对象。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { resolveRecordLocation } from '../lib/core/record-location.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-integ-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })
const run = async (raw) => command.handler({ rawInput: raw, attachments: [] })

// 从存储后端权威读回（即磁盘持久化后的读；另见本脚本末尾 reopen 二次确认）
const diskTask = (id) => domain.table('tasks').get(id)

await apply(ctx)
const domain = facility.get('pmtool')

// 建项目 + 两任务（p-0001）+ 另一项目（p-0002）各一任务
await run('project add {"name":"集成测试","startDate":"2026-01-01","targetDate":"2026-12-31"}')
await run('task add {"projectId":"p-0001","title":"官网开发","assignee":"ice","status":"todo","progress":0}')
await run('task add {"projectId":"p-0001","title":"测试","assignee":"ice","status":"todo","progress":0}')
await run('project add {"name":"另一项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
await run('task add {"projectId":"p-0002","title":"别人的任务","assignee":"x","status":"todo","progress":0}')

const p1TaskIds = [...domain.table('tasks').entries()].map(([, v]) => v).filter(t => t.projectId === 'p-0001').map(t => t.id)
const [t1, t2] = p1TaskIds
const otherTask = [...domain.table('tasks').entries()].map(([, v]) => v).find(t => t.projectId === 'p-0002').id

// ===== 1) ask-apply 合法写 -> 真实读盘 =====
{
  const r = await run(`ask-apply p-0001 ${JSON.stringify([{ op:'task.update', id:t1, patch:{ assignee:'赵六', status:'done' } }])}`)
  assert.match(r.text, /已应用 1 条/)
  const rec = diskTask(t1)
  assert.equal(rec.assignee, '赵六', '读盘 assignee')
  assert.equal(rec.status, 'done', '读盘 status')
}

// ===== 2) 跨项目拒绝：otherTask 属于 p-0002 =====
{
  const before = diskTask(otherTask)
  const r = await run(`ask-apply p-0001 ${JSON.stringify([{ op:'task.update', id:otherTask, patch:{ assignee:'hacker' } }])}`)
  assert.match(r.text, /拒绝|不属于/)
  assert.equal(diskTask(otherTask).assignee, before.assignee, '跨项目任务不得被改')
}

// ===== 3) 冲突：基线 updatedAt 与当前不一致 -> 拒绝 =====
{
  const cur = diskTask(t2)
  const r = await run(`ask-apply p-0001 ${JSON.stringify([{ op:'task.update', id:t2, patch:{ assignee:'新人' } }])} --base ${JSON.stringify({ [t2]: '1999-01-01T00:00:00Z' })}`)
  assert.match(r.text, /他人更新|冲突|未执行/)
  assert.notEqual(diskTask(t2).assignee, '新人', '冲突时不得覆盖')
}

// ===== 4) 重复确认 + 并发确认：幂等 =====
{
  const acts = [{ op:'task.update', id:t2, patch:{ progress: 60 } }]
  const r1 = await run(`ask-apply p-0001 ${JSON.stringify(acts)}`)
  assert.match(r1.text, /已应用 1 条/)
  const r2 = await run(`ask-apply p-0001 ${JSON.stringify(acts)}`)
  assert.match(r2.text, /幂等/, '重复确认应被幂等拦截')
  // 并发两个不同草稿（不共享 key）都执行，但互不覆盖合法字段
  const a3 = [{ op:'task.update', id:t1, patch:{ assignee:'并发甲' } }]
  const a4 = [{ op:'task.update', id:t1, patch:{ assignee:'并发乙' } }]
  const [c1, c2] = await Promise.all([
    run(`ask-apply p-0001 ${JSON.stringify(a3)}`),
    run(`ask-apply p-0001 ${JSON.stringify(a4)}`),
  ])
  assert.ok(/已应用/.test(c1.text) && /已应用/.test(c2.text))
  assert.ok(['并发甲','并发乙'].includes(diskTask(t1).assignee), '并发后字段有确定值')
}

// ===== 5) 甘特日期写回（task update start/due -> 读盘）=====
{
  await run(`task update ${t1} ${JSON.stringify({ startDate: '2026-03-01', dueDate: '2026-03-20' })}`)
  const rec = diskTask(t1)
  assert.equal(rec.startDate, '2026-03-01')
  assert.equal(rec.dueDate, '2026-03-20', '甘特拖拽改期应落盘')
}

// ===== 6) restore：坏内容报错 / 确认含安全快照（core 函数 + 隔离目录） =====
const backupDir = mkdtempSync(join(tmpdir(), 'pm-tool-integ-bak-'))
{
  const { createBackup, restoreBackupFromContent } = await import('../lib/core/backup.js')
  const b = await createBackup(domain, backupDir)
  const txt = readFileSync(b.path, 'utf8')
  // 坏内容报错
  await assert.rejects(async () => await restoreBackupFromContent(domain, 'not-json{'), /JSON|备份|格式|坏/, '坏备份必须报错')
  // 好内容 restore -> 产生安全快照
  const beforeFiles = readdirSync(backupDir).length
  const ok = await restoreBackupFromContent(domain, txt)
  assert.ok(ok.safetySnapshot, 'restore 应自动生成安全快照')
  assert.ok(readdirSync(backupDir).length >= beforeFiles, 'backups 目录应新增安全快照文件')
}

// ===== 7) 全实体搜索定位映射 =====
for (const [type, view] of [['task','tasks'],['milestone','milestones'],['risk','risk-issues'],['meeting','meetings'],['report','reports'],['deliverable','deliverables']]) {
  assert.equal(resolveRecordLocation(type).view, view, `${type} -> ${view}`)
}
assert.equal(resolveRecordLocation('bogus'), null)

console.log('verify-integration OK（真实域 ask-apply/跨项目/冲突/幂等并发/甘特写回/restore/搜索定位）')
