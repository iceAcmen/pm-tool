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
  // PROD-21 项目级仓库：optional，缺省即空（v1 旧项目无此两键照常读取）。
  // 写时校验宽松 URL/git 正则与 branch 白名单；全程离线、不联网探测。
  repoUrl: z.string().trim().optional(),
  branch: z.string().trim().optional(),
}

// 宽松 git/URL：http(s)://host/path、git://host/path、或 scp 形 git@host:org/repo.git。
const repoUrlPattern = /^(https?:\/\/[^\s/$.?#].[^\s]*|git:\/\/[^\s/$.?#].[^\s]*|git@[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+(?:\/[^\s]*))$/
// branch：首字符字母/数字/点/下划线，后续可含字母数字点下划线斜杠连字符；≤64；禁空白与 git 危险符。
const branchPattern = /^[A-Za-z0-9._][A-Za-z0-9._/-]{0,63}$/

function validateRepoRelation(
  value: { repoUrl?: string, branch?: string },
  context: z.RefinementCtx,
): void {
  if (value.repoUrl && !repoUrlPattern.test(value.repoUrl)) {
    context.addIssue({ code: 'custom', path: ['repoUrl'], message: '仓库地址需为 http(s)://、git:// 或 git@host:org/repo.git 形式' })
  }
  if (value.branch && !branchPattern.test(value.branch)) {
    context.addIssue({ code: 'custom', path: ['branch'], message: '分支名需 ≤64 字符、不含空白与特殊符号（如 main、feature/x-1）' })
  }
}

function validateDateOrder(
  value: { startDate?: string, targetDate?: string },
  context: z.RefinementCtx,
): void {
  if (value.startDate && value.targetDate && value.targetDate < value.startDate) {
    context.addIssue({
      code: 'custom',
      path: ['targetDate'],
      message: '完成日期不得早于开始日期',
    })
  }
}

export const projectRecordSchema = z.strictObject({
  id: projectIdSchema,
  ...projectFields,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

/** 写入新记录时执行完整业务校验；读盘 schema 保持 v1 旧记录兼容。 */
export const projectWriteSchema = projectRecordSchema
  .superRefine(validateDateOrder)
  .superRefine(validateRepoRelation)

/** 新增只接受业务字段；ID、时间戳由系统生成，禁止调用方覆盖。 */
export const projectCreateSchema = z.strictObject({
  ...projectFields,
  description: projectFields.description.default(''),
  owner: projectFields.owner.default(''),
  status: projectStatusSchema.default('planning'),
}).superRefine(validateDateOrder).superRefine(validateRepoRelation)

/** 更新仅接受业务字段，最终日期关系由合并后的完整记录再次校验。 */
export const projectUpdateSchema = z.strictObject(projectFields)
  .partial()
  .refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段')

export type Project = z.infer<typeof projectRecordSchema>
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>

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
    repoUrl: '仓库地址（http(s)://、git:// 或 git@host:org/repo.git）',
    branch: '分支名（≤64 字符，不含空白与特殊符号）',
    id: '项目 ID（字母、数字、下划线、连字符）',
  }
  return [...new Set(error.issues.map(issue =>
    issue.code === 'unrecognized_keys'
      ? '包含不支持的字段；ID 和时间戳由系统生成'
      : issue.code === 'custom'
        ? issue.message
        : (labels[String(issue.path[0])] ?? '项目字段格式不正确'),
  ))].join('；')
}
