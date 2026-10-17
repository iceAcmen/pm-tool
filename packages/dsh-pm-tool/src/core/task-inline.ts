/**
 * PROD-03：任务行内快速编辑的纯逻辑（无 React，可离线单测）。
 */
import { TASK_STATUSES, type TaskStatus } from './status.js'

// 状态枚举以 core/status.ts 为单一事实来源（zod 写库 schema 同源），此处仅转发，
// 不再维护本地副本，避免旧枚举（todo/doing/done）导致 in_progress/blocked 被静默丢弃。
export { TASK_STATUSES }
export type { TaskStatus }

/** 进度钳制到 0-100 整数；非数字回退 0。（写路径「必须有值」语义：空/非法统一落 0） */
export function clampProgress(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

/**
 * 写路径进度输入解析：null/undefined、trim 后空串、非有限（NaN/Infinity）→ undefined（语义「不写该字段」）；
 * 合法值 → round 到 0..100 整数。注意 Number(null)/Number('')/Number(' ') 均为 0，
 * 因此必须先显式判空/判空串再 Number。
 */
export function parseProgressInput(raw: unknown): number | undefined {
  if (raw == null) return undefined
  if (typeof raw === 'string' && raw.trim() === '') return undefined
  const n = Number(raw)
  if (!Number.isFinite(n)) return undefined
  return clampProgress(n)
}

/** 合法日期字符串（YYYY-MM-DD）才返回，否则 null（不写空串覆盖）。 */
export function cleanDate(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

/** 组装 task update 参数；仅保留合法/非空字段，返回 {} 表示无可更新项。 */
export function buildUpdate(input: {
  status?: string
  progress?: unknown
  dueDate?: unknown
}): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (input.status && TASK_STATUSES.includes(input.status as TaskStatus)) out.status = input.status
  if (input.progress !== undefined && input.progress !== '' && input.progress !== null) {
    const p = clampProgress(input.progress)
    out.progress = p
    // 状态联动：进度 100 视为完成，0 且非完成时不强制改回 todo（保守）
    if (p === 100) out.status = 'done'
  }
  const d = cleanDate(input.dueDate)
  if (d) out.dueDate = d
  return out
}
