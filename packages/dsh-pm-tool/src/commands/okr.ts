/**
 * P2 能力 X7 愿景/OKR 层 的命令层（分片B 实现）。
 * 子词分发：
 *   - add     人直接录入 OKR/KR（draft；primaryOkrId 主归属、relatedOkrIds 软关联，均做同项目存在性校验）
 *   - update  更新（含 draft→confirmed 人定稿；无自动定稿）
 *   - list    树形 JSON（按 primaryOkrId 单父归属，related 软关联标注、不计权重）
 *   - tree    人类可读缩进视图（软关联行标注「关联」）
 *   - suggest agent 代起草归属建议（只进收件区 pmOkrInbox，不自动生效、不建记录）
 *   - inbox   列出未处理建议；all 连已处理/已忽略一起列；clear 季度回访集中清空已处理/已忽略
 *   - confirm 人确认建议 → 创建 draft okr 记录 + 建议标已处理
 *   - ignore  忽略建议（保留在收件区标 ignored，可逆）
 * 契约见 docs/design/deep-integration-v2-p2-dev.md §三。
 * 边界：agent 只提建议、人确认才生效；周期触发（cycleDue）仅预留不调度；习惯层不在本期。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addOkr,
  buildOkrTree,
  clearProcessedSuggestions,
  confirmOkrSuggestion,
  describeOkrValidation,
  ignoreOkrSuggestion,
  listOkrSuggestions,
  listOkrsByProject,
  suggestOkr,
  updateOkr,
  OkrPrimaryNotFoundError,
  OkrPrimaryProjectMismatchError,
  OkrRelatedNotFoundError,
  OkrRelatedProjectMismatchError,
  OkrProjectNotFoundError,
  OkrSelfReferenceError,
  OkrSuggestionAlreadyProcessedError,
  OkrSuggestionNotFoundError,
  type OkrSuggestion,
  type OkrTreeNode,
} from '../core/okr.js'
import type { PmDomain, OkrRecord } from '../core/storage.js'
import { buildActionLine, buildSuccessEnvelope } from '../core/ui-feedback.js'

export const okrHelp =
  '  /pm okr add <项目ID> <JSON>       人直接录入 OKR/KR（primaryOkrId 主归属、relatedOkrIds 软关联，默认草稿）\n' +
  '  /pm okr update <okrID> <JSON>     更新（draft→confirmed 由人定稿，无自动定稿）\n' +
  '  /pm okr list <项目ID>             树形 JSON（related 软关联行标注、不计权重）\n' +
  '  /pm okr tree <项目ID>             人类可读缩进视图（软关联行标「关联」）\n' +
  '  /pm okr suggest <项目ID> <JSON>   agent 代起草归属建议（只进收件区，不自动生效、不建记录）\n' +
  '  /pm okr inbox <项目ID> [all]      列出未处理建议（all 连已处理/已忽略一起列）\n' +
  '  /pm okr confirm <建议ID>          人确认建议 → 创建 draft okr 记录并标已处理\n' +
  '  /pm okr ignore <建议ID>          忽略建议（保留在收件区标 ignored，可逆）\n' +
  '  /pm okr inbox <项目ID> clear      季度回访集中清空已处理/已忽略条目（pending 保留）\n' +
  '说明：权重只按 primaryOkrId 单父归属计算；relatedOkrIds 软关联可见不计权重；未确认建议不进主档。'

const KIND_LABELS: Record<OkrRecord['kind'], string> = {
  objective: '目标',
  'key-result': '关键结果',
}

const STATUS_LABELS: Record<OkrRecord['status'], string> = {
  draft: '草稿',
  confirmed: '定稿',
}

function parseJson(argument: string): unknown | undefined {
  try {
    return JSON.parse(argument)
  } catch {
    return undefined
  }
}

type OkrLineRecord = OkrRecord & { related?: boolean }

function renderOkrLine(rec: OkrLineRecord, depth: number): string {
  const meta = [
    STATUS_LABELS[rec.status],
    rec.owner ? `负责人 ${rec.owner}` : null,
    rec.targetDate ? `目标 ${rec.targetDate}` : null,
  ].filter(Boolean).join('｜')
  const relatedTag = rec.related ? '〔关联〕' : ''
  return `${'  '.repeat(depth)}· [${KIND_LABELS[rec.kind]}] ${rec.id}｜${rec.title}${relatedTag}${meta ? `（${meta}）` : ''}`
}

/** 完整字段详情（进 [pm:detail] 折叠卡，不进短摘要）。 */
function renderOkrDetail(rec: OkrRecord): string {
  const lines = [renderOkrLine(rec, 0)]
  if (rec.description) lines.push(`  说明：${rec.description}`)
  if (rec.primaryOkrId) lines.push(`  父目标：${rec.primaryOkrId}`)
  if (rec.relatedOkrIds.length) lines.push(`  软关联：${rec.relatedOkrIds.join('、')}`)
  lines.push(`  创建时间：${rec.createdAt}`, `  更新时间：${rec.updatedAt}`)
  return lines.join('\n')
}

