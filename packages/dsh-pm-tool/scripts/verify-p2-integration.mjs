/**
 * P2 集成验证：K18 单向出站 + X7 愿景/OKR + X2 收尾 + X3 失败经验 + K16 档案 + X5 述职，
 * 全链真实命令 + 真实 JSON 落盘。
 * 机制与 verify-p1-integration.mjs 同构：真实 Context + JsonStorageBackend 临时根 + 真实命令 handler。
 * 不触碰 3172 / 正式 data/；不调模型。
 * 覆盖（对应 docs/design/deep-integration-v2-p2-dev.md）：
 *  K18: 三档真实落盘（web 声明位/plain 纯文本/markdown 附录）、审计流只增、已发日志 TTL 归档、
 *       audit/sent 只读、默认拒覆盖 confirm 覆盖
 *  X7:  add 落库+单父归属、suggest 只进收件区零写入、confirm 建 draft、ignore 保留、clear 清已处理、
 *       跨项目 primaryOkrId 负例、tree 软关联标注
 *  X2:  人显式 wrapped 转换+文案、wrapped 不催办、check 不命中、stats 单列、AI 拒写 wrapped、复盘钩子不触发
 *  X3:  lesson add/list/final 落盘（句级标注）
 *  K16: archive 包生成（package.json+README、exportedAt、原数据零改动）
 *  X5:  review 聚合 JSON+Markdown 三段、wrapped 计 done=false
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { addMilestone } from '../lib/core/milestones.js'
import { addDeliverable } from '../lib/core/deliverables.js'
import { partitionSentEntries } from '../lib/core/export.js'
import { validateActions } from '../lib/core/copilot.js'
import { buildOkrTree, readOkrInbox } from '../lib/core/okr.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-p2-integration-'))
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

  const project = await addProject(domain, { name: 'P2 集成验证项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const pid = project.id
  const outDir = join(root, 'outbound')

  // ===== 种子 =====
  await run(`task add ${JSON.stringify({ projectId: pid, title: '完成的核心功能', status: 'done', progress: 100, dueDate: '2026-10-10', evidenceUrl: 'https://example.com/e1' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '逾期进行中任务', status: 'in_progress', progress: 40, dueDate: '2026-10-08' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '烂尾收尾任务', status: 'todo', progress: 20, dueDate: '2026-10-12' })}`)
  await sleep(50)

  // ===== K18 三档导出 =====
  const webText = await run(`export web ${pid} ${outDir}`)
  check('k18.web.msg', /唯一事实源/.test(webText) && /活跃已发/.test(webText), 'web 成功文案含「唯一事实源」与日志摘要')
  const webFile = readdirSync(outDir).find(f => f.endsWith('-snapshot.html'))
  check('k18.web.file', !!webFile, `web 落盘 ${webFile ?? '(无)'}`)
  const webHtml = readFileSync(join(outDir, webFile), 'utf8')
  check('k18.web.statement', /只读快照/.test(webHtml) && /非实时数据/.test(webHtml), 'web 含只读快照声明')
  check('k18.web.time', /2026-10-18/.test(webHtml) && /\d{2}:\d{2}:\d{2}/.test(webHtml), 'web 含生成时间')
  check('k18.web.dark', /prefers-color-scheme: dark/.test(webHtml), 'web 浅深双态（系统偏好跟随）')
  check('k18.web.noScript', !/<script/i.test(webHtml) && !/<link\b/i.test(webHtml), 'web 无脚本/无外链')
  const plainText = await run(`export plain ${pid} ${outDir}`)
  check('k18.plain.msg', /唯一事实源/.test(plainText), 'plain 成功文案')
  const plainFile = readdirSync(outDir).find(f => f.endsWith('-report.txt'))
  const plainBody = readFileSync(join(outDir, plainFile), 'utf8')
  check('k18.plain.pure', !/^[#*`>|-]/m.test(plainBody) && !/\|/.test(plainBody), 'plain 无 markdown 符号')
  check('k18.plain.time', /2026-10-18/.test(plainBody), 'plain 含生成时间戳')
  const mdText = await run(`export markdown ${pid} ${outDir}`)
  const mdFile = readdirSync(outDir).find(f => f.endsWith('.md'))
  const mdBody = readFileSync(join(outDir, mdFile), 'utf8')
  check('k18.md.appendix', /证据/.test(mdBody) && /复盘引用|复盘/.test(mdBody), 'markdown 含证据/复盘引用附录')
  check('k18.md.footer', /唯一数据源|数据源/.test(mdBody), 'markdown footer 数据源声明')
  const jsonText = await run(`export json ${outDir}`)
  check('k18.json.kept', /数据包已生成/.test(jsonText), 'export json 既有档保留')

  // ===== K18 出站日志两类 =====
  const audit = domain.table('settings').get('pmExportAudit')?.value ?? []
  check('k18.audit.rows', audit.length >= 3, `审计 ${audit.length} 条（md/web/plain）`)
  check('k18.audit.shape', audit.every(e => e.at && e.projectId && e.format && e.targetPath && typeof e.itemCount === 'number'), '审计条目形状 {at,projectId,format,targetPath,itemCount}')
  const sent = domain.table('settings').get('pmExportSent')?.value ?? []
  check('k18.sent.shape', sent.length >= 3 && sent.every(e => e.at && e.format && e.targetPath), `已发日志 ${sent.length} 条`)
  // TTL=30 天：40 天前过期、10 天前活跃
  const old40 = new Date(Date.now() - 40 * 86400000).toISOString()
  const recent10 = new Date(Date.now() - 10 * 86400000).toISOString()
  const { active, expired } = partitionSentEntries(
    [{ at: old40, projectId: pid, format: 'web', targetPath: '/x/old' }, { at: recent10, projectId: pid, format: 'web', targetPath: '/x/new' }],
    new Date().toISOString(),
  )
  check('k18.ttl.expired', expired.length === 1 && expired[0].targetPath === '/x/old', `40 天前过期 ${expired.length} 条`)
  check('k18.ttl.active', active.length === 1 && active[0].targetPath === '/x/new', `10 天前活跃 ${active.length} 条`)
  // 覆盖行为：默认拒，confirm 覆盖
  const again = await run(`export web ${pid} ${outDir}`, 'error')
  check('k18.overwrite.deny', /已存在|拒绝|覆盖/.test(again), again)
  const overwritten = await run(`export web ${pid} ${outDir} confirm`)
  check('k18.overwrite.confirm', /唯一事实源/.test(overwritten), 'confirm 覆盖成功')
  const audit2 = domain.table('settings').get('pmExportAudit')?.value ?? []
  check('k18.audit.appendOnly', audit2.length === audit.length + 1, `审计只增（${audit.length} → ${audit2.length}）`)
  const auditText = await run(`export audit ${pid}`)
  check('k18.audit.cmd', /pmExportAudit|审计|export/.test(auditText), 'export audit 只读列出')
  const sentText = await run(`export sent ${pid}`)
  check('k18.sent.cmd', /已发出|sent|导出/.test(sentText), 'export sent 只读列出')

  // ===== X7 OKR =====
  await run(`okr add ${pid} ${JSON.stringify({ title: '年度目标：交付质量提升', kind: 'objective' })}`)
  const okrObj = [...domain.table('okrs').entries()].find(([, r]) => r.kind === 'objective')?.[1]
  check('x7.add.objective', !!okrObj && okrObj.status === 'draft', `objective 落库 draft（${okrObj?.id}）`)
  await run(`okr add ${pid} ${JSON.stringify({ title: 'KR：P0 故障清零', kind: 'key-result', primaryOkrId: okrObj.id })}`)
  const okrKr = [...domain.table('okrs').entries()].find(([, r]) => r.kind === 'key-result')?.[1]
  check('x7.add.kr', okrKr?.primaryOkrId === okrObj.id, `KR 单父归属 ${okrKr?.primaryOkrId}`)
  const crossProj = await addProject(domain, { name: '跨项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const cross = await run(`okr add ${crossProj.id} ${JSON.stringify({ title: '跨项目 KR', kind: 'key-result', primaryOkrId: okrObj.id })}`, 'error')
  check('x7.crossProject.deny', /不属于|跨项目|存在/.test(cross), cross)
  const tree = buildOkrTree([...domain.table('okrs').entries()].map(([, r]) => r))
  check('x7.tree.roots', tree.tree.length === 1 && tree.tree[0].id === okrObj.id, `树根 objective ${tree.tree.length}`)
  check('x7.tree.children', tree.tree[0].children.some(c => c.id === okrKr.id), 'KR 挂在 objective 下')
  await run(`okr update ${okrObj.id} ${JSON.stringify({ relatedOkrIds: [okrKr.id] })}`)
  const tree2 = buildOkrTree([...domain.table('okrs').entries()].map(([, r]) => r))
  check('x7.related.flag', tree2.tree[0].relatedTargets?.some(t => t.id === okrKr.id), '软关联行标注 related')
  // suggest 只进收件区，okrs 零写入
  const okrCountBefore = [...domain.table('okrs').entries()].length
  const sugText = await run(`okr suggest ${pid} ${JSON.stringify({ title: 'agent 建议的 KR', kind: 'key-result', primaryOkrId: okrObj.id })}`)
  const inbox = readOkrInbox(domain)
  check('x7.suggest.inbox', inbox.some(s => s.status === 'pending'), `建议进收件区 ${inbox.length} 条`)
  check('x7.suggest.nowrite', [...domain.table('okrs').entries()].length === okrCountBefore, 'suggest 后 okrs 零写入（未确认不生效）')
  const sug = inbox.find(s => s.status === 'pending')
  const inboxText = await run(`okr inbox ${pid}`)
  check('x7.inbox.list', sug.title && /建议|agent/.test(inboxText), 'inbox 列出建议')
  // confirm → 建 draft + 建议标 confirmed
  await run(`okr confirm ${sug.id}`)
  const afterConfirm = [...domain.table('okrs').entries()].map(([, r]) => r)
  check('x7.confirm.record', afterConfirm.length === okrCountBefore + 1 && afterConfirm.some(r => r.title === 'agent 建议的 KR' && r.status === 'draft'), 'confirm 建 draft 记录')
  const inbox2 = readOkrInbox(domain)
  check('x7.confirm.marked', inbox2.find(s => s.id === sug.id)?.status === 'confirmed', '建议标 confirmed')
  // ignore 保留标 ignored
  await run(`okr suggest ${pid} ${JSON.stringify({ title: '第二建议', kind: 'key-result' })}`)
  const sug2 = readOkrInbox(domain).find(s => s.title === '第二建议')
  await run(`okr ignore ${sug2.id}`)
  const inbox3 = readOkrInbox(domain)
  check('x7.ignore.kept', inbox3.find(s => s.id === sug2.id)?.status === 'ignored', 'ignore 保留标 ignored')
  // clear 清 confirmed/ignored 保留 pending
  await run(`okr suggest ${pid} ${JSON.stringify({ title: '第三建议', kind: 'objective' })}`)
  const sug3 = readOkrInbox(domain).find(s => s.title === '第三建议')
  await run(`okr inbox ${pid} clear`)
  const inbox4 = readOkrInbox(domain)
  check('x7.clear.removesHandled', !inbox4.some(s => ['confirmed', 'ignored'].includes(s.status)), 'clear 清空已处理/已忽略')
  check('x7.clear.keepsPending', inbox4.some(s => s.id === sug3.id && s.status === 'pending'), 'clear 保留 pending')

  // ===== X2 wrapped 口径 =====
  const wrapText = await run(`task update t-0003 ${JSON.stringify({ status: 'wrapped' })}`)
  check('x2.human.wrap', /已收尾/.test(wrapText) && /≠|不/.test(wrapText), '人显式 wrapped 转换文案明示「已收尾≠正式完成」')
  check('x2.human.status', domain.table('tasks').get('t-0003').status === 'wrapped', 'wrapped 真实落库')
  const qWrap = JSON.parse(await run(`queue list ${pid}`))
  check('x2.queue.excludes', !(qWrap.top?.taskId === 't-0003') && !qWrap.rest?.some(r => r.taskId === 't-0003'), 'wrapped 不催办（队列排除）')
  const chkWrap = await run(`check ${pid}`)
  const chkWrapJson = JSON.parse(chkWrap.match(/```json\n([\s\S]*?)\n```/)?.[1] ?? chkWrap)
  check('x2.check.miss', !chkWrapJson.some(c => c.rule === 'overdue-untouched' && c.taskId === 't-0003'), 'check 逾期规则不命中 wrapped')
  const statsText = await run(`stats ${pid}`)
  check('x2.stats.column', /已收尾/.test(statsText), 'stats 单列「已收尾」')
  const ai = validateActions([{ op: 'task.update', entity: 'task', id: 't-0003', patch: { status: 'wrapped' } }], {
    taskIds: ['t-0003'],
  })
  check('x2.ai.deny', ai.rejected?.length === 1 && /AI 不得直接写 wrapped/.test(ai.rejected[0].reason), 'AI 直写 wrapped 被拒（中文拒因）')
  const refsBeforeWrap = [...domain.table('reflections').entries()].length
  await sleep(80)
  check('x2.reflect.notrigger', [...domain.table('reflections').entries()].length === refsBeforeWrap, 'wrapped 不触发复盘草稿钩子')

  // ===== X3 失败经验 =====
  await run(`lesson add ${pid} ${JSON.stringify({ taskId: 't-0003', markdown: '原因：需求中途变更\n待核：真实工时偏差\n待补：客户反馈记录' })}`)
  const lesson = [...domain.table('lessons').entries()][0]?.[1]
  check('x3.add.record', !!lesson && lesson.status === 'draft', `lesson 落库 draft（${lesson?.id}）`)
  check('x3.add.lines', lesson.lines.length === 3 && lesson.lines[0].mark === 'known' && lesson.lines[1].mark === 'pending' && lesson.lines[2].mark === 'blank', `句级 known/pending/blank 标注：${lesson.lines.map(l => l.mark).join(',')}`)
  const lessonText = await run(`lesson list ${pid}`)
  check('x3.list.cmd', /失败经验/.test(lessonText), 'lesson list 只读列出')
  await run(`lesson final ${lesson.id}`)
  check('x3.final.status', [...domain.table('lessons').entries()][0][1].status === 'final', '人定稿 final')

  // ===== K16 档案最小保存包 =====
  const archiveDir = join(root, 'archive-pkg')
  const arcText = await run(`archive ${pid} ${archiveDir}`)
  check('k16.archive.msg', /已生成/.test(arcText) && /非全量镜像/.test(arcText), 'archive 成功文案含「非全量镜像」')
  const pkg = JSON.parse(readFileSync(join(archiveDir, 'package.json'), 'utf8'))
  check('k16.archive.pkg', pkg.origin === 'pm-tool' && pkg.projectId === pid && pkg.exportedAt != null, 'package.json origin/exportedAt')
  check('k16.archive.fields', Array.isArray(pkg.tasks) && pkg.tasks.length >= 3 && Array.isArray(pkg.deliverables), '包含任务/交付物通用字段')
  const readme = readFileSync(join(archiveDir, 'README-字段说明.md'), 'utf8')
  check('k16.archive.readme', /字段|说明/.test(readme) && /tasks|任务/.test(readme), 'README-字段说明.md 每字段一句话')
  check('k16.archive.readonly', domain.table('tasks').get('t-0001').progress === 100, '归档只读未改原数据')

  // ===== X5 述职素材 =====
  const rev = await run(`review ${pid} 2026-10-01 2026-10-18`)
  check('x5.review.three', /做了什么/.test(rev) && /量化结果/.test(rev) && /关键产出/.test(rev), 'Markdown 三段（做了什么/量化结果/关键产出）')
  check('x5.review.done', /完成的核心功能/.test(rev), 'done 任务入素材')
  const revJson = JSON.parse(rev.match(/```json\n([\s\S]*?)\n```/)?.[1] ?? '{}')
  const doneTask = revJson.tasks?.find(t => t.title === '完成的核心功能')
  check('x5.review.doneFlag', doneTask?.done === true, 'done 任务 done=true')
  const wrappedInReview = revJson.tasks?.find(t => t.title === '烂尾收尾任务')
  check('x5.review.wrappedNotDone', wrappedInReview?.done === false, 'wrapped 条目 done=false（不计完成数）')

  const failed = results.filter(r => !r.ok)
  console.log(`\n=== P2 集成验证：${results.length - failed.length}/${results.length} PASS ===`)
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
}
