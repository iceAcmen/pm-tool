import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProvenancePanel } from './provenance-panel.js'
import type { SourceRef, StaleState } from '../core/provenance.js'
import type { LedgerEntryView } from '../core/provenance-view.js'

const source = (patch: Partial<SourceRef> = {}): SourceRef => ({
  table: 'tasks', id: 't-0001', projectId: 'p-0001', label: '来源任务一', role: 'basis',
  snapshotVersion: 1, ruleRevision: 1, updatedAt: '2026-10-21T12:00:00.000Z',
  basisFingerprint: 'basis', fullFingerprint: 'full', ...patch,
})
const ledger = (refs: SourceRef[], patch: Partial<LedgerEntryView> = {}): LedgerEntryView => ({
  id: 'prv-0001', kind: 'ask-apply', summary: '已确认的来源', confidence: '未提供',
  createdAt: '2026-10-21T12:00:00.000Z', status: 'confirmed', refs, history: [], ...patch,
})
const text = (node: ReactTestInstance): string => node.children.map(child =>
  typeof child === 'string' ? child : text(child)).join('')
const mounts: ReactTestRenderer[] = []
const rows = (renderer: ReactTestRenderer) => renderer.root.findAll(node =>
  node.type === 'li' && typeof node.props.className === 'string'
  && node.props.className.split(' ').includes('pm-prov-ref'))

async function mount(entry: LedgerEntryView) {
  const execute = vi.fn(async () => JSON.stringify({ entries: [entry], pendingCount: 0 }))
  const onOpenRecord = vi.fn()
  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = create(createElement(ProvenancePanel, { projectId: 'p-0001', execute, onOpenRecord }))
  })
  mounts.push(renderer)
  expect(execute.mock.calls).toHaveLength(1)
  return { renderer, execute, onOpenRecord }
}

afterEach(() => {
  for (const renderer of mounts.splice(0)) act(() => renderer.unmount())
})

