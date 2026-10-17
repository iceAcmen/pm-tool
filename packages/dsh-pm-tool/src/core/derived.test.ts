import { describe, it, expect } from 'vitest'
import { isTaskOverdue, addDaysIso, isTaskDueWithin, isTaskAtRisk } from './derived.js'

// A 批：任务逾期唯一纯谓词 isTaskOverdue。today 注入保证确定性，
// stats / people-load / reminders / war-room 同源，对齐现网 tasks.tsx isLate。

describe('isTaskOverdue 冻结口径', () => {
  const TODAY = '2026-10-17'

  it('未完成（in_progress）+ 截止日在过去 → true', () => {
    expect(isTaskOverdue({ status: 'in_progress', progress: 40, dueDate: '2026-10-10' }, TODAY)).toBe(true)
  })

  it('已完成（done）+ 截止日在过去 → false（done 不逾期）', () => {
    expect(isTaskOverdue({ status: 'done', progress: 100, dueDate: '2026-10-10' }, TODAY)).toBe(false)
  })

  it('status 非 done 但进度=100 + 截止日在过去 → false（进度达标不逾期）', () => {
    expect(isTaskOverdue({ status: 'in_progress', progress: 100, dueDate: '2026-10-10' }, TODAY)).toBe(false)
  })

  it('截止日恰好是今天 → false（days=0 非负，今天到期不算逾期）', () => {
    expect(isTaskOverdue({ status: 'in_progress', progress: 30, dueDate: TODAY }, TODAY)).toBe(false)
  })

  it('截止日在未来 → false', () => {
    expect(isTaskOverdue({ status: 'todo', progress: 0, dueDate: '2026-11-20' }, TODAY)).toBe(false)
  })

  it('无截止日（null / undefined）→ false（诚实降级，不臆造逾期）', () => {
    expect(isTaskOverdue({ status: 'todo', progress: 0, dueDate: null }, TODAY)).toBe(false)
    expect(isTaskOverdue({ status: 'todo', progress: 0 }, TODAY)).toBe(false)
  })

  it('progress=null 按 0 处理 + 截止日在过去 → true', () => {
    expect(isTaskOverdue({ status: 'todo', progress: null, dueDate: '2026-10-01' }, TODAY)).toBe(true)
  })

  it('progress 缺省（undefined）按 0 处理 + 截止日在过去 → true', () => {
    expect(isTaskOverdue({ status: 'todo', dueDate: '2026-10-01' }, TODAY)).toBe(true)
  })

  it('blocked 状态 + 截止日在过去 → true（受阻未闭环仍计逾期）', () => {
    expect(isTaskOverdue({ status: 'blocked', progress: 20, dueDate: '2026-10-05' }, TODAY)).toBe(true)
  })

  it('status 缺省（undefined）+ 截止日在过去 → true（按未完成处理）', () => {
    expect(isTaskOverdue({ progress: 0, dueDate: '2026-10-05' }, TODAY)).toBe(true)
  })
})

