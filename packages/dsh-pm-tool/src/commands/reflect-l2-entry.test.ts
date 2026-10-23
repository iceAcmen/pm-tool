import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { handleReflectCommand } from './reflect.js'
import { addProject, enqueueDomainWrite } from '../core/projects.js'
import { addTask, getTask, updateTask } from '../core/tasks.js'
import { addMilestone, updateMilestone } from '../core/milestones.js'
import { addDeliverable, updateDeliverable } from '../core/deliverables.js'
import { getReflection, listReflections } from '../core/reflect.js'
import { pmDomainSpec, type PmDomain, type ReflectionRecord } from '../core/storage.js'

type Event = 'milestone-achieved' | 'deliverable-accepted'
type Snapshot = Record<string, string>
const events: Event[] = ['milestone-achieved', 'deliverable-accepted']
const markdown = '# 人工补充材料\n\n- 已核事实：文档  已复核\n- 待核：签字日期\n- 待补：验收截图\n---'
const editedLines = [
  { text: '已核事实：文档  已复核', mark: 'known' },
  { text: '待核：签字日期', mark: 'pending' },
  { text: '待补：验收截图', mark: 'blank' },
]

function snapshot(root: string, prefix = ''): Snapshot {
  return Object.fromEntries(readdirSync(join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    return entry.isDirectory()
      ? Object.entries(snapshot(root, path))
      : [[path, createHash('sha256').update(readFileSync(join(root, path))).digest('hex')]]
  }))
}

function changed(before: Snapshot, after: Snapshot): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(path => before[path] !== after[path]).sort()
}

function jsonBody<T>(text: string): T {
  const match = /```json\n([\s\S]*?)\n```/.exec(text)
  expect(match, '命令须返回真实 JSON 正文').not.toBeNull()
  return JSON.parse(match![1]) as T
}

