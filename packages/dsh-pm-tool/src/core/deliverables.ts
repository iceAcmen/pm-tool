/** 交付物台账 CRUD：无模型依赖；版本/状态变化自动追加留痕，写操作复用领域业务队列。 */
import {
  deliverableCreateSchema,
  deliverableIdSchema,
  deliverableRecordSchema,
  deliverableStatusSchema,
  deliverableUpdateSchema,
  type Deliverable,
  type DeliverableChange,
  type DeliverableStatus,
} from './deliverable.js'
import { projectIdSchema } from './project.js'
import { enqueueDomainWrite } from './projects.js'
import type { PmDomain } from './storage.js'

export class DeliverableProjectNotFoundError extends Error {}

export function addDeliverable(domain: PmDomain, input: unknown): Promise<Deliverable> {
  const fields = deliverableCreateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(fields.projectId)) {
      throw new DeliverableProjectNotFoundError(`未找到项目：${fields.projectId}`)
    }
    const table = domain.table('deliverables')
    let max = 0n
    for (const key of table.keys()) {
      const match = /^dlv-(\d+)$/.exec(key)
      if (match && BigInt(match[1]) > max) max = BigInt(match[1])
    }
    const id = `dlv-${String(max + 1n).padStart(4, '0')}`
    const at = new Date().toISOString()
    const history: DeliverableChange[] = [{
      at,
      field: 'created',
      from: '',
      to: fields.status,
      by: fields.operator,
      note: fields.changeNote || '创建交付物',
    }]
    const record = deliverableRecordSchema.parse({
      projectId: fields.projectId,
      name: fields.name,
      version: fields.version,
      owner: fields.owner,
      status: fields.status,
      location: fields.location,
      description: fields.description,
      dueDate: fields.dueDate,
      history,
      id,
      createdAt: at,
      updatedAt: at,
    })
    await table.put(id, record)
    return structuredClone(record)
  })
}

export function listDeliverables(
  domain: PmDomain,
  projectId: string,
  status?: DeliverableStatus,
): Deliverable[] {
  projectIdSchema.parse(projectId)
  if (status) deliverableStatusSchema.parse(status)
  if (!domain.table('projects').get(projectId)) {
    throw new DeliverableProjectNotFoundError(`未找到项目：${projectId}`)
  }
  return [...domain.table('deliverables').entries()]
    .map(([, record]) => record)
    .filter(record => record.projectId === projectId && (!status || record.status === status))
    .map(record => structuredClone(record))
    .sort((left, right) => left.id.localeCompare(right.id, 'en', { numeric: true }))
}

export function getDeliverable(domain: PmDomain, id: string): Deliverable | undefined {
  deliverableIdSchema.parse(id)
  const record = domain.table('deliverables').get(id)
  return record ? structuredClone(record) : undefined
}

export function updateDeliverable(
  domain: PmDomain,
  id: string,
  input: unknown,
): Promise<Deliverable | undefined> {
  deliverableIdSchema.parse(id)
  const fields = deliverableUpdateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('deliverables')
    const current = table.get(id)
    if (!current) return undefined
    const at = new Date().toISOString()
    const history = [...current.history]
    // 仅在版本或状态确实变化时追加留痕，按状态、版本顺序记录。
    for (const field of ['status', 'version'] as const) {
      const next = fields[field]
      if (next !== undefined && next !== current[field]) {
        history.push({
          at,
          field,
          from: String(current[field]),
          to: String(next),
          by: fields.operator ?? '',
          note: fields.changeNote ?? '',
        })
      }
    }
    const next = deliverableRecordSchema.parse({
      ...current,
      name: fields.name ?? current.name,
      version: fields.version ?? current.version,
      owner: fields.owner ?? current.owner,
      status: fields.status ?? current.status,
      location: fields.location ?? current.location,
      description: fields.description ?? current.description,
      dueDate: fields.dueDate ?? current.dueDate,
      history,
      id: current.id,
      projectId: current.projectId,
      createdAt: current.createdAt,
      updatedAt: at,
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

export function deleteDeliverable(domain: PmDomain, id: string): Promise<Deliverable | undefined> {
  deliverableIdSchema.parse(id)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('deliverables')
    const current = table.get(id)
    if (!current) return undefined
    await table.delete(id)
    return structuredClone(current)
  })
}
