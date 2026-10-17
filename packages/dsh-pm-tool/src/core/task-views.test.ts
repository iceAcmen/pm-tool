import { describe, it, expect } from 'vitest'
import {
  BUILTIN_VIEWS,
  DEFAULT_VIEW_STATE,
  VIEW_CHIP_OPTIONS,
  describeTaskViewState,
  deleteTaskView,
  emptyTaskViewsStore,
  findTaskView,
  listAllViews,
  normalizeTaskViewState,
  normalizeTaskViewsStore,
  parseTaskViewsStore,
  renameTaskView,
  resolveDefaultTaskView,
  sameTaskViewState,
  saveTaskView,
  serializeTaskViewsStore,
  setDefaultTaskView,
  taskViewsStorageKey,
} from './task-views.js'

// P2-5 单元层：命名视图纯逻辑（默认值 / 归一化兜底 / 增删改 / 设默认 / 往返一致，零 I/O 零随机）。

describe('DEFAULT_VIEW_STATE 锁定表格初始现值', () => {
  it('逐值等于 tasks.tsx useState 初始（默认等价基线）', () => {
    expect(DEFAULT_VIEW_STATE).toEqual({ query: '', chip: 'all', grouped: false, sort: 'code' })
  })
})

describe('BUILTIN_VIEWS 内置视图', () => {
  it('提供全部任务 / 我的任务 / 进行中 / 已逾期 / 本周到期 / 风险视图，且只用现有四态', () => {
    expect(BUILTIN_VIEWS.map(v => v.id)).toEqual([
      'builtin-all', 'builtin-mine', 'builtin-in_progress', 'builtin-overdue',
      'builtin-due-week', 'builtin-risk',
    ])
    for (const v of BUILTIN_VIEWS) {
      expect(v.builtin).toBe(true)
      expect(v.state.query).toBe('')
      expect(v.state.grouped).toBe(false)
    }
  })

  it('本周到期 / 风险视图内置条目：id/name/chip/sort 正确', () => {
    const due = BUILTIN_VIEWS.find(v => v.id === 'builtin-due-week')
    const risk = BUILTIN_VIEWS.find(v => v.id === 'builtin-risk')
    expect(due).toBeDefined()
    expect(due!.name).toBe('本周到期')
    expect(due!.state).toEqual({ query: '', chip: 'due_week', grouped: false, sort: 'dueDate' })
    expect(risk).toBeDefined()
    expect(risk!.name).toBe('风险视图')
    expect(risk!.state).toEqual({ query: '', chip: 'risk', grouped: false, sort: 'dueDate' })
  })

  it('顶部快捷栏 VIEW_CHIP_OPTIONS 不含 due_week / risk（新视图仅由切换器选中）', () => {
    expect(VIEW_CHIP_OPTIONS.map(o => o.key)).toEqual([
      'all', 'in_progress', 'done', 'overdue', 'mine',
    ])
  })
})

describe('normalizeTaskViewState 损坏/非法兜底', () => {
  it('非对象 → 全默认，不抛', () => {
    for (const raw of [undefined, null, 123, 'str', [], true]) {
      expect(normalizeTaskViewState(raw)).toEqual(DEFAULT_VIEW_STATE)
    }
  })

  it('非法 chip / sort 回落默认，非字符串 query 置空，非布尔 grouped 回落', () => {
    const s = normalizeTaskViewState({
      query: 42,
      chip: 'not-a-chip',
      sort: 'nonsense',
      grouped: 'yes',
    })
    expect(s).toEqual(DEFAULT_VIEW_STATE)
  })

  it('合法字段逐值采纳，未知键忽略', () => {
    const s = normalizeTaskViewState({
      query: '登录页', chip: 'mine', grouped: true, sort: 'priority', unknown: 1,
    })
    expect(s).toEqual({ query: '登录页', chip: 'mine', grouped: true, sort: 'priority' })
  })
})

