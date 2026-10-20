import { describe, it, expect } from 'vitest'
import {
  habitStatusLabel,
  streakArchiveText,
  resolveHabitOkrTitle,
  countPendingHabitInbox,
} from './habit-model.js'

// P3 X7 习惯层纯模型单测：streak 纯文本档案、关联 OKR 只读解析、收件区计数（零写、零裁决）。

describe('habitStatusLabel 状态文案（前端不定稿）', () => {
  it('draft=草稿，confirmed=已确认，final=已定稿', () => {
    expect(habitStatusLabel('draft')).toBe('草稿')
    expect(habitStatusLabel('confirmed')).toBe('已确认')
    expect(habitStatusLabel('final')).toBe('已定稿')
  })
})

describe('streakArchiveText 纯文本档案（无积分/徽章/动效）', () => {
  it('当前连续 · 历史最长 · 累计 三段文本，断签不清零累计', () => {
    expect(streakArchiveText({ current: 2, longest: 9, totalDays: 31 }))
      .toBe('当前连续 2 天 · 历史最长 9 天 · 累计 31 天')
  })
})

describe('resolveHabitOkrTitle 关联只读，不裁决', () => {
  const refs = [{ id: 'o-1', title: '提升交付稳定性' }]
  it('命中注入清单返回标题', () => {
    expect(resolveHabitOkrTitle('o-1', refs)).toBe('提升交付稳定性')
  })
  it('未命中回退原始 ID（如实展示，不伪造标题）', () => {
    expect(resolveHabitOkrTitle('o-missing', refs)).toBe('o-missing')
  })
  it('无 okrId 返回 undefined（整行省略）；refs 缺失安全回退', () => {
    expect(resolveHabitOkrTitle(undefined, refs)).toBeUndefined()
    expect(resolveHabitOkrTitle('o-1', undefined)).toBe('o-1')
  })
})

describe('countPendingHabitInbox 仅计 pending', () => {
  it('confirmed/ignored 不计；跨项目剔除；undefined 返回 0', () => {
    expect(countPendingHabitInbox(undefined, 'p-1')).toBe(0)
    expect(countPendingHabitInbox([
      { projectId: 'p-1', status: 'pending' },
      { projectId: 'p-1', status: 'confirmed' },
      { projectId: 'p-1', status: 'ignored' },
      { projectId: 'p-2', status: 'pending' },
    ], 'p-1')).toBe(1)
  })
})
