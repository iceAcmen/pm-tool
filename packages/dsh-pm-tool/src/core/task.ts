/** WBS 任务字段与运行时校验；字段来源：requirements v0.4 §4.2。 */
import { z } from 'zod'
import { projectIdSchema } from './project.js'
import { milestoneIdSchema } from './milestone.js'
import { TASK_STATUSES, taskStatusLabels } from './status.js'
import { branchFieldSchema, repoFieldLabels, repoUrlFieldSchema, validateRepoRelation } from './repo.js'

export const taskIdSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, '任务 ID 只能包含字母、数字、下划线和连字符')
export const taskStatusSchema = z.enum(TASK_STATUSES)
export { taskStatusLabels }
export const taskPrioritySchema = z.enum(['P0', 'P1', 'P2'])


const optionalDateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' }).optional()
const clearableDateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' }).nullable().optional()
/** 完成日期：独立错误文案，便于 describeTaskValidation 精确提示。 */
const optionalCompletedDateSchema = z.iso.date({ error: '完成日期须为有效 YYYY-MM-DD' }).optional()
const clearableCompletedDateSchema = z.iso.date({ error: '完成日期须为有效 YYYY-MM-DD' }).nullable().optional()

/**
 * v0.8 客观进度 v1 清单项：恰好 {id, text, done} 三键。
 * 冻结口径（docs/testing/objective-progress-acceptance.md §0.1/§13）：
 * 不加 doneAt / weight / title / progressMode；id 为稳定 UUID（同任务内唯一）；text 非空 trim。
 */
export const CHECKLIST_MAX_ITEMS = 50
export const checklistItemSchema = z.strictObject({
  id: z.string().min(1).max(64),
  text: z.string().trim().min(1, '清单项文本不能为空'),
  done: z.boolean(),
})
export type ChecklistItem = z.infer<typeof checklistItemSchema>
export const taskChecklistSchema = z.array(checklistItemSchema)
  .max(CHECKLIST_MAX_ITEMS, `单个任务的清单最多 ${CHECKLIST_MAX_ITEMS} 项`)
  .refine(
    items => new Set(items.map(item => item.id)).size === items.length,
    '清单内 itemId 必须唯一',
  )
const taskFields = {
  projectId: projectIdSchema,
  parentId: taskIdSchema.nullable(),
  title: z.string().trim().min(1, '任务标题不能为空'),
  description: z.string(),
  assignee: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  startDate: optionalDateSchema,
  dueDate: optionalDateSchema,
  // 完成日期（YYYY-MM-DD）：由状态流转自动维护（非 done→done 记为当天/显式值；done→其他清除）。
  // 旧 v1/v2 记录无此键照常读取；可显式纠正/清除。绝不据此反推历史之外的假数据。
  completedDate: optionalCompletedDateSchema,
  progress: z.number().int().min(0).max(100),
  milestoneId: milestoneIdSchema.nullable(),
  // PROD-11 前置依赖：optional，缺省即无前缀（v1 旧记录无此键按 [] 处理）。
  // 写业务层负责存在/同项目/自指/DAG 成环校验；空数组在落盘前归一化为缺键。
  predecessorIds: z.array(taskIdSchema).optional(),
  // v0.7 PROD-21 扩展：任务级仓库链接，optional 缺省即空（旧记录无此两键照常读取）。
  // 校验口径与 project / deliverable 共享（core/repo.ts），全程离线不联网探测。
  repoUrl: repoUrlFieldSchema,
  branch: branchFieldSchema,
  // v0.8 客观进度：任务唯一新增字段 = 可选 checklist。
  // 旧 v1/v2 记录无此键照常读取；写业务层负责「内部节点与非空清单互斥」与单项增量修改。
  // 不进 taskCreateSchema / taskUpdateSchema：建任务默认不带清单，普通 update 也不能整段替换数组。
  checklist: taskChecklistSchema.optional(),
}

function validateDateOrder(
  value: { startDate?: string, dueDate?: string },
  context: z.RefinementCtx,
): void {
  if (value.startDate && value.dueDate && value.dueDate < value.startDate) {
    context.addIssue({ code: 'custom', path: ['dueDate'], message: '截止日期不得早于开始日期' })
  }
}

export const taskRecordSchema = z.strictObject({
  id: taskIdSchema,
  ...taskFields,
  code: z.string().regex(/^\d+(?:\.\d+)*$/),
  order: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const taskWriteSchema = taskRecordSchema
  .superRefine(validateDateOrder)
  .superRefine(validateRepoRelation)

export const taskCreateSchema = z.strictObject({
  projectId: taskFields.projectId,
  parentId: taskFields.parentId.default(null),
  title: taskFields.title,
  description: taskFields.description.default(''),
  assignee: taskFields.assignee.default(''),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema.default('P1'),
  startDate: optionalDateSchema,
  dueDate: optionalDateSchema,
  progress: taskFields.progress.default(0),
  milestoneId: milestoneIdSchema.nullable().default(null),
  predecessorIds: taskFields.predecessorIds,
  repoUrl: taskFields.repoUrl,
  branch: taskFields.branch,
}).superRefine(validateDateOrder).superRefine(validateRepoRelation)

/** 更新不允许直接改变归属、父任务、编号、顺序与时间戳；移动使用独立动作。 */
export const taskUpdateSchema = z.strictObject({
  title: taskFields.title.optional(),
  description: taskFields.description.optional(),
  assignee: taskFields.assignee.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  startDate: clearableDateSchema,
  dueDate: clearableDateSchema,
  completedDate: clearableCompletedDateSchema,
  progress: taskFields.progress.optional(),
  milestoneId: milestoneIdSchema.nullable().optional(),
  predecessorIds: taskFields.predecessorIds,
  repoUrl: taskFields.repoUrl,
  branch: taskFields.branch,
}).superRefine(validateRepoRelation)
  .refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段')

export type Task = z.infer<typeof taskRecordSchema>
export type TaskUpdate = z.infer<typeof taskUpdateSchema>

export function describeTaskValidation(error: z.ZodError): string {
  const labels: Record<string, string> = {
    projectId: '项目 ID',
    parentId: '父任务 ID 或 null',
    title: '标题（非空文本）',
    description: '说明（文本）',
    assignee: '负责人（文本）',
    status: '状态（todo/in_progress/blocked/done）',
    priority: '优先级（P0/P1/P2）',
    startDate: '开始日期（有效 YYYY-MM-DD）',
    dueDate: '截止日期（有效 YYYY-MM-DD）',
    completedDate: '完成日期（有效 YYYY-MM-DD，传 null 清除）',
    progress: '进度（0 到 100 的整数）',
    milestoneId: '里程碑 ID 或 null',
    predecessorIds: '前置依赖任务 ID 数组（须同项目、存在、不自指、不成环）',
    ...repoFieldLabels,
  }
  return [...new Set(error.issues.map(issue =>
    issue.code === 'unrecognized_keys'
      ? '包含不支持的字段；ID、WBS 编号、顺序和时间戳由系统生成'
      : issue.code === 'custom'
        ? issue.message
        : (labels[String(issue.path[0])] ?? '任务字段格式不正确'),
  ))].join('；')
}
