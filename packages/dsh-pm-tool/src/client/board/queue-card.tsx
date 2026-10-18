/**
 * P1-D · K11 补记队列卡（总览看板呈现层）。
 *
 * 数据源：web snapshot 的 `queue` 字段。后端按项目产出
 * `Record<projectId, { top, rest, quietMode, openedAt }>`（读时派生、零写）；
 * 本卡跨项目合并聚合，条目标注所属项目，打开直达真实任务。
 *
 * 呈现口径（§2.2 / §2.3）：
 *  - 首屏 Top1 醒目卡（标题/状态/截止/迟到 N 天徽标），其余 rest 折叠、可展开；
 *  - lateDays>0 标「迟到 N 天」；muted 条目在折叠区仍可见并标「已静音」（mute 压主动投递，不隐藏打开视图）；
 *  - quietMode 时段静默：不高亮 Top1，全部条目仅折叠列示；
 *  - 缺 queue 字段（missing）/格式异常（malformed）显示中性提示，绝不拿「暂无条目」假空态冒充；
 *    有效但无条目（ready 空）才显示诚实空态。
 *
 * 写操作：mute/unmute 走 WidgetActions.runCommand 命令通道（`queue mute|unmute <任务ID>`），
 * 成功后 refreshBoard 刷新快照；通道未接入时按钮禁用，不做僵尸点击。
 * 能力边界：打开时呈现 ≠ 常驻推送（H6 悬置，本期不实现）。
 */
import { useState } from 'react'
import type { Snapshot } from '../panel.js'
import { taskStatusLabels } from '../../core/labels.js'
import type { WidgetDescriptor, WidgetContext } from './types.js'
import { aggregateQueue, type QueueViewItem } from './queue-aggregate.js'

function statusLabel(s?: string): string {
  if (!s) return ''
  return taskStatusLabels[s] ?? s
}

/** 条目语义色：阻塞 > 迟到 > 逾期 > 临期/进行。 */
function itemTone(item: QueueViewItem): string {
  if (item.status === 'blocked') return 'var(--pm-st-blocked)'
  if (item.lateDays > 0) return 'var(--pm-st-overdue)'
  if (item.status === 'in_progress') return 'var(--pm-st-progress)'
  return 'var(--pm-st-due)'
}

/* ---------- 条目行（Top1 醒目块与折叠列表共用） ---------- */

function QueueRow({ item, variant, busy, onOpen, onToggleMute }: {
  item: QueueViewItem
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
        <button type="button" className="pm-queue-title" onClick={onOpen} title="打开任务">{item.title || item.taskId}</button>
        {item.projectName && <span className="pm-queue-code">{item.projectName}</span>}
        {item.absent && <span className="pm-queue-tag pm-queue-tag-absent">会话有结存 · 未跟进</span>}
        {item.muted && <span className="pm-queue-tag pm-queue-tag-muted">已静音</span>}
      </div>
      <div className="pm-queue-row-meta">
        {item.status && <span className="pm-queue-pill">{statusLabel(item.status)}</span>}
        {item.lateDays > 0 && (
          <span className="pm-queue-badge pm-queue-badge-late">迟到 {item.lateDays} 天</span>
        )}
        {item.dueDate && <span className="pm-queue-due">应 {item.dueDate.slice(5)}</span>}
      </div>
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
  const rawQueue = (data as Snapshot & { queue?: unknown }).queue
  const projectNames = new Map(data.projects.map(p => [p.id, p.name]))
  const agg = aggregateQueue(rawQueue, projectNames)

  const [expanded, setExpanded] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  // quietMode：top 不高亮，并入折叠列示（§2.2.7）。
  const top = agg.quietMode ? null : agg.top
  const rest = agg.quietMode ? [...(agg.top ? [agg.top] : []), ...agg.rest] : agg.rest
  const all = [...(top ? [top] : []), ...rest]
  const lateCount = all.filter(i => i.lateDays > 0).length

  const resolveOpen = (item: QueueViewItem) => {
    // 优先用条目自带 projectId；缺失时回落到 tasks 表反查，保证直达真实任务。
    const projectId = item.projectId
      ?? data.tasks.find(t => t.id === item.taskId)?.projectId
      ?? ''
    actions.openRecord(projectId, 'task', item.taskId)
  }

  const toggleMute = async (item: QueueViewItem) => {
    if (!actions.runCommand || busyId) return
    setBusyId(item.taskId)
    try {
      await actions.runCommand(item.muted ? `queue unmute ${item.taskId}` : `queue mute ${item.taskId}`)
      await actions.refreshBoard?.()
    } finally {
      setBusyId(null)
    }
  }

  const channelReady = typeof actions.runCommand === 'function'

  // missing：快照未提供 queue 字段（后端旧版/未接入）——中性提示，不冒充空态。
  if (agg.state === 'missing') {
    return (
      <div className="pm-bento-card pm-queue-card">
        <div className="pm-bento-label">补记队列</div>
        <div className="pm-queue-empty">
          <div className="pm-queue-empty-sub">当前快照未提供补记队列数据（无 queue 字段）。</div>
        </div>
        <div className="pm-bento-foot">打开时呈现，不替代常驻通知。</div>
      </div>
    )
  }

  // malformed：有 queue 字段但形状异常——中性提示，跳过，不显示假空态。
  if (agg.state === 'malformed') {
    return (
      <div className="pm-bento-card pm-queue-card">
        <div className="pm-bento-label">补记队列</div>
        <div className="pm-queue-empty">
          <div className="pm-queue-empty-sub">补记队列数据格式异常，已跳过展示。</div>
        </div>
        <div className="pm-bento-foot">打开时呈现，不替代常驻通知。</div>
      </div>
    )
  }

  return (
    <div className="pm-bento-card pm-queue-card">
      <div className="pm-bento-label">
        补记队列
        <span className="pm-bento-m">
          {agg.quietMode ? '静默时段' : '打开时整理'}
        </span>
      </div>

      {agg.quietMode && (
        <div className="pm-queue-quiet-banner">静默时段 · 仅折叠列示，不高亮打扰</div>
      )}

      {agg.partial && (
        <div className="pm-queue-quiet-banner">部分队列/条目格式异常，无效部分已跳过。</div>
      )}

      {all.length === 0 ? (
        <div className="pm-queue-empty">
          {agg.partial ? (
            <>
              <div className="pm-queue-empty-title">有效数据中暂无条目</div>
              <div className="pm-queue-empty-sub">仍有部分异常未能读取，无效部分已跳过。</div>
            </>
          ) : (
            <>
              <div className="pm-queue-empty-title">暂无到期未达条目</div>
              <div className="pm-queue-empty-sub">队列在打开时本地整理，不做常驻推送。</div>
            </>
          )}
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
              busy={busyId === top.taskId}
              onOpen={() => resolveOpen(top)}
              onToggleMute={channelReady ? () => void toggleMute(top) : undefined}
            />
          )}

          {rest.length > 0 && (
            <div className="pm-queue-rest">
              {/* 折叠态：静音条目仍可见（mute 压主动投递，不隐藏打开视图）；非静音条目展开后列出。 */}
              {(expanded ? rest : rest.filter(i => i.muted)).map(item => (
                <QueueRow
                  key={item.taskId}
                  item={item}
                  variant="rest"
                  busy={busyId === item.taskId}
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
