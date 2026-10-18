/** 任务状态纯常量（无 zod 依赖，浏览器/Node 共享单一来源）。 */
// P2 X2：'wrapped' = 未完成但已收尾（弃置/停办），区别于 done 的正式完成；
// 不催办、不计 done、不计 open，呈现层标「已收尾·非正式完成」，AI 直写禁 wrapped。
export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done', 'wrapped'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
// 标签单一来源在 labels.ts（zod-free），此处再导出兼容既有引用。
export { taskStatusLabels } from './labels.js'

/**
 * 状态谓词闭包（单一来源）：业务处一律复用，禁止散落字面量比较，
 * 避免口径漂移（历史教训：war-room 误写成 status==='doing'，真枚举为 in_progress）。
 * 仅判定状态字段本身，不引入任何进度模型/schema。
 */
export const isDoneStatus = (status: string | undefined): boolean => status === 'done'
export const isInProgressStatus = (status: string | undefined): boolean => status === 'in_progress'
export const isWrappedStatus = (status: string | undefined): boolean => status === 'wrapped'
