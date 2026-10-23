/** WBS 任务增查逻辑：父子关系、同级顺序和编号统一在领域写队列中生成。 */
import { projectIdSchema } from './project.js'
import { omitEmptyRepoKeys } from './repo.js'
import { enqueueDomainWrite } from './projects.js'
import {
  taskCreateSchema,
  taskIdSchema,
  taskUpdateSchema,
  taskWriteSchema,
  type Task,
  type TaskUpdate,
  type AttachmentItem,
  type ProgressEntry,
} from './task.js'
import { assertParentHasNoChecklist } from './task-checklist.js'
import {
  normalizeTaskDraft,
  rejectRawAndOpsMixed,
  TaskOpsError,
  type TaskDraft,
} from './task-materials.js'
import { localTodayIso } from './derived.js'
import { ensureReflectionOnDone } from './reflect.js'
import {
  prepareTaskDraftWithFiles,
  publishPreparedTask,
  rollbackNewAssets,
  finalizePreparedStages,
  type PreparedTaskFiles,
} from './file-asset-store.js'
import type { PmDomain } from './storage.js'

export class TaskProjectNotFoundError extends Error {}
export class ParentTaskNotFoundError extends Error {}
export class ParentTaskProjectMismatchError extends Error {}
export class TaskHasChildrenError extends Error {}
export class TaskMoveCycleError extends Error {}
export class TaskMilestoneNotFoundError extends Error {}
export class TaskMilestoneProjectMismatchError extends Error {}
export class TaskDeliverableNotFoundError extends Error {}
export class TaskDeliverableProjectMismatchError extends Error {}
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

/**
 * P0 遗留补齐：task.deliverableId 存在性/同项目校验（与 validateMilestoneRelation 同构）。
 * null/缺省=不设置，放行；显式传入必须存在且与任务同项目，否则拒绝落库。
 */