describe('parseTaskViewsStore / normalizeTaskViewsStore 损坏仓兜底', () => {
  it('损坏 JSON 文本 / 非字符串 / 空串 → 空仓，绝不抛', () => {
    for (const raw of [undefined, null, '', 'not-json{', 123, []]) {
      expect(parseTaskViewsStore(raw)).toEqual(emptyTaskViewsStore())
    }
  })

  it('非对象仓 → 空仓', () => {
    expect(normalizeTaskViewsStore([1, 2])).toEqual(emptyTaskViewsStore())
    expect(normalizeTaskViewsStore('str')).toEqual(emptyTaskViewsStore())
  })

  it('views 逐条校验：非法条目丢弃、重复 id 保留首条、伪造内置 id 不落盘', () => {
    const store = normalizeTaskViewsStore({
      defaultViewId: 'v1',
      views: [
        { id: 'v1', name: '视图一', state: { chip: 'mine', sort: 'code' } },
        { id: 'v1', name: '重复应被丢弃', state: {} },
        { id: 'builtin-all', name: '伪造内置', state: {} },
        { name: '缺 id', state: {} },
        null,
        'x',
      ],
    })
    expect(store.views).toHaveLength(1)
    expect(store.views[0]).toMatchObject({ id: 'v1', name: '视图一' })
    expect(store.defaultViewId).toBe('v1')
  })

  it('defaultViewId 指向未知视图 → 置 null；指向内置视图 → 保留', () => {
    expect(normalizeTaskViewsStore({ defaultViewId: 'ghost' }).defaultViewId).toBeNull()
    expect(normalizeTaskViewsStore({ defaultViewId: 'builtin-mine' }).defaultViewId).toBe('builtin-mine')
  })
})

describe('saveTaskView 新增 / 更新', () => {
  it('新增追加；同 id 更新（保留位置、覆盖名称与状态）', () => {
    let store = emptyTaskViewsStore()
    store = saveTaskView(store, { id: 'a', name: '甲', state: { query: '', chip: 'all', grouped: false, sort: 'code' } })
    store = saveTaskView(store, { id: 'b', name: '乙', state: { query: 'x', chip: 'overdue', grouped: true, sort: 'dueDate' } })
    expect(store.views.map(v => v.id)).toEqual(['a', 'b'])
    store = saveTaskView(store, { id: 'a', name: '甲改', state: { query: 'q', chip: 'mine', grouped: false, sort: 'progress' } })
    expect(store.views.map(v => v.id)).toEqual(['a', 'b'])
    expect(store.views[0]).toMatchObject({ name: '甲改', state: { query: 'q', chip: 'mine', grouped: false, sort: 'progress' } })
  })

  it('内置 id 拒绝写入；空白名回落「未命名视图」；非法状态归一化', () => {
    const store = saveTaskView(emptyTaskViewsStore(), {
      id: 'builtin-all', name: '覆盖内置', state: { chip: 'bogus', sort: 'also-bogus' },
    })
    expect(store.views).toHaveLength(0)
    const next = saveTaskView(emptyTaskViewsStore(), { id: 'c', name: '   ', state: { chip: 'bogus' } })
    expect(next.views[0].name).toBe('未命名视图')
    expect(next.views[0].state.chip).toBe('all')
  })
})

describe('renameTaskView', () => {
  it('自定义视图重命名；内置 / 未知 / 空白名 → 原样返回', () => {
    let store = saveTaskView(emptyTaskViewsStore(), { id: 'a', name: '旧名', state: DEFAULT_VIEW_STATE })
    store = renameTaskView(store, 'a', '新名')
    expect(store.views[0].name).toBe('新名')
    expect(renameTaskView(store, 'builtin-all', 'x').views[0].name).toBe('新名')
    expect(renameTaskView(store, 'ghost', 'x').views[0].name).toBe('新名')
    expect(renameTaskView(store, 'a', '  ').views[0].name).toBe('新名')
  })
})

describe('deleteTaskView', () => {
  it('删除自定义视图；内置 / 未知 → 原样返回', () => {
    let store = emptyTaskViewsStore()
    store = saveTaskView(store, { id: 'a', name: '甲', state: DEFAULT_VIEW_STATE })
    store = saveTaskView(store, { id: 'b', name: '乙', state: DEFAULT_VIEW_STATE })
    expect(deleteTaskView(store, 'builtin-all').views).toHaveLength(2)
    expect(deleteTaskView(store, 'ghost').views).toHaveLength(2)
    store = deleteTaskView(store, 'a')
    expect(store.views.map(v => v.id)).toEqual(['b'])
  })

  it('删除默认视图时清空默认标记', () => {
    let store = saveTaskView(emptyTaskViewsStore(), { id: 'a', name: '甲', state: DEFAULT_VIEW_STATE })
    store = setDefaultTaskView(store, 'a')
    expect(store.defaultViewId).toBe('a')
    store = deleteTaskView(store, 'a')
    expect(store.defaultViewId).toBeNull()
  })
})

