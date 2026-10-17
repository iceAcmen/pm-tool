import { describe, it, expect } from 'vitest'
import { routeEdge } from './gantt'

const PX = 16
const X1 = 180
const Y1 = 60
const Y2 = 120
const BAR_W = 80

function edgeFor(gapDays: number) {
  const x2 = X1 + gapDays * PX
  return routeEdge(
    { x1: X1, y1: Y1, x2, y2: Y2, bRight: x2 + BAR_W },
    { pxPerDay: PX },
  )
}

describe('routeEdge 依赖连线（箭头应指向后置开始时间 B 左缘、朝右）', () => {
  it('严重重叠（gap < -2 天）走右侧大 U，箭头落 B 右缘', () => {
    const r = edgeFor(-3)
    expect(r.kind).toBe('overlap')
    expect(r.endX).toBe(X1 - 3 * PX + BAR_W)
  })

  it('gap=-2/-1 轻度重叠走行间小凹形，箭头仍落 B 左缘、通道在左', () => {
    for (const g of [-2, -1]) {
      const r = edgeFor(g)
      const x2 = X1 + g * PX
      expect(r.kind).toBe('overlap-tight')
      expect(r.endX).toBe(x2)
      expect(r.channelX).toBeLessThan(x2)
      expect(r.d.trim().endsWith(`H ${x2}`)).toBe(true)
    }
  })

  it('gap=0 紧贴走小凹形，箭头朝右落 B 左缘（不重叠）', () => {
    const r = edgeFor(0)
    expect(r.kind).toBe('tight')
    expect(r.endX).toBe(X1)
    expect(r.channelX).toBeLessThan(X1)
    expect(r.d.trim().endsWith(`H ${X1}`)).toBe(true)
  })

  it('gap=1 间隙紧走自适应圆角 tight，箭头朝右落 B 左缘', () => {
    const r = edgeFor(1)
    expect(r.kind).toBe('tight')
    expect(r.endX).toBe(X1 + PX)
    expect(r.d.trim().endsWith(`H ${X1 + PX}`)).toBe(true)
  })

  it('gap≥2 走标准 L（normal），箭头朝右落 B 左缘', () => {
    for (const g of [2, 3, 4, 7, 10]) {
      const r = edgeFor(g)
      const x2 = X1 + g * PX
      expect(r.kind).toBe('normal')
      expect(r.endX).toBe(x2)
      expect(r.d.trim().endsWith(`H ${x2}`)).toBe(true)
    }
  })
})