function validateDeliverableRelation(
  domain: PmDomain,
  projectId: string,
  deliverableId: string | null | undefined,
): void {
  if (!deliverableId) return
  const deliverable = domain.table('deliverables').get(deliverableId)
  if (!deliverable) throw new TaskDeliverableNotFoundError(`未找到交付物：${deliverableId}`)
  if (deliverable.projectId !== projectId) {
    throw new TaskDeliverableProjectMismatchError('交付物不属于指定项目')
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
  // draft 是新建任务时随表单一并提交的资料/日志两区（原子合并），不属于 taskCreateSchema 字段，
  // 先剥离再 strict 解析，避免顶层数组被拒；draft 在同一临界区归一化+校验，失败零写。
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>) : {}
  const draft = raw.draft as TaskDraft | undefined
  const { draft: _drop, ...fieldsRaw } = raw
  const fields = taskCreateSchema.parse(fieldsRaw)
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
    // v0.8 父子互斥：已有非空清单的叶子不能收子任务（拒绝，不删除清单）。
    assertParentHasNoChecklist(parent)
    validateMilestoneRelation(domain, fields.projectId, fields.milestoneId)
    validateDeliverableRelation(domain, fields.projectId, fields.deliverableId)

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
    const recordInput: Record<string, unknown> = {
      ...fields,
      ...(predecessorIds ? { predecessorIds } : {}),
      id,
      code,
      order,
      createdAt: at,
      updatedAt: at,
    }
    // 新建 draft 原子合并：raw 数组或 ops 信封二选一，同一临界区校验，任一失败在 put 前抛出，任务不落库。
    let fileState: PreparedTaskFiles | undefined
    try {
      if (draft) {
        rejectRawAndOpsMixed(draft)
        const hasOps = draft.attachmentOps || draft.progressOps
        let nd
        if (hasOps) {
          const prepared = await prepareTaskDraftWithFiles(domain, fields.projectId, {}, draft, at)
          fileState = prepared.fileState
          nd = prepared
        } else {
          nd = normalizeTaskDraft(domain, fields.projectId, draft, at)
        }
        recordInput.attachments = nd.attachments
        recordInput.progressLog = nd.progressLog
      }
      // 空仓库地址/分支归一为缺键，不留空字符串污染 v2 记录。
      omitEmptyRepoKeys(recordInput)
      const record = taskWriteSchema.parse(recordInput)
      await publishPreparedTask(domain, record, fileState)
      if (fileState) await finalizePreparedStages(fileState.prepared)
      return structuredClone(record)
    } catch (err) {
      if (fileState) await rollbackNewAssets(domain, fileState.newRows, fileState.prepared)
      throw err
    }
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
  // P0：编辑表单可在同一请求携带 draft（资料/进展两区），与基本字段在同一临界区原子落库；
  // 先剥离 draft 再 strict 解析基本字段，draft 非法则整体零写、基本字段保持原值，杜绝两请求半写。
  const rawObj = input && typeof input === 'object' && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {}
  const draft = rawObj.draft as TaskDraft | undefined
  const { draft: _drop, ...fieldsRaw } = rawObj
  // 仅携带 draft（表单只保存资料/进展区）时基本字段为空对象，不应被「至少一个更新字段」refine 拒绝；
  // 有基本字段时仍走 strict，未知键/空对象照常拦截。
  const fields: TaskUpdate = Object.keys(fieldsRaw).length > 0
    ? taskUpdateSchema.parse(fieldsRaw)
    : draft
      ? ({} as TaskUpdate)
      : taskUpdateSchema.parse(fieldsRaw)
  // X6-L1：是否本次由非 done 转入 done（在写队列外记录，供落库成功后 best-effort 挂复盘草稿钩子）。
  let becameDone = false
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('tasks')
    const current = table.get(id)
    if (!current) return undefined
    if (fields.milestoneId !== undefined) {
      validateMilestoneRelation(domain, current.projectId, fields.milestoneId)
    }
    if (fields.deliverableId !== undefined) {
      validateDeliverableRelation(domain, current.projectId, fields.deliverableId)
    }
    // P0：同事务应用 draft；raw 数组为 create-only，编辑仅接受 ops 信封（保稳定 ID/P3 历史）。
    // 任一校验失败在此抛出，后续 put 不执行，基本字段保持原值，杜绝两请求半写。
    let draftAttachments: AttachmentItem[] | undefined
    let draftProgressLog: ProgressEntry[] | undefined
    let fileState: PreparedTaskFiles | undefined
    try {
      if (draft) {
        rejectRawAndOpsMixed(draft)
        if (draft.attachments !== undefined || draft.progressLog !== undefined) {
          throw new TaskOpsError('task update 的 draft 仅接受 attachmentOps/progressOps；raw 数组为 create-only')
        }
        const at = new Date().toISOString()
        const applied = await prepareTaskDraftWithFiles(
          domain,
          current.projectId,
          { attachments: current.attachments, progressLog: current.progressLog },
          draft,
          at,
        )
        fileState = applied.fileState
        draftAttachments = applied.attachments
        draftProgressLog = applied.progressLog
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
      if (draftAttachments) nextInput.attachments = draftAttachments
      if (draftProgressLog) nextInput.progressLog = draftProgressLog
      if (fields.startDate === null) delete nextInput.startDate
      if (fields.dueDate === null) delete nextInput.dueDate
      // 完成日期随状态流转自动维护（batchUpdateTasks 逐条走 updateTask，口径自动一致）：
      //  - 非 done → done：显式传入的合法 completedDate 优先，否则记为【今天】(YYYY-MM-DD)；
      //  - done → 其它状态：清除 completedDate（归一为缺键，与 startDate/dueDate 用 null 清除同构）；
      //  - 已处于 done 但本次更新不含状态/不传 completedDate：spread 已保留原值，绝不因 updatedAt 刷新而覆盖。
      const transitioningIntoDone = fields.status !== undefined
        && current.status !== 'done'
        && fields.status === 'done'
      becameDone = transitioningIntoDone
      const transitioningOutOfDone = fields.status !== undefined
        && current.status === 'done'
        && fields.status !== 'done'
      if (transitioningIntoDone) {
        nextInput.completedDate = typeof fields.completedDate === 'string' && fields.completedDate
          ? fields.completedDate
          : localTodayIso()
      } else if (transitioningOutOfDone) {
        delete nextInput.completedDate
      } else if (fields.completedDate !== undefined) {
        // 显式纠正/清除完成日期（在状态未发生流转时）：null 即清除，字符串即采纳。
        if (fields.completedDate === null) delete nextInput.completedDate
        else nextInput.completedDate = fields.completedDate
      }
      if (fields.predecessorIds !== undefined) {
        // 整体替换：显式传即覆盖；空数组归一为缺键（清空前置）。
        const normalized = validatePredecessorRelation(domain, current.projectId, current.id, fields.predecessorIds)
        if (normalized) nextInput.predecessorIds = normalized
        else delete nextInput.predecessorIds
      }
      // 空仓库地址/分支归一为缺键（显式传空白即清空），不留空字符串。
      omitEmptyRepoKeys(nextInput)
      // #23：显式清除人工设定（manualProgress=null）时，一并清掉人工备注，避免残留旧口径。
      if (fields.manualProgress === null) delete nextInput.manualProgressNote
      const next = taskWriteSchema.parse(nextInput)
      await publishPreparedTask(domain, next, fileState, current)
      if (fileState) await finalizePreparedStages(fileState.prepared)
      return structuredClone(next)
    } catch (error) {
      if (fileState) await rollbackNewAssets(domain, fileState.newRows, fileState.prepared)
      throw error
    }
  }).then((result) => {
    // X6-L1：任务已落库为 done 后 best-effort 建即时复盘草稿。
    // 钩子在写队列外链式触发（不嵌套入队、不参与本事务）；失败仅 console.warn，绝不阻断任务落库。
    // ask-apply 的 task.update 同样走本函数，故单点钩子即可覆盖，无需在 commands/ask.ts 另接。
    if (becameDone && result) {
      void ensureReflectionOnDone(domain, result).catch((error: unknown) => {
        console.warn('[pm-tool] 即时复盘草稿生成失败（不阻断任务落库）：', error)
      })
    }
    return result
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

export interface BackfillCompletedItem {
  id: string
  title: string
}
export interface BackfillCompletedResult {
  /** 已是 done 且原本就带 completedDate、未改动的条数。 */
  alreadyHad: number
  /** 据 dueDate 显式推断补录 completedDate 的任务（绝不编造精确日期）。 */
  inferred: (BackfillCompletedItem & { completedDate: string })[]
  /** 是 done、缺 completedDate 且无 dueDate：保持空缺，不进入历史统计。 */
  skippedNoDue: BackfillCompletedItem[]
}

/**
 * 历史完成日期回填：原则【不编造】。
 * 仅对 status=done 且缺 completedDate 的旧任务处理：
 *  - 有 dueDate → 把 dueDate 作为【显式推断】的完成日期补录（命令层逐任务标注“据截止日期推断”）；
 *  - 无 dueDate → 保持 null，不进入历史统计，绝不凭空捏造。
 */
export function backfillCompletedDates(domain: PmDomain, projectId?: string): Promise<BackfillCompletedResult> {
  if (projectId !== undefined) projectIdSchema.parse(projectId)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('tasks')
    const inferred: BackfillCompletedResult['inferred'] = []
    const skippedNoDue: BackfillCompletedItem[] = []
    let alreadyHad = 0
    for (const [, task] of table.entries()) {
      if (projectId && task.projectId !== projectId) continue
      if (task.status !== 'done') continue
      if (task.completedDate) { alreadyHad++; continue }
      if (!task.dueDate) {
        skippedNoDue.push({ id: task.id, title: task.title })
        continue
      }
      const next = taskWriteSchema.parse({
        ...task,
        completedDate: task.dueDate,
        updatedAt: new Date().toISOString(),
      })
      await table.put(task.id, next)
      inferred.push({ id: task.id, title: task.title, completedDate: task.dueDate })
    }
    return { alreadyHad, inferred, skippedNoDue }
  })
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

/**
 * 批量级联删除：单写队列事务内完成「全量计划 → 全量引用预检 → 整批删除」。
 * 任一保护命中即整批拒绝（零写），避免半提交——可删的 A 已落盘删除、被引用的 B 却残留。
 * 计划内任务之间的相互前置引用随整批删除一并消失，不视为悬空；仅计划外引用才阻止。
 * 与单删/单级联一致地检查「计划外任务把计划内 id 列为前置」与「计划外会议行动项关联计划内任务」。
 */
export function batchDeleteCascade(
  domain: PmDomain,
  ids: string[],
): Promise<number> {
  return enqueueDomainWrite(domain, async () => {
    const plannedIds = new Set<string>()
    for (const id of ids) {
      for (const task of collectTaskSubtree(domain, id)) plannedIds.add(task.id)
    }
    if (!plannedIds.size) return 0
    // 全量前置引用预检：计划外任务不得把计划内 id 列为前置依赖，拒绝并点名双方。
    for (const [, task] of domain.table('tasks').entries()) {
      if (plannedIds.has(task.id)) continue
      const dangling = task.predecessorIds?.find(pid => plannedIds.has(pid))
      if (dangling) {
        throw new TaskReferencedByPredecessorError(`任务 ${dangling} 仍被任务 ${task.id} 作为前置依赖，批量删除被阻止；请先在 ${task.id} 解除`)
      }
    }
    // 全量会议引用预检：计划外会议行动项不得关联计划内任务，拒绝并点名双方。
    for (const [, meeting] of domain.table('meetings').entries()) {
      const referenced = meeting.actions.find(action => action.taskId && plannedIds.has(action.taskId))
      if (referenced) {
        throw new TaskReferencedByMeetingError(`任务 ${referenced.taskId} 仍被会议 ${meeting.id} 的行动项关联，批量删除被阻止`)
      }
    }
    const table = domain.table('tasks')
    for (const id of plannedIds) await table.delete(id)
    return plannedIds.size
  })
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
  // v0.8 父子互斥：新父已有非空清单则拒绝（拒绝而非删除清单）；root/undefined 放行。
  assertParentHasNoChecklist(parent)

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
 * S1 复合写失败的聚合错误口径（与 core/backup.ts 的 `AggregateError([applyError, rollbackError])` 同构）：
 * 原始业务错误排在前、其后依次为各条回滚错误；回滚全部成功则原样抛出原始错误，绝不吞回滚错。
 * 若原始错误本身已是 AggregateError（内层 renumber 回滚失败又被外层回滚接力），拍平后追加，
 * 保持 errors[0] = 最原始业务错误。未来协作仅在此扩展错误类型/可选 context，不触碰 schema/rev/actor。
 */
function failWithRollbackErrors(original: unknown, rollbackErrors: unknown[], message: string): never {
  if (rollbackErrors.length === 0) {
    throw original instanceof Error ? original : new Error(String(original))
  }
  const causes = original instanceof AggregateError ? [...original.errors] : [original]
  throw new AggregateError([...causes, ...rollbackErrors], message)
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
    failWithRollbackErrors(error, rollbackErrors, '任务重新编号失败，且部分记录恢复失败')
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
      // S1：外层 before 快照回滚不再空 catch{} 吞错。任一回滚 put 失败即把原始业务错 + 各回滚错
      // 聚合抛出（与 renumberProjectUnsafe/backup.ts 同构），调用方可辨识「回滚不完整」；
      // 回滚全部成功则原样抛原始错误。全程仍在同一 enqueueDomainWrite 临界区内。
      const rollbackErrors: unknown[] = []
      for (const [taskId, task] of before) {
        try {
          await table.put(taskId, task)
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError)
        }
      }
      failWithRollbackErrors(error, rollbackErrors, '移动并重新编号失败，且部分任务记录恢复失败')
    }
  })
}
