/**
 * 看板布局持久化（阶段②）。
 *
 * 客户端只能经 execute('/pm …') 与后端通信，无 storage client 直连（已核实 panel.tsx 全部数据
 * 来自 `execute('web snapshot')`，现有视图偏好 pm-view/pm-selected-project 均落 localStorage）。
 * 故本期仍落 localStorage，但补齐三作用域与三层回退：
 *   global = 代码内置默认（DEFAULT_LAYOUT）；
 *   project = 团队模板覆盖（key project）；
 *   user   = 个人覆盖（key user）；优先级 user > project > global。
 * 未来切到 dsh-storage JSON 记录时只需替换本文件内部读写。
 */
import type { DashboardLayout, WidgetScope } from './types.js'

const KEYS: Record<Exclude<WidgetScope, 'global'>, string> = {
  user: 'pm-dashboard-layout:user',
  project: 'pm-dashboard-layout:project',
}
export const LAYOUT_VERSION = 1

const MIGRATIONS: Array<{ from: number, to: number, apply: (l: DashboardLayout) => DashboardLayout }> = []

function migrate(raw: unknown): DashboardLayout | null {
  if (typeof raw !== 'object' || raw === null) return null
  let layout = raw as DashboardLayout
  if (typeof layout.version !== 'number' || !Array.isArray(layout.widgets)) return null
  for (const step of MIGRATIONS) {
    if (layout.version === step.from) layout = step.apply(layout)
  }
  return layout
}

function readScope(scope: Exclude<WidgetScope, 'global'>): DashboardLayout | null {
  try {
    const text = localStorage.getItem(KEYS[scope])
    if (!text) return null
    return migrate(JSON.parse(text))
  } catch {
    return null
  }
}

/** 三层回退：user > project > global(fallback)。 */
export function resolveLayout(fallback: DashboardLayout): DashboardLayout {
  return readScope('user') ?? readScope('project') ?? fallback
}

export function saveLayout(scope: WidgetScope, layout: DashboardLayout): void {
  if (scope === 'global') return // global = 内置默认，不写
  try {
    localStorage.setItem(KEYS[scope], JSON.stringify({ ...layout, scope }))
  } catch { /* 静默 */ }
}

export function resetScope(scope: WidgetScope): void {
  if (scope === 'global') return
  try { localStorage.removeItem(KEYS[scope]) } catch { /* ignore */ }
}
