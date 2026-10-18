/**
 * 进度汇报视图（重设计 v2 · dsh 主题对齐版）。
 *
 * 左：周期汇报列表（行高严格一致、日期列等宽不换行 tabular-nums，修掉旧版「汇报周期列换行撑高」）。
 * 右：内容详情——周期类型 chip（周报/月报/自定义）+ 起止日期 chip + 状态 chip 统一；
 *     执行摘要 / 本期快照（snapshot 真实计数）/ 已完成 · 下步 · 阻塞 / 例外。
 *
 * 不编造历史趋势：跨期对比一律不画曲线，只展示选中期的真实快照。
 * 样式见 reports.css，全部 scope 在 .pm-rp-root 下。
 */
import { useMemo, useState } from 'react'
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.mjs'
import FileText from 'lucide-react/dist/esm/icons/file-text.mjs'
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import Search from 'lucide-react/dist/esm/icons/search.mjs'
import css from './reports.css?raw'
import { MarkdownView } from '../shared/markdown-view.js'
import type { ProgressReport } from './types.js'

type PeriodType = 'w' | 'm' | 'c'
type StatusFilter = 'all' | 'final' | 'draft'

const PERIOD_TYPE_LABEL: Record<PeriodType, string> = { w: '周报', m: '月报', c: '自定义' }
const PERIOD_TYPE_CLS: Record<PeriodType, string> = { w: 'is-w', m: 'is-m', c: 'is-c' }
const STATUS_LABEL: Record<string, string> = { draft: '草稿', final: '已定稿' }
const STATUS_FILTER_LABEL: Record<StatusFilter, string> = { all: '全部', final: '已定稿', draft: '草稿' }

/** 由起止日期推导周期类型：≤10 天周报、≤45 天月报、其余自定义。 */
function periodType(start: string, end: string): PeriodType {
  const days = Math.round((Date.parse(`${end}T00:00:00`) - Date.parse(`${start}T00:00:00`)) / 86_400_000)
  if (days <= 10) return 'w'
  if (days <= 45) return 'm'
  return 'c'
}

/** YYYY-MM-DD → MM-DD，紧凑日期。 */
function shortDay(iso: string): string {
  return iso.slice(5)
}

