/**
 * R18 备份/恢复命令：`/pm backup [目录?]` 写带时间戳备份；`/pm restore <备份文件> confirm` 两步恢复（恢复前自动安全快照）。
 * 覆盖 pmtool 七类实体与白名单额外业务表/附件侧车，不含宿主会话/密钥。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import type { PmDomain } from '../core/storage.js'
import { createBackup, precheckBackupContent, precheckBackupFile, restoreBackup, restoreBackupFromContent } from '../core/backup.js'

export const backupHelp = [
  '备份/恢复命令（离线，pmtool 七类实体及备份内额外业务表/附件，不含宿主会话与密钥）：',
  '  /pm backup                 备份到内置 packages/backups/（带时间戳；可用 DSH_PM_BACKUP_DIR 覆盖），输出完整路径与各类计数',
  '  /pm backup ~/pm-backups     备份到指定目录',
  '  /pm restore backups/pmtool-backup-xxx.json       演练（只读校验，不落盘）',
  '  /pm restore backups/pmtool-backup-xxx.json confirm  真正恢复（恢复前自动先存一份安全快照）',
].join('\n')

/** dsh 命令路径 token，不交给 shell；不支持同时含两种引号或控制字符的路径。 */
export function quoteBackupPath(path: string): string {
  if (!path.trim() || /[\u0000-\u001f\u007f]/.test(path)) throw new Error('备份路径不能为空或包含控制字符')
  if (!path.includes('"')) return `"${path}"`
  if (!path.includes("'")) return `'${path}'`
  throw new Error('备份路径不能同时含单双引号，请使用不含这种组合的本机路径')
}

function pathTokens(argument: string): string[] {
  const text = argument.trim()
  if (/[\u0000-\u001f\u007f]/.test(text)) throw new Error('命令参数不能包含控制字符')
  const pattern = /"([^"]*)"|'([^']*)'|([^\s'"]+)/y
  const tokens: string[] = []
  let offset = 0
  while (offset < text.length) {
    while (text[offset] === ' ') offset++
    if (offset >= text.length) break
    pattern.lastIndex = offset
    const match = pattern.exec(text)
    if (!match || (pattern.lastIndex < text.length && text[pattern.lastIndex] !== ' ')) {
      throw new Error('命令路径参数格式不正确：请将完整路径放在一对引号内，参数之间用空格分隔')
    }
    tokens.push(match[1] ?? match[2] ?? match[3])
    offset = pattern.lastIndex
  }
  return tokens
}

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
        await precheckBackupContent(decoded)
        return { kind: 'success', text: [
          '备份内容结构与关系预检通过（无附件字节需恢复；演练，尚未恢复）。确认将替换七类实体及备份内显式额外业务表（恢复前自动先存安全快照）：',
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
  let tokens: string[]
  try { tokens = pathTokens(argument) } catch (error) {
    return { kind: 'error', text: `备份/恢复失败：${error instanceof Error ? error.message : String(error)}` }
  }
  if ((tokens[0] ?? '').toLowerCase() === 'restore') {
    const [, filePath, confirmWord] = tokens
    if (!filePath || tokens.length > 3 || (confirmWord !== undefined && confirmWord.toLowerCase() !== 'confirm')) {
      return { kind: 'error', text: '恢复参数错误，请使用：/pm restore "<备份完整路径>" [confirm]，不能追加其它参数' }
    }
    try {
      const quotedPath = quoteBackupPath(filePath)
      const confirmed = confirmWord?.toLowerCase() === 'confirm'
      const restored = confirmed ? await restoreBackup(domain, filePath) : undefined
      const backup = restored?.backup ?? await precheckBackupFile(filePath)
      const counts = [
        `  导出时间：${backup.exportedAt}`,
        `  项目 ${backup.projects.length}｜任务 ${backup.tasks.length}｜里程碑 ${backup.milestones.length}`,
        `  风险问题 ${backup.riskIssues.length}｜会议 ${backup.meetings.length}｜汇报 ${backup.reports.length}｜交付物 ${backup.deliverables.length}`,
        `  额外业务表：${Object.entries(backup.extra ?? {}).map(([name, rows]) => `${name} ${rows.length}`).join('｜') || '旧包未提供，保留当前额外表'}`,
      ]
      const summary = [
        '备份文件完整预检通过（结构、关系及附件侧车字节；演练，尚未恢复）：',
        ...counts,
        '确认将替换七类实体及备份内显式额外业务表/附件（恢复前会自动先存一份安全快照）：',
        `  /pm restore ${quotedPath} confirm`,
      ].join('\n')
      if (!restored) return { kind: 'success', text: summary }
      return {
        kind: 'success',
        text: [
          '已恢复备份。',
          restored.safetySnapshot ? `恢复前自动安全快照：${restored.safetySnapshot}` : '当前库为空，未生成安全快照。',
          ...counts,
        ].join('\n'),
      }
    } catch (error) {
      return { kind: 'error', text: `备份/恢复失败：${error instanceof Error ? error.message : String(error)}` }
    }
  }

  // /pm backup [目录?]
  if (tokens.length > 1) return { kind: 'error', text: '备份参数错误，请使用：/pm backup ["<目录完整路径>"]' }
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
