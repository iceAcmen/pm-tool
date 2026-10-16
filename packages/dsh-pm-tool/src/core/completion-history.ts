/**
 * 完成历史纯派生（无 zod、无领域写、无 React、可浏览器/Node 共用）。
 *
 * 铁律：只统计【真实带 completedDate】的任务，绝不伪造历史。
 *  - 没有任何任务带 completedDate（或统计窗口内没有）时，返回 empty 空结果，
 *    前端据此显示空态，而不是画一条全 0 的假曲线；
 *  - completedDate 落在窗口之外的，不伪造到窗口内；累计值如实计入（真实发生过的完成）。
 *
 * today 由 opts 注入（默认系统当天，本地日历日，避免 UTC 偏移），便于测试可复现。
 */
import { localTodayIso } from './derived.js'

export interface CompletionHistoryWeek {
  /** 本周周一（YYYY-MM-DD）。 */
  weekStart: string
  /** 本周内完成的任务数（completedDate 落在 [weekStart, weekStart+6]）。 */
  completed: number
  /** 截至本周末累计完成数（所有真实 completedDate <= 本周末的任务数，含窗口之前的真实完成）。 */
  cumulative: number
}

export interface CompletionHistory {
  /** 无真实数据可画：前端应显示空态而非曲线。 */
  empty: boolean
  /** 空态原因（empty=true 时给出，便于文案）。 */
  reason?: string
  /** 最近 N 周分桶（最旧 → 最新），即使 empty 也返回骨架供前端画坐标轴。 */
  weeks: CompletionHistoryWeek[]
}

export interface CompletionHistoryOptions {
  /** 统计周数，默认 8。 */
  weeks?: number
  /** 注入“今天”（YYYY-MM-DD 或 Date），默认系统当天本地日历日。 */
  today?: string | Date
}

/** 任意任务子集（只需 completedDate 字段），结构化但不依赖 zod 类型。 */
export interface CompletableTask {
  completedDate?: string | null
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 本地时区解析 YYYY-MM-DD（避免 new Date(str) 按 UTC 解析造成日期漂移）。 */
function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function shiftDays(iso: string, days: number): string {
  const dt = parseLocal(iso)
  dt.setDate(dt.getDate() + days)
  return localTodayIso(dt)
}

/** 取所在周的周一（Mon=0 … Sun=6）。 */
function mondayOf(iso: string): string {
  const dow = (parseLocal(iso).getDay() + 6) % 7
  return shiftDays(iso, -dow)
}

function normalizeToday(today: string | Date | undefined): string {
  if (typeof today === 'string') return today
  return localTodayIso(today ?? new Date())
}

/**
 * 构建最近 N 周完成历史。
 * 返回的 weeks 按“最旧 → 最新”排列；cumulative 为截至该周末的真实累计。
 */
export function buildCompletionHistory(
  tasks: readonly CompletableTask[],
  opts: CompletionHistoryOptions = {},
): CompletionHistory {
  const weeks = Math.max(1, Math.floor(opts.weeks ?? 8))
  const today = normalizeToday(opts.today)

  // 只认格式合法的真实 completedDate；其余（缺键、null、非法串）一律不计入。
  const dated = tasks
    .map(task => task.completedDate)
    .filter((d): d is string => typeof d === 'string' && ISO_DATE_RE.test(d))

  const currentMonday = mondayOf(today)
  const windowStart = shiftDays(currentMonday, -(weeks - 1) * 7)

  const buckets: CompletionHistoryWeek[] = []
  for (let i = 0; i < weeks; i += 1) {
    const weekStart = shiftDays(windowStart, i * 7)
    const weekEnd = shiftDays(weekStart, 6)
    const completed = dated.filter(d => d >= weekStart && d <= weekEnd).length
    const cumulative = dated.filter(d => d <= weekEnd).length
    buckets.push({ weekStart, completed, cumulative })
  }

  if (dated.length === 0) {
    return { empty: true, reason: '尚无真实完成日期数据', weeks: buckets }
  }
  const inWindow = buckets.reduce((sum, week) => sum + week.completed, 0)
  if (inWindow === 0) {
    return { empty: true, reason: '统计窗口内尚无完成记录', weeks: buckets }
  }
  return { empty: false, weeks: buckets }
}
