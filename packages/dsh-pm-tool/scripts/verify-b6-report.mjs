/**
 * B6 进度汇报 preview / 冻结摘录专项（隔离 DSH_HOME，零正式数据）。
 * 覆盖：周期候选只读 preview 不落盘；复合 selectedRefs（taskId+entryId+revisionId）避免 pl-N 跨任务撞号；
 * generate 精确冻结所选修订版，预览后源被 edit 则冲突要求重预览、不静默抓新；excerpt 正文/作者/日期须与
 * 真实修订版一致（防伪造）；日志再 append 不改旧摘录；update 不传 excerpts 保留、传则替换；未知引用零写。
 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import {
  previewProgressReport,
  generateProgressReport,
  updateProgressReport,
  getProgressReport,
} from '../lib/core/progress-reports.js'

delete process.env.DEEPSEEK_API_KEY
const ROOT_BASE = mkdtempSync(join(tmpdir(), 'pm-tool-b6-'))
const root = join(ROOT_BASE, 'data root')

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw) {
  return command.handler({ rawInput: raw, attachments: [] })
}

const iso = () => new Date().toISOString()

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  await run('project add {"name":"B6项目","startDate":"2026-10-01","targetDate":"2026-10-31"}')
  await run('task add {"projectId":"p-0001","title":"任务一"}')
  await run('task add {"projectId":"p-0001","title":"任务二"}')
  await run('progress add t-0001 {"author":"Ice","content":"首版进展A","date":"2026-10-05"}')
  await run('progress add t-0001 {"author":"Jo","content":"首版进展B","date":"2026-10-20"}')
  // t-0002 同样有局部序号 pl-1：证明裸 entryId 会跨任务撞号，复合 taskId 才能区分。
  await run('progress add t-0002 {"author":"Ray","content":"任务二首版","date":"2026-10-10"}')
  // 第二个项目：用于 D1 跨项目摘录必须被拒。
  await run('project add {"name":"B6另一项目","startDate":"2026-10-01","targetDate":"2026-10-31"}')
  await run('task add {"projectId":"p-0002","title":"另一项目任务"}')
  await run('progress add t-0003 {"author":"Sam","content":"另一项目私有进展","date":"2026-10-12"}')

  // 1) preview 只读：reports 表仍为空，候选来自周期内未删条目（两条任务共 3 条）。
  assert.equal(domain.table('reports').size, 0, 'preview 前无汇报')
  const preview = previewProgressReport(domain, {
    projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
  })
  assert.equal(preview.candidates.length, 3, '周期内三条候选（两任务各有 pl-1）')
  assert.equal(domain.table('reports').size, 0, 'preview 不落盘')

  // 1b) 复合 selectedRefs 只命中 t-0001/pl-1，不串到 t-0002 的 pl-1。
  const filtered = previewProgressReport(domain, {
    projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
    selectedRefs: [{ taskId: 't-0001', entryId: 'pl-1' }],
  })
  assert.equal(filtered.candidates.length, 1, '复合选择器只回 t-0001/pl-1')
  assert.equal(filtered.candidates[0].taskId, 't-0001')
  assert.equal(filtered.candidates[0].entryId, 'pl-1')

  // CLI preview 表面成功且不落盘
  const cliPreview = await run('report preview p-0001 2026-10-01 2026-10-31')
  assert.equal(cliPreview.kind, 'success', cliPreview.text)
  assert.equal(domain.table('reports').size, 0, 'CLI preview 不落盘')

  // 2) generate 按 selectedRefs 精确冻结 t-0001/pl-1/rv-1 快照。
  const report = await generateProgressReport(domain, {
    projectId: 'p-0001',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    selectedRefs: [{ taskId: 't-0001', entryId: 'pl-1', revisionId: 'rv-1' }],
  })
  assert.ok(report.excerpts, '应生成冻结摘录')
  assert.equal(report.excerpts.length, 1)
  const frozen = report.excerpts[0]
  assert.equal(frozen.taskId, 't-0001')
  assert.equal(frozen.entryId, 'pl-1')
  assert.equal(frozen.revisionId, 'rv-1')
  assert.equal(frozen.contentSnapshot, '首版进展A')
  assert.equal(frozen.sourceKind, 'progress')

  // 3) 源被 edit 成 rv-2：再带旧 revisionId rv-1 生成必须冲突拒绝（源已更新，请重预览），不静默抓最新。
  await run('progress edit t-0001 pl-1 {"author":"Ice","content":"修订后进展A-改"}')
  const beforeCount = domain.table('reports').size
  await assert.rejects(() => generateProgressReport(domain, {
    projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
    selectedRefs: [{ taskId: 't-0001', entryId: 'pl-1', revisionId: 'rv-1' }],
  }), /源已更新|重新预览/)
  assert.equal(domain.table('reports').size, beforeCount, '冲突零写')

  // 3b) 不带 revisionId 抓当前最新 rv-2 是另一合法路径（用户重新预览后选最新）。
  const refreshed = await generateProgressReport(domain, {
    projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
    selectedRefs: [{ taskId: 't-0001', entryId: 'pl-1' }],
  })
  assert.equal(refreshed.excerpts[0].revisionId, 'rv-2')
  assert.equal(refreshed.excerpts[0].contentSnapshot, '修订后进展A-改')

  // 3c) 合法多选：两个不同任务各自的局部 pl-1 同时选中，必须都冻结（不得因撞号 blocked）。
  const multi = await generateProgressReport(domain, {
    projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
    selectedRefs: [
      { taskId: 't-0001', entryId: 'pl-1' },
      { taskId: 't-0002', entryId: 'pl-1' },
    ],
  })
  assert.equal(multi.excerpts.length, 2, '两任务各选 pl-1 应同时冻结 2 条')
  const byTask = Object.fromEntries(multi.excerpts.map(e => [e.taskId, e]))
  assert.equal(byTask['t-0001'].entryId, 'pl-1')
  assert.equal(byTask['t-0002'].entryId, 'pl-1')
  assert.equal(byTask['t-0002'].contentSnapshot, '任务二首版', 't-0002 的 pl-1 不得被 t-0001 覆盖')

  // 4) 未知任务/条目/修订版拒绝且零写（reports 数量相对多选后不变）。
  const afterMultiCount = domain.table('reports').size
  await assert.rejects(() => generateProgressReport(domain, {
    projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
    selectedRefs: [{ taskId: 't-9999', entryId: 'pl-1' }],
  }), /不存在|不属于/)
  await assert.rejects(() => generateProgressReport(domain, {
    projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
    selectedRefs: [{ taskId: 't-0001', entryId: 'pl-99' }],
  }), /不存在|已删除/)
  assert.equal(domain.table('reports').size, afterMultiCount, '未知引用零写')

  // 4b) excerpts 与 selectedRefs 同传 → strict 互斥拒绝零写（后端不静默优先任一）。
  let mutexErr = null
  try {
    await generateProgressReport(domain, {
      projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
      excerpts: [{
        id: 'ex-1', taskId: 't-0001', sourceKind: 'progress', entryId: 'pl-2', revisionId: 'rv-1',
        contentSnapshot: '首版进展B', author: 'Jo', date: '2026-10-20', capturedAt: iso(),
      }],
      selectedRefs: [{ taskId: 't-0001', entryId: 'pl-1' }],
    })
  } catch (e) { mutexErr = e }
  assert.ok(mutexErr, 'excerpts+selectedRefs 同传必须被互斥拒绝')
  assert.match(String(mutexErr.message), /二选一|同时/, '错误须明确二选一/互斥')
  assert.equal(domain.table('reports').size, afterMultiCount, '互斥拒绝零写')

  // D1：excerpts 直路径引用【另一项目】p-0002 的真实条目 → 跨项目拒绝零写。
  await assert.rejects(() => generateProgressReport(domain, {
    projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
    excerpts: [{
      id: 'ex-1', taskId: 't-0003', sourceKind: 'progress', entryId: 'pl-1', revisionId: 'rv-1',
      contentSnapshot: '另一项目私有进展', author: 'Sam', date: '2026-10-12', capturedAt: iso(),
    }],
  }), /不属于本报告项目|不存在/)
  assert.equal(domain.table('reports').size, afterMultiCount, 'D1 跨项目零写')

  // D2：excerpts 直路径引用【已软删】条目 → 拒绝零写。
  await run('progress delete t-0002 pl-1')
  await assert.rejects(() => generateProgressReport(domain, {
    projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31',
    excerpts: [{
      id: 'ex-1', taskId: 't-0002', sourceKind: 'progress', entryId: 'pl-1', revisionId: 'rv-1',
      contentSnapshot: '任务二首版', author: 'Ray', date: '2026-10-10', capturedAt: iso(),
    }],
  }), /已软删|不存在/)
  assert.equal(domain.table('reports').size, afterMultiCount, 'D2 软删条目零写')

  // 5) 伪造 excerpt：contentSnapshot/author/date 与真实修订版不符 → 拒绝零写。
  await assert.rejects(() => updateProgressReport(domain, report.id, {
    excerpts: [{
      id: 'ex-1', taskId: 't-0001', sourceKind: 'progress', entryId: 'pl-2', revisionId: 'rv-1',
      contentSnapshot: '伪造正文', author: 'Jo', date: '2026-10-20', capturedAt: iso(),
    }],
  }), /不符|伪造/)

  // 6) update 不传 excerpts 保留现有；传【真实一致】excerpts 显式替换。
  const kept = await updateProgressReport(domain, report.id, { status: 'final' })
  assert.equal(kept.excerpts.length, 1, 'update 不传 excerpts 保留冻结摘录')
  const replaced = await updateProgressReport(domain, report.id, {
    excerpts: [{
      id: 'ex-1', taskId: 't-0001', sourceKind: 'progress', entryId: 'pl-2', revisionId: 'rv-1',
      contentSnapshot: '首版进展B', author: 'Jo', date: '2026-10-20', capturedAt: iso(),
    }],
  })
  assert.equal(replaced.excerpts.length, 1)
  assert.equal(replaced.excerpts[0].entryId, 'pl-2', '显式传真实 excerpts 替换')

  console.log('PASS verify-b6-report')
} catch (error) {
  console.error(error)
  process.exit(1)
}
