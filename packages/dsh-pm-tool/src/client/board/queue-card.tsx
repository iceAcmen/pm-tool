/**
 * P1-D · K11 补记队列卡（总览看板呈现层）。
 *
 * 数据源：web snapshot 的 `queue` 字段（分片A 按 P1 规格 §2.3 产出
 * `{ top, rest, quietMode, openedAt }`，读时派生、零写）。
 * 分片A 未合入前 snapshot 无 queue 字段 → 走空态，不杜撰、不注入示例数据。
 *
 * 呈现口径（§2.2 / §2.3）：
 *  - 首屏 Top1 醒目卡（标题/状态/截止/迟到 N 天徽标），其余 rest 折叠、可展开；
 *  - lateDays>0 标「迟到 N 天」；muted 条目在折叠区仍可见并标「已静音」（mute 压主动投递，不隐藏打开视图）；
 *  - quietMode 时段静默：不高亮 Top1，全部条目仅折叠列示；
 *  - openedAt 显示「上次打开 HH:MM」；无条目展示「暂无到期未达」空态。
 *
 * 写操作：mute/unmute 走 WidgetActions.runCommand 命令通道（`queue mute|unmute <任务ID>`），
 * 成功后 refreshBoard 刷新快照；通道未接入时按钮禁用，不做僵尸点击。
 * 能力边界：打开时呈现 ≠ 常驻推送（H6 悬置，本期不实现）。
 */
import { useState } from 'react'
import type { Snapshot } from '../panel.js'
import { taskStatusLabels } from '../../core/labels.js'
import type { WidgetDescriptor, WidgetContext } from './types.js'

/* ---------- 契约类型（与分片A §2.3 对齐；结构宽松，缺字段安全回落） ---------- */

export interface QueueItem {
  id: string
  projectId?: string
  /** 记录类型：任务 / 风险；K9 缺席条目仍落 task。 */
  recordType?: 'task' | 'risk' | 'session'
  code?: string
  title: string
  status?: string
  assignee?: string
  dueDate?: string | null
  progress?: number
  /** 积压迟到天数（dueDate < today - LATE_DAYS）。 */
  lateDays?: number
  /** 逾期天数（派生附带，展示用）。 */
  overdueDays?: number
  muted?: boolean
  /** 一句来源说明（承诺/逾期/K9 缺席）。 */
  reason?: string
  /** K9 缺席：会话有结存，任务未跟进。 */
  absent?: boolean
}

export interface QueueSnapshot {
  top: QueueItem | null
  rest: QueueItem[]
  quietMode?: boolean
  openedAt?: string | null
}

type RawQueue = Partial<QueueSnapshot> | null | undefined

function asItem(v: unknown): QueueItem | null {
  if (!v || typeof v !== 'object') return null
  const r = v as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id) return null
  return {
    id: r.id,
    projectId: typeof r.projectId === 'string' ? r.projectId : undefined,
    recordType: r.recordType === 'risk' || r.recordType === 'session' ? r.recordType : 'task',
    code: typeof r.code === 'string' ? r.code : undefined,
    title: typeof r.title === 'string' ? r.title : '',
    status: typeof r.status === 'string' ? r.status : undefined,
    assignee: typeof r.assignee === 'string' ? r.assignee : undefined,
    dueDate: typeof r.dueDate === 'string' ? r.dueDate : null,
    progress: typeof r.progress === 'number' ? r.progress : undefined,
    lateDays: typeof r.lateDays === 'number' ? r.lateDays : undefined,
    overdueDays: typeof r.overdueDays === 'number' ? r.overdueDays : undefined,
    muted: r.muted === true,
    reason: typeof r.reason === 'string' ? r.reason : undefined,
    absent: r.absent === true,
  }
}

