/** 项目增删改查逻辑：无模型依赖，持久化统一交给 storage-domain。 */
import {
  projectCreateSchema,
  projectIdSchema,
  projectWriteSchema,
  projectUpdateSchema,
  type Project,
  type ProjectUpdate,
} from './project.js'
import type { PmDomain } from './storage.js'

// 跨记录校验与写盘须共享队列，避免并发新增/改名绕过同名检查。
const writeQueues = new WeakMap<PmDomain, Promise<void>>()

export class ProjectNameConflictError extends Error {
  constructor(readonly conflicting: Project) {
    super(`项目名称已存在：${conflicting.name}`)
    this.name = 'ProjectNameConflictError'
  }
}

export function enqueueDomainWrite<T>(domain: PmDomain, operation: () => Promise<T>): Promise<T> {
  const result = (writeQueues.get(domain) ?? Promise.resolve()).then(operation)
  writeQueues.set(domain, result.then(() => {}, () => {}))
  return result
}

function findProjectByName(domain: PmDomain, name: string, exceptId?: string): Project | undefined {
  const normalized = name.trim()
  for (const [id, project] of domain.table('projects').entries()) {
    if (id !== exceptId && project.name === normalized) return project
  }
  return undefined
}

export function addProject(domain: PmDomain, input: unknown, allowDuplicateName = false): Promise<Project> {
  const fields = projectCreateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('projects')
    const conflicting = findProjectByName(domain, fields.name)
    if (conflicting && !allowDuplicateName) throw new ProjectNameConflictError(structuredClone(conflicting))
    let max = 0n
    for (const key of table.keys()) {
      const match = /^p-(\d+)$/.exec(key)
      if (match) {
        const number = BigInt(match[1])
        if (number > max) max = number
      }
    }
    const id = `p-${String(max + 1n).padStart(4, '0')}`
    if (table.get(id)) throw new Error('项目编号已存在，请重新新增')
    const at = new Date().toISOString()
    const record = projectWriteSchema.parse({ ...fields, id, createdAt: at, updatedAt: at })
    await table.put(id, record)
    // dsh get/entries 返回内存原对象；业务层返回副本，避免意外原地修改。
    return structuredClone(record)
  })
}

export function listProjects(domain: PmDomain): Project[] {
  return [...domain.table('projects').entries()]
    .map(([, project]) => structuredClone(project))
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
}

export function getProject(domain: PmDomain, id: string): Project | undefined {
  projectIdSchema.parse(id)
  const record = domain.table('projects').get(id)
  return record ? structuredClone(record) : undefined
}

export function updateProject(
  domain: PmDomain,
  id: string,
  input: unknown,
  allowDuplicateName = false,
): Promise<Project | undefined> {
  projectIdSchema.parse(id)
  const fields: ProjectUpdate = projectUpdateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('projects')
    const current = table.get(id)
    if (!current) return undefined
    const next = projectWriteSchema.parse({
      ...current,
      ...fields,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    const conflicting = fields.name !== undefined && fields.name !== current.name
      ? findProjectByName(domain, next.name, id)
      : undefined
    if (conflicting && !allowDuplicateName) throw new ProjectNameConflictError(structuredClone(conflicting))
    await table.put(id, next)
    return structuredClone(next)
  })
}

export function deleteProject(domain: PmDomain, id: string): Promise<Project | undefined> {
  projectIdSchema.parse(id)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('projects')
    const current = table.get(id)
    if (!current) return undefined
    for (const [, task] of domain.table('tasks').entries()) {
      if (task.projectId === id) throw new ProjectHasTasksError(id)
    }
    for (const [, milestone] of domain.table('milestones').entries()) {
      if (milestone.projectId === id) throw new ProjectHasMilestonesError(id)
    }
    for (const [, record] of domain.table('risk_issues').entries()) {
      if (record.projectId === id) throw new ProjectHasRiskIssuesError(id)
    }
    for (const [, meeting] of domain.table('meetings').entries()) {
      if (meeting.projectId === id) throw new ProjectHasMeetingsError(id)
    }
    for (const [, report] of domain.table('reports').entries()) {
      if (report.projectId === id) throw new ProjectHasReportsError(id)
    }
    for (const [, deliverable] of domain.table('deliverables').entries()) {
      if (deliverable.projectId === id) throw new ProjectHasDeliverablesError(id)
    }
    await table.delete(id)
    return structuredClone(current)
  })
}

export class ProjectHasTasksError extends Error {
  constructor(readonly projectId: string) {
    super(`项目 ${projectId} 仍有任务`)
    this.name = 'ProjectHasTasksError'
  }
}

export class ProjectHasMilestonesError extends Error {
  constructor(readonly projectId: string) {
    super(`项目 ${projectId} 仍有里程碑`)
    this.name = 'ProjectHasMilestonesError'
  }
}

export class ProjectHasRiskIssuesError extends Error {
  constructor(readonly projectId: string) {
    super(`项目 ${projectId} 仍有风险或问题`)
    this.name = 'ProjectHasRiskIssuesError'
  }
}

export class ProjectHasMeetingsError extends Error {
  constructor(readonly projectId: string) {
    super(`项目 ${projectId} 仍有会议纪要`)
    this.name = 'ProjectHasMeetingsError'
  }
}

export class ProjectHasReportsError extends Error {
  constructor(readonly projectId: string) {
    super(`项目 ${projectId} 仍有进度汇报`)
    this.name = 'ProjectHasReportsError'
  }
}

export class ProjectHasDeliverablesError extends Error {
  constructor(readonly projectId: string) {
    super(`项目 ${projectId} 仍有交付物`)
    this.name = 'ProjectHasDeliverablesError'
  }
}
