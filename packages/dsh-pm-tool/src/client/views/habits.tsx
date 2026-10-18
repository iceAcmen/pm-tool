/**
 * P3 X7 习惯层视图（只读呈现，零写、不下裁决）。
 *
 * 呈现口径（契约 docs/design/deep-integration-v2-p3-dev.md §二.5）：
 * - 习惯卡片：title、status 徽章（draft=草稿 / confirmed=已确认 / final=已定稿）；
 *   streak 仅纯文本档案「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」——
 *   无积分、无连胜动效、无徽章；longest/totalDays 为永久累计档案，断签不清零（后端口径）。
 * - 打卡记录：日期 + backfilled 标注「补记」；无打卡日期的空日如实留空，不自动补、不伪造。
 * - 可关联 OKR：okrId 只展示标题（由面板可选注入 okrs 清单解析；缺失时如实显示 ID），不参与裁决。
 * - 收件区入口：待确认建议数；confirm/ignore 走面板命令通道（同 okrs 视图模式），未确认不生效；
 *   snapshot 未携带收件区（pmHabitInbox）时仅显示命令提示，不伪造建议数据。
 * - 打卡入口走命令通道：今天打卡 / 回填昨天 / 回填前天（2 天补记窗），写操作均经人触发。
 *
 * 样式类名前缀 .pm-habit-* 定义在 panel.css（只追加区块，浅深双态 token 自适应）。
 */
import Inbox from 'lucide-react/dist/esm/icons/inbox.mjs'
import Repeat from 'lucide-react/dist/esm/icons/repeat.mjs'
import Link2 from 'lucide-react/dist/esm/icons/link-2.mjs'
import type { Run } from './types.js'

/** 与 core/storage.ts habitRecordSchema.checkIns 对齐的前端本地镜像（不 zod、不依赖存储层）。 */
export interface HabitCheckIn {
  at: string
  backfilled: boolean
  note?: string
}

/** 与 habitRecordSchema.streak 对齐；纯数字档案，前端不重算连续段。 */
export interface HabitStreak {
  current: number
  lastDate?: string
  longest: number
  totalDays: number
}

export interface HabitViewRecord {
  id: string
  projectId: string
  /** 可选关联 P2 OKR（同项目校验由后端完成；前端只展示）。 */
  okrId?: string
  title: string
  status: 'draft' | 'confirmed' | 'final'
  checkIns: HabitCheckIn[]
  streak: HabitStreak
  updatedAt?: string
}

/** 收件区建议（settings 键 pmHabitInbox，信封 { entries: [...] }；未确认不自动生效）。 */
export interface HabitInboxSuggestion {
  id: string
  at: string
  projectId: string
  title: string
  rationale?: string
  okrId?: string
  status: 'pending' | 'confirmed' | 'ignored'
}

/** 可选：面板注入的 OKR 最小清单，仅用于把 okrId 解析成标题；缺失时直接显示 ID。 */
export interface HabitOkrRef {
  id: string
  title: string
}

export interface HabitsViewProps {
  projectId: string
  /** 数据源 snapshot.habits；缺省为空数组。 */
  habits?: HabitViewRecord[]
  /** settings 收件区 pmHabitInbox；snapshot 未携带时为 undefined（只显示命令提示）。 */
  inbox?: HabitInboxSuggestion[]
  /** 可选 OKR 清单（标题解析用，只读）。 */
  okrs?: HabitOkrRef[]
  run?: Run
  onSaved?: () => void
}

/** 状态徽章文案：draft=草稿（建议/录入），confirmed=已确认（人轻确认），final=已定稿（人定稿）；前端不定稿。 */
function habitStatusLabel(status: HabitViewRecord['status']): string {
  if (status === 'final') return '已定稿'
  if (status === 'confirmed') return '已确认'
  return '草稿'
}

/** streak 纯文本档案：「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」，无徽章、无动效。 */
function streakArchiveText(streak: HabitStreak): string {
  return `当前连续 ${streak.current} 天 · 历史最长 ${streak.longest} 天 · 累计 ${streak.totalDays} 天`
}

