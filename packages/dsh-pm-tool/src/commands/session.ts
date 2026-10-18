/**
 * P0 能力 K9 会话结存 的命令层。
 * 子词分发：
 *   - bind   任务 ↔ 会话单向绑定 + 沉淀 note（同 taskId+sessionId 重复 bind = 合并 note、刷新时间）；
 *   - list   按项目列出全部会话绑定；
 *   - notes  按任务列出全部结存摘要。
 * 契约见 docs/design/deep-integration-v2-p0-dev.md §三 K9。
 *
 * 能力边界：单向结存——只把会话标识与 note 沉淀到本工具 sessions 表，
 * 不做双向同步、不回写外部平台；projectId 从任务反查，不接受调用方传入。
 */
import type { PmDomain } from '../core/storage.js'
import {
  bindSession,
  listSessionsByProject,
  listSessionNotes,
  SessionBindError,
} from '../core/session-bind.js'

export const sessionHelp = [
  '  /pm session bind <任务ID> <会话ID> [note]   绑定任务与会话并沉淀结存摘要（重复绑定合并 note）',
  '  /pm session list <项目ID>                  列出项目内会话结存（taskId/sessionId/note/时间）',
  '  /pm session notes <任务ID>                列出该任务的全部结存摘要',
  '单向结存：只沉淀到本工具 sessions 表，不与外部平台双向同步。',
].join('\n')

interface CommandResult {
  kind: 'success' | 'error'
  text: string
}

/** 去掉 note 外层成对引号（命令行可能传 "结存摘要"）。 */
function stripOuterQuotes(note: string): string {
  const trimmed = note.trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).trim()
    }
  }
  return trimmed
}

export async function handleSessionCommand(
  argument: string,
  domain: PmDomain | undefined,
): Promise<CommandResult> {
  const input = argument.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: sessionHelp }
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }

  const bindMatch = /^bind\s+(\S+)\s+(\S+)(?:\s+([\s\S]+))?$/i.exec(input)
  if (bindMatch) {
    const taskId = bindMatch[1]
    const sessionId = bindMatch[2]
    const note = bindMatch[3] !== undefined ? stripOuterQuotes(bindMatch[3]) : undefined
    try {
      const { record, merged } = await bindSession(domain, { taskId, sessionId, note })
      const lines = [
        merged ? '已命中既有绑定，合并 note 并刷新时间：' : '已新建会话绑定：',
        `绑定 ID：${record.id}`,
        `任务：${record.taskId}｜会话：${record.sessionId}`,
        record.note ? `结存摘要：${record.note}` : '结存摘要：（空）',
        `更新时间：${record.updatedAt}`,
      ]
      return { kind: 'success', text: lines.join('\n') }
    } catch (error) {
      if (error instanceof SessionBindError) {
        return { kind: 'error', text: `绑定失败：${error.message}` }
      }
      return { kind: 'error', text: `绑定失败：${error instanceof Error ? error.message : String(error)}` }
    }
  }

  const listMatch = /^list\s+(\S+)$/i.exec(input)
  if (listMatch) {
    const projectId = listMatch[1]
    if (!domain.table('projects').get(projectId)) {
      return { kind: 'error', text: `未找到项目 ${projectId}` }
    }
    const rows = listSessionsByProject(domain, projectId).map(r => ({
      id: r.id,
      taskId: r.taskId,
      sessionId: r.sessionId,
      note: r.note ?? '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
    return {
      kind: 'success',
      text: JSON.stringify({ projectId, count: rows.length, sessions: rows }, null, 2),
    }
  }

  const notesMatch = /^notes\s+(\S+)$/i.exec(input)
  if (notesMatch) {
    const taskId = notesMatch[1]
    const rows = listSessionNotes(domain, taskId).map(r => ({
      sessionId: r.sessionId,
      note: r.note ?? '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
    return {
      kind: 'success',
      text: JSON.stringify({ taskId, count: rows.length, notes: rows }, null, 2),
    }
  }

  return {
    kind: 'error',
    text: `不识别的 session 子命令。\n${sessionHelp}`,
  }
}
