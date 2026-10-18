/**
 * P1 能力 K11 补记队列：读时派生纯函数 + 领域取数胶水。
 *
 * 契约：docs/design/deep-integration-v2-p1-dev.md §二。
 * 纪律：
 * - 纯函数 today / nowHhmm 注入，零墙钟、零网络、零写、不修改入参；
 * - 到期未达（dueDate <= today 且未 done、progress<100）→ 严重度排序（blocked > P0 > 逾期天数 > 到期日）；
 * - 积压迟到 LATE_DAYS=3 标识（lateDays 为全部逾期天数，≥3 天即积压档）；
 * - Top1 + 折叠 rest；mute 二态（压主动投递、不隐藏打开视图，ttlDays 到期自动失效）；
 * - 关键项豁免：blocked 或 lateDays>0 的 muted 条目仍进 top；
 * - K9 缺席：sessions 有绑定且 updatedAt === createdAt → 折叠列示，不进 top；
 * - 时段静默 quietMode=true 时 top 置空、rest 保留；
 * - X7 cycleDue / X8 backfill 仅类型预留，本期不产出数据。
 *
 * 能力边界：打开时呈现 ≠ 常驻推送（H6 悬置 P3）；mute 不隐藏打开视图折叠列表。
 */
import { addDaysIso } from './derived.js'
import type { PmDomain } from './storage.js'

/** 积压迟到阈值（天）：逾期 ≥ LATE_DAYS 即「积压」档（lateDays 仍如实给全量逾期天数）。 */
export const LATE_DAYS = 3

/** 严重度档位（排序权重从高到低）：blocked > P0 > late（逾期）> due（今天到期/普通）。 */
export type QueueSeverity = 'blocked' | 'p0' | 'late' | 'due'

/** 纯函数消费的任务最小形状（不依赖 zod 记录，便于离线单测）。 */
export interface QueueTaskInput {
  id: string
  title: string
  status?: string
  priority?: string
  progress?: number | null
  dueDate?: string | null
  createdAt?: string
  updatedAt?: string
}

/** 纯函数消费的会话绑定最小形状（K9）。 */
export interface QueueSessionInput {
  taskId: string
}

export interface MuteEntry {
  /** ISO 打卡时刻。 */
  mutedAt: string
  /** 静音有效期（天，含 mutedAt 当天）。 */
  ttlDays: number
}

export type MuteMap = Record<string, MuteEntry | undefined>

/** 时段静默设置：正常窗口 或 off 清除。 */
export type QuietWindow = { from: string, to: string } | { off: true }

/** 队列条目（分片D 前端消费：taskId/title/status/dueDate/progress/severity/lateDays/muted）。 */
export interface QueueItem {
  taskId: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  progress: number
  severity: QueueSeverity
  /** 逾期天数（未逾期=0）。 */
  lateDays: number
  /** 是否静音（mute 二态：压 top，rest 仍可见）。 */
  muted: boolean
  /** K9 缺席：会话有结存、任务绑定后零更新（仅折叠列示，不进 top）。 */
  absent?: boolean
  /** 静音失效日 YYYY-MM-DD（含当天；过期条目派生时已按未静音处理）。 */
  mutedUntil?: string
  /** 积压标识：逾期 ≥ LATE_DAYS(3) 天（迟到 N 天标签的积压档；lateDays 仍给全量逾期天数）。 */
  backlog?: boolean
  /** X7 周期触发预留接线点（本期不产出）。 */
  cycleDue?: boolean
  /** X8 待回填提醒预留接线点（本期不产出）。 */
  backfill?: string[]
}

export interface QueueResult {
  projectId: string
  /** 上次打开打卡 ISO；首次打开无记录 = null（队列照常生成）。 */
  openedAt: string | null
  quietMode: boolean
  top: QueueItem | null
  rest: QueueItem[]
}

export interface QueueDeriveOptions {
  /** 本地日历日 YYYY-MM-DD（注入，零墙钟）。 */
  today: string
  /** 本地 HH:MM（注入，供时段静默判定；缺省按非静默处理，绝不误压）。 */
  nowHhmm?: string
  /** 本项目上次打开打卡 ISO；缺省 null。 */
  openedAt?: string | null
  mute?: MuteMap
  quiet?: QuietWindow
}

// ---- 纯工具（可离线单测）----

function parseDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** 逾期天数：dueDate 早于 today 返回正整数，否则 0（无日期/今天/未来均为 0）。 */
export function queueLateDays(dueDate: string | null | undefined, today: string): number {
  if (!dueDate) return 0
  const diff = Math.round((parseDate(today) - parseDate(dueDate)) / 86_400_000)
  return diff > 0 ? diff : 0
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

function toMinutes(hhmm: string): number {
  if (!HHMM.test(hhmm)) return Number.NaN
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** HH:MM 合法性（命令层写盘前校验复用）。 */
export function isValidHhmm(value: unknown): value is string {
  return typeof value === 'string' && HHMM.test(value)
}

/**
 * 当前时刻是否落在静默窗口内；支持跨夜（from > to，如 22:00–06:00）。
 * 端点含当天；非法输入一律 false（不误压）。
 */
export function inQuietWindow(nowHhmm: string, from: string, to: string): boolean {
  const t = toMinutes(nowHhmm)
  const f = toMinutes(from)
  const e = toMinutes(to)
  if (Number.isNaN(t) || Number.isNaN(f) || Number.isNaN(e)) return false
  if (f <= e) return t >= f && t <= e
  return t >= f || t <= e
}

/** 静音是否仍有效：ttlDays 正整数、mutedAt 合法，且 today <= mutedAt 当日 + ttlDays 天。 */
export function isMuteActive(entry: MuteEntry | undefined, today: string): boolean {
  if (!entry || typeof entry.ttlDays !== 'number' || !Number.isFinite(entry.ttlDays) || entry.ttlDays <= 0) return false
  const day = typeof entry.mutedAt === 'string' ? entry.mutedAt.slice(0, 10) : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false
  const until = addDaysIso(day, Math.floor(entry.ttlDays))
  return today <= until
}

/** 静音失效日（含当天）；无效条目返回 undefined。 */
export function mutedUntilOf(entry: MuteEntry | undefined): string | undefined {
  if (!entry || typeof entry.ttlDays !== 'number' || entry.ttlDays <= 0) return undefined
  const day = typeof entry.mutedAt === 'string' ? entry.mutedAt.slice(0, 10) : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined
  return addDaysIso(day, Math.floor(entry.ttlDays))
}

function severityOf(task: QueueTaskInput, today: string): QueueSeverity {
  if (task.status === 'blocked') return 'blocked'
  if (task.priority === 'P0') return 'p0'
  if (queueLateDays(task.dueDate, today) > 0) return 'late'
  return 'due'
}

const SEVERITY_RANK: Record<QueueSeverity, number> = { blocked: 0, p0: 1, late: 2, due: 3 }

/** 严重度排序：blocked > P0 > 逾期天数（多者在前）> 到期日升序 > id 兜底。 */
function compareQueueItems(a: QueueItem, b: QueueItem): number {
  return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    || b.lateDays - a.lateDays
    || (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    || a.taskId.localeCompare(b.taskId)
}

/** 关键项豁免：blocked 或 lateDays>0 的条目即使静音也进 top。 */
export function isExemptFromMute(item: QueueItem): boolean {
  return item.severity === 'blocked' || item.lateDays > 0
}

// ---- 纯派生（零墙钟零写，不改入参）----

/**
 * 派生项目补记队列。
 * @param projectId 项目 ID（仅透传到输出）
 * @param tasks 项目内任务（调用方负责按项目过滤；纯函数不读库）
 * @param sessions 项目内 K9 绑定（调用方负责按项目过滤）
 */
export function deriveQueue(
  projectId: string,
  tasks: QueueTaskInput[],
  sessions: QueueSessionInput[],
  options: QueueDeriveOptions,
): QueueResult {
  const { today } = options
  const quietMode = !!(options.quiet && 'from' in options.quiet && options.nowHhmm
    && inQuietWindow(options.nowHhmm, options.quiet.from, options.quiet.to))

  const mute = options.mute ?? {}
  const items: QueueItem[] = []

  // 1) 到期未达：dueDate <= today 且未 done、progress<100。
  for (const task of tasks) {
    if (task.status === 'done') continue
    if ((task.progress ?? 0) >= 100) continue
    if (!task.dueDate || task.dueDate > today) continue
    const entry = mute[task.id]
    const muted = isMuteActive(entry, today)
    const lateDays = queueLateDays(task.dueDate, today)
    items.push({
      taskId: task.id,
      title: task.title,
      status: task.status ?? 'todo',
      priority: task.priority ?? 'P1',
      dueDate: task.dueDate,
      progress: task.progress ?? 0,
      severity: severityOf(task, today),
      lateDays,
      muted,
      backlog: lateDays >= LATE_DAYS,
      mutedUntil: muted ? mutedUntilOf(entry) : undefined,
    })
  }

  // 6) K9 缺席：sessions 有绑定且 updatedAt === createdAt（绑定后零更新）→ 折叠列示，不进 top。
  const bound = new Set(sessions.map(s => s.taskId))
  for (const task of tasks) {
    if (!bound.has(task.id)) continue
    if (task.status === 'done') continue
    if (!task.createdAt || !task.updatedAt || task.updatedAt !== task.createdAt) continue
    // 已在到期清单里的缺席任务不重复追加。
    if (items.some(it => it.taskId === task.id)) continue
    const entry = mute[task.id]
    const muted = isMuteActive(entry, today)
    items.push({
      taskId: task.id,
      title: task.title,
      status: task.status ?? 'todo',
      priority: task.priority ?? 'P1',
      dueDate: task.dueDate ?? null,
      progress: task.progress ?? 0,
      severity: severityOf(task, today),
      lateDays: queueLateDays(task.dueDate, today),
      muted,
      absent: true,
      mutedUntil: muted ? mutedUntilOf(entry) : undefined,
    })
  }

  items.sort(compareQueueItems)

  // 4) Top1：非静默时取首个「未静音或关键项豁免」条目；静默时 top 置空、rest 全保留。
  let top: QueueItem | null = null
  let rest = items
  if (!quietMode) {
    const idx = items.findIndex(it => !it.muted || isExemptFromMute(it))
    if (idx >= 0) {
      top = items[idx]
      rest = items.filter((_, i) => i !== idx)
    }
  }

  return {
    projectId,
    openedAt: options.openedAt ?? null,
    quietMode,
    top,
    rest,
  }
}

// ---- 领域取数胶水（读 settings 条目 + 读表，仍零写；写盘在命令层）----

export const SETTING_OPENED = 'pmQueueOpened'
export const SETTING_MUTE = 'pmQueueMute'
export const SETTING_QUIET = 'pmQueueQuiet'

function readSettingsValue(domain: PmDomain, key: string): unknown {
  const row = domain.table('settings').get(key) as { value?: unknown } | undefined
  return row?.value
}

/** 读打卡表 `{ [projectId]: { at: ISO } }`；缺省/损坏按空处理，绝不抛。 */
export function readQueueOpened(domain: PmDomain): Record<string, { at: string }> {
  const value = readSettingsValue(domain, SETTING_OPENED)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, { at: string }> = {}
  for (const [pid, rec] of Object.entries(value as Record<string, unknown>)) {
    if (rec && typeof rec === 'object' && typeof (rec as { at?: unknown }).at === 'string') {
      out[pid] = { at: (rec as { at: string }).at }
    }
  }
  return out
}

/** 读静音表 `{ [taskId]: { mutedAt, ttlDays } }`；缺省/损坏按空处理，绝不抛。 */
export function readQueueMute(domain: PmDomain): MuteMap {
  const value = readSettingsValue(domain, SETTING_MUTE)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: MuteMap = {}
  for (const [taskId, rec] of Object.entries(value as Record<string, unknown>)) {
    if (rec && typeof rec === 'object') {
      const r = rec as { mutedAt?: unknown, ttlDays?: unknown }
      if (typeof r.mutedAt === 'string' && typeof r.ttlDays === 'number' && r.ttlDays > 0) {
        out[taskId] = { mutedAt: r.mutedAt, ttlDays: r.ttlDays }
      }
    }
  }
  return out
}

/** 读静默窗口；`{off:true}`/缺失/损坏返回 undefined（按非静默）。 */
export function readQueueQuiet(domain: PmDomain): QuietWindow | undefined {
  const value = readSettingsValue(domain, SETTING_QUIET)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const v = value as Record<string, unknown>
  if (v.off === true) return undefined
  if (isValidHhmm(v.from) && isValidHhmm(v.to)) return { from: v.from, to: v.to }
  return undefined
}

/**
 * 按项目取数并派生（命令 list/open 与 web snapshot 共用同一口径，零写）。
 * today/nowHhmm 由调用方注入（命令层给真实当前值，纯单测不走这里）。
 */
export function buildQueueForProject(
  domain: PmDomain,
  projectId: string,
  options: { today: string, nowHhmm?: string, openedAt?: string | null },
): QueueResult {
  const tasks = [...domain.table('tasks').entries()]
    .map(([, t]) => t)
    .filter(t => t.projectId === projectId)
    .map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      progress: t.progress,
      dueDate: t.dueDate ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))
  const sessions = [...domain.table('sessions').entries()]
    .map(([, s]) => s)
    .filter(s => s.projectId === projectId)
    .map(s => ({ taskId: s.taskId }))
  const opened = readQueueOpened(domain)
  return deriveQueue(projectId, tasks, sessions, {
    today: options.today,
    nowHhmm: options.nowHhmm,
    openedAt: options.openedAt ?? opened[projectId]?.at ?? null,
    mute: readQueueMute(domain),
    quiet: readQueueQuiet(domain),
  })
}
