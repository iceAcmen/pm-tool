/** /pm task：解析离线 WBS 命令并渲染中文结果。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { readFileSync } from 'node:fs'
import { z } from 'zod'
import {
  addTask,
  collectTaskSubtree,
  deleteTask,
  deleteTaskCascade,
  getTask,
  listTasks,
  moveTask,
  moveTaskAndRenumber,
  ParentTaskNotFoundError,
  ParentTaskProjectMismatchError,
  renumberTasks,
  TaskHasChildrenError,
  TaskMoveCycleError,
  TaskMilestoneNotFoundError,
  TaskMilestoneProjectMismatchError,
  TaskDeliverableNotFoundError,
  TaskDeliverableProjectMismatchError,
  TaskProjectNotFoundError,
  TaskReferencedByMeetingError,
  TaskReferencedByPredecessorError,
  updateTask,
  batchUpdateTasks,
  planBatchDelete,
  batchDeleteCascade,
  backfillCompletedDates,
} from '../core/tasks.js'
import {
  importTasksFromMarkdown,
  planTaskImport,
  TaskImportEmptyError,
  TaskImportNoProjectError,
} from '../core/task-import.js'
import { planGridCsvImport, importTasksFromGrid, readXlsxGrid, readXlsxGridFromBuffer, parseCsv as parseCsvLocal } from '../core/csv-import.js'
import {
  addTaskChecklistItem,
  ChecklistHasChildrenError,
  ChecklistItemNotFoundError,
  ChecklistParentHasChecklistError,
  ChecklistFullError,
  removeTaskChecklistItem,
  renameTaskChecklistItem,
  setTaskChecklistItemDone,
  TaskChecklistTaskNotFoundError,
} from '../core/task-checklist.js'
import { generateWbsMarkdown, previewWbsDraft, rememberDraft, recallDraft } from '../core/wbs-ai.js'
import { buildSourceRefs, CURRENT_SNAPSHOT_VERSION, CURRENT_RULE_REVISION, type SourceRecord } from '../core/provenance.js'
import { recordProvenance } from '../core/provenance-store.js'
import { getModelMode, resolveModelRoute, PROD_KEY_MISSING_TEXT } from '../core/model-route.js'
import { AiDraftError, type LlmGateway } from '../core/ai-client.js'
import { describeTaskValidation, taskStatusLabels, type Task } from '../core/task.js'
import { PM_SUMMARY_PREFIX, PM_DETAIL_MARKER, buildActionLine, buildSuccessEnvelope } from '../core/ui-feedback.js'
import { formatRepoRef, repoFieldHelpPhrase } from '../core/repo-format.js'
import type { PmDomain } from '../core/storage.js'

export const taskHelp = [
  'WBS 任务命令（离线，无需 API Key）：',
  '  /pm task add {"projectId":"p-0001","title":"需求确认"}',
  '  /pm task add {"projectId":"p-0001","parentId":"t-0001","title":"访谈用户"}',
  '  /pm task list p-0001',
  '  /pm task get t-0001',
  '  /pm task update t-0001 {"status":"in_progress","progress":30}',
  '  /pm task move t-0003 t-0002 confirm',
  '  /pm task move t-0003 root confirm',
  '  /pm task move t-0003 t-0002 --renumber confirm   移动后立即重建全项目连续 WBS 编号',
  '  /pm task delete t-0003 confirm          删除无子任务的任务',
  '  /pm task delete t-0003                  含子任务时 dry-run 列出将级联删除的整棵子树（不落盘）',
  '  /pm task delete t-0003 cascade confirm  显式级联删除该任务及其全部后代（旁支不受影响）',
  '  /pm task renumber p-0001 confirm',
  '  /pm task checklist add t-0001 写立项书      给叶子任务追加一项客观清单（内部节点不可挂清单）',
  '  /pm task checklist toggle t-0001 <itemId> true   把该项设为明确目标态 true/false（重复执行幂等，不反向翻转）',
  '  /pm task checklist rename t-0001 <itemId> 新文本',
  '  /pm task checklist remove t-0001 <itemId>',
  '  清单是客观进度的唯一信号源；有清单的叶子不能收子任务（请先清空清单再调整父子）。',
  '  /pm task import p-0001 任务表.md          解析并预览将创建的任务（不落盘）',
  '  /pm task import p-0001 任务表.md confirm  按 GitHub 缩进勾选清单（- [ ] / - [x]）导入为 WBS 任务',
  '  /pm task import p-0001 任务表.csv confirm  按约定表头(层级/标题/负责人/优先级/开始/截止/进度)导入任务树',
  '  /pm task import p-0001 任务表.xlsx confirm  同上,从 .xlsx 首表导入(SheetJS 离线解析)',
  '  /pm task wbs p-0001 「一句话目标」          AI 拆解为 WBS 勾选清单草稿（预览，不落盘；调用一次模型）',
  '  /pm task wbs p-0001 「一句话目标」confirm  按上次草稿确认落盘（复用草稿，不再调模型）',
  'AI 草稿经预览确认才入库；无 key/模型失败时优雅降级到手工 task add。',
  '删除、移动和重新编号不带 confirm 只显示提示，不会写盘。',
  '移动/删除不自动改写 WBS 编号；renumber 才按当前任务树重建连续编号。',
  '更新用 null 清空 startDate/dueDate/milestoneId；移动用 root 表示移到根层级。',
  '任务标记为已完成时自动记录完成日期（可在 update 里用 completedDate 显式指定/纠正，传 null 清除）。',
  '  /pm task update t-0001 {"status":"wrapped"}   人显式收尾（弃置/停办）：已收尾≠正式完成，不催办、不计 done、不计 open；AI 不得代写。',
  '  /pm task backfill-completed [项目ID]   为已完成但缺完成日期的旧任务补录（仅据截止日期推断，无截止日期保持空缺、不伪造）。',
  'milestoneId 必须指向同项目已存在里程碑；ID、WBS 编号、同级顺序和时间戳由系统生成。',
  repoFieldHelpPhrase,
].join('\n')

function renderTask(task: Task): string {
  return [
    `任务 ID：${task.id}`,
    `WBS：${task.code}`,
    `项目 ID：${task.projectId}`,
    `父任务：${task.parentId ?? '无'}`,
    `标题：${task.title}`,
    `说明：${task.description || '未填写'}`,
    `负责人：${task.assignee || '未填写'}`,
    `状态：${taskStatusLabels[task.status]}${task.status === 'wrapped' ? '（已收尾 · 非正式完成）' : ''}`,
    `优先级：${task.priority}`,
    `开始日期：${task.startDate ?? '未填写'}`,
    `截止日期：${task.dueDate ?? '未填写'}`,
    `完成日期：${task.completedDate ?? '未填写'}`,
    `进度：${task.progress}%`,
    `里程碑：${task.milestoneId ?? '无'}`,
    `仓库：${formatRepoRef(task) || '未填写'}`,
    `创建时间：${task.createdAt}`,
    `更新时间：${task.updatedAt}`,
    ...renderChecklistLines(task),
  ].join('\n')
}

/** 更新成功短摘要：对比传入 patch 与更新前后，列出变更字段（R-C4，不全字段 dump）。 */
const FIELD_LABELS: Record<string, string> = {
  title: '标题', description: '说明', assignee: '负责人', status: '状态',
  priority: '优先级', startDate: '开始日期', dueDate: '截止日期', completedDate: '完成日期',
  progress: '进度', milestoneId: '里程碑',
}
function summarizeTaskUpdate(before: Task | undefined, after: Task, patch: Record<string, unknown>): string[] {
  const out: string[] = []
  for (const [key, to] of Object.entries(patch)) {
    const label = FIELD_LABELS[key]
    if (!label) continue
    const from = before ? (before as Record<string, unknown>)[key] : undefined
    // 表单空日期会以 null 提交，而旧记录通常为 undefined；二者同属“空”，不应制造空→空噪音。
    const same = from === to || (from == null && to == null)
    if (same) continue
    const fromText = key === 'status' && from ? taskStatusLabels[from as keyof typeof taskStatusLabels] : String(from ?? '空')
    const toText = key === 'status' ? taskStatusLabels[to as keyof typeof taskStatusLabels]
      : key === 'progress' ? `${to}%`
      : String(to ?? '空')
    out.push(`${label}：${fromText} → ${toText}`)
  }
  return out
}

