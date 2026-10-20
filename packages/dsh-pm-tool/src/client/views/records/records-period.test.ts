import { describe, it, expect } from 'vitest'
import { periodPresets, periodKind, PERIOD_KIND_LABEL, validatePeriod } from './records-period.js'

describe('periodPresets：周一为起点，today 传入确定性，不取墙钟', () => {
  it('2026-10-19（周一）→ 本周 10-19~10-25，上周 10-12~10-18', () => {
    const presets = periodPresets('2026-10-19')
    const thisWeek = presets.find(p => p.key === 'thisWeek')!
    const lastWeek = presets.find(p => p.key === 'lastWeek')!
    expect(thisWeek.start).toBe('2026-10-19')
    expect(thisWeek.end).toBe('2026-10-25')
    expect(lastWeek.start).toBe('2026-10-12')
    expect(lastWeek.end).toBe('2026-10-18')
    expect(presets.find(p => p.key === 'custom')).toMatchObject({ start: '', end: '' })
  })
  it('2026-10-18（周日）仍归属本周，周一回退到 10-12', () => {
    const thisWeek = periodPresets('2026-10-18').find(p => p.key === 'thisWeek')!
    expect(thisWeek.start).toBe('2026-10-12')
    expect(thisWeek.end).toBe('2026-10-18')
  })
})

describe('periodKind：≤10 周报 / ≤45 月报 / 其余自定义', () => {
  it('七天周报，三十天月报，六十天自定义', () => {
    expect(periodKind('2026-10-12', '2026-10-18')).toBe('w')
    expect(PERIOD_KIND_LABEL.w).toBe('周报')
    expect(periodKind('2026-10-01', '2026-10-31')).toBe('m')
    expect(periodKind('2026-10-01', '2026-11-30')).toBe('c')
  })
})

describe('validatePeriod：必填/真实日历日/结束不早于开始', () => {
  it('空起止报错；结束早于开始报错；合法通过', () => {
    expect(validatePeriod('', '').periodStart).toBeTruthy()
    expect(validatePeriod('2026-13-99', '').periodStart).toBeTruthy()
    expect(validatePeriod('2026-10-18', '2026-10-12').periodEnd).toBe('周期结束日期不得早于开始日期')
    expect(validatePeriod('2026-10-12', '2026-10-18')).toEqual({})
  })
})
