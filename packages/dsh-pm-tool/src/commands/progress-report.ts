/** /pm report：固定快照进度汇报与精简 Markdown 导出。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import { ExportFileExistsError, exportProgressReportMarkdown } from '../core/export.js'
import {
  deleteProgressReport,
  generateProgressReport,
  getProgressReport,
  listProgressReports,
  ProgressReportProjectNotFoundError,
  updateProgressReport,
} from '../core/progress-reports.js'
import {
  describeProgressReportValidation,
  progressReportStatusLabels,
  type ProgressReport,
  type ProgressReportStatus,
} from '../core/progress-report.js'
import type { PmDomain } from '../core/storage.js'

export const progressReportHelp = [
  '进度汇报命令（离线固定快照，无需 API Key）：',
  '  /pm report generate p-0001 2026-10-01 2026-10-31 {"title":"十月进度汇报"}',
  '  /pm report list p-0001 [all|draft|final]',
  '  /pm report get rpt-0001',
  '  /pm report update rpt-0001 {"status":"final","executiveSummary":"总体按计划"}',
  '  /pm report export rpt-0001 [目录] [confirm]',
  '  /pm report delete rpt-0001 confirm',
].join('\n')

function render(report: ProgressReport): string {
  return [
    `汇报 ID：${report.id}`,
    `项目 ID：${report.projectId}`,
    `标题：${report.title}`,
    `周期：${report.periodStart} 至 ${report.periodEnd}`,
    `状态：${progressReportStatusLabels[report.status]}`,
    `快照时间：${report.snapshotAt}`,
    `任务：${report.snapshot.tasks.done}/${report.snapshot.tasks.total} 完成，平均进度 ${report.snapshot.tasks.averageProgress}%`,
    `里程碑：${report.snapshot.milestones.achieved}/${report.snapshot.milestones.total} 达成`,
    `周期会议：${report.snapshot.meetings.inPeriod} 场`,
    `异常项：${report.snapshot.exceptions.length}`,
    `管理摘要：${report.executiveSummary || '未填写'}`,
  ].join('\n')
}

function parseJson(value: string | undefined): unknown {
  return value ? JSON.parse(value) : {}
}

function unquote(value: string): string {
  if (value.length >= 2 && ['"', '\''].includes(value[0]) && value.at(-1) === value[0]) return value.slice(1, -1)
  return value
}

export async function handleProgressReportCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: progressReportHelp }
  if (!domain) return { kind: 'error', text: '进度汇报存储未就绪，请检查 pm profile 的存储配置。' }
  try {
    const generateMatch = /^generate\s+(\S+)\s+(\S+)\s+(\S+)(?:\s+([\s\S]+))?$/i.exec(input)
    if (generateMatch) {
      const options = parseJson(generateMatch[4])
      if (!options || typeof options !== 'object' || Array.isArray(options)) {
        return { kind: 'error', text: '可选参数须为 JSON 对象。' }
      }
      const report = await generateProgressReport(domain, {
        ...options,
        projectId: generateMatch[1],
        periodStart: generateMatch[2],
        periodEnd: generateMatch[3],
      })
      return { kind: 'success', text: `进度汇报快照已生成并保存。\n${render(report)}` }
    }
    const listMatch = /^list\s+(\S+)(?:\s+(all|draft|final))?$/i.exec(input)
    if (listMatch) {
      const status = listMatch[2]?.toLowerCase()
      const reports = listProgressReports(
        domain,
        listMatch[1],
        status && status !== 'all' ? status as ProgressReportStatus : undefined,
      )
      return {
        kind: 'success',
        text: reports.length
          ? [`进度汇报（项目 ${listMatch[1]}，共 ${reports.length} 份）：`, ...reports.map(item =>
              `${item.id}｜${item.periodStart} 至 ${item.periodEnd}｜${item.title}｜${progressReportStatusLabels[item.status]}｜异常 ${item.snapshot.exceptions.length}`,
            )].join('\n')
          : `项目 ${listMatch[1]} 暂无符合条件的进度汇报。`,
      }
    }
    const getMatch = /^get\s+(\S+)$/i.exec(input)
    if (getMatch) {
      const report = getProgressReport(domain, getMatch[1])
      return report ? { kind: 'success', text: render(report) } : { kind: 'error', text: `未找到进度汇报：${getMatch[1]}。` }
    }
    const updateMatch = /^update\s+(\S+)\s+([\s\S]+)$/i.exec(input)
    if (updateMatch) {
      const report = await updateProgressReport(domain, updateMatch[1], JSON.parse(updateMatch[2]))
      return report
        ? { kind: 'success', text: `进度汇报已更新，固定快照未改变。\n${render(report)}` }
        : { kind: 'error', text: `未找到进度汇报：${updateMatch[1]}。` }
    }
    const exportMatch = /^export\s+(\S+)(?:\s+([\s\S]+))?$/i.exec(input)
    if (exportMatch) {
      let remainder = exportMatch[2]?.trim() ?? ''
      let overwrite = false
      if (/^confirm$/i.test(remainder)) {
        overwrite = true
        remainder = ''
      } else {
        const match = /^([\s\S]*\S)\s+confirm$/i.exec(remainder)
        if (match) {
          overwrite = true
          remainder = match[1]
        }
      }
      const result = await exportProgressReportMarkdown(
        domain,
        exportMatch[1],
        remainder ? unquote(remainder) : undefined,
        overwrite,
      )
      return { kind: 'success', text: `${overwrite ? '进度汇报 Markdown 已生成或覆盖' : '进度汇报 Markdown 已生成'}。\n文件：${result.path}` }
    }
    const deleteMatch = /^delete\s+(\S+)(?:\s+(confirm))?$/i.exec(input)
    if (deleteMatch) {
      const current = getProgressReport(domain, deleteMatch[1])
      if (!current) return { kind: 'error', text: `未找到进度汇报：${deleteMatch[1]}。` }
      if (!deleteMatch[2]) {
        return { kind: 'success', text: `即将删除进度汇报：${current.id}｜${current.title}。\n当前未执行删除。\n确认命令：/pm report delete ${current.id} confirm` }
      }
      await deleteProgressReport(domain, current.id)
      return { kind: 'success', text: `进度汇报已删除：${current.id}｜${current.title}。` }
    }
    return { kind: 'error', text: `不支持的进度汇报操作。\n${progressReportHelp}` }
  } catch (error) {
    if (error instanceof SyntaxError) return { kind: 'error', text: '进度汇报参数须为合法 JSON 对象，请使用英文双引号。' }
    if (error instanceof z.ZodError) return { kind: 'error', text: `进度汇报参数不正确：${describeProgressReportValidation(error)}。` }
    if (error instanceof ProgressReportProjectNotFoundError) return { kind: 'error', text: error.message }
    if (error instanceof ExportFileExistsError) {
      return { kind: 'error', text: `${error.message}。确认覆盖时请在原命令末尾追加 confirm。` }
    }
    if (error instanceof Error && error.message.startsWith('未找到进度汇报')) {
      return { kind: 'error', text: error.message }
    }
    console.error('[pm-tool] 进度汇报操作失败：', error)
    return { kind: 'error', text: '进度汇报操作失败，请检查存储配置、导出目录及宿主日志。' }
  }
}