/** 清单只读渲染：itemId 是后续 toggle/rename/remove 必须回传的稳定 id。 */
function renderChecklistLines(task: Task): string[] {
  const items = task.checklist ?? []
  if (!items.length) return []
  const doneCount = items.filter(item => item.done).length
  return [
    `清单项：${items.length} 项（已勾 ${doneCount}）`,
    ...items.map(item => `  ${item.done ? '[x]' : '[ ]'} ${item.id} ${item.text}`),
  ]
}

function taskDepth(task: Task, tasksById: Map<string, Task>): number {
  let depth = 0
  let current = task
  const visited = new Set<string>([task.id])
  while (current.parentId) {
    if (visited.has(current.parentId)) break
    const parent = tasksById.get(current.parentId)
    if (!parent) break
    visited.add(parent.id)
    depth += 1
    current = parent
  }
  return depth
}

function parseJson(argument: string): unknown | undefined {
  try {
    return JSON.parse(argument)
  } catch {
    return undefined
  }
}

/**
 * S1-G2：move+renumber 复合写失败时，core 层会把「原始业务错误 + 各条回滚错误」聚合为
 * AggregateError 抛出（见 core/tasks.ts failWithRollbackErrors）。命令层此前一律落到
 * 「任务操作失败」通用文案，用户看不到到底是哪一步失败、回滚是否完整。
 *
 * 这里把 AggregateError 拍平成安全中文摘要：
 *  - 顶层沿用 AggregateError.message（core 已写「移动并重新编号失败，且部分任务记录恢复失败」等语义）；
 *  - errors[0] 视为最原始业务错误，其后依次为回滚错误；嵌套 AggregateError 与 error.cause 递归拍平；
 *  - 按 message 去重、每条只取首行并截断长度、最多列前 N 条回滚错，避免堆栈/敏感对象泄漏；
 *  - 非 AggregateError 返回 undefined，交由调用方走既有领域错误/通用文案分支，已知领域错误不回归。
 *
 * context 预留未来多人协作扩展（actor 等敏感字段绝不进入摘要）。
 */
