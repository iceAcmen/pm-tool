/**
 * P2-6 AI 溯源治理 · 纯函数核心（零 I/O、零模型、零写盘，可离线单测）。
 *
 * 职责：来源引用（typed refs）、内容/口径版本指纹、失效分类、不洗白重校（不可变历史链）、
 * undo postimage 全对象冲突守卫。持久化、四链挂钩、UI 在其它模块完成；本模块不读 domain、
 * 不做写时 CAS（写时并发仍由正式 applyCore baseline/写队列承担）。
 *
 * 安全红线：
 *  - 只记录「动作依赖对象(basis)」与「实际发给模型的上下文(context)」，不扫整份快照；
 *  - 置信度一律不计算、不展示数值（调用方统一用「未提供」）；
 *  - 重校绝不静默剔除失效来源后把旧结论升级 fresh；旧证据原样保留进不可变历史。
 */
import { createHash } from 'node:crypto'

/** CopilotAction op（单数实体）→ 领域表名（复数），对齐 copilot.ts 白名单与 PmDomain.table。 */
export const OP_TABLE: Record<string, string> = {
  'task.create': 'tasks',
  'task.update': 'tasks',
  'milestone.create': 'milestones',
  'milestone.update': 'milestones',
  'risk.create': 'risk_issues',
  'risk.update': 'risk_issues',
  'deliverable.create': 'deliverables',
  'deliverable.update': 'deliverables',
  'meeting.create': 'meetings',
  'meeting.update': 'meetings',
}

/** 各表「结论/动作真正依赖」的 basis 字段子集（非整条全字段），与各实体 zod schema 对齐。 */
export const BASIS_FIELDS: Record<string, string[]> = {
  tasks: ['title', 'status', 'progress', 'assignee', 'priority', 'parentId', 'startDate', 'dueDate', 'completedDate'],
  milestones: ['title', 'status', 'targetDate', 'achievedDate'],
  risk_issues: ['title', 'status', 'owner', 'impact', 'probability', 'responsePlan', 'solution'],
  deliverables: ['name', 'status', 'owner', 'dueDate'],
  meetings: ['title', 'meetingDate', 'status', 'summary'],
  reports: ['title', 'kind', 'date', 'status'],
}

/** 全对象指纹需排除的系统时间戳（业务字段任何变化都纳入，updatedAt 单列比对）。 */
const NON_BUSINESS = new Set(['updatedAt', 'createdAt'])

/** 来源在结论中的角色：basis=动作直接依赖对象；context=发给模型的佐证上下文。 */
export type SourceRole = 'basis' | 'context'

/** 一条 typed 来源引用。 */
export interface SourceRef {
  table: string
  id: string
  projectId: string
  label: string
  role: SourceRole
  /** 快照内容版本（记录内容指纹），用于检出「内容被修改」。 */
  snapshotVersion: number
  /** 口径/规则版本（由调用方传入，例如项目口径设置版本），用于检出「口径变更」。 */
  ruleRevision: number
  updatedAt: string | null
  basisFingerprint: string
  fullFingerprint: string
}

/** 上下文条目：显式带 table，不再硬编码归 tasks（N6）。 */
export interface ContextRefInput {
  table: string
  id: string
  projectId?: string
}

export interface SourceRecord {
  id: string
  projectId?: string
  title?: string
  name?: string
  updatedAt?: string
  [k: string]: unknown
}

/** 规范化：键排序、undefined 归一为 null，保证同内容同指纹。 */
export function canonical(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.map(canonical)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = canonical((value as Record<string, unknown>)[k])
    }
    return out
  }
  return value
}

function hash(obj: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonical(obj))).digest('hex').slice(0, 16)
}

/** basis 字段子集（用于 postimage 快照与 basis 冲突 diff）。 */
export function basisSubset(table: string, record: SourceRecord): Record<string, unknown> {
  const fields = BASIS_FIELDS[table] ?? []
  const out: Record<string, unknown> = {}
  for (const k of fields) {
    if (record && k in record) out[k] = record[k]
  }
  return out
}

/** basis 字段确定性指纹（SHA-256 截断，仅变更检测）。 */
export function basisFingerprint(table: string, record: SourceRecord): string {
  return hash(basisSubset(table, record))
}

/** 全业务对象指纹（排除系统时间戳）：N2 防御非 basis 改动，不依赖「必刷 updatedAt」单一假设。 */
export function fullFingerprint(record: SourceRecord | undefined): string {
  if (!record) return ''
  const business: Record<string, unknown> = {}
  for (const k of Object.keys(record)) {
    if (!NON_BUSINESS.has(k)) business[k] = record[k]
  }
  return hash(business)
}

