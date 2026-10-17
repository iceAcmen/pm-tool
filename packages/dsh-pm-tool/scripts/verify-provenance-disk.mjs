/**
 * B-3 第一步：ask 链真实磁盘命令级集成（cordis + JsonStorageBackend(tmpdir) + 新进程重开）。
 *
 * 仅覆盖 ask 链；WBS / 汇报 / 会议三链待第二步扩展（本脚本不冒充 B-3 全链完成）。
 *
 * 断言：
 *  - 真实 ask-apply 处理器落库后，账本 settings 行落盘、条目 confirmed、置信度「未提供」、refs 保留；
 *  - 新 Node 进程重开同一 root，业务记录与账本可一致读回（重启读回）；
 *  - F13：seed pending → sweepPending 并入 confirmed，幂等不重复；
 *  - F14：recordUndoOutcome 审计写回，读回 used=true 且含 undone 事件；
 *  - 同目标并发两次确认不二次写（幂等拦截，updatedAt 不推进）。
 *
 * 隔离：mkdtemp 一次性 root，不触正式 data/backups/exports。运行：node scripts/verify-provenance-disk.mjs
 */
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec } from '../lib/core/storage.js'
import { addProject } from '../lib/core/projects.js'
import { addTask } from '../lib/core/tasks.js'
import { handleAskApplyCommand, handleAskRecheckCommand } from '../lib/commands/ask.js'
import { handleTaskCommand } from '../lib/commands/task.js'
import { handleProgressReportCommand } from '../lib/commands/progress-report.js'
import { handleMeetingCommand } from '../lib/commands/meeting.js'
import { rememberSummary } from '../lib/core/meeting-summarize.js'
import { listProvenance, recordProvenance, recordUndoOutcome, sweepPending, PROVENANCE_PENDING_ROW, PROVENANCE_LEDGER_ROW } from '../lib/core/provenance-store.js'

const here = fileURLToPath(new URL('.', import.meta.url))

async function openDomain(root) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  const backend = new JsonStorageBackend(root)
  ctx.storage.backend.register('json', backend)
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.storage.mount('domain', facility)
  const domain = await facility.open(pmDomainSpec)
  return { domain, close: async () => { await facility.closeAll() } }
}

// 子进程分支：新 Node 进程重开同一 root，打印账本条目数与任务负责人（重启读回证明）。
if (process.env.PD_CHILD === '1') {
  const root = process.env.PD_ROOT
  const { domain, close } = await openDomain(root)
  try {
    const entries = listProvenance(domain, process.env.PD_PROJECT)
    const task = domain.table('tasks').get(process.env.PD_TASK)
    const kinds = entries.map(e => e.kind).join(',')
    process.stdout.write(`PD_RESTART::entries=${entries.length}::assignee=${task?.assignee}::kinds=${kinds}\n`)
  } finally {
    await close()
  }
  process.exit(0)
}

