/**
 * 独立先行红例：生产函数/TaskTable，不实现另一套排序或视图模型。
 * 由同前缀 run.mjs 冻结后执行；夹具是 schema 合法 React fixture，不冒充真实 F1 库。
 */
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import ts from 'typescript'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taskWriteSchema } from '../../packages/dsh-pm-tool/src/core/task.js'
import { flattenVisible } from '../../packages/dsh-pm-tool/src/core/task-tree.js'
import {
  BUILTIN_VIEWS, DEFAULT_VIEW_STATE, deleteTaskView, emptyTaskViewsStore,
  normalizeTaskViewState, parseTaskViewsStore, renameTaskView, resolveDefaultTaskView,
  sameTaskViewState, saveTaskView, serializeTaskViewsStore, setDefaultTaskView,
} from '../../packages/dsh-pm-tool/src/core/task-views.js'
import { loadTaskViews, persistTaskViews } from '../../packages/dsh-pm-tool/src/client/views/task-views-persist.js'
import { TaskTable } from '../../packages/dsh-pm-tool/src/client/views/tasks.js'

const noop = () => {}
const A = 'qa-a13-a'
const B = 'qa-a13-b'
const old = { query: '', chip: 'all', grouped: false, sort: 'code' } as const
const rules = [{ field: 'priority', dir: 'asc' }, { field: 'dueDate', dir: 'desc' }]
const optionalColumns = ['assignee', 'priority', 'dueDate', 'progress'] as const
const newState = (extra = {}) => ({ ...old, sorts: rules.map(r => ({ ...r })), ...extra })
const at = '2026-10-21T00:00:00.000Z'
function record(id: string, code: string, extra = {}) {
  return taskWriteSchema.parse({
    id, projectId: A, parentId: null, code, order: Number(code.split('.').at(-1)),
    title: `QA ${id}`, description: '', assignee: 'QA-A', status: 'todo',
    priority: 'P1', progress: 0, milestoneId: null, createdAt: at, updatedAt: at, ...extra,
  })
}
// 三任务同时包含同优先级不同截止、同截止不同编号，且主规则可区分。
const flat = [
  record('qa-u4-a', '2', { dueDate: '2026-11-20' }),
  record('qa-u4-b', '1', { dueDate: '2026-11-10' }),
  record('qa-u4-c', '3', { priority: 'P0', dueDate: '2026-11-20' }),
]
const ids = { a: flat[0].id, b: flat[1].id, c: flat[2].id }
const hierarchy = [
  record('qa-root-1', '1', { priority: 'P1' }),
  record('qa-child-a', '1.1', { parentId: 'qa-root-1', priority: 'P1', dueDate: '2026-11-10' }),
  record('qa-child-b', '1.2', { parentId: 'qa-root-1', priority: 'P1', dueDate: '2026-11-20' }),
  record('qa-root-2', '2', { priority: 'P0' }),
  record('qa-child-c', '2.1', { parentId: 'qa-root-2', priority: 'P2' }),
]

let mounted: ReactTestRenderer | undefined
let values: Map<string, string>
let run: ReturnType<typeof vi.fn>
const key = (id: string) => `pm-task-views:${id}`
function rawStore(state: unknown, id = 'v-a', defaultViewId: string | null = id) {
  return { version: 1 as const, defaultViewId, views: [{ id, name: id, state }] }
}
function seed(state: unknown, projectId = A, id = 'v-a', defaultViewId: string | null = id) {
  values.set(key(projectId), JSON.stringify(rawStore(state, id, defaultViewId)))
}
beforeEach(() => {
  values = new Map()
  run = vi.fn(async () => true)
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, value: string) => { values.set(k, value) },
  })
  vi.stubGlobal('window', {
    addEventListener: noop, removeEventListener: noop,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
  })
  vi.stubGlobal('document', { addEventListener: noop, removeEventListener: noop, activeElement: null, querySelector: () => null })
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 1 })
})
afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
  expect(run).not.toHaveBeenCalled()
  vi.unstubAllGlobals()
})
function props(tasks = flat, projectId = A) {
  return {
    tasks, projectId, milestones: [], onCreate: noop, onEdit: noop, onGenWbs: noop,
    onSaved: noop, run, execute: async () => '',
  }
}
function mount(tasks = flat, projectId = A) {
  if (mounted) act(() => mounted!.unmount())
  act(() => { mounted = create(createElement(TaskTable, props(tasks, projectId))) })
  return mounted!
}
function rowIds() {
  return mounted!.root.findAll(n => typeof n.type === 'string' && !!n.props['data-pm-row'])
    .map(n => n.props['data-pm-row'])
}
function text(n: ReactTestInstance): string {
  return n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
}
function headers() {
  return text(mounted!.root.findByProps({ className: 'pt-grid pt-thead' }))
}
function checkState(actual: unknown, expected: ReturnType<typeof newState>) {
  expect(actual).toMatchObject(expected)
}
function parsedNew(state = newState()) {
  return parseTaskViewsStore(JSON.stringify(rawStore(state)))
}

