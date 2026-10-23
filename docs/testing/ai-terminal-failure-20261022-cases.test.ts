import { appendFileSync } from 'node:fs'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, { BlockAssembler, LlmAdapter, LlmError, createUserMessage } from '@deepseek-ai/dsh-llm'
import { describe, expect, it } from 'vitest'
import { generateDraft, AiDraftError } from '../../packages/dsh-pm-tool/src/core/ai-client'
import { parseCopilotPlan, validatePlan } from '../../packages/dsh-pm-tool/src/core/copilot'
import { toStreamChunks } from '../../upstream/pi-src/stream'

const provider = 'terminal-contract'
const planText = '{"actions":[{"op":"task.update","id":"t-0001","patch":{"progress":50}}]}'
const healthy = 'HEALTHY_ONLY'
const options = { system: 'contract-system', user: 'contract-user', provider, models: ['first', 'second'], maxTokens: 4000 }
const usage = { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 2,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } }
type Behavior = { text?: string, stop?: 'stop' | 'error' | 'aborted', errorMessage?: string,
  throwCode?: string, throwName?: string, prepareCode?: string }

function message(behavior: Behavior, model = 'first') {
  return { role: 'assistant', content: behavior.text ? [{ type: 'text', text: behavior.text }] : [],
    api: 'anthropic-messages', provider, model, usage, stopReason: behavior.stop ?? 'stop',
    timestamp: 0, ...behavior.errorMessage ? { errorMessage: behavior.errorMessage } : {} } as const
}

// Only the adapter input is scripted. Both event translation and runtime error delivery are production code.
async function* events(behavior: Behavior, model: string) {
  const m = message(behavior, model)
  yield { type: 'start', partial: m }
  if (behavior.text) {
    yield { type: 'text_start', contentIndex: 0, partial: m }
    yield { type: 'text_delta', contentIndex: 0, delta: behavior.text, partial: m }
    if (!behavior.stop || behavior.stop === 'stop') {
      yield { type: 'text_end', contentIndex: 0, content: behavior.text, partial: m }
    }
  }
  if (behavior.stop === 'error' || behavior.stop === 'aborted') {
    yield { type: 'error', reason: behavior.stop, error: m }
  } else yield { type: 'done', reason: 'stop', message: m }
}

class FixtureAdapter extends LlmAdapter {
  calls: Array<{ model: string, maxTokens?: number, reasoningEffort?: string, signal: boolean }> = []
  prepare: string[] = []
  constructor(readonly behaviors: Record<string, Behavior>) { super() }
  override async resolveModel(p: string, model: string) {
    this.prepare.push(model)
    const b = this.behaviors[model]
    if (b?.prepareCode) throw new LlmError('isolated prepare rejection', b.prepareCode)
    return { provider: p, id: model, name: model,
      reasoning: { efforts: [{ id: 'off', name: 'Off' }, { id: 'high', name: 'High' }], defaultEffort: 'off' } }
  }
  async* stream(request: any) {
    const b = this.behaviors[request.model] ?? { text: healthy }
    this.calls.push({ model: request.model, maxTokens: request.maxTokens,
      reasoningEffort: request.reasoningEffort, signal: request.signal instanceof AbortSignal })
    if (b.throwCode || b.throwName) {
      if (b.text) yield { type: 'text-delta' as const, index: 0, text: b.text }
      const error = b.throwCode ? new LlmError('isolated adapter rejection', b.throwCode)
        : new Error('isolated timeout')
      if (b.throwName) error.name = b.throwName
      throw error
    }
    yield* toStreamChunks(events(b, request.model) as any, 200000, request.signal, request.model)
  }
}

async function fixture(behaviors: Record<string, Behavior>) {
  const ctx = new Context()
  await ctx.plugin(LlmRuntime)
  const adapter = new FixtureAdapter(behaviors)
  ctx.llm.registerAdapter([provider], adapter)
  return { ctx, adapter }
}

