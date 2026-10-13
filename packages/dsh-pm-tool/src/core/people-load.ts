/**
 * 人员与负载视图纯派生（P0 / v0.5.1）。
 *
 * 只读遍历「未完成任务」（status!=='done' 且 progress<100），按归一化 assignee 分组，
 * 产出每人跨项目负载指标与任务明细。**零写盘、零 schema、不碰 domain**。
 *
 * 仿 `war-room.ts`：吃普通可序列化数组（不吃 PmDomain），同一函数可在浏览器端基于
 * `web snapshot`、离线 verify、（将来）命令端复用。`today` 可注入以保证确定性。
 *
 * 口径冻结见 docs/product/07-people-load-view-design.md 与 people-load-acceptance.md。
 */

export interface PeopleTaskInput {
  id: string
  projectId: string
  code?: string
  title?: string
  assignee?: string
  status?: string
  progress?: number
  priority?: string
  dueDate?: string
}

export interface PeopleProjectInput {
  id: string
  name: string
}

export interface PersonTask {
  id: string
  projectId: string
  projectName: string
  code: string
  title: string
  priority?: string
  status: string
  progress: number
  dueDate?: string
  /** 相对今天的天数；负数=逾期，null=无截止。 */
  daysUntil: number | null
  bucket: 'overdue' | 'due-soon' | 'open'
}

export interface PersonRow {
  /** 归一化分组键（小写折叠）。 */
  key: string
  /** 卡片展示名 = 组内出现次数最多的原始写法，并列取首见。 */
  display: string
  /** assignee 串含多负责人分隔符（不切分，仅标记）。 */
  multiOwner: boolean
  openTotal: number
  todo: number
  inProgress: number
  blocked: number
  overdue: number
  dueSoon: number
  p0: number
  /** 该人 open 任务涉及的 distinct projectId 数。 */
  projectCount: number
  /** open 任务中最近的「未来」截止日（含今天）；无则 null。 */
  nextDue: string | null
  tasks: PersonTask[]
}

export interface PeopleLoadReport {
  today: string
  withinDays: number
  /** 归一后空 assignee 的 open 任务桶；无则 null。由 UI 固定置顶，不参与人名排序。 */
  unassigned: PersonRow | null
  /** 风险序排列的正常人（≥1 个 open 任务）。 */
  people: PersonRow[]
}

export interface PeopleLoadOptions {
  today?: string
  withinDays?: number
}

/** 多负责人分隔符集合（仅用于打标，不切分）。 */
const MULTI_OWNER_RE = /[,，、；;\/／和及]/

/**
 * 归一化分组键：trim → 折叠内部连续空白为单空格（含全角/不换行空格）→ 拉丁小写。
 * 返回空串表示「未分配」。
 */
export function normalizePerson(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  // JS \s 已覆盖 U+3000 全角空格与 U+00A0 不换行空格。
  return String(raw).trim().replace(/\s+/g, ' ').toLowerCase()
}

/** 展示用原始写法：trim + 折叠内部空白（保留大小写）。 */
function displayForm(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  return String(raw).trim().replace(/\s+/g, ' ')
}

function isOpen(task: PeopleTaskInput): boolean {
  return task.status !== 'done' && (task.progress ?? 0) < 100
}

function todayLocal(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 两个 YYYY-MM-DD 日历日相差天数（a - b）。 */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000)
}

function bucketOf(daysUntil: number | null, withinDays: number): PersonTask['bucket'] {
  if (daysUntil === null) return 'open'
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= withinDays) return 'due-soon'
  return 'open'
}

interface Accum {
  key: string
  /** display 写法计数（保留大小写）；value=次数。 */
  displayCounts: Map<string, number>
  firstDisplay: string
  row: PersonRow
}

function newAccum(key: string, display: string, isUnassigned: boolean): Accum {
  return {
    key,
    displayCounts: new Map([[display, 1]]),
    firstDisplay: display,
    row: {
      key,
      display: isUnassigned ? '未分配' : display,
      multiOwner: false,
      openTotal: 0, todo: 0, inProgress: 0, blocked: 0,
      overdue: 0, dueSoon: 0, p0: 0,
      projectCount: 0,
      nextDue: null,
      tasks: [],
    },
  }
}

