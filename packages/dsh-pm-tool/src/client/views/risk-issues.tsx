/**
 * 风险与问题（重设计 v2 · dsh 主题对齐版）。
 *
 * 数据口径：全部由 props.records 派生，不手算业务数字、不写死示例数据。
 * - 风险 / 问题双区：顶部 segmented 切换；问题无概率，不进概率矩阵。
 * - 概率 × 影响矩阵（3×4）：格底按「概率权重 × 影响权重」得分映射
 *   绿（低危）/ 琥珀（中危）/ 红（高危），与列表严重度 chip 同源；
 *   格内条目为可点击定位点（onEdit）。
 * - 列表：严重度 chip、状态 chip、负责人、概率×影响、应对/解决方案、截止（逾期标红）。
 * - 空态：records 为空时渲染诚实空态卡 + 新建主按钮。
 *
 * props 签名（DESIGN-SPEC §6）：{ records, disabled?, onCreate, onEdit }。
 * 样式见 risk-issues.css，全部选择器 scope 在 .pm-ri-root 下。
 */
import { Fragment, useMemo, useState, type KeyboardEvent } from 'react'
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert.mjs'
import css from './risk-issues.css?raw'
import { localTodayIso } from '../../core/derived.js'
import type { RiskIssue } from './types.js'

const STATUS_LABEL: Record<RiskIssue['status'], string> = {
  open: '待处理',
  monitoring: '跟进中',
  closed: '已关闭',
}
const PROB_LABEL: Record<string, string> = { low: '低', medium: '中', high: '高' }
const IMPACT_LABEL: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }

type Severity = 'low' | 'mid' | 'high'

/** 概率权重：空值按最低计；影响权重：critical=4。 */
const PROB_W = { low: 1, medium: 2, high: 3 } as const
const IMPACT_W = { low: 1, medium: 2, high: 3, critical: 4 } as const

/** 得分 ≤2 低危（绿）；3~4 中危（琥珀）；≥6 高危（红）。 */
function severityOf(r: Pick<RiskIssue, 'probability' | 'impact'>): Severity {
  const p = r.probability ? PROB_W[r.probability] : 1
  const score = p * IMPACT_W[r.impact]
  if (score <= 2) return 'low'
  if (score <= 4) return 'mid'
  return 'high'
}

const SEV_WEIGHT: Record<Severity, number> = { low: 1, mid: 2, high: 3 }
const SEV_LABEL: Record<Severity, string> = { low: '低', mid: '中', high: '高' }
const STATUS_ORDER: Record<RiskIssue['status'], number> = { open: 0, monitoring: 1, closed: 2 }

const PROB_ROWS = ['high', 'medium', 'low'] as const
const IMPACT_COLS = ['low', 'medium', 'high', 'critical'] as const

