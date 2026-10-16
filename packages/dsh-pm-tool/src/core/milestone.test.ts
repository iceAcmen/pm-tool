import { describe, it, expect } from 'vitest'
import { isMilestoneMissed } from './derived.js'

// P0-2：里程碑延期唯一纯谓词。today 注入保证确定性，概览/卡片/stats 同源。

describe('isMilestoneMissed', () => {
  const TODAY = '2026-10-17'

  it('显式 missed 直接计延期，与目标日无关', () => {
    expect(isMilestoneMissed({ status: 'missed', targetDate: '2026-12-01' }, TODAY)).toBe(true)
  })

  it('planned 且已过目标日 → 判延期（概览与卡片同口径）', () => {
    expect(isMilestoneMissed({ status: 'planned', targetDate: '2026-10-10' }, TODAY)).toBe(true)
  })

  it('at_risk 且已过目标日 → 判延期', () => {
    expect(isMilestoneMissed({ status: 'at_risk', targetDate: '2026-10-01' }, TODAY)).toBe(true)
  })

  it('planned 且目标日在未来 → 不延期', () => {
    expect(isMilestoneMissed({ status: 'planned', targetDate: '2026-11-20' }, TODAY)).toBe(false)
  })

  it('目标日恰好今天 → 不延期（days=0 非负）', () => {
    expect(isMilestoneMissed({ status: 'planned', targetDate: TODAY }, TODAY)).toBe(false)
  })

  it('achieved 永不判延期', () => {
    expect(isMilestoneMissed({ status: 'achieved', targetDate: '2026-10-01' }, TODAY)).toBe(false)
  })

  it('无目标日的未达成节点不判延期（诚实降级）', () => {
    expect(isMilestoneMissed({ status: 'planned', targetDate: null }, TODAY)).toBe(false)
  })
})
