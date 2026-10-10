/** 风险与问题字段及运行时校验；字段来源：requirements R7。 */
import { z } from 'zod'
import { projectIdSchema } from './project.js'

export const riskIssueIdSchema = z.string().regex(
  /^ri-\d+$/,
  '风险/问题 ID 格式应为 ri-数字',
)
export const riskIssueTypeSchema = z.enum(['risk', 'issue'])
export const riskIssueStatusSchema = z.enum(['open', 'monitoring', 'closed'])
export const riskProbabilitySchema = z.enum(['low', 'medium', 'high'])
export const riskImpactSchema = z.enum(['low', 'medium', 'high', 'critical'])

export const riskIssueTypeLabels: Record<z.infer<typeof riskIssueTypeSchema>, string> = {
  risk: '风险',
  issue: '问题',
}
export const riskIssueStatusLabels: Record<z.infer<typeof riskIssueStatusSchema>, string> = {
  open: '待处理',
  monitoring: '跟进中',
  closed: '已关闭',
}
export const riskProbabilityLabels: Record<z.infer<typeof riskProbabilitySchema>, string> = {
  low: '低',
  medium: '中',
  high: '高',
}
export const riskImpactLabels: Record<z.infer<typeof riskImpactSchema>, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
}

const dateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' })
const riskIssueFields = {
  type: riskIssueTypeSchema,
  title: z.string().trim().min(1, '标题不能为空'),
  description: z.string(),
  owner: z.string(),
  dueDate: dateSchema.nullable(),
  status: riskIssueStatusSchema,
  probability: riskProbabilitySchema.nullable(),
  impact: riskImpactSchema,
  responsePlan: z.string(),
  solution: z.string(),
}

function validateTypeFields(
  value: {
    type: z.infer<typeof riskIssueTypeSchema>
    probability: z.infer<typeof riskProbabilitySchema> | null
    responsePlan: string
    solution: string
  },
  context: z.RefinementCtx,
): void {
  if (value.type === 'risk') {
    if (!value.probability) {
      context.addIssue({ code: 'custom', path: ['probability'], message: '风险必须填写概率' })
    }
    if (value.solution) {
      context.addIssue({ code: 'custom', path: ['solution'], message: '风险不使用解决方案字段，请填写 responsePlan' })
    }
    return
  }
  if (value.probability) {
    context.addIssue({ code: 'custom', path: ['probability'], message: '问题的概率必须为 null' })
  }
  if (value.responsePlan) {
    context.addIssue({ code: 'custom', path: ['responsePlan'], message: '问题不使用应对措施字段，请填写 solution' })
  }
}

export const riskIssueRecordSchema = z.strictObject({
  id: riskIssueIdSchema,
  projectId: projectIdSchema,
  ...riskIssueFields,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const riskIssueWriteSchema = riskIssueRecordSchema.superRefine(validateTypeFields)

export const riskIssueCreateSchema = z.strictObject({
  projectId: projectIdSchema,
  type: riskIssueTypeSchema,
  title: riskIssueFields.title,
  description: z.string().default(''),
  owner: z.string().default(''),
  dueDate: dateSchema.nullable().default(null),
  status: riskIssueStatusSchema.default('open'),
  probability: riskProbabilitySchema.nullable().default(null),
  impact: riskImpactSchema,
  responsePlan: z.string().default(''),
  solution: z.string().default(''),
}).superRefine(validateTypeFields)

export const riskIssueUpdateSchema = z.strictObject({
  title: riskIssueFields.title.optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
  dueDate: dateSchema.nullable().optional(),
  status: riskIssueStatusSchema.optional(),
  probability: riskProbabilitySchema.nullable().optional(),
  impact: riskImpactSchema.optional(),
  responsePlan: z.string().optional(),
  solution: z.string().optional(),
}).refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段')

export type RiskIssue = z.infer<typeof riskIssueRecordSchema>
export type RiskIssueUpdate = z.infer<typeof riskIssueUpdateSchema>
export type RiskIssueType = z.infer<typeof riskIssueTypeSchema>
export type RiskIssueStatus = z.infer<typeof riskIssueStatusSchema>

export function describeRiskIssueValidation(error: z.ZodError): string {
  const labels: Record<string, string> = {
    projectId: '项目 ID',
    type: '类型（risk/issue）',
    title: '标题（非空文本）',
    description: '说明（文本）',
    owner: '负责人（文本）',
    dueDate: '截止日期（有效 YYYY-MM-DD 或 null）',
    status: '状态（open/monitoring/closed）',
    probability: '概率（low/medium/high 或 null）',
    impact: '影响（low/medium/high/critical）',
    responsePlan: '应对措施（文本）',
    solution: '解决方案（文本）',
  }
  return [...new Set(error.issues.map(issue =>
    issue.code === 'unrecognized_keys'
      ? '包含不支持的字段；类型、项目、ID 和时间戳不可在更新中修改'
      : issue.code === 'custom'
        ? issue.message
        : (labels[String(issue.path[0])] ?? '风险/问题字段格式不正确'),
  ))].join('；')
}
