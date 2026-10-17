/** /pm stats：统计看板离线命令（只读聚合，不写盘）。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import { collectStats, StatsProjectNotFoundError, type ProjectStats, type StatsReport } from '../core/stats.js'
import { projectStatusLabels } from '../core/project.js'
import { taskStatusLabels } from '../core/task.js'
import { milestoneStatusLabels } from '../core/milestone.js'
import { deliverableStatusLabels } from '../core/deliverable.js'
import type { PmDomain } from '../core/storage.js'

export const statsHelp = [
  '统计看板命令（离线、只读聚合，无需 API Key）：',
  '  /pm stats            全项目汇总（按状态计数、任务/里程碑/风险/会议/汇报/交付物总量，逐项目明细）',
  '  /pm stats p-0001     单个项目明细（任务完成率、逾期项、未关闭风险按严重度、交付物四态）',
  '逾期任务/里程碑会以「⚠ 已延期」标出；口径为生成瞬间的当前数据。',
].join('\n')

function impactText(stat: ProjectStats): string {
  const parts = (['critical', 'high', 'medium', 'low'] as const)
    .map(level => stat.openRiskByImpact[level])
    .filter(count => count > 0)
  return stat.openRiskCount ? `未关闭 ${stat.openRiskCount}（${parts.join('/')}）` : '无未关闭'
}

function renderProjectLine(stat: ProjectStats): string {
  const overdue = stat.overdueTasks || stat.milestoneOverdue
    ? ` ⚠ 已延期（任务 ${stat.overdueTasks} / 里程碑 ${stat.milestoneOverdue}）`
    : ''
  return [
    `${stat.projectId}｜${stat.projectName}｜${projectStatusLabels[stat.status as keyof typeof projectStatusLabels] ?? stat.status}`,
    `  任务 ${stat.taskDone}/${stat.taskTotal}（完成率 ${stat.completionRate}%，进行中 ${stat.taskInProgress}，受阻 ${stat.taskBlocked}）`,
    `  里程碑 ${stat.milestoneAchieved}/${stat.milestoneTotal} 已达成`,
    `  ${impactText(stat)}`,
    `  会议 ${stat.meetingCount}｜汇报 ${stat.reportCount}｜交付物 ${stat.deliverableByStatus.planned + stat.deliverableByStatus.in_progress + stat.deliverableByStatus.submitted + stat.deliverableByStatus.accepted}`,
    overdue,
  ].filter(Boolean).join('\n')
}

function renderStats(report: StatsReport): string {
  const lines: string[] = []
  if (report.scope === 'all') {
    lines.push(`全项目统计看板（截至 ${report.today}）`)
    const statusParts = Object.entries(report.projectStatusCount)
      .map(([status, count]) => `${projectStatusLabels[status as keyof typeof projectStatusLabels] ?? status} ${count}`)
    lines.push(`项目 ${report.projectCount} 个（${statusParts.join('，')}）`)
    lines.push(
      `任务 ${report.totals.taskDone}/${report.totals.taskTotal} 完成｜`
      + `里程碑 ${report.totals.milestoneOverdue ? `⚠ ${report.totals.milestoneOverdue} 项逾期` : `${report.totals.milestoneTotal} 个`}｜`
      + `未关闭风险/问题 ${report.totals.openRisk}｜会议 ${report.totals.meetingCount}｜汇报 ${report.totals.reportCount}｜交付物 ${report.totals.deliverableCount}`,
    )
    if (report.totals.taskOverdue) lines.push(`⚠ 另有 ${report.totals.taskOverdue} 个任务已逾期未完成。`)
    lines.push('')
    lines.push('逐项目明细：')
    for (const stat of report.projects) lines.push(renderProjectLine(stat))
  } else {
    const stat = report.projects[0]!
    lines.push(`项目统计：${stat.projectName}（${stat.projectId}，截至 ${report.today}）`)
    lines.push(`状态：${projectStatusLabels[stat.status as keyof typeof projectStatusLabels] ?? stat.status}`)
    lines.push(`任务：完成 ${stat.taskDone}/${stat.taskTotal}，完成率 ${stat.completionRate}%`)
    lines.push(`  ${taskStatusLabels.todo} ${stat.taskTodo}｜${taskStatusLabels.in_progress} ${stat.taskInProgress}｜${taskStatusLabels.blocked} ${stat.taskBlocked}｜${taskStatusLabels.done} ${stat.taskDone}`)
    lines.push(stat.overdueTasks ? `⚠ 已逾期未完成任务 ${stat.overdueTasks} 个。` : '无逾期任务。')
    lines.push(`里程碑：已达成 ${stat.milestoneAchieved}/${stat.milestoneTotal}`)
    lines.push(stat.milestoneOverdue ? `⚠ 已逾期里程碑 ${stat.milestoneOverdue} 个（${milestoneStatusLabels.missed} / 有风险）。` : '无逾期里程碑。')
    lines.push(`未关闭风险/问题：${stat.openRiskCount ? impactText(stat) : '无'}`)
    lines.push(`会议纪要 ${stat.meetingCount}｜进度汇报 ${report.totals.reportCount}`)
    const d = stat.deliverableByStatus
    lines.push(
      '交付物四态：'
      + `${deliverableStatusLabels.planned} ${d.planned}｜${deliverableStatusLabels.in_progress} ${d.in_progress}｜${deliverableStatusLabels.submitted} ${d.submitted}｜${deliverableStatusLabels.accepted} ${d.accepted}`,
    )
  }
  return lines.join('\n')
}

export async function handleStatsCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (input.toLowerCase() === 'help') return { kind: 'success', text: statsHelp }
  if (!domain) return { kind: 'error', text: '统计依赖项目存储，请检查 pm profile 的存储配置及宿主日志。' }
  if (/\s/.test(input)) {
    return { kind: 'error', text: '项目 ID 不应包含空格：/pm stats [项目ID]' }
  }

  try {
    const report = collectStats(domain, input || undefined)
    if (report.scope === 'project' && !report.projects.length) {
      return { kind: 'error', text: `未找到项目：${input}。` }
    }
    return { kind: 'success', text: renderStats(report) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `项目 ID 格式不正确。` }
    }
    if (error instanceof StatsProjectNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    console.error('[pm-tool] 统计失败：', error)
    return { kind: 'error', text: '统计失败，请检查存储配置及宿主日志后重试。' }
  }
}
