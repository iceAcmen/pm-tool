/**
 * 甘特排期视图（重设计 v2 落地，配色方案 B）。
 * 只读派生：依赖线 / 父条范围 / 进度填充全部由既有字段渲染，绝不回写；
 * 拖拽改期落库白名单仅 startDate/dueDate（走既有 task update 通道）。
 *
 * 本文件自包含样式（gantt.css?raw 内联），全部选择器 scope 在 .pm-gantt-root 下。
 */
import { useEffect, useRef, useState } from 'react'
import type { Task, Milestone, Run, View } from './types.js'
import css from './gantt.css?raw'
import { localTodayIso, isTaskOverdue } from '../../core/derived.js'
import {
  dateRange, todayOffset, daysFrom, shiftDatesByDrag, progressFill,
  barLabelPolicy, shortDate, dependencyEdges, parentBarRange, milestoneOffset,
  taskDurationDays, routeEdge, criticalPath,
} from '../../core/gantt.js'
import { deriveProgressMap, checklistFraction, type TaskProgress } from '../../core/progress-derivation.js'
import { sampleGanttTicks } from '../../core/ui-feedback.js'

// 行高对齐设计基线（pl-g-row min-height 48）：容纳「标题 + 负责人·状态·进度」两行，避免副文本被挤到截断。
const ROW_H = 44
const BAR_H = 20
const DAY_MS = 86400000
/** 6px 左右 resize 热区（与 CSS .pm-gantt-handle 宽度一致）；命中即调工期，否则中部为移动。 */
const HANDLE_PX = 6

/** 本地日历日平移 n 天（UTC 午夜对齐，避免时区把日期拨回昨天）。 */
const addDays = (iso: string, n: number) =>
  new Date(Date.parse(iso) + n * DAY_MS).toISOString().slice(0, 10)

/** 钳制：开始不得晚于截止（ISO 字符串字典序即时间序）。 */
const clampStart = (start: string, due: string) => (start > due ? due : start)
/** 钳制：截止不得早于开始。 */
const clampDue = (due: string, start: string) => (due < start ? start : due)

/** 身份列副行状态文案（只读派生，与条内口径一致；不回写 status）。 */
const ganttStatusText = (s: Task['status']) =>
  s === 'done' ? '已完成'
    : s === 'in_progress' ? '进行中'
      : s === 'blocked' ? '阻塞' : '待办'

