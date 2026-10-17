/**
 * P1-7 副驾内嵌建议层 · 只读诊断引擎（确定性、纯函数、无 I/O）。
 *
 * 不依赖大模型实时返回：诊断口径复用全项目唯一的谓词与设置（isTaskOverdue /
 * blockingPredecessors / loadOverloadThreshold），保证气泡稳定、可复算、可关联到
 * 具体记录。大模型的开放式问答仍在右侧面板进行，二者互补。
 *
 * 所有诊断只展示、绝不写盘；用户可逐条关闭（关闭态在前端）。
 */
import { localTodayIso, isTaskOverdue } from './derived.js'
import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from './settings.js'

/** 诊断所需的最小任务结构（snapshot / 完整 Task 均可满足），避免绑定完整 Task 类型。 */
export interface SuggestionTask {
  id: string
  code: string
  parentId?: string | null
  title: string
  status?: string
  assignee?: string | null
  progress?: number | null
  startDate?: string | null
  dueDate?: string | null
  predecessorIds?: string[]
}

export type DiagnosisKind = 'blocked' | 'overdue' | 'overload' | 'unassigned' | 'unscheduled'

export interface DiagnosisBubble {
  /** 唯一 id（kind + targetId）。 */
  id: string
  kind: DiagnosisKind
  /** 气泡插入到哪条任务之后（任务 id）。 */
  targetId: string
  /** 气泡左侧标签文字。 */
  tag: string
  /** 粗体标题。 */
  title: string
  /** 详细说明。 */
  text: string
}

export interface SuggestionInput {
  tasks: SuggestionTask[]
  settings?: Partial<ProjectSettings>
  today?: string
}

/** 两个本地日历日相差天数（to - from）。 */
function dayDiff(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime()
  const b = new Date(`${to}T00:00:00`).getTime()
  return Math.round((b - a) / 86400000)
}

/**
 * 生成只读诊断气泡（按严重度排序：阻塞 > 逾期 > 过载 > 未指派 > 未排期）。
 * 每个目标任务行最多挂一个气泡，避免同一行叠多条。
 */
export function buildDiagnosis(input: SuggestionInput): DiagnosisBubble[] {
  const today = input.today ?? localTodayIso()
  const settings: ProjectSettings = { ...DEFAULT_PROJECT_SETTINGS, ...(input.settings ?? {}) }
  // 只诊断叶子任务（父任务是聚合，诊断到具体执行项）。
  const leaves = input.tasks.filter(t => t.parentId)
  const byId = new Map<string, SuggestionTask>(input.tasks.map(t => [t.id, t]))
  const bubbles: DiagnosisBubble[] = []
  const usedTargets = new Set<string>()

  const push = (kind: DiagnosisKind, targetId: string, title: string, text: string): void => {
    if (usedTargets.has(targetId)) return
    usedTargets.add(targetId)
    bubbles.push({ id: `diag-${kind}-${targetId}`, kind, targetId, tag: 'AI 只读诊断 · 不落库', title, text })
  }

  // 1. 阻塞任务（含未完成前置）。
  for (const t of leaves.filter(t => t.status === 'blocked')) {
    const blockedBy = (t.predecessorIds ?? [])
      .map(id => byId.get(id))
      .filter((p): p is SuggestionTask => !!p && p.status !== 'done')
    const text = blockedBy.length
      ? `前置 ${blockedBy.map(p => p.code).join('、')}（${blockedBy.map(p => p.title).join('；')}）未完成，先解除依赖再推进。`
      : '任务被阻塞，确认阻塞原因与恢复条件后再推进。'
    push('blocked', t.id, `${t.code} 已阻塞`, text)
  }

  // 2. 逾期任务。
  for (const t of leaves.filter(t => isTaskOverdue(t, today))) {
    const n = dayDiff(t.dueDate ?? today, today)
    push(
      'overdue', t.id,
      `${t.code} 已逾期 ${n} 天`,
      `截止 ${t.dueDate}${t.assignee ? `，负责人 ${t.assignee}` : ''}，尽快处理或调整排期。`,
    )
  }

  // 3. 过载人员（open 任务数达到阈值）。
  const open = leaves.filter(t => t.status !== 'done')
  const loadByPerson = new Map<string, SuggestionTask[]>()
  for (const t of open) {
    if (!t.assignee) continue
    const list = loadByPerson.get(t.assignee) ?? []
    list.push(t)
    loadByPerson.set(t.assignee, list)
  }
  for (const [person, list] of [...loadByPerson.entries()].sort((a, b) => b[1].length - a[1].length)) {
    if (list.length < settings.loadOverloadThreshold) continue
    const target = list.find(t => !usedTargets.has(t.id)) ?? list[0]
    const free = [...loadByPerson.entries()]
      .map(([p, l]) => ({ p, n: l.length }))
      .filter(x => x.n < settings.loadOverloadThreshold - 1)
      .sort((a, b) => a.n - b.n)[0]
    push(
      'overload', target.id,
      `${person} open ${list.length} 项已达过载阈值`,
      `建议把部分任务${free ? `改派给负载空闲的 ${free.p}` : '重新分配或拆分'}，是否调整由你决定。`,
    )
  }

  // 4. 未指派负责人（汇总）。
  const unassigned = open.filter(t => !t.assignee)
  if (unassigned.length) {
    const target = unassigned.find(t => !usedTargets.has(t.id)) ?? unassigned[0]
    push(
      'unassigned', target.id,
      `${unassigned.length} 个任务未指派负责人`,
      `涉及 ${unassigned.map(t => t.code).join('、')}，分配负责人后才能跟进闭环。`,
    )
  }

  // 5. 未排期（无开始/截止，汇总）。
  const unscheduled = open.filter(t => !t.startDate && !t.dueDate)
  if (unscheduled.length) {
    const target = unscheduled.find(t => !usedTargets.has(t.id)) ?? unscheduled[0]
    push(
      'unscheduled', target.id,
      `${unscheduled.length} 个任务未排期`,
      `涉及 ${unscheduled.map(t => t.code).join('、')}，设定开始/截止日期后才能跟踪。`,
    )
  }

  return bubbles
}

/** 诊断计数摘要（供右侧面板顶部统计）。 */
export function diagnosisCounts(bubbles: DiagnosisBubble[]): Record<DiagnosisKind, number> {
  const counts: Record<DiagnosisKind, number> = {
    blocked: 0, overdue: 0, overload: 0, unassigned: 0, unscheduled: 0,
  }
  for (const b of bubbles) counts[b.kind] += 1
  return counts
}
