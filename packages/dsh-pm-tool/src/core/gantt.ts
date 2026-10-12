/**
 * PROD-22 方案A：甘特排期几何纯函数（无 React/DOM，可离线单测）。
 * 只用现有 startDate/dueDate/targetDate，不新增表、不做关键路径。
 */

const DAY = 86_400_000

export interface GanttTask {
  id: string
  startDate?: string
  dueDate?: string
}

/** 计算项目整体日期范围 [minStart, maxEnd]（天粒度）；无日期返回 null。 */
export function dateRange(items: { startDate?: string, dueDate?: string, targetDate?: string }[], padDays = 3): { start: string, end: string } | null {
  let min = Infinity
  let max = -Infinity
  for (const it of items) {
    const s = it.startDate ?? it.targetDate
    const e = it.dueDate ?? it.targetDate
    if (s) min = Math.min(min, Date.parse(s))
    if (e) max = Math.max(max, Date.parse(e))
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  const fmt = (t: number) => new Date(t).toISOString().slice(0, 10)
  return { start: fmt(min - padDays * DAY), end: fmt(max + padDays * DAY) }
}

/** 某日期相对轴起点的天数偏移。 */
export function daysFrom(date: string, axisStart: string): number {
  return Math.round((Date.parse(date) - Date.parse(axisStart)) / DAY)
}

/**
 * 拖拽：把像素增量转成“整体平移 N 天”，返回新的起止日期（按天取整）。
 * pxPerDay 为每天像素宽；钳制 start<=due（保持原时长平移，不改变长度）。
 */
export function shiftDatesByDrag(
  startDate: string,
  dueDate: string,
  deltaPx: number,
  pxPerDay: number,
): { startDate: string, dueDate: string } {
  const shiftDays = Math.round(deltaPx / pxPerDay)
  const day = (d: string, n: number) => new Date(Date.parse(d) + n * DAY).toISOString().slice(0, 10)
  let ns = day(startDate, shiftDays)
  let nd = day(dueDate, shiftDays)
  // 非法区间钳制：start 不得晚于 due
  if (Date.parse(ns) > Date.parse(nd)) { nd = ns }
  return { startDate: ns, dueDate: nd }
}

/** 任务条几何：left% / width(天)，供渲染。 */
export function barGeometry(task: GanttTask, axisStart: string, axisDays: number) {
  if (!task.startDate || !task.dueDate) return null
  const s = daysFrom(task.startDate, axisStart)
  const e = daysFrom(task.dueDate, axisStart)
  return { leftDays: s, widthDays: Math.max(1, e - s + 1) }
}

/** 今天在轴上的天数偏移（用于参考线）。 */
export function todayOffset(axisStart: string, today: string): number {
  return daysFrom(today, axisStart)
}
