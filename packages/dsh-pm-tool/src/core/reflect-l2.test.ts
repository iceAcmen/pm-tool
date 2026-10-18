import { describe, it, expect } from 'vitest'
import {
  buildMilestoneReflectionDraft,
  buildDeliverableReflectionDraft,
  ensureReflectionOnMilestone,
  ensureReflectionOnDeliverable,
} from './reflect.js'
import type { PmDomain, ReflectionRecord } from './storage.js'
import type { Milestone } from './milestone.js'
import type { Deliverable } from './deliverable.js'
import type { Task } from './task.js'

// X6-L2 完整复盘草稿流：纯函数离线 + 内存 fake 域集成，零网络/零墙钟注入（草稿 at 用固定值）。

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

function linkedTask(over: Partial<Task> = {}): Task {
  return {
    id: 't-0001',
    projectId: 'p-0001',
    parentId: null,
    title: '联调通过',
    description: '',
    assignee: '',
    status: 'done',
    priority: 'P1',
    progress: 100,
    milestoneId: 'm-0001',
    code: '1',
    order: 1,
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
    ...over,
  } as Task
}

const MILESTONE = {
  id: 'm-0001',
  projectId: 'p-0001',
  title: '首版上线',
  targetDate: '2026-10-20',
  status: 'achieved',
  achievedDate: '2026-10-18',
  description: '完成核心链路并通过验收',
} as unknown as Milestone

const DELIVERABLE = {
  id: 'dlv-0001',
  projectId: 'p-0001',
  name: '验收报告',
  version: 'v1.0',
  owner: 'Ice',
  status: 'accepted',
  location: 'exports/验收报告.md',
  description: '客户签字版验收材料',
  dueDate: null,
  history: [],
} as unknown as Deliverable

describe('buildMilestoneReflectionDraft 里程碑达成草稿（克制、不编造）', () => {
  it('title 口径；known 行=达成日期+说明摘要', () => {
    const draft = buildMilestoneReflectionDraft(MILESTONE, [], '2026-10-18T01:02:03.000Z')
    expect(draft.title).toBe('首版上线 · 里程碑达成复盘（草稿）')
    expect(draft.lines[0]).toEqual({ text: '达成时刻 2026-10-18', mark: 'known' })
    expect(draft.lines.some(l => l.text.includes('完成核心链路') && l.mark === 'known')).toBe(true)
  })

  it('关联任务：done+证据→known；done 无证据→pending 并进 gaps；未完成→pending 并进 gaps', () => {
    const draft = buildMilestoneReflectionDraft(MILESTONE, [
      linkedTask({ id: 't-0001', title: '联调通过', status: 'done', evidenceUrl: 'https://example.com/a' }),
      linkedTask({ id: 't-0002', title: '文档收尾', status: 'done', evidenceUrl: undefined }),
      linkedTask({ id: 't-0003', title: '遗留优化', status: 'in_progress', progress: 30 }),
    ], '2026-10-18T01:02:03.000Z')
    const marks = draft.lines.map(l => [l.text, l.mark] as const)
    expect(marks.some(([t, m]) => m === 'known' && t.includes('t-0001') && t.includes('佐证'))).toBe(true)
    expect(marks.some(([t, m]) => m === 'pending' && t.includes('t-0002') && t.includes('待核'))).toBe(true)
    expect(marks.some(([t, m]) => m === 'pending' && t.includes('t-0003') && t.includes('未完成'))).toBe(true)
    expect(draft.gaps.some(g => g.includes('t-0002') && g.includes('佐证材料'))).toBe(true)
    expect(draft.gaps.some(g => g.includes('t-0003') && g.includes('尚未闭环'))).toBe(true)
  })

  it('无关联任务：留白提示由人核对覆盖范围，不编造清单', () => {
    const draft = buildMilestoneReflectionDraft(MILESTONE, [], '2026-10-18T01:02:03.000Z')
    expect(draft.gaps.some(g => g.includes('未反查到关联任务清单'))).toBe(true)
  })
})

