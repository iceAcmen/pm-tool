/**
 * 一次性文本生成客户端（R13/R14/R15 共用）。
 *
 * 设计原则（ADL-036）：LLM 只做一次性文本生成、不挂 tools/function calling；
 * 每次 generateDraft 只发一次模型请求；失败按 error.code 归一为中文提示，
 * 便于命令层优雅降级到手工/确定性路径。核心台账不依赖本模块。
 *
 * 调用范本来自上游内置「会话起名」：packages/session/session-title-llm/src/index.ts
 * （ctx.llm.prepareCall({provider,model,maxTokens}, signal) → call.stream(options)，
 * 用 BlockAssembler 把原始 chunk 流拼成文本块）。
 */
import { BlockAssembler, createUserMessage } from '@deepseek-ai/dsh-llm'

/** 默认路由：OpenRouter 免费自动路由（openrouter/free，见 docs/model-providers.md）。 */
export const AI_PROVIDER = 'openrouter-free'
export const AI_MODEL = 'openrouter/free'

/** 免费池随机模型 function-calling 不保证，故给足 maxTokens（推理型先吃 reasoning tokens，KB-034）。 */
export const AI_DEFAULT_MAX_TOKENS = 1200

/**
 * 命令层依赖的最小 LLM 网关（鸭子类型）：只需要 prepareCall。
 * 真实实现为宿主提供的 ctx.llm；测试里用 mock 返回 { config, stream }。
 */
export interface LlmGateway {
  prepareCall(
    config: { provider: string, model: string, maxTokens?: number },
    signal?: AbortSignal,
  ): Promise<{ config: unknown, stream(options: unknown): AsyncIterable<unknown> }>
}

/** AI 草稿不可用（未装载 LLM / 无 key / 限流 / 失败），命令层据此降级。 */
export class AiDraftError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'AiDraftError'
  }
}

/** 把上游 LlmError.code（RATE_LIMIT/QUOTA/INVALID_CREDENTIAL…）翻成面向用户的中文提示。 */
function friendlyCode(code: string | undefined): string {
  switch (code) {
    case 'RATE_LIMIT':
      return '免费模型正被限流（约 20 次/分钟），请稍后重试。'
    case 'QUOTA':
    case 'ACCOUNT_QUOTA':
      return '免费额度已用完（约 50 次/天），请明天再试或在 profile 配置其他模型。'
    case 'INVALID_CREDENTIAL':
    case 'AUTH':
      return '未配置或未生效的 OPENROUTER_API_KEY（AI 草稿不可用，你仍可手工录入）。'
    case 'CONTEXT_WINDOW_EXCEEDED':
      return '输入过长超过模型上下文上限，请精简目标文本后重试。'
    case 'NO_ADAPTER':
      return '宿主未装载对应模型适配器（openrouter-free），AI 草稿不可用。'
    default:
      return 'AI 生成失败（模型未返回可用文本），你仍可手工录入或稍后重试。'
  }
}

/** 把 prepareCall / stream 抛出的错误归一为 AiDraftError（按 code/name/message 路由）。 */
function normalize(error: unknown): AiDraftError {
  const record = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {}
  const name = typeof record.name === 'string' ? record.name : ''
  const code = typeof record.code === 'string' ? record.code : undefined
  const message = typeof record.message === 'string' ? record.message : ''

  // 超时/中断（免费池随机模型偶发延迟或 dsh 步骤超时）：不再让英文 abort 文案直抛到界面。
  const looksTimeout = name === 'AbortError'
    || code === 'ABORTED' || code === 'TIMEOUT' || code === 'ETIMEDOUT'
    || /abort|timeout|timed out/i.test(message)
  if (looksTimeout) {
    return new AiDraftError(
      'MODEL_TIMEOUT',
      '免费模型响应超时或被中断（免费池偶发），请重试一次；核心台账不受影响，你也可以手工录入。',
    )
  }
  return new AiDraftError(code ?? 'UNKNOWN', friendlyCode(code))
}

export interface GenerateDraftOptions {
  system: string
  user: string
  maxTokens?: number
  provider?: string
  model?: string
  /** 有序候选模型链（PoC 免费池跨池降级用）；缺省单模型。失败时依次换下一个。 */
  models?: string[]
  signal?: AbortSignal
}

const sleep = (ms: number) => new Promise<void>(resolve => { setTimeout(resolve, ms) })

