/** 交付物台账字段及运行时校验；字段来源：requirements R10。 */
import { z } from 'zod'
import { projectIdSchema } from './project.js'
import { branchFieldSchema, repoFieldLabels, repoUrlFieldSchema, validateRepoRelation } from './repo.js'

export const deliverableIdSchema = z.string().regex(
  /^dlv-\d+$/,
  '交付物 ID 格式应为 dlv-数字',
)
// 交付物生命周期：计划中 → 制作中 → 已提交（待验收）→ 已验收。
// P2 X2：'wrapped' = 未完成但已收尾（停办/不再推进），区别于 accepted 的正式验收。
export const deliverableStatusSchema = z.enum(['planned', 'in_progress', 'submitted', 'accepted', 'wrapped'])
// 标签单一来源在 labels.ts（zod-free），此处再导出兼容既有引用。
export { deliverableStatusLabels } from './labels.js'

const dateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' })

/** 版本 / 状态变更留痕：每次变化追加一条，只增不改。 */
export const deliverableChangeSchema = z.strictObject({
  at: z.iso.datetime(),
  field: z.string(),
  from: z.string(),
  to: z.string(),
  by: z.string(),
  note: z.string(),
})

const deliverableFields = {
  name: z.string().trim().min(1, '交付物名称不能为空'),
  version: z.string(),
  owner: z.string(),
  status: deliverableStatusSchema,
  // 位置：文件路径、URL 或对存放位置的文字描述，离线优先不强制可访问性。
  location: z.string(),
  description: z.string(),
  dueDate: dateSchema.nullable(),
  // v0.7 PROD-21 扩展：交付物级仓库链接，optional 缺省即空（旧记录无此两键照常读取）。
  // 校验口径与 project / task 共享（core/repo.ts）；只改这两键不追加变更留痕。
  repoUrl: repoUrlFieldSchema,
  branch: branchFieldSchema,
}

export const deliverableRecordSchema = z.strictObject({
  id: deliverableIdSchema,
  projectId: projectIdSchema,
  ...deliverableFields,
  history: z.array(deliverableChangeSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

// operator / changeNote 仅用于生成变更留痕，不作为业务列持久化。
export const deliverableCreateSchema = z.strictObject({
  projectId: projectIdSchema,
  name: deliverableFields.name,
  version: z.string().default(''),
  owner: z.string().default(''),
  status: deliverableStatusSchema.default('planned'),
  location: z.string().default(''),
  description: z.string().default(''),
  dueDate: dateSchema.nullable().default(null),
  repoUrl: deliverableFields.repoUrl,
  branch: deliverableFields.branch,
  operator: z.string().default(''),
  changeNote: z.string().default(''),
}).superRefine(validateRepoRelation)

export const deliverableUpdateSchema = z.strictObject({
  name: deliverableFields.name.optional(),
  version: z.string().optional(),
  owner: z.string().optional(),
  status: deliverableStatusSchema.optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  dueDate: dateSchema.nullable().optional(),
  repoUrl: deliverableFields.repoUrl,
  branch: deliverableFields.branch,
  operator: z.string().optional(),
  changeNote: z.string().optional(),
}).superRefine(validateRepoRelation).refine(value => {
  // operator / changeNote 只是留痕参数，单独出现不构成业务更新。
  return Object.keys(value).some(key => !['operator', 'changeNote'].includes(key))
}, '至少提供一个要更新的业务字段')

export type Deliverable = z.infer<typeof deliverableRecordSchema>
export type DeliverableStatus = z.infer<typeof deliverableStatusSchema>
export type DeliverableChange = z.infer<typeof deliverableChangeSchema>

export function describeDeliverableValidation(error: z.ZodError): string {
  const labels: Record<string, string> = {
    projectId: '项目 ID',
    name: '名称（非空文本）',
    version: '版本（文本，如 v1.0）',
    owner: '负责人（文本）',
    status: '状态（planned/in_progress/submitted/accepted）',
    location: '位置（文件路径、链接或文字描述）',
    description: '说明（文本）',
    dueDate: '计划交付日期（有效 YYYY-MM-DD 或 null）',
    ...repoFieldLabels,
  }
  return [...new Set(error.issues.map(issue =>
    issue.code === 'unrecognized_keys'
      ? '包含不支持的字段；项目、ID、变更历史和时间戳由系统维护'
      : (labels[String(issue.path[0])] ?? '交付物字段格式不正确'),
  ))].join('；')
}
