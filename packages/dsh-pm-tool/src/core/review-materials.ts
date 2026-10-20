/**
 * P2 X5 述职素材：只读聚合纯函数（零 I/O、零写、零随机、零墙钟）。
 *
 * 契约见 docs/design/deep-integration-v2-p2-dev.md §七：
 * 从任务（done/wrapped）、里程碑（achieved）、复盘草稿（known 行）按周期 [起始日期] [结束日期]
 * 过滤汇总，供周报/季报/晋升材料；同一数据可渲染 JSON 与 Markdown 述职稿。
 * 纪律：证据不足留白不编造；wrapped ≠ done（收尾条目单独标注，不计完成数）；本模块绝不写库。
 */
import { addDaysIso, localTodayIso } from './derived.js'

/** 周期默认窗口：未传起止时，取「今天往前 29 天」的 30 天滚动窗（含今天）。 */
export const DEFAULT_PERIOD_DAYS = 30

/** 结构化任务条目（done 或 wrapped；wrapped 单独标记，不进入 done 计数）。 */
export interface ReviewTaskItem {
  id: string
  title: string
  /** done=true 正式完成；wrapped=false 为「已收尾 · 非正式完成」。 */
  done: boolean
  /** 条目归属：done 正式完成 / wrapped 收尾（弃置/停办，非正式完成）。 */
  kind: 'done' | 'wrapped'
  progress: number
  dueDate: string | null
  /** 客观佐证链接（evidenceUrl），缺省为 null，不伪造。 */
  evidence: string | null
}

export interface ReviewMilestoneItem {
  id: string
  title: string
  achieved: true
  actualDate: string | null
}

export interface ReviewReflectionItem {
  id: string
  title: string
  sourceEvent: string
  /** 仅句级 known（已核）行；pending/blank 不入述职素材。 */
  knownLines: string[]
}

export interface ReviewMaterials {
  projectId: string
  period: { start: string, end: string }
  tasks: ReviewTaskItem[]
  milestones: ReviewMilestoneItem[]
  reflections: ReviewReflectionItem[]
  /** 量化结果（只从已收录条目计数，不补造）。 */
  counts: {
    doneTasks: number
    wrappedTasks: number
    achievedMilestones: number
    reflectionKnownLines: number
    /** done 任务平均进度（0..100）；无 done 条目为 null（证据不足，不是 0）。 */
    avgDoneProgress: number | null
  }
}

/** 供纯函数消费的最小结构（与真实记录同构，避免在纯层依赖 zod/存储）。 */
export interface ReviewInputTask {
  id: string
  projectId: string
  title: string
  status: string
  progress?: number
  dueDate?: string | null
  completedDate?: string | null
  updatedAt?: string
  evidenceUrl?: string | null
  /** B2 双读：资料区 link 项，供 evidence 回退展示。 */
  attachments?: { kind: string, url?: string }[] | null
}

export interface ReviewInputMilestone {
  id: string
  projectId: string
  title: string
  status: string
  targetDate?: string | null
  achievedDate?: string | null
}

export interface ReviewInputReflection {
  id: string
  projectId: string
  status: string
  sourceEvent: string
  draft: {
    title: string
    at: string
    lines: { text: string, mark: 'known' | 'pending' | 'blank' }[]
  }
}

export interface BuildReviewInput {
  projectId: string
  tasks: ReviewInputTask[]
  milestones: ReviewInputMilestone[]
  reflections: ReviewInputReflection[]
  /** YYYY-MM-DD；缺省 end=today，start=today-(DEFAULT_PERIOD_DAYS-1)。 */
  periodStart?: string
  periodEnd?: string
  /** 注入今天（YYYY-MM-DD），避免纯层自取墙钟；缺省 localTodayIso()。 */
  today?: string
}

function inRange(date: string | null | undefined, start: string, end: string): boolean {
  return !!date && date >= start && date <= end
}

/** 任务周期命中：done 看 completedDate（缺则退 updatedAt 日期）；wrapped 看 updatedAt 日期（收尾时间）。 */
function taskInPeriod(t: ReviewInputTask, start: string, end: string): boolean {
  if (t.status === 'done') {
    return inRange(t.completedDate ?? null, start, end) || inRange(t.updatedAt?.slice(0, 10), start, end)
  }
  if (t.status === 'wrapped') {
    return inRange(t.updatedAt?.slice(0, 10), start, end)
  }
  return false
}

/**
 * 只读聚合：过滤 + 计数，不修改任何入参。
 * 跨项目条目一律剔除（projectId 不等不入素材）。
 */
