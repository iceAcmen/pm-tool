/**
 * P2-5 命名视图 localStorage 薄封装（client 侧，唯一触碰存储的位置）。
 *
 * - 键按项目隔离：pm-task-views:<projectId>，切换项目互不串视图；
 * - 全部读写 try/catch：localStorage 缺失/抛错（隐私模式/配额禁用）时降级为模块级内存态，
 *   本次会话内仍可用，绝不向 UI 抛错；
 * - 收窄/兜底一律委托 core/task-views 纯函数，本层不写业务规则。
 */
import {
  emptyTaskViewsStore,
  normalizeTaskViewsStore,
  parseTaskViewsStore,
  serializeTaskViewsStore,
  taskViewsStorageKey,
  type TaskViewsStore,
} from '../../core/task-views.js'

/** localStorage 不可用时的会话内内存仓（键 = 存储键）。 */
const memory = new Map<string, TaskViewsStore>()
/** 写入失败的键继续以会话内存为准，避免后续 getItem(null) 把刚保存的状态清空。 */
const memoryOnly = new Set<string>()

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

/** 读取某项目的自定义视图仓；损坏/缺失/存储不可用 → 空仓，绝不抛。 */
export function loadTaskViews(projectId: string): TaskViewsStore {
  const key = taskViewsStorageKey(projectId)
  if (memoryOnly.has(key)) {
    const cached = memory.get(key)
    return cached ? normalizeTaskViewsStore(cached) : emptyTaskViewsStore()
  }
  if (!hasLocalStorage()) {
    const cached = memory.get(key)
    return cached ? normalizeTaskViewsStore(cached) : emptyTaskViewsStore()
  }
  try {
    const raw = localStorage.getItem(key)
    const store = parseTaskViewsStore(raw)
    memory.set(key, store)
    return store
  } catch {
    const cached = memory.get(key)
    return cached ? normalizeTaskViewsStore(cached) : emptyTaskViewsStore()
  }
}

/** 写回某项目的自定义视图仓；失败降级内存态，绝不抛。 */
export function persistTaskViews(projectId: string, store: TaskViewsStore): void {
  const key = taskViewsStorageKey(projectId)
  memory.set(key, normalizeTaskViewsStore(store))
  if (!hasLocalStorage()) return
  try {
    localStorage.setItem(key, serializeTaskViewsStore(store))
    memoryOnly.delete(key)
  } catch {
    /* 隐私模式/配额满：保留内存态，不阻断操作 */
    memoryOnly.add(key)
  }
}

/** 生成自定义视图 id（仅 client 使用；core 纯模块不引入随机）。 */
export function newCustomViewId(): string {
  const rand = Math.random().toString(36).slice(2, 7)
  return `vw-${Date.now().toString(36)}-${rand}`
}
