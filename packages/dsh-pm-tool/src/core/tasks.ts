/** WBS 任务增查逻辑：父子关系、同级顺序和编号统一在领域写队列中生成。 */
import { projectIdSchema } from './project.js'
import { enqueueDomainWrite } from './projects.js'
import {
  taskCreateSchema,
  taskIdSchema,
  taskUpdateSchema,
  taskWriteSchema,
  type Task,
  type TaskUpdate,
} from './task.js'
import type { PmDomain } from './storage.js'

export class TaskProjectNotFoundError extends Error {}
export class ParentTaskNotFoundError extends Error {}
export class ParentTaskProjectMismatchError extends Error {}
export class TaskHasChildrenError extends Error {}
export class TaskMoveCycleError extends Error {}
export class TaskMilestoneNotFoundError extends Error {}
export class TaskMilestoneProjectMismatchError extends Error {}
export class TaskReferencedByMeetingError extends Error {}

function validateMilestoneRelation(domain: PmDomain, projectId: string, milestoneId: string | null): void {
  if (!milestoneId) return
  const milestone = domain.table('milestones').get(milestoneId)
  if (!milestone) throw new TaskMilestoneNotFoundError(`未找到里程碑：${milestoneId}`)
  if (milestone.projectId !== projectId) {
    throw new TaskMilestoneProjectMismatchError('里程碑不属于指定项目')
  }
}

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
    validateMilestoneRelation(domain, fields.projectId, fields.milestoneId)

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

function compareSiblingOrder(left: Task, right: Task): number {
  return left.order - right.order || left.id.localeCompare(right.id, 'en', { numeric: true })
}

function flattenTaskTree(tasks: Task[]): Task[] {
  const children = new Map<string | null, Task[]>()
  for (const task of tasks) {
    const siblings = children.get(task.parentId) ?? []
    siblings.push(task)
    children.set(task.parentId, siblings)
  }
  for (const siblings of children.values()) siblings.sort(compareSiblingOrder)

  const result: Task[] = []
  const visited = new Set<string>()
  const visit = (parentId: string | null): void => {
    for (const task of children.get(parentId) ?? []) {
      if (visited.has(task.id)) continue
      visited.add(task.id)
      result.push(task)
      visit(task.id)
    }
  }
  visit(null)
  // 兼容历史异常数据：孤儿或循环记录仍可查询，不让列表无限递归。
  for (const task of [...tasks].sort((a, b) => compareCodes(a.code, b.code))) {
    if (!visited.has(task.id)) result.push(task)
  }
  return result
}

export function listTasks(domain: PmDomain, projectId: string): Task[] {
  projectIdSchema.parse(projectId)
  if (!domain.table('projects').get(projectId)) throw new TaskProjectNotFoundError(`未找到项目：${projectId}`)
  const tasks = [...domain.table('tasks').entries()]
    .map(([, task]) => task)
    .filter(task => task.projectId === projectId)
    .map(task => structuredClone(task))
  return flattenTaskTree(tasks)
}

export function getTask(domain: PmDomain, id: string): Task | undefined {
  taskIdSchema.parse(id)
  const record = domain.table('tasks').get(id)
  return record ? structuredClone(record) : undefined
}

export function updateTask(domain: PmDomain, id: string, input: unknown): Promise<Task | undefined> {
  taskIdSchema.parse(id)
  const fields: TaskUpdate = taskUpdateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('tasks')
    const current = table.get(id)
    if (!current) return undefined
    if (fields.milestoneId !== undefined) {
      validateMilestoneRelation(domain, current.projectId, fields.milestoneId)
    }
    const nextInput: Record<string, unknown> = {
      ...current,
      ...fields,
      id: current.id,
      projectId: current.projectId,
      parentId: current.parentId,
      code: current.code,
      order: current.order,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    if (fields.startDate === null) delete nextInput.startDate
    if (fields.dueDate === null) delete nextInput.dueDate
    const next = taskWriteSchema.parse(nextInput)
    await table.put(id, next)
    return structuredClone(next)
  })
}

