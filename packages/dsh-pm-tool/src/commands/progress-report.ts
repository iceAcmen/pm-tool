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
import { AiDraftError, type LlmGateway } from '../core/ai-client.js'
import { buildBrief, defaultPeriod, generateNarrative, rememberNarrative, recallNarrative } from '../core/report-narrate.js'
import { getModelMode, resolveModelRoute, PROD_KEY_MISSING_TEXT } from '../core/model-route.js'
import type { PmDomain } from '../core/storage.js'

export const progressReportHelp = [
  '进度汇报命令（离线固定快照，无需 API Key）：',
  '  /pm report generate p-0001 2026-10-01 2026-10-31 {"title":"十月进度汇报"}',
  '  /pm report list p-0001 [all|draft|final]',
  '  /pm report get rpt-0001',
  '  /pm report update rpt-0001 {"status":"final","executiveSummary":"总体按计划"}',
  '  /pm report export rpt-0001 [目录] [confirm]',
  '  /pm report delete rpt-0001 confirm',
  '  /pm report narrate p-0001            基于确定性数据，AI 写本周进展/风险/下周计划叙述（预览，不落盘）',
  '  /pm report narrate p-0001 confirm   按上次叙述生成带 executiveSummary 的进度快照（复用草稿）',
  '  /pm report narrateuse p-0001 "<编辑后叙述>"  按编辑后文本直接落快照（不再调模型）',
  'AI 叙述只基于确定性数字、confirm 才落快照；失败时退化为确定性快照。',
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

export async function handleProgressReportCommand(rawInput: string, domain?: PmDomain, llm?: LlmGateway): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: progressReportHelp }
  if (!domain) return { kind: 'error', text: '进度汇报存储未就绪，请检查 pm profile 的存储配置。' }
  try {
    const narrateMatch = /^narrate\s+(\S+)(?:\s+(confirm))?$/i.exec(input)
    if (narrateMatch) {
      const projectId = narrateMatch[1]
      const confirmation = narrateMatch[2]?.toLowerCase() === 'confirm'
      const brief = buildBrief(domain, projectId) // 确定性采集（含项目存在校验）
      let narrative: string
      try {
        const route = resolveModelRoute(getModelMode(domain))
        if (confirmation) {
          narrative = recallNarrative(projectId) ?? await generateNarrative(llm, brief, route)
        } else {
          narrative = await generateNarrative(llm, brief, route)
          rememberNarrative(projectId, narrative)
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'PROD_KEY_MISSING') {
          return { kind: 'error', text: PROD_KEY_MISSING_TEXT }
        }
        throw error
      }
      const { periodStart, periodEnd } = defaultPeriod(7)
      if (!confirmation) {
        return {
          kind: 'success',
          text: [
            `AI 进度叙述草稿（项目 ${projectId}，周期 ${periodStart} 至 ${periodEnd}）：`,
            '',
            narrative,
            '',
            '以上为草稿（基于确定性数字生成），尚未写入。',
            `确认命令：/pm report narrate ${projectId} confirm`,
          ].join('\n'),
        }
      }
      const report = await generateProgressReport(domain, {
        projectId, periodStart, periodEnd, executiveSummary: narrative, status: 'draft',
      })
      return {
        kind: 'success',
        text: [`已按 AI 叙述生成进度快照（executiveSummary 已写入）。\n${render(report)}`].join('\n'),
      }
    }
    // OPT-08：/pm report narrateuse <项目ID> "<JSON编码的编辑后叙述>" —— 按用户编辑后的文本直接落快照，不再调模型。
    const narrateUseMatch = /^narrateuse\s+(\S+)\s+([\s\S]+)$/i.exec(input)
    if (narrateUseMatch) {
      const projectId = narrateUseMatch[1]
      let text = unquote(narrateUseMatch[2].trim())
      try { text = JSON.parse(narrateUseMatch[2].trim()) } catch { /* 非 JSON 编码则按原文 */ }
      if (typeof text !== 'string' || !text.trim()) return { kind: 'error', text: '请使用：/pm report narrateuse <项目ID> "<编辑后的三段叙述>"' }
      buildBrief(domain, projectId) // 校验项目存在
      const { periodStart, periodEnd } = defaultPeriod(7)
      const report = await generateProgressReport(domain, {
        projectId, periodStart, periodEnd, executiveSummary: text.trim(), status: 'draft',
      })
      return { kind: 'success', text: `已按编辑后叙述生成进度快照（不再调用模型）。\n${render(report)}` }
    }
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
    if (error instanceof AiDraftError) {
      return { kind: 'error', text: `AI 叙述暂不可用：${error.message}你仍可用 /pm report generate 生成确定性快照。` }
    }
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
