/** 风险与问题 CRUD：无模型依赖，写操作复用领域业务队列。 */
import { projectIdSchema } from './project.js'
import { enqueueDomainWrite } from './projects.js'
import {
  riskIssueCreateSchema,
  riskIssueIdSchema,
  riskIssueStatusSchema,
  riskIssueTypeSchema,
  riskIssueUpdateSchema,
  riskIssueWriteSchema,
  type RiskIssue,
  type RiskIssueStatus,
  type RiskIssueType,
  type RiskIssueUpdate,
} from './risk-issue.js'
import type { PmDomain } from './storage.js'

export class RiskIssueProjectNotFoundError extends Error {}

export function addRiskIssue(domain: PmDomain, input: unknown): Promise<RiskIssue> {
  const fields = riskIssueCreateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(fields.projectId)) {
      throw new RiskIssueProjectNotFoundError(`未找到项目：${fields.projectId}`)
    }
    const table = domain.table('risk_issues')
    let max = 0n
    for (const key of table.keys()) {
      const match = /^ri-(\d+)$/.exec(key)
      if (match && BigInt(match[1]) > max) max = BigInt(match[1])
    }
    const id = `ri-${String(max + 1n).padStart(4, '0')}`
    const at = new Date().toISOString()
    const record = riskIssueWriteSchema.parse({
      ...fields,
      id,
      createdAt: at,
      updatedAt: at,
    })
    await table.put(id, record)
    return structuredClone(record)
  })
}

export function listRiskIssues(
  domain: PmDomain,
  projectId: string,
  type?: RiskIssueType,
  status?: RiskIssueStatus,
): RiskIssue[] {
  projectIdSchema.parse(projectId)
  if (type) riskIssueTypeSchema.parse(type)
  if (status) riskIssueStatusSchema.parse(status)
  if (!domain.table('projects').get(projectId)) {
    throw new RiskIssueProjectNotFoundError(`未找到项目：${projectId}`)
  }
  return [...domain.table('risk_issues').entries()]
    .map(([, record]) => record)
    .filter(record =>
      record.projectId === projectId
      && (!type || record.type === type)
      && (!status || record.status === status),
    )
    .map(record => structuredClone(record))
    .sort((left, right) => left.id.localeCompare(right.id, 'en', { numeric: true }))
}

export function getRiskIssue(domain: PmDomain, id: string): RiskIssue | undefined {
  riskIssueIdSchema.parse(id)
  const record = domain.table('risk_issues').get(id)
  return record ? structuredClone(record) : undefined
}

export function updateRiskIssue(
  domain: PmDomain,
  id: string,
  input: unknown,
): Promise<RiskIssue | undefined> {
  riskIssueIdSchema.parse(id)
  const fields: RiskIssueUpdate = riskIssueUpdateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('risk_issues')
    const current = table.get(id)
    if (!current) return undefined
    const next = riskIssueWriteSchema.parse({
      ...current,
      ...fields,
      id: current.id,
      projectId: current.projectId,
      type: current.type,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

export function deleteRiskIssue(domain: PmDomain, id: string): Promise<RiskIssue | undefined> {
  riskIssueIdSchema.parse(id)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('risk_issues')
    const current = table.get(id)
    if (!current) return undefined
    await table.delete(id)
    return structuredClone(current)
  })
}
