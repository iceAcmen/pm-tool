/**
 * 双模型车道切换命令（ADL-044）：
 *   /pm model mode poc|prod   切换并回显当前车道/模型/就绪状态
 *   /pm model status          列出两车道 provider/model/Key 状态（不回显明文 Key）
 */
import { describeLanes, getModelMode, resolveModelRoute, setModelMode, PROD_KEY_MISSING_TEXT, type ModelMode } from '../core/model-route.js'
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import type { PmDomain } from '../core/storage.js'

export const modelHelp = [
  '模型车道：',
  '  /pm model mode poc        切到 PoC 验证车道（免费公共网关，仅概念验证）',
  '  /pm model mode prod       切到生产车道（官方 API + 自有 Key）',
  '  /pm model status          查看两车道 provider/model/Key 就绪状态',
].join('\n')

export async function handleModelCommand(argument: string, domain: PmDomain | undefined): Promise<CommandResult> {
  const tokens = argument.split(/\s+/).filter(Boolean)
  const sub = (tokens[0] ?? '').toLowerCase()

  if (sub === 'status' || !sub) {
    const current = getModelMode(domain)
    const lanes = describeLanes(current)
    const lines = [`当前车道：${current === 'poc' ? 'PoC 验证（免费网关）' : '生产开发（官方 API）'}`]
    for (const lane of lanes) {
      const mark = lane.mode === current ? '▶ ' : '  '
      lines.push(`${mark}[${lane.mode}] ${lane.provider}/${lane.model} ${lane.ready ? '就绪' : '未就绪'} — ${lane.note}`)
    }
    return { kind: 'success', text: lines.join('\n') }
  }

  if (sub === 'mode') {
    const next = (tokens[1] ?? '').toLowerCase() as ModelMode
    if (next !== 'poc' && next !== 'prod') {
      return { kind: 'error', text: `非法模式：${tokens[1] ?? ''}。请用 poc 或 prod。\n${modelHelp}` }
    }
    await setModelMode(domain, next)
    let route
    try {
      route = resolveModelRoute(next)
    } catch {
      return {
        kind: 'success',
        text: [
          '已切到生产车道（prod），但当前进程环境未检测到 Key。',
          PROD_KEY_MISSING_TEXT,
        ].join('\n'),
      }
    }
    return {
      kind: 'success',
      text: [
        `已切到 ${next === 'poc' ? 'PoC 验证车道' : '生产车道'}：${route.provider}/${route.model}。`,
        next === 'poc'
          ? '提示：免费公共网关仅用于概念验证，勿用于核心代码合并/生产提交。'
          : '生产车道已就绪（检测到 Key）。',
      ].join('\n'),
    }
  }

  return { kind: 'error', text: `不支持的 model 子命令。\n${modelHelp}` }
}
