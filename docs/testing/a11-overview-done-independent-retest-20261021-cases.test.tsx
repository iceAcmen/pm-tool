import { readFileSync } from 'node:fs'
import { createElement, Fragment } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it } from 'vitest'
import { Overview } from './overview.js'
import { taskRecordSchema, taskWriteSchema, type Task } from '../../core/task.js'
import { projectRecordSchema } from '../../core/project.js'
import { collectStats } from '../../core/stats.js'
import { computeKPI } from '../../core/war-room.js'
import { WIDGET_REGISTRY } from '../board/widgets.js'
import { scopeSnapshot } from '../board/scope-snapshot.js'
import { selectEntity, applyFilter } from '../board/query.js'
import { deriveProgressMap } from '../../core/progress-derivation.js'
import type { PmDomain } from '../../core/storage.js'
import type { Snapshot } from '../panel.js'

const backup = JSON.parse(readFileSync(new URL(
  '../../../../../docs/testing/objective-independent-auto-20261021-evidence/objective-independent-auto-20261021-9dg1J5/f2-backup.json',
  import.meta.url,
), 'utf8'))
const project = projectRecordSchema.parse(backup.projects[0])
const f2: Task[] = backup.tasks.map((t: unknown) => taskRecordSchema.parse(t))
const mounted: ReactTestRenderer[] = []
afterEach(() => {
  for (const renderer of mounted.splice(0)) act(() => renderer.unmount())
})
const text = (node: ReactTestInstance): string =>
  node.children.map(child => typeof child === 'string' ? child : text(child)).join('')
const byClass = (root: ReactTestInstance, className: string) =>
  root.findByProps({ className })
const card = (root: ReactTestInstance, label: string) =>
  root.findAllByProps({ className: 'ov-card ov-stat' })
    .find(node => text(byClass(node, 'ov-lab')) === label)!
const pick = (...ids: string[]) => structuredClone(f2.filter(t => ids.includes(t.id)))
const state = (t: Task, status: Task['status']): Task => {
  const next = { ...t, status }
  if (status === 'done') next.completedDate = '2026-10-21'
  else delete next.completedDate
  return taskWriteSchema.parse(next)
}

function legal(tasks: Task[]) {
  const ids = new Set(tasks.map(t => t.id))
  expect(ids.size).toBe(tasks.length)
  expect(new Set(tasks.map(t => t.code)).size).toBe(tasks.length)
  for (const task of tasks) {
    taskWriteSchema.parse(task)
    expect(task.projectId).toBe(project.id)
    if (task.parentId !== null) {
      expect(ids.has(task.parentId)).toBe(true)
      expect(task.parentId).not.toBe(task.id)
      const parent = tasks.find(t => t.id === task.parentId)!
      expect(task.code.startsWith(`${parent.code}.`)).toBe(true)
    }
    for (const predecessor of task.predecessorIds ?? []) expect(ids.has(predecessor)).toBe(true)
    if (tasks.some(t => t.parentId === task.id)) expect(task.checklist?.length ?? 0).toBe(0)
  }
}

function snapshot(tasks: Task[]): Snapshot {
  return {
    projects: [project], tasks, milestones: [], riskIssues: [],
    meetings: [], reports: [], deliverables: [], reflections: [], okrs: [],
    lessons: [], habits: [], fileAssets: {},
  } as Snapshot
}

function mount(tasks: Task[]) {
  let view!: ReactTestRenderer
  let template!: ReactTestRenderer
  act(() => {
    view = create(createElement(Overview, {
      project, tasks, milestones: [], riskIssues: [],
    }))
    template = create(createElement(Fragment, null, WIDGET_REGISTRY.get('completionHero')!.render({
      data: snapshot(tasks), config: {}, actions: { openRecord() {}, pickProject() {} },
      isEditing: false,
    })))
  })
  mounted.push(view, template)
  return { view, template }
}

