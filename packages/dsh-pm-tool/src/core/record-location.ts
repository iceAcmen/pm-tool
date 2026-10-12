/**
 * PROD-02：记录直达定位（纯函数）。
 * 给定记录类型，返回应切到的视图 tab 与抽屉 kind；找不到记录时安全回退。
 */

export type RecordType = 'task' | 'milestone' | 'risk' | 'meeting' | 'report' | 'deliverable'

export interface Location {
  view: string
  drawerKind: string
}

const MAP: Record<RecordType, Location> = {
  task: { view: 'tasks', drawerKind: 'task' },
  milestone: { view: 'milestones', drawerKind: 'milestone' },
  risk: { view: 'risk-issues', drawerKind: 'risk-issue' },
  meeting: { view: 'meetings', drawerKind: 'meeting' },
  report: { view: 'reports', drawerKind: 'report' },
  deliverable: { view: 'deliverables', drawerKind: 'deliverable' },
}

export function resolveRecordLocation(type: string): Location | null {
  return (MAP as Record<string, Location>)[type] ?? null
}

/**
 * 在 snapshot 中按 type+id 找到记录；找不到返回 null（调用方据此回退为只切项目）。
 */
export function findRecord(snapshot: {
  tasks?: { id: string }[]
  milestones?: { id: string }[]
  riskIssues?: { id: string }[]
  meetings?: { id: string }[]
  reports?: { id: string }[]
  deliverables?: { id: string }[]
}, type: string, id: string): { record: unknown; projectId?: string } | null {
  const table = ({
    task: 'tasks', milestone: 'milestones', risk: 'riskIssues',
    meeting: 'meetings', report: 'reports', deliverable: 'deliverables',
  } as Record<string, string>)[type]
  if (!table) return null
  const list = (snapshot as Record<string, { id: string; projectId?: string }[] | undefined>)[table] ?? []
  const record = list.find(r => r.id === id)
  return record ? { record, projectId: record.projectId } : null
}
