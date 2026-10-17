/**
 * P2-6 AI 溯源治理 · 台账展示层（F05 来源证据 / F06 失效置灰 / F12 重校不可变历史）。
 *
 * 纯展示：数据全部来自命令层 ask-provenance（只读台账 + 实时失效评估）与
 * ask-recheck（真实重校并持久化不可变历史）；前端不重算置信度、不编造分数，
 * 置信度恒为「未提供」。所有文本经 React 转义渲染，不使用 innerHTML。
 */
import { useEffect, useState } from 'react'
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw.mjs'
import HistoryIcon from 'lucide-react/dist/esm/icons/history.mjs'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle.mjs'
import LinkIcon from 'lucide-react/dist/esm/icons/link.mjs'
import {
  PROVENANCE_KIND_LABEL,
  ROLE_LABEL,
  CONCLUSION_LABEL,
  STALE_STATE_LABEL,
  LEDGER_TABLE_TO_RECORD_TYPE,
  LEDGER_TABLE_LABEL,
  groupRefsByRole,
  findRecheckRow,
  entryConclusion,
  isRefStale,
  staleRefCount,
  conclusionTone,
  isoDatePart,
  isoTimePart,
  historyChain,
  historyConclusionLabel,
  type LedgerEntryView,
} from '../core/provenance-view.js'
import type { SourceRef } from '../core/provenance.js'

interface ProvenancePanelProps {
  projectId: string
  execute: (line: string) => Promise<string>
  /** 跳转只读查看：recordType 为 record-location 的 RecordType；找不到由面板安全回退。 */
  onOpenRecord: (recordType: string, id: string) => void
}

interface RecheckSummary {
  total: number
  supported: number
  stale: number
}

/** F06 条目级警告条文案（按真实结论，不泛化）。 */
function warningText(conclusion: string): string | null {
  if (conclusion === 'needs-regen') return '存在内容或口径已变更的来源，建议重新生成结论；失效来源不参与有效汇总。'
  if (conclusion === 'manual-review') return '存在已删除或移出本项目的来源，需人工复核；旧证据保留不删除、不冒充有效。'
  return null
}

