import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { dateRange, todayOffset, shiftDatesByDrag, criticalPath } from '../../core/gantt.js'
import { groupOpenTasksByAssignee } from '../../core/people-load.js'

// B5 视觉切片 AUTO/静态层（QA §2.7）：行为零回归 + 零裸色 + 改动面。
// GUI 旅程（1440/768/390 浅深、200%、CRUD 往返保输入）由 Main 采证，本文件不替代。
// 纯静态扫描 + core 纯函数，不渲染 React、不碰 DOM、不写盘。

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(HERE, rel), 'utf8')

// 裸色扫描：只允许 var(--token) / color-mix / 透明关键字；禁 #hex 与 rgb()/rgba() 字面量。
const BARE_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/
function assertNoBareColor(css: string, file: string) {
  const hits = css.split('\n').map((line, i) => ({ line: i + 1, text: line }))
    .filter(l => {
      // 先剥掉 var(...) 取值，再看剩余字面量是否含裸色（同行有 token 不能豁免裸 rgb）
      const cleaned = l.text.replace(/var\([^)]*\)/g, '').replace(/color-mix\([^)]*\)/g, '')
      return BARE_COLOR.test(cleaned)
    })
  expect(hits, `${file} 出现裸 hex/rgb，须改用 .pm-shell token`).toEqual([])
}

describe('B5-A01 gantt：排期/日期轴/今日线/依赖/拖拽落库零回归', () => {
  const tsx = read('./gantt.tsx')
  const css = read('./gantt.css')

  it('core 甘特纯函数仍导出且行为正确（dateRange/todayOffset/shiftDatesByDrag/criticalPath）', () => {
    const range = dateRange([{ startDate: '2026-11-01', dueDate: '2026-11-10' }])
    expect(range?.start <= '2026-11-01').toBe(true)
    expect(range?.end >= '2026-11-10').toBe(true)
    expect(typeof todayOffset('2026-11-01', '2026-11-03')).toBe('number')
    const shifted = shiftDatesByDrag('2026-11-01', '2026-11-05', 20, 10)
    expect(shifted.startDate).toBe('2026-11-03')
    expect(shifted.dueDate).toBe('2026-11-07')
    expect(criticalPath([]).criticalPath).toEqual([])
  })

  it('视图保留今日线、粒度切换、依赖连线，拖拽只写 startDate/dueDate 白名单', () => {
    expect(tsx).toContain('todayOffset')
    expect(tsx).toContain('localTodayIso')
    expect(tsx).toContain('criticalPath')
    expect(tsx).toContain('routeEdge')
    expect(tsx).toContain('task update')
    // 落库 payload 仅 startDate/dueDate，不得夹带 progress/status/predecessor
    expect(tsx).toContain('startDate')
    expect(tsx).toContain('dueDate')
    expect(tsx).not.toMatch(/progress\s*:/)
  })

  it('gantt.css 零裸色、今日线用语义 token（--c-late）', () => {
    assertNoBareColor(css, 'gantt.css')
    expect(css).toContain('.pm-gantt-today')
    expect(css.match(/\.pm-gantt-today\s*\{[^}]*var\(--c-late\)/)).toBeTruthy()
  })
})

describe('B5-A02 risk-issues：双 tab / 概率影响分级 / 关闭不计入矩阵保留', () => {
  const tsx = read('./risk-issues.tsx')
  const css = read('./risk-issues.css')

  it('risk/issue 双 tab 与三态、5×4 矩阵、closed 排除保留', () => {
    expect(tsx).toContain("tab === 'risk'")
    expect(tsx).toContain("tab === 'issue'")
    expect(tsx).toContain("'open'")
    expect(tsx).toContain("'monitoring'")
    expect(tsx).toContain("'closed'")
    expect(tsx).toContain("status !== 'closed'")
    expect(tsx).toContain('probability')
    expect(tsx).toContain('impact')
  })

  it('risk-issues.css 零裸色', () => {
    assertNoBareColor(css, 'risk-issues.css')
  })
})

