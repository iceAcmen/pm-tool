/**
 * X6-L1/L2 即时复盘草稿的命令层。
 * 子词分发：
 *   /pm reflect <任务ID|反思ID>                  查看完整复盘草稿
 *   /pm reflect <任务ID|反思ID> final            人工定稿（draft → final；业务完成≠复盘定稿）
 *   /pm reflect <任务ID|反思ID> edit "<markdown>" 人工补充材料更新草稿（句级 mark 保守标注）
 *   /pm reflect list <项目ID>             列出项目内复盘草稿状态（reflect-list 路由由统一注册处挂接）
 * 只读查看与人工定稿/补材料；草稿不进定稿流，最终验收由人判断。
 * 契约见 docs/design/deep-integration-v2-p0-dev.md §三（X6-L1）。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { getTask } from '../core/tasks.js'
import {
  finalizeReflection,
  getReflection,
  listReflections,
  ReflectionNotFoundError,
  updateReflectionDraft,
} from '../core/reflect.js'
import type { PmDomain, ReflectionRecord } from '../core/storage.js'

export const reflectHelp = [
  '即时复盘草稿（轻量草稿，非验收定稿；业务完成≠复盘定稿）：',
  '  /pm reflect <任务ID|反思ID>                 查看完整复盘草稿及来源（JSON 文本）',
  '  /pm reflect <任务ID|反思ID> final           人工定稿（draft → final，只有人能定稿）',
  '  /pm reflect <任务ID|反思ID> edit "<markdown>" 人工补充材料（待核/待补字样自动标注）',
  '  /pm reflect list <项目ID>                   列出项目内复盘草稿状态',
  '任务 ID 沿用任务完成草稿入口；反思 ID 可从 list 获取，精确定位该条记录。',
  '草稿由 task-done / milestone-achieved / deliverable-accepted 事件 best-effort 生成；证据不足只留白，不编造结论。',
].join('\n')

const MARK_LABELS: Record<ReflectionRecord['draft']['lines'][number]['mark'], string> = {
  known: '已核',
  pending: '待核',
  blank: '留白',
}

function unquote(value: string): string {
  if (value.length >= 2 && ['"', "'"].includes(value[0]) && value.at(-1) === value[0]) return value.slice(1, -1)
  return value
}

function reflectionSourceId(rec: ReflectionRecord): string | undefined {
  switch (rec.sourceEvent) {
    case 'task-done': return rec.taskId
    case 'milestone-achieved': return rec.milestoneId
    case 'deliverable-accepted': return rec.deliverableId
  }
}

function renderReflection(rec: ReflectionRecord): string {
  const lines = [
    `复盘 ID：${rec.id}`,
    `来源事件（sourceEvent）：${rec.sourceEvent}`,
    `来源 ID（sourceId）：${reflectionSourceId(rec) ?? '未记录'}`,
    ...(rec.taskId ? [`任务 ID：${rec.taskId}`] : []),
    `项目 ID：${rec.projectId}`,
    `状态：${rec.status === 'final' ? '已定稿' : '草稿'}`,
    `标题：${rec.draft.title}`,
    `生成时刻：${rec.draft.at}`,
    '',
    '句级内容：',
    ...rec.draft.lines.map(line => `· [${MARK_LABELS[line.mark]}] ${line.text}`),
  ]
  if (rec.draft.gaps.length) {
    lines.push('', '留白（待补，不编造）：', ...rec.draft.gaps.map(gap => `· ${gap}`))
  }
  lines.push('', '```json', JSON.stringify(rec, null, 2), '```')
  return lines.join('\n')
}

export async function handleReflectCommand(
  argument: string,
  domain: PmDomain | undefined,
): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const input = argument.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: reflectHelp }

  const tokens = input.split(/\s+/)

  // /pm reflect list <项目ID>（reflect-list 子命令的离线同形入口）。
  if (tokens[0].toLowerCase() === 'list') {
    const projectId = tokens[1]
    if (!projectId) return { kind: 'error', text: '请使用：/pm reflect list <项目ID>' }
    if (!domain.table('projects').get(projectId)) return { kind: 'error', text: `未找到项目：${projectId}。` }
    const records = listReflections(domain, projectId)
    if (!records.length) return { kind: 'success', text: `项目 ${projectId} 暂无复盘草稿。` }
    const body = records.map(rec => ({
      id: rec.id,
      taskId: rec.taskId,
      sourceEvent: rec.sourceEvent,
      sourceId: reflectionSourceId(rec),
      milestoneId: rec.milestoneId,
      deliverableId: rec.deliverableId,
      status: rec.status,
      title: rec.draft.title,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    }))
    return {
      kind: 'success',
      text: [
        `项目 ${projectId} 复盘记录 ${records.length} 条（草稿/定稿）：`,
        '```json',
        JSON.stringify(body, null, 2),
        '```',
      ].join('\n'),
    }
  }

  const targetId = tokens[0]
  const verb = (tokens[1] ?? '').toLowerCase()

  try {
    // L2 事件没有 taskId；反思 ID 必须精确命中，不能借关联任务选到旧 task-done。
    const byReflectionId = targetId.startsWith('ref-')
    const task = byReflectionId ? undefined : getTask(domain, targetId)
    if (!byReflectionId && !task) return { kind: 'error', text: `未找到任务：${targetId}。` }
    const rec = byReflectionId ? domain.table('reflections').get(targetId) : getReflection(domain, targetId)
    if (byReflectionId && !rec) return { kind: 'error', text: `未找到复盘记录：${targetId}。` }
    const projectId = rec?.projectId ?? task!.projectId
    if (!domain.table('projects').get(projectId)) return { kind: 'error', text: `未找到项目：${projectId}。` }

    if (!verb) {
      if (!rec) {
        return { kind: 'success', text: `任务 ${targetId}（${task!.title}）未完成或暂无复盘草稿。\n草稿在任务标记 done 时 best-effort 自动生成；若刚完成可稍后再查。` }
      }
      return { kind: 'success', text: renderReflection(rec) }
    }

    if (verb === 'final') {
      if (!rec) return { kind: 'error', text: `任务 ${targetId} 暂无复盘草稿，无法定稿。` }
      const finalized = await finalizeReflection(domain, rec.id)
      return { kind: 'success', text: `已定稿：${finalized?.id ?? rec.id}（draft → final）。定稿只代表人确认，不替代验收。\n${renderReflection(finalized ?? rec)}` }
    }

    if (verb === 'edit') {
      if (!rec) return { kind: 'error', text: `任务 ${targetId} 暂无复盘草稿，无法补材料。` }
      // 保留 edit 之后的原文（含换行/多空格），不用 token 重组压平 markdown。
      const editMatch = /^\S+\s+edit\s+([\s\S]+)$/.exec(input)
      const markdown = unquote(editMatch?.[1]?.trim() ?? '')
      if (!markdown.trim()) return { kind: 'error', text: '请提供要补入的材料文本：/pm reflect <任务ID|反思ID> edit "<markdown>"' }
      const updated = await updateReflectionDraft(domain, rec.id, markdown)
      const result = updated ?? rec
      const message = result.status === 'final'
        ? '材料已更新（保持已定稿状态）。'
        : '草稿已更新（仍为 draft，定稿请用 final）。'
      return { kind: 'success', text: `${message}\n${renderReflection(result)}` }
    }

    return { kind: 'error', text: `不支持的操作「${verb}」。\n${reflectHelp}` }
  } catch (error) {
    if (error instanceof ReflectionNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    return { kind: 'error', text: `复盘操作失败：${error instanceof Error ? error.message : String(error)}` }
  }
}
