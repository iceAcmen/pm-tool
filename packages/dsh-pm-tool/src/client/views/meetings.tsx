/**
 * 会议纪要（重设计 v2 · dsh 主题对齐版）。
 *
 * 布局：左列时间线会议列表（日期倒序，含状态 chip / 决议数 / 行动项数）
 * + 右列详情（会议信息 → 议程 → 讨论纪要 → 决议（绿描边卡，扁平无发光）
 * → 行动项（负责人/截止/状态，状态色与任务页一致））。
 *
 * 数据口径：全部由 props.meetings 派生，不写死示例数据。
 * 行动项逾期 = 有截止且早于今天，且状态未完成/未取消 → 截止标红。
 *
 * props 签名（DESIGN-SPEC §6）：{ meetings, onCreate, onEdit }。
 * 样式见 meetings.css，全部选择器 scope 在 .pm-mt-root 下。
 */
import { useMemo, useState } from 'react'
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs'
import Search from 'lucide-react/dist/esm/icons/search.mjs'
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock.mjs'
import css from './meetings.css?raw'
import { localTodayIso } from '../../core/derived.js'
import { MarkdownView } from '../shared/markdown-view.js'
import type { Meeting } from './types.js'

const MEETING_STATUS_LABEL: Record<Meeting['status'], string> = {
  draft: '草稿',
  final: '已定稿',
}
const ACTION_STATUS_LABEL = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
  cancelled: '已取消',
} as const

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const
function weekdayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? '' : WEEKDAYS[d.getDay()]
}

/** 行动项是否逾期：有截止且早于今天，且未完成/未取消。 */
function actionOverdue(a: Meeting['actions'][number], today: string): boolean {
  return !!a.dueDate && a.dueDate < today && a.status !== 'done' && a.status !== 'cancelled'
}

