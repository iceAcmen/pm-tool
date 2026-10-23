/** 固定快照进度汇报 Markdown：摘要、周期事件、异常项及已保存的冻结摘录。 */
import { progressReportSourceTypeLabels, progressReportStatusLabels, type ProgressReport } from './progress-report.js'

function inline(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('|', '\\|').replace(/\r?\n/g, '<br>')
}

function list(lines: string[], values: string[], empty: string): void {
  if (!values.length) lines.push(empty)
  else values.forEach(value => lines.push(`- ${inline(value)}`))
}

export function renderProgressReportMarkdown(report: ProgressReport): string {
  const snapshot = report.snapshot
  const lines = [
    `# ${inline(report.title)}`,
    '',
    `> 汇报 ID：\`${report.id}\`  `,
    `> 项目：${inline(snapshot.project.name)}（\`${report.projectId}\`）  `,
    `> 周期：${report.periodStart} 至 ${report.periodEnd}  `,
    `> 快照时间：${report.snapshotAt}  `,
    `> 状态：${progressReportStatusLabels[report.status]}  `,
    `> 来源：${progressReportSourceTypeLabels[report.sourceType]}${report.sourceSessionId ? `（${inline(report.sourceSessionId)}）` : ''}`,
    '',
    '## 管理摘要',
    '',
    report.executiveSummary ? inline(report.executiveSummary) : '暂无管理摘要。',
    '',
    '## 当前快照',
    '',
    '| 指标 | 内容 |',
    '| --- | --- |',
    `| 项目状态 | ${snapshot.project.status} |`,
    `| 任务 | ${snapshot.tasks.done}/${snapshot.tasks.total} 已完成，平均进度 ${snapshot.tasks.averageProgress === null ? '证据不足' : `${snapshot.tasks.averageProgress}%`} |`,
    `| 受阻任务 | ${snapshot.tasks.blocked} |`,
    `| 里程碑 | ${snapshot.milestones.achieved}/${snapshot.milestones.total} 已达成，${snapshot.milestones.atRisk} 有风险，${snapshot.milestones.missed} 已错过 |`,
    `| 周期内会议 | ${snapshot.meetings.inPeriod} 场，${snapshot.meetings.decisions} 项决议 |`,
    `| 异常项 | ${snapshot.exceptions.length} |`,
    '',
    '## 已完成事项',
    '',
  ]
  list(lines, report.completedWork, '暂无填写。')
  lines.push('', '## 下期计划', '')
  list(lines, report.nextPlans, '暂无填写。')
  lines.push('', '## 阻塞说明', '')
  list(lines, report.blockers, '暂无填写。')

  lines.push('', '## 本周期里程碑', '')
  if (!snapshot.periodMilestones.length) lines.push('本周期无目标或达成日期命中的里程碑。')
  else {
    lines.push('| 日期 | ID | 标题 | 状态 |', '| --- | --- | --- | --- |')
    snapshot.periodMilestones.forEach(item =>
      lines.push(`| ${item.targetDate} | \`${item.id}\` | ${inline(item.title)} | ${item.status} |`))
  }

  lines.push('', '## 本周期会议决议', '')
  if (!snapshot.periodMeetings.length) lines.push('本周期无会议。')
  else {
    for (const meeting of snapshot.periodMeetings) {
      lines.push(`### ${meeting.meetingDate} ${inline(meeting.title)}`, '')
      list(lines, meeting.decisions, '暂无决议。')
      lines.push('')
    }
  }

  lines.push('## 异常项', '')
  if (!snapshot.exceptions.length) lines.push('当前快照无异常项。')
  else {
    lines.push('| 级别 | 类型 | ID | 标题 | 负责人 | 截止日期 | 说明 |', '| --- | --- | --- | --- | --- | --- | --- |')
    snapshot.exceptions.forEach(item => lines.push(
      `| ${item.severity === 'critical' ? '严重' : '关注'} | ${item.kind} | \`${item.id}\` | ${inline(item.title)} | ${inline(item.owner || '未指定')} | ${item.dueDate ?? '-'} | ${inline(item.detail)} |`,
    ))
  }
  if (report.excerpts?.length) {
    lines.push('', '## 冻结进展摘录', '')
    for (const [index, excerpt] of report.excerpts.entries()) {
      const frozen = [
        `任务：${excerpt.taskId} / 进展：${excerpt.entryId} / 修订：${excerpt.revisionId}`,
        `作者：${excerpt.author} / 日期：${excerpt.date}`,
        '',
        excerpt.contentSnapshot,
      ].join('\n')
      // 字面保留冻结文本；比内部反引号更长的围栏防止正文逃逸为 HTML/链接。
      let fenceLength = 3
      for (const match of frozen.matchAll(/`+/g)) {
        fenceLength = Math.max(fenceLength, match[0].length + 1)
      }
      const fence = '`'.repeat(fenceLength)
      lines.push(`### 摘录 ${index + 1}`, '', fence, frozen, fence, '')
    }
  }
  lines.push('', '---', '', '本报告由 pm-tool 固定快照生成；后续业务数据变化不会改写本报告记录。', '')
  return lines.join('\n')
}