describe('setDefaultTaskView / resolveDefaultTaskView', () => {
  it('自定义视图与内置视图均可设默认；未知 id 原样返回', () => {
    let store = saveTaskView(emptyTaskViewsStore(), { id: 'a', name: '甲', state: DEFAULT_VIEW_STATE })
    store = setDefaultTaskView(store, 'a')
    expect(resolveDefaultTaskView(store)?.id).toBe('a')
    store = setDefaultTaskView(store, 'builtin-overdue')
    expect(resolveDefaultTaskView(store)?.id).toBe('builtin-overdue')
    expect(setDefaultTaskView(store, 'ghost').defaultViewId).toBe('builtin-overdue')
  })

  it('默认失效（被删/被篡改）时 resolve 返回 undefined', () => {
    const store = normalizeTaskViewsStore({ defaultViewId: 'ghost', views: [] })
    expect(resolveDefaultTaskView(store)).toBeUndefined()
  })
})

describe('状态往返一致与项目隔离', () => {
  it('serialize → parse 后四态逐值相等', () => {
    const original = saveTaskView(emptyTaskViewsStore(), {
      id: 'r1', name: '往返', state: { query: '登录 报错', chip: 'in_progress', grouped: true, sort: 'priority' },
    })
    original.defaultViewId = 'r1'
    const restored = parseTaskViewsStore(serializeTaskViewsStore(original))
    expect(sameTaskViewState(restored.views[0].state, original.views[0].state)).toBe(true)
    expect(restored.defaultViewId).toBe('r1')
  })

  it('sameTaskViewState 逐值比较：相等 true，任一不同 false', () => {
    const a = { query: 'q', chip: 'mine', grouped: true, sort: 'dueDate' }
    expect(sameTaskViewState(a, { ...a })).toBe(true)
    expect(sameTaskViewState(a, { ...a, query: 'q2' })).toBe(false)
    expect(sameTaskViewState(a, { ...a, chip: 'all' })).toBe(false)
    expect(sameTaskViewState(a, { ...a, grouped: false })).toBe(false)
    expect(sameTaskViewState(a, { ...a, sort: 'code' })).toBe(false)
  })

  it('存储键按项目隔离：不同 projectId 不同键，互不串视图', () => {
    expect(taskViewsStorageKey('p-0001')).toBe('pm-task-views:p-0001')
    expect(taskViewsStorageKey('p-0002')).not.toBe(taskViewsStorageKey('p-0001'))
    expect(taskViewsStorageKey('  p-9  ')).toBe('pm-task-views:p-9')
  })
})

describe('listAllViews / findTaskView / describeTaskViewState', () => {
  it('内置在前、自定义在后；findTaskView 先内置后自定义', () => {
    let store = saveTaskView(emptyTaskViewsStore(), { id: 'c1', name: '我的', state: DEFAULT_VIEW_STATE })
    const all = listAllViews(store)
    const builtinCount = BUILTIN_VIEWS.length
    expect(all.slice(0, builtinCount).map(v => v.builtin)).toEqual(Array(builtinCount).fill(true))
    expect(all[builtinCount]).toMatchObject({ id: 'c1', name: '我的' })
    expect(findTaskView(store, 'builtin-mine')?.name).toBe('我的任务')
    expect(findTaskView(store, 'c1')?.name).toBe('我的')
    expect(findTaskView(store, 'nope')).toBeUndefined()
    expect(findTaskView(store, null)).toBeUndefined()
  })

  it('摘要包含 chip / 排序 / 分组 / 搜索文案', () => {
    const text = describeTaskViewState({ query: '登录', chip: 'mine', grouped: true, sort: 'priority' })
    expect(text).toContain('我负责的')
    expect(text).toContain('按优先级')
    expect(text).toContain('按状态分组')
    expect(text).toContain('登录')
  })
})

describe('新增 due_week / risk chip 归一化与中文摘要', () => {
  it('normalizeTaskViewState 对 chip:due_week / risk 原样保留，不回落默认', () => {
    expect(normalizeTaskViewState({ chip: 'due_week' }).chip).toBe('due_week')
    expect(normalizeTaskViewState({ chip: 'risk' }).chip).toBe('risk')
    expect(normalizeTaskViewState({ chip: 'due_week', sort: 'dueDate' }).sort).toBe('dueDate')
    expect(normalizeTaskViewState({ chip: 'risk', sort: 'dueDate' }).sort).toBe('dueDate')
  })

  it('describeTaskViewState 对新 chip 输出中文标签，不显示原始 key', () => {
    expect(describeTaskViewState({ query: '', chip: 'due_week', grouped: false, sort: 'dueDate' })).toContain('本周到期')
    expect(describeTaskViewState({ query: '', chip: 'risk', grouped: false, sort: 'dueDate' })).toContain('风险视图')
  })
})