export function MeetingsView(props: {
  meetings: Meeting[]
  onCreate: () => void
  onEdit: (m: Meeting) => void
}) {
  const { meetings, onCreate, onEdit } = props
  const today = localTodayIso()

  const sorted = useMemo(() =>
    meetings.slice().sort((a, b) =>
      b.meetingDate.localeCompare(a.meetingDate, 'en') || b.id.localeCompare(a.id, 'en'),
    ), [meetings])

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 真过滤：搜索词 + 状态 segmented。selected 绑定 filtered 而非 sorted（S2-4/P0-3）：
  // 仅在当前过滤结果内有效；过滤为空时右侧不残留上一条详情。
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Meeting['status']>('all')
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase()
    return sorted.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (!q) return true
      const haystack = `${m.title} ${m.facilitator} ${m.recorder} ${m.participants.join(' ')} ${m.decisions.join(' ')}`.toLocaleLowerCase()
      return haystack.includes(q)
    })
  }, [sorted, query, statusFilter])

  const selected = filtered.find(m => m.id === selectedId) ?? filtered[0] ?? null

  const decisionsTotal = meetings.reduce((n, m) => n + m.decisions.length, 0)
  const actionsTotal = meetings.reduce((n, m) => n + m.actions.length, 0)
  const overdueActions = meetings.reduce((n, m) => n + m.actions.filter(a => actionOverdue(a, today)).length, 0)
  const finalCount = meetings.filter(m => m.status === 'final').length
  const draftCount = meetings.length - finalCount

  // ---------- 空态 ----------
  if (!meetings.length) {
    return (
      <div className="pm-mt-root">
        <style>{css}</style>
        <header className="mt-head">
          <div>
            <h1>会议纪要</h1>
            <p className="mt-sub">记录评审、例会与专项会议的决议与行动项，跟踪闭环。</p>
          </div>
        </header>
        <section className="mt-card mt-empty-card">
          <div className="mt-empty">
            <div className="mt-ico"><CalendarClock size={20}/></div>
            <h4>尚无会议纪要</h4>
            <p>项目还没有记录过会议。评审会、例会的结论与待办建议在这里留档，行动项可直接关联任务与风险。</p>
            <button type="button" className="mt-btn-primary" onClick={onCreate}>
              <Plus size={14}/> 新增会议
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="pm-mt-root">
      <style>{css}</style>

      <header className="mt-head">
        <div>
          <h1>会议纪要</h1>
          <p className="mt-sub">
            <b>{meetings.length} 场</b> · 已定稿 {finalCount} · 草稿 {draftCount}
          </p>
        </div>
      </header>

      <div className="mt-stats">
        <div className="mt-stat"><span className="lab">会议总数</span><div className="num">{meetings.length}<small>场</small></div><div className="sub">{sorted.length ? `${sorted[sorted.length - 1].meetingDate} ~ ${sorted[0].meetingDate}` : ''}</div></div>
        <div className="mt-stat"><span className="lab">累计决议</span><div className="num">{decisionsTotal}<small>条</small></div><div className="sub">来自已定稿会议</div></div>
        <div className="mt-stat"><span className="lab">行动项</span><div className="num">{actionsTotal}<small>项</small></div><div className="sub">含决议跟踪与待办闭环</div></div>
        <div className={overdueActions > 0 ? 'mt-stat urgent' : 'mt-stat'}><span className="lab">逾期行动</span><div className="num">{overdueActions}<small>项</small></div><div className="sub">{overdueActions ? '需立即跟进' : '无逾期行动'}</div></div>
      </div>

      <div className="mt-body">

        {/* 左：时间线列表（搜索 + 状态过滤） */}
        <div className="mt-list">
          <div className="mt-toolbar">
            <label className="mt-search">
              <Search size={13}/>
              <input
                type="text" placeholder="搜索记录" aria-label="搜索记录"
                value={query} onChange={event => setQuery(event.currentTarget.value)}
              />
            </label>
            <div className="mt-seg" role="group" aria-label="筛选会议状态">
              <button type="button" className={statusFilter === 'all' ? 'is-on' : ''} onClick={() => setStatusFilter('all')}>全部</button>
              <button type="button" className={statusFilter === 'final' ? 'is-on' : ''} onClick={() => setStatusFilter('final')}>已定稿</button>
              <button type="button" className={statusFilter === 'draft' ? 'is-on' : ''} onClick={() => setStatusFilter('draft')}>草稿</button>
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="mt-list-empty">没有匹配的会议记录</div>
          )}

          {filtered.map(m => (
            <button
              type="button" key={m.id}
              className={`mt-item pm-meeting-row pm-meeting-detail-btn${selected?.id === m.id ? ' sel' : ''}`}
              onClick={() => setSelectedId(m.id)}
            >
              <span className="mt-item-row1">
                <span className="mt-item-date">{m.meetingDate.slice(5)}</span>
                <span className="mt-item-wd">{weekdayOf(m.meetingDate)}</span>
                <span className="mt-item-sp"/>
                <span className={`mt-chip ${m.status}`}><i/>{MEETING_STATUS_LABEL[m.status]}</span>
              </span>
              <div className="mt-item-title">{m.title || m.id}</div>
              <div className="mt-item-meta">
                {m.facilitator ? <span>主持 {m.facilitator}</span> : null}
                <span>决议 {m.decisions.length}</span>
                <span>行动 {m.actions.length}</span>
              </div>
            </button>
          ))}
        </div>

        {/* 右：详情（过滤无匹配时显示空态，不残留上一条） */}
        {filtered.length === 0 ? (
          <section className="mt-detail mt-detail-empty">
            <div className="mt-empty">
              <div className="mt-ico"><Search size={20}/></div>
              <h4>无匹配的会议</h4>
              <p>当前搜索词或状态筛选没有匹配的会议。清除条件后即可恢复查看。</p>
            </div>
          </section>
        ) : selected && (
          <section className="mt-detail">
            <div className="mt-detail-head">
              <h2>{selected.title || selected.id}</h2>
              <span className={`mt-chip ${selected.status}`}><i/>{MEETING_STATUS_LABEL[selected.status]}</span>
              <span className="mt-item-sp"/>
              <button type="button" className="mt-ico-btn" aria-label="编辑会议" onClick={() => onEdit(selected)}>
                <Pencil size={14}/>
              </button>
            </div>

            {/* 会议信息 */}
            <div className="mt-info">
              <div className="mt-info-cell"><div className="mt-info-lab">日期</div><div className="mt-info-val">{selected.meetingDate} {weekdayOf(selected.meetingDate)}</div></div>
              <div className="mt-info-cell"><div className="mt-info-lab">时间 / 时长</div><div className="mt-info-val">{selected.startTime ? `${selected.startTime}` : '未记'}{selected.durationMinutes ? ` · ${selected.durationMinutes} 分钟` : ''}</div></div>
              <div className="mt-info-cell"><div className="mt-info-lab">地点</div><div className="mt-info-val">{selected.location || '未指定'}</div></div>
              <div className="mt-info-cell"><div className="mt-info-lab">主持人</div><div className="mt-info-val">{selected.facilitator || '未指定'}</div></div>
              <div className="mt-info-cell"><div className="mt-info-lab">记录人</div><div className="mt-info-val">{selected.recorder || '未指定'}</div></div>
              <div className="mt-info-cell"><div className="mt-info-lab">参会人</div><div className="mt-info-val">{selected.participants.length ? `${selected.participants.length} 人 · ${selected.participants.join('、')}` : '未记录'}</div></div>
              <div className="mt-info-cell"><div className="mt-info-lab">来源</div><div className="mt-info-val">{selected.sourceType === 'session' ? '会话纪要' : '手动记录'}</div></div>
              <div className="mt-info-cell"><div className="mt-info-lab">编号</div><div className="mt-info-val">{selected.id}</div></div>
            </div>

            {/* 议程 */}
            {selected.topics.length > 0 && (
              <div className="mt-sec">
                <div className="mt-sec-lab">议程 Topics</div>
                <div className="mt-topics">
                  {selected.topics.map((t, i) => (
                    <div className="mt-topic" key={i}><span className="no">{i + 1}</span>{t}</div>
                  ))}
                </div>
              </div>
            )}

            {/* 讨论纪要 */}
            {selected.summary && (
              <div className="mt-sec">
                <div className="mt-sec-lab">讨论纪要 Summary</div>
                <MarkdownView source={selected.summary} density="detail" className="mt-summary-md"/>
              </div>
            )}

            {/* 决议 */}
            {selected.decisions.length > 0 && (
              <div className="mt-sec">
                <div className="mt-sec-lab">决议 Decisions · {selected.decisions.length}</div>
                <div className="mt-decisions">
                  {selected.decisions.map((d, i) => (
                    <div className="mt-decision" key={i}><span className="no">{String(i + 1).padStart(2, '0')}</span><span>{d}</span></div>
                  ))}
                </div>
              </div>
            )}

            {/* 行动项 */}
            <div className="mt-sec">
              <div className="mt-sec-lab">行动项 Actions · {selected.actions.length}</div>
              {selected.actions.length === 0
                ? <p className="mt-summary">本场会议暂无行动项。</p>
                : (
                  <div className="mt-actions">
                    <div className="mt-act-row head"><span>行动项</span><span>负责人</span><span>截止</span><span>状态</span></div>
                    {selected.actions.map(a => {
                      const overdue = actionOverdue(a, today)
                      return (
                        <div className="mt-act-row" key={a.id}>
                          <span className="mt-act-title" title={a.title}>{a.title}</span>
                          <span className="mt-act-owner">
                            <span className="mt-ava">{a.owner ? a.owner.slice(0, 1) : '未'}</span>
                            {a.owner || '未指定'}
                          </span>
                          <span className={overdue ? 'mt-act-due overdue' : 'mt-act-due'}>
                            {a.dueDate
                              ? overdue
                                ? <><i className="mt-overdue-chip">逾期</i><span className="mt-due-date">{a.dueDate}</span></>
                                : <span className="mt-due-date">{a.dueDate}</span>
                              : <span className="mt-due-date">无截止</span>}
                          </span>
                          <span className={`mt-chip act-${a.status}`}><i/>{ACTION_STATUS_LABEL[a.status]}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>

          </section>
        )}
      </div>
    </div>
  )
}
