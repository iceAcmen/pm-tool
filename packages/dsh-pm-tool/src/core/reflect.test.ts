import { describe, it, expect } from 'vitest'
import {
  buildReflectionDraft,
  classifyDraftMark,
  parseDraftMarkdown,
  ensureReflectionOnDone,
  finalizeReflection,
  updateReflectionDraft,
  getReflection,
  listReflections,
  ReflectionNotFoundError,
} from './reflect.js'
import type { PmDomain, ReflectionRecord } from './storage.js'
import type { Task } from './task.js'

// X6-L1 即时复盘草稿：纯函数离线 + 内存 fake 域集成，零网络/零墙钟注入（草稿 at 用固定值）。

/** 内存 fake 域：每表一个闭包 Map，get/put/entries/delete 齐备。 */
function buildFakeDomain() {
  const tables = new Map<string, Map<string, unknown>>()
  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
    const m = tables.get(name)!
    return {
      get: (k: string) => m.get(k),
      put: async (k: string, v: unknown) => { m.set(k, v) },
      entries: () => m.entries(),
      delete: (k: string) => { m.delete(k) },
    }
  }
  return { domain: { table } as unknown as PmDomain, tables }
}

function doneTask(over: Partial<Task> = {}): Task {
  return {
    id: 't-0001',
    projectId: 'p-0001',
    parentId: null,
    title: '原型评审',
    description: '',
    assignee: '',
    status: 'done',
    priority: 'P1',
    progress: 100,
    milestoneId: null,
    code: '1',
    order: 1,
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
    ...over,
  } as Task
}

describe('句级保守标注 classifyDraftMark / parseDraftMarkdown', () => {
  it('默认 known；待核/未验证 → pending；待补 → blank', () => {
    expect(classifyDraftMark('已完成联调')).toBe('known')
    expect(classifyDraftMark('结论待核')).toBe('pending')
    expect(classifyDraftMark('数据未验证')).toBe('pending')
    expect(classifyDraftMark('待补：验收截图')).toBe('blank')
  })

  it('parseDraftMarkdown 跳过空行/标题/分隔线，blank 行进 gaps', () => {
    const { lines, gaps } = parseDraftMarkdown([
      '# 复盘',
      '已完成联调并提交主干',
      '- 待补：验收截图',
      '',
      '---',
      '性能数据未验证',
    ].join('\n'))
    expect(lines.map(l => [l.text, l.mark])).toEqual([
      ['已完成联调并提交主干', 'known'],
      ['待补：验收截图', 'blank'],
      ['性能数据未验证', 'pending'],
    ])
    expect(gaps).toEqual(['待补：验收截图'])
  })
})

describe('buildReflectionDraft 初始草稿（克制、不编造）', () => {
  it('无材料任务：完成时刻 known 行 + 缺材料留白 gap', () => {
    const draft = buildReflectionDraft(doneTask(), '2026-10-18T01:02:03.000Z')
    expect(draft.title).toBe('原型评审 · 完成即时复盘（草稿）')
    expect(draft.lines[0]).toEqual({ text: '完成时刻 2026-10-18', mark: 'known' })
    expect(draft.gaps).toContain('待补：交付验收材料与证据链接')
  })

  it('completedDate 存在则如实引用；description 截断 200 字进 known 行', () => {
    const long = '说明'.repeat(120)
    const draft = buildReflectionDraft(
      doneTask({ completedDate: '2026-10-15', description: long }),
      '2026-10-18T01:02:03.000Z',
    )
    expect(draft.lines[0].text).toBe('完成时刻 2026-10-15')
    const descLine = draft.lines.find(l => l.text.startsWith('任务说明：'))!
    expect(descLine.mark).toBe('known')
    expect(descLine.text.length).toBeLessThanOrEqual('任务说明：'.length + 200 + 1)
  })

  it('有证据链接 / 关联交付物 → 各一条 known 行，且不再留白缺材料', () => {
    const draft = buildReflectionDraft(
      doneTask({ evidenceUrl: 'https://example.com/a', deliverableId: 'dlv-0001' }),
      '2026-10-18T01:02:03.000Z',
    )
    expect(draft.lines.some(l => l.text.includes('客观佐证链接'))).toBe(true)
    expect(draft.lines.some(l => l.text.includes('dlv-0001'))).toBe(true)
    expect(draft.gaps).toEqual([])
  })
})

describe('ensureReflectionOnDone 落库与幂等', () => {
  it('首次 done 自动建 draft 草稿；再次调用不重复建', async () => {
    const { domain, tables } = buildFakeDomain()
    const rec = await ensureReflectionOnDone(domain, doneTask())
    expect(rec?.status).toBe('draft')
    expect(rec?.sourceEvent).toBe('task-done')
    expect(rec?.taskId).toBe('t-0001')
    expect([...tables.get('reflections')!.entries()]).toHaveLength(1)
    const again = await ensureReflectionOnDone(domain, doneTask())
    expect(again?.id).toBe(rec?.id)
    expect([...tables.get('reflections')!.entries()]).toHaveLength(1)
  })
})

describe('finalizeReflection 人定稿 / updateReflectionDraft 补材料', () => {
  it('final：draft → final；重复 final 幂等；不存在抛 ReflectionNotFoundError', async () => {
    const { domain } = buildFakeDomain()
    const created = await ensureReflectionOnDone(domain, doneTask())
    const finalized = await finalizeReflection(domain, created!.id)
    expect(finalized?.status).toBe('final')
    const again = await finalizeReflection(domain, created!.id)
    expect(again?.status).toBe('final')
    await expect(finalizeReflection(domain, 'ref-nope')).rejects.toBeInstanceOf(ReflectionNotFoundError)
  })

  it('edit：重写 lines/gaps、保持 draft、保守标注；不改 status', async () => {
    const { domain } = buildFakeDomain()
    const created = await ensureReflectionOnDone(domain, doneTask())
    const updated = await updateReflectionDraft(domain, created!.id, [
      '联调通过',
      '性能数据待核',
      '待补：验收截图',
    ].join('\n'))
    expect(updated?.status).toBe('draft')
    expect(updated?.draft.lines.map(l => l.mark)).toEqual(['known', 'pending', 'blank'])
    expect(updated?.draft.gaps).toEqual(['待补：验收截图'])
  })

  it('getReflection 按任务取最新；listReflections 按项目过滤并升序', async () => {
    const { domain } = buildFakeDomain()
    const a = await ensureReflectionOnDone(domain, doneTask({ id: 't-0001', title: '甲' }))
    await ensureReflectionOnDone(domain, doneTask({ id: 't-0002', title: '乙', projectId: 'p-0002' }))
    expect(getReflection(domain, 't-0001')?.id).toBe(a?.id)
    const list = listReflections(domain, 'p-0001')
    expect(list).toHaveLength(1)
    expect(list[0].taskId).toBe('t-0001')
  })
})
