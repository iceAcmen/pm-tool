import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GanttView } from './gantt.js'
import { taskWriteSchema, type Task } from '../../core/task.js'

// Oracle 来自独立先行合同 L8-R3-T01/T02，不复制产品映射函数。
const statuses = [
  { status: 'todo', label: '待办', barClass: 'st-todo' },
  { status: 'in_progress', label: '进行中', barClass: 'st-prog' },
  { status: 'blocked', label: '阻塞', barClass: 'st-todo' },
  { status: 'done', label: '已完成', barClass: 'st-done' },
  { status: 'wrapped', label: '已收尾 · 非正式完成', barClass: 'st-todo' },
] as const
const noop = () => {}
const run = vi.fn(async (_line: string, _options?: { quiet?: boolean }) => true)
let mounted: ReactTestRenderer | undefined

afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
  run.mockClear()
})

function task(overrides: Partial<Task>): Task {
  return taskWriteSchema.parse({
    id: 't-0010', projectId: 'p-0001', parentId: 't-0001', code: '6',
    title: 'F2-L8', description: '', assignee: '', status: 'wrapped', priority: 'P1',
    dueDate: '2026-10-20', progress: 0, milestoneId: null, manualProgress: null,
    checklist: [{ id: '90156246-014f-4ba3-9693-e34edd29871c', text: '收尾核对', done: true }],
    order: 6, createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '2026-10-20T00:00:00.000Z',
    ...overrides,
  })
}

function fixture(target: Task): Task[] {
  return [
    task({ id: 't-0001', parentId: null, code: '1', title: 'F2-P', status: 'todo',
      dueDate: undefined, checklist: undefined, order: 1 }),
    // 无排期 L8 不能独自形成时间轴；合法独立排期任务保证测试命中真实左列。
    task({ id: 't-0099', parentId: null, code: '99', title: '时间轴任务', status: 'todo',
      startDate: '2026-10-21', dueDate: '2026-10-23', checklist: undefined, order: 99 }),
    target,
  ]
}

function render(tasks: Task[]) {
  const element = createElement(GanttView, {
    tasks, milestones: [], run, onEdit: noop, onCreate: noop, onGotoView: noop,
  })
  act(() => {
    if (mounted) mounted.update(element)
    else mounted = create(element)
  })
  return mounted!.root
}

function text(node: ReactTestInstance): string {
  return node.children.map(child => typeof child === 'string' ? child : text(child)).join('')
}

function hasClass(node: ReactTestInstance, name: string) {
  return typeof node.type === 'string' && String(node.props.className ?? '').split(' ').includes(name)
}

function row(root: ReactTestInstance, target: Task) {
  return root.findAll(node => hasClass(node, 'pm-gantt-label-row'))
    .find(node => node.findAllByProps({ className: 'pm-gantt-label-title' })
      .some(title => text(title) === target.title))!
}

function bars(root: ReactTestInstance, target: Task) {
  return root.findAll(node => typeof node.type === 'string' && node.props['data-task-id'] === target.id)
}

function observe(caseId: string, tasks: Task[], root: ReactTestInstance, target: Task) {
  if (process.env.L8_GANTT_EVIDENCE !== '1') return
  const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
  const input = JSON.stringify(tasks)
  const labelRow = row(root, target)
  const observations = {
    rowClass: labelRow.props.className,
    sub: text(labelRow.findByProps({ className: 'pm-gantt-label-sub' })),
    bars: bars(root, target).map(bar => ({
      tag: bar.type, role: bar.props.role, taskId: bar.props['data-task-id'],
      className: bar.props.className, aria: bar.props['aria-label'], title: bar.props.title,
      fills: bar.findAllByProps({ className: 'pm-gantt-bar-progress' }).map(fill => fill.props.style.width),
    })),
  }
  console.info('L8_OBSERVATION ' + JSON.stringify({
    caseId, sourceSha256: hash(readFileSync(new URL('./gantt.tsx', import.meta.url))),
    input: tasks, inputSha256: hash(input), observations,
    observationsSha256: hash(JSON.stringify(observations)),
  }))
}

