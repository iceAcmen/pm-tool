/**
 * PROD-09：汇报相邻周期对比徽标（纯函数，无 React/无 DOM/无写，可离线单测）。
 *
 * 内部先按 periodEnd 降序、再按 id 数字降序稳定排序，因此返回的 Map 不依赖输入顺序。
 * 对排序后每一行，取其下一份（更旧的一份）作上一份，计算三项 delta：
 *   - avgProgress    完成率变化
 *   - overdueTask     逾期任务数变化（exception.kind === 'overdue_task'）
 *   - exceptionCount 异常总数变化
 * 最旧一行（历史首份）没有更前一份 → 三项均为 null（前端据此不渲染徽标）。
 * delta = 当前 - 上一份；0 表示持平，前端显示「持平 0」。
 *
 * v0.8 客观进度口径：snapshot.tasks.averageProgress 可空（null=无清单覆盖/证据不足），
 * 且快照带 calcVersion。相邻两份 calcVersion 不同（如旧库 v0 与新 v1）、或任一侧
 * averageProgress===null → avgProgress delta=null（前端不渲染差值徽标，不拿不同口径硬减）；
 * 仅同版本且两侧均非 null 时才相减。overdueTask/exceptionCount 口径不变。
 */

export interface ReportDiffRow {
  id: string
  periodEnd: string
  snapshot: {
    tasks: { averageProgress: number | null, calcVersion?: number }
    exceptions: { kind: string }[]
  }
}

export interface ReportDelta {
  avgProgress: number | null
  overdueTask: number | null
  exceptionCount: number | null
}

function countOverdue(row: ReportDiffRow): number {
  return row.snapshot.exceptions.filter(item => item.kind === 'overdue_task').length
}

/** 两份相邻快照是否可比：同 calcVersion（缺键按 0 归一）且两侧 averageProgress 均非 null。 */
function avgComparable(current: ReportDiffRow, previous: ReportDiffRow): boolean {
  const cur = current.snapshot.tasks
  const prev = previous.snapshot.tasks
  const curVersion = cur.calcVersion ?? 0
  const prevVersion = prev.calcVersion ?? 0
  return curVersion === prevVersion
    && cur.averageProgress !== null
    && prev.averageProgress !== null
}

/** 返回 reportId → 与「上一份（更旧）」的差值映射；与输入顺序无关。 */
export function diffAgainstPrevious(rows: ReportDiffRow[]): Map<string, ReportDelta> {
  const sorted = [...rows].sort((a, b) =>
    b.periodEnd.localeCompare(a.periodEnd) || b.id.localeCompare(a.id, 'en', { numeric: true }))
  const result = new Map<string, ReportDelta>()
  sorted.forEach((current, index) => {
    const previous = sorted[index + 1]
    if (!previous) {
      result.set(current.id, { avgProgress: null, overdueTask: null, exceptionCount: null })
      return
    }
    result.set(current.id, {
      avgProgress: avgComparable(current, previous)
        ? (current.snapshot.tasks.averageProgress as number)
          - (previous.snapshot.tasks.averageProgress as number)
        : null,
      overdueTask: countOverdue(current) - countOverdue(previous),
      exceptionCount: current.snapshot.exceptions.length - previous.snapshot.exceptions.length,
    })
  })
  return result
}
