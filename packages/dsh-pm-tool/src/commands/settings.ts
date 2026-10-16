/**
 * #21 口径设置命令（项目级，持久化到 settings 表，人类可读 JSON + 原子写沿用领域表）。
 *
 *   /pm settings                 查看当前生效口径（缺省=默认，标注是否自定义）
 *   /pm settings get             同上
 *   /pm settings put <json>      校验并保存整份口径（非法字段整份拒绝，不部分写入）
 *   /pm settings reset           清除自定义口径，全部回落默认
 *
 * 后端只做「透明存取 + normalizeProjectSettings 校验」，不解释派生公式；
 * 存储键 settings 表内 `project_settings`（path-safe：仅 [a-zA-Z0-9_-]）。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import type { PmDomain } from '../core/storage.js'
import {
  DEFAULT_PROJECT_SETTINGS,
  SETTING_FIELDS,
  normalizeProjectSettings,
  sameSettings,
  type ProjectSettings,
} from '../core/settings.js'

export const settingsHelp = [
  '口径设置（健康分权重/封顶/灯号线、临期窗口、过载阈值）：',
  '  /pm settings                 查看当前生效口径',
  '  /pm settings put <json>      保存整份口径（仅列出要改的字段即可，缺省字段回落默认）',
  '  /pm settings reset           清除自定义口径，全部恢复默认',
  '示例：/pm settings put {"reminderWithinDays":14,"loadOverloadThreshold":6}',
].join('\n')

const STORAGE_KEY = 'project_settings'

/** 透明读回原始记录（无记录/缺 value/null → null），供 web snapshot 透传。 */
export function readRawProjectSettings(domain: PmDomain | undefined): unknown {
  if (!domain) return null
  const row = domain.table('settings').get(STORAGE_KEY) as { value?: unknown } | undefined
  const value = row?.value
  return value === undefined || value === null ? null : value
}

/** 读回并归一化为生效口径（任何缺失/非法都回落默认，绝不抛）。 */
export function readProjectSettings(domain: PmDomain | undefined): ProjectSettings {
  return normalizeProjectSettings(readRawProjectSettings(domain)).settings
}

function renderSettings(settings: ProjectSettings): string {
  const custom = !sameSettings(settings, DEFAULT_PROJECT_SETTINGS)
  const lines: string[] = [
    `当前口径（${custom ? '已自定义' : '默认'}）：`,
  ]
  let group = ''
  for (const f of SETTING_FIELDS) {
    if (f.group !== group) {
      group = f.group
      lines.push(`\n【${group}】`)
    }
    const isDefault = settings[f.key] === DEFAULT_PROJECT_SETTINGS[f.key]
    const mark = isDefault ? '' : `（默认 ${DEFAULT_PROJECT_SETTINGS[f.key]}${f.unit}）`
    lines.push(`  ${f.label}：${settings[f.key]}${f.unit}${mark}`)
  }
  lines.push('', '提示：未列出的项均为默认；/pm settings reset 可全部恢复默认。')
  return lines.join('\n')
}

export async function handleSettingsCommand(
  argument: string,
  domain: PmDomain | undefined,
): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }

  const trimmed = argument.trim()
  const firstSpace = trimmed.search(/\s/)
  const sub = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).trim().toLowerCase()
  const tail = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim()

  // 无子命令 / get：展示生效口径。
  if (!sub || sub === 'get') {
    return { kind: 'success', text: renderSettings(readProjectSettings(domain)) }
  }

  if (sub === 'reset') {
    if (tail) return { kind: 'error', text: `reset 不接受额外参数：${tail}。\n${settingsHelp}` }
    await domain.table('settings').delete(STORAGE_KEY)
    return { kind: 'success', text: '已清除自定义口径，全部恢复默认。' }
  }

  if (sub === 'put') {
    const braceIndex = tail.indexOf('{')
    if (braceIndex === -1) {
      return { kind: 'error', text: '缺少 JSON 对象：请在 put 之后给出口径 JSON，例如 {"reminderWithinDays":14}。\n' + settingsHelp }
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(tail.slice(braceIndex))
    } catch (error) {
      return { kind: 'error', text: `JSON 解析失败：${error instanceof Error ? error.message : String(error)}。` }
    }
    // 局部更新：把本次提交浅合并到既有原始记录上，未列出的自定义字段保留，不被默认冲掉。
    const prevRaw = readRawProjectSettings(domain)
    const merged: Record<string, unknown> = (prevRaw && typeof prevRaw === 'object' && !Array.isArray(prevRaw))
      ? { ...(prevRaw as Record<string, unknown>), ...(parsed as object) }
      : (parsed as Record<string, unknown>)
    const { settings, invalid } = normalizeProjectSettings(merged)
    // 整份拒绝：任一非法字段都不落盘，避免部分写入造成口径半自定义。
    if (invalid.length) {
      return { kind: 'error', text: `口径校验未通过，未保存：\n- ${invalid.join('\n- ')}` }
    }
    const updatedAt = new Date().toISOString()
    await domain.table('settings').put(STORAGE_KEY, { value: settings, updatedAt })
    return {
      kind: 'success',
      text: [`已保存口径。`, `updatedAt：${updatedAt}`, '', renderSettings(settings)].join('\n'),
    }
  }

  return { kind: 'error', text: `不支持的 settings 子命令：${sub}。\n${settingsHelp}` }
}
