/**
 * 单项目概览（重设计 v2 · dsh 主题对齐版）。
 *
 * 健康/KPI/日程复用现有纯函数，状态完成卡与 core/stats.ts 一致：
 * - 健康分：core/derived.ts scoreFromInputs（别名 healthFromInputs），计数口径与 panel.tsx Overview 一致。
 * - 风险 KPI / 日程：core/war-room.ts computeKPI / buildAgenda 保留历史口径，不用于状态完成卡。
 * - 阶段进度：WBS 顶层阶段入口，客观值只来自 core 清单派生；人工显示独立分轨。
 *
 * 视觉基准：artifacts/redesign/overview/index.html；主题 token 由 panel.css .pm-shell 统一重映射为
 * dsh 宿主 --dsw-* 别名（深浅色跟随 body[data-ds-dark-theme]），本页只消费变量、不写死色值。
 * 样式见 overview.css，全部选择器 scope 在 .pm-ov-root 下。
 */
import { useMemo, useState } from 'react'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle.mjs'
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock.mjs'
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check.mjs'
import Pencil from 'lucide-react/dist/esm/icons/pencil.mjs'
import css from './overview.css?raw'
import {
  localTodayIso,
  isMilestoneMissed,
  isTaskOverdue,
  scoreFromInputs as healthFromInputs,
  type HealthLamp,
  type HealthFactor,
} from '../../core/derived.js'
import {
  clampProgress, deriveProgressMap, resolveTaskProgressMeta, progressHeadline,
  formatProgressValue, checklistFraction, type TaskProgressMetaInput,
} from '../../core/progress-derivation.js'
import { computeKPI, buildAgenda } from '../../core/war-room.js'
import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from '../../core/settings.js'
import { projectStatusLabels, taskStatusLabels, milestoneStatusLabels } from '../../core/labels.js'
import type { Project, Task, Milestone, RiskIssue } from './types.js'

// 单一来源来自 core 各 *Labels；转 Record<string,string> 兼容 string 索引调用点。
const PROJECT_STATUS_LABEL = projectStatusLabels as Record<string, string>
const TASK_STATUS_LABEL = taskStatusLabels as Record<string, string>
const MILESTONE_STATUS_LABEL = milestoneStatusLabels as Record<string, string>

const LAMP_LABEL: Record<HealthLamp, string> = {
  green: '健康',
  yellow: '关注',
  red: '风险',
  gray: '数据不足',
}

/** 团队/无主提示保留历史口径；状态完成卡不复用此谓词。 */
const isTaskDone = (t: Task): boolean => t.status === 'done' || (t.progress ?? 0) >= 100

/** 距今天数（与 war-room daysFrom 同一公式）；无日期返回 null。 */
const daysFromToday = (d: string | undefined, today: string): number | null =>
  d ? Math.round((Date.parse(`${d}T00:00:00`) - Date.parse(`${today}T00:00:00`)) / 86_400_000) : null

/** YYYY-MM-DD → { 日, 月标签 }；无日期渲染为「-- / 待定」。 */
function splitDate(d?: string | null): { day: string, month: string } {
  if (!d) return { day: '--', month: '待定' }
  return { day: d.slice(8, 10) || '--', month: `${Number(d.slice(5, 7)) || '—'}月` }
}

/** 健康环：内联 SVG，环色由根节点 data-lamp 映射 --ov-lamp。 */
function HealthRing({ score, lamp }: { score: number | null, lamp: HealthLamp }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score ?? 0))
  const offset = circ * (1 - pct / 100)
  return (
    <div className="ov-ring-disc">
      <svg className="ov-ring-svg" width="138" height="138" viewBox="0 0 138 138" role="img" aria-label={`健康分 ${score ?? '数据不足'}`}>
        <circle cx="69" cy="69" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="10"/>
        <circle cx="69" cy="69" r={r} fill="none" stroke="var(--ov-lamp)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 69 69)"/>
      </svg>
      <div className="ov-ring-center">
        <div className="ov-ring-num">{score ?? '—'}</div>
        <span className="ov-ring-lab"><i className="ov-dot"/>{LAMP_LABEL[lamp]}</span>
      </div>
    </div>
  )
}