export function RiskIssuesView(props: {
  records: RiskIssue[]
  disabled?: boolean
  onCreate: () => void
  onEdit: (r: RiskIssue) => void
}) {
  const { records, disabled, onCreate, onEdit } = props
  const today = localTodayIso()
  const [tab, setTab] = useState<'risk' | 'issue'>('risk')

  const risks = useMemo(() => records.filter(r => r.type === 'risk'), [records])
  const issues = useMemo(() => records.filter(r => r.type === 'issue'), [records])

  const openCount = records.filter(r => r.status === 'open').length
  const monitoringCount = records.filter(r => r.status === 'monitoring').length
  const closedCount = records.filter(r => r.status === 'closed').length
  const overdueCount = records.filter(r => r.status !== 'closed' && r.dueDate && r.dueDate < today).length

  const visible = useMemo(() => {
    const list = (tab === 'risk' ? risks : issues).slice()
    return list.sort((a, b) =>
      SEV_WEIGHT[severityOf(b)] - SEV_WEIGHT[severityOf(a)]
      || STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      || a.id.localeCompare(b.id, 'en', { numeric: true }),
    )
  }, [tab, risks, issues])

  // 矩阵格子：仅风险，按 概率行 × 影响列 分桶
  const matrix = useMemo(() => {
    const map = new Map<string, RiskIssue[]>()
    for (const r of risks) {
      const p = r.probability ?? 'low'
      const key = `${p}|${r.impact}`
      const arr = map.get(key) ?? []
      arr.push(r)
      map.set(key, arr)
    }
    return map
  }, [risks])

  const isOverdue = (r: RiskIssue): boolean =>
    r.status !== 'closed' && !!r.dueDate && r.dueDate < today

  // ---------- 空态（真实库为 0） ----------
  if (!records.length) {
    return (
      <div className="pm-ri-root">
        <style>{css}</style>
        <header className="ri-head">
          <div>
            <h1>风险与问题</h1>
            <p className="ri-sub">登记项目推进中识别出的风险与已暴露的问题，并跟踪应对闭环。</p>
          </div>
        </header>
        <section className="ri-card ri-empty-card">
          <div className="ri-empty">
            <div className="ri-ico"><ShieldAlert size={20}/></div>
            <h4>尚未登记任何风险或问题</h4>
            <p>项目当前没有已识别的风险与问题。评审、测试与上线过程中发现的不确定项，建议第一时间登记，便于跟踪应对与闭环。</p>
            <button type="button" className="ri-btn-primary" disabled={disabled} onClick={onCreate}>
              <Plus size={14}/> 登记风险/问题
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="pm-ri-root">
      <style>{css}</style>

      <header className="ri-head">
        <div>
          <h1>风险与问题</h1>
          <p className="ri-sub">
            <b>{openCount} 开放</b> · {monitoringCount} 跟进中 · {overdueCount} 已逾期 · {closedCount} 已关闭
          </p>
        </div>
        <button type="button" className="ri-btn-primary" disabled={disabled} onClick={onCreate}>
          <Plus size={14}/> 登记风险/问题
        </button>
      </header>

      {/* I6：完整 tab 模式——tablist/tab/tabpanel/aria-selected 齐备；←/→/↑/↓ 移动选中并跟随焦点，Home/End 跳首尾，roving tabindex。 */}
      <div
        className="ri-seg" role="tablist" aria-label="筛选记录类型"
        onKeyDown={(ev: KeyboardEvent<HTMLDivElement>) => {
          const order = ['risk', 'issue'] as const
          const idx = order.indexOf(tab)
          let next: typeof tab | null = null
          if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') next = order[(idx + 1) % order.length]
          else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') next = order[(idx - 1 + order.length) % order.length]
          else if (ev.key === 'Home') next = order[0]
          else if (ev.key === 'End') next = order[order.length - 1]
          if (!next) return
          ev.preventDefault()
          setTab(next)
          requestAnimationFrame(() => document.getElementById(`ri-tab-${next}`)?.focus())
        }}
      >
        <button
          id="ri-tab-risk" type="button" role="tab" aria-selected={tab === 'risk'}
          aria-controls="ri-panel" tabIndex={tab === 'risk' ? 0 : -1}
          className={tab === 'risk' ? 'on' : ''} onClick={() => setTab('risk')}
        >
          风险 <span className="n">{risks.length}</span>
        </button>
        <button
          id="ri-tab-issue" type="button" role="tab" aria-selected={tab === 'issue'}
          aria-controls="ri-panel" tabIndex={tab === 'issue' ? 0 : -1}
          className={tab === 'issue' ? 'on' : ''} onClick={() => setTab('issue')}
        >
          问题 <span className="n">{issues.length}</span>
        </button>
      </div>

      <div className="ri-body">

        {tab === 'risk' && (
          <section className="ri-card">
            <div className="ri-card-head">
              <h3>风险矩阵 · 概率 × 影响</h3>
              <span className="more">点圆点定位列表</span>
            </div>
            <div className="ri-mtx">
              <div className="corner"/>
              {IMPACT_COLS.map(im => <div className="colh" key={im}>影响 {IMPACT_LABEL[im]}</div>)}
              {PROB_ROWS.map(pr => (
                <Fragment key={pr}>
                  <div className="rowh">概率<small>{PROB_LABEL[pr]}</small></div>
                  {IMPACT_COLS.map(im => {
                    const cell = matrix.get(`${pr}|${im}`) ?? []
                    const score = PROB_W[pr] * IMPACT_W[im]
                    const sev: Severity = score <= 2 ? 'low' : score <= 4 ? 'mid' : 'high'
                    return (
                      <div className={`ri-mcell is-${sev}`} key={im}>
                        {cell.map(r => (
                          <button
                            type="button" key={r.id} className="ri-dot-tag"
                            title={`${r.id} ${r.title}`} onClick={() => onEdit(r)}
                          >
                            {r.id}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </Fragment>
              ))}
            </div>
            <div className="ri-mtx-foot">
              <span className="lg"><i className="sw sw-low"/>低危</span>
              <span className="lg"><i className="sw sw-mid"/>中危</span>
              <span className="lg"><i className="sw sw-high"/>高危</span>
              <span className="ri-mtx-note">问题不参与概率矩阵</span>
            </div>
          </section>
        )}

        <section className="ri-card" role="tabpanel" id="ri-panel"
          aria-labelledby={tab === 'risk' ? 'ri-tab-risk' : 'ri-tab-issue'}>
          <div className="ri-card-head">
            <h3>{tab === 'risk' ? '风险' : '问题'}清单 · {visible.length}</h3>
            <span className="more">按严重度排序</span>
          </div>

          {visible.length === 0 && (
            <div className="ri-inline-empty">
              {tab === 'risk' ? '暂无风险，可通过右上角「登记风险/问题」补充。' : '暂无问题。'}
            </div>
          )}

          {visible.map(r => {
            const sev = severityOf(r)
            const overdue = isOverdue(r)
            return (
              <button type="button" className="ri-row" key={r.id} onClick={() => onEdit(r)}>
                <span className="ri-row-l1">
                  <span className="ri-row-id">{r.id}</span>
                  <span className={`ri-chip sev-${sev}`}><i/>{SEV_LABEL[sev]}</span>
                  <span className="ri-row-title">{r.title}</span>
                  <span className="ri-row-sp"/>
                  <span className={`ri-chip st-${r.status}`}><i/>{STATUS_LABEL[r.status]}</span>
                </span>
                <span className="ri-row-l2">
                  <span className="ri-owner">
                    <span className={r.owner ? 'ri-ava' : 'ri-ava off'}>{r.owner ? r.owner.slice(0, 1) : '未'}</span>
                    {r.owner || '未指定'}
                  </span>
                  {r.type === 'risk' && (
                    <span className="ri-qual">概率 {PROB_LABEL[r.probability ?? 'low']} × 影响 {IMPACT_LABEL[r.impact]}</span>
                  )}
                  {r.type === 'issue' && <span className="ri-qual">影响 {IMPACT_LABEL[r.impact]}</span>}
                  <span className="ri-plan">
                    <b>{r.type === 'risk' ? '应对' : '方案'}：</b>
                    {r.type === 'risk' ? (r.responsePlan || '暂无') : (r.solution || '暂无')}
                  </span>
                  <span className={overdue ? 'ri-due overdue' : 'ri-due'}>
                    {r.dueDate ? (overdue ? `逾期 · ${r.dueDate}` : `截止 ${r.dueDate}`) : '无截止'}
                  </span>
                </span>
              </button>
            )
          })}
        </section>
      </div>
    </div>
  )
}

