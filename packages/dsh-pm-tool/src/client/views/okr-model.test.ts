import { describe, it, expect } from 'vitest'
import {
  buildOkrTree,
  countPendingInbox,
  filterInbox,
  okrStatusLabel,
  validateRelatedOkrIds,
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

  it('单父计权：软关联（relatedOkrIds）不进入任何 children，权重只认 primaryOkrId', () => {
    const okrs = [
      obj('o-1'),
      obj('o-2', { relatedOkrIds: ['o-1'] }),
      // kr-2 软挂 o-2，但主归属仍是 o-1；o-2 的 children 必须为空。
      kr('kr-2', 'o-1', { relatedOkrIds: ['o-2'] }),
    ]
    const tree = buildOkrTree(okrs, 'p-1')
    const o1 = tree.roots.find(n => n.record.id === 'o-1')!
    const o2 = tree.roots.find(n => n.record.id === 'o-2')!
    expect(o1.children.map(c => c.record.id)).toEqual(['kr-2'])
    expect(o2.children).toEqual([])
    expect(o2.related.map(r => r.id)).toEqual(['o-1'])
  })

  it('primaryOkrId 指向缺失目标 → 孤儿单列（存在性由后端校验，前端不伪造归属）', () => {
    const okrs = [kr('kr-missing-parent', 'o-deleted')]
    const tree = buildOkrTree(okrs, 'p-1')
    expect(tree.roots).toEqual([])
    expect(tree.orphans.map(o => o.record.id)).toEqual(['kr-missing-parent'])
  })
})

describe('收件区纯函数', () => {
  it('countPendingInbox 仅计未处理：confirmed 已采纳 / ignored 已忽略都不计；undefined 返回 0', () => {
    expect(countPendingInbox(undefined, 'p-1')).toBe(0)
    expect(countPendingInbox([
      { id: 's-1', at: '2026-10-01T00:00:00Z', projectId: 'p-1', title: '待确认', kind: 'objective' },
      { id: 's-2', at: '2026-10-02T00:00:00Z', projectId: 'p-1', title: '已忽略', kind: 'key-result', state: 'ignored' },
      { id: 's-3', at: '2026-10-03T00:00:00Z', projectId: 'p-1', title: '已采纳', kind: 'objective', state: 'confirmed' },
      { id: 's-4', at: '2026-10-04T00:00:00Z', projectId: 'p-2', title: '别项目', kind: 'objective' },
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

// ===== D-12 软关联保存前内联校验（C-13）：格式错 / 未知 ID 均阻塞提交，就近标红，不落页面横幅 =====

describe('validateRelatedOkrIds 保存前内联校验（未知 ID 阻塞）', () => {
  const known = new Set(['okr-a', 'okr-b'])
  it('空/仅空白通过，不报错', () => {
    const v = validateRelatedOkrIds('', known)
    expect(v.ok).toBe(true)
    expect(v.blocking).toEqual([])
  })
  it('逗号/中文逗号拆分去重；命中已知集通过', () => {
    const v = validateRelatedOkrIds('okr-a，okr-b, okr-a', known)
    expect(v.ok).toBe(true)
    expect(v.blocking).toEqual([])
  })
  it('格式非法（含空格/中文/特殊字符）进 blocking 拦截提交，给修复动作', () => {
    const v = validateRelatedOkrIds('okr-a, 1 2, okr-中文', known)
    expect(v.ok).toBe(false)
    expect(v.blocking).toEqual(['1 2', 'okr-中文'])
    expect(v.message).toContain('格式非法')
    expect(v.message).toContain('移除该 ID')
  })
  it('格式合法但不在已知集 → 同样 blocking 拦截提交（保存前标红，零写保输入，不靠后端再拒）', () => {
    const v = validateRelatedOkrIds('okr-a, okr-ghost', known)
    expect(v.ok).toBe(false)
    expect(v.blocking).toEqual(['okr-ghost'])
    expect(v.message).toContain('未在本项目目标列表中找到')
    expect(v.message).toContain('不计权重')
    expect(v.message).toContain('不影响主归属')
    expect(v.message).toContain('移除该 ID')
  })
})
