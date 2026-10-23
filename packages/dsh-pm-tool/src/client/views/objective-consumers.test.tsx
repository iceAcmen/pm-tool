import { readFileSync } from 'node:fs'
import { createElement, type ReactElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskTable } from './tasks.js'
import { Overview } from './overview.js'
import { GanttView } from './gantt.js'
import { taskRecordSchema, type Task } from '../../core/task.js'
import { deriveProjectProgress } from '../../core/progress-derivation.js'

// 专家原始合法 F2，预期来自报告 §5，不以展示算法反算 oracle。
const fixture = JSON.parse(readFileSync(new URL(
  '../../../../../docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2.json',
  import.meta.url,
), 'utf8'))
const f2: Task[] = fixture.tasks.map((task: unknown) => taskRecordSchema.parse(task))
const noop = () => {}
const run = vi.fn(async (_line: string, _options?: { quiet?: boolean }) => true)
let mounted: ReactTestRenderer | undefined

beforeEach(() => {
  // 仅提供浏览器事件边界；产品组件、派生和状态机不替换。
  vi.stubGlobal('window', { addEventListener: noop, removeEventListener: noop })
  run.mockClear()
})
afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
  vi.unstubAllGlobals()
})

function render(element: ReactElement) {
  act(() => {
    if (mounted) mounted.update(element)
    else mounted = create(element)
  })
  return mounted!.root
}

function text(node: ReactTestInstance): string {
  return node.children.map(child => typeof child === 'string' ? child : text(child)).join('')
}

function progressRow(root: ReactTestInstance, id: string) {
  return root.findByProps({ 'data-pm-row': id })
}

function progressCell(row: ReactTestInstance) {
  return row.find(node => typeof node.type === 'string' && node.props.className === 'pt-cell pt-prog')
}

function tasksElement(tasks = structuredClone(f2)) {
  return createElement(TaskTable, {
    tasks, milestones: [], projectId: fixture.ids.project,
    onCreate: noop, onEdit: noop, onGenWbs: noop, onSaved: noop, run,
    execute: async () => '',
  })
}

function overviewElement(tasks = structuredClone(f2)) {
  return createElement(Overview, {
    project: { id: fixture.ids.project, name: 'QA-OP', description: '', owner: '',
      status: 'active', startDate: '2026-01-01', targetDate: '2026-12-31' },
    tasks, milestones: [], riskIssues: [],
  })
}

function phase(root: ReactTestInstance, title: string) {
  return root.findAll(node => node.props.className === 'ov-phase')
    .find(node => text(node).includes(title))!
}

