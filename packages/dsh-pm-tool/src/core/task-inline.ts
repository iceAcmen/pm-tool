/**
 * PROD-03：任务行内快速编辑的纯逻辑（无 React，可离线单测）。
 */

export const TASK_STATUSES = ['todo', 'doing', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

/** 状态循环：todo -> doing -> done -> todo（非法值回到 todo）。 */
export function nextStatus(cur: string): TaskStatus {
  const i = TASK_STATUSES.indexOf(cur as TaskStatus)
  return TASK_STATUSES[(i + 1) % TASK_STATUSES.length]
}

/** 进度钳制到 0-100 整数；非数字回退 0。 */
export function clampProgress(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
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
