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
import { registerPreviewRoute, type PreviewWebServer, type PreviewAuthGate } from './core/http/preview-route.js'
import { registerAssetRoute, type AssetWebServer } from './core/http/asset-route.js'
import { sweepExpiredStages } from './core/file-staging.js'
import { describeFileRoot } from './core/file-asset-store.js'
import { normalizeProgressReportRecord } from './core/progress-report.js'
import { PREVIEW_MAX_BODY_BYTES, ASSET_MAX_BYTES } from './core/http/limits.js'
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
import { handleProgressCommand, progressHelp } from './commands/progress.js'
import { handleMaterialCommand, materialHelp } from './commands/material.js'
import { handleSearchCommand, searchHelp } from './commands/search.js'
import type { LlmGateway } from './core/ai-client.js'
import { handleStatsCommand, statsHelp } from './commands/stats.js'
import { handleHealthCommand, healthHelp } from './commands/health.js'
import { handleDoctorCommand, doctorHelp } from './commands/doctor.js'
import { dueHelp, handleDueCommand } from './commands/due.js'
import { backupHelp, handleBackupCommand } from './commands/backup.js'
import { handleModelCommand } from './commands/model.js'
import { dashboardHelp, handleDashboardCommand, readDashboard, readProjectDashboards } from './commands/dashboard.js'
import { settingsHelp, handleSettingsCommand, readProjectSettings } from './commands/settings.js'
import { handleAskCommand } from './commands/ask.js'
import { handleAskApplyCommand } from './commands/ask.js'
import { handleAskUndoCommand } from './commands/ask.js'
import { handleAskProvenanceCommand, handleAskRecheckCommand } from './commands/ask.js'
import { handleCaptureCommand, captureHelp } from './commands/capture.js'
import { handleSessionCommand, sessionHelp } from './commands/session.js'
import { handleReflectCommand, reflectHelp } from './commands/reflect.js'
import { handleCheckCommand, checkHelp } from './commands/check.js'
import { handleMetricCommand, metricHelp } from './commands/metric.js'
import { handleQueueCommand, queueHelp } from './commands/queue.js'
import { handleOkrCommand, okrHelp } from './commands/okr.js'
import { handleLessonCommand, lessonHelp } from './commands/lesson.js'
import { handleReviewCommand, reviewHelp } from './commands/review.js'
import { handleArchiveCommand, archiveHelp } from './commands/archive.js'
import { handleHabitCommand, habitHelp } from './commands/habit.js'
import { buildQueueForProject } from './core/queue.js'
import { localTodayIso } from './core/derived.js'
import { readOkrInbox } from './core/okr.js'
import { readHabitInbox } from './core/habits.js'
import { readExportAudit, type ExportAuditEntry } from './core/export.js'

// PM 包只依赖本地最小接口，避免为类型扩展引入 DSH 宿主实现包；运行时由明确 inject 保证服务存在。
declare module '@deepseek-ai/cordis' {
  interface Context {
    webServer: PreviewWebServer
    connection: PreviewAuthGate
  }
}

/** Cordis 插件名（注册、日志、配置 id 均以此为准）。 */
export const name = 'pm-tool'

/**
 * 依赖的宿主服务（Cordis 4.0.5-alpha.1 真实语义）：
 *   commands/storageDomain/webServer/connection 是 Web 工作台真实运行所需依赖；缺一则插件保持 INACTIVE，
 *   避免表面激活却永久关闭 B3 上传与 B6 结构化预览。当前目标宿主就是 DSH Web，四项均由基座提供。
 *   llm 仍不列入 inject：缺 llm 的 profile 仍激活本插件，运行期安全读取并中文降级。
 */
