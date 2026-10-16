/**
 * 模型路由（ADL-044 双车道 → ADL-052 按场景三档路由）
 *
 * 设计原则（2026-10 模型选型，用户已认可）：
 * - 系统全部是「一次性文本生成、不挂 function calling」，共 5 个场景（见 AiTaskKind）。
 * - 三档模型：
 *     · deepseek-flash  主力：副驾（思考）、WBS/纪要（非思考）；
 *     · qwen-turbo / qwen3-coder-flash  降本兜底：报告叙述、标题分类、纪要 JSON；
 *     · deepseek-v4-pro  升级：副驾复杂多约束问题。
 * - 思考强度（reasoningEffort，off/low/high/max）：reasoning tokens 会大量计费，
 *   仅副驾开 high，其余场景 off；DeepSeek 适配器默认 high，故非思考场景必须显式传 off。
 * - Prompt Caching 为「自动」：稳定前缀字节稳定即命中。副驾的项目快照是稳定前缀，
 *   必须放在 user 消息最前、用户问题在最后（见 ask-copilot.buildAskContext），
 *   多轮追问时只有问题部分 miss，快照命中 cacheReadTokens。
 * - 只在检测到对应 Key 时才把候选放入链；绝不静默回退到免费公共网关。
 *
 * 配置形态：provider/model 由本文件决定；Key 只从启动 dsh 的进程环境读取，
 *   不入库、不入仓库代码；也可在 Web「设置→模型」凭据服务录入。
 */

import type { PmDomain } from './storage.js'

export type ModelMode = 'poc' | 'prod'
/** 思考强度，对应宿主 dsh-llm 的 ReasoningEffortId（off/low/high/max）。 */
export type ReasoningLevel = 'off' | 'low' | 'high' | 'max'
/** AI 调用场景：副驾 / WBS 拆解 / 会议纪要 / 报告叙述 / 标题分类。 */
export type AiTaskKind = 'copilot' | 'wbs' | 'meeting' | 'narrative' | 'title'

/** 一个候选模型（含 provider 与该候选使用的思考档位）。 */
export interface ModelCandidate {
  provider: string
  model: string
  reasoningEffort: ReasoningLevel
  /** 人读档位标签（主力 / 降本 / 升级 / 兜底）。 */
  label?: string
}

/** 一次调用的完整路由：primary 候选 + 完整降级链。 */
export interface ModelRoute extends ModelCandidate {
  /** 完整候选链（含 primary，按优先级）；generateDraft 依次尝试。 */
  models: ModelCandidate[]
  /** 场景人读标签。 */
  role: string
}

// ---- Provider / 模型 id ----
const POC_PROVIDER = 'our-free-model'
const POC_MODEL = 'kilo-auto/free'
const DS_PROVIDER = 'deepseek-official' // base 内置，anthropic-messages 协议
const DS_FLASH = 'deepseek-flash' // = DeepSeek-V4.1-Flash，1M 上下文
const DS_PRO = 'deepseek-v4-pro' // = DeepSeek-V4-Pro
const KIMI_PROVIDER = 'kimi-official' // pi-ai 配置，openai 兼容
const KIMI_MODEL = 'kimi-k2-0905-preview'
const ALIYUN_PROVIDER = 'aliyun-official' // pi-ai 配置，openai 兼容
const QWEN_TURBO = 'qwen-turbo'
const QWEN_CODER_FLASH = 'qwen3-coder-flash'

// ---- Key 检测（只读取环境变量，不回显明文）----
function hasDeepSeek(): boolean { return !!process.env.DEEPSEEK_API_KEY }
function hasKimi(): boolean { return !!process.env.KIMI_API_KEY || !!process.env.MOONSHOT_API_KEY }
function hasDashscope(): boolean { return !!process.env.DASHSCOPE_API_KEY || !!process.env.ALIBABA_CLOUD_API_KEY }

