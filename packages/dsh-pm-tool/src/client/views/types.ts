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
