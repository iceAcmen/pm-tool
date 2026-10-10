/** 项目增查逻辑：无模型依赖，持久化统一交给 storage-domain。 */
import { projectCreateSchema, projectIdSchema, projectRecordSchema, type Project } from './project.js'
import type { PmDomain } from './storage.js'

// 按领域共享新增队列，编号分配与写盘一起排队；失败不阻塞后续新增。
const createQueues = new WeakMap<PmDomain, Promise<void>>()

export function addProject(domain: PmDomain, input: unknown): Promise<Project> {
  const fields = projectCreateSchema.parse(input)
  const result = (createQueues.get(domain) ?? Promise.resolve()).then(async () => {
    const table = domain.table('projects')
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
    const record = projectRecordSchema.parse({ ...fields, id, createdAt: at, updatedAt: at })
    await table.put(id, record)
    // dsh get/entries 返回内存原对象；业务层返回副本，避免意外原地修改。
    return structuredClone(record)
  })
  createQueues.set(domain, result.then(() => {}, () => {}))
  return result
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
