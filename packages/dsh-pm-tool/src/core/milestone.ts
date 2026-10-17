/** 里程碑字段与运行时校验；字段来源：requirements v0.4 §4.3。 */
import { z } from 'zod'
import { projectIdSchema } from './project.js'

export const milestoneIdSchema = z.string().regex(
  /^[a-zA-Z0-9_-]+$/,
  '里程碑 ID 只能包含字母、数字、下划线和连字符',
)
export const milestoneStatusSchema = z.enum(['planned', 'at_risk', 'achieved', 'missed'])
// 标签单一来源在 labels.ts（zod-free），此处再导出兼容既有引用。
export { milestoneStatusLabels } from './labels.js'

const dateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' })

const milestoneFields = {
  title: z.string().trim().min(1, '里程碑标题不能为空'),
  targetDate: dateSchema,
  status: milestoneStatusSchema,
  achievedDate: dateSchema.nullable(),
  description: z.string(),
}

function validateStatus(
  value: { status?: z.infer<typeof milestoneStatusSchema>, achievedDate?: string | null },
  context: z.RefinementCtx,
): void {
  if (value.status === 'achieved' && !value.achievedDate) {
    context.addIssue({ code: 'custom', path: ['achievedDate'], message: '状态为 achieved 时必须填写实际达成日期' })
  }
  if (value.status && value.status !== 'achieved' && value.achievedDate) {
    context.addIssue({ code: 'custom', path: ['achievedDate'], message: '状态不是 achieved 时实际达成日期必须为 null' })
  }
}

export const milestoneRecordSchema = z.strictObject({
  id: milestoneIdSchema,
  projectId: projectIdSchema,
  ...milestoneFields,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const milestoneWriteSchema = milestoneRecordSchema.superRefine(validateStatus)

export const milestoneCreateSchema = z.strictObject({
  projectId: projectIdSchema,
  title: milestoneFields.title,
  targetDate: milestoneFields.targetDate,
  status: milestoneStatusSchema.default('planned'),
  achievedDate: dateSchema.nullable().default(null),
  description: z.string().default(''),
}).superRefine(validateStatus)

export const milestoneUpdateSchema = z.strictObject(milestoneFields)
  .partial()
  .refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段')

export type Milestone = z.infer<typeof milestoneRecordSchema>
export type MilestoneUpdate = z.infer<typeof milestoneUpdateSchema>

/** 延期判定纯谓词的唯一实现见 derived.ts（zod-free，浏览器/服务端同源），此处再导出。 */
export { isMilestoneMissed } from './derived.js'

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
      : issue.code === 'custom'
        ? issue.message
        : (labels[String(issue.path[0])] ?? '里程碑字段格式不正确'),
  ))].join('；')
}
