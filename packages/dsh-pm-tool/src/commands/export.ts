/** /pm export markdown：把一个项目的当前 JSON 数据导出为 Markdown 报告。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { ExportFileExistsError, exportProjectMarkdown } from '../core/export.js'
import { ReportProjectNotFoundError } from '../core/report.js'
import type { PmDomain } from '../core/storage.js'

export const exportHelp = [
  '导出命令（离线，无需 API Key）：',
  '  /pm export markdown p-0001',
  '  /pm export markdown p-0001 ./my-reports',
  '  /pm export markdown p-0001 ./my-reports confirm',
  '默认写入 pm-tool/exports/<项目ID>-report.md；相对目录以 pm-tool 为基准。',
  '文件已存在时默认拒绝覆盖，末尾加 confirm 才覆盖。',
].join('\n')

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0]
    const last = value.at(-1)
    if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) return value.slice(1, -1)
  }
  return value
}

export async function handleExportCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: exportHelp }
  if (!domain) return { kind: 'error', text: '导出所需存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }

  const match = /^markdown\s+(\S+)(?:\s+([\s\S]+))?$/i.exec(input)
  if (!match) return { kind: 'error', text: `请使用 Markdown 导出格式。\n${exportHelp}` }
  const projectId = match[1]
  let remainder = match[2]?.trim() ?? ''
  let confirm = false
  if (/^confirm$/i.test(remainder)) {
    confirm = true
    remainder = ''
  } else {
    const confirmation = /^([\s\S]*\S)\s+confirm$/i.exec(remainder)
    if (confirmation) {
      confirm = true
      remainder = confirmation[1]
    }
  }
  const directory = remainder ? unquote(remainder) : undefined
  if (directory === '') return { kind: 'error', text: '导出目录不能为空。' }

  try {
    const result = await exportProjectMarkdown(domain, projectId, directory, confirm)
    return {
      kind: 'success',
      text: [
        confirm ? 'Markdown 报告已生成或覆盖。' : 'Markdown 报告已生成。',
        `文件：${result.path}`,
        '报告是 JSON 数据的只读导出视图，不会写入 storage-domain。',
      ].join('\n'),
    }
  } catch (error) {
    if (error instanceof ReportProjectNotFoundError) return { kind: 'error', text: error.message }
    if (error instanceof ExportFileExistsError) {
      return {
        kind: 'error',
        text: `${error.message}。确认覆盖时请在原命令末尾追加 confirm。`,
      }
    }
    console.error('[pm-tool] Markdown 导出失败：', error)
    return { kind: 'error', text: 'Markdown 导出失败；请检查目录是否可写及宿主日志后重试。' }
  }
}
