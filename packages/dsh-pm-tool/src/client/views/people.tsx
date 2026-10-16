/**
 * 人员负载视图（重设计 v2 · dsh 主题对齐版）。
 *
 * 数据口径全部复用 core/people-load.ts `groupOpenTasksByAssignee`，本文件不手算负载：
 * - 每人分段堆叠条（逾期红 / 临期琥珀 / 进行中蓝 / 待办灰）由 row.tasks 的 bucket+status 精确互斥汇总。
 * - 排期泳道：在真实排期窗口（task start/due 推导）内画每人 open 任务条 + 今天线，不画历史趋势。
 * - 分布点图：每人 open 任务数 vs 中位数 / 过载阈值；预警从 overdue>0 与未分配置顶桶派生。
 *
 * 样式见 people.css，全部选择器 scope 在 .pm-pp-root 下；颜色只消费 panel.css 重映射的 dsh 变量。
 */
import { useMemo, useState } from 'react'
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock.mjs'
import CircleAlert from 'lucide-react/dist/esm/icons/circle-alert.mjs'
import CircleHelp from 'lucide-react/dist/esm/icons/circle-help.mjs'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.mjs'
import Users from 'lucide-react/dist/esm/icons/users.mjs'
import css from './people.css?raw'
import { groupOpenTasksByAssignee, normalizePerson, type PersonRow } from '../../core/people-load.js'
import { dateRange, daysFrom, taskDurationDays } from '../../core/gantt.js'
import { localTodayIso } from '../../core/derived.js'
import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from '../../core/settings.js'
import type { Project, Task, RiskIssue, View } from './types.js'

/** 角色映射仅用于展示（真实成员模型未接入）；未命中显示「团队成员」。 */
const ROLES: Record<string, string> = {
  '史冰冰': '项目负责人 · PM',
  '张三': '需求 / 产品经理',
  '李梦': 'UI 设计师',
  'ice': '前端开发',
  '王磊': '后端开发',
  '陈静': '测试工程师',
}

interface Seg { late: number, soon: number, prog: number, todo: number }

/** 由 row.tasks 的 bucket+status 精确互斥汇总，四者之和恰为 openTotal。 */
function segmentsOf(row: PersonRow): Seg {
  const seg: Seg = { late: 0, soon: 0, prog: 0, todo: 0 }
  for (const t of row.tasks) {
    if (t.bucket === 'overdue') seg.late += 1
    else if (t.bucket === 'due-soon') seg.soon += 1
    else if (t.status === 'in_progress') seg.prog += 1
    else seg.todo += 1
  }
  return seg
}

/** 行右侧状态 chip。 */
function rowTone(row: PersonRow, isUnassigned: boolean): { cls: string, text: string } {
  if (isUnassigned) return { cls: 'is-block', text: '需指派' }
  if (row.overdue > 0) return { cls: 'is-late', text: `逾期 ${row.overdue}` }
  if (row.p0 > 0) return { cls: 'is-block', text: `P0 ${row.p0}` }
  if (row.dueSoon > 0) return { cls: 'is-block', text: `临期 ${row.dueSoon}` }
  if (row.inProgress > 0) return { cls: 'is-prog', text: '负载中' }
  return { cls: 'is-todo', text: '正常' }
}

