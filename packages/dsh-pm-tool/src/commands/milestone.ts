/** /pm milestone add/list/get：解析离线里程碑命令并渲染中文结果。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addMilestone,
  getMilestone,
  listMilestones,
  MilestoneProjectNotFoundError,
} from '../core/milestones.js'
import {
  describeMilestoneValidation,
  milestoneStatusLabels,
  type Milestone,
} from '../core/milestone.js'
import type { PmDomain } from '../core/storage.js'

export const milestoneHelp = [
  '里程碑命令（离线，无需 API Key）：',
  '  /pm milestone add {"projectId":"p-0001","title":"首版发布","targetDate":"2026-12-31"}',
  '  /pm milestone list p-0001',
  '  /pm milestone get m-0001',
  'add 支持 description、status、achievedDate；默认状态 planned、实际达成日期 null。',
  '里程碑状态由用户手动维护；自动到期提醒第一版不做。',
  'ID 和时间戳由系统生成。',
].join('\n')

function renderMilestone(milestone: Milestone): string {
  return [
    `里程碑 ID：${milestone.id}`,
    `项目 ID：${milestone.projectId}`,
    `标题：${milestone.title}`,
    `目标日期：${milestone.targetDate}`,
    `状态：${milestoneStatusLabels[milestone.status]}`,
    `实际达成日期：${milestone.achievedDate ?? '未填写'}`,
    `说明/达成标准：${milestone.description || '未填写'}`,
    `创建时间：${milestone.createdAt}`,
    `更新时间：${milestone.updatedAt}`,
  ].join('\n')
}

export async function handleMilestoneCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: milestoneHelp }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const argument = match[2]?.trim() ?? ''
  if (!['add', 'list', 'get'].includes(action)) {
    return { kind: 'error', text: `不支持的里程碑操作。\n${milestoneHelp}` }
  }
  if (!domain) return { kind: 'error', text: '里程碑存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }

  try {
    if (action === 'add') {
      let fields: unknown
      try {
        fields = JSON.parse(argument)
      } catch {
        return { kind: 'error', text: `里程碑参数须为合法 JSON 对象，请使用英文双引号。\n${milestoneHelp}` }
      }
      const milestone = await addMilestone(domain, fields)
      return { kind: 'success', text: `里程碑已新增并保存。\n${renderMilestone(milestone)}` }
    }
    if (!argument || /\s/.test(argument)) {
      return {
        kind: 'error',
        text: action === 'list'
          ? '请指定一个项目 ID：/pm milestone list p-0001'
          : '请指定一个里程碑 ID：/pm milestone get m-0001',
      }
    }
    if (action === 'list') {
      const milestones = listMilestones(domain, argument)
      return {
        kind: 'success',
        text: milestones.length
          ? [
              `里程碑时间线（项目 ${argument}，共 ${milestones.length} 项）：`,
              ...milestones.map(milestone =>
                `${milestone.targetDate}｜${milestone.id}｜${milestone.title}｜${milestoneStatusLabels[milestone.status]}`,
              ),
              '查看详情：/pm milestone get <里程碑ID>',
            ].join('\n')
          : `项目 ${argument} 暂无里程碑。`,
      }
    }
    const milestone = getMilestone(domain, argument)
    return milestone
      ? { kind: 'success', text: renderMilestone(milestone) }
      : { kind: 'error', text: `未找到里程碑：${argument}。请用 /pm milestone list <项目ID> 查看时间线。` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `里程碑参数不正确：${describeMilestoneValidation(error)}。` }
    }
    if (error instanceof MilestoneProjectNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    console.error('[pm-tool] 里程碑操作失败：', error)
    return { kind: 'error', text: '里程碑操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
