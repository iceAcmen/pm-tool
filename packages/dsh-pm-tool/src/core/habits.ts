/**
 * P3 能力 X7 习惯层（分片A 后端）。
 *
 * 契约见 docs/design/deep-integration-v2-p3-dev.md §二：
 * - 会话派生习惯建议（轻确认）：agent 只把建议追加进 settings 收件区 pmHabitInbox，
 *   未确认不创建 habits 记录（未确认不生效）；人 confirm → 建 draft 记录 + 建议标 confirmed；
 *   人 ignore → 建议保留标 ignored（可逆，不删除）；
 * - 2 天补记窗回填：打卡只允许今天 + 过去 2 天，超窗/未来中文拒绝；回填标 backfilled:true；
 *   空日如实留空（不自动补、不伪造）；
 * - streak 连续段档案：按 checkIns 日期派生，缺口 > 2 天 → 当前 current 重置 0；
 *   longest（历史最长段）/ totalDays（累计打卡天数）从全量 checkIns 重算、永久保留不清零；
 *   克制清单延续：无积分/连胜动效/徽章，仅纯文本归档「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」；
 * - 可关联 P2 OKR（同项目存在性校验，复用 okr 校验模式）；
 * - 草稿/定稿复用 X6：draft/confirmed → final 仅人触发，finalize 幂等，无自动定稿；
 * - cycleDue 为 K11 类型预留，本模块不实现调度器（见 cycle-hooks.ts 占位）。
 *
 * 纯函数（streak 派生/收件区形状/建议→记录转换）零网络/零随机/零墙钟，供 vitest 离线单测；
 * 领域写（add/checkin/suggest/confirm/ignore/final）走 enqueueDomainWrite 串行队列 + habitRecordSchema 校验。
 */
import { z } from 'zod'
import { enqueueDomainWrite } from './projects.js'
import { localTodayIso } from './derived.js'
import { habitRecordSchema, type HabitRecord, type PmDomain } from './storage.js'

// ---- 错误类型（中文报错风格参照 okr.ts validateOkrRelations）----

export class HabitProjectNotFoundError extends Error {}
export class HabitOkrNotFoundError extends Error {}
export class HabitOkrProjectMismatchError extends Error {}
export class HabitNotFoundError extends Error {}
export class HabitSuggestionNotFoundError extends Error {}
export class HabitSuggestionAlreadyProcessedError extends Error {}
export class HabitCheckinWindowError extends Error {}

// ---- 形状 schema（strictObject 拒绝未知字段；落盘仍过契约层 habitRecordSchema）----

/** 人直接录入：projectId 由命令层位置参数注入，body 只接受业务字段。 */
export const habitCreateSchema = z.strictObject({
  title: z.string().trim().min(1, '习惯标题不能为空'),
  /** 可选关联 P2 OKR（同项目存在性校验）。 */
  okrId: z.string().optional(),
})

/** agent 代起草建议形状：只进收件区，不建记录。 */
export const habitSuggestionSchema = z.strictObject({
  title: z.string().trim().min(1, '建议标题不能为空'),
  rationale: z.string().optional(),
  okrId: z.string().optional(),
})

export type HabitCreateInput = z.infer<typeof habitCreateSchema>
export type HabitSuggestionInput = z.infer<typeof habitSuggestionSchema>

// ---- 收件区（settings 固定行 pmHabitInbox，数组只增；处理状态原地标注，不删 pending）----

export const HABIT_INBOX_ROW = 'pmHabitInbox'

export type HabitSuggestionStatus = 'pending' | 'confirmed' | 'ignored'

export interface HabitSuggestion {
  id: string
  at: string
  projectId: string
  title: string
  rationale?: string
  okrId?: string
  status: HabitSuggestionStatus
  /** confirm 后回写创建出的 habit 记录 ID。 */
  confirmedHabitId?: string
  processedAt?: string
  ignoredAt?: string
}

interface InboxShape { entries?: unknown[] }

/** 同步读收件区全部条目（坏行/非数组诚实回落为空，不臆造）。 */
export function readHabitInbox(domain: PmDomain): HabitSuggestion[] {
  const row = domain.table('settings').get(HABIT_INBOX_ROW) as { value?: unknown } | undefined
  const value = row?.value as InboxShape | undefined
  if (!value || typeof value !== 'object' || !Array.isArray(value.entries)) return []
  return value.entries.filter((e): e is HabitSuggestion =>
    !!e && typeof e === 'object' && 'id' in e && 'projectId' in e && 'status' in e,
  )
}

