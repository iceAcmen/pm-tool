/**
 * 任务五态互斥计数纯函数（契约 §7 / 数字口径字典）。
 * todo / in_progress / blocked / done / wrapped 五桶合计=总数；
 * open = todo+in_progress+blocked；done 单独；wrapped 已收尾·非正式完成单独成桶，
 * 不并入 done、不静默漏算。无 DOM、无写盘，供视图头与看板同源消费。
 */

export type TaskStatusBucket = 'todo' | 'in_progress' | 'blocked' | 'done' | 'wrapped'

export interface StatusTally {
  todo: number
  in_progress: number
  blocked: number
  done: number
  wrapped: number
}

export const EMPTY_TALLY: StatusTally = { todo: 0, in_progress: 0, blocked: 0, done: 0, wrapped: 0 }

/** 按状态字符串归桶；未知/空状态归入 todo 桶，保证合计恒等于输入条数。 */
export function tallyTasksByStatus(statuses: Array<string | undefined | null>): StatusTally {
  const t: StatusTally = { ...EMPTY_TALLY }
  for (const s of statuses) {
    if (s === 'done') t.done++
    else if (s === 'in_progress') t.in_progress++
    else if (s === 'blocked') t.blocked++
    else if (s === 'wrapped') t.wrapped++
    else t.todo++
  }
  return t
}

export const tallyTotal = (t: StatusTally): number =>
  t.todo + t.in_progress + t.blocked + t.done + t.wrapped

/** open = todo + in_progress + blocked（不含 done/wrapped）。 */
export const tallyOpen = (t: StatusTally): number => t.todo + t.in_progress + t.blocked

export const donePercent = (t: StatusTally, total: number): number =>
  total > 0 ? Math.round(t.done / total * 100) : 0
