/**
 * P0 集成验证：K1/K2/K4/K3/K9/K12/X6-L1/K6 全链真实命令 + 真实 JSON 落盘 + 溯源核验。
 * 机制与 verify-reflect.mjs 同构：真实 Context + JsonStorageBackend 临时根 + 真实命令 handler。
 * 不触碰 3172 / 正式 data/；不调模型（capture 用观察模式返回文案验证，落库链用 capture-apply 构造草稿）。
 * 覆盖（对应 P0 规格 §4.2）：
 *  1. ask-apply 写 description/evidenceUrl（K2 窄集）真实入库 + 溯源 + ask-undo 可撤销
 *  2. capture 观察模式不落库 → capture-apply 真实落库（含证据挂接）→ provenance kind=capture
 *  3. attach-evidence 单条轻确认直挂 evidenceUrl
 *  4. task done 自动生成复盘草稿（X6-L1）→ reflect 查看/final/edit
 *  5. check 五类规则命中（K6，只读）
 *  6. metric 汇总（K12，只读）
 *  7. session bind/list/notes（K9 单向结存）
 *  8. ask-provenance 溯源条目含 capture/ask-apply
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-p0-integration-'))
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

  const project = await addProject(domain, { name: 'P0 集成验证项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
  const pid = project.id

  // ===== 种子 =====
  await run(`task add ${JSON.stringify({ projectId: pid, title: '需求梳理', status: 'in_progress', progress: 60, dueDate: '2026-10-20' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '原型设计', status: 'todo', dueDate: '2026-10-19' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '联调测试', status: 'todo' })}`)
  await run('deliverable add ' + JSON.stringify({ projectId: pid, name: '验收报告' }))
  await sleep(50)

  // ===== 1) K2 窄集：ask-apply 写 description + evidenceUrl（关键变化确认后落库）=====
  const t1 = 't-0001'
  const k2 = await run(`ask-apply ${pid} ${JSON.stringify([
    { op: 'task.update', id: t1, patch: { description: '备注：周一客户对齐了验收口径', evidenceUrl: 'https://example.com/acceptance.pdf' } },
  ])}`)
  check('k2.applied', /已应用 1 条/.test(k2), k2)
  const t1After = domain.table('tasks').get(t1)
  check('k2.description', t1After.description === '备注：周一客户对齐了验收口径', `description=${t1After.description}`)
  check('k2.evidenceUrl', t1After.evidenceUrl === 'https://example.com/acceptance.pdf', `evidenceUrl=${t1After.evidenceUrl}`)
  check('k2.noStatusTouch', t1After.status === 'in_progress' && t1After.progress === 60, '状态/进度未被 AI 直写改动')
  // 拒绝：title/priority 仍被白名单拒（K2 不扩状态排期类字段）
  const k2rej = await run(`ask-apply ${pid} ${JSON.stringify([
    { op: 'task.update', id: t1, patch: { title: '改名' } },
  ])}`)
  check('k2.rejectTitle', /拒绝 1 条/.test(k2rej), k2rej)

  // ===== 2) K4 对话补档：capture 观察模式（不落库）→ capture-apply 确认落库 =====
  // 无 LLM 环境下用 DSH_PM_E2E capture-fixture 确定性缝（不调模型、不落库），走真实命令路径。
  process.env.DSH_PM_E2E = '1'
  const beforeCount = [...domain.table('tasks').entries()].length
  const cap = await run(`capture ${pid} capture-fixture`)
  check('k4.captureDraft', /candidates/.test(cap), cap.slice(0, 200))
  const afterDraftCount = [...domain.table('tasks').entries()].length
  check('k4.noWriteOnCapture', afterDraftCount === beforeCount, '观察模式未落库')
  delete process.env.DSH_PM_E2E
  const capApply = await run(`capture-apply ${pid} ${JSON.stringify({
    candidates: [
      { title: '出联调环境清单', dueDate: '2026-10-21', assignee: '李工', evidence: ['https://example.com/proto-v2.pdf'] },
      { title: '原型评审待约', dueDate: '2026-10-22' },
    ],
  })}`)
  const newTasks = [...domain.table('tasks').entries()].filter(([, t]) => t.projectId === pid && /清单|评审/.test(t.title))
  check('k4.applied2', /已确认落库 2 个任务/.test(capApply) && newTasks.length === 2, capApply.split('\n')[0])
  const envTask = newTasks.find(([, t]) => t.title.includes('清单'))
  check('k4.evidenceHooked', envTask[1].evidenceUrl === 'https://example.com/proto-v2.pdf', `evidenceUrl=${envTask[1].evidenceUrl}`)

  // ===== 3) K3 证据闭环：attach-evidence 单条轻确认直挂 =====
  const k3 = await run(`attach-evidence t-0003 https://example.com/trace.png`)
  const t3 = domain.table('tasks').get('t-0003')
  check('k3.evidence', t3.evidenceUrl === 'https://example.com/trace.png', k3)

  // ===== 4) X6-L1：task done 自动生成复盘草稿 → reflect 查看/final/edit =====
  // reflect 输出为中文说明 + ```json 块，取围栏内 JSON 解析。
  const parseRefl = (text) => JSON.parse(/```json\n([\s\S]*?)\n```/.exec(text)[1])
  await run(`task update t-0003 ${JSON.stringify({ status: 'done', progress: 100 })}`)
  await sleep(80) // done 钩子 best-effort 写盘
  const reflectText = await run(`reflect t-0003`)
  const refl = parseRefl(reflectText)
  check('x6.draftCreated', refl.status === 'draft' && refl.taskId === 't-0003', reflectText.split('\n')[0])
  const bareRefl = await (async () => { // 裸完成（无证据/清单/交付物）→ 留白不编造
    await run(`task update t-0002 ${JSON.stringify({ status: 'done', progress: 100 })}`)
    await sleep(80)
    return run(`reflect t-0002`)
  })()
  check('x6.gapsOnBareDone', /待补/.test(bareRefl), bareRefl.split('\n')[0])
  const finalText = await run(`reflect t-0003 final`)
  check('x6.finalize', /已定稿/.test(finalText), finalText.split('\n')[0])
  const editText = await run(`reflect t-0003 edit "联调通过，待核：验收截图"`)
  check('x6.editMark', /待核/.test(editText), editText.split('\n')[0])
  const listText = await run(`reflect-list ${pid}`)
  check('x6.list', /t-0003/.test(listText), listText.slice(0, 200))

  // ===== 5) K6 交付检查：五类规则（补四类形态种子：逾期/临期/有未勾清单/满进度未收尾）=====
  const tomorrow = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  await run(`task add ${JSON.stringify({ projectId: pid, title: '逾期未动', status: 'todo', dueDate: '2026-10-01' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '临期未动', status: 'todo', dueDate: tomorrow })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '完成有未勾清单', status: 'done', progress: 100 })}`)
  await run('task checklist add t-0008 写验收报告')
  await run(`task add ${JSON.stringify({ projectId: pid, title: '满进度未收尾', status: 'in_progress', progress: 100 })}`)
  const chk = await run(`check ${pid}`)
  const rows = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(chk)[1])
  const rules = new Set(rows.map(r => r.rule))
  check('k6.rules', ['overdue-untouched', 'due-soon-untouched', 'done-open-checklist', 'done-missing-materials', 'progress-100-not-done'].every(r => rules.has(r)), `rules=${[...rules].join(',')}`)
  const doneMissing = rows.find(r => r.rule === 'done-missing-materials')
  check('k6.notDoneWording', doneMissing && /未覆盖≠未完成/.test(doneMissing.suggestion ?? ''), doneMissing?.suggestion)

  // ===== 6) K12 自我计量：metric 汇总 =====
  const met = JSON.parse(await run(`metric ${pid}`))
  check('k12.metric', met.total >= 2 && met.byKind['capture'] >= 1 && met.byKind['ask-apply'] >= 1, JSON.stringify(met).slice(0, 200))

  // ===== 7) K9 会话结存：bind/list/notes 单向结存 =====
  const bind1 = await run(`session bind t-0001 s-0411 "首次结存：验收口径已对齐"`)
  const bind2 = await run(`session bind t-0001 s-0411 "补充：证据已挂 acceptance.pdf"`)
  check('k9.bindMerge', /session-/.test(bind2), bind2)
  const sessRows = [...domain.table('sessions').entries()].filter(([, s]) => s.taskId === 't-0001')
  check('k9.merged', sessRows.length === 1 && sessRows[0][1].note.includes('补充'), `rows=${sessRows.length} note=${sessRows[0][1].note}`)
  const notes = await run(`session notes t-0001`)
  check('k9.notes', /首次结存/.test(notes), notes.slice(0, 160))

  // ===== 8) 溯源：ask-provenance 账本含 capture/ask-apply，条目 confirmed =====
  await sleep(80) // 溯源 best-effort 写盘
  const prov = JSON.parse(await run(`ask-provenance ${pid}`))
  const kinds = new Set(prov.entries.map(e => e.kind))
  check('prov.kinds', kinds.has('capture') && kinds.has('ask-apply'), `kinds=${[...kinds].join(',')}`)
  const capEntry = prov.entries.find(e => e.kind === 'capture')
  check('prov.confirmed', capEntry && capEntry.status === 'confirmed', JSON.stringify(capEntry ?? {}).slice(0, 200))
  check('prov.pending', prov.pendingCount === 0, `pendingCount=${prov.pendingCount}`)

  // ===== 落盘核验：真实 JSON 文件存在 =====
  const tasksDir = join(root, 'pmtool', 'tasks')
  const sessionsDir = join(root, 'pmtool', 'sessions')
  const reflectionsDir = join(root, 'pmtool', 'reflections')
  const ledgerFile = join(root, 'pmtool', 'settings', 'pmProvenanceLedger.json')
  check('disk.tasks', readFileSync(join(tasksDir, 't-0001.json'), 'utf8').includes('acceptance.pdf'), 'tasks/t-0001.json 含证据链接')
  check('disk.sessions', [...new (await import('node:fs')).readdirSync(sessionsDir)].length >= 1, 'sessions 目录有记录')
  check('disk.reflections', [...new (await import('node:fs')).readdirSync(reflectionsDir)].length >= 2, 'reflections 目录有草稿')
  check('disk.ledger', readFileSync(ledgerFile, 'utf8').includes('capture'), '溯源账本含 capture 条目')
} catch (e) {
  check('FATAL', false, e instanceof Error ? e.stack ?? e.message : String(e))
}

const failed = results.filter(r => !r.ok)
console.log(failed.length ? `\nP0-INTEGRATION FAIL (${failed.length}/${results.length})` : `\nP0-INTEGRATION PASS (${results.length}/${results.length})`)
process.exit(failed.length ? 1 : 0)
