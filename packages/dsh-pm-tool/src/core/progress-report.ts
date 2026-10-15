/** 进度汇报及固定快照 schema。 */
import { z } from 'zod'
import { projectIdSchema, projectStatusSchema } from './project.js'

const dateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' })
const textListSchema = z.array(z.string().trim().min(1, '列表项不能为空'))

export const progressReportIdSchema = z.string().regex(/^rpt-\d+$/, '汇报 ID 格式应为 rpt-数字')
export const progressReportStatusSchema = z.enum(['draft', 'final'])
export const progressReportStatusLabels = { draft: '草稿', final: '已定稿' } as const

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
  sourceType: z.literal('manual'),
  sourceSessionId: z.null(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).refine(value => value.periodEnd >= value.periodStart, {
  path: ['periodEnd'],
  message: '周期结束日期不能早于开始日期',
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
}).refine(value => value.periodEnd >= value.periodStart, {
  path: ['periodEnd'],
  message: '周期结束日期不能早于开始日期',
})

export const progressReportUpdateSchema = z.strictObject({
  title: mutableFields.title.optional(),
  status: progressReportStatusSchema.optional(),
  executiveSummary: z.string().optional(),
  completedWork: textListSchema.optional(),
  nextPlans: textListSchema.optional(),
  blockers: textListSchema.optional(),
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
 * 只读归一：快照的 calcVersion 可能缺键（v0.7.x 及更早的历史快照）。
 * 比较/展示时一律经此归一——缺省按 0（旧口径），绝不因此改写快照本身。
 */
export function snapshotCalcVersion(snapshot: ProgressSnapshot): number {
  return snapshot.tasks.calcVersion ?? 0
}
