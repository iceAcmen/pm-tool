/**
 * /pm export：K18 单向出站命令层。
 *
 * 子命令：
 *   - markdown <项目ID> [目录] [confirm]  技术读者 Markdown 报告（既有档，补引用行）；
 *   - web <项目ID> [目录] [confirm]      非技术在线增强档：自包含只读 HTML 静态快照；
 *   - plain <项目ID> [目录] [confirm]    离线纯文本兜底（无 markdown 符号，含时间戳）；
 *   - json [目录] [confirm]              整库 JSON 备份（既有，不进项目出站日志）；
 *   - audit [项目ID]                     只读：审计只增流（长期保留，只增不删）；
 *   - sent [项目ID]                      只读：活跃已发日志（TTL 30 天，过期自动归档）。
 *
 * 能力边界：只读分发·单向只增，不是双向同步；导出后外部文件为唯一事实源，
 * 工具不做后续同步/镜像，台账后续变化不回写已导出文件；不预设 GitHub/外部平台。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import {
  ExportFileExistsError,
  exportProjectMarkdown,
  exportProjectPlain,
  exportProjectWeb,
  partitionSentEntries,
  readExportAudit,
  readExportSent,
  SENT_TTL_DAYS,
  type ProjectExportFormat,
} from '../core/export.js'
import { exportBackupJson } from '../core/backup.js'
import { ReportProjectNotFoundError } from '../core/report.js'
import type { PmDomain } from '../core/storage.js'

export const exportHelp = [
  '导出命令（离线，无需 API Key；只读分发 · 单向只增，外部文件为唯一事实源）：',
  '  /pm export markdown <项目ID> [目录] [confirm]   技术读者 Markdown 报告（含证据/交付物/复盘引用）',
  '  /pm export web <项目ID> [目录] [confirm]        非技术在线增强档（自包含只读 HTML 快照，浅深双态）',
  '  /pm export plain <项目ID> [目录] [confirm]      离线纯文本兜底（无 markdown 符号，含时间戳）',
  '  /pm export json [目录] [confirm]                整库 JSON 数据包备份',
  '  /pm export audit [项目ID]                      只读：审计只增流（长期保留，只增不删）',
  '  /pm export sent [项目ID]                        只读：活跃已发日志（保留 30 天，过期自动归档）',
  '默认写入 pm-tool/exports/<项目ID>-report.md / -snapshot.html / -report.txt；相对目录以 pm-tool 为基准。',
  '文件已存在时默认拒绝覆盖，末尾加 confirm 才覆盖。',
].join('\n')

const FORMAT_LABEL: Record<ProjectExportFormat, string> = {
  markdown: '技术 Markdown 报告',
  web: '非技术增强快照（HTML）',
  plain: '纯文本兜底（TXT）',
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0]
    const last = value.at(-1)
    if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) return value.slice(1, -1)
  }
  return value
}

/** 拆出末尾 confirm 标志，返回 { remainder, confirm }。 */
function splitConfirm(remainder: string): { remainder: string, confirm: boolean } {
  let confirm = false
  let rest = remainder.trim()
  if (/^confirm$/i.test(rest)) {
    confirm = true
    rest = ''
  } else {
    const m = /^([\s\S]*\S)\s+confirm$/i.exec(rest)
    if (m) {
      confirm = true
      rest = m[1]
    }
  }
  return { remainder: rest, confirm }
}

const SOURCE_DECLARATION = '声明：本文件为只读快照，非实时数据；导出后外部文件为唯一事实源，工具不做后续同步/镜像，台账后续变化不回写本文件。'

function outboundSuccessText(
  kind: string,
  result: {
    path: string
    itemCount?: number
    logs?: { auditCount: number, activeSentCount: number }
  },
  confirm: boolean,
): string {
  return [
    confirm ? `${kind}已生成或覆盖。` : `${kind}已生成。`,
    `文件：${result.path}`,
    result.itemCount !== undefined ? `导出条目：任务 ${result.itemCount} 条` : null,
    result.logs
      ? `出站日志：审计流累计 ${result.logs.auditCount} 条 · 活跃已发 ${result.logs.activeSentCount} 条（已发保留 ${SENT_TTL_DAYS} 天，过期自动归档）`
      : null,
    SOURCE_DECLARATION,
  ].filter(Boolean).join('\n')
}

function formatAuditLine(entry: { at: string, projectId: string, format: string, targetPath: string, itemCount: number }, index: number): string {
  return `${index + 1}. [${entry.at}] ${entry.projectId} · ${entry.format} · 任务 ${entry.itemCount} 条 · ${entry.targetPath}`
}

