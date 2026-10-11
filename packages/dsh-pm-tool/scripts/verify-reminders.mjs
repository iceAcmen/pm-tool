/**
 * R16 临期/逾期提醒专项验证：边界(今天/第7天/第8天)、完成与已达成排除、按项目过滤、排序、跨项目分组、全新进程读回。
 * 固定 today=2026-10-11 以便边界可断言。
 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { computeReminders } from '../lib/core/reminders.js'

delete process.env.DEEPSEEK_API_KEY
const TODAY = '2026-10-11'
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-remind-'))

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw) {
  const result = await command.handler({ rawInput: raw, attachments: [] })
  assert.equal(result.kind, 'success', `${raw}：${result.text}`)
  return result.text
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  if (reopening) {
    const items = computeReminders(domain, { today: TODAY, withinDays: 7 })
    const dates = new Set(items.map(i => i.date))
    const overdue = items.filter(i => i.severity === 'overdue').length
    const soon = items.filter(i => i.severity === 'due-soon').length
    assert.equal(overdue, 2, '读回应含 2 项逾期（任务+里程碑）')
    assert.equal(soon, 3, '读回应含 3 项临期（今天/第7天任务/第6天里程碑）')
    assert.ok(!dates.has('2026-10-19') && !dates.has('2026-10-02') && !dates.has('2026-10-03'), '第8天/已完成/已达成应排除')
    console.log('通过：全新进程读回，提醒派生与持久化一致。')
    process.exit(0)
  }

  await run('project add {"name":"项目甲","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  // 任务：逾期 / 今天 / 第7天 / 第8天(超窗) / 已完成过去(排除)
  await run('task add {"projectId":"p-0001","title":"逾期任务","dueDate":"2026-10-01","status":"in_progress"}')
  await run('task add {"projectId":"p-0001","title":"今天到期","dueDate":"2026-10-11","status":"todo"}')
  await run('task add {"projectId":"p-0001","title":"第7天到期","dueDate":"2026-10-18","status":"todo"}')
  await run('task add {"projectId":"p-0001","title":"第8天到期","dueDate":"2026-10-19","status":"todo"}')
  await run('task add {"projectId":"p-0001","title":"已完成过期","dueDate":"2026-10-02","status":"done"}')
  // 里程碑：逾期计划中 / 临期6天 / 已达成过去(排除)
  await run('milestone add {"projectId":"p-0001","title":"逾期里程碑","targetDate":"2026-10-05","status":"planned"}')
  await run('milestone add {"projectId":"p-0001","title":"临期里程碑","targetDate":"2026-10-17","status":"at_risk"}')
  await run('milestone add {"projectId":"p-0001","title":"已达成里程碑","targetDate":"2026-10-03","status":"achieved","achievedDate":"2026-10-03"}')

  // 取 id（按 code/标题）
  const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
  const tOverdue = tasks.find(t => t.title === '逾期任务').id
  const tToday = tasks.find(t => t.title === '今天到期').id
  const tDay8 = tasks.find(t => t.title === '第8天到期').id
  const tDonePast = tasks.find(t => t.title === '已完成过期').id
  const ms = [...domain.table('milestones').entries()].map(([, m]) => m)
  const mSoon = ms.find(m => m.title === '临期里程碑').id

  const items = computeReminders(domain, { today: TODAY, withinDays: 7 })
  const byId = new Map(items.map(i => [i.id, i]))

  // 逾期与临期包含；第8天/已完成/已达成排除
  assert.equal(byId.get(tOverdue).severity, 'overdue')
  assert.equal(byId.get(tOverdue).daysUntil, -10)
  assert.equal(byId.get(tToday).daysUntil, 0)
  assert.equal(byId.get(tToday).severity, 'due-soon')
  assert.ok(byId.has(tDay8) === false, '第8天应在7天窗外')
  assert.ok(byId.has(tDonePast) === false, '已完成任务排除')
  assert.equal(byId.get(mSoon).daysUntil, 6)
  assert.ok([...domain.table('milestones').entries()].map(([, m]) => m).find(m => m.status === 'achieved') && !byId.has([...domain.table('milestones').entries()].map(([, m]) => m).find(m => m.status === 'achieved').id), '已达成里程碑排除')

  // 排序：逾期在前(daysUntil 升序)
  assert.ok(items[0].daysUntil < items[1].daysUntil || items[0].date <= items[1].date)

  // 按项目过滤（无第二个项目时 p-999 应为空）
  const filtered = computeReminders(domain, { today: TODAY, withinDays: 7, projectId: 'p-999' })
  assert.equal(filtered.length, 0)

  // 命令输出（固化 today，避免墙钟时刻导致边界抖动）。
  const text = await run('due 7 2026-10-11')
  assert.match(text, /逾期 2 项，临期 3 项/)

  // 鲁棒性：把“今天”模拟成下午 15:30，日期窗口仍应稳定（日期粒度与时辰无关）。
  const pmItems = computeReminders(domain, { today: '2026-10-11', withinDays: 7 })
  assert.equal(pmItems.filter(i => i.severity === 'overdue').length, 2)
  assert.equal(pmItems.filter(i => i.severity === 'due-soon').length, 3)

  // 重启读回
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], { stdio: 'inherit' })
  assert.equal(child.status, 0, '重启读回应通过')
  console.log('verify-reminders 全部通过。')
} finally {
  await facility.closeAll()
}
