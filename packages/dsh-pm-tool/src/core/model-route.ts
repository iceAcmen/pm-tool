/**
 * 双模型车道路由（ADL-044）。
 *
 * 两条车道：
 *  - poc：第三方插件 our-free-model（免费公共网关，OpenCode Zen / Kilo）。仅限概念验证、
 *    界面原型、需求推演；不得用于核心代码合并/生产提交（公共网关可能记录内容）。
 *  - prod：官方原生 API + 自有 Key（DeepSeek 优先，其次 Kimi/Moonshot）。
 *    无可用 Key 时返回结构化错误，绝不回退去免费车道做生产活。
 *
 * 模式持久化在 pmtool 领域 settings 表（键 aiModelMode），默认 poc。
 */
import type { PmDomain } from './storage.js'

export type ModelMode = 'poc' | 'prod'

export interface ModelLane {
  mode: ModelMode
  provider: string
  model: string
  ready: boolean
  /** 就绪说明（中文）；未就绪时给出如何配置 Key 的指引。 */
  note: string
}

/** PoC 车道：免费插件 provider id 固定为 our-free-model；默认用其 Kilo 免费自动路由模型 kilo-auto/free。 */
export const POC_LANE = { provider: 'our-free-model', model: 'kilo-auto/free' } as const

/** 生产车道候选（按优先级）：DeepSeek 官方 → Kimi/Moonshot 官方。 */
export const PROD_CANDIDATES = [
  {
    provider: 'deepseek-official',
    model: 'deepseek-chat',
    envCandidates: ['DEEPSEEK_API_KEY'],
    label: 'DeepSeek 官方（deepseek-chat）',
  },
  {
    provider: 'kimi-official',
    model: 'kimi-k2-0905-preview',
    envCandidates: ['KIMI_API_KEY', 'MOONSHOT_API_KEY'],
    label: 'Kimi/Moonshot 官方（kimi-k2）',
  },
] as const

function envPresent(names: readonly string[]): boolean {
  return names.some(name => {
    const value = process.env[name]
    return typeof value === 'string' && value.trim().length > 0
  })
}

/** 解析当前模式到具体 provider/model。prod 无 Key 时抛错（结构化 AiDraftError 由调用方归一）。 */
export function resolveModelRoute(mode: ModelMode): { provider: string, model: string } {
  if (mode === 'poc') return { provider: POC_LANE.provider, model: POC_LANE.model }
  for (const candidate of PROD_CANDIDATES) {
    if (envPresent(candidate.envCandidates)) {
      return { provider: candidate.provider, model: candidate.model }
    }
  }
  throw new Error('PROD_KEY_MISSING')
}

/** 列出两车道就绪状态（不回显任何 Key 明文）。 */
export function describeLanes(current: ModelMode): ModelLane[] {
  const poc: ModelLane = {
    mode: 'poc',
    provider: POC_LANE.provider,
    model: POC_LANE.model,
    ready: true,
    note: '免费公共网关（OpenCode Zen / Kilo），免 Key。仅概念验证，勿用于核心代码/生产提交。',
  }
  const prod: ModelLane[] = PROD_CANDIDATES.map(c => {
    const ready = envPresent(c.envCandidates)
    return {
      mode: 'prod',
      provider: c.provider,
      model: c.model,
      ready,
      note: ready
        ? `${c.label}：已检测到环境变量 ${c.envCandidates.find(n => process.env[n]?.trim())}。`
        : `${c.label}：未配置 ${c.envCandidates.join(' / ')}（见 docs/model-providers.md）。`,
    }
  })
  void current
  return [poc, ...prod]
}

const SETTINGS_KEY = 'aiModelMode'

/** 读取持久化模式（缺省 poc）。 */
export function getModelMode(domain: PmDomain | undefined): ModelMode {
  if (!domain) return 'poc'
  const row = domain.table('checks').get(SETTINGS_KEY) as { mode?: string } | undefined
  return row?.mode === 'prod' ? 'prod' : 'poc'
}

/** 持久化模式。 */
export async function setModelMode(domain: PmDomain | undefined, mode: ModelMode): Promise<void> {
  if (!domain) return
  await domain.table('checks').put(SETTINGS_KEY, { mode, updatedAt: new Date().toISOString() } as never)
}
