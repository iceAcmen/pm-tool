/** 里程碑字段与运行时校验；字段来源：requirements v0.4 §4.3。 */
import { z } from 'zod'
import { projectIdSchema } from './project.js'

export const milestoneIdSchema = z.string().regex(
  /^[a-zA-Z0-9_-]+$/,
  '里程碑 ID 只能包含字母、数字、下划线和连字符',
)
export const milestoneStatusSchema = z.enum(['planned', 'at_risk', 'achieved', 'missed'])

export const milestoneStatusLabels: Record<z.infer<typeof milestoneStatusSchema>, string> = {
  planned: '计划中',
  at_risk: '有风险',
  achieved: '已达成',
  missed: '已错过',
}

const dateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' })

export const milestoneRecordSchema = z.strictObject({
  id: milestoneIdSchema,
  projectId: projectIdSchema,
  title: z.string().trim().min(1, '里程碑标题不能为空'),
  targetDate: dateSchema,
  status: milestoneStatusSchema,
  achievedDate: dateSchema.nullable(),
  description: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const milestoneCreateSchema = z.strictObject({
  projectId: projectIdSchema,
  title: z.string().trim().min(1, '里程碑标题不能为空'),
  targetDate: dateSchema,
  status: milestoneStatusSchema.default('planned'),
  achievedDate: dateSchema.nullable().default(null),
  description: z.string().default(''),
})

export type Milestone = z.infer<typeof milestoneRecordSchema>

export function describeMilestoneValidation(error: z.ZodError): string {
  const labels: Record<string, string> = {
    projectId: '项目 ID',
    title: '标题（非空文本）',
    targetDate: '目标日期（有效 YYYY-MM-DD）',
    status: '状态（planned/at_risk/achieved/missed）',
    achievedDate: '实际达成日期（有效 YYYY-MM-DD 或 null）',
    description: '说明/达成标准（文本）',
  }
  return [...new Set(error.issues.map(issue =>
    issue.code === 'unrecognized_keys'
      ? '包含不支持的字段；ID 和时间戳由系统生成'
      : (labels[String(issue.path[0])] ?? '里程碑字段格式不正确'),
  ))].join('；')
}
