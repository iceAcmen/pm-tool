/**
 * 纯派生（无 zod、无领域写操作）：供服务端 health 与浏览器端面板共用，
 * 避免面板 bundle 间接拉入 zod。仅依赖普通类型。
 */
import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from './settings.js'
import { isWrappedStatus } from './status.js'

export type HealthLamp = 'green' | 'yellow' | 'red' | 'gray'

export interface HealthFactor {
  key: string
  label: string
  count: number
  deduction: number
}

export interface HealthInputs {
  taskTotal: number
  overdueTasks: number
  taskBlocked: number
  openHighRisk: number
  openCriticalRisk: number
  milestoneOverdue: number
}

function factor(raw: number, per: number, cap: number): { count: number, deduction: number } {
  return { count: raw, deduction: -Math.min(raw * per, cap) }
}

/**
 * 纯计分：输入已计数因子 → 灯号/分/因子行。UI 只负责计数，不复制扣分公式。
 * `settings` 可注入口径（#21）；缺省 = DEFAULT_PROJECT_SETTINGS，与配置化前硬编码逐值一致。
 */
export function scoreFromInputs(
  inputs: HealthInputs,
  settings?: ProjectSettings,
): { lamp: HealthLamp, score: number | null, factors: HealthFactor[] } {
  if (inputs.taskTotal === 0) return { lamp: 'gray', score: null, factors: [] }
  const s = settings ?? DEFAULT_PROJECT_SETTINGS
  const factors: HealthFactor[] = []
  let deduction = 0

  const overdue = factor(inputs.overdueTasks, s.healthOverduePer, s.healthCapOverdueTasks)
  if (overdue.count) { factors.push({ key: 'overdueTasks', label: '逾期未完成任务', ...overdue }); deduction += -overdue.deduction }

  const blocked = factor(inputs.taskBlocked, s.healthBlockedPer, s.healthCapBlockedTasks)
  if (blocked.count) { factors.push({ key: 'blockedTasks', label: '受阻任务', ...blocked }); deduction += -blocked.deduction }

  const riskDeduction = Math.min(inputs.openHighRisk * s.healthHighRiskPer + inputs.openCriticalRisk * s.healthCriticalRiskPer, s.healthCapOpenRisk)
  if (inputs.openHighRisk + inputs.openCriticalRisk > 0) {
    factors.push({ key: 'openRisk', label: '未闭环高影响风险', count: inputs.openHighRisk + inputs.openCriticalRisk, deduction: -riskDeduction })
    deduction += riskDeduction
  }

  const milestone = factor(inputs.milestoneOverdue, s.healthOverdueMilestonePer, s.healthCapOverdueMilestones)
  if (milestone.count) { factors.push({ key: 'overdueMilestones', label: '逾期里程碑', ...milestone }); deduction += -milestone.deduction }

  const score = Math.max(0, 100 - deduction)
  const lamp: HealthLamp = score >= s.healthGreenAt ? 'green' : score >= s.healthYellowAt ? 'yellow' : 'red'
  return { lamp, score, factors }
}

/** 本地日历日 YYYY-MM-DD（无 zod、可浏览器用）：避免 UTC 偏移把今天写成昨天。 */
export function localTodayIso(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 里程碑是否「已延期」——唯一纯谓词，概览统计 / 时间轴卡片 / health·stats 同源复用，
 * 消除「概览按原始 status、卡片按日期派生」两套口径（P0-2 / S2-2）。
 *
 * 判定：显式 `missed` 直接计延期；`achieved` 不延期；其余（planned/at_risk）在
 * 目标日早于本地日历日 `today`（注入，避免 UTC 偏移）时计延期；无目标日诚实降级为不延期。
 */
export function isMilestoneMissed(
  m: { status: string, targetDate?: string | null },
  today: string,
): boolean {
  if (m.status === 'missed') return true
  if (m.status === 'achieved') return false
  return !!m.targetDate && m.targetDate < today
}

/**
 * 任务是否「已逾期」——唯一纯谓词，stats / people-load / reminders / war-room 同源复用，
 * 对齐现网 tasks.tsx isLate（P1 口径唯一，消除各模块各自算逾期）。
 *
 * 冻结语义：`status !== 'done'` 且非 `wrapped`（已收尾不催办）且 `(progress ?? 0) < 100`
 * 且有 dueDate 且 dueDate 早于本地日历日 `today`（注入，避免 UTC 偏移）。
 * 已完成 / 已收尾 / 进度已达 100 / 无截止日 / 今天到期 / 未来到期均不逾期。
 */
export function isTaskOverdue(
  task: { status?: string, progress?: number | null, dueDate?: string | null },
  today: string,
): boolean {
  return task.status !== 'done'
    && !isWrappedStatus(task.status)
    && (task.progress ?? 0) < 100
    && !!task.dueDate
    && task.dueDate < today
}

/**
 * 本地日历日加 days 天，返回 YYYY-MM-DD（today 注入、零墙钟、确定性）。
 * 用本地 Date 算术（setDate），由引擎正确处理大小月 / 闰年 / 跨年；输出零填充。
 */
export function addDaysIso(today: string, days: number): string {
  const [y, m, d] = today.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/**
 * 任务是否「未来 days 天内到期」（本周到期视图，days=7）——唯一纯谓词。
 *
 * 冻结语义：未完成（status !== 'done'、非 wrapped 已收尾、(progress ?? 0) < 100）且有 dueDate，
 * 且 dueDate <= addDaysIso(today, days)。**含已逾期**：逾期 dueDate 同样满足
 * ≤ today+7，语义是「本周（未来 7 天）要处理的到期清单」，不是只看未来。
 * 已完成 / 已收尾 / 进度已达 100 / 无截止日 不入选。today 注入，避免 UTC 偏移。
 */
export function isTaskDueWithin(
  task: { status?: string, progress?: number | null, dueDate?: string | null },
  today: string,
  days: number,
): boolean {
  if (task.status === 'done' || isWrappedStatus(task.status) || (task.progress ?? 0) >= 100) return false
  return !!task.dueDate && task.dueDate <= addDaysIso(today, days)
}

/**
 * 任务是否「有风险」（风险视图）——满足任一即 true：
 * 1. status === 'blocked'（受阻）；
 * 2. isTaskOverdue(task, today)（已逾期）；
 * 3. 传入关联里程碑且 isMilestoneMissed(milestone, today)（里程碑已延期）。
 * milestone 可选，缺省只判前两者；纯函数、today 注入、零墙钟。
 */
export function isTaskAtRisk(
  task: { status?: string, progress?: number | null, dueDate?: string | null },
  today: string,
  milestone?: { status: string, targetDate?: string | null } | null,
): boolean {
  if (task.status === 'blocked') return true
  if (isTaskOverdue(task, today)) return true
  if (milestone && isMilestoneMissed(milestone, today)) return true
  return false
}

export interface PredecessorNode {
  id: string
  status: string
  predecessorIds?: string[]
}

/** 返回该任务尚未完成的前置依赖（status !== 'done'）。只读派生。 */
export function blockingPredecessors<T extends PredecessorNode>(task: T, byId: Map<string, T>): T[] {
  const result: T[] = []
  for (const pid of task.predecessorIds ?? []) {
    const pre = byId.get(pid)
    if (pre && pre.status !== 'done') result.push(pre)
  }
  return result
}