export function PeopleView(props: {
  project: Project
  tasks: Task[]
  riskIssues: RiskIssue[]
  /** #21 口径设置（缺省=默认）：临期窗口 + 过载阈值。 */
  settings?: ProjectSettings
  onOpenRecord: (projectId: string, type: string, id: string) => void
  onGotoView: (v: View) => void
}) {
  const { project, tasks, onOpenRecord } = props
  const settings = props.settings ?? DEFAULT_PROJECT_SETTINGS
  /** 过载阈值：open 任务数达到该值即视为过载（与分布点图阈值线一致），来自 #21 设置。 */
  const overloadThreshold = settings.loadOverloadThreshold
  const today = localTodayIso()
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  // ---- core 口径：负载报告（未分配置顶 people-load 已固定 people 序） ----
  const report = useMemo(
    () => groupOpenTasksByAssignee(tasks, [{ id: project.id, name: project.name }], { settings }),
    [tasks, project.id, project.name, settings],
  )

  // ---- 排期泳道：open 任务按归一 assignee 分组（与 core 同一归一函数） ----
  const byAssignee = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) {
      if (t.status === 'done' || (t.progress ?? 0) >= 100) continue
      const k = normalizePerson(t.assignee)
      const arr = m.get(k) ?? []
      arr.push(t)
      m.set(k, arr)
    }
    return m
  }, [tasks])

  // 时间轴：只吃 open 任务的真实起止；无日期任务不产生轴。
  const axis = useMemo(() => {
    const open = [...byAssignee.values()].flat()
    return dateRange(open)
  }, [byAssignee])

  const totalDays = axis ? Math.max(1, daysFrom(axis.end, axis.start)) : 1
  const pctOf = (iso: string) => `${(daysFrom(iso, axis!.start) / totalDays) * 100}%`
  const widthOf = (s: string, e: string) => `${(taskDurationDays(s, e) / totalDays) * 100}%`

  // 月份带：axis 内逐月切分。
  const monthBands = useMemo(() => {
    if (!axis) return [] as { label: string, leftPct: number, widthPct: number }[]
    const out: { label: string, leftPct: string, widthPct: string }[] = []
    const startT = Date.parse(axis.start)
    let cur = new Date(startT)
    while (Date.parse(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-01`) <= Date.parse(axis.end)) {
      const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1)
      const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      const sDays = daysFrom(mStart.toISOString().slice(0, 10), axis.start)
      const eDays = daysFrom(mEnd.toISOString().slice(0, 10), axis.start)
      out.push({
        label: `${cur.getMonth() + 1}月`,
        leftPct: `${(sDays / totalDays) * 100}%`,
        widthPct: `${(Math.max(1, eDays - sDays + 1) / totalDays) * 100}%`,
      })
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
    return out
  }, [axis, totalDays])

  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key); else next.add(key)
    return next
  })

  // 展示行：未分配置顶，随后 core 已按风险序排好的 people。
  const rows: { row: PersonRow, isUnassigned: boolean }[] = [
    ...(report.unassigned ? [{ row: report.unassigned, isUnassigned: true }] : []),
    ...report.people.map(row => ({ row, isUnassigned: false })),
  ]

  // ---- 分布点图数据 ----
  // 口径：中位/均值只对「已分配人员」计算，未分配桶不是一个人，只单独成点 + 预警条。
  const peopleValues = report.people.map(p => p.openTotal)
  const unassignedValue = report.unassigned ? report.unassigned.openTotal : 0
  const openSum = peopleValues.reduce((a, v) => a + v, 0) + unassignedValue

  // X 轴上限自适应：阈值、所有已分配人员 open、未分配桶 open 取最大值，向上取整到 2 的倍数再 +2 留余量，至少 8。
  const rawMax = Math.max(overloadThreshold, ...peopleValues, unassignedValue, 1)
  const maxX = Math.max(8, (Math.ceil((rawMax + 2) / 2) * 2))

  // 刻度按 maxX 自适应：0,2,4,…,maxX。
  const ticks: number[] = []
  for (let t = 0; t <= maxX; t += 2) ticks.push(t)

  // 中位/均值仅已分配人员。
  const sortedVals = [...peopleValues].sort((a, b) => a - b)
  const median = sortedVals.length ? (sortedVals.length % 2 ? sortedVals[(sortedVals.length - 1) / 2] : (sortedVals[sortedVals.length / 2 - 1] + sortedVals[sortedVals.length / 2]) / 2) : 0
  const avg = sortedVals.length ? sortedVals.reduce((a, v) => a + v, 0) / sortedVals.length : 0

  // 点：未分配置顶、随后 core 已按风险序排好的已分配人员。
  const dots = rows.map((r, i) => ({
    key: r.row.key, name: r.row.display, value: r.row.openTotal, isUnassigned: r.isUnassigned, top: 14 + i * 15,
  }))

  // 预警：逾期行 + 未分配置顶桶。
  const overdueRows = report.people.filter(r => r.overdue > 0)

  const empty = rows.length === 0

  const barSegs = (row: PersonRow) => {
    const seg = segmentsOf(row)
    const total = Math.max(1, row.openTotal)
    return [
      { cls: 'pp-s-late', n: seg.late },
      { cls: 'pp-s-block', n: seg.soon },
      { cls: 'pp-s-prog', n: seg.prog },
      { cls: 'pp-s-todo', n: seg.todo },
    ].filter(s => s.n > 0).map(s => ({ ...s, flexPct: (s.n / total) * 100 }))
  }

  const ganttBarsFor = (key: string) => {
    const list = byAssignee.get(key) ?? []
    return list
      .filter(t => t.startDate && t.dueDate)
      .map(t => {
        const late = t.dueDate! < today
        const soon = !late && t.dueDate && daysFrom(t.dueDate, today) <= report.withinDays
        const cls = late ? 'pp-gb-late' : t.status === 'in_progress' ? 'pp-gb-prog' : soon ? 'pp-gb-soon' : 'pp-gb-todo'
        return { id: t.id, title: `${t.code} ${t.title}`, cls, leftPct: pctOf(t.startDate!), widthPct: widthOf(t.startDate!, t.dueDate!) }
      })
  }
  const unscheduledCount = (key: string) => (byAssignee.get(key) ?? []).filter(t => !t.startDate || !t.dueDate).length

  return (
    <div className="pm-pp-root">
      <style>{css}</style>

      <div className="pp-head">
        <div>
          <h1>人员负载</h1>
          <div className="pp-sub">
            {project.name} · <b>{report.people.length + (report.unassigned ? 1 : 0)} 个分组</b>
            {' '}· open 任务 <b>{openSum}</b> 项
            {axis ? ` · 排期窗口 ${axis.start.slice(5)} → ${axis.end.slice(5)}` : ''} · 今天 {today.slice(5)}
          </div>
        </div>
        <div className="pp-chips">
          {overdueRows.length > 0 && (
            <span className="pm-chip is-late"><i className="pm-dot pp-dot-late" />逾期 {overdueRows.reduce((a, r) => a + r.overdue, 0)} 项 · {overdueRows.map(r => r.display).join(' / ')}</span>
          )}
          {report.unassigned && report.unassigned.openTotal > 0 && (
            <span className="pm-chip is-block"><i className="pm-dot pp-dot-block" />未分配 {report.unassigned.openTotal} 项</span>
          )}
        </div>
      </div>

      {/* A · 负载明细行 */}
      <section className="pp-card">
        <div className="pp-card-head">
          <h2>负载明细</h2>
          <span className="pp-note">分段 = 逾期 / 临期({report.withinDays}d) / 进行中 / 待办 · 点击行展开任务</span>
        </div>
        {empty ? (
          <div className="pp-empty"><CircleHelp size={16} /><span>暂无未完成任务，团队负载为空。</span></div>
        ) : (
          <div className="pp-rows">
            <div className="pp-colhead">
              <span>负责人 / 角色</span><span>负载构成</span><span className="pp-th-num">open</span><span>最近到期</span><span className="pp-th-num">状态</span>
            </div>
            {rows.map(({ row, isUnassigned }) => {
              const seg = barSegs(row)
              const tone = rowTone(row, isUnassigned)
              const isOpen = expanded.has(row.key)
              return (
                <div className={`pp-row${isUnassigned ? ' is-unassigned' : ''}${isOpen ? ' is-open' : ''}`} key={row.key}>
                  <button type="button" className="pp-row-main" onClick={() => toggle(row.key)} aria-expanded={isOpen}>
                    <div className="pp-who">
                      <span className={`pp-ava${isUnassigned ? ' is-un' : row.overdue > 0 ? ' is-late' : ''}`}>
                        {isUnassigned ? <CircleHelp size={14} /> : row.display.slice(0, 1)}
                      </span>
                      <span className="pp-who-txt">
                        <span className="pp-name">{row.display}</span>
                        <span className="pp-role">{isUnassigned ? '无负责人 · 需派工' : (ROLES[row.display] ?? '团队成员')}</span>
                      </span>
                    </div>
                    <span className="pp-bar" role="img" aria-label={`open ${row.openTotal}：逾期 ${row.overdue}，临期 ${row.dueSoon}，进行中 ${row.inProgress}`}>
                      {seg.map(s => <i key={s.cls} className={s.cls} style={{ width: `${s.flexPct}%` }} />)}
                    </span>
                    <span className="pp-open">{row.openTotal}<small> open</small></span>
                    <span className={`pp-due${row.dueSoon > 0 && !isUnassigned ? ' soon' : ''}`}>
                      {row.nextDue ? row.nextDue.slice(5) : '— 无排期'}
                    </span>
                    <span className={`pm-chip pp-badge ${tone.cls}`}>{tone.text}</span>
                    <ChevronRight size={14} className={`pp-chev${isOpen ? ' on' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="pp-tasks">
                      {row.tasks.length === 0 && <div className="pp-task-empty">无任务明细</div>}
                      {row.tasks.map(t => (
                        <button type="button" className="pp-task" key={t.id} onClick={() => onOpenRecord(project.id, 'task', t.id)}>
                          <span className="pp-task-code">{t.code || '—'}</span>
                          <span className="pp-task-title">{t.title}</span>
                          <span className={`pp-task-days${t.bucket === 'overdue' ? ' late' : ''}`}>
                            {t.bucket === 'overdue' ? `逾期 ${-(t.daysUntil ?? 0)} 天` : t.daysUntil !== null && t.daysUntil <= report.withinDays ? `${t.daysUntil} 天后到期` : '无近期到期'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 下半：B 排期泳道 + C 分布预警 */}
      <div className="pp-lower">
        <section className="pp-card pp-gantt">
          <div className="pp-card-head">
            <h2>排期负载</h2>
            <span className="pp-note">{axis ? `前向窗口 ${axis.start.slice(0, 7)} → ${axis.end.slice(0, 7)} · 今天 ${today.slice(5)}` : '任务暂无起止日期'}</span>
          </div>
          {!axis ? (
            <div className="pp-empty"><CalendarClock size={16} /><span>尚无带起止日期的 open 任务，无法绘制时间轴。</span></div>
          ) : (
            <>
              <div className="pp-g-body">
                <div className="pp-g-who">
                  <div className="pp-g-spacer" />
                  {rows.map(({ row, isUnassigned }) => (
                    <div className="pp-g-name" key={row.key}>
                      <i className={`pp-g-dot${isUnassigned ? ' is-un' : row.overdue > 0 ? ' is-late' : ''}`} />
                      {isUnassigned ? '未分配' : row.display}
                    </div>
                  ))}
                </div>
                <div className="pp-g-plot">
                  <div className="pp-g-months">
                    {monthBands.map((m, i) => (
                      <span key={i} className="pp-g-month" style={{ left: m.leftPct, width: m.widthPct }}>{m.label}</span>
                    ))}
                  </div>
                  {rows.map(({ row }) => (
                    <div className="pp-g-row" key={row.key}>
                      {ganttBarsFor(row.key).map(b => (
                        <span key={b.id} title={b.title} className={`pp-g-bar ${b.cls}`} style={{ left: b.leftPct, width: b.widthPct }} />
                      ))}
                      {unscheduledCount(row.key) > 0 && <span className="pp-g-unsched">无排期 ×{unscheduledCount(row.key)}</span>}
                    </div>
                  ))}
                  {today >= axis.start && today <= axis.end && (
                    <div className="pp-g-today" style={{ left: pctOf(today) }}><span>今天</span></div>
                  )}
                </div>
              </div>
              <div className="pp-g-legend">
                <span className="pp-lg"><i className="pp-sw is-prog" />进行中</span>
                <span className="pp-lg"><i className="pp-sw is-soon" />临期</span>
                <span className="pp-lg"><i className="pp-sw is-late" />逾期</span>
                <span className="pp-lg"><i className="pp-sw is-todo" />待办</span>
              </div>
            </>
          )}
        </section>

        <section className="pp-card pp-dist">
          <div className="pp-card-head">
            <h2>团队分布 · 过载预警</h2>
            <span className="pp-note">每人 open 任务数</span>
          </div>
          <div className="pp-dist-body">
            <div className="pp-dplot">
              <div className="pp-dline pp-dmed" style={{ left: `${(median / maxX) * 100}%` }}><span>中位 {median}</span></div>
              <div className="pp-dline pp-dthr" style={{ left: `${(overloadThreshold / maxX) * 100}%` }}><span>过载阈值 {overloadThreshold}</span></div>
              <div className="pp-daxis" />
              {ticks.map(v => (
                <span
                  key={v}
                  className="pp-dtick"
                  style={{ left: `${(v / maxX) * 100}%`, transform: v === 0 ? 'none' : v === maxX ? 'translateX(-100%)' : 'translateX(-50%)' }}
                >{v}</span>
              ))}
              {dots.map(v => {
                const xPct = (v.value / maxX) * 100
                // 边界钳制：右侧剩余空间不足时标签翻到点左侧，绝不溢出裁切。
                const flip = xPct >= 82
                return (
                  <span
                    key={v.key}
                    className={`pp-dot${flip ? ' flip' : ''}${v.isUnassigned ? ' is-un' : v.value >= overloadThreshold ? ' is-late' : v.value >= 3 ? ' is-prog' : ' is-todo'}`}
                    style={{ left: `${xPct}%`, top: `${v.top}px` }}
                  >{v.name} {v.value}</span>
                )
              })}
            </div>
            <div className="pp-dstats">
              <span>中位 <b>{median}</b></span>
              <span>均值 <b>{avg.toFixed(1)}</b></span>
              <span>阈值 <b>{overloadThreshold}</b></span>
              <span>open 合计 <b>{openSum}</b></span>
            </div>
          </div>
          <div className="pp-alerts">
            {overdueRows.map(r => (
              <div className="pp-alert is-late" key={r.key}>
                <CircleAlert size={14} className="pp-alert-ico" />
                <span><b>{r.display} · {r.overdue} 项逾期</b>：最近到期 {r.nextDue ?? '—'}，建议优先处理或分流。</span>
              </div>
            ))}
            {report.unassigned && report.unassigned.openTotal > 0 && (
              <div className="pp-alert is-block">
                <Users size={14} className="pp-alert-ico" />
                <span><b>未分配 · {report.unassigned.openTotal} 项 open</b>：无负责人，建议尽快派工，避免影响后续排期窗口。</span>
              </div>
            )}
            {overdueRows.length === 0 && !(report.unassigned && report.unassigned.openTotal > 0) && (
              <div className="pp-alert is-done">
                <CircleAlert size={14} className="pp-alert-ico" />
                <span>无逾期、无未分配任务，团队负载正常。</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
