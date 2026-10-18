/**
 * P1 分片C 集成验证：X6-L2 完整复盘草稿流（milestone achieved / deliverable accepted 钩子）
 * + task.deliverableId 存在性/同项目校验负例 + K19 load-stance 三函数真实输出。
 * 机制与 verify-p0-integration.mjs 同构：真实 Context + JsonStorageBackend 临时根 + 真实命令 handler。
 * 不触碰 3172 / 正式 data/；不调模型。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import {
  addTask,
  updateTask,
  TaskDeliverableNotFoundError,
  TaskDeliverableProjectMismatchError,
} from '../lib/core/tasks.js'
import { addMilestone, updateMilestone } from '../lib/core/milestones.js'
import { addDeliverable, updateDeliverable } from '../lib/core/deliverables.js'
import { loadFacts, stanceSuggestions, staleStanceTags } from '../lib/core/load-stance.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-p1c-integration-'))
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const results = []
const check = (k, ok, detail = '') => { results.push({ k, ok: !!ok, detail: String(detail) }); console.log(`[${ok ? 'OK' : 'XX'}] ${k} :: ${detail}`) }

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  const proj = await addProject(domain, { name: 'P1C 验证项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
  const pid = proj.id
  const other = await addProject(domain, { name: '他项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
  const qid = other.id

  // ===== 0) deliverableId 校验负例（存在性 / 同项目，中文错误文案）=====
  const dlvP = await addDeliverable(domain, { projectId: pid, name: '验收报告' })
  const dlvQ = await addDeliverable(domain, { projectId: qid, name: '他项目交付物' })

  let threwNotFound = false
  try {
    await addTask(domain, { projectId: pid, title: '悬空交付物任务', deliverableId: 'dlv-9999' })
  } catch (e) {
    threwNotFound = e instanceof TaskDeliverableNotFoundError && /未找到交付物：dlv-9999/.test(e.message)
  }
  check('dlvId.notFound', threwNotFound, '不存在的 deliverableId 被拒（TaskDeliverableNotFoundError 中文文案）')

  let threwMismatch = false
  try {
    await addTask(domain, { projectId: pid, title: '跨项目交付物任务', deliverableId: dlvQ.id })
  } catch (e) {
    threwMismatch = e instanceof TaskDeliverableProjectMismatchError && /交付物不属于指定项目/.test(e.message)
  }
  check('dlvId.projectMismatch', threwMismatch, '跨项目 deliverableId 被拒（TaskDeliverableProjectMismatchError 中文文案）')

  // updateTask 路径同样校验
  const seed = await addTask(domain, { projectId: pid, title: '普通任务' })
  let threwOnUpdate = false
  try {
    await updateTask(domain, seed.id, { deliverableId: 'dlv-9999' })
  } catch (e) {
    threwOnUpdate = e instanceof TaskDeliverableNotFoundError
  }
  check('dlvId.updateRejected', threwOnUpdate, 'updateTask 挂不存在 deliverableId 被拒')

  // 命令层中文透传（不只抛领域错，命令文案可读）
  const cmdReject = await run(`task add ${JSON.stringify({ projectId: pid, title: '命令层负例', deliverableId: 'dlv-9999' })}`, 'error')
  check('dlvId.commandChinese', /未找到交付物/.test(cmdReject), cmdReject.split('\n')[0])

  // 合法：同项目 deliverableId 可挂
  const linked = await addTask(domain, {
    projectId: pid, title: '验收材料整理', status: 'done', progress: 100,
    deliverableId: dlvP.id, evidenceUrl: 'https://example.com/report.pdf',
  })
  check('dlvId.validSameProject', linked.deliverableId === dlvP.id, `合法同项目挂接 ${linked.deliverableId}`)

  // ===== 1) X6-L2：milestone achieved 钩子真实落盘（含关联任务清单行）=====
  const ms = await addMilestone(domain, {
    projectId: pid, title: '首版上线', targetDate: '2026-12-31', description: '核心链路可用',
  })
  await addTask(domain, {
    projectId: pid, title: '联调通过', status: 'done', progress: 100,
    milestoneId: ms.id, evidenceUrl: 'https://example.com/ci.png',
  })
  await addTask(domain, {
    projectId: pid, title: '遗留优化', status: 'in_progress', progress: 30,
    milestoneId: ms.id,
  })
  await updateMilestone(domain, ms.id, { status: 'achieved', achievedDate: '2026-10-18' })
  await sleep(80) // best-effort 钩子写盘

  const msRefl = [...domain.table('reflections').entries()]
    .map(([, r]) => r)
    .filter(r => r.milestoneId === ms.id)
  check('ms.draftCreated', msRefl.length === 1 && msRefl[0].sourceEvent === 'milestone-achieved',
    `rows=${msRefl.length} sourceEvent=${msRefl[0]?.sourceEvent}`)
  const msDraft = msRefl[0]?.draft
  check('ms.title', msDraft?.title === '首版上线 · 里程碑达成复盘（草稿）', msDraft?.title)
  check('ms.linkedLines', msDraft?.lines.some(l => l.text.includes('联调通过')) && msDraft?.lines.some(l => l.text.includes('遗留优化')),
    '关联任务清单行已反查入草稿')
  check('ms.gapsBlank', msDraft?.gaps.some(g => g.includes('遗留优化') && g.includes('待补')), '未闭环任务进 gaps 留白不编造')
  check('ms.noTaskId', msRefl[0]?.taskId === undefined, '里程碑草稿不写 taskId')

  // 幂等：再次 achieved 不重复建
  await updateMilestone(domain, ms.id, { status: 'achieved', achievedDate: '2026-10-18' })
  await sleep(80)
  const msReflAfter = [...domain.table('reflections').entries()]
    .map(([, r]) => r)
    .filter(r => r.milestoneId === ms.id)
  check('ms.idempotent', msReflAfter.length === 1, `重复 achieved 后仍 ${msReflAfter.length} 条`)

  // ===== 2) X6-L2：deliverable accepted 钩子真实落盘 =====
  await updateDeliverable(domain, dlvP.id, { status: 'accepted', version: 'v1.0', changeNote: '客户验收', operator: 'Ice' })
  await sleep(80)
  const dlvRefl = [...domain.table('reflections').entries()]
    .map(([, r]) => r)
    .filter(r => r.deliverableId === dlvP.id)
  check('dlv.draftCreated', dlvRefl.length === 1 && dlvRefl[0].sourceEvent === 'deliverable-accepted',
    `rows=${dlvRefl.length} sourceEvent=${dlvRefl[0]?.sourceEvent}`)
  const dlvDraft = dlvRefl[0]?.draft
  check('dlv.title', dlvDraft?.title === '验收报告 · 交付验收复盘（草稿）', dlvDraft?.title)
  check('dlv.linkedLine', dlvDraft?.lines.some(l => l.text.includes('验收材料整理')), '关联任务行（deliverableId 反查）')
  check('dlv.knownStatus', dlvDraft?.lines.some(l => l.text.includes('验收状态：accepted')), '验收状态 known 行')

  await updateDeliverable(domain, dlvP.id, { status: 'accepted' })
  await sleep(80)
  const dlvReflAfter = [...domain.table('reflections').entries()]
    .map(([, r]) => r)
    .filter(r => r.deliverableId === dlvP.id)
  check('dlv.idempotent', dlvReflAfter.length === 1, `重复 accepted 后仍 ${dlvReflAfter.length} 条`)

  // ===== 3) K19 load-stance 三函数真实输出（today 注入，零写）=====
  const today = '2026-10-18'
  const stanceTasks = [
    { id: 's-1', title: '逾期未动', assignee: '李工', status: 'todo', progress: 10, dueDate: '2026-10-08', updatedAt: '2026-10-18T09:00:00.000Z' },
    { id: 's-2', title: '受阻长时', assignee: '李工', status: 'blocked', progress: 20, updatedAt: '2026-10-10T09:00:00.000Z' },
    { id: 's-3', title: '烂尾倾向项', assignee: '王工', status: 'in_progress', progress: 30, startDate: '2026-09-01', updatedAt: '2026-10-01T09:00:00.000Z' },
    { id: 's-4', title: '已完成', assignee: '王工', status: 'done', progress: 100, dueDate: '2026-10-01', updatedAt: '2026-10-18T09:00:00.000Z' },
  ]
  const facts = loadFacts(stanceTasks, { today })
  const suggestions = stanceSuggestions(stanceTasks, { today })
  const stale = staleStanceTags(stanceTasks, { today })
  console.log('K19 loadFacts =', JSON.stringify(facts, null, 2))
  console.log('K19 stanceSuggestions =', JSON.stringify(suggestions, null, 2))
  console.log('K19 staleStanceTags =', JSON.stringify(stale, null, 2))
  check('k19.facts', facts.find(f => f.personId === '李工'.toLowerCase())?.openCount === 2
    && facts.find(f => f.personId === '王工'.toLowerCase())?.doneCount === 1, 'loadFacts 分组计数正确')
  check('k19.cut', suggestions.some(s => s.taskId === 's-1' && s.stance === 'cut' && s.reason.includes('建议供人决策，不自动执行')), '逾期→cut 建议文案')
  check('k19.slow', suggestions.some(s => s.taskId === 's-2' && s.stance === 'slow'), 'blocked>3天→slow 建议文案')
  check('k19.stale', stale.some(t => t.taskId === 's-3' && t.tag === '烂尾倾向' && t.daysSinceStart > 30 && t.daysSinceUpdate > 7), '烂尾倾向标签+天数')
  check('k19.noDoneSuggest', !suggestions.some(s => s.taskId === 's-4') && !stale.some(t => t.taskId === 's-4'), 'done 项不进建议/标签')

  // ===== 4) 落盘核验：真实 JSON 文件 =====
  const reflectionsDir = join(root, 'pmtool', 'reflections')
  const files = readdirSync(reflectionsDir)
  const raw = files.map(f => readFileSync(join(reflectionsDir, f), 'utf8')).join('\n')
  check('disk.reflections', files.length >= 2 && raw.includes('milestone-achieved') && raw.includes('deliverable-accepted'),
    `reflections 目录 ${files.length} 个文件，含两种 sourceEvent`)
} catch (e) {
  check('FATAL', false, e instanceof Error ? e.stack ?? e.message : String(e))
}

const failed = results.filter(r => !r.ok)
console.log(failed.length ? `\nP1C-INTEGRATION FAIL (${failed.length}/${results.length})` : `\nP1C-INTEGRATION PASS (${results.length}/${results.length})`)
process.exit(failed.length ? 1 : 0)
