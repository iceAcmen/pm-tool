/** 将 storage-domain 中的项目数据渲染为人类可读 Markdown，不产生第二数据源。 */
import { milestoneStatusLabels, type Milestone } from './milestone.js'
import { listMilestones } from './milestones.js'
import { projectStatusLabels, type Project } from './project.js'
import { getProject } from './projects.js'
import type { PmDomain } from './storage.js'
import { taskStatusLabels, type Task } from './task.js'
import { listTasks } from './tasks.js'

export interface ProjectReport {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
}

export class ReportProjectNotFoundError extends Error {}

export function collectProjectReport(domain: PmDomain, projectId: string): ProjectReport {
  const project = getProject(domain, projectId)
  if (!project) throw new ReportProjectNotFoundError(`未找到项目：${projectId}`)
  return {
    project,
    tasks: listTasks(domain, projectId),
    milestones: listMilestones(domain, projectId),
  }
}

function inline(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|')
    .replace(/\r?\n/g, '<br>')
}

function display(value: string | undefined | null, fallback = '未填写'): string {
  return value ? inline(value) : fallback
}

function taskDepth(task: Task, tasksById: Map<string, Task>): number {
  let depth = 0
  let current = task
  const visited = new Set<string>([task.id])
  while (current.parentId) {
    if (visited.has(current.parentId)) break
    const parent = tasksById.get(current.parentId)
    if (!parent) break
    visited.add(parent.id)
    depth += 1
    current = parent
  }
  return depth
}

export function renderProjectMarkdown(report: ProjectReport, generatedAt = new Date().toISOString()): string {
  const { project, tasks, milestones } = report
  const tasksById = new Map(tasks.map(task => [task.id, task]))
  const lines = [
    `# ${inline(project.name)}`,
    '',
    `> 项目 ID：\`${project.id}\`  `,
    `> 导出时间：${generatedAt}`,
    '',
    '## 项目概览',
    '',
    '| 字段 | 内容 |',
    '| --- | --- |',
    `| 状态 | ${projectStatusLabels[project.status]} |`,
    `| 负责人 | ${display(project.owner)} |`,
    `| 开始日期 | ${project.startDate} |`,
    `| 目标日期 | ${project.targetDate} |`,
    `| 标签 | ${project.tags?.length ? project.tags.map(inline).join('、') : '无'} |`,
    `| 目标描述 | ${display(project.description)} |`,
    '',
    '## WBS 任务',
    '',
  ]

  if (!tasks.length) {
    lines.push('暂无任务。')
  } else {
    for (const task of tasks) {
      const indent = '  '.repeat(taskDepth(task, tasksById))
      const dates = task.startDate || task.dueDate
        ? `${task.startDate ?? '未定'} → ${task.dueDate ?? '未定'}`
        : '日期未定'
      lines.push(
        `${indent}- **${inline(task.code)} ${inline(task.title)}** `
        + `（${taskStatusLabels[task.status]}，${task.priority}，进度 ${task.progress}%）`,
        `${indent}  - ID：\`${task.id}\`；负责人：${display(task.assignee)}；${dates}`
        + `${task.milestoneId ? `；里程碑：\`${task.milestoneId}\`` : ''}`,
      )
      if (task.description) lines.push(`${indent}  - 说明：${inline(task.description)}`)
    }
  }

  lines.push('', '## 里程碑时间线', '')
  if (!milestones.length) {
    lines.push('暂无里程碑。')
  } else {
    lines.push(
      '| 目标日期 | ID | 标题 | 状态 | 实际达成日期 | 说明/达成标准 |',
      '| --- | --- | --- | --- | --- | --- |',
    )
    for (const milestone of milestones) {
      lines.push(
        `| ${milestone.targetDate} | \`${milestone.id}\` | ${inline(milestone.title)} `
        + `| ${milestoneStatusLabels[milestone.status]} | ${milestone.achievedDate ?? '未填写'} `
        + `| ${display(milestone.description)} |`,
      )
    }
  }

  lines.push('', '---', '', '本报告由 pm-tool 从本地 JSON 数据生成；JSON 是唯一数据源。', '')
  return lines.join('\n')
}
