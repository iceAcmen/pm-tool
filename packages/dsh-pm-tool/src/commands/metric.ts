/**
 * P0 能力 K12 自我计量 的命令层。
 * 只读汇总 AI 操作留痕（改了哪些/采纳哪些/返工哪些），不做复杂报表、不下小样本结论、不写盘。
 * 聚合逻辑在 core/metric.ts（纯函数，可离线单测）；本层只负责取账本与 pending 队列。
 * 契约见 docs/design/deep-integration-v2-p0-dev.md §三 K12。
 */
import type { PmDomain } from '../core/storage.js'
import { listProvenance, PROVENANCE_PENDING_ROW } from '../core/provenance-store.js'
import { summarizeProvenance } from '../core/metric.js'

export const metricHelp = '  /pm metric <项目ID>   只读汇总该项目 AI 操作留痕（按类型/撤销结果/采纳步数），小样本不下结论'

export function handleMetricCommand(
  argument: string,
  domain: PmDomain | undefined,
): { kind: 'success' | 'error', text: string } {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const projectId = argument.trim()
  if (!projectId) return { kind: 'error', text: '用法：/pm metric <项目ID>' }
  if (!domain.table('projects').get(projectId)) {
    return { kind: 'error', text: `未找到项目 ${projectId}` }
  }
  // pending 补偿队列是全局单行列（不区分项目），如实给出待并入条数。
  const pendingRows = (domain.table('settings').get(PROVENANCE_PENDING_ROW) as { value?: { entries?: unknown[] } } | null)
    ?.value?.entries ?? []
  const entries = listProvenance(domain, projectId)
  const metric = summarizeProvenance(projectId, entries, pendingRows.length)
  return { kind: 'success', text: JSON.stringify(metric) }
}
