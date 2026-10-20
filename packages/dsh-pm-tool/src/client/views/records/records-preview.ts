/**
 * records 分片（B6）周期本地派生只读预览与摘录 freeze 纯模型。
 *
 * 边界：
 * - 这里只基于 panel 传入的当前 tasks / milestones / meetings / riskIssues 做**只读派生**，
 *   不落盘、不回写 progressLog、不替代 data 的权威快照；仅在无 onPreviewPeriod 权威 dry-run 时回退使用。
 * - 本地预览计数口径与真实快照同向（状态分桶 / 周期内会议 / 风险与逾期），但平均进度为
 *   当前手填值的尽力均值，明确标 `authoritative:false`，不得当作已生成固定快照。
 * - A02：选定 sourceId + revisionId 后 freeze 成不可变副本；原日志/后续编辑不得改动已 freeze 内容。
 *
 * 无 DOM、无随机、无墙钟（时间戳由调用方传入）。
 */

export type LocalPeriodType = 'w' | 'm' | 'c'

export interface PreviewTaskInput {
  id: string
  title: string
  assignee: string
  status: string
  progress: number
  dueDate?: string | null
}

export interface PreviewMilestoneInput {
  id: string
  title: string
  targetDate: string
  status: string
  achievedDate?: string | null
}

export interface PreviewMeetingInput {
  id: string
  title: string
  meetingDate: string
  decisions: string[]
  actions: { id: string, title: string, owner: string, status: string, dueDate: string | null }[]
}

export interface PreviewRiskInput {
  id: string
  type: 'risk' | 'issue'
  title: string
  owner: string
  status: string
  impact: string
  dueDate: string | null
}

export interface PreviewException {
  kind: 'blocked_task' | 'overdue_task' | 'milestone' | 'risk_issue' | 'overdue_action'
  severity: 'warning' | 'critical'
  id: string
  title: string
  detail: string
  owner: string
  dueDate: string | null
}

export interface LocalPreviewSnapshot {
  authoritative: false
  periodType: LocalPeriodType
  tasks: {
    total: number
    todo: number
    inProgress: number
    blocked: number
    done: number
    averageProgress: number | null
  }
  milestones: { total: number, achieved: number, atRisk: number, missed: number }
  meetings: { inPeriod: number, decisions: number }
  periodMilestones: { id: string, title: string, targetDate: string, status: string }[]
  periodMeetings: { id: string, title: string, meetingDate: string, decisions: string[] }[]
  exceptions: PreviewException[]
}

/** 由起止天数推导周期类型：≤10 天周报、≤45 天月报、其余自定义（与列表展示同源）。 */
export function localPeriodType(start: string, end: string): LocalPeriodType {
  const ms = Date.parse(`${end}T00:00:00`) - Date.parse(`${start}T00:00:00`)
  const days = Math.round(ms / 86_400_000)
  if (days <= 10) return 'w'
  if (days <= 45) return 'm'
  return 'c'
}

function inRange(date: string | null | undefined, start: string, end: string): boolean {
  return !!date && date >= start && date <= end
}

function isOverdue(task: PreviewTaskInput, today: string): boolean {
  return !!task.dueDate && task.dueDate < today
    && task.status !== 'done' && task.progress < 100
}

export interface LocalPreviewInput {
  periodStart: string
  periodEnd: string
  today: string
  tasks: PreviewTaskInput[]
  milestones: PreviewMilestoneInput[]
  meetings: PreviewMeetingInput[]
  riskIssues: PreviewRiskInput[]
}

