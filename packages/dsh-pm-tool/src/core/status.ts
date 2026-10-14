/** 任务状态纯常量（无 zod 依赖，浏览器/Node 共享单一来源）。 */
export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: '未开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
}

/**
 * 状态谓词闭包（单一来源）：业务处一律复用，禁止散落字面量比较，
 * 避免口径漂移（历史教训：war-room 误写成 status==='doing'，真枚举为 in_progress）。
 * 仅判定状态字段本身，不引入任何进度模型/schema。
 */
export const isDoneStatus = (status: string | undefined): boolean => status === 'done'
export const isInProgressStatus = (status: string | undefined): boolean => status === 'in_progress'
