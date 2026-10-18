/**
 * 已确认 7 卡 WidgetDescriptor + 内置默认布局。
 * 视觉基准：.tmp/redesign/board-directions/direction-1-final.html（深）/ -light（浅）。
 * 数据口径全部复用 src/core 纯函数与现有 Snapshot，不杜撰、不画历史趋势。
 */
import React from 'react'
import type { Snapshot, Task } from '../panel.js'
import { groupOpenTasksByAssignee } from '../../core/people-load.js'
import { deriveProgressMap, clampProgress } from '../../core/progress-derivation.js'
import { isTaskOverdue } from '../../core/derived.js'
import { groupRiskMatrix } from '../../core/war-room.js'
import { projectStatusLabels, taskStatusLabels } from '../../core/labels.js'
import { buildCompletionHistory } from '../../core/completion-history.js'
import { MarkdownView } from '../shared/markdown-view.js'
import type { DashboardLayout, WidgetDescriptor, WidgetInstance, WidgetConfig, WidgetEntity } from './types.js'
import { selectEntity, applyFilter, applySort, FIELD_WHITELIST } from './query.js'
import { queueCard } from './queue-card.js'

export function todayIso(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

const TONE = {
  done: 'var(--pm-st-done)',
  progress: 'var(--pm-st-progress)',
  blocked: 'var(--pm-st-blocked)',
  overdue: 'var(--pm-st-overdue)',
  todo: 'var(--pm-st-todo)',
  due: 'var(--pm-st-due)',
} as const

/**
 * 任务编号占位（契约 §7）：有值显 code；无值（schema 前存量记录）显短 ID，不重新编号、不回写。
 * missing=true 时由调用方加弱化样式。
 */
function taskCodeLabel(t: { id: string, code?: string }): { text: string, missing: boolean } {
  const code = typeof t.code === 'string' ? t.code.trim() : ''
  if (code) return { text: code, missing: false }
  return { text: t.id, missing: true }
}

/* ---------- 1. completionHero 完成率主卡（左列高卡） ---------- */
const completionHero: WidgetDescriptor = {
  type: 'completionHero',
  name: '任务完成率',
  category: 'kpi',
  defaultW: 4, defaultH: 10, minW: 3, minH: 6,
  requiredSources: ['projects', 'tasks'],
  defaultConfig: {},
  render({ data, actions, onLink, linkage }) {
    const today = todayIso()
    const total = data.tasks.length
    const done = data.tasks.filter(t => t.status === 'done').length
    const inProgress = data.tasks.filter(t => t.status === 'in_progress').length
    const blocked = data.tasks.filter(t => t.status === 'blocked').length
    const todo = data.tasks.filter(t => t.status === 'todo').length
    const rate = total ? Math.round(done / total * 100) : 0
    const circ = 2 * Math.PI * 56
    const offset = circ * (1 - rate / 100)
    const buckets: Array<[string, number, string, string]> = [
      ['进行', inProgress, TONE.progress, 'in_progress'],
      ['完成', done, TONE.done, 'done'],
      ['待办', todo, TONE.todo, 'todo'],
      ['阻塞', blocked, TONE.blocked, 'blocked'],
    ]
    // 需要关注：逾期(按日期升序) > 阻塞 > 临期(7 天内，按日期升序)，最多 4 条。
    // 逾期统一走 derived.isTaskOverdue（status!=='done' 且 progress<100 且 dueDate<today）。
    const overdue = data.tasks
      .filter(t => isTaskOverdue(t, today))
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
    const blockedTasks = data.tasks.filter(t => t.status === 'blocked')
    const dueSoon = data.tasks
      .filter(t => t.status !== 'done' && t.dueDate && t.dueDate >= today && t.dueDate <= addDays(today, 7))
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
    const attn = [
      ...overdue.map(t => ({ t, tone: TONE.overdue, why: '逾期未完成' })),
      ...blockedTasks.map(t => ({ t, tone: TONE.blocked, why: '外部依赖阻塞' })),
      ...dueSoon.map(t => ({ t, tone: TONE.due, why: t.title })),
    ].slice(0, 4)
    const unassigned = data.tasks.filter(t => t.status !== 'done' && !t.assignee).length
    const od = overdue[0]
    return <div className="pm-bento-card">
      <div className="pm-bento-label">任务完成率
        {od && <span className="pm-bento-pill pm-bento-pill-overdue" title={od.dueDate ?? undefined}>逾期 {taskCodeLabel(od).text} · 应 {od.dueDate}</span>}
      </div>
      <div className="pm-hero-main">
        <svg width="116" height="116" viewBox="0 0 140 140" aria-hidden>
          <circle cx="70" cy="70" r="56" fill="none" stroke="var(--pm-line)" strokeWidth="11"/>
          <circle cx="70" cy="70" r="56" fill="none" stroke={TONE.done} strokeWidth="11"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 70 70)"/>
          <text x="70" y="68" textAnchor="middle" fontSize="23" fontWeight="600" fill="var(--pm-ink)">{rate}%</text>
          <text x="70" y="86" textAnchor="middle" fontSize="10" fill="var(--pm-muted)">{done} / {total}</text>
        </svg>
        <div className="pm-hero-bars">
          {buckets.map(([label, n, color, st]) => {
            const active = linkage?.status === st
            return <div key={label}
              className={`pm-hero-barrow ${onLink ? 'pm-linkable' : ''} ${active ? 'pm-link-on' : ''}`}
              onClick={() => onLink && onLink('status', st)}>
              <span>{label}</span>
              <div className="pm-pbar"><i style={{ width: `${total ? n / total * 100 : 0}%`, background: color }}/></div>
              <span className="pm-bento-m">{n}</span>
            </div>
          })}
        </div>
      </div>
      <div className="pm-bento-label" style={{ marginTop: 18, color: 'var(--pm-ink)' }}>需要关注 · {attn.length}</div>
      <div className="pm-attn-list">
        {attn.map(({ t, tone, why }) => (
          <button key={t.id} type="button" className="pm-attn" data-open-record data-open-type="task" data-open-id={t.id}
            onClick={() => actions.openRecord(t.projectId, 'task', t.id)}>
            <i style={{ background: tone }}/>
            <span><b className={taskCodeLabel(t).missing ? 'pm-bento-code-missing' : ''}>{taskCodeLabel(t).text}</b> · {why}</span>
            <span className="pm-bento-faint">{t.assignee || '未分配'}</span>
            <span className="pm-attn-arr" title={t.dueDate ?? undefined}>{t.dueDate ?? '—'}</span>
          </button>
        ))}
        {attn.length === 0 && <div className="pm-bento-faint">当前无需特别关注的任务。</div>}
      </div>
      <div className="pm-bento-foot">{unassigned} 项无主任务</div>
    </div>
  },
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ---------- 2. milestoneDeliverable 里程碑·交付物 ---------- */
const milestoneDeliverable: WidgetDescriptor = {
  type: 'milestoneDeliverable',
  name: '里程碑 · 交付物',
  category: 'progress',
  defaultW: 8, defaultH: 3, minW: 4, minH: 2,
  requiredSources: ['milestones', 'deliverables'],
  defaultConfig: {},
  render({ data }) {
    const ms = data.milestones
    const msAch = ms.filter(m => m.status === 'achieved').length
    const msRisk = ms.filter(m => m.status === 'at_risk').length
    const msPlan = ms.length - msAch - msRisk
    const dlv = data.deliverables
    const dlvAcc = dlv.filter(d => d.status === 'accepted').length
    const dlvProg = dlv.filter(d => d.status === 'in_progress').length
    const dlvPlan = dlv.length - dlvAcc - dlvProg
    return <div className="pm-bento-card">
      <div className="pm-bento-label">里程碑 · 交付物</div>
      <div className="pm-md-stack">
        <SegRow label="里程碑" segs={[[msAch, TONE.done], [msRisk, TONE.blocked], [Math.max(msPlan, 0), TONE.todo]]} total={ms.length}/>
        <SegRow label="交付物" segs={[[dlvAcc, TONE.done], [dlvProg, TONE.progress], [Math.max(dlvPlan, 0), TONE.todo]]} total={dlv.length}/>
      </div>
    </div>
  },
}

function SegRow({ label, segs, total }: { label: string, segs: Array<[number, string]>, total: number }) {
  return <div>
    <div className="pm-md-row">
      <span className="pm-bento-muted">{label}</span>
      <div className="pm-progress-bar">
        {segs.map(([n, c], i) => <i key={i} style={{ width: `${total ? n / total * 100 : 0}%`, background: c }}/>)}
      </div>
      <span className="pm-bento-m">{total}</span>
    </div>
  </div>
}

/* ---------- 3. projectScale 项目状态·规模（逐项目明细） ---------- */
const projectScale: WidgetDescriptor = {
  type: 'projectScale',
  name: '项目状态 · 规模',
  category: 'list',
  defaultW: 4, defaultH: 4, minW: 3, minH: 2,
  requiredSources: ['projects', 'tasks', 'milestones', 'riskIssues'],
  defaultConfig: {},
  render({ data, actions }) {
    return <div className="pm-bento-card">
      <div className="pm-bento-label">项目状态 · 规模
        <span className="pm-sr-only">逐项目明细</span>
        <span className="pm-bento-m">{data.projects.length} 个项目</span>
      </div>
      <div className="pm-board-projects">
        {data.projects.map(p => {
          const tasks = data.tasks.filter(t => t.projectId === p.id)
          const ms = data.milestones.filter(m => m.projectId === p.id)
          const risks = data.riskIssues.filter(r => r.projectId === p.id && r.status !== 'closed').length
          return <button key={p.id} type="button" className="pm-board-project" data-pick-project={p.id}
            onClick={() => actions.pickProject(p.id)}>
            <span className="pm-board-project-name"><span className="pm-board-project-text" title={p.name}>{p.name}</span>
              <span className={`pm-bento-pill pm-bento-pill-st-${p.status}`}>{projectStatusLabel(p.status)}</span>
            </span>
            <span className="pm-bento-m pm-bento-right">任务 {tasks.length} · 里程 {ms.length} · 风险 {risks}</span>
          </button>
        })}
        {data.projects.length === 0 && <div className="pm-bento-faint">暂无项目数据。</div>}
      </div>
    </div>
  },
}

function projectStatusLabel(s: string): string {
  return projectStatusLabels[s as keyof typeof projectStatusLabels] ?? s
}

/* ---------- 4. objectiveProgress 客观进度·清单 ---------- */
const objectiveProgress: WidgetDescriptor = {
  type: 'objectiveProgress',
  name: '客观进度 · 清单',
  category: 'progress',
  defaultW: 4, defaultH: 4, minW: 3, minH: 2,
  requiredSources: ['tasks'],
  defaultConfig: {},
  render({ data }) {
    const progressMap = deriveProgressMap(data.tasks)
    const rows = data.tasks
      .filter(t => t.checklist && t.checklist.length > 0 && t.status !== 'done')
      .slice(0, 5)
    const doneChecklist = data.tasks.filter(t => t.checklist && t.checklist.length > 0 && t.status === 'done').length
    const noChecklist = data.tasks.filter(t => !t.checklist || t.checklist.length === 0).length
    return <div className="pm-bento-card">
      <div className="pm-bento-label">客观进度 · 清单<span className="pm-bento-m">清单派生</span></div>
      <div className="pm-obj-list">
        {rows.map(t => {
          const p = progressMap.get(t.id)
          const frac = p && p.checklist ? p.checklist.checked / p.checklist.total : null
          const pct = clampProgress(frac ? Math.round(frac * 100) : 0)
          const color = pct >= 100 ? TONE.done : pct < 50 ? TONE.blocked : TONE.done
          return <div key={t.id} className="pm-obj-row">
            <div className="pm-obj-head"><span><span className={taskCodeLabel(t).missing ? 'pm-bento-code-missing' : ''}>{taskCodeLabel(t).text}</span> {t.title} · {t.assignee || '未分配'}</span><span className="pm-bento-m">{pct}%</span></div>
            <div className="pm-pbar"><i style={{ width: `${pct}%`, background: color }}/></div>
          </div>
        })}
        {rows.length === 0 && <div className="pm-bento-faint">暂无带清单的进行中任务。</div>}
      </div>
      <div className="pm-bento-foot">已完成 {doneChecklist} 项均 100%；其余 {noChecklist} 项无清单，不估算。</div>
    </div>
  },
}

/* ---------- 5. peopleLoad 成员负载 ---------- */
const peopleLoad: WidgetDescriptor = {
  type: 'peopleLoad',
  name: '成员负载',
  category: 'progress',
  defaultW: 8, defaultH: 3, minW: 4, minH: 2,
  requiredSources: ['tasks', 'projects'],
  defaultConfig: {},
  render({ data, onLink, linkage }) {
    // 总览成员负载卡：按「全部任务（含已完成）」4 状态分段。
    // 注意：PeopleView / verify-people-load 的 open-only 口径在 panel.tsx 保持不动。
    const rows = new Map<string, { display: string, done: number, progress: number, blocked: number, todo: number }>()
    for (const t of data.tasks) {
      const key = (t.assignee || '').trim()
      if (!key) continue
      let r = rows.get(key)
      if (!r) { r = { display: key, done: 0, progress: 0, blocked: 0, todo: 0 }; rows.set(key, r) }
      if (t.status === 'done') r.done++
      else if (t.status === 'in_progress') r.progress++
      else if (t.status === 'blocked') r.blocked++
      else r.todo++
    }
    const people = [...rows.values()].sort((a, b) => (b.done + b.progress + b.blocked + b.todo) - (a.done + a.progress + a.blocked + a.todo)).slice(0, 6)
    const max = Math.max(1, ...people.map(p => p.done + p.progress + p.blocked + p.todo))
    return <div className="pm-bento-card">
      <div className="pm-bento-label">成员负载<span className="pm-bento-m">同刻度 MAX {max}</span></div>
      <div className="pm-ppl-grid">
        {people.map(p => {
          const segs: Array<[number, string]> = [
            [p.done, TONE.done],
            [p.progress, TONE.progress],
            [p.blocked, TONE.blocked],
            [p.todo, TONE.todo],
          ]
          const total = p.done + p.progress + p.blocked + p.todo
          const active = linkage?.assignee === p.display
          return <div key={p.display}
            className={`pm-barrow ${onLink ? 'pm-linkable' : ''} ${active ? 'pm-link-on' : ''}`}
            data-person-key={p.display}
            onClick={() => onLink && onLink('assignee', p.display)}>
            <span className="pm-ppl-name">{p.display}</span>
            <div className="pm-stacked">
              {segs.map(([n, c], i) => n > 0 && <i key={i} style={{ width: `${n / max * 100}%`, background: c }}/>)}
            </div>
            <span className="pm-bento-m">{total}</span>
          </div>
        })}
        {people.length === 0 && <div className="pm-bento-faint">目前所有人都没有任务。</div>}
      </div>
      <div className="pm-bento-legend">
        <span><i style={{ background: TONE.done }}/>完成</span>
        <span><i style={{ background: TONE.progress }}/>进行</span>
        <span><i style={{ background: TONE.blocked }}/>阻塞</span>
        <span><i style={{ background: TONE.todo }}/>待办</span>
      </div>
    </div>
  },
}

/* ---------- 6. riskMatrix 风险矩阵 ---------- */
const riskMatrix: WidgetDescriptor = {
  type: 'riskMatrix',
  name: '风险矩阵',
  category: 'overview',
  defaultW: 4, defaultH: 4, minW: 3, minH: 3,
  requiredSources: ['riskIssues'],
  defaultConfig: {},
  render({ data, actions }) {
    const risks = data.riskIssues.filter(r => r.type === 'risk' && r.status !== 'closed')
    // 3x3：行=影响（高在顶），列=概率（低在左）
    const probs = ['low', 'medium', 'high']
    const impacts = ['high', 'medium', 'low']
    return <div className="pm-bento-card">
      <div className="pm-bento-label">风险矩阵<span className="pm-bento-m">只 risk</span></div>
      <div className="pm-matrix">
        <span/>{probs.map(p => <span key={p} className="pm-ax">{({ low: '低', medium: '中', high: '高' } as Record<string,string>)[p]}</span>)}
        {impacts.map(imp => (
          <React.Fragment key={imp}>
            <span className="pm-ax">{({ high: '高', medium: '中', low: '低' } as Record<string,string>)[imp]}</span>
            {probs.map(pr => {
              const cell = risks.filter(r => r.probability === pr && r.impact === imp)
              const heat = heatLevel(pr, imp)
              return <div key={pr} className="pm-mcell" style={{ background: `color-mix(in srgb, var(--pm-st-progress) ${Math.round(heat * 100)}%, transparent)` }}>
                {cell[0] && <button type="button" className="pm-mdot" data-open-record data-open-type="risk" data-open-id={cell[0].id}
                  onClick={() => actions.openRecord(cell[0]!.projectId, 'risk', cell[0]!.id)}>{cell[0].id}</button>}
              </div>
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  },
}

function heatLevel(pr: string, imp: string): number {
  const order = { low: 0, medium: 1, high: 2 }
  const score = (order[pr as keyof typeof order] ?? 0) + (order[imp as keyof typeof order] ?? 0)
  return [0.03, 0.06, 0.1, 0.16, 0.24, 0.35, 0.5, 0.65, 0.85][score] ?? 0.05
}

/* ---------- 7. weeklyPlan 未来按周计划 ---------- */
const weeklyPlan: WidgetDescriptor = {
  type: 'weeklyPlan',
  name: '未来按周计划',
  category: 'progress',
  defaultW: 8, defaultH: 4, minW: 4, minH: 3,
  requiredSources: ['tasks', 'milestones', 'deliverables'],
  defaultConfig: {},
  render({ data }) {
    const today = todayIso()
    // 未来 7 周：每柱 = 未来任务(dueDate) + 里程碑(targetDate) + 交付物(dueDate) 总数。
    const buckets: number[] = new Array(7).fill(0)
    const addDate = (iso: string) => {
      const days = Math.round((Date.parse(iso) - Date.parse(today)) / 86400000)
      const w = Math.floor(days / 7)
      if (w >= 0 && w < 7) buckets[w]++
    }
    data.tasks.forEach(t => { if (t.status !== 'done' && t.dueDate && t.dueDate >= today) addDate(t.dueDate) })
    data.milestones.forEach(m => { if (m.targetDate && m.targetDate >= today) addDate(m.targetDate) })
    data.deliverables.forEach(d => { if (d.dueDate && d.dueDate >= today) addDate(d.dueDate) })
    const overdue = data.tasks.filter(t => isTaskOverdue(t, today))
    const od = overdue[0]
    const max = Math.max(1, ...buckets)
    const W = 720, H = 150, base = 120, bw = 30
    return <div className="pm-bento-card">
      <div className="pm-bento-label">未来按周计划
        {od && <span className="pm-bento-pill pm-bento-pill-overdue" title={od.dueDate ?? undefined}>逾期 {taskCodeLabel(od).text} · 应 {od.dueDate}</span>}
      </div>
      <svg width="100%" height="150" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="未来按周任务数">
        {buckets.map((n, i) => {
          const x = 55 + i * 100
          const h = n / max * 90
          return <g key={i}>
            {n > 0 && <rect x={x} y={base - h} width={bw} height={h} rx="4" fill={TONE.progress}/>}
            <text x={x + bw / 2} y={base + 8} textAnchor="middle" fontSize="10" fill="var(--pm-muted)">W{i + 1}</text>
            <text x={x + bw / 2} y={base - h - 5} textAnchor="middle" fontSize="10" fill="var(--pm-ink)">{n}</text>
          </g>
        })}
      </svg>
    </div>
  },
}

/* ---------- 8. recordList 通用记录列表（数据源由 config.entity 决定） ---------- */
const recordList: WidgetDescriptor<WidgetConfig> = {
  type: 'recordList',
  name: '记录列表',
  category: 'list',
  addable: true,
  defaultW: 4, defaultH: 5, minW: 3, minH: 3,
  requiredSources: ['tasks'],
  defaultConfig: { entity: 'tasks', projectScope: 'all', filters: [], sort: { field: 'date', dir: 'asc' }, numberFormat: 'int' },
  render({ data, config, actions, linkage }) {
    const entity = (config.entity ?? 'tasks') as WidgetEntity
    const rows = selectEntity(data, entity)
    // raw 记录用于按字段名过滤（与 rows 同序）。
    const rawKey: WidgetEntity = entity
    const rawList: Array<Record<string, unknown>> = rawListFor(data, rawKey)
    const filtered = applyFilter(data, entity, rows, rawList, config.projectScope ?? 'all', config.filters)
    // P2-① 联动叠加：按 dim 在 raw 记录上过滤，与卡片自身 config 筛选取交集。
    const linkageIds = linkage ? new Set(
      rawList
        .filter(r =>
          (!linkage.assignee || String(r.assignee ?? '') === linkage.assignee) &&
          (!linkage.status || String(r.status ?? '') === linkage.status) &&
          (!linkage.project || String(r.projectId ?? '') === linkage.project))
        .map(r => String(r.id)),
    ) : null
    const linked = linkageIds ? filtered.filter(r => linkageIds.has(r.id)) : filtered
    const sorted = applySort(linked, config.sort)
    const title = config.title ?? ENTITY_LABEL[entity]
    const showPill = config.show?.pill !== false
    const showDate = config.show?.date !== false
    const maxItems = typeof config.maxItems === 'number' ? config.maxItems : 8
    const compact = config.density === 'compact'
    return <div className={`pm-bento-card ${compact ? 'pm-bento-compact' : ''}`}>
      <div className="pm-bento-label">{title}<span className="pm-bento-m">{sorted.length} 条</span></div>
      <div className="pm-rec-list">
        {sorted.slice(0, maxItems).map(r => (
          <button key={r.id} type="button" className="pm-rec" data-open-record data-open-type={r.recordType} data-open-id={r.id}
            onClick={() => actions.openRecord(r.projectId, r.recordType, r.id)}>
            <span className="pm-rec-title">{r.title}</span>
            {showPill && r.status && <span className="pm-bento-pill">{taskStatusLabels[r.status as keyof typeof taskStatusLabels] ?? r.status}</span>}
            {showDate && <span className="pm-bento-m" title={r.date ?? undefined}>{r.date?.slice(5) ?? '—'}</span>}
          </button>
        ))}
        {sorted.length === 0 && <div className="pm-bento-faint">暂无符合条件的记录。</div>}
      </div>
    </div>
  },
}

const ENTITY_LABEL: Record<WidgetEntity, string> = {
  projects: '项目', tasks: '任务', milestones: '里程碑', riskIssues: '风险/问题',
  deliverables: '交付物', meetings: '会议', reports: '汇报',
}

export function rawListFor(data: Snapshot, entity: WidgetEntity): Array<Record<string, unknown>> {
  switch (entity) {
    case 'tasks': return data.tasks as unknown as Array<Record<string, unknown>>
    case 'milestones': return data.milestones as unknown as Array<Record<string, unknown>>
    case 'riskIssues': return data.riskIssues as unknown as Array<Record<string, unknown>>
    case 'deliverables': return data.deliverables as unknown as Array<Record<string, unknown>>
    case 'meetings': return data.meetings as unknown as Array<Record<string, unknown>>
    case 'reports': return data.reports as unknown as Array<Record<string, unknown>>
    case 'projects': return data.projects as unknown as Array<Record<string, unknown>>
  }
}

/* ---------- 9. overdueSoon 逾期/临期 ---------- */
const overdueSoon: WidgetDescriptor<WidgetConfig> = {
  type: 'overdueSoon',
  name: '逾期 / 临期',
  category: 'overview',
  addable: true,
  defaultW: 4, defaultH: 5, minW: 3, minH: 3,
  requiredSources: ['tasks'],
  defaultConfig: { projectScope: 'all' },
  render({ data, actions }) {
    const today = todayIso()
    // 候选 = 未完成（status!=='done' 且 progress<100）且有截止；逾期走 isTaskOverdue 谓词，
    // 临期 = 今天起 7 天内到期；其余丢弃。
    const rows = data.tasks
      .filter(t => t.dueDate && t.status !== 'done' && (t.progress ?? 0) < 100)
      .map(t => ({
        t, tone: isTaskOverdue(t, today) ? TONE.overdue : t.dueDate! <= addDays(today, 7) ? TONE.due : null,
      }))
      .filter(r => r.tone)
      .sort((a, b) => (a.t.dueDate! < b.t.dueDate! ? -1 : 1))
      .slice(0, 8)
    return <div className="pm-bento-card">
      <div className="pm-bento-label">逾期 / 临期<span className="pm-bento-m">{rows.length} 项</span></div>
      <div className="pm-attn-list">
        {rows.map(({ t, tone }) => (
          <button key={t.id} type="button" className="pm-attn" data-open-record data-open-type="task" data-open-id={t.id}
            onClick={() => actions.openRecord(t.projectId, 'task', t.id)}>
            <i style={{ background: tone ?? TONE.due }}/>
            <span><b className={taskCodeLabel(t).missing ? 'pm-bento-code-missing' : ''}>{taskCodeLabel(t).text}</b> · {t.title}</span>
            <span className="pm-bento-faint">{t.assignee || '未分配'}</span>
            <span className="pm-attn-arr" title={t.dueDate}>应 {t.dueDate} ›</span>
          </button>
        ))}
        {rows.length === 0 && <div className="pm-bento-faint">没有逾期或临期任务。</div>}
      </div>
    </div>
  },
}

/* ---------- 10. kpiMetric 单指标计数 ---------- */
const kpiMetric: WidgetDescriptor<WidgetConfig> = {
  type: 'kpiMetric',
  name: 'KPI 指标',
  category: 'kpi',
  addable: true,
  defaultW: 3, defaultH: 2, minW: 2, minH: 2,
  requiredSources: ['tasks'],
  defaultConfig: { entity: 'tasks', projectScope: 'all', filters: [] },
  render({ data, config, evaluateFormula }) {
    const entity = (config.entity ?? 'tasks') as WidgetEntity
    const rows = selectEntity(data, entity)
    const rawList = rawListFor(data, entity)
    const filtered = applyFilter(data, entity, rows, rawList, config.projectScope ?? 'all', config.filters)
    let display: string
    if (typeof config.formula === 'string' && config.formula.trim()) {
      if (!evaluateFormula) {
        return <div className="pm-bento-card">
          <div className="pm-bento-label">{config.title ?? ENTITY_LABEL[entity]}</div>
          <div className="pm-kpi-big pm-kpi-err">…</div>
        </div>
      }
      const r = evaluateFormula(config.formula, { rows: filtered as unknown as Record<string, unknown>[], today: todayIso() })
      if (!r.ok) {
        return <div className="pm-bento-card">
          <div className="pm-bento-label">{config.title ?? ENTITY_LABEL[entity]}</div>
          <div className="pm-kpi-big pm-kpi-err">公式错误</div>
          <div className="pm-bento-foot">{r.error.message}</div>
        </div>
      }
      display = config.numberFormat === 'pct' && typeof r.value === 'number'
        ? `${clampProgress(Math.round(r.value))}%`
        : String(r.value)
    } else {
      const count = filtered.length
      display = config.numberFormat === 'pct'
        ? `${Math.round(count / Math.max(1, rows.length) * 100)}%`
        : String(count)
    }
    return <div className="pm-bento-card">
      <div className="pm-bento-label">{config.title ?? ENTITY_LABEL[entity]}</div>
      <div className="pm-kpi-big">{display}</div>
      {config.subtitle && <div className="pm-bento-foot">{config.subtitle}</div>}
    </div>
  },
}

/* ---------- 10b. formulaCard 公式卡（以公式为核心） ---------- */
const formulaCard: WidgetDescriptor<WidgetConfig> = {
  type: 'formulaCard',
  name: '公式指标',
  category: 'kpi',
  addable: true,
  defaultW: 3, defaultH: 2, minW: 2, minH: 2,
  requiredSources: ['tasks'],
  defaultConfig: { entity: 'tasks', projectScope: 'all', filters: [], formula: '', numberFormat: 'int', title: '公式指标' },
  render({ data, config, evaluateFormula }) {
    const entity = (config.entity ?? 'tasks') as WidgetEntity
    const rows = selectEntity(data, entity)
    const rawList = rawListFor(data, entity)
    const filtered = applyFilter(data, entity, rows, rawList, config.projectScope ?? 'all', config.filters)
    const f = typeof config.formula === 'string' ? config.formula : ''
    if (!f.trim()) {
      return <div className="pm-bento-card">
        <div className="pm-bento-label">{config.title ?? '公式指标'}</div>
        <div className="pm-kpi-big">—</div>
        <div className="pm-bento-foot">在右侧「公式」tab 填写公式</div>
      </div>
    }
    if (!evaluateFormula) {
      return <div className="pm-bento-card">
        <div className="pm-bento-label">{config.title ?? '公式指标'}</div>
        <div className="pm-kpi-big pm-kpi-err">…</div>
      </div>
    }
    const r = evaluateFormula(f, { rows: filtered as unknown as Record<string, unknown>[], today: todayIso() })
    if (!r.ok) {
      return <div className="pm-bento-card">
        <div className="pm-bento-label">{config.title ?? '公式指标'}</div>
        <div className="pm-kpi-big pm-kpi-err">公式错误</div>
        <div className="pm-bento-foot">{r.error.message}</div>
      </div>
    }
    const display = config.numberFormat === 'pct' && typeof r.value === 'number'
      ? `${clampProgress(Math.round(r.value))}%`
      : String(r.value)
    return <div className="pm-bento-card">
      <div className="pm-bento-label">{config.title ?? '公式指标'}</div>
      <div className="pm-kpi-big">{display}</div>
      {config.subtitle && <div className="pm-bento-foot">{config.subtitle}</div>}
    </div>
  },
}

/* ---------- 11. statusRing 任务状态环 ---------- */
const statusRing: WidgetDescriptor<WidgetConfig> = {
  type: 'statusRing',
  name: '任务状态环',
  category: 'overview',
  addable: true,
  defaultW: 4, defaultH: 3, minW: 3, minH: 3,
  requiredSources: ['tasks'],
  defaultConfig: {},
  render({ data }) {
    const order: Array<[string, number, string]> = [
      ['完成', data.tasks.filter(t => t.status === 'done').length, TONE.done],
      ['进行', data.tasks.filter(t => t.status === 'in_progress').length, TONE.progress],
      ['阻塞', data.tasks.filter(t => t.status === 'blocked').length, TONE.blocked],
      ['待办', data.tasks.filter(t => t.status === 'todo').length, TONE.todo],
    ]
    const total = Math.max(1, order.reduce((s, [, n]) => s + n, 0))
    let acc = 0
    const R = 46, C = 2 * Math.PI * R
    return <div className="pm-bento-card">
      <div className="pm-bento-label">任务状态环</div>
      <div className="pm-ring-wrap">
        <svg width="110" height="110" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--pm-line)" strokeWidth="11"/>
          {order.map(([label, n, color]) => {
            if (!n) return null
            const frac = n / total
            const el = <circle key={label} cx="60" cy="60" r={R} fill="none" stroke={color} strokeWidth="11"
              strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acc * C} transform="rotate(-90 60 60)"/>
            acc += frac
            return el
          })}
        </svg>
        <div className="pm-ring-legend">
          {order.map(([label, n, color]) => <div key={label} className="pm-ring-leg"><i style={{ background: color }}/>{label} <b>{n}</b></div>)}
        </div>
      </div>
    </div>
  },
}

/* ---------- 13. completionTrend 完成历史趋势（纯真实 completedDate，诚实空态） ---------- */
const completionTrend: WidgetDescriptor<WidgetConfig> = {
  type: 'completionTrend',
  name: '完成历史趋势',
  category: 'progress',
  addable: true,
  defaultW: 6, defaultH: 4, minW: 4, minH: 3,
  requiredSources: ['tasks'],
  defaultConfig: { title: '完成历史趋势' },
  render({ data, config }) {
    // P2 修复：按卡片 projectScope 过滤任务后再统计，否则空项目仍显示全量趋势。
    const scopedTasks = config.projectScope && config.projectScope !== 'all'
      ? (data.tasks || []).filter(t => t.projectId === config.projectScope)
      : (data.tasks || [])
    const hist = buildCompletionHistory(scopedTasks as unknown as Array<{ completedDate?: string | null }>, { weeks: 8 })
    const title = config.title ?? '完成历史趋势'
    // SVG 几何。
    const W = 320, H = 120, padL = 24, padR = 12, padT = 12, padB = 20
    const iw = W - padL - padR, ih = H - padT - padB
    const n = hist.weeks.length
    const maxCompleted = Math.max(1, ...hist.weeks.map(w => w.completed))
    const maxCum = Math.max(1, ...hist.weeks.map(w => w.cumulative))
    const bw = iw / n * 0.5
    const bx = (i: number) => padL + (iw / n) * i + (iw / n - bw) / 2
    const barH = (c: number) => c / maxCompleted * ih
    const cx = (i: number) => padL + (iw / n) * i + iw / n / 2
    const cy = (cum: number) => padT + ih - (cum / maxCum) * ih
    const linePts = hist.weeks.map((w, i) => `${cx(i)},${cy(w.cumulative)}`).join(' ')
    return <div className="pm-bento-card">
      <div className="pm-bento-label">{title}<span className="pm-bento-m">近 {n} 周</span></div>
      {hist.empty
        ? <div className="pm-trend-empty">{hist.reason ?? '尚无真实完成日期数据'}</div>
        : <svg viewBox={`0 0 ${W} ${H}`} className="pm-trend-svg" role="img" aria-label="每周完成数与累计完成">
            {hist.weeks.map((w, i) => (
              <rect key={w.weekStart} x={bx(i)} y={padT + ih - barH(w.completed)} width={bw} height={barH(w.completed)}
                fill={TONE.done} rx={2}>
                <title>{`${w.weekStart} 完成 ${w.completed}`}</title>
              </rect>
            ))}
            <polyline points={linePts} fill="none" stroke={TONE.progress} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"/>
            {hist.weeks.map((w, i) => <circle key={'p' + w.weekStart} cx={cx(i)} cy={cy(w.cumulative)} r={2.4} fill={TONE.progress}/>)}
          </svg>}
    </div>
  },
}

/* ---------- 12. textNote 文本/备注 ---------- */
const textNote: WidgetDescriptor<WidgetConfig> = {
  type: 'textNote',
  name: '文本 / 备注',
  category: 'text',
  addable: true,
  defaultW: 4, defaultH: 2, minW: 2, minH: 1,
  requiredSources: [],
  defaultConfig: { title: '备注', body: '' },
  render({ config }) {
    const body = typeof config.body === 'string' ? config.body : ''
    return <div className="pm-bento-card">
      {config.title && <div className="pm-bento-label">{config.title}</div>}
      {body
        ? <MarkdownView source={body} className="pm-note-body" density="compact" />
        : <div className="pm-note-body">（空备注，在右侧配置面板编辑正文）</div>}
    </div>
  },
}

/* ---------- 13. divider 分隔线 ---------- */
const divider: WidgetDescriptor = {
  type: 'divider',
  name: '分隔线',
  category: 'text',
  addable: true,
  defaultW: 12, defaultH: 1, minW: 4, minH: 1,
  requiredSources: [],
  defaultConfig: {},
  render() {
    return <div className="pm-divider"><span/></div>
  },
}

/* ---------- Registry + 内置默认布局（坐标严格按方案 §4.2.1） ---------- */
export const WIDGET_REGISTRY: Map<string, WidgetDescriptor> = new Map(
  [completionHero, milestoneDeliverable, projectScale, objectiveProgress, peopleLoad, riskMatrix, weeklyPlan,
    recordList, overdueSoon, kpiMetric, formulaCard, statusRing, completionTrend, textNote, divider, queueCard]
    .map(d => [d.type, d]),
)

/** 卡片目录（纯数据）：供编辑器异步块的卡片库/添加卡片使用，避免编辑器块反向 import 渲染实现。 */
export interface WidgetCatalogEntry {
  type: string
  name: string
  category: WidgetDescriptor['category']
  addable?: boolean
  disabled?: boolean
  defaultW: number
  defaultH: number
  minW: number
  minH: number
  requiredSources: WidgetDescriptor['requiredSources']
  defaultConfig: WidgetConfig
}
export const WIDGET_CATALOG: WidgetCatalogEntry[] =
  [...WIDGET_REGISTRY.values()].map(d => ({
    type: d.type, name: d.name, category: d.category, addable: d.addable, disabled: d.disabled,
    defaultW: d.defaultW, defaultH: d.defaultH, minW: d.minW, minH: d.minH,
    requiredSources: d.requiredSources, defaultConfig: d.defaultConfig,
  }))

/** 已知类型集合（registry 同源）：直接迭代 Map.keys，禁止 Object.keys(Map)（恒为 []）。 */
export function knownWidgetTypeSet(): Set<string> {
  return new Set(WIDGET_REGISTRY.keys())
}

/** 卡片库抽屉分组顺序。 */
export const DRAWER_GROUPS: Array<{ key: 'overview' | 'list' | 'kpi' | 'progress' | 'text'; label: string }> = [
  { key: 'overview', label: '概览' },
  { key: 'progress', label: '进度' },
  { key: 'list', label: '列表' },
  { key: 'kpi', label: '指标' },
  { key: 'text', label: '内容' },
]

export { FIELD_WHITELIST }

export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 1,
  scope: 'global',
  widgets: [
    { i: 'w-hero', type: 'completionHero', config: {}, layout: { i: 'w-hero', x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 6 } },
    { i: 'w-ms-deliver', type: 'milestoneDeliverable', config: {}, layout: { i: 'w-ms-deliver', x: 4, y: 0, w: 8, h: 3, minW: 4, minH: 2 } },
    { i: 'w-scale', type: 'projectScale', config: {}, layout: { i: 'w-scale', x: 4, y: 3, w: 4, h: 4, minW: 3, minH: 2 } },
    { i: 'w-obj', type: 'objectiveProgress', config: {}, layout: { i: 'w-obj', x: 8, y: 3, w: 4, h: 4, minW: 3, minH: 2 } },
    { i: 'w-load', type: 'peopleLoad', config: {}, layout: { i: 'w-load', x: 4, y: 7, w: 8, h: 3, minW: 4, minH: 2 } },
    { i: 'w-risk', type: 'riskMatrix', config: {}, layout: { i: 'w-risk', x: 0, y: 10, w: 4, h: 4, minW: 3, minH: 3 } },
    { i: 'w-week', type: 'weeklyPlan', config: {}, layout: { i: 'w-week', x: 4, y: 10, w: 8, h: 4, minW: 4, minH: 3 } },
    { i: 'w-queue', type: 'queueCard', config: {}, layout: { i: 'w-queue', x: 0, y: 14, w: 4, h: 5, minW: 3, minH: 3 } },
  ],
}

export type { WidgetInstance }
export type { Task }