export function deleteTask(domain: PmDomain, id: string): Promise<Task | undefined> {
  taskIdSchema.parse(id)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('tasks')
    const current = table.get(id)
    if (!current) return undefined
    for (const [, task] of table.entries()) {
      if (task.parentId === id) throw new TaskHasChildrenError(`任务 ${id} 仍有子任务`)
    }
    for (const [, meeting] of domain.table('meetings').entries()) {
      if (meeting.actions.some(action => action.taskId === id)) {
        throw new TaskReferencedByMeetingError(`任务 ${id} 仍被会议 ${meeting.id} 的行动项关联`)
      }
    }
    await table.delete(id)
    return structuredClone(current)
  })
}

export function moveTask(
  domain: PmDomain,
  id: string,
  newParentId: string | null,
): Promise<Task | undefined> {
  taskIdSchema.parse(id)
  if (newParentId !== null) taskIdSchema.parse(newParentId)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('tasks')
    const current = table.get(id)
    if (!current) return undefined
    if (newParentId === id) throw new TaskMoveCycleError('任务不能移动到自身下')
    const parent = newParentId ? table.get(newParentId) : undefined
    if (newParentId && !parent) throw new ParentTaskNotFoundError(`未找到父任务：${newParentId}`)
    if (parent && parent.projectId !== current.projectId) {
      throw new ParentTaskProjectMismatchError('父任务不属于当前任务的项目')
    }

    let ancestor = parent
    const visited = new Set<string>()
    while (ancestor) {
      if (ancestor.id === id) throw new TaskMoveCycleError('不能把任务移动到其子孙任务下')
      if (visited.has(ancestor.id)) throw new TaskMoveCycleError('任务树存在循环关系，无法移动')
      visited.add(ancestor.id)
      ancestor = ancestor.parentId ? table.get(ancestor.parentId) : undefined
    }

    let maxOrder = 0
    for (const [, task] of table.entries()) {
      if (task.projectId === current.projectId
        && task.parentId === newParentId
        && task.id !== id
        && task.order > maxOrder) {
        maxOrder = task.order
      }
    }
    const next = taskWriteSchema.parse({
      ...current,
      parentId: newParentId,
      order: maxOrder + 1,
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

export function renumberTasks(domain: PmDomain, projectId: string): Promise<Task[]> {
  projectIdSchema.parse(projectId)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(projectId)) {
      throw new TaskProjectNotFoundError(`未找到项目：${projectId}`)
    }
    const table = domain.table('tasks')
    const tasks = [...table.entries()]
      .map(([, task]) => task)
      .filter(task => task.projectId === projectId)
    const children = new Map<string | null, Task[]>()
    for (const task of tasks) {
      const siblings = children.get(task.parentId) ?? []
      siblings.push(task)
      children.set(task.parentId, siblings)
    }
    for (const siblings of children.values()) siblings.sort(compareSiblingOrder)

    const planned: Task[] = []
    const visited = new Set<string>()
    const visit = (parentId: string | null, parentCode?: string): void => {
      const siblings = children.get(parentId) ?? []
      siblings.forEach((task, index) => {
        if (visited.has(task.id)) throw new TaskMoveCycleError('任务树存在循环关系，无法重新编号')
        visited.add(task.id)
        const order = index + 1
        const code = parentCode ? `${parentCode}.${order}` : String(order)
        planned.push(taskWriteSchema.parse({
          ...task,
          order,
          code,
          updatedAt: new Date().toISOString(),
        }))
        visit(task.id, code)
      })
    }
    visit(null)
    if (visited.size !== tasks.length) {
      throw new TaskMoveCycleError('任务树存在孤儿或循环关系，无法重新编号')
    }
    const originals = new Map(tasks.map(task => [task.id, task]))
    const written: Task[] = []
    try {
      for (const task of planned) {
        await table.put(task.id, task)
        written.push(task)
      }
    } catch (error) {
      const rollbackErrors: unknown[] = []
      for (const task of written.reverse()) {
        try {
          await table.put(task.id, originals.get(task.id)!)
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError)
        }
      }
      if (rollbackErrors.length) {
        throw new AggregateError([error, ...rollbackErrors], '任务重新编号失败，且部分记录恢复失败')
      }
      throw error
    }
    return planned.map(task => structuredClone(task))
  })
}
