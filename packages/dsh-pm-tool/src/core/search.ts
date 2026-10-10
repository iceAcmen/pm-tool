/**
 * R12 关键字检索：只读遍历 pmtool 各表，对关键文本字段做不区分大小写子串匹配。
 *
 * 不新增表、不写盘、不改领域版本（仍 version 1）。检索与统计同为「派生视图」，
 * 数据始终以各表当前记录为准；Web 端复用同一 snapshot 在浏览器侧做等价过滤。
 */
import type { PmDomain } from './storage.js'

/** 可检索实体类型；risk 对应 risk_issues 表（风险与问题共用）。 */
export const searchTypes = ['project', 'task', 'milestone', 'risk', 'meeting', 'report', 'deliverable'] as const
export type SearchType = (typeof searchTypes)[number]

export const searchTypeLabels: Record<SearchType, string> = {
  project: '项目',
  task: '任务',
  milestone: '里程碑',
  risk: '风险/问题',
  meeting: '会议纪要',
  report: '进度汇报',
  deliverable: '交付物',
}

export class SearchTypeInvalidError extends Error {}

/** 单条命中：类型、ID、一行摘要与所属项目（项目自身的 projectId 指向自己）。 */
export interface SearchHit {
  type: SearchType
  id: string
  title: string
  projectId: string
  projectName: string
}

function normalize(keyword: string): string {
  return keyword.trim().toLowerCase()
}

function contains(value: unknown, needle: string): boolean {
  if (value === null || value === undefined) return false
  return String(value).toLowerCase().includes(needle)
}

/** 任一给定文本字段命中即算匹配。 */
function matchFields(fields: unknown[], needle: string): boolean {
  return fields.some(field => contains(field, needle))
}

export function validateSearchType(type: string): SearchType {
  if (!(searchTypes as readonly string[]).includes(type)) {
    throw new SearchTypeInvalidError(
      `不支持的检索类型：${type}（可选 ${searchTypes.join(' / ')}）`,
    )
  }
  return type as SearchType
}

/**
 * 全库关键字检索。type 缺省时跨全部七类实体；否则只返回该类。
 * 返回结果按「类型分组顺序 + 项目 + ID」稳定排序，便于命令输出与 Web 渲染。
 */
export function searchPm(domain: PmDomain, keyword: string, type?: SearchType): SearchHit[] {
  const needle = normalize(keyword)
  if (!needle) return []
  const wanted = type ? [type] : [...searchTypes]
  const projectNameById = new Map<string, string>(
    [...domain.table('projects').entries()].map(([id, project]) => [id, project.name]),
  )
  const nameOf = (projectId: string): string =>
    projectNameById.get(projectId) ?? projectNameById.get('') ?? '（未关联项目）'

  const hits: SearchHit[] = []
  const push = (
    typeName: SearchType,
    id: string,
    title: string,
    projectId: string,
  ): void => {
    hits.push({ type: typeName, id, title, projectId, projectName: nameOf(projectId) })
  }

  if (wanted.includes('project')) {
    for (const [id, project] of domain.table('projects').entries()) {
      if (matchFields([project.name, project.description, project.owner, id], needle)) {
        push('project', id, project.name, id)
      }
    }
  }
  if (wanted.includes('task')) {
    for (const [id, task] of domain.table('tasks').entries()) {
      if (matchFields([task.title, task.description, task.assignee, id, task.code], needle)) {
        push('task', id, task.title, task.projectId)
      }
    }
  }
  if (wanted.includes('milestone')) {
    for (const [id, milestone] of domain.table('milestones').entries()) {
      if (matchFields([milestone.title, milestone.description, id], needle)) {
        push('milestone', id, milestone.title, milestone.projectId)
      }
    }
  }
  if (wanted.includes('risk')) {
    for (const [id, record] of domain.table('risk_issues').entries()) {
      if (matchFields([
        record.title, record.description, record.owner, id, record.responsePlan, record.solution,
      ], needle)) {
        push('risk', id, record.title, record.projectId)
      }
    }
  }
  if (wanted.includes('meeting')) {
    for (const [id, meeting] of domain.table('meetings').entries()) {
      const actionTitles = meeting.actions.map(action => action.title)
      if (matchFields([meeting.title, meeting.summary, meeting.location, meeting.facilitator,
        meeting.recorder, id, ...actionTitles], needle)) {
        push('meeting', id, meeting.title, meeting.projectId)
      }
    }
  }
  if (wanted.includes('report')) {
    for (const [id, report] of domain.table('reports').entries()) {
      if (matchFields([report.title, report.executiveSummary, id], needle)) {
        push('report', id, report.title, report.projectId)
      }
    }
  }
  if (wanted.includes('deliverable')) {
    for (const [id, deliverable] of domain.table('deliverables').entries()) {
      if (matchFields([
        deliverable.name, deliverable.version, deliverable.location, deliverable.description, id,
      ], needle)) {
        push('deliverable', id, deliverable.name, deliverable.projectId)
      }
    }
  }

  // 按类型声明顺序、再按项目、最后按 ID 排序，保证输出稳定。
  const typeOrder = new Map(searchTypes.map((value, index) => [value, index]))
  return hits.sort((a, b) =>
    (typeOrder.get(a.type)! - typeOrder.get(b.type)!)
    || a.projectId.localeCompare(b.projectId)
    || a.id.localeCompare(b.id, 'en', { numeric: true }),
  )
}
