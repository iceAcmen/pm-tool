/**
 * 阶段②结构化查询引擎：筛选 DSL + 排序，字段白名单（方案 §4.3.2）。
 * 不暴露任意字段/任意表达式；所有取值都来自实体已知字段。
 */
import type { Snapshot } from '../panel.js'
import type { FilterRule, SortRule, WidgetEntity } from './types.js'

/** 每个实体可筛选/可排序的字段白名单。value 取自该实体同名字段。 */
export const FIELD_WHITELIST: Record<WidgetEntity, string[]> = {
  projects: ['status', 'owner'],
  tasks: ['status', 'priority', 'assignee', 'dueDate', 'projectId', 'milestoneId'],
  milestones: ['status', 'targetDate', 'projectId'],
  riskIssues: ['type', 'status', 'probability', 'impact', 'projectId'],
  deliverables: ['status', 'dueDate', 'projectId', 'owner'],
  meetings: ['meetingDate', 'projectId'],
  reports: ['projectId'],
}

export interface QueryRow {
  projectId: string
  /** 用于 openRecord 的记录类型。 */
  recordType: string
  id: string
  title: string
  status: string
  date: string | null
  assignee?: string
}

/** 把某实体拍平成统一行（字段取值来自真实 schema，不杜撰）。 */
export function selectEntity(data: Snapshot, entity: WidgetEntity): QueryRow[] {
  switch (entity) {
    case 'tasks':
      return data.tasks.map(t => ({ projectId: t.projectId, recordType: 'task', id: t.id, title: `${t.code} ${t.title}`, status: t.status, date: t.dueDate ?? null, assignee: t.assignee }))
    case 'milestones':
      return data.milestones.map(m => ({ projectId: m.projectId, recordType: 'milestone', id: m.id, title: m.title, status: m.status, date: m.targetDate ?? null }))
    case 'riskIssues':
      return data.riskIssues.map(r => ({ projectId: r.projectId, recordType: r.type === 'issue' ? 'risk-issue' : 'risk', id: r.id, title: r.title, status: r.status, date: r.dueDate, assignee: r.owner }))
    case 'deliverables':
      return data.deliverables.map(d => ({ projectId: d.projectId, recordType: 'deliverable', id: d.id, title: d.name, status: d.status, date: d.dueDate, assignee: d.owner }))
    case 'meetings':
      return data.meetings.map(m => ({ projectId: m.projectId, recordType: 'meeting', id: m.id, title: m.title, status: '', date: m.meetingDate ?? null }))
    case 'reports':
      return data.reports.map(r => ({ projectId: r.projectId, recordType: 'report', id: r.id, title: r.title, status: '', date: (r as { reportDate?: string }).reportDate ?? null }))
    case 'projects':
      return data.projects.map(p => ({ projectId: p.id, recordType: 'project', id: p.id, title: p.name, status: p.status, date: p.targetDate || null, assignee: p.owner }))
  }
}

function getField(row: QueryRow, raw: Record<string, unknown>, field: string): string {
  if (field === 'projectId') return row.projectId
  const v = (raw as Record<string, unknown>)[field]
  return v == null ? '' : String(v)
}

function match(rule: FilterRule, row: QueryRow, raw: Record<string, unknown>): boolean {
  const v = getField(row, raw, rule.field)
  switch (rule.op) {
    case 'eq': return v === rule.value
    case 'ne': return v !== rule.value
    case 'in': return rule.value.split(',').map(s => s.trim()).includes(v)
    case 'gte': return v >= rule.value
    case 'lte': return v <= rule.value
    case 'contains': return v.toLowerCase().includes(rule.value.toLowerCase())
    case 'isEmpty': return v === ''
    default: return true
  }
}

/** 应用项目范围 + 筛选规则。raw 用于按字段名取值（row 已含通用列）。 */
export function applyFilter(
  data: Snapshot,
  entity: WidgetEntity,
  rows: QueryRow[],
  rawList: Array<Record<string, unknown>>,
  projectScope: 'all' | string,
  filters: FilterRule[] | undefined,
): QueryRow[] {
  let out = rows
  let raws = rawList
  if (projectScope !== 'all') {
    out = out.filter(r => r.projectId === projectScope)
    raws = raws.filter((_, i) => rows[i].projectId === projectScope)
  }
  if (filters && filters.length) {
    out = out.filter((r, i) => filters.every(f => match(f, r, raws[i])))
  }
  return out
}

export function applySort(rows: QueryRow[], sort: SortRule | null | undefined): QueryRow[] {
  if (!sort) return rows
  const arr = [...rows]
  arr.sort((a, b) => {
    const av = sort.field === 'date' ? (a.date ?? '') : a[sort.field as keyof QueryRow] == null ? '' : String(a[sort.field as keyof QueryRow])
    const bv = sort.field === 'date' ? (b.date ?? '') : b[sort.field as keyof QueryRow] == null ? '' : String(b[sort.field as keyof QueryRow])
    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })
  return arr
}
