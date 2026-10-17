/**
 * F10 / 规范 §12-21：stale（陈旧 / 更新中）占位状态机纯函数。
 *
 * 设计约束（本项目离线本地数据，本模块面向未来远程 / AI 路径预留）：
 * - **零 I/O、零依赖、不启用真实远程**：只提供「刷新中保留旧数据 + 标陈旧 +
 *   最后更新时间」的状态转移口径，供未来远程/AI 拉取层接入；当前不挂任何真实请求。
 * - **不用空白替换可信旧数据**：刷新中 / 刷新失败都保留上一份成功数据，
 *   只改状态标记（refreshing / stale / updatedAt / error），绝不把 data 清成 null。
 * - 纯函数、可在 Node 下直接 import 做行为测试，不依赖 React / DOM。
 *
 * 状态三轴：
 * - refreshing：正在刷新（UI 标「更新中」，旧数据照常展示）；
 * - stale：上一次刷新失败或数据落后（UI 标「陈旧」，旧数据照常展示）；
 * - updatedAt：已知成功落库的最后更新时间（ISO 字符串），供 UI 标「最后更新 …」。
 */

/** 一份带陈旧标记的快照；data 永远是「最近一次成功的数据」，刷新期间不清空。 */
export interface StaleSnapshot<T> {
  /** 最近一次成功的数据；刷新中 / 失败均保留，禁止置空。 */
  data: T | null
  /** 正在刷新：保留旧数据并标「更新中」。 */
  refreshing: boolean
  /** 陈旧：上一次刷新失败 / 落后，保留旧数据并标「陈旧」。 */
  stale: boolean
  /** 最后一次成功更新的时间（ISO）；从未成功为 null。 */
  updatedAt: string | null
  /** 最近一次刷新失败原因；成功即清空。 */
  error: string | null
}

/** 初始态：无数据、不在刷新、不陈旧。 */
export function idleStaleSnapshot<T>(data: T | null = null, updatedAt: string | null = null): StaleSnapshot<T> {
  return { data, refreshing: false, stale: false, updatedAt, error: null }
}

/**
 * 开始刷新：保留旧 data / updatedAt，置 refreshing=true；
 * 刷新期间若已是陈旧，stale 保持 true（不因为「正在刷」就假装新鲜）；清掉旧 error。
 */
export function beginRefresh<T>(prev: StaleSnapshot<T>): StaleSnapshot<T> {
  return { ...prev, refreshing: true, error: null }
}

/**
 * 提交成功：替换为新数据，清 refreshing / stale / error，记录本次成功时间。
 */
export function commitRefresh<T>(prev: StaleSnapshot<T>, fresh: T, updatedAt: string): StaleSnapshot<T> {
  return { data: fresh, refreshing: false, stale: false, updatedAt, error: null }
}

/**
 * 刷新失败：**保留旧 data / updatedAt**，置 refreshing=false、stale=true，记录 error；
 * 绝不用空白替换可信旧数据。
 */
export function failRefresh<T>(prev: StaleSnapshot<T>, error: string): StaleSnapshot<T> {
  return { ...prev, refreshing: false, stale: true, error }
}

/** 是否为「新鲜可用」：不在刷新、不陈旧、且有数据。 */
export function isFresh<T>(s: StaleSnapshot<T>): boolean {
  return !s.refreshing && !s.stale && s.data !== null
}

/**
 * UI 状态标签（中文，供占位层直接展示）：
 * - 正在刷新 → 「更新中」；
 * - 陈旧失败 → 「数据可能已陈旧」；
 * - 新鲜 → 空串（不展示标记）。
 */
export function staleStatusLabel<T>(s: StaleSnapshot<T>): string {
  if (s.refreshing) return '更新中'
  if (s.stale) return '数据可能已陈旧'
  return ''
}

/**
 * 「最后更新」时间标签：取 ISO 的 UTC `YYYY-MM-DD HH:mm`；无时间返回空串。
 * 纯字符串切片，不依赖运行环境时区，保证确定性。
 */
export function lastUpdatedLabel(iso: string | null | undefined): string {
  if (!iso) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(iso)
  if (!m) return ''
  return `最后更新 ${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`
}
