/** /pm task add/list/get：解析离线 WBS 命令并渲染中文结果。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addTask,
  getTask,
  listTasks,
  ParentTaskNotFoundError,
  ParentTaskProjectMismatchError,
  TaskProjectNotFoundError,
} from '../core/tasks.js'
import { describeTaskValidation, taskStatusLabels, type Task } from '../core/task.js'
import type { PmDomain } from '../core/storage.js'

export const taskHelp = [
  'WBS 任务命令（离线，无需 API Key）：',
  '  /pm task add {"projectId":"p-0001","title":"需求确认"}',
  '  /pm task add {"projectId":"p-0001","parentId":"t-0001","title":"访谈用户"}',
  '  /pm task list p-0001',
  '  /pm task get t-0001',
  'ID、WBS 编号、同级顺序和时间戳由系统生成；milestoneId 当前仅支持 null。',
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

export async function handleTaskCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: taskHelp }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const argument = match[2]?.trim() ?? ''
  if (!['add', 'list', 'get'].includes(action)) {
    return { kind: 'error', text: `不支持的任务操作。\n${taskHelp}` }
  }
  if (!domain) return { kind: 'error', text: '任务存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }

  try {
    if (action === 'add') {
      let fields: unknown
      try {
        fields = JSON.parse(argument)
      } catch {
        return { kind: 'error', text: `任务参数须为合法 JSON 对象，请使用英文双引号。\n${taskHelp}` }
      }
      const task = await addTask(domain, fields)
      return { kind: 'success', text: `任务已新增并保存。\n${renderTask(task)}` }
    }
    if (!argument || /\s/.test(argument)) {
      return {
        kind: 'error',
        text: action === 'list'
          ? '请指定一个项目 ID：/pm task list p-0001'
          : '请指定一个任务 ID：/pm task get t-0001',
      }
    }
    if (action === 'list') {
      const tasks = listTasks(domain, argument)
      return {
        kind: 'success',
        text: tasks.length
          ? [`WBS 任务树（项目 ${argument}，共 ${tasks.length} 项）：`,
              ...tasks.map(task =>
                `${'  '.repeat(task.code.split('.').length - 1)}${task.code}｜${task.id}｜${task.title}｜${taskStatusLabels[task.status]}｜${task.progress}%`,
              ),
              '查看详情：/pm task get <任务ID>',
            ].join('\n')
          : `项目 ${argument} 暂无任务。`,
      }
    }
    const task = getTask(domain, argument)
    return task
      ? { kind: 'success', text: renderTask(task) }
      : { kind: 'error', text: `未找到任务：${argument}。请用 /pm task list <项目ID> 查看任务树。` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `任务参数不正确：${describeTaskValidation(error)}。` }
    }
    if (error instanceof TaskProjectNotFoundError
      || error instanceof ParentTaskNotFoundError
      || error instanceof ParentTaskProjectMismatchError) {
      return { kind: 'error', text: error.message }
    }
    console.error('[pm-tool] 任务操作失败：', error)
    return { kind: 'error', text: '任务操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
