/**
 * 看板布局持久化（阶段①）。
 *
 * 客户端只能经 execute('/pm …') 与后端通信；现有视图偏好（pm-view / pm-selected-project）
 * 均走 localStorage。按「既有最小一致」原则，看板布局（user 作用域）同样落 localStorage，
 * 不新增 core 命令/存储类型，保持隔离契约。接口按 §4.6 设计，未来切到 dsh-storage 记录时
 * 只需替换本文件内部实现。
 *
 * - global 作用域 = 代码内置默认布局（见 widgets.tsx）；
 * - user 作用域 = localStorage 覆盖；未配置/损坏/旧版本一律回退内置默认。
 */
import type { DashboardLayout } from './types.js'

const KEY = 'pm-dashboard-layout:user'
export const LAYOUT_VERSION = 1

/** 迁移链：v1 → v1 恒等。未来 v2 起在此追加 (layout) => next。 */
const MIGRATIONS: Array<{ from: number, to: number, apply: (l: DashboardLayout) => DashboardLayout }> = [
  // { from: 1, to: 2, apply: (l) => ({ ...l, version: 2 }) },
]

function migrate(raw: unknown): DashboardLayout | null {
  if (typeof raw !== 'object' || raw === null) return null
  let layout = raw as DashboardLayout
  if (typeof layout.version !== 'number' || !Array.isArray(layout.widgets)) return null
  for (const step of MIGRATIONS) {
    if (layout.version === step.from) layout = step.apply(layout)
  }
  return layout
}

export function loadUserLayout(fallback: DashboardLayout): DashboardLayout {
  try {
    const text = localStorage.getItem(KEY)
    if (!text) return fallback
    const parsed = migrate(JSON.parse(text))
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function saveUserLayout(layout: DashboardLayout): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...layout, scope: 'user' as const }))
  } catch { /* 存储不可用时静默：浏览态仍用当前内存布局 */ }
}

export function resetUserLayout(): void {
  try {
    localStorage.removeItem(KEY)
  } catch { /* ignore */ }
}
