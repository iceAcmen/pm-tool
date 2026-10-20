/** WBS 任务字段与运行时校验；字段来源：requirements v0.4 §4.2。 */
import { z } from 'zod'
import { projectIdSchema } from './project.js'
import { milestoneIdSchema } from './milestone.js'
import { deliverableIdSchema } from './deliverable.js'
import { isValidEvidenceUrl } from './evidence.js'
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
export const taskChecklistSchema = z.array(checklistItemSchema)
  .max(CHECKLIST_MAX_ITEMS, `单个任务的清单最多 ${CHECKLIST_MAX_ITEMS} 项`)
  .refine(
    items => new Set(items.map(item => item.id)).size === items.length,
    '清单内 itemId 必须唯一',
  )

// ===== B2 任务资料区 attachments[] 与进展日志 progressLog[]（U1=方案 A：挂 task 可选键，不建独立表）=====
// 旧单键 deliverableId / evidenceUrl 保留双读兼容，不物理改写旧记录。
// 两数组只进 taskRecordSchema，不进 taskCreateSchema / taskUpdateSchema（与 checklist 同例）：
// 普通建任务/整段 update 不能替换数组，资料与日志由专用动作命令追加/编辑/软删。
export const ATTACHMENT_NOTE_MAX = 500
export const ATTACHMENT_TITLE_MAX = 200
export const ATTACHMENTS_MAX = 50
export const PROGRESS_LOG_MAX = 100
export const PROGRESS_CONTENT_MAX = 2000
const attachmentIdSchema = z.string().regex(/^at-\d+$/, '资料项 ID 格式应为 at-数字')
const progressEntryIdSchema = z.string().regex(/^pl-\d+$/, '进展条目 ID 格式应为 pl-数字')
const revisionIdSchema = z.string().regex(/^rv-\d+$/, '修订版 ID 格式应为 rv-数字')
const logDateSchema = z.iso.date({ error: '日期须为有效的 YYYY-MM-DD' })

/** deliverable 软引用：只存交付物 id + 关联时刻冻结的 version/name 快照，不复制台账内容。 */
const attachmentDeliverableSchema = z.strictObject({
  id: attachmentIdSchema,
  kind: z.literal('deliverable'),
  deliverableId: deliverableIdSchema,
  addedAt: z.iso.datetime(),
  // P2 版本冻结：关联时刻捕获的版本/名称快照；「更新到最新」是手动动作，不自动覆盖历史。
  frozenVersion: z.string().max(120).optional(),
  frozenName: z.string().max(200).optional(),
  note: z.string().trim().max(ATTACHMENT_NOTE_MAX).optional(),
})
/** link：仅 http/https，trim，≤2048，离线不联网探测（复用 evidence 谓词）。 */
const attachmentLinkSchema = z.strictObject({
  id: attachmentIdSchema,
  kind: z.literal('link'),
  url: z.string().trim().refine(isValidEvidenceUrl, '链接只支持 http/https 协议且长度不超过 2048'),
  title: z.string().trim().max(ATTACHMENT_TITLE_MAX).optional(),
  addedAt: z.iso.datetime(),
  note: z.string().trim().max(ATTACHMENT_NOTE_MAX).optional(),
})
/** B3 文件：软引用已登记的 file_assets 资产（fa-N），字节不内嵌，元数据/字节走受控 root。 */
const attachmentFileSchema = z.strictObject({
  id: attachmentIdSchema,
  kind: z.literal('file'),
  assetId: z.string().regex(/^fa-\d+$/, '文件资产 ID 格式应为 fa-数字'),
  addedAt: z.iso.datetime(),
  note: z.string().trim().max(ATTACHMENT_NOTE_MAX).optional(),
})
export const attachmentItemSchema = z.discriminatedUnion('kind', [
  attachmentDeliverableSchema,
  attachmentLinkSchema,
  attachmentFileSchema,
])

