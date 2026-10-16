import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PROJECT_SETTINGS,
  normalizeProjectSettings,
  sameSettings,
  SETTING_FIELDS,
} from './settings.js'

// #24 单元层：口径设置默认值 / 归一化 / 校验（纯函数、零 I/O）。

describe('DEFAULT_PROJECT_SETTINGS 锁定原硬编码现值', () => {
  it('逐项等于配置化前硬编码（默认等价基线）', () => {
    expect(DEFAULT_PROJECT_SETTINGS).toMatchObject({
      healthOverduePer: 3,
      healthBlockedPer: 4,
      healthHighRiskPer: 6,
      healthCriticalRiskPer: 10,
      healthOverdueMilestonePer: 8,
      healthCapOverdueTasks: 15,
      healthCapBlockedTasks: 12,
      healthCapOpenRisk: 20,
      healthCapOverdueMilestones: 16,
      healthGreenAt: 80,
      healthYellowAt: 60,
      reminderWithinDays: 7,
      loadOverloadThreshold: 5,
    })
    expect(SETTING_FIELDS).toHaveLength(13)
  })
})

describe('normalizeProjectSettings', () => {
  it('缺省/非对象 → 全默认、不抛', () => {
    for (const raw of [undefined, null, 123, 'str', [], true]) {
      const { settings } = normalizeProjectSettings(raw)
      expect(sameSettings(settings, DEFAULT_PROJECT_SETTINGS)).toBe(true)
    }
  })

  it('合法覆盖逐值采纳，合法字段不计 invalid', () => {
    const { settings, invalid } = normalizeProjectSettings({ loadOverloadThreshold: 8, healthGreenAt: 90 })
    expect(settings.loadOverloadThreshold).toBe(8)
    expect(settings.healthGreenAt).toBe(90)
    expect(settings.healthYellowAt).toBe(60)
    expect(invalid).toEqual([])
  })

  it('非法值（非整数/越界）回落默认并列入 invalid，不静默改写', () => {
    const { settings, invalid } = normalizeProjectSettings({
      loadOverloadThreshold: 3.7,
      healthOverduePer: 999,
      unknownKey: 1, // 未知键忽略
    })
    expect(settings.loadOverloadThreshold).toBe(DEFAULT_PROJECT_SETTINGS.loadOverloadThreshold)
    expect(settings.healthOverduePer).toBe(DEFAULT_PROJECT_SETTINGS.healthOverduePer)
    expect(invalid.length).toBeGreaterThanOrEqual(2)
  })

  it('绿灯线 < 黄灯线（灯号倒挂）两者一起回落默认', () => {
    const { settings, invalid } = normalizeProjectSettings({ healthGreenAt: 30, healthYellowAt: 60 })
    expect(settings.healthGreenAt).toBe(80)
    expect(settings.healthYellowAt).toBe(60)
    expect(invalid.some(s => s.includes('倒挂') || s.includes('绿灯'))).toBe(true)
  })

  it('sameSettings 逐值比较：相等 true，任一不同 false', () => {
    const { settings } = normalizeProjectSettings({ loadOverloadThreshold: 9 })
    expect(sameSettings(settings, DEFAULT_PROJECT_SETTINGS)).toBe(false)
    expect(sameSettings(DEFAULT_PROJECT_SETTINGS, DEFAULT_PROJECT_SETTINGS)).toBe(true)
  })
})
