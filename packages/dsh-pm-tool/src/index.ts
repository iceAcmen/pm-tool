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
import { handleProjectCommand, projectHelp } from './commands/project.js'
import { handleTaskCommand, taskHelp } from './commands/task.js'
import { handleMilestoneCommand, milestoneHelp } from './commands/milestone.js'
import { exportHelp, handleExportCommand } from './commands/export.js'

/** Cordis 插件名（注册、日志、配置 id 均以此为准）。 */
export const name = 'pm-tool'

/** 依赖的宿主服务：commands=离线斜杠命令；storageDomain=类型化文件存储。 */
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
      exportHelp,
    ].join('\n'),
  }
}

/** 插件入口：注册命令并尝试打开存储领域。 */
export async function apply(ctx: Context): Promise<void> {
  let domain: PmDomain | undefined
  try {
    const opened = await openPmDomain(ctx)
    domain = opened
    ctx.effect(() => () => opened.close())
    console.info('[pm-tool] 存储领域 pmtool 已打开')
  } catch (error) {
    // 存储未配置好时不应阻断命令注册；selftest 会提示具体原因。
    console.warn('[pm-tool] 存储领域打开失败：', error)
  }

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-pm-tool'),
    name: 'pm',
    description: '项目管理工作台：项目、WBS、里程碑、报告导出与存储自检',
    input: { hint: '[project ...|task ...|milestone ...|export markdown ...|ping|selftest]', attachments: false },
    handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
      // 仅命令词忽略大小写，名称、描述、负责人和 JSON 正文保持原样。
      const raw = invocation.rawInput.trim()
      if (/^web\s+snapshot$/i.test(raw)) {
        if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
        const records = (name: 'projects' | 'tasks' | 'milestones') =>
          [...domain.table(name).entries()].map(([, value]) => value)
        return {
          kind: 'success',
          text: JSON.stringify({
            projects: records('projects'),
            tasks: records('tasks'),
            milestones: records('milestones'),
          }),
        }
      }
      const projectMatch = /^project(?:\s+([\s\S]*))?$/i.exec(raw)
      if (projectMatch) return handleProjectCommand(projectMatch[1] ?? '', domain)
      const taskMatch = /^task(?:\s+([\s\S]*))?$/i.exec(raw)
      if (taskMatch) return handleTaskCommand(taskMatch[1] ?? '', domain)
      const milestoneMatch = /^milestone(?:\s+([\s\S]*))?$/i.exec(raw)
      if (milestoneMatch) return handleMilestoneCommand(milestoneMatch[1] ?? '', domain)
      const exportMatch = /^export(?:\s+([\s\S]*))?$/i.exec(raw)
      if (exportMatch) return handleExportCommand(exportMatch[1] ?? '', domain)
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
