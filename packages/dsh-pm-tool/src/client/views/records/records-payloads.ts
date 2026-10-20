/**
 * records 分片（B6）表单原始字符串 → panel 回调 payload 的纯归一器。
 *
 * 边界（冻结于 shared/records-props.ts）：
 * - 分片只调回调（onSaveMeeting / onGeneratePeriod / onSaveDeliverable …），**不拼命令行、不写库**；
 *   命令映射由 panel 实现，本模块只把表单字符串整理成回调期望的 payload 对象。
 * - 无 DOM、无随机、无墙钟；可在 node 单测直接覆盖。
 *
 * 列表字段按 换行 / 、 / ， 拆分、trim、去空、去重保序；可空日期/时间/外键空串归一为 null。
 */
import type {
  MeetingPayload,
  MeetingActionPayload,
  ReportPayload,
  DeliverablePayload,
} from '../../shared/records-props.js'

/** 文本域 → 字符串数组（换行 / 顿号 / 中英文逗号分隔），去空去重保序。 */
export function parseTextList(raw: unknown): string[] {
  const parts = String(raw ?? '')
    .split(/\n|、|，/)
    .map(item => item.trim())
    .filter(Boolean)
  return [...new Set(parts)]
}

/** 空串归一为 null（可空日期 / 时间 / 外键位）。 */
function emptyToNull(value: string | null | undefined): string | null {
  const v = (value ?? '').trim()
  return v ? v : null
}

function clampOr<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return (value as T) && allowed.includes(value as T) ? (value as T) : fallback
}

// ---------- 会议 ----------

export const MEETING_STATUSES = ['draft', 'final'] as const
export const MEETING_ACTION_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'] as const

export interface MeetingFormRaw {
  title: string
  meetingDate: string
  startTime?: string
  durationMinutes?: string
  location?: string
  facilitator?: string
  recorder?: string
  participants?: string
  status?: string
  summary?: string
  topics?: string
  decisions?: string
  notes?: string
}

/** 归一会议 payload（对齐 MeetingPayload）。 */
export function normalizeMeetingPayload(input: MeetingFormRaw): MeetingPayload {
  const duration = (input.durationMinutes ?? '').trim()
  return {
    title: input.title.trim(),
    meetingDate: input.meetingDate,
    startTime: emptyToNull(input.startTime),
    durationMinutes: duration ? Number(duration) : null,
    location: (input.location ?? '').trim(),
    facilitator: (input.facilitator ?? '').trim(),
    recorder: (input.recorder ?? '').trim(),
    participants: parseTextList(input.participants),
    status: clampOr(input.status, MEETING_STATUSES, 'draft'),
    summary: (input.summary ?? '').trim(),
    topics: parseTextList(input.topics),
    decisions: parseTextList(input.decisions),
    notes: (input.notes ?? '').trim(),
  }
}

export interface MeetingActionFormRaw {
  title: string
  owner?: string
  dueDate?: string
  status?: string
  taskId?: string
  riskIssueId?: string
}

/** 归一会议行动项 payload（对齐 MeetingActionPayload）。 */
export function normalizeMeetingActionPayload(input: MeetingActionFormRaw): MeetingActionPayload {
  return {
    title: String(input.title ?? '').trim(),
    owner: (input.owner ?? '').trim(),
    dueDate: emptyToNull(input.dueDate),
    status: clampOr(input.status, MEETING_ACTION_STATUSES, 'todo'),
    taskId: emptyToNull(input.taskId),
    riskIssueId: emptyToNull(input.riskIssueId),
  }
}

// ---------- 进度汇报 ----------

export const REPORT_STATUSES = ['draft', 'final'] as const
export const REPORT_SOURCES = ['manual', 'session'] as const

export interface ReportFormRaw {
  title?: string
  status?: string
  executiveSummary?: string
  completedWork?: string
  nextPlans?: string
  blockers?: string
  /** U5 来源类型：manual / session（缺省 manual）。 */
  sourceType?: string
  /** U5 session 来源会话 ID；manual 归一为 null，session 需非空。 */
  sourceSessionId?: string
}

/**
 * 归一汇报正文 payload（对齐 ReportPayload）。
 * 标题仅非空带上（留空由 generate 按项目+周期自动命名）；周期在命令位，不进 payload。
 * U5：manual → sourceSessionId=null；session → 非空 sourceSessionId（缺空由表单校验拦截）。
 */
export function normalizeReportPayload(input: ReportFormRaw): ReportPayload {
  const title = (input.title ?? '').trim()
  const sourceType = clampOr(input.sourceType, REPORT_SOURCES, 'manual')
  const sessionId = (input.sourceSessionId ?? '').trim()
  return {
    ...(title ? { title } : {}),
    status: clampOr(input.status, REPORT_STATUSES, 'draft'),
    executiveSummary: (input.executiveSummary ?? '').trim(),
    completedWork: parseTextList(input.completedWork),
    nextPlans: parseTextList(input.nextPlans),
    blockers: parseTextList(input.blockers),
    sourceType,
    sourceSessionId: sourceType === 'session' ? sessionId || null : null,
  }
}

// ---------- 交付物 ----------

export const DELIVERABLE_STATUSES = ['planned', 'in_progress', 'submitted', 'accepted', 'wrapped'] as const

export interface DeliverableFormRaw {
  name: string
  version?: string
  owner?: string
  status?: string
  location?: string
  description?: string
  dueDate?: string
  changeNote?: string
  repoUrl?: string
  branch?: string
  /** U5 关联里程碑 id（同项目；空串归一 null = 解除关联）。 */
  milestoneId?: string
  /** U5 备注（区别于 description；空省略）。 */
  note?: string
}

/**
 * 归一交付物 payload（对齐 DeliverablePayload）。
 * 仓库地址/分支始终为字符串（清空传 ''，由 panel/core 删键）；changeNote 仅非空带上。
 * 状态钳制在五态（含 wrapped 已收尾，人显式手动写入，非正式验收）。
 * U5：milestoneId 空→null（解除关联）；note 非空才带，空省略。
 */
export function normalizeDeliverablePayload(input: DeliverableFormRaw): DeliverablePayload {
  const changeNote = (input.changeNote ?? '').trim()
  const note = (input.note ?? '').trim()
  return {
    name: input.name.trim(),
    version: (input.version ?? '').trim(),
    owner: (input.owner ?? '').trim(),
    status: clampOr(input.status, DELIVERABLE_STATUSES, 'planned'),
    location: (input.location ?? '').trim(),
    description: (input.description ?? '').trim(),
    dueDate: emptyToNull(input.dueDate),
    ...(changeNote ? { changeNote } : {}),
    repoUrl: (input.repoUrl ?? '').trim(),
    branch: (input.branch ?? '').trim(),
    milestoneId: emptyToNull(input.milestoneId),
    ...(note ? { note } : {}),
  }
}
