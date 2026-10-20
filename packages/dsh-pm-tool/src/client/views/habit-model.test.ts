import { describe, it, expect } from 'vitest'
import {
  habitStatusLabel,
  streakArchiveText,
  resolveHabitOkrTitle,
  countPendingHabitInbox,
  dedupeCheckIns,
  groupCheckInsByRecency,
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

// ===== D-13 长日志：同日旧重复展示去重（不删用户数据）+ 近期 14 天展开、更早按月折叠 =====

describe('dedupeCheckIns：展示层同日去重，保留带备注条目，不写库', () => {
  it('同日两条旧重复折叠为一条，优先保留带备注者', () => {
    const out = dedupeCheckIns([
      { at: '2026-10-19', backfilled: true },
      { at: '2026-10-19', backfilled: true, note: '补记' },
    ])
    expect(out).toHaveLength(1)
    expect(out[0].at).toBe('2026-10-19')
    expect(out[0].note).toBe('补记')
  })
})

describe('groupCheckInsByRecency：最近 14 天展开，更早按月分组（默认折叠）', () => {
  const today = '2026-10-20'
  const rows = [
    { at: '2026-10-20', backfilled: false },
    { at: '2026-10-19', backfilled: true, note: '补记' },
    { at: '2026-10-18', backfilled: true },
    { at: '2026-10-14', backfilled: true },
    { at: '2026-10-05', backfilled: true },
    { at: '2026-09-22', backfilled: true },
    { at: '2026-09-03', backfilled: true },
  ]
  it('14 天窗口内进 recent（10-07 起），更早进月份组，月份倒序', () => {
    const { recent, months } = groupCheckInsByRecency(rows, today)
    expect(recent.map(r => r.at)).toEqual(['2026-10-20', '2026-10-19', '2026-10-18', '2026-10-14'])
    expect(months.map(m => m.key)).toEqual(['2026-10', '2026-09'])
    expect(months[0].entries.map(e => e.at)).toEqual(['2026-10-05'])
    expect(months[1].entries.map(e => e.at)).toEqual(['2026-09-22', '2026-09-03'])
  })
  it('月份标签为「YYYY 年 M 月」，补记标记保留', () => {
    const { months } = groupCheckInsByRecency(rows, today)
    expect(months[1].label).toBe('2026 年 9 月')
    expect(months[1].entries[0].backfilled).toBe(true)
  })
  it('空日志返回空 recent/months，不伪造', () => {
    expect(groupCheckInsByRecency([], today)).toEqual({ recent: [], months: [] })
  })
})
