import { describe, it, expect } from 'vitest'
import {
  buildReviewMaterials,
  renderReviewMarkdown,
  type ReviewInputMilestone,
  type ReviewInputReflection,
  type ReviewInputTask,
} from './review-materials.js'

// P2 X5：述职素材只读聚合纯函数单测（零 I/O、零墙钟；today 注入）。

const TODAY = '2026-10-18'

const task = (over: Partial<ReviewInputTask> & { id: string, title: string, status: string }): ReviewInputTask => ({
  projectId: 'p-1',
  progress: 100,
  dueDate: null,
  ...over,
})

const milestone = (over: Partial<ReviewInputMilestone> & { id: string, title: string, status: string }): ReviewInputMilestone => ({
  projectId: 'p-1',
  achievedDate: null,
  ...over,
})

const reflection = (over: Partial<ReviewInputReflection> & { id: string }): ReviewInputReflection => ({
  projectId: 'p-1',
  status: 'draft',
  sourceEvent: 'task-done',
  draft: {
    title: '复盘草稿',
    at: '2026-10-10T09:00:00.000Z',
    lines: [{ text: '已核结论', mark: 'known' }],
  },
  ...over,
})

describe('buildReviewMaterials 周期过滤与收录口径', () => {
  it('周期内 done 任务收录为正式完成，wrapped 收录但 done=false 且不计完成数', () => {
    const m = buildReviewMaterials({
      projectId: 'p-1',
      today: TODAY,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-18',
      tasks: [
        task({ id: 't-done', title: '完成任务', status: 'done', completedDate: '2026-10-05', progress: 100, evidenceUrl: 'https://e/x' }),
        task({ id: 't-wrap', title: '收尾任务', status: 'wrapped', updatedAt: '2026-10-06T00:00:00.000Z' }),
      ],
      milestones: [],
      reflections: [],
    })
    expect(m.tasks.map(t => [t.id, t.kind, t.done])).toEqual([
      ['t-done', 'done', true],
      ['t-wrap', 'wrapped', false],
    ])
    expect(m.counts.doneTasks).toBe(1)
    expect(m.counts.wrappedTasks).toBe(1)
    expect(m.counts.avgDoneProgress).toBe(100)
    const done = m.tasks.find(t => t.id === 't-done')!
    expect(done.evidence).toBe('https://e/x')
  })

  it('周期外条目剔除：done 看 completedDate，wrapped 看 updatedAt 日期', () => {
    const m = buildReviewMaterials({
      projectId: 'p-1',
      today: TODAY,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-18',
      tasks: [
        task({ id: 't-out-done', title: '周期外完成', status: 'done', completedDate: '2026-09-20' }),
        task({ id: 't-out-wrap', title: '周期外收尾', status: 'wrapped', updatedAt: '2026-09-21T00:00:00.000Z' }),
        task({ id: 't-open', title: '进行中', status: 'in_progress', updatedAt: '2026-10-10T00:00:00.000Z' }),
      ],
      milestones: [],
      reflections: [],
    })
    expect(m.tasks).toEqual([])
  })

  it('里程碑仅收录周期内 achieved，planned/at_risk/missed 剔除', () => {
    const m = buildReviewMaterials({
      projectId: 'p-1',
      today: TODAY,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-18',
      tasks: [],
      milestones: [
        milestone({ id: 'm-1', title: '已达成', status: 'achieved', achievedDate: '2026-10-08' }),
        milestone({ id: 'm-2', title: '周期外达成', status: 'achieved', achievedDate: '2026-09-01' }),
        milestone({ id: 'm-3', title: '计划中', status: 'planned', targetDate: '2026-11-01' }),
      ],
      reflections: [],
    })
    expect(m.milestones.map(x => x.id)).toEqual(['m-1'])
    expect(m.milestones[0]).toMatchObject({ achieved: true, actualDate: '2026-10-08' })
    expect(m.counts.achievedMilestones).toBe(1)
  })

  it('复盘仅收录 known 行，pending/blank 剔除；周期外草稿剔除', () => {
    const m = buildReviewMaterials({
      projectId: 'p-1',
      today: TODAY,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-18',
      tasks: [],
      milestones: [],
      reflections: [
        reflection({
          id: 'r-1',
          draft: {
            title: '本周期复盘',
            at: '2026-10-10T09:00:00.000Z',
            lines: [
              { text: '已核 A', mark: 'known' },
              { text: '待核 B', mark: 'pending' },
              { text: '留白 C', mark: 'blank' },
            ],
          },
        }),
        reflection({
          id: 'r-2',
          draft: { title: '周期外复盘', at: '2026-09-10T09:00:00.000Z', lines: [{ text: '旧结论', mark: 'known' }] },
        }),
      ],
    })
    expect(m.reflections.map(r => r.id)).toEqual(['r-1'])
    expect(m.reflections[0].knownLines).toEqual(['已核 A'])
    expect(m.counts.reflectionKnownLines).toBe(1)
  })

  it('跨项目条目一律剔除', () => {
    const m = buildReviewMaterials({
      projectId: 'p-1',
      today: TODAY,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-18',
      tasks: [task({ id: 't-x', title: '别项目完成', status: 'done', projectId: 'p-2', completedDate: '2026-10-05' })],
      milestones: [milestone({ id: 'm-x', title: '别项目里程碑', status: 'achieved', projectId: 'p-2', achievedDate: '2026-10-05' })],
      reflections: [reflection({ id: 'r-x', projectId: 'p-2' })],
    })
    expect(m.tasks).toEqual([])
    expect(m.milestones).toEqual([])
    expect(m.reflections).toEqual([])
  })

  it('未传周期时默认近 30 天滚动窗；无 done 条目时 avgDoneProgress 为 null', () => {
    const m = buildReviewMaterials({
      projectId: 'p-1',
      today: TODAY,
      tasks: [task({ id: 't-wrap', title: '收尾', status: 'wrapped', updatedAt: '2026-10-10T00:00:00.000Z' })],
      milestones: [],
      reflections: [],
    })
    expect(m.period).toEqual({ start: '2026-09-19', end: '2026-10-18' })
    expect(m.counts.avgDoneProgress).toBeNull()
    expect(m.counts.doneTasks).toBe(0)
    expect(m.counts.wrappedTasks).toBe(1)
  })

  it('平均进度按 done 条目算术平均', () => {
    const m = buildReviewMaterials({
      projectId: 'p-1',
      today: TODAY,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-18',
      tasks: [
        task({ id: 'a', title: 'A', status: 'done', completedDate: '2026-10-05', progress: 80 }),
        task({ id: 'b', title: 'B', status: 'done', completedDate: '2026-10-06', progress: 100 }),
      ],
      milestones: [],
      reflections: [],
    })
    expect(m.counts.avgDoneProgress).toBe(90)
  })
})

