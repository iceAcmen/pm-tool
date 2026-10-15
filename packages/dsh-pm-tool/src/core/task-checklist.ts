/**
 * v0.8 客观进度 · 任务清单（checklist）领域写路径。
 *
 * 冻结口径见 docs/testing/objective-progress-acceptance.md §0.1 / §8 / §13：
 *  - Task 唯一新增字段 = 可选 checklist:{id,text,done}[]；不加 progressMode / doneAt；
 *  - 所有 CRUD 走 enqueueDomainWrite 单写队列，回调内先 table.get 读最新记录再改、再一次 put；
 *  - 普通 task update 不能整段替换数组——本模块只暴露 add/toggle/rename/remove 四个单项动作；
 *  - toggle 以明确目标布尔 expectedDone 为准：已在目标态即幂等返回（不反向翻转、不重复写库）；
 *  - 「内部节点」与「有非空清单的叶子」双向互斥：拒绝，绝不删除已有清单；
 *  - 写失败不半写：不吞错、不 try/catch 后继续；status/progress 全程不动。
 *
 * 死锁纪律：本模块只在自己的 enqueueDomainWrite 回调内直接 table.get/put，
 * 绝不回调 addTask/moveTask 等其他会再次入队的函数（嵌套入队 = 队列死锁，见 tasks.ts applyMoveUnsafe 注释）。
 * 父子互斥另一半（新父已有清单则拒收子任务）以「不入队」的纯断言函数 export，由 tasks.ts 在自身事务内调用。
 */
import { randomUUID } from 'node:crypto'
import { enqueueDomainWrite } from './projects.js'
import {
  CHECKLIST_MAX_ITEMS,
  taskIdSchema,
  taskWriteSchema,
  type Task,
} from './task.js'
import type { PmDomain } from './storage.js'

export class TaskChecklistTaskNotFoundError extends Error {}
export class ChecklistItemNotFoundError extends Error {}
/** 入参校验（空文本 / expectedDone 非布尔等）：消息即给用户看的中文说明。 */
export class ChecklistValidationError extends Error {}
/** 内部节点（已有子任务）挂清单：冻结中文文案「有子任务的任务不挂清单」（OP-CK-02）。 */
export class ChecklistHasChildrenError extends Error {}
/** 有非空清单的叶子被要求收子任务（addTask(parentId) / move / move+renumber 三条路径）。 */
export class ChecklistParentHasChecklistError extends Error {}
export class ChecklistFullError extends Error {}

/**
 * 未来多人协作扩展入口（OP-DEFER-05：v1 不落 rev/actor）。
 * 当前所有 options 均不改变行为、不落盘；仅在此留位，避免以后改动函数签名。
 */
export interface ChecklistWriteOptions {
  /** 预留：操作者标识；v1 不持久化。 */
  readonly actor?: string
  /** 预留：乐观并发版本号；v1 不持久化。 */
  readonly rev?: string
}

/** 统计某任务当前的直接子任务数（内部节点判定用）。 */
function countDirectChildren(domain: PmDomain, taskId: string): number {
  let count = 0
  for (const [, task] of domain.table('tasks').entries()) {
    if (task.parentId === taskId) count += 1
  }
  return count
}

/**
 * 父子互斥的另一半：新父任务若已有非空清单，拒绝收子任务——拒绝而非删除清单。
 * 本函数故意「不入队」：addTask / moveTask / moveTaskAndRenumber 已在各自写事务内，
 * 直接调用即可，避免嵌套 enqueueDomainWrite 造成队列死锁。
 */
export function assertParentHasNoChecklist(parent: Task | undefined): void {
  if (parent && (parent.checklist?.length ?? 0) > 0) {
    throw new ChecklistParentHasChecklistError(
      `任务 ${parent.id} 已有 ${parent.checklist!.length} 项清单，不能直接收子任务；请先清空该任务的清单再调整父子关系`,
    )
  }
}

/** 校验并落盘一次清单写：整记录 parse 后单次 put；空数组归一为缺键。返回落盘后副本。 */
async function persistChecklist(domain: PmDomain, current: Task, nextItems: Task['checklist']): Promise<Task> {
  const table = domain.table('tasks')
  const nextInput: Record<string, unknown> = {
    ...current,
    updatedAt: new Date().toISOString(),
  }
  if (nextItems && nextItems.length > 0) {
    nextInput.checklist = nextItems
  } else {
    delete nextInput.checklist
  }
  const next = taskWriteSchema.parse(nextInput)
  await table.put(current.id, next)
  return structuredClone(next)
}