// ---- PoC 车道：免费网关候选链（仅概念验证；补齐 effort off）----
const POC_CANDIDATE_MODELS: ModelCandidate[] = [
  { provider: 'our-free-model', model: 'kilo-auto/free', reasoningEffort: 'off' },
  { provider: 'our-free-model', model: 'kilo-auto/openai', reasoningEffort: 'off' },
  { provider: 'openrouter', model: 'openrouter/free', reasoningEffort: 'off' },
  { provider: 'openrouter', model: 'openrouter/free2', reasoningEffort: 'off' },
]

/**
 * 生产车道：按场景 + 已就绪 Key 构建候选链。
 * 未检测到任何 Key 时返回空数组，由 resolveModelRoute 抛 PROD_KEY_MISSING。
 */
function buildProdCandidates(kind: AiTaskKind): ModelCandidate[] {
  const ds = hasDeepSeek()
  const kimi = hasKimi()
  const qwen = hasDashscope()
  const chain: ModelCandidate[] = []

  switch (kind) {
    case 'copilot':
      // 副驾：默认 Flash 思考；复杂问题升级 Pro；Kimi 兜底。
      if (ds) {
        chain.push({ provider: DS_PROVIDER, model: DS_FLASH, reasoningEffort: 'high', label: '主力·思考' })
        chain.push({ provider: DS_PROVIDER, model: DS_PRO, reasoningEffort: 'high', label: '升级·复杂' })
      }
      if (kimi) chain.push({ provider: KIMI_PROVIDER, model: KIMI_MODEL, reasoningEffort: 'off', label: '兜底' })
      break
    case 'wbs':
      // WBS：Flash 非思考（格式遵循）；阿里 coder-flash、Kimi 兜底。
      if (ds) chain.push({ provider: DS_PROVIDER, model: DS_FLASH, reasoningEffort: 'off', label: '主力' })
      if (qwen) chain.push({ provider: ALIYUN_PROVIDER, model: QWEN_CODER_FLASH, reasoningEffort: 'off', label: '降本' })
      if (kimi) chain.push({ provider: KIMI_PROVIDER, model: KIMI_MODEL, reasoningEffort: 'off', label: '兜底' })
      break
    case 'meeting':
      // 纪要：优先阿里 coder-flash（JSON 强）；Flash 非思考；Kimi 兜底。
      if (qwen) chain.push({ provider: ALIYUN_PROVIDER, model: QWEN_CODER_FLASH, reasoningEffort: 'off', label: 'JSON 强' })
      if (ds) chain.push({ provider: DS_PROVIDER, model: DS_FLASH, reasoningEffort: 'off', label: '主力' })
      if (kimi) chain.push({ provider: KIMI_PROVIDER, model: KIMI_MODEL, reasoningEffort: 'off', label: '兜底' })
      break
    case 'narrative':
      // 叙述：qwen-turbo 最便宜；Flash；Kimi 兜底。
      if (qwen) chain.push({ provider: ALIYUN_PROVIDER, model: QWEN_TURBO, reasoningEffort: 'off', label: '降本' })
      if (ds) chain.push({ provider: DS_PROVIDER, model: DS_FLASH, reasoningEffort: 'off', label: '主力' })
      if (kimi) chain.push({ provider: KIMI_PROVIDER, model: KIMI_MODEL, reasoningEffort: 'off', label: '兜底' })
      break
    case 'title':
      // 标题/分类/补全：qwen-turbo；Flash；Kimi 兜底。
      if (qwen) chain.push({ provider: ALIYUN_PROVIDER, model: QWEN_TURBO, reasoningEffort: 'off', label: '降本' })
      if (ds) chain.push({ provider: DS_PROVIDER, model: DS_FLASH, reasoningEffort: 'off', label: '主力' })
      if (kimi) chain.push({ provider: KIMI_PROVIDER, model: KIMI_MODEL, reasoningEffort: 'off', label: '兜底' })
      break
  }
  return chain
}

/** 场景人读标签（用于 model status 输出）。 */
export const SCENARIO_LABEL: Record<AiTaskKind, string> = {
  copilot: '副驾问答',
  wbs: 'WBS 拆解',
  meeting: '会议纪要',
  narrative: '报告叙述',
  title: '标题/分类',
}

