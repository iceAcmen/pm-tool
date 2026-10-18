/**
 * P2 分片C 真实链路自验（X2 wrapped 波及 + X3 失败经验 + K16 最小保存包）。
 * 机制与 verify-p0-integration.mjs 同构：真实 Context + JsonStorageBackend 临时根 + 真实命令 handler；
 * 纯谓词用 lib/core 直调；不调模型、不 commit/push、不碰正式 data/。
 * 覆盖：
 *  1. task/deliverable 人显式 wrapped 转换真实落库（含交付物 history 溯源留痕 + 「已收尾≠完成」文案）
 *  2. 逾期队列/催办排除 wrapped；check done 类规则不命中 wrapped
 *  3. reflect done 钩子对 wrapped 不触发草稿
 *  4. copilot ask-apply 直写 wrapped 被拒（中文拒因）
 *  5. lesson add/final/edit 真实落盘（草稿纪律 known/pending/blank、留白不编造、仅人定稿）
 *  6. archive 包真实生成（package.json 数据集 + README-字段说明.md + exportedAt/origin；原数据零改动）
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { apply } from '../lib/index.js'
import { computeReminders } from '../lib/core/reminders.js'
import { evaluateChecks } from '../lib/core/check.js'
import { ensureReflectionOnDone } from '../lib/core/reflect.js'
import { validateActions } from '../lib/core/copilot.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-p2c-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) { command = definition; return () => {} },
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
  const project = await addProject(domain, { name: 'P2C 验证项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const pid = project.id

  // ===== 种子：t-0001 待收尾（逾期）；t-0002 正常逾期；t-0003 正常 open；d-0001 交付物 =====
  await run(`task add ${JSON.stringify({ projectId: pid, title: '烂尾需求（将收尾）', status: 'in_progress', progress: 20, dueDate: '2026-10-01' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '正常逾期任务', status: 'in_progress', progress: 40, dueDate: '2026-10-02' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '进行中任务', status: 'in_progress', progress: 50 })}`)
  await run('deliverable add ' + JSON.stringify({ projectId: pid, name: '验收报告', status: 'submitted' }))
  await sleep(60)
  const did = [...domain.table('deliverables').entries()].find(([, d]) => d.projectId === pid)[0]

  // ===== 1) X2 人显式 wrapped 转换真实落库 + 文案 + 交付物 history 溯源 =====
  const wText = await run(`task update t-0001 ${JSON.stringify({ status: 'wrapped' })}`)
  const t1 = domain.table('tasks').get('t-0001')
  check('x2.taskWrappedPersisted', t1.status === 'wrapped', `status=${t1.status}, completedDate=${t1.completedDate}`)
  check('x2.taskWording', /已收尾/.test(wText) && /非正式完成|≠/.test(wText), wText.split('\n')[0])
  // done → wrapped 清掉 completedDate（收尾≠完成）
  check('x2.noCompletedDate', t1.completedDate == null, `completedDate=${t1.completedDate}`)

  const dwText = await run(`deliverable update ${did} ${JSON.stringify({ status: 'wrapped' })}`)
  const d1 = domain.table('deliverables').get(did)
  check('x2.deliverableWrappedPersisted', d1.status === 'wrapped', `status=${d1.status}`)
  check('x2.deliverableHistory', Array.isArray(d1.history) && d1.history.some(h => h.to === 'wrapped'), `history=${JSON.stringify(d1.history)}`)
  check('x2.deliverableWording', /已收尾/.test(dwText) && /非正式验收|≠/.test(dwText), dwText.split('\n')[0])

  // ===== 2) 逾期队列/催办排除 wrapped；check done 类规则不命中 wrapped =====
  const today = '2026-10-18'
  const reminders = computeReminders(domain, { today, projectId: pid })
  const remIds = reminders.map(r => r.id)
  check('x2.remindersExcludeWrapped', !remIds.includes('t-0001') && remIds.includes('t-0002'), `reminders=${JSON.stringify(remIds)}`)

  const wrappedTask = domain.table('tasks').get('t-0001')
  const findings = evaluateChecks([wrappedTask], today)
  check('x2.checkSkipsWrapped', findings.length === 0, `findings=${JSON.stringify(findings)}`)

  // ===== 3) reflect done 钩子对 wrapped 不触发草稿 =====
  const draft = await ensureReflectionOnDone(domain, wrappedTask)
  check('x2.reflectNoDraft', draft === undefined, 'wrapped 未生成复盘草稿')
  const reflRows = [...domain.table('reflections').entries()].filter(([, r]) => r.taskId === 't-0001')
  check('x2.reflectTableEmpty', reflRows.length === 0, `rows=${reflRows.length}`)

  // ===== 4) copilot 直写 wrapped 被拒（中文拒因）=====
  const { accepted, rejected } = validateActions([
    { op: 'task.update', id: 't-0002', patch: { status: 'wrapped' } },
    { op: 'deliverable.update', id: did, patch: { status: 'wrapped' } },
  ], { taskIds: ['t-0001', 't-0002', 't-0003'], milestoneIds: [], riskIds: [], deliverableIds: [did], meetingIds: [] })
  check('x2.copilotRejectWrapped', accepted.length === 0 && rejected.length === 2, rejected.map(r => r.reason).join('；'))
  check('x2.copilotChineseReason', rejected.every(r => /wrapped/.test(r.reason) && /显式决策|手动收尾/.test(r.reason)), rejected.map(r => r.reason).join('；'))

  // ===== 5) X3 lesson add/final/edit 真实落盘 =====
  const addText = await run(`lesson add ${pid} ${JSON.stringify({
    taskId: 't-0001',
    markdown: '原因：排期过于乐观导致延期\n待核：真实工时偏差幅度\n待补：当时客户反馈记录',
  })}`)
  const lessonRows = [...domain.table('lessons').entries()].map(([, r]) => r)
  check('x3.lessonAdded', lessonRows.length === 1 && lessonRows[0].status === 'draft', addText.split('\n')[0])
  const lesson = lessonRows[0]
  check('x3.lessonMarks', lesson.lines.map(l => l.mark).join(',') === 'known,pending,blank', JSON.stringify(lesson.lines))
  check('x3.lessonGaps', lesson.gaps.includes('待补：当时客户反馈记录'), `gaps=${JSON.stringify(lesson.gaps)}`)

  const finalText = await run(`lesson final ${lesson.id}`)
  check('x3.lessonFinal', /已定稿|final/.test(finalText), finalText.split('\n')[0])
  check('x3.lessonFinalState', domain.table('lessons').get(lesson.id).status === 'final', 'draft → final（仅人定稿）')

  const editText = await run(`lesson edit ${lesson.id} "补充：复盘会已确认根因\n待补：改进项跟踪表"`)
  const edited = domain.table('lessons').get(lesson.id)
  // 定稿后补材料保留 final 状态；edit 只重写句级 lines/gaps，不把 final 退回 draft。
  check('x3.lessonEdit', edited.status === 'final' && edited.lines.map(l => l.mark).join(',') === 'known,blank', `status=${edited.status}`)
  check('x3.lessonEditGaps', edited.gaps.includes('待补：改进项跟踪表'), `gaps=${JSON.stringify(edited.gaps)}`)

  const listText = await run(`lesson list ${pid}`)
  check('x3.lessonList', listText.includes(lesson.id), listText.split('\n')[0])

  // ===== 6) K16 archive 包真实生成（README + exportedAt/origin；原数据零改动）=====
  const beforeTasks = structuredClone([...domain.table('tasks').entries()])
  const archiveDir = join(root, 'pmtool-archive-out')
  const archText = await run(`archive ${pid} ${archiveDir}`)
  check('k16.archiveGenerated', existsSync(join(archiveDir, 'package.json')) && existsSync(join(archiveDir, 'README-字段说明.md')), archText.split('\n')[0])
  const pkg = JSON.parse(readFileSync(join(archiveDir, 'package.json'), 'utf8'))
  check('k16.origin', pkg.origin === 'pm-tool' && pkg.kind === 'pm-tool-archive', `origin=${pkg.origin}`)
  check('k16.timestamps', !!pkg.exportedAt && !!pkg.archivedAt, `exportedAt=${pkg.exportedAt} archivedAt=${pkg.archivedAt}`)
  check('k16.sections', Array.isArray(pkg.tasks) && Array.isArray(pkg.deliverables) && Array.isArray(pkg.evidence) && Array.isArray(pkg.reflections) && Array.isArray(pkg.milestones),
    `tasks=${pkg.tasks.length} dlv=${pkg.deliverables.length} ev=${pkg.evidence.length} refl=${pkg.reflections.length} ms=${pkg.milestones.length}`)
  const readme = readFileSync(join(archiveDir, 'README-字段说明.md'), 'utf8')
  check('k16.readmeFields', readme.includes('exportedAt') && readme.includes('origin') && readme.includes('字段说明'), 'README 含字段说明')
  const afterTasks = [...domain.table('tasks').entries()]
  check('k16.readOnly', JSON.stringify(afterTasks) === JSON.stringify(beforeTasks), '原任务数据零改动')

  // ===== 落盘核验：真实 JSON 文件 =====
  check('disk.taskWrapped', readFileSync(join(root, 'pmtool', 'tasks', 't-0001.json'), 'utf8').includes('"wrapped"'), 'tasks/t-0001.json 落库 wrapped')
  check('disk.lesson', existsSync(join(root, 'pmtool', 'lessons', `${lesson.id}.json`)), 'lessons 目录有记录')
} catch (e) {
  check('FATAL', false, e instanceof Error ? e.stack ?? e.message : String(e))
}

const failed = results.filter(r => !r.ok)
console.log(failed.length ? `\nP2C VERIFY FAIL (${failed.length}/${results.length})` : `\nP2C VERIFY PASS (${results.length}/${results.length})`)
process.exit(failed.length ? 1 : 0)
