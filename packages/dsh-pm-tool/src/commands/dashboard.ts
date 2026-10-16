/**
 * 跨项目看板布局持久化（dashboard）。
 *
 * 后端只做「透明存取 + 轻量结构校验」：
 *   /pm dashboard put user|project <json>   保存看板布局到 settings 表
 *   /pm dashboard reset user|project         清除对应作用域布局
 * 不做迁移、不做逐卡片/元素校验——那是前端（board/persist.ts）职责。
 *
 * 存储键：settings 表内 `dashboard_user` / `dashboard_project`。
 * 注意后端 per-record 键名仅允许 [a-zA-Z0-9_-]+（冒号会被拒），故用下划线而非 `dashboard:<scope>`。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import type { PmDomain } from '../core/storage.js'

export const dashboardHelp = [
  '跨项目看板布局：',
  '  /pm dashboard put user <json>      保存个人作用域看板布局',
  '  /pm dashboard put project <json>   保存项目作用域看板布局',
  '  /pm dashboard reset user|project    清除对应作用域看板布局',
].join('\n')

const SCOPES = ['user', 'project'] as const
type Scope = (typeof SCOPES)[number]

/** settings 表内的存储键（path-safe：仅 [a-zA-Z0-9_-]）。 */
function storageKey(scope: Scope): string {
  return `dashboard_${scope}`
}

/** 判断是否合法作用域。 */
function asScope(raw: string): Scope | null {
  return (SCOPES as readonly string[]).includes(raw) ? (raw as Scope) : null
}

/**
 * 读回某作用域布局：无记录、记录缺 value 或 value 为 null 时一律返回 null。
 * 供 web snapshot 与本命令共用；后端不解释布局内容。
 */
export function readDashboard(domain: PmDomain | undefined, scope: Scope): unknown {
  if (!domain) return null
  const row = domain.table('settings').get(storageKey(scope)) as { value?: unknown } | undefined
  const value = row?.value
  return value === undefined || value === null ? null : value
}

/** 轻量校验：必须是纯对象、version 为整数、widgets 为数组；通过返回 null，否则中文原因。 */
function validateLayout(raw: unknown): string | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return '看板布局必须是 JSON 对象。'
  }
  const obj = raw as Record<string, unknown>
  if (!Number.isInteger(obj.version)) {
    return '看板布局缺少合法的 version（必须为整数）。'
  }
  if (!Array.isArray(obj.widgets)) {
    return '看板布局缺少 widgets 数组。'
  }
  return null
}

export async function handleDashboardCommand(
  argument: string,
  domain: PmDomain | undefined,
): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  if (!argument.trim()) return { kind: 'error', text: `缺少子命令。\n${dashboardHelp}` }

  // 形如「put user {…}」：先切出 sub 与 scope，剩余整段（含空白）交给 JSON 解析。
  const firstSpace = argument.search(/\s/)
  const sub = (firstSpace === -1 ? argument : argument.slice(0, firstSpace)).trim().toLowerCase()
  const tail = firstSpace === -1 ? '' : argument.slice(firstSpace + 1)
  const secondSpace = tail.search(/\s/)
  const scopeRaw = (secondSpace === -1 ? tail : tail.slice(0, secondSpace)).trim().toLowerCase()
  const jsonText = secondSpace === -1 ? '' : tail.slice(secondSpace + 1)

  if (sub === 'put') {
    const scope = asScope(scopeRaw)
    if (!scope) {
      return { kind: 'error', text: `非法作用域：${scopeRaw || '（缺）'}。请用 user 或 project。\n${dashboardHelp}` }
    }
    const braceIndex = jsonText.indexOf('{')
    if (braceIndex === -1) {
      return { kind: 'error', text: '缺少 JSON 对象：请在作用域之后给出看板布局 JSON。' }
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText.slice(braceIndex))
    } catch (error) {
      return { kind: 'error', text: `JSON 解析失败：${error instanceof Error ? error.message : String(error)}。` }
    }
    const problem = validateLayout(parsed)
    if (problem) return { kind: 'error', text: problem }
    const updatedAt = new Date().toISOString()
    await domain.table('settings').put(storageKey(scope), { value: parsed, updatedAt })
    return {
      kind: 'success',
      text: [`已保存 ${scope} 作用域看板布局。`, `updatedAt：${updatedAt}`].join('\n'),
    }
  }

  if (sub === 'reset') {
    const scope = asScope(scopeRaw)
    if (!scope) {
      return { kind: 'error', text: `非法作用域：${scopeRaw || '（缺）'}。请用 user 或 project。\n${dashboardHelp}` }
    }
    if (jsonText.trim()) {
      return { kind: 'error', text: `reset 不接受额外参数：${jsonText.trim()}。\n${dashboardHelp}` }
    }
    await domain.table('settings').delete(storageKey(scope))
    return { kind: 'success', text: `已清除 ${scope} 作用域看板布局。` }
  }

  return { kind: 'error', text: `不支持的 dashboard 子命令：${sub || '（缺）'}。\n${dashboardHelp}` }
}
