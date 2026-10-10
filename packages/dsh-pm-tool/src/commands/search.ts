/** /pm search：全库关键字检索离线命令（只读，不写盘）。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  searchPm,
  searchTypeLabels,
  searchTypes,
  SearchTypeInvalidError,
  validateSearchType,
  type SearchHit,
} from '../core/search.js'
import type { PmDomain } from '../core/storage.js'

export const searchHelp = [
  '关键字检索命令（离线、只读，无需 API Key）：',
  '  /pm search 需求',
  '  /pm search 验收 --type task',
  `  可选类型：${searchTypes.join(' / ')}（缺省时跨全部七类实体）。`,
  '对项目/任务/里程碑/风险问题/会议纪要/进度汇报/交付物的关键文本做不区分大小写子串匹配，按类型分组输出（ID + 一行摘要 + 所属项目）。',
].join('\n')

function parseSearch(argument: string): { keyword: string, type?: string } {
  const tokens = argument.split(/\s+/).filter(Boolean)
  let type: string | undefined
  const rest: string[] = []
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!
    if (token.toLowerCase() === '--type') {
      type = tokens[index + 1]
      index += 1
    } else {
      rest.push(token)
    }
  }
  return { keyword: rest.join(' '), type }
}

function renderGrouped(hits: SearchHit[]): string {
  const groups = new Map<string, SearchHit[]>()
  for (const hit of hits) {
    const list = groups.get(hit.type) ?? []
    list.push(hit)
    groups.set(hit.type, list)
  }
  const lines: string[] = []
  for (const type of searchTypes) {
    const list = groups.get(type)
    if (!list?.length) continue
    lines.push(`【${searchTypeLabels[type]}】（${list.length} 项）`)
    for (const hit of list) {
      lines.push(`  ${hit.id}｜${hit.title}｜所属项目：${hit.projectName}`)
    }
  }
  return lines.join('\n')
}

export async function handleSearchCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: searchHelp }
  if (!domain) return { kind: 'error', text: '检索依赖项目存储，请检查 pm profile 的存储配置及宿主日志。' }

  try {
    const { keyword, type } = parseSearch(input)
    if (!keyword) {
      return { kind: 'error', text: `请提供要检索的关键字。\n${searchHelp}` }
    }
    const validatedType = type ? validateSearchType(type) : undefined
    const hits = searchPm(domain, keyword, validatedType)
    if (!hits.length) {
      return { kind: 'success', text: `未检索到包含「${keyword}」的记录。` }
    }
    return {
      kind: 'success',
      text: [`共命中 ${hits.length} 条：`, renderGrouped(hits)].join('\n'),
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `检索参数不正确：${error.issues[0]?.message ?? ''}。` }
    }
    if (error instanceof SearchTypeInvalidError) {
      return { kind: 'error', text: `${error.message}。\n${searchHelp}` }
    }
    console.error('[pm-tool] 检索失败：', error)
    return { kind: 'error', text: '检索失败，请检查存储配置及宿主日志后重试。' }
  }
}