describe('FIXTURE 先行合法性', () => {
  it('三平面任务经真实 taskWriteSchema；ID/code/order 唯一且关系同项目', () => {
    expect(flat.map(t => taskWriteSchema.safeParse(t).success)).toEqual([true, true, true])
    expect(new Set(flat.map(t => t.id)).size).toBe(3)
    expect(new Set(flat.map(t => t.code)).size).toBe(3)
    expect(flat.every(t => t.projectId === A && t.parentId === null)).toBe(true)
    expect(flat[0].priority).toBe(flat[1].priority)
    expect(flat[0].dueDate).not.toBe(flat[1].dueDate)
    expect(flat[0].dueDate).toBe(flat[2].dueDate)
  })
  it('树夹具经真实 schema；父节点无清单、引用存在同项目、无环', () => {
    const byId = new Map(hierarchy.map(t => [t.id, t]))
    expect(hierarchy.every(t => taskWriteSchema.safeParse(t).success)).toBe(true)
    for (const t of hierarchy) {
      expect(t.checklist).toBeUndefined()
      const seen = new Set<string>()
      let cursor = t
      while (cursor.parentId) {
        expect(seen.has(cursor.id)).toBe(false)
        seen.add(cursor.id)
        expect(byId.has(cursor.parentId)).toBe(true)
        cursor = byId.get(cursor.parentId)!
        expect(cursor.projectId).toBe(t.projectId)
      }
    }
  })
})

