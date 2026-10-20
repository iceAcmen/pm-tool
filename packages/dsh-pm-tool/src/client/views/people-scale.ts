/**
 * G-B 人员负载分布点图同刻度纯函数（零 I/O、零写）。
 *
 * 口径（与 people.tsx 原内联一致，行为保持）：
 * - X 轴上限取「过载阈值 / 所有已分配人员 open / 未分配桶 open」最大值，
 *   向上取整到 2 的倍数再 +2 留余量，至少 8；
 * - 过滤/筛选不缩尺：未分配桶与阈值始终计入 rawMax，刻度不随可见人数收缩；
 * - 刻度 0,2,4,…,maxX。
 */

export interface LoadScale {
  /** X 轴上限（偶数，至少 8）。 */
  maxX: number
  /** 自 0 到 maxX、步长 2 的刻度。 */
  ticks: number[]
}

export function loadScale(
  assigned: number[],
  unassigned: number,
  overloadThreshold: number,
): LoadScale {
  const rawMax = Math.max(overloadThreshold, ...assigned, unassigned, 1)
  const maxX = Math.max(8, (Math.ceil((rawMax + 2) / 2) * 2))
  const ticks: number[] = []
  for (let t = 0; t <= maxX; t += 2) ticks.push(t)
  return { maxX, ticks }
}
