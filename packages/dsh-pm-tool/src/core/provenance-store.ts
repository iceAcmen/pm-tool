/**
 * P2-6 溯源账本持久化（bounded ledger，复用 settings 固定行 + 串行写队列）。
 *
 * 存储决定（docs/design/p2-6-storage-decision-20261017.md）：
 * - 不新增领域表（避免 v2 schema/load 兼容风险），沿用 settings 自由键值表，只占两个固定行：
 *   `pmProvenanceLedger`（已确认条目，每项目有界 20 条，丢最旧）、`pmProvenancePending`（F13 补偿重试队列）。
 * - 写盘统一走 enqueueDomainWrite（与业务同一条串行写队列）；读为内存同步读。
 * - F13：业务落库成功后账本写失败不回滚业务；失败条目转入 pending 行，下次记录时幂等重试（sweepPending），
 *   避免业务与账本永久分歧；既有 60s 顺序重放幂等标记保持不变。
 * - F14：每条 undo 句柄记审计事件（时间/对象/前后值/结果），撤销成功/冲突/失败留痕。
 * - 只存 refs/不可变历史/最小 undo 句柄元数据/审计；不存动作正文/patch 明文/凭据；置信度恒「未提供」。
 */
import { enqueueDomainWrite } from './projects.js'
import type { PmDomain } from './storage.js'
import type { SourceRef, HistoryEntry, UndoChange, SourceRecord } from './provenance.js'
import { CONFIDENCE_UNAVAILABLE, recheckProvenance, validateSourceRefs, CURRENT_SNAPSHOT_VERSION, CURRENT_RULE_REVISION } from './provenance.js'

/** settings 表占用的固定行 id。 */
export const PROVENANCE_LEDGER_ROW = 'pmProvenanceLedger'
export const PROVENANCE_PENDING_ROW = 'pmProvenancePending'

/** 每项目保留的溯源条目上限（超出丢最旧；不可变历史在条目内自洽）。 */
export const PROVENANCE_PER_PROJECT_CAP = 20

/** 账本条目真实版本号（M-3）：新增条目落盘即写；旧/未知版本条目读回时忽略，不臆造。 */
export const PROVENANCE_SCHEMA_VERSION = 1

/** undo 句柄 TTL 与上限沿用 ask 既有真实限制（10min / 最多 3 条 / 一次性 / 重启失效），不在此造新时限。 */
export const PROVENANCE_UNDO_TTL_MS = 10 * 60 * 1000

export type ProvenanceKind = 'ask-apply' | 'wbs-import' | 'report-narrate' | 'meeting-summarize'

export interface ProvenanceUndoMeta {
  handle: string
  expiresAt: number
  used: boolean
  postimages: UndoChange[]
}

/** F14 审计事件：时间/对象/前后值/结果。 */
export interface ProvenanceAuditEvent {
  at: string
  kind: 'applied' | 'undone' | 'conflict' | 'failed'
  object: string
  before?: unknown
  after?: unknown
  result: string
}

export interface ProvenanceLedgerEntry {
  id: string
  projectId: string
  kind: ProvenanceKind
  createdAt: string
  /** F13：confirmed=业务与账本均落盘；pending=业务已落盘但账本待补偿重试。 */
  status: 'confirmed' | 'pending'
  /** M-3：条目真实版本号（对齐 PROVENANCE_SCHEMA_VERSION）。 */
  schemaVersion: number
  confidence: typeof CONFIDENCE_UNAVAILABLE
  summary: string
  refs: SourceRef[]
  history: HistoryEntry[]
  undo?: ProvenanceUndoMeta
  audit: ProvenanceAuditEvent[]
}

interface LedgerShape { entries?: ProvenanceLedgerEntry[] }

function readRows(domain: PmDomain, row: string): ProvenanceLedgerEntry[] {
  const r = domain.table('settings').get(row) as { value?: unknown } | undefined
  const value = r?.value as LedgerShape | undefined
  if (!value || typeof value !== 'object' || !Array.isArray(value.entries)) return []
  return value.entries.filter((e): e is ProvenanceLedgerEntry => !!e && typeof e === 'object' && 'id' in e)
}