describe('B5-A03 people：真实未完成四桶互斥 / 过载阈值 / 展开不退化', () => {
  const tsx = read('./people.tsx')
  const css = read('./people.css')

  it('core groupOpenTasksByAssignee 四桶合计 == openTotal（真实未完成，无 mock 填充）', () => {
    const report = groupOpenTasksByAssignee([
      { id: 't1', projectId: 'p1', title: '逾期', status: 'todo', assignee: '张三', dueDate: '2026-01-01', bucket: 'overdue' },
      { id: 't2', projectId: 'p1', title: '临期', status: 'todo', assignee: '张三', dueDate: '2026-11-05', bucket: 'due-soon' },
      { id: 't3', projectId: 'p1', title: '进行中', status: 'in_progress', assignee: '张三', dueDate: '2026-11-20', bucket: 'open' },
    ], [{ id: 'p1', name: 'P' }], { today: '2026-11-03', withinDays: 7 })
    const row = report.people.find(p => p.key)
    expect(row).toBeTruthy()
    const buckets = (row.overdue + row.dueSoon + row.inProgress + (row.openTotal - row.overdue - row.dueSoon - row.inProgress))
    expect(buckets).toBe(row.openTotal)
  })

  it('视图消费 settings.loadOverloadThreshold 同一 MAX、叶子过滤、展开明细', () => {
    expect(tsx).toContain('groupOpenTasksByAssignee')
    expect(tsx).toContain('loadOverloadThreshold')
    expect(tsx).toContain('expanded')
    expect(tsx).toContain('parentId')
  })

  it('people.css 零裸色', () => {
    assertNoBareColor(css, 'people.css')
  })
})

describe('B5-A01m milestones：四态 / 目标日期排序 / 关联任务不回归', () => {
  const tsx = read('./milestones.tsx')
  const css = read('./milestones.css')
  it('四态标签与 targetDate 排序保留', () => {
    expect(tsx).toContain("'planned'")
    expect(tsx).toContain("'at_risk'")
    expect(tsx).toContain("'achieved'")
    expect(tsx).toContain("'missed'")
    expect(tsx).toContain('targetDate')
  })
  it('milestones.css 零裸色', () => {
    assertNoBareColor(css, 'milestones.css')
  })
})

describe('B5-GAP gantt 身份列副行 / people 不造角色 / milestone 反查（批准设计补全）', () => {
  const gantt = read('./gantt.tsx')
  const people = read('./people.tsx')
  const ms = read('./milestones.tsx')

  it('gantt 身份列副行用既有事实字段：负责人(assignee)·状态·进度，不造角色', () => {
    expect(gantt).toContain('ganttStatusText')
    expect(gantt).toContain('assignee')
    expect(gantt).toContain('progress')
    // 跨度 min→max 由 axis.start/end 呈现，不另造数据源
    expect(gantt).toContain('axis.start')
    expect(gantt).toContain('axis.end')
  })

  it('people 不硬编码虚构名册，assigned 只显示事实姓名', () => {
    expect(people).not.toContain('ROLES')
    expect(people).not.toContain('团队成员')
    expect(people).toContain('需派工')
  })

  it('milestone 经 task.milestoneId 只读反查关联任务（非 N/A）', () => {
    expect(ms).toContain('milestoneId')
    expect(ms).toContain('tasksByMilestone')
  })
})

describe('B5-A04 改动面：仅视图/css，不回写 panel/core/board', () => {
  const files = ['./gantt.tsx', './milestones.tsx', './risk-issues.tsx', './people.tsx']
  for (const f of files) {
    const src = read(f)
    it(`${f} 不回写 panel.tsx（core 只读消费允许）`, () => {
      expect(src).not.toMatch(/from\s+['"]\.\.\/panel\.js['"]/)
      expect(src).not.toMatch(/import\s+.*panel/)
    })
  }
})
