import { describe, it, expect } from 'vitest'
import { loadFacts, stanceSuggestions, staleStanceTags, type StanceTaskInput } from './load-stance.js'

// K19 保护面派生：纯函数、today 注入、零写、不可变入参。

const TODAY = '2026-10-18'

function task(over: Partial<StanceTaskInput> = {}): StanceTaskInput {
  return {
    id: 't-0001',
    title: '默认任务',
    assignee: '李工',
    status: 'todo',
    progress: 0,
    dueDate: null,
    startDate: null,
    updatedAt: '2026-10-18T09:00:00.000Z',
    ...over,
  }
}

describe('loadFacts 纯事实陈列（分组计数，不裁决）', () => {
  it('taskCount/openCount/overdueCount/doneCount 口径正确，today 注入', () => {
    const facts = loadFacts([
      task({ id: 't-1', assignee: '李工', status: 'done', progress: 100 }),
      task({ id: 't-2', assignee: '李工', status: 'in_progress', progress: 40, dueDate: '2026-10-10' }),
      task({ id: 't-3', assignee: '李工', status: 'todo', progress: 0 }),
      task({ id: 't-4', assignee: '王工', status: 'done', progress: 100 }),
    ], { today: TODAY })
    const li = facts.find(f => f.personId === '李工'.toLowerCase())!
    expect(li.taskCount).toBe(3)
    expect(li.doneCount).toBe(1)
    expect(li.openCount).toBe(2)
    expect(li.overdueCount).toBe(1)
    const wang = facts.find(f => f.personId === '王工'.toLowerCase())!
    expect(wang.taskCount).toBe(1)
    expect(wang.doneCount).toBe(1)
    expect(wang.openCount).toBe(0)
    expect(wang.overdueCount).toBe(0)
  })

  it('未分配桶 personId 为空串、name=未分配；不修改入参数组/对象', () => {
    const input = [task({ id: 't-1', assignee: '', status: 'todo' })]
    const snapshot = structuredClone(input)
    const facts = loadFacts(input, { today: TODAY })
    expect(facts[0].personId).toBe('')
    expect(facts[0].name).toBe('未分配')
    expect(input).toEqual(snapshot)
  })
})

describe('stanceSuggestions 建议砍/缓（建议供人决策，不自动执行）', () => {
  it('逾期未 done → cut，带逾期天数与 dueDate；done 逾期不入选', () => {
    const out = stanceSuggestions([
      task({ id: 't-1', status: 'todo', progress: 10, dueDate: '2026-10-08' }),
      task({ id: 't-2', status: 'done', progress: 100, dueDate: '2026-10-01' }),
    ], { today: TODAY })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ taskId: 't-1', stance: 'cut', dueDate: '2026-10-08' })
    expect(out[0].reason).toContain('已逾期 10 天')
    expect(out[0].reason).toContain('建议供人决策，不自动执行')
  })

  it('blocked 且 updatedAt 距今 >3 天 → slow；≤3 天/无 updatedAt 不入选', () => {
    const out = stanceSuggestions([
      task({ id: 't-1', status: 'blocked', progress: 20, updatedAt: '2026-10-10T09:00:00.000Z' }),
      task({ id: 't-2', status: 'blocked', progress: 20, updatedAt: '2026-10-17T09:00:00.000Z' }),
      task({ id: 't-3', status: 'blocked', progress: 20, updatedAt: null }),
    ], { today: TODAY })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ taskId: 't-1', stance: 'slow' })
    expect(out[0].reason).toContain('受阻超过 3 天')
    expect(out[0].reason).toContain('建议供人决策，不自动执行')
  })

  it('同一任务既逾期又受阻只出一条（逾期优先 cut）；不修改入参', () => {
    const input = [task({ id: 't-1', status: 'blocked', progress: 20, dueDate: '2026-10-08', updatedAt: '2026-10-10T09:00:00.000Z' })]
    const snapshot = structuredClone(input)
    const out = stanceSuggestions(input, { today: TODAY })
    expect(out).toHaveLength(1)
    expect(out[0].stance).toBe('cut')
    expect(input).toEqual(snapshot)
  })
})

describe('staleStanceTags 烂尾倾向标签（供筛选，非裁决）', () => {
  it('startDate>30 天且 updatedAt>7 天且 progress<50 → 标签+天数；边界值与高进度排除', () => {
    const out = staleStanceTags([
      task({ id: 't-1', startDate: '2026-09-01', updatedAt: '2026-10-01T09:00:00.000Z', progress: 30 }),
      // 恰好 30 天 / 恰好 7 天 → 边界不入选
      task({ id: 't-2', startDate: '2026-09-18', updatedAt: '2026-10-11T09:00:00.000Z', progress: 30 }),
      // progress=50 不入选
      task({ id: 't-3', startDate: '2026-09-01', updatedAt: '2026-10-01T09:00:00.000Z', progress: 50 }),
      // 缺 startDate/updatedAt 诚实降级不入选
      task({ id: 't-4', startDate: null, updatedAt: '2026-10-01T09:00:00.000Z', progress: 10 }),
    ], { today: TODAY })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ taskId: 't-1', tag: '烂尾倾向', daysSinceStart: 47, daysSinceUpdate: 17 })
  })

  it('不修改入参数组/对象', () => {
    const input = [task({ id: 't-1', startDate: '2026-09-01', updatedAt: '2026-10-01T09:00:00.000Z', progress: 30 })]
    const snapshot = structuredClone(input)
    staleStanceTags(input, { today: TODAY })
    expect(input).toEqual(snapshot)
  })
})