/** 有界裁剪（纯函数，可单测）：按项目分组，每组只留最新 CAP 条。 */
export function capEntries(entries: ProvenanceLedgerEntry[], cap = PROVENANCE_PER_PROJECT_CAP): ProvenanceLedgerEntry[] {
  const byProject = new Map<string, ProvenanceLedgerEntry[]>()
  for (const e of entries) {
    const list = byProject.get(e.projectId) ?? []
    list.push(e)
    byProject.set(e.projectId, list)
  }
  const kept: ProvenanceLedgerEntry[] = []
  for (const list of byProject.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    kept.push(...list.slice(Math.max(0, list.length - cap)))
  }
  return kept
}

/** 按 id 去重（纯函数，F13 幂等重试：同 id 已在账本则不重复追加）。 */
export function dedupeById(entries: ProvenanceLedgerEntry[]): ProvenanceLedgerEntry[] {
  const seen = new Set<string>()
  const out: ProvenanceLedgerEntry[] = []
  for (const e of entries) {
    if (seen.has(e.id)) continue
    seen.add(e.id)
    out.push(e)
  }
  return out
}

/** m-5：pending 失败重试队列有界裁剪（全局留最新 CAP，去重后裁剪），避免长期失败无界增长。 */
export function capPendingEntries(entries: ProvenanceLedgerEntry[], cap = PROVENANCE_PER_PROJECT_CAP): ProvenanceLedgerEntry[] {
  return dedupeById(entries).slice(-cap)
}

