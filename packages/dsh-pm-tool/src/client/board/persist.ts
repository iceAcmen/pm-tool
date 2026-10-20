/**
 * 看板布局结构校验 + 迁移（主包，不依赖 zod / localStorage）。
 *
 * 持久化已切到 dsh-storage：布局经 `execute('dashboard put/reset <scope>')` 落盘，
 * 并由 `/pm web snapshot` 的 `dashboards.{user,project}` 读回。本文件只负责把后端透明返回的
 * 未知 JSON 防御性地收窄成 DashboardLayout，并跑版本迁移；保存/重置由 BoardBento 经回调完成。
 * 严格的逐卡片 configSchema 闸门（zod）在编辑器异步块内做。
 */
import type { DashboardLayout, WidgetInstance, WidgetScope } from './types.js'
import { GRID } from './types.js'

/* ===== R-B3/R-B11 布局安全纯逻辑（内联于主包，避免跨 chunk 共享拆分）===== */

/** 两卡 bbox 是否相交（同网格坐标矩形，非严格相邻）。 */
export function bboxOverlap(a: WidgetInstance['layout'], b: WidgetInstance['layout']): boolean {
  const xOverlap = a.x < b.x + b.w && b.x < a.x + a.w
  const yOverlap = a.y < b.y + b.h && b.y < a.y + a.h
  return xOverlap && yOverlap
}

/** 返回所有相交卡对（i,i）；无碰撞返回空。 */
export function findCollisions(widgets: WidgetInstance[]): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (let i = 0; i < widgets.length; i++) {
    for (let j = i + 1; j < widgets.length; j++) {
      if (bboxOverlap(widgets[i].layout, widgets[j].layout)) out.push([widgets[i].layout.i, widgets[j].layout.i])
    }
  }
  return out
}

/** 夹紧单卡到 [0, cols]，记录自愈提示。 */
function clampOne(inst: WidgetInstance, cols: number, warnings: string[]): WidgetInstance {
  const L = inst.layout
  const minW = L.minW ?? 1
  const minH = L.minH ?? 1
  let x = Math.floor(Number.isFinite(L.x) ? L.x : 0)
  let y = Math.floor(Number.isFinite(L.y) ? L.y : 0)
  let w = Math.floor(Number.isFinite(L.w) ? L.w : minW)
  let h = Math.floor(Number.isFinite(L.h) ? L.h : minH)
  const before = { x, y, w, h }
  w = Math.max(minW, Math.min(w, cols))
  x = Math.max(0, Math.min(x, cols - w))
  h = Math.max(minH, h)
  y = Math.max(0, y)
  if (x !== before.x || y !== before.y || w !== before.w || h !== before.h) {
    warnings.push(`卡片 ${L.i}：坐标/尺寸越界已夹紧到网格（${before.x},${before.y} ${before.w}×${before.h} → ${x},${y} ${w}×${h}）`)
  }
  return { ...inst, layout: { ...L, i: L.i, x, y, w, h, minW: L.minW, minH: L.minH } }
}

/** 未知类型跳过并列名、越界夹紧、碰撞向下一空行下沉（vertical compact），不静默覆盖/重置。 */
export function sanitizeLayout(raw: DashboardLayout, cols: number, knownTypes: Set<string>): {
  widgets: WidgetInstance[]; skipped: string[]; warnings: string[]
} {
  const skipped: string[] = []
  const warnings: string[] = []
  const kept: WidgetInstance[] = []
  for (const w of raw.widgets) {
    if (!knownTypes.has(w.type)) { skipped.push(`${w.type}（${w.layout.i}）`); continue }
    kept.push(clampOne(w, cols, warnings))
  }
  const placed: WidgetInstance[] = []
  for (const cand of kept) {
    let y = cand.layout.y
    for (;;) {
      const trial = { ...cand, layout: { ...cand.layout, y } }
      const hit = placed.some(p => bboxOverlap(p.layout, trial.layout))
      if (!hit) break
      y += 1
      if (y > 5000) break
    }
    if (y !== cand.layout.y) warnings.push(`卡片 ${cand.layout.i}：与邻卡碰撞，已下沉到 y=${y}（原 y=${cand.layout.y}）`)
    placed.push({ ...cand, layout: { ...cand.layout, y } })
  }
  return { widgets: placed, skipped, warnings }
}

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

/** 三层回退：user > project > fallback(内置默认)；每档都过 R-B11 夹紧/未知跳过/碰撞下沉。
 *  knownTypes 显式传入，避免首屏在 registerKnownWidgetTypes 副作用前拿到空集合而误删全部卡。 */
export function resolveDashboard(
  rawUser: unknown,
  rawProject: unknown,
  fallback: DashboardLayout,
  knownTypes?: Set<string>,
): DashboardLayout {
  const types = knownTypes ?? KNOWN_TYPES
  return loadDashboard(rawUser, types)?.layout
    ?? loadDashboard(rawProject, types)?.layout
    ?? fallback
}

/** 项目级作用域持久化 scope 串：有 projectId → `project:<p-id>`，否则个人 `user`。 */
export function dashboardScopeFor(projectId?: string): string {
  return projectId ? `project:${projectId}` : 'user'
}

/**
 * 项目概览解析：byProject[projectId] 优先；缺省只读回退旧全局 project（绝不写/重置它）；
 * 再缺省回退内置默认。不读个人 user 布局，避免项目串个人配置。
 */
export function resolveProjectDashboard(
  byProject: Record<string, unknown> | undefined,
  projectId: string | undefined,
  legacyProject: unknown,
  fallback: DashboardLayout,
  knownTypes?: Set<string>,
): DashboardLayout {
  const types = knownTypes ?? KNOWN_TYPES
  const scoped = projectId ? byProject?.[projectId] : undefined
  return loadDashboard(scoped, types)?.layout
    ?? loadDashboard(legacyProject, types)?.layout
    ?? fallback
}

/** 注册表已知类型（由 widgets.tsx 注入，避免 persist 反向 import 渲染块）。 */
let KNOWN_TYPES = new Set<string>()
export function registerKnownWidgetTypes(types: Iterable<string>): void {
  KNOWN_TYPES = new Set(types)
}

export interface LoadedDashboard {
  layout: DashboardLayout
  warnings: string[]
  skipped: string[]
}

/**
 * 解析 + R-B11 安全归一：未知类型跳过并列名、越界夹紧、碰撞下沉；
 * 返回 null 表示结构不可解析（调用方回退下一档/默认），绝不整份重置白屏。
 */
export function loadDashboard(raw: unknown, knownTypes: Set<string>): LoadedDashboard | null {
  const parsed = parseLayout(raw)
  if (!parsed) return null
  const { widgets, skipped, warnings } = sanitizeLayout(parsed, GRID.cols, knownTypes)
  return { layout: { ...parsed, widgets }, skipped, warnings }
}

export type { WidgetScope }
