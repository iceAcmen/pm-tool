/** 进度汇报 CRUD：生成时聚合并固化快照，后续源数据变化不回写。 */
import {
  progressReportGenerateSchema,
  progressReportIdSchema,
  progressReportRecordSchema,
  progressReportStatusSchema,
  progressReportUpdateSchema,
  type ProgressReport,
  type ProgressReportStatus,
  type ProgressSnapshot,
} from './progress-report.js'
import { projectIdSchema } from './project.js'
import { enqueueDomainWrite } from './projects.js'
import type { PmDomain } from './storage.js'

export class ProgressReportProjectNotFoundError extends Error {}

function inRange(value: string, start: string, end: string): boolean {
  return value >= start && value <= end
}

function collectSnapshot(
  domain: PmDomain,
  projectId: string,
  start: string,
  end: string,
  snapshotAt: string,
): ProgressSnapshot {
  const project = domain.table('projects').get(projectId)!
  const tasks = [...domain.table('tasks').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId)
  const milestones = [...domain.table('milestones').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId)
  const meetings = [...domain.table('meetings').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId && inRange(item.meetingDate, start, end))
  const riskIssues = [...domain.table('risk_issues').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId)
  const today = snapshotAt.slice(0, 10)
  const exceptions: ProgressSnapshot['exceptions'] = []

  for (const task of tasks) {
    if (task.status === 'blocked') {
      exceptions.push({
        kind: 'blocked_task', severity: 'critical', id: task.id, title: task.title,
        detail: '任务当前处于受阻状态', owner: task.assignee, dueDate: task.dueDate ?? null,
      })
    }
    if (task.status !== 'done' && task.dueDate && task.dueDate < today) {
      exceptions.push({
        kind: 'overdue_task', severity: 'critical', id: task.id, title: task.title,
        detail: `任务已逾期，当前进度 ${task.progress}%`, owner: task.assignee, dueDate: task.dueDate,
      })
    }
  }
  for (const milestone of milestones.filter(item => ['at_risk', 'missed'].includes(item.status))) {
    exceptions.push({
      kind: 'milestone',
      severity: milestone.status === 'missed' ? 'critical' : 'warning',
      id: milestone.id,
      title: milestone.title,
      detail: milestone.status === 'missed' ? '里程碑已错过' : '里程碑存在风险',
      owner: '',
      dueDate: milestone.targetDate,
    })
  }
  for (const item of riskIssues.filter(item =>
    item.status !== 'closed' && ['high', 'critical'].includes(item.impact))) {
    exceptions.push({
      kind: 'risk_issue',
      severity: item.impact === 'critical' ? 'critical' : 'warning',
      id: item.id,
      title: item.title,
      detail: `${item.type === 'risk' ? '风险' : '问题'}未关闭，影响为 ${item.impact}`,
      owner: item.owner,
      dueDate: item.dueDate,
    })
  }
  for (const [, meeting] of domain.table('meetings').entries()) {
    if (meeting.projectId !== projectId) continue
    for (const action of meeting.actions) {
      if (!['done', 'cancelled'].includes(action.status) && action.dueDate && action.dueDate < today) {
        exceptions.push({
          kind: 'overdue_action', severity: 'warning', id: `${meeting.id}/${action.id}`,
          title: action.title, detail: `会议行动项已逾期（${meeting.title}）`,
          owner: action.owner, dueDate: action.dueDate,
        })
      }
    }
  }

  const periodMilestones = milestones
    .filter(item => inRange(item.targetDate, start, end)
      || Boolean(item.achievedDate && inRange(item.achievedDate, start, end)))
    .map(item => ({ id: item.id, title: item.title, targetDate: item.targetDate, status: item.status }))
  return {
    project: { name: project.name, owner: project.owner, status: project.status, targetDate: project.targetDate },
    tasks: {
      total: tasks.length,
      todo: tasks.filter(item => item.status === 'todo').length,
      inProgress: tasks.filter(item => item.status === 'in_progress').length,
      blocked: tasks.filter(item => item.status === 'blocked').length,
      done: tasks.filter(item => item.status === 'done').length,
      averageProgress: tasks.length
        ? Math.round(tasks.reduce((sum, item) => sum + item.progress, 0) / tasks.length)
        : 0,
    },
    milestones: {
      total: milestones.length,
      achieved: milestones.filter(item => item.status === 'achieved').length,
      atRisk: milestones.filter(item => item.status === 'at_risk').length,
      missed: milestones.filter(item => item.status === 'missed').length,
    },
    meetings: {
      inPeriod: meetings.length,
      decisions: meetings.reduce((sum, item) => sum + item.decisions.length, 0),
    },
    periodMilestones,
    periodMeetings: meetings.map(item => ({
      id: item.id, title: item.title, meetingDate: item.meetingDate, decisions: [...item.decisions],
    })),
    exceptions: exceptions.sort((a, b) =>
      (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1)
      || (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
      || a.id.localeCompare(b.id, 'en', { numeric: true }),
    ),
  }
}

export function generateProgressReport(domain: PmDomain, input: unknown): Promise<ProgressReport> {
  const fields = progressReportGenerateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(fields.projectId)) {
      throw new ProgressReportProjectNotFoundError(`未找到项目：${fields.projectId}`)
    }
    const table = domain.table('reports')
    let max = 0n
    for (const key of table.keys()) {
      const match = /^rpt-(\d+)$/.exec(key)
      if (match && BigInt(match[1]) > max) max = BigInt(match[1])
    }
    const id = `rpt-${String(max + 1n).padStart(4, '0')}`
    const at = new Date().toISOString()
    const project = domain.table('projects').get(fields.projectId)!
    const record = progressReportRecordSchema.parse({
      ...fields,
      title: fields.title ?? `${project.name} ${fields.periodStart} 至 ${fields.periodEnd} 进度汇报`,
      id,
      snapshotAt: at,
      snapshot: collectSnapshot(domain, fields.projectId, fields.periodStart, fields.periodEnd, at),
      sourceType: 'manual',
      sourceSessionId: null,
      createdAt: at,
      updatedAt: at,
    })
    await table.put(id, record)
    return structuredClone(record)
  })
}

