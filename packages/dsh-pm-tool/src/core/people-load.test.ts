import { describe, it, expect } from 'vitest'
import { groupOpenTasksByAssignee } from './people-load.js'

// X2：wrapped 已收尾不计入 open 负载（isOpen 排除 wrapped）。

const PROJECTS = [{ id: 'p-0001', name: '验证项目' }]

function task(over: Partial<Parameters<typeof groupOpenTasksByAssignee>[0][number]> & { id: string }) {
  return {
    projectId: 'p-0001',
    title: over.id,
    assignee: '李工',
    status: 'todo',
    priority: 'P1',
    progress: 0,
    dueDate: null,
    ...over,
  }
}

describe('groupOpenTasksByAssignee X2 wrapped 口径', () => {
  it('wrapped 任务不进 open 分组；正常 open 任务照常计入', () => {
    const report = groupOpenTasksByAssignee([
      task({ id: 'w-1', status: 'wrapped', dueDate: '2026-10-10' }),
      task({ id: 'o-1', status: 'in_progress', progress: 30, dueDate: '2026-10-20' }),
    ], PROJECTS, { today: '2026-10-18' })
    const li = report.people.find(p => p.key === '李工')
    expect(li?.openTotal).toBe(1)
    expect(li?.tasks.map(t => t.id)).toEqual(['o-1'])
    expect(report.unassigned).toBeNull()
  })
})