function assertMatched(tasks: Task[], done: number, rate: number, wrapped: number, pair = mount(tasks)) {
  legal(tasks)
  const before = structuredClone(tasks)
  const root = pair.view.root
  const complete = card(root, '任务完成')
  expect(text(byClass(complete, 'ov-num'))).toBe(`${done}/${tasks.length}`)
  expect(text(byClass(complete, 'ov-sub'))).toBe(`${rate}% 已完成`)
  expect(byClass(complete, 'ov-mini-bar').findByType('i').props.style.width).toBe(`${rate}%`)
  const open = card(root, '未完成')
  expect(text(byClass(open, 'ov-num'))).toBe(`${tasks.length - done - wrapped}/${tasks.length}`)
  if (wrapped > 0) expect(text(byClass(open, 'ov-sub'))).toContain(`${wrapped} 已收尾`)
  else expect(text(byClass(open, 'ov-sub'))).not.toContain('已收尾')

  const tables = new Map<string, Map<string, unknown>>([
    ['projects', new Map([[project.id, project]])],
    ['tasks', new Map(tasks.map(t => [t.id, t]))],
  ])
  const domain = { table: (name: string) => tables.get(name) ?? new Map() } as unknown as PmDomain
  const stats = collectStats(domain, project.id, '2026-10-21').projects[0]
  expect(stats).toMatchObject({ taskTotal: tasks.length, taskDone: done, taskWrapped: wrapped, completionRate: rate })
  const hero = pair.template.root
  expect(hero.findAllByType('text').map(text)).toEqual([`${rate}%`, `${done} / ${tasks.length}`])
  const buckets = hero.findAllByProps({ className: 'pm-hero-barrow  ' })
  const numbers = Object.fromEntries(buckets.map(row => [
    text(row.findAllByType('span')[0]), Number(text(byClass(row, 'pm-bento-m'))),
  ]))
  expect(numbers['完成']).toBe(done)
  expect(numbers['收尾']).toBe(wrapped)
  expect(Object.values(numbers).reduce((a, b) => a + b, 0)).toBe(tasks.length)
  expect(numbers['待办'] + numbers['进行'] + numbers['受阻']).toBe(tasks.length - done - wrapped)
  expect(tasks).toEqual(before)
  return pair
}

