import { describe, it, expect } from 'vitest'
import { loadScale } from './people-scale.js'

// G-B 人员负载同刻度：scaleMax 含未分配桶；过滤/筛选不缩尺。

describe('loadScale 同刻度', () => {
  it('空分配 + 阈值/未分配为 0 → 下限 8，刻度 0..8 步长 2', () => {
    const { maxX, ticks } = loadScale([], 0, 0)
    expect(maxX).toBe(8)
    expect(ticks).toEqual([0, 2, 4, 6, 8])
  })

  it('未分配桶 open 计入上限（即使已分配都很小）→ 未分配驱动 maxX', () => {
    const { maxX } = loadScale([3, 2], 9, 5)
    // rawMax=9 → ceil((9+2)/2)*2=12
    expect(maxX).toBe(12)
  })

  it('过滤/筛选不缩尺：阈值仍计入，maxX 不随可见人数收缩到阈值以下', () => {
    const { maxX } = loadScale([1], 0, 20)
    // rawMax=20 → ceil(22/2)*2=22
    expect(maxX).toBe(22)
  })

  it('向上取整到 2 的倍数并 +2 留余量', () => {
    expect(loadScale([7], 0, 0).maxX).toBe(10) // rawMax=7 → ceil(9/2)*2=10
    expect(loadScale([8], 0, 0).maxX).toBe(10) // rawMax=8 → ceil(10/2)*2=10
  })
})