/** 健康分可解释面板：只展示 core 已算好的 factors/扣分/灯链，不改阈值、不简化隐藏分数。 */
function HealthBreakdown({ factors, score, lamp, greenAt, yellowAt }: {
  factors: HealthFactor[], score: number | null, lamp: HealthLamp, greenAt: number, yellowAt: number
}) {
  if (score === null) {
    return (
      <div className="ov-health-explain">
        <p className="ov-health-note">暂无任务记录，健康分数据不足（灰灯）。</p>
      </div>
    )
  }
  const totalDeduct = factors.reduce((a, f) => a + Math.abs(f.deduction), 0)
  return (
    <div className="ov-health-explain">
      <div className="ov-health-formula">100 − {totalDeduct} 扣分 = <b>{score} 分</b> · {LAMP_LABEL[lamp]}</div>
      <ul className="ov-health-factors">
        {factors.length === 0
          ? <li className="ov-health-note">无扣分项（各项均未触发）。</li>
          : factors.map(f => (
              <li key={f.key}>
                <span className="ov-health-factor-label">{f.label} × {f.count}</span>
                <span className="ov-health-factor-deduct">{f.deduction}</span>
              </li>
            ))}
      </ul>
      <div className="ov-health-lamp-chain">
        灯链：绿 ≥ {greenAt} · 黄 ≥ {yellowAt} · 否则红
      </div>
      <p className="ov-health-disclaimer">健康分仅供排期参考，不做绩效评价。</p>
    </div>
  )
}

interface AgendaRow {
  id: string
  day: string
  month: string
  title: string
  sub: string
  overdue: boolean
}

type RemTone = 'late' | 'block' | 'prog' | 'done'
interface RemRow {
  key: string
  tone: RemTone
  text: string
}

