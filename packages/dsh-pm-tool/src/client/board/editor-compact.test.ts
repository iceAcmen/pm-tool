import { describe, it, expect } from 'vitest'
import { removeWidgetAndCompact, compactVertical } from './editor-ops.js'
import { bboxOverlap } from './projection.js'
import type { WidgetInstance } from './types.js'

const w = (i: string, x: number, y: number, wSize: number, h: number, type = 'recordList'): WidgetInstance => ({
  i, type, config: { title: i }, layout: { i, x, y, w: wSize, h: h, minW: 2, minH: 2 },
})

describe('D-01 编辑态移除后 vertical 压实：不留空行', () => {
  it('移除中间堆叠卡后，下方卡上移贴齐，中间无空行', () => {
    const widgets = [w('a', 0, 0, 4, 4), w('b', 0, 4, 4, 4), w('c', 0, 8, 4, 4)]
    const next = removeWidgetAndCompact(widgets, 'b', 12)
    const c = next.find(x => x.i === 'c')!
    const a = next.find(x => x.i === 'a')!
    expect(a.layout.y).toBe(0)
    expect(c.layout.y).toBe(4) // 从 8 上移到 4，不留 y=4..7 空行
    expect(next).toHaveLength(2)
  })

  it('同列移除上方卡后下方卡补位，异列卡不动', () => {
    const widgets = [
      w('a', 0, 0, 4, 4), w('b', 4, 0, 4, 4), w('c', 0, 4, 4, 4),
    ]
    const next = removeWidgetAndCompact(widgets, 'a', 12)
    const c = next.find(x => x.i === 'c')!
    const b = next.find(x => x.i === 'b')!
    expect(c.layout.y).toBe(0)
    expect(b.layout.y).toBe(0)
  })

  it('压实后任意两卡两维不相交（无碰撞）', () => {
    const widgets = [w('a', 0, 0, 4, 4), w('b', 0, 4, 4, 4), w('c', 0, 8, 4, 4), w('d', 4, 8, 4, 4)]
    const next = removeWidgetAndCompact(widgets, 'b', 12)
    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        expect(bboxOverlap(next[i].layout, next[j].layout)).toBe(false)
      }
    }
  })

  it('只删卡并压实，保留 type/config，不改入参', () => {
    const widgets = [w('a', 0, 0, 4, 4, 'kpiMetric'), w('b', 0, 4, 4, 4)]
    const snapshot = structuredClone(widgets)
    const next = removeWidgetAndCompact(widgets, 'b', 12)
    expect(next[0].type).toBe('kpiMetric')
    expect(next[0].config).toEqual({ title: 'a' })
    expect(widgets).toEqual(snapshot)
  })

  it('compactVertical 对已紧凑布局是恒等（不重排未动的列）', () => {
    const widgets = [w('a', 0, 0, 4, 4), w('b', 4, 0, 4, 4)]
    const next = compactVertical(widgets, 12)
    expect(next.find(x => x.i === 'a')!.layout.y).toBe(0)
    expect(next.find(x => x.i === 'b')!.layout.y).toBe(0)
  })

  it('未知 i 移除时原样返回（不抛错）', () => {
    const widgets = [w('a', 0, 0, 4, 4)]
    expect(removeWidgetAndCompact(widgets, 'nope', 12)).toHaveLength(1)
  })
})
