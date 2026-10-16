import { describe, it, expect } from 'vitest'
import { resolveTaskProgressMeta, type TaskProgress } from './progress-derivation.js'

// #24 单元层：客观/人工双轨解析（纯函数、零 I/O）。

const objective = (value: number | null, checklist?: { checked: number, total: number }): TaskProgress =>
  ({
    value,
    source: value === null ? 'none' : 'checklist',
    checklist: checklist ?? null,
  } as TaskProgress)

describe('resolveTaskProgressMeta 客观/人工双轨', () => {
  it('有清单客观派生时，无人工 → mode=objective，display=objective', () => {
    const meta = resolveTaskProgressMeta({}, objective(50, { checked: 2, total: 4 }))
    expect(meta.objective).toBe(50)
    expect(meta.manual).toBeNull()
    expect(meta.display).toBe(50)
    expect(meta.mode).toBe('objective')
  })

  it('人工设定与客观并存：manual 不污染 objective，display 人工优先，mode=manual', () => {
    const meta = resolveTaskProgressMeta(
      { manualProgress: 30, manualProgressNote: '人工拍板' },
      objective(50, { checked: 2, total: 4 }),
    )
    expect(meta.objective).toBe(50) // 客观保持 50，不被人工 30 覆盖
    expect(meta.manual).toBe(30)
    expect(meta.display).toBe(30)
    expect(meta.mode).toBe('manual')
    expect(meta.manualNote).toBe('人工拍板')
  })

  it('无清单/无信号：objective=null，未人工 → mode=none，display=null（不伪造 0%）', () => {
    const meta = resolveTaskProgressMeta({}, objective(null))
    expect(meta.objective).toBeNull()
    expect(meta.manual).toBeNull()
    expect(meta.display).toBeNull()
    expect(meta.mode).toBe('none')
  })

  it('清除人工（manualProgress=null）→ 回落客观，mode=objective', () => {
    const meta = resolveTaskProgressMeta(
      { manualProgress: null },
      objective(50, { checked: 2, total: 4 }),
    )
    expect(meta.manual).toBeNull()
    expect(meta.display).toBe(50)
    expect(meta.mode).toBe('objective')
  })

  it('无客观仅有人工：mode=manual，display=manual，objective=null', () => {
    const meta = resolveTaskProgressMeta({ manualProgress: 100 }, objective(null))
    expect(meta.objective).toBeNull()
    expect(meta.manual).toBe(100)
    expect(meta.display).toBe(100)
    expect(meta.mode).toBe('manual')
  })
})
