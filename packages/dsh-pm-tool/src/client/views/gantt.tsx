/**
 * 甘特排期视图（重设计 v2 落地，配色方案 B）。
 * 只读派生：依赖线 / 父条范围 / 进度填充全部由既有字段渲染，绝不回写；
 * 拖拽改期落库白名单仅 startDate/dueDate（走既有 task update 通道）。
 *
 * 与 panel.tsx 旧 GanttView 并存：本文件自包含样式（gantt.css?raw 内联），
 * 全部选择器 scope 在 .pm-gantt-root 下，不污染旧实现。
 */
import { useEffect, useRef, useState } from 'react'
import type { Task, Milestone, Run, View } from './types.js'
import css from './gantt.css?raw'
import { localTodayIso } from '../../core/derived.js'
import {
  dateRange, todayOffset, daysFrom, shiftDatesByDrag, progressFill,
  barLabelPolicy, shortDate, dependencyEdges, parentBarRange, milestoneOffset,
  taskDurationDays, routeEdge,
} from '../../core/gantt.js'
import { deriveProgressMap, checklistFraction, type TaskProgress } from '../../core/progress-derivation.js'
import { sampleGanttTicks } from '../../core/ui-feedback.js'

const ROW_H = 28
const BAR_H = 16

/** 空清单信号占位（与 core 口径一致：value=null=证据不足，不画实心、不显百分比）。 */
const emptyProgress: TaskProgress = {
  value: null, source: 'none', checklist: null,
  coverage: { coveredLeaves: 0, totalLeaves: 0 },
  pendingAcceptance: false, pendingAcceptanceCount: 0,
  legacyProgress: null, warnings: [],
}