function labelOf(record: SourceRecord): string {
  return record.title ?? record.name ?? record.id
}

/**
 * 计算 postimage（apply 落库后）用于 undo 乐观冲突守卫。
 * N8：record 缺失时 exists=false，不硬编码 true、不伪造指纹。
 */
export interface Postimage {
  exists: boolean
  updatedAt: string | null
  basisFingerprint: string | null
  fullFingerprint: string | null
  fields: Record<string, unknown> | null
}

export function capturePostimage(table: string, record: SourceRecord | undefined): Postimage {
  if (!record) {
    return { exists: false, updatedAt: null, basisFingerprint: null, fullFingerprint: null, fields: null }
  }
  return {
    exists: true,
    updatedAt: record.updatedAt ?? null,
    basisFingerprint: basisFingerprint(table, record),
    fullFingerprint: fullFingerprint(record),
    fields: basisSubset(table, record),
  }
}

export interface BuildRefsInput {
  /** 已通过校验的动作（op/id），作为 basis。 */
  actions: Array<{ op: string, id?: string }>
  /** 以 `table:id` 为键的只读记录视图。 */
  records: Map<string, SourceRecord>
  /** 实际发给模型的上下文（显式 table）。 */
  context?: ContextRefInput[]
  snapshotVersion: number
  ruleRevision: number
}

/**
 * 构建来源集合：只收 basis（动作依赖）+ context（显式表），按 table:id 去重，不扫整份快照。
 */
export function buildSourceRefs(input: BuildRefsInput): SourceRef[] {
  const { actions, records, context = [], snapshotVersion, ruleRevision } = input
  const refs: SourceRef[] = []
  const seen = new Set<string>()
  const push = (table: string, id: string, role: SourceRole, projectId?: string): void => {
    const key = `${table}:${id}`
    if (seen.has(key)) return
    const rec = records.get(key)
    if (!rec) return
    seen.add(key)
    refs.push({
      table,
      id,
      projectId: projectId ?? rec.projectId ?? '',
      label: labelOf(rec),
      role,
      snapshotVersion,
      ruleRevision,
      updatedAt: rec.updatedAt ?? null,
      basisFingerprint: basisFingerprint(table, rec),
      fullFingerprint: fullFingerprint(rec),
    })
  }
  for (const a of actions) {
    const table = OP_TABLE[a.op] ?? a.op.split('.')[0]
    if (a.id) push(table, a.id, 'basis')
  }
  for (const c of context) push(c.table, c.id, 'context', c.projectId)
  return refs
}

export interface InvalidRef {
  ref: SourceRef
  reason: 'missing' | 'cross-project'
}

/** 校验引用存在性与 project scope；缺失/跨项目单列。 */
export function validateSourceRefs(refs: SourceRef[], records: Map<string, SourceRecord>): { ok: boolean, invalid: InvalidRef[] } {
  const invalid: InvalidRef[] = []
  for (const r of refs) {
    const rec = records.get(`${r.table}:${r.id}`)
    if (!rec) { invalid.push({ ref: r, reason: 'missing' }); continue }
    if (rec.projectId !== r.projectId) invalid.push({ ref: r, reason: 'cross-project' })
  }
  return { ok: invalid.length === 0, invalid }
}

/** 单条来源重校状态。 */
export type StaleState = 'consistent' | 'changed' | 'missing' | 'cross-project'

export interface StaleResult {
  state: StaleState
  reason: string
}

/**
 * 单条来源重校：consistent / changed（内容或口径版本变）/ missing（删除）/ cross-project（移到别的项目）。
 */
export function classifyStale(
  ref: SourceRef,
  current: SourceRecord | undefined,
  currentVersion: number,
  currentRuleRevision: number,
): StaleResult {
  if (!current) return { state: 'missing', reason: '记录已删除' }
  if (current.projectId !== ref.projectId) return { state: 'cross-project', reason: '已移到别的项目（scope 不匹配）' }
  if (currentRuleRevision !== ref.ruleRevision) return { state: 'changed', reason: '口径版本变更' }
  if (currentVersion !== ref.snapshotVersion) return { state: 'changed', reason: '快照内容版本变更' }
  if ((current.updatedAt ?? null) !== ref.updatedAt) return { state: 'changed', reason: 'updatedAt 已变更' }
  if (basisFingerprint(ref.table, current) !== ref.basisFingerprint) return { state: 'changed', reason: '关键字段已修改' }
  return { state: 'consistent', reason: '与来源一致' }
}

