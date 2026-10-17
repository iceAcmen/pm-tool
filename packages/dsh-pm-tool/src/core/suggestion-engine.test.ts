import { describe, it, expect } from 'vitest'
import { buildDiagnosis, diagnosisCounts, type SuggestionTask } from './suggestion-engine.js'

let seq = 0
function task(patch: Partial<SuggestionTask> & { code: string }): SuggestionTask {
  const id = patch.id ?? `t-${++seq}`
  return {
    id,
    parentId: 'parent-1',
    title: `任务 ${patch.code}`,
    status: 'todo',
    assignee: '',
    progress: 0,
    startDate: null,
    dueDate: null,
    predecessorIds: [],
    ...patch,
  }
}

const TODAY = '2026-10-10'

describe('buildDiagnosis 阻塞 / 逾期', () => {
  it('status=blocked 生成 blocked 气泡并关联该任务', () => {
    const t = task({ code: '4.3', status: 'blocked', predecessorIds: ['t-9'] })
    const pre = task({ code: '5.1', id: 't-9', status: 'todo' })
    const b = buildDiagnosis({ tasks: [t, pre], today: TODAY })
    const blocked = b.filter(x => x.kind === 'blocked')
    expect(blocked).toHaveLength(1)
    expect(blocked[0].targetId).toBe(t.id)
    expect(blocked[0].title).toContain('4.3')
    expect(blocked[0].text).toContain('5.1')
  })

  it('未完成任务 dueDate 早于今天生成 overdue 气泡并计算天数', () => {
    const t = task({ code: '2.2', status: 'todo', dueDate: '2026-10-01', assignee: '张三' })
    const b = buildDiagnosis({ tasks: [t], today: TODAY })
    expect(b.filter(x => x.kind === 'overdue')).toHaveLength(1)
    expect(b[0].title).toContain('已逾期 9 天')
    expect(b[0].text).toContain('张三')
  })

  it('done 任务即使 dueDate 已过也不逾期', () => {
    const t = task({ code: '2.2', status: 'done', dueDate: '2026-10-01' })
    expect(buildDiagnosis({ tasks: [t], today: TODAY })).toHaveLength(0)
  })
})

describe('buildDiagnosis 过载', () => {
  it('同一人 open 数达到阈值（默认 5）生成 overload 气泡', () => {
    const tasks = Array.from({ length: 5 }, (_, i) =>
      task({ code: `1.${i + 1}`, assignee: '张三', status: 'todo' }))
    const b = buildDiagnosis({ tasks, today: TODAY })
    expect(b.filter(x => x.kind === 'overload')).toHaveLength(1)
    expect(b[0].title).toContain('张三 open 5 项')
  })

  it('未达阈值不生成过载', () => {
    const tasks = Array.from({ length: 4 }, (_, i) =>
      task({ code: `1.${i + 1}`, assignee: '张三' }))
    expect(buildDiagnosis({ tasks, today: TODAY }).filter(x => x.kind === 'overload')).toHaveLength(0)
  })
})

describe('buildDiagnosis 未指派 / 未排期（汇总）', () => {
  it('多个 open 无负责人汇总为一个 unassigned 气泡', () => {
    const tasks = Array.from({ length: 3 }, (_, i) => task({ code: `1.${i + 1}` }))
    const b = buildDiagnosis({ tasks, today: TODAY })
    expect(b.filter(x => x.kind === 'unassigned')).toHaveLength(1)
    expect(b[0].title).toContain('3 个任务未指派')
  })

  it('多个 open 无日期汇总为一个 unscheduled 气泡', () => {
    const tasks = Array.from({ length: 3 }, (_, i) =>
      task({ code: `1.${i + 1}`, assignee: '张三' }))
    const b = buildDiagnosis({ tasks, today: TODAY })
    expect(b.filter(x => x.kind === 'unscheduled')).toHaveLength(1)
  })
})

describe('buildDiagnosis 去重与范围', () => {
  it('一个任务既阻塞又逾期时只挂一个气泡（blocked 优先）', () => {
    const t = task({ code: '4.3', status: 'blocked', dueDate: '2026-10-01' })
    const b = buildDiagnosis({ tasks: [t], today: TODAY })
    expect(b).toHaveLength(1)
    expect(b[0].kind).toBe('blocked')
  })

  it('只诊断叶子任务，parentId 为空的阻塞不产生气泡', () => {
    const parent = task({ code: '1', parentId: null, status: 'blocked' })
    expect(buildDiagnosis({ tasks: [parent], today: TODAY })).toHaveLength(0)
  })

  it('全部 done 时无气泡', () => {
    const tasks = [task({ code: '1.1', status: 'done' }), task({ code: '1.2', status: 'done' })]
    expect(buildDiagnosis({ tasks, today: TODAY })).toHaveLength(0)
  })
})

describe('diagnosisCounts', () => {
  it('按类型计数', () => {
    const t1 = task({ code: '1.1', status: 'blocked' })
    const t2 = task({ code: '1.2' })
    const b = buildDiagnosis({ tasks: [t1, t2], today: TODAY })
    const counts = diagnosisCounts(b)
    expect(counts.blocked).toBe(1)
    expect(counts.unassigned).toBe(1)
  })
})