describe('buildDeliverableReflectionDraft 交付验收草稿', () => {
  it('title 口径；known 行=验收状态+版本/存放+说明+仓库连接', () => {
    const draft = buildDeliverableReflectionDraft(
      { ...DELIVERABLE, repoUrl: 'https://example.com/repo' } as Deliverable,
      [],
      '2026-10-18T01:02:03.000Z',
    )
    expect(draft.title).toBe('验收报告 · 交付验收复盘（草稿）')
    expect(draft.lines.some(l => l.text.includes('验收状态：accepted') && l.mark === 'known')).toBe(true)
    expect(draft.lines.some(l => l.text.includes('v1.0') && l.text.includes('exports/验收报告.md'))).toBe(true)
    expect(draft.lines.some(l => l.text.includes('example.com/repo'))).toBe(true)
  })

  it('关联任务反查行 + 验收证据缺失进 gaps', () => {
    const draft = buildDeliverableReflectionDraft(DELIVERABLE, [
      linkedTask({ id: 't-0010', title: '材料整理', status: 'done', evidenceUrl: 'https://example.com/b' }),
      linkedTask({ id: 't-0011', title: '签字回收', status: 'todo', progress: 0 }),
    ], '2026-10-18T01:02:03.000Z')
    expect(draft.lines.some(l => l.text.includes('t-0010') && l.mark === 'known')).toBe(true)
    expect(draft.lines.some(l => l.text.includes('t-0011') && l.mark === 'pending')).toBe(true)
    expect(draft.gaps.some(g => g.includes('t-0011'))).toBe(true)
  })

  it('无任何证据材料：留白「待补：验收材料与证据链接」', () => {
    const draft = buildDeliverableReflectionDraft(DELIVERABLE, [], '2026-10-18T01:02:03.000Z')
    expect(draft.gaps).toContain('待补：验收材料与证据链接')
  })
})

describe('ensureReflectionOnMilestone 落库与幂等（反查任务清单）', () => {
  it('首次 achieved 建 draft（sourceEvent=milestone-achieved、milestoneId 落字段）；重复调用不重复建', async () => {
    const { domain, tables } = buildFakeDomain()
    domain.table('tasks').put('t-0001', linkedTask({ evidenceUrl: 'https://example.com/a' }))
    domain.table('tasks').put('t-0002', linkedTask({ id: 't-0002', title: '收尾', status: 'todo', progress: 0, evidenceUrl: undefined }))
    const rec = await ensureReflectionOnMilestone(domain, MILESTONE)
    expect(rec?.status).toBe('draft')
    expect(rec?.sourceEvent).toBe('milestone-achieved')
    expect(rec?.milestoneId).toBe('m-0001')
    expect(rec?.taskId).toBeUndefined()
    expect(rec?.draft.lines.some(l => l.text.includes('t-0001'))).toBe(true)
    expect(rec?.draft.gaps.some(g => g.includes('t-0002'))).toBe(true)
    expect([...tables.get('reflections')!.entries()]).toHaveLength(1)
    const again = await ensureReflectionOnMilestone(domain, MILESTONE)
    expect(again?.id).toBe(rec?.id)
    expect([...tables.get('reflections')!.entries()]).toHaveLength(1)
  })
})

describe('ensureReflectionOnDeliverable 落库与幂等（反查任务清单）', () => {
  it('首次 accepted 建 draft（sourceEvent=deliverable-accepted、deliverableId 落字段）；重复调用不重复建', async () => {
    const { domain, tables } = buildFakeDomain()
    domain.table('tasks').put('t-0010', linkedTask({ id: 't-0010', deliverableId: 'dlv-0001', evidenceUrl: 'https://example.com/b' }))
    const rec = await ensureReflectionOnDeliverable(domain, DELIVERABLE)
    expect(rec?.status).toBe('draft')
    expect(rec?.sourceEvent).toBe('deliverable-accepted')
    expect(rec?.deliverableId).toBe('dlv-0001')
    expect(rec?.taskId).toBeUndefined()
    expect(rec?.draft.lines.some(l => l.text.includes('t-0010'))).toBe(true)
    expect([...tables.get('reflections')!.entries()]).toHaveLength(1)
    const again = await ensureReflectionOnDeliverable(domain, DELIVERABLE)
    expect(again?.id).toBe(rec?.id)
    expect([...tables.get('reflections')!.entries()]).toHaveLength(1)
  })

  it('已有 final 记录时幂等返回既有记录，不新建', async () => {
    const { domain, tables } = buildFakeDomain()
    const first = await ensureReflectionOnDeliverable(domain, DELIVERABLE)
    const table = tables.get('reflections')!
    const existing = table.get(first!.id) as ReflectionRecord
    table.set(first!.id, { ...existing, status: 'final' })
    const again = await ensureReflectionOnDeliverable(domain, DELIVERABLE)
    expect(again?.status).toBe('final')
    expect(again?.id).toBe(first?.id)
    expect([...table.entries()]).toHaveLength(1)
  })
})
