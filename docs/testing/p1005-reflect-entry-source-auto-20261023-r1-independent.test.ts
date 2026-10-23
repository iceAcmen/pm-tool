import { beforeEach, afterEach, describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { handleReflectCommand } from './reflect.js'
import { addProject, enqueueDomainWrite } from '../core/projects.js'
import { addTask, updateTask } from '../core/tasks.js'
import { addMilestone, updateMilestone } from '../core/milestones.js'
import { addDeliverable, updateDeliverable } from '../core/deliverables.js'
import { pmDomainSpec, reflectionRecordSchema, type PmDomain, type ReflectionRecord } from '../core/storage.js'

const events = ['milestone-achieved', 'deliverable-accepted'] as const
const material = '# 独立复验材料\n\n- 独立核对：前后  两处空格\n- 待核：签收人\n- 待补：签字扫描件\n---'
const expectedLines = [
  { text: '独立核对：前后  两处空格', mark: 'known' },
  { text: '待核：签收人', mark: 'pending' },
  { text: '待补：签字扫描件', mark: 'blank' },
]
type Hashes = Record<string, string>
function inventory(root: string, prefix = ''): Hashes {
  const result: Hashes = {}
  for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) Object.assign(result, inventory(root, path))
    else result[path] = createHash('sha256').update(readFileSync(join(root, path))).digest('hex')
  }
  return result
}
function changes(a: Hashes, b: Hashes) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(p => a[p] !== b[p]).sort()
}
function payload(text: string) {
  const start = text.indexOf('```json\n')
  const end = text.lastIndexOf('\n```')
  assert.ok(start >= 0 && end > start, '真实命令须返回完整JSON')
  return JSON.parse(text.slice(start + '```json\n'.length, end))
}
const reflectedFile = (id: string) => `pmtool/reflections/${id}.json`

