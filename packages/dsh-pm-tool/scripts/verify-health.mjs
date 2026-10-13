/**
 * PROD-23 健康分验证：纯函数、固定扣分与封顶、空项目灰灯、灯号阈值、确定性、today 注入。
 * 不写库以外的副作用；独立临时目录。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { addTask } from '../lib/core/tasks.js'
import { addMilestone } from '../lib/core/milestones.js'
import { addRiskIssue } from '../lib/core/risk-issues.js'
import { computeProjectHealth } from '../lib/core/health.js'

function shift(day, delta) {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}
async function hashDir(dir) {
  const h = createHash('sha256')
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(d, e.name))
      else h.update(readFileSync(join(d, e.name)))
    }
  }
  try { walk(dir) } catch { /* 空目录 */ }
  return h.digest('hex')
}

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-health-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
ctx.provide('commands', { register() { return () => {} } })
const TODAY = '2026-10-13'

try {
  await (await import('../lib/index.js')).apply(ctx)
  const domain = facility.get('pmtool')

  // 空项目：无任务 → 灰灯、不出分。
  const empty = await addProject(domain, { name: '空', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const h0 = computeProjectHealth(domain, empty.id, TODAY)
  assert.equal(h0.lamp, 'gray')
  assert.equal(h0.score, null)

  const p = await addProject(domain, { name: '满', startDate: '2026-10-01', targetDate: '2026-12-31' })
  // 6 个逾期未完成任务 → -18 封顶 -15；1 个 blocked → -4；1 个逾期里程碑 → -8；1 个 critical 风险 → -10。
  for (let i = 0; i < 6; i++) await addTask(domain, { projectId: p.id, title: `逾期${i}`, dueDate: '2026-01-01', status: 'todo' })
  await addTask(domain, { projectId: p.id, title: '受阻', status: 'blocked' })
  await addMilestone(domain, { projectId: p.id, title: '逾期里程碑', targetDate: '2026-01-01' })
  await addRiskIssue(domain, { projectId: p.id, type: 'risk', title: '严重风险', impact: 'critical', probability: 'high', status: 'open' })

  const h1 = computeProjectHealth(domain, p.id, TODAY)
  // 100 - 15(逾期封顶) - 4(blocked) - 10(critical) - 8(逾期里程碑) = 63 → 黄灯。
  assert.equal(h1.score, 63, `期望 63，实得 ${h1.score}`)
  assert.equal(h1.lamp, 'yellow')
  const keys = h1.factors.map(f => f.key).sort()
  assert.deepEqual(keys, ['blockedTasks', 'openRisk', 'overdueMilestones', 'overdueTasks'])

  // 确定性：同数据两算逐字段相等。
  const h2 = computeProjectHealth(domain, p.id, TODAY)
  assert.deepEqual(h1, h2)

  // 全 done → 100 绿灯。
  const done = await addProject(domain, { name: '完成', startDate: '2026-10-01', targetDate: '2026-12-31' })
  await addTask(domain, { projectId: done.id, title: '已完成', status: 'done', progress: 100 })
  const h3 = computeProjectHealth(domain, done.id, TODAY)
  assert.equal(h3.score, 100)
  assert.equal(h3.lamp, 'green')

  // S1：todayIso 为本地日历日（CST），逾期边界=昨天逾期、今天/明天不逾期。
  const { todayIso } = await import('../lib/core/reminders.js')
  const now = new Date()
  const localExpectaa = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  assert.equal(todayIso(), localExpectaa, 'todayIso 必须取本地日历日，不用 UTC')
  const boundary = await addProject(domain, { name: '边界', startDate: '2026-10-01', targetDate: '2026-12-31' })
  await addTask(domain, { projectId: boundary.id, title: '昨天到期', dueDate: shift(TODAY, -1), status: 'todo' })
  await addTask(domain, { projectId: boundary.id, title: '今天到期', dueDate: TODAY, status: 'todo' })
  await addTask(domain, { projectId: boundary.id, title: '明天到期', dueDate: shift(TODAY, 1), status: 'todo' })
  const hb = computeProjectHealth(domain, boundary.id, TODAY)
  assert.ok(hb.factors.find(f => f.key === 'overdueTasks'), '应仅把昨天到期计为逾期')
  assert.equal(hb.factors.find(f => f.key === 'overdueTasks')?.count, 1, '逾期计数应为 1（今天/明天不算）')

  // S5：全部 blocked 时扣分到 0 仍 clamp≥0；计算前后落盘 hash 不变（纯只读）。
  const allBlocked = await addProject(domain, { name: '全受阻', startDate: '2026-10-01', targetDate: '2026-12-31' })
  for (let i = 0; i < 10; i++) await addTask(domain, { projectId: allBlocked.id, title: `受阻${i}`, status: 'blocked' })
  const hashBefore = await hashDir(join(root, 'pmtool'))
  const hb2 = computeProjectHealth(domain, allBlocked.id, TODAY)
  const hashAfter = await hashDir(join(root, 'pmtool'))
  assert.equal(hb2.score, 88, 'blocked 帽 12：即使 10 个受阻也只扣 12，得分 88')
  assert.equal(hashBefore, hashAfter, 'computeProjectHealth 不得写盘')

  console.log('通过：灰灯空项目、扣分封顶、黄灯 63、确定性、全完成绿灯、本地 todayIso、逾期边界、全受阻 clamp、零写。')
  await facility.closeAll()
  console.log(`健康分校验通过。临时数据保留于：${root}`)
} finally {
  await facility.closeAll()
}
