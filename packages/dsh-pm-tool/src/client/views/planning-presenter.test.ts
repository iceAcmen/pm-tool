import { describe, it, expect } from 'vitest'
import {
  MILESTONE_STATE,
  RISK_SEVERITY,
  GANTT_GRANULARITY,
  milestonePresenter,
  riskSeverityPresenter,
} from './planning-presenter.js'

// G-B 展示层语义合同：状态枚举 → 文案 + 色调（同状态=同文案+同色调，跨页一致）。

describe('里程碑四态语义', () => {
  it('四态文案与色调齐备：计划中/prog、有风险/block、已达成/done、已延期/late', () => {
    expect(MILESTONE_STATE.planned).toEqual({ label: '计划中', tone: 'prog' })
    expect(MILESTONE_STATE.at_risk).toEqual({ label: '有风险', tone: 'block' })
    expect(MILESTONE_STATE.achieved).toEqual({ label: '已达成', tone: 'done' })
    expect(MILESTONE_STATE.missed).toEqual({ label: '已延期', tone: 'late' })
  })

  it('未知状态回落 idle，不抛错', () => {
    expect(milestonePresenter('unknown').tone).toBe('idle')
    expect(milestonePresenter('achieved').label).toBe('已达成')
  })
})

describe('风险严重度三档语义', () => {
  it('低=done、中=block、高=late 色调与文案固定', () => {
    expect(riskSeverityPresenter('low')).toEqual({ label: '低', tone: 'done' })
    expect(riskSeverityPresenter('mid')).toEqual({ label: '中', tone: 'block' })
    expect(riskSeverityPresenter('high')).toEqual({ label: '高', tone: 'late' })
    expect(RISK_SEVERITY.low.label).toBe('低')
  })
})

describe('甘特粒度文案', () => {
  it('日/周/月固定映射', () => {
    expect(GANTT_GRANULARITY.day).toBe('日')
    expect(GANTT_GRANULARITY.week).toBe('周')
    expect(GANTT_GRANULARITY.month).toBe('月')
  })
})
