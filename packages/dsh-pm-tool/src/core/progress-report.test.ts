import { describe, it, expect } from 'vitest'
import {
  frozenExcerptSchema,
  frozenExcerptsSchema,
  FROZEN_EXCERPTS_MAX,
  normalizeProgressReportRecord,
  progressReportGenerateSchema,
  progressReportUpdateSchema,
} from './progress-report.js'
import { getProgressReport, listProgressReports, updateProgressReport } from './progress-reports.js'

// B6 纯 schema 离线单测（零 domain、零网络、零墙钟）。
// preview 纯派生、generate 冻结、update 保留/替换、日志改后不变由 scripts/verify-b6-report.mjs 集成覆盖。

const ISO = '2026-10-20T08:00:00.000Z'

function excerpt(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'ex-1',
    taskId: 't-0001',
    sourceKind: 'progress',
    entryId: 'pl-1',
    revisionId: 'rv-1',
    contentSnapshot: '今日完成接口联调',
    author: 'Ice',
    date: '2026-10-20',
    capturedAt: ISO,
    ...over,
  }
}

describe('B6 frozenExcerptSchema：冻结摘录形状与拒绝', () => {
  it('合法摘录通过，sourceKind 固定 progress', () => {
    const parsed = frozenExcerptSchema.parse(excerpt())
    expect(parsed.sourceKind).toBe('progress')
    expect(parsed.contentSnapshot).toBe('今日完成接口联调')
  })

  it('id/entryId/revisionId/taskId 格式错误、错误 sourceKind、未知键被拒', () => {
    expect(() => frozenExcerptSchema.parse(excerpt({ id: 'x-1' }))).toThrow()
    expect(() => frozenExcerptSchema.parse(excerpt({ entryId: 'e-1' }))).toThrow()
    expect(() => frozenExcerptSchema.parse(excerpt({ revisionId: 'r-1' }))).toThrow()
    expect(() => frozenExcerptSchema.parse(excerpt({ taskId: 'task-1' }))).toThrow()
    expect(() => frozenExcerptSchema.parse(excerpt({ sourceKind: 'link' }))).toThrow()
    expect(() => frozenExcerptSchema.parse(excerpt({ extra: 1 }))).toThrow()
  })

  it('空正文/空作者/非 ISO capturedAt 被拒', () => {
    expect(() => frozenExcerptSchema.parse(excerpt({ contentSnapshot: '  ' }))).toThrow()
    expect(() => frozenExcerptSchema.parse(excerpt({ author: '' }))).toThrow()
    expect(() => frozenExcerptSchema.parse(excerpt({ capturedAt: 'not-a-date' }))).toThrow()
  })

  it('excerpts 数组：id 唯一、上限 50', () => {
    expect(() => frozenExcerptsSchema.parse([excerpt(), excerpt({ id: 'ex-1' })])).toThrow('唯一')
    const many = Array.from({ length: FROZEN_EXCERPTS_MAX + 1 }, (_, i) => excerpt({ id: `ex-${i + 1}` }))
    expect(() => frozenExcerptsSchema.parse(many)).toThrow()
  })
})

