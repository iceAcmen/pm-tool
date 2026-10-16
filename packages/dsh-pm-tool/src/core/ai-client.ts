/**
 * 统一 AI 草稿客户端：
 *   - 给宿主 dsh-llm 适配器的「provider/model 候选链」按顺序尝试，首个成功即返回。
 *   - 透传 reasoningEffort（思考档位）：仅副驾开 high，其余 off（DeepSeek 默认 high，
 *     非思考场景必须显式 off 才不产生 reasoning tokens）。
 *   - Prompt Caching 由适配器/上游自动完成：保持 system 与「稳定前缀」字节稳定，
 *     副驾把项目快照放在 user 最前（见 ask-copilot），多轮追问命中 cacheReadTokens。
 *   - 任何失败均归一为中文 AiDraftError（绝不泄露原始英文堆栈/明文 Key），
 *     命令层据此降级到中文提示或手工流程。
 */
import {
  BlockAssembler,
  ReasoningEffortId,
  createUserMessage,
} from '@deepseek-ai/dsh-llm'
import type { ModelCandidate, ReasoningLevel } from './model-route.js'

export interface LlmGateway {
  prepareCall(request: {
    provider: string
    model: string
    maxTokens?: number
  }, signal?: AbortSignal): Promise<{
    config: unknown
    stream(options: Record<string, unknown> & { signal?: AbortSignal }): AsyncIterable<unknown>
  }>
}

export interface GenerateDraftOptions {
  system: string
  user: string
  maxTokens?: number
  /** 显式 primary provider（简化调用）；完整链走 models。 */
  provider?: string
  model?: string
  /** primary 思考档位（默认 off；副驾显式 high）。 */
  reasoningEffort?: ReasoningLevel
  /** 完整候选链（含 primary）；元素可为 model id（沿用 provider）或 ModelCandidate。 */
  models?: Array<string | ModelCandidate>
}

export class AiDraftError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'AiDraftError'
    this.code = code
  }
}

// 匿名 PoC 兜底：未显式指定 provider/model 时用的默认链。
const DEFAULT_PROVIDER = 'our-free-model'
const DEFAULT_MODELS = ['kilo-auto/free']

/** 把候选参数归一为去重后的 ModelCandidate 列表。 */
function buildCandidates(options: GenerateDraftOptions): ModelCandidate[] {
  const candidates: ModelCandidate[] = []
  const seen = new Set<string>()
  const push = (candidate: ModelCandidate): void => {
    const key = `${candidate.provider}::${candidate.model}`
    if (seen.has(key)) return
    seen.add(key)
    candidates.push(candidate)
  }

  if (options.provider && options.model) {
    push({ provider: options.provider, model: options.model, reasoningEffort: options.reasoningEffort ?? 'off' })
  }
  const chainProvider = options.provider ?? DEFAULT_PROVIDER
  for (const entry of options.models ?? []) {
    if (typeof entry === 'string') {
      push({ provider: chainProvider, model: entry, reasoningEffort: options.reasoningEffort ?? 'off' })
    } else {
      push({ ...entry, reasoningEffort: entry.reasoningEffort ?? 'off' })
    }
  }
  if (candidates.length === 0) {
    for (const model of DEFAULT_MODELS) push({ provider: DEFAULT_PROVIDER, model, reasoningEffort: 'off' })
  }
  return candidates
}

