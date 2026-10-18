import { describe, it, expect } from 'vitest'
import { tallyTasksByStatus, tallyTotal, tallyOpen, donePercent, EMPTY_TALLY } from './tasks-tally.js'

describe('tallyTasksByStatus 五态互斥（契约 §7 / 数字口径字典）', () => {
  it('五桶合计恒等于输入条数，wrapped 单独成桶不并入 done', () => {
    const list = ['done', 'done', 'in_progress', 'blocked', 'todo', 'wrapped', undefined, null, 'weird']
    const t = tallyTasksByStatus(list)
    expect(t).toEqual({ done: 2, in_progress: 1, blocked: 1, wrapped: 1, todo: 4 })
    expect(tallyTotal(t)).toBe(list.length)
  })

  it('open = todo+in_progress+blocked，不含 done/wrapped', () => {
    const t = tallyTasksByStatus(['done', 'wrapped', 'in_progress', 'blocked', 'todo'])
    expect(tallyOpen(t)).toBe(3)
    expect(t.done).toBe(1)
    expect(t.wrapped).toBe(1)
  })

  it('donePercent 四舍五入，空总数为 0 不除零', () => {
    expect(donePercent(tallyTasksByStatus(['done', 'done', 'todo']), 3)).toBe(67)
    expect(donePercent(EMPTY_TALLY, 0)).toBe(0)
  })

  it('空输入返回全零桶', () => {
    expect(tallyTasksByStatus([])).toEqual(EMPTY_TALLY)
  })
})