// B 批：addDaysIso 本地日历日加天（零墙钟、月末/闰年/跨年由 Date 算术兜底）。
describe('addDaysIso 日期推进', () => {
  it('普通日加 7 天 → 同月内正确推进', () => {
    expect(addDaysIso('2026-10-17', 7)).toBe('2026-10-24')
  })

  it('月末进位：1月31日 +1 → 2月1日', () => {
    expect(addDaysIso('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('跨年：12月31日 +1 → 次年1月1日；12月28日 +7 → 次年1月4日', () => {
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysIso('2026-12-28', 7)).toBe('2027-01-04')
  })

  it('闰年 2024：2月28日 +1 → 2月29日；2月29日 +1 → 3月1日', () => {
    expect(addDaysIso('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDaysIso('2024-02-29', 1)).toBe('2024-03-01')
  })

  it('平年 2026：2月28日 +1 → 3月1日（无29日）', () => {
    expect(addDaysIso('2026-02-28', 1)).toBe('2026-03-01')
  })
})

// C 批：isTaskDueWithin 本周到期（days=7，含已逾期，排除已完成/无截止日）。
describe('isTaskDueWithin 本周到期冻结口径', () => {
  const TODAY = '2026-10-17'

  it('未来 7 天内到期且未完成 → true', () => {
    expect(isTaskDueWithin({ status: 'in_progress', progress: 30, dueDate: '2026-10-20' }, TODAY, 7)).toBe(true)
  })

  it('边界：恰好第 7 天（today+7）→ true；第 8 天 → false', () => {
    expect(isTaskDueWithin({ status: 'todo', progress: 0, dueDate: '2026-10-24' }, TODAY, 7)).toBe(true)
    expect(isTaskDueWithin({ status: 'todo', progress: 0, dueDate: '2026-10-25' }, TODAY, 7)).toBe(false)
  })

  it('含已逾期：过去到期日同样满足 ≤ today+7 → true', () => {
    expect(isTaskDueWithin({ status: 'in_progress', progress: 40, dueDate: '2026-10-10' }, TODAY, 7)).toBe(true)
  })

  it('排除已完成（done / 进度 100）→ false', () => {
    expect(isTaskDueWithin({ status: 'done', progress: 100, dueDate: '2026-10-20' }, TODAY, 7)).toBe(false)
    expect(isTaskDueWithin({ status: 'in_progress', progress: 100, dueDate: '2026-10-20' }, TODAY, 7)).toBe(false)
  })

  it('无截止日（null / undefined）→ false', () => {
    expect(isTaskDueWithin({ status: 'todo', progress: 0, dueDate: null }, TODAY, 7)).toBe(false)
    expect(isTaskDueWithin({ status: 'todo', progress: 0 }, TODAY, 7)).toBe(false)
  })

  it('月末跨年：12月28日起 7 天内覆盖次年1月初；超窗排除', () => {
    expect(isTaskDueWithin({ status: 'todo', progress: 0, dueDate: '2027-01-03' }, '2026-12-28', 7)).toBe(true)
    expect(isTaskDueWithin({ status: 'todo', progress: 0, dueDate: '2027-01-05' }, '2026-12-28', 7)).toBe(false)
  })
})

// D 批：isTaskAtRisk 风险视图（blocked / 逾期 / 关联里程碑延期，任一即 true）。
describe('isTaskAtRisk 风险视图冻结口径', () => {
  const TODAY = '2026-10-17'

  it('blocked 状态 → true（无需截止日/里程碑）', () => {
    expect(isTaskAtRisk({ status: 'blocked', progress: 20 }, TODAY)).toBe(true)
  })

  it('已逾期 → true', () => {
    expect(isTaskAtRisk({ status: 'in_progress', progress: 40, dueDate: '2026-10-10' }, TODAY)).toBe(true)
  })

  it('关联里程碑延期（planned 且 targetDate 过去）→ true', () => {
    const task = { status: 'todo', progress: 0 }
    const milestone = { status: 'planned', targetDate: '2026-10-10' }
    expect(isTaskAtRisk(task, TODAY, milestone)).toBe(true)
  })

  it('里程碑显式 missed → true', () => {
    expect(isTaskAtRisk(
      { status: 'todo', progress: 0 }, TODAY,
      { status: 'missed', targetDate: '2026-10-10' },
    )).toBe(true)
  })

  it('三者都不满足（未阻塞/未逾期/里程碑正常）→ false', () => {
    expect(isTaskAtRisk(
      { status: 'todo', progress: 0 }, TODAY,
      { status: 'planned', targetDate: '2026-11-01' },
    )).toBe(false)
  })

  it('不传 milestone：只判 blocked / 逾期，其余 → false', () => {
    expect(isTaskAtRisk({ status: 'todo', progress: 0 }, TODAY)).toBe(false)
    expect(isTaskAtRisk({ status: 'in_progress', progress: 10, dueDate: '2026-11-01' }, TODAY)).toBe(false)
  })
})
