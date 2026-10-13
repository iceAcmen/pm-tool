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
export class TaskReferencedByPredecessorError extends Error {}

function validateMilestoneRelation(domain: PmDomain, projectId: string, milestoneId: string | null): void {
  if (!milestoneId) return
  const milestone = domain.table('milestones').get(milestoneId)
  if (!milestone) throw new TaskMilestoneNotFoundError(`未找到里程碑：${milestoneId}`)
  if (milestone.projectId !== projectId) {
    throw new TaskMilestoneProjectMismatchError('里程碑不属于指定项目')
  }
}

/** PROD-11：归一化前置依赖——空数组视为「不设置」，落盘时缺键，不写空数组污染 v2 记录。 */
function normalizePredecessorIds(ids: string[] | undefined): string[] | undefined {
  if (!ids || ids.length === 0) return undefined
  return [...new Set(ids)]
}

/**
 * PROD-11：前置依赖写时校验。每个 id 必须存在、与任务同项目、不得自指；
 * 沿「依赖于」边从待写入的前置集合 BFS，若能走回到当前任务 id 即成环，拒绝。
 * 校验通过返回归一化后的去重 id 列表（可能为 undefined 表示无前缀）。
 */
function validatePredecessorRelation(
  domain: PmDomain,
  projectId: string,
  taskId: string,
  ids: string[] | undefined,
): string[] | undefined {
  const normalized = normalizePredecessorIds(ids)
  if (!normalized) return undefined
  const table = domain.table('tasks')
  for (const pid of normalized) {
    if (pid === taskId) throw new Error('前置依赖不能包含任务自身')
    const pre = table.get(pid)
    if (!pre) throw new Error(`前置依赖任务不存在：${pid}`)
    if (pre.projectId !== projectId) throw new Error(`前置依赖任务 ${pid} 不属于当前项目`)
  }
  // 成环检测：从每个前置沿既有 predecessorIds BFS，能回到 taskId 即成环。
  const seen = new Set<string>()
  const queue = [...normalized]
  while (queue.length) {
    const cur = queue.shift()!
    if (cur === taskId) throw new Error('前置依赖存在循环：任务不能间接地依赖自己')
    if (seen.has(cur)) continue
    seen.add(cur)
    const rec = table.get(cur)
    if (!rec) continue
    for (const next of rec.predecessorIds ?? []) queue.push(next)
  }
  return normalized
}

