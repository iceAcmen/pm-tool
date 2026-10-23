import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProvenancePanel } from './provenance-panel.js'
import type { SourceRef } from '../core/provenance.js'
import type { LedgerEntryView } from '../core/provenance-view.js'

const ref = (patch: Partial<SourceRef> = {}): SourceRef => ({
  table: 'tasks', id: 't-0001', projectId: 'p-0001', label: '同名来源', role: 'basis',
  snapshotVersion: 2, ruleRevision: 3, updatedAt: '2026-10-21T12:00:00.000Z',
  basisFingerprint: 'basis', fullFingerprint: 'full', ...patch,
})
const entry = (refs: SourceRef[], patch: Partial<LedgerEntryView> = {}): LedgerEntryView => ({
  id: 'prv-0001', kind: 'ask-apply', summary: '已确认的来源', confidence: '未提供',
  createdAt: '2026-10-21T12:00:00.000Z', status: 'confirmed', history: [], refs, ...patch,
})
const text = (node: ReactTestInstance): string => node.children.map(child =>
  typeof child === 'string' ? child : text(child)).join('')
const mounts: ReactTestRenderer[] = []
const rows = (renderer: ReactTestRenderer) => renderer.root.findAll(node =>
  node.type === 'li' && node.props.className?.split(' ').includes('pm-prov-ref'))

async function mount(value: LedgerEntryView) {
  const raw = JSON.stringify({ entries: [value], pendingCount: 0 })
  const execute = vi.fn(async () => raw)
  const onOpenRecord = vi.fn()
  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = create(createElement(ProvenancePanel, { projectId: 'p-0001', execute, onOpenRecord }))
  })
  mounts.push(renderer)
  return { renderer, execute, onOpenRecord, raw }
}

afterEach(() => {
  for (const renderer of mounts.splice(0)) act(() => renderer.unmount())
})

describe('AGUI-01 独立有限组件守卫，非实际 GUI', () => {
  it('同名来源跨依据/上下文分组，十行各显自己的稳定 ID 且跳转不写命令', async () => {
    const refs = [
      ref(), ref({ id: 't-0002' }),
      ref({ table: 'milestones', id: 'm-0001' }),
      ref({ table: 'risk_issues', id: 'ri-0001' }),
      ref({ table: 'deliverables', id: 'dlv-0001' }),
      ref({ table: 'meetings', id: 'mtg-0001' }),
      ref({ table: 'milestones', id: 'm-0002', role: 'context' }),
      ref({ table: 'risk_issues', id: 'ri-0002', role: 'context' }),
      ref({ table: 'deliverables', id: 'dlv-0002', role: 'context' }),
      ref({ table: 'meetings', id: 'mtg-0002', role: 'context' }),
    ]
    const types = ['task', 'task', 'milestone', 'risk', 'deliverable', 'meeting',
      'milestone', 'risk', 'deliverable', 'meeting']
    const { renderer, execute, onOpenRecord } = await mount(entry(refs))
    expect(rows(renderer)).toHaveLength(10)
    rows(renderer).forEach((row, i) => {
      expect(text(row.findByProps({ className: 'pm-prov-ref-link' }))).toBe(refs[i].label)
      expect(text(row.findByProps({ className: 'pm-prov-ref-meta' }))).toContain(`${refs[i].id} · `)
      expect(text(row.findByProps({ className: 'pm-prov-ref-role' })))
        .toBe(refs[i].role === 'basis' ? '依据' : '上下文')
      expect(text(row).split(refs[i].id)).toHaveLength(2)
      act(() => row.findByType('button').props.onClick())
    })
    expect(onOpenRecord.mock.calls).toEqual(refs.map((source, i) => [types[i], source.id]))
    expect(execute.mock.calls).toEqual([['ask-provenance p-0001']])
  })

  it.each(['', undefined])('无 label=%s 的 changed/missing/cross-project 三行均不重复 ID、不跳转', async label => {
    const refs = ['t-0001', 't-0002', 't-0003'].map(id => {
      const source = ref({ id })
      if (label === undefined) delete (source as Partial<SourceRef>).label
      else source.label = label
      return source
    })
    const states = ['changed', 'missing', 'cross-project'] as const
    const { renderer, onOpenRecord } = await mount(entry(refs, {
      recheck: { conclusion: 'manual-review',
        rows: refs.map((source, i) => ({ ref: source, state: states[i], reason: '旧原因' })), invalid: [] },
    }))
    rows(renderer).forEach((row, i) => {
      expect(text(row).split(refs[i].id)).toHaveLength(2)
      expect(text(row.findByProps({ className: 'pm-prov-ref-meta' })))
        .toBe('任务 · 快照 v2 · 口径 v3')
      expect(row.props['data-state']).toBe(states[i])
      expect(row.props.className).toContain('is-stale')
      expect(row.findAllByType('button')).toHaveLength(0)
    })
    expect(onOpenRecord).not.toHaveBeenCalled()
  })

  it('标题中的 HTML 样式文本仍是文本节点，不造新元素；元信息和 callback ID 保留', async () => {
    const source = ref({ label: '<img src=x onerror=alert(1)> & "同名来源"' })
    const { renderer, onOpenRecord } = await mount(entry([source]))
    const [row] = rows(renderer)
    expect(text(row.findByType('button'))).toBe(source.label)
    expect(row.findAllByType('img')).toHaveLength(0)
    expect(row.findAll(node => node.props.dangerouslySetInnerHTML !== undefined)).toHaveLength(0)
    expect(text(row.findByProps({ className: 'pm-prov-ref-meta' })))
      .toBe('t-0001 · 任务 · 快照 v2 · 口径 v3')
    act(() => row.findByType('button').props.onClick())
    expect(onOpenRecord.mock.calls).toEqual([['task', 't-0001']])
  })

  it('已失效条目刷新后保旧 refs/history/版本与原 JSON，不自动重校或跳转', async () => {
    const source = ref()
    const value = entry([source], {
      history: [
        { at: '2026-10-20T12:00:00.000Z', conclusion: 'needs-regen', snapshotVersion: 1,
          ruleRevision: 1, rows: [{ ref: source, state: 'changed', reason: '旧正文变更' }] },
        { at: '2026-10-21T12:00:00.000Z', conclusion: 'manual-review', snapshotVersion: 2,
          ruleRevision: 3, rows: [{ ref: source, state: 'missing', reason: '旧记录已删除' }] },
      ],
      recheck: { conclusion: 'manual-review',
        rows: [{ ref: source, state: 'missing', reason: '记录已删除' }],
        invalid: [{ ref: source, reason: 'missing' }] },
    })
    const before = JSON.stringify(value)
    const { renderer, execute, onOpenRecord, raw } = await mount(value)
    const first = JSON.stringify(renderer.toJSON())
    await act(async () => {
      renderer.root.findAllByType('button').find(node => text(node) === '刷新')!.props.onClick()
    })
    expect(JSON.stringify(renderer.toJSON())).toBe(first)
    expect(JSON.stringify(value)).toBe(before)
    expect(JSON.stringify(JSON.parse(raw).entries[0])).toBe(before)
    expect(execute.mock.calls).toEqual([['ask-provenance p-0001'], ['ask-provenance p-0001']])
    expect(rows(renderer)[0].findAllByType('button')).toHaveLength(0)
    expect(text(renderer.root)).toContain('旧正文变更')
    expect(text(renderer.root)).toContain('旧记录已删除')
    expect(renderer.root.findAllByProps({ className: 'pm-prov-history-item' })).toHaveLength(2)
    expect(onOpenRecord).not.toHaveBeenCalled()
  })
})
