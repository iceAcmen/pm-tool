/**
 * PROD-05：概览作战室派生（纯函数，无 React，可离线单测）。
 * 数据全部来自现有 snapshot 现算，不新增表。
 */

export interface WarTask {
  id: string
  projectId: string
  status?: string
  progress?: number
  dueDate?: string
}
export interface WarMilestone {
  id: string
  projectId: string
  status?: string
  targetDate?: string
}
export interface WarRisk {
  id: string
  projectId: string
  type?: string
  status?: string
  probability?: string | null
  impact?: string | null
  title?: string
}

const daysFrom = (date: string | undefined, today: string) =>
  date ? Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000) : null

/** 关键指标：任务总数/完成率/进行中/逾期任务/近期里程碑/未闭环风险。 */
export function computeKPI(
  tasks: WarTask[],
  milestones: WarMilestone[],
  riskIssues: WarRisk[],
  today: string,
  rangeDays = 7,
) {
  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done' || (t.progress ?? 0) >= 100).length
  const inProgress = tasks.filter(t => t.status === 'doing').length
  const overdueTasks = tasks.filter(t => t.status !== 'done' && (t.progress ?? 0) < 100
    && t.dueDate && (daysFrom(t.dueDate, today) ?? 1) < 0).length
  const upcomingMilestones = milestones.filter(m => m.status !== 'achieved'
    && (daysFrom(m.targetDate, today) ?? Infinity) >= 0
    && (daysFrom(m.targetDate, today) ?? Infinity) <= rangeDays).length
  const openRisks = riskIssues.filter(r => r.status !== 'closed').length
  return {
    total,
    doneRate: total ? Math.round((done / total) * 100) : 0,
    inProgress,
    overdueTasks,
    upcomingMilestones,
    openRisks,
  }
}

export interface AgendaItem {
  kind: 'task' | 'milestone'
  id: string
  projectId: string
  label: string
  days: number
  overdue: boolean
}

/** 近期议程：未完成的逾期/临期任务 + 未达成里程碑，按日期升序。 */
export function buildAgenda(
  tasks: WarTask[],
  milestones: WarMilestone[],
  today: string,
  rangeDays = 7,
): AgendaItem[] {
  const out: AgendaItem[] = []
  for (const t of tasks) {
    if (t.status === 'done' || (t.progress ?? 0) >= 100 || !t.dueDate) continue
    const d = daysFrom(t.dueDate, today)
    if (d === null) continue
    if (d < 0 || d <= rangeDays) {
      out.push({ kind: 'task', id: t.id, projectId: t.projectId, label: `任务到期 ${t.dueDate}`, days: d, overdue: d < 0 })
    }
  }
  for (const m of milestones) {
    if (m.status === 'achieved' || !m.targetDate) continue
    const d = daysFrom(m.targetDate, today)
    if (d === null) continue
    if (d < 0 || d <= rangeDays) {
      out.push({ kind: 'milestone', id: m.id, projectId: m.projectId, label: `里程碑 ${m.targetDate}`, days: d, overdue: d < 0 })
    }
  }
  return out.sort((a, b) => a.days - b.days)
}

const level = (v: string | null | undefined): 'low' | 'medium' | 'high' => {
  if (v === 'high' || v === 'critical') return 'high'
  if (v === 'medium') return 'medium'
  return 'low'
}

/** 风险矩阵归格：返回 {row,col}（low/medium/high，行=概率，列=影响）。 */
export function matrixCell(probability: string | null | undefined, impact: string | null | undefined) {
  return { row: level(probability), col: level(impact) }
}

/** 把未闭环风险分到 3x3 格子。 */
export function groupRiskMatrix(riskIssues: WarRisk[]) {
  const cells: Record<string, WarRisk[]> = {}
  for (const r of riskIssues) {
    if (r.status === 'closed') continue
    const { row, col } = matrixCell(r.probability, r.impact)
    const key = `${row}/${col}`
    ;(cells[key] ??= []).push(r)
  }
  return cells
}
