/**
 * Canonical 12 列基准 ↔ 断点显示投影（纯函数，无 DOM / 无写盘）。
 *
 * 契约 §3.6：持久化只存 canonical 12 列坐标；断点（≥1200=12 / 996–1199=8 / 768–995=4 / <768=1）
 * 只用于编辑器显示投影，RGL onLayoutChange 再回算到 12 列写入 draft，杜绝「窄存回宽塌缩」。
 * 浏览态与编辑态走同一换算，不维护两套坐标。
 */
import type { WidgetInstance } from './types.js'
import { GRID } from './types.js'

export type BreakpointCols = 12 | 8 | 4 | 1

/** 由容器像素宽取断点列数（与 editor.tsx 既有阈值一致：1200/996/768）。 */
export function breakpointForWidth(wpx: number): BreakpointCols {
  if (wpx >= GRID.breakpoints.lg) return 12
  if (wpx >= GRID.breakpoints.md) return 8
  if (wpx >= GRID.breakpoints.sm) return 4
  return 1
}

const round = (n: number) => Math.round(n)

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** canonical(12) → 断点显示坐标（喂给 RGL）。不改原对象。 */
export function projectToBreakpoint(widgets: WidgetInstance[], cols: BreakpointCols) {
  if (cols === 12) {
    return widgets.map(w => ({ ...w.layout }))
  }
  if (cols === 1) {
    // 单列堆叠：x/w 无意义，按输入顺序紧凑排 y，避免投影自带重叠。
    let cursor = 0
    return widgets.map(w => {
      const h = Math.max(1, w.layout.h)
      const item = { ...w.layout, x: 0, y: cursor, w: 1 }
      cursor += h
      return item
    })
  }
  const scale = cols / GRID.cols
  return widgets.map(w => {
    const minW = Math.max(1, w.layout.minW ?? 1)
    let x = round(w.layout.x * scale)
    const wSize = clampInt(round(w.layout.w * scale), minW, cols)
    x = clampInt(x, 0, cols - wSize)
    return { ...w.layout, x, w: wSize }
  })
}

/**
 * 断点 RGL 坐标 → canonical(12)。
 * @param prev  当前 canonical draft（cols=1 时 x/w 无法反推，沿用旧值，只接受新的堆叠 y）。
 * @param next  RGL onLayoutChange 报告的断点坐标。
 */
export function reverseFromBreakpoint(
  prev: WidgetInstance[],
  next: Array<{ i: string, x: number, y: number, w: number, h: number }>,
  cols: BreakpointCols,
): WidgetInstance[] {
  const prevMap = new Map(prev.map(w => [w.layout.i, w]))
  const nextMap = new Map(next.map(n => [n.i, n]))
  return prev.map(w => {
    const n = nextMap.get(w.layout.i)
    if (!n) return w
    if (cols === 12) {
      return { ...w, layout: { ...w.layout, x: n.x, y: n.y, w: n.w, h: n.h } }
    }
    if (cols === 1) {
      // 单列：保留 canonical x/w/minW/minH，仅接受堆叠后的 y/h。
      return { ...w, layout: { ...w.layout, y: n.y, h: n.h } }
    }
    const scale = GRID.cols / cols
    const minW = Math.max(1, w.layout.minW ?? 1)
    let x = round(n.x * scale)
    const wSize = clampInt(round(n.w * scale), minW, GRID.cols)
    x = clampInt(x, 0, GRID.cols - wSize)
    return { ...w, layout: { ...w.layout, x, y: n.y, w: wSize, h: n.h } }
  })
}

/** 两卡 bbox 相交判定（与 persist.ts 同口径，网格矩形非严格相邻）。 */
export function bboxOverlap(a: WidgetInstance['layout'], b: WidgetInstance['layout']): boolean {
  const xOverlap = a.x < b.x + b.w && b.x < a.x + a.w
  const yOverlap = a.y < b.y + b.h && b.y < a.y + a.h
  return xOverlap && yOverlap
}

/** 返回所有相交卡对（[i,j]）；无碰撞返回空。 */
export function findCanonicalCollisions(widgets: WidgetInstance[]): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (let i = 0; i < widgets.length; i++) {
    for (let j = i + 1; j < widgets.length; j++) {
      if (bboxOverlap(widgets[i].layout, widgets[j].layout)) {
        out.push([widgets[i].layout.i, widgets[j].layout.i])
      }
    }
  }
  return out
}

/**
 * canonical 自动下沉：与已放置卡相交的卡逐行下移直到无碰撞（vertical compact）。
 * 返回新数组与下沉记录（供保存提示），不改原对象；超过 5000 行兜底防死循环。
 */
export function sinkCanonicalCollisions(widgets: WidgetInstance[]): {
  widgets: WidgetInstance[]
  sunk: Array<{ i: string, fromY: number, toY: number }>
} {
  const placed: WidgetInstance[] = []
  const sunk: Array<{ i: string, fromY: number, toY: number }> = []
  for (const cand of widgets) {
    let y = Math.max(0, cand.layout.y)
    for (let guard = 0; ; guard++) {
      const trial = { ...cand, layout: { ...cand.layout, y } }
      const hit = placed.some(p => bboxOverlap(p.layout, trial.layout))
      if (!hit || guard > 5000) break
      y += 1
    }
    if (y !== cand.layout.y) sunk.push({ i: cand.layout.i, fromY: cand.layout.y, toY: y })
    placed.push({ ...cand, layout: { ...cand.layout, y } })
  }
  return { widgets: placed, sunk }
}

/**
 * 编辑器异步块经 props 注入的投影 API（类型-only，编译后擦除，不产生运行时 chunk 依赖）。
 * 投影纯函数实体留在 entry 主包，避免被 rolldown 拆成宿主模块表未注册的共享 chunk。
 */
export interface ProjectionApi {
  breakpointForWidth: typeof breakpointForWidth
  projectToBreakpoint: typeof projectToBreakpoint
  reverseFromBreakpoint: typeof reverseFromBreakpoint
  findCanonicalCollisions: typeof findCanonicalCollisions
}
