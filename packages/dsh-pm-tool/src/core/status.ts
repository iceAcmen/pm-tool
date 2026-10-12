/** 任务状态纯常量（无 zod 依赖，浏览器/Node 共享单一来源）。 */
export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: '未开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
}
