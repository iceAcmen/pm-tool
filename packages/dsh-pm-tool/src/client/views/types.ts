/**
 * 重设计 v2 视图模块共享类型。
 * 与 panel.tsx 内的实体类型结构完全一致（TS 结构化类型，panel 可直接把自身数据传入）。
 */

export type View = 'tasks' | 'milestones' | 'risk-issues' | 'meetings' | 'reports' | 'deliverables' | 'overview' | 'gantt' | 'people'

/** 写命令执行器（gantt 拖拽等静默更新用）。 */
export type Run = (line: string, options?: { quiet?: boolean }) => Promise<boolean>

export type Project = {
  id: string
  name: string
  description: string
  owner: string
  status: string
  startDate: string
  targetDate: string
  repoUrl?: string
  branch?: string
}

export type Task = {
  id: string
  projectId: string
  parentId: string | null
  code: string
  title: string
  description: string
  assignee: string
  status: string
  priority: string
  startDate?: string
  dueDate?: string
  progress: number
  milestoneId: string | null
  predecessorIds?: string[]
  checklist?: { id: string, text: string, done: boolean }[] | null
  repoUrl?: string
  branch?: string
}

export type Milestone = {
  id: string
  projectId: string
  title: string
  description: string
  targetDate: string
  status: string
  achievedDate: string | null
}

export type RiskIssue = {
  id: string
  projectId: string
  type: 'risk' | 'issue'
  title: string
  description: string
  owner: string
  dueDate: string | null
  status: 'open' | 'monitoring' | 'closed'
  probability: 'low' | 'medium' | 'high' | null
  impact: 'low' | 'medium' | 'high' | 'critical'
  responsePlan: string
  solution: string
}

export type MeetingActionStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'

export type MeetingAction = {
  id: string
  title: string
  owner: string
  dueDate: string | null
  status: MeetingActionStatus
  taskId: string | null
  riskIssueId: string | null
}

// 与 panel.tsx web snapshot 的 Meeting 契约对齐；sourceType/sourceSessionId/createdAt
// 在快照里可能缺省，故置为可选，视图读到 undefined 时按「手动记录」兜底。
export type Meeting = {
  id: string
  projectId: string
  title: string
  meetingDate: string
  startTime: string | null
  durationMinutes: number | null
  location: string
  facilitator: string
  recorder: string
  participants: string[]
  status: 'draft' | 'final'
  summary: string
  topics: string[]
  decisions: string[]
  actions: MeetingAction[]
  notes: string
  sourceType?: 'manual' | 'session'
  sourceSessionId?: string | null
  createdAt?: string
  updatedAt: string
}

export type DeliverableStatus = 'planned' | 'in_progress' | 'submitted' | 'accepted'

export type DeliverableChange = {
  at: string
  field: string
  from: string
  to: string
  by: string
  note: string
}

export type Deliverable = {
  id: string
  projectId: string
  name: string
  version: string
  owner: string
  status: DeliverableStatus
  location: string
  description: string
  dueDate: string | null
  repoUrl?: string
  branch?: string
  milestoneId?: string | null
  history: DeliverableChange[]
  createdAt: string
  updatedAt: string
}

// 与 panel.tsx web snapshot 的汇报快照契约对齐（运行时由 core 生成，含 todo/inProgress）。
export type ProgressException = {
  kind: string
  severity: 'warning' | 'critical'
  id: string
  title: string
  detail: string
  owner: string
  dueDate: string | null
}

export type ProgressSnapshot = {
  project?: { name: string, owner: string, status?: string, targetDate?: string }
  tasks: {
    total: number
    todo: number
    inProgress: number
    blocked: number
    done: number
    averageProgress: number | null
    calcVersion?: number
  }
  milestones: { total: number, achieved: number, atRisk: number, missed: number }
  meetings: { inPeriod: number, decisions: number }
  periodMilestones: { id: string, title: string, targetDate: string, status: string }[]
  periodMeetings: { id: string, title: string, meetingDate: string, decisions: string[] }[]
  exceptions: ProgressException[]
}

export type ProgressReport = {
  id: string
  projectId: string
  title: string
  periodStart: string
  periodEnd: string
  status: 'draft' | 'final'
  executiveSummary: string
  completedWork: string[]
  nextPlans: string[]
  blockers: string[]
  snapshotAt: string
  snapshot: ProgressSnapshot
  sourceType?: 'manual'
  sourceSessionId?: string | null
  createdAt?: string
  updatedAt?: string
}

// people-load 派生（结构与 core/people-load.ts 一致）
export type PersonTask = {
  id: string
  projectId: string
  projectName: string
  code: string
  title: string
  priority?: string
  status: string
  progress: number
  dueDate?: string
  daysUntil: number | null
  bucket: 'overdue' | 'due-soon' | 'open'
}

export type PersonRow = {
  key: string
  display: string
  multiOwner: boolean
  openTotal: number
  todo: number
  inProgress: number
  blocked: number
  overdue: number
  dueSoon: number
  p0: number
  projectCount: number
  nextDue: string | null
  tasks: PersonTask[]
}

export type PeopleLoadReport = {
  today: string
  withinDays: number
  unassigned: PersonRow | null
  people: PersonRow[]
}
