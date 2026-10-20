import { describe, it, expect } from 'vitest'
import { validateSettingsValues } from './settings-drawer.js'
import { DEFAULT_PROJECT_SETTINGS, SETTING_FIELDS } from '../../../core/settings.js'

// G-D 口径设置纯校验：整数区间就近红框 + 绿≥黄灯交叉校验；失败保输入（纯函数不改入参）。

const validDefaults = (): Record<string, string> =>
  Object.fromEntries(SETTING_FIELDS.map(f => [f.key, String(DEFAULT_PROJECT_SETTINGS[f.key])]))

describe('validateSettingsValues 整数区间', () => {
  it('默认全合法 → 无错误', () => {
    expect(validateSettingsValues(validDefaults())).toEqual({})
  })

  it('空串 / 小数 / NaN → 须为整数', () => {
    const v = validDefaults()
    v.healthOverduePer = ''
    expect(validateSettingsValues(v).healthOverduePer).toMatch(/整数/)
    const v2 = validDefaults()
    v2.healthOverduePer = '1.5'
    expect(validateSettingsValues(v2).healthOverduePer).toMatch(/整数/)
  })

  it('超出 min~max → 区间错误且带当前值', () => {
    const v = validDefaults()
    v.healthOverduePer = '999'
    expect(validateSettingsValues(v).healthOverduePer).toMatch(/999/)
    const v2 = validDefaults()
    v2.healthOverduePer = '-3'
    expect(validateSettingsValues(v2).healthOverduePer).toBeTruthy()
  })
})

describe('绿≥黄灯交叉校验', () => {
  it('绿灯线 < 黄灯线 → 绿字段红框「绿灯线不得低于黄灯线」', () => {
    const v = validDefaults()
    v.healthGreenAt = '50'
    v.healthYellowAt = '60'
    const errs = validateSettingsValues(v)
    expect(errs.healthGreenAt).toBe('绿灯线不得低于黄灯线')
  })

  it('绿灯线 ≥ 黄灯线（相等或更高）→ 无交叉错误', () => {
    const v = validDefaults()
    v.healthGreenAt = '80'
    v.healthYellowAt = '80'
    expect(validateSettingsValues(v).healthGreenAt).toBeUndefined()
    const v2 = validDefaults()
    v2.healthGreenAt = '90'
    v2.healthYellowAt = '60'
    expect(validateSettingsValues(v2).healthGreenAt).toBeUndefined()
  })

  it('纯函数不改写入参（失败保输入）', () => {
    const v = validDefaults()
    v.healthGreenAt = '50'
    v.healthYellowAt = '60'
    const snapshot = { ...v }
    validateSettingsValues(v)
    expect(v).toEqual(snapshot)
  })
})