/** 读最新任务记录；不存在即抛（不静默成功）。 */
function loadLatestTask(domain: PmDomain, taskId: string): Task {
  const current = domain.table('tasks').get(taskId)
  if (!current) throw new TaskChecklistTaskNotFoundError(`未找到任务：${taskId}`)
  return current
}

function currentItems(current: Task): NonNullable<Task['checklist']> {
  return current.checklist ? structuredClone(current.checklist) : []
}

/** 在最新清单中定位 itemId；不存在即抛（不吞错、不静默跳过）。 */
function findItemIndex(items: NonNullable<Task['checklist']>, taskId: string, itemId: string): number {
  const index = items.findIndex(item => item.id === itemId)
  if (index < 0) throw new ChecklistItemNotFoundError(`任务 ${taskId} 下未找到清单项：${itemId}`)
  return index
}

/**
 * 追加一项清单文本。内部节点（已有子任务）拒绝挂清单。
 * itemId 为稳定 UUID（v4），由服务端生成，同任务内天然唯一；文本 trim 后非空。
 */
export function addTaskChecklistItem(
  domain: PmDomain,
  taskId: string,
  text: string,
  _options?: ChecklistWriteOptions,
): Promise<Task> {
  taskIdSchema.parse(taskId)
  return enqueueDomainWrite(domain, async () => {
    const current = loadLatestTask(domain, taskId)
    if (countDirectChildren(domain, taskId) > 0) {
      throw new ChecklistHasChildrenError('有子任务的任务不挂清单')
    }
    const items = currentItems(current)
    if (items.length >= CHECKLIST_MAX_ITEMS) {
      throw new ChecklistFullError(`单个任务的清单最多 ${CHECKLIST_MAX_ITEMS} 项`)
    }
    const trimmed = String(text ?? '').trim()
    if (!trimmed) throw new Error('清单项文本不能为空')
    items.push({ id: randomUUID(), text: trimmed, done: false })
    return persistChecklist(domain, current, items)
  })
}

/**
 * 把某清单项的 done 设为明确目标布尔 expectedDone。
 * 幂等契约：当前 done 已等于目标值 → 直接返回、不落盘（重试/重发安全，绝不反向翻转）；
 * 只有确有差异时才 bump updatedAt 并单次 put。
 */
export function setTaskChecklistItemDone(
  domain: PmDomain,
  taskId: string,
  itemId: string,
  expectedDone: boolean,
  _options?: ChecklistWriteOptions,
): Promise<Task> {
  taskIdSchema.parse(taskId)
  if (typeof expectedDone !== 'boolean') {
    throw new Error('expectedDone 必须是明确的布尔值 true 或 false')
  }
  return enqueueDomainWrite(domain, async () => {
    const current = loadLatestTask(domain, taskId)
    const items = currentItems(current)
    const index = findItemIndex(items, taskId, itemId)
    if (items[index].done === expectedDone) {
      // 已在目标态：幂等返回，不反向翻转、不重复写库（OP-CK-05 / OP-Q-02）。
      return structuredClone(current)
    }
    items[index] = { ...items[index], done: expectedDone }
    return persistChecklist(domain, current, items)
  })
}

/** 只改某项文本（trim 后非空）；id/done/其余项逐字段不动。 */
export function renameTaskChecklistItem(
  domain: PmDomain,
  taskId: string,
  itemId: string,
  text: string,
  _options?: ChecklistWriteOptions,
): Promise<Task> {
  taskIdSchema.parse(taskId)
  return enqueueDomainWrite(domain, async () => {
    const current = loadLatestTask(domain, taskId)
    const items = currentItems(current)
    const index = findItemIndex(items, taskId, itemId)
    const trimmed = String(text ?? '').trim()
    if (!trimmed) throw new Error('清单项文本不能为空')
    items[index] = { ...items[index], text: trimmed }
    return persistChecklist(domain, current, items)
  })
}

/** 删除某项；删空后 checklist 键归一为缺键（与 predecessorIds 同一落盘口径）。 */
export function removeTaskChecklistItem(
  domain: PmDomain,
  taskId: string,
  itemId: string,
  _options?: ChecklistWriteOptions,
): Promise<Task> {
  taskIdSchema.parse(taskId)
  return enqueueDomainWrite(domain, async () => {
    const current = loadLatestTask(domain, taskId)
    const items = currentItems(current)
    const index = findItemIndex(items, taskId, itemId)
    items.splice(index, 1)
    return persistChecklist(domain, current, items)
  })
}