/** update 变更字段中文短标签（只列本次传入字段；供短摘要第二行）。 */
function describeOkrChanges(input: Record<string, unknown>): string {
  const labels: string[] = []
  if (input.title !== undefined) labels.push('标题')
  if (input.kind !== undefined) labels.push('类型')
  if (input.primaryOkrId !== undefined) labels.push(input.primaryOkrId === null ? '取消父目标' : '父目标')
  if (input.relatedOkrIds !== undefined) labels.push('软关联')
  if (input.owner !== undefined) labels.push(input.owner === null ? '清空负责人' : '负责人')
  if (input.targetDate !== undefined) labels.push(input.targetDate === null ? '清空目标日期' : '目标日期')
  if (input.description !== undefined) labels.push(input.description === null ? '清空说明' : '说明')
  if (input.status !== undefined) labels.push(input.status === 'confirmed' ? '人定稿' : '状态')
  if (input.cycleDue !== undefined) labels.push(input.cycleDue === null ? '清空周期预留' : '周期预留')
  return labels.length ? `已修改：${labels.join('、')}` : '已更新'
}

function renderTreeNodes(nodes: OkrTreeNode[], depth: number, lines: string[]): void {
  for (const node of nodes) {
    lines.push(renderOkrLine(node, depth))
    for (const rel of node.relatedTargets) {
      lines.push(`${'  '.repeat(depth + 1)}关联：${rel.id}｜${rel.title}（软关联，可见不计权重）`)
    }
    renderTreeNodes(node.children, depth + 1, lines)
  }
}

function renderSuggestion(s: OkrSuggestion): string {
  const status = s.status === 'confirmed'
    ? `已确认 → ${s.confirmedOkrId ?? ''}`
    : s.status === 'ignored'
      ? '已忽略'
      : '待确认'
  const parent = s.primaryOkrId ? `｜父目标 ${s.primaryOkrId}` : '｜根目标'
  const rationale = s.rationale ? `｜理由：${s.rationale}` : ''
  return `${s.id}｜[${KIND_LABELS[s.kind]}] ${s.title}${parent}｜${status}${rationale}｜${s.at}`
}

