import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it } from 'vitest'
import { taskRecordSchema, type Task } from '../../core/task.js'
import { collectStats } from '../../core/stats.js'
import type { PmDomain } from '../../core/storage.js'
import { Overview } from './overview.js'

// 专家原始十任务备份，字节指纹固定；不以修改后的展示算法构造预期。
const fixtureBytes = readFileSync(new URL(
  '../../../../../docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json',
  import.meta.url,
))
const fixture = JSON.parse(fixtureBytes.toString('utf8'))
const f2: Task[] = fixture.tasks.map((task: unknown) => taskRecordSchema.parse(task))
let mounted: ReactTestRenderer | undefined

afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
})

function render(tasks: Task[]) {
  const element = createElement(Overview, {
    project: fixture.projects[0],
    tasks, milestones: fixture.milestones, riskIssues: fixture.riskIssues,
    meetingsCount: 0, reportsCount: 0, deliverablesCount: 0,
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

function stat(root: ReactTestInstance, label: string) {
  return root.findAllByProps({ className: 'ov-card ov-stat' })
    .find(node => text(node.findByProps({ className: 'ov-lab' })) === label)!
}

function phase(root: ReactTestInstance, title: string) {
  return root.findAllByProps({ className: 'ov-phase' })
    .find(node => text(node.findByProps({ className: 'ov-pname-t' })) === title)!
}

function assertCompletion(root: ReactTestInstance, tasks: Task[], done: number, rate: number) {
  const card = stat(root, '任务完成')
  expect(text(card.findByProps({ className: 'ov-num' }))).toBe(`${done}/${tasks.length}`)
  expect(text(card.findByProps({ className: 'ov-sub' }))).toBe(`${rate}% 已完成`)
  expect(card.findByProps({ className: 'ov-mini-bar' }).findByType('i').props.style.width).toBe(`${rate}%`)

  // 同页权威统计源的真实函数，只提供内存只读表，不替换产品函数或组件。
  const tables = new Map([
    ['projects', new Map([[fixture.projects[0].id, fixture.projects[0]]])],
    ['tasks', new Map(tasks.map(task => [task.id, task]))],
  ])
  const domain = { table: (name: string) => tables.get(name) ?? new Map() } as unknown as PmDomain
  const stats = collectStats(domain, fixture.projects[0].id, '2026-10-21').projects[0]
  expect(stats.taskDone).toBe(done)
  expect(stats.completionRate).toBe(rate)
  expect(stats.taskWrapped).toBe(tasks.filter(task => task.status === 'wrapped').length)
}

function assertF2OtherCards(root: ReactTestInstance) {
  expect(text(stat(root, '未完成').findByProps({ className: 'ov-num' }))).toBe('7/10')
  expect(text(stat(root, '未完成').findByProps({ className: 'ov-sub' }))).toContain('1 已收尾')
  expect(text(stat(root, '里程碑').findByProps({ className: 'ov-num' }))).toBe('0')
  expect(text(stat(root, '风险与问题').findByProps({ className: 'ov-num' }))).toBe('0')
  expect(text(phase(root, 'F2-L5'))).toContain('客观 40%')
  expect(text(phase(root, 'F2-L5'))).toContain('清单 2/5')
  expect(text(phase(root, 'F2-L6'))).toContain('证据不足')
  expect(text(phase(root, 'F2-L6'))).toContain('原手填 80%')
}

describe('A10-OP-G01 真实总览状态完成卡', () => {
  it('原 F2：done2/10=20，wrapped1独列，todo legacy100不算完成', () => {
    expect(createHash('sha256').update(fixtureBytes).digest('hex'))
      .toBe('451ce27c0b84c61419a6770dee27bf70795fef24b081e6be73c551bd9e7a1d8b')
    expect(f2).toHaveLength(10)
    expect(f2.filter(task => task.status === 'done')).toHaveLength(2)
    expect(f2.filter(task => task.status === 'wrapped')).toHaveLength(1)
    expect(f2.find(task => task.id === 't-0001')).toMatchObject({ status: 'todo', progress: 100 })
    expect(f2.find(task => task.id === 't-0007')).toMatchObject({ status: 'done', progress: 0 })
    const tasks = structuredClone(f2)
    const before = structuredClone(tasks)
    const root = render(tasks)
    assertCompletion(root, tasks, 2, 20)
    assertF2OtherCards(root)
    expect(text(phase(root, 'F2-P'))).toContain('客观 63%')
    expect(text(phase(root, 'F2-P'))).toContain('覆盖 2/3')
    expect(tasks).toEqual(before)
  })

  it('空任务分母0显示0/0和0%，无NaN/Infinity', () => {
    const root = render([])
    assertCompletion(root, [], 0, 0)
    expect(text(stat(root, '未完成').findByProps({ className: 'ov-num' }))).toBe('0/0')
  })

  it('全零进度且无done：0/10=0，done与progress各自独立', () => {
    const tasks = f2.map(task => taskRecordSchema.parse({
      ...task, status: 'todo', progress: 0, manualProgress: 0,
      checklist: task.checklist?.map(item => ({ ...item, done: false })),
    }))
    assertCompletion(render(tasks), tasks, 0, 0)
  })

  it.each(['todo', 'in_progress', 'blocked', 'wrapped'] as const)(
    '%s的legacy100及人工100均不增加状态完成，wrapped仍独列',
    status => {
      const tasks = structuredClone(f2)
      Object.assign(tasks.find(task => task.id === 't-0010')!, {
        status, progress: 100, manualProgress: 100, manualProgressNote: '人工确认',
      })
      const before = structuredClone(tasks)
      const root = render(tasks)
      assertCompletion(root, tasks, 2, 20)
      if (status === 'wrapped') assertF2OtherCards(root)
      expect(tasks).toEqual(before)
    },
  )

  it('同实例L1人工30→0→clear不影响20%、客观63及覆盖2/3', () => {
    let tasks = structuredClone(f2)
    for (const manualProgress of [30, 0, null]) {
      tasks = tasks.map(task => task.id === 't-0003'
        ? taskRecordSchema.parse({ ...task, manualProgress, manualProgressNote: '现场确认' })
        : task)
      const before = structuredClone(tasks)
      const root = render(tasks)
      assertCompletion(root, tasks, 2, 20)
      assertF2OtherCards(root)
      expect(text(phase(root, 'F2-P'))).toContain('客观 63%')
      expect(text(phase(root, 'F2-P'))).toContain('覆盖 2/3')
      expect(tasks.find(task => task.id === 't-0003')).toMatchObject({
        status: 'todo', progress: 40, manualProgress,
      })
      expect(tasks).toEqual(before)
    }
  })

  it('顶层人工30→0→clear仅影响独立人工显示，客观及完成卡保真', () => {
    let tasks = structuredClone(f2)
    for (const manualProgress of [30, 0, null]) {
      tasks = tasks.map(task => task.id === 't-0001'
        ? taskRecordSchema.parse({ ...task, manualProgress, manualProgressNote: '阶段确认' })
        : task)
      const root = render(tasks)
      assertCompletion(root, tasks, 2, 20)
      const parent = phase(root, 'F2-P')
      expect(text(parent)).toContain('客观 63%')
      expect(text(parent)).toContain('覆盖 2/3')
      expect(text(parent.findByProps({ className: 'ov-pct' })))
        .toBe(`${manualProgress ?? 63}%`)
      if (manualProgress === null) expect(text(parent)).not.toContain('人工设定')
      else expect(text(parent)).toContain(`人工设定 ${manualProgress}%`)
    }
  })

  it('同实例清单50→100→50→0→100不改状态完成；父客观63/88/38独立变化', () => {
    let tasks = structuredClone(f2)
    for (const [checked, parentProgress] of [
      [1, 63], [2, 88], [1, 63], [0, 38], [2, 88],
    ]) {
      tasks = tasks.map(task => task.id === 't-0003'
        ? taskRecordSchema.parse({
            ...task, manualProgress: null,
            checklist: task.checklist!.map((item, index) => ({ ...item, done: index < checked })),
          })
        : task)
      const before = structuredClone(tasks)
      const root = render(tasks)
      assertCompletion(root, tasks, 2, 20)
      assertF2OtherCards(root)
      expect(text(phase(root, 'F2-P'))).toContain(`客观 ${parentProgress}%`)
      expect(text(phase(root, 'F2-P'))).toContain('覆盖 2/3')
      expect(tasks.find(task => task.id === 't-0003')).toMatchObject({ status: 'todo', progress: 40 })
      expect(tasks).toEqual(before)
    }
  })
})