export function ProvenancePanel({ projectId, execute, onOpenRecord }: ProvenancePanelProps) {
  const [entries, setEntries] = useState<LedgerEntryView[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rechecking, setRechecking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [lastSummary, setLastSummary] = useState<RecheckSummary | null>(null)

  // 只读拉取本项目台账（best-effort：失败静默，不阻断 AI 主流程）。
  const load = async () => {
    setLoading(true)
    try {
      const raw = await execute(`ask-provenance ${projectId}`)
      const parsed = JSON.parse(raw) as { entries?: LedgerEntryView[], pendingCount?: number }
      setEntries(Array.isArray(parsed.entries) ? parsed.entries : [])
      setPendingCount(Number(parsed.pendingCount ?? 0))
    } catch { /* 台账只读失败静默 */ } finally { setLoading(false) }
  }

  // 打开/切项目时只读拉取一次；execute 为宿主透传闭包，不列入依赖。
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // F12：触发真实重校（命令层 recheckProvenance + recordRecheck 持久化不可变历史），
  // 完成后重读台账以展示最新历史链；旧结论原样保留，不洗白为 fresh。
  const runRecheck = async () => {
    if (rechecking) return
    setRechecking(true)
    setNotice(null)
    try {
      const raw = await execute(`ask-recheck ${projectId}`)
      const parsed = JSON.parse(raw) as { summary?: RecheckSummary }
      if (parsed.summary) setLastSummary(parsed.summary)
      await load()
    } catch (error) {
      setNotice(`重校失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setRechecking(false)
    }
  }

  const renderRef = (ref: SourceRef, entry: LedgerEntryView) => {
    const row = findRecheckRow(ref, entry.recheck?.rows)
    const stale = isRefStale(ref, entry)
    const recordType = LEDGER_TABLE_TO_RECORD_TYPE[ref.table]
    const tableLabel = LEDGER_TABLE_LABEL[ref.table] ?? ref.table
    // 失效/缺失/跨项目不提供跳转（目标不存在或已移出），仅只读说明。
    const jumpable = !!recordType && !stale
    return (
      <li key={`${ref.table}:${ref.id}`} className={`pm-prov-ref${stale ? ' is-stale' : ''}`} data-state={row?.state ?? 'unevaluated'}>
        <span className="pm-prov-ref-role">{ROLE_LABEL[ref.role] ?? ref.role}</span>
        {jumpable ? (
          <button
            type="button"
            className="pm-prov-ref-link"
            onClick={() => onOpenRecord(recordType, ref.id)}
            title={`跳转查看${tableLabel}`}
          >
            <LinkIcon size={12}/>{ref.label || ref.id}
          </button>
        ) : (
          <span className="pm-prov-ref-label">{ref.label || ref.id}</span>
        )}
        <span className="pm-prov-ref-meta">
          {tableLabel} · 快照 v{ref.snapshotVersion} · 口径 v{ref.ruleRevision}
        </span>
        {row && (
          <span className={`pm-prov-ref-state pm-prov-state-${row.state}`}>
            {STALE_STATE_LABEL[row.state]}
            {row.reason ? `：${row.reason}` : ''}
          </span>
        )}
      </li>
    )
  }

  const renderEntry = (entry: LedgerEntryView) => {
    const conclusion = entryConclusion(entry)
    const tone = conclusionTone(conclusion)
    const warn = warningText(conclusion)
    const { basis, context } = groupRefsByRole(entry.refs)
    const history = historyChain(entry)
    const staleCount = staleRefCount(entry)
    return (
      <article key={entry.id} className="pm-prov-entry" data-conclusion={conclusion}>
        <header className="pm-prov-entry-head">
          <span className="pm-prov-kind">{PROVENANCE_KIND_LABEL[entry.kind] ?? entry.kind}</span>
          <span className={`pm-prov-chip pm-prov-tone-${tone}`} data-tone={tone}>
            {CONCLUSION_LABEL[conclusion]}
          </span>
          {entry.status === 'pending' && <span className="pm-prov-chip pm-prov-tone-muted">待补偿</span>}
          <time className="pm-prov-time" dateTime={entry.createdAt}>
            {isoDatePart(entry.createdAt)} {isoTimePart(entry.createdAt)}
          </time>
        </header>
        <p className="pm-prov-summary">{entry.summary}</p>
        <p className="pm-prov-meta-line">
          置信度：{entry.confidence || '未提供'}（不按来源数量评分）
          <span className="pm-prov-entry-id">记录号 {entry.id}</span>
        </p>
        {warn && (
          <div className={`pm-prov-warn pm-prov-warn-${tone}`} role="note">
            <AlertTriangle size={13}/>{warn}
          </div>
        )}
        {/* F05：来源按依据/上下文分组展开，列依据记录，可跳转只读查看 */}
        <details className="pm-prov-group" open>
          <summary>来源（{entry.refs.length} 条 · 依据 {basis.length} · 上下文 {context.length}{staleCount ? ` · 失效 ${staleCount}` : ''}）</summary>
          {basis.length > 0 && (
            <div className="pm-prov-subgroup">
              <div className="pm-prov-subgroup-title">依据（动作直接依赖）</div>
              <ul className="pm-prov-refs">{basis.map(ref => renderRef(ref, entry))}</ul>
            </div>
          )}
          {context.length > 0 && (
            <div className="pm-prov-subgroup">
              <div className="pm-prov-subgroup-title">上下文（发给模型的佐证）</div>
              <ul className="pm-prov-refs">{context.map(ref => renderRef(ref, entry))}</ul>
            </div>
          )}
          {entry.recheck?.invalid?.length ? (
            <div className="pm-prov-invalid">
              未通过校验（单列不删除）：
              {entry.recheck.invalid.map(v => (
                <span key={`${v.ref.table}:${v.ref.id}`} className="pm-prov-invalid-item">
                  {LEDGER_TABLE_LABEL[v.ref.table] ?? v.ref.table} {v.ref.label || v.ref.id}（{v.reason === 'missing' ? '记录已删除' : '跨项目'}）
                </span>
              ))}
            </div>
          ) : null}
        </details>
        {/* F12：不可变重校历史链，旧结论原样保留，不洗白为 fresh */}
        {history.length > 0 && (
          <details className="pm-prov-group">
            <summary><HistoryIcon size={12}/>重校历史（{history.length} 次，不可变保留）</summary>
            <ol className="pm-prov-history">
              {history.map((h, i) => (
                <li key={`${entry.id}-hist-${i}`} className="pm-prov-history-item">
                  <div className="pm-prov-history-head">
                    <span className={`pm-prov-chip pm-prov-tone-${conclusionTone(h.conclusion)}`}>
                      {historyConclusionLabel(h)}
                    </span>
                    <span className="pm-prov-history-meta">
                      {h.at ? `${isoDatePart(h.at)} ${isoTimePart(h.at)}` : '时间未记录'}
                      · 快照 v{h.snapshotVersion} · 口径 v{h.ruleRevision}
                    </span>
                  </div>
                  {h.rows.length > 0 && (
                    <ul className="pm-prov-history-rows">
                      {h.rows.map((r, j) => (
                        <li key={j} className={`pm-prov-history-row pm-prov-state-${r.state}`}>
                          {r.ref.label || r.ref.id}：{STALE_STATE_LABEL[r.state]}{r.reason ? `（${r.reason}）` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
            <p className="pm-prov-history-note">旧版结论与证据原样留痕，重校只追加新记录，不覆盖、不冒充最新有效。</p>
          </details>
        )}
      </article>
    )
  }

  return (
    <section className="pm-prov-panel" aria-label="AI 溯源台账">
      <div className="pm-prov-toolbar">
        <h3 className="pm-prov-title">AI 溯源台账</h3>
        <div className="pm-prov-toolbar-actions">
          <button type="button" className="pm-prov-btn" disabled={loading} onClick={() => void load()}>
            <RefreshCw size={13} className={loading ? 'pm-spin' : ''}/>刷新
          </button>
          <button type="button" className="pm-prov-btn" disabled={rechecking || loading} onClick={() => void runRecheck()}>
            <RefreshCw size={13} className={rechecking ? 'pm-spin' : ''}/>
            {rechecking ? '重校中…' : '立即重校'}
          </button>
        </div>
      </div>
      {pendingCount > 0 && (
        <div className="pm-prov-pending" role="note">
          {pendingCount} 条台账记录待补偿并入（F13），下次读取时幂等并入；不影响已落库业务。
        </div>
      )}
      {notice && <div className="pm-prov-notice" role="alert">{notice}</div>}
      {lastSummary && (
        <p className="pm-prov-summary-line">
          上次重校：共 {lastSummary.total} 条 · 一致 {lastSummary.supported} · 待处理 {lastSummary.stale}（仅「一致」计入有效）
        </p>
      )}
      {entries.length === 0 && !loading ? (
        <p className="pm-prov-empty">本项目暂无已确认的 AI 溯源记录；AI 草稿确认入库后在此登记真实来源。</p>
      ) : (
        <div className="pm-prov-list">{entries.map(renderEntry)}</div>
      )}
    </section>
  )
}