describe('A11 独立真实 Overview / 同页 completionHero / collectStats 匹配对象', () => {
  it('A11-S01/A06 原 P todo100 才是旧额外done，原wrapped legacy0不是额外项', () => {
    legal(f2)
    expect(f2.find(t => t.id === 't-0001')).toMatchObject({ title: 'F2-P', status: 'todo', progress: 100 })
    expect(f2.find(t => t.id === 't-0010')).toMatchObject({ status: 'wrapped', progress: 0 })
    const legacyIds = f2.filter(t => t.status === 'done' || t.progress >= 100).map(t => t.id)
    expect(legacyIds).toEqual(['t-0001', 't-0007', 't-0008'])
    expect(computeKPI(f2, [], [], '2026-10-21').doneRate).toBe(30)
    assertMatched(structuredClone(f2), 2, 20, 1)
    const noP100 = f2.map(t => taskWriteSchema.parse({ ...t, progress: t.id === 't-0001' ? 99 : t.progress }))
    expect(computeKPI(noP100, [], [], '2026-10-21').doneRate).toBe(20)
    assertMatched(noP100, 2, 20, 1)
    const wrapped100 = f2.map(t => taskWriteSchema.parse({ ...t, progress: t.id === 't-0010' ? 100 : t.progress }))
    expect(computeKPI(wrapped100, [], [], '2026-10-21').doneRate).toBe(40)
    assertMatched(wrapped100, 2, 20, 1)
  })

  it.each([
    { ids: ['t-0001', 't-0002', 't-0003', 't-0004', 't-0005'], done: 0, rate: 0, wrapped: 0 },
    { ids: ['t-0007', 't-0009', 't-0010'], done: 1, rate: 33, wrapped: 1 },
    { ids: ['t-0007', 't-0008', 't-0010'], done: 2, rate: 67, wrapped: 1 },
    { ids: ['t-0006', 't-0009', 't-0010'], done: 0, rate: 0, wrapped: 1 },
    { ids: [], done: 0, rate: 0, wrapped: 0 },
  ])('A11-A03 合法matched subset $ids 分母独立 $done/$rate', ({ ids, done, rate, wrapped }) => {
    const all = snapshot(structuredClone(f2))
    const subset = pick(...ids)
    const scoped = scopeSnapshot({ ...all, tasks: subset }, project.id)
    expect(scoped.tasks.map(t => t.id)).toEqual(subset.map(t => t.id))
    assertMatched(scoped.tasks, done, rate, wrapped)
    // 完整项目另断言20，不把subset统计与完整项目混比。
    assertMatched(all.tasks, 2, 20, 1)
  })

  it('A11-A04 父done与子todo各按记录计数；父legacy100不自动完成整树', () => {
    const subtree = pick('t-0001', 't-0002', 't-0003', 't-0004', 't-0005')
    assertMatched(subtree, 0, 0, 0)
    const parentDone = subtree.map(t => t.id === 't-0001' ? state(t, 'done') : t)
    assertMatched(parentDone, 1, 20, 0)
    expect(parentDone.slice(1).every(t => t.status === 'todo')).toBe(true)
    const childDone = parentDone.map(t => t.id === 't-0003' ? state(t, 'done') : t)
    assertMatched(childDone, 2, 40, 0)
    assertMatched(childDone.map(t => state(t, 'todo')), 0, 0, 0)
  })

  it('A11-A04 wrapped合法迁P并改回todo：覆盖63→75，done始终2/10、20', () => {
    const reparent = f2.map(t => t.id === 't-0010'
      ? taskWriteSchema.parse({ ...t, parentId: 't-0001', code: '1.3', order: 3 })
      : structuredClone(t))
    legal(reparent)
    const wrappedMap = deriveProgressMap(reparent).get('t-0001')!
    expect(wrappedMap.value).toBe(63)
    expect(wrappedMap.coverage).toMatchObject({ coveredLeaves: 2, totalLeaves: 3 })
    assertMatched(reparent, 2, 20, 1)
    const restored = reparent.map(t => t.id === 't-0010' ? state(t, 'todo') : t)
    const restoredMap = deriveProgressMap(restored).get('t-0001')!
    expect(restoredMap.value).toBe(75)
    expect(restoredMap.coverage).toMatchObject({ coveredLeaves: 3, totalLeaves: 4 })
    assertMatched(restored, 2, 20, 0)
  })

  it('A11-A05 同实例todo100→done0→wrapped100→todo100，零人工不改变状态计数', () => {
    let tasks = pick('t-0007', 't-0009', 't-0010')
    const pair = mount(tasks)
    for (const [status, progress, done, rate, wrapped] of [
      ['todo', 100, 1, 33, 1], ['done', 0, 2, 67, 1],
      ['wrapped', 100, 1, 33, 2], ['todo', 100, 1, 33, 1],
    ] as const) {
      tasks = tasks.map(t => t.id === 't-0009'
        ? taskWriteSchema.parse({ ...state(t, status), progress, manualProgress: 0 })
        : t)
      act(() => {
        pair.view.update(createElement(Overview, { project, tasks, milestones: [], riskIssues: [] }))
        pair.template.update(createElement(Fragment, null, WIDGET_REGISTRY.get('completionHero')!.render({
          data: snapshot(tasks), config: {}, actions: { openRecord() {}, pickProject() {} }, isEditing: false,
        })))
      })
      assertMatched(tasks, done, rate, wrapped, pair)
    }
  })

  it('A11-A03 真实query matched subset仅根级done/wrapped，分母3而非完整10', () => {
    const data = snapshot(structuredClone(f2))
    const rows = applyFilter(data, 'tasks', selectEntity(data, 'tasks'), data.tasks,
      project.id, [{ field: 'status', op: 'in', value: 'done,wrapped' }])
    expect(rows.map(row => row.id)).toEqual(['t-0007', 't-0008', 't-0010'])
    const ids = new Set(rows.map(row => row.id))
    assertMatched(data.tasks.filter(t => ids.has(t.id)), 2, 67, 1)
    assertMatched(data.tasks, 2, 20, 1)
  })

  it.each(['todo', 'in_progress', 'blocked', 'wrapped', 'done'] as const)(
    'A11-A05 合法根级全%s，legacy100及人工100不改互斥桶',
    status => {
      const tasks = pick('t-0007', 't-0008', 't-0009', 't-0010')
        .map(t => taskWriteSchema.parse({ ...state(t, status), progress: 100, manualProgress: 100 }))
      assertMatched(tasks, status === 'done' ? 4 : 0, status === 'done' ? 100 : 0, status === 'wrapped' ? 4 : 0)
    },
  )

  it('A11-A02 原F2人工30/0/null及清单100/50，同页真实模板和卡始终20', () => {
    for (const manualProgress of [30, 0, null]) {
      for (const checked of [2, 1]) {
        const tasks = f2.map(t => t.id === 't-0003'
          ? taskWriteSchema.parse({
              ...t, manualProgress, checklist: t.checklist!.map((item, i) => ({ ...item, done: i < checked })),
            })
          : structuredClone(t))
        assertMatched(tasks, 2, 20, 1)
        expect(deriveProgressMap(tasks).get('t-0001')!.value).toBe(checked === 2 ? 88 : 63)
      }
    }
  })

  it('A11-A07 malformed不送组件；原schema拒绝非法status/legacy/manual/清单', () => {
    const base = f2.find(t => t.id === 't-0009')!
    for (const patch of [
      { status: 'finished' }, { progress: 101 }, { progress: -1 }, { progress: null },
      { manualProgress: 101 }, { checklist: [{ id: 'valid', text: '合法文本', done: 'true' }] },
    ]) expect(taskRecordSchema.safeParse({ ...base, ...patch }).success).toBe(false)
    assertMatched([taskWriteSchema.parse(base)], 0, 0, 0)
  })
})
