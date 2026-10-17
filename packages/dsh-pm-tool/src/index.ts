/**
 * dsh-pm-tool：面向项目经理的项目管理工具。
 *
 * 离线项目增删改查：/pm project add/list/get/update/delete。
 * 保留 /pm ping 与 /pm selftest，所有记录经统一 pmtool 领域持久化。
 *
 * @module dsh-pm-tool
 */

import type { Context } from '@deepseek-ai/cordis'
import { CommandDefinitionId } from '@deepseek-ai/dsh-commands/brand'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import { openPmDomain, type PmDomain } from './core/storage.js'
import { sweepPending } from './core/provenance-store.js'
import { formatDomainOpenError } from './core/domain-error.js'
import { handleProjectCommand, projectHelp } from './commands/project.js'
import { handleTaskCommand, taskHelp } from './commands/task.js'
import { handleMilestoneCommand, milestoneHelp } from './commands/milestone.js'
import { exportHelp, handleExportCommand } from './commands/export.js'
import { handleRiskIssueCommand, riskIssueHelp } from './commands/risk-issue.js'
import { handleMeetingCommand, meetingHelp } from './commands/meeting.js'
import { handleProgressReportCommand, progressReportHelp } from './commands/progress-report.js'
import { handleDeliverableCommand, deliverableHelp } from './commands/deliverable.js'
import { handleSearchCommand, searchHelp } from './commands/search.js'
import type { LlmGateway } from './core/ai-client.js'
import { handleStatsCommand, statsHelp } from './commands/stats.js'
import { handleHealthCommand, healthHelp } from './commands/health.js'
import { handleDoctorCommand, doctorHelp } from './commands/doctor.js'
import { dueHelp, handleDueCommand } from './commands/due.js'
import { backupHelp, handleBackupCommand } from './commands/backup.js'
import { handleModelCommand, modelHelp } from './commands/model.js'
import { dashboardHelp, handleDashboardCommand, readDashboard } from './commands/dashboard.js'
import { settingsHelp, handleSettingsCommand, readProjectSettings } from './commands/settings.js'
import { handleAskCommand } from './commands/ask.js'
import { handleAskApplyCommand } from './commands/ask.js'
import { handleAskUndoCommand } from './commands/ask.js'
import { handleAskProvenanceCommand, handleAskRecheckCommand } from './commands/ask.js'

/** Cordis 插件名（注册、日志、配置 id 均以此为准）。 */
export const name = 'pm-tool'

/**
 * 依赖的宿主服务（Cordis 4.0.5-alpha.1 真实语义）：
 *   inject 里的每个名字都是「必需依赖」——任一缺失 fiber 即停在 INACTIVE、apply 不执行。
 *   本版本没有可选后缀语法，故 llm 不列入 inject：缺 llm 的 profile 仍激活本插件，
 *   运行期用 ctx.reflect.get('llm', false) 安全读取（缺失返回 undefined），
 *   命令层 generateDraft 据此抛中文 NO_LLM 降级。
 */
export const inject = ['commands', 'storageDomain'] as const

/** `/pm` 帮助文本。 */
function renderHelp(): CommandResult {
  return {
    kind: 'success',
    text: [
      '项目管理工作台（dsh-pm-tool）已加载，当前为离线命令、无需 API Key。',
      '',
      '可用命令：',
      '  /pm ping      连通性自检',
      '  /pm selftest  写入并读回一条记录，验证可读 JSON 文件存储',
      '',
      projectHelp,
      '',
      taskHelp,
      '',
      milestoneHelp,
      '',
      riskIssueHelp,
      '',
      meetingHelp,
      '',
      progressReportHelp,
      '',
      deliverableHelp,
      '',
      searchHelp,
      '',
      statsHelp,
      '',
      healthHelp,
      '',
      doctorHelp,
      '',
      dueHelp,
      '',
      backupHelp,
      '',
      exportHelp,
      '',
      dashboardHelp,
      '',
      settingsHelp,
    ].join('\n'),
  }
}

