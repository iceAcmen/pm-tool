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
  ParentTaskNotFoundError,
  ParentTaskProjectMismatchError,
  renumberTasks,
  TaskHasChildrenError,
  TaskMoveCycleError,
  TaskMilestoneNotFoundError,
  TaskMilestoneProjectMismatchError,
  TaskProjectNotFoundError,
  TaskReferencedByMeetingError,
  updateTask,
  batchUpdateTasks,
  planBatchDelete,
  batchDeleteCascade,
} from '../core/tasks.js'
import {
  importTasksFromMarkdown,
  planTaskImport,
  TaskImportEmptyError,
  TaskImportNoProjectError,
} from '../core/task-import.js'
import { planCsvImport, importTasksFromCsv, planGridCsvImport, importTasksFromGrid, readXlsxGrid, parseCsv as parseCsvLocal } from '../core/csv-import.js'
import { generateWbsMarkdown, previewWbsDraft, rememberDraft, recallDraft } from '../core/wbs-ai.js'
import { AiDraftError, type LlmGateway } from '../core/ai-client.js'
import { describeTaskValidation, taskStatusLabels, type Task } from '../core/task.js'
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
  '  /pm task delete t-0003 confirm          删除无子任务的任务',
  '  /pm task delete t-0003                  含子任务时 dry-run 列出将级联删除的整棵子树（不落盘）',
  '  /pm task delete t-0003 cascade confirm  显式级联删除该任务及其全部后代（旁支不受影响）',
  '  /pm task renumber p-0001 confirm',
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
  'milestoneId 必须指向同项目已存在里程碑；ID、WBS 编号、同级顺序和时间戳由系统生成。',
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
    `状态：${taskStatusLabels[task.status]}`,
    `优先级：${task.priority}`,
    `开始日期：${task.startDate ?? '未填写'}`,
    `截止日期：${task.dueDate ?? '未填写'}`,
    `进度：${task.progress}%`,
    `里程碑：${task.milestoneId ?? '无'}`,
    `创建时间：${task.createdAt}`,
    `更新时间：${task.updatedAt}`,
  ].join('\n')
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

export async function handleTaskCommand(rawInput: string, domain?: PmDomain, llm?: LlmGateway): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: taskHelp }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const argument = match[2]?.trim() ?? ''
  if (!['add', 'list', 'get', 'update', 'delete', 'move', 'renumber', 'import', 'importmd', 'batch', 'wbs'].includes(action)) {
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
      return { kind: 'success', text: `任务已新增并保存。\n${renderTask(task)}` }
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
      const task = await updateTask(domain, updateMatch[1], fields)
      return task
        ? { kind: 'success', text: `任务已更新并保存。\n${renderTask(task)}` }
        : { kind: 'error', text: `未找到任务：${updateMatch[1]}。` }
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
              `如确需级联删除，确认命令：/pm task delete ${id} cascade confirm`,
            ].join('\n'),
          }
        }
        return {
          kind: 'success',
          text: [
            `即将删除任务：${current.code}｜${current.id}｜${current.title}。`,
            '当前未执行删除。',
            `确认命令：/pm task delete ${current.id} confirm`,
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
        return {
          kind: 'success',
          text: deleted.length
            ? `已级联删除 ${deleted.length} 个任务（${current.code} 及其 ${deleted.length - 1} 个后代）；旁支任务不受影响。`
            : `未删除任何任务：${id}。`,
        }
      }
      const deleted = await deleteTask(domain, id)
      return deleted
        ? { kind: 'success', text: `任务已删除：${deleted.code}｜${deleted.id}｜${deleted.title}。WBS 编号未自动调整。` }
        : { kind: 'error', text: `未找到任务：${id}。` }
    }
    if (action === 'move') {
      const moveMatch = /^(\S+)\s+(\S+)(?:\s+(confirm))?$/i.exec(argument)
      if (!moveMatch) {
        return { kind: 'error', text: '请使用：/pm task move <任务ID> <新父任务ID|root> confirm' }
      }
      const [, id, destination, confirmation] = moveMatch
      const current = getTask(domain, id)
      if (!current) return { kind: 'error', text: `未找到任务：${id}。` }
      const newParentId = destination.toLowerCase() === 'root' ? null : destination
      if (!confirmation) {
        return {
          kind: 'success',
          text: [
            `即将移动任务：${current.code}｜${current.id}｜${current.title}。`,
            `新父任务：${newParentId ?? '根层级'}。当前未执行移动。`,
            '移动后保留旧 WBS 编号；需要连续编号时再显式执行 renumber。',
            `确认命令：/pm task move ${current.id} ${newParentId ?? 'root'} confirm`,
          ].join('\n'),
        }
      }
      const moved = await moveTask(domain, id, newParentId)
      return moved
        ? {
            kind: 'success',
            text: `任务已移动到${moved.parentId ? `父任务 ${moved.parentId}` : '根层级'}；原 WBS 编号 ${moved.code} 暂时保留。\n${renderTask(moved)}`,
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
      if (confirmation) {
        markdown = recallDraft(projectId, goal) ?? await generateWbsMarkdown(llm, goal)
      } else {
        markdown = await generateWbsMarkdown(llm, goal)
        rememberDraft(projectId, goal, markdown)
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
      return {
        kind: 'success',
        text: [
          `已按 AI 草稿创建 ${created.length} 个任务到项目 ${projectId}（${created.filter(task => task.done).length} 个标记为已完成）：`,
          ...created.map(task => `  ${task.code}｜${task.id}｜${task.title}`),
        ].join('\n'),
      }
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
      || error instanceof TaskReferencedByMeetingError
      || error instanceof TaskImportNoProjectError
      || error instanceof TaskImportEmptyError) {
      return { kind: 'error', text: error.message }
    }
    if (error instanceof AiDraftError) {
      return { kind: 'error', text: `AI 拆解暂不可用：${error.message}你仍可用 /pm task add 手工录入。` }
    }
    console.error('[pm-tool] 任务操作失败：', error)
    return { kind: 'error', text: '任务操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