/** 按项目过滤收件区条目（默认只看 pending；includeProcessed=true 时连已处理/已忽略一起列）。 */
export function listHabitSuggestions(
  domain: PmDomain,
  projectId: string,
  options: { includeProcessed?: boolean } = {},
): HabitSuggestion[] {
  return readHabitInbox(domain)
    .filter(s => s.projectId === projectId && (options.includeProcessed || s.status === 'pending'))
    .map(s => structuredClone(s))
    .sort((a, b) => a.at.localeCompare(b.at))
}

// ---- ID 生成（与 okr/session 既有随机后缀模式一致）----

export function makeHabitId(now: Date = new Date()): string {
  return `habit-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function makeHabitSuggestionId(now: Date = new Date()): string {
  return `habitsug-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ---- 日期口径（UTC 日历日算术，与 gantt/ui-feedback 既有口径一致；today 由调用方注入）----

const DAY_MS = 86_400_000
const BACKFILL_WINDOW_DAYS = 2

function parseDay(iso: string): number {
  return Date.parse(iso)
}

/** later - earlier 的整天差（同一天=0，昨天=1）；日期不可解析时 NaN 由调用方前置校验拦截。 */
export function dayDiff(later: string, earlier: string): number {
  return Math.round((parseDay(later) - parseDay(earlier)) / DAY_MS)
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 校验 YYYY-MM-DD 形状且为真实日历日（拒绝 2026-02-31 这类伪日期）。 */
export function isValidDateIso(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const t = parseDay(value)
  if (!Number.isFinite(t)) return false
  return new Date(t).toISOString().slice(0, 10) === value
}

// ---- OKR 关联校验（存在性 + 同项目；参照 validateOkrRelations）----

/** okrId 显式传入时必须存在、与本项目同项目；缺省/空 = 不关联，放行。 */
export function validateHabitOkr(domain: PmDomain, projectId: string, okrId: string | undefined): string | undefined {
  if (!okrId) return undefined
  const target = domain.table('okrs').get(okrId)
  if (!target) throw new HabitOkrNotFoundError(`未找到关联目标：${okrId}`)
  if ((target as { projectId?: string }).projectId !== projectId) {
    throw new HabitOkrProjectMismatchError('关联目标不属于指定项目')
  }
  return okrId
}

// ---- streak 派生（纯函数：按 checkIns 日期重算；longest/totalDays 从全量历史得出，断签不清零）----

export interface HabitStreak {
  current: number
  lastDate?: string
  longest: number
  totalDays: number
}

/**
 * 连续段切分：相邻打卡日缺口 ≤ 2 天（补记窗内）属同一段；缺口 > 2 天 → 断签另起一段。
 * current 只取最新一段长度，且最新打卡日距 today 超过 2 天（断签超窗）时重置 0；
 * longest = 全部段的最长长度，totalDays = 去重后打卡日总数——二者随全量历史重算，永不随断签清零。
 */
export function deriveHabitStreak(
  record: Pick<HabitRecord, 'checkIns'>,
  todayIso: string,
): HabitStreak {
  const dates = [...new Set(record.checkIns.map(c => c.at))].sort()
  if (!dates.length) return { current: 0, longest: 0, totalDays: 0 }

  const segments: string[][] = [[dates[0]]]
  for (let i = 1; i < dates.length; i++) {
    const prev = dates[i - 1]
    const cur = dates[i]
    if (dayDiff(cur, prev) > BACKFILL_WINDOW_DAYS) segments.push([cur])
    else segments.at(-1)!.push(cur)
  }

  const longest = Math.max(...segments.map(segment => segment.length))
  const totalDays = dates.length
  const latest = dates.at(-1)!
  const stale = dayDiff(todayIso, latest) > BACKFILL_WINDOW_DAYS
  const current = stale ? 0 : segments.at(-1)!.length
  return { current, lastDate: latest, longest, totalDays }
}

/** 单条记录的纯文本档案行：「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」（无积分/动效/徽章）。 */
export function formatHabitArchiveLine(record: Pick<HabitRecord, 'checkIns'>, todayIso: string): string {
  const s = deriveHabitStreak(record, todayIso)
  return `当前连续 ${s.current} 天 · 历史最长 ${s.longest} 天 · 累计 ${s.totalDays} 天`
}

/**
 * 项目级文本归档：逐条产出档案行；records 为空返回空数组（空日如实留空，不补、不伪造连胜）。
 */
export function buildHabitArchive(records: HabitRecord[], todayIso: string): string[] {
  return records.map(r => formatHabitArchiveLine(r, todayIso))
}

// ---- 建议 → habit 记录转换（纯函数；confirm 时使用，产出 draft，不自动定稿）----

export function buildHabitRecordFromSuggestion(
  suggestion: HabitSuggestion,
  id: string,
  nowIso: string,
): HabitRecord {
  return habitRecordSchema.parse({
    id,
    projectId: suggestion.projectId,
    title: suggestion.title,
    ...(suggestion.okrId ? { okrId: suggestion.okrId } : {}),
    status: 'draft',
    checkIns: [],
    streak: { current: 0, longest: 0, totalDays: 0 },
    createdAt: nowIso,
    updatedAt: nowIso,
  })
}

// ---- 领域写 ----

export function getHabit(domain: PmDomain, id: string): HabitRecord | undefined {
  const record = domain.table('habits').get(id) as HabitRecord | undefined
  return record ? structuredClone(record) : undefined
}

export function listHabitsByProject(domain: PmDomain, projectId: string): HabitRecord[] {
  if (!domain.table('projects').get(projectId)) {
    throw new HabitProjectNotFoundError(`未找到项目：${projectId}`)
  }
  return [...domain.table('habits').entries()]
    .map(([, raw]) => raw as HabitRecord)
    .filter(rec => rec.projectId === projectId)
    .map(rec => structuredClone(rec))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** 人直接录入习惯（默认 draft；okrId 同项目存在性校验走串行写队列）。 */
export function addHabit(domain: PmDomain, projectId: string, input: unknown): Promise<HabitRecord> {
  const fields = habitCreateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(projectId)) {
      throw new HabitProjectNotFoundError(`未找到项目：${projectId}`)
    }
    const okrId = validateHabitOkr(domain, projectId, fields.okrId)
    const at = new Date().toISOString()
    const record = habitRecordSchema.parse({
      id: makeHabitId(),
      projectId,
      title: fields.title,
      ...(okrId ? { okrId } : {}),
      status: 'draft',
      checkIns: [],
      streak: { current: 0, longest: 0, totalDays: 0 },
      createdAt: at,
      updatedAt: at,
    })
    await domain.table('habits').put(record.id, record)
    return structuredClone(record)
  })
}