export async function handleOkrCommand(
  argument: string,
  domain: PmDomain | undefined,
): Promise<CommandResult> {
  const input = argument.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: okrHelp }
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }

  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const rest = match[2]?.trim() ?? ''

  try {
    // ===== add <项目ID> <JSON> =====
    if (action === 'add') {
      const addMatch = /^(\S+)\s+([\s\S]+)$/.exec(rest)
      if (!addMatch) return { kind: 'error', text: '请使用：/pm okr add <项目ID> {JSON}' }
      const projectId = addMatch[1]
      const fields = parseJson(addMatch[2])
      if (fields === undefined) return { kind: 'error', text: 'OKR 参数须为合法 JSON 对象，请使用英文双引号。' }
      const record = await addOkr(domain, projectId, fields)
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`OKR 已录入（草稿）｜${record.id} ${record.title}`, '定稿请用 /pm okr update'],
          renderOkrDetail(record),
        ),
      }
    }

    // ===== update <okrID> <JSON> =====
    if (action === 'update') {
      const updateMatch = /^(\S+)(?:\s+([\s\S]+))?$/.exec(rest)
      if (!updateMatch?.[2]) return { kind: 'error', text: '请使用：/pm okr update <okrID> {JSON片段}' }
      const fields = parseJson(updateMatch[2])
      if (fields === undefined) return { kind: 'error', text: '更新参数须为合法 JSON 对象，请使用英文双引号。' }
      const record = await updateOkr(domain, updateMatch[1], fields)
      if (!record) return { kind: 'error', text: `未找到 OKR：${updateMatch[1]}。` }
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`OKR 已更新｜${record.id} ${record.title}`, describeOkrChanges(fields as Record<string, unknown>)],
          renderOkrDetail(record),
        ),
      }
    }

    // ===== list <项目ID>：树形 JSON =====
    if (action === 'list') {
      if (!rest || /\s/.test(rest)) return { kind: 'error', text: '请指定一个项目 ID：/pm okr list <项目ID>' }
      const records = listOkrsByProject(domain, rest)
      const { tree, orphans } = buildOkrTree(records)
      return {
        kind: 'success',
        text: JSON.stringify({ projectId: rest, tree, orphans }, null, 2),
      }
    }

    // ===== tree <项目ID>：人类可读缩进 =====
    if (action === 'tree') {
      if (!rest || /\s/.test(rest)) return { kind: 'error', text: '请指定一个项目 ID：/pm okr tree <项目ID>' }
      const records = listOkrsByProject(domain, rest)
      if (!records.length) return { kind: 'success', text: `项目 ${rest} 暂无 OKR。` }
      const { tree, orphans } = buildOkrTree(records)
      const lines = [`项目 ${rest} 愿景/OKR 树（单父归属；软关联可见不计权重）：`]
      renderTreeNodes(tree, 0, lines)
      if (orphans.length) {
        lines.push('', '未归属（父目标缺失，请修补）：')
        for (const o of orphans) lines.push(renderOkrLine(o, 1))
      }
      return { kind: 'success', text: lines.join('\n') }
    }

    // ===== suggest <项目ID> <JSON>：只进收件区，不建记录 =====
    if (action === 'suggest') {
      const sugMatch = /^(\S+)\s+([\s\S]+)$/.exec(rest)
      if (!sugMatch) return { kind: 'error', text: '请使用：/pm okr suggest <项目ID> {JSON}' }
      const projectId = sugMatch[1]
      const fields = parseJson(sugMatch[2])
      if (fields === undefined) return { kind: 'error', text: '建议参数须为合法 JSON 对象，请使用英文双引号。' }
      const suggestion = await suggestOkr(domain, projectId, fields)
      return {
        kind: 'success',
        text: [
          '建议已进入收件区（未确认不生效，不会创建 OKR 记录）。',
          renderSuggestion(suggestion),
          buildActionLine('确认采纳', `/pm okr confirm ${suggestion.id}`),
          `忽略：/pm okr ignore ${suggestion.id}`,
        ].join('\n'),
      }
    }

    // ===== inbox <项目ID> [all|clear] =====
    if (action === 'inbox') {
      const inboxMatch = /^(\S+)(?:\s+(all|clear))?$/i.exec(rest)
      if (!inboxMatch) return { kind: 'error', text: '请使用：/pm okr inbox <项目ID> [all|clear]' }
      const projectId = inboxMatch[1]
      if (!domain.table('projects').get(projectId)) return { kind: 'error', text: `未找到项目 ${projectId}` }
      const mode = (inboxMatch[2] ?? '').toLowerCase()
      if (mode === 'clear') {
        const removed = await clearProcessedSuggestions(domain, projectId)
        return {
          kind: 'success',
          text: removed > 0
            ? `已清空项目 ${projectId} 的 ${removed} 条已处理/已忽略建议（待确认建议保留）。`
            : `项目 ${projectId} 没有已处理/已忽略建议可清空。`,
        }
      }
      const includeProcessed = mode === 'all'
      const items = listOkrSuggestions(domain, projectId, { includeProcessed })
      if (!items.length) {
        return { kind: 'success', text: `项目 ${projectId} ${includeProcessed ? '收件区' : '待确认建议'}为空。` }
      }
      return {
        kind: 'success',
        text: [
          `项目 ${projectId} ${includeProcessed ? '收件区全部建议' : '待确认建议'}（${items.length} 条）：`,
          ...items.map(renderSuggestion),
        ].join('\n'),
      }
    }

    // ===== confirm <建议ID> =====
    if (action === 'confirm') {
      if (!rest || /\s/.test(rest)) return { kind: 'error', text: '请使用：/pm okr confirm <建议ID>' }
      const { record, suggestion } = await confirmOkrSuggestion(domain, rest)
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`已确认建议 ${suggestion.id}，创建草稿 OKR 记录 ${record.id}`, '草稿；定稿请用 update，无自动定稿'],
          renderOkrDetail(record),
        ),
      }
    }

    // ===== ignore <建议ID> =====
    if (action === 'ignore') {
      if (!rest || /\s/.test(rest)) return { kind: 'error', text: '请使用：/pm okr ignore <建议ID>' }
      const suggestion = await ignoreOkrSuggestion(domain, rest)
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`已忽略建议 ${suggestion.id}`, '保留在收件区标 ignored，可逆；不会创建记录'],
          null,
        ),
      }
    }

    return { kind: 'error', text: `不识别的 okr 子命令「${action}」。\n${okrHelp}` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `OKR 参数不正确：${describeOkrValidation(error)}。` }
    }
    if (
      error instanceof OkrProjectNotFoundError
      || error instanceof OkrPrimaryNotFoundError
      || error instanceof OkrPrimaryProjectMismatchError
      || error instanceof OkrRelatedNotFoundError
      || error instanceof OkrRelatedProjectMismatchError
      || error instanceof OkrSelfReferenceError
      || error instanceof OkrSuggestionNotFoundError
      || error instanceof OkrSuggestionAlreadyProcessedError
    ) {
      return { kind: 'error', text: error.message }
    }
    return { kind: 'error', text: `OKR 操作失败：${error instanceof Error ? error.message : String(error)}` }
  }
}