/** 思考档位人读标签。 */
export function effortLabel(effort: ReasoningLevel): string {
  return effort === 'off' ? '非思考' : `思考·${effort}`
}

/**
 * 解析当前车道在某场景下的路由。
 * @param mode - poc / prod 车道。
 * @param kind - AI 场景（默认 copilot）。
 * @returns 完整路由（primary + 降级链）。
 * @throws prod 无任何 Key 时抛出含 PROD_KEY_MISSING 的错误（绝不静默回退免费）。
 */
export function resolveModelRoute(mode: ModelMode, kind: AiTaskKind = 'copilot'): ModelRoute {
  const chain = mode === 'poc' ? POC_CANDIDATE_MODELS : buildProdCandidates(kind)
  if (chain.length === 0) throw new Error(PROD_KEY_MISSING_TEXT)
  const primary = chain[0]
  return {
    provider: primary.provider,
    model: primary.model,
    reasoningEffort: primary.reasoningEffort,
    label: primary.label,
    role: SCENARIO_LABEL[kind],
    models: chain,
  }
}

export interface LaneInfo {
  mode: ModelMode
  provider: string
  model: string
  /** 档位角色（免费验证 / 主力 / 降本 / 升级）。 */
  role: string
  /** 对应 Key 是否就绪（PoC 恒 true）。 */
  ready: boolean
  note: string
}

/** 列出车道/档位概览（model status 用，不回显 Key 明文）。 */
export function describeLanes(_current: ModelMode): LaneInfo[] {
  const ds = hasDeepSeek()
  const qwen = hasDashscope()
  return [
    {
      mode: 'poc', provider: POC_PROVIDER, model: POC_MODEL, role: '免费验证', ready: true,
      note: '免费公共网关，仅概念验证',
    },
    {
      mode: 'prod', provider: DS_PROVIDER, model: DS_FLASH, role: '主力', ready: ds,
      note: '副驾思考 / WBS / 纪要',
    },
    {
      mode: 'prod', provider: ALIYUN_PROVIDER, model: QWEN_TURBO, role: '降本', ready: qwen,
      note: '叙述 / 标题 / 杂活',
    },
    {
      mode: 'prod', provider: DS_PROVIDER, model: DS_PRO, role: '升级', ready: ds,
      note: '副驾复杂问题',
    },
  ]
}

/**
 * 无生产 Key 的统一中文提示（错误文本须含 PROD_KEY_MISSING，且不回显 Key 明文）。
 */
export const PROD_KEY_MISSING_TEXT = [
  'PROD_KEY_MISSING：未检测到生产模型 API Key，本工具不会静默回退到免费公共网关。',
  '请配置（任选其一，Key 由启动 dsh 的进程环境提供，不入库）：',
  '  DeepSeek（主力，覆盖全部场景）：export DEEPSEEK_API_KEY=...  申请：https://platform.deepseek.com',
  '  阿里百炼（降本，qwen-turbo/coder-flash）：export DASHSCOPE_API_KEY=...  申请：https://bailian.console.aliyun.com',
  '  Kimi（兜底）：export KIMI_API_KEY=...  申请：https://platform.kimi.com',
  '或切回 PoC 验证车道（仅概念验证，勿用于生产）：/pm model mode poc',
].join('\n')

// ---- 车道持久化（mode 存进 pmtool 的 settings 表，不入库、不随仓库提交）----
const SETTINGS_KEY = 'aiModelMode'

/** 读取持久化模式（缺省 poc）。 */
export function getModelMode(domain: PmDomain | undefined): ModelMode {
  if (!domain) return 'poc'
  const row = domain.table('settings').get(SETTINGS_KEY) as { value?: string } | undefined
  return row?.value === 'prod' ? 'prod' : 'poc'
}

/** 持久化模式。 */
export async function setModelMode(domain: PmDomain | undefined, mode: ModelMode): Promise<void> {
  if (!domain) return
  await domain.table('settings').put(SETTINGS_KEY, { value: mode, updatedAt: new Date().toISOString() })
}
