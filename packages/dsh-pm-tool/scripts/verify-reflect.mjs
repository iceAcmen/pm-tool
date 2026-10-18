/**
 * P0 分片C 确定性验证：X6-L1 即时复盘草稿自动钩子 + K6 交付检查（真实文件系统）。
 * 使用独立系统临时目录，不污染真实业务数据；不重启运行中实例。
 * 覆盖：
 *  1. task update 到 done 后 reflections 表自动出现草稿（真实 JSON 落盘）；
 *  2. reflect 查看 / final 定稿 / edit 补材料状态变化；
 *  3. check 五类规则命中；taskUpdateSchema 接受 deliverableId。
 */
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { getTask } from '../lib/core/tasks.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-reflect-'))
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

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  const project = await addProject(domain, { name: '复盘检查验证项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
  const pid = project.id

  // 种子任务：t-0001 将被收尾（触发钩子）；其余用于 check 五类规则。
  await run(`task add ${JSON.stringify({ projectId: pid, title: '收尾任务' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '逾期未动', status: 'in_progress', progress: 30, dueDate: '2026-10-01' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '临期未动', status: 'todo', dueDate: '2026-10-19' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '完成有未勾清单', status: 'done', progress: 100 })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '裸完成缺材料', status: 'done', progress: 100 })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '满进度未收尾', status: 'in_progress', progress: 100 })}`)
  // c：给 t-0004 加一条未勾清单（保持 open，供 done-open-checklist 命中）。
  await run('task checklist add t-0004 写验收报告')

  // taskUpdateSchema 接受 deliverableId（连接字段，不自动生成交付物）。
  await run(`task update t-0006 ${JSON.stringify({ deliverableId: 'dlv-0001' })}`)
  assert.equal(getTask(domain, 't-0006').deliverableId, 'dlv-0001')

  // 1) done 钩子：t-0001 收尾后 reflections 自动落盘。
  await run('task update t-0001 {"status":"done","progress":100}')
  await sleep(120) // 钩子 best-effort 链式入队，等待串行队列写完

  const reflectionRows = [...domain.table('reflections').entries()]
  assert.equal(reflectionRows.length, 1, 'done 后应自动出现 1 条草稿')
  const [refId, rec] = reflectionRows[0]
  assert.equal(rec.taskId, 't-0001')
  assert.equal(rec.status, 'draft')
  assert.equal(rec.sourceEvent, 'task-done')
  assert.match(rec.draft.title, /收尾任务 · 完成即时复盘（草稿）/)
  assert.ok(rec.draft.gaps.some(g => g.includes('待补：交付验收材料与证据链接')))

  // 真实文件系统：reflections JSON 落盘、权限 0600、v2 信封。
  const refFile = join(root, 'pmtool', 'reflections', `${refId}.json`)
  assert.equal(existsSync(refFile), true)
  assert.equal(statSync(refFile).mode & 0o777, 0o600)
  assert.match(readFileSync(refFile, 'utf8'), /\n  "version": 2,/)

  // 2) reflect 查看 / final / edit。
  const view = await run('reflect t-0001')
  assert.match(view, /即时复盘（草稿）/)
  const finalized = await run('reflect t-0001 final')
  assert.match(finalized, /draft → final/)
  assert.equal(domain.table('reflections').get(refId).status, 'final')
  const edited = await run('reflect t-0001 edit "联调通过并提交主干\n待补：验收截图"')
  const after = domain.table('reflections').get(refId)
  assert.ok(after.draft.lines.some(l => l.mark === 'known' && l.text.includes('联调通过')))
  assert.ok(after.draft.lines.some(l => l.mark === 'blank' && l.text.includes('验收截图')))
  await run('reflect list ' + pid)
  await run('reflect t-9999', 'error')

  // 3) check 五类规则命中（固化今天 2026-10-18，确定性）。
  const checkOut = await run(`check ${pid} 2026-10-18`)
  for (const rule of ['overdue-untouched', 'due-soon-untouched', 'done-open-checklist', 'done-missing-materials', 'progress-100-not-done']) {
    assert.match(checkOut, new RegExp(rule), `check 应命中 ${rule}`)
  }
  assert.match(checkOut, /未覆盖≠未完成/)
  // 只读：check 不改任务状态。
  assert.equal(getTask(domain, 't-0002').status, 'in_progress')
  assert.equal(getTask(domain, 't-0006').status, 'in_progress')

  console.log('通过：done 自动建复盘草稿（真实落盘）、reflect 查看/final/edit、check 五类规则、deliverableId 接受。')
} finally {
  await facility.closeAll()
}
console.log(`全部复盘/检查校验通过。临时数据保留于：${root}`)
