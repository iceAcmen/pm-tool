/**
 * T6 跨会话布局历史（board persist 范围，纯前端 localStorage，不扩后端 schema）。
 *
 * 目标：每次成功保存把 canonical 12 列布局快照写入 localStorage，bounded（默认 ≤5 版，新在前），
 * 非破坏——只追加/裁剪自己的历史键，绝不清空后端落盘布局、不删用户现有卡片。
 * 恢复为显式动作：调用方把某版快照克隆进 draft 预览，必须再点「保存」才落盘，不自动写回。
 *
 * 存储后端通过 Storage 接口注入（测试用内存桩），浏览器侧由调用方包一层 localStorage，
 * 私密模式/配额失败静默降级，不影响主保存链路。
 */
import type { DashboardLayout, WidgetScope } from './types.js'

/**
 * 布局解析器由 entry 主包注入（parseLayout 实体留在 persist.ts，避免 history 静态依赖 persist
 * 而被 rolldown 拆成宿主模块表未注册的共享 chunk）。
 */
export type LayoutParser = (raw: unknown) => DashboardLayout | null

/** 单版历史快照。layout 一定是通过 parseLayout 收窄的合法 canonical 布局。 */
export interface LayoutHistoryEntry {
  /** 快照时间戳（ms epoch），用于列表排序与展示。 */
  ts: number
  /** 可选人工备注（如「调整 KPI 卡位置」），非必填。 */
  label?: string
  layout: DashboardLayout
}

/** 最多保留版本数（bounded，防止无限增长）。 */
export const HISTORY_LIMIT = 5

/** 每作用域独立键，global/project/user 互不串扰。 */
export function historyKey(scope: WidgetScope): string {
  return `pm-dash-layout-history:${scope}`
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * 纯函数：把新快照前置到历史并裁剪到 limit；不修改入参 prev（非破坏）。
 */
export function pushHistoryEntry(
  prev: LayoutHistoryEntry[],
  entry: LayoutHistoryEntry,
  limit: number = HISTORY_LIMIT,
): LayoutHistoryEntry[] {
  return [entry, ...prev].slice(0, Math.max(1, limit))
}

/** 布局签名：类型 + 网格坐标/尺寸一致即视为同一版，避免重复保存同一布局刷屏历史。 */
function layoutSignature(layout: DashboardLayout): string {
  return JSON.stringify(
    layout.widgets.map(w => [w.type, w.layout.i, w.layout.x, w.layout.y, w.layout.w, w.layout.h]),
  )
}

/**
 * 从存储读取某作用域历史；逐条过 parseLayout 防御收窄，非法/损坏条目丢弃，
 * 任何异常都返回 []，绝不向上抛、绝不整份清空。
 */
export function readHistory(storage: Storage, scope: WidgetScope, parseLayout: LayoutParser): LayoutHistoryEntry[] {
  try {
    const raw = storage.getItem(historyKey(scope))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const out: LayoutHistoryEntry[] = []
    for (const item of parsed) {
      if (!isRecord(item)) continue
      const ts = typeof item.ts === 'number' && Number.isFinite(item.ts) ? item.ts : null
      if (ts === null) continue
      const layout = parseLayout(item.layout)
      // 空卡（结构可解析但无任何合法 widget，多为损坏片段）按无效丢弃，不当作一版历史。
      if (!layout || layout.widgets.length === 0) continue
      out.push({
        ts,
        label: typeof item.label === 'string' && item.label.trim() ? item.label : undefined,
        layout,
      })
    }
    return out
  } catch {
    return []
  }
}

/** 把历史写回存储；配额/私密模式失败静默降级（不影响主保存）。 */
export function writeHistory(storage: Storage, scope: WidgetScope, entries: LayoutHistoryEntry[]): void {
  try {
    storage.setItem(historyKey(scope), JSON.stringify(entries))
  } catch {
    /* 配额满 / 禁用存储：静默放弃历史，主链路不受影响。 */
  }
}

/**
 * 记录一次成功保存的快照：读旧历史 → 与最新版签名去重（同版不重复入列）→ 前置 → 裁剪 → 写回。
 * 返回新的历史数组（供 UI 刷新）。不修改后端、不删除任何现有数据。
 */
export function recordSnapshot(
  storage: Storage,
  scope: WidgetScope,
  layout: DashboardLayout,
  now: number = Date.now(),
  limit: number = HISTORY_LIMIT,
  parseLayout: LayoutParser,
): LayoutHistoryEntry[] {
  const prev = readHistory(storage, scope, parseLayout)
  const signature = layoutSignature(layout)
  if (prev.length > 0 && layoutSignature(prev[0].layout) === signature) {
    return prev
  }
  const entry: LayoutHistoryEntry = { ts: now, layout: structuredClone(layout) }
  const next = pushHistoryEntry(prev, entry, limit)
  writeHistory(storage, scope, next)
  return next
}

/**
 * 取某版快照用于预览：返回深拷贝，调用方放进 draft 即预览，必须显式保存才落盘。
 * 不在此函数内写回任何存储。
 */
export function snapshotForPreview(entry: LayoutHistoryEntry): DashboardLayout {
  return structuredClone(entry.layout)
}
