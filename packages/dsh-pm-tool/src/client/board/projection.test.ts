import { describe, it, expect } from 'vitest'
import {
  breakpointForWidth, projectToBreakpoint, reverseFromBreakpoint,
  findCanonicalCollisions, sinkCanonicalCollisions, compactDisplayCollisions,
} from './projection.js'
import type { WidgetInstance } from './types.js'

const w = (i: string, x: number, y: number, w: number, h: number, minW = 2): WidgetInstance => ({
  i, type: 'recordList', config: {}, layout: { i, x, y, w, h, minW, minH: 2 },
})

describe('breakpointForWidth（契约 §3.6：1200/996/768）', () => {
  it('四档阈值正确', () => {
    expect(breakpointForWidth(1440)).toBe(12)
    expect(breakpointForWidth(1200)).toBe(12)
    expect(breakpointForWidth(1199)).toBe(8)
    expect(breakpointForWidth(996)).toBe(8)
    expect(breakpointForWidth(995)).toBe(4)
    expect(breakpointForWidth(768)).toBe(4)
    expect(breakpointForWidth(767)).toBe(1)
  })
})

describe('projectToBreakpoint canonical12 → 断点显示', () => {
  it('cols=12 恒等投影', () => {
    const src = [w('a', 0, 0, 4, 3), w('b', 6, 2, 6, 4)]
    expect(projectToBreakpoint(src, 12)).toEqual(src.map(x => ({ ...x.layout })))
  })
  it('cols=8 按比例缩放并夹紧，不越右界', () => {
    const src = [w('a', 0, 0, 12, 3, 3)]
    const [p] = projectToBreakpoint(src, 8)
    expect(p.x).toBe(0)
    expect(p.w).toBeLessThanOrEqual(8)
    expect(p.x + p.w).toBeLessThanOrEqual(8)
  })
  it('cols=4 单列坐标压缩且 minW 保底', () => {
    const src = [w('a', 0, 0, 6, 3, 3)]
    const [p] = projectToBreakpoint(src, 4)
    expect(p.w).toBeGreaterThanOrEqual(3)
    expect(p.x + p.w).toBeLessThanOrEqual(4)
  })
  it('cols=1 全部 x=0 w=1，按顺序紧凑堆叠 y', () => {
    const src = [w('a', 0, 0, 6, 3), w('b', 6, 2, 6, 4)]
    const p = projectToBreakpoint(src, 1)
    expect(p[0]).toMatchObject({ x: 0, w: 1, y: 0 })
    expect(p[1]).toMatchObject({ x: 0, w: 1, y: 3 })
  })
})

describe('reverseFromBreakpoint 断点 → canonical12（窄存回宽不丢坐标）', () => {
  it('cols=12 原样回写', () => {
    const src = [w('a', 1, 2, 4, 3)]
    const back = reverseFromBreakpoint(src, [{ i: 'a', x: 1, y: 9, w: 4, h: 5 }], 12)
    expect(back[0].layout).toMatchObject({ x: 1, y: 9, w: 4, h: 5 })
  })
  it('cols=8 回算到 12 列并夹紧右界', () => {
    const src = [w('a', 0, 0, 6, 3)]
    const back = reverseFromBreakpoint(src, [{ i: 'a', x: 4, y: 1, w: 4, h: 3 }], 8)
    expect(back[0].layout.x).toBeGreaterThanOrEqual(0)
    expect(back[0].layout.x + back[0].layout.w).toBeLessThanOrEqual(12)
  })
  it('cols=1 保留旧 canonical x/w，只接受堆叠 y', () => {
    const src = [w('a', 3, 0, 6, 3)]
    const back = reverseFromBreakpoint(src, [{ i: 'a', x: 0, y: 7, w: 1, h: 3 }], 1)
    expect(back[0].layout).toMatchObject({ x: 3, w: 6, y: 7 })
  })
  it('未知卡保留原样', () => {
    const src = [w('a', 0, 0, 4, 3)]
    const back = reverseFromBreakpoint(src, [], 12)
    expect(back[0]).toEqual(src[0])
  })
})

describe('findCanonicalCollisions / sinkCanonicalCollisions', () => {
  it('相交卡对被检出，相邻不算', () => {
    const l = [w('a', 0, 0, 4, 3), w('b', 3, 1, 4, 3), w('c', 8, 0, 4, 3)]
    expect(findCanonicalCollisions(l)).toEqual([['a', 'b']])
  })
  it('自动下沉后任意两卡 bbox 不相交', () => {
    const l = [w('a', 0, 0, 4, 3), w('b', 0, 0, 4, 3), w('c', 8, 0, 4, 3)]
    const { widgets, sunk } = sinkCanonicalCollisions(l)
    expect(sunk.map(s => s.i)).toEqual(['b'])
    expect(findCanonicalCollisions(widgets)).toEqual([])
  })
})

describe('compactDisplayCollisions（浏览态纯展示去碰撞）', () => {
  it('非相交卡 x/y/w/h 原样保留，不改动', () => {
    const items = [
      { i: 'a', x: 0, y: 0, w: 4, h: 6 },
      { i: 'b', x: 4, y: 0, w: 8, h: 3 },
      { i: 'c', x: 4, y: 3, w: 4, h: 4 },
    ]
    expect(compactDisplayCollisions(items)).toEqual(items)
  })

  it('相交的第二卡垂直下沉到首个无碰撞行，首卡不动，x/w/h 不变', () => {
    const items = [
      { i: 'a', x: 0, y: 0, w: 4, h: 3 },
      { i: 'b', x: 0, y: 0, w: 4, h: 3 },
      { i: 'c', x: 8, y: 0, w: 4, h: 3 },
    ]
    const out = compactDisplayCollisions(items)
    expect(out[0]).toMatchObject({ x: 0, y: 0, w: 4, h: 3 })
    expect(out[1]).toMatchObject({ x: 0, w: 4, h: 3, y: 3 })
    expect(out[2]).toMatchObject({ x: 8, y: 0, w: 4, h: 3 })
  })

  it('cols=8 投影后的默认/旧11布局经去碰撞后零 bbox 相交', () => {
    const def = [
      { layout: { i: 'hero', x: 0, y: 0, w: 4, h: 10 } },
      { layout: { i: 'ms', x: 4, y: 0, w: 8, h: 3 } },
      { layout: { i: 'scale', x: 4, y: 3, w: 4, h: 4 } },
      { layout: { i: 'obj', x: 8, y: 3, w: 4, h: 4 } },
      { layout: { i: 'load', x: 4, y: 7, w: 8, h: 3 } },
      { layout: { i: 'risk', x: 0, y: 10, w: 4, h: 4 } },
      { layout: { i: 'week', x: 4, y: 10, w: 8, h: 4 } },
      { layout: { i: 'queue', x: 0, y: 14, w: 4, h: 5 } },
    ]
    for (const cols of [12, 8, 4, 1] as const) {
      const projected = projectToBreakpoint(def, cols)
      const out = compactDisplayCollisions(projected)
      for (let i = 0; i < out.length; i++) {
        for (let j = i + 1; j < out.length; j++) {
          const a = out[i], b = out[j]
          const xHit = a.x < b.x + b.w && b.x < a.x + a.w
          const yHit = a.y < b.y + b.h && b.y < a.y + a.h
          expect(xHit && yHit).toBe(false)
        }
      }
    }
  })
})