/** P3 修订版（append-only）：编辑=追加新版，旧正文不可覆盖。 */
const progressRevisionSchema = z.strictObject({
  id: revisionIdSchema,
  date: logDateSchema,
  author: z.string().trim().min(1, '作者不能为空'),
  content: z.string().trim().min(1, '正文不能为空').max(PROGRESS_CONTENT_MAX),
  refs: z.array(attachmentIdSchema).optional(),
  revisedAt: z.iso.datetime(),
})
/** 进展日志条目：稳定 id，revisions[0]=首版，deletedAt 软删且 revision 全保留。 */
export const progressEntrySchema = z.strictObject({
  id: progressEntryIdSchema,
  date: logDateSchema,
  author: z.string().trim().min(1, '作者不能为空'),
  createdAt: z.iso.datetime(),
  revisions: z.array(progressRevisionSchema).min(1, '至少一条修订版'),
  refs: z.array(attachmentIdSchema).optional(),
  deletedAt: z.iso.datetime().optional(),
}).superRefine((entry, ctx) => {
  const ids = entry.revisions.map(r => r.id)
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['revisions'], message: '修订版 ID 必须唯一' })
})
export const taskAttachmentsSchema = z.array(attachmentItemSchema)
  .max(ATTACHMENTS_MAX, `单个任务资料项最多 ${ATTACHMENTS_MAX} 条`)
  .refine(items => new Set(items.map(i => i.id)).size === items.length, '资料项 ID 必须唯一')
export const taskProgressLogSchema = z.array(progressEntrySchema)
  .max(PROGRESS_LOG_MAX, `单个任务进展日志最多 ${PROGRESS_LOG_MAX} 条`)
  .refine(items => new Set(items.map(i => i.id)).size === items.length, '进展条目 ID 必须唯一')

export type AttachmentItem = z.infer<typeof attachmentItemSchema>
export type ProgressRevision = z.infer<typeof progressRevisionSchema>
export type ProgressEntry = z.infer<typeof progressEntrySchema>

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
  // X6 连接：任务 → 交付物（本期补，供复盘草稿判断交付/里程碑级别）；可选，缺省即无。
  deliverableId: deliverableIdSchema.nullable().optional(),
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
  // #23 客观进度补全（加法式、可选、向后兼容；旧记录无这些键照常读取，无需迁移）：
  // 实际投入工时（非估算，小时，≥0，可缺省）；客观佐证链接（可缺省）。
  effortHours: z.number().min(0, '实际工时不得为负数').optional(),
  evidenceUrl: z.string().trim().max(2048, '证据链接过长').optional(),
  // 人工设定进度（0..100 整数，可显式传 null 清除）：与清单客观派生并存且明确区分，
  // 绝不覆盖/污染客观值；manualProgressNote 保留人工设定的来源/口径备注。
  manualProgress: z.number().int().min(0).max(100).nullable().optional(),
  manualProgressNote: z.string().max(500).optional(),
  // B2 资料区/进展日志：record 可选键，不进 create/update（专用动作维护）。
  attachments: taskAttachmentsSchema.optional(),
  progressLog: taskProgressLogSchema.optional(),
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
  deliverableId: taskFields.deliverableId,
  predecessorIds: taskFields.predecessorIds,
  repoUrl: taskFields.repoUrl,
  branch: taskFields.branch,
  effortHours: taskFields.effortHours,
  evidenceUrl: taskFields.evidenceUrl,
  manualProgress: taskFields.manualProgress,
  manualProgressNote: taskFields.manualProgressNote,
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
  deliverableId: taskFields.deliverableId,
  predecessorIds: taskFields.predecessorIds,
  repoUrl: taskFields.repoUrl,
  branch: taskFields.branch,
  effortHours: taskFields.effortHours,
  evidenceUrl: taskFields.evidenceUrl,
  manualProgress: taskFields.manualProgress,
  manualProgressNote: taskFields.manualProgressNote,
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
    deliverableId: '关联交付物 ID 或 null',
    predecessorIds: '前置依赖任务 ID 数组（须同项目、存在、不自指、不成环）',
    effortHours: '实际投入工时（小时，≥0，可缺省）',
    evidenceUrl: '客观佐证链接（可缺省）',
    manualProgress: '人工设定进度（0 到 100 整数，传 null 清除）',
    manualProgressNote: '人工设定来源/口径备注（可缺省）',
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
