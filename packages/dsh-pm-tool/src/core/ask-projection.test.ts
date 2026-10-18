import { describe, it, expect } from 'vitest'
import {
  extractReferencedTaskIds,
  planTaskIds,
  dueUrgency,
  latestAppliedBatches,
  refreshSucceeded,
} from './ask-projection.js'

// K13 对话内只读投影 · 纯函数层：身份解析 + 紧迫度派生 + 处理结果归并。
// 零 I/O、零墙钟（today 注入）；不含任何 ask 时刻旧状态的缓存。

describe('extractReferencedTaskIds', () => {
  const known = new Set(['t-0001', 't-0002', 'm-g3'])

  it('抽取正文提及的已知任务 id，保序去重', () => {
    expect(extractReferencedTaskIds('建议先收尾 t-0001，再看 t-0002；t-0001 是重点。', known))
      .toEqual(['t-0001', 't-0002'])
  })

  it('词边界匹配：短 id 不误命中长 id 前缀', () => {
    expect(extractReferencedTaskIds('只提到 t-00010 之类', new Set(['t-1', 't-0001']))).toEqual([])
  })

  it('正文未提及已知 id 时返回空，不臆造', () => {
    expect(extractReferencedTaskIds('项目整体健康，没有点名具体任务。', known)).toEqual([])
  })
})

describe('planTaskIds', () => {
  it('只收 task.* 动作的目标 id，去重保序；create 无 id 不收', () => {
    expect(planTaskIds([
      { action: { op: 'task.update', id: 't-0001' } },
      { action: { op: 'task.update', id: 't-0001' } },
      { action: { op: 'task.create', id: undefined } },
      { action: { op: 'milestone.update', id: 'm-g3' } },
      { action: { op: 'task.update', id: 't-0002' } },
    ])).toEqual(['t-0001', 't-0002'])
  })
})

describe('dueUrgency', () => {
  const today = '2026-10-18'

  it('已完成 / 进度满 100 判 done，不告警', () => {
    expect(dueUrgency({ status: 'done', progress: 100, dueDate: '2026-10-01' }, today).kind).toBe('done')
    expect(dueUrgency({ status: 'in_progress', progress: 100 }, today).kind).toBe('done')
  })

  it('无截止日判 none', () => {
    expect(dueUrgency({ status: 'todo', progress: 0 }, today).kind).toBe('none')
  })

  it('过去到期判 overdue 并给逾期天数', () => {
    const r = dueUrgency({ status: 'in_progress', progress: 30, dueDate: '2026-10-15' }, today)
    expect(r.kind).toBe('overdue')
    expect((r as { days: number }).days).toBe(3)
  })

  it('3 天内到期判 soon；更远判 none', () => {
    expect(dueUrgency({ status: 'todo', progress: 0, dueDate: '2026-10-20' }, today).kind).toBe('soon')
    expect(dueUrgency({ status: 'todo', progress: 0, dueDate: '2026-11-30' }, today).kind).toBe('none')
  })
})

describe('latestAppliedBatches', () => {
  it('取最近 ask-apply，归并 basis 任务 id 与撤销标记，忽略其它 kind', () => {
    const rows = [
      {
        id: 'prv-old', kind: 'ask-apply', createdAt: '2026-10-17T09:00:00Z', summary: '旧批次',
        refs: [{ table: 'tasks', id: 't-0009', role: 'basis' }], undo: { used: false },
      },
      {
        id: 'prv-new', kind: 'ask-apply', createdAt: '2026-10-18T09:00:00Z', summary: '已应用 2 条 AI 建议',
        refs: [
          { table: 'tasks', id: 't-0001', role: 'basis' },
          { table: 'tasks', id: 't-0002', role: 'context' },
          { table: 'milestones', id: 'm-g3', role: 'basis' },
        ],
        undo: { used: true },
      },
      { id: 'prv-cap', kind: 'capture', createdAt: '2026-10-18T10:00:00Z', summary: '证据采集' },
    ]
    const out = latestAppliedBatches(rows, 1)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('prv-new')
    expect(out[0].basisTaskIds).toEqual(['t-0001'])
    expect(out[0].undone).toBe(true)
  })

  it('非数组 / 空入参静默返回空，不抛错', () => {
    expect(latestAppliedBatches(undefined)).toEqual([])
    expect(latestAppliedBatches([], 3)).toEqual([])
  })
})

describe('refreshSucceeded：父级刷新失败不重盖「数据截至」', () => {
  it('true=成功；false=失败（不盖时钟）；undefined 兼容旧同步回调=成功', () => {
    expect(refreshSucceeded(true)).toBe(true)
    expect(refreshSucceeded(false)).toBe(false)
    expect(refreshSucceeded(undefined)).toBe(true)
  })
})