/** 单次候选尝试：组装流式响应，正文为空时抛 EMPTY 以便换模型。 */
async function attempt(
  llm: LlmGateway,
  candidate: ModelCandidate,
  options: GenerateDraftOptions,
  signal: AbortSignal,
): Promise<string> {
  const call = await llm.prepareCall({
    provider: candidate.provider,
    model: candidate.model,
    maxTokens: options.maxTokens,
  }, signal)
  const messages = [
    createUserMessage({
      content: [{ type: 'text', text: options.user }],
      source: { kind: 'user' },
    }),
  ]
  // 始终显式传 reasoningEffort：DeepSeek 默认 high，非思考场景必须显式 off；
  // pi-ai 适配器会把 off 安全转为 undefined（不发送），不会报错。
  const streamOptions = {
    ...(call.config as Record<string, unknown>),
    system: options.system,
    messages,
    maxTokens: options.maxTokens,
    reasoningEffort: ReasoningEffortId(candidate.reasoningEffort),
    signal,
  }
  const assembler = new BlockAssembler()
  for await (const chunk of call.stream(streamOptions)) {
    assembler.push(chunk as Parameters<typeof assembler.push>[0])
  }
  const text = assembler.blocks()
    .filter(block => block.type === 'text')
    .map(block => (block as { text: string }).text)
    .join('')
    .trim()
  if (!text) {
    throw new AiDraftError('EMPTY', `模型 ${candidate.model} 未返回正文。`)
  }
  return text
}

/**
 * 不可重试错误码：命中后立即抛出，不在候选链上换池重试。
 * 限流/容量类换池会放大限流；鉴权/无适配器换池也无意义，且调用方依赖其 code。
 */
const NON_RETRYABLE = new Set([
  'RATE_LIMIT', 'QUOTA_EXCEEDED', 'CONTEXT_OVERFLOW',
  'INVALID_CREDENTIAL', 'NO_ADAPTER',
])

/** 把上游英文错误归一为中文 AiDraftError（不泄露原始英文堆栈）。 */
function normalizeError(error: unknown, attempted: string): AiDraftError {
  if (error instanceof AiDraftError) return error
  // 超时/中断：上游 AbortError/TimeoutError 或自带 timeout signal 触发，归一为中文超时。
  const name = (error as { name?: string })?.name
  const message = String((error as { message?: string })?.message ?? '')
  if (name === 'AbortError' || name === 'TimeoutError' || /aborted|timeout/i.test(message)) {
    return new AiDraftError('MODEL_TIMEOUT', '模型超时或被中断，请重试一次。')
  }
  const raw = (error as { code?: string })?.code
  const code = String(raw ?? 'AI_DRAFT_FAILED')
  if (code === 'RATE_LIMIT') {
    return new AiDraftError('RATE_LIMIT', '模型服务限流，请稍后再试。')
  }
  if (code === 'CONTEXT_OVERFLOW') {
    return new AiDraftError('CONTEXT_OVERFLOW', '输入内容过长，请精简后重试。')
  }
  if (code === 'INVALID_CREDENTIAL') {
    return new AiDraftError('INVALID_CREDENTIAL', `模型 ${attempted} 凭据无效或已失效，请检查 API Key。`)
  }
  if (code === 'NO_ADAPTER') {
    return new AiDraftError('NO_ADAPTER', `当前模型通道 ${attempted} 未配置或缺少适配器。`)
  }
  return new AiDraftError(code, `模型 ${attempted} 生成失败，请稍后重试。`)
}

/**
 * 按候选链顺序尝试，首个成功即返回正文。
 * @throws {AiDraftError} 全部候选失败、或命中限流硬错误时抛出。
 */
export async function generateDraft(
  llm: LlmGateway | undefined,
  options: GenerateDraftOptions,
): Promise<string> {
  if (!llm) {
    throw new AiDraftError('NO_LLM', 'AI 草稿不可用：当前未装载 LLM 模型服务。')
  }
  const candidates = buildCandidates(options)
  const failures: string[] = []
  for (const candidate of candidates) {
    try {
      return await attempt(llm, candidate, options, AbortSignal.timeout(120000))
    } catch (error) {
      const normalized = normalizeError(error, `${candidate.provider}/${candidate.model}`)
      failures.push(normalized.message)
      if (NON_RETRYABLE.has(normalized.code)) throw normalized
    }
  }
  throw new AiDraftError(
    'AI_DRAFT_FAILED',
    `免费池多次尝试均失败：${failures.join('；')}。请稍后重试或切回 PoC：/pm model mode poc。`,
  )
}
