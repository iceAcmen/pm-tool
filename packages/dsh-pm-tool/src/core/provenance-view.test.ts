import { describe, it, expect } from 'vitest'
import {
  groupRefsByRole,
  findRecheckRow,
  entryConclusion,
  isStaleState,
  isRefStale,
  staleRefCount,
  conclusionTone,
  isoDatePart,
  isoTimePart,
  historyChain,
  historyConclusionLabel,
  refKey,
  PROVENANCE_KIND_LABEL,
  LEDGER_TABLE_TO_RECORD_TYPE,
  type LedgerEntryView,
} from './provenance-view.js'
import type { SourceRef, StaleState } from './provenance.js'

// P2-6 溯源 UI 视图模型纯函数单测：零 DOM、零 I/O；覆盖 F05 分组、F06 失效判定、F12 历史口径。

const ref = (table: string, id: string, role: SourceRef['role'] = 'basis', over: Partial<SourceRef> = {}): SourceRef => ({
  table,
  id,
  projectId: 'p1',
  label: id,
  role,
  snapshotVersion: 1,
  ruleRevision: 1,
  updatedAt: `u-${id}`,
  basisFingerprint: 'b',
  fullFingerprint: 'f',
  ...over,
})

const entry = (over: Partial<LedgerEntryView> = {}): LedgerEntryView => ({
  id: 'prv-1',
  kind: 'ask-apply',
  summary: '示例结论',
  confidence: '未提供',
  createdAt: '2026-10-17T08:30:00.000Z',
  status: 'confirmed',
  refs: [],
  history: [],
  ...over,
})

describe('F05 分组：basis 依据在前、context 上下文在后，保留原顺序', () => {
  it('按角色拆分且不重排、不丢条目', () => {
    const refs = [ref('tasks', 't1'), ref('tasks', 't2', 'context'), ref('milestones', 'm1'), ref('meetings', 'mt1', 'context')]
    const { basis, context } = groupRefsByRole(refs)
    expect(basis.map(r => r.id)).toEqual(['t1', 'm1'])
    expect(context.map(r => r.id)).toEqual(['t2', 'mt1'])
    expect(groupRefsByRole([])).toEqual({ basis: [], context: [] })
  })
})

describe('F06 失效判定：只认真实评估状态，未评估绝不默认一致', () => {
  it('entryConclusion 透传真实结论；缺 recheck 时为 unevaluated（不默认 consistent）', () => {
    expect(entryConclusion(entry({ recheck: { conclusion: 'consistent', rows: [], invalid: [] } }))).toBe('consistent')
    expect(entryConclusion(entry({ recheck: { conclusion: 'needs-regen', rows: [], invalid: [] } }))).toBe('needs-regen')
    expect(entryConclusion(entry({ recheck: { conclusion: 'manual-review', rows: [], invalid: [] } }))).toBe('manual-review')
    expect(entryConclusion(entry())).toBe('unevaluated')
  })

  it('isStaleState：changed/missing/cross-project 失效；consistent/undefined 有效', () => {
    for (const s of ['changed', 'missing', 'cross-project'] as StaleState[]) expect(isStaleState(s)).toBe(true)
    expect(isStaleState('consistent')).toBe(false)
    expect(isStaleState(undefined)).toBe(false)
  })

  it('findRecheckRow 按 table:id 匹配；找不到返回 undefined', () => {
    const rows = [{ ref: ref('tasks', 't1'), state: 'changed' as StaleState, reason: '关键字段已修改' }]
    expect(findRecheckRow(ref('tasks', 't1'), rows)?.reason).toBe('关键字段已修改')
    expect(findRecheckRow(ref('tasks', 'nope'), rows)).toBeUndefined()
    expect(findRecheckRow(ref('tasks', 't1'), undefined)).toBeUndefined()
  })

  it('isRefStale：评估行失效或出现在 invalid 列表均判失效；一致不算', () => {
    const t1 = ref('tasks', 't1')
    const t2 = ref('tasks', 't2', 'context')
    const t3 = ref('tasks', 't3')
    const e = entry({
      refs: [t1, t2, t3],
      recheck: {
        conclusion: 'manual-review',
        rows: [
          { ref: t1, state: 'changed', reason: '关键字段已修改' },
          { ref: t3, state: 'consistent', reason: '与来源一致' },
        ],
        invalid: [{ ref: t2, reason: 'missing' }],
      },
    })
    expect(isRefStale(t1, e)).toBe(true)
    expect(isRefStale(t2, e)).toBe(true)
    expect(isRefStale(t3, e)).toBe(false)
    expect(staleRefCount(e)).toBe(2)
    expect(staleRefCount(entry({ refs: [t3] }))).toBe(0)
  })
})

describe('结论色调与历史口径（F12 不洗白）', () => {
  it('conclusionTone 映射四种状态', () => {
    expect(conclusionTone('consistent')).toBe('ok')
    expect(conclusionTone('needs-regen')).toBe('warn')
    expect(conclusionTone('manual-review')).toBe('danger')
    expect(conclusionTone('unevaluated')).toBe('muted')
  })

  it('historyChain 归一空数组；historyConclusionLabel 原样翻译旧结论', () => {
    expect(historyChain(entry())).toEqual([])
    expect(historyChain(entry({ history: [{ at: null, conclusion: 'needs-regen', snapshotVersion: 1, ruleRevision: 1, rows: [] }] }))).toHaveLength(1)
    expect(historyConclusionLabel({ at: null, conclusion: 'manual-review', snapshotVersion: 1, ruleRevision: 1, rows: [] })).toBe('需人工复核')
  })
})

describe('确定性切片与常量映射', () => {
  it('isoDatePart/isoTimePart 原样切分，空值归一为空串', () => {
    expect(isoDatePart('2026-10-17T08:30:00.000Z')).toBe('2026-10-17')
    expect(isoTimePart('2026-10-17T08:30:00.000Z')).toBe('08:30')
    expect(isoDatePart(null)).toBe('')
    expect(isoTimePart(undefined)).toBe('')
  })

  it('refKey 使用 table:id', () => {
    expect(refKey({ table: 'risk_issues', id: 'r1' })).toBe('risk_issues:r1')
  })

  it('四种 kind 都有中文标签；表名映射到 openRecord 类型', () => {
    for (const k of ['ask-apply', 'wbs-import', 'report-narrate', 'meeting-summarize']) {
      expect(PROVENANCE_KIND_LABEL[k]).toBeTruthy()
    }
    expect(LEDGER_TABLE_TO_RECORD_TYPE.risk_issues).toBe('risk')
    expect(LEDGER_TABLE_TO_RECORD_TYPE.deliverables).toBe('deliverable')
    expect(LEDGER_TABLE_TO_RECORD_TYPE.reports).toBe('report')
  })
})
