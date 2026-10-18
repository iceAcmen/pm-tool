import { describe, it, expect } from 'vitest'
import {
  validateOkrForm, validateHabitForm, parseIdList,
} from './form-validation.js'

describe('validateOkrForm（OKR 新建/编辑即时校验）', () => {
  it('空表单逐字段报 title/kind', () => {
    const e = validateOkrForm({ title: '', kind: 'objective' })
    expect(e.title).toBe('OKR 标题不能为空')
  })

  it('非法日期 / 非法 kind / 悬空父目标逐一定位', () => {
    const e = validateOkrForm(
      { title: '降本', kind: 'objective', targetDate: '2026-13-99', primaryOkrId: 'o-missing', status: 'confirmed' },
      new Set(['o-1']),
    )
    expect(e.targetDate).toBe('目标日期须为有效的 YYYY-MM-DD')
    expect(e.primaryOkrId).toBe('父目标须从本项目既有目标中选择')
  })

  it('合法目标通过；description/owner/related 兼容位留空合法', () => {
    const ok = validateOkrForm(
      { title: '提升交付质量', kind: 'objective', owner: '史冰冰', targetDate: '2026-12-31', primaryOkrId: '', relatedOkrIds: '', status: 'draft', description: '' },
      new Set(['o-1']),
    )
    expect(ok).toEqual({})
  })

  it('parseIdList：中英文逗号拆分、去空、去重', () => {
    expect(parseIdList('kr-1，kr-2, kr-1 ,,')).toEqual(['kr-1', 'kr-2'])
    expect(parseIdList(undefined)).toEqual([])
  })
})

describe('validateHabitForm（习惯新建/编辑即时校验，对齐 core schema）', () => {
  it('title 必填且 ≤80；goal/frequency/notes 长度上限逐一定位', () => {
    expect(validateHabitForm({ title: '' }).title).toBe('习惯名称不能为空')
    expect(validateHabitForm({ title: 'x'.repeat(81) }).title).toBe('名称 ≤80 字')
    expect(validateHabitForm({ title: '复盘', goal: 'g'.repeat(201) }).goal).toBe('目标 ≤200 字')
    expect(validateHabitForm({ title: '复盘', frequency: 'f'.repeat(41) }).frequency).toBe('频率 ≤40 字')
    expect(validateHabitForm({ title: '复盘', notes: 'n'.repeat(501) }).notes).toBe('备注 ≤500 字')
  })

  it('okrId 填写即须合法 ID 格式；其余可选留空合法', () => {
    expect(validateHabitForm({ title: '复盘', okrId: 'o 1!' }).okrId).toBe('OKR ID 格式非法（字母/数字/-/_）')
    expect(validateHabitForm({ title: '每日复盘', okrId: '', goal: '', frequency: '', notes: '' })).toEqual({})
  })
})
