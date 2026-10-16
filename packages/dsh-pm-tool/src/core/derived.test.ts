import { describe, it, expect } from 'vitest'
import { isTaskOverdue } from './derived.js'

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
