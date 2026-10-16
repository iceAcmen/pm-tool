/**
 * 完成日期（completedDate）确定性验证：
 *  - 标记 done 自动记录完成日期（= 当天）；显式 completedDate 被采纳；done→其它状态清除；
 *  - 已 done 任务改其他字段不覆盖原 completedDate；
 *  - buildCompletionHistory 只统计带 completedDate 的任务，零数据/窗口外数据返回 empty 空态，
 *    周分桶与累计值用固定 opts.today 构造可复现用例；
 *  - backfill-completed：有 dueDate 的旧 done 任务据截止日期推断补录并标注，无 dueDate 保持空缺。
 *
 * 使用独立系统临时目录，不污染真实业务数据。
 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { addTask, updateTask, getTask, backfillCompletedDates } from '../lib/core/tasks.js'
import { buildCompletionHistory } from '../lib/core/completion-history.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-completed-date-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) {
    command = definition
    return () => {}
  },
})

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}

const localTodayIso = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const create = value => `task add ${JSON.stringify(value)}`

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  await addProject(domain, { name: '完成日期项目', startDate: '2026-09-01', targetDate: '2026-12-31' })

  // ── 基础建任务 ─────────────────────────────────────────────────────────
  await run(create({ projectId: 'p-0001', title: '做需求', dueDate: '2026-09-10' })) // t-0001
  await run(create({ projectId: 'p-0001', title: '做设计', dueDate: '2026-09-12' })) // t-0002
  await run(create({ projectId: 'p-0001', title: '做开发' }))                       // t-0003（无截止）
  assert.equal(getTask(domain, 't-0001').completedDate, undefined)

  // ── 1. 标记 done 自动写 completedDate = 今天 ─────────────────────────────
  await run('task update t-0001 {"status":"done"}')
  let t1 = getTask(domain, 't-0001')
  assert.equal(t1.status, 'done')
  assert.equal(t1.completedDate, localTodayIso(), '标记 done 应把 completedDate 记为当天')

  // ── 2. 显式 completedDate 被采纳；done→其它状态清除 ─────────────────────
  await run('task update t-0002 {"status":"done","completedDate":"2026-09-13"}')
  assert.equal(getTask(domain, 't-0002').completedDate, '2026-09-13', '显式 completedDate 应被采纳')
  await run('task update t-0002 {"status":"in_progress"}')
  assert.equal(getTask(domain, 't-0002').completedDate, undefined, 'done→进行中应清除 completedDate')

  // ── 3. 已 done 任务改其他字段不覆盖原 completedDate ─────────────────────
  t1 = getTask(domain, 't-0001')
  const t1Completed = t1.completedDate
  await run('task update t-0001 {"title":"做需求（改标题）"}')
  assert.equal(getTask(domain, 't-0001').completedDate, t1Completed, '改标题不应覆盖 completedDate')

  // 显式清除（null）也应生效；再经一次真实的 非 done→done 流转重新记为今天
  await run('task update t-0001 {"completedDate":null}')
  assert.equal(getTask(domain, 't-0001').completedDate, undefined)
  await run('task update t-0001 {"status":"in_progress"}')
  await run('task update t-0001 {"status":"done"}')
  assert.equal(getTask(domain, 't-0001').completedDate, localTodayIso())

  // ── 4. buildCompletionHistory 纯函数 ───────────────────────────────────
  // 固定 today=2026-09-14（周一）。8 周窗口最旧周一起：
  //   07-27, 08-03, 08-10, 08-17, 08-24, 08-31, 09-07, 09-14
  const history = buildCompletionHistory([
    { completedDate: '2026-08-01', status: 'done' },   // 落在 07-27 周
    { completedDate: '2026-09-07', status: 'done' },   // 落在 09-07 周
    { completedDate: '2026-09-09', status: 'done' },   // 同 09-07 周
    { status: 'done' },                                  // done 但无 completedDate → 排除
    { status: 'done', completedDate: null },           // null → 排除
    { status: 'todo', completedDate: '2026-09-08' },    // 非 done 也带日期 → 仍按真实日期计入
  ], { weeks: 8, today: '2026-09-14' })
  assert.equal(history.empty, false)
  assert.equal(history.weeks.length, 8)
  assert.equal(history.weeks[0].weekStart, '2026-07-27')
  assert.equal(history.weeks[0].completed, 1)  // 仅 08-01
  assert.equal(history.weeks[0].cumulative, 1) // <= 08-02 仅 1 条
  // 09-07 周桶（09-07..09-13）：含 09-07/09-08/09-09 三条真实完成日期
  assert.equal(history.weeks[6].weekStart, '2026-09-07')
  assert.equal(history.weeks[6].completed, 3)
  assert.equal(history.weeks[6].cumulative, 4) // <= 09-13：08-01 + 09-07/08/09 共 4 条
  assert.equal(history.weeks[7].completed, 0)
  assert.equal(history.weeks[7].cumulative, 4)

  // 零数据 → empty
  const emptyAll = buildCompletionHistory([{ status: 'todo' }, { status: 'done' }], { today: '2026-09-14' })
  assert.equal(emptyAll.empty, true)
  assert.equal(emptyAll.reason, '尚无真实完成日期数据')
  assert.equal(emptyAll.weeks.length, 8)

  // 有数据但全部落在窗口外 → empty（不伪造到窗口内）
  const emptyOut = buildCompletionHistory([{ completedDate: '2020-01-15' }], { today: '2026-09-14' })
  assert.equal(emptyOut.empty, true)
  assert.equal(emptyOut.reason, '统计窗口内尚无完成记录')

  // ── 5. backfill-completed：旧 done 任务回填 ──────────────────────────────
  // 构造“遗留” done 任务（直接写表绕过自动流转，模拟 v1/v2 历史数据无 completedDate）
  const legacyWithDue = structuredClone(getTask(domain, 't-0002'))
  legacyWithDue.status = 'done'
  delete legacyWithDue.completedDate
  await domain.table('tasks').put(legacyWithDue.id, legacyWithDue)

  const legacyNoDue = structuredClone(getTask(domain, 't-0003'))
  legacyNoDue.status = 'done'
  await domain.table('tasks').put(legacyNoDue.id, legacyNoDue)
  assert.equal(getTask(domain, 't-0002').completedDate, undefined)
  assert.equal(getTask(domain, 't-0003').completedDate, undefined)

  const out = await run('task backfill-completed p-0001')
  assert.match(out, /据截止日期推断补录：1 条/)
  assert.match(out, /t-0002｜做设计：completedDate=2026-09-12（据截止日期推断）/)
  assert.match(out, /保持空缺不伪造：1 条/)
  assert.equal(getTask(domain, 't-0002').completedDate, '2026-09-12', '有 dueDate 应据截止日期推断补录')
  assert.equal(getTask(domain, 't-0003').completedDate, undefined, '无 dueDate 必须保持空缺，不伪造')

  // 二次执行幂等：已补录的不再重复处理
  const out2 = await run('task backfill-completed p-0001')
  assert.match(out2, /据截止日期推断补录：0 条/)

  console.log('通过：自动完成日期、显式指定/清除、状态流转、历史分桶空态、截止日期回填不伪造。')
  await facility.closeAll()
  console.log(`全部完成日期校验通过。临时数据：${root}`)
} finally {
  await facility.closeAll()
}