/** 重校结论：全一致 / 需重新生成 / 人工复核（失效来源不删除、不参与汇总）。 */
export type RecheckConclusion = 'consistent' | 'needs-regen' | 'manual-review'

export interface RecheckRow {
  ref: SourceRef
  state: StaleState
  reason: string
}

export interface HistoryEntry {
  at: string | null
  conclusion: RecheckConclusion
  snapshotVersion: number
  ruleRevision: number
  rows: RecheckRow[]
}

export interface ProvenanceRecord {
  refs: SourceRef[]
  history: HistoryEntry[]
}

export interface RecheckResult {
  conclusion: RecheckConclusion
  rows: RecheckRow[]
  refs: SourceRef[]
  previous: ProvenanceRecord
  history: HistoryEntry[]
}

const deepClone = <T>(v: T): T => structuredClone(v)

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    for (const v of Object.values(obj as Record<string, unknown>)) deepFreeze(v)
    Object.freeze(obj)
  }
  return obj
}

/**
 * 不洗白重校 + 不可变历史链（N5 / R-N5c）：
 * - missing/cross-project→manual-review；否则任一 changed→needs-regen；全一致→consistent。
 * - 旧证据 previous 原样保留；history 追加不可变条目；输出 refs/rows/history 深克隆+冻结，
 *   事后改旧对象不污染已产出结果。
 */
export function recheckProvenance(
  prev: ProvenanceRecord,
  records: Map<string, SourceRecord>,
  currentVersion: number,
  currentRuleRevision: number,
  stamp: string | null = null,
): RecheckResult {
  const rows: RecheckRow[] = deepClone(prev.refs).map(ref => {
    const current = records.get(`${ref.table}:${ref.id}`)
    return { ref, ...classifyStale(ref, current, currentVersion, currentRuleRevision) }
  })
  const conclusion: RecheckConclusion = rows.some(r => r.state === 'missing' || r.state === 'cross-project')
    ? 'manual-review'
    : rows.some(r => r.state === 'changed')
      ? 'needs-regen'
      : 'consistent'
  const entry: HistoryEntry = deepFreeze({ at: stamp, conclusion, snapshotVersion: currentVersion, ruleRevision: currentRuleRevision, rows })
  const result: RecheckResult = {
    conclusion,
    rows: deepFreeze(rows),
    refs: deepFreeze(deepClone(prev.refs)),
    previous: prev,
    history: deepFreeze([...(prev.history ?? []), entry]),
  }
  return deepFreeze(result)
}

/** basis 字段差异（冲突解释用，非回滚依据）。 */
export function changedFields(table: string, postimage: Postimage, current: SourceRecord): string[] {
  const fields = BASIS_FIELDS[table] ?? []
  const before = postimage.fields ?? {}
  const after = basisSubset(table, current)
  return fields.filter(k => JSON.stringify(canonical(before[k])) !== JSON.stringify(canonical(after[k])))
}

export type UndoVerdict = 'clean' | 'conflict' | 'absent' | 'already-gone'
export type UndoAction = 'restore' | 'delete' | 'refuse' | 'skip'

export interface UndoPlan {
  verdict: UndoVerdict
  action: UndoAction
  reason: string
  diffs: string[]
  note?: string
}

export interface UndoChange {
  table: string
  id: string
  kind: 'update' | 'create'
  postimage: Postimage
}

/**
 * undo 目标分类（乐观冲突守卫，非写时 CAS）。不直接 put/delete，只给计划。
 * clean 要求 updatedAt 一致【且】全业务指纹一致（N2 防非 basis/未 bump 改动被覆盖）。
 * update：干净→restore；冲突→refuse（basis diffs 非空给字段，否则说明非关键字段/时间戳已变）。
 * create：干净→delete；冲突→refuse；已不存在→skip。
 */
