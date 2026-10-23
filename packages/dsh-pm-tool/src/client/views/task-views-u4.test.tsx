import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taskWriteSchema } from '../../core/task.js'
import { parseTaskViewsStore } from '../../core/task-views.js'
import { loadTaskViews, persistTaskViews } from './task-views-persist.js'
import { TaskTable } from './tasks.js'

const projectId = 'qa-u4-product'
const at = '2026-10-22T00:00:00.000Z'
const tasks = [
  taskWriteSchema.parse({
    id: 'u4-a', projectId, parentId: null, code: '2', order: 2,
    title: '任务 A', description: '', assignee: '甲', status: 'todo',
    priority: 'P1', progress: 20, dueDate: '2026-11-20',
    milestoneId: null, createdAt: at, updatedAt: at,
  }),
  taskWriteSchema.parse({
    id: 'u4-b', projectId, parentId: null, code: '1', order: 1,
    title: '任务 B', description: '', assignee: '乙', status: 'todo',
    priority: 'P1', progress: 40, dueDate: '2026-11-10',
    milestoneId: null, createdAt: at, updatedAt: at,
  }),
  taskWriteSchema.parse({
    id: 'u4-c', projectId, parentId: null, code: '3', order: 3,
    title: '任务 C', description: '', assignee: '丙', status: 'todo',
    priority: 'P0', progress: 60, dueDate: '2026-11-20',
    milestoneId: null, createdAt: at, updatedAt: at,
  }),
]

let renderer: ReactTestRenderer | undefined
let values: Map<string, string>

function seed(state: unknown) {
  values.set(`pm-task-views:${projectId}`, JSON.stringify({
    version: 1,
    defaultViewId: 'u4-view',
    views: [{ id: 'u4-view', name: 'U4', state }],
  }))
}

function mount() {
  act(() => {
    renderer = create(createElement(TaskTable, {
      tasks,
      projectId,
      milestones: [],
      onCreate: () => {},
      onEdit: () => {},
      onGenWbs: () => {},
      onSaved: () => {},
      run: async () => true,
      execute: async () => '',
    }))
  })
  return renderer!
}

beforeEach(() => {
  values = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
  vi.stubGlobal('window', {
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  })
  vi.stubGlobal('document', {
    addEventListener: () => {},
    removeEventListener: () => {},
    activeElement: null,
    querySelector: () => null,
  })
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => {
    fn()
    return 1
  })
})

afterEach(() => {
  if (renderer) act(() => renderer!.unmount())
  renderer = undefined
  vi.unstubAllGlobals()
})

describe('U4 TaskTable 真实接线', () => {
  it('默认视图的 priority asc / dueDate desc 在树平面生效', () => {
    seed({
      query: '', chip: 'all', grouped: false, sort: 'code',
      sorts: [
        { field: 'priority', dir: 'asc' },
        { field: 'dueDate', dir: 'desc' },
      ],
    })
    const root = mount().root
    expect(root.findAll(node => !!node.props['data-pm-row']).map(node => node.props['data-pm-row']))
      .toEqual(['u4-c', 'u4-a', 'u4-b'])
  })

  it('隐藏截止日期时表头与每行都移除该列，编号和标题仍保留', () => {
    seed({
      query: '', chip: 'all', grouped: true, sort: 'code',
      columns: { dueDate: false },
    })
    const root = mount().root
    const header = root.findByProps({ className: 'pt-grid pt-thead' })
    expect(header.findAll(node => node.children.includes('截止日期'))).toHaveLength(0)
    expect(header.findAll(node => node.children.includes('编号'))).toHaveLength(1)
    expect(root.findAll(node => String(node.props.className ?? '').split(' ').includes('pt-due'))).toHaveLength(0)
    expect(root.findAll(node => String(node.props.className ?? '').split(' ').includes('pt-code'))).toHaveLength(3)
  })

  it('视图设置控件可配置两规则与列显隐，并更新同一命名视图', () => {
    seed({ query: '', chip: 'all', grouped: false, sort: 'code' })
    const root = mount().root
    const add = root.findByProps({ 'aria-label': '添加排序规则' })
    act(() => add.props.onClick())
    act(() => add.props.onClick())
    act(() => root.findByProps({ 'aria-label': '排序规则 1 字段' }).props.onChange({
      currentTarget: { value: 'priority' },
    }))
    act(() => root.findByProps({ 'aria-label': '排序规则 2 方向' }).props.onChange({
      currentTarget: { value: 'desc' },
    }))
    const dueToggle = root.findAllByType('input').find(node =>
      node.props.type === 'checkbox'
      && node.parent?.findAll(child => child.children.includes('截止日期')).length)
    expect(dueToggle).toBeDefined()
    act(() => dueToggle!.props.onChange({ currentTarget: { checked: false } }))
    act(() => root.findByProps({ className: 'pt-ghost pm-save-view' }).props.onClick())

    const saved = JSON.parse(values.get(`pm-task-views:${projectId}`)!)
    expect(saved.views).toHaveLength(1)
    expect(saved.views[0].id).toBe('u4-view')
    expect(saved.views[0].state.sorts).toEqual([
      { field: 'priority', dir: 'asc' },
      { field: 'dueDate', dir: 'desc' },
    ])
    expect(saved.views[0].state.columns).toMatchObject({ dueDate: false })
  })

  it('setItem 失败后同会话回读内存态，不被 getItem null 覆盖', () => {
    const failureProject = 'qa-u4-product-set-fails'
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    })
    const store = parseTaskViewsStore(JSON.stringify({
      version: 1,
      defaultViewId: 'saved',
      views: [{
        id: 'saved',
        name: '保存失败仍可用',
        state: {
          query: '', chip: 'all', grouped: false, sort: 'code',
          sorts: [{ field: 'priority', dir: 'asc' }],
          columns: { progress: false },
        },
      }],
    }))
    persistTaskViews(failureProject, store)
    expect(loadTaskViews(failureProject)).toEqual(store)
  })
})