function accumulate(accums: Map<string, Accum>, key: string, task: PeopleTaskInput,
  projectNameById: Map<string, string>, today: string, withinDays: number): void {
  const display = displayForm(task.assignee)
  let acc = accums.get(key)
  if (!acc) {
    acc = newAccum(key, display, key === '')
    accums.set(key, acc)
  } else if (display) {
    // 统计展示写法频次（未分配桶不参与展示名选举）。
    acc.displayCounts.set(display, (acc.displayCounts.get(display) ?? 0) + 1)
  }

  const row = acc.row
  row.openTotal += 1
  if (task.status === 'todo') row.todo += 1
  else if (task.status === 'in_progress') row.inProgress += 1
  else if (task.status === 'blocked') row.blocked += 1
  if (task.priority === 'P0') row.p0 += 1

  const daysUntil = task.dueDate ? daysBetween(task.dueDate, today) : null
  if (daysUntil !== null && daysUntil < 0) row.overdue += 1
  else if (daysUntil !== null && daysUntil <= withinDays) row.dueSoon += 1

  // 最近未来截止（含今天）。
  if (daysUntil !== null && daysUntil >= 0) {
    if (row.nextDue === null || task.dueDate! < row.nextDue) row.nextDue = task.dueDate!
  }

  row.tasks.push({
    id: task.id,
    projectId: task.projectId,
    projectName: projectNameById.get(task.projectId) ?? task.projectId,
    code: task.code ?? '',
    title: task.title ?? '',
    priority: task.priority,
    status: task.status ?? 'todo',
    progress: task.progress ?? 0,
    dueDate: task.dueDate,
    daysUntil,
    bucket: bucketOf(daysUntil, withinDays),
  })
}

function finalizeDisplay(acc: Accum): void {
  if (acc.key === '') return // 未分配桶展示名固定
  // 出现次数最多的写法；并列取首见。
  let best = acc.firstDisplay
  let bestCount = -1
  for (const [form, count] of acc.displayCounts) {
    if (count > bestCount) {
      bestCount = count
      best = form
    }
  }
  acc.row.display = best
  acc.row.multiOwner = MULTI_OWNER_RE.test(acc.key)
}

function sortTasks(tasks: PersonTask[]): void {
  // 逾期置顶（最急在前）→ 临期按截止升 → 远期/无截止最后。
  const rank = (t: PersonTask): number => t.bucket === 'overdue' ? 0 : t.bucket === 'due-soon' ? 1 : 2
  tasks.sort((a, b) =>
    rank(a) - rank(b)
    || (a.daysUntil ?? Number.MAX_SAFE_INTEGER) - (b.daysUntil ?? Number.MAX_SAFE_INTEGER)
    || a.id.localeCompare(b.id),
  )
}

function riskRank(a: PersonRow, b: PersonRow): number {
  return b.overdue - a.overdue
    || b.blocked - a.blocked
    || b.dueSoon - a.dueSoon
    || (a.nextDue ?? '9999-12-31').localeCompare(b.nextDue ?? '9999-12-31')
    || b.openTotal - a.openTotal
    || a.key.localeCompare(b.key)
}

/**
 * 按归一化 assignee 对 open 任务分组，产出人员负载报告。
 * 未分配桶（空 assignee）在 `report.unassigned`，由 UI 固定置顶；
 * `report.people` 已按风险序排好。
 */
export function groupOpenTasksByAssignee(
  tasks: PeopleTaskInput[],
  projects: PeopleProjectInput[],
  options: PeopleLoadOptions = {},
): PeopleLoadReport {
  const today = options.today ?? todayLocal()
  const withinDays = options.withinDays ?? 7
  const projectNameById = new Map(projects.map(p => [p.id, p.name]))

  const accums = new Map<string, Accum>()
  for (const task of tasks) {
    if (!isOpen(task)) continue
    const key = normalizePerson(task.assignee)
    accumulate(accums, key, task, projectNameById, today, withinDays)
  }

  let unassigned: PersonRow | null = null
  const people: PersonRow[] = []
  for (const acc of accums.values()) {
    finalizeDisplay(acc)
    // 计算跨项目数。
    acc.row.projectCount = new Set(acc.row.tasks.map(t => t.projectId)).size
    sortTasks(acc.row.tasks)
    if (acc.key === '') unassigned = acc.row
    else people.push(acc.row)
  }

  people.sort(riskRank)
  return { today, withinDays, unassigned, people }
}
