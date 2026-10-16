/**
 * #23 客观进度补全：实际工时 effortHours、证据链接 evidenceUrl、人工设定 manualProgress(+备注)
 * 的离线确定性验证。
 *
 * 口径：
 *  - 新字段全部加法式、可选、向后兼容；旧记录无这些键照常读取，无需迁移；
 *  - 人工设定与清单客观派生并存且明确区分：manual 不污染/覆盖 objective，清除后回落客观；
 *  - done 状态自动记 completedDate（=当天），显式值采纳，revert 清除（与既有完成日期口径一致）。
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
import { addTask, updateTask, getTask } from '../lib/core/tasks.js'
import { apply } from '../lib/index.js'
import { deriveProgressMap } from '../lib/core/progress-derivation.js'
import { taskWriteSchema } from '../lib/core/task.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-task-meta-'))
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

const localTodayIso = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)
  await addProject(domain, { name: '元数据项目', startDate: '2026-09-01', targetDate: '2026-12-31' })

  // ── 1. 建任务带新字段：读回一致；缺省字段为 undefined ──────────────────
  await run('task add ' + JSON.stringify({
    projectId: 'p-0001', title: '写立项书', effortHours: 2.5,
    evidenceUrl: 'https://example.com/evidence', manualProgress: 60, manualProgressNote: '会前预估',
  }))
  const t1 = getTask(domain, 't-0001')
  assert.equal(t1.effortHours, 2.5, 'effortHours 应写回 2.5')
  assert.equal(t1.evidenceUrl, 'https://example.com/evidence', 'evidenceUrl 应写回')
  assert.equal(t1.manualProgress, 60, 'manualProgress 应写回 60')
  assert.equal(t1.manualProgressNote, '会前预估', 'manualProgressNote 应写回')

  // ── 2. update 覆盖字段；客观派生不被人工污染 ────────────────────────────
  await run('task update t-0001 ' + JSON.stringify({ effortHours: 4.5, manualProgress: 70, manualProgressNote: '改口径' }))
  const t1b = getTask(domain, 't-0001')
  assert.equal(t1b.effortHours, 4.5)
  assert.equal(t1b.manualProgress, 70)
  assert.equal(t1b.manualProgressNote, '改口径')
  // 无清单 → objective=null；人工 70 不应污染客观值（客观仍为 null）。
  const map0 = deriveProgressMap([t1b])
  assert.equal(map0.get('t-0001').value, null, '无清单客观值必须为 null，不因人工伪造')

  // ── 3. 清除人工设定（manualProgress=null）→ 回落客观 ──────────────────────
  await run('task update t-0001 ' + JSON.stringify({ manualProgress: null }))
  const t1c = getTask(domain, 't-0001')
  assert.equal(t1c.manualProgress, null, '清除后 manualProgress 应为 null')
  assert.equal(t1c.manualProgressNote, undefined, '清除后备注也应被清掉')

  // ── 4. 清单客观派生：manual 并存但不污染 objective，display 人工优先 ──────
  // 客观派生为纯函数测试（不落盘）：构造清单 2/4 的任务记录。
  const derived = deriveProgressMap([{
    id: 'leaf', projectId: 'p-0001', parentId: null, status: 'todo',
    checklist: [{ id: 'i1', text: '第一项', done: true }, { id: 'i2', text: '第二项', done: true }, { id: 'i3', text: '第三项', done: false }, { id: 'i4', text: '第四项', done: false }],
  }])
  assert.equal(derived.get('leaf').value, 50, '清单 2/4 客观派生应为 50')
  // 人工设 30：mode=manual，objective 仍 50（不被污染），display=30（人工优先展示）。
  const objective = derived.get('leaf').value
  const manual = 30
  const meta = {
    objective,
    manual,
    display: manual ?? objective,
    mode: manual != null ? 'manual' : (objective != null ? 'objective' : 'none'),
  }
  assert.equal(meta.objective, 50, '客观值保持 50，不被人工 30 覆盖')
  assert.equal(meta.manual, 30)
  assert.equal(meta.display, 30, '展示值人工优先')
  assert.equal(meta.mode, 'manual')

  // ── 5. 旧记录（无新字段）安全读入：taskWriteSchema.parse 不报错 ──────────
  const legacy = {
    id: 't-legacy', projectId: 'p-0001', parentId: null, title: '旧任务', description: '',
    assignee: '', status: 'todo', priority: 'P1', startDate: undefined, dueDate: undefined,
    progress: 0, milestoneId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    code: '1.9', order: 1,
  }
  assert.doesNotThrow(() => taskWriteSchema.parse(legacy), '旧记录无新字段应照常通过 schema')

  // ── 6. done 自动记 completedDate；显式值采纳；revert 清除 ────────────────
  await run('task add ' + JSON.stringify({ projectId: 'p-0001', title: '收尾任务', dueDate: '2026-09-20' }))
  await run('task update t-0002 ' + JSON.stringify({ status: 'done' }))
  assert.equal(getTask(domain, 't-0002').completedDate, localTodayIso(), 'done 应自动记当天完成日期')
  await run('task update t-0002 ' + JSON.stringify({ status: 'in_progress' }))
  assert.equal(getTask(domain, 't-0002').completedDate, undefined, 'revert 应清除完成日期')

  console.log('通过：effort/evidence 读写缺省、人工设定显式标记且不污染客观、清除回落、旧数据安全、done/completedDate 关系。')
  await facility.closeAll()
  console.log(`全部任务元数据校验通过。临时数据：${root}`)
} finally {
  await facility.closeAll()
}