/** PROD-11 删除保护：任何其他任务把 id 列为前置依赖时，拒绝删除并点名引用方。 */
function assertNoPredecessorReferences(domain: PmDomain, id: string): void {
  for (const [, task] of domain.table('tasks').entries()) {
    if (task.id === id) continue
    if (task.predecessorIds?.includes(id)) {
      throw new TaskReferencedByPredecessorError(`任务 ${id} 仍被任务 ${task.id} 作为前置依赖，请先在 ${task.id} 解除`)
    }
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
    const predecessorIds = validatePredecessorRelation(domain, fields.projectId, id, fields.predecessorIds)
    const record = taskWriteSchema.parse({
      ...fields,
      ...(predecessorIds ? { predecessorIds } : {}),
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
    if (fields.predecessorIds !== undefined) {
      // 整体替换：显式传即覆盖；空数组归一为缺键（清空前置）。
      const normalized = validatePredecessorRelation(domain, current.projectId, current.id, fields.predecessorIds)
      if (normalized) nextInput.predecessorIds = normalized
      else delete nextInput.predecessorIds
    }
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
    assertNoPredecessorReferences(domain, id)
    for (const [, meeting] of domain.table('meetings').entries()) {
      if (meeting.actions.some(action => action.taskId === id)) {
        throw new TaskReferencedByMeetingError(`任务 ${id} 仍被会议 ${meeting.id} 的行动项关联`)
      }
    }
    await table.delete(id)
    return structuredClone(current)
  })
}

/**
 * PROD-11 只读派生：返回该任务尚未完成的前置依赖（status !== 'done'）。
 * 仅用于行内「等待前置」标签；绝不回写任务 status。悬空/不存在的前置按缺失忽略（由 doctor 报告）。
 */
export { blockingPredecessors } from './derived.js'
export type { PredecessorNode } from './derived.js'

/** 收集某任务及其全部后代（按 id 遍历 parentId 链）；用于级联删除 dry-run 预览。 */
export function collectTaskSubtree(domain: PmDomain, id: string): Task[] {
  taskIdSchema.parse(id)
  const table = domain.table('tasks')
  const root = table.get(id)
  if (!root) return []
  const byParent = new Map<string, Task[]>()
  for (const [key, task] of table.entries()) {
    if (task.parentId) {
      const list = byParent.get(task.parentId) ?? []
      list.push(task)
      byParent.set(task.parentId, list)
    }
  }
  const result: Task[] = []
  const queue: Task[] = [root]
  const seen = new Set<string>([root.id])
  while (queue.length) {
    const node = queue.shift()!
    result.push(node)
    for (const child of byParent.get(node.id) ?? []) {
      if (!seen.has(child.id)) {
        seen.add(child.id)
        queue.push(child)
      }
    }
  }
  return result.map(task => structuredClone(task))
}

/**
 * 显式级联删除：删除该任务及其全部后代。删除前检查整棵子树是否被会议行动项引用，
 * 任一被引用即拒绝（与单删一致的跨表保护）。返回被删除的任务 id 列表。
 */
export function deleteTaskCascade(domain: PmDomain, id: string): Promise<string[]> {
  taskIdSchema.parse(id)
  return enqueueDomainWrite(domain, async () => {
    const subtree = collectTaskSubtree(domain, id)
    if (!subtree.length) return []
    const subtreeIds = new Set(subtree.map(task => task.id))
    // 级联删除保护：子树外的任务若把子树成员列为前置依赖，删除后会悬空，拒绝并点名。
    for (const [, task] of domain.table('tasks').entries()) {
      if (subtreeIds.has(task.id)) continue
      const dangling = task.predecessorIds?.find(pid => subtreeIds.has(pid))
      if (dangling) {
        throw new TaskReferencedByPredecessorError(`任务 ${dangling} 仍被任务 ${task.id} 作为前置依赖，级联删除被阻止；请先在 ${task.id} 解除`)
      }
    }
    for (const [, meeting] of domain.table('meetings').entries()) {
      const referenced = meeting.actions.find(action => action.taskId && subtreeIds.has(action.taskId))
      if (referenced) {
        throw new TaskReferencedByMeetingError(`任务 ${referenced.taskId} 仍被会议 ${meeting.id} 的行动项关联，级联删除被阻止`)
      }
    }
    const table = domain.table('tasks')
    for (const task of subtree) await table.delete(task.id)
    return subtree.map(task => task.id)
  })
}

/** 批量更新：对给定任务 id 列表逐个套用同一字段片段，返回成功/失败计数。 */
export async function batchUpdateTasks(
  domain: PmDomain,
  ids: string[],
  input: unknown,
): Promise<{ updated: number; skipped: number; ids: string[] }> {
  let updated = 0
  let skipped = 0
  const doneIds: string[] = []
  for (const id of ids) {
    const result = await updateTask(domain, id, input)
    if (result) { updated++; doneIds.push(id) } else { skipped++ }
  }
  return { updated, skipped, ids: doneIds }
}

/**
 * 批量级联删除：对每个所选任务用 collectTaskSubtree 计算将删除的整棵子树（去重）。
 * dry-run 返回计划删除总数（含后代）；confirm 逐个 deleteTaskCascade。跨表保护沿用单删逻辑。
 */
export function planBatchDelete(
  domain: PmDomain,
  ids: string[],
): { selected: number; totalWithDescendants: number; subtreeIds: string[] } {
  const seen = new Set<string>()
  for (const id of ids) {
    for (const task of collectTaskSubtree(domain, id)) seen.add(task.id)
  }
  return { selected: ids.length, totalWithDescendants: seen.size, subtreeIds: [...seen] }
}

export async function batchDeleteCascade(
  domain: PmDomain,
  ids: string[],
): Promise<number> {
  let deleted = 0
  for (const id of ids) {
    const removed = await deleteTaskCascade(domain, id)
    deleted += removed.length
  }
  return deleted
}

/**
 * 移动的领域实现（不入队）：与 moveTask 完全一致的校验与写。抽出它是为了
 * moveTaskAndRenumber 能在「同一个写队列事务里」先 move 再 renumber——
 * 否则在 enqueueDomainWrite 回调内再调用 moveTask/renumberTasks 会嵌套入队，
 * 内层永远排在外层之后，形成队列死锁。
 */
async function applyMoveUnsafe(
  domain: PmDomain,
  current: Task,
  newParentId: string | null,
): Promise<Task> {
  const table = domain.table('tasks')
  const id = current.id
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
}

export function moveTask(
  domain: PmDomain,
  id: string,
  newParentId: string | null,
): Promise<Task | undefined> {
  taskIdSchema.parse(id)
  if (newParentId !== null) taskIdSchema.parse(newParentId)
  return enqueueDomainWrite(domain, async () => {
    const current = domain.table('tasks').get(id)
    if (!current) return undefined
    return applyMoveUnsafe(domain, current, newParentId)
  })
}

/**
 * 全项目重编号的领域实现（不入队）：按当前父子关系与同级顺序重建 order/code。
 * 假设项目存在性已在调用层校验。写失败时回滚本项目已写记录。
 */
async function renumberProjectUnsafe(domain: PmDomain, projectId: string): Promise<Task[]> {
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
}

export function renumberTasks(domain: PmDomain, projectId: string): Promise<Task[]> {
  projectIdSchema.parse(projectId)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(projectId)) {
      throw new TaskProjectNotFoundError(`未找到项目：${projectId}`)
    }
    return renumberProjectUnsafe(domain, projectId)
  })
}

/**
 * PROD-04（Web 复合原子动作）：移动父级 + 全项目重编号，单次写队列事务完成。
 * 先快照本项目全部任务；任何一步（move 校验/写、renumber）失败即把本项目任务整体
 * 恢复到快照，避免半套状态。返回移动后（已重编号）的任务；不存在返回 undefined。
 */
export function moveTaskAndRenumber(
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
    const projectId = current.projectId
    // 快照本项目全部任务（深拷贝），失败时整体回滚。
    const before = [...table.entries()]
      .map(([taskId, task]) => [taskId, structuredClone(task)] as const)
      .filter(([, task]) => task.projectId === projectId)
    try {
      await applyMoveUnsafe(domain, current, newParentId)
      const renumbered = await renumberProjectUnsafe(domain, projectId)
      return renumbered.find(task => task.id === id)
    } catch (error) {
      for (const [taskId, task] of before) {
        try {
          await table.put(taskId, task)
        } catch {
          // 回滚尽力而为；原始错误优先抛出，由调用方看到失败。
        }
      }
      throw error
    }
  })
}
