import { describe, it, expect } from 'vitest'
import {
  buildOkrTree,
  countPendingInbox,
  filterInbox,
  okrStatusLabel,
  type OkrViewRecord,
} from './okr-model.js'

// P2 X7：OKR 前端只读树形纯模型单测（零 I/O、零写）。

const obj = (id: string, extra: Partial<OkrViewRecord> = {}): OkrViewRecord => ({
  id,
  projectId: 'p-1',
  title: `目标 ${id}`,
  kind: 'objective',
  primaryOkrId: null,
  relatedOkrIds: [],
  status: 'draft',
  ...extra,
})

const kr = (id: string, primaryOkrId: string | null, extra: Partial<OkrViewRecord> = {}): OkrViewRecord => ({
  id,
  projectId: 'p-1',
  title: `KR ${id}`,
  kind: 'key-result',
  primaryOkrId,
  relatedOkrIds: [],
  status: 'draft',
  ...extra,
})

describe('buildOkrTree 单父归属与软关联', () => {
  it('objective 为根，KR 按 primaryOkrId 挂父；软关联进 related 不进 children', () => {
    const okrs = [
      obj('o-1', { title: '提升交付稳定性', status: 'confirmed' }),
      kr('kr-1', 'o-1'),
      obj('o-2', { relatedOkrIds: ['o-1'] }),
    ]
    const tree = buildOkrTree(okrs, 'p-1')
    expect(tree.roots).toHaveLength(2)
    const o1 = tree.roots.find(n => n.record.id === 'o-1')!
    expect(o1.children.map(c => c.record.id)).toEqual(['kr-1'])
    const o2 = tree.roots.find(n => n.record.id === 'o-2')!
    expect(o2.children).toEqual([])
    expect(o2.related.map(r => r.id)).toEqual(['o-1'])
    expect(tree.orphans).toEqual([])
    expect(tree.total).toBe(3)
  })

  it('无有效父目标的 KR 进 orphans，不伪造归属；跨项目剔除', () => {
    const okrs = [
      kr('kr-orphan', null),
      kr('kr-other', 'o-missing'),
      obj('o-x', { projectId: 'p-2' }),
    ]
    const tree = buildOkrTree(okrs, 'p-1')
    expect(tree.roots).toEqual([])
    expect(tree.orphans.map(o => o.record.id)).toEqual(['kr-orphan', 'kr-other'])
    expect(tree.total).toBe(2)
  })
})

describe('收件区纯函数', () => {
  it('countPendingInbox 不计已忽略；undefined 返回 0', () => {
    expect(countPendingInbox(undefined, 'p-1')).toBe(0)
    expect(countPendingInbox([
      { id: 's-1', at: '2026-10-01T00:00:00Z', projectId: 'p-1', title: '建议1', kind: 'objective' },
      { id: 's-2', at: '2026-10-02T00:00:00Z', projectId: 'p-1', title: '已忽略', kind: 'key-result', state: 'ignored' },
      { id: 's-3', at: '2026-10-03T00:00:00Z', projectId: 'p-2', title: '别项目', kind: 'objective' },
    ], 'p-1')).toBe(1)
  })

  it('filterInbox 按项目过滤；undefined 返回空数组', () => {
    expect(filterInbox(undefined, 'p-1')).toEqual([])
    const list = filterInbox([
      { id: 's-1', at: 'a', projectId: 'p-1', title: 'x', kind: 'objective' },
      { id: 's-2', at: 'b', projectId: 'p-2', title: 'y', kind: 'objective' },
    ], 'p-1')
    expect(list.map(s => s.id)).toEqual(['s-1'])
  })

  it('okrStatusLabel：draft=草稿，confirmed=已定稿', () => {
    expect(okrStatusLabel('draft')).toBe('草稿')
    expect(okrStatusLabel('confirmed')).toBe('已定稿')
  })
})