export function Overview(props: {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
  /** 会议/汇报/交付物计数（panel.tsx 已按项目过滤；可选，缺省渲染「未接入」占位格）。 */
  meetingsCount?: number
  reportsCount?: number
  deliverablesCount?: number
  /** #21 口径设置（缺省=默认）；健康分/KPI/日程窗口随其变化。 */
  settings?: ProjectSettings
  /** 编辑项目元信息（面板层 ProjectBar 在概览页被省略，编辑入口并入 HERO）。 */
  onEditProject?: () => void
}) {
  const { project, tasks, milestones, riskIssues } = props
  const settings = props.settings ?? DEFAULT_PROJECT_SETTINGS
  const today = localTodayIso()
  const [copied, setCopied] = useState(false)

  // ---- 纯函数口径（与 panel.tsx Overview 一致） ----
  const kpi = computeKPI(tasks, milestones, riskIssues, today, undefined, settings)
  const health = healthFromInputs({
    taskTotal: tasks.length,
    overdueTasks: tasks.filter(t => isTaskOverdue(t, today)).length,
    taskBlocked: tasks.filter(t => t.status === 'blocked').length,
    openHighRisk: riskIssues.filter(x => x.status !== 'closed' && x.impact === 'high').length,
    openCriticalRisk: riskIssues.filter(x => x.status !== 'closed' && x.impact === 'critical').length,
    milestoneOverdue: milestones.filter(m => isMilestoneMissed(m, today)).length,
  }, settings)

  // ---- 派生计数（展示层聚合，不改变扣分/统计口径）；5 态互斥，wrapped 单独成桶 ----
  const done = tasks.filter(t => t.status === 'done').length
  const doneRate = tasks.length ? Math.round(done / tasks.length * 100) : 0
  const todoCount = tasks.filter(t => t.status === 'todo').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const blockedCount = tasks.filter(t => t.status === 'blocked').length
  const wrappedCount = tasks.filter(t => t.status === 'wrapped').length
  const overdueCount = tasks.filter(t => isTaskOverdue(t, today)).length
  const achievedMiles = milestones.filter(m => m.status === 'achieved').length
  const plannedMiles = milestones.length - achievedMiles
  // 项目负责人(project.owner) 与任务执行人(assignee) 语义分离：未指派执行人只看 open 任务。
  const unassigned = tasks.filter(t => !isTaskDone(t) && t.status !== 'wrapped' && !t.assignee?.trim()).length

  const progressMap = useMemo(() => deriveProgressMap(tasks), [tasks])
  // 保留 WBS 顶层阶段入口，不平均中间层/legacy，不因阶段 done 强填客观100。
  const phases = tasks
    .filter(t => /^\d+$/.test(t.code ?? ''))
    .map(r => {
      const derived = progressMap.get(r.id)!
      const meta = resolveTaskProgressMeta(r as Task & TaskProgressMetaInput, derived)
      return { id: r.id, name: r.title, derived, meta, pct: meta.display }
    })

  // 团队负载：按负责人聚合
  const teamMap = new Map<string, Task[]>()
  for (const t of tasks) {
    const a = t.assignee?.trim()
    if (!a) continue
    const arr = teamMap.get(a) ?? []
    arr.push(t)
    teamMap.set(a, arr)
  }
  const teamRows = [...teamMap.entries()].map(([name, list]) => {
    const d = list.filter(isTaskDone).length
    const p = list.filter(t => t.status === 'in_progress').length
    const td = list.filter(t => t.status === 'todo').length
    const bl = list.filter(t => t.status === 'blocked').length
    const main = p ? `${p} 进行中` : d ? `${d} 已完成` : td ? `${td} 待办` : `${bl} 受阻`
    return { name, total: list.length, done: d, prog: p, todo: td, block: bl, main }
  }).sort((a, b) => b.total - a.total)

  // 接下来的日程：buildAgenda 负责筛选/排序口径，这里只补标题与子文案
  const taskById = new Map(tasks.map(t => [t.id, t]))
  const mileById = new Map(milestones.map(m => [m.id, m]))
  const agendaRows: AgendaRow[] = buildAgenda(tasks, milestones, today, undefined, settings).slice(0, 4).map(item => {
    if (item.kind === 'task') {
      const t = taskById.get(item.id)
      const ds = splitDate(t?.dueDate)
      return {
        id: item.id,
        day: ds.day,
        month: ds.month,
        title: t?.title ?? '任务到期',
        sub: `${item.overdue ? `逾期 ${-item.days} 天 · ` : ''}${t?.assignee?.trim() || '未指派'} · ${TASK_STATUS_LABEL[t?.status ?? ''] ?? ''}`,
        overdue: item.overdue,
      }
    }
    const m = mileById.get(item.id)
    const ds = splitDate(m?.targetDate)
    return {
      id: item.id,
      day: ds.day,
      month: ds.month,
      title: m?.title ? `里程碑「${m.title}」` : '里程碑',
      sub: `${item.overdue ? `逾期 ${-item.days} 天 · ` : ''}${MILESTONE_STATUS_LABEL[m?.status ?? ''] ?? '里程碑'}`,
      overdue: item.overdue,
    }
  })
  // 不足 4 项时，用「无日期里程碑」补齐待定行（仅渲染已有数据，不编造日期）
  if (agendaRows.length < 4) {
    for (const m of milestones) {
      if (agendaRows.length >= 4) break
      if (m.status === 'achieved' || m.targetDate) continue
      agendaRows.push({
        id: m.id,
        day: '--',
        month: '待定',
        title: m.title ? `里程碑「${m.title}」` : '里程碑',
        sub: '计划中 · 日期待定',
        overdue: false,
      })
    }
  }

  // 提醒按严重度分组：需立即处理(逾期) → 需关注(受阻/无主) → 近期安排(临期里程碑) → 正常。
  interface RemGroup { key: 'late' | 'block' | 'prog' | 'done', title: string, rows: RemRow[] }
  const remGroups: RemGroup[] = [
    { key: 'late', title: '需立即处理', rows: [] },
    { key: 'block', title: '需关注', rows: [] },
    { key: 'prog', title: '近期安排', rows: [] },
    { key: 'done', title: '正常', rows: [] },
  ]
  const pushRem = (g: RemGroup, row: RemRow) => g.rows.push(row)
  if (overdueCount > 0) pushRem(remGroups[0], { key: 'overdue', tone: 'late', text: `${overdueCount} 项任务已逾期，需优先处理` })
  if (blockedCount > 0) pushRem(remGroups[1], { key: 'blocked', tone: 'block', text: `${blockedCount} 项任务受阻，等待解除阻塞` })
  if (unassigned > 0) pushRem(remGroups[1], { key: 'ownerless', tone: 'block', text: `${unassigned} 项未完成任务尚未指派执行人` })
  for (const m of milestones) {
    if (m.status === 'achieved') continue
    const d = daysFromToday(m.targetDate, today)
    if (d === null || d < 0 || d > settings.reminderWithinDays) continue
    pushRem(remGroups[2], {
      key: `mile-${m.id}`,
      tone: 'prog',
      text: `里程碑「${m.title}」${d === 0 ? '今天到期' : `${d} 天后到期`}`,
    })
  }
  if (remGroups.every(g => !g.rows.length)) {
    pushRem(remGroups[3], { key: 'all-clear', tone: 'done', text: '一切正常 · 暂无待处理提醒' })
  }
  const visibleRemGroups = remGroups.filter(g => g.rows.length)

  const onCopyRepo = () => {
    if (!project.repoUrl) return
    const done2 = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(project.repoUrl).then(done2).catch(() => {})
    }
  }

  // 顶部信息栅格：只放项目元信息（负责人/日期/协作计数）；任务数/里程碑/风险等动态计数由下方统计卡同源呈现，避免双份。
  const infoCells: { label: string, value: string }[] = [
    { label: '项目负责人', value: project.owner || '未指派' },
    { label: '开始日期', value: project.startDate || '未定' },
    { label: '目标日期', value: project.targetDate || '未定' },
    { label: '会议', value: props.meetingsCount === undefined ? '未接入' : String(props.meetingsCount) },
    { label: '汇报', value: props.reportsCount === undefined ? '未接入' : String(props.reportsCount) },
    { label: '交付物', value: props.deliverablesCount === undefined ? '未接入' : String(props.deliverablesCount) },
  ]

  return (
    <div className="pm-ov-root" data-lamp={health.score === null ? 'gray' : health.lamp}>
      <style>{css}</style>

      {/* HERO 指挥舱 */}
      <section className="ov-card ov-hero">
        <div className="ov-hero-left">
          <div className="ov-hero-title-row">
            <h1>{project.name}</h1>
            <span className="ov-chip" data-status={project.status}>
              <i className="ov-dot"/>{PROJECT_STATUS_LABEL[project.status] ?? project.status}
            </span>
            {props.onEditProject
              ? <button type="button" className="ov-hero-edit" aria-label="编辑项目信息" onClick={props.onEditProject}>
                  <Pencil size={14}/>
                </button>
              : null}
          </div>
          {project.description ? <p className="ov-hero-desc">{project.description}</p> : null}
        </div>
        <div className="ov-hero-right">
          <HealthRing score={health.score} lamp={health.score === null ? 'gray' : health.lamp}/>
          <HealthBreakdown
            factors={health.factors}
            score={health.score}
            lamp={health.score === null ? 'gray' : health.lamp}
            greenAt={settings.healthGreenAt}
            yellowAt={settings.healthYellowAt}
          />
        </div>
      </section>

      {/* 项目元信息栅格：label + value 结构化 */}
      <section className="ov-card ov-info-grid" aria-label="项目元信息">
        {infoCells.map(c => (
          <div className="ov-info-cell" key={c.label}>
            <span className="ov-info-lab">{c.label}</span>
            <span className="ov-info-val" title={c.value}>{c.value}</span>
          </div>
        ))}
      </section>

      {/* BENTO */}
      <div className="ov-bento">

        {/* 一排小统计卡 */}
        <div className="ov-row-stats">
          <div className="ov-card ov-stat">
            <span className="ov-lab">任务完成</span>
            <span className="ov-num">{done}<small>/{tasks.length}</small></span>
            <span className="ov-mini-bar"><i style={{ width: `${doneRate}%`, background: 'var(--c-done)' }}/></span>
            <span className="ov-sub">{doneRate}% 已完成</span>
          </div>
          <div className="ov-card ov-stat">
            <span className="ov-lab">里程碑</span>
            <span className="ov-num">{milestones.length}</span>
            <span className="ov-sub">
              {milestones.length ? `${achievedMiles} 已达成 · ${plannedMiles} 计划中` : '暂无里程碑'}
            </span>
          </div>
          <div className="ov-card ov-stat">
            <span className="ov-lab">风险与问题</span>
            <span className="ov-num">{kpi.openRisks}</span>
            <span className="ov-sub">
              {blockedCount + overdueCount > 0 ? `${blockedCount} 受阻 · ${overdueCount} 逾期` : '无阻塞 · 无逾期'}
            </span>
          </div>
          <div className="ov-card ov-stat">
            <span className="ov-lab">未完成</span>
            <span className="ov-num">{todoCount + inProgressCount + blockedCount}<small>/{tasks.length}</small></span>
            <span className="ov-sub">
              {todoCount} 待办 · {inProgressCount} 进行中{blockedCount ? ` · ${blockedCount} 受阻` : ''}{wrappedCount ? ` · ${wrappedCount} 已收尾` : ''}
            </span>
          </div>
        </div>

        {/* 阶段进度 + 团队负载 */}
        <div className="ov-row-main">
          <div className="ov-card">
            <div className="ov-card-head">
              <h3>阶段进度</h3>
              <span className="more">{phases.length} 个阶段 · 任务口径</span>
            </div>
            {phases.length ? phases.map(p => (
              <div className="ov-phase" key={p.id} data-progress-mode={p.meta.mode}>
                <span className="ov-pname">
                  <i className="ov-dot" style={{ background: (p.pct ?? 0) >= 100 ? 'var(--c-done)' : (p.pct ?? 0) > 0 ? 'var(--c-prog)' : 'var(--c-todo)' }}/>
                  <span className="ov-pname-t">{p.name}</span>
                </span>
                <span className="ov-track"><i style={{
                  width: `${p.pct ?? 0}%`,
                  background: (p.pct ?? 0) >= 100 ? 'var(--c-done)' : (p.pct ?? 0) > 0 ? 'var(--c-prog)' : 'transparent',
                }}/></span>
                <span className="ov-pct">{p.pct === null ? '—' : `${p.pct}%`}</span>
                <small style={{ gridColumn: '1 / -1', minWidth: 0, overflowWrap: 'anywhere', fontSize: 'var(--t-10)', color: 'var(--muted)' }}>
                  {p.meta.mode === 'manual' && <>人工设定 {p.pct}% · </>}
                  客观 {formatProgressValue(p.derived)}
                  {checklistFraction(p.derived) && <> · 清单 {checklistFraction(p.derived)}</>}
                  {' · '}覆盖 {p.derived.coverage.coveredLeaves}/{p.derived.coverage.totalLeaves}
                  {p.derived.source === 'rollup' && <> · {progressHeadline(p.derived)}</>}
                  {p.derived.value === null && p.derived.legacyProgress !== null && <> · 原手填 {clampProgress(p.derived.legacyProgress)}%</>}
                  {p.derived.pendingAcceptance && <> · 待验收</>}
                  {p.derived.warnings.length > 0 && <span title={p.derived.warnings.join('\n')}> · 请确认验收</span>}
                  {p.meta.mode === 'manual' && p.meta.manualNote && <span title={p.meta.manualNote}> · {p.meta.manualNote}</span>}
                </small>
              </div>
            )) : <p className="ov-empty">尚未拆分阶段任务（code 形如 1 / 1.1）</p>}
          </div>

          <div className="ov-card">
            <div className="ov-card-head">
              <h3>任务执行人</h3>
              <span className="more">按 assignee 聚合 · 与项目负责人分开</span>
            </div>
            {teamRows.length ? teamRows.map(tr => (
              <div className="ov-team-row" key={tr.name}>
                <div className="ov-avatar">{tr.name.slice(0, 1)}</div>
                <div className="ov-team-body">
                  <div className="ov-team-name">{tr.name}<span className="role">{tr.total} 任务</span></div>
                  <div className="ov-team-bar">
                    {tr.done ? <i style={{ flexGrow: tr.done, background: 'var(--c-done)' }}/> : null}
                    {tr.prog ? <i style={{ flexGrow: tr.prog, background: 'var(--c-prog)' }}/> : null}
                    {tr.todo ? <i style={{ flexGrow: tr.todo, background: 'var(--c-todo)' }}/> : null}
                    {tr.block ? <i style={{ flexGrow: tr.block, background: 'var(--c-block)' }}/> : null}
                  </div>
                </div>
                <div className="ov-team-count">{tr.main}</div>
              </div>
            )) : <p className="ov-empty">任务尚未指派负责人</p>}
            <div className="ov-team-foot">
              <span>项目负责人 · {project.owner || '未指派'}</span>
              <span>{teamRows.length} 人已承接任务</span>
            </div>
          </div>
        </div>

        {/* 接下来的日程 + 项目链接 + 提醒 */}
        <div className="ov-row-bottom">
          <div className="ov-card">
            <div className="ov-card-head">
              <h3>接下来的日程</h3>
              <span className="more">未来 {agendaRows.length} 项</span>
            </div>
            <div className="ov-cal">
              {agendaRows.length ? agendaRows.map(r => (
                <div className={`ov-cal-row${r.overdue ? ' is-overdue' : ''}`} key={r.id}>
                  <div className="ov-cal-date"><div className="d">{r.day}</div><div className="m">{r.month}</div></div>
                  <div className="ov-cal-body">
                    <div className="t">{r.title}</div>
                    <div className="s">{r.sub}</div>
                  </div>
                </div>
              )) : <p className="ov-empty">近期无到期事项</p>}
            </div>
          </div>

          <div className="ov-card" data-repo-link>
            <div className="ov-card-head">
              <h3>项目链接</h3>
              <span className="more">仓库</span>
            </div>
            {project.repoUrl ? (
              <>
                <div className="ov-repo-url">{project.repoUrl}</div>
                <div className="ov-repo-btns">
                  <a className="ov-btn primary" href={project.repoUrl} target="_blank" rel="noopener noreferrer">打开仓库</a>
                  <button type="button" className="ov-btn ghost" onClick={onCopyRepo}>{copied ? '已复制' : '复制'}</button>
                </div>
                <div className="ov-repo-note">
                  <i className="ov-dot" style={{ background: 'var(--c-done)' }}/>
                  {project.branch ? `分支 ${project.branch}` : '仓库已配置'}
                </div>
              </>
            ) : (
              <p className="ov-repo-empty">尚未配置仓库地址</p>
            )}
          </div>

          <div className="ov-card">
            <div className="ov-card-head">
              <h3>提醒</h3>
              <span className="more">{visibleRemGroups.reduce((n, g) => n + g.rows.length, 0)} 条 · 按严重度分组</span>
            </div>
            <div className="ov-rem-list">
              {visibleRemGroups.map(g => (
                <div className="ov-rem-group" key={g.key}>
                  <div className="ov-rem-group-title" data-tone={g.key}>{g.title}</div>
                  {g.rows.map(r => (
                    <div className="ov-rem-row" key={r.key} data-tone={r.tone}>
                      <span className="ov-rem-ico" data-tone={r.tone}>
                        {r.tone === 'done'
                          ? <CircleCheck size={14}/>
                          : r.tone === 'prog'
                            ? <CalendarClock size={14}/>
                            : <AlertTriangle size={14}/>}
                      </span>
                      <span className="ov-rem-text">{r.text}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