/** 本地只读派生预览（不落盘）。authoritative 恒为 false，区别于 data 固定快照。 */
export function buildLocalPreview(input: LocalPreviewInput): LocalPreviewSnapshot {
  const { periodStart: start, periodEnd: end, today } = input
  const tasks = input.tasks
  const exceptions: PreviewException[] = []

  for (const task of tasks) {
    if (task.status === 'blocked') {
      exceptions.push({
        kind: 'blocked_task', severity: 'critical', id: task.id, title: task.title,
        detail: '任务当前处于受阻状态', owner: task.assignee, dueDate: task.dueDate ?? null,
      })
    }
    if (isOverdue(task, today)) {
      exceptions.push({
        kind: 'overdue_task', severity: 'critical', id: task.id, title: task.title,
        detail: `任务已逾期，当前进度 ${task.progress}%`, owner: task.assignee, dueDate: task.dueDate ?? null,
      })
    }
  }

  for (const ms of input.milestones.filter(m => m.status === 'at_risk' || m.status === 'missed')) {
    exceptions.push({
      kind: 'milestone',
      severity: ms.status === 'missed' ? 'critical' : 'warning',
      id: ms.id, title: ms.title,
      detail: ms.status === 'missed' ? '里程碑已错过' : '里程碑存在风险',
      owner: '', dueDate: ms.targetDate,
    })
  }

  for (const risk of input.riskIssues.filter(r =>
    r.status !== 'closed' && ['high', 'critical'].includes(r.impact))) {
    exceptions.push({
      kind: 'risk_issue',
      severity: risk.impact === 'critical' ? 'critical' : 'warning',
      id: risk.id, title: risk.title,
      detail: `${risk.type === 'risk' ? '风险' : '问题'}未关闭，影响为 ${risk.impact}`,
      owner: risk.owner, dueDate: risk.dueDate,
    })
  }

  for (const meeting of input.meetings) {
    for (const action of meeting.actions) {
      if (!['done', 'cancelled'].includes(action.status) && action.dueDate && action.dueDate < today) {
        exceptions.push({
          kind: 'overdue_action', severity: 'warning',
          id: `${meeting.id}/${action.id}`, title: action.title,
          detail: `会议行动项已逾期（${meeting.title}）`, owner: action.owner, dueDate: action.dueDate,
        })
      }
    }
  }

  const inPeriodMeetings = input.meetings.filter(m => inRange(m.meetingDate, start, end))
  const progressValues = tasks.map(t => Number(t.progress) || 0)
  const averageProgress = progressValues.length
    ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
    : null

  exceptions.sort((a, b) =>
    (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1)
    || (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
    || a.id.localeCompare(b.id, 'en', { numeric: true }),
  )

  return {
    authoritative: false,
    periodType: localPeriodType(start, end),
    tasks: {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      done: tasks.filter(t => t.status === 'done').length,
      averageProgress,
    },
    milestones: {
      total: input.milestones.length,
      achieved: input.milestones.filter(m => m.status === 'achieved').length,
      atRisk: input.milestones.filter(m => m.status === 'at_risk').length,
      missed: input.milestones.filter(m => m.status === 'missed').length,
    },
    meetings: {
      inPeriod: inPeriodMeetings.length,
      decisions: inPeriodMeetings.reduce((sum, m) => sum + m.decisions.length, 0),
    },
    periodMilestones: input.milestones
      .filter(m => inRange(m.targetDate, start, end) || inRange(m.achievedDate, start, end))
      .map(m => ({ id: m.id, title: m.title, targetDate: m.targetDate, status: m.status })),
    periodMeetings: inPeriodMeetings.map(m => ({
      id: m.id, title: m.title, meetingDate: m.meetingDate, decisions: [...m.decisions],
    })),
    exceptions,
  }
}

// ---------- A02：摘录 freeze（不可变副本，不回写原日志） ----------

export interface FrozenSelection<T = unknown> {
  sourceId: string
  revisionId: string
  /** freeze 时刻调用方传入（ISO），纯模型不自行取墙钟。 */
  frozenAt: string
  /** 选定时刻内容的深拷贝；后续原日志编辑不改这里。 */
  snapshot: T
}

/** 深拷贝一份选定内容并冻结；返回新对象，不持有入参引用。 */
export function freezeSelection<T>(sourceId: string, revisionId: string, snapshot: T, frozenAt: string): FrozenSelection<T> {
  return {
    sourceId,
    revisionId,
    frozenAt,
    snapshot: JSON.parse(JSON.stringify(snapshot)) as T,
  }
}

/** 是否已冻结某 sourceId 的某条 revision（用于重开比对 freeze 一致性）。 */
export function isFrozenFor(selection: FrozenSelection | null | undefined, sourceId: string, revisionId: string): boolean {
  return !!selection && selection.sourceId === sourceId && selection.revisionId === revisionId
}
