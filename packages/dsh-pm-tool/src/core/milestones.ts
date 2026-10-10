/** 里程碑增查逻辑：无模型依赖，写操作复用领域业务队列。 */
import { projectIdSchema } from './project.js'
import { enqueueDomainWrite } from './projects.js'
import {
  milestoneCreateSchema,
  milestoneIdSchema,
  milestoneUpdateSchema,
  milestoneWriteSchema,
  type Milestone,
  type MilestoneUpdate,
} from './milestone.js'
import type { PmDomain } from './storage.js'

export class MilestoneProjectNotFoundError extends Error {}
export class MilestoneHasTasksError extends Error {}

export function addMilestone(domain: PmDomain, input: unknown): Promise<Milestone> {
  const fields = milestoneCreateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(fields.projectId)) {
      throw new MilestoneProjectNotFoundError(`未找到项目：${fields.projectId}`)
    }
    const table = domain.table('milestones')
    let max = 0n
    for (const key of table.keys()) {
      const match = /^m-(\d+)$/.exec(key)
      if (match && BigInt(match[1]) > max) max = BigInt(match[1])
    }
    const id = `m-${String(max + 1n).padStart(4, '0')}`
    const at = new Date().toISOString()
    const record = milestoneWriteSchema.parse({ ...fields, id, createdAt: at, updatedAt: at })
    await table.put(id, record)
    return structuredClone(record)
  })
}

export function listMilestones(domain: PmDomain, projectId: string): Milestone[] {
  projectIdSchema.parse(projectId)
  if (!domain.table('projects').get(projectId)) {
    throw new MilestoneProjectNotFoundError(`未找到项目：${projectId}`)
  }
  return [...domain.table('milestones').entries()]
    .map(([, milestone]) => milestone)
    .filter(milestone => milestone.projectId === projectId)
    .map(milestone => structuredClone(milestone))
    .sort((left, right) =>
      left.targetDate.localeCompare(right.targetDate)
      || left.id.localeCompare(right.id, 'en', { numeric: true }),
    )
}

export function getMilestone(domain: PmDomain, id: string): Milestone | undefined {
  milestoneIdSchema.parse(id)
  const record = domain.table('milestones').get(id)
  return record ? structuredClone(record) : undefined
}

export function updateMilestone(
  domain: PmDomain,
  id: string,
  input: unknown,
): Promise<Milestone | undefined> {
  milestoneIdSchema.parse(id)
  const fields: MilestoneUpdate = milestoneUpdateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('milestones')
    const current = table.get(id)
    if (!current) return undefined
    const next = milestoneWriteSchema.parse({
      ...current,
      ...fields,
      id: current.id,
      projectId: current.projectId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

export function deleteMilestone(domain: PmDomain, id: string): Promise<Milestone | undefined> {
  milestoneIdSchema.parse(id)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('milestones')
    const current = table.get(id)
    if (!current) return undefined
    for (const [, task] of domain.table('tasks').entries()) {
      if (task.milestoneId === id) throw new MilestoneHasTasksError(`里程碑 ${id} 仍有关联任务`)
    }
    await table.delete(id)
    return structuredClone(current)
  })
}