export function listProgressReports(
  domain: PmDomain,
  projectId: string,
  status?: ProgressReportStatus,
): ProgressReport[] {
  projectIdSchema.parse(projectId)
  if (status) progressReportStatusSchema.parse(status)
  if (!domain.table('projects').get(projectId)) {
    throw new ProgressReportProjectNotFoundError(`未找到项目：${projectId}`)
  }
  return [...domain.table('reports').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId && (!status || item.status === status))
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd) || b.id.localeCompare(a.id))
    .map(item => structuredClone(item))
}

export function getProgressReport(domain: PmDomain, id: string): ProgressReport | undefined {
  progressReportIdSchema.parse(id)
  const record = domain.table('reports').get(id)
  return record ? structuredClone(record) : undefined
}

export function updateProgressReport(domain: PmDomain, id: string, input: unknown): Promise<ProgressReport | undefined> {
  progressReportIdSchema.parse(id)
  const fields = progressReportUpdateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('reports')
    const current = table.get(id)
    if (!current) return undefined
    const next = progressReportRecordSchema.parse({
      ...current,
      ...fields,
      id: current.id,
      projectId: current.projectId,
      periodStart: current.periodStart,
      periodEnd: current.periodEnd,
      snapshotAt: current.snapshotAt,
      snapshot: current.snapshot,
      sourceType: current.sourceType,
      sourceSessionId: current.sourceSessionId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

export function deleteProgressReport(domain: PmDomain, id: string): Promise<ProgressReport | undefined> {
  progressReportIdSchema.parse(id)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('reports')
    const current = table.get(id)
    if (!current) return undefined
    await table.delete(id)
    return structuredClone(current)
  })
}