function makeId(): string {
  return `prv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export interface RecordProvenanceInput {
  projectId: string
  kind: ProvenanceKind
  summary: string
  refs: SourceRef[]
  history?: HistoryEntry[]
  undo?: ProvenanceUndoMeta
  status?: 'confirmed' | 'pending'
}

/** 内部：在串行队列内把 pending 补偿重试并入账本（幂等），返回最终条目。 */
async function commitInQueue(domain: PmDomain, entry: ProvenanceLedgerEntry): Promise<void> {
  // F13 sweep：先把待补偿条目幂等并入账本。
  const pending = readRows(domain, PROVENANCE_PENDING_ROW)
  let ledger = dedupeById([...readRows(domain, PROVENANCE_LEDGER_ROW), ...pending])
  const hasSelf = ledger.some(e => e.id === entry.id)
  if (!hasSelf) ledger = dedupeById([...ledger, entry])
  ledger = capEntries(ledger)
  await domain.table('settings').put(PROVENANCE_LEDGER_ROW, { value: { entries: ledger }, updatedAt: new Date().toISOString() })
  // 清空已并入的 pending（保留仍未并入之外的其它 pending）。
  await domain.table('settings').put(PROVENANCE_PENDING_ROW, { value: { entries: [] }, updatedAt: new Date().toISOString() })
}

/**
 * 写入一条溯源记录（best-effort，串行写队列）。
 * 账本写失败：业务已落库不回滚；把条目转入 pending 行待下次幂等重试（F13 补偿）。
 */
export function recordProvenance(domain: PmDomain, input: RecordProvenanceInput): Promise<void> {
  const entry: ProvenanceLedgerEntry = {
    id: makeId(),
    projectId: input.projectId,
    kind: input.kind,
    createdAt: new Date().toISOString(),
    status: input.status ?? 'confirmed',
    schemaVersion: PROVENANCE_SCHEMA_VERSION,
    confidence: CONFIDENCE_UNAVAILABLE,
    summary: input.summary,
    refs: input.refs,
    history: input.history ?? [],
    undo: input.undo,
    audit: [{ at: new Date().toISOString(), kind: 'applied', object: input.kind, result: '业务已落库，溯源已登记' }],
  }
  return enqueueDomainWrite(domain, async () => {
    await commitInQueue(domain, entry)
  }).catch(() => {
    // F13：账本写失败不影响已落库业务；转入 pending 待补偿（best-effort，再次失败仅留痕）。
    void enqueueDomainWrite(domain, async () => {
      const pending = capPendingEntries([...readRows(domain, PROVENANCE_PENDING_ROW), entry])
      await domain.table('settings').put(PROVENANCE_PENDING_ROW, { value: { entries: pending }, updatedAt: new Date().toISOString() })
    }).catch(() => {})
  })
}

/** 同步读某项目全部溯源条目（深拷贝，避免外部原地改账本）。 */
export function listProvenance(domain: PmDomain, projectId: string): ProvenanceLedgerEntry[] {
  return readRows(domain, PROVENANCE_LEDGER_ROW)
    .filter(e => e.projectId === projectId)
    .map(e => structuredClone(e))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** F14：向指定条目追加审计事件（撤销成功/冲突/失败）；best-effort。 */
export function appendUndoAudit(
  domain: PmDomain,
  entryId: string,
  event: ProvenanceAuditEvent,
): Promise<void> {
  return enqueueDomainWrite(domain, async () => {
    const entries = readRows(domain, PROVENANCE_LEDGER_ROW)
    const target = entries.find(e => e.id === entryId)
    if (target) {
      target.audit.push(event)
      if (event.kind === 'undone' && target.undo) target.undo.used = true
    }
    await domain.table('settings').put(PROVENANCE_LEDGER_ROW, { value: { entries }, updatedAt: new Date().toISOString() })
  }).catch(() => {})
}

/** F14：按 undo 句柄（handle）追加撤销结果审计（成功/冲突/失败），无需条目 id；best-effort。 */
export function recordUndoOutcome(
  domain: PmDomain,
  handle: string,
  event: ProvenanceAuditEvent,
): Promise<void> {
  return enqueueDomainWrite(domain, async () => {
    const entries = readRows(domain, PROVENANCE_LEDGER_ROW)
    for (const e of entries) {
      if (e.undo?.handle === handle) {
        e.audit.push(event)
        if (event.kind === 'undone') e.undo.used = true
      }
    }
    await domain.table('settings').put(PROVENANCE_LEDGER_ROW, { value: { entries }, updatedAt: new Date().toISOString() })
  }).catch(() => {})
}

/** F13：显式补偿一次 pending（重启/下次进入时可调用），幂等并入账本。 */
export function sweepPending(domain: PmDomain): Promise<void> {
  return enqueueDomainWrite(domain, async () => {
    const pending = readRows(domain, PROVENANCE_PENDING_ROW)
    if (!pending.length) return
    const ledger = capEntries(dedupeById([
      ...readRows(domain, PROVENANCE_LEDGER_ROW),
      ...pending.map(e => ({ ...e, status: 'confirmed' as const })),
    ]))
    await domain.table('settings').put(PROVENANCE_LEDGER_ROW, { value: { entries: ledger }, updatedAt: new Date().toISOString() })
    await domain.table('settings').put(PROVENANCE_PENDING_ROW, { value: { entries: [] }, updatedAt: new Date().toISOString() })
  }).catch(() => {})
}

export interface RecheckReportRow {
  id: string
  kind: ProvenanceKind
  conclusion: 'consistent' | 'needs-regen' | 'manual-review'
  rows: { state: string, reason: string }[]
  invalid: { reason: string }[]
}

/**
 * B-1：可触发的失效重校（命令层入口）。对项目每条账本条目真实调用
 * validateSourceRefs + recheckProvenance（内部 classifyStale）；失效行不删除、不参与汇总，
 * 旧证据 previous 原样保留，history 追加不可变条目；best-effort 持久化。
 */
export async function recordRecheck(
  domain: PmDomain,
  projectId: string,
  records: Map<string, SourceRecord>,
): Promise<RecheckReportRow[]> {
  const report: RecheckReportRow[] = []
  await enqueueDomainWrite(domain, async () => {
    const entries = readRows(domain, PROVENANCE_LEDGER_ROW).filter(e => e.projectId === projectId)
    for (const e of entries) {
      const { invalid } = validateSourceRefs(e.refs, records)
      const r = recheckProvenance(
        { refs: e.refs, history: e.history ?? [] },
        records,
        CURRENT_SNAPSHOT_VERSION,
        CURRENT_RULE_REVISION,
        new Date().toISOString(),
      )
      e.history = r.history
      report.push({
        id: e.id, kind: e.kind, conclusion: r.conclusion,
        rows: r.rows.map(x => ({ state: x.state, reason: x.reason })),
        invalid: invalid.map(x => ({ reason: x.reason })),
      })
    }
    await domain.table('settings').put(PROVENANCE_LEDGER_ROW, { value: { entries: readRows(domain, PROVENANCE_LEDGER_ROW) }, updatedAt: new Date().toISOString() })
  }).catch(() => {})
  return report
}
