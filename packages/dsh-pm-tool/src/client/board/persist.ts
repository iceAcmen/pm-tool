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
import { z } from 'zod'
import type { DashboardLayout, WidgetScope } from './types.js'

/** 导入/持久化布局的 zod schema（阶段③补齐）。 */
export const layoutSchema = z.object({
  version: z.number().int(),
  scope: z.enum(['global', 'project', 'user']).optional(),
  widgets: z.array(z.object({
    i: z.string(),
    type: z.string(),
    config: z.record(z.string(), z.unknown()).optional(),
    layout: z.object({
      i: z.string(),
      x: z.number(), y: z.number(), w: z.number(), h: z.number(),
      minW: z.number().optional(), minH: z.number().optional(),
    }),
  })),
  revision: z.number().optional(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
}).loose()

const KEYS: Record<Exclude<WidgetScope, 'global'>, string> = {
  user: 'pm-dashboard-layout:user',
  project: 'pm-dashboard-layout:project',
}
export const LAYOUT_VERSION = 1

const MIGRATIONS: Array<{ from: number, to: number, apply: (l: DashboardLayout) => DashboardLayout }> = []

/** 结构 + 迁移；不做 zod（由调用方在 import 时跑 layoutSchema）。 */
export function parseLayout(raw: unknown): DashboardLayout | null {
  const r = layoutSchema.safeParse(raw)
  if (!r.success) return null
  let layout = r.data as DashboardLayout
  if (layout.version > LAYOUT_VERSION) return null // 版本过新
  for (const step of MIGRATIONS) {
    if (layout.version === step.from) layout = step.apply(layout)
  }
  return layout
}

function readScope(scope: Exclude<WidgetScope, 'global'>): DashboardLayout | null {
  try {
    const text = localStorage.getItem(KEYS[scope])
    if (!text) return null
    return parseLayout(JSON.parse(text))
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
    const prev = readScope(scope)
    const next: DashboardLayout = {
      ...layout,
      scope,
      revision: (prev?.revision ?? 0) + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: prev?.updatedBy ?? '',
    }
    localStorage.setItem(KEYS[scope], JSON.stringify(next))
  } catch { /* 静默 */ }
}

export function resetScope(scope: WidgetScope): void {
  if (scope === 'global') return
  try { localStorage.removeItem(KEYS[scope]) } catch { /* ignore */ }
}