/**
 * 发起一次纯文本生成，返回模型输出的拼接正文（已 trim）。
 * PoC 免费池（kilo/openrouter 两池各自约 80% 成功）偶发「思考耗尽正文为空 / finish=error」，
 * 故沿候选模型链依次换不同池重试（最多链长次、短退避），仍全失败才抛中文错误（ADL-044）。
 * @throws {AiDraftError} 未装载 LLM、无 key、限流、或链上全部失败时抛出。
 */
export async function generateDraft(llm: LlmGateway | undefined, options: GenerateDraftOptions): Promise<string> {
  if (!llm) {
    throw new AiDraftError('NO_LLM', '当前宿主未装载 LLM 服务，AI 草稿不可用；你仍可手工录入。')
  }
  const chain = (options.models && options.models.length > 0)
    ? options.models
    : [options.model ?? AI_MODEL]

  const tried: string[] = []
  let lastError: AiDraftError | null = null
  for (let i = 0; i < chain.length; i += 1) {
    const model = chain[i]
    tried.push(model)
    let result: { text: string, retriable: boolean, error: AiDraftError }
    try {
      result = await attempt(llm, { ...options, model })
    } catch (error) {
      // 硬错误不换池；其余可退避换下一池。
      const err = error instanceof AiDraftError ? error : normalize(error)
      result = { text: '', retriable: !['RATE_LIMIT', 'QUOTA', 'ACCOUNT_QUOTA', 'INVALID_CREDENTIAL', 'AUTH', 'CONTEXT_WINDOW_EXCEEDED', 'MODEL_TIMEOUT', 'NO_LLM'].includes(err.code), error: err }
    }
    if (result.text) return result.text
    lastError = result.error
    const hard = ['RATE_LIMIT', 'QUOTA', 'ACCOUNT_QUOTA', 'INVALID_CREDENTIAL', 'AUTH', 'CONTEXT_WINDOW_EXCEEDED', 'MODEL_TIMEOUT', 'NO_LLM']
    if (hard.includes(result.error.code) || i === chain.length - 1) break
    await sleep(400)
  }
  const hard = ['RATE_LIMIT', 'QUOTA', 'ACCOUNT_QUOTA', 'INVALID_CREDENTIAL', 'AUTH', 'CONTEXT_WINDOW_EXCEEDED', 'MODEL_TIMEOUT', 'NO_LLM']
  // 硬错误（限流/认证/上下文）直接抛原中文，不套通用链文案。
  if (lastError && hard.includes(lastError.code)) throw lastError
  throw new AiDraftError(
    lastError?.code ?? 'EMPTY_RESPONSE',
    `免费池多次尝试（${tried.join(' → ')}）均未返回可用正文；请稍后再试或手工录入。`,
  )
}

async function attempt(
  llm: LlmGateway,
  options: GenerateDraftOptions,
): Promise<{ text: string, retriable: boolean, error: AiDraftError }> {
  const provider = options.provider ?? AI_PROVIDER
  const model = options.model ?? AI_MODEL
  const maxTokens = options.maxTokens ?? AI_DEFAULT_MAX_TOKENS

  let call: { config: unknown, stream(options: unknown): AsyncIterable<unknown> }
  try {
    call = await llm.prepareCall({ provider, model, maxTokens }, options.signal)
  } catch (error) {
    throw normalize(error)
  }

  const messages = [
    createUserMessage({
      content: [{ type: 'text', text: options.user }],
      source: { kind: 'user' },
    }),
  ]

  const config = call.config as Record<string, unknown>
  const assembler = new BlockAssembler()
  let upstreamError: unknown
  try {
    for await (const chunk of call.stream({ ...config, system: options.system, messages, signal: options.signal })) {
      assembler.push(chunk as Parameters<typeof assembler.push>[0])
      if ((chunk as { error?: unknown })?.error) upstreamError = (chunk as { error?: unknown }).error
    }
  } catch (error) {
    throw normalize(error)
  }

  const text = assembler.blocks()
    .filter(block => block.type === 'text')
    .map(block => (block as { text: string }).text)
    .join('')
    .trim()

  if (text) return { text, retriable: false, error: new AiDraftError('EMPTY', '') }

  const kind = assembler.finish?.kind
  const retriable = kind === 'max-tokens' || !!upstreamError
  const error = new AiDraftError(
    kind === 'max-tokens' ? 'MAX_TOKENS' : 'EMPTY_RESPONSE',
    kind === 'max-tokens'
      ? '模型在输出结束前达到 max_tokens（推理占满），正文为空。'
      : upstreamError
        ? '免费池上游返回异常（随机模型不稳）。'
        : '模型未返回可用正文。',
  )
  return { text: '', retriable, error }
}
