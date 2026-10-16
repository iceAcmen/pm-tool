/**
 * 单项目概览（重设计 v2 落地视图）。
 *
 * 数据口径全部复用现有纯函数，不在本文件手算/编造：
 * - 健康分：core/derived.ts scoreFromInputs（别名 healthFromInputs），计数口径与 panel.tsx Overview 一致。
 * - KPI / 日程：core/war-room.ts computeKPI / buildAgenda（done 口径 = status==='done' 或 progress>=100）。
 * - 阶段进度：沿用 panel.tsx Overview 的 WBS 口径（顶层 code 为纯数字的任务组，子任务 code 以 "code." 开头）。
 *
 * 视觉基准：artifacts/redesign/overview/index.html（HERO + 健康环 + 12 列统一 BENTO）。
 * 样式见 overview.css，全部选择器 scope 在 .pm-ov-root 下，颜色只走 panel.css v2 变量。
 */
import { useState } from 'react'
import css from './overview.css?raw'
import {
  localTodayIso,
  scoreFromInputs as healthFromInputs,
  type HealthLamp,
} from '../../core/derived.js'
import { computeKPI, buildAgenda } from '../../core/war-room.js'
import type { Project, Task, Milestone, RiskIssue } from './types.js'

const PROJECT_STATUS_LABEL: Record<string, string> = {
  planning: '计划中',
  active: '进行中',
  paused: '已暂停',
  done: '已完成',
  archived: '已归档',
}

const TASK_STATUS_LABEL: Record<string, string> = {
  todo: '未开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
}

const MILESTONE_STATUS_LABEL: Record<string, string> = {
  planned: '计划中',
  at_risk: '有风险',
  achieved: '已达成',
  missed: '已错过',
}

const LAMP_LABEL: Record<HealthLamp, string> = {
  green: '健康',
  yellow: '关注',
  red: '风险',
  gray: '数据不足',
}

/** done 口径与 war-room.isTaskDone 保持一致：status==='done' 或 progress>=100。 */
const isTaskDone = (t: Task): boolean => t.status === 'done' || (t.progress ?? 0) >= 100

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

interface AgendaRow {
  id: string
  day: string
  month: string
  title: string
  sub: string
  overdue: boolean
}

