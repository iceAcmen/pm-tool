/** 进度汇报及固定快照 schema。 */
import { z } from 'zod'
import { projectIdSchema, projectStatusSchema } from './project.js'

const dateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' })
const textListSchema = z.array(z.string().trim().min(1, '列表项不能为空'))

export const progressReportIdSchema = z.string().regex(/^rpt-\d+$/, '汇报 ID 格式应为 rpt-数字')
export const progressReportStatusSchema = z.enum(['draft', 'final'])
export const progressReportStatusLabels = { draft: '草稿', final: '已定稿' } as const

/** U5 report-type 来源枚举（对齐 meetingSourceTypeSchema）：manual 手工 / session 会话派生。 */
export const progressReportSourceTypeSchema = z.enum(['manual', 'session'])
export const progressReportSourceTypeLabels = { manual: '手工录入', session: '会话派生' } as const
const sourceSessionIdSchema = z.string().trim().min(1, '会话来源 ID 不能为空').nullable()

// B6 冻结摘录：生成汇报时把选中的进展条目某一修订版快照固化（source entryId + revisionId + 正文快照），
// 之后日志追加新 revision 不回改已冻结摘录；不做整报告 revisions/restore。
const excerptIdSchema = z.string().regex(/^ex-\d+$/, '摘录 ID 格式应为 ex-数字')
const progressEntryRefSchema = z.string().regex(/^pl-\d+$/, '进展条目 ID 格式应为 pl-数字')
const revisionRefSchema = z.string().regex(/^rv-\d+$/, '修订版 ID 格式应为 rv-数字')
/**
 * B6 复合选择器：pl-N 是【每任务局部序号】，裸 entryId 会跨任务撞号错选，
 * 必须带 taskId 定位；revisionId 可选，用于精确冻结用户预览的那一条修订版（而非静默抓最新）。
 */
export const selectedRefSchema = z.strictObject({
  taskId: z.string().regex(/^t-\d+$/, '任务 ID 格式应为 t-数字'),
  entryId: progressEntryRefSchema,
  revisionId: revisionRefSchema.optional(),
})
export type SelectedRef = z.infer<typeof selectedRefSchema>
export const FROZEN_EXCERPTS_MAX = 50
export const frozenExcerptSchema = z.strictObject({
  id: excerptIdSchema,
  taskId: z.string().regex(/^t-\d+$/, '任务 ID 格式应为 t-数字'),
  sourceKind: z.literal('progress'),
  entryId: progressEntryRefSchema,
  revisionId: revisionRefSchema,
  contentSnapshot: z.string().trim().min(1, '摘录正文不能为空').max(2000, '摘录正文最长 2000 字'),
  author: z.string().trim().min(1, '摘录作者不能为空'),
  date: dateSchema,
  capturedAt: z.iso.datetime(),
})
export const frozenExcerptsSchema = z.array(frozenExcerptSchema)
  .max(FROZEN_EXCERPTS_MAX, `冻结摘录最多 ${FROZEN_EXCERPTS_MAX} 条`)
  .refine(items => new Set(items.map(i => i.id)).size === items.length, '摘录 ID 必须唯一')


export const progressExceptionSchema = z.strictObject({
  kind: z.enum(['blocked_task', 'overdue_task', 'milestone', 'risk_issue', 'overdue_action']),
  severity: z.enum(['warning', 'critical']),
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  owner: z.string(),
  dueDate: dateSchema.nullable(),
})

export const progressSnapshotSchema = z.strictObject({
  project: z.strictObject({
    name: z.string(),
    owner: z.string(),
    status: projectStatusSchema,
    targetDate: dateSchema,
  }),
  tasks: z.strictObject({
    total: z.number().int().nonnegative(),
    todo: z.number().int().nonnegative(),
    inProgress: z.number().int().nonnegative(),
    blocked: z.number().int().nonnegative(),
    done: z.number().int().nonnegative(),
    // v0.8：客观进度口径放宽为可空——无清单覆盖叶子时为 null（证据不足，不是 0）。
    averageProgress: z.number().int().min(0).max(100).nullable(),
    // v0.8：快照算法版本。用 optional（不用 default）——旧库快照缺该键时「缺键进、缺键出」，
    // 用户 update 旧汇报 parse 后回写不得注入/回填 calcVersion（OP-SRC-04 历史快照不回填重算）；
    // 新生成快照显式写 1。消费侧经 snapshotCalcVersion() 归一为 number（缺省按 0）。
    calcVersion: z.number().int().nonnegative().optional(),
  }),
  milestones: z.strictObject({
    total: z.number().int().nonnegative(),
    achieved: z.number().int().nonnegative(),
    atRisk: z.number().int().nonnegative(),
    missed: z.number().int().nonnegative(),
  }),
  meetings: z.strictObject({
    inPeriod: z.number().int().nonnegative(),
    decisions: z.number().int().nonnegative(),
  }),
  periodMilestones: z.array(z.strictObject({
    id: z.string(),
    title: z.string(),
    targetDate: dateSchema,
    status: z.string(),
  })),
  periodMeetings: z.array(z.strictObject({
    id: z.string(),
    title: z.string(),
    meetingDate: dateSchema,
    decisions: z.array(z.string()),
  })),
  exceptions: z.array(progressExceptionSchema),
})

