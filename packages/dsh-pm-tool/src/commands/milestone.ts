/** /pm milestone add/list/get：解析离线里程碑命令并渲染中文结果。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addMilestone,
  deleteMilestone,
  getMilestone,
  listMilestones,
  MilestoneHasTasksError,
  MilestoneProjectNotFoundError,
  updateMilestone,
} from '../core/milestones.js'
import {
  describeMilestoneValidation,
  milestoneStatusLabels,
  type Milestone,
} from '../core/milestone.js'
import type { PmDomain } from '../core/storage.js'
import { buildActionLine, buildSuccessEnvelope } from '../core/ui-feedback.js'

export const milestoneHelp = [
  '里程碑命令（离线，无需 API Key）：',
  '  /pm milestone add {"projectId":"p-0001","title":"首版发布","targetDate":"2026-12-31"}',
  '  /pm milestone list p-0001',
  '  /pm milestone get m-0001',
  '  /pm milestone update m-0001 {"status":"achieved","achievedDate":"2026-12-30"}',
  '  /pm milestone delete m-0001 confirm',
  'add 支持 description、status、achievedDate；默认状态 planned、实际达成日期 null。',
  '状态 achieved 必须有 achievedDate；其他状态的 achievedDate 必须为 null。',
  '删除不带 confirm 只显示提示；有关联任务时不能删除。',
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

/** update 变更字段中文短标签（只列本次传入字段；供短摘要第二行）。 */
function describeMilestoneChanges(input: Record<string, unknown>): string {
  const labels: string[] = []
  if (input.title !== undefined) labels.push('标题')
  if (input.targetDate !== undefined) labels.push('目标日期')
  if (input.status !== undefined) labels.push('状态')
  if (input.achievedDate !== undefined) labels.push('实际达成日期')
  if (input.description !== undefined) labels.push('说明')
  return labels.length ? `已修改：${labels.join('、')}` : '已更新'
}

export async function handleMilestoneCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: milestoneHelp }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const argument = match[2]?.trim() ?? ''
  if (!['add', 'list', 'get', 'update', 'delete'].includes(action)) {
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
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`里程碑已新增｜${milestone.id} ${milestone.title}`, `${milestone.targetDate}｜${milestoneStatusLabels[milestone.status]}`],
          renderMilestone(milestone),
        ),
      }
    }
    if (action === 'list') {
      if (!argument || /\s/.test(argument)) {
        return { kind: 'error', text: '请指定一个项目 ID：/pm milestone list p-0001' }
      }
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
    if (action === 'get') {
      if (!argument || /\s/.test(argument)) {
        return { kind: 'error', text: '请指定一个里程碑 ID：/pm milestone get m-0001' }
      }
      const milestone = getMilestone(domain, argument)
      return milestone
        ? { kind: 'success', text: renderMilestone(milestone) }
        : { kind: 'error', text: `未找到里程碑：${argument}。请用 /pm milestone list <项目ID> 查看时间线。` }
    }
    if (action === 'update') {
      const updateMatch = /^(\S+)(?:\s+([\s\S]+))?$/.exec(argument)
      if (!updateMatch?.[2]) {
        return { kind: 'error', text: '请使用：/pm milestone update <里程碑ID> {JSON片段}' }
      }
      let fields: unknown
      try {
        fields = JSON.parse(updateMatch[2])
      } catch {
        return { kind: 'error', text: '更新参数须为合法 JSON 对象，请使用英文双引号。' }
      }
      const milestone = await updateMilestone(domain, updateMatch[1], fields)
      return milestone
        ? {
            kind: 'success',
            text: buildSuccessEnvelope(
              [`里程碑已更新并保存｜${milestone.id} ${milestone.title}`, describeMilestoneChanges(fields as Record<string, unknown>)],
              renderMilestone(milestone),
            ),
          }
        : { kind: 'error', text: `未找到里程碑：${updateMatch[1]}。` }
    }
    const deleteMatch = /^(\S+)(?:\s+(confirm))?$/i.exec(argument)
    if (!deleteMatch) return { kind: 'error', text: '请使用：/pm milestone delete <里程碑ID> confirm' }
    const [, id, confirmation] = deleteMatch
    const current = getMilestone(domain, id)
    if (!current) return { kind: 'error', text: `未找到里程碑：${id}。` }
    if (!confirmation) {
      return {
        kind: 'success',
        text: [
          `即将删除里程碑：${current.id}｜${current.title}｜${current.targetDate}。`,
          '当前未执行删除；有关联任务时即使确认也会被阻止。',
          buildActionLine('确认删除', `/pm milestone delete ${current.id} confirm`),
        ].join('\n'),
      }
    }
    const deleted = await deleteMilestone(domain, id)
    return deleted
      ? {
          kind: 'success',
          text: buildSuccessEnvelope(
            [`里程碑已删除｜${deleted.id} ${deleted.title}`],
            null,
          ),
        }
      : { kind: 'error', text: `未找到里程碑：${id}。` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `里程碑参数不正确：${describeMilestoneValidation(error)}。` }
    }
    if (error instanceof MilestoneProjectNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    if (error instanceof MilestoneHasTasksError) {
      return { kind: 'error', text: `${error.message}，不能删除。请先解除任务关联。` }
    }
    console.error('[pm-tool] 里程碑操作失败：', error)
    return { kind: 'error', text: '里程碑操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
