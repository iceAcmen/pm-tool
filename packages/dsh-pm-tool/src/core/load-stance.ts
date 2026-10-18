/**
 * K19 保护面后端派生（纯函数，today 注入，零写盘、零墙钟、零 schema、不碰 domain）。
 *
 * 能力边界（勿越界）：
 * - 仅做【事实陈列 + 建议文案】，不换算倦怠、不做裁决、不做 WIP 硬上限/拒单闸；
 * - 所有「建议砍/缓」均为人决策参考，措辞固定带「建议供人决策，不自动执行」；
 * - 烂尾倾向只是供前端筛选的标签，不是结论；
 * - 吃普通可序列化数组（不吃 PmDomain），浏览器端基于 snapshot / 命令端离线复用同源。
 *
 * 契约见 docs/design/deep-integration-v2-p1-dev.md §五（K19）。
 */
import { isTaskOverdue, localTodayIso } from './derived.js'
import { isWrappedStatus } from './status.js'
import { displayForm, normalizePerson } from './people-load.js'

/** K19 派生所需窄字段（与 Task 结构兼容，挑必需项，便于浏览器/snapshot 直接喂入）。 */
export interface StanceTaskInput {
  id: string
  title?: string
  assignee?: string
  status?: string
  progress?: number | null
  dueDate?: string | null
  /** YYYY-MM-DD，烂尾标签用。 */
  startDate?: string | null
  /** ISO 时间戳，受阻时长/停滞时长用（取日期部分比较）。 */
  updatedAt?: string | null
}

export interface StanceFactPerson {
  /** 归一化分组键（小写折叠）；空串=未分配桶。 */
  personId: string
  /** 展示名（组内首见原始写法；未分配固定「未分配」）。 */
  name: string
  /** 该人名下全部任务数（含已完成）。 */
  taskCount: number
  /** 未完成数（status!=='done' 且 progress<100）。 */
  openCount: number
  /** 逾期未完成数（口径同 derived.isTaskOverdue）。 */
  overdueCount: number
  /** 已完成数（status==='done'）。 */
  doneCount: number
}

export type Stance = 'cut' | 'slow'

export interface StanceSuggestion {
  taskId: string
  title: string
  /** cut=建议收缩/砍掉范围；slow=建议暂缓/先解阻塞。均为建议，不自动执行。 */
  stance: Stance
  reason: string
  dueDate?: string
}

export interface StaleStanceTag {
  taskId: string
  title: string
  tag: '烂尾倾向'
  /** startDate 距今天数（>30 才入选）。 */
  daysSinceStart: number
  /** updatedAt 距今天数（>7 才入选）。 */
  daysSinceUpdate: number
}

/** 建议文案固定后缀：明确「供人决策，不自动执行」，工具不替人裁决。 */
const DECISION_DISCLAIMER = '建议供人决策，不自动执行'

/** 两个 YYYY-MM-DD 日历日相差天数（today - date）；与 people-load 同源 UTC 日算术。 */
export function daysBetweenIso(today: string, date: string): number {
  const [ty, tm, td] = today.split('-').map(Number)
  const [dy, dm, dd] = date.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(dy, dm - 1, dd)) / 86_400_000)
}

/** ISO 时间戳取日期部分（YYYY-MM-DD）；非 ISO/空值返回 null。 */
function isoDatePart(value?: string | null): string | null {
  if (!value) return null
  const part = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : null
}

/** open = 未完成且未收尾：done 已完成、wrapped 已收尾均不计入 open 负载。 */
function isOpen(task: StanceTaskInput): boolean {
  return task.status !== 'done' && !isWrappedStatus(task.status) && (task.progress ?? 0) < 100
}

/**
 * loadFacts：按归一化 assignee 分组的纯事实陈列。
 * 只计数，不换算倦怠、不下判断；today 可注入（缺省本地今天），不修改入参数组/对象。
 */
export function loadFacts(
  tasks: StanceTaskInput[],
  options: { today?: string } = {},
): StanceFactPerson[] {
  const today = options.today ?? localTodayIso()
  const accum = new Map<string, { name: string; row: StanceFactPerson }>()
  for (const task of tasks) {
    const key = normalizePerson(task.assignee)
    let entry = accum.get(key)
    if (!entry) {
      const name = key === '' ? '未分配' : displayForm(task.assignee)
      const row: StanceFactPerson = {
        personId: key,
        name,
        taskCount: 0,
        openCount: 0,
        overdueCount: 0,
        doneCount: 0,
      }
      entry = { name, row }
      accum.set(key, entry)
    }
    const row = entry.row
    row.taskCount += 1
    if (task.status === 'done') row.doneCount += 1
    else if (isOpen(task)) row.openCount += 1
    if (isTaskOverdue(task, today)) row.overdueCount += 1
  }
  return [...accum.values()]
    .map(entry => entry.row)
    .sort((a, b) => b.openCount - a.openCount
      || b.overdueCount - a.overdueCount
      || a.personId.localeCompare(b.personId))
}

