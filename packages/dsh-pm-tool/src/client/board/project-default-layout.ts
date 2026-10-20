/**
 * 项目概览专属默认看板（project:<id> 无已存布局、且旧全局也缺省时的回退）。
 * 与全局 DEFAULT_LAYOUT 分离：聚焦单项目健康、阶段里程碑、待办/阻塞、负责人负载与周计划、风险。
 * 纯静态默认；用户保存/编辑后以 byProject[projectId] 为准。
 */
import type { DashboardLayout } from './types.js'

export const PROJECT_DEFAULT_LAYOUT: DashboardLayout = {
  version: 1,
  scope: 'project',
  widgets: [
    // 健康完成环（项目健康）
    { i: 'pw-hero', type: 'completionHero', config: {}, layout: { i: 'pw-hero', x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 4 } },
    // 阶段与里程碑 / 交付物时间线
    { i: 'pw-ms', type: 'milestoneDeliverable', config: {}, layout: { i: 'pw-ms', x: 4, y: 0, w: 8, h: 3, minW: 4, minH: 2 } },
    // 目标客观进度
    { i: 'pw-obj', type: 'objectiveProgress', config: {}, layout: { i: 'pw-obj', x: 4, y: 3, w: 4, h: 3, minW: 3, minH: 2 } },
    // 临期/逾期待办（下一节点 / 需处理阻塞）
    { i: 'pw-overdue', type: 'overdueSoon', config: {}, layout: { i: 'pw-overdue', x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 2 } },
    // 负责人负载 / 排期
    { i: 'pw-load', type: 'peopleLoad', config: {}, layout: { i: 'pw-load', x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 } },
    // 未来按周计划（日程）
    { i: 'pw-week', type: 'weeklyPlan', config: {}, layout: { i: 'pw-week', x: 6, y: 6, w: 6, h: 4, minW: 4, minH: 3 } },
    // 风险矩阵
    { i: 'pw-risk', type: 'riskMatrix', config: {}, layout: { i: 'pw-risk', x: 0, y: 10, w: 12, h: 4, minW: 6, minH: 3 } },
  ],
}
