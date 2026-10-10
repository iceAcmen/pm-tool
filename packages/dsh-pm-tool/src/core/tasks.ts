/** WBS 任务增查逻辑：父子关系、同级顺序和编号统一在领域写队列中生成。 */
import { projectIdSchema } from './project.js'
import { enqueueDomainWrite } from './projects.js'
import { taskCreateSchema, taskIdSchema, taskWriteSchema, type Task } from './task.js'
import type { PmDomain } from './storage.js'

export class TaskProjectNotFoundError extends Error {}
export class ParentTaskNotFoundError extends Error {}
export class ParentTaskProjectMismatchError extends Error {}

export function addTask(domain: PmDomain, input: unknown): Promise<Task> {
  const fields = taskCreateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(fields.projectId)) {
      throw new TaskProjectNotFoundError(`未找到项目：${fields.projectId}`)
    }
    const table = domain.table('tasks')
    const parent = fields.parentId ? table.get(fields.parentId) : undefined
    if (fields.parentId && !parent) throw new ParentTaskNotFoundError(`未找到父任务：${fields.parentId}`)
    if (parent && parent.projectId !== fields.projectId) {
      throw new ParentTaskProjectMismatchError('父任务不属于指定项目')
    }

    let maxId = 0n
    let maxOrder = 0
    for (const [id, task] of table.entries()) {
      const match = /^t-(\d+)$/.exec(id)
      if (match && BigInt(match[1]) > maxId) maxId = BigInt(match[1])
      if (task.projectId === fields.projectId && task.parentId === fields.parentId && task.order > maxOrder) {
        maxOrder = task.order
      }
    }
    const id = `t-${String(maxId + 1n).padStart(4, '0')}`
    const order = maxOrder + 1
    const code = parent ? `${parent.code}.${order}` : String(order)
    const at = new Date().toISOString()
    const record = taskWriteSchema.parse({
      ...fields,
      id,
      code,
      order,
      createdAt: at,
      updatedAt: at,
    })
    await table.put(id, record)
    return structuredClone(record)
  })
}

function compareCodes(left: string, right: string): number {
  const a = left.split('.').map(Number)
  const b = right.split('.').map(Number)
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] ?? -1) !== (b[index] ?? -1)) return (a[index] ?? -1) - (b[index] ?? -1)
  }
  return 0
}

export function listTasks(domain: PmDomain, projectId: string): Task[] {
  projectIdSchema.parse(projectId)
  if (!domain.table('projects').get(projectId)) throw new TaskProjectNotFoundError(`未找到项目：${projectId}`)
  return [...domain.table('tasks').entries()]
    .map(([, task]) => task)
    .filter(task => task.projectId === projectId)
    .map(task => structuredClone(task))
    .sort((a, b) => compareCodes(a.code, b.code))
}

export function getTask(domain: PmDomain, id: string): Task | undefined {
  taskIdSchema.parse(id)
  const record = domain.table('tasks').get(id)
  return record ? structuredClone(record) : undefined
}
