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
import { omitEmptyRepoKeys } from './repo.js'
import { enqueueDomainWrite } from './projects.js'
import { ensureReflectionOnDeliverable } from './reflect.js'
import type { PmDomain } from './storage.js'

export class DeliverableProjectNotFoundError extends Error {}
export class DeliverableMilestoneNotFoundError extends Error {}

/** U5：milestoneId 非空时校验目标里程碑存在且同项目；null/undefined 表示不关联。 */
function assertMilestoneInProject(domain: PmDomain, projectId: string, milestoneId: string | null | undefined): void {
  if (!milestoneId) return
  const row = domain.table('milestones').get(milestoneId) as { projectId?: string } | undefined
  if (!row || row.projectId !== projectId) {
    throw new DeliverableMilestoneNotFoundError(`里程碑不存在或不属于本项目：${milestoneId}`)
  }
}

export function addDeliverable(domain: PmDomain, input: unknown): Promise<Deliverable> {
  const fields = deliverableCreateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(fields.projectId)) {
      throw new DeliverableProjectNotFoundError(`未找到项目：${fields.projectId}`)
    }
    assertMilestoneInProject(domain, fields.projectId, fields.milestoneId)
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
    const recordInput: Record<string, unknown> = {
      projectId: fields.projectId,
      name: fields.name,
      version: fields.version,
      owner: fields.owner,
      status: fields.status,
      location: fields.location,
      description: fields.description,
      dueDate: fields.dueDate,
      repoUrl: fields.repoUrl,
      branch: fields.branch,
      milestoneId: fields.milestoneId,
      note: fields.note,
      history,
      id,
      createdAt: at,
      updatedAt: at,
    }
    // 空仓库地址/分支归一为缺键，不留空字符串污染 v2 记录。
    omitEmptyRepoKeys(recordInput)
    const record = deliverableRecordSchema.parse(recordInput)
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
  // X6-L2：是否本次由非 accepted 转入 accepted（在写队列外记录，供落库成功后 best-effort 挂复盘草稿钩子）。
  let becameAccepted = false
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('deliverables')
    const current = table.get(id)
    if (!current) return undefined
    assertMilestoneInProject(domain, current.projectId, fields.milestoneId)
    becameAccepted = current.status !== 'accepted' && fields.status === 'accepted'
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
    const nextInput: Record<string, unknown> = {
      ...current,
      name: fields.name ?? current.name,
      version: fields.version ?? current.version,
      owner: fields.owner ?? current.owner,
      status: fields.status ?? current.status,
      location: fields.location ?? current.location,
      description: fields.description ?? current.description,
      dueDate: fields.dueDate ?? current.dueDate,
      // 仓库链接可独立更新；仅改这两键不追加 history[]（留痕只跟 status/version）。
      repoUrl: fields.repoUrl ?? current.repoUrl,
      branch: fields.branch ?? current.branch,
      milestoneId: fields.milestoneId !== undefined ? fields.milestoneId : (current.milestoneId ?? null),
      note: fields.note ?? current.note ?? '',
      history,
      id: current.id,
      projectId: current.projectId,
      createdAt: current.createdAt,
      updatedAt: at,
    }
    // 空仓库地址/分支归一为缺键（显式传空白即清空），不留空字符串。
    omitEmptyRepoKeys(nextInput)
    const next = deliverableRecordSchema.parse(nextInput)
    await table.put(id, next)
    return structuredClone(next)
  }).then((result) => {
    // X6-L2：交付物已落库为 accepted 后 best-effort 建验收复盘草稿（照 tasks.ts done 钩子单点模式）。
    // 钩子在写队列外链式触发（不嵌套入队、不参与本事务）；失败仅 console.warn，绝不阻断交付物落库。
    if (becameAccepted && result) {
      void ensureReflectionOnDeliverable(domain, result).catch((error: unknown) => {
        console.warn('[pm-tool] 交付验收复盘草稿生成失败（不阻断交付物落库）：', error)
      })
    }
    return result
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