interface CommandErrorContext {
  /** 预留：调用方操作标识，当前不改变文案，仅为后续扩展留位。 */
  readonly operation?: string
}

const MAX_ERROR_LINE_LENGTH = 120
const MAX_ROLLBACK_LINES = 3

function sanitizeErrorLine(input: unknown): string {
  const firstLine = String(input).split(/\r?\n/, 1)[0] ?? ''
  const trimmed = firstLine.trim()
  if (!trimmed) return ''
  return trimmed.length > MAX_ERROR_LINE_LENGTH ? `${trimmed.slice(0, MAX_ERROR_LINE_LENGTH)}…` : trimmed
}

function collectAggregateMessages(error: AggregateError, into: string[], seen: Set<string>): void {
  const push = (value: unknown): void => {
    if (value instanceof AggregateError) {
      for (const inner of value.errors) push(inner)
      if (value.cause) push(value.cause)
      return
    }
    const line = sanitizeErrorLine(value instanceof Error ? value.message : value)
    if (line && !seen.has(line)) {
      seen.add(line)
      into.push(line)
    }
  }
  for (const inner of error.errors) push(inner)
  if (error.cause) push(error.cause)
}

function formatAggregateCommandError(error: AggregateError, _context?: CommandErrorContext): string | undefined {
  const messages: string[] = []
  const seen = new Set<string>()
  collectAggregateMessages(error, messages, seen)
  if (messages.length === 0) return undefined
  const [original, ...rollbacks] = messages
  const lines: string[] = [sanitizeErrorLine(error.message)]
  lines.push(`原始错误：${original}`)
  if (rollbacks.length > 0) {
    const shown = rollbacks.slice(0, MAX_ROLLBACK_LINES)
    lines.push(`恢复失败（${rollbacks.length} 项）：`)
    for (const r of shown) lines.push(`  - ${r}`)
    if (rollbacks.length > shown.length) {
      lines.push(`  …另有 ${rollbacks.length - shown.length} 项已省略`)
    }
  }
  return lines.join('\n')
}

