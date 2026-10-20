import { describe, it, expect } from 'vitest'
import { applySort, type QueryRow } from './query.js'

function row(over: Partial<QueryRow>): QueryRow {
  return {
    projectId: 'p-1', recordType: 'task', id: over.id ?? 'x', title: over.title ?? '',
    status: over.status ?? '', date: over.date ?? null, assignee: over.assignee, ...over,
  }
}

const rows: QueryRow[] = [
  row({ id: 'a', status: 'todo', assignee: 'B', date: '2026-10-03', title: 'a' }),
  row({ id: 'b', status: 'done', assignee: 'A', date: '2026-10-01', title: 'b' }),
  row({ id: 'c', status: 'todo', assignee: 'A', date: '2026-10-02', title: 'c' }),
  row({ id: 'd', status: 'done', assignee: 'B', date: '2026-10-01', title: 'd' }),
]

describe('applySort 旧单排序（legacy dualread，不回归）', () => {
  it('无 sort/sorts 返回原序（稳定）', () => {
    expect(applySort(rows, undefined).map(r => r.id)).toEqual(['a', 'b', 'c', 'd'])
  })
  it('单规则 status asc（legacy sort 路径不变）', () => {
    const out = applySort(rows, { field: 'status', dir: 'asc' })
    expect(out.map(r => r.id)).toEqual(['b', 'd', 'a', 'c'])
  })
  it('空 sorts 数组回退 legacy sort', () => {
    const out = applySort(rows, { field: 'status', dir: 'asc' }, [])
    expect(out.map(r => r.id)).toEqual(['b', 'd', 'a', 'c'])
  })
})

describe('applySort 多排序 priority chain（sorts 非空）', () => {
  it('第一规则 status 决定主序，并列由第二规则 assignee 打破', () => {
    const out = applySort(rows, undefined, [
      { field: 'status', dir: 'asc' },
      { field: 'assignee', dir: 'asc' },
    ])
    // done: A(b),B(d)；todo: A(c),B(a)
    expect(out.map(r => r.id)).toEqual(['b', 'd', 'c', 'a'])
  })

  it('每条规则独立方向：status desc 主序，assignee asc 次序', () => {
    const out = applySort(rows, undefined, [
      { field: 'status', dir: 'desc' },
      { field: 'assignee', dir: 'asc' },
    ])
    // todo: A(c),B(a)；done: A(b),B(d)
    expect(out.map(r => r.id)).toEqual(['c', 'a', 'b', 'd'])
  })

  it('三级链：status → assignee → date asc 全并列时保持稳定原序', () => {
    const tie: QueryRow[] = [
      row({ id: 't1', status: 'todo', assignee: 'A', date: '2026-10-01' }),
      row({ id: 't2', status: 'todo', assignee: 'A', date: '2026-10-01' }),
    ]
    const out = applySort(tie, undefined, [
      { field: 'status', dir: 'asc' },
      { field: 'assignee', dir: 'asc' },
      { field: 'date', dir: 'asc' },
    ])
    expect(out.map(r => r.id)).toEqual(['t1', 't2'])
  })

  it('sorts 非空时优先于 legacy sort（不混用）', () => {
    const out = applySort(rows, { field: 'date', dir: 'asc' }, [
      { field: 'status', dir: 'asc' },
    ])
    // 只按 status，不按 date
    expect(out.map(r => r.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('date 字段走 row.date（空值排前 asc）', () => {
    const withEmpty: QueryRow[] = [
      row({ id: 'x', date: '2026-10-05' }),
      row({ id: 'y', date: null }),
      row({ id: 'z', date: '2026-10-02' }),
    ]
    const out = applySort(withEmpty, undefined, [{ field: 'date', dir: 'asc' }])
    expect(out.map(r => r.id)).toEqual(['y', 'z', 'x'])
  })
})

describe('U4 P2：实填充字段排序 + 防御截断', () => {
  it('priority 实际比较（P0 升序在前），同优先级按次序规则打破', () => {
    const rows: QueryRow[] = [
      row({ id: 'a', priority: 'P2', milestoneId: 'm-2' }),
      row({ id: 'b', priority: 'P0', milestoneId: 'm-1' }),
      row({ id: 'c', priority: 'P1', milestoneId: 'm-2' }),
      row({ id: 'd', priority: 'P0', milestoneId: 'm-9' }),
    ]
    const out = applySort(rows, undefined, [
      { field: 'priority', dir: 'asc' },
      { field: 'milestoneId', dir: 'asc' },
    ])
    // P0: m-1(b) 先于 m-9(d)；P1(c)；P2(a)
    expect(out.map(r => r.id)).toEqual(['b', 'd', 'c', 'a'])
  })

  it('milestoneId 实际比较（desc）', () => {
    const rows: QueryRow[] = [
      row({ id: 'a', milestoneId: 'm-1' }),
      row({ id: 'b', milestoneId: 'm-9' }),
      row({ id: 'c', milestoneId: 'm-3' }),
    ]
    const out = applySort(rows, undefined, [{ field: 'milestoneId', dir: 'desc' }])
    expect(out.map(r => r.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts 超过 3 条时防御截断为前 3，多余规则不参与', () => {
    const rows: QueryRow[] = [
      row({ id: 'a', status: 'x', assignee: 'B', priority: 'P2' }),
      row({ id: 'b', status: 'x', assignee: 'A', priority: 'P0' }),
      row({ id: 'c', status: 'y', assignee: 'A', priority: 'P1' }),
    ]
    const out = applySort(rows, undefined, [
      { field: 'status', dir: 'asc' },
      { field: 'assignee', dir: 'asc' },
      { field: 'priority', dir: 'asc' },
      { field: 'milestoneId', dir: 'asc' }, // 第 4 条被截断
    ])
    expect(out.map(r => r.id)).toEqual(['b', 'a', 'c'])
  })
})
