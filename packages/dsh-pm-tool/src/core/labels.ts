/**
 * 状态/生命周期人读标签单一来源（zod-free，客户端可直接 import，避免把 zod schema 打进入口包）。
 * 实体模块（project/milestone/deliverable/status）从这里复用并再导出；文案改动只在此处。
 */

export const projectStatusLabels: Record<string, string> = {
  planning: '计划中',
  active: '进行中',
  paused: '已暂停',
  done: '已完成',
  archived: '已归档',
}

export const taskStatusLabels: Record<string, string> = {
  todo: '未开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
  wrapped: '已收尾',
}

export const milestoneStatusLabels: Record<string, string> = {
  planned: '计划中',
  at_risk: '有风险',
  achieved: '已达成',
  missed: '已错过',
}

export const deliverableStatusLabels: Record<string, string> = {
  planned: '计划中',
  in_progress: '制作中',
  submitted: '已提交',
  accepted: '已验收',
  wrapped: '已收尾',
}
