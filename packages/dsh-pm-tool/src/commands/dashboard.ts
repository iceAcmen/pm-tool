/**
 * 跨项目看板布局持久化（dashboard）。
 *
 * 后端只做「透明存取 + 轻量结构校验」：
 *   /pm dashboard put user <json>              个人作用域
 *   /pm dashboard put project <json>          旧全局项目作用域（仅读兼容，新写入走 project:<id>）
 *   /pm dashboard put project:p-0001 <json>   项目级作用域（按项目隔离）
 *   /pm dashboard reset user|project|project:p-0001
 *
 * 存储键：settings 表内 `dashboard_user` / `dashboard_project` / `dashboard_project_<p-id>`。
 * settings 键仅允许 [a-zA-Z0-9_-]，故暴露语法用 `project:`，落盘键用下划线。
 * 不做逐卡片/元素校验——那是前端（board/persist.ts）职责。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import type { PmDomain } from '../core/storage.js'

export const dashboardHelp = [
  '看板布局作用域：',
  '  /pm dashboard put user <json>              个人作用域',
  '  /pm dashboard put project <json>           旧全局项目作用域（读兼容）',
  '  /pm dashboard put project:p-0001 <json>    项目级作用域（按项目隔离）',
  '  /pm dashboard get user|project|project:p-0001',
  '  /pm dashboard reset user|project|project:p-0001',
].join('\n')

const PROJECT_ID_RE = /^p-\d+$/
const LEGACY_GLOBAL_KEY = 'dashboard_project'

export type DashboardScope =
  | { kind: 'user' }
  | { kind: 'legacyProject' }
  | { kind: 'project'; projectId: string }

/** 解析作用域：user / project（旧全局）/ project:<p-id>；非法返回 null。 */
export function parseDashboardScope(raw: string): DashboardScope | null {
  const value = raw.trim().toLowerCase()
  if (value === 'user') return { kind: 'user' }
  if (value === 'project') return { kind: 'legacyProject' }
  const m = /^project:(p-\d+)$/.exec(value)
  if (m && PROJECT_ID_RE.test(m[1])) return { kind: 'project', projectId: m[1] }
  return null
}

/** settings 表内落盘键（path-safe：仅 [a-zA-Z0-9_-]）。 */
function storageKey(scope: DashboardScope): string {
  if (scope.kind === 'user') return 'dashboard_user'
  if (scope.kind === 'legacyProject') return LEGACY_GLOBAL_KEY
  return `dashboard_project_${scope.projectId}`
}

/**
 * 读回某作用域布局：无记录、缺 value 或 value 为 null 时返回 null。
 * 供 web snapshot 与本命令共用；后端不解释布局内容。
 */
export function readDashboard(domain: PmDomain | undefined, scope: DashboardScope): unknown {
  if (!domain) return null
  const row = domain.table('settings').get(storageKey(scope)) as { value?: unknown } | undefined
  const value = row?.value
  return value === undefined || value === null ? null : value
}

/** 导出全部项目级布局 {p-0001: layout, …}；旧全局 project 不在此 map，由前端作 fallback 读取。 */
export function readProjectDashboards(domain: PmDomain | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!domain) return out
  for (const [key, row] of domain.table('settings').entries() as IterableIterator<[string, { value?: unknown }]>) {
    if (key === LEGACY_GLOBAL_KEY) continue
    if (!key.startsWith(`${LEGACY_GLOBAL_KEY}_`)) continue
    const projectId = key.slice(`${LEGACY_GLOBAL_KEY}_`.length)
    if (!PROJECT_ID_RE.test(projectId)) continue
    const value = row?.value
    if (value === undefined || value === null) continue
    out[projectId] = value
  }
  return out
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

  // 形如「put project:p-0001 {…}」：先切出 sub 与 scope，剩余整段（含空白）交给 JSON 解析。
  const firstSpace = argument.search(/\s/)
  const sub = (firstSpace === -1 ? argument : argument.slice(0, firstSpace)).trim().toLowerCase()
  const tail = firstSpace === -1 ? '' : argument.slice(firstSpace + 1)
  const secondSpace = tail.search(/\s/)
  const scopeRaw = (secondSpace === -1 ? tail : tail.slice(0, secondSpace)).trim()
  const jsonText = secondSpace === -1 ? '' : tail.slice(secondSpace + 1)

  if (sub === 'put') {
    const scope = parseDashboardScope(scopeRaw)
    if (!scope) {
      return { kind: 'error', text: `非法作用域：${scopeRaw || '（缺）'}。请用 user、project 或 project:p-0001。\n${dashboardHelp}` }
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
    const label = scope.kind === 'project' ? `项目级 ${scope.projectId}` : scope.kind === 'user' ? 'user' : 'project（旧全局）'
    return {
      kind: 'success',
      text: [`已保存 ${label} 看板布局。`, `updatedAt：${updatedAt}`].join('\n'),
    }
  }

  if (sub === 'get') {
    const scope = parseDashboardScope(scopeRaw)
    if (!scope) {
      return { kind: 'error', text: `非法作用域：${scopeRaw || '（缺）'}。请用 user、project 或 project:p-0001。\n${dashboardHelp}` }
    }
    if (jsonText.trim()) {
      return { kind: 'error', text: `get 不接受额外参数：${jsonText.trim()}。\n${dashboardHelp}` }
    }
    const layout = readDashboard(domain, scope)
    if (layout === null) return { kind: 'success', text: '该作用域暂无看板布局。' }
    return { kind: 'success', text: JSON.stringify(layout, null, 2) }
  }

  if (sub === 'reset') {
    const scope = parseDashboardScope(scopeRaw)
    if (!scope) {
      return { kind: 'error', text: `非法作用域：${scopeRaw || '（缺）'}。请用 user、project 或 project:p-0001。\n${dashboardHelp}` }
    }
    if (jsonText.trim()) {
      return { kind: 'error', text: `reset 不接受额外参数：${jsonText.trim()}。\n${dashboardHelp}` }
    }
    await domain.table('settings').delete(storageKey(scope))
    const label = scope.kind === 'project' ? `项目级 ${scope.projectId}` : scope.kind === 'user' ? 'user' : 'project（旧全局）'
    return { kind: 'success', text: `已清除 ${label} 看板布局。` }
  }

  return { kind: 'error', text: `不支持的 dashboard 子命令：${sub || '（缺）'}。\n${dashboardHelp}` }
}
