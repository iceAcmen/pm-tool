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
import { useState } from 'react'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.mjs'
import Inbox from 'lucide-react/dist/esm/icons/inbox.mjs'
import Link2 from 'lucide-react/dist/esm/icons/link-2.mjs'
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs'
import Plus from 'lucide-react/dist/esm/icons/plus.mjs'
import { MarkdownView } from '../shared/markdown-view.js'
import { EmptyState } from '../shared/ui/index.js'
import {
  habitStatusLabel,
  streakArchiveText,
  resolveHabitOkrTitle,
  countPendingHabitInbox,
  groupCheckInsByRecency,
  type HabitStreak,
  type HabitOkrRef,
} from './habit-model.js'
import type { Run } from './types.js'

/** 与 core/storage.ts habitRecordSchema.checkIns 对齐的前端本地镜像（不 zod、不依赖存储层）。 */
export interface HabitCheckIn {
  at: string
  backfilled: boolean
  note?: string
}

/** streak 类型复用纯模型 habit-model（纯数字档案，前端不重算连续段）。 */
export type { HabitStreak }

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
  /** 兼容补充字段（snapshot 全量下发；旧记录缺键时 undefined，编辑表单留空合法）。 */
  goal?: string
  frequency?: string
  notes?: string
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

/** OKR 最小清单类型复用纯模型（标题解析用，只读）。 */
export type { HabitOkrRef }

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
  /** 打开新建习惯抽屉。 */
  onCreate?: () => void
  /** 打开编辑抽屉（record 为快照全量记录，goal/frequency/notes 兼容位一并回显）。 */
  onEdit?: (record: HabitViewRecord) => void
}

/** 点击时刻取本地 YYYY-MM-DD（仅用于回填命令参数；不在渲染期读墙钟伪造数据）。 */
function localOffsetIso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function HabitsView({ projectId, habits = [], inbox, okrs, run, onSaved, onCreate, onEdit }: HabitsViewProps) {
  const mine = habits
    .filter(h => h.projectId === projectId)
    .slice()
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || a.id.localeCompare(b.id))

  const suggestions = inbox?.filter(s => s.projectId === projectId) ?? []
  const pending = countPendingHabitInbox(inbox, projectId)

  // D-13 长日志：更早月份默认折叠，按「习惯 ID → 展开月份 key 集」本地记忆，零写。
  const [openMonths, setOpenMonths] = useState<Record<string, Set<string>>>({})
  const toggleMonth = (habitId: string, monthKey: string) => {
    setOpenMonths(prev => {
      const next = new Set(prev[habitId] ?? [])
      if (next.has(monthKey)) next.delete(monthKey)
      else next.add(monthKey)
      return { ...prev, [habitId]: next }
    })
  }

  const act = async (command: string) => {
    if (!run) return
    const ok = await run(command)
    if (ok) onSaved?.()
  }

  return (
    <div className="pm-habit-root">
      {/* §1 页头由外层 PageShell bare 壳提供统一 padding，视图只出标题/副题/CTA，不自加左右 padding。 */}
      <header className="pm-habit-head">
        <div className="pm-habit-head-text">
          <h1>每日记录 · 习惯层</h1>
          <p className="pm-habit-sub">
            X7 习惯层：建议轻确认、未确认不生效；streak 为纯文本档案（无积分、无连胜动效、无徽章）；
            打卡允许过去 2 天回填，补记如实标注，空日留空不补。
          </p>
        </div>
        {onCreate && (
          <button type="button" className="pm-habit-btn pm-habit-btn-primary" onClick={onCreate}>
            <Plus size={14}/>新建习惯
          </button>
        )}
      </header>
      {/* 习惯卡片：streak 文本档案 + 打卡记录 + 命令通道打卡入口。 */}
      <section className="pm-habit-list" aria-label="习惯记录">
        {mine.length === 0 ? (
          /* 真空态复用 S0 EmptyState；新建入口只留在页头，避免双 CTA / 重复文案。 */
          <EmptyState
            variant="vacuum"
            title="暂无习惯记录"
            description="由人录入或经收件区确认后在此呈现；前端不自动创建、不自动定稿。"
          />
        ) : (
          mine.map(h => {
            // D-13：近期 14 天平铺，更早按月折叠；同日旧重复仅展示去重，不删历史记录。
            const { recent, months } = groupCheckInsByRecency(h.checkIns, localOffsetIso(0))
            const okrTitle = resolveHabitOkrTitle(h.okrId, okrs)
            return (
              <div className="pm-habit-card pm-card" key={h.id} data-status={h.status}>
                <div className="pm-habit-card-top">
                  <h3 className="pm-habit-title">{h.title}</h3>
                  <span className={`pm-habit-status pm-habit-status--${h.status}`}>
                    {habitStatusLabel(h.status)}
                  </span>
                  {onEdit && (
                    <button type="button" className="pm-habit-btn pm-habit-btn-ghost" aria-label="编辑此习惯" onClick={() => onEdit(h)}>
                      <Pencil size={12}/>编辑
                    </button>
                  )}
                </div>
                {/* goal / frequency / notes 为 update 兼容字段，回显不留空（缺键 undefined 时整行省略）。 */}
                {h.frequency?.trim() && <div className="pm-habit-field"><span className="pm-habit-field-lab">频率</span>{h.frequency}</div>}
                {h.goal?.trim() && <div className="pm-habit-field"><span className="pm-habit-field-lab">目标</span>{h.goal}</div>}
                {h.okrId && okrTitle && (
                  <div className="pm-habit-okr">
                    <Link2 size={11}/>
                    关联 OKR：{okrTitle}（只展示，不参与裁决）
                  </div>
                )}
                {h.notes?.trim() && <MarkdownView source={h.notes} density="compact" className="pm-habit-notes"/>}

                {/* streak 纯文本档案：不套徽章、不加动效。 */}
                <p className="pm-habit-streak">{streakArchiveText(h.streak)}</p>

                <ul className="pm-habit-checkins">
                  {recent.length === 0 && months.length === 0 ? (
                    <li className="pm-habit-checkin pm-habit-checkin--empty">
                      暂无打卡记录；空日如实留空，不自动补记。
                    </li>
                  ) : (
                    <>
                      {recent.map(c => (
                        <li className="pm-habit-checkin" key={c.at}>
                          <span className="pm-habit-checkin-date">{c.at.slice(0, 10)}</span>
                          {c.backfilled && <span className="pm-habit-backfilled">补记</span>}
                          {c.note && <span className="pm-habit-checkin-note">{c.note}</span>}
                        </li>
                      ))}
                      {months.map(m => {
                        const open = openMonths[h.id]?.has(m.key) ?? false
                        return (
                          <li className="pm-habit-checkin" key={m.key}>
                            <button
                              type="button"
                              className="pm-habit-btn pm-habit-btn-ghost"
                              aria-expanded={open}
                              aria-controls={`${h.id}-${m.key}`}
                              onClick={() => toggleMonth(h.id, m.key)}
                            >
                              {open ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                              {m.label}（{m.entries.length} 条 · {open ? '收起' : '展开'}）
                            </button>
                            {open && (
                              <ul className="pm-habit-checkins" id={`${h.id}-${m.key}`}>
                                {m.entries.map(c => (
                                  <li className="pm-habit-checkin" key={c.at}>
                                    <span className="pm-habit-checkin-date">{c.at.slice(0, 10)}</span>
                                    {c.backfilled && <span className="pm-habit-backfilled">补记</span>}
                                    {c.note && <span className="pm-habit-checkin-note">{c.note}</span>}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        )
                      })}
                    </>
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