describe('P1L2-F01 独立生产handler/真实storage', () => {
  let root: string
  let facility: DomainFacility
  let domain: PmDomain
  let projectId: string
  let milestoneId: string
  let deliverableId: string
  let todoId: string
  let doneId: string
  let old: ReflectionRecord
  let records: ReflectionRecord[]
  let baseline: Hashes
  let actions: unknown[]

  function disk(id: string): ReflectionRecord {
    const data = JSON.parse(readFileSync(join(root, reflectedFile(id)), 'utf8'))
    assert.equal(data.version, 2)
    const parsed = reflectionRecordSchema.parse(data.record)
    assert.deepEqual(parsed, data.record)
    return data.record
  }
  async function command(argument: string, kind = 'success', changedFiles: string[] = []) {
    const before = inventory(root)
    const response = await handleReflectCommand(argument, domain)
    const after = inventory(root)
    actions.push({ argument, response, before, after, changedFiles: changes(before, after) })
    assert.equal(response.kind, kind, response.text)
    assert.deepEqual(changes(before, after), changedFiles.sort(), `写边界：${argument}`)
    return response.text
  }
  async function reopen() {
    const before = inventory(root)
    await facility.closeAll()
    domain = await facility.open(pmDomainSpec)
    actions.push({ reopen: true, before, after: inventory(root) })
    assert.deepEqual(inventory(root), before)
  }
  async function barrier() { await enqueueDomainWrite(domain, async () => {}) }
  function stable(before: ReflectionRecord, after: ReflectionRecord) {
    const fields = ['id', 'projectId', 'taskId', 'milestoneId', 'deliverableId', 'sourceEvent', 'createdAt'] as const
    for (const field of fields) assert.deepEqual(after[field], before[field], `稳定字段 ${field}`)
    assert.equal(after.draft.title, before.draft.title)
    assert.equal(after.draft.at, before.draft.at)
  }
  function view(text: string, record: ReflectionRecord) {
    const sourceId = record.sourceEvent === 'task-done' ? record.taskId
      : record.sourceEvent === 'milestone-achieved' ? record.milestoneId : record.deliverableId
    assert.deepEqual(payload(text), record)
    for (const token of [record.id, record.projectId, record.sourceEvent, sourceId!, record.draft.title, record.draft.at]) {
      assert.ok(text.includes(token), `完整正文缺少 ${token}`)
    }
    assert.ok(text.includes(`来源 ID（sourceId）：${sourceId}`))
    for (const line of record.draft.lines) assert.ok(text.includes(line.text))
    for (const gap of record.draft.gaps) assert.ok(text.includes(gap))
    assert.ok(!text.includes('任务 ID：undefined'))
  }

  beforeEach(async () => {
    assert.ok(process.env.SOURCE_AUTO_ROOT, '必须在自有/tmp执行')
    root = mkdtempSync(join(process.env.SOURCE_AUTO_ROOT!, 'expert-'))
    actions = []
    const ctx = new Context()
    await ctx.plugin(Storage)
    ctx.storage.backend.register('json', new JsonStorageBackend(root))
    facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
    ctx.storage.mount('domain', facility)
    domain = await facility.open(pmDomainSpec)
    projectId = (await addProject(domain, {
      name: '独立反思入口项目', startDate: '2026-10-01', targetDate: '2026-12-31',
    })).id
    milestoneId = (await addMilestone(domain, {
      projectId, title: '独立里程碑', targetDate: '2026-12-01', description: '独立验收标准',
    })).id
    deliverableId = (await addDeliverable(domain, {
      projectId, name: '独立材料', version: 'r1', location: 'exports/independent.md',
    })).id
    todoId = (await addTask(domain, {
      projectId, title: '关联且未完成', milestoneId, deliverableId,
      description: '只保留旧事实', evidenceUrl: 'https://example.com/independent-evidence',
    })).id
    doneId = (await addTask(domain, {
      projectId, title: '旧完成事件', milestoneId, deliverableId, description: '旧反思不得被抢占',
    })).id
    await updateTask(domain, doneId, { status: 'done', progress: 100, completedDate: '2026-10-22' })
    await updateMilestone(domain, milestoneId, { status: 'achieved', achievedDate: '2026-10-22' })
    await updateDeliverable(domain, deliverableId, { status: 'accepted', changeNote: '独立业务验收' })
    await barrier()
    records = [...domain.table('reflections').entries()].map(([, rec]) => rec as ReflectionRecord)
    assert.equal(records.length, 3, '只能正常事件生成，不seed反思')
    old = records.find(r => r.sourceEvent === 'task-done')!
    assert.equal(old.taskId, doneId)
    for (const event of events) {
      const rec = records.find(r => r.sourceEvent === event)!
      assert.ok(rec, event)
      assert.equal(Object.hasOwn(rec, 'taskId'), false)
      assert.equal(rec.status, 'draft', '业务完成不代表人定稿')
      assert.ok(rec.draft.lines.some(l => l.text.includes(todoId) && l.mark === 'pending'))
      assert.ok(rec.draft.gaps.some(g => g.includes(todoId)))
      assert.deepEqual(disk(rec.id), rec)
    }
    assert.equal(domain.table('tasks').get(todoId)?.status, 'todo')
    baseline = inventory(root)
    actions.push({ fixture: { projectId, milestoneId, deliverableId, todoId, doneId, records }, baseline })
  })

  afterEach(async () => {
    await facility?.closeAll()
    if (root) {
      const final = inventory(root)
      const raw = Object.keys(final).filter(p => p.endsWith('.json'))
        .map(path => ({ path, text: readFileSync(join(root, path), 'utf8'), mode: statSync(join(root, path)).mode & 0o777 }))
      writeFileSync(`${root}.source-auto.json`, JSON.stringify({ root, actions, final, raw }, null, 2), { flag: 'wx' })
      console.log(`SOURCE_AUTO_FIXTURE=${root}`)
    }
  })

  for (const event of events) {
    it(`${event} 按真实ID完整查看，list来源派生且不写库`, async () => {
      const rec = records.find(r => r.sourceEvent === event)!
      view(await command(rec.id), rec)
      const rows = payload(await command(`list ${projectId}`))
      assert.equal(rows.length, 3)
      const row = rows.find((r: { id: string }) => r.id === rec.id)
      assert.equal(row.sourceEvent, event)
      assert.equal(row.sourceId, event === 'milestone-achieved' ? milestoneId : deliverableId)
      assert.equal(Object.hasOwn(disk(rec.id), 'sourceId'), false, 'sourceId仅展示不迁移')
      assert.deepEqual(inventory(root), baseline)
    })
    it(`${event} 显式edit/final/repeat/reopen且逐步仅写本目标`, async () => {
      const initial = records.find(r => r.sourceEvent === event)!
      const editedText = await command(`${initial.id} edit "${material}"`, 'success', [reflectedFile(initial.id)])
      const edited = payload(editedText) as ReflectionRecord
      view(editedText, edited)
      assert.equal(edited.status, 'draft')
      assert.deepEqual(edited.draft.lines, expectedLines)
      assert.deepEqual(edited.draft.gaps, ['待补：签字扫描件'])
      stable(initial, edited)
      assert.deepEqual(disk(initial.id), edited)
      const finalText = await command(`${initial.id} final`, 'success', [reflectedFile(initial.id)])
      const final = payload(finalText) as ReflectionRecord
      assert.deepEqual(final, { ...edited, status: 'final', updatedAt: final.updatedAt })
      stable(initial, final)
      assert.deepEqual(disk(initial.id), final)
      assert.deepEqual(payload(await command(`${initial.id} final`)), final)
      await reopen()
      view(await command(initial.id), final)
      assert.deepEqual(changes(baseline, inventory(root)), [reflectedFile(initial.id)])
      assert.deepEqual(disk(old.id), old)
      assert.equal(domain.table('tasks').get(todoId)?.status, 'todo')
    })
  }

  it('同库两事件依次人工命令定稿，后一条保前一条和旧记录字节', async () => {
    for (const event of events) {
      const rec = records.find(r => r.sourceEvent === event)!
      view(await command(rec.id), rec)
      await command(`${rec.id} edit "${material}"`, 'success', [reflectedFile(rec.id)])
      await command(`${rec.id} final`, 'success', [reflectedFile(rec.id)])
      await command(`${rec.id} final`)
      await reopen()
      assert.equal(payload(await command(rec.id)).status, 'final')
    }
    assert.deepEqual(changes(baseline, inventory(root)),
      records.filter(r => r.sourceEvent !== 'task-done').map(r => reflectedFile(r.id)).sort())
    view(await command(doneId), old)
    assert.equal(domain.table('tasks').get(todoId)?.status, 'todo')
  })

  it('旧taskId精确旧task-done，edit/final兼容，final后edit状态提示真实', async () => {
    view(await command(doneId), old)
    view(await command(old.id), old)
    const list = payload(await command(`list ${projectId}`))
    const row = list.find((r: { id: string }) => r.id === old.id)
    assert.equal(row.sourceId, doneId)
    assert.equal(row.sourceEvent, 'task-done')
    await command(`${doneId} edit "${material}"`, 'success', [reflectedFile(old.id)])
    assert.equal(disk(old.id).status, 'draft')
    await command(`${doneId} final`, 'success', [reflectedFile(old.id)])
    await command(`${doneId} final`)
    const text = await command(`${doneId} edit '已核：定稿后补记'`, 'success', [reflectedFile(old.id)])
    assert.equal(payload(text).status, 'final')
    assert.ok(text.includes('保持已定稿'))
    assert.ok(!text.includes('仍为 draft'))
    stable(old, disk(old.id))
    await reopen()
    assert.equal(payload(await command(doneId)).status, 'final')
    assert.deepEqual(changes(baseline, inventory(root)), [reflectedFile(old.id)])
  })

  it('未知ID/坏ID/事件实体ID/空edit/无草稿/不支持操作明确error且零写', async () => {
    const id = records.find(r => r.sourceEvent === 'milestone-achieved')!.id
    const rejected = [
      'ref-missing', 'ref-missing final', 'ref-missing edit "独立材料"',
      'ref-../../outside final', 'not-an-id', 't-9999', 't-9999 final',
      `${milestoneId} final`, `${deliverableId} edit "独立材料"`,
      `${id} edit`, `${id} edit ""`, `${id} edit '   '`, `${id} edit "\n \n"`,
      `${id} unknown`, `${todoId} final`, `${todoId} edit "独立材料"`, 'list p-9999', 'list',
    ]
    for (const argument of rejected) await command(argument, 'error')
    assert.ok((await command(todoId)).includes('暂无复盘草稿'))
    assert.deepEqual(inventory(root), baseline)
  })

  it('项目缺失负例：真实临时域删项目后所有入口拒绝，反思不被写', async () => {
    await domain.table('projects').delete(projectId)
    actions.push({ negativeFixture: '仅删临时项目，不seed反思', projectId })
    const before = inventory(root)
    for (const id of [...records.map(r => r.id), doneId]) {
      for (const verb of ['', ' final', ' edit "独立材料"']) {
        const text = await command(`${id}${verb}`, 'error')
        assert.ok(text.includes(`未找到项目：${projectId}`))
      }
    }
    await command(`list ${projectId}`, 'error')
    assert.deepEqual(inventory(root), before)
  })

  it('help/空入口/无存储守卫只读，JSON最小权限', async () => {
    const text = await command('help')
    for (const token of ['<任务ID|反思ID>', ...events, 'edit', 'final']) assert.ok(text.includes(token))
    await command('')
    assert.deepEqual(await handleReflectCommand(records[0].id, undefined), { kind: 'error', text: '项目存储未就绪。' })
    assert.equal(statSync(root).mode & 0o777, 0o700)
    for (const path of Object.keys(inventory(root))) assert.equal(statSync(join(root, path)).mode & 0o777, 0o600, path)
    assert.deepEqual(inventory(root), baseline)
  })

  it('同状态重复与退回重进保持draft/final反思幂等，业务保存另计', async () => {
    const rec = records.find(r => r.sourceEvent === 'deliverable-accepted')!
    await command(`${rec.id} final`, 'success', [reflectedFile(rec.id)])
    const before = inventory(root)
    await updateMilestone(domain, milestoneId, { status: 'achieved' })
    await updateDeliverable(domain, deliverableId, { status: 'accepted' })
    await updateMilestone(domain, milestoneId, { status: 'planned', achievedDate: null })
    await updateDeliverable(domain, deliverableId, { status: 'planned' })
    await updateMilestone(domain, milestoneId, { status: 'achieved', achievedDate: '2026-10-22' })
    await updateDeliverable(domain, deliverableId, { status: 'accepted' })
    await barrier()
    const after = inventory(root)
    assert.ok(changes(before, after).every(p => p === `pmtool/milestones/${milestoneId}.json`
      || p === `pmtool/deliverables/${deliverableId}.json`))
    assert.equal([...domain.table('reflections').entries()].length, 3)
    assert.equal(disk(rec.id).status, 'final')
    actions.push({ businessRepeat: true, before, after, changedFiles: changes(before, after) })
  })
})
