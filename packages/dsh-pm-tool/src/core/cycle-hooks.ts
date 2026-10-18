/**
 * K11 周期触发接线**占位**（P3-A，docs/design/deep-integration-v2-p3-dev.md §三）。
 *
 * 现状：H6 宿主通知能力未实现前不启用；调度器实现待用户拍板后立项（H6 调研，分片C 产出结论）。
 * 本模块**仅保留钩子点类型与空实现**：
 * - 不注册 setInterval / setTimeout / 任何后台进程；
 * - 不调用任何宿主 schedule / 定时推送 API；
 * - 不做常驻唤醒、不主动投递。
 * 后续 H6 拍板立项后，再在本文件（或新模块）按选定路线接线；当前所有钩子点一律 enabled:false。
 */
import type { PmDomain } from './storage.js'

/** 预留周期触发点清单：daily-archive 每日归档 / quarterly-review 季度回访。 */
export const CYCLE_HOOKS = ['daily-archive', 'quarterly-review'] as const

export type CycleHook = typeof CYCLE_HOOKS[number]

export interface CycleHookPointResult {
  hook: string
  enabled: false
  reason: string
}

/**
 * 周期钩子占位：无论传入哪个 hook，都返回未启用。
 * domain / todayIso 仅为未来接线预留形参，当前不被读取、不产生任何副作用。
 */
export function cycleHookPoint(
  hook: string,
  _domain: PmDomain | undefined,
  _todayIso: string,
): CycleHookPointResult {
  return {
    hook,
    enabled: false,
    reason: 'H6 宿主通知能力未实现前不启用',
  }
}
