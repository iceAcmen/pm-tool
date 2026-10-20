import { describe, expect, it } from 'vitest'
import { applyWidgetGeometry, arrangeWidgetLayout } from './editor-ops.js'
import { boardBreakpointForWidth } from './projection.js'
import type { WidgetInstance } from './types.js'
import { readFileSync } from 'node:fs'
const w = (i: string, x: number, y: number, width: number, height: number): WidgetInstance => ({
  i, type: 'recordList', config: { title: i, formula: 'count(rows)' }, layout: { i, x, y, w: width, h: height, minW: 2, minH: 2 },
})
const hits = (ws: WidgetInstance[]) => ws.some((a,i) => ws.slice(i+1).some(b => a.layout.x < b.layout.x+b.layout.w && b.layout.x < a.layout.x+a.layout.w && a.layout.y < b.layout.y+b.layout.h && b.layout.y < a.layout.y+a.layout.h))
describe('稳定的宽高编辑与可撤销排版', () => {
  it('实际工作区879px保留12列，较窄画布有对应断点', () => {
    expect(boardBreakpointForWidth(879)).toBe(12)
    expect(boardBreakpointForWidth(620)).toBe(8)
    expect(boardBreakpointForWidth(390)).toBe(1)
  })
  it('增加宽高保留目标尺寸，将被覆盖卡下移，不改数据源/公式', () => {
    const src=[w('a',0,0,4,3),w('b',4,0,4,3),w('c',0,3,4,3)]
    const copy=JSON.stringify(src)
    const next=applyWidgetGeometry(src,'a',{w:8,h:6},12)
    expect(next[0].layout).toMatchObject({w:8,h:6})
    expect(hits(next)).toBe(false)
    expect(next.map(x=>x.config)).toEqual(src.map(x=>x.config))
    expect(JSON.stringify(src)).toBe(copy)
  })
  it('靠右扩大宽度会夹紧列位置，尺寸仍可编辑', () => {
    expect(applyWidgetGeometry([w('a',8,0,4,3)],'a',{w:8},12)[0].layout).toMatchObject({x:4,w:8})
  })
  it('推荐排版填充多列、零相交、不删卡或改配置', () => {
    const src=Array.from({length:5},(_,i)=>w(String(i),0,i*6,9,4))
    const next=arrangeWidgetLayout(src,12)
    expect(next).toHaveLength(5)
    expect(next.some(x=>x.layout.x>0)).toBe(true)
    expect(hits(next)).toBe(false)
    expect(next.map(x=>x.config)).toEqual(src.map(x=>x.config))
  })
  it('禁止被动 onLayoutChange 回写草稿，尺寸应用有明确入口', () => {
    const src=readFileSync(new URL('./editor.tsx',import.meta.url),'utf8')
    expect(src).not.toContain('onLayoutChange={(next: Layout[]) =>')
    expect(src).toContain('应用位置与尺寸')
    expect(src).toContain('onResizeStop=')
  })
})
