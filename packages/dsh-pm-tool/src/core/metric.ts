/**
 * P0 K12 自我计量：溯源账本只读聚合（纯函数、零 I/O、零墙钟，可离线单测）。
 *
 * 口径（docs/design/deep-integration-v2-p0-dev.md §三 K12）：
 * - total：本项目账本条目数；byKind：按 provenance kind 计数；
 * - undoOutcomes：扫每条条目 audit 事件，按 undone/conflict/failed 计数（applied 不计入）；
 * - appliedSteps：从条目 refs 聚合 role=basis 的来源数（即真正落库触及的对象数，非计划步数）；
 * - pendingCount：补偿队列待并入条数（命令层从 settings pending 行读入传入，本函数不碰 domain）；
 * - last：最新一条 createdAt（ISO 字符串）；无条目为 null。
 * 账本不含 rejected 字段，故不输出 rejected 键；小样本不下结论、不做复杂报表。
 */
import type { ProvenanceLedgerEntry } from './provenance-store.js'

export interface MetricUndoOutcomes {
  undone: number
  conflict: number
  failed: number
}

export interface ProjectMetric {
  projectId: string
  total: number
  byKind: Record<string, number>
  undoOutcomes: MetricUndoOutcomes
  /** basis 来源累计（落库触及对象数），非计划步数。 */
  appliedSteps: number
  pendingCount: number
  /** 最新条目 createdAt；无条目为 null。 */
  last: string | null
}

/**
 * 只读聚合：输入已按项目过滤的账本条目（listProvenance 结果）与待补偿条数。
 * 不修改入参、不读 domain、不写盘；条目缺 audit/refs 时按空处理，不臆造。
 */
export function summarizeProvenance(
  projectId: string,
  entries: ProvenanceLedgerEntry[],
  pendingCount = 0,
): ProjectMetric {
  const byKind: Record<string, number> = {}
  const undoOutcomes: MetricUndoOutcomes = { undone: 0, conflict: 0, failed: 0 }
  let appliedSteps = 0
  let last: string | null = null
  for (const e of entries) {
    byKind[e.kind] = (byKind[e.kind] ?? 0) + 1
    for (const r of e.refs ?? []) {
      if (r.role === 'basis') appliedSteps += 1
    }
    for (const a of e.audit ?? []) {
      if (a.kind === 'undone') undoOutcomes.undone += 1
      else if (a.kind === 'conflict') undoOutcomes.conflict += 1
      else if (a.kind === 'failed') undoOutcomes.failed += 1
    }
    if (!last || e.createdAt > last) last = e.createdAt
  }
  return { projectId, total: entries.length, byKind, undoOutcomes, appliedSteps, pendingCount, last }
}

/** provenance kind → 中文可读标签（R-C4 结构优先：人读摘要先行，不靠用户读 JSON）。 */
export const METRIC_KIND_LABELS: Record<string, string> = {
  'ask-apply': '副驾应用',
  capture: '对话补档',
  'wbs-import': 'WBS 导入',
  'report-narrate': '汇报生成',
  'meeting-summarize': '会议纪要',
}

/** 把 ISO 时间截成 YYYY-MM-DD HH:mm（不做时区换算，原样取本地串便于人读）。 */
function shortTime(iso: string | null): string {
  if (!iso) return '—'
  // 兼容末尾 Z；只截取到分钟，避免展示整串时间戳。
  const m = iso.replace('Z', '').match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/)
  return m ? `${m[1]} ${m[2]}` : iso.slice(0, 16)
}

/**
 * 人读汇总（纯函数，可离线单测）：首屏只给计数/撤销/采纳的中文结论；
 * 不下小样本结论（条目数很少时如实说明样本有限），原始 JSON 由命令层收进折叠块。
 */
export function renderMetricSummary(m: ProjectMetric): string {
  const lines: string[] = []
  lines.push(`项目 ${m.projectId} 的 AI 操作留痕（只读汇总，不下结论）`)
  const kinds = Object.entries(m.byKind)
  if (kinds.length === 0) {
    lines.push('· 暂无 AI 操作留痕记录。')
  } else {
    lines.push(`· 共 ${m.total} 条记录：` + kinds
      .map(([k, n]) => `${METRIC_KIND_LABELS[k] ?? k} ${n}`)
      .join('、'))
  }
  lines.push(`· 真正落库触及对象 ${m.appliedSteps} 个；撤销成功 ${m.undoOutcomes.undone}，` +
    `冲突保留 ${m.undoOutcomes.conflict}，失败 ${m.undoOutcomes.failed}。`)
  if (m.pendingCount > 0) {
    lines.push(`· 另有 ${m.pendingCount} 条补偿记录待并入（下次读取幂等并入，不影响已落库业务）。`)
  }
  lines.push(`· 最新留痕：${shortTime(m.last)}。`)
  if (m.total > 0 && m.total < 5) {
    lines.push('（样本较少，仅作计数参考，不代表长期趋势。）')
  }
  return lines.join('\n')
}