export function ReportsView(props: {
  reports: ProgressReport[]
  onCreate: () => void
  onEdit: (report: ProgressReport) => void
}) {
  const { reports, onCreate, onEdit } = props
  // 列表按 periodEnd 降序（core listProgressReports 已排，这里再保险一次）。
  const sorted = useMemo(
    () => [...reports].sort((a, b) => b.periodEnd.localeCompare(a.periodEnd) || b.id.localeCompare(a.id)),
    [reports],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // 真过滤：状态（全部/已定稿/草稿）+ 文本（标题/执行摘要/周期文本，大小写不敏感）。
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sorted.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!q) return true
      const periodText = `${shortDay(r.periodStart)} → ${shortDay(r.periodEnd)}`
      return (
        r.title.toLowerCase().includes(q)
        || r.executiveSummary.toLowerCase().includes(q)
        || periodText.toLowerCase().includes(q)
      )
    })
  }, [sorted, query, statusFilter])

  const current = filtered.find(r => r.id === selectedId) ?? filtered[0] ?? null

  if (sorted.length === 0) {
    return (
      <div className="pm-rp-root">
        <style>{css}</style>
        <div className="rp-head">
          <div>
            <h1>进度汇报</h1>
            <div className="rp-sub">按周期沉淀执行摘要与快照</div>
          </div>
        </div>
        {/* W-DEF-006（规范 §7 空态 CTA 去重）：空态仅在诚实空态卡保留唯一「生成快照」主 CTA，
            删除与空态卡重复的页头入口；有数据分支的页头 CTA 保持不变。 */}
        <div className="rp-card rp-empty-card">
          <FileText size={28} />
          <p>暂无进度汇报。基于当前任务 / 里程碑 / 会议快照生成第一份周期汇报。</p>
          <button type="button" className="rp-btn" onClick={onCreate}><Plus size={14} />生成快照</button>
        </div>
      </div>
    )
  }

  const snap = current?.snapshot
  // wrapped（收口态）= 总数 − done/inProgress/todo/blocked，残差口径保证五态求和闭合，非负兜底。
  const wrappedCount = snap
    ? Math.max(0, snap.tasks.total - snap.tasks.done - snap.tasks.inProgress - snap.tasks.todo - snap.tasks.blocked)
    : 0

  return (
    <div className="pm-rp-root">
      <style>{css}</style>

      <div className="rp-head">
        <div>
          <h1>进度汇报</h1>
          <div className="rp-sub">按周期沉淀执行摘要与快照 · {sorted.length} 条汇报</div>
        </div>
      </div>

      <div className="rp-body">
        {/* 左：周期列表 */}
        <aside className="rp-rail">
          <div className="rp-rail-head">
            <h2>汇报周期</h2>
            <span className="rp-rail-n">{filtered.length} / {sorted.length} 条</span>
          </div>
          <div className="rp-rail-filters">
            <label className="rp-search">
              <Search size={13} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜索记录"
                aria-label="搜索记录"
              />
            </label>
            <div className="rp-seg" role="group" aria-label="筛选汇报状态">
              {(['all', 'final', 'draft'] as StatusFilter[]).map(s => (
                <button
                  type="button"
                  key={s}
                  className={`rp-seg-btn${statusFilter === s ? ' is-on' : ''}`}
                  aria-pressed={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                >
                  {STATUS_FILTER_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="rp-list">
            {filtered.length === 0 && (
              <div className="rp-list-empty">没有匹配的汇报记录。</div>
            )}
            {filtered.map(r => {
              const pt = periodType(r.periodStart, r.periodEnd)
              const isActive = current?.id === r.id
              return (
                <button
                  type="button"
                  key={r.id}
                  className={`rp-item${isActive ? ' active' : ''}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <span className="rp-item-main">
                    <span className="rp-row1">
                      <span className={`rp-ptype ${PERIOD_TYPE_CLS[pt]}`}>{PERIOD_TYPE_LABEL[pt]}</span>
                    </span>
                    <span className="rp-dates">{shortDay(r.periodStart)} → {shortDay(r.periodEnd)}</span>
                    <span className="rp-title">{r.title}</span>
                  </span>
                  <span className={`pm-chip rp-st ${r.status === 'final' ? 'is-done' : 'is-todo'}`}>
                    <i className={`pm-dot ${r.status === 'final' ? 'rp-dot-done' : 'rp-dot-todo'}`} />
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* 右：详情 */}
        {current && (
          <section className="rp-detail">
            <div className="rp-card">
              <div className="rp-eyebrow">执行摘要 · Executive Summary</div>
              <div className="rp-dhead">
                <h2>{current.title}</h2>
                <span className={`pm-chip rp-st ${current.status === 'final' ? 'is-done' : 'is-todo'}`}>
                  <i className={`pm-dot ${current.status === 'final' ? 'rp-dot-done' : 'rp-dot-todo'}`} />
                  {STATUS_LABEL[current.status] ?? current.status}
                </span>
                <span className="rp-chip-date">
                  <CalendarDays size={12} />
                  {shortDay(current.periodStart)} → {shortDay(current.periodEnd)}
                </span>
                <button type="button" className="rp-edit" onClick={() => onEdit(current)}>编辑</button>
              </div>
              {current.executiveSummary.trim()
                ? <MarkdownView source={current.executiveSummary} density="detail" className="rp-summary-md"/>
                : <p className="rp-summary">（暂无执行摘要）</p>}
              <div className="rp-meta">
                <span>快照于 {current.snapshotAt.slice(0, 10)}</span>
              </div>
            </div>

            {snap && (
              <div className="rp-card">
                <div className="rp-eyebrow">本期快照 · Snapshot</div>
                <div className="rp-snap">
                  <div className="rp-cell"><span className="rp-k">任务总数</span><span className="rp-v">{snap.tasks.total}</span></div>
                  <div className="rp-cell"><span className="rp-k">已完成</span><span className="rp-v rp-v-done">{snap.tasks.done}</span></div>
                  <div className="rp-cell"><span className="rp-k">进行中</span><span className="rp-v rp-v-prog">{snap.tasks.inProgress}</span></div>
                  <div className="rp-cell"><span className="rp-k">待办</span><span className="rp-v">{snap.tasks.todo}</span></div>
                  <div className="rp-cell"><span className="rp-k">受阻</span><span className="rp-v rp-v-block">{snap.tasks.blocked}</span></div>
                  {/* wrapped（非 done 非 open 的收口态）用总数残差派生，保证五态求和与总数闭合，不甩给 TaskTable。 */}
                  <div className="rp-cell"><span className="rp-k">已收口(wrapped)</span><span className="rp-v">{wrappedCount}</span></div>
                  {/* averageProgress=null 表示样本不足，显式「证据不足」，不得当 0%。 */}
                  <div className="rp-cell">
                    <span className="rp-k">平均进度</span>
                    <span className="rp-v">{snap.tasks.averageProgress == null ? '证据不足' : `${Math.round(snap.tasks.averageProgress)}%`}</span>
                  </div>
                  <div className="rp-cell"><span className="rp-k">里程碑</span><span className="rp-v">{snap.milestones.achieved}<small> / {snap.milestones.total}</small></span></div>
                  <div className="rp-cell"><span className="rp-k">会议</span><span className="rp-v">{snap.meetings.inPeriod}<small> 次 · 决议 {snap.meetings.decisions}</small></span></div>
                </div>
              </div>
            )}

            <div className="rp-cols">
              <div className="rp-card">
                <div className="rp-eyebrow rp-eyebrow-done">已完成 · Completed</div>
                {current.completedWork.length > 0 ? (
                  <ul className="rp-ul rp-ul-done">
                    {current.completedWork.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                ) : <p className="rp-empty-line">（本期无记录）</p>}
              </div>
              <div className="rp-card">
                <div className="rp-eyebrow rp-eyebrow-prog">下步计划 · Next</div>
                {current.nextPlans.length > 0 ? (
                  <ul className="rp-ul rp-ul-next">
                    {current.nextPlans.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                ) : <p className="rp-empty-line">（本期无记录）</p>}
              </div>
              <div className="rp-card">
                <div className="rp-eyebrow rp-eyebrow-block">阻塞 · Blockers</div>
                {current.blockers.length > 0 ? (
                  <ul className="rp-ul rp-ul-block">
                    {current.blockers.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                ) : <p className="rp-empty-line">（本期无阻塞）</p>}
              </div>
            </div>

            {snap && snap.exceptions.length > 0 && (
              <div className="rp-card">
                <div className="rp-eyebrow">例外 / 风险提示 · Exceptions</div>
                <div className="rp-excs">
                  {snap.exceptions.map(ex => (
                    <div className="rp-exc" key={ex.id}>
                      <span className={`rp-exc-tag ${ex.severity === 'critical' ? 'is-late' : 'is-block'}`}>
                        {ex.kind === 'overdue_task' ? '逾期任务' : ex.kind === 'blocked_task' ? '受阻任务' : ex.kind === 'milestone' ? '里程碑' : ex.kind === 'risk_issue' ? '风险' : '行动项'}
                      </span>
                      <span>{ex.title}{ex.detail ? ` · ${ex.detail}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