const root = mkdtempSync(join(tmpdir(), 'pm-tool-pd-'))
console.log('[pd] 隔离数据 root = ' + root)
let snapshot = {}
try {
  // 1) 主进程建项目+任务，驱动真实 ask-apply 处理器落库。
  const a = await openDomain(root)
  const proj = await addProject(a.domain, { name: 'PD 集成项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const task = await addTask(a.domain, { projectId: proj.id, title: '任务一', assignee: 'ice', status: 'todo', progress: 0 })
  const baseline = { [task.id]: task.updatedAt }
  const actions = [{ op: 'task.update', id: task.id, patch: { assignee: '赵六', progress: 50 } }]
  const r1 = await handleAskApplyCommand(proj.id + ' ' + JSON.stringify(actions) + ' --base ' + JSON.stringify(baseline), a.domain)
  assert.match(r1.text, /已应用 1 条/, 'ask-apply 首次应成功落库：' + r1.text)
  const after = a.domain.table('tasks').get(task.id)
  assert.equal(after.assignee, '赵六')
  assert.equal(after.progress, 50)

  // 2) 账本落盘读回：confirmed、置信度未提供、refs 保留。
  const entries = listProvenance(a.domain, proj.id)
  assert.ok(entries.length >= 1, '账本应有条目')
  const e0 = entries[0]
  assert.equal(e0.status, 'confirmed')
  assert.equal(e0.confidence, '未提供')
  assert.ok(e0.refs.some(r => r.table === 'tasks' && r.id === task.id), 'refs 保留被改任务')

  // 3) F14：撤销审计写回并读回 used=true + undone 事件（种子一条带 undo 句柄的确认条目）。
  await a.domain.table('settings').put(PROVENANCE_LEDGER_ROW, {
    value: { entries: [{ id: 'e-f14', projectId: proj.id, kind: 'ask-apply', createdAt: '2026-01-01T00:00:00.000Z', status: 'confirmed', schemaVersion: 1, confidence: '未提供', summary: 'F14 样例', refs: [], history: [], audit: [], undo: { handle: 'h-disk', expiresAt: Date.now() + 600000, used: false, postimages: [] } }] },
    updatedAt: '',
  })
  await recordUndoOutcome(a.domain, 'h-disk', { at: new Date().toISOString(), kind: 'undone', object: 'tasks/' + task.id, result: '已恢复原始记录' })
  const afterAudit = listProvenance(a.domain, proj.id)
  const target = afterAudit.find(e => e.undo?.handle === 'h-disk')
  assert.ok(target, 'F14 应按句柄找到条目')
  assert.equal(target.undo.used, true)
  assert.ok(target.audit.some(x => x.kind === 'undone'), '审计含 undone 事件')

  // 4) F13：seed pending → sweepPending 并入 confirmed，幂等不重复。
  await a.domain.table('settings').put(PROVENANCE_PENDING_ROW, {
    value: { entries: [{ id: 'pend-disk', projectId: proj.id, kind: 'ask-apply', createdAt: '2026-01-01T00:00:00.000Z', status: 'pending', schemaVersion: 1, confidence: '未提供', summary: '补偿样例', refs: [], history: [], audit: [] }] },
    updatedAt: '',
  })
  await sweepPending(a.domain)
  const afterSweep = listProvenance(a.domain, proj.id)
  assert.ok(afterSweep.some(e => e.id === 'pend-disk' && e.status === 'confirmed'), 'F13 pending 并入 confirmed')
  await sweepPending(a.domain)
  assert.equal(afterSweep.filter(e => e.id === 'pend-disk').length, 1, 'sweep 幂等不重复')

  // WBS 链（人工导入，F16 中性态）：task import <清单文件> confirm 真实驱动，导入后不得新增 AI 来源条目。
  const ledgerBeforeImport = listProvenance(a.domain, proj.id).length
  const mdPath = join(root, 'wbs-checklist.md')
  writeFileSync(mdPath, '- [ ] 需求梳理\n- [ ] 视觉设计\n- [x] 已完成项\n', 'utf8')
  const wbs = await handleTaskCommand(`import ${proj.id} ${mdPath} confirm`, a.domain)
  assert.equal(wbs.kind, 'success', 'WBS import confirm 应成功：' + wbs.text)
  const afterImport = listProvenance(a.domain, proj.id)
  assert.equal(afterImport.length, ledgerBeforeImport, '人工 WBS 导入为中性态，不新增 AI 来源条目')

  // 汇报链真实驱动：report narrateuse <pid> "<编辑后叙述>" → 落账、置信未提供。
  const rep = await handleProgressReportCommand(`narrateuse ${proj.id} "本周完成需求梳理，风险低，下周进入设计。"`, a.domain)
  assert.equal(rep.kind, 'success', 'report narrateuse 应成功：' + rep.text)

  // 会议链真实驱动：预填内置草稿缓存（离线复用，跳过 llm），summarize confirm 真实处理器建会落账。
  const transcript = '讨论里程碑验收，结论是先冻结需求，行动项：张三要在周五前出方案。'
  rememberSummary(`${proj.id}\n${transcript}`, {
    title: '里程碑验收会', summary: '冻结需求后再验收', topics: ['里程碑验收'], decisions: ['先冻结需求'],
    actions: [{ title: '出验收方案', owner: '张三', dueDate: null }],
  })
  const mtg = await handleMeetingCommand(`summarize ${proj.id} ${transcript} confirm`, a.domain)
  assert.equal(mtg.kind, 'success', 'meeting summarize confirm 应成功：' + mtg.text)
  await new Promise(r => setTimeout(r, 80)) // best-effort 异步写盘 flush

  const allKinds = listProvenance(a.domain, proj.id)
  const reportE = allKinds.find(e => e.kind === 'report-narrate')
  const meetingE = allKinds.find(e => e.kind === 'meeting-summarize')
  assert.ok(reportE, '汇报链应落账')
  assert.equal(reportE.confidence, '未提供', '汇报置信未提供')
  assert.equal(reportE.status, 'confirmed')
  assert.ok(meetingE, '会议链应落账')
  assert.equal(meetingE.confidence, '未提供', '会议置信未提供')
  assert.equal(meetingE.status, 'confirmed')

  // 未知版本/脏行忽略：注入缺 schemaVersion 的畸形行，读回不抛错且正常条目仍在。
  await a.domain.table('settings').put(PROVENANCE_LEDGER_ROW, { value: { entries: [{ id: 'dirty-old', not: 'entry' }, ...allKinds] }, updatedAt: '' })
  const afterDirty = listProvenance(a.domain, proj.id)
  assert.ok(afterDirty.some(e => e.kind === 'meeting-summarize'), '脏行忽略后正常条目仍可读回')
  // 恶意/特殊文本在数据层原样保留（转义是 UI 职责）。
  await recordProvenance(a.domain, { projectId: proj.id, kind: 'report-narrate', summary: `<img onerror=alert(1)> 与 "引号"、'撇号'、& 🎯`, refs: [] })
  const evil = listProvenance(a.domain, proj.id).find(e => e.summary.includes('onerror=alert(1)'))
  assert.ok(evil, '恶意文本数据层原样保留')

  // B-1：可触发重校入口 ask-recheck 真实调用（validateSourceRefs/classifyStale/recheckProvenance）。
  const rc = await handleAskRecheckCommand(proj.id, a.domain)
  assert.equal(rc.kind, 'success', 'ask-recheck 应成功：' + rc.text)
  const rcJson = JSON.parse(rc.text)
  assert.ok(Array.isArray(rcJson.rows), '重校返回每条结论')
  assert.equal(typeof rcJson.summary.total, 'number')
  await new Promise(r => setTimeout(r, 80))
  const afterRecheck = listProvenance(a.domain, proj.id)
  assert.ok(afterRecheck.some(e => e.history.length >= 1), '重校历史已持久化（不洗白）')

  snapshot = { projectId: proj.id, taskId: task.id, beforeUpdatedAt: after.updatedAt }
  await a.close()

  // 5) 新 Node 进程重开 root：重启读回（账本条目数与负责人一致）。
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    cwd: join(here, '..'),
    env: { ...process.env, PD_CHILD: '1', PD_ROOT: root, PD_PROJECT: proj.id, PD_TASK: task.id },
    encoding: 'utf8',
  })
  if (child.status !== 0) {
    console.error(child.stdout, child.stderr)
    assert.fail('子进程重开非零退出：' + child.status)
  }
  const m = /^PD_RESTART::entries=(\d+)::assignee=(.*)::kinds=(.*)$/m.exec(child.stdout)
  assert.ok(m, '子进程应打印 PD_RESTART::…，实际：' + child.stdout)
  assert.equal(Number(m[1]) >= 1, true, '重启后账本可读回')
  assert.equal(m[2], '赵六', '重启后业务记录一致')
  assert.ok(m[3].includes('report-narrate'), '重启后汇报链条目可读回')
  assert.ok(m[3].includes('meeting-summarize'), '重启后会议链条目可读回')

  // 6) 同目标并发两次确认不二次写（幂等拦截，updatedAt 不推进）。
  const b = await openDomain(root)
  const before = b.domain.table('tasks').get(task.id)
  const [r2a, r2b] = await Promise.all([
    handleAskApplyCommand(proj.id + ' ' + JSON.stringify(actions) + ' --base ' + JSON.stringify(baseline), b.domain),
    handleAskApplyCommand(proj.id + ' ' + JSON.stringify(actions) + ' --base ' + JSON.stringify(baseline), b.domain),
  ])
  assert.ok(/已执行|幂等拦截|已应用/.test(r2a.text + r2b.text), '并发重放被幂等处理')
  const afterConcur = b.domain.table('tasks').get(task.id)
  assert.equal(afterConcur.updatedAt, before.updatedAt, '并发重放不得二次推进 updatedAt')
  await b.close()

  console.log('PASS: verify-provenance-disk（四链真实处理器：ask/WBS中性/汇报/会议；落账/重启读回/F13补偿/F14审计/并发幂等/脏行/恶意文本）')
} finally {
  rmSync(root, { recursive: true, force: true })
}
