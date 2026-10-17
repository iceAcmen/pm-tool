/**
 * P2-6 AI 溯源治理 · UI 视图模型纯函数（零 DOM、零 I/O、零模型）。
 *
 * 职责：把命令层 ask-provenance / ask-recheck 返回的真实台账形状整理成可渲染的视图分类，
 * 供客户端展示层（F05 来源证据分组/跳转、F06 失效置灰、F12 重校不可变历史）消费。
 * 纯展示口径，不重新计算置信度、不编造分数；置信度恒为「未提供」。
 *
 * 安全：只 `import type` 引用 provenance.ts（编译期擦除），不运行时引入 node:crypto，
 * 因此本模块可被客户端 bundle 安全消费。
 */
import type { SourceRef, HistoryEntry, RecheckConclusion, StaleState, SourceRole } from './provenance.js'

/** 台账条目 kind → 中文标签（与 provenance-store.ts ProvenanceKind 对齐，纯展示）。 */
export const PROVENANCE_KIND_LABEL: Record<string, string> = {
  'ask-apply': 'AI 询问应用',
  'wbs-import': 'WBS 草稿确认',
  'report-narrate': '汇报叙述确认',
  'meeting-summarize': '会议纪要确认',
}

/** 来源在结论中的角色：basis=动作直接依赖对象（依据）；context=发给模型的佐证上下文。 */
export const ROLE_LABEL: Record<SourceRole, string> = {
  basis: '依据',
  context: '上下文',
}

/** 重校结论（含未评估）→ 中文标签；旧历史结论原样展示，不在此洗白为 fresh。 */
export type LedgerConclusion = RecheckConclusion | 'unevaluated'

export const CONCLUSION_LABEL: Record<LedgerConclusion, string> = {
  consistent: '与来源一致',
  'needs-regen': '需重新生成',
  'manual-review': '需人工复核',
  unevaluated: '尚未评估',
}

/** 单条来源失效状态 → 中文标签。 */
export const STALE_STATE_LABEL: Record<StaleState, string> = {
  consistent: '一致',
  changed: '内容或口径已变更',
  missing: '记录已删除',
  'cross-project': '已移出本项目',
}

/** 台账来源表名 → openRecord 记录类型（record-location.ts 的 RecordType）。 */
export const LEDGER_TABLE_TO_RECORD_TYPE: Record<string, string> = {
  tasks: 'task',
  milestones: 'milestone',
  risk_issues: 'risk',
  deliverables: 'deliverable',
  meetings: 'meeting',
  reports: 'report',
}

/** 台账来源表名 → 中文展示名（纯展示，不参与判定）。 */
export const LEDGER_TABLE_LABEL: Record<string, string> = {
  tasks: '任务',
  milestones: '里程碑',
  risk_issues: '风险/问题',
  deliverables: '交付物',
  meetings: '会议',
  reports: '汇报',
}

/** ask-provenance 每条来源的只读失效评估行（命令层 evaluateStale 透传）。 */
export interface LedgerRecheckRow {
  ref: SourceRef
  state: StaleState
  reason: string
}

/** 校验失败引用（缺失/跨项目），单列不删除。 */
export interface LedgerInvalidRef {
  ref: SourceRef
  reason: 'missing' | 'cross-project'
}

/** ask-provenance 台账条目（仅取展示层需要的字段，宽松类型兼容旧条目）。 */
export interface LedgerEntryView {
  id: string
  kind: string
  summary: string
  confidence: string
  createdAt: string
  status?: string
  schemaVersion?: number
  refs: SourceRef[]
  history: HistoryEntry[]
  recheck?: {
    conclusion: RecheckConclusion
    rows: LedgerRecheckRow[]
    invalid: LedgerInvalidRef[]
  }
}

/** 来源稳定键：table:id（与 validateSourceRefs 的 records 键同口径）。 */
export function refKey(ref: Pick<SourceRef, 'table' | 'id'>): string {
  return `${ref.table}:${ref.id}`
}

/** F05：按角色分组保留原顺序——依据（basis）在前，上下文（context）在后。 */
export function groupRefsByRole(refs: SourceRef[]): { basis: SourceRef[], context: SourceRef[] } {
  const basis: SourceRef[] = []
  const context: SourceRef[] = []
  for (const ref of refs) (ref.role === 'context' ? context : basis).push(ref)
  return { basis, context }
}

/** F06：在评估行里按 table:id 找到该来源的失效状态；找不到返回 undefined（未评估）。 */
export function findRecheckRow(ref: SourceRef, rows: LedgerRecheckRow[] | undefined): LedgerRecheckRow | undefined {
  return rows?.find(r => refKey(r.ref) === refKey(ref))
}

/** 条目级结论：有评估取真实 conclusion，否则 honest 标「尚未评估」，绝不默认一致。 */
export function entryConclusion(entry: LedgerEntryView): LedgerConclusion {
  return entry.recheck?.conclusion ?? 'unevaluated'
}

/** F06：changed/missing/cross-project 均为失效；consistent 才有效。 */
export function isStaleState(state: StaleState | undefined): boolean {
  return state === 'changed' || state === 'missing' || state === 'cross-project'
}

/** 该来源是否失效：评估行失效，或出现在 invalid 校验失败列表。 */
export function isRefStale(ref: SourceRef, entry: LedgerEntryView): boolean {
  const row = findRecheckRow(ref, entry.recheck?.rows)
  if (row && isStaleState(row.state)) return true
  return !!entry.recheck?.invalid?.some(v => refKey(v.ref) === refKey(ref))
}

/** 失效来源计数（不参与 supported 汇总）。 */
export function staleRefCount(entry: LedgerEntryView): number {
  return entry.refs.filter(ref => isRefStale(ref, entry)).length
}

/** 结论 → 视觉色调（ok/warn/danger/muted），配色只在组件层映射到语义 token。 */
export function conclusionTone(conclusion: LedgerConclusion): 'ok' | 'warn' | 'danger' | 'muted' {
  switch (conclusion) {
    case 'consistent': return 'ok'
    case 'needs-regen': return 'warn'
    case 'manual-review': return 'danger'
    default: return 'muted'
  }
}

/** F05：ISO 时间切分为日期/时刻两段（确定性切片，不做时区换算，原样展示记录时刻）。 */
export function isoDatePart(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ''
}

export function isoTimePart(iso: string | null | undefined): string {
  return iso ? iso.slice(11, 16) : ''
}

/** F12：不可变历史链原样取出（旧结论不重算、不洗白），空值归一为空数组。 */
export function historyChain(entry: LedgerEntryView): HistoryEntry[] {
  return entry.history ?? []
}

/** 历史条目结论标签复用同一口径（历史里只可能出现三种真实结论）。 */
export function historyConclusionLabel(entry: HistoryEntry): string {
  return CONCLUSION_LABEL[entry.conclusion] ?? entry.conclusion
}
