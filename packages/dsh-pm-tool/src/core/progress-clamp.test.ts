import { describe, it, expect } from 'vitest'
import {
  clampProgress,
  isProgressOutOfRange,
  resolveTaskProgressMeta,
  type TaskProgress,
} from './progress-derivation.js'

// B 批：进度越界 clamp / 越界判定。展示值统一落 0..100，脏原值保留供 UI 检测。

const objective = (value: number | null): TaskProgress =>
  ({ value, source: value === null ? 'none' : 'checklist', checklist: null }) as TaskProgress

describe('clampProgress 展示钳制', () => {
  it('合法值原样返回（0..100）', () => {
    expect(clampProgress(42)).toBe(42)
    expect(clampProgress(0)).toBe(0)
    expect(clampProgress(100)).toBe(100)
  })

  it('超过 100 的脏值（现网 1.3 实测 123）→ 100', () => {
    expect(clampProgress(123)).toBe(100)
    expect(clampProgress(999)).toBe(100)
  })

  it('负值 → 0', () => {
    expect(clampProgress(-5)).toBe(0)
  })

  it('非有限数（NaN / Infinity / -Infinity）→ 0', () => {
    expect(clampProgress(NaN)).toBe(0)
    expect(clampProgress(Infinity)).toBe(0)
    expect(clampProgress(-Infinity)).toBe(0)
  })

  it('null / undefined → 0（缺省按 0 展示）', () => {
    expect(clampProgress(null)).toBe(0)
    expect(clampProgress(undefined)).toBe(0)
  })
})

describe('isProgressOutOfRange 越界判定（纯检测，不改写）', () => {
  it('合法值（含边界 0 / 100）→ false', () => {
    expect(isProgressOutOfRange(0)).toBe(false)
    expect(isProgressOutOfRange(100)).toBe(false)
    expect(isProgressOutOfRange(42)).toBe(false)
  })

  it('>100 / <0 → true', () => {
    expect(isProgressOutOfRange(123)).toBe(true)
    expect(isProgressOutOfRange(-1)).toBe(true)
  })

  it('非有限数 → true；null / undefined（缺省）→ false', () => {
    expect(isProgressOutOfRange(NaN)).toBe(true)
    expect(isProgressOutOfRange(Infinity)).toBe(true)
    expect(isProgressOutOfRange(null)).toBe(false)
    expect(isProgressOutOfRange(undefined)).toBe(false)
  })
})

describe('resolveTaskProgressMeta 展示值 clamp（脏 manual 不污染对外）', () => {
  it('manualProgress=123：manual 保留原值供检测，display 钳到 100，mode 仍为 manual', () => {
    const meta = resolveTaskProgressMeta({ manualProgress: 123 }, objective(null))
    expect(meta.manual).toBe(123)
    expect(isProgressOutOfRange(meta.manual)).toBe(true)
    expect(meta.display).toBe(100)
    expect(meta.mode).toBe('manual')
  })

  it('manualProgress=-8：manual 保留原值，display 钳到 0', () => {
    const meta = resolveTaskProgressMeta({ manualProgress: -8 }, objective(null))
    expect(meta.manual).toBe(-8)
    expect(meta.display).toBe(0)
  })

  it('无 manual / 无客观：display=null（不伪造 0%），clamp 不把 null 变 0', () => {
    const meta = resolveTaskProgressMeta({}, objective(null))
    expect(meta.display).toBeNull()
    expect(meta.mode).toBe('none')
  })
})