describe('L8-R3-T01/T02 真实 GanttView 五态', () => {
  it.each(statuses)('左列 $status = $label，done class 保真', ({ status, label }) => {
    const target = task({ status })
    const tasks = fixture(target)
    const before = structuredClone(tasks)
    const root = render(tasks)
    const labelRow = row(root, target)
    const sub = text(labelRow.findByProps({ className: 'pm-gantt-label-sub' }))
    observe(`T01-${status}`, tasks, root, target)
    expect(sub.endsWith(` · ${label} · 负责人 未分配`)).toBe(true)
    expect(hasClass(labelRow, 'is-done')).toBe(status === 'done')
    expect(tasks).toEqual(before)
    expect(run).not.toHaveBeenCalled()
  })

  it.each(statuses)('有排期 $status 的 DIV rolebutton aria 与左列一致', ({ status, label, barClass }) => {
    const target = task({ status, startDate: '2026-10-18' })
    const tasks = fixture(target)
    const before = structuredClone(tasks)
    const root = render(tasks)
    observe(`T02-${status}`, tasks, root, target)
    expect(bars(root, target)).toHaveLength(1)
    const bar = bars(root, target)[0]
    expect(bar.type).toBe('div')
    expect(bar.props.role).toBe('button')
    expect(bar.props['aria-label']).toContain(`任务 F2-L8，2026-10-18 ~ 2026-10-20，3 天，${label}，客观 100%`)
    expect(bar.props['aria-label']).toContain('单击选中；双击或回车打开详情；←/→ 移动 1 天，Shift+←/→ 调整工期。')
    expect(text(row(root, target))).toContain(` · ${label} · 负责人 未分配`)
    expect(hasClass(row(root, target), 'is-done')).toBe(status === 'done')
    expect(hasClass(bar, 'st-done')).toBe(status === 'done')
    expect(hasClass(bar, barClass)).toBe(true)
    expect(hasClass(bar, 'is-blocked')).toBe(status === 'blocked')
    expect(bar.findByProps({ className: 'pm-gantt-bar-progress' }).props.style.width).toBe('100%')
    expect(tasks).toEqual(before)
    expect(run).not.toHaveBeenCalled()
  })

  it('原无开始日期 L8 保持 wrapped/legacy0/清单1/1，只显示左列而无该条体', () => {
    const target = task({})
    const tasks = fixture(target)
    const before = structuredClone(tasks)
    const root = render(tasks)
    observe('T03-unscheduled-L8', tasks, root, target)
    expect(root.findAllByProps({ className: 'pm-gantt-root' })).toHaveLength(1)
    expect(bars(root, tasks[1])).toHaveLength(1)
    expect(bars(root, target)).toHaveLength(0)
    expect(text(row(root, target))).toContain('未排期')
    expect(text(row(root, target))).toContain('客观 100%')
    expect(text(row(root, target))).not.toContain('待验收')
    expect(text(row(root, target))).toContain(' · 已收尾 · 非正式完成 · 负责人 未分配')
    expect(hasClass(row(root, target), 'is-done')).toBe(false)
    expect(tasks).toEqual(before)
    expect(target.status).toBe('wrapped')
    expect(target.progress).toBe(0)
    expect(target).not.toHaveProperty('completedDate')
    expect(target).not.toHaveProperty('startDate')
    expect(run).not.toHaveBeenCalled()
  })
})

describe('L8-R3-T04 必要进度窄测，不复制完整旅程', () => {
  it.each([true, false])('清单证据=$hasChecklist：人工70清除回落40/null，而非legacy40', hasChecklist => {
    const checklist = hasChecklist ? Array.from({ length: 5 }, (_, index) => ({
      id: `90156246-014f-4ba3-9693-e34edd29871${index}`, text: `核对 ${index + 1}`, done: index < 2,
    })) : undefined
    const target = task({ id: hasChecklist ? 't-0007' : 't-0005', title: hasChecklist ? 'F2-L5' : 'F2-L3',
      status: hasChecklist ? 'done' : 'todo', startDate: '2026-10-18', progress: 40, checklist })
    const tasks = fixture(target)
    const assertProgress = (display: number | null, manual: boolean) => {
      const root = render(tasks)
      const bar = bars(root, target)[0]
      observe(`T04-${target.title}-${manual ? 'manual70' : 'objective'}`, tasks, root, target)
      const objective = hasChecklist ? '40%' : '证据不足'
      expect(bar.props['aria-label']).toContain(`客观 ${objective}`)
      expect(text(row(root, target))).toContain(`客观 ${objective}`)
      const fills = bar.findAllByProps({ className: 'pm-gantt-bar-progress' })
      if (display === null) expect(fills).toHaveLength(0)
      else expect(fills[0].props.style.width).toBe(`${display}%`)
      expect(String(bar.props['aria-label']).includes('人工设定 70%')).toBe(manual)
    }
    const original = structuredClone(tasks)
    assertProgress(hasChecklist ? 40 : null, false)
    expect(tasks).toEqual(original)
    tasks[2] = taskWriteSchema.parse({ ...target, manualProgress: 70 })
    const manualInput = structuredClone(tasks)
    assertProgress(70, true)
    expect(tasks).toEqual(manualInput)
    tasks[2] = taskWriteSchema.parse({ ...target, manualProgress: null })
    assertProgress(hasChecklist ? 40 : null, false)
    expect(tasks).toEqual(original)
    expect(run).not.toHaveBeenCalled()
  })
})