/** 点击时刻取本地 YYYY-MM-DD（仅用于回填命令参数；不在渲染期读墙钟伪造数据）。 */
function localOffsetIso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function HabitsView({ projectId, habits = [], inbox, okrs, run, onSaved }: HabitsViewProps) {
  const mine = habits
    .filter(h => h.projectId === projectId)
    .slice()
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || a.id.localeCompare(b.id))

  const suggestions = inbox?.filter(s => s.projectId === projectId) ?? []
  const pending = suggestions.filter(s => s.status === 'pending').length

  const okrTitleById = new Map((okrs ?? []).map(o => [o.id, o.title]))

  const act = async (command: string) => {
    if (!run) return
    const ok = await run(command)
    if (ok) onSaved?.()
  }

  return (
    <div className="pm-habit-root">
      <header className="pm-habit-head">
        <h1>每日记录 · 习惯层</h1>
        <p className="pm-habit-sub">
          X7 习惯层（只读呈现）：建议轻确认、未确认不生效；streak 为纯文本档案（无积分、无连胜动效、无徽章）；
          打卡允许过去 2 天回填，补记如实标注，空日留空不补。
        </p>
      </header>

      {/* 习惯卡片：streak 文本档案 + 打卡记录 + 命令通道打卡入口。 */}
      <section className="pm-habit-list" aria-label="习惯记录">
        {mine.length === 0 ? (
          <div className="pm-habit-empty pm-card">
            <Repeat size={22}/>
            <h3>暂无习惯记录</h3>
            <p>
              由人录入（<code>/pm habit add {projectId} &lt;JSON&gt;</code>）或经收件区确认后在此呈现；
              前端不自动创建、不自动定稿。
            </p>
          </div>
        ) : (
          mine.map(h => {
            const checkIns = h.checkIns
              .slice()
              .sort((a, b) => b.at.localeCompare(a.at))
            const okrTitle = h.okrId ? okrTitleById.get(h.okrId) : undefined
            return (
              <div className="pm-habit-card pm-card" key={h.id} data-status={h.status}>
                <div className="pm-habit-card-top">
                  <h3 className="pm-habit-title">{h.title}</h3>
                  <span className={`pm-habit-status pm-habit-status--${h.status}`}>
                    {habitStatusLabel(h.status)}
                  </span>
                </div>
                <div className="pm-habit-meta">ID：{h.id}</div>

                {h.okrId && (
                  <div className="pm-habit-okr">
                    <Link2 size={11}/>
                    {okrTitle ? <>关联 OKR：{okrTitle}（{h.okrId} · 只展示）</> : <>关联 OKR：{h.okrId}（只展示）</>}
                  </div>
                )}

                {/* streak 纯文本档案：不套徽章、不加动效。 */}
                <p className="pm-habit-streak">{streakArchiveText(h.streak)}</p>

                <ul className="pm-habit-checkins">
                  {checkIns.length === 0 ? (
                    <li className="pm-habit-checkin pm-habit-checkin--empty">
                      暂无打卡记录；空日如实留空，不自动补记。
                    </li>
                  ) : (
                    checkIns.map(c => (
                      <li className="pm-habit-checkin" key={c.at}>
                        <span className="pm-habit-checkin-date">{c.at.slice(0, 10)}</span>
                        {c.backfilled && <span className="pm-habit-backfilled">补记</span>}
                        {c.note && <span className="pm-habit-checkin-note">{c.note}</span>}
                      </li>
                    ))
                  )}
                </ul>

                <div className="pm-habit-actions">
                  <button
                    type="button"
                    className="pm-habit-btn pm-habit-btn-primary"
                    disabled={!run}
                    onClick={() => void act(`habit checkin ${h.id}`)}
                  >今天打卡</button>
                  <button
                    type="button"
                    className="pm-habit-btn pm-habit-btn-ghost"
                    disabled={!run}
                    onClick={() => void act(`habit checkin ${h.id} ${localOffsetIso(1)}`)}
                  >回填昨天（2 天窗内）</button>
                  <button
                    type="button"
                    className="pm-habit-btn pm-habit-btn-ghost"
                    disabled={!run}
                    onClick={() => void act(`habit checkin ${h.id} ${localOffsetIso(2)}`)}
                  >回填前天（2 天窗内）</button>
                </div>
              </div>
            )
          })
        )}
      </section>

      {/* 收件区入口：待确认习惯建议；confirm/ignore 走命令通道，未确认不生效。 */}
      <section className="pm-habit-inbox pm-card" aria-label="待确认习惯建议">
        <header className="pm-habit-inbox-head">
          <Inbox size={15}/>
          <h2>待确认习惯建议</h2>
          <span className="pm-habit-inbox-count">{pending} 待确认</span>
        </header>

        {inbox === undefined ? (
          <p className="pm-habit-inbox-hint">
            快照未携带收件区数据；请在命令行查看：<code>/pm habit inbox {projectId}</code>。前端不伪造建议。
          </p>
        ) : suggestions.length === 0 ? (
          <p className="pm-habit-inbox-hint">
            暂无待处理建议。agent 代起草的习惯建议在此等待人确认，未确认不进入主档。
          </p>
        ) : (
          <ul className="pm-habit-suggestions">
            {suggestions.map(s => (
              <li className="pm-habit-suggestion" key={s.id} data-state={s.status}>
                <div className="pm-habit-suggestion-main">
                  <span className="pm-habit-suggestion-id">{s.id}</span>
                  <span className="pm-habit-suggestion-title">{s.title}</span>
                  <span className="pm-habit-suggestion-at">{s.at.slice(0, 16).replace('T', ' ')}</span>
                </div>
                {s.rationale && <p className="pm-habit-suggestion-rationale">{s.rationale}</p>}
                <div className="pm-habit-suggestion-actions">
                  {s.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="pm-habit-btn pm-habit-btn-primary"
                        disabled={!run}
                        onClick={() => void act(`habit confirm ${s.id}`)}
                      >采纳并建习惯草稿</button>
                      <button
                        type="button"
                        className="pm-habit-btn pm-habit-btn-ghost"
                        disabled={!run}
                        onClick={() => void act(`habit ignore ${s.id}`)}
                      >忽略</button>
                    </>
                  ) : s.status === 'confirmed' ? (
                    <span className="pm-habit-processed-tag">已采纳</span>
                  ) : (
                    <span className="pm-habit-processed-tag">已忽略</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