describe('OP-AUTO-DEF-01 真实任务列表/树及总览消费', () => {
  it('F2 列表和树都显示 L1 客观50、P63覆盖2/3；legacy仅旁注，无清单证据不足', () => {
    const before = structuredClone(f2)
    const root = render(tasksElement())
    const assertRows = () => {
      expect(text(progressCell(progressRow(root, fixture.ids.L1)))).toContain('客观 50%')
      expect(text(progressCell(progressRow(root, fixture.ids.L1)))).toContain('清单 1/2')
      const parent = text(progressCell(progressRow(root, fixture.ids.P)))
      expect(parent).toContain('63%')
      expect(parent).toContain('覆盖 2/3')
      expect(parent).toContain('已覆盖任务清单完成度')
      const legacy = text(progressCell(progressRow(root, fixture.ids.L3)))
      expect(legacy).toContain('证据不足')
      expect(legacy).toContain('原手填 40%')
      expect(text(progressCell(progressRow(root, fixture.ids.L6)))).toContain('证据不足')
      expect(text(progressCell(progressRow(root, fixture.ids.L7)))).toContain('证据不足')
    }
    assertRows()
    act(() => root.findByProps({ className: 'pt-ghost pm-group-toggle' }).props.onClick())
    assertRows()
    expect(f2).toEqual(before)
    expect(run).not.toHaveBeenCalled()
  })

  it('F2 总览阶段 P63而非legacy20，done清单40/无清单null，不强填100', () => {
    const root = render(overviewElement())
    expect(text(phase(root, 'F2-P'))).toContain('客观 63%')
    expect(text(phase(root, 'F2-P'))).toContain('覆盖 2/3')
    expect(text(phase(root, 'F2-P'))).toContain('已覆盖任务清单完成度')
    expect(text(phase(root, 'F2-L5'))).toContain('客观 40%')
    expect(text(phase(root, 'F2-L5'))).toContain('清单 2/5')
    expect(text(phase(root, 'F2-L6'))).toContain('证据不足')
    expect(text(phase(root, 'F2-L6'))).toContain('原手填 80%')
  })

  it.each([30, 0])('人工%s可见且来源明确；同组件清除回落objective，不回落legacy', manual => {
    const tasks = structuredClone(f2)
    tasks.find(t => t.id === fixture.ids.L1)!.manualProgress = manual
    tasks.find(t => t.id === fixture.ids.L1)!.manualProgressNote = '现场确认'
    const root = render(tasksElement(tasks))
    const cell = progressCell(progressRow(root, fixture.ids.L1))
    expect(text(cell)).toContain(`人工设定 ${manual}%`)
    expect(text(cell)).toContain('现场确认')
    expect(text(cell)).toContain('客观 50%')
    expect(cell.findByProps({ className: 'pt-bar' }).findByType('i').props.style.width).toBe(`${manual}%`)
    tasks.find(t => t.id === fixture.ids.L1)!.manualProgress = null
    render(tasksElement([...tasks]))
    expect(text(progressCell(progressRow(root, fixture.ids.L1)))).not.toContain('人工设定')
    expect(text(progressCell(progressRow(root, fixture.ids.L1)))).toContain('客观 50%')
    expect(deriveProjectProgress(tasks, fixture.ids.project).value).toBe(66)
    expect(run).not.toHaveBeenCalled()
  })

  it.each([30, 0])('总览阶段人工%s不污染父客观63；清除后回落63，无清单清除仍null', manual => {
    const tasks = structuredClone(f2)
    const parent = tasks.find(t => t.id === fixture.ids.P)!
    parent.manualProgress = manual
    parent.manualProgressNote = '阶段确认'
    const root = render(overviewElement(tasks))
    expect(text(phase(root, 'F2-P'))).toContain(`人工设定 ${manual}%`)
    expect(text(phase(root, 'F2-P'))).toContain('客观 63%')
    expect(text(phase(root, 'F2-P'))).toContain('阶段确认')
    parent.manualProgress = null
    const legacy = tasks.find(t => t.id === fixture.ids.L6)!
    legacy.manualProgress = 40
    render(overviewElement([...tasks]))
    expect(text(phase(root, 'F2-P'))).not.toContain('人工设定')
    expect(text(phase(root, 'F2-L6'))).toContain('人工设定 40%')
    expect(text(phase(root, 'F2-L6'))).toContain('证据不足')
    legacy.manualProgress = null
    render(overviewElement([...tasks]))
    expect(text(phase(root, 'F2-L6'))).not.toContain('人工设定')
    expect(text(phase(root, 'F2-L6'))).toContain('证据不足')
  })

  it('全勾todo只显示待验收，wrapped自身可显100但不挂待验收/父覆盖；改回后重新纳入', () => {
    const tasks = structuredClone(f2)
    const wrapped = tasks.find(t => t.id === fixture.ids.L8)!
    wrapped.parentId = fixture.ids.P
    const root = render(tasksElement(tasks))
    expect(text(progressCell(progressRow(root, fixture.ids.L4)))).toContain('待验收')
    expect(text(progressCell(progressRow(root, fixture.ids.L8)))).toContain('客观 100%')
    expect(text(progressCell(progressRow(root, fixture.ids.L8)))).not.toContain('待验收')
    expect(text(progressCell(progressRow(root, fixture.ids.P)))).toContain('客观 63%')
    expect(text(progressCell(progressRow(root, fixture.ids.P)))).toContain('覆盖 2/3')
    wrapped.status = 'todo'
    render(tasksElement([...tasks]))
    expect(text(progressCell(progressRow(root, fixture.ids.P)))).toContain('客观 75%')
    expect(text(progressCell(progressRow(root, fixture.ids.P)))).toContain('覆盖 3/4')
    expect(text(progressCell(progressRow(root, fixture.ids.L8)))).toContain('待验收')
    expect(run).not.toHaveBeenCalled()
    expect(tasks.find(t => t.id === fixture.ids.L4)!.status).toBe('todo')
  })

  it('无清单人工0在列表可见，清除后证据不足；父筛选只留P也保持完整63', () => {
    const tasks = structuredClone(f2)
    const legacy = tasks.find(t => t.id === fixture.ids.L3)!
    legacy.manualProgress = 0
    const root = render(tasksElement(tasks))
    expect(text(progressCell(progressRow(root, fixture.ids.L3)))).toContain('人工设定 0%')
    expect(text(progressCell(progressRow(root, fixture.ids.L3)))).toContain('客观 证据不足')
    legacy.manualProgress = null
    render(tasksElement([...tasks]))
    expect(text(progressCell(progressRow(root, fixture.ids.L3)))).not.toContain('人工设定')
    act(() => root.findByProps({ placeholder: '搜索任务名称 / 编号…' })
      .props.onChange({ currentTarget: { value: 'F2-P' } }))
    expect(text(progressCell(progressRow(root, fixture.ids.P)))).toContain('客观 63%')
    expect(text(progressCell(progressRow(root, fixture.ids.P)))).toContain('覆盖 2/3')
  })
})

