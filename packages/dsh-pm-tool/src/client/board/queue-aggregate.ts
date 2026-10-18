/**
 * K11 补记队列：snapshot.queue（Record<projectId, Queue>）→ 看板聚合视图 的纯函数。
 *
 * 后端契约（core/queue.ts 输出）：
 *   snapshot.queue = { [projectId]: { top, rest, quietMode, openedAt } }
 * 本模块只做防御性收窄与跨项目合并，不读库、不写盘、不杜撰；
 * 缺字段（missing）/格式异常（malformed）与「有效但为空」严格区分，绝不拿假空态冒充。
 */

/** 后端单条目宽松形状（core/queue.ts QueueItem 的前端镜像，缺字段安全回落）。 */
export interface QueueBackendItem {
  taskId?: string
  title?: string
  status?: string
  priority?: string
  dueDate?: string | null
  progress?: number
  severity?: string
  lateDays?: number
  muted?: boolean
  absent?: boolean
  mutedUntil?: string
  backlog?: boolean
}

/** 后端单项目队列宽松形状。 */
export interface QueueBackend {
  top?: QueueBackendItem | null
  rest?: QueueBackendItem[]
  quietMode?: boolean
  openedAt?: string | null
}

/** 聚合后给卡片渲染的条目。 */
export interface QueueViewItem {
  taskId: string
  projectId: string
  projectName?: string
  title: string
  status?: string
  priority?: string
  dueDate: string | null
  progress: number
  severity?: string
  lateDays: number
  muted: boolean
  absent: boolean
  mutedUntil?: string
  backlog?: boolean
}

/**
 * ready = 有有效队列记录（可能为空）；missing = snapshot 根本无 queue 字段；
 * malformed = 有 queue 字段但形状不是对象（格式异常，跳过，不显示假空态）。
 */
export type QueueAggregateState = 'ready' | 'missing' | 'malformed'

export interface AggregatedQueue {
  state: QueueAggregateState
  /** 任一项目处于静默时段即降级（quiet 窗口为全局设置，各项目同值）。 */
  quietMode: boolean
  top: QueueViewItem | null
  rest: QueueViewItem[]
  /**
   * 有好有坏：存在被跳过的坏队列结构或坏条目。卡片须显式 partial 提示，
   * 不得无声吞掉坏项；全坏（无任何合法队列/条目）归入 malformed。
   */
  partial: boolean
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asNumber(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** 关键项豁免：blocked 或 lateDays>0 的 muted 条目仍可进 top（与后端 §2.2.4 同口径）。 */
export function isExemptFromMute(item: Pick<QueueViewItem, 'severity' | 'lateDays'>): boolean {
  return item.severity === 'blocked' || item.lateDays > 0
}

/** 严重度档位排序权重（与后端 blocked > P0 > late > due 一致）。 */
function severityRank(severity: string | undefined): number {
  switch (severity) {
    case 'blocked': return 0
    case 'p0': return 1
    case 'late': return 2
    default: return 3
  }
}

function compareViewItems(a: QueueViewItem, b: QueueViewItem): number {
  return severityRank(a.severity) - severityRank(b.severity)
    || b.lateDays - a.lateDays
    || (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    || a.taskId.localeCompare(b.taskId)
}

/** 兜底严重度：后端已给 severity 时优先；否则按 blocked > P0 > 逾期 > 普通推导（与后端 severityOf 同序）。 */
function effectiveSeverity(raw: Record<string, unknown>, lateDays: number): string {
  if (typeof raw.severity === 'string' && raw.severity) return raw.severity
  if (raw.status === 'blocked') return 'blocked'
  if (raw.priority === 'P0') return 'p0'
  if (lateDays > 0) return 'late'
  return 'due'
}

function parseItem(raw: unknown, projectId: string, projectName?: string): QueueViewItem | null {
  if (!isRecord(raw)) return null
  const taskId = typeof raw.taskId === 'string' && raw.taskId ? raw.taskId : null
  if (!taskId) return null
  const lateDays = asNumber(raw.lateDays)
  return {
    taskId,
    projectId,
    projectName,
    title: typeof raw.title === 'string' ? raw.title : '',
    status: typeof raw.status === 'string' ? raw.status : undefined,
    priority: typeof raw.priority === 'string' ? raw.priority : undefined,
    dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : null,
    progress: asNumber(raw.progress),
    severity: effectiveSeverity(raw, lateDays),
    lateDays,
    muted: raw.muted === true,
    absent: raw.absent === true,
    mutedUntil: typeof raw.mutedUntil === 'string' ? raw.mutedUntil : undefined,
    backlog: raw.backlog === true,
  }
}

/**
 * 聚合 snapshot.queue。
 * @param raw snapshot.queue 原始值（可能 undefined / 非对象 / Record）
 * @param projectNames projectId -> 项目名（由 data.projects 构建，用于跨项目标注）
 */
export function aggregateQueue(raw: unknown, projectNames: Map<string, string>): AggregatedQueue {
  if (raw === undefined) return { state: 'missing', quietMode: false, top: null, rest: [], partial: false }
  if (!isRecord(raw)) return { state: 'malformed', quietMode: false, top: null, rest: [], partial: false }

  const merged: QueueViewItem[] = []
  let quietMode = false
  let validQueues = 0
  let badQueues = 0
  let badItems = 0
  const entryCount = Object.keys(raw).length

  for (const [projectId, qRaw] of Object.entries(raw)) {
    // 队列结构校验：必须是纯对象；rest 必须给出且为数组（后端始终产出数组）。
    if (!isRecord(qRaw)) {
      badQueues++
      continue
    }
    const projectName = projectNames.get(projectId)
    if (qRaw.quietMode === true) quietMode = true

    const collect = (itemRaw: unknown) => {
      const item = parseItem(itemRaw, projectId, projectName)
      if (item) merged.push(item)
      else badItems++
    }

    // rest：缺省/非数组 → 队列结构不可用（坏队列）；数组 → 逐项收集。
    let structurallyValid = true
    if (!Array.isArray(qRaw.rest)) {
      structurallyValid = false
    } else {
      qRaw.rest.forEach(collect)
    }

    // top：null/缺省合法；给出但非对象 → 坏条目；记录结构本身仍合法。
    if (qRaw.top === null || qRaw.top === undefined) {
      // 合法占位
    } else if (isRecord(qRaw.top)) {
      collect(qRaw.top)
    } else {
      badItems++
    }

    if (structurallyValid) validQueues++
    else badQueues++
  }

  // 全坏：有项目条目（entryCount>0）但无任何结构合法队列、无任何合法条目 → malformed（不返回 ready 空假态）。
  if (entryCount > 0 && validQueues === 0 && merged.length === 0) {
    return { state: 'malformed', quietMode: false, top: null, rest: [], partial: false }
  }

  const partial = badQueues > 0 || badItems > 0
  merged.sort(compareViewItems)

  // quietMode：top 置空、全部并入折叠列示（§2.2.7）。
  if (quietMode) return { state: 'ready', quietMode, top: null, rest: merged, partial }

  const idx = merged.findIndex(it => !it.muted || isExemptFromMute(it))
  const top = idx >= 0 ? merged[idx] : null
  const rest = merged.filter((_, i) => i !== idx)
  return { state: 'ready', quietMode, top, rest, partial }
}
