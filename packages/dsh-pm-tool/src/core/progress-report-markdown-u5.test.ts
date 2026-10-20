import { describe, it, expect } from 'vitest'
import { progressReportRecordSchema, type ProgressReport } from './progress-report.js'
import { renderProgressReportMarkdown } from './progress-report-markdown.js'

const ISO = '2026-10-20T08:00:00.000Z'

function report(over: Record<string, unknown> = {}): ProgressReport {
  return progressReportRecordSchema.parse({
    id: 'rpt-0001',
    projectId: 'p-0001',
    title: '十月汇报',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    status: 'final',
    executiveSummary: '按计划',
    completedWork: [],
    nextPlans: [],
    blockers: [],
    snapshotAt: ISO,
    snapshot: {
      project: { name: 'P', owner: '', status: 'active', targetDate: '2026-10-31' },
      tasks: { total: 0, todo: 0, inProgress: 0, blocked: 0, done: 0, averageProgress: null },
      milestones: { total: 0, achieved: 0, atRisk: 0, missed: 0 },
      meetings: { inPeriod: 0, decisions: 0 },
      periodMilestones: [],
      periodMeetings: [],
      exceptions: [],
    },
    sourceType: 'session',
    sourceSessionId: 'sess-123|注入',
    createdAt: ISO,
    updatedAt: ISO,
    ...over,
  })
}

describe('U5 report Markdown 输出来源与安全转义', () => {
  it('输出会话派生来源，sessionId 转义竖线并展示', () => {
    const md = renderProgressReportMarkdown(report())
    expect(md).toContain('来源：会话派生')
    expect(md).toContain('sess-123\\|注入')
  })

  it('manual 不展示 sessionId', () => {
    const md = renderProgressReportMarkdown(report({ sourceType: 'manual', sourceSessionId: null }))
    expect(md).toContain('来源：手工录入')
    expect(md).not.toContain('sess-123')
  })
})