/**
 * stanceSuggestions：拖期（dueDate 逾期且非 done）→ cut（建议收缩/砍掉）；
 * blocked 长时（status=blocked 且最近更新距今 >3 天）→ slow（建议暂缓/先解阻塞）。
 * 同一任务只出一条（逾期优先于受阻）；不修改入参。
 */
export function stanceSuggestions(
  tasks: StanceTaskInput[],
  options: { today?: string } = {},
): StanceSuggestion[] {
  const today = options.today ?? localTodayIso()
  const suggested = new Set<string>()
  const overdue: StanceSuggestion[] = []
  const blocked: { item: StanceSuggestion, staleDays: number }[] = []
  for (const task of tasks) {
    if (suggested.has(task.id)) continue
    // wrapped 已收尾：不建议砍/缓（已由人收尾），直接跳过。
    if (isWrappedStatus(task.status)) continue
    // 拖期：dueDate 逾期且未 done（复用 derived.isTaskOverdue 统一口径）。
    if (isTaskOverdue(task, today)) {
      suggested.add(task.id)
      const days = task.dueDate ? daysBetweenIso(today, task.dueDate) : 0
      overdue.push({
        taskId: task.id,
        title: task.title ?? '',
        stance: 'cut',
        reason: `已逾期 ${days} 天（截止 ${task.dueDate}），建议收缩范围或砍掉该任务；${DECISION_DISCLAIMER}`,
        dueDate: task.dueDate ?? undefined,
      })
      continue
    }
    // blocked 长时：受阻且最近更新超过 3 天未动（无 updatedAt 无法判定时长，诚实降级不入选）。
    const updatedDay = isoDatePart(task.updatedAt)
    if (task.status === 'blocked' && updatedDay && daysBetweenIso(today, updatedDay) > 3) {
      suggested.add(task.id)
      blocked.push({
        staleDays: daysBetweenIso(today, updatedDay),
        item: {
          taskId: task.id,
          title: task.title ?? '',
          stance: 'slow',
          reason: `受阻超过 3 天未推进（最近更新 ${updatedDay}），建议暂缓或先解除阻塞；${DECISION_DISCLAIMER}`,
          dueDate: task.dueDate ?? undefined,
        },
      })
    }
  }
  overdue.sort((a, b) => {
    const adue = a.dueDate ?? '9999-12-31'
    const bdue = b.dueDate ?? '9999-12-31'
    return adue.localeCompare(bdue) || a.taskId.localeCompare(b.taskId)
  })
  blocked.sort((a, b) => b.staleDays - a.staleDays || a.item.taskId.localeCompare(b.item.taskId))
  return [...overdue, ...blocked.map(entry => entry.item)]
}

/**
 * staleStanceTags：startDate 距今 >30 天且 updatedAt 距今 >7 天且 progress<50
 * → 「烂尾倾向」过滤标签（供前端筛选，非裁决）。不修改入参。
 */
export function staleStanceTags(
  tasks: StanceTaskInput[],
  options: { today?: string } = {},
): StaleStanceTag[] {
  const today = options.today ?? localTodayIso()
  const result: StaleStanceTag[] = []
  for (const task of tasks) {
    // wrapped 已收尾：不再打「烂尾倾向」标签（已由人收尾，非待救停滞）。
    if (isWrappedStatus(task.status)) continue
    const startDay = isoDatePart(task.startDate)
    const updatedDay = isoDatePart(task.updatedAt)
    if (!startDay || !updatedDay) continue
    const daysSinceStart = daysBetweenIso(today, startDay)
    const daysSinceUpdate = daysBetweenIso(today, updatedDay)
    if (daysSinceStart > 30 && daysSinceUpdate > 7 && (task.progress ?? 0) < 50) {
      result.push({
        taskId: task.id,
        title: task.title ?? '',
        tag: '烂尾倾向',
        daysSinceStart,
        daysSinceUpdate,
      })
    }
  }
  return result.sort((a, b) => b.daysSinceStart - a.daysSinceStart || a.taskId.localeCompare(b.taskId))
}