function normalizeQueue(raw: RawQueue): { top: QueueItem | null, rest: QueueItem[], quietMode: boolean, openedAt: string | null } {
  if (!raw || typeof raw !== 'object') return { top: null, rest: [], quietMode: false, openedAt: null }
  const top = asItem(raw.top)
  const rest = Array.isArray(raw.rest) ? raw.rest.map(asItem).filter((x): x is QueueItem => x !== null) : []
  const openedAt = typeof raw.openedAt === 'string' ? raw.openedAt : null
  return { top, rest, quietMode: raw.quietMode === true, openedAt }
}

/** ISO → HH:MM（本地时区）；非法输入返回 null。 */
function formatOpenedAt(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function statusLabel(s?: string): string {
  if (!s) return ''
  return taskStatusLabels[s] ?? s
}

/** 条目语义色：阻塞 > 迟到 > 逾期 > 临期/进行。 */
function itemTone(item: QueueItem): string {
  if (item.status === 'blocked') return 'var(--pm-st-blocked)'
  if (typeof item.lateDays === 'number' && item.lateDays > 0) return 'var(--pm-st-overdue)'
  if (typeof item.overdueDays === 'number' && item.overdueDays > 0) return 'var(--pm-st-overdue)'
  if (item.status === 'in_progress') return 'var(--pm-st-progress)'
  return 'var(--pm-st-due)'
}

/* ---------- 条目行（Top1 醒目块与折叠列表共用） ---------- */

function QueueRow({ item, variant, busy, onOpen, onToggleMute }: {
  item: QueueItem
  variant: 'top' | 'rest'
  busy: boolean
  onOpen: () => void
  /** 命令通道未接入时为 undefined：不渲染静音按钮（不做僵尸按钮）。 */
  onToggleMute?: () => void
}) {
  const tone = itemTone(item)
  const canMute = typeof onToggleMute === 'function'
  return (
    <div className={`pm-queue-row ${variant === 'top' ? 'pm-queue-row-top' : ''} ${item.muted ? 'is-muted' : ''}`}>
      <div className="pm-queue-row-head">
        <i className="pm-queue-dot" style={{ background: tone }} aria-hidden />
        {item.code && <span className="pm-queue-code">{item.code}</span>}
        <button type="button" className="pm-queue-title" onClick={onOpen} title="打开记录">{item.title || item.id}</button>
        {item.absent && <span className="pm-queue-tag pm-queue-tag-absent">会话有结存 · 未跟进</span>}
        {item.muted && <span className="pm-queue-tag pm-queue-tag-muted">已静音</span>}
      </div>
      <div className="pm-queue-row-meta">
        {item.status && <span className="pm-queue-pill">{statusLabel(item.status)}</span>}
        {typeof item.lateDays === 'number' && item.lateDays > 0 && (
          <span className="pm-queue-badge pm-queue-badge-late">迟到 {item.lateDays} 天</span>
        )}
        {typeof item.overdueDays === 'number' && item.overdueDays > 0 && item.lateDays == null && (
          <span className="pm-queue-badge pm-queue-badge-overdue">逾期 {item.overdueDays} 天</span>
        )}
        {item.dueDate && <span className="pm-queue-due">应 {item.dueDate.slice(5)}</span>}
        {item.assignee && <span className="pm-queue-assignee">{item.assignee}</span>}
      </div>
      {item.reason && <div className="pm-queue-reason">{item.reason}</div>}
      <div className="pm-queue-row-actions">
        <button type="button" className="pm-queue-btn" onClick={onOpen}>打开</button>
        {canMute && (
          <button
            type="button"
            className="pm-queue-btn pm-queue-btn-mute"
            disabled={busy}
            onClick={onToggleMute}
            title={item.muted ? '取消静音（恢复主动投递，折叠视图仍可见）' : '静音（压主动投递，不隐藏打开视图，可撤销）'}
          >
            {busy ? '处理中…' : item.muted ? '取消静音' : '静音'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- 卡片组件 ---------- */

function QueueCard({ data, actions }: WidgetContext) {
  const raw = (data as Snapshot & { queue?: RawQueue }).queue
  const q = normalizeQueue(raw)
  const [expanded, setExpanded] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  // quietMode：top 不高亮，并入折叠列示（§2.2.7）。
  const top = q.quietMode ? null : q.top
  const rest = q.quietMode
    ? [...(q.top ? [q.top] : []), ...q.rest]
    : q.rest
  const all = [...(top ? [top] : []), ...rest]
  const lateCount = all.filter(i => typeof i.lateDays === 'number' && i.lateDays > 0).length
  const opened = formatOpenedAt(q.openedAt)

  const resolveOpen = (item: QueueItem) => {
    const projectId = item.projectId
      ?? data.tasks.find(t => t.id === item.id)?.projectId
      ?? ''
    actions.openRecord(projectId, item.recordType === 'risk' ? 'risk' : 'task', item.id)
  }

  const toggleMute = async (item: QueueItem) => {
    if (!actions.runCommand || busyId) return
    setBusyId(item.id)
    try {
      await actions.runCommand(item.muted ? `queue unmute ${item.id}` : `queue mute ${item.id}`)
      await actions.refreshBoard?.()
    } finally {
      setBusyId(null)
    }
  }

  const channelReady = typeof actions.runCommand === 'function'

  return (
    <div className="pm-bento-card pm-queue-card">
      <div className="pm-bento-label">
        补记队列
        <span className="pm-bento-m">
          {q.quietMode ? '静默时段' : opened ? `上次打开 ${opened}` : '打开时整理'}
        </span>
      </div>

      {q.quietMode && (
        <div className="pm-queue-quiet-banner">静默时段 · 仅折叠列示，不高亮打扰</div>
      )}

      {all.length === 0 ? (
        <div className="pm-queue-empty">
          <div className="pm-queue-empty-title">暂无到期未达条目</div>
          <div className="pm-queue-empty-sub">队列在打开时本地整理，不做常驻推送。</div>
        </div>
      ) : (
        <>
          <div className="pm-queue-summary">
            <span className="pm-queue-chip"><b>{all.length}</b>积压条目</span>
            <span className={`pm-queue-chip ${lateCount > 0 ? 'is-late' : ''}`}><b>{lateCount}</b>已迟到</span>
          </div>

          {top && (
            <QueueRow
              item={top}
              variant="top"
              busy={busyId === top.id}
              onOpen={() => resolveOpen(top)}
              onToggleMute={channelReady ? () => void toggleMute(top) : undefined}
            />
          )}

          {rest.length > 0 && (
            <div className="pm-queue-rest">
              {/* 折叠态：静音条目仍可见（mute 压主动投递，不隐藏打开视图）；非静音条目展开后列出。 */}
              {(expanded ? rest : rest.filter(i => i.muted)).map(item => (
                <QueueRow
                  key={item.id}
                  item={item}
                  variant="rest"
                  busy={busyId === item.id}
                  onOpen={() => resolveOpen(item)}
                  onToggleMute={channelReady ? () => void toggleMute(item) : undefined}
                />
              ))}
              <button
                type="button"
                className="pm-queue-toggle"
                aria-expanded={expanded}
                onClick={() => setExpanded(v => !v)}
              >
                {expanded ? `收起其余 ${rest.length} 项` : `展开全部 ${rest.length} 项`}
              </button>
            </div>
          )}
        </>
      )}

      <div className="pm-bento-foot">打开时呈现，不替代常驻通知；静音可撤销。</div>
    </div>
  )
}

export const queueCard: WidgetDescriptor = {
  type: 'queueCard',
  name: '补记队列',
  category: 'overview',
  addable: true,
  defaultW: 4, defaultH: 5, minW: 3, minH: 3,
  requiredSources: [],
  defaultConfig: {},
  render(ctx: WidgetContext) {
    return <QueueCard {...ctx} />
  },
}