export const inject = ['commands', 'storageDomain', 'webServer', 'connection'] as const

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
      progressHelp,
      '',
      materialHelp,
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
      '',
      captureHelp,
      '',
      sessionHelp,
      '',
      reflectHelp,
      '',
      checkHelp,
      '',
      metricHelp,
      '',
      queueHelp,
      '',
      okrHelp,
      '',
      lessonHelp,
      '',
      reviewHelp,
      '',
      archiveHelp,
      '',
      habitHelp,
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

  // webServer / connection 已列为 Web 工作台必需依赖；直接读取声明注入的服务，确保 B3/B6 路由实际注册。
  const webServer = ctx.webServer as PreviewWebServer
  const connection = ctx.connection as PreviewAuthGate
  // 能力以「注册成功」为准（初始 false）：仅服务存在但 register 抛冲突/未返回 disposer 仍报不可用。
  let previewRegistered = false
  if (webServer) {
    ctx.effect(() => {
      const result = registerPreviewRoute(webServer, connection, () => domain)
      previewRegistered = result.ok
      return () => result.dispose?.()
    })
  }
  // B3 资产路由：upload/download 分别以注册成功为准，缺失/冲突各自降级，不阻断 preview/CLI。
  let assetUploadRegistered = false
  let assetDownloadRegistered = false
  let assetStageRegistered = false
  // F2：启动即判定文件根可用性；生产 unavailable 时不注册 upload/download/stage（fail-closed）。
  const fileRootAtBoot = await describeFileRoot()
  const fileRootAvailable = fileRootAtBoot.source !== 'unavailable' && !!fileRootAtBoot.dir

  if (webServer && fileRootAvailable) {
    ctx.effect(() => {
      const result = registerAssetRoute(webServer as AssetWebServer, connection, () => domain)
      assetUploadRegistered = result.uploadOk
      assetDownloadRegistered = result.downloadOk
      assetStageRegistered = result.stageOk
      return () => result.dispose?.()
    })
  }
  // 崩溃恢复：启动 best-effort 清扫过期暂存，失败不阻断启动。
  void sweepExpiredStages().catch(() => {})

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
        // K11 补记队列：按 projects 表逐个读时派生（零写，同 /pm queue list 口径），
        // 供前端打开视图直接消费 {top, rest, quietMode, openedAt}；新增键不破坏既有字段。
        const snapNow = new Date()
        const snapHhmm = `${String(snapNow.getHours()).padStart(2, '0')}:${String(snapNow.getMinutes()).padStart(2, '0')}`
        // F2：root 不可用时即使路由已注册，upload/stage 能力也置 false（fail-closed 投影）。
        const rootAvailable = fileRootAvailable
        const queue = Object.fromEntries(
          [...domain.table('projects').entries()].map(([pid]) => [
            pid,
            buildQueueForProject(domain, pid, { today: localTodayIso(), nowHhmm: snapHhmm }),
          ]),
        )
        // P2002：只读审计的项目最近时刻，不依赖追加顺序、不触发已发日志 TTL 或回写。
        const latestExports = new Map<string, Pick<ExportAuditEntry, 'at' | 'format'> | null>(
          [...domain.table('projects').entries()].map(([pid]) => [pid, null]),
        )
        for (const entry of readExportAudit(domain)) {
          const timestamp = Date.parse(entry.at)
          if (!latestExports.has(entry.projectId) || !Number.isFinite(timestamp)) continue
          const previous = latestExports.get(entry.projectId)
          if (!previous || timestamp > Date.parse(previous.at)) {
            latestExports.set(entry.projectId, { at: entry.at, format: entry.format })
          }
        }
        return {
          kind: 'success',
          text: JSON.stringify({
            projects: [...domain.table('projects').entries()].map(([, value]) => value),
            tasks: [...domain.table('tasks').entries()].map(([, value]) => value),
            milestones: [...domain.table('milestones').entries()].map(([, value]) => value),
            riskIssues: [...domain.table('risk_issues').entries()].map(([, value]) => value),
            meetings: [...domain.table('meetings').entries()].map(([, value]) => value),
            reports: [...domain.table('reports').entries()].map(([, value]) => normalizeProgressReportRecord(value)),
            deliverables: [...domain.table('deliverables').entries()].map(([, value]) => value),
            okrs: [...domain.table('okrs').entries()].map(([, value]) => value),
            lessons: [...domain.table('lessons').entries()].map(([, value]) => value),
            habits: [...domain.table('habits').entries()].map(([, value]) => value),
            // B3 文件资产：仅投影 UI 所需元数据，不下发内部 relPath（字节走授权 download 路由）。
            fileAssets: [...domain.table('file_assets').entries()].map(([, v]) => {
              const r = v as { id: string; projectId: string; fileName: string; mediaType: string; size: number; sha256: string; addedAt: string }
              return { id: r.id, projectId: r.projectId, fileName: r.fileName, mediaType: r.mediaType, size: r.size, sha256: r.sha256, addedAt: r.addedAt }
            }),
            // X7 收件区（settings 固定行，只读透传；前端按项目过滤，未确认不生效）。
            okrInbox: readOkrInbox(domain),
            habitInbox: readHabitInbox(domain),
            dashboards: {
              user: readDashboard(domain, { kind: 'user' }),
              project: readDashboard(domain, { kind: 'legacyProject' }),
              byProject: readProjectDashboards(domain),
            },
            // #21 口径设置：归一化后的生效口径（缺省=默认），供 Web 设置 UI 与派生视图直接消费。
            settings: readProjectSettings(domain),
            latestExports: Object.fromEntries(latestExports),
            // K11：按项目派生的补记队列（读时派生、零写）。
            queue,
            // 宿主 HTTP 能力探测：以「路由注册成功」为准；缺失/冲突 CLI-only，前端据此显示 unavailable。
            capabilities: {
              httpAvailable: previewRegistered || assetUploadRegistered || assetDownloadRegistered || assetStageRegistered,
              previewApi: previewRegistered,
              assetUpload: assetUploadRegistered && rootAvailable,
              assetDownload: assetDownloadRegistered && rootAvailable,
              stageCancel: assetStageRegistered && rootAvailable,
              limits: { previewBodyBytes: PREVIEW_MAX_BODY_BYTES, assetMaxBytes: ASSET_MAX_BYTES },
            },
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
      const progressMatch = /^progress(?:\s+([\s\S]*))?$/i.exec(raw)
      if (progressMatch) return handleProgressCommand(progressMatch[1] ?? '', domain)
      const materialMatch = /^material(?:\s+([\s\S]*))?$/i.exec(raw)
      if (materialMatch) return handleMaterialCommand(materialMatch[1] ?? '', domain)
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
      const captureApplyMatch = /^capture-apply(?:\s+([\s\S]*))?$/i.exec(raw)
      if (captureApplyMatch) return await handleCaptureCommand(`capture-apply ${captureApplyMatch[1] ?? ''}`.trim(), domain, optionalLlm())
      const captureMatch = /^capture(?:\s+([\s\S]*))?$/i.exec(raw)
      if (captureMatch) return handleCaptureCommand(captureMatch[1] ?? '', domain, optionalLlm())
      const attachEvidenceMatch = /^attach-evidence(?:\s+([\s\S]*))?$/i.exec(raw)
      if (attachEvidenceMatch) return handleCaptureCommand(`attach-evidence ${attachEvidenceMatch[1] ?? ''}`.trim(), domain, optionalLlm())
      const sessionMatch = /^session(?:\s+([\s\S]*))?$/i.exec(raw)
      if (sessionMatch) return handleSessionCommand(sessionMatch[1] ?? '', domain)
      const reflectListMatch = /^reflect-list(?:\s+([\s\S]*))?$/i.exec(raw)
      if (reflectListMatch) return handleReflectCommand(`list ${reflectListMatch[1] ?? ''}`.trim(), domain)
      const reflectMatch = /^reflect(?:\s+([\s\S]*))?$/i.exec(raw)
      if (reflectMatch) return handleReflectCommand(reflectMatch[1] ?? '', domain)
      const checkMatch = /^check(?:\s+([\s\S]*))?$/i.exec(raw)
      if (checkMatch) return handleCheckCommand(checkMatch[1] ?? '', domain)
      const metricMatch = /^metric(?:\s+([\s\S]*))?$/i.exec(raw)
      if (metricMatch) return handleMetricCommand(metricMatch[1] ?? '', domain)
      const queueMatch = /^queue(?:\s+([\s\S]*))?$/i.exec(raw)
      if (queueMatch) return handleQueueCommand(queueMatch[1] ?? '', domain)
      const okrMatch = /^okr(?:\s+([\s\S]*))?$/i.exec(raw)
      if (okrMatch) return handleOkrCommand(okrMatch[1] ?? '', domain)
      const lessonMatch = /^lesson(?:\s+([\s\S]*))?$/i.exec(raw)
      if (lessonMatch) return handleLessonCommand(lessonMatch[1] ?? '', domain)
      const reviewMatch = /^review(?:\s+([\s\S]*))?$/i.exec(raw)
      if (reviewMatch) return handleReviewCommand(reviewMatch[1] ?? '', domain)
      const archiveMatch = /^archive(?:\s+([\s\S]*))?$/i.exec(raw)
      if (archiveMatch) return handleArchiveCommand(archiveMatch[1] ?? '', domain)
      const habitMatch = /^habit(?:\s+([\s\S]*))?$/i.exec(raw)
      if (habitMatch) return handleHabitCommand(habitMatch[1] ?? '', domain)
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
