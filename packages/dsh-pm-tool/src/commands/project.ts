/** /pm project 增删改查：只解析命令并渲染中文结果。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addProject,
  deleteProject,
  getProject,
  listProjects,
  ProjectHasTasksError,
  ProjectNameConflictError,
  updateProject,
} from '../core/projects.js'
import { describeProjectValidation, projectStatusLabels, type Project } from '../core/project.js'
import type { PmDomain } from '../core/storage.js'

export const projectHelp = [
  '项目命令（离线，无需 API Key）：',
  '  /pm project add {"name":"上线计划","startDate":"2026-10-10","targetDate":"2026-10-31"}',
  '  /pm project add {"name":"允许重名","startDate":"2026-10-10","targetDate":"2026-10-31"} confirm',
  '  /pm project list',
  '  /pm project get p-0001',
  '  /pm project update p-0001 {"status":"active","targetDate":"2026-11-15"}',
  '  /pm project delete p-0001 confirm',
  'add 支持 description、owner、status、tags；默认描述和负责人为空、状态为 planning。',
  '新增同名项目默认阻止，末尾加 confirm 才放行；更新改为同名时规则相同。',
  '删除不带 confirm 只显示确认提示，不会删除。',
  '日期格式 YYYY-MM-DD，完成日期不得早于开始日期；ID 和时间戳由系统维护。',
].join('\n')

function renderProject(project: Project): string {
  return [
    `项目 ID：${project.id}`,
    `名称：${project.name}`,
    `目标描述：${project.description || '未填写'}`,
    `负责人：${project.owner || '未填写'}`,
    `状态：${projectStatusLabels[project.status]}`,
    `开始日期：${project.startDate}`,
    `完成日期：${project.targetDate}`,
    `标签：${project.tags?.join('、') || '无'}`,
    `创建时间：${project.createdAt}`,
    `更新时间：${project.updatedAt}`,
  ].join('\n')
}

function parseJsonWithConfirm(argument: string): { fields: unknown, confirm: boolean } | undefined {
  try {
    return { fields: JSON.parse(argument), confirm: false }
  } catch {
    const match = /^([\s\S]*\S)\s+confirm$/i.exec(argument)
    if (!match) return undefined
    try {
      return { fields: JSON.parse(match[1]), confirm: true }
    } catch {
      return undefined
    }
  }
}

export async function handleProjectCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') {
    return { kind: 'success', text: projectHelp }
  }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const argument = match[2]?.trim() ?? ''
  if (!['add', 'list', 'get', 'update', 'delete'].includes(action)) {
    return { kind: 'error', text: `不支持的项目操作。\n${projectHelp}` }
  }
  if (!domain) {
    return { kind: 'error', text: '项目存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }
  }
  try {
    if (action === 'add') {
      const parsed = parseJsonWithConfirm(argument)
      if (!parsed) {
        return { kind: 'error', text: `项目参数须为合法 JSON 对象，请使用英文双引号。\n${projectHelp}` }
      }
      const project = await addProject(domain, parsed.fields, parsed.confirm)
      return { kind: 'success', text: `项目已新增并保存。\n${renderProject(project)}` }
    }
    if (action === 'list') {
      if (argument) return { kind: 'error', text: '项目列表命令不接受参数：/pm project list' }
      const projects = listProjects(domain)
      return {
        kind: 'success',
        text: projects.length
          ? [
              `项目列表（共 ${projects.length} 个）：`,
              ...projects.map(project =>
                `${project.id}｜${project.name}｜${projectStatusLabels[project.status]}｜${project.startDate} → ${project.targetDate}`,
              ),
              '查看详情：/pm project get <项目ID>',
            ].join('\n')
          : '暂无项目。输入 /pm project 查看新增示例。',
      }
    }
    if (action === 'get') {
      if (!argument) return { kind: 'error', text: '请指定项目 ID：/pm project get p-0001' }
      const project = getProject(domain, argument)
      return project
        ? { kind: 'success', text: renderProject(project) }
        : { kind: 'error', text: `未找到项目：${argument}。请用 /pm project list 查看已有项目。` }
    }
    if (action === 'update') {
      const updateMatch = /^(\S+)(?:\s+([\s\S]+))?$/.exec(argument)
      if (!updateMatch?.[2]) {
        return { kind: 'error', text: '请使用：/pm project update <项目ID> {JSON片段} [confirm]' }
      }
      const [, id, jsonArgument] = updateMatch
      const parsed = parseJsonWithConfirm(jsonArgument.trim())
      if (!parsed) {
        return { kind: 'error', text: '更新参数须为合法 JSON 对象，请使用英文双引号。' }
      }
      const project = await updateProject(domain, id, parsed.fields, parsed.confirm)
      return project
        ? { kind: 'success', text: `项目已更新并保存。\n${renderProject(project)}` }
        : { kind: 'error', text: `未找到项目：${id}。请用 /pm project list 查看已有项目。` }
    }
    const deleteMatch = /^(\S+)(?:\s+(confirm))?$/i.exec(argument)
    if (!deleteMatch) {
      return { kind: 'error', text: '请使用：/pm project delete <项目ID> confirm' }
    }
    const [, id, confirmation] = deleteMatch
    const current = getProject(domain, id)
    if (!current) {
      return { kind: 'error', text: `未找到项目：${id}。请用 /pm project list 查看已有项目。` }
    }
    if (!confirmation) {
      return {
        kind: 'success',
        text: [
          `即将删除项目：${current.id}｜${current.name}。`,
          '当前未执行删除。确认后项目记录将从本地 JSON 存储移除。',
          `确认命令：/pm project delete ${current.id} confirm`,
        ].join('\n'),
      }
    }
    const deleted = await deleteProject(domain, id)
    return deleted
      ? { kind: 'success', text: `项目已删除：${deleted.id}｜${deleted.name}。` }
      : { kind: 'error', text: `未找到项目：${id}。请用 /pm project list 查看已有项目。` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `项目参数不正确：${describeProjectValidation(error)}。` }
    }
    if (error instanceof ProjectNameConflictError) {
      return {
        kind: 'error',
        text: [
          `已存在同名项目：${error.conflicting.id}｜${error.conflicting.name}。`,
          '默认不创建或改为同名；确认确需重名时，请在原命令末尾追加 confirm。',
        ].join('\n'),
      }
    }
    if (error instanceof ProjectHasTasksError) {
      return {
        kind: 'error',
        text: `项目 ${error.projectId} 仍有 WBS 任务，不能删除。请先处理项目下的任务。`,
      }
    }
    console.error('[pm-tool] 项目操作失败：', error)
    return { kind: 'error', text: '项目操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
