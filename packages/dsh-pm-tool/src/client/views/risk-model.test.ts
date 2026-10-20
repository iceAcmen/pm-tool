import { describe, it, expect } from 'vitest'
import { severityOf, isRiskRecord, risksForMatrix } from './risk-model.js'

// G-B 风险纯模型：严重度阈值 + 问题不进概率矩阵。

describe('severityOf 概率×影响阈值', () => {
  it('≤2 低危（绿）：low×low=1、medium×low=2', () => {
    expect(severityOf({ probability: 'low', impact: 'low' })).toBe('low')
    expect(severityOf({ probability: 'medium', impact: 'low' })).toBe('low')
  })

  it('3~4 中危（琥珀）：medium×medium=4、high×low=3', () => {
    expect(severityOf({ probability: 'medium', impact: 'medium' })).toBe('mid')
    expect(severityOf({ probability: 'high', impact: 'low' })).toBe('mid')
  })

  it('≥6 高危（红）：high×medium=6、high×high=9、medium×critical=8', () => {
    expect(severityOf({ probability: 'high', impact: 'medium' })).toBe('high')
    expect(severityOf({ probability: 'high', impact: 'high' })).toBe('high')
    expect(severityOf({ probability: 'medium', impact: 'critical' })).toBe('high')
  })

  it('概率缺失按 low=1 计，不抛错；critical 但概率缺失得分=4 为中危', () => {
    expect(severityOf({ probability: null, impact: 'low' })).toBe('low')
    expect(severityOf({ impact: 'critical' })).toBe('mid')
  })
})

describe('问题不进概率矩阵', () => {
  it('isRiskRecord 仅风险为真，问题为假', () => {
    expect(isRiskRecord({ type: 'risk' })).toBe(true)
    expect(isRiskRecord({ type: 'issue' })).toBe(false)
  })

  it('risksForMatrix 剔除全部问题，只保留风险', () => {
    const all = [
      { type: 'risk', id: 'R1' },
      { type: 'issue', id: 'I1' },
      { type: 'risk', id: 'R2' },
      { type: 'issue', id: 'I2' },
    ]
    expect(risksForMatrix(all).map(r => r.id)).toEqual(['R1', 'R2'])
  })
})
