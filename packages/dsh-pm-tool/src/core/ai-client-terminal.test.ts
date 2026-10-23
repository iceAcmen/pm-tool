import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, { LlmAdapter, LlmError } from '@deepseek-ai/dsh-llm'
import type { StreamChunk } from '@deepseek-ai/dsh-llm'
import { describe, expect, it, vi } from 'vitest'
import { AiDraftError, generateDraft } from './ai-client.js'
import type { GenerateDraftOptions } from './ai-client.js'

const provider = 'terminal-dev-contract'
const partial = '{"actions":[{"op":"task.update","id":"t-0001","patch":{"progress":50}}]}'
const secret = 'timeout aborted sk-isolated-secret Authorization: Bearer isolated STACK_TRACE'
const healthy = '健康候选完整正文'
const options = { system: '稳定系统前缀', user: '稳定用户前缀', provider,
  models: ['first', 'second'], maxTokens: 4000, reasoningEffort: 'high' as const }
type Behavior = { code?: string, text?: string, delivery?: 'finish' | 'throw' | 'prepare',
  kind?: 'error' | 'aborted', message?: string }

// 仅提供合法适配器输入；prepared call、流终止与正文组装均运行生产实现。
class TerminalAdapter extends LlmAdapter {
  prepared: string[] = []
  calls: Array<{ model: string, maxTokens?: number, reasoningEffort?: string, signal?: AbortSignal }> = []
  prompts: Array<{ system: unknown, messages: unknown }> = []
  constructor(readonly behaviors: Record<string, Behavior>) { super() }
  override async resolveModel(p: string, model: string) {
    this.prepared.push(model)
    const b = this.behaviors[model]
    if (b?.delivery === 'prepare') throw new LlmError(b.message ?? secret, b.code!)
    return { provider: p, id: model, name: model,
      reasoning: { efforts: [{ id: 'off', name: 'Off' }, { id: 'high', name: 'High' }], defaultEffort: 'off' } }
  }
  async* stream(request: any): AsyncIterable<StreamChunk> {
    this.calls.push({ model: request.model, maxTokens: request.maxTokens,
      reasoningEffort: request.reasoningEffort, signal: request.signal })
    this.prompts.push({ system: request.system, messages: request.messages })
    const b = this.behaviors[request.model] ?? { text: healthy }
    if (b.text) yield { type: 'text-delta', index: 0, text: b.text }
    if (b.delivery === 'throw') throw new LlmError(b.message ?? secret, b.code!)
    if (b.code || b.kind) {
      yield { type: 'finish', reason: { kind: b.kind ?? 'error',
        failure: { code: b.code ?? 'ABORTED', message: b.message ?? secret } } }
    } else yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

async function outcome(behaviors: Record<string, Behavior>, customOptions: GenerateDraftOptions = options) {
  const ctx = new Context()
  await ctx.plugin(LlmRuntime)
  const adapter = new TerminalAdapter(behaviors)
  ctx.llm.registerAdapter([provider], adapter)
  let result: string | undefined, error: unknown
  try { result = await generateDraft(ctx.llm, customOptions) }
  catch (caught) { error = caught }
  finally { await ctx.fiber.dispose() }
  return { result, error, adapter }
}

const hardCodes = [
  ['AUTH', 'INVALID_CREDENTIAL', /凭据|鉴权|密钥/],
  ['RATE_LIMIT', 'RATE_LIMIT', /限流/],
  ['CONTEXT_WINDOW_EXCEEDED', 'CONTEXT_OVERFLOW', /过长|精简|上下文/],
  ['QUOTA', 'QUOTA_EXCEEDED', /额度|配额|余额/],
  ['ABORTED', 'ABORTED', /取消|中断/],
  ['INVALID_CREDENTIAL', 'INVALID_CREDENTIAL', /凭据/],
  ['CONTEXT_OVERFLOW', 'CONTEXT_OVERFLOW', /过长|精简/],
  ['QUOTA_EXCEEDED', 'QUOTA_EXCEEDED', /额度|配额|余额/],
  ['NO_ADAPTER', 'NO_ADAPTER', /未配置|适配器/],
  ['MISSING_CREDENTIAL', 'MISSING_CREDENTIAL', /凭据缺失/],
] as const

describe('ATF 稳定码与硬停止', () => {
  for (const delivery of ['finish', 'throw', 'prepare'] as const) {
    it.each(hardCodes)(`${delivery} %s 精确归类为 %s，不被报文关键词覆盖且不发下一候选`,
      async (code, expectedCode, chinese) => {
        const r = await outcome({ first: { code, delivery, text: partial } })
        expect(r.result).toBeUndefined()
        expect(r.error).toBeInstanceOf(AiDraftError)
        expect(r.error).toMatchObject({ code: expectedCode })
        expect((r.error as Error).message).toMatch(chinese)
        expect((r.error as Error).message).not.toMatch(/sk-isolated|Authorization|STACK_TRACE/)
        expect((r.error as Error).message).not.toContain(partial)
        expect(r.adapter.prepared).toEqual(['first'])
        expect(r.adapter.calls.map(c => c.model)).toEqual(delivery === 'prepare' ? [] : ['first'])
      })
  }
  it.each(['', partial])('aborted finish 优先于所携带其他码，无/部分正文 %j 都停链', async text => {
    const r = await outcome({ first: { kind: 'aborted', code: 'RATE_LIMIT', text } })
    expect(r.result).toBeUndefined()
    expect(r.error).toMatchObject({ name: 'AiDraftError', code: 'ABORTED' })
    expect((r.error as Error).message).toMatch(/取消|中断/)
    expect(r.adapter.prepared).toEqual(['first'])
  })
})

describe('ATF 一般失败、超时与真正空结果维持有界兜底', () => {
  it.each(['PI_AI_ERROR', 'UNKNOWN', 'TIMEOUT', 'EMPTY_RESPONSE'])(
    '%s 的部分正文不能成功，后续只能返回完整健康候选', async code => {
      const r = await outcome({ first: { code, text: partial } })
      expect(r.error).toBeUndefined()
      expect(r.result).toBe(healthy)
      expect(r.adapter.prepared).toEqual(['first', 'second'])
      expect(r.adapter.calls.map(c => c.model)).toEqual(['first', 'second'])
    })
  it.each(['finish', 'throw', 'prepare'] as const)(
    '%s TIMEOUT 只靠稳定码仍保留中文超时诊断，穷尽后不泄密', async delivery => {
      const message = 'opaque sk-isolated-secret Authorization STACK_TRACE'
      const r = await outcome({ first: { code: 'TIMEOUT', delivery, text: partial, message },
        second: { code: 'TIMEOUT', delivery, message } })
      expect(r.result).toBeUndefined()
      expect(r.error).toMatchObject({ name: 'AiDraftError', code: 'AI_DRAFT_FAILED' })
      expect((r.error as Error).message).toMatch(/超时/)
      expect((r.error as Error).message).not.toMatch(/未返回正文|sk-isolated|Authorization|STACK_TRACE/)
      expect(r.adapter.prepared).toEqual(['first', 'second'])
    })
  it('真正空 stop 允许下一候选，正常有正文 stop 原文返回且不换模', async () => {
    const empty = await outcome({ first: {} })
    expect(empty.result).toBe(healthy)
    expect(empty.adapter.prepared).toEqual(['first', 'second'])
    const normal = await outcome({ first: { text: partial } })
    expect(normal.result).toBe(partial)
    expect(normal.adapter.prepared).toEqual(['first'])
  })
  it('所有 EMPTY_RESPONSE 保留空正文诊断；一般失败绝不伪 EMPTY', async () => {
    const empty = await outcome({ first: { code: 'EMPTY_RESPONSE' }, second: { code: 'EMPTY_RESPONSE' } })
    expect((empty.error as Error).message).toMatch(/未返回正文/)
    const general = await outcome({ first: { code: 'PI_AI_ERROR' }, second: { code: 'PI_AI_ERROR' } })
    expect((general.error as Error).message).toMatch(/生成失败/)
    expect((general.error as Error).message).not.toMatch(/未返回正文|sk-isolated|Authorization|STACK_TRACE/)
  })
})

describe('ATF controls 与直接抛错兼容', () => {
  it('候选去重/high-off/maxTokens/稳定前缀/单候选120秒仍不变', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    try {
      const r = await outcome({ first: { code: 'PI_AI_ERROR', text: partial } }, {
        ...options, models: [
          { provider, model: 'first', reasoningEffort: 'high' },
          { provider, model: 'first', reasoningEffort: 'off' },
          { provider, model: 'second', reasoningEffort: 'off' },
        ],
      })
      expect(r.result).toBe(healthy)
      expect(timeout.mock.calls).toEqual([[120000], [120000]])
      expect(r.adapter.calls.map(({ model, maxTokens, reasoningEffort, signal }) => ({
        model, maxTokens, reasoningEffort, signal: signal instanceof AbortSignal,
      }))).toEqual([
        { model: 'first', maxTokens: 4000, reasoningEffort: 'high', signal: true },
        { model: 'second', maxTokens: 4000, reasoningEffort: 'off', signal: true },
      ])
      expect(r.adapter.prompts).toHaveLength(2)
      for (const prompt of r.adapter.prompts) {
        expect(prompt.system).toBe(options.system)
        expect(prompt.messages).toEqual([expect.objectContaining({
          role: 'user', source: { kind: 'user' },
          content: [{ type: 'text', text: options.user }],
        })])
      }
    } finally { timeout.mockRestore() }
  })
  it('直接 TimeoutError 与旧 AbortError 仍提供既有中文超时兜底，不新增 UI/API', async () => {
    for (const name of ['TimeoutError', 'AbortError']) {
      const prepared: string[] = []
      const gateway = { async prepareCall({ model }: { model: string }) {
        prepared.push(model)
        throw Object.assign(new Error(secret), { name })
      } }
      await expect(generateDraft(gateway, options)).rejects.toMatchObject({
        code: 'AI_DRAFT_FAILED', message: expect.stringMatching(/超时|中断/),
      })
      expect(prepared).toEqual(['first', 'second'])
    }
  })
})
