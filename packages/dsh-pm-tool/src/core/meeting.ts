/** 会议纪要与内嵌行动项 schema；生成型来源字段仅预留，不在 R8 首版使用。 */
import { z } from 'zod'
import { projectIdSchema } from './project.js'
import { riskIssueIdSchema } from './risk-issue.js'
import { taskIdSchema } from './task.js'

export const meetingIdSchema = z.string().regex(/^mtg-\d+$/, '会议 ID 格式应为 mtg-数字')
export const meetingActionIdSchema = z.string().regex(/^ai-\d+$/, '行动项 ID 格式应为 ai-数字')
export const meetingStatusSchema = z.enum(['draft', 'final'])
export const meetingActionStatusSchema = z.enum(['todo', 'in_progress', 'done', 'cancelled'])
export const meetingSourceTypeSchema = z.enum(['manual', 'session'])

export const meetingStatusLabels = { draft: '草稿', final: '已定稿' } as const
export const meetingActionStatusLabels = {
  todo: '未开始',
  in_progress: '进行中',
  done: '已完成',
  cancelled: '已取消',
} as const

const dateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' })
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '时间须为有效的 HH:mm')
const textListSchema = z.array(z.string().trim().min(1, '列表项不能为空'))

export const meetingActionSchema = z.strictObject({
  id: meetingActionIdSchema,
  title: z.string().trim().min(1, '行动项标题不能为空'),
  owner: z.string(),
  dueDate: dateSchema.nullable(),
  status: meetingActionStatusSchema,
  taskId: taskIdSchema.nullable(),
  riskIssueId: riskIssueIdSchema.nullable(),
})

export const meetingActionCreateSchema = z.strictObject({
  title: z.string().trim().min(1, '行动项标题不能为空'),
  owner: z.string().default(''),
  dueDate: dateSchema.nullable().default(null),
  status: meetingActionStatusSchema.default('todo'),
  taskId: taskIdSchema.nullable().default(null),
  riskIssueId: riskIssueIdSchema.nullable().default(null),
})

export const meetingActionUpdateSchema = z.strictObject({
  title: z.string().trim().min(1, '行动项标题不能为空').optional(),
  owner: z.string().optional(),
  dueDate: dateSchema.nullable().optional(),
  status: meetingActionStatusSchema.optional(),
  taskId: taskIdSchema.nullable().optional(),
  riskIssueId: riskIssueIdSchema.nullable().optional(),
}).refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段')

export const meetingRecordSchema = z.strictObject({
  id: meetingIdSchema,
  projectId: projectIdSchema,
  title: z.string().trim().min(1, '会议标题不能为空'),
  meetingDate: dateSchema,
  startTime: timeSchema.nullable(),
  durationMinutes: z.number().int().min(1).max(1440).nullable(),
  location: z.string(),
  facilitator: z.string(),
  recorder: z.string(),
  participants: z.array(z.string()),
  status: meetingStatusSchema,
  summary: z.string(),
  topics: z.array(z.string()),
  decisions: z.array(z.string()),
  actions: z.array(meetingActionSchema),
  notes: z.string().default(''),
  sourceType: meetingSourceTypeSchema,
  sourceSessionId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const meetingCreateSchema = z.strictObject({
  projectId: projectIdSchema,
  title: z.string().trim().min(1, '会议标题不能为空'),
  meetingDate: dateSchema,
  startTime: timeSchema.nullable().default(null),
  durationMinutes: z.number().int().min(1).max(1440).nullable().default(null),
  location: z.string().default(''),
  facilitator: z.string().default(''),
  recorder: z.string().default(''),
  participants: textListSchema.default([]),
  status: meetingStatusSchema.default('draft'),
  summary: z.string().default(''),
  topics: textListSchema.default([]),
  decisions: textListSchema.default([]),
  notes: z.string().default(''),
})

export const meetingUpdateSchema = z.strictObject({
  title: z.string().trim().min(1, '会议标题不能为空').optional(),
  meetingDate: dateSchema.optional(),
  startTime: timeSchema.nullable().optional(),
  durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  location: z.string().optional(),
  facilitator: z.string().optional(),
  recorder: z.string().optional(),
  participants: textListSchema.optional(),
  status: meetingStatusSchema.optional(),
  summary: z.string().optional(),
  topics: textListSchema.optional(),
  decisions: textListSchema.optional(),
  notes: z.string().optional(),
}).refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段')

export type Meeting = z.infer<typeof meetingRecordSchema>
export type MeetingAction = z.infer<typeof meetingActionSchema>
export type MeetingStatus = z.infer<typeof meetingStatusSchema>
export type MeetingUpdate = z.infer<typeof meetingUpdateSchema>
export type MeetingActionUpdate = z.infer<typeof meetingActionUpdateSchema>

export function normalizeTextList(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
}

export function describeMeetingValidation(error: z.ZodError): string {
  if (error.issues.some(issue => issue.code === 'unrecognized_keys')) {
    return '包含不支持的字段；项目、行动项集合、来源、ID 和时间戳须使用专用命令或由系统维护'
  }
  return [...new Set(error.issues.map(issue => issue.message))].join('；')
}
