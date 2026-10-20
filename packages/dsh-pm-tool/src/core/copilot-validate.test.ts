import { describe, it, expect } from 'vitest'
import { validateActions, type ActionSnapshot, type CopilotAction } from './copilot.js'

// #24 单元层：副驾动作白名单/枚举/交叉约束校验（纯函数、零 I/O）。
const snapshot: ActionSnapshot = {
  taskIds: ['t-1'],
  milestoneIds: ['m-1'],
  riskIds: ['ri-1'],
  deliverableIds: ['dlv-1'],
  meetingIds: ['mtg-1'],
}

const op = (a: Partial<CopilotAction>): CopilotAction => ({ op: 'task.update', ...a })

describe('task.update', () => {
  it('合法字段（status/progress/dueDate/assignee）被接受', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'task.update', id: 't-1', patch: { status: 'in_progress', progress: 40, dueDate: '2026-03-01', assignee: '张三' } }),
    ], snapshot)
    expect(accepted).toHaveLength(1)
    expect(rejected).toHaveLength(0)
  })

  it('update 目标不存在 / 空 patch / 未知字段 / 非法状态拒绝', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'task.update', id: 'nope', patch: { status: 'done' } }),
      op({ op: 'task.update', id: 't-1', patch: {} }),
      op({ op: 'task.update', id: 't-1', patch: { status: 'doing' } }),
      op({ op: 'task.update', id: 't-1', patch: { hack: 1 } }),
      op({ op: 'task.update', id: 't-1', patch: { progress: 150 } }),
    ], snapshot)
    expect(accepted).toHaveLength(0)
    expect(rejected).toHaveLength(5)
  })

  it('startDate 晚于 dueDate 拒绝', () => {
    const { rejected } = validateActions([
      op({ op: 'task.update', id: 't-1', patch: { startDate: '2026-03-10', dueDate: '2026-03-01' } }),
    ], snapshot)
    expect(rejected[0].reason).toContain('开始日期不得晚于')
  })

  it('X2：AI 直写 wrapped 被拒（收尾是人显式决策），中文拒因', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'task.update', id: 't-1', patch: { status: 'wrapped' } }),
      { op: 'deliverable.update', id: 'dlv-1', patch: { status: 'wrapped' } },
    ], snapshot)
    expect(accepted).toHaveLength(0)
    expect(rejected).toHaveLength(2)
    expect(rejected.every(r => /wrapped/.test(r.reason) && /显式决策|手动收尾/.test(r.reason))).toBe(true)
  })
})

describe('milestone create/update', () => {
  it('create 必填 title+targetDate 且 achieved 须配 achievedDate', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'milestone.create', patch: { title: 'M1', targetDate: '2026-04-01', status: 'achieved', achievedDate: '2026-03-30' } }),
      op({ op: 'milestone.create', patch: { title: '缺日期' } }),
      op({ op: 'milestone.create', patch: { title: 'achieved 无日期', status: 'achieved' } }),
    ], snapshot)
    expect(accepted).toHaveLength(1)
    expect(rejected).toHaveLength(2)
  })

  it('update 目标必须存在；非 achieved 不得带 achievedDate', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'milestone.update', id: 'm-1', patch: { title: '改名' } }),
      op({ op: 'milestone.update', id: 'ghost', patch: { title: 'x' } }),
      op({ op: 'milestone.update', id: 'm-1', patch: { status: 'planned', achievedDate: '2026-03-30' } }),
    ], snapshot)
    expect(accepted).toHaveLength(1)
    expect(rejected).toHaveLength(2)
  })
})

describe('risk/issue create/update 交叉约束', () => {
  it('risk 必须 probability、禁 solution；issue probability 必须 null、禁 responsePlan', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'risk.create', patch: { type: 'risk', title: 'R', impact: 'high', probability: 'medium', responsePlan: '预案' } }),
      op({ op: 'risk.create', patch: { type: 'risk', title: '无概率', impact: 'high' } }),
      op({ op: 'risk.create', patch: { type: 'risk', title: '误用 solution', impact: 'high', probability: 'low', solution: 'x' } }),
      op({ op: 'risk.create', patch: { type: 'issue', title: 'I', impact: 'critical', probability: null, solution: '修法' } }),
      op({ op: 'risk.create', patch: { type: 'issue', title: 'issue 带概率', impact: 'low', probability: 'high' } }),
    ], snapshot)
    expect(accepted).toHaveLength(2)
    expect(rejected).toHaveLength(3)
  })

  it('risk.update 目标必须存在，且不得改 type', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'risk.update', id: 'ri-1', patch: { status: 'closed' } }),
      op({ op: 'risk.update', id: 'ghost', patch: { status: 'open' } }),
      op({ op: 'risk.update', id: 'ri-1', patch: { type: 'issue' } }),
    ], snapshot)
    expect(accepted).toHaveLength(1)
    expect(rejected).toHaveLength(2)
  })
})

describe('deliverable / meeting', () => {
  it('deliverable.create 必填 name；update 目标存在；未知字段拒', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'deliverable.create', patch: { name: 'D1', status: 'planned' } }),
      op({ op: 'deliverable.create', patch: {} }),
      op({ op: 'deliverable.update', id: 'dlv-1', patch: { status: 'accepted' } }),
      op({ op: 'deliverable.update', id: 'ghost', patch: { name: 'x' } }),
      op({ op: 'deliverable.create', patch: { name: 'D2', milestoneId: 'm-1', note: 'AI 备注' } }),
      op({ op: 'deliverable.update', id: 'dlv-1', patch: { milestoneId: 'm-1', note: 'AI 备注' } }),
    ], snapshot)
    expect(accepted).toHaveLength(2)
    expect(rejected).toHaveLength(4)
  })

  it('meeting.create 必填 title+meetingDate；时长 1-1440、participants 字符串数组；update 目标存在', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'meeting.create', patch: { title: '周会', meetingDate: '2026-05-01', durationMinutes: 30, participants: ['a', 'b'] } }),
      op({ op: 'meeting.create', patch: { title: '缺日期' } }),
      op({ op: 'meeting.create', patch: { title: '超长', meetingDate: '2026-05-01', durationMinutes: 9999 } }),
      op({ op: 'meeting.update', id: 'mtg-1', patch: { status: 'final' } }),
      op({ op: 'meeting.update', id: 'ghost', patch: { title: 'x' } }),
    ], snapshot)
    expect(accepted).toHaveLength(2)
    expect(rejected).toHaveLength(3)
  })
})

describe('未知 op / 非法实体', () => {
  it('不在白名单的 op 一律拒绝', () => {
    const { accepted, rejected } = validateActions([
      op({ op: 'task.delete', id: 't-1' }),
      op({ op: 'milestone.delete', id: 'm-1' }),
      op({ op: 'risk.banana', patch: {} }),
      op({ op: 'unknown.op', patch: {} }),
    ], snapshot)
    expect(accepted).toHaveLength(0)
    expect(rejected).toHaveLength(4)
  })
})
