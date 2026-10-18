import { describe, it, expect } from 'vitest'
import { summarizeProvenance, renderMetricSummary, METRIC_KIND_LABELS } from './metric.js'
import { handleMetricCommand } from '../commands/metric.js'
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

describe('renderMetricSummary：人读摘要先行，不下小样本结论', () => {
  it('空账本：如实报暂无记录，不造数字', () => {
    const m = summarizeProvenance('p1', [], 0)
    const s = renderMetricSummary(m)
    expect(s).toContain('暂无 AI 操作留痕')
    expect(s).not.toContain(METRIC_KIND_LABELS['ask-apply'])
  })

  it('按 kind 中文计数、撤销/采纳如实列出、最新时间截断', () => {
    const s = renderMetricSummary(summarizeProvenance('p1', [
      mkEntry('e1', 'capture', '2026-10-18T09:00:00.000Z', {
        refs: [ref('t-1')],
        audit: [{ at: '2026-10-18T09:01:00.000Z', kind: 'undone', object: 'u', result: '撤销成功' }],
      }),
    ], 2))
    expect(s).toContain('对话补档 1')
    expect(s).toContain('落库触及对象 1')
    expect(s).toContain('撤销成功 1')
    expect(s).toContain('待并入')
    expect(s).toContain('2026-10-18 09:00')
    expect(s).not.toContain('09:00:00.000Z')
  })

  it('样本少于 5 条时附样本有限提示，不声称趋势', () => {
    const s = renderMetricSummary(summarizeProvenance('p1', [mkEntry('e1', 'capture', '2026-10-18T00:00:00Z')], 0))
    expect(s).toContain('样本较少')
  })

  it('多 kind 与多撤销结果逐项列出', () => {
    const s = renderMetricSummary(summarizeProvenance('p1', [
      mkEntry('e1', 'ask-apply', '2026-10-18T00:00:00Z', {
        audit: [
          { at: '2026-10-18T00:01:00Z', kind: 'undone', object: 'a', result: 'x' },
          { at: '2026-10-18T00:02:00Z', kind: 'conflict', object: 'b', result: 'x' },
          { at: '2026-10-18T00:03:00Z', kind: 'failed', object: 'c', result: 'x' },
        ],
      }),
      mkEntry('e2', 'capture', '2026-10-18T01:00:00Z'),
    ], 0))
    expect(s).toContain('副驾应用 1')
    expect(s).toContain('对话补档 1')
    expect(s).toContain('冲突保留 1')
    expect(s).toContain('失败 1')
  })
})

describe('metric 命令输出契约（裸 JSON 可 JSON.parse，summary 简短独立）', () => {
  it('handleMetricCommand 返回裸 JSON 对象：原始字段全保留、summary 为短人读字段', () => {
    // 最小 stub domain（零 I/O）：projects.get 命中、settings.get 返回 undefined。
    const domain = {
      table: (name: string) => ({
        get: (key: string) =>
          name === 'projects' && key === 'p1' ? { id: 'p1', name: 'x' } : undefined,
      }),
    }
    const res = handleMetricCommand('p1', domain as never)
    expect(res.kind).toBe('success')
    // 机器契约：整串可 JSON.parse（verify 脚本直接 JSON.parse(metric)），不得混合 prose/围栏。
    const parsed = JSON.parse(res.text) as Record<string, unknown>
    for (const key of ['projectId', 'total', 'byKind', 'undoOutcomes', 'appliedSteps', 'pendingCount', 'last', 'summary']) {
      expect(parsed, `缺字段 ${key}`).toHaveProperty(key)
    }
    const summary = String(parsed.summary)
    // summary 真正简短、可独立阅读，不复制原始 JSON 字段名/原始对象。
    expect(summary.length).toBeLessThan(400)
    expect(summary).not.toContain('byKind')
    expect(summary).not.toContain('undoOutcomes')
    expect(summary).not.toContain('appliedSteps')
    expect(summary).not.toContain('```')
    expect(res.text.trim()).not.toMatch(/^```/)
  })
})
