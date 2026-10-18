import { describe, it, expect } from 'vitest'
import {
  breakpointForWidth, projectToBreakpoint, reverseFromBreakpoint,
  findCanonicalCollisions, sinkCanonicalCollisions,
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
