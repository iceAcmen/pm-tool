/** /pm project add/list/get：只解析命令并渲染中文结果。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import { addProject, getProject, listProjects } from '../core/projects.js'
import { describeProjectValidation, projectStatusLabels, type Project } from '../core/project.js'
import type { PmDomain } from '../core/storage.js'

export const projectHelp = [
  '项目命令（离线，无需 API Key）：',
  '  /pm project add {"name":"上线计划","startDate":"2026-10-10","targetDate":"2026-10-31"}',
  '  /pm project list',
  '  /pm project get p-0001',
  'add 支持 description、owner、status、tags；默认描述和负责人为空、状态为 planning。',
  '日期必填，格式 YYYY-MM-DD；tags 为文本数组；ID 和时间戳自动生成。',
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

export async function handleProjectCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') {
    return { kind: 'success', text: projectHelp }
  }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const argument = match[2]?.trim() ?? ''
  if (!['add', 'list', 'get'].includes(action)) {
    return { kind: 'error', text: `不支持的项目操作。\n${projectHelp}` }
  }
  if (!domain) {
    return { kind: 'error', text: '项目存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }
  }
  try {
    if (action === 'add') {
      let fields: unknown
      try {
        fields = JSON.parse(argument)
      } catch {
        return { kind: 'error', text: `项目参数须为合法 JSON 对象，请使用英文双引号。\n${projectHelp}` }
      }
      const project = await addProject(domain, fields)
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
    if (!argument) return { kind: 'error', text: '请指定项目 ID：/pm project get p-0001' }
    const project = getProject(domain, argument)
    return project
      ? { kind: 'success', text: renderProject(project) }
      : { kind: 'error', text: `未找到项目：${argument}。请用 /pm project list 查看已有项目。` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `项目参数不正确：${describeProjectValidation(error)}。` }
    }
    console.error('[pm-tool] 项目操作失败：', error)
    return { kind: 'error', text: '项目操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
