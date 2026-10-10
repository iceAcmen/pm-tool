/** 项目字段与运行时校验；字段来源：requirements v0.4 §4.1。 */
import { z } from 'zod'

export const projectIdSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, '项目 ID 只能包含字母、数字、下划线和连字符')
export const projectStatusSchema = z.enum(['planning', 'active', 'paused', 'done', 'archived'])

export const projectStatusLabels: Record<z.infer<typeof projectStatusSchema>, string> = {
  planning: '计划中',
  active: '进行中',
  paused: '已暂停',
  done: '已完成',
  archived: '已归档',
}

// 日期使用 ISO 日历校验，拒绝 2026-02-30 等不存在的日期。
const dateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' })
const projectFields = {
  name: z.string().trim().min(1, '项目名称不能为空'),
  description: z.string(),
  owner: z.string(),
  status: projectStatusSchema,
  startDate: dateSchema,
  targetDate: dateSchema,
  tags: z.array(z.string()).optional(),
}

export const projectRecordSchema = z.strictObject({
  id: projectIdSchema,
  ...projectFields,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

/** 新增只接受业务字段；ID、时间戳由系统生成，禁止调用方覆盖。 */
export const projectCreateSchema = z.strictObject({
  ...projectFields,
  description: projectFields.description.default(''),
  owner: projectFields.owner.default(''),
  status: projectStatusSchema.default('planning'),
})

export type Project = z.infer<typeof projectRecordSchema>

/** 不直接输出 zod 英文错误，统一附上中文字段提示。 */
export function describeProjectValidation(error: z.ZodError): string {
  const labels: Record<string, string> = {
    name: '名称（非空文本）',
    description: '目标描述（文本）',
    owner: '负责人（文本）',
    status: '状态（planning/active/paused/done/archived）',
    startDate: '开始日期（有效 YYYY-MM-DD）',
    targetDate: '完成日期（有效 YYYY-MM-DD）',
    tags: '标签（文本数组）',
    id: '项目 ID（字母、数字、下划线、连字符）',
  }
  return [...new Set(error.issues.map(issue =>
    issue.code === 'unrecognized_keys'
      ? '包含不支持的字段；ID 和时间戳由系统生成'
      : (labels[String(issue.path[0])] ?? '项目字段格式不正确'),
  ))].join('；')
}
