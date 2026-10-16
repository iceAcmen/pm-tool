/**
 * 看板布局结构校验 + 迁移（主包，不依赖 zod / localStorage）。
 *
 * 持久化已切到 dsh-storage：布局经 `execute('dashboard put/reset <scope>')` 落盘，
 * 并由 `/pm web snapshot` 的 `dashboards.{user,project}` 读回。本文件只负责把后端透明返回的
 * 未知 JSON 防御性地收窄成 DashboardLayout，并跑版本迁移；保存/重置由 BoardBento 经回调完成。
 * 严格的逐卡片 configSchema 闸门（zod）在编辑器异步块内做。
 */
import type { DashboardLayout, WidgetInstance, WidgetScope } from './types.js'

export const LAYOUT_VERSION = 1

export interface Migration {
  from: number
  to: number
  apply: (l: DashboardLayout) => DashboardLayout
}

/**
 * 版本迁移链（有序）。当前无真实 v2 结构变更，故 LAYOUT_VERSION 维持 1；
 * 但 parseLayout 一律走 stepMigrations 逐级步进，后续插入 v2/v3 只需在此追加一条。
 */
const MIGRATIONS: Migration[] = []

/**
 * 从 layout.version 逐级迁移到 LAYOUT_VERSION。
 * 每步纯函数、按 from->to 严格步进；若链不连续（缺某一级）抛错，避免跳级静默丢字段。
 * 导出供 verify 单测（可注入合成链验证“必须逐级经过”）。
 */
export function stepMigrations(layout: DashboardLayout, chain: Migration[], target: number): DashboardLayout {
  let cur = layout
  let guard = 0
  while (cur.version < target) {
    const next = chain.find(m => m.from === cur.version)
    if (!next) throw new Error(`迁移链缺失：version=${cur.version} -> ${cur.version + 1}`)
    if (next.to !== next.from + 1) throw new Error(`迁移必须逐级：${next.from}->${next.to} 不合法`)
    cur = next.apply(cur)
    if (cur.version !== next.to) throw new Error(`迁移未正确推进版本：${next.from}->${next.to} 实际 ${cur.version}`)
    if (++guard > 100) throw new Error('迁移链死循环')
  }
  return cur
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asNum(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** 把单个 widget 收窄成合法 WidgetInstance；非法则返回 null。 */
function parseWidget(raw: unknown): WidgetInstance | null {
  if (!isRecord(raw)) return null
  const layout = isRecord(raw.layout) ? raw.layout : null
  if (!layout) return null
  const i = typeof layout.i === 'string' ? layout.i : typeof raw.i === 'string' ? raw.i : null
  const type = typeof raw.type === 'string' ? raw.type : null
  if (!i || !type) return null
  const x = asNum(layout.x), y = asNum(layout.y), w = asNum(layout.w), h = asNum(layout.h)
  if (x === null || y === null || w === null || h === null) return null
  return {
    i, type,
    config: isRecord(raw.config) ? (raw.config as WidgetInstance['config']) : {},
    layout: {
      i, x, y, w, h,
      minW: asNum(layout.minW) ?? undefined,
      minH: asNum(layout.minH) ?? undefined,
    },
  }
}

/** 结构 + 迁移；不做逐卡片 zod（保存闸门在编辑器块）。非法/版本过新返回 null。 */
export function parseLayout(raw: unknown): DashboardLayout | null {
  if (!isRecord(raw)) return null
  const version = asNum(raw.version)
  if (version === null || version < 1 || version > LAYOUT_VERSION) return null
  if (!Array.isArray(raw.widgets)) return null
  const widgets: WidgetInstance[] = []
  for (const w of raw.widgets) {
    const parsed = parseWidget(w)
    if (parsed) widgets.push(parsed)
  }
  let layout: DashboardLayout = {
    version,
    scope: (raw.scope === 'global' || raw.scope === 'project' || raw.scope === 'user') ? raw.scope : 'global',
    widgets,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : undefined,
    revision: asNum(raw.revision) ?? undefined,
  }
  // 逐级迁移到最新（v1 老配置照样升到最新；链不连续则抛错）。
  layout = stepMigrations(layout, MIGRATIONS, LAYOUT_VERSION)
  return layout
}

/** 三层回退：user > project > fallback(内置默认)。 */
export function resolveDashboard(rawUser: unknown, rawProject: unknown, fallback: DashboardLayout): DashboardLayout {
  return parseLayout(rawUser) ?? parseLayout(rawProject) ?? fallback
}

export type { WidgetScope }