async function outcome(behaviors: Record<string, Behavior>, id: string) {
  const { ctx, adapter } = await fixture(behaviors)
  let result: { ok: true, text: string } | { ok: false, code: string, message: string, name: string }
  try { result = { ok: true, text: await generateDraft(ctx.llm, options) } }
  catch (e: any) { result = { ok: false, code: e.code, message: e.message, name: e.name } }
  finally { await ctx.fiber.dispose() }
  const record = { id, behaviors, result, calls: adapter.calls, prepare: adapter.prepare }
  appendFileSync(process.env.ATF_OBSERVATIONS!, `${JSON.stringify(record)}\n`)
  return record
}

async function protocol(behavior: Behavior) {
  const chunks = []
  for await (const c of toStreamChunks(events(behavior, 'first') as any, 200000)) chunks.push(c)
  const assembler = new BlockAssembler()
  for (const c of chunks) assembler.push(c)
  return { chunks, finish: assembler.finish, blocks: assembler.blocks() }
}

describe('controls: eight contract families', () => {
  it('C01 production prepareCall freezes controls, dispatches once, and healthy draft recovers', async () => {
    const { ctx, adapter } = await fixture({ first: { text: healthy } })
    try {
      const prepared = await ctx.llm.prepareCall({ provider, model: 'first', maxTokens: 4000, reasoningEffort: 'high' })
      expect(Object.isFrozen(prepared.config)).toBe(true)
      const request = { ...prepared.config, messages: [createUserMessage({
        content: [{ type: 'text', text: 'user' }], source: { kind: 'user' } })] }
      expect(() => prepared.stream({ ...request, maxTokens: 4001 })).toThrow(/config changed/)
      const assembler = new BlockAssembler()
      for await (const c of prepared.stream(request)) assembler.push(c)
      expect(assembler.finish).toEqual({ kind: 'stop' })
      expect(assembler.blocks()).toEqual([{ type: 'text', text: healthy }])
      expect(() => prepared.stream(request)).toThrow(/only be dispatched once/)
      expect(await generateDraft(ctx.llm, { ...options, models: ['first'], reasoningEffort: 'high' })).toBe(healthy)
      expect(adapter.calls[1]).toMatchObject({ maxTokens: 4000, reasoningEffort: 'high', signal: true })
    } finally { await ctx.fiber.dispose() }
  })

  it('C02 real pi terminal error retains no/partial blocks and a stable failure, not an assembler throw', async () => {
    for (const text of ['', planText]) {
      const p = await protocol({ stop: 'error', errorMessage: 'isolated provider failure', text })
      expect(p.finish).toEqual({ kind: 'error', failure: { code: 'PI_AI_ERROR', message: 'isolated provider failure' } })
      expect(p.blocks).toEqual(text ? [{ type: 'text', text }] : [])
      expect(p.chunks.slice(-2).map(c => c.type)).toEqual(['usage', 'finish'])
    }
  })

  it('C03 real pi 401/403 is AUTH; production prepare credential errors already stop the chain', async () => {
    for (const http of [401, 403]) {
      expect((await protocol({ stop: 'error', errorMessage: `${http} isolated authentication failure` })).finish)
        .toMatchObject({ kind: 'error', failure: { code: 'AUTH' } })
    }
    for (const code of ['INVALID_CREDENTIAL', 'MISSING_CREDENTIAL']) {
      const r = await outcome({ first: { prepareCode: code }, second: { text: healthy } }, `C03-${code}`)
      expect(r.result).toMatchObject({ ok: false, code, name: 'AiDraftError' })
      expect(r.prepare).toEqual(['first'])
      expect(r.calls).toEqual([])
    }
  })

  it('C04 pi 429 is RATE_LIMIT; existing prepare RATE_LIMIT handling is a working counterexample', async () => {
    expect((await protocol({ stop: 'error', errorMessage: '429 isolated rate limit' })).finish)
      .toMatchObject({ kind: 'error', failure: { code: 'RATE_LIMIT' } })
    const r = await outcome({ first: { prepareCode: 'RATE_LIMIT' } }, 'C04')
    expect(r.result).toMatchObject({ ok: false, code: 'RATE_LIMIT', message: '模型服务限流，请稍后再试。' })
    expect(r.prepare).toEqual(['first'])
  })

  it('C05 pi capacity codes are CONTEXT_WINDOW_EXCEEDED and QUOTA, not the local old aliases', async () => {
    expect((await protocol({ stop: 'error', errorMessage: 'prompt is too long: 210000 tokens > 200000 maximum' })).finish)
      .toMatchObject({ kind: 'error', failure: { code: 'CONTEXT_WINDOW_EXCEEDED' } })
    expect((await protocol({ stop: 'error', errorMessage: 'insufficient quota' })).finish)
      .toMatchObject({ kind: 'error', failure: { code: 'QUOTA' } })
  })

  it('C06 pi TIMEOUT and typed runtime TIMEOUT are stable; raw TimeoutError is UNKNOWN', async () => {
    expect((await protocol({ stop: 'error', errorMessage: 'request timeout' })).finish)
      .toMatchObject({ kind: 'error', failure: { code: 'TIMEOUT' } })
    const { ctx } = await fixture({ first: { throwName: 'TimeoutError' }, typed: { throwCode: 'TIMEOUT' } })
    try {
      const p = await ctx.llm.prepareCall({ provider, model: 'first', reasoningEffort: 'off' })
      const assembler = new BlockAssembler()
      for await (const c of p.stream({ ...p.config, messages: [] })) assembler.push(c)
      expect(assembler.finish).toMatchObject({ kind: 'error', failure: { code: 'UNKNOWN' } })
      const typed = await ctx.llm.prepareCall({ provider, model: 'typed', reasoningEffort: 'off' })
      const typedAssembler = new BlockAssembler()
      for await (const c of typed.stream({ ...typed.config, messages: [] })) typedAssembler.push(c)
      expect(typedAssembler.finish).toMatchObject({ kind: 'error', failure: { code: 'TIMEOUT' } })
    } finally { await ctx.fiber.dispose() }
  })

  it('C07 real aborted event/caller-aborted error both use ABORTED and retain partial text', async () => {
    expect((await protocol({ stop: 'aborted', text: planText })).finish)
      .toMatchObject({ kind: 'aborted', failure: { code: 'ABORTED' } })
    const controller = new AbortController()
    controller.abort()
    const assembler = new BlockAssembler()
    for await (const c of toStreamChunks(events({ stop: 'error', text: planText,
      errorMessage: 'isolated provider failure' }, 'first') as any, 200000, controller.signal)) assembler.push(c)
    expect(assembler.finish).toMatchObject({ kind: 'aborted', failure: { code: 'ABORTED' } })
    expect(assembler.blocks()).toEqual([{ type: 'text', text: planText }])
  })

  it('C08 malformed stop yields no plan; partial-error fixture is actually valid production actions schema', async () => {
    const r = await outcome({ first: { text: 'isolated malformed output {' } }, 'C08')
    expect(r.result.ok).toBe(true)
    if (r.result.ok) expect(parseCopilotPlan(r.result.text).rawSteps).toEqual([])
    const parsed = parseCopilotPlan(planText)
    expect(parsed.rawSteps).toHaveLength(1)
    expect(parsed.rawSteps[0].action).toEqual({ op: 'task.update', id: 't-0001', patch: { progress: 50 } })
    const validated = validatePlan(parsed.rawSteps, { taskIds: ['t-0001'] })
    expect(validated.steps).toHaveLength(1)
    expect(validated.rejected).toEqual([])
  })
})

