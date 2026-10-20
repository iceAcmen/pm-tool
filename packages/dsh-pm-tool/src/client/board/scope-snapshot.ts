/**
 * 项目概览作用域快照：把全局 Snapshot 里按 projectId 归属的列表收窄到当前项目，
 * 供项目级 BoardBento 使用——卡片只见本项目数据，与 widget 已存 filter 无关。
 *
 * 只读、不改写原快照（filter 返回新数组；settings/capabilities/dashboards/fileAssets 原样保留）。
 */
import type { Snapshot } from '../panel.js'

type ProjectScoped = { projectId: string }

function filterByProject<T extends ProjectScoped>(
  arr: readonly T[] | undefined,
  projectId: string,
): T[] {
  if (!arr) return []
  return arr.filter(item => item.projectId === projectId)
}

/**
 * 收窄到单个项目：projects 仅留当前项目；其余按 projectId 过滤。
 * 全局 settings / capabilities / dashboards / fileAssets 不按项目切分，原样透传。
 */
export function scopeSnapshot(snapshot: Snapshot, projectId: string): Snapshot {
  return {
    ...snapshot,
    projects: snapshot.projects.filter(p => p.id === projectId),
    tasks: filterByProject(snapshot.tasks, projectId),
    milestones: filterByProject(snapshot.milestones, projectId),
    riskIssues: filterByProject(snapshot.riskIssues, projectId),
    meetings: filterByProject(snapshot.meetings, projectId),
    reports: filterByProject(snapshot.reports, projectId),
    deliverables: filterByProject(snapshot.deliverables, projectId),
    okrs: filterByProject(snapshot.okrs, projectId),
    okrInbox: filterByProject(snapshot.okrInbox, projectId),
    habits: filterByProject(snapshot.habits, projectId),
    habitInbox: filterByProject(snapshot.habitInbox, projectId),
    // fileAssets 元数据无 projectId 归属字段，项目快照直接清空，避免跨项目文件元数据泄漏。
    fileAssets: {},
  }
}
