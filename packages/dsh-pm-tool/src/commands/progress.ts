/** /pm progress：任务进展日志（P3 append revision）离线命令。
 *
 * 能力边界：只写 task.progressLog 数组；不改任务五态/进度/排期；不联网；
 * 编辑=追加新修订版，旧正文不可覆盖；delete 为软删（deletedAt），restore 清除且 revision 全保留。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import {
  progressAppend,
  progressEditRevision,
  progressSoftDelete,
  progressRestore,
  currentRevision,
  effectiveAt,
  visibleProgressLog,
  ProgressAuthorEmptyError,
  ProgressContentEmptyError,
  ProgressEntryNotFoundError,
} from '../core/task-materials.js'
import { getTask } from '../core/tasks.js'
import type { ProgressEntry } from '../core/task.js'
import type { PmDomain } from '../core/storage.js'
import { buildSuccessEnvelope } from '../core/ui-feedback.js'

export const progressHelp = [
  '任务进展日志命令（离线，P3 编辑保版本）：',
  '  /pm progress add t-0001 {"author":"Ice","content":"今日完成接口联调","date":"2026-10-20","refs":["at-1"]}',
  '  /pm progress edit t-0001 pl-1 {"content":"修订后的正文","author":"Ice"}',
  '  /pm progress delete t-0001 pl-1        （软删，可 restore，旧修订版不丢）',
  '  /pm progress restore t-0001 pl-1',
  '  /pm progress list t-0001',
  '  /pm progress get t-0001 pl-1',
  '说明：作者为非空文本，不隐式填本人；编辑追加新修订版、不改写旧正文；日志是叙事进展，不改任务状态/进度。',
].join('\n')

function renderEntry(entry: ProgressEntry): string {
  const cur = currentRevision(entry)
  const lines = [
    `条目：${entry.id}｜日期 ${entry.date}｜作者 ${entry.author}｜首版 ${entry.createdAt}`,
    `当前正文（${cur.id}，${cur.revisedAt.slice(0, 10)}）：${cur.content}`,
    `修订版共 ${entry.revisions.length} 版｜effective 最新时间 ${effectiveAt(entry)}`,
  ]
  if (entry.deletedAt) lines.push(`（已软删 ${entry.deletedAt.slice(0, 10)}，可 restore）`)
  return lines.join('\n')
}

function parseJson(argument: string): { ok: true, value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(argument) }
  } catch {
    return { ok: false }
  }
}

export async function handleProgressCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: progressHelp }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const rest = (match[2] ?? '').trim()
  if (!['add', 'edit', 'delete', 'restore', 'list', 'get'].includes(action)) {
    return { kind: 'error', text: `不支持的进展日志操作。\n${progressHelp}` }
  }
  if (!domain) return { kind: 'error', text: '任务存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }

  const parts = rest.split(/\s+/).filter(Boolean)
  const taskId = parts[0]
  if (!taskId) return { kind: 'error', text: '缺少任务 ID。\n' + progressHelp }

  try {
    if (action === 'list') {
      const task = getTask(domain, taskId)
      if (!task) return { kind: 'error', text: `未找到任务：${taskId}` }
      const entries = visibleProgressLog(task)
      if (!entries.length) return { kind: 'success', text: `任务 ${taskId} 暂无进展日志。` }
      const detail = entries.map(renderEntry).join('\n\n')
      return { kind: 'success', text: buildSuccessEnvelope([`进展日志 ${entries.length} 条｜${taskId}`], detail) }
    }

    if (action === 'get') {
      const entryId = parts[1]
      const task = getTask(domain, taskId)
      const entry = task?.progressLog?.find(e => e.id === entryId && !e.deletedAt)
      if (!entry) return { kind: 'error', text: `未找到进展条目：${entryId}` }
      return { kind: 'success', text: buildSuccessEnvelope([`${entryId}｜${entry.date} ${entry.author}`], renderEntry(entry)) }
    }

    if (action === 'delete') {
      const entry = await progressSoftDelete(domain, taskId, parts[1] ?? '')
      return { kind: 'success', text: buildSuccessEnvelope([`已软删 ${entry.id}（修订版保留，可 restore）`], renderEntry(entry)) }
    }

    if (action === 'restore') {
      const entry = await progressRestore(domain, taskId, parts[1] ?? '')
      return { kind: 'success', text: buildSuccessEnvelope([`已恢复 ${entry.id}（${entry.revisions.length} 版修订保留）`], renderEntry(entry)) }
    }

    // add / edit 需要 JSON 正文；解析失败零写、保输入。
    if (action === 'add') {
      const parsed = parseJson(parts.slice(1).join(' '))
      if (!parsed.ok) return { kind: 'error', text: `参数须为合法 JSON 对象，请使用英文双引号；本次未写入。\n${progressHelp}` }
      const entry = await progressAppend(domain, taskId, parsed.value as Parameters<typeof progressAppend>[2])
      return { kind: 'success', text: buildSuccessEnvelope([`进展已追加｜${entry.id}｜${entry.date} ${entry.author}`], renderEntry(entry)) }
    }

    // edit：<taskId> <entryId> <json>
    const entryId = parts[1] ?? ''
    const parsed = parseJson(parts.slice(2).join(' '))
    if (!parsed.ok) return { kind: 'error', text: `参数须为合法 JSON 对象，请使用英文双引号；本次未写入。\n${progressHelp}` }
    const entry = await progressEditRevision(domain, taskId, entryId, parsed.value as Parameters<typeof progressEditRevision>[3])
    return { kind: 'success', text: buildSuccessEnvelope([`已追加修订版｜${entry.id}（现 ${entry.revisions.length} 版）`], renderEntry(entry)) }
  } catch (error) {
    if (error instanceof ProgressAuthorEmptyError || error instanceof ProgressContentEmptyError) {
      return { kind: 'error', text: error.message }
    }
    if (error instanceof ProgressEntryNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    return { kind: 'error', text: `进展日志操作失败：${error instanceof Error ? error.message : String(error)}` }
  }
}
