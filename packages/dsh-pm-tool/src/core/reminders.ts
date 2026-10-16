/**
 * R16 临期/逾期提醒：纯离线派生（不做后台常驻/调度）。
 *
 * 逾期：未完成任务（status!=='done' 且 progress<100）dueDate<今天；未达成里程碑 targetDate<今天。
 * 临期：未完成/未达成且截止/目标日落在 [今天, 今天+withinDays]。
 * 已完成(done)/已达成(achieved)不计。跨项目分组、按日期升序。
 */
import type { PmDomain } from './storage.js'
import { localTodayIso, isTaskOverdue } from './derived.js'
import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from './settings.js'

export type ReminderSeverity = 'overdue' | 'due-soon'

export interface ReminderItem {
  kind: 'task' | 'milestone'
  severity: ReminderSeverity
  projectId: string
  projectName: string
  id: string
  code: string
  title: string
  assignee: string
  /** YYYY-MM-DD */
  date: string
  /** 相对今天的天数；负数=逾期 N 天，0=今天到期，正数=还有 N 天。 */
  daysUntil: number
}

function parseDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function todayIso(today?: string): string {
  if (today) return today
  return localTodayIso()
}

export interface ReminderOptions {
  today?: string
  withinDays?: number
  projectId?: string
  /** #21 可注入口径；缺省回落默认（临期窗口 7 天）。显式 withinDays 优先于设置。 */
  settings?: ProjectSettings
}

/** 计算临期/逾期提醒列表（不含已完成/已达成）。 */
export function computeReminders(domain: PmDomain, options: ReminderOptions = {}): ReminderItem[] {
  const today = todayIso(options.today)
  const withinDays = options.withinDays ?? options.settings?.reminderWithinDays ?? DEFAULT_PROJECT_SETTINGS.reminderWithinDays
  const todayMs = parseDate(today)
  const projects = new Map([...domain.table('projects').entries()].map(([, p]) => [p.id, p.name as string]))

  const items: ReminderItem[] = []

  for (const [, task] of domain.table('tasks').entries()) {
    if (options.projectId && task.projectId !== options.projectId) continue
    if (task.status === 'done' || (task.progress ?? 0) >= 100) continue
    if (!task.dueDate) continue
    const daysUntil = Math.round((parseDate(task.dueDate) - todayMs) / 86_400_000)
    // 逾期判定统一走 derived.isTaskOverdue（上方已先剔除 done / progress>=100 / 无日期）。
    if (isTaskOverdue(task, today)) {
      items.push({
        kind: 'task', severity: 'overdue', projectId: task.projectId,
        projectName: projects.get(task.projectId) ?? task.projectId,
        id: task.id, code: task.code, title: task.title, assignee: task.assignee ?? '',
        date: task.dueDate, daysUntil,
      })
    } else if (daysUntil <= withinDays) {
      items.push({
        kind: 'task', severity: 'due-soon', projectId: task.projectId,
        projectName: projects.get(task.projectId) ?? task.projectId,
        id: task.id, code: task.code, title: task.title, assignee: task.assignee ?? '',
        date: task.dueDate, daysUntil,
      })
    }
  }

  for (const [, milestone] of domain.table('milestones').entries()) {
    if (options.projectId && milestone.projectId !== options.projectId) continue
    if (milestone.status === 'achieved') continue
    const daysUntil = Math.round((parseDate(milestone.targetDate) - todayMs) / 86_400_000)
    if (daysUntil < 0) {
      items.push({
        kind: 'milestone', severity: 'overdue', projectId: milestone.projectId,
        projectName: projects.get(milestone.projectId) ?? milestone.projectId,
        id: milestone.id, code: milestone.id, title: milestone.title, assignee: '',
        date: milestone.targetDate, daysUntil,
      })
    } else if (daysUntil <= withinDays) {
      items.push({
        kind: 'milestone', severity: 'due-soon', projectId: milestone.projectId,
        projectName: projects.get(milestone.projectId) ?? milestone.projectId,
        id: milestone.id, code: milestone.id, title: milestone.title, assignee: '',
        date: milestone.targetDate, daysUntil,
      })
    }
  }

  // 逾期在前、按日期升序；同日跨项目按项目名+id。
  items.sort((a, b) =>
    a.daysUntil - b.daysUntil
    || a.date.localeCompare(b.date)
    || a.projectId.localeCompare(b.projectId)
    || a.id.localeCompare(b.id),
  )
  return items
}

/** 渲染为中文文本（命令输出用）。 */
export function renderReminders(items: ReminderItem[], withinDays: number): string {
  if (!items.length) return `没有临期（未来 ${withinDays} 天内）或逾期的任务/里程碑。`
  const overdue = items.filter(item => item.severity === 'overdue')
  const soon = items.filter(item => item.severity === 'due-soon')
  const lines: string[] = [`临期/逾期提醒（未来 ${withinDays} 天内）：逾期 ${overdue.length} 项，临期 ${soon.length} 项。`, '']
  const fmt = (item: ReminderItem): string => {
    const when = item.daysUntil < 0 ? `已逾期 ${-item.daysUntil} 天` : item.daysUntil === 0 ? '今天到期' : `还有 ${item.daysUntil} 天`
    const type = item.kind === 'task' ? '任务' : '里程碑'
    const owner = item.assignee ? `｜负责人 ${item.assignee}` : ''
    return `  [${item.projectName}] ${type} ${item.code}｜${item.id}｜${item.title}${owner}｜${when}（${item.date}）`
  }
  if (overdue.length) {
    lines.push('【逾期】')
    for (const item of overdue) lines.push(fmt(item))
  }
  if (soon.length) {
    lines.push(overdue.length ? '' : '', '【临期】')
    for (const item of soon) lines.push(fmt(item))
  }
  return lines.join('\n')
}