export async function handleTaskCommand(rawInput: string, domain?: PmDomain, llm?: LlmGateway): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: taskHelp }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const argument = match[2]?.trim() ?? ''
  if (!['add', 'list', 'get', 'update', 'delete', 'move', 'renumber', 'import', 'importmd', 'import-content', 'batch', 'wbs', 'checklist', 'backfill-completed'].includes(action)) {
    return { kind: 'error', text: `不支持的任务操作。\n${taskHelp}` }
  }
  if (!domain) return { kind: 'error', text: '任务存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }

  try {
    if (action === 'add') {
      const fields = parseJson(argument)
      if (fields === undefined) {
        return { kind: 'error', text: `任务参数须为合法 JSON 对象，请使用英文双引号。\n${taskHelp}` }
      }
      const task = await addTask(domain, fields)
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`任务已新增｜${task.code}｜${task.id} ${task.title}`, task.parentId ? `父任务：${task.parentId}` : '根层级'],
          '```\n' + renderTask(task) + '\n```',
        ),
      }
    }
    if (action === 'list') {
      if (!argument || /\s/.test(argument)) {
        return { kind: 'error', text: '请指定一个项目 ID：/pm task list p-0001' }
      }
      const tasks = listTasks(domain, argument)
      const tasksById = new Map(tasks.map(task => [task.id, task]))
      return {
        kind: 'success',
        text: tasks.length
          ? [`WBS 任务树（项目 ${argument}，共 ${tasks.length} 项）：`,
              ...tasks.map(task =>
                `${'  '.repeat(taskDepth(task, tasksById))}${task.code}｜${task.id}｜${task.title}｜${taskStatusLabels[task.status]}｜${task.progress}%`,
              ),
              '查看详情：/pm task get <任务ID>',
            ].join('\n')
          : `项目 ${argument} 暂无任务。`,
      }
    }
    if (action === 'get') {
      if (!argument || /\s/.test(argument)) {
        return { kind: 'error', text: '请指定一个任务 ID：/pm task get t-0001' }
      }
      const task = getTask(domain, argument)
      return task
        ? { kind: 'success', text: renderTask(task) }
        : { kind: 'error', text: `未找到任务：${argument}。请用 /pm task list <项目ID> 查看任务树。` }
    }
    if (action === 'update') {
      const updateMatch = /^(\S+)(?:\s+([\s\S]+))?$/.exec(argument)
      if (!updateMatch?.[2]) {
        return { kind: 'error', text: '请使用：/pm task update <任务ID> {JSON片段}' }
      }
      const fields = parseJson(updateMatch[2])
      if (fields === undefined) {
        return { kind: 'error', text: '更新参数须为合法 JSON 对象，请使用英文双引号。' }
      }
      const before = getTask(domain, updateMatch[1])
      const task = await updateTask(domain, updateMatch[1], fields)
      if (!task) return { kind: 'error', text: `未找到任务：${updateMatch[1]}。` }
      // X2：人显式收尾（wrapped）转换成功后，文案明示「已收尾 ≠ 正式完成」，不越界裁决成败。
      const wrappedNote = task.status === 'wrapped'
        ? '注意：已收尾（wrapped）≠ 正式完成（done）；该任务未计入完成，不催办、不计入 open 负载。'
        : ''
      // R-C4/§6.2/J5：成功只用信封短摘要（≤2 行，无完整实体/HTML/MD），完整字段进 detail 供独立展开卡，
      // 绝不塞进 toast message；客户端 parseFeedback 分型，无信封的其他命令原样回退。
      const changes = summarizeTaskUpdate(before, task, fields as Record<string, unknown>)
      const summaryLines = [
        `任务已更新｜${task.id} ${task.title}`,
        ...(changes.length ? [`已修改：${changes.join('；')}`] : []),
        ...(wrappedNote ? [wrappedNote] : []),
      ]
      const detail = '```\n' + renderTask(task) + '\n```'
      return {
        kind: 'success',
        text: [
          ...summaryLines.map(l => `${PM_SUMMARY_PREFIX}${l}`),
          PM_DETAIL_MARKER,
          detail,
        ].join('\n'),
      }
    }
    if (action === 'delete') {
      const deleteMatch = /^(\S+)(?:\s+(cascade))?(?:\s+(confirm))?$/i.exec(argument)
      if (!deleteMatch) return { kind: 'error', text: '请使用：/pm task delete <任务ID> [cascade] confirm' }
      const [, id, cascadeWord, confirmWord] = deleteMatch
      const current = getTask(domain, id)
      if (!current) return { kind: 'error', text: `未找到任务：${id}。` }
      const subtree = collectTaskSubtree(domain, id)
      const hasChildren = subtree.length > 1

      if (!confirmWord) {
        if (hasChildren) {
          return {
            kind: 'success',
            text: [
              `任务 ${current.code}｜${current.id}｜${current.title} 含 ${subtree.length - 1} 个子任务。`,
              '当前未删除。级联删除将同时移除以下整棵子树：',
              ...subtree.map(task => `  ${task.code}｜${task.id}｜${task.title}`),
              buildActionLine('确认级联删除', `/pm task delete ${id} cascade confirm`),
            ].join('\n'),
          }
        }
        return {
          kind: 'success',
          text: [
            `即将删除任务：${current.code}｜${current.id}｜${current.title}。`,
            '当前未执行删除。',
            buildActionLine('确认删除', `/pm task delete ${current.id} confirm`),
          ].join('\n'),
        }
      }

      if (hasChildren && !cascadeWord) {
        return {
          kind: 'error',
          text: `任务 ${id} 仍有子任务，未删除。请先逐层删除，或显式级联：/pm task delete ${id} cascade confirm`,
        }
      }
      if (cascadeWord) {
        const deleted = await deleteTaskCascade(domain, id)
        return deleted.length
          ? {
              kind: 'success',
              text: buildSuccessEnvelope(
                [`已级联删除 ${deleted.length} 个任务`, `${current.code} 及其 ${deleted.length - 1} 个后代；旁支任务不受影响`],
                `已删除 ID：${deleted.join('、')}`,
              ),
            }
          : { kind: 'error', text: `未删除任何任务：${id}。` }
      }
      const deleted = await deleteTask(domain, id)
      return deleted
        ? {
            kind: 'success',
            text: buildSuccessEnvelope(
              [`任务已删除｜${deleted.code}｜${deleted.id} ${deleted.title}`, 'WBS 编号未自动调整'],
              null,
            ),
          }
        : { kind: 'error', text: `未找到任务：${id}。` }
    }
    if (action === 'move') {
      const tokens = argument.split(/\s+/).filter(Boolean)
      if (tokens.length < 2) {
        return { kind: 'error', text: '请使用：/pm task move <任务ID> <新父任务ID|root> [--renumber] confirm' }
      }
      const id = tokens[0]
      const destination = tokens[1]
      const flags = tokens.slice(2).map(token => token.toLowerCase())
      const wantRenumber = flags.includes('--renumber')
      const confirmation = flags.includes('confirm')
      const current = getTask(domain, id)
      if (!current) return { kind: 'error', text: `未找到任务：${id}。` }
      const newParentId = destination.toLowerCase() === 'root' ? null : destination
      if (!confirmation) {
        return {
          kind: 'success',
          text: [
            `即将移动任务：${current.code}｜${current.id}｜${current.title}。`,
            `新父任务：${newParentId ?? '根层级'}。当前未执行移动。`,
            wantRenumber
              ? '将在移动后立即按新树重建全项目连续 WBS 编号（单事务，失败整体回滚）。'
              : '移动后保留旧 WBS 编号；需要连续编号时再显式执行 renumber。',
            buildActionLine('确认移动', `/pm task move ${current.id} ${newParentId ?? 'root'}${wantRenumber ? ' --renumber' : ''} confirm`),
          ].join('\n'),
        }
      }
      const moved = wantRenumber
        ? await moveTaskAndRenumber(domain, id, newParentId)
        : await moveTask(domain, id, newParentId)
      return moved
        ? {
            kind: 'success',
            text: buildSuccessEnvelope(
              [
                `任务已移动｜${moved.code}｜${moved.id} ${moved.title}`,
                moved.parentId
                  ? `父任务 ${moved.parentId}${wantRenumber ? `；重编号为 ${moved.code}` : ''}`
                  : `移至根层级${wantRenumber ? `；重编号为 ${moved.code}` : ''}`,
              ],
              wantRenumber ? null : '```\n' + renderTask(moved) + '\n```',
            ),
          }
        : { kind: 'error', text: `未找到任务：${id}。` }
    }
    if (action === 'import') {
      const tokens = argument.split(/\s+/).filter(Boolean)
      if (tokens.length < 2 || tokens.length > 3) {
        return { kind: 'error', text: '请使用：/pm task import <项目ID> <清单文件路径.md> [confirm]' }
      }
      const [projectId, filePath, confirmation] = tokens
      const isCsv = /\.csv$/i.test(filePath)
      const isXlsx = /\.xlsx$/i.test(filePath)
      if (isCsv || isXlsx) {
        try {
          const parsedGrid = isCsv
            ? parseCsvLocal(readFileSync(filePath, 'utf8'))
            : await readXlsxGrid(filePath)
          const plan = planGridCsvImport(domain, projectId, parsedGrid)
          if (confirmation !== 'confirm') {
            return {
              kind: 'success',
              text: [
                `已解析 ${isCsv ? 'CSV' : 'XLSX'}：将为项目 ${projectId} 创建 ${plan.total} 个任务（按层级列还原父子树）。当前未写入。`,
                ...plan.outline.map(item => `${'  '.repeat(item.depth)}${item.code}｜${item.title}`),
                `确认命令：/pm task import ${projectId} ${filePath} confirm`,
              ].join('\n'),
            }
          }
          const created = await importTasksFromGrid(domain, projectId, parsedGrid)
          return {
            kind: 'success',
            text: [
              `已从 ${isCsv ? 'CSV' : 'XLSX'} 导入 ${created.length} 个任务到项目 ${projectId}：`,
              ...created.map(task => `  ${task.code}｜${task.id}｜${task.title}`),
            ].join('\n'),
          }
        } catch (error) {
          return { kind: 'error', text: `${isCsv ? 'CSV' : 'XLSX'} 导入失败：${error instanceof Error ? error.message : String(error)}` }
        }
      }
      let markdown: string
      try {
        markdown = readFileSync(filePath, 'utf8')
      } catch {
        return { kind: 'error', text: `无法读取清单文件：${filePath}（请确认路径存在且可读）。` }
      }
      const plan = planTaskImport(domain, projectId, markdown)
      if (confirmation !== 'confirm') {
        return {
          kind: 'success',
          text: [
            `已解析清单：将为项目 ${projectId} 创建 ${plan.total} 个任务（其中 ${plan.done} 个为已完成）。当前未写入。`,
            ...plan.outline.map(item => `${'  '.repeat(item.depth)}${item.code}｜${item.done ? '[x]' : '[ ]'} ${item.title}`),
            `确认命令：/pm task import ${projectId} ${filePath} confirm`,
          ].join('\n'),
        }
      }
      const created = await importTasksFromMarkdown(domain, projectId, markdown)
      return {
        kind: 'success',
        text: [
          `已导入 ${created.length} 个任务到项目 ${projectId}（${created.filter(task => task.done).length} 个标记为已完成）：`,
          ...created.map(task => `  ${task.code}｜${task.id}｜${task.title}`),
        ].join('\n'),
      }
    }
    if (action === 'importmd') {
      // `/pm task importmd <项目ID> <JSON编码的Markdown> [confirm]`：按（Web 编辑后的）Markdown 清单落盘，不再调模型。
      const tokens = argument.split(/\s+/).filter(Boolean)
      if (tokens.length < 2) {
        return { kind: 'error', text: '请使用：/pm task importmd <项目ID> "<JSON 编码的 Markdown 清单>" [confirm]' }
      }
      const projectId = tokens[0]
      const confirmation = tokens[tokens.length - 1].toLowerCase() === 'confirm'
      const jsonArg = confirmation ? tokens.slice(1, -1).join(' ') : tokens.slice(1).join(' ')
      let markdown: string
      try {
        markdown = JSON.parse(jsonArg)
        if (typeof markdown !== 'string') throw new Error('not string')
      } catch {
        return { kind: 'error', text: 'Markdown 参数不是有效的 JSON 字符串（请由 Web 面板生成）。' }
      }
      try {
        const plan = planTaskImport(domain, projectId, markdown)
        if (!confirmation) {
          return {
            kind: 'success',
            text: [
              `已解析编辑后的清单：将创建 ${plan.total} 个任务。当前未写入。`,
              ...plan.outline.map(item => `${'  '.repeat(item.depth)}${item.code}｜${item.done ? '[x]' : '[ ]'} ${item.title}`),
            ].join('\n'),
          }
        }
        const created = await importTasksFromMarkdown(domain, projectId, markdown)
        return {
          kind: 'success',
          text: [
            `已按编辑后的清单创建 ${created.length} 个任务：`,
            ...created.map(task => `  ${task.code}｜${task.id}｜${task.title}`),
          ].join('\n'),
        }
      } catch (error) {
        return { kind: 'error', text: `导入失败：${error instanceof Error ? error.message : String(error)}` }
      }
    }
    if (action === 'import-content') {
      // OPT-12：/pm task import-content <项目ID> <文件名> <JSON编码内容> [confirm]
      // csv: 内容为 CSV 原文；xlsx: 内容为 base64。网页 FileReader 读取后经 execute 桥传入。
      const tokens = argument.split(/\s+/).filter(Boolean)
      if (tokens.length < 3) {
        return { kind: 'error', text: '请使用：/pm task import-content <项目ID> <文件名.csv|.xlsx> "<JSON 编码内容>" [confirm]' }
      }
      const projectId = tokens[0]
      const filename = tokens[1]
      const confirmation = tokens[tokens.length - 1].toLowerCase() === 'confirm'
      const jsonArg = confirmation ? tokens.slice(2, -1).join(' ') : tokens.slice(2).join(' ')
      const isCsv = /\.csv$/i.test(filename)
      const isXlsx = /\.xlsx$/i.test(filename)
      if (!isCsv && !isXlsx) {
        return { kind: 'error', text: `不支持的文件类型：${filename}（仅 .csv / .xlsx）` }
      }
      try {
        let grid: string[][]
        if (isCsv) {
          let csvText: string
          try { csvText = JSON.parse(jsonArg); if (typeof csvText !== 'string') throw new Error() }
          catch { return { kind: 'error', text: 'CSV 内容不是有效的 JSON 字符串（请由 Web 面板生成）。' } }
          grid = parseCsvLocal(csvText)
        } else {
          let b64: string
          try { b64 = JSON.parse(jsonArg); if (typeof b64 !== 'string') throw new Error() }
          catch { return { kind: 'error', text: 'XLSX 内容不是有效的 base64 JSON（请由 Web 面板生成）。' } }
          grid = await readXlsxGridFromBuffer(Uint8Array.from(Buffer.from(b64, 'base64')))
        }
        const plan = planGridCsvImport(domain, projectId, grid)
        if (!confirmation) {
          return {
            kind: 'success',
            text: [
              `已解析上传文件 ${filename}：将为项目 ${projectId} 创建 ${plan.total} 个任务（按层级列还原父子树）。当前未写入。`,
              ...plan.outline.map(item => `${'  '.repeat(item.depth)}${item.code}｜${item.title}`),
            ].join('\n'),
          }
        }
        const created = await importTasksFromGrid(domain, projectId, grid)
        return {
          kind: 'success',
          text: [
            `已从上传文件导入 ${created.length} 个任务到项目 ${projectId}：`,
            ...created.map(task => `  ${task.code}｜${task.id}｜${task.title}`),
          ].join('\n'),
        }
      } catch (error) {
        return { kind: 'error', text: `导入失败：${error instanceof Error ? error.message : String(error)}` }
      }
    }
    if (action === 'batch') {
      // `/pm task batch update t-0001,t-0002 {"status":"done"}`
      // `/pm task batch delete t-0001,t-0002 [confirm]`（级联含后代，dry-run 先列总数）
      const tokens = argument.split(/\s+/).filter(Boolean)
      const sub = (tokens[0] ?? '').toLowerCase()
      if (sub === 'update') {
        const ids = (tokens[1] ?? '').split(',').filter(Boolean)
        const json = tokens.slice(2).join(' ')
        if (!ids.length || !json) return { kind: 'error', text: '请使用：/pm task batch update <id,id,...> {JSON 字段}' }
        let fields
        try { fields = JSON.parse(json) } catch { return { kind: 'error', text: '字段参数不是有效 JSON。' } }
        try {
          const r = await batchUpdateTasks(domain!, ids, fields)
          return { kind: 'success', text: `批量更新完成：成功 ${r.updated} 个${r.skipped ? `，跳过 ${r.skipped} 个（不存在）` : ''}。` }
        } catch (error) {
          return { kind: 'error', text: `批量更新失败：${error instanceof Error ? error.message : String(error)}` }
        }
      }
      if (sub === 'delete') {
        const ids = (tokens[1] ?? '').split(',').filter(Boolean)
        const confirmation = tokens[tokens.length - 1]?.toLowerCase() === 'confirm'
        if (!ids.length) return { kind: 'error', text: '请使用：/pm task batch delete <id,id,...> [confirm]' }
        const plan = planBatchDelete(domain!, ids)
        if (!confirmation) {
          return {
            kind: 'success',
            text: [
              `即将级联删除所选 ${plan.selected} 个任务及其全部后代，共 ${plan.totalWithDescendants} 个（旁支保留）。`,
              `确认命令：/pm task batch delete ${ids.join(',')} confirm`,
            ].join('\n'),
          }
        }
        try {
          const removed = await batchDeleteCascade(domain!, ids)
          return { kind: 'success', text: `已批量级联删除 ${removed} 个任务（含后代）。` }
        } catch (error) {
          return { kind: 'error', text: `批量删除被阻止：${error instanceof Error ? error.message : String(error)}` }
        }
      }
      return { kind: 'error', text: '请使用：/pm task batch update <id,id,...> {JSON} ｜ /pm task batch delete <id,id,...> [confirm]' }
    }
    if (action === 'wbs') {
      const tokens = argument.split(/\s+/).filter(Boolean)
      if (tokens.length < 2) {
        return { kind: 'error', text: '请使用：/pm task wbs <项目ID> <一句话目标> [confirm]' }
      }
      const projectId = tokens[0]
      let rest = tokens.slice(1)
      const confirmation = rest[rest.length - 1].toLowerCase() === 'confirm'
      if (confirmation) rest = rest.slice(0, -1)
      // 无 confirm：生成草稿（调一次模型）并缓存，只预览不落盘。
      // 带 confirm：优先复用上次缓存草稿（不再调模型）；未命中才现场生成后直接落盘。
      // --raw：仅返回原始 Markdown 草稿（供 Web 可编辑预览，再用 task importmd 落盘）。
      const wantRaw = rest.includes('--raw')
      if (wantRaw) rest = rest.filter(tok => tok !== '--raw')
      const goal = rest.join(' ').trim()
      if (!goal) {
        return { kind: 'error', text: '请给一句话目标，例如：/pm task wbs p-0001 「做一个移动端打卡小程序」' }
      }
      let markdown: string
      try {
        const route = resolveModelRoute(getModelMode(domain), 'wbs')
        if (confirmation) {
          markdown = recallDraft(projectId, goal) ?? await generateWbsMarkdown(llm, goal, route)
        } else {
          markdown = await generateWbsMarkdown(llm, goal, route)
          rememberDraft(projectId, goal, markdown)
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'PROD_KEY_MISSING') {
          return { kind: 'error', text: PROD_KEY_MISSING_TEXT }
        }
        throw error
      }

      const plan = previewWbsDraft(domain, projectId, markdown) // 校验项目存在且非空清单
      if (wantRaw) {
        return { kind: 'success', text: markdown }
      }
      if (!confirmation) {
        return {
          kind: 'success',
          text: [
            `AI 拆解草稿（项目 ${projectId}）：将创建 ${plan.total} 个任务（其中 ${plan.done} 个标记为已完成）。当前未写入。`,
            ...plan.outline.map(item => `${'  '.repeat(item.depth)}${item.code}｜${item.done ? '[x]' : '[ ]'} ${item.title}`),
            `确认命令：/pm task wbs ${projectId} ${goal} confirm`,
          ].join('\n'),
        }
      }
      const created = await importTasksFromMarkdown(domain, projectId, markdown)
      // F15：WBS confirm 落盘后 best-effort 记录来源（basis=本次新建任务）；置信度统一未提供。
      {
        const recMap = new Map<string, SourceRecord>()
        for (const [, rec] of (domain.table('tasks') as { entries(): IterableIterator<[string, unknown]> }).entries()) {
          const r = rec as SourceRecord
          if (r.projectId === projectId) recMap.set(`tasks:${r.id}`, r)
        }
        const refs = buildSourceRefs({
          actions: created.map(t => ({ op: 'task.create', id: t.id })),
          records: recMap,
          context: created.map(t => ({ table: 'tasks', id: t.id })),
          snapshotVersion: CURRENT_SNAPSHOT_VERSION, ruleRevision: CURRENT_RULE_REVISION,
        })
        void recordProvenance(domain, {
          projectId, kind: 'wbs-import',
          summary: `WBS 确认创建 ${created.length} 个任务`,
          refs,
        })
      }
      return {
        kind: 'success',
        text: [
          `已按 AI 草稿创建 ${created.length} 个任务到项目 ${projectId}（${created.filter(task => task.done).length} 个标记为已完成）：`,
          ...created.map(task => `  ${task.code}｜${task.id}｜${task.title}`),
        ].join('\n'),
      }
    }
    if (action === 'checklist') {
      // /pm task checklist <add|toggle|rename|remove> <taskId> [itemId] [true|false|新文本]
      const tokens = argument.split(/\s+/).filter(Boolean)
      const sub = (tokens[0] ?? '').toLowerCase()
      const taskId = tokens[1]
      if (!taskId) {
        return { kind: 'error', text: '请使用：/pm task checklist <add|toggle|rename|remove> <任务ID> ...' }
      }
      if (sub === 'add') {
        const text = tokens.slice(2).join(' ').trim()
        const task = await addTaskChecklistItem(domain, taskId, text)
        const items = task.checklist ?? []
        return {
          kind: 'success',
          text: [
            `清单已追加 1 项。任务 ${task.id} 现有清单 ${items.length} 项（已勾 ${items.filter(i => i.done).length}）：`,
            ...renderChecklistLines(task),
          ].join('\n'),
        }
      }
      if (sub === 'toggle') {
        const itemId = tokens[2]
        const target = tokens[3]?.toLowerCase()
        if (!itemId || (target !== 'true' && target !== 'false')) {
          return { kind: 'error', text: '请使用：/pm task checklist toggle <任务ID> <itemId> <true|false>' }
        }
        const task = await setTaskChecklistItemDone(domain, taskId, itemId, target === 'true')
        const items = task.checklist ?? []
        return {
          kind: 'success',
          text: [
            `清单项状态已设为 ${target === 'true' ? '已勾选' : '未勾选'}。任务 ${task.id} 现有清单 ${items.length} 项（已勾 ${items.filter(i => i.done).length}）：`,
            ...renderChecklistLines(task),
          ].join('\n'),
        }
      }
      if (sub === 'rename') {
        const itemId = tokens[2]
        const text = tokens.slice(3).join(' ').trim()
        if (!itemId) {
          return { kind: 'error', text: '请使用：/pm task checklist rename <任务ID> <itemId> <新文本>' }
        }
        const task = await renameTaskChecklistItem(domain, taskId, itemId, text)
        return {
          kind: 'success',
          text: [`清单项文本已更新。任务 ${task.id} 现有清单：`, ...renderChecklistLines(task)].join('\n'),
        }
      }
      if (sub === 'remove') {
        const itemId = tokens[2]
        if (!itemId) {
          return { kind: 'error', text: '请使用：/pm task checklist remove <任务ID> <itemId>' }
        }
        const task = await removeTaskChecklistItem(domain, taskId, itemId)
        return {
          kind: 'success',
          text: [
            `清单项已删除。任务 ${task.id} 剩余清单 ${(task.checklist ?? []).length} 项：`,
            ...renderChecklistLines(task),
          ].join('\n'),
        }
      }
      return { kind: 'error', text: '请使用：/pm task checklist <add|toggle|rename|remove> <任务ID> ...' }
    }
    if (action === 'backfill-completed') {
      const projectId = argument.trim() || undefined
      if (projectId && !domain.table('projects').get(projectId)) {
        return { kind: 'error', text: `未找到项目：${projectId}。` }
      }
      const result = await backfillCompletedDates(domain, projectId)
      const lines = [
        `完成日期回填（范围：${projectId ? `项目 ${projectId}` : '全部项目'}）`,
        `已是完成态且原本带完成日期：${result.alreadyHad} 条（未改动）`,
        `据截止日期推断补录：${result.inferred.length} 条`,
        ...result.inferred.map(item => `  - ${item.id}｜${item.title}：completedDate=${item.completedDate}（据截止日期推断）`),
        `无截止日期、保持空缺不伪造：${result.skippedNoDue.length} 条`,
        ...result.skippedNoDue.map(item => `  - ${item.id}｜${item.title}（无 dueDate，未进入历史统计）`),
      ]
      return { kind: 'success', text: lines.join('\n') }
    }
    const renumberMatch = /^(\S+)(?:\s+(confirm))?$/i.exec(argument)
    if (!renumberMatch) {
      return { kind: 'error', text: '请使用：/pm task renumber <项目ID> confirm' }
    }
    const [, projectId, confirmation] = renumberMatch
    const tasks = listTasks(domain, projectId)
    if (!confirmation) {
      return {
        kind: 'success',
        text: [
          `即将重新编号项目 ${projectId} 的 ${tasks.length} 个任务。`,
          '当前未执行重新编号；确认后会按当前父子关系和同级顺序重建 WBS 编号。',
          `确认命令：/pm task renumber ${projectId} confirm`,
        ].join('\n'),
      }
    }
    const renumbered = await renumberTasks(domain, projectId)
    return {
      kind: 'success',
      text: renumbered.length
        ? `项目 ${projectId} 的 ${renumbered.length} 个任务已重新编号。`
        : `项目 ${projectId} 暂无任务，无需重新编号。`,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `任务参数不正确：${describeTaskValidation(error)}。` }
    }
    if (error instanceof TaskProjectNotFoundError
      || error instanceof ParentTaskNotFoundError
      || error instanceof ParentTaskProjectMismatchError
      || error instanceof TaskHasChildrenError
      || error instanceof TaskMoveCycleError
      || error instanceof TaskMilestoneNotFoundError
      || error instanceof TaskMilestoneProjectMismatchError
      || error instanceof TaskDeliverableNotFoundError
      || error instanceof TaskDeliverableProjectMismatchError
      || error instanceof TaskReferencedByMeetingError
      || error instanceof TaskReferencedByPredecessorError
      || error instanceof TaskImportNoProjectError
      || error instanceof TaskImportEmptyError
      || error instanceof TaskChecklistTaskNotFoundError
      || error instanceof ChecklistItemNotFoundError
      || error instanceof ChecklistHasChildrenError
      || error instanceof ChecklistParentHasChecklistError
      || error instanceof ChecklistFullError) {
      return { kind: 'error', text: error.message }
    }
    if (error instanceof AiDraftError) {
      return { kind: 'error', text: `AI 拆解暂不可用：${error.message}你仍可用 /pm task add 手工录入。` }
    }
    if (error instanceof AggregateError) {
      // S1-G2：复合写失败 + 回滚不完整 → 结构化中文摘要（原始错误 + 各回滚错误），
      // 而不是泛化的「任务操作失败」。格式化失败时回退到通用文案，绝不向用户抛堆栈。
      const formatted = formatAggregateCommandError(error)
      if (formatted) return { kind: 'error', text: formatted }
    }
    console.error('[pm-tool] 任务操作失败：', error)
    return { kind: 'error', text: '任务操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
