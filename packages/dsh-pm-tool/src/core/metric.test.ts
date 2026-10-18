import { describe, it, expect } from 'vitest'
import { summarizeProvenance } from './metric.js'
import type { ProvenanceLedgerEntry } from './provenance-store.js'
import type { SourceRef } from './provenance.js'

// P0 K12：账本只读聚合纯函数（零 I/O）。条目由 listProvenance 按项目过滤后传入。

const ref = (id: string, role: SourceRef['role'] = 'basis'): SourceRef => ({
  table: 'tasks', id, projectId: 'p1', label: id, role,
  snapshotVersion: 1, ruleRevision: 1, updatedAt: null, basisFingerprint: 'b', fullFingerprint: 'f',
})

const mkEntry = (id: string, kind: ProvenanceLedgerEntry['kind'], createdAt: string,
  extra?: Partial<ProvenanceLedgerEntry>): ProvenanceLedgerEntry => ({
  id, projectId: 'p1', kind, createdAt, status: 'confirmed', schemaVersion: 1,
  confidence: '未提供', summary: '', refs: [], history: [], audit: [], ...extra,
})

describe('P0 K12 summarizeProvenance', () => {
  it('空账本：全零/空桶，last=null，pendingCount 如实回传', () => {
    const m = summarizeProvenance('p1', [], 3)
    expect(m).toEqual({
      projectId: 'p1', total: 0, byKind: {},
      undoOutcomes: { undone: 0, conflict: 0, failed: 0 },
      appliedSteps: 0, pendingCount: 3, last: null,
    })
  })

  it('byKind 按类型计数；basis refs 累计为 appliedSteps；context refs 不计入', () => {
    const m = summarizeProvenance('p1', [
      mkEntry('e1', 'ask-apply', '2026-10-18T01:00:00.000Z', {
        refs: [ref('t-1'), ref('t-2'), ref('t-3', 'context')],
      }),
      mkEntry('e2', 'capture', '2026-10-18T02:00:00.000Z', { refs: [ref('t-4')] }),
    ])
    expect(m.total).toBe(2)
    expect(m.byKind).toEqual({ 'ask-apply': 1, capture: 1 })
    expect(m.appliedSteps).toBe(3)
  })

  it('undoOutcomes 只统计 undone/conflict/failed，applied 审计不计入', () => {
    const m = summarizeProvenance('p1', [
      mkEntry('e1', 'ask-apply', '2026-10-18T01:00:00.000Z', {
        audit: [
          { at: '2026-10-18T01:00:00.000Z', kind: 'applied', object: 'ask-apply', result: 'x' },
          { at: '2026-10-18T01:05:00.000Z', kind: 'undone', object: 'undo-1', result: '撤销成功' },
        ],
      }),
      mkEntry('e2', 'ask-apply', '2026-10-18T03:00:00.000Z', {
        audit: [
          { at: '2026-10-18T03:00:00.000Z', kind: 'conflict', object: 'undo-2', result: '冲突保留' },
          { at: '2026-10-18T03:01:00.000Z', kind: 'failed', object: 'undo-3', result: '写盘失败' },
        ],
      }),
    ])
    expect(m.undoOutcomes).toEqual({ undone: 1, conflict: 1, failed: 1 })
  })

  it('last 取最新 createdAt（与输入顺序无关）', () => {
    const m = summarizeProvenance('p1', [
      mkEntry('e-old', 'ask-apply', '2026-10-17T00:00:00.000Z'),
      mkEntry('e-new', 'capture', '2026-10-18T09:00:00.000Z'),
      mkEntry('e-mid', 'ask-apply', '2026-10-18T06:00:00.000Z'),
    ])
    expect(m.last).toBe('2026-10-18T09:00:00.000Z')
  })

  it('缺 refs/audit 的旧条目按空处理，不抛错', () => {
    const m = summarizeProvenance('p1', [
      { ...mkEntry('e1', 'wbs-import', '2026-10-18T00:00:00.000Z'), refs: undefined, audit: undefined },
    ] as unknown as ProvenanceLedgerEntry[])
    expect(m.appliedSteps).toBe(0)
    expect(m.undoOutcomes).toEqual({ undone: 0, conflict: 0, failed: 0 })
  })
})