export function GanttView(props: {
  tasks: Task[]
  milestones: Milestone[]
  run: Run
  onEdit: (task: Task) => void
  onCreate: () => void
  disabled?: boolean
  onGotoView: (v: View) => void
}) {
  const { tasks, milestones, run, onEdit, onCreate, disabled } = props
  const axis = dateRange([...tasks, ...milestones])
  const today = localTodayIso() // 本地日期，避免 UTC 偏移把今天画到昨天
  // aria-live 状态行：成功『已更新：起 ~ 止』数秒自清除；失败『更新失败，请重试』。
  const [statusMsg, setStatusMsg] = useState('')
  // inflight：保存中同任务/甘特拖拽禁用，防并发连拖覆盖；结束后解锁。
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<{ id: string, shiftDays: number } | null>(null)
  const [gran, setGran] = useState<'day' | 'week' | 'month'>('day')
  const [showDeps, setShowDeps] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<{ id: string, startX: number } | null>(null)
  const draggedRef = useRef(false)
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // unmount 清定时器：快速连续拖/切视图不得有陈旧定时器回写旧状态。
  useEffect(() => () => {
    if (statusTimer.current) clearTimeout(statusTimer.current)
  }, [])
  const showStatus = (text: string, ttlMs = 3000) => {
    setStatusMsg(text)
    if (statusTimer.current) clearTimeout(statusTimer.current)
    statusTimer.current = setTimeout(() => {
      setStatusMsg('')
      statusTimer.current = null
    }, ttlMs)
  }

  if (!axis) return <p className="pm-cell-empty pm-gantt">暂无带起止日期的任务/里程碑，无法绘制时间轴。</p>
  const PX = gran === 'day' ? 16 : gran === 'week' ? 11 : 7 // 每天像素（粒度切换：日/周/月）
  const axisDays = Math.max(1, daysFrom(axis.end, axis.start) + 1)
  const ticks = sampleGanttTicks(axis.start, axis.end, PX)
  const todayOff = todayOffset(axis.start, today)
  const progressMap = deriveProgressMap(tasks)

  // ---- 月份带：按 axis 内月份切分 ----
  const monthBands: { label: string, leftDays: number, widthDays: number }[] = []
  {
    const startT = Date.parse(axis.start)
    let cur = new Date(startT)
    while (Date.parse(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-01`) <= Date.parse(axis.end)) {
      const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1)
      const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      const s = daysFrom(mStart.toISOString().slice(0, 10), axis.start)
      const e = daysFrom(mEnd.toISOString().slice(0, 10), axis.start)
      monthBands.push({ label: `${cur.getMonth() + 1}月`, leftDays: s, widthDays: Math.max(1, e - s + 1) })
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
  }

  // ---- 周末背景：按 axis 内每日星期推 ----
  const weekends: { leftDays: number }[] = []
  for (let d = 0; d < axisDays; d++) {
    const dow = new Date(Date.parse(axis.start) + d * 86400000).getDay()
    if (dow === 0 || dow === 6) weekends.push({ leftDays: d })
  }

  // ---- 只读派生结构（不写库） ----
  const byId = new Map(tasks.map(t => [t.id, t]))
  const childrenOf = new Map<string, Task[]>()
  for (const t of tasks) {
    if (t.parentId) {
      const arr = childrenOf.get(t.parentId) ?? []
      arr.push(t)
      childrenOf.set(t.parentId, arr)
    }
  }
  const edges = dependencyEdges(tasks, axis.start, PX, { rowHeight: ROW_H })

  const onPointerDownBar = (e: React.PointerEvent, task: Task) => {
    if (saving || disabled) return // 保存中/禁用态禁拖：防并发连拖同一任务覆盖
    draggedRef.current = false
    barRef.current = { id: task.id, startX: e.clientX }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMoveBar = (e: React.PointerEvent) => {
    const cur = barRef.current
    if (!cur) return
    const shiftDays = Math.round((e.clientX - cur.startX) / PX)
    setPreview(Math.abs(e.clientX - cur.startX) < 4 ? null : { id: cur.id, shiftDays })
  }
  const onPointerUpBar = async (e: React.PointerEvent, task: Task) => {
    const startX = barRef.current?.startX
    barRef.current = null
    setPreview(null) // 立即清 ghost 预览：失败时条体保持原坐标，无残影
    if (startX === undefined || !task.startDate || !task.dueDate) return
    const deltaPx = e.clientX - startX
    if (Math.abs(deltaPx) < 4) return
    draggedRef.current = true
    // 白名单 payload：只含 startDate/dueDate，不碰 progress/predecessorIds/status
    const next = shiftDatesByDrag(task.startDate, task.dueDate, deltaPx, PX)
    setSaving(true)
    let ok = false
    try {
      ok = await run(`task update ${task.id} ${JSON.stringify(next)}`, { quiet: true })
    } finally {
      setSaving(false) // 无论成败都解锁，finally 防漏
    }
    if (ok) {
      showStatus(`已更新：${next.startDate} ~ ${next.dueDate}`)
    } else {
      showStatus('更新失败，请重试', 6000)
    }
  }
  const openBar = (task: Task) => {
    // 拖拽改期后不触发打开抽屉，避免误开。
    if (draggedRef.current) { draggedRef.current = false; return }
    onEdit(task)
  }
  const onKeyDownBar = (e: React.KeyboardEvent, task: Task) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      draggedRef.current = false
      onEdit(task)
    }
  }
  const locateToday = () => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: Math.max(0, todayOff * PX - el.clientWidth / 2), behavior: 'smooth' })
  }

  // 父任务日期口径统一：左标签 / 画布条 / ARIA 同走 effectiveRange（父=子 min~max 只读派生）。
  const effectiveRange = (t: Task): { start: string, end: string, derived: boolean } | null => {
    const kids = childrenOf.get(t.id)
    const derived = kids && kids.length > 0 ? parentBarRange(kids) : null
    if (derived) return { start: derived.start, end: derived.end, derived: true }
    if (t.startDate && t.dueDate) return { start: t.startDate, end: t.dueDate, derived: false }
    return null
  }

  // 每条任务的画布几何（依赖路由重叠绕行需要 B 条右缘）。
  const geomOf = new Map<string, { leftX: number, rightX: number }>()
  for (const t of tasks) {
    const range = effectiveRange(t)
    if (!range) continue
    const leftDays = daysFrom(range.start, axis.start)
    const widthDays = taskDurationDays(range.start, range.end)
    geomOf.set(t.id, { leftX: leftDays * PX, rightX: (leftDays + widthDays) * PX })
  }

  // ---- 依赖路由：紧贴 L / 正常 L / 重叠绕行；同一前置的多条边错峰不叠线 ----
  const edgeRoutes: { key: string, d: string, title: string }[] = []
  {
    const outCount = new Map<string, number>()
    for (const e of edges.edges) {
      const n = outCount.get(e.fromId) ?? 0
      outCount.set(e.fromId, n + 1)
      const r = routeEdge({ ...e, bRight: geomOf.get(e.toId)?.rightX }, { lane: n })
      edgeRoutes.push({
        key: `${e.fromId}-${e.toId}-${n}`,
        d: r.d,
        title: `前置 ${byId.get(e.fromId)?.title ?? e.fromId} → ${byId.get(e.toId)?.title ?? e.toId}`,
      })
    }
  }

  const renderBar = (t: Task, range: { start: string, end: string, derived: boolean }) => {
    const done = t.status === 'done'
    // v0.8 客观进度：null=证据不足（不画实心、显 —），0=0% 填充
    const fill = range.derived
      ? null
      : progressFill(progressMap.get(t.id) ?? emptyProgress)
    const pct = fill === null ? '—' : `${Math.round(fill * 100)}%`
    const leftDays = daysFrom(range.start, axis.start)
    const widthDays = taskDurationDays(range.start, range.end)
    const policy = barLabelPolicy(widthDays, PX)
    const overdue = !done && !range.derived && t.dueDate && t.dueDate < today
    const blocked = !done && t.status === 'blocked'
    const preNames = (t.predecessorIds ?? [])
      .map(pid => byId.get(pid)?.title).filter(Boolean).join('、')
    const aria = `任务 ${t.title}：${range.start} ~ ${range.end}，工期 ${widthDays} 天，进度 ${pct}${preNames ? `，前置：${preNames}` : ''}。按回车打开详情。`
    const ghost = preview && preview.id === t.id
      ? shiftDatesByDrag(range.start, range.end, preview.shiftDays * PX, PX)
      : null
    const stCls = range.derived ? 'st-parent' : done ? 'st-done' : t.status === 'in_progress' ? 'st-prog' : 'st-todo'
    const cls = [
      'pm-gantt-bar',
      stCls,
      range.derived ? 'pm-gantt-bar--parent' : '',
      overdue ? 'is-overdue' : '',
      blocked ? 'is-blocked' : '',
    ].filter(Boolean).join(' ')
    return <div
      className={cls}
      data-task-id={t.id}
      tabIndex={0}
      role="button"
      aria-label={aria}
      style={{ left: `${leftDays * PX}px`, width: `${widthDays * PX}px`, top: `${(ROW_H - BAR_H) / 2}px` }}
      title={`${t.title}（${range.start} ~ ${range.end}）· 进度 ${pct}${t.assignee ? ` · 负责人 ${t.assignee}` : ''}${preNames ? ` · 前置 ${preNames}` : ''}`}
      onClick={() => openBar(t)}
      onKeyDown={(e) => onKeyDownBar(e, t)}
      onPointerDown={(e) => { if (!range.derived) onPointerDownBar(e, t) }}
      onPointerMove={(e) => { if (!range.derived) onPointerMoveBar(e) }}
      onPointerUp={(e) => { if (!range.derived) void onPointerUpBar(e, t) }}
    >
      {fill !== null && !range.derived && <div className="pm-gantt-bar-progress" style={{ width: `${Math.round(fill * 100)}%` }} />}
      {(policy === 'inside') && <>
        <span className="pm-gantt-bar-dates">{shortDate(range.start)} ~ {shortDate(range.end)}</span>
        <span className="pm-gantt-bar-pct">{pct}</span>
      </>}
      {ghost && <span className="pm-gantt-ghost">{ghost.startDate} ~ {ghost.dueDate}</span>}
      {policy === 'outside' && (
        <span className="pm-gantt-bar-side" style={{ left: `${widthDays * PX + 4}px` }}>
          {shortDate(range.start)} ~ {shortDate(range.end)} · {pct}
        </span>
      )}
    </div>
  }

  const totalRows = tasks.length + 1 + milestones.length
  const msPill = (s: string) => s === 'achieved'
    ? <span className="pm-ms-pill pm-ms-pill-ok">已达成</span>
    : s === 'at_risk' ? <span className="pm-ms-pill pm-ms-pill-warn">有风险</span>
      : <span className="pm-ms-pill pm-ms-pill-idle">计划中</span>

  return <div className="pm-gantt-root">
    <style>{css}</style>
    <div className="pm-gantt-toolbar">
      <div className="pm-gantt-title">甘特图</div>
      <div className="pm-gantt-sub">{axis.start} → {axis.end} · {tasks.length} 任务 · {milestones.length} 里程碑</div>
      <div className="pm-gantt-spacer" />
      <div className="pm-seg">
        {(['day', 'week', 'month'] as const).map(g => (
          <button key={g} className={gran === g ? 'on' : ''} onClick={() => setGran(g)}>{g === 'day' ? '日' : g === 'week' ? '周' : '月'}</button>
        ))}
      </div>
      <label className="pm-switch"><input type="checkbox" checked={showDeps} onChange={e => setShowDeps(e.target.checked)} /><span>依赖线</span></label>
      <button className="pm-chip" onClick={locateToday}>◉ 定位到今天</button>
      <button className="pm-chip pm-chip-primary" onClick={onCreate}>＋ 新建任务</button>
    </div>

    <div className="pm-gantt">
      <div className="pm-gantt-labels">
        <div className="pm-gantt-corner">任务 / WBS</div>
        {tasks.map(t => {
          const depth = (t.code || '1').split('.').length - 1
          const er = effectiveRange(t)
          const tprog = progressMap.get(t.id)
          const frac = checklistFraction(tprog ?? emptyProgress)
          const done = t.status === 'done'
          return (
            <div key={t.id} className={`pm-gantt-label-row ${done ? 'is-done' : ''} ${t.parentId ? '' : 'is-parent'}`}
              style={{ height: `${ROW_H}px`, paddingLeft: `${10 + depth * 12}px` }}>
              <span className="pm-gantt-label-code">{t.code}</span>
              <span className="pm-gantt-label-title">{t.title}</span>
              {frac && <span className="pm-gantt-label-frac">{frac}</span>}
              {!er && <span className="pm-gantt-unscheduled">未排期</span>}
            </div>
          )
        })}
        <div className="pm-gantt-ms-band" style={{ height: `${ROW_H}px`, lineHeight: `${ROW_H}px` }}>里程碑</div>
        {milestones.map(m => (
          <div key={`m-${m.id}`} className="pm-gantt-label-row" style={{ height: `${ROW_H}px` }}>
            <span className={`pm-ms-dot ${m.status === 'achieved' ? 'ok' : m.status === 'at_risk' ? 'warn' : ''}`}>◆</span>
            <span className="pm-gantt-label-title">{m.title}</span>
            {msPill(m.status)}
          </div>
        ))}
      </div>
      <div className="pm-gantt-scroll" ref={scrollRef}>
        <div className="pm-gantt-canvas" style={{ width: `${axisDays * PX}px` }}>
          <div className="pm-gantt-axis">
            {monthBands.map((mb, i) => (
              <span key={i} className="pm-gantt-month"
                style={{ left: `${mb.leftDays * PX}px`, width: `${mb.widthDays * PX}px` }}>{mb.label}</span>
            ))}
            {ticks.map(tk => (
              <span key={tk.date} className="pm-gantt-tick" style={{ left: `${tk.leftDays * PX}px` }}>{tk.label}</span>
            ))}
          </div>
          <div className="pm-gantt-plot">
            {weekends.map((w, i) => (
              <div key={i} className="pm-gantt-weekend" style={{ left: `${w.leftDays * PX}px`, width: `${PX}px` }} />
            ))}
            <div className="pm-gantt-rows" style={{ height: `${totalRows * ROW_H}px` }}>
              {tasks.map(t => {
                const range = effectiveRange(t)
                if (!range) return (
                  <div key={t.id} className="pm-gantt-row pm-gantt-row--unscheduled"
                    style={{ height: `${ROW_H}px` }}
                    title="未排期任务，点击打开设置起止日期" onClick={() => onEdit(t)} />
                )
                return <div key={t.id} className="pm-gantt-row" style={{ height: `${ROW_H}px` }}>
                  {renderBar(t, range)}
                </div>
              })}
              <div className="pm-gantt-row" style={{ height: `${ROW_H}px` }} />
              {milestones.map(m => {
                const off = milestoneOffset(m, axis.start)
                if (off === null) return <div key={`m-${m.id}`} className="pm-gantt-row" style={{ height: `${ROW_H}px` }} />
                return (
                  <div key={`m-${m.id}`} className="pm-gantt-row" style={{ height: `${ROW_H}px` }}>
                    <div className={`pm-gantt-milestone ${m.status === 'achieved' ? 'pm-gantt-milestone-done' : m.status === 'at_risk' ? 'pm-gantt-milestone-risk' : ''}`}
                      data-milestone-id={m.id} style={{ left: `${off * PX + PX / 2}px` }} />
                  </div>
                )
              })}
            </div>
            {todayOff >= 0 && todayOff <= axisDays && <>
              <div className="pm-gantt-today" style={{ left: `${todayOff * PX + PX / 2}px` }} />
              <span className="pm-gantt-today-tag" style={{ left: `${todayOff * PX + PX / 2 + 4}px` }}>今天</span>
            </>}
            {showDeps && edgeRoutes.length > 0 && (
              <svg className="pm-gantt-links" width={axisDays * PX} height={totalRows * ROW_H} aria-label="任务间前置依赖连线">
                <defs>
                  <marker id="pm-gantt-link-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path className="pm-gantt-link-arrow" d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                </defs>
                {edgeRoutes.map(r => (
                  <g key={r.key}>
                    <title>{r.title}</title>
                    <path d={r.d} className="pm-gantt-link-path" markerEnd="url(#pm-gantt-link-arrow)" />
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
    {statusMsg && <p className="pm-gantt-hint" role="status" aria-live="polite">{statusMsg}</p>}
  </div>
}