describe('AGUI-01 真实 ProvenancePanel 来源行（开发组件自验，非 GUI）', () => {
  it.each([
    ['tasks', 't-0001', '任务', 'task'],
    ['milestones', 'm-0001', '里程碑', 'milestone'],
    ['risk_issues', 'ri-0001', '风险/问题', 'risk'],
    ['deliverables', 'dlv-0001', '交付物', 'deliverable'],
    ['meetings', 'mtg-0001', '会议', 'meeting'],
    ['reports', 'rpt-0001', '汇报', 'report'],
  ])('%s 有标题：同一来源行同时有标题/ID/表/角色/版本，点击仍传 ref.id', async (table, id, tableLabel, recordType) => {
    const ref = source({ table, id, label: '同名来源', role: 'context', snapshotVersion: 2, ruleRevision: 3 })
    const { renderer, execute, onOpenRecord } = await mount(ledger([ref]))
    const [row] = rows(renderer)
    expect(text(row.findByProps({ className: 'pm-prov-ref-link' }))).toBe('同名来源')
    expect(text(row.findByProps({ className: 'pm-prov-ref-meta' })))
      .toBe(`${id} · ${tableLabel} · 快照 v2 · 口径 v3`)
    expect(text(row.findByProps({ className: 'pm-prov-ref-role' }))).toBe('上下文')
    expect(text(row).split(id)).toHaveLength(2)
    act(() => row.findByType('button').props.onClick())
    expect(onOpenRecord.mock.calls).toEqual([[recordType, id]])
    expect(execute.mock.calls).toHaveLength(1)
  })

  it.each(['', undefined])('旧来源 label=%s 时 ID 只显示一次，不在 meta 再重复', async label => {
    const ref = source()
    if (label === undefined) delete (ref as Partial<SourceRef>).label
    else ref.label = label
    const { renderer, onOpenRecord } = await mount(ledger([ref]))
    const [row] = rows(renderer)
    expect(text(row.findByType('button'))).toBe(ref.id)
    expect(text(row.findByProps({ className: 'pm-prov-ref-meta' }))).toBe('任务 · 快照 v1 · 口径 v1')
    expect(text(row).split(ref.id)).toHaveLength(2)
    act(() => row.findByType('button').props.onClick())
    expect(onOpenRecord.mock.calls).toEqual([['task', ref.id]])
  })

  it('同表同标题的两个来源仍各有自己的 ID，分别跳转对应记录', async () => {
    const refs = [source({ label: '同名来源' }), source({ id: 't-0002', label: '同名来源' })]
    const { renderer, onOpenRecord } = await mount(ledger(refs))
    rows(renderer).forEach((row, index) => {
      expect(text(row)).toContain(refs[index].id)
      expect(text(row)).not.toContain(refs[1 - index].id)
      act(() => row.findByType('button').props.onClick())
    })
    expect(onOpenRecord.mock.calls).toEqual([['task', 't-0001'], ['task', 't-0002']])
  })

  it.each(['changed', 'missing', 'cross-project'] as StaleState[])('%s 来源仍显示标题+ID与旧版本，但没有跳转按钮', async state => {
    const ref = source()
    const { renderer, onOpenRecord } = await mount(ledger([ref], {
      recheck: { conclusion: state === 'changed' ? 'needs-regen' : 'manual-review',
        rows: [{ ref, state, reason: '失效原因' }], invalid: [] },
    }))
    const [row] = rows(renderer)
    expect(row.props.className).toBe('pm-prov-ref is-stale')
    expect(row.props['data-state']).toBe(state)
    expect(text(row.findByProps({ className: 'pm-prov-ref-label' }))).toBe(ref.label)
    expect(text(row.findByProps({ className: 'pm-prov-ref-meta' }))).toBe(`${ref.id} · 任务 · 快照 v1 · 口径 v1`)
    expect(text(row.findByProps({ className: 'pm-prov-ref-role' }))).toBe('依据')
    expect(text(row)).toContain('失效原因')
    expect(row.findAllByType('button')).toHaveLength(0)
    expect(onOpenRecord).not.toHaveBeenCalled()
  })

  it('无标题的 missing 来源仅显示一次 ID，invalid 列表仍保留，无跳转', async () => {
    const ref = source({ label: '' })
    const { renderer, onOpenRecord } = await mount(ledger([ref], {
      recheck: { conclusion: 'manual-review', rows: [], invalid: [{ ref, reason: 'missing' }] },
    }))
    const [row] = rows(renderer)
    expect(text(row).split(ref.id)).toHaveLength(2)
    expect(text(row.findByProps({ className: 'pm-prov-ref-meta' }))).toBe('任务 · 快照 v1 · 口径 v1')
    expect(row.findAllByType('button')).toHaveLength(0)
    expect(text(renderer.root.findByProps({ className: 'pm-prov-invalid' }))).toContain('记录已删除')
    expect(onOpenRecord).not.toHaveBeenCalled()
  })

  it('unknown 表保留标题/ID/原表名，不增加跳转入口', async () => {
    const ref = source({ table: 'legacy_sources' })
    const { renderer, onOpenRecord } = await mount(ledger([ref]))
    const [row] = rows(renderer)
    expect(text(row)).toContain(ref.label)
    expect(text(row.findByProps({ className: 'pm-prov-ref-meta' })))
      .toBe(`${ref.id} · legacy_sources · 快照 v1 · 口径 v1`)
    expect(row.findAllByType('button')).toHaveLength(0)
    expect(onOpenRecord).not.toHaveBeenCalled()
  })

  it('旧 refs/history 原样读出，刷新不重校、不改旧结论及历史行', async () => {
    const ref = source()
    const entry = ledger([ref], {
      history: [
        { at: '2026-10-20T12:00:00.000Z', conclusion: 'needs-regen', snapshotVersion: 1, ruleRevision: 1,
          rows: [{ ref, state: 'changed', reason: '旧原因' }] },
        { at: null, conclusion: 'manual-review', snapshotVersion: 2, ruleRevision: 3,
          rows: [{ ref, state: 'missing', reason: '旧删除' }] },
      ],
    })
    const before = structuredClone(entry)
    const { renderer, execute } = await mount(entry)
    const history = () => renderer.root.findAllByProps({ className: 'pm-prov-history-item' }).map(text)
    const first = history()
    expect(first).toHaveLength(2)
    expect(first[0]).toContain('需重新生成')
    expect(first[0]).toContain('旧原因')
    expect(first[1]).toContain('需人工复核')
    expect(first[1]).toContain('时间未记录')
    expect(first[1]).toContain('快照 v2 · 口径 v3')
    expect(text(renderer.root.findByProps({ className: 'pm-prov-meta-line' }))).toContain('置信度：未提供')
    await act(async () => {
      renderer.root.findAllByType('button').find(node => text(node) === '刷新')!.props.onClick()
    })
    expect(execute.mock.calls).toEqual([['ask-provenance p-0001'], ['ask-provenance p-0001']])
    expect(history()).toEqual(first)
    expect(entry).toEqual(before)
    expect(rows(renderer)).toHaveLength(1)
  })

  it('旧无 history 的条目与空 refs 仍可读，不造历史或来源', async () => {
    const entry = ledger([])
    delete (entry as Partial<LedgerEntryView>).history
    const { renderer, execute } = await mount(entry)
    expect(rows(renderer)).toHaveLength(0)
    expect(renderer.root.findAllByProps({ className: 'pm-prov-history' })).toHaveLength(0)
    expect(text(renderer.root)).toContain('来源（0 条')
    expect(text(renderer.root)).toContain('尚未评估')
    expect(execute.mock.calls).toEqual([['ask-provenance p-0001']])
  })
})