export function Overview(props: {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
}) {
  const { project, tasks, milestones, riskIssues } = props
  const today = localTodayIso()
  const [copied, setCopied] = useState(false)

  // ---- 纯函数口径（与 panel.tsx Overview 一致） ----
  const kpi = computeKPI(tasks, milestones, riskIssues, today)
  const health = healthFromInputs({
    taskTotal: tasks.length,
    overdueTasks: tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done').length,
    taskBlocked: tasks.filter(t => t.status === 'blocked').length,
    openHighRisk: riskIssues.filter(x => x.status !== 'closed' && x.impact === 'high').length,
    openCriticalRisk: riskIssues.filter(x => x.status !== 'closed' && x.impact === 'critical').length,
    milestoneOverdue: milestones.filter(m => m.status !== 'achieved' && m.targetDate < today).length,
  })

  // ---- 派生计数（展示层聚合，不改变扣分/统计口径） ----
  const done = tasks.filter(isTaskDone).length
  const todoCount = tasks.filter(t => t.status === 'todo').length
  const blockedCount = tasks.filter(t => t.status === 'blocked').length
  const overdueCount = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done').length
  const achievedMiles = milestones.filter(m => m.status === 'achieved').length
  const plannedMiles = milestones.length - achievedMiles
  const unassigned = tasks.filter(t => !isTaskDone(t) && !t.assignee?.trim()).length

  // 阶段进度：WBS 顶层分组口径（同 panel.tsx Overview）
  const phases = tasks
    .filter(t => /^\d+$/.test(t.code ?? ''))
    .map(r => {
      const kids = tasks.filter(t => (t.code ?? '').startsWith(`${r.code}.`))
      const group = kids.length ? kids : [r]
      const avg = Math.round(group.reduce((a, t) => a + (t.progress ?? 0), 0) / group.length)
      return { id: r.id, name: r.title, pct: r.status === 'done' ? 100 : avg }
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
  const agendaRows: AgendaRow[] = buildAgenda(tasks, milestones, today).slice(0, 4).map(item => {
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

  const blockedOrOverdue = blockedCount + overdueCount > 0

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
          </div>
          <div className="ov-hero-meta">
            <span>负责人 · {project.owner || '未指派'}</span>
            <i className="ov-dot-sep"/>
            {project.startDate && <><span>开始 {project.startDate}</span><i className="ov-dot-sep"/></>}
            <span>目标 {project.targetDate || '未定'}</span>
          </div>
          {project.description ? <p className="ov-hero-desc">{project.description}</p> : null}
        </div>
        <div className="ov-hero-right">
          <HealthRing score={health.score} lamp={health.score === null ? 'gray' : health.lamp}/>
        </div>
      </section>

      {/* BENTO */}
      <div className="ov-bento">

        {/* 一排小统计卡 */}
        <div className="ov-row-stats">
          <div className="ov-card ov-stat">
            <span className="ov-lab">任务完成</span>
            <span className="ov-num">{done}<small>/{tasks.length}</small></span>
            <span className="ov-mini-bar"><i style={{ width: `${kpi.doneRate}%`, background: 'var(--c-done)' }}/></span>
            <span className="ov-sub">{kpi.doneRate}% 已完成</span>
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
              {blockedOrOverdue ? `${blockedCount} 受阻 · ${overdueCount} 逾期` : '无阻塞 · 无逾期'}
            </span>
          </div>
          <div className="ov-card ov-stat">
            <span className="ov-lab">未开始</span>
            <span className="ov-num">{tasks.length - done}</span>
            <span className="ov-sub">
              {todoCount} 待办 · {kpi.inProgress} 进行中{blockedCount ? ` · ${blockedCount} 受阻` : ''}
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
              <div className="ov-phase" key={p.id}>
                <span className="ov-pname">
                  <i className="ov-dot" style={{ background: p.pct >= 100 ? 'var(--c-done)' : p.pct > 0 ? 'var(--c-prog)' : 'var(--c-todo)' }}/>
                  <span className="ov-pname-t">{p.name}</span>
                </span>
                <span className="ov-track"><i style={{
                  width: `${p.pct}%`,
                  background: p.pct >= 100 ? 'var(--c-done)' : p.pct > 0 ? 'var(--c-prog)' : 'transparent',
                }}/></span>
                <span className="ov-pct">{p.pct}%</span>
              </div>
            )) : <p className="ov-empty">尚未拆分阶段任务（code 形如 1 / 1.1）</p>}
          </div>

          <div className="ov-card">
            <div className="ov-card-head">
              <h3>团队负载</h3>
              <span className="more">按负责人</span>
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
              <span>负责人 · {project.owner || '未指派'}</span>
              <span>{teamRows.length} 人已指派</span>
            </div>
          </div>
        </div>

        {/* 接下来的日程 + 项目链接 + 需要关注 */}
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
              <h3>需要关注</h3>
              <span className="more">3 项检查</span>
            </div>
            <div className="ov-attn-main">
              <div className={`ov-attn-ico${unassigned > 0 ? ' is-warn' : ' is-ok'}`}>{unassigned > 0 ? '!' : '✓'}</div>
              <div>
                <div className={`ov-attn-num${unassigned > 0 ? ' is-warn' : ' is-ok'}`}>{unassigned}</div>
                <div className="ov-attn-txt">
                  {unassigned > 0 ? '项未完成任务尚未指派负责人' : '未完成任务均已指派负责人'}
                </div>
              </div>
            </div>
            <div className="ov-attn-ok">
              <span className="ok"><i className="ov-dot" style={{ background: blockedCount ? 'var(--c-block)' : 'var(--c-done)' }}/>阻塞 <b>{blockedCount}</b></span>
              <span className="ok"><i className="ov-dot" style={{ background: overdueCount ? 'var(--c-late)' : 'var(--c-done)' }}/>逾期 <b>{overdueCount}</b></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
