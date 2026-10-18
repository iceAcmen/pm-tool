/**
 * P1 集成验证：K11/K13/K6/X6-L2/K19 全链真实命令 + 真实 JSON 落盘 + 幂等核验。
 * 机制与 verify-p0-integration.mjs 同构：真实 Context + JsonStorageBackend 临时根 + 真实命令 handler。
 * 不触碰 3172 / 正式 data/；不调模型。
 * 覆盖（对应 docs/design/deep-integration-v2-p1-dev.md）：
 *  1. K11 queue open 打卡落盘 + list 读时派生（排序/lateDays/Top1+rest）
 *  2. K11 mute 二态（top 排除、rest 可见 muted、关键项豁免）+ unmute 可逆 + TTL
 *  3. K11 quiet 时段静默（quietMode、top 置空）+ quiet off 可逆
 *  4. K9 缺席队列（session 绑定后任务零更新 → absent）
 *  5. web snapshot 携带 queue（读时派生、零写）
 *  6. X6-L2 milestone achieved → reflections 落盘（sourceEvent=milestone-achieved、关联任务清单、幂等）
 *  7. X6-L2 deliverable accepted → reflections 落盘（deliverable-accepted、幂等）
 *  8. deliverableId 校验负例（不存在 / 跨项目，中文文案）
 *  9. K19 load-stance 三函数真实输出（loadFacts/stanceSuggestions/staleStanceTags）
 * 10. K13 ask-projection 纯函数真实输出（引用解析/处理结果归并）
 * 11. K6 /pm check 真实规则命中（只读）
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
import { addMilestone } from '../lib/core/milestones.js'
import { addDeliverable } from '../lib/core/deliverables.js'
import { loadFacts, stanceSuggestions, staleStanceTags } from '../lib/core/load-stance.js'
import { setFixedTodayIso, clearFixedTodayIso } from '../lib/core/derived.js'
import { extractReferencedTaskIds, latestAppliedBatches } from '../lib/core/ask-projection.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-p1-integration-'))
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
  // 夹具以 2026-10-18 为「今天」：注入固定时钟解耦墙钟，不改任何断言预期。
  setFixedTodayIso('2026-10-18')

  const project = await addProject(domain, { name: 'P1 集成验证项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const pid = project.id

  // ===== 种子：四类形态任务 =====
  // t-0001 逾期未达（普通，due 早于今天 5 天，progress 40）
  // t-0002 未来到期（不入选）
  // t-0003 逾期但 done（排除）
  // t-0004 blocked 逾期（关键项豁免验证）
  // t-0005 逾期 P0（排序验证）
  await run(`task add ${JSON.stringify({ projectId: pid, title: '逾期任务-普通', status: 'in_progress', progress: 40, dueDate: '2026-10-13' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '未来到期任务', status: 'todo', dueDate: '2026-12-01' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '逾期但已done', status: 'done', progress: 100, dueDate: '2026-10-10' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: 'blocked逾期任务', status: 'blocked', progress: 30, dueDate: '2026-10-08' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: 'P0逾期任务', status: 'in_progress', priority: 'P0', progress: 50, dueDate: '2026-10-15' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '正常跟进任务', status: 'in_progress', progress: 70 })}`)
  await sleep(50)

  // ===== 1) K11 queue open：打卡 + 队列派生 =====
  const q1 = await run(`queue open ${pid}`)
  const q1j = JSON.parse(q1)
  check('queue.open.hasOpened', domain.table('settings').get('pmQueueOpened')?.value?.[pid]?.at != null, 'pmQueueOpened 落盘')
  check('queue.open.topPresent', q1j.top != null, `top=${JSON.stringify(q1j.top?.taskId)}`)
  // 排序：blocked(t-0004) > P0(t-0005) > 逾期天数多者(t-0001)
  check('queue.open.topBlocked', q1j.top?.taskId === 't-0004', `top=${q1j.top?.taskId}（应 t-0004 blocked）`)
  check('queue.open.restOrder', q1j.rest[0]?.taskId === 't-0005' && q1j.rest[1]?.taskId === 't-0001', `rest=${q1j.rest.map(r => r.taskId).join(',')}`)
  check('queue.open.lateDays', q1j.top?.lateDays === 10, `lateDays=${q1j.top?.lateDays}（10-08→10-18 逾期 10 天）`)
  check('queue.open.excludes', !q1j.rest.some(r => ['t-0002', 't-0003'].includes(r.taskId)), '未来到期/done 均排除')
  check('queue.open.count', (q1j.rest?.length ?? 0) === 2, `rest=${q1j.rest?.length}（2 条：t-0005/t-0001；t-0006 此时未绑定不缺席）`)
  check('queue.open.quietMode', q1j.quietMode === false, `quietMode=${q1j.quietMode}`)

  // ===== 2) K11 mute 二态 + 关键项豁免 + unmute 可逆 =====
  // 静音 t-0001（非关键：非 blocked 且 lateDays=5>0 → 迟到>0 属于豁免？契约：关键项豁免=blocked 或 lateDays>0 → t-0001 迟到 5 天仍豁免）
  // 先静音 P0 任务 t-0005（lateDays=3>0 → 也豁免）。验证豁免：静音 blocked t-0004 仍进 top
  await run(`queue mute t-0004 7`)
  const q2 = JSON.parse(await run(`queue list ${pid}`))
  check('queue.mute.exemptTop', q2.top?.taskId === 't-0004', `静音 blocked 后仍进 top（关键项豁免）top=${q2.top?.taskId}`)
  await run(`queue unmute t-0004`)
  const q3 = JSON.parse(await run(`queue list ${pid}`))
  check('queue.unmute.restore', q3.top?.taskId === 't-0004', 'unmute 后恢复')
  check('queue.unmute.clean', domain.table('settings').get('pmQueueMute')?.['t-0004'] == null, 'pmQueueMute 键已清除')
  // mute 普通条目 t-0001：静音后 top 应是 t-0005（P0），t-0001 进 rest 且 muted 标
  // 但 t-0001 lateDays=5>0 属豁免……用 quiet 场景先验证非豁免：设一个无 lateDays 的 muted 不可行（入选即逾期）
  // 按契约 lateDays>0 即豁免，t-0001 无法作为非豁免样本；改静音 t-0005（lateDays=3>0 同样豁免）。
  // 真实非豁免样本需 lateDays=0 且非 blocked——即「今日到期」（dueDate=today）任务：
  await run(`task add ${JSON.stringify({ projectId: pid, title: '今日到期任务', status: 'todo', dueDate: '2026-10-18' })}`)
  await sleep(50)
  const q3b = JSON.parse(await run(`queue list ${pid}`))
  check('queue.todayDue.top', q3b.top?.taskId === 't-0004', `今日到期(t-0007) 无 lateDays → 不豁免，top 仍 blocked：top=${q3b.top?.taskId}`)
  check('queue.todayDue.inRest', q3b.rest.some(r => r.taskId === 't-0007' && r.lateDays === 0), '今日到期条目在 rest（lateDays=0）')
  await run(`queue mute t-0007 7`)
  const q4 = JSON.parse(await run(`queue list ${pid}`))
  check('queue.mute.hidesTop', q4.top?.taskId !== 't-0007', 'mute 后不占 top')
  const mutedInRest = q4.rest.find(r => r.taskId === 't-0007')
  check('queue.mute.restVisible', mutedInRest?.muted === true, `rest 可见且标 muted=${mutedInRest?.muted}`)
  check('queue.mute.ttl', mutedInRest?.mutedUntil != null, `mutedUntil=${mutedInRest?.mutedUntil}`)
  await run(`queue unmute t-0007`)

  // ===== 3) K11 quiet 时段静默 + off 可逆 =====
  // 当前 2026-10-18 日间；设置全天静默 00:00-23:59 使命中
  await run(`queue quiet 00:00 23:59`)
  const q5 = JSON.parse(await run(`queue list ${pid}`))
  check('queue.quiet.mode', q5.quietMode === true, `quietMode=${q5.quietMode}`)
  check('queue.quiet.topNull', q5.top === null, '静默时段 top 置空')
  check('queue.quiet.restKept', (q5.rest?.length ?? 0) > 0, `rest 保留 ${q5.rest?.length}`)
  await run(`queue quiet off`)
  const q6 = JSON.parse(await run(`queue list ${pid}`))
  check('queue.quiet.off', q6.quietMode === false && q6.top != null, 'quiet off 恢复')
  check('queue.quiet.clean', domain.table('settings').get('pmQueueQuiet') == null, 'pmQueueQuiet 键已清除')

  // ===== 4) K9 缺席队列 =====
  await run(`session bind t-0006 session-p1-abs "结存：会话提及但任务未动"`)
  await sleep(50)
  const q7 = JSON.parse(await run(`queue list ${pid}`))
  const absent = q7.rest.find(r => r.taskId === 't-0006')
  check('k9.absent', absent?.absent === true, `t-0006 缺席队列 ${JSON.stringify(absent)}`)

  // ===== 5) web snapshot 携带 queue =====
  const snap = JSON.parse(await run(`web snapshot`))
  check('snapshot.queueKey', snap.queue?.[pid] != null, `snapshot.queue[${pid}] 存在`)
  check('snapshot.queueShape', snap.queue[pid].top != null && Array.isArray(snap.queue[pid].rest), 'queue 形状 {top,rest,...}')
  check('snapshot.queueBackCompat', snap.projects != null && Array.isArray(snap.tasks), 'snapshot 既有字段未被破坏')

  // ===== 6) X6-L2 milestone achieved → 复盘草稿 =====
  const ms = await addMilestone(domain, { projectId: pid, title: '里程碑-核心功能', targetDate: '2026-10-16' })
  await run(`task add ${JSON.stringify({ projectId: pid, title: '里程碑任务-已完成', status: 'done', progress: 100, evidenceUrl: 'https://example.com/e1', milestoneId: ms.id })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '里程碑任务-未完成', status: 'todo', milestoneId: ms.id })}`)
  await sleep(50)
  await run(`milestone update ${ms.id} ${JSON.stringify({ status: 'achieved', achievedDate: '2026-10-16' })}`)
  await sleep(100)
  const refs1 = [...domain.table('reflections').entries()].filter(([, r]) => r.sourceEvent === 'milestone-achieved')
  check('l2.milestone.created', refs1.length === 1, `里程碑复盘草稿 ${refs1.length} 条`)
  const r1 = refs1[0][1]
  check('l2.milestone.fields', r1.milestoneId === ms.id && r1.status === 'draft' && r1.taskId == null, `milestoneId=${r1.milestoneId} status=${r1.status}`)
  const r1text = JSON.stringify(r1.draft)
  check('l2.milestone.relTasks', /关联任务/.test(r1text) && /里程碑任务-已完成/.test(r1text) && /里程碑任务-未完成/.test(r1text), '关联任务清单行存在（含已/未完成）')
  check('l2.milestone.gap', /未完成/.test(r1text), 'gaps 含未完成留白')
  await run(`milestone update ${ms.id} ${JSON.stringify({ status: 'achieved', achievedDate: '2026-10-16' })}`)
  await sleep(100)
  check('l2.milestone.idempotent', [...domain.table('reflections').entries()].filter(([, r]) => r.sourceEvent === 'milestone-achieved').length === 1, '重复 achieved 幂等')

  // ===== 7) X6-L2 deliverable accepted → 复盘草稿 =====
  const dlv = await addDeliverable(domain, { projectId: pid, name: '交付物-验收报告', version: '1.0' })
  await run(`task add ${JSON.stringify({ projectId: pid, title: '交付任务-有证据', status: 'done', progress: 100, evidenceUrl: 'https://example.com/acc', deliverableId: dlv.id })}`)
  await sleep(50)
  await run(`deliverable update ${dlv.id} ${JSON.stringify({ status: 'accepted' })}`)
  await sleep(100)
  const refs2 = [...domain.table('reflections').entries()].filter(([, r]) => r.sourceEvent === 'deliverable-accepted')
  check('l2.deliverable.created', refs2.length === 1, `交付验收复盘草稿 ${refs2.length} 条`)
  const r2 = refs2[0][1]
  check('l2.deliverable.fields', r2.deliverableId === dlv.id && r2.status === 'draft', `deliverableId=${r2.deliverableId}`)
  const r2text = JSON.stringify(r2.draft)
  check('l2.deliverable.relTasks', /关联任务/.test(r2text) && /交付任务-有证据/.test(r2text), '关联任务行存在')
  check('l2.deliverable.title', /交付验收复盘（草稿）/.test(r2.draft.title), `title=${r2.draft.title}`)
  await run(`deliverable update ${dlv.id} ${JSON.stringify({ status: 'accepted' })}`)
  await sleep(100)
  check('l2.deliverable.idempotent', [...domain.table('reflections').entries()].filter(([, r]) => r.sourceEvent === 'deliverable-accepted').length === 1, '重复 accepted 幂等')

  // ===== 8) deliverableId 校验负例 =====
  const bad = await run(`task add ${JSON.stringify({ projectId: pid, title: '坏交付物引用', deliverableId: 'dlv-9999' })}`, 'error')
  check('l2.dlvNotFound', /未找到交付物/.test(bad), bad)
  const otherProj = await addProject(domain, { name: '其他项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const cross = await run(`task add ${JSON.stringify({ projectId: otherProj.id, title: '跨项目引用', deliverableId: dlv.id })}`, 'error')
  check('l2.dlvCrossProject', /不属于/.test(cross), cross)

  // ===== 9) K19 load-stance 真实输出 =====
  const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
  const facts = loadFacts(tasks, '2026-10-18')
  const stances = stanceSuggestions(tasks, '2026-10-18')
  const tags = staleStanceTags(tasks, '2026-10-18')
  check('k19.factsShape', Array.isArray(facts) && facts.every(f => 'personId' in f && 'taskCount' in f), `loadFacts ${facts.length} 条`)
  check('k19.stancesShape', Array.isArray(stances) && stances.every(s => ['cut', 'slow'].includes(s.stance)), `stanceSuggestions ${stances.length} 条`)
  check('k19.stancesWording', stances.every(s => /建议供人决策/.test(s.reason ?? '')), '建议文案含「建议供人决策」')
  check('k19.tagsShape', Array.isArray(tags) && tags.every(t => t.tag === '烂尾倾向'), `staleStanceTags ${tags.length} 条`)

  // ===== 10) K13 ask-projection 纯函数 =====
  const refs = extractReferencedTaskIds('完成任务 t-0001 与 t-0002 后推进里程碑。', ['t-0001', 't-0002', 't-0003'])
  check('k13.refIds', refs.includes('t-0001') && refs.includes('t-0002'), `引用解析 ${refs.join(',')}`)
  const batch = latestAppliedBatches([])
  check('k13.batchEmpty', batch.length === 0, '空台账 → 空批次列表')

  // ===== 11) K6 /pm check 真实规则命中 =====
  const chkText = await run(`check ${pid}`)
  const chk = JSON.parse(chkText.match(/```json\n([\s\S]*?)\n```/)?.[1] ?? chkText)
  const rules = new Set(chk.map(c => c.rule))
  check('k6.rules', rules.has('overdue-untouched'), `规则命中 ${[...rules].join(',')}`)
  check('k6.readonly', domain.table('tasks').get('t-0001').progress === 40, 'check 只读未改状态')

  const failed = results.filter(r => !r.ok)
  console.log(`\n=== P1 集成验证：${results.length - failed.length}/${results.length} PASS ===`)
  if (failed.length) {
    console.log('失败项：')
    for (const f of failed) console.log(`  ${f.k} :: ${f.detail}`)
    process.exitCode = 1
  } else {
    console.log('全部通过。')
  }
} catch (err) {
  console.error('\n[ERROR]', err)
  const failed = results.filter(r => !r.ok)
  console.log(`=== 已执行 ${results.length} 项，其中 ${failed.length} 项失败 ===`)
  for (const f of failed) console.log(`  ${f.k} :: ${f.detail}`)
  process.exitCode = 1
} finally {
  clearFixedTodayIso()
}