/** 插件入口：注册命令并尝试打开存储领域。 */
export async function apply(ctx: Context): Promise<void> {
  // llm 为可选能力：不列入 inject（见 inject 注释）。懒读取——命令被调用时才取，
  // 缺 provider 的 profile 返回 undefined，命令层 generateDraft 抛中文 NO_LLM 降级。
  const optionalLlm = (): LlmGateway | undefined =>
    (ctx.reflect.get('llm', false) ?? undefined) as LlmGateway | undefined

  let domain: PmDomain | undefined
  try {
    const opened = await openPmDomain(ctx)
    domain = opened
    ctx.effect(() => () => opened.close())
    console.info('[pm-tool] 存储领域 pmtool 已打开')
    // B-2：插件装载/进程启动时自动 sweep 一次 pending 补偿（best-effort，失败不阻断注册）；
    // 查询前仍保留 lazy sweep，并在响应暴露 pendingCount。
    void sweepPending(opened).catch(() => {})
  } catch (error) {
    // 存储未配置好时不应阻断命令注册；selftest 会提示具体原因。
    // 结构化中文点名坏记录（相对路径 + 表/键/字段），绝不输出绝对路径，绝不静默 backup-skip 隔离。
    console.warn('[pm-tool] 存储领域打开失败：', formatDomainOpenError(error))
  }

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-pm-tool'),
    name: 'pm',
    description: '项目管理工作台：项目、WBS、里程碑、风险问题、会议纪要、进度汇报、交付物台账、关键字检索、统计看板、任务表导入、导出与存储自检',
    input: { hint: '[project ...|task ...|milestone ...|risk-issue ...|meeting ...|report ...|deliverable ...|search ...|stats ...|due ...|backup ...|restore ...|export ...|ping|selftest]', attachments: false },
    handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
      // 仅命令词忽略大小写，名称、描述、负责人和 JSON 正文保持原样。
      const raw = invocation.rawInput.trim()
      if (/^web\s+snapshot$/i.test(raw)) {
        if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
        return {
          kind: 'success',
          text: JSON.stringify({
            projects: [...domain.table('projects').entries()].map(([, value]) => value),
            tasks: [...domain.table('tasks').entries()].map(([, value]) => value),
            milestones: [...domain.table('milestones').entries()].map(([, value]) => value),
            riskIssues: [...domain.table('risk_issues').entries()].map(([, value]) => value),
            meetings: [...domain.table('meetings').entries()].map(([, value]) => value),
            reports: [...domain.table('reports').entries()].map(([, value]) => value),
            deliverables: [...domain.table('deliverables').entries()].map(([, value]) => value),
            dashboards: {
              user: readDashboard(domain, 'user'),
              project: readDashboard(domain, 'project'),
            },
            // #21 口径设置：归一化后的生效口径（缺省=默认），供 Web 设置 UI 与派生视图直接消费。
            settings: readProjectSettings(domain),
          }),
        }
      }
      const projectMatch = /^project(?:\s+([\s\S]*))?$/i.exec(raw)
      if (projectMatch) return handleProjectCommand(projectMatch[1] ?? '', domain)
      const taskMatch = /^task(?:\s+([\s\S]*))?$/i.exec(raw)
      if (taskMatch) return handleTaskCommand(taskMatch[1] ?? '', domain, optionalLlm())
      const milestoneMatch = /^milestone(?:\s+([\s\S]*))?$/i.exec(raw)
      if (milestoneMatch) return handleMilestoneCommand(milestoneMatch[1] ?? '', domain)
      const riskIssueMatch = /^risk-issue(?:\s+([\s\S]*))?$/i.exec(raw)
      if (riskIssueMatch) return handleRiskIssueCommand(riskIssueMatch[1] ?? '', domain)
      const meetingMatch = /^meeting(?:\s+([\s\S]*))?$/i.exec(raw)
      if (meetingMatch) return handleMeetingCommand(meetingMatch[1] ?? '', domain, optionalLlm())
      const reportMatch = /^report(?:\s+([\s\S]*))?$/i.exec(raw)
      if (reportMatch) return handleProgressReportCommand(reportMatch[1] ?? '', domain, optionalLlm())
      const deliverableMatch = /^deliverable(?:\s+([\s\S]*))?$/i.exec(raw)
      if (deliverableMatch) return handleDeliverableCommand(deliverableMatch[1] ?? '', domain)
      const searchMatch = /^search(?:\s+([\s\S]*))?$/i.exec(raw)
      if (searchMatch) return handleSearchCommand(searchMatch[1] ?? '', domain)
      const statsMatch = /^stats(?:\s+([\s\S]*))?$/i.exec(raw)
      if (statsMatch) return handleStatsCommand(statsMatch[1] ?? '', domain)
      const healthMatch = /^health(?:\s+([\s\S]*))?$/i.exec(raw)
      if (healthMatch) return handleHealthCommand(healthMatch[1] ?? '', domain)
      const doctorMatch = /^doctor(?:\s+([\s\S]*))?$/i.exec(raw)
      if (doctorMatch) return handleDoctorCommand(doctorMatch[1] ?? '', domain, process.env.PM_STORAGE_ROOT)
      const dueMatch = /^due(?:\s+([\s\S]*))?$/i.exec(raw)
      if (dueMatch) return handleDueCommand(dueMatch[1] ?? '', domain)
      const backupMatch = /^(backup|restore-content|restore)(?:\s+([\s\S]*))?$/i.exec(raw)
      if (backupMatch) {
        const sub = backupMatch[1].toLowerCase()
        const rest = (backupMatch[2] ?? '').trim()
        return handleBackupCommand(sub === 'backup' ? rest : `${sub} ${rest}`, domain)
      }
      const exportMatch = /^export(?:\s+([\s\S]*))?$/i.exec(raw)
      if (exportMatch) return handleExportCommand(exportMatch[1] ?? '', domain)
      const modelMatch = /^model(?:\s+([\s\S]*))?$/i.exec(raw)
      if (modelMatch) return handleModelCommand(modelMatch[1] ?? '', domain)
      const dashboardMatch = /^dashboard(?:\s+([\s\S]*))?$/i.exec(raw)
      if (dashboardMatch) return handleDashboardCommand(dashboardMatch[1] ?? '', domain)
      const settingsMatch = /^settings(?:\s+([\s\S]*))?$/i.exec(raw)
      if (settingsMatch) return handleSettingsCommand(settingsMatch[1] ?? '', domain)
      const askApplyMatch = /^ask-apply(?:\s+([\s\S]*))?$/i.exec(raw)
      if (askApplyMatch) return await handleAskApplyCommand(askApplyMatch[1] ?? '', domain)
      const askProvenanceMatch = /^ask-provenance(?:\s+([\s\S]*))?$/i.exec(raw)
      if (askProvenanceMatch) return await handleAskProvenanceCommand(askProvenanceMatch[1] ?? '', domain)
      const askRecheckMatch = /^ask-recheck(?:\s+([\s\S]*))?$/i.exec(raw)
      if (askRecheckMatch) return await handleAskRecheckCommand(askRecheckMatch[1] ?? '', domain)
      const askUndoMatch = /^ask-undo(?:\s+([\s\S]*))?$/i.exec(raw)
      if (askUndoMatch) return await handleAskUndoCommand(askUndoMatch[1] ?? '', domain)
      const askMatch = /^ask(?:\s+([\s\S]*))?$/i.exec(raw)
      if (askMatch) return handleAskCommand(askMatch[1] ?? '', domain, optionalLlm())
      const sub = raw.toLowerCase()

      if (sub === 'ping') {
        return {
          kind: 'success',
          text: 'pong：项目管理工作台插件已加载。这是离线命令，当前未使用任何模型或 API Key。',
        }
      }

      if (sub === 'selftest') {
        if (!domain) {
          return {
            kind: 'error',
            text: '存储领域未就绪：请确认 profile 已启用 @deepseek-ai/dsh-storage-json（配置 root）与 dsh-storage-domain（backend: json）。',
          }
        }
        try {
          const at = new Date().toISOString()
          const table = domain.table('checks')
          // 记录键名仅允许 [a-zA-Z0-9_-]+；put 为异步写盘，必须 await 后再读回
          await table.put('selftest', { ok: true, at, note: 'dsh-pm-tool 第 0 步打通验证' })
          const back = table.get('selftest')
          return {
            kind: 'success',
            text: [
              '存储自检通过：已写入并读回一条记录。',
              `内容：${JSON.stringify(back, null, 2)}`,
              '该记录以可读 JSON 落在 storage-json 的 root 目录下：pmtool/checks/selftest.json。',
            ].join('\n'),
          }
        } catch (error) {
          return { kind: 'error', text: `存储自检失败：${String(error)}` }
        }
      }

      if (!sub || sub === 'help') return renderHelp()
      return { kind: 'error', text: `不支持的命令。\n${renderHelp().text}` }
    },
  })
}
