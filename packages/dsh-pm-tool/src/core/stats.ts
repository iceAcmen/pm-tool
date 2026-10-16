/**
 * R12 统计看板：只读聚合各表现状，不写盘、不新增表。
 *
 * 口径与离线 `/pm stats`、Web「总览看板」一致：任务按状态计数与完成率、
 * 里程碑达成/逾期、未关闭风险按严重度、会议/汇报计数、交付物按四态计数，
 * 逾期项单独统计以便高亮。`today` 可注入以保证验证确定性。
 */
import type { PmDomain } from './storage.js'
import { projectIdSchema } from './project.js'
import { todayIso } from './reminders.js'
import { isMilestoneMissed, isTaskOverdue } from './derived.js'

export class StatsProjectNotFoundError extends Error {}

function todayString(): string {
  // 与 reminders 同源本地日历日（CST），避免 UTC 偏移把今天算成昨天。
  return todayIso()
}

const zeroImpact = () => ({ low: 0, medium: 0, high: 0, critical: 0 })
const zeroDeliverable = () => ({ planned: 0, in_progress: 0, submitted: 0, accepted: 0 })

export interface ProjectStats {
  projectId: string
  projectName: string
  status: string
  taskTotal: number
  taskDone: number
  taskInProgress: number
  taskTodo: number
  taskBlocked: number
  completionRate: number
  overdueTasks: number
  milestoneTotal: number
  milestoneAchieved: number
  milestoneOverdue: number
  openRiskCount: number
  openRiskByImpact: { low: number, medium: number, high: number, critical: number }
  meetingCount: number
  reportCount: number
  deliverableByStatus: { planned: number, in_progress: number, submitted: number, accepted: number }
}

export interface StatsReport {
  scope: 'all' | 'project'
  today: string
  projectCount: number
  projectStatusCount: Record<string, number>
  totals: {
    taskTotal: number
    taskDone: number
    taskOverdue: number
    milestoneTotal: number
    milestoneOverdue: number
    openRisk: number
    meetingCount: number
    reportCount: number
    deliverableCount: number
  }
  projects: ProjectStats[]
}

function statsForProject(
  domain: PmDomain,
  projectId: string,
  projectName: string,
  projectStatus: string,
  today: string,
): ProjectStats {
  const tasks = [...domain.table('tasks').entries()]
    .map(([, task]) => task)
    .filter(task => task.projectId === projectId)
  const milestones = [...domain.table('milestones').entries()]
    .map(([, milestone]) => milestone)
    .filter(milestone => milestone.projectId === projectId)
  const risks = [...domain.table('risk_issues').entries()]
    .map(([, record]) => record)
    .filter(record => record.projectId === projectId)
  const meetings = [...domain.table('meetings').entries()]
    .map(([, meeting]) => meeting)
    .filter(meeting => meeting.projectId === projectId)
  const reports = [...domain.table('reports').entries()]
    .map(([, report]) => report)
    .filter(report => report.projectId === projectId)
  const deliverables = [...domain.table('deliverables').entries()]
    .map(([, deliverable]) => deliverable)
    .filter(deliverable => deliverable.projectId === projectId)

  const taskDone = tasks.filter(task => task.status === 'done').length
  const taskInProgress = tasks.filter(task => task.status === 'in_progress').length
  const taskBlocked = tasks.filter(task => task.status === 'blocked').length
  const taskTodo = tasks.filter(task => task.status === 'todo').length
  // 逾期口径统一走 derived.isTaskOverdue（未完成 且 progress<100 且 dueDate<today）。
  const overdueTasks = tasks.filter(task => isTaskOverdue(task, today)).length
  const openRisks = risks.filter(record => record.status !== 'closed')
  const openRiskByImpact = zeroImpact()
  for (const record of openRisks) openRiskByImpact[record.impact] += 1
  const milestoneOverdue = milestones.filter(milestone =>
    isMilestoneMissed(milestone, today)).length
  const milestoneAchieved = milestones.filter(milestone => milestone.status === 'achieved').length
  const deliverableByStatus = zeroDeliverable()
  for (const deliverable of deliverables) deliverableByStatus[deliverable.status] += 1

  return {
    projectId,
    projectName,
    status: projectStatus,
    taskTotal: tasks.length,
    taskDone,
    taskInProgress,
    taskTodo,
    taskBlocked,
    completionRate: tasks.length ? Math.round(taskDone / tasks.length * 100) : 0,
    overdueTasks,
    milestoneTotal: milestones.length,
    milestoneAchieved,
    milestoneOverdue,
    openRiskCount: openRisks.length,
    openRiskByImpact,
    meetingCount: meetings.length,
    reportCount: reports.length,
    deliverableByStatus,
  }
}

/**
 * 统计聚合。projectId 缺省时汇总全部项目并给出逐项目明细；否则只统计该项目。
 */
export function collectStats(domain: PmDomain, projectId?: string, today?: string): StatsReport {
  const day = today ?? todayString()
  const projects = [...domain.table('projects').entries()]
    .map(([id, project]) => ({ id, project }))
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))

  let scoped = projects
  if (projectId) {
    projectIdSchema.parse(projectId)
    if (!domain.table('projects').get(projectId)) {
      throw new StatsProjectNotFoundError(`未找到项目：${projectId}`)
    }
    scoped = projects.filter(item => item.id === projectId)
  }

  const projectStats: ProjectStats[] = scoped.map(item =>
    statsForProject(domain, item.id, item.project.name, item.project.status, day))

  const projectStatusCount: Record<string, number> = {}
  for (const item of scoped) {
    projectStatusCount[item.project.status] = (projectStatusCount[item.project.status] ?? 0) + 1
  }

  const sum = (pick: (stat: ProjectStats) => number): number =>
    projectStats.reduce((total, stat) => total + pick(stat), 0)

  return {
    scope: projectId ? 'project' : 'all',
    today: day,
    projectCount: scoped.length,
    projectStatusCount,
    totals: {
      taskTotal: sum(stat => stat.taskTotal),
      taskDone: sum(stat => stat.taskDone),
      taskOverdue: sum(stat => stat.overdueTasks),
      milestoneTotal: sum(stat => stat.milestoneTotal),
      milestoneOverdue: sum(stat => stat.milestoneOverdue),
      openRisk: sum(stat => stat.openRiskCount),
      meetingCount: sum(stat => stat.meetingCount),
      reportCount: sum(stat => stat.reportCount),
      deliverableCount: sum(stat =>
        stat.deliverableByStatus.planned + stat.deliverableByStatus.in_progress
        + stat.deliverableByStatus.submitted + stat.deliverableByStatus.accepted),
    },
    projects: projectStats,
  }
}
