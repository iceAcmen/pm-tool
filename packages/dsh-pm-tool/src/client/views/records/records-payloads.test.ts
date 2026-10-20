import { describe, it, expect } from 'vitest'
import {
  parseTextList,
  normalizeMeetingPayload,
  normalizeMeetingActionPayload,
  normalizeReportPayload,
  normalizeDeliverablePayload,
} from './records-payloads.js'

describe('parseTextList：换行/顿号/中英文逗号拆分、trim、去重保序', () => {
  it('混合分隔符去空去重', () => {
    expect(parseTextList('完成A\n完成B、完成C，完成A，  ')).toEqual(['完成A', '完成B', '完成C'])
  })
  it('空输入返回空数组', () => {
    expect(parseTextList(undefined)).toEqual([])
    expect(parseTextList('')).toEqual([])
  })
})

describe('normalizeMeetingPayload（对齐 MeetingPayload，分片只归一不拼命令）', () => {
  it('空时间/时长归一 null，列表拆分，字段 trim', () => {
    const p = normalizeMeetingPayload({
      title: ' 项目周会 ',
      meetingDate: '2026-10-18',
      startTime: '',
      durationMinutes: '',
      participants: '林澜、陈屿\n陈屿',
      topics: '对齐范围、排期',
      decisions: '',
      status: 'final',
    })
    expect(p).toMatchObject({
      title: '项目周会',
      startTime: null,
      durationMinutes: null,
      participants: ['林澜', '陈屿'],
      topics: ['对齐范围', '排期'],
      decisions: [],
      status: 'final',
    })
  })
  it('时长转整数分钟；非法状态回落 draft', () => {
    const p = normalizeMeetingPayload({
      title: '评审会', meetingDate: '2026-10-18', durationMinutes: '45', status: 'bogus',
    })
    expect(p.durationMinutes).toBe(45)
    expect(p.status).toBe('draft')
  })
})

describe('normalizeMeetingActionPayload（对齐 MeetingActionPayload）', () => {
  it('可空外键/日期空串归一 null，非法状态回落 todo', () => {
    const a = normalizeMeetingActionPayload({
      title: '完成验收', owner: '陈屿', dueDate: '', taskId: '', riskIssueId: '', status: 'done',
    })
    expect(a).toEqual({
      title: '完成验收', owner: '陈屿', dueDate: null, status: 'done', taskId: null, riskIssueId: null,
    })
    expect(normalizeMeetingActionPayload({ title: 'x', status: 'weird' }).status).toBe('todo')
  })
})

describe('normalizeReportPayload（对齐 ReportPayload；周期不进 payload）', () => {
  it('标题留空省略键，状态 clamp，三列表拆分', () => {
    const p = normalizeReportPayload({
      status: 'final', executiveSummary: ' 按计划推进 ',
      completedWork: '页面A、页面B', nextPlans: '联调', blockers: '',
    })
    expect(p).toEqual({
      status: 'final',
      executiveSummary: '按计划推进',
      completedWork: ['页面A', '页面B'],
      nextPlans: ['联调'],
      blockers: [],
      sourceType: 'manual',
      sourceSessionId: null,
    })
    expect('title' in p).toBe(false)
  })
  it('标题非空才带上；非法状态回落 draft', () => {
    const p = normalizeReportPayload({ title: ' 第四十二周周报 ', status: 'x' })
    expect(p.title).toBe('第四十二周周报')
    expect(p.status).toBe('draft')
  })
  it('U5：manual 默认且 sourceSessionId=null；session 带非空会话 id，空 id 回落 null', () => {
    const manual = normalizeReportPayload({})
    expect(manual.sourceType).toBe('manual')
    expect(manual.sourceSessionId).toBeNull()
    const sess = normalizeReportPayload({ sourceType: 'session', sourceSessionId: ' sess-123 ' })
    expect(sess.sourceType).toBe('session')
    expect(sess.sourceSessionId).toBe('sess-123')
    const empty = normalizeReportPayload({ sourceType: 'session', sourceSessionId: '   ' })
    expect(empty.sourceSessionId).toBeNull()
    expect(empty.sourceType).toBe('session')
  })
})

describe('normalizeDeliverablePayload（对齐 DeliverablePayload；仓库始终为字符串）', () => {
  it('dueDate 空→null；changeNote 空省略；repo/branch 空串保留由 panel 删键', () => {
    const p = normalizeDeliverablePayload({
      name: '需求说明书', version: 'v1.0', owner: '林澜', status: 'submitted',
      location: 'exports/需求说明书.md', dueDate: '', changeNote: '', repoUrl: '', branch: '',
    })
    expect(p.dueDate).toBeNull()
    expect('changeNote' in p).toBe(false)
    expect(p.repoUrl).toBe('')
    expect(p.branch).toBe('')
  })
  it('wrapped 已收尾五态内原样保留；changeNote 非空带上；未知状态回落 planned', () => {
    const p = normalizeDeliverablePayload({ name: '原型', status: 'wrapped', changeNote: '停办收尾' })
    expect(p.status).toBe('wrapped')
    expect(p.changeNote).toBe('停办收尾')
    const bad = normalizeDeliverablePayload({ name: '原型', status: 'weird' })
    expect(bad.status).toBe('planned')
  })
  it('U5：milestoneId 空→null（解除关联）；note 非空带上、空省略', () => {
    const linked = normalizeDeliverablePayload({ name: '验收包', milestoneId: 'm-0001', note: ' 给客户演示用 ' })
    expect(linked.milestoneId).toBe('m-0001')
    expect(linked.note).toBe('给客户演示用')
    const cleared = normalizeDeliverablePayload({ name: '验收包', milestoneId: '  ', note: '' })
    expect(cleared.milestoneId).toBeNull()
    expect('note' in cleared).toBe(false)
  })
})
