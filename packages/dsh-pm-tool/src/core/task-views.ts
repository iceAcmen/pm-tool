/**
 * P2-5 任务表命名视图纯模型（无 I/O、无随机、无墙钟、零写盘）。
 *
 * 只表达现有四态：搜索词 query、快捷 chip、按状态分组 grouped、排序 sort。
 * 存储由 client 薄封装经 localStorage 完成（键 pm-task-views:<projectId>，按项目隔离）；
 * 本模块负责类型、归一化兜底、序列化与保存/更新/重命名/删除/设默认等纯变换，损坏数据
 * 与非法字段一律回落默认，绝不抛异常、绝不静默改写后假装合法。
 *
 * 内置视图（BUILTIN_VIEWS）不落盘、不可重命名/删除，但可设为默认；自定义视图存于 store.views。
 */

/** 快捷过滤 chip（与 tasks.tsx 既有口径一致，不新增谓词）。 */
export type TaskViewChip = 'all' | 'in_progress' | 'done' | 'overdue' | 'mine'

/** 排序键（与 tasks.tsx 既有口径一致）。 */
export type TaskViewSort = 'code' | 'dueDate' | 'priority' | 'progress'

/** 一个命名视图保存的整套表格状态。 */
export interface TaskViewState {
  /** 搜索词（原始字符串，含空白；展示时再 trim）。 */
  query: string
  chip: TaskViewChip
  grouped: boolean
  sort: TaskViewSort
}

/** 命名视图（builtin 为系统内置，只读）。 */
export interface SavedTaskView {
  id: string
  name: string
  state: TaskViewState
  builtin?: boolean
}

/** 持久化到 localStorage 的自定义视图仓（内置视图不落盘）。 */
export interface TaskViewsStore {
  version: 1
  defaultViewId: string | null
  views: SavedTaskView[]
}

export const VIEW_CHIP_OPTIONS: { key: TaskViewChip; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'in_progress', label: '进行中' },
  { key: 'done', label: '已完成' },
  { key: 'overdue', label: '已逾期' },
  { key: 'mine', label: '我负责的' },
]

export const VIEW_SORT_OPTIONS: { value: TaskViewSort; label: string }[] = [
  { value: 'code', label: '按 WBS 编号' },
  { value: 'dueDate', label: '按截止日期' },
  { value: 'priority', label: '按优先级' },
  { value: 'progress', label: '按进度' },
]

const CHIP_KEYS = new Set(VIEW_CHIP_OPTIONS.map(c => c.key))
const SORT_KEYS = new Set(VIEW_SORT_OPTIONS.map(s => s.value))

/** 默认四态：与表格初始 useState 现值逐值相等（默认等价，老用户零迁移）。 */
export const DEFAULT_VIEW_STATE: TaskViewState = {
  query: '',
  chip: 'all',
  grouped: false,
  sort: 'code',
}

/** 内置视图：仅用现有四态能表达；锁定、不可删改，可设默认。 */
export const BUILTIN_VIEWS: SavedTaskView[] = [
  { id: 'builtin-all', name: '全部任务', builtin: true, state: { query: '', chip: 'all', grouped: false, sort: 'code' } },
  { id: 'builtin-mine', name: '我的任务', builtin: true, state: { query: '', chip: 'mine', grouped: false, sort: 'code' } },
  { id: 'builtin-in_progress', name: '进行中', builtin: true, state: { query: '', chip: 'in_progress', grouped: false, sort: 'code' } },
  { id: 'builtin-overdue', name: '已逾期', builtin: true, state: { query: '', chip: 'overdue', grouped: false, sort: 'code' } },
]

const BUILTIN_IDS = new Set(BUILTIN_VIEWS.map(v => v.id))

export function isBuiltinView(id: string): boolean {
  return BUILTIN_IDS.has(id)
}

export function emptyTaskViewsStore(): TaskViewsStore {
  return { version: 1, defaultViewId: null, views: [] }
}

/** 把任意未知 JSON 收窄成合法 TaskViewState：非法 chip/sort 回落默认，非字符串 query 置空。 */
export function normalizeTaskViewState(raw: unknown): TaskViewState {
  const state: TaskViewState = { ...DEFAULT_VIEW_STATE }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return state
  const obj = raw as Record<string, unknown>
  if (typeof obj.query === 'string') state.query = obj.query
  if (typeof obj.chip === 'string' && CHIP_KEYS.has(obj.chip as TaskViewChip)) {
    state.chip = obj.chip as TaskViewChip
  }
  if (typeof obj.grouped === 'boolean') state.grouped = obj.grouped
  if (typeof obj.sort === 'string' && SORT_KEYS.has(obj.sort as TaskViewSort)) {
    state.sort = obj.sort as TaskViewSort
  }
  return state
}

function normalizeView(raw: unknown): SavedTaskView | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.id !== 'string' || !obj.id) return null
  if (isBuiltinView(obj.id)) return null // 内置视图不落盘，杜绝伪造/覆盖
  const name = typeof obj.name === 'string' ? obj.name.trim() : ''
  return {
    id: obj.id,
    name: name || '未命名视图',
    state: normalizeTaskViewState(obj.state),
  }
}

/**
 * 把任意未知 JSON（含损坏 JSON 文本由调用方先 parse；此处收窄对象）归一化为合法仓：
 * - 非对象 → 空仓；
 * - views 逐个校验，非法条目丢弃；重复 id 保留首条；
 * - defaultViewId 必须指向仓内自定义视图或内置视图，否则置 null。
 * 纯函数、确定性、不抛异常。
 */