describe('necessary-red: existing RA-AI06 terminal failure contract', () => {
  it('N01 error without text must not be diagnosed as a successful empty completion', async () => {
    const b: Behavior = { stop: 'error', errorMessage: 'isolated provider failure' }
    const r = await outcome({ first: b, second: b }, 'N01')
    expect(r.result.ok).toBe(false)
    if (!r.result.ok) {
      expect(r.result.name).toBe('AiDraftError')
      expect(r.result.message).not.toMatch(/未返回正文/)
      expect(r.result.message).not.toContain('isolated provider failure')
    }
  })

  it('N02 error after a parsable plan must reject that attempt; allowed fallback must be the returned result', async () => {
    const r = await outcome({ first: { stop: 'error', text: planText, errorMessage: 'isolated provider failure' },
      second: { text: healthy } }, 'N02')
    expect(r.result).toEqual({ ok: true, text: healthy })
    expect(r.calls.map(c => c.model)).toEqual(['first', 'second'])
  })

  it('N03 pi AUTH must not be disguised as EMPTY and retry a healthy candidate', async () => {
    const r = await outcome({ first: { stop: 'error', errorMessage: '401 isolated authentication failure' } }, 'N03')
    expect(r.result.ok).toBe(false)
    if (!r.result.ok) {
      expect(['AUTH', 'INVALID_CREDENTIAL']).toContain(r.result.code)
      expect(r.result.message).toMatch(/凭据|鉴权|密钥|Key/)
    }
    expect(r.prepare).toEqual(['first'])
  })

  it('N04 pi RATE_LIMIT must preserve the working hard-error path, without candidate retry', async () => {
    const r = await outcome({ first: { stop: 'error', errorMessage: '429 isolated rate limit' } }, 'N04')
    expect(r.result).toMatchObject({ ok: false, code: 'RATE_LIMIT' })
    expect(r.prepare).toEqual(['first'])
  })

  it('N05 real context capacity rejection must be recognized, not retried', async () => {
    const r = await outcome({ first: { stop: 'error',
      errorMessage: 'prompt is too long: 210000 tokens > 200000 maximum' } }, 'N05')
    expect(r.result.ok).toBe(false)
    if (!r.result.ok) {
      expect(['CONTEXT_WINDOW_EXCEEDED', 'CONTEXT_OVERFLOW']).toContain(r.result.code)
      expect(r.result.message).toMatch(/过长|精简|上下文/)
    }
    expect(r.prepare).toEqual(['first'])
  })

  it('N06 real exhausted quota must be recognized, not retried', async () => {
    const r = await outcome({ first: { stop: 'error', errorMessage: 'insufficient quota' } }, 'N06')
    expect(r.result.ok).toBe(false)
    if (!r.result.ok) {
      expect(['QUOTA', 'QUOTA_EXCEEDED']).toContain(r.result.code)
      expect(r.result.message).toMatch(/额度|配额|余额/)
    }
    expect(r.prepare).toEqual(['first'])
  })

  it('N07 terminal TIMEOUT must retain a Chinese timeout diagnosis after all candidates fail', async () => {
    const b: Behavior = { stop: 'error', errorMessage: 'request timeout' }
    const r = await outcome({ first: b, second: b }, 'N07')
    expect(r.result.ok).toBe(false)
    if (!r.result.ok) {
      expect(r.result.message).toMatch(/超时|中断/)
      expect(r.result.message).not.toMatch(/未返回正文|request timeout/)
    }
  })

  it.each(['', planText])('N08 terminal ABORTED with %j must not return success or start fallback', async text => {
    const r = await outcome({ first: { stop: 'aborted', text } }, text ? 'N08-partial' : 'N08-empty')
    expect(r.result.ok).toBe(false)
    expect(r.prepare).toEqual(['first'])
  })

  it('N09 HTTP404 pi fallback classification is PI_AI_ERROR, never a successful EMPTY diagnosis', async () => {
    const b: Behavior = { stop: 'error', errorMessage: '404 (no body)' }
    expect((await protocol(b)).finish).toMatchObject({ kind: 'error', failure: { code: 'PI_AI_ERROR' } })
    const r = await outcome({ first: b, second: b }, 'N09')
    expect(r.result.ok).toBe(false)
    if (!r.result.ok) expect(r.result.message).not.toMatch(/未返回正文|404 \(no body\)/)
  })
})
