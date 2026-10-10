/** /pm meeting：会议纪要与行动项离线命令。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addMeeting,
  addMeetingAction,
  deleteMeeting,
  deleteMeetingAction,
  getMeeting,
  listMeetings,
  MeetingActionNotFoundError,
  MeetingProjectNotFoundError,
  MeetingRelationMismatchError,
  MeetingRelationNotFoundError,
  updateMeeting,
  updateMeetingAction,
} from '../core/meetings.js'
import {
  describeMeetingValidation,
  meetingActionStatusLabels,
  meetingStatusLabels,
  type Meeting,
  type MeetingAction,
  type MeetingStatus,
} from '../core/meeting.js'
import type { PmDomain } from '../core/storage.js'

export const meetingHelp = [
  '会议纪要命令（离线，无需 API Key）：',
  '  /pm meeting add {"projectId":"p-0001","title":"项目周会","meetingDate":"2026-10-10"}',
  '  /pm meeting list p-0001 [all|draft|final]',
  '  /pm meeting get mtg-0001',
  '  /pm meeting update mtg-0001 {"status":"final","summary":"确认发布范围"}',
  '  /pm meeting delete mtg-0001 confirm',
  '  /pm meeting action add mtg-0001 {"title":"完成验收","owner":"Ice","taskId":"t-0001"}',
  '  /pm meeting action update mtg-0001 ai-001 {"status":"done"}',
  '  /pm meeting action delete mtg-0001 ai-001 confirm',
].join('\n')

function renderAction(action: MeetingAction): string {
  return `${action.id}｜${action.title}｜${meetingActionStatusLabels[action.status]}｜负责人 ${action.owner || '未填写'}｜任务 ${action.taskId ?? '-'}｜问题 ${action.riskIssueId ?? '-'}`
}

function renderMeeting(meeting: Meeting): string {
  return [
    `会议 ID：${meeting.id}`,
    `项目 ID：${meeting.projectId}`,
    `标题：${meeting.title}`,
    `日期：${meeting.meetingDate}${meeting.startTime ? ` ${meeting.startTime}` : ''}`,
    `状态：${meetingStatusLabels[meeting.status]}`,
    `主持人：${meeting.facilitator || '未填写'}`,
    `记录人：${meeting.recorder || '未填写'}`,
    `参会人：${meeting.participants.join('、') || '未填写'}`,
    `地点/链接：${meeting.location || '未填写'}`,
    `摘要：${meeting.summary || '未填写'}`,
    `议题：${meeting.topics.join('；') || '未填写'}`,
    `决议：${meeting.decisions.join('；') || '未填写'}`,
    `行动项（${meeting.actions.length}）：`,
    ...(meeting.actions.length ? meeting.actions.map(renderAction) : ['暂无']),
  ].join('\n')
}

function parseJson(value: string): unknown {
  return JSON.parse(value)
}

export async function handleMeetingCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: meetingHelp }
  if (!domain) return { kind: 'error', text: '会议纪要存储未就绪，请检查 pm profile 的存储配置。' }
  try {
    const actionMatch = /^action\s+(add|update|delete)\s+([\s\S]+)$/i.exec(input)
    if (actionMatch) {
      const operation = actionMatch[1].toLowerCase()
      const argument = actionMatch[2].trim()
      if (operation === 'add') {
        const match = /^(\S+)\s+([\s\S]+)$/.exec(argument)
        if (!match) return { kind: 'error', text: '请使用：/pm meeting action add <会议ID> {JSON}' }
        const result = await addMeetingAction(domain, match[1], parseJson(match[2]))
        return { kind: 'success', text: `行动项已新增：${renderAction(result)}` }
      }
      if (operation === 'update') {
        const match = /^(\S+)\s+(\S+)\s+([\s\S]+)$/.exec(argument)
        if (!match) return { kind: 'error', text: '请使用：/pm meeting action update <会议ID> <行动项ID> {JSON}' }
        const result = await updateMeetingAction(domain, match[1], match[2], parseJson(match[3]))
        return result
          ? { kind: 'success', text: `行动项已更新：${renderAction(result)}` }
          : { kind: 'error', text: `未找到行动项：${match[2]}。` }
      }
      const match = /^(\S+)\s+(\S+)(?:\s+(confirm))?$/i.exec(argument)
      if (!match) return { kind: 'error', text: '请使用：/pm meeting action delete <会议ID> <行动项ID> confirm' }
      const meeting = getMeeting(domain, match[1])
      const current = meeting?.actions.find(item => item.id === match[2])
      if (!current) return { kind: 'error', text: `未找到行动项：${match[2]}。` }
      if (!match[3]) {
        return { kind: 'success', text: `即将删除行动项：${renderAction(current)}。\n当前未执行删除。\n确认命令：/pm meeting action delete ${match[1]} ${match[2]} confirm` }
      }
      const result = await deleteMeetingAction(domain, match[1], match[2])
      return { kind: 'success', text: `行动项已删除：${result!.id}｜${result!.title}。` }
    }

    const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
    const operation = match[1].toLowerCase()
    const argument = match[2]?.trim() ?? ''
    if (operation === 'add') {
      const meeting = await addMeeting(domain, parseJson(argument))
      return { kind: 'success', text: `会议纪要已新增并保存。\n${renderMeeting(meeting)}` }
    }
    if (operation === 'list') {
      const parts = argument.split(/\s+/).filter(Boolean)
      if (parts.length < 1 || parts.length > 2 || !['all', 'draft', 'final'].includes(parts[1] ?? 'all')) {
        return { kind: 'error', text: '请使用：/pm meeting list <项目ID> [all|draft|final]' }
      }
      const status = (parts[1] && parts[1] !== 'all' ? parts[1] : undefined) as MeetingStatus | undefined
      const meetings = listMeetings(domain, parts[0], status)
      return {
        kind: 'success',
        text: meetings.length
          ? [`会议纪要（项目 ${parts[0]}，共 ${meetings.length} 项）：`, ...meetings.map(item =>
              `${item.id}｜${item.meetingDate}｜${item.title}｜${meetingStatusLabels[item.status]}｜行动项 ${item.actions.length}`,
            )].join('\n')
          : `项目 ${parts[0]} 暂无符合条件的会议纪要。`,
      }
    }
    if (operation === 'get') {
      if (!argument || /\s/.test(argument)) return { kind: 'error', text: '请指定会议 ID：/pm meeting get mtg-0001' }
      const meeting = getMeeting(domain, argument)
      return meeting ? { kind: 'success', text: renderMeeting(meeting) } : { kind: 'error', text: `未找到会议：${argument}。` }
    }
    if (operation === 'update') {
      const updateMatch = /^(\S+)\s+([\s\S]+)$/.exec(argument)
      if (!updateMatch) return { kind: 'error', text: '请使用：/pm meeting update <会议ID> {JSON片段}' }
      const meeting = await updateMeeting(domain, updateMatch[1], parseJson(updateMatch[2]))
      return meeting
        ? { kind: 'success', text: `会议纪要已更新并保存。\n${renderMeeting(meeting)}` }
        : { kind: 'error', text: `未找到会议：${updateMatch[1]}。` }
    }
    if (operation === 'delete') {
      const deleteMatch = /^(\S+)(?:\s+(confirm))?$/i.exec(argument)
      if (!deleteMatch) return { kind: 'error', text: '请使用：/pm meeting delete <会议ID> confirm' }
      const current = getMeeting(domain, deleteMatch[1])
      if (!current) return { kind: 'error', text: `未找到会议：${deleteMatch[1]}。` }
      if (!deleteMatch[2]) {
        return { kind: 'success', text: `即将删除会议：${current.id}｜${current.title}。\n当前未执行删除。\n确认命令：/pm meeting delete ${current.id} confirm` }
      }
      await deleteMeeting(domain, current.id)
      return { kind: 'success', text: `会议纪要已删除：${current.id}｜${current.title}。` }
    }
    return { kind: 'error', text: `不支持的会议操作。\n${meetingHelp}` }
  } catch (error) {
    if (error instanceof SyntaxError) return { kind: 'error', text: '会议参数须为合法 JSON 对象，请使用英文双引号。' }
    if (error instanceof z.ZodError) return { kind: 'error', text: `会议参数不正确：${describeMeetingValidation(error)}。` }
    if (error instanceof MeetingProjectNotFoundError
      || error instanceof MeetingRelationNotFoundError
      || error instanceof MeetingRelationMismatchError
      || error instanceof MeetingActionNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    console.error('[pm-tool] 会议纪要操作失败：', error)
    return { kind: 'error', text: '会议纪要操作失败，请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