describe('P1L2-F01 真实命令入口与临时 JSON 存储', () => {
  let domain: PmDomain
  let facility: DomainFacility
  let root: string
  let projectId: string
  let linkedTaskId: string
  let doneTaskId: string
  let milestoneId: string
  let deliverableId: string
  let oldDone: ReflectionRecord
  let records: Record<Event, ReflectionRecord>
  let initial: Snapshot
  let actions: unknown[]

  async function run(argument: string, kind: 'success' | 'error' = 'success'): Promise<string> {
    const before = snapshot(root)
    try {
      const result = await handleReflectCommand(argument, domain)
      actions.push({ argument, result, delta: changed(before, snapshot(root)) })
      expect(result.kind, result.text).toBe(kind)
      return result.text
    } catch (error) {
      actions.push({ argument, thrown: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async function drain(): Promise<void> {
    // 正常 update 在写队列外调用 ensure；紧接的队列屏障等待真实钩子落盘，不伪造成功记录。
    await enqueueDomainWrite(domain, async () => {})
  }

  function recordFile(id: string): string {
    return `pmtool/reflections/${id}.json`
  }

  function diskRecord(id: string): ReflectionRecord {
    const envelope = JSON.parse(readFileSync(join(root, recordFile(id)), 'utf8'))
    expect(envelope.version).toBe(2)
    return envelope.record as ReflectionRecord
  }

  async function reload(): Promise<void> {
    await facility.closeAll()
    domain = await facility.open(pmDomainSpec)
  }

  beforeEach(async () => {
    const base = process.env.P1005_JSON_ROOT ?? tmpdir()
    mkdirSync(base, { recursive: true })
    root = mkdtempSync(join(base, 'p1005-json-'))
    actions = []
    const ctx = new Context()
    await ctx.plugin(Storage)
    ctx.storage.backend.register('json', new JsonStorageBackend(root))
    facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
    ctx.storage.mount('domain', facility)
    domain = await facility.open(pmDomainSpec)
    const project = await addProject(domain, {
      name: 'P1005 事件入口临时项目', startDate: '2026-10-01', targetDate: '2026-12-31',
    })
    projectId = project.id
    const milestone = await addMilestone(domain, {
      projectId, title: '入口联调', targetDate: '2026-12-31', description: '保留原达成标准',
    })
    milestoneId = milestone.id
    const deliverable = await addDeliverable(domain, {
      projectId, name: '验收材料', version: 'v1', location: 'exports/report.md',
    })
    deliverableId = deliverable.id
    const linked = await addTask(domain, {
      projectId, title: '关联任务尚未完成', milestoneId, deliverableId,
      description: '原任务说明', evidenceUrl: 'https://example.com/old-evidence',
    })
    linkedTaskId = linked.id
    const done = await addTask(domain, {
      projectId, title: '旧 task-done', milestoneId, deliverableId,
      description: '原完成记录说明', evidenceUrl: 'https://example.com/done-evidence',
    })
    doneTaskId = done.id
    await updateTask(domain, doneTaskId, { status: 'done', progress: 100, completedDate: '2026-10-22' })
    await drain()
    oldDone = getReflection(domain, doneTaskId)!
    expect(oldDone?.sourceEvent).toBe('task-done')
    await updateMilestone(domain, milestoneId, { status: 'achieved', achievedDate: '2026-10-22' })
    await updateDeliverable(domain, deliverableId, { status: 'accepted', changeNote: '人验收业务交付物' })
    await drain()
    const all = listReflections(domain, projectId)
    expect(all).toHaveLength(3)
    records = Object.fromEntries(events.map(event => [event, all.find(rec => rec.sourceEvent === event)!])) as Record<Event, ReflectionRecord>
    for (const event of events) {
      const rec = records[event]
      expect(rec?.taskId).toBeUndefined()
      expect(rec?.status).toBe('draft')
      expect(rec?.draft.lines.some(line => line.mark === 'pending' && line.text.includes(linkedTaskId))).toBe(true)
      expect(rec?.draft.gaps.some(gap => gap.includes(linkedTaskId))).toBe(true)
      expect(diskRecord(rec.id)).toEqual(rec)
    }
    expect(getTask(domain, linkedTaskId)?.status).toBe('todo')
    initial = snapshot(root)
    actions.push({ fixture: { projectId, linkedTaskId, doneTaskId, milestoneId, deliverableId, oldDone, records }, initial })
  })

  afterEach(async () => {
    try {
      await facility?.closeAll()
    } finally {
      if (root) {
        // 证据写在数据根之外；失败红与成功绿均保留，不清临时业务字节。
        writeFileSync(`${root}.audit.json`, JSON.stringify({ root, actions, final: snapshot(root) }, null, 2))
        console.log(`P1005_FIXTURE=${root}`)
      }
    }
  })

  it.each(events)('%s 完整查看：按真实反思 ID 命中并展示来源，读操作零写', async event => {
    const rec = records[event]
    const sourceId = event === 'milestone-achieved' ? milestoneId : deliverableId
    const text = await run(rec.id)
    expect(text).toContain(`sourceEvent）：${event}`)
    expect(text).toContain(`sourceId）：${sourceId}`)
    expect(text).not.toContain('任务 ID：undefined')
    expect(jsonBody<ReflectionRecord>(text)).toEqual(rec)
    expect(snapshot(root)).toEqual(initial)
  })

  it.each(events)('%s 人 edit → final → repeat → reload，只更写指定记录', async event => {
    const rec = records[event]
    const beforeEdit = snapshot(root)
    const editText = await run(`${rec.id} edit "${markdown}"`)
    const edited = jsonBody<ReflectionRecord>(editText)
    expect(edited.status).toBe('draft')
    expect(edited.draft.lines).toEqual(editedLines)
    expect(edited.draft.gaps).toEqual(['待补：验收截图'])
    expect({ ...edited, updatedAt: rec.updatedAt, draft: rec.draft }).toEqual(rec)
    expect(edited.draft.title).toBe(rec.draft.title)
    expect(edited.draft.at).toBe(rec.draft.at)
    expect(edited.taskId).toBeUndefined()
    expect(changed(beforeEdit, snapshot(root))).toEqual([recordFile(rec.id)])
    expect(diskRecord(rec.id)).toEqual(edited)

    const beforeFinal = snapshot(root)
    const finalText = await run(`${rec.id} final`)
    const finalized = jsonBody<ReflectionRecord>(finalText)
    expect(finalized).toEqual({ ...edited, status: 'final', updatedAt: finalized.updatedAt })
    expect(changed(beforeFinal, snapshot(root))).toEqual([recordFile(rec.id)])
    expect(diskRecord(rec.id)).toEqual(finalized)
    const afterFinal = snapshot(root)
    expect(jsonBody<ReflectionRecord>(await run(`${rec.id} final`))).toEqual(finalized)
    expect(snapshot(root)).toEqual(afterFinal)
    await reload()
    expect(jsonBody<ReflectionRecord>(await run(rec.id))).toEqual(finalized)
    expect(snapshot(root)).toEqual(afterFinal)
    expect(diskRecord(oldDone.id)).toEqual(oldDone)
    expect(getReflection(domain, doneTaskId)).toEqual(oldDone)
    expect(getTask(domain, linkedTaskId)?.status).toBe('todo')
    expect(changed(initial, snapshot(root))).toEqual([recordFile(rec.id)])
  })

  it('两事件同库依次查看/edit/final/repeat/reload，第二事件不改第一事件定稿字节', async () => {
    const finalized: ReflectionRecord[] = []
    for (const event of events) {
      const rec = records[event]
      const before = snapshot(root)
      expect(jsonBody<ReflectionRecord>(await run(rec.id))).toEqual(rec)
      await run(`${rec.id} edit "${markdown}"`)
      const final = jsonBody<ReflectionRecord>(await run(`${rec.id} final`))
      expect(final.status).toBe('final')
      expect(final.draft.lines).toEqual(editedLines)
      expect(final.draft.gaps).toEqual(['待补：验收截图'])
      expect({ ...final, status: rec.status, updatedAt: rec.updatedAt, draft: rec.draft }).toEqual(rec)
      expect(final.draft.title).toBe(rec.draft.title)
      expect(final.draft.at).toBe(rec.draft.at)
      expect(changed(before, snapshot(root))).toEqual([recordFile(rec.id)])
      const after = snapshot(root)
      expect(jsonBody<ReflectionRecord>(await run(`${rec.id} final`))).toEqual(final)
      await reload()
      expect(jsonBody<ReflectionRecord>(await run(rec.id))).toEqual(final)
      for (const previous of finalized) expect(diskRecord(previous.id)).toEqual(previous)
      expect(snapshot(root)).toEqual(after)
      finalized.push(final)
    }
    expect(changed(initial, snapshot(root))).toEqual(events.map(event => recordFile(records[event].id)).sort())
    expect(jsonBody<ReflectionRecord>(await run(doneTaskId))).toEqual(oldDone)
    expect(getTask(domain, linkedTaskId)?.status).toBe('todo')
  })

  it('list 摘要列出真实来源字段，旧 taskId 查看仍命中旧 task-done', async () => {
    const list = jsonBody<Array<ReflectionRecord & { sourceId: string }>>(await run(`list ${projectId}`))
    expect(list).toHaveLength(3)
    for (const event of events) {
      const rec = records[event]
      const row = list.find(row => row.id === rec.id)
      expect(row).toMatchObject({
        sourceEvent: event, sourceId: event === 'milestone-achieved' ? milestoneId : deliverableId,
      })
      expect(row?.milestoneId).toBe(rec.milestoneId)
      expect(row?.deliverableId).toBe(rec.deliverableId)
    }
    expect(list.find(row => row.id === oldDone.id)).toMatchObject({
      taskId: doneTaskId, sourceEvent: 'task-done', sourceId: doneTaskId,
    })
    expect(jsonBody<ReflectionRecord>(await run(doneTaskId))).toEqual(oldDone)
    expect(jsonBody<ReflectionRecord>(await run(oldDone.id))).toEqual(oldDone)
    await reload()
    expect(jsonBody<ReflectionRecord>(await run(doneTaskId))).toEqual(oldDone)
    expect(snapshot(root)).toEqual(initial)
  })

  it('旧 taskId edit/final 兼容，final 后 edit 不回退状态且提示真实', async () => {
    const edited = jsonBody<ReflectionRecord>(await run(`${doneTaskId} edit "${markdown}"`))
    expect(edited.status).toBe('draft')
    expect(edited.draft.lines).toEqual(editedLines)
    await run(`${doneTaskId} final`)
    const beforeRepeat = snapshot(root)
    await run(`${doneTaskId} final`)
    expect(snapshot(root)).toEqual(beforeRepeat)
    const text = await run(`${doneTaskId} edit "已核：补入定稿材料"`)
    expect(jsonBody<ReflectionRecord>(text).status).toBe('final')
    expect(text).not.toContain('仍为 draft')
    expect(text).toContain('已定稿')
    expect(changed(initial, snapshot(root))).toEqual([recordFile(oldDone.id)])
    for (const event of events) expect(diskRecord(records[event].id)).toEqual(records[event])
  })

  it('同状态业务重复及重新进入事件仍幂等，不增改 draft/final 反思', async () => {
    const rec = records['milestone-achieved']
    await run(`${rec.id} final`)
    const reflectionHashes = Object.fromEntries(Object.entries(snapshot(root)).filter(([path]) => path.includes('/reflections/')))
    await updateMilestone(domain, milestoneId, { status: 'achieved' })
    await updateDeliverable(domain, deliverableId, { status: 'accepted' })
    await drain()
    await updateMilestone(domain, milestoneId, { status: 'planned', achievedDate: null })
    await updateDeliverable(domain, deliverableId, { status: 'planned' })
    await updateMilestone(domain, milestoneId, { status: 'achieved', achievedDate: '2026-10-22' })
    await updateDeliverable(domain, deliverableId, { status: 'accepted' })
    await drain()
    expect(listReflections(domain, projectId)).toHaveLength(3)
    expect(Object.fromEntries(Object.entries(snapshot(root)).filter(([path]) => path.includes('/reflections/')))).toEqual(reflectionHashes)
    expect(diskRecord(oldDone.id)).toEqual(oldDone)
  })

  it('未知/坏 ID、空编辑、未知动词及无草稿任务写操作真实拒绝零写', async () => {
    const rec = records['milestone-achieved']
    const argumentsToReject = [
      'ref-does-not-exist', 'ref-does-not-exist edit "材料"', 'ref-does-not-exist final',
      'ref-../../bad final', 'garbage', 'm-0001 final', 'dlv-0001 edit "材料"',
      't-9999', 't-9999 final', 't-9999 edit "材料"',
      `${rec.id} edit`, `${rec.id} edit ""`, `${rec.id} edit "   "`, `${rec.id} unsupported`,
      `${linkedTaskId} edit "材料"`, `${linkedTaskId} final`, 'list p-9999',
    ]
    for (const argument of argumentsToReject) {
      await run(argument, 'error')
      expect(snapshot(root), argument).toEqual(initial)
    }
    const text = await run(linkedTaskId)
    expect(text).toContain('暂无复盘草稿')
    expect(snapshot(root)).toEqual(initial)
  })

  it('目标所属项目不存在：事件及旧 taskId view/edit/final 拒绝零写', async () => {
    // 仅负例移除临时项目；成功事件全部已由正常 update 钩子创建，不 seed 成功反思。
    await domain.table('projects').delete(projectId)
    const before = snapshot(root)
    for (const id of [records['milestone-achieved'].id, records['deliverable-accepted'].id, oldDone.id, doneTaskId]) {
      for (const verb of ['', ' final', ' edit "材料"']) {
        const text = await run(`${id}${verb}`, 'error')
        expect(text).toContain(`未找到项目：${projectId}`)
        expect(snapshot(root)).toEqual(before)
      }
    }
    await run(`list ${projectId}`, 'error')
    expect(snapshot(root)).toEqual(before)
  })

  it('帮助说明既有 taskId 与新增反思 ID 入口，未就绪仍返回 error', async () => {
    const text = await run('help')
    expect(text).toContain('<任务ID|反思ID>')
    expect(text).toContain('milestone-achieved')
    expect(text).toContain('deliverable-accepted')
    expect(await handleReflectCommand(records['milestone-achieved'].id, undefined)).toEqual({
      kind: 'error', text: '项目存储未就绪。',
    })
    expect(snapshot(root)).toEqual(initial)
  })
})