describe('B6 generate/update schema：selectedRefs 复合选择器与 excerpts 可选', () => {
  const base = { projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31' }

  it('generate 接受 selectedRefs（taskId+entryId+可选revisionId）；缺省字段进缺省出', () => {
    const parsed = progressReportGenerateSchema.parse({ ...base, selectedRefs: [{ taskId: 't-0001', entryId: 'pl-1', revisionId: 'rv-1' }, { taskId: 't-0002', entryId: 'pl-1' }] })
    expect(parsed.selectedRefs?.length).toBe(2)
    expect(parsed.excerpts).toBeUndefined()
    expect(parsed.status).toBe('draft')
  })

  it('裸 selectedEntryIds / 缺 taskId 的选择器被 strict 拒绝（pl-N 跨任务撞号）', () => {
    expect(() => progressReportGenerateSchema.parse({ ...base, selectedEntryIds: ['pl-1'] })).toThrow()
    expect(() => progressReportGenerateSchema.parse({ ...base, selectedRefs: [{ entryId: 'pl-1' }] })).toThrow()
  })

  it('excerpts 与 selectedRefs 同传被 strict 互斥拒绝（不静默忽略任一）', () => {
    expect(() => progressReportGenerateSchema.parse({
      ...base,
      excerpts: [excerpt()],
      selectedRefs: [{ taskId: 't-0001', entryId: 'pl-1' }],
    })).toThrow(/二选一|同时/)
  })

  it('generate 接受预建 excerpts；未知键被拒', () => {
    const parsed = progressReportGenerateSchema.parse({ ...base, excerpts: [excerpt()] })
    expect(parsed.excerpts?.[0].id).toBe('ex-1')
    expect(() => progressReportGenerateSchema.parse({ ...base, bogus: 1 })).toThrow()
  })

  it('update 传 excerpts 替换；不传则缺键（保留现有由域层负责）', () => {
    const withEx = progressReportUpdateSchema.parse({ excerpts: [excerpt()] })
    expect(withEx.excerpts?.length).toBe(1)
    const without = progressReportUpdateSchema.parse({ status: 'final' })
    expect(without.excerpts).toBeUndefined()
    expect(() => progressReportUpdateSchema.parse({})).toThrow()
  })
})

describe('U5 sourceType 枚举与 sourceSessionId 条件', () => {
  const base = { projectId: 'p-0001', periodStart: '2026-10-01', periodEnd: '2026-10-31' }

  it('缺省 manual，不带 sourceSessionId 通过', () => {
    const parsed = progressReportGenerateSchema.parse({ ...base })
    expect(parsed.sourceType).toBe('manual')
    expect(parsed.sourceSessionId).toBeUndefined()
  })

  it('session 必须带非空 sourceSessionId；缺/空被拒', () => {
    expect(() => progressReportGenerateSchema.parse({ ...base, sourceType: 'session' })).toThrow(/sourceSessionId/)
    expect(() => progressReportGenerateSchema.parse({ ...base, sourceType: 'session', sourceSessionId: '  ' })).toThrow()
    const ok = progressReportGenerateSchema.parse({ ...base, sourceType: 'session', sourceSessionId: 'sess-123' })
    expect(ok.sourceSessionId).toBe('sess-123')
  })

  it('manual 不得传 sourceSessionId；非法 sourceType 被拒', () => {
    expect(() => progressReportGenerateSchema.parse({ ...base, sourceType: 'manual', sourceSessionId: 'sess-1' })).toThrow(/sourceSessionId/)
    expect(() => progressReportGenerateSchema.parse({ ...base, sourceType: 'email' })).toThrow()
  })
})

describe('U5 legacy report 只读 normalize，不物理迁移', () => {
  const ISO = '2026-10-20T08:00:00.000Z'

  function legacyRow(over: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: 'rpt-0001',
      projectId: 'p-0001',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      title: '旧汇报',
      status: 'draft',
      executiveSummary: '旧摘要',
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
      createdAt: ISO,
      updatedAt: ISO,
      ...over,
    }
  }

  function fakeDomain(rows: Record<string, unknown>[]) {
    const projects = new Map([['p-0001', { id: 'p-0001', name: 'P' }]])
    const reports = new Map(rows.map(row => [String(row.id), row]))
    const table = (name: string) => {
      if (name === 'projects') return { get: (k: string) => projects.get(k), entries: () => projects.entries() }
      if (name === 'reports') return {
        get: (k: string) => reports.get(k),
        put: async (k: string, v: unknown) => { reports.set(k, v) },
        entries: () => reports.entries(),
      }
      return { get: () => undefined, put: async () => {}, entries: () => [][Symbol.iterator]() }
    }
    return { table } as never
  }

  it('缺 source 字段/非法 sourceType 归一为 manual/null；有效 session 保留', () => {
    expect(normalizeProgressReportRecord(legacyRow())).toMatchObject({ sourceType: 'manual', sourceSessionId: null })
    expect(normalizeProgressReportRecord(legacyRow({ sourceType: 'email' }))).toMatchObject({ sourceType: 'manual', sourceSessionId: null })
    expect(normalizeProgressReportRecord(legacyRow({ sourceType: 'session', sourceSessionId: '  ' }))).toMatchObject({ sourceType: 'manual', sourceSessionId: null })
    expect(normalizeProgressReportRecord(legacyRow({ sourceType: 'session', sourceSessionId: 'sess-9' }))).toMatchObject({ sourceType: 'session', sourceSessionId: 'sess-9' })
  })

  it('list/get 读取旧记录补 manual/null；update 前 normalize 后可写且保留来源', async () => {
    const domain = fakeDomain([legacyRow()])
    expect(listProgressReports(domain, 'p-0001')[0]).toMatchObject({ sourceType: 'manual', sourceSessionId: null })
    expect(getProgressReport(domain, 'rpt-0001')).toMatchObject({ sourceType: 'manual', sourceSessionId: null })

    const updated = await updateProgressReport(domain, 'rpt-0001', { executiveSummary: '新摘要' })
    expect(updated).toMatchObject({
      executiveSummary: '新摘要',
      sourceType: 'manual',
      sourceSessionId: null,
    })
  })
})