function formatSentLine(entry: { at: string, projectId: string, format: string, targetPath: string }, index: number): string {
  return `${index + 1}. [${entry.at}] ${entry.projectId} · ${entry.format} · ${entry.targetPath}`
}

export async function handleExportCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: exportHelp }
  if (!domain) return { kind: 'error', text: '导出所需存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }

  const space = input.search(/\s/)
  const sub = (space === -1 ? input : input.slice(0, space)).toLowerCase()
  const tail = space === -1 ? '' : input.slice(space + 1).trim()

  // ===== audit [项目ID]：只读审计只增流 =====
  if (sub === 'audit') {
    const filter = tail || undefined
    const entries = readExportAudit(domain)
      .filter(e => !filter || e.projectId === filter)
    if (entries.length === 0) {
      return { kind: 'success', text: filter ? `项目 ${filter} 暂无审计记录。` : '暂无审计记录。' }
    }
    return {
      kind: 'success',
      text: [
        `审计只增流（累计 ${entries.length} 条；append-only，长期保留，只增不删）：`,
        ...entries.map(formatAuditLine),
      ].join('\n'),
    }
  }

  // ===== sent [项目ID]：只读活跃已发日志 =====
  if (sub === 'sent') {
    const filter = tail || undefined
    const nowIso = new Date().toISOString()
    const { active } = partitionSentEntries(readExportSent(domain), nowIso)
    const entries = active.filter(e => !filter || e.projectId === filter)
    if (entries.length === 0) {
      return { kind: 'success', text: filter ? `项目 ${filter} 暂无活跃已发记录（过期条目已归档）。` : '暂无活跃已发记录（过期条目已归档）。' }
    }
    return {
      kind: 'success',
      text: [
        `活跃已发日志（${entries.length} 条；保留 ${SENT_TTL_DAYS} 天，过期在下次导出时自动归档，归档长期保留）：`,
        ...entries.map(formatSentLine),
      ].join('\n'),
    }
  }

  // ===== json [目录] [confirm]：整库备份（既有，不写项目出站日志）=====
  if (sub === 'json') {
    const { remainder, confirm } = splitConfirm(tail)
    const directory = remainder ? unquote(remainder) : undefined
    if (directory === '') return { kind: 'error', text: '导出目录不能为空。' }
    try {
      const result = await exportBackupJson(domain, directory, confirm)
      return {
        kind: 'success',
        text: [
          confirm ? 'JSON 数据包已生成或覆盖。' : 'JSON 数据包已生成。',
          `文件：${result.path}`,
          '导出产物不会写入 storage-domain。',
        ].join('\n'),
      }
    } catch (error) {
      if (error instanceof ExportFileExistsError) {
        return { kind: 'error', text: `${error.message}。确认覆盖时请在原命令末尾追加 confirm。` }
      }
      console.error('[pm-tool] 导出失败：', error)
      return { kind: 'error', text: '导出失败；请检查目录是否可写及宿主日志后重试。' }
    }
  }

  // ===== markdown | web | plain <项目ID> [目录] [confirm] =====
  const projectFormat: ProjectExportFormat | undefined = sub === 'markdown' || sub === 'web' || sub === 'plain'
    ? sub
    : undefined
  if (!projectFormat) {
    return { kind: 'error', text: `不支持的导出格式：${sub}。\n${exportHelp}` }
  }

  const m = /^(\S+)(?:\s+([\s\S]+))?$/.exec(tail)
  if (!m || !m[1]) return { kind: 'error', text: `用法：/pm export ${projectFormat} <项目ID> [目录] [confirm]` }
  const projectId = m[1]
  const { remainder, confirm } = splitConfirm(m[2] ?? '')
  const directory = remainder ? unquote(remainder) : undefined
  if (directory === '') return { kind: 'error', text: '导出目录不能为空。' }

  try {
    const result = projectFormat === 'markdown'
      ? await exportProjectMarkdown(domain, projectId, directory, confirm)
      : projectFormat === 'web'
        ? await exportProjectWeb(domain, projectId, directory, confirm)
        : await exportProjectPlain(domain, projectId, directory, confirm)
    return {
      kind: 'success',
      text: outboundSuccessText(FORMAT_LABEL[projectFormat], result, confirm),
    }
  } catch (error) {
    if (error instanceof ReportProjectNotFoundError) return { kind: 'error', text: error.message }
    if (error instanceof ExportFileExistsError) {
      return { kind: 'error', text: `${error.message}。确认覆盖时请在原命令末尾追加 confirm。` }
    }
    console.error('[pm-tool] 导出失败：', error)
    return { kind: 'error', text: '导出失败；请检查目录是否可写及宿主日志后重试。' }
  }
}
