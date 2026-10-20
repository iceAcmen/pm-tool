import { describe, it, expect } from 'vitest'
import {
  localPeriodType,
  buildLocalPreview,
  freezeSelection,
  isFrozenFor,
  type LocalPreviewInput,
} from './records-preview.js'

const baseInput: LocalPreviewInput = {
  periodStart: '2026-10-12',
  periodEnd: '2026-10-18',
  today: '2026-10-20',
  tasks: [
    { id: 't-1', title: '页面A', assignee: '陈屿', status: 'done', progress: 100, dueDate: null },
    { id: 't-2', title: '页面B', assignee: '郑楠', status: 'in_progress', progress: 40, dueDate: null },
    { id: 't-3', title: '受阻任务', assignee: '黄越', status: 'blocked', progress: 20, dueDate: null },
    { id: 't-4', title: '逾期任务', assignee: '林澜', status: 'todo', progress: 10, dueDate: '2026-10-10' },
  ],
  milestones: [
    { id: 'm-a1', title: '信息架构冻结', targetDate: '2026-10-15', status: 'achieved', achievedDate: '2026-10-14' },
    { id: 'm-a2', title: '首屏可演示', targetDate: '2026-10-25', status: 'at_risk' },
  ],
  meetings: [
    { id: 'mtg-1', title: '周会', meetingDate: '2026-10-15', decisions: ['定范围'], actions: [] },
    { id: 'mtg-2', title: '上月会', meetingDate: '2026-09-30', decisions: ['旧决议'], actions: [] },
  ],
  riskIssues: [
    { id: 'r-1', type: 'risk', title: '接口延期', owner: '郑楠', status: 'open', impact: 'high', dueDate: null },
  ],
}

describe('localPeriodType：≤10 周报 / ≤45 月报 / 其余自定义', () => {
  it('7 天周报，30 天月报，60 天自定义', () => {
    expect(localPeriodType('2026-10-12', '2026-10-18')).toBe('w')
    expect(localPeriodType('2026-10-01', '2026-10-31')).toBe('m')
    expect(localPeriodType('2026-10-01', '2026-11-30')).toBe('c')
  })
})

describe('buildLocalPreview：本地只读派生，authoritative 恒 false，不落盘', () => {
  it('任务五态分桶、平均进度尽力均值、周期外会议不计', () => {
    const p = buildLocalPreview(baseInput)
    expect(p.authoritative).toBe(false)
    expect(p.tasks).toMatchObject({ total: 4, done: 1, inProgress: 1, blocked: 1, todo: 1 })
    expect(p.tasks.averageProgress).toBe(Math.round((100 + 40 + 20 + 10) / 4))
    expect(p.meetings.inPeriod).toBe(1)
    expect(p.meetings.decisions).toBe(1)
    expect(p.periodMeetings.map(m => m.id)).toEqual(['mtg-1'])
  })

  it('里程碑 achieved/atRisk 分桶；周期内里程碑入 periodMilestones', () => {
    const p = buildLocalPreview(baseInput)
    expect(p.milestones).toMatchObject({ total: 2, achieved: 1, atRisk: 1, missed: 0 })
    expect(p.periodMilestones.map(m => m.id)).toContain('m-a1')
  })

  it('异常收集：受阻/逾期任务、at_risk 里程碑、high 未关闭风险，critical 排前', () => {
    const p = buildLocalPreview(baseInput)
    const kinds = p.exceptions.map(e => e.kind)
    expect(kinds).toContain('blocked_task')
    expect(kinds).toContain('overdue_task')
    expect(kinds).toContain('milestone')
    expect(kinds).toContain('risk_issue')
    expect(p.exceptions[0].severity).toBe('critical')
  })

  it('逾期会议行动项入异常；已完成/已取消不计', () => {
    const withAction: LocalPreviewInput = {
      ...baseInput,
      meetings: [{
        id: 'mtg-1', title: '周会', meetingDate: '2026-10-15', decisions: [],
        actions: [
          { id: 'ai-1', title: '闭环项', owner: '陈屿', status: 'done', dueDate: '2026-10-01' },
          { id: 'ai-2', title: '跟进项', owner: '黄越', status: 'in_progress', dueDate: '2026-10-01' },
        ],
      }],
    }
    const p = buildLocalPreview(withAction)
    expect(p.exceptions.some(e => e.kind === 'overdue_action' && e.id === 'mtg-1/ai-2')).toBe(true)
    expect(p.exceptions.some(e => e.id === 'mtg-1/ai-1')).toBe(false)
  })
})

describe('freezeSelection（A02）：深拷贝冻结，原内容后续改动不影响已存快照', () => {
  it('冻结后修改原对象，快照保持；isFrozenFor 按 sourceId+revisionId 判定', () => {
    const original = { lines: ['a', 'b'], meta: { rev: 1 } }
    const frozen = freezeSelection('src-1', 'rev-3', original, '2026-10-20T10:00:00Z')
    original.lines.push('c')
    original.meta.rev = 99
    expect(frozen.snapshot).toEqual({ lines: ['a', 'b'], meta: { rev: 1 } })
    expect(isFrozenFor(frozen, 'src-1', 'rev-3')).toBe(true)
    expect(isFrozenFor(frozen, 'src-1', 'rev-9')).toBe(false)
    expect(isFrozenFor(null, 'src-1', 'rev-3')).toBe(false)
  })
})
