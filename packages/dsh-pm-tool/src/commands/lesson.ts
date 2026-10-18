/**
 * P2 能力 X3 失败经验 的命令层。
 * 子命令：
 *   /pm lesson add <项目ID> <JSON>            人录入经验（taskId 可空，关联失败/烂尾任务）
 *   /pm lesson list <项目ID>                  只读列出
 *   /pm lesson final <lessonID>               人定稿（draft → final，只有人能定稿）
 *   /pm lesson edit <lessonID> "<markdown>"   补材料（句级保守标注，待核/待补字样自动定级）
 * 草稿纪律复用 X6：known/pending/blank，证据不足留白不编造；无积分/徽章；不自动定稿。
 * 契约见 docs/design/deep-integration-v2-p2-dev.md §五。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import {
  addLesson,
  finalizeLesson,
  getLesson,
  listLessons,
  updateLessonDraft,
  LessonNotFoundError,
  LessonProjectNotFoundError,
  LessonTaskRefNotFoundError,
} from '../core/lessons.js'
import type { PmDomain, LessonRecord } from '../core/storage.js'

export const lessonHelp =
  '  /pm lesson add <项目ID> <JSON>    人录入经验（taskId 可空，关联失败/烂尾任务；markdown 或 lines 句级录入）\n' +
  '  /pm lesson list <项目ID>          只读列出\n' +
  '  /pm lesson final <lessonID>       人定稿（draft → final，仅人可定稿）\n' +
  '  /pm lesson edit <lessonID> "<markdown>"   补材料（句级保守标注：待核→pending、待补→blank 留白，不编造）'

const MARK_LABELS: Record<LessonRecord['lines'][number]['mark'], string> = {
  known: '已核',
  pending: '待核',
  blank: '留白',
}

function unquote(value: string): string {
  if (value.length >= 2 && ['"', "'"].includes(value[0]) && value.at(-1) === value[0]) return value.slice(1, -1)
  return value
}

function renderLesson(rec: LessonRecord): string {
  const lines = [
    `经验 ID：${rec.id}`,
    `项目 ID：${rec.projectId}`,
    `关联任务：${rec.taskId ?? '无'}`,
    `状态：${rec.status === 'final' ? '已定稿' : '草稿'}`,
    '',
    '句级内容：',
    ...rec.lines.map(line => `· [${MARK_LABELS[line.mark]}] ${line.text}`),
  ]
  if (rec.gaps.length) {
    lines.push('', '留白（待补，不编造）：', ...rec.gaps.map(gap => `· ${gap}`))
  }
  lines.push('', '```json', JSON.stringify(rec, null, 2), '```')
  return lines.join('\n')
}

export async function handleLessonCommand(
  argument: string,
  domain: PmDomain | undefined,
): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const arg = argument.trim()
  if (!arg || arg.toLowerCase() === 'help') return { kind: 'success', text: lessonHelp }

  const tokens = arg.split(/\s+/)
  const sub = tokens[0].toLowerCase()

  try {
    if (sub === 'add') {
      // lesson add <项目ID> <JSON>
      const rest = arg.slice(tokens[0].length).trim()
      const m = /^(\S+)\s+([\s\S]+)$/.exec(rest)
      if (!m?.[2]) {
        return { kind: 'error', text: '请使用：/pm lesson add <项目ID> <JSON>（如 {"markdown":"…","taskId":"t-0001"}）' }
      }
      const projectId = m[1]
      let body: Record<string, unknown>
      try {
        body = JSON.parse(m[2])
      } catch {
        return { kind: 'error', text: '经验参数须为合法 JSON 对象，请使用英文双引号。' }
      }
      const record = await addLesson(domain, { ...body, projectId })
      return { kind: 'success', text: `经验已录入（草稿，定稿请用 final）。\n${renderLesson(record)}` }
    }

    if (sub === 'list') {
      const projectId = tokens[1]
      if (!projectId) return { kind: 'error', text: '请使用：/pm lesson list <项目ID>' }
      if (!domain.table('projects').get(projectId)) {
        return { kind: 'error', text: `未找到项目：${projectId}。` }
      }
      const records = listLessons(domain, projectId)
      if (!records.length) return { kind: 'success', text: `项目 ${projectId} 暂无失败经验记录。` }
      const body = records.map(rec => ({
        id: rec.id,
        taskId: rec.taskId ?? null,
        status: rec.status,
        lines: rec.lines.length,
        gaps: rec.gaps.length,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
      }))
      return {
        kind: 'success',
        text: [
          `项目 ${projectId} 失败经验 ${records.length} 条（草稿/定稿）：`,
          '```json',
          JSON.stringify(body, null, 2),
          '```',
        ].join('\n'),
      }
    }

    if (sub === 'final') {
      const id = tokens[1]
      if (!id) return { kind: 'error', text: '请使用：/pm lesson final <lessonID>' }
      const finalized = await finalizeLesson(domain, id)
      return { kind: 'success', text: `已定稿：${finalized?.id ?? id}（draft → final）。定稿只代表人确认，不替代复盘。\n${renderLesson(finalized ?? getLesson(domain, id)!)}` }
    }

    if (sub === 'edit') {
      const id = tokens[1]
      if (!id) return { kind: 'error', text: '请使用：/pm lesson edit <lessonID> "<markdown>"' }
      // id 之后的剩余文本即 markdown（含空格），去掉首尾引号。
      const afterId = arg.slice(arg.indexOf(id) + id.length).trim()
      const markdown = unquote(afterId)
      if (!markdown) return { kind: 'error', text: '请提供要补入的材料文本：/pm lesson edit <lessonID> "<markdown>"' }
      const updated = await updateLessonDraft(domain, id, markdown)
      return { kind: 'success', text: `草稿已更新（仍为 draft，定稿请用 final）。\n${renderLesson(updated ?? getLesson(domain, id)!)}` }
    }

    return { kind: 'error', text: `不支持的经验子命令「${sub}」。\n${lessonHelp}` }
  } catch (error) {
    if (error instanceof LessonNotFoundError
      || error instanceof LessonProjectNotFoundError
      || error instanceof LessonTaskRefNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    console.error('[pm-tool] 经验操作失败：', error)
    return { kind: 'error', text: `经验操作失败：${error instanceof Error ? error.message : String(error)}` }
  }
}