export function classifyUndoTarget(change: UndoChange, current: SourceRecord | undefined): UndoPlan {
  const { table, kind, postimage } = change
  if (!postimage.exists) return { verdict: 'absent', action: 'skip', reason: '无 postimage，跳过', diffs: [] }
  if (kind === 'update') {
    if (!current) return { verdict: 'absent', action: 'skip', reason: '记录已不存在', diffs: [] }
    const clean = (current.updatedAt ?? null) === postimage.updatedAt
      && fullFingerprint(current) === postimage.fullFingerprint
    if (clean) return { verdict: 'clean', action: 'restore', reason: '与落库后一致，可恢复', diffs: [] }
    const diffs = changedFields(table, postimage, current)
    const note = diffs.length
      ? `关键字段已改：${diffs.join('、')}`
      : (current.updatedAt !== postimage.updatedAt
        ? 'updatedAt 已变更（非关键字段改动），拒绝覆盖'
        : '记录已变更（非关键字段），拒绝覆盖')
    return { verdict: 'conflict', action: 'refuse', reason: '确认落库后记录已被人工修改，拒绝覆盖', diffs, note }
  }
  if (!current) return { verdict: 'already-gone', action: 'skip', reason: '新建记录已不存在', diffs: [] }
  const clean = (current.updatedAt ?? null) === postimage.updatedAt
    && fullFingerprint(current) === postimage.fullFingerprint
  if (clean) return { verdict: 'clean', action: 'delete', reason: '与落库后一致，可删除', diffs: [] }
  const diffs = changedFields(table, postimage, current)
  return {
    verdict: 'conflict', action: 'refuse', reason: '新建记录已被人工修改，拒绝删除',
    diffs, note: diffs.length ? `关键字段已改：${diffs.join('、')}` : '记录已变更（非关键字段），拒绝删除',
  }
}

export interface BatchUndoPlan {
  restored: Array<{ change: UndoChange, plan: UndoPlan }>
  deleted: Array<{ change: UndoChange, plan: UndoPlan }>
  refused: Array<{ change: UndoChange, plan: UndoPlan }>
  skipped: Array<{ change: UndoChange, plan: UndoPlan }>
  ok: boolean
}

/** 批量 undo 计划：仅 clean 项进入动作；冲突项拒绝单列；部分成功不整体回滚。 */
export function planBatchUndo(changes: UndoChange[], lookup: Map<string, SourceRecord>): BatchUndoPlan {
  const restored: BatchUndoPlan['restored'] = []
  const deleted: BatchUndoPlan['deleted'] = []
  const refused: BatchUndoPlan['refused'] = []
  const skipped: BatchUndoPlan['skipped'] = []
  for (const change of changes) {
    const current = lookup.get(`${change.table}:${change.id}`)
    const plan = classifyUndoTarget(change, current)
    if (plan.action === 'restore') restored.push({ change, plan })
    else if (plan.action === 'delete') deleted.push({ change, plan })
    else if (plan.action === 'refuse') refused.push({ change, plan })
    else skipped.push({ change, plan })
  }
  return { restored, deleted, refused, skipped, ok: refused.length === 0 }
}

/** 置信度统一口径：本系统不按来源数/模型编造分数，一律「未提供」。 */
export const CONFIDENCE_UNAVAILABLE = '未提供'

/** M-3：当前快照内容版本与规则口径修订版本，四链统一引用，不再各处硬编码 1。 */
export const CURRENT_SNAPSHOT_VERSION = 1
export const CURRENT_RULE_REVISION = 1

/** 只读失效评估结果（命令层接入 validateSourceRefs/classifyStale/recheckProvenance）。 */
export interface StaleEvaluation {
  conclusion: RecheckConclusion
  /** 每条来源的失效状态与原因；missing/cross-project 不参与汇总。 */
  rows: RecheckRow[]
  /** 校验失败引用（缺失/跨项目），单列不删除。 */
  invalid: InvalidRef[]
}

/**
 * 只读评估：校验引用存在性与 scope，并对每条来源做 classifyStale；
 * 结论 missing/cross-project→manual-review，任一 changed→needs-regen，全一致→consistent。
 * 不修改账本、不删除失效来源。
 */
export function evaluateStale(
  refs: SourceRef[],
  records: Map<string, SourceRecord>,
  currentVersion = 1,
  currentRuleRevision = 1,
): StaleEvaluation {
  const { invalid } = validateSourceRefs(refs, records)
  const rows = refs.map(ref => {
    const current = records.get(`${ref.table}:${ref.id}`)
    return { ref, ...classifyStale(ref, current, currentVersion, currentRuleRevision) }
  })
  const conclusion: RecheckConclusion = rows.some(r => r.state === 'missing' || r.state === 'cross-project')
    ? 'manual-review'
    : rows.some(r => r.state === 'changed')
      ? 'needs-regen'
      : 'consistent'
  return { conclusion, rows, invalid }
}