describe('SOURCE RA-GAP-U4 接缝（不以静态通过代替 AUTO/GUI）', () => {
  const source = readFileSync(new URL('../../packages/dsh-pm-tool/src/core/task-views.ts', import.meta.url), 'utf8')
  const ast = ts.createSourceFile('task-views.ts', source, ts.ScriptTarget.Latest, true)
  const state = ast.statements.find(n => ts.isInterfaceDeclaration(n) && n.name.text === 'TaskViewState') as ts.InterfaceDeclaration
  it.each(['sorts', 'columns'])('旧四态上必须存在可选加法字段 %s', name => {
    const member = state.members.find(n => n.name?.getText(ast) === name) as ts.PropertySignature | undefined
    expect(member, `SOURCEFAIL: TaskViewState 缺 ${name}`).toBeDefined()
    expect(member!.questionToken, '新字段须可选，不强迫旧 JSON 迁移').toBeDefined()
  })
  it('真实 TaskTable 有规则/列偏好读取接线', () => {
    const client = readFileSync(new URL('../../packages/dsh-pm-tool/src/client/views/tasks.tsx', import.meta.url), 'utf8')
    const file = ts.createSourceFile('tasks.tsx', client, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const reads = new Set<string>()
    function visit(n: ts.Node) {
      if (ts.isPropertyAccessExpression(n)) reads.add(n.name.text)
      if (ts.isBindingElement(n)) reads.add(n.propertyName?.getText(file) ?? n.name.getText(file))
      ts.forEachChild(n, visit)
    }
    visit(file)
    expect(reads.has('sorts'), 'SOURCEFAIL: TaskTable 未读取有序规则').toBe(true)
    expect(reads.has('columns'), 'SOURCEFAIL: TaskTable 未读取列偏好').toBe(true)
  })
})

describe('AUTO RA-U401 真实归一化/保存接缝', () => {
  it('两有序规则不被 normalize 丢弃，四态不变、输入不变', () => {
    const input = newState({ query: ' QA ', chip: 'mine', grouped: true, sort: 'progress' })
    const before = JSON.stringify(input)
    checkState(normalizeTaskViewState(input), input)
    expect(JSON.stringify(input)).toBe(before)
  })
  it('重复字段保首条，后续不同字段保序（合法去重而非冲突方向双生效）', () => {
    const input = newState({ sorts: [rules[0], { field: 'priority', dir: 'desc' }, rules[1]] })
    expect(normalizeTaskViewState(input)).toHaveProperty('sorts', rules)
  })
  it.each([
    null, 'bad', [{ field: 'unknown', dir: 'asc' }],
    [{ field: 'priority', dir: 'sideways' }], [rules[0], null],
  ])('坏规则 %j 整链回旧单排序、不抛且四态保留', invalid => {
    const restored = normalizeTaskViewState({ ...old, sort: 'dueDate', sorts: invalid }) as any
    expect(restored.sort).toBe('dueDate')
    expect(restored.sorts ?? []).toEqual([])
  })
  it('save/update/default/serialize/parse 保 ID、默认、位置及新旧字段', () => {
    let store = saveTaskView(emptyTaskViewsStore(), { id: 'v-a', name: '甲', state: newState() as any })
    store = saveTaskView(store, { id: 'v-b', name: '乙', state: old })
    store = setDefaultTaskView(store, 'v-a')
    const next = newState({ query: 'QA', columns: { dueDate: false } })
    store = saveTaskView(store, { id: 'v-a', name: '甲更新', state: next as any })
    const restored = parseTaskViewsStore(serializeTaskViewsStore(store))
    expect(restored.views.map(v => v.id)).toEqual(['v-a', 'v-b'])
    expect(resolveDefaultTaskView(restored)?.id).toBe('v-a')
    checkState(resolveDefaultTaskView(restored)?.state, next)
  })
  it.each([
    { sorts: [...rules].reverse() },
    { sorts: [{ field: 'priority', dir: 'desc' }, rules[1]] },
    { columns: { assignee: false } },
  ])('规则次序/方向/列变化 %j 都触发 dirty', extra => {
    expect(sameTaskViewState(newState() as any, newState(extra) as any)).toBe(false)
  })
  it('rename 不丢新偏好；delete 默认只清视图，不改变原仓', () => {
    const store = parsedNew(newState({ columns: { progress: false } }))
    const renamed = renameTaskView(store, 'v-a', '新名称')
    expect(renamed.views[0].name).toBe('新名称')
    checkState(renamed.views[0].state, newState({ columns: { progress: false } }))
    expect(deleteTaskView(renamed, 'v-a').defaultViewId).toBeNull()
    expect(store.views).toHaveLength(1)
  })
})

describe('AUTO RA-U401 真实 TaskTable 行序（非自建 comparator）', () => {
  it.each([
    ['原两规则', rules, [ids.c, ids.a, ids.b]],
    ['次规则改升序', [rules[0], { field: 'dueDate', dir: 'asc' }], [ids.c, ids.b, ids.a]],
    ['主规则改降序', [{ field: 'priority', dir: 'desc' }, rules[1]], [ids.a, ids.b, ids.c]],
    ['交换规则优先序', [rules[1], rules[0]], [ids.c, ids.a, ids.b]],
  ])('%s 在默认非 grouped 表实际生效', (_name, sorts, expected) => {
    seed(newState({ sorts }))
    const before = JSON.stringify(flat)
    mount()
    expect(rowIds()).toEqual(expected)
    expect(JSON.stringify(flat)).toBe(before)
  })
  it('交换规则须在冲突值上可区分，不能只测无冲突排列', () => {
    const input = flat.map(t => taskWriteSchema.parse({ ...t, dueDate: t.id === ids.c ? '2026-11-01' : t.dueDate }))
    seed(newState())
    mount(input)
    expect(rowIds()).toEqual([ids.c, ids.a, ids.b])
    seed(newState({ sorts: [rules[1], rules[0]] }))
    mount(input)
    expect(rowIds()).toEqual([ids.a, ids.b, ids.c])
  })
  it.each(['asc', 'desc'])('空日期缺键始终最后（%s），不拿非法空字符串/null 当合法 record', dir => {
    const input = flat.map(t => {
      const next = { ...t, priority: 'P1' }
      if (t.id === ids.b) delete next.dueDate
      return taskWriteSchema.parse(next)
    })
    seed(newState({ sorts: [{ field: 'dueDate', dir }, { field: 'priority', dir: 'asc' }] }))
    mount(input)
    expect(rowIds()).toEqual([ids.a, ids.c, ids.b])
  })
  it('全并列稳定保旧同层 WBS 序，多次 render 不跳动', () => {
    const input = flat.map(t => taskWriteSchema.parse({ ...t, priority: 'P1', dueDate: '2026-11-20' }))
    seed(newState())
    mount(input)
    expect(rowIds()).toEqual([ids.b, ids.a, ids.c])
    act(() => mounted!.update(createElement(TaskTable, props([...input]))))
    expect(rowIds()).toEqual([ids.b, ids.a, ids.c])
  })
  it('新规则只排根/同父兄弟，前序树不拆父子、不改编号；折叠仍整支隐藏', () => {
    seed(newState())
    const before = JSON.stringify(hierarchy)
    mount(hierarchy)
    expect(rowIds()).toEqual(['qa-root-2', 'qa-child-c', 'qa-root-1', 'qa-child-b', 'qa-child-a'])
    const button = mounted!.root.findByProps({ 'aria-label': '折叠 QA qa-root-1' })
    act(() => button.props.onClick())
    expect(rowIds()).toEqual(['qa-root-2', 'qa-child-c', 'qa-root-1'])
    expect(JSON.stringify(hierarchy)).toBe(before)
  })
  it('grouped 模式也按新链，不能只在其中一条渲染路径生效', () => {
    seed(newState({ grouped: true }))
    mount()
    expect(rowIds()).toEqual([ids.c, ids.a, ids.b])
  })
  it('从未命名旧态实际点命名视图 apply，恢复其新规则', () => {
    seed(newState(), A, 'v-a', null)
    mount()
    expect(rowIds()).toEqual([ids.b, ids.a, ids.c])
    act(() => mounted!.root.findByProps({ 'aria-label': '切换命名视图' }).props.onClick())
    const option = mounted!.root.findAllByProps({ role: 'option' }).find(n => text(n).includes('v-a'))!
    expect(option).toBeDefined()
    act(() => option.props.onClick())
    expect(rowIds()).toEqual([ids.c, ids.a, ids.b])
  })
})

describe('AUTO RA-U402 既有列显隐/保存/隔离', () => {
  const labels = { assignee: '负责人', priority: '优先级', dueDate: '截止日期', progress: '进度' }
  it.each(optionalColumns)('隐藏 %s 的表头/实际行，保编号/标题/操作和任务原值', column => {
    seed(newState({ grouped: true, columns: { [column]: false } }))
    const before = JSON.stringify(flat)
    mount()
    expect(headers()).not.toContain(labels[column])
    expect(headers()).toContain('编号')
    expect(headers()).toContain('任务')
    expect(headers()).toContain('操作')
    const classes = { assignee: 'pt-assignee', priority: 'pt-pri-cell', dueDate: 'pt-due', progress: 'pt-prog' }
    expect(mounted!.root.findAll(n => typeof n.type === 'string'
      && String(n.props.className ?? '').split(' ').includes(classes[column]))).toHaveLength(0)
    expect(rowIds()).toHaveLength(3)
    expect(JSON.stringify(flat)).toBe(before)
    expect(mounted!.root.findAll(n => n.type === 'button' && String(n.props['aria-label'] ?? '').startsWith('复制编号'))).toHaveLength(3)
  })
  it.each(optionalColumns)('隐藏 %s 时父行/叶行不留旧占位，不能只删表头', column => {
    mount(hierarchy)
    const cells = () => mounted!.root.findAll(n => typeof n.type === 'string' && !!n.props['data-pm-row'])
      .map(n => n.children.filter(c => typeof c !== 'string' && String(c.props.className ?? '').split(' ').includes('pt-cell')).length)
    const before = cells()
    seed(newState({ columns: { [column]: false } }))
    mount(hierarchy)
    expect(cells()).toEqual(before.map(n => n - 1))
    expect(rowIds()).toHaveLength(hierarchy.length)
  })
  it('列恢复后 serialize/parse/load 往返；四态、sorts 都保留', () => {
    const hidden = newState({ query: 'QA', chip: 'mine', grouped: true, columns: { dueDate: false } })
    persistTaskViews(A, parsedNew(hidden))
    checkState(loadTaskViews(A).views[0].state, hidden)
    const restored = newState({ ...hidden, columns: { dueDate: true } })
    persistTaskViews(A, parsedNew(restored))
    checkState(loadTaskViews(A).views[0].state, restored)
    seed(restored)
    mount()
    expect(headers()).toContain('截止日期')
  })
  it('同实例 A→B无默认→A、新实例重挂载恢复 A，B 不串列/规则', () => {
    seed(newState({ columns: { assignee: false } }))
    mount()
    const bTasks = flat.map(t => taskWriteSchema.parse({ ...t, projectId: B }))
    act(() => mounted!.update(createElement(TaskTable, props(bTasks, B))))
    expect(headers()).toContain('负责人')
    expect(rowIds()).toEqual([ids.b, ids.a, ids.c])
    act(() => mounted!.update(createElement(TaskTable, props(flat, A))))
    expect(rowIds()).toEqual([ids.c, ids.a, ids.b])
    expect(headers()).not.toContain('负责人')
    mount()
    expect(rowIds()).toEqual([ids.c, ids.a, ids.b])
    expect(headers()).not.toContain('负责人')
    expect(values.has(key(B))).toBe(false)
  })
  it('A/B各有默认：真实薄层分别读回不同方向和不同列', () => {
    const aState = newState({ columns: { assignee: false } })
    const bState = newState({ sorts: [{ field: 'dueDate', dir: 'asc' }], columns: { progress: false } })
    persistTaskViews(A, parsedNew(aState))
    persistTaskViews(B, parsedNew(bState))
    checkState(loadTaskViews(A).views[0].state, aState)
    checkState(loadTaskViews(B).views[0].state, bState)
    expect([...values.keys()].sort()).toEqual([key(A), key(B)])
  })
  it('真实组件更新现有命名视图后 JSON 必须保新偏好，不重复新增', () => {
    seed(newState({ columns: { progress: false } }))
    mount()
    const input = mounted!.root.findByProps({ placeholder: '搜索任务名称 / 编号…' })
    act(() => input.props.onChange({ currentTarget: { value: 'QA' } }))
    act(() => mounted!.root.findByProps({ className: 'pt-ghost pm-save-view' }).props.onClick())
    const saved = JSON.parse(values.get(key(A))!)
    expect(saved.views).toHaveLength(1)
    expect(saved.defaultViewId).toBe('v-a')
    checkState(saved.views[0].state, newState({ query: 'QA', columns: { progress: false } }))
  })
  it.each(['missing', 'get-fails', 'set-fails'])('localStorage %s 同会话内存降级保新偏好且不串项目、不抛', mode => {
    const projectId = `qa-a13-failure-${mode}`
    const state = newState({ columns: { dueDate: false } })
    if (mode === 'missing') vi.stubGlobal('localStorage', undefined)
    else vi.stubGlobal('localStorage', {
      getItem: (k: string) => {
        if (mode === 'get-fails') throw new Error('SecurityError')
        return values.get(k) ?? null
      },
      setItem: (k: string, value: string) => {
        if (mode === 'set-fails') throw new Error('QuotaExceededError')
        values.set(k, value)
      },
    })
    expect(() => persistTaskViews(projectId, parsedNew(state))).not.toThrow()
    checkState(loadTaskViews(projectId).views[0]?.state, state)
    expect(loadTaskViews(`${projectId}-other`).views).toEqual([])
  })
})

describe('BASE 旧四态/WBS/合法兜底保持（不是 U4 PASS）', () => {
  it('缺新键的旧 v1 和六内置视图精确保原四态', () => {
    expect(DEFAULT_VIEW_STATE).toEqual(old)
    expect(normalizeTaskViewState(old)).toEqual(old)
    expect(BUILTIN_VIEWS).toHaveLength(6)
    expect(BUILTIN_VIEWS.every(v => Object.keys(v.state).sort().join(',') === 'chip,grouped,query,sort')).toBe(true)
    expect(parseTaskViewsStore(JSON.stringify(rawStore(old))).views[0].state).toEqual(old)
  })
  it('无新规则或空数组同旧排序；坏列逐键兜底全显，不开放任意列', () => {
    const normalized = normalizeTaskViewState({ ...old, sorts: [], columns: { assignee: 'hide', arbitrary: false } }) as any
    expect(normalized.sorts ?? []).toEqual([])
    expect(normalized.columns?.assignee ?? true).toBe(true)
    expect(normalized.columns?.arbitrary).toBeUndefined()
    seed(normalized)
    mount()
    expect(rowIds()).toEqual([ids.b, ids.a, ids.c])
    expect(headers()).toContain('负责人')
  })
  it('等效全显/无规则与旧状态相等，不能让旧视图无修改也 dirty', () => {
    expect(sameTaskViewState(old, { ...old, sorts: [], columns: Object.fromEntries(optionalColumns.map(k => [k, true])) } as any)).toBe(true)
  })
  it('旧 WBS 前序/同层 numeric/折叠保留，不把数组全局排序当树', () => {
    expect(flattenVisible([...hierarchy].reverse()).map(r => [r.task.id, r.depth])).toEqual([
      ['qa-root-1', 0], ['qa-child-a', 1], ['qa-child-b', 1], ['qa-root-2', 0], ['qa-child-c', 1],
    ])
    expect(flattenVisible(hierarchy, new Set(['qa-root-1'])).map(r => r.task.id))
      .toEqual(['qa-root-1', 'qa-root-2', 'qa-child-c'])
  })
  it.each([
    ['code', false, [ids.b, ids.a, ids.c]],
    ['dueDate', true, [ids.b, ids.a, ids.c]],
    ['priority', true, [ids.c, ids.a, ids.b]],
  ])('旧快捷 %s/grouped=%s 保旧方向与实际路径', (sort, grouped, expected) => {
    seed({ ...old, sort, grouped })
    mount()
    expect(rowIds()).toEqual(expected)
  })
  it('旧 progress 使用 display 降序（人工优先、缺值最后），不改用 raw progress', () => {
    const input = [
      record('qa-progress-a', '1', { progress: 99, manualProgress: 10 }),
      record('qa-progress-b', '2', { progress: 1, manualProgress: 80 }),
      record('qa-progress-c', '3', { progress: 100 }),
    ]
    seed({ ...old, sort: 'progress', grouped: true })
    mount(input)
    expect(rowIds()).toEqual(['qa-progress-b', 'qa-progress-a', 'qa-progress-c'])
  })
  it('localStorage 属性访问本身抛错也不抛给 UI，旧会话可回读', () => {
    const projectId = 'qa-a13-property-denied'
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('SecurityError') } })
    const store = parseTaskViewsStore(JSON.stringify(rawStore(old)))
    expect(() => persistTaskViews(projectId, store)).not.toThrow()
    expect(loadTaskViews(projectId).views[0].state).toEqual(old)
  })
  it('仅 setItem 失败/getItem 返回 null：旧态缓存也应可回读（独立隔离旧缺陷）', () => {
    const projectId = 'qa-a13-legacy-set-only'
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError') },
    })
    const store = parseTaskViewsStore(JSON.stringify(rawStore(old)))
    expect(() => persistTaskViews(projectId, store)).not.toThrow()
    expect(loadTaskViews(projectId).views[0]?.state).toEqual(old)
  })
})