describe('OP-AUTO-DEF-02 甘特真实渲染而非仅progressFill纯函数', () => {
  it.each([
    { id: fixture.ids.L5, manual: undefined, objective: 40, display: 40, label: '客观 40%' },
    { id: fixture.ids.L6, manual: undefined, objective: null, display: null, label: '证据不足' },
    { id: fixture.ids.L5, manual: 70, objective: 40, display: 70, label: '人工设定 70%' },
    { id: fixture.ids.L5, manual: 0, objective: 40, display: 0, label: '人工设定 0%' },
  ])('三fixture及人工0：$label，客观$objective保真', ({ id, manual, objective, display, label }) => {
    const tasks = structuredClone(f2)
    const task = tasks.find(t => t.id === id)!
    // 原 F2 L5=2/5、L6无清单；仅补合法排期用于实际条体渲染。
    task.startDate = '2026-10-21'
    task.dueDate = '2026-10-23'
    task.manualProgress = manual
    task.manualProgressNote = manual === undefined ? undefined : '进度确认'
    const root = render(createElement(GanttView, {
      tasks, milestones: [], run, onEdit: noop, onCreate: noop, onGotoView: noop,
    }))
    const bar = root.findByProps({ 'data-task-id': id })
    expect(bar.props['aria-label']).toContain(label)
    expect(bar.props.title).toContain(label)
    const fills = bar.findAllByProps({ className: 'pm-gantt-bar-progress' })
    if (display === null) expect(fills).toHaveLength(0)
    else expect(fills[0].props.style.width).toBe(`${display}%`)
    const row = root.findAll(node =>
      typeof node.type === 'string' && String(node.props.className ?? '').split(' ').includes('pm-gantt-label-row'))
      .find(node => text(node).includes(task.title))!
    expect(text(row)).toContain(label)
    expect(text(row)).toContain(objective === null ? '证据不足' : `客观 ${objective}%`)
    if (manual !== undefined) expect(text(row)).toContain('进度确认')
    expect(run).not.toHaveBeenCalled()
  })

  it('同实例人工70清除后回落50；改期仍只写日期、不改人工/客观/status', async () => {
    const tasks = structuredClone(f2)
    const task = tasks.find(t => t.id === fixture.ids.L1)!
    task.manualProgress = 70
    const element = () => createElement(GanttView, {
      tasks: [...tasks], milestones: [], run, onEdit: noop, onCreate: noop, onGotoView: noop,
    })
    const root = render(element())
    task.manualProgress = null
    render(element())
    const bar = root.findByProps({ 'data-task-id': task.id })
    expect(bar.props['aria-label']).toContain('客观 50%')
    expect(bar.props['aria-label']).not.toContain('人工设定')
    expect(bar.findByProps({ className: 'pm-gantt-bar-progress' }).props.style.width).toBe('50%')
    await act(async () => {
      await bar.props.onKeyDown({ key: 'ArrowRight', shiftKey: false, preventDefault: noop })
    })
    expect(run.mock.calls[0]).toEqual([
      `task update ${task.id} {"startDate":"2026-10-22","dueDate":"2026-10-24"}`, { quiet: true },
    ])
    expect(task.status).toBe('todo')
    expect(task.progress).toBe(40)
    expect(task.checklist!.filter(item => item.done)).toHaveLength(1)
  })
})