describe('renderReviewMarkdown 三段结构与诚实留白', () => {
  it('含做了什么/量化结果/关键产出三段，wrapped 单列且不计完成', () => {
    const m = buildReviewMaterials({
      projectId: 'p-1',
      today: TODAY,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-18',
      tasks: [
        task({ id: 't-done', title: '完成任务', status: 'done', completedDate: '2026-10-05', progress: 100 }),
        task({ id: 't-wrap', title: '收尾任务', status: 'wrapped', updatedAt: '2026-10-06T00:00:00.000Z' }),
      ],
      milestones: [milestone({ id: 'm-1', title: '已达成', status: 'achieved', achievedDate: '2026-10-08' })],
      reflections: [reflection({ id: 'r-1', draft: { title: '复盘', at: '2026-10-10T09:00:00.000Z', lines: [{ text: '已核 A', mark: 'known' }] } })],
    })
    const md = renderReviewMarkdown(m)
    expect(md).toContain('## 一、做了什么')
    expect(md).toContain('## 二、量化结果')
    expect(md).toContain('## 三、关键产出')
    expect(md).toContain('完成任务')
    expect(md).toContain('已收尾（非正式完成，不计入完成数）')
    expect(md).toContain('收尾任务')
    expect(md).toContain('已核 A')
    expect(md).toContain('正式完成任务：1 项')
    expect(md).toContain('已收尾任务：1 项（非正式完成）')
  })

  it('空素材诚实留白，不补造成果', () => {
    const m = buildReviewMaterials({
      projectId: 'p-1',
      today: TODAY,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-18',
      tasks: [],
      milestones: [],
      reflections: [],
    })
    const md = renderReviewMarkdown(m)
    expect(md).toContain('本周期暂无正式完成的任务或已达成里程碑')
    expect(md).toContain('本周期暂无复盘已核素材或客观佐证')
    expect(md).toContain('证据不足（无完成条目）')
  })
})
