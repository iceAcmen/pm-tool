/** WBS 任务字段与运行时校验；字段来源：requirements v0.4 §4.2。 */
import { z } from 'zod'
import { projectIdSchema } from './project.js'

export const taskIdSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, '任务 ID 只能包含字母、数字、下划线和连字符')
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'blocked', 'done'])
export const taskPrioritySchema = z.enum(['P0', 'P1', 'P2'])

export const taskStatusLabels: Record<z.infer<typeof taskStatusSchema>, string> = {
  todo: '未开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
}

const optionalDateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' }).optional()
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
  progress: z.number().int().min(0).max(100),
  milestoneId: z.null(),
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

export const taskWriteSchema = taskRecordSchema.superRefine(validateDateOrder)

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
  milestoneId: z.null().default(null),
}).superRefine(validateDateOrder)

export type Task = z.infer<typeof taskRecordSchema>

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
    progress: '进度（0 到 100 的整数）',
    milestoneId: '里程碑关联（当前仅支持 null）',
  }
  return [...new Set(error.issues.map(issue =>
    issue.code === 'unrecognized_keys'
      ? '包含不支持的字段；ID、WBS 编号、顺序和时间戳由系统生成'
      : issue.code === 'custom'
        ? issue.message
        : (labels[String(issue.path[0])] ?? '任务字段格式不正确'),
  ))].join('；')
}