export function normalizeTaskViewsStore(raw: unknown): TaskViewsStore {
  const store = emptyTaskViewsStore()
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return store
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.views)) {
    const seen = new Set<string>()
    for (const item of obj.views) {
      const v = normalizeView(item)
      if (!v || seen.has(v.id)) continue
      seen.add(v.id)
      store.views.push(v)
    }
  }
  if (typeof obj.defaultViewId === 'string' && obj.defaultViewId) {
    const known = isBuiltinView(obj.defaultViewId) || store.views.some(v => v.id === obj.defaultViewId)
    if (known) store.defaultViewId = obj.defaultViewId
  }
  return store
}

/** 解析损坏/非法 JSON 文本为合法仓（SyntaxError/非字符串 → 空仓，绝不抛）。 */
export function parseTaskViewsStore(jsonText: unknown): TaskViewsStore {
  if (typeof jsonText !== 'string' || !jsonText.trim()) return emptyTaskViewsStore()
  try {
    return normalizeTaskViewsStore(JSON.parse(jsonText))
  } catch {
    return emptyTaskViewsStore()
  }
}

/** 序列化为存储文本（确定性、紧凑）。 */
export function serializeTaskViewsStore(store: TaskViewsStore): string {
  return JSON.stringify({ version: 1, defaultViewId: store.defaultViewId, views: store.views })
}

/** 按项目解析 localStorage 键：pm-task-views:<projectId>，项目间互不串视图。 */
export function taskViewsStorageKey(projectId: string): string {
  return `pm-task-views:${projectId.trim()}`
}

/** 内置 + 自定义合并列表（内置在前，自定义在后），供切换器/管理界面渲染。 */
export function listAllViews(store: TaskViewsStore): SavedTaskView[] {
  return [...BUILTIN_VIEWS, ...store.views]
}

/** 按 id 查找视图（先内置后自定义）；找不到返回 undefined。 */
export function findTaskView(store: TaskViewsStore, id: string | null | undefined): SavedTaskView | undefined {
  if (!id) return undefined
  return BUILTIN_VIEWS.find(v => v.id === id) ?? store.views.find(v => v.id === id)
}

/** 两态逐值相等（确定性比较，供「是否有改动/更新而非另存」判断）。 */
export function sameTaskViewState(a: TaskViewState, b: TaskViewState): boolean {
  return a.query === b.query && a.chip === b.chip && a.grouped === b.grouped && a.sort === b.sort
}

/**
 * 保存（新增或按 id 更新）自定义视图：
 * - 内置 id 拒绝写入（原样返回仓）；
 * - 名称空白回落「未命名视图」；
 * - 更新同 id 条目（保留位置），新增追加到末尾。
 */
export function saveTaskView(store: TaskViewsStore, view: { id: string, name: string, state: TaskViewState }): TaskViewsStore {
  if (isBuiltinView(view.id)) return store
  const name = view.name.trim() || '未命名视图'
  const next: TaskViewsStore = { ...store, views: store.views.map(v => ({ ...v })) }
  const idx = next.views.findIndex(v => v.id === view.id)
  const record: SavedTaskView = { id: view.id, name, state: normalizeTaskViewState(view.state) }
  if (idx >= 0) next.views[idx] = record
  else next.views.push(record)
  return next
}

/** 重命名自定义视图：内置/不存在/空白名 → 原样返回。 */
export function renameTaskView(store: TaskViewsStore, id: string, name: string): TaskViewsStore {
  if (isBuiltinView(id)) return store
  const trimmed = name.trim()
  if (!trimmed) return store
  const idx = store.views.findIndex(v => v.id === id)
  if (idx < 0) return store
  const views = store.views.map(v => ({ ...v }))
  views[idx] = { ...views[idx], name: trimmed }
  return { ...store, views }
}

/** 删除自定义视图：内置/不存在 → 原样返回；若删的是默认视图则清空默认标记。 */
export function deleteTaskView(store: TaskViewsStore, id: string): TaskViewsStore {
  if (isBuiltinView(id)) return store
  if (!store.views.some(v => v.id === id)) return store
  const views = store.views.filter(v => v.id !== id)
  return {
    ...store,
    views,
    defaultViewId: store.defaultViewId === id ? null : store.defaultViewId,
  }
}

/** 设为默认：自定义仓内条目或内置视图均可；未知 id → 原样返回。 */
export function setDefaultTaskView(store: TaskViewsStore, id: string): TaskViewsStore {
  const known = isBuiltinView(id) || store.views.some(v => v.id === id)
  if (!known) return store
  return { ...store, defaultViewId: id }
}

/** 解析当前默认视图对象（含内置）；无默认或失效 → undefined。 */
export function resolveDefaultTaskView(store: TaskViewsStore): SavedTaskView | undefined {
  return findTaskView(store, store.defaultViewId)
}

/** 状态人类可读摘要（切换器/管理列表副文案），纯函数。 */
export function describeTaskViewState(state: TaskViewState): string {
  const chip = VIEW_CHIP_OPTIONS.find(c => c.key === state.chip)?.label ?? state.chip
  const sort = VIEW_SORT_OPTIONS.find(s => s.value === state.sort)?.label ?? state.sort
  const parts: string[] = [chip, sort]
  if (state.grouped) parts.push('按状态分组')
  if (state.query.trim()) parts.push(`搜索「${state.query.trim()}」`)
  return parts.join(' · ')
}
