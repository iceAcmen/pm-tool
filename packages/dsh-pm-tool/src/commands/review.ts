/**
 * P2 能力 X5 述职素材 的命令层。
 * /pm review <项目ID> [起始日期] [结束日期]：只读聚合任务（done/wrapped）/里程碑（achieved）/
 * 复盘草稿 known 行 → 返回 JSON + 同一数据渲染的 Markdown 述职稿（做了什么/量化结果/关键产出）；零写。
 * 契约见 docs/design/deep-integration-v2-p2-dev.md §七。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import {
  buildReviewMaterials,
  renderReviewMarkdown,
  type ReviewMaterials,
} from '../core/review-materials.js'
import { localTodayIso } from '../core/derived.js'
import type { PmDomain } from '../core/storage.js'

export const reviewHelp =
  '  /pm review <项目ID> [起始日期 YYYY-MM-DD] [结束日期 YYYY-MM-DD]   只读汇总述职素材（JSON + Markdown 双输出，零写）'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  // 仅校验格式与日历有效；不做 UTC 往返（本地时区午夜转 UTC 会落到前一天，误杀合法日期）。
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

export function handleReviewCommand(
  argument: string,
  domain: PmDomain | undefined,
): CommandResult {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const arg = argument.trim()
  if (!arg) return { kind: 'error', text: '用法：/pm review <项目ID> [起始日期] [结束日期]' }

  const parts = arg.split(/\s+/)
  const projectId = parts[0]!
  const periodStart = parts[1]
  const periodEnd = parts[2]

  if (periodStart !== undefined && !isValidIsoDate(periodStart)) {
    return { kind: 'error', text: `起始日期须为有效 YYYY-MM-DD：${periodStart}` }
  }
  if (periodEnd !== undefined && !isValidIsoDate(periodEnd)) {
    return { kind: 'error', text: `结束日期须为有效 YYYY-MM-DD：${periodEnd}` }
  }
  if (periodStart && periodEnd && periodStart > periodEnd) {
    return { kind: 'error', text: '起始日期不得晚于结束日期。' }
  }

  const project = domain.table('projects').get(projectId)
  if (!project) {
    return { kind: 'error', text: `未找到项目：${projectId}。` }
  }

  // 只读：仅遍历读取，不调用任何 put/写路径。
  const tasks = [...domain.table('tasks').entries()].map(([, value]) => value)
  const milestones = [...domain.table('milestones').entries()].map(([, value]) => value)
  const reflections = [...domain.table('reflections').entries()].map(([, value]) => value)

  const materials: ReviewMaterials = buildReviewMaterials({
    projectId,
    tasks,
    milestones,
    reflections,
    periodStart,
    periodEnd,
    today: localTodayIso(),
  })

  const markdown = renderReviewMarkdown(materials)
  const text = [
    markdown,
    '---',
    '结构化 JSON（同一聚合数据，只读）：',
    '```json',
    JSON.stringify(materials, null, 2),
    '```',
  ].join('\n')

  return { kind: 'success', text }
}
