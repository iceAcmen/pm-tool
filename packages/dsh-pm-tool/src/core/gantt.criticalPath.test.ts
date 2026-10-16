import { describe, it, expect } from 'vitest'
import { criticalPath, type CpmTaskInput } from './gantt.js'

// #24 单元层：CPM 纯函数（确定性、零 I/O、零网络）。集成/存储门仍由 verify-isolation 承担。

const dated = (id: string, startDate: string, dueDate: string, predecessorIds: string[] = []): CpmTaskInput =>
  ({ id, startDate, dueDate, predecessorIds })

describe('criticalPath 线性链', () => {
  const chain: CpmTaskInput[] = [
    dated('A', '2026-01-01', '2026-01-03'),
    dated('B', '2026-01-03', '2026-01-05', ['A']),
    dated('C', '2026-01-05', '2026-01-08', ['B']),
  ]

  it('A→B→C 全在关键路径，slack 全为 0', () => {
    const r = criticalPath(chain)
    expect(r.criticalPath).toEqual(['A', 'B', 'C'])
    for (const id of ['A', 'B', 'C']) {
      expect(r.nodes[id].onCriticalPath).toBe(true)
      expect(r.nodes[id].slack).toBe(0)
    }
  })

  it('关键边两端均在关键路径（3 条边全关键）', () => {
    const r = criticalPath(chain)
    const criticalEdges = r.edges.filter(e => e.onCriticalPath)
    expect(criticalEdges.map(e => `${e.fromId}->${e.toId}`)).toEqual(['A->B', 'B->C'])
    expect(r.edges.every(e => e.onCriticalPath)).toBe(true)
  })

  it('确定性：同输入两次结果逐字段一致', () => {
    const a = criticalPath(chain)
    const b = criticalPath(chain)
    expect(JSON.stringify(a.nodes)).toEqual(JSON.stringify(b.nodes))
    expect(a.criticalPath).toEqual(b.criticalPath)
  })
})

describe('criticalPath 成环', () => {
  it('A→B→A 不崩溃、不死循环，环上节点 inCycle 且不高亮', () => {
    const r = criticalPath([
      dated('X', '2026-01-01', '2026-01-03', ['Y']),
      dated('Y', '2026-01-03', '2026-01-05', ['X']),
    ])
    expect(r.hasCycle).toBe(true)
    expect(r.cycleTaskIds.sort()).toEqual(['X', 'Y'])
    for (const id of ['X', 'Y']) {
      expect(r.nodes[id].inCycle).toBe(true)
      expect(r.nodes[id].onCriticalPath).toBe(false)
      expect(r.nodes[id].slack).toBeNull()
    }
    expect(r.criticalPath).toEqual([])
    expect(r.skipped.cycle).toBeGreaterThanOrEqual(1)
    expect(r.warnings.some(w => w.includes('成环'))).toBe(true)
  })
})

describe('criticalPath 缺日期诚实降级', () => {
  it('缺 startDate/dueDate 的节点标 missingDate、不参与、不顺延补日期', () => {
    const r = criticalPath([
      dated('A', '2026-01-01', '2026-01-03'),
      { id: 'M', predecessorIds: ['A'] }, // 无任何日期
      dated('C', '2026-01-05', '2026-01-08', ['A']),
    ])
    expect(r.nodes['M'].missingDate).toBe(true)
    expect(r.nodes['M'].onCriticalPath).toBe(false)
    expect(r.hasMissingDate).toBe(true)
    expect(r.skipped.missingDate).toBeGreaterThanOrEqual(1)
    // A 仍在关键路径；缺日期段不被自动补/顺延。
    expect(r.criticalPath).toContain('A')
    expect(r.criticalPath).not.toContain('M')
  })
})

describe('criticalPath 悬空与多分量', () => {
  it('悬空前置（指向不存在 id）计数为 dangling，不崩溃', () => {
    const r = criticalPath([dated('A', '2026-01-01', '2026-01-03', ['ghost-z'])])
    expect(r.skipped.dangling).toBe(1)
    expect(r.danglingPredecessors[0]).toMatchObject({ taskId: 'A', missingId: 'ghost-z' })
    expect(r.criticalPath).toEqual(['A'])
  })

  it('两个互不相连的分量各自内部关键，短分量不被全局终点挤出假时差', () => {
    const r = criticalPath([
      dated('P', '2026-01-01', '2026-01-02'),
      dated('Q', '2026-01-02', '2026-01-04', ['P']),
      dated('R', '2026-02-01', '2026-02-02'), // 独立分量单点
    ])
    expect(r.criticalPath.sort()).toEqual(['P', 'Q', 'R'])
    for (const id of ['P', 'Q', 'R']) expect(r.nodes[id].slack).toBe(0)
  })

  it('空输入返回空结构不抛', () => {
    const r = criticalPath([])
    expect(r.criticalPath).toEqual([])
    expect(r.nodes).toEqual({})
    expect(r.edges).toEqual([])
  })
})