const mutableFields = {
  title: z.string().trim().min(1, '汇报标题不能为空'),
  status: progressReportStatusSchema,
  executiveSummary: z.string(),
  completedWork: textListSchema,
  nextPlans: textListSchema,
  blockers: textListSchema,
}

export const progressReportRecordSchema = z.strictObject({
  id: progressReportIdSchema,
  projectId: projectIdSchema,
  periodStart: dateSchema,
  periodEnd: dateSchema,
  ...mutableFields,
  snapshotAt: z.iso.datetime(),
  snapshot: progressSnapshotSchema,
  excerpts: frozenExcerptsSchema.optional(),
  sourceType: progressReportSourceTypeSchema,
  sourceSessionId: sourceSessionIdSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).refine(value => value.periodEnd >= value.periodStart, {
  path: ['periodEnd'],
  message: '周期结束日期不能早于开始日期',
}).refine(value => {
  // U5：session 必须带非空 sourceSessionId；manual 必须为 null（不混用）。
  if (value.sourceType === 'session') return value.sourceSessionId != null
  return value.sourceSessionId === null
}, {
  path: ['sourceSessionId'],
  message: 'session 来源必须提供 sourceSessionId；manual 来源 sourceSessionId 必须为 null',
})

export const progressReportGenerateSchema = z.strictObject({
  projectId: projectIdSchema,
  periodStart: dateSchema,
  periodEnd: dateSchema,
  title: mutableFields.title.optional(),
  status: progressReportStatusSchema.default('draft'),
  executiveSummary: z.string().default(''),
  completedWork: textListSchema.default([]),
  nextPlans: textListSchema.default([]),
  blockers: textListSchema.default([]),
  excerpts: frozenExcerptsSchema.optional(),
  /** B6：复合选择器（taskId+entryId+可选 revisionId），由后端冻结指定修订版（与 excerpts 互斥，不得同传）。 */
  selectedRefs: z.array(selectedRefSchema).optional(),
  /** U5：来源类型，缺省 manual；session 须带 sourceSessionId。 */
  sourceType: progressReportSourceTypeSchema.default('manual'),
  sourceSessionId: sourceSessionIdSchema.optional(),
}).refine(value => value.periodEnd >= value.periodStart, {
  path: ['periodEnd'],
  message: '周期结束日期不能早于开始日期',
}).refine(value => !(value.excerpts && value.selectedRefs), {
  message: 'excerpts 与 selectedRefs 二选一，不得同时提供（后端不静默忽略任一输入）',
}).refine(value => {
  if (value.sourceType === 'session') return value.sourceSessionId != null
  return value.sourceSessionId == null
}, {
  path: ['sourceSessionId'],
  message: 'session 来源必须提供 sourceSessionId；manual 来源不得传 sourceSessionId',
})

export const progressReportUpdateSchema = z.strictObject({
  title: mutableFields.title.optional(),
  status: progressReportStatusSchema.optional(),
  executiveSummary: z.string().optional(),
  completedWork: textListSchema.optional(),
  nextPlans: textListSchema.optional(),
  blockers: textListSchema.optional(),
  excerpts: frozenExcerptsSchema.optional(),
}).refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段')

export type ProgressReport = z.infer<typeof progressReportRecordSchema>
export type ProgressReportStatus = z.infer<typeof progressReportStatusSchema>
export type ProgressSnapshot = z.infer<typeof progressSnapshotSchema>

export function describeProgressReportValidation(error: z.ZodError): string {
  if (error.issues.some(issue => issue.code === 'unrecognized_keys')) {
    return '包含不支持的字段；项目、周期、快照、来源、ID 和时间戳由生成操作或系统维护'
  }
  return [...new Set(error.issues.map(issue => issue.message))].join('；')
}

/**
 * U5 只读归一：旧记录可能缺 sourceType/sourceSessionId。读取/快照/更新前补成 manual/null，
 * 不回写物理存储；非法 sourceType 也回落 manual，session 缺/空 sid 回落 manual/null。
 */
export function normalizeProgressReportRecord(row: unknown): ProgressReport {
  const r = (row ?? {}) as Record<string, unknown>
  const rawSessionId = typeof r.sourceSessionId === 'string' ? r.sourceSessionId.trim() : ''
  const sourceType = r.sourceType === 'session' && rawSessionId ? 'session' : 'manual'
  const sourceSessionId = sourceType === 'session' ? rawSessionId : null
  return { ...r, sourceType, sourceSessionId } as ProgressReport
}

/**
 * 只读归一：快照的 calcVersion 可能缺键（v0.7.x 及更早的历史快照）。
 * 比较/展示时一律经此归一——缺省按 0（旧口径），绝不因此改写快照本身。
 */
export function snapshotCalcVersion(snapshot: ProgressSnapshot): number {
  return snapshot.tasks.calcVersion ?? 0
}
