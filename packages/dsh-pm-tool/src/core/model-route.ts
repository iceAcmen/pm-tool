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

// ---- Provider / 模型 id（方舟 Coding Plan 套餐内，provider=ark-plan；dsh 配置已声明这些模型）----
const POC_PROVIDER = 'our-free-model'
const POC_MODEL = 'kilo-auto/free'
const ARK_PROVIDER = 'ark-plan' // dsh 配置：baseURL=方舟 coding/v3，apiKeyEnv=CODING_PLAN_API_KEY
const ARK_FLASH = 'deepseek-v4-1-flash-260910' // 主力：DeepSeek V4.1 Flash，1M 上下文
const ARK_PRO = 'deepseek-v4-pro-ga-260813' // 升级：DeepSeek V4 Pro
const ARK_LITE = 'doubao-seed-2-1-lite-260915' // 降本：Doubao Seed 2.1 Lite（非思考、快）
const ARK_GLM = 'glm-5-3-flash-260828' // 兜底：GLM 5.3 Flash（JSON 强）

// ---- Key 检测（只读取环境变量，不回显明文）----
function hasCodingPlan(): boolean { return !!process.env.CODING_PLAN_API_KEY }

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
  const chain: ModelCandidate[] = []
  // 候选直接走 ark-plan，不在插件侧用 process.env 预检测：dsh 凭据不会注入到插件进程的
  // process.env，而是由 dsh 在发起请求时从 credentials 服务按 apiKeyEnv 解析。
  // 真未配置时 dsh 抛 MISSING_CREDENTIAL（经 ai-client 归一化为中文配置指引），不会静默回退。
  switch (kind) {
    case 'copilot':
      // 副驾：Flash 思考（high）；复杂问题升级 Pro；GLM 非思考兜底。
      chain.push({ provider: ARK_PROVIDER, model: ARK_FLASH, reasoningEffort: 'high', label: '主力·思考' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_PRO, reasoningEffort: 'high', label: '升级·复杂' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_GLM, reasoningEffort: 'off', label: '兜底' })
      break
    case 'wbs':
      // WBS：Flash 非思考（格式遵循）；GLM、Doubao 兜底。
      chain.push({ provider: ARK_PROVIDER, model: ARK_FLASH, reasoningEffort: 'off', label: '主力' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_GLM, reasoningEffort: 'off', label: '兜底' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_LITE, reasoningEffort: 'off', label: '降本' })
      break
    case 'meeting':
      // 纪要：GLM（JSON 强）；Flash 非思考；Doubao 兜底。
      chain.push({ provider: ARK_PROVIDER, model: ARK_GLM, reasoningEffort: 'off', label: 'JSON 强' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_FLASH, reasoningEffort: 'off', label: '主力' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_LITE, reasoningEffort: 'off', label: '兜底' })
      break
    case 'narrative':
      // 叙述：Doubao Lite 非思考、快；Flash；GLM 兜底。
      chain.push({ provider: ARK_PROVIDER, model: ARK_LITE, reasoningEffort: 'off', label: '降本' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_FLASH, reasoningEffort: 'off', label: '主力' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_GLM, reasoningEffort: 'off', label: '兜底' })
      break
    case 'title':
      // 标题/分类：Doubao Lite；GLM；Flash 兜底。
      chain.push({ provider: ARK_PROVIDER, model: ARK_LITE, reasoningEffort: 'off', label: '降本' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_GLM, reasoningEffort: 'off', label: '兜底' })
      chain.push({ provider: ARK_PROVIDER, model: ARK_FLASH, reasoningEffort: 'off', label: '主力' })
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
  const plan = hasCodingPlan()
  return [
    {
      mode: 'poc', provider: POC_PROVIDER, model: POC_MODEL, role: '免费验证', ready: true,
      note: '免费公共网关，仅概念验证',
    },
    {
      mode: 'prod', provider: ARK_PROVIDER, model: ARK_FLASH, role: '主力', ready: plan,
      note: '副驾思考 / WBS（DeepSeek V4.1 Flash）',
    },
    {
      mode: 'prod', provider: ARK_PROVIDER, model: ARK_LITE, role: '降本', ready: plan,
      note: '叙述 / 标题 / 杂活（Doubao Lite）',
    },
    {
      mode: 'prod', provider: ARK_PROVIDER, model: ARK_PRO, role: '升级', ready: plan,
      note: '副驾复杂问题（DeepSeek V4 Pro）',
    },
  ]
}

/**
 * 无生产 Key 的统一中文提示（错误文本须含 PROD_KEY_MISSING，且不回显 Key 明文）。
 */
export const PROD_KEY_MISSING_TEXT = [
  'PROD_KEY_MISSING：未检测到方舟 Coding Plan 套餐 Key（CODING_PLAN_API_KEY），本工具不会静默回退到免费公共网关。',
  '请配置（Key 由启动 dsh 的进程环境提供，不入库）：',
  '  export CODING_PLAN_API_KEY=ark-xxxx   （方舟 Coding Plan 订阅，Lite ¥40/月，覆盖 DeepSeek/Doubao/GLM 等模型）',
  '  订阅与接入：https://docs.volcengine.com/docs/ark/coding-plan-personal-ai-deepseek-harness',
  '或切回 PoC 验证车道（仅概念验证，勿用于生产）：/pm model mode poc',
].join('\n')

// ---- 车道持久化（mode 存进 pmtool 的 settings 表，不入库、不随仓库提交）----
const SETTINGS_KEY = 'aiModelMode'

/** 读取持久化模式：未显式设置时，检测到 Coding Plan Key 即默认 prod，否则 poc。 */
export function getModelMode(domain: PmDomain | undefined): ModelMode {
  if (!domain) return 'poc'
  const row = domain.table('settings').get(SETTINGS_KEY) as { value?: string } | undefined
  if (!row) return hasCodingPlan() ? 'prod' : 'poc'
  return row.value === 'poc' ? 'poc' : 'prod'
}

/** 持久化模式。 */
export async function setModelMode(domain: PmDomain | undefined, mode: ModelMode): Promise<void> {
  if (!domain) return
  await domain.table('settings').put(SETTINGS_KEY, { value: mode, updatedAt: new Date().toISOString() })
}
