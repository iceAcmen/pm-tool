/**
 * R18 备份/恢复命令：`/pm backup [目录?]` 写带时间戳备份；`/pm restore <备份文件> confirm` 两步恢复（恢复前自动安全快照）。
 * 只覆盖 pmtool 领域七类实体，不含宿主会话/密钥。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import type { PmDomain } from '../core/storage.js'
import { createBackup, readBackupFile, restoreBackup, restoreBackupFromContent, validateBackup } from '../core/backup.js'

export const backupHelp = [
  '备份/恢复命令（离线，仅 pmtool 七类实体，不含宿主会话与密钥）：',
  '  /pm backup                 备份到仓库 backups/（带时间戳），输出路径与各类计数',
  '  /pm backup ~/pm-backups     备份到指定目录',
  '  /pm restore backups/pmtool-backup-xxx.json       演练（只读校验，不落盘）',
  '  /pm restore backups/pmtool-backup-xxx.json confirm  真正恢复（恢复前自动先存一份安全快照）',
].join('\n')

export async function handleBackupCommand(argument: string, domain: PmDomain | undefined): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  // OPT-06：/pm restore-content <JSON编码的备份内容> [confirm] —— 网页选文件后按内容恢复。
  if (/^restore-content\b/i.test(argument.trim())) {
    const rest = argument.trim().replace(/^restore-content\s*/i, '')
    const isConfirm = /\sconfirm$/.test(rest)
    const jsonText = rest.replace(/\sconfirm$/, '').trim()
    if (!jsonText) return { kind: 'error', text: '请使用：/pm restore-content "<备份JSON>" [confirm]' }
    try {
      // 网页 panel 用 JSON.stringify(content) 包装：外层 parse 得到原始备份文本 string；
      // CLI 直接传 raw JSON 对象则兼容。统一解码为原始备份文本。
      const decoded = (() => {
        const outer = JSON.parse(jsonText)
        if (typeof outer === 'string') return outer
        return JSON.stringify(outer)
      })()
      if (!isConfirm) {
        validateBackup(JSON.parse(decoded))
        return { kind: 'success', text: [
          '已读取备份内容（演练，尚未恢复）。确认将用此备份替换当前七类实体（恢复前自动先存安全快照）：',
          '  /pm restore-content "<同上JSON>" confirm',
        ].join('\n') }
      }
      const result = await restoreBackupFromContent(domain, decoded)
      return {
        kind: 'success',
        text: [
          '已按所选备份文件恢复。',
          result.safetySnapshot ? `恢复前自动安全快照：${result.safetySnapshot}` : '当前库为空，未生成安全快照。',
        ].join('\n'),
      }
    } catch (error) {
      return { kind: 'error', text: `恢复失败：${error instanceof Error ? error.message : String(error)}` }
    }
  }
  // T-DEF-009：健壮 tokenizer，兼容 "/path with spaces" 引号路径（不 eval/不 shell）
  const tokens = argument.trim().match(/"[^\"]*"|'[^']*'|\S+/g)?.map(t => t.replace(/^['"]|['"]$/g, '')) ?? []
  if (tokens[0] === 'restore' || (tokens[0] ?? '').toLowerCase() === 'restore') {
    const [, filePath, confirmWord] = tokens
    if (!filePath) return { kind: 'error', text: '请使用：/pm restore <备份文件> [confirm]' }
    try {
      const backup = await readBackupFile(filePath)
      const summary = [
        '备份文件校验通过（演练，尚未恢复）：',
        `  导出时间：${backup.exportedAt}`,
        `  项目 ${backup.projects.length}｜任务 ${backup.tasks.length}｜里程碑 ${backup.milestones.length}`,
        `  风险问题 ${backup.riskIssues.length}｜会议 ${backup.meetings.length}｜汇报 ${backup.reports.length}｜交付物 ${backup.deliverables.length}`,
        '确认将用此备份替换当前七类实体（恢复前会自动先存一份安全快照）：',
        `  /pm restore ${filePath} confirm`,
      ].join('\n')
      if (confirmWord?.toLowerCase() !== 'confirm') return { kind: 'success', text: summary }
      const result = await restoreBackup(domain, filePath)
      return {
        kind: 'success',
        text: [
          '已恢复备份。',
          result.safetySnapshot ? `恢复前自动安全快照：${result.safetySnapshot}` : '当前库为空，未生成安全快照。',
          summary,
        ].join('\n'),
      }
    } catch (error) {
      return { kind: 'error', text: `备份/恢复失败：${error instanceof Error ? error.message : String(error)}` }
    }
  }

  // /pm backup [目录?]
  const directory = tokens[0] || undefined
  try {
    const result = await createBackup(domain, directory)
    const c = result.counts
    return {
      kind: 'success',
      text: [
        '备份已生成：',
        `  文件：${result.path}`,
        `  项目 ${c.projects}｜任务 ${c.tasks}｜里程碑 ${c.milestones}｜风险问题 ${c.risk_issues}`,
        `  会议 ${c.meetings}｜汇报 ${c.reports}｜交付物 ${c.deliverables}`,
      ].join('\n'),
    }
  } catch (error) {
    return { kind: 'error', text: `备份失败：${error instanceof Error ? error.message : String(error)}` }
  }
}