/**
 * 打卡：缺省今天；只允许今天 + 过去 2 天回填（backfilled:true），超窗/未来中文拒绝。
 * 打卡后按全量 checkIns 重算 streak 落库（断签超窗 current 重置 0，longest/totalDays 永久保留）。
 */
export function checkinHabit(
  domain: PmDomain,
  id: string,
  dateIso?: string,
  note?: string,
): Promise<HabitRecord> {
  const todayIso = localTodayIso()
  const requested = (dateIso ?? '').trim()
  const trimmedNote = note?.trim()
  // 日期/补记窗校验放进串行写队列内，所有拒绝一律走异步 rejection（与其它领域写同构）。
  return enqueueDomainWrite(domain, async () => {
    if (requested && !isValidDateIso(requested)) {
      throw new HabitCheckinWindowError('打卡日期须为有效 YYYY-MM-DD（如 2026-10-18）')
    }
    const date = requested || todayIso
    const gap = dayDiff(todayIso, date)
    if (gap < 0) {
      throw new HabitCheckinWindowError(`不能为未来日期 ${date} 打卡（打卡只面向今天及过去）`)
    }
    if (gap > BACKFILL_WINDOW_DAYS) {
      const windowStart = new Date(parseDay(todayIso) - BACKFILL_WINDOW_DAYS * DAY_MS).toISOString().slice(0, 10)
      throw new HabitCheckinWindowError(
        `只能打卡今天或过去 ${BACKFILL_WINDOW_DAYS} 天内（${windowStart} ~ ${todayIso}），${date} 超出补记窗`,
      )
    }
    const backfilled = gap > 0
    const table = domain.table('habits')
    const current = table.get(id) as HabitRecord | undefined
    if (!current) throw new HabitNotFoundError(`未找到习惯：${id}`)
    const nextCheckIns = [
      ...current.checkIns,
      { at: date, backfilled, ...(trimmedNote ? { note: trimmedNote } : {}) },
    ]
    const next = habitRecordSchema.parse({
      ...current,
      checkIns: nextCheckIns,
      streak: deriveHabitStreak({ checkIns: nextCheckIns }, todayIso),
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

/**
 * agent 代起草习惯建议：纯追加进 settings 收件区，不创建 habits 记录（未确认不生效）。
 * okrId 存在性留到 confirm 时校验（建议可指向尚未建立的目标）。
 */
export function suggestHabit(domain: PmDomain, projectId: string, input: unknown): Promise<HabitSuggestion> {
  const fields = habitSuggestionSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(projectId)) {
      throw new HabitProjectNotFoundError(`未找到项目：${projectId}`)
    }
    const at = new Date().toISOString()
    const suggestion: HabitSuggestion = {
      id: makeHabitSuggestionId(),
      at,
      projectId,
      title: fields.title,
      ...(fields.rationale ? { rationale: fields.rationale } : {}),
      ...(fields.okrId ? { okrId: fields.okrId } : {}),
      status: 'pending',
    }
    const entries = [...readHabitInbox(domain), suggestion]
    await domain.table('settings').put(HABIT_INBOX_ROW, {
      value: { entries },
      updatedAt: at,
    })
    return structuredClone(suggestion)
  })
}

/** 人确认建议 → 创建 draft habit 记录 + 建议标 confirmed（不自动定稿）；confirm 时才做 okrId 校验。 */
export function confirmHabitSuggestion(
  domain: PmDomain,
  suggestionId: string,
): Promise<{ suggestion: HabitSuggestion; record: HabitRecord }> {
  return enqueueDomainWrite(domain, async () => {
    const entries = readHabitInbox(domain)
    const suggestion = entries.find(s => s.id === suggestionId)
    if (!suggestion) throw new HabitSuggestionNotFoundError(`未找到建议：${suggestionId}`)
    if (suggestion.status !== 'pending') {
      throw new HabitSuggestionAlreadyProcessedError(
        suggestion.status === 'confirmed' ? '该建议已确认过' : '该建议已被忽略，如需采纳请重新建议或直接录入',
      )
    }
    validateHabitOkr(domain, suggestion.projectId, suggestion.okrId)
    const at = new Date().toISOString()
    const record = buildHabitRecordFromSuggestion(suggestion, makeHabitId(), at)
    await domain.table('habits').put(record.id, record)
    const updated: HabitSuggestion = {
      ...suggestion,
      status: 'confirmed',
      confirmedHabitId: record.id,
      processedAt: at,
    }
    await domain.table('settings').put(HABIT_INBOX_ROW, {
      value: { entries: entries.map(s => (s.id === suggestionId ? updated : s)) },
      updatedAt: at,
    })
    return { suggestion: structuredClone(updated), record: structuredClone(record) }
  })
}

/** 人忽略建议：保留在收件区标 ignored（可逆，不删除）。 */
export function ignoreHabitSuggestion(domain: PmDomain, suggestionId: string): Promise<HabitSuggestion> {
  return enqueueDomainWrite(domain, async () => {
    const entries = readHabitInbox(domain)
    const suggestion = entries.find(s => s.id === suggestionId)
    if (!suggestion) throw new HabitSuggestionNotFoundError(`未找到建议：${suggestionId}`)
    if (suggestion.status !== 'pending') {
      throw new HabitSuggestionAlreadyProcessedError(
        suggestion.status === 'confirmed' ? '该建议已确认过，不能再忽略' : '该建议已被忽略',
      )
    }
    const at = new Date().toISOString()
    const updated: HabitSuggestion = { ...suggestion, status: 'ignored', ignoredAt: at }
    await domain.table('settings').put(HABIT_INBOX_ROW, {
      value: { entries: entries.map(s => (s.id === suggestionId ? updated : s)) },
      updatedAt: at,
    })
    return structuredClone(updated)
  })
}

/** 人定稿：draft/confirmed → final；已是 final 直接返回（幂等，无自动定稿）。 */
export function finalizeHabit(domain: PmDomain, id: string): Promise<HabitRecord | undefined> {
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('habits')
    const current = table.get(id) as HabitRecord | undefined
    if (!current) throw new HabitNotFoundError(`未找到习惯：${id}`)
    if (current.status === 'final') return structuredClone(current)
    const next = habitRecordSchema.parse({
      ...current,
      status: 'final',
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

// ---- zod 中文报错描述（与 okr 命令层同构）----

const HABIT_FIELD_LABELS: Record<string, string> = {
  title: '习惯名（非空文本）',
  okrId: '关联 OKR ID（须同项目存在，可空）',
  rationale: '建议理由（文本，可空）',
}

export function describeHabitValidation(error: z.ZodError): string {
  return [...new Set(error.issues.map(issue =>
    issue.code === 'unrecognized_keys'
      ? '包含不支持的字段；ID、项目归属和时间戳由系统生成'
      : issue.code === 'custom'
        ? issue.message
        : (HABIT_FIELD_LABELS[String(issue.path[0])] ?? '习惯字段格式不正确'),
  ))].join('；')
}