type DragMode = 'move' | 'start' | 'end'

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
  const { tasks, milestones, run, onEdit, disabled } = props
  const axis = dateRange([...tasks, ...milestones])
  const today = localTodayIso() // 本地日期，避免 UTC 偏移把今天画到昨天
  // aria-live 状态行：成功『已更新：起 ~ 止』数秒自清除；失败『更新失败，请重试』。
  const [statusMsg, setStatusMsg] = useState('')
  // inflight：保存中同任务/甘特拖拽禁用，防并发连拖覆盖；结束后解锁。
  const [saving, setSaving] = useState(false)
  // 拖拽预览：move=整体平移天数；start/end=调工期后的候选起止（ghost 标签展示）。
  const [preview, setPreview] = useState<{
    id: string, mode: DragMode, shiftDays?: number, startDate?: string, dueDate?: string
  } | null>(null)
  const [gran, setGran] = useState<'day' | 'week' | 'month'>('day')
  const [showDeps, setShowDeps] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  // 进行中的指针手势：mode 由按下位置决定（左 6px=调开始 / 右 6px=调截止 / 中部=移动）。
  const dragRef = useRef<{
    id: string, mode: DragMode, startX: number, origStart: string, origDue: string, cancelled: boolean
  } | null>(null)
  // 真实拖拽 / 手柄手势后抑制 click 误开抽屉。
  const draggedRef = useRef(false)
  const handleGestureRef = useRef(false)
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

  // ---- 关键路径（只读 CPM，纯派生，零写；成环/缺日期诚实降级，不打断/不补日期） ----
  const cpm = criticalPath(tasks)
  const criticalIds = new Set(cpm.criticalPath)
  const criticalEdgeKeys = new Set(
    cpm.edges.filter(e => e.onCriticalPath).map(e => `${e.fromId}->${e.toId}`),
  )

  // 统一落库通道：拖拽移动 / 左右 resize / 键盘微调全部走既有 `task update` 命令，
  // 白名单 payload 仅 startDate / dueDate，绝不触碰 progress/predecessorIds/status；
  // run 成功后 panel 自动 refresh（web snapshot 回读磁盘），构成持久化闭环。
  const commitDates = async (id: string, payload: { startDate?: string, dueDate?: string }, okText: string) => {
    setSaving(true)
    let ok = false
    try {
      ok = await run(`task update ${id} ${JSON.stringify(payload)}`, { quiet: true })
    } finally {
      setSaving(false) // 无论成败都解锁，finally 防漏
    }
    if (ok) showStatus(okText)
    else showStatus('更新失败，请重试', 6000)
  }

  const onPointerDownBar = (e: React.PointerEvent, task: Task) => {
    if (saving || disabled) return // 保存中/禁用态禁拖：防并发连拖同一任务覆盖
    if (!task.startDate || !task.dueDate) return
    draggedRef.current = false
    // 模式判定：命中左/右手柄（data-rs）优先；否则按按下点距边缘 6px 热区兜底。
    const handle = (e.target as HTMLElement).closest?.('[data-rs]') as HTMLElement | null
    let mode: DragMode = 'move'
    if (handle?.dataset.rs === 'left') mode = 'start'
    else if (handle?.dataset.rs === 'right') mode = 'end'
    else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const off = e.clientX - rect.left
      if (off <= HANDLE_PX) mode = 'start'
      else if (off >= rect.width - HANDLE_PX) mode = 'end'
    }
    handleGestureRef.current = mode !== 'move'
    dragRef.current = {
      id: task.id, mode, startX: e.clientX,
      origStart: task.startDate, origDue: task.dueDate, cancelled: false,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    ;(e.currentTarget as HTMLElement).focus() // 让 Esc 取消能落到条体
  }
  const onPointerMoveBar = (e: React.PointerEvent) => {
    const cur = dragRef.current
    if (!cur) return
    const moved = Math.abs(e.clientX - cur.startX) >= 4
    if (cur.mode === 'move') {
      const shiftDays = Math.round((e.clientX - cur.startX) / PX)
      setPreview(moved ? { id: cur.id, mode: 'move', shiftDays } : null)
      return
    }
    if (!moved) { setPreview(null); return }
    const deltaDays = Math.round((e.clientX - cur.startX) / PX)
    if (cur.mode === 'start') {
      const ns = clampStart(addDays(cur.origStart, deltaDays), cur.origDue)
      setPreview({ id: cur.id, mode: 'start', startDate: ns, dueDate: cur.origDue })
    } else {
      const nd = clampDue(addDays(cur.origDue, deltaDays), cur.origStart)
      setPreview({ id: cur.id, mode: 'end', startDate: cur.origStart, dueDate: nd })
    }
  }
  const onPointerUpBar = async (e: React.PointerEvent) => {
    const cur = dragRef.current
    dragRef.current = null
    setPreview(null) // 立即清 ghost 预览：失败时条体保持原坐标，无残影
    if (!cur || cur.cancelled) return
    const deltaPx = e.clientX - cur.startX
    if (Math.abs(deltaPx) < 4) return // 轻点 = 点击，交给 click 开抽屉（手柄轻点已在 handleGestureRef 抑制）
    draggedRef.current = true
    if (cur.mode === 'move') {
      // 整体平移：startDate/dueDate 同向平移相同天数。
      const next = shiftDatesByDrag(cur.origStart, cur.origDue, deltaPx, PX)
      await commitDates(cur.id, next, `已更新：${next.startDate} ~ ${next.dueDate}`)
    } else if (cur.mode === 'start') {
      // 左缘 resize：只改 startDate，dueDate 不动。
      const ns = clampStart(addDays(cur.origStart, Math.round(deltaPx / PX)), cur.origDue)
      await commitDates(cur.id, { startDate: ns }, `开始日期调整为 ${ns}`)
    } else {
      // 右缘 resize：只改 dueDate，startDate 不动。
      const nd = clampDue(addDays(cur.origDue, Math.round(deltaPx / PX)), cur.origStart)
      await commitDates(cur.id, { dueDate: nd }, `截止日期调整为 ${nd}`)
    }
  }
  const onPointerCancelBar = () => {
    dragRef.current = null
    setPreview(null)
  }
  const openBar = (task: Task) => {
    // 拖拽改期 / 手柄轻点后不触发打开抽屉，避免误开。
    if (draggedRef.current) { draggedRef.current = false; return }
    if (handleGestureRef.current) { handleGestureRef.current = false; return }
    onEdit(task)
  }
  const onKeyDownBar = async (e: React.KeyboardEvent, task: Task) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      draggedRef.current = false
      onEdit(task)
      return
    }
    // Esc：取消进行中的指针拖拽（不落库）。
    if (e.key === 'Escape') {
      if (dragRef.current) dragRef.current.cancelled = true
      setPreview(null)
      e.preventDefault()
      return
    }
    // 方向键微调仅作用于实条子条；父条范围带是只读派生（即便记录上有私有日期也不改写）。
    const rng = effectiveRange(task)
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && rng && !rng.derived
      && task.startDate && task.dueDate && !saving && !disabled) {
      e.preventDefault()
      const dir = e.key === 'ArrowRight' ? 1 : -1
      if (e.shiftKey) {
        // Shift+←/→：调整 1 天工期（右缘延长/缩短），只改 dueDate。
        const nd = clampDue(addDays(task.dueDate, dir), task.startDate)
        await commitDates(task.id, { dueDate: nd }, `截止日期调整为 ${nd}`)
      } else {
        // ←/→：整体移动 1 天，startDate/dueDate 同向平移。
        const payload = { startDate: addDays(task.startDate, dir), dueDate: addDays(task.dueDate, dir) }
        await commitDates(task.id, payload, `已更新：${payload.startDate} ~ ${payload.dueDate}`)
      }
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
  const edgeRoutes: { key: string, d: string, title: string, critical: boolean }[] = []
  {
    const outCount = new Map<string, number>()
    for (const e of edges.edges) {
      const n = outCount.get(e.fromId) ?? 0
      outCount.set(e.fromId, n + 1)
      const r = routeEdge({ ...e, bRight: geomOf.get(e.toId)?.rightX }, { lane: n, pxPerDay: PX })
      const critical = criticalEdgeKeys.has(`${e.fromId}->${e.toId}`)
      edgeRoutes.push({
        key: `${e.fromId}-${e.toId}-${n}`,
        d: r.d,
        critical,
        title: `前置 ${byId.get(e.fromId)?.title ?? e.fromId} → ${byId.get(e.toId)?.title ?? e.toId}${critical ? '（关键路径）' : ''}`,
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
    // P1-3：逾期统一走 core/derived 的 isTaskOverdue 谓词（status!==done 且 progress<100
    // 且 dueDate<today）；保留 !range.derived 前提——父条范围带是只读派生，不参与逾期判定。
    const overdue = !range.derived && isTaskOverdue(t, today)
    const blocked = !done && t.status === 'blocked'
    const isCritical = !range.derived && criticalIds.has(t.id)
    const statusText = done ? '已完成'
      : t.status === 'in_progress' ? '进行中'
        : t.status === 'blocked' ? '阻塞' : '待办'
    const preNames = (t.predecessorIds ?? [])
      .map(pid => byId.get(pid)?.title).filter(Boolean).join('、')
    const aria = `任务 ${t.title}，${range.start} ~ ${range.end}，${widthDays} 天，${statusText}，进度 ${pct}${preNames ? `，前置：${preNames}` : ''}${isCritical ? '，关键路径' : ''}。回车打开详情；←/→ 移动 1 天，Shift+←/→ 调整工期。`
    // ghost 预览：move=整体平移；start/end=resize 候选起止（仅标签预览，条体待回读刷新归位）。
    const ghost = preview && preview.id === t.id
      ? preview.mode === 'move'
        ? shiftDatesByDrag(range.start, range.end, (preview.shiftDays ?? 0) * PX, PX)
        : { startDate: preview.startDate ?? range.start, dueDate: preview.dueDate ?? range.end }
      : null
    const stCls = range.derived ? 'st-parent' : done ? 'st-done' : t.status === 'in_progress' ? 'st-prog' : 'st-todo'
    const cls = [
      'pm-gantt-bar',
      stCls,
      range.derived ? 'pm-gantt-bar--parent' : '',
      isCritical ? 'pm-gantt-bar--critical' : '',
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
      title={`${t.title}（${range.start} ~ ${range.end}）· 进度 ${pct}${t.assignee ? ` · 负责人 ${t.assignee}` : ''}${preNames ? ` · 前置 ${preNames}` : ''}${isCritical ? ' · 关键路径（总时差 0 天）' : ''}`}
      onClick={() => openBar(t)}
      onKeyDown={(e) => onKeyDownBar(e, t)}
      onPointerDown={(e) => { if (!range.derived) onPointerDownBar(e, t) }}
      onPointerMove={(e) => { if (!range.derived) onPointerMoveBar(e) }}
      onPointerUp={(e) => { if (!range.derived) void onPointerUpBar(e) }}
      onPointerCancel={() => { if (!range.derived) onPointerCancelBar() }}
    >
      {!range.derived && <>
        <span className="pm-gantt-handle pm-gantt-handle--left" data-rs="left" aria-hidden="true" />
        <span className="pm-gantt-handle pm-gantt-handle--right" data-rs="right" aria-hidden="true" />
      </>}
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
      <div className="pm-gantt-seg">
        {(['day', 'week', 'month'] as const).map(g => (
          <button key={g} className={gran === g ? 'is-on' : ''} onClick={() => setGran(g)}>{g === 'day' ? '日' : g === 'week' ? '周' : '月'}</button>
        ))}
      </div>
      <label className="pm-switch"><input type="checkbox" checked={showDeps} onChange={e => setShowDeps(e.target.checked)} /><span>依赖线</span></label>
      {cpm.criticalPath.length > 0 && (
        <span className="pm-gantt-legend" title="关键路径：总时差为 0 的任务串，决定项目最短工期；纯只读派生，不写库、不改期。">
          <span className="pm-gantt-legend-swatch pm-gantt-legend-swatch--critical" />关键路径 {cpm.criticalPath.length}
        </span>
      )}
      {cpm.hasCycle && (
        <span className="pm-gantt-warn pm-gantt-warn--cycle" title={cpm.warnings.find(w => w.includes('成环')) ?? ''}>
          循环不可计算
        </span>
      )}
      {cpm.hasMissingDate && (
        <span className="pm-gantt-warn pm-gantt-warn--missing" title={cpm.warnings.find(w => w.includes('缺少开始')) ?? ''}>
          缺日期段已跳过
        </span>
      )}
      <button className="pm-chip" onClick={locateToday}>◉ 定位到今天</button>
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
          const crit = !!er && criticalIds.has(t.id)
          return (
            <div key={t.id} className={`pm-gantt-label-row ${done ? 'is-done' : ''} ${t.parentId ? '' : 'is-parent'} ${crit ? 'is-critical' : ''}`}
              style={{ height: `${ROW_H}px`, paddingLeft: `${10 + depth * 12}px` }}>
              <span className="pm-gantt-label-code">{t.code}</span>
              <span className="pm-gantt-label-main">
                <span className="pm-gantt-label-title">{t.title}</span>
                <span className="pm-gantt-label-sub">
                  负责人 {t.assignee?.trim() || '未分配'} · {ganttStatusText(t.status)}
                  {t.progress != null && t.progress > 0 ? ` · 进度 ${t.progress}%` : ''}
                </span>
              </span>
              {crit && <span className="pm-gantt-critical-tag">关键</span>}
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
            {todayOff >= 0 && todayOff <= axisDays && (
              <span className="pm-gantt-today-tag" style={{ left: `${todayOff * PX + PX / 2 + 4}px` }}>今天</span>
            )}
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
            {todayOff >= 0 && todayOff <= axisDays && (
              <div className="pm-gantt-today" style={{ left: `${todayOff * PX + PX / 2}px` }} />
            )}
            {showDeps && edgeRoutes.length > 0 && (
              <svg className="pm-gantt-links" width={axisDays * PX} height={totalRows * ROW_H} aria-label="任务间前置依赖连线">
                <defs>
                  <marker id="pm-gantt-link-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path className="pm-gantt-link-arrow" d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                  <marker id="pm-gantt-link-arrow-critical" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path className="pm-gantt-link-arrow pm-gantt-link-arrow--critical" d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                </defs>
                {edgeRoutes.map(r => (
                  <g key={r.key}>
                    <title>{r.title}</title>
                    <path
                      d={r.d}
                      className={`pm-gantt-link-path${r.critical ? ' pm-gantt-link-path--critical' : ''}`}
                      markerEnd={r.critical ? 'url(#pm-gantt-link-arrow-critical)' : 'url(#pm-gantt-link-arrow)'}
                    />
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* P1-3 键盘微调提示条（常驻，仅用 dsw/pm token，深浅跟随） */}
    <div className="pm-gantt-kbdbar" aria-label="甘特键盘快捷键">
      <span className="pm-gantt-kbdbar-title">键盘微调</span>
      <span className="pm-gantt-kbd"><kbd>←</kbd><kbd>→</kbd><span>移动 1 天</span></span>
      <span className="pm-gantt-kbd"><kbd>Shift</kbd><kbd>←</kbd><kbd>→</kbd><span>调整 1 天工期</span></span>
      <span className="pm-gantt-kbd"><kbd>Enter</kbd><span>打开抽屉改期</span></span>
      <span className="pm-gantt-kbd"><kbd>Esc</kbd><span>取消拖拽</span></span>
      <span className="pm-gantt-kbdbar-note">边缘手柄拖拽调工期，条体拖拽改期；落库仅写 startDate / dueDate。</span>
    </div>

    {statusMsg && <p className="pm-gantt-hint" role="status" aria-live="polite">{statusMsg}</p>}
  </div>
}