export function buildReviewMaterials(input: BuildReviewInput): ReviewMaterials {
  const today = input.today ?? localTodayIso()
  const end = input.periodEnd ?? today
  const start = input.periodStart ?? addDaysIso(today, -(DEFAULT_PERIOD_DAYS - 1))

  const tasks: ReviewTaskItem[] = input.tasks
    .filter(t => t.projectId === input.projectId && (t.status === 'done' || t.status === 'wrapped'))
    .filter(t => taskInPeriod(t, start, end))
    .map(t => ({
      id: t.id,
      title: t.title,
      done: t.status === 'done',
      kind: t.status === 'done' ? 'done' : 'wrapped',
      progress: t.progress ?? 0,
      dueDate: t.dueDate ?? null,
      // B2 双读：evidenceUrl 缺省时回退到资料区第一条 link。
      evidence: t.evidenceUrl ?? t.attachments?.find(a => a.kind === 'link' && a.url)?.url ?? null,
    }))

  const milestones: ReviewMilestoneItem[] = input.milestones
    .filter(m => m.projectId === input.projectId && m.status === 'achieved')
    .filter(m => inRange(m.achievedDate ?? null, start, end))
    .map(m => ({ id: m.id, title: m.title, achieved: true, actualDate: m.achievedDate ?? null }))

  const reflections: ReviewReflectionItem[] = input.reflections
    .filter(r => r.projectId === input.projectId)
    .filter(r => inRange(r.draft?.at?.slice(0, 10), start, end))
    .map(r => ({
      id: r.id,
      title: r.draft.title,
      sourceEvent: r.sourceEvent,
      knownLines: (r.draft.lines ?? []).filter(l => l.mark === 'known').map(l => l.text),
    }))
    .filter(r => r.knownLines.length > 0)

  const doneTasks = tasks.filter(t => t.kind === 'done')
  const avgDoneProgress = doneTasks.length
    ? Math.round(doneTasks.reduce((sum, t) => sum + t.progress, 0) / doneTasks.length)
    : null

  return {
    projectId: input.projectId,
    period: { start, end },
    tasks,
    milestones,
    reflections,
    counts: {
      doneTasks: doneTasks.length,
      wrappedTasks: tasks.length - doneTasks.length,
      achievedMilestones: milestones.length,
      reflectionKnownLines: reflections.reduce((n, r) => n + r.knownLines.length, 0),
      avgDoneProgress,
    },
  }
}

const SOURCE_EVENT_LABEL: Record<string, string> = {
  'task-done': '任务完成',
  'milestone-achieved': '里程碑达成',
  'deliverable-accepted': '交付物验收',
}

/**
 * 同一聚合数据渲染 Markdown 述职稿：「做了什么 / 量化结果 / 关键产出」三段结构。
 * 空段诚实留白（写「暂无」），不补造成果；wrapped 单列，不计完成。
 */
export function renderReviewMarkdown(m: ReviewMaterials): string {
  const lines: string[] = []
  lines.push(`# 述职素材（${m.projectId} · ${m.period.start} 至 ${m.period.end}）`)
  lines.push('')
  lines.push('> 只读聚合，供周报/季报/晋升材料整理；wrapped 为「已收尾 · 非正式完成」，不计完成。')
  lines.push('')

  // 一、做了什么
  lines.push('## 一、做了什么')
  const doneItems = m.tasks.filter(t => t.kind === 'done')
  const wrappedItems = m.tasks.filter(t => t.kind === 'wrapped')
  if (doneItems.length === 0 && wrappedItems.length === 0 && m.milestones.length === 0) {
    lines.push('本周期暂无正式完成的任务或已达成里程碑。')
  } else {
    for (const t of doneItems) {
      lines.push(`- [完成] ${t.title}（${t.id}${t.dueDate ? `，截止 ${t.dueDate}` : ''}）`)
    }
    for (const ms of m.milestones) {
      lines.push(`- [里程碑] ${ms.title}（${ms.id}${ms.actualDate ? `，达成于 ${ms.actualDate}` : ''}）`)
    }
    if (wrappedItems.length > 0) {
      lines.push('')
      lines.push('已收尾（非正式完成，不计入完成数）：')
      for (const t of wrappedItems) {
        lines.push(`- [收尾] ${t.title}（${t.id}）`)
      }
    }
  }
  lines.push('')

  // 二、量化结果
  lines.push('## 二、量化结果')
  lines.push(`- 正式完成任务：${m.counts.doneTasks} 项`)
  lines.push(`- 已收尾任务：${m.counts.wrappedTasks} 项（非正式完成）`)
  lines.push(`- 已达成里程碑：${m.counts.achievedMilestones} 个`)
  lines.push(`- 复盘已核（known）句：${m.counts.reflectionKnownLines} 条`)
  lines.push(`- 完成任务平均进度：${m.counts.avgDoneProgress === null ? '证据不足（无完成条目）' : `${m.counts.avgDoneProgress}%`}`)
  const withEvidence = doneItems.filter(t => t.evidence)
  if (withEvidence.length > 0) {
    lines.push(`- 带客观佐证的完成任务：${withEvidence.length} 项`)
  }
  lines.push('')

  // 三、关键产出（复盘 known 行 + 佐证链接）
  lines.push('## 三、关键产出')
  if (m.reflections.length === 0 && withEvidence.length === 0) {
    lines.push('本周期暂无复盘已核素材或客观佐证。')
  } else {
    for (const r of m.reflections) {
      lines.push(`### ${r.title}（${SOURCE_EVENT_LABEL[r.sourceEvent] ?? r.sourceEvent} · ${r.id}）`)
      for (const line of r.knownLines) lines.push(`- ${line}`)
      lines.push('')
    }
    if (withEvidence.length > 0) {
      lines.push('客观佐证：')
      for (const t of withEvidence) {
        lines.push(`- ${t.title}（${t.id}）：${t.evidence}`)
      }
    }
  }
  lines.push('')
  return lines.join('\n')
}
