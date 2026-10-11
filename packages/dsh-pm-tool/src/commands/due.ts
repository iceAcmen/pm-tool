/**
 * R16 临期/逾期提醒命令：`/pm due [天数] [项目ID?]`。纯离线派生，默认全部项目、7 天。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import type { PmDomain } from '../core/storage.js'
import { computeReminders, renderReminders } from '../core/reminders.js'

export const dueHelp = [
  '提醒命令（离线派生，打开即算、无后台调度）：',
  '  /pm due                全部项目：列出未来 7 天临期与已逾期的任务/里程碑',
  '  /pm due 14             窗口改为未来 14 天',
  '  /pm due 7 p-0001       只看指定项目',
  '已完成任务/已达成里程碑不计；逾期红、临期黄（Web 面板顶部提醒区）。',
].join('\n')

export function handleDueCommand(argument: string, domain: PmDomain | undefined): CommandResult {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const tokens = argument.trim().split(/\s+/).filter(Boolean)
  let withinDays = 7
  let projectId: string | undefined
  let today: string | undefined
  for (const token of tokens) {
    if (/^\d+$/.test(token)) withinDays = Number(token)
    else if (/^\d{4}-\d{2}-\d{2}$/.test(token)) today = token  // 可选：固化“今天”，便于测试
    else projectId = token
  }
  if (withinDays < 1 || withinDays > 365) {
    return { kind: 'error', text: '天数需为 1~365 的整数。' }
  }
  const items = computeReminders(domain, { withinDays, projectId, today })
  return { kind: 'success', text: renderReminders(items, withinDays) }
}
