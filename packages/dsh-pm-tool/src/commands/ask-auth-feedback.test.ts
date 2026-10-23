import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, { LlmAdapter, LlmError, type StreamChunk } from '@deepseek-ai/dsh-llm'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { describe, expect, it } from 'vitest'
import { AiDraftError, generateDraft } from '../core/ai-client.js'
import { openPmDomain, pmDomainSpec, type PmDomain } from '../core/storage.js'
import { addProject, enqueueDomainWrite } from '../core/projects.js'
import { addTask } from '../core/tasks.js'
import { resolveModelRoute, setModelMode } from '../core/model-route.js'
import { handleAskCommand } from './ask.js'

// The isolated runner supplies an unchanged upstream copy, not a replacement classifier.
const piStreamPath = process.env.ASK_AUTH_PI_STREAM ?? fileURLToPath(new URL(
  '../../../../../deepseek-harness/packages/llm/llm-pi-ai/src/stream.ts', import.meta.url,
))
const { toStreamChunks } = await import(/* @vite-ignore */ piStreamPath)
const healthy = '副驾正常恢复：这是只读回答，不修改项目。'
const route = resolveModelRoute('prod', 'copilot')
type Behavior = 'normal' | 'auth401' | 'auth403' | 'missing' | 'invalid' | 'rate'
const usage = {
  input: 1, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 2,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
}

async function* piEvents(behavior: Behavior, model: string) {
  const errorMessage = behavior === 'auth401' ? '401 isolated authentication failure'
    : behavior === 'auth403' ? '403 isolated authentication failure' : '429 isolated rate limit'
  const message = {
    role: 'assistant', content: behavior === 'normal' ? [{ type: 'text', text: healthy }] : [],
    api: 'anthropic-messages', provider: route.provider, model, usage,
    stopReason: behavior === 'normal' ? 'stop' : 'error', timestamp: 0,
    ...(behavior === 'normal' ? {} : { errorMessage }),
  }
  yield { type: 'start', partial: message }
  if (behavior === 'normal') {
    yield { type: 'text_start', contentIndex: 0, partial: message }
    yield { type: 'text_delta', contentIndex: 0, delta: healthy, partial: message }
    yield { type: 'text_end', contentIndex: 0, content: healthy, partial: message }
    yield { type: 'done', reason: 'stop', message }
  } else {
    yield { type: 'error', reason: 'error', error: message }
  }
}

class TerminalAdapter extends LlmAdapter {
  prepare: Array<{ provider: string, model: string }> = []
  calls: Array<{ provider: string, model: string, maxTokens?: number, reasoningEffort?: string, signal: boolean }> = []
  terminals: unknown[] = []
  constructor(public behavior: Behavior) { super() }
  override async resolveModel(provider: string, model: string) {
    this.prepare.push({ provider, model })
    if (this.behavior === 'missing' || this.behavior === 'invalid') {
      throw new LlmError('isolated credential resolution rejection',
        this.behavior === 'missing' ? 'MISSING_CREDENTIAL' : 'INVALID_CREDENTIAL')
    }
    return {
      provider, id: model, name: model,
      reasoning: { efforts: [{ id: 'off', name: 'Off' }, { id: 'high', name: 'High' }], defaultEffort: 'off' },
    }
  }
  async* stream(request: any): AsyncGenerator<StreamChunk> {
    this.calls.push({
      provider: request.provider, model: request.model, maxTokens: request.maxTokens,
      reasoningEffort: request.reasoningEffort, signal: request.signal instanceof AbortSignal,
    })
    for await (const chunk of toStreamChunks(piEvents(this.behavior, request.model), 200000,
      request.signal, request.model)) {
      if (chunk.type === 'finish') this.terminals.push(structuredClone(chunk.reason))
      yield chunk
    }
  }
}

function disk(root: string) {
  const result: Record<string, { bytes: number, sha256: string }> = {}
  const walk = (path: string) => {
    if (!existsSync(path)) return
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) walk(join(path, name))
    } else {
      const bytes = readFileSync(path)
      result[relative(root, path)] = {
        bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
      }
    }
  }
  walk(root)
  return result
}

function tables(domain: PmDomain) {
  return Object.fromEntries(Object.keys(pmDomainSpec.tables).map(name => [
    name, structuredClone([...(domain.table as any)(name).entries()]),
  ]))
}

async function outcome(id: string, behavior: Behavior, command: boolean) {
  const root = await mkdtemp(join(process.env.PM_GOVERNANCE_TMP ?? tmpdir(), 'ask-auth-case-'))
  const ctx = new Context()
  let facility: DomainFacility | undefined
  let record: any
  try {
    await ctx.plugin(Storage)
    ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
    facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
    ctx.provide('storageDomain', facility)
    const domain = await openPmDomain(ctx)
    const project = await addProject(domain, {
      name: '副驾鉴权反馈合法样本', startDate: '2026-01-01', targetDate: '2026-12-31',
    })
    const task = await addTask(domain, { projectId: project.id, title: '只读诊断不应改写的任务', progress: 24 })
    await setModelMode(domain, 'prod')
    await enqueueDomainWrite(domain, async () => {})
    await ctx.plugin(LlmRuntime)
    const adapter = new TerminalAdapter(behavior)
    ctx.llm.registerAdapter([route.provider], adapter)
    const before = { tables: tables(domain), disk: disk(join(root, 'data')) }
    let result: unknown
    if (command) {
      result = await handleAskCommand(`${project.id} 请只读诊断当前项目`, domain, ctx.llm)
    } else {
      try {
        result = { ok: true, text: await generateDraft(ctx.llm, {
          system: '只读生产链控制', user: '请只读回答', maxTokens: 4000, ...route,
        }) }
      } catch (error) {
        if (!(error instanceof AiDraftError)) throw error
        result = { ok: false, name: error.name, code: error.code, message: error.message }
      }
    }
    await enqueueDomainWrite(domain, async () => {})
    const after = { tables: tables(domain), disk: disk(join(root, 'data')) }
    const first = {
      prepare: structuredClone(adapter.prepare), calls: structuredClone(adapter.calls),
      terminals: structuredClone(adapter.terminals),
    }
    // A second real command on the same runtime establishes recovery, not a fabricated result.
    adapter.behavior = 'normal'
    const recovery = await handleAskCommand(`${project.id} 请只读确认恢复`, domain, ctx.llm)
    await enqueueDomainWrite(domain, async () => {})
    record = {
      id, behavior, command, root, projectId: project.id, taskId: task.id,
      result, first, recovery, afterRecovery: { tables: tables(domain), disk: disk(join(root, 'data')) },
      before, after, allPrepare: adapter.prepare, allCalls: adapter.calls,
      credentialsInEnvironment: !!process.env.CODING_PLAN_API_KEY, e2e: process.env.DSH_PM_E2E ?? null,
      fixture: 'real prod route + JSON domain + LlmRuntime + original pi toStreamChunks',
    }
  } finally {
    try { await facility?.closeAll() } finally { await ctx.fiber.dispose() }
    if (record) {
      record.disposed = true
      appendFileSync(process.env.ASK_AUTH_OBSERVATIONS ?? join(root, 'observations.ndjson'),
        `${JSON.stringify(record)}\n`)
    }
  }
  expect(record.credentialsInEnvironment).toBe(false)
  expect(record.e2e).not.toBe('1')
  expect(record.after).toEqual(record.before)
  expect(record.afterRecovery).toEqual(record.before)
  expect(record.recovery).toEqual({ kind: 'success', text: healthy })
  expect(record.first.prepare).toEqual([{ provider: route.provider, model: route.model }])
  expect(record.allPrepare).toHaveLength(2)
  if (behavior === 'missing' || behavior === 'invalid') {
    expect(record.first.calls).toEqual([])
    expect(record.first.terminals).toEqual([])
  } else {
    expect(record.first.calls).toHaveLength(1)
    expect(record.first.calls[0]).toMatchObject({ provider: route.provider, model: route.model, maxTokens: 4000, signal: true })
    expect(record.first.terminals).toEqual(behavior === 'normal' ? [{ kind: 'stop' }] : [{
      kind: 'error', failure: {
        code: behavior === 'rate' ? 'RATE_LIMIT' : 'AUTH',
        message: behavior === 'auth401' ? '401 isolated authentication failure'
          : behavior === 'auth403' ? '403 isolated authentication failure' : '429 isolated rate limit',
      },
    }])
  }
  return record
}

describe('controls: ask auth feedback production boundary', () => {
  it.each(['auth401', 'auth403'] as const)('C-%s production client keeps invalid credentials distinct from missing', async behavior => {
    const r = await outcome(`C-${behavior}`, behavior, false)
    expect(r.result).toMatchObject({ ok: false, name: 'AiDraftError', code: 'INVALID_CREDENTIAL' })
    expect(r.result.message).toMatch(/凭据无效|已失效/)
    expect(r.result.message).not.toMatch(/PROD_KEY_MISSING|未检测到|isolated/)
  })
  it('C-MISSING production prepareCall preserves genuine missing credentials', async () => {
    const r = await outcome('C-MISSING', 'missing', false)
    expect(r.result).toMatchObject({ ok: false, code: 'MISSING_CREDENTIAL' })
    expect(r.result.message).toMatch(/凭据缺失/)
    expect(r.result.message).not.toMatch(/凭据无效|已失效|isolated/)
  })
  it('C-RATE production terminal keeps Chinese rate-limit diagnosis', async () => {
    expect((await outcome('C-RATE', 'rate', false)).result)
      .toMatchObject({ ok: false, code: 'RATE_LIMIT', message: '模型服务限流，请稍后再试。' })
  })
  it('C-NORMAL production client returns the exact normal body', async () => {
    expect((await outcome('C-NORMAL', 'normal', false)).result).toEqual({ ok: true, text: healthy })
  })
  it('C-ASK-MISSING command retains genuine missing-credential guidance', async () => {
    const r = await outcome('C-ASK-MISSING', 'missing', true)
    expect(r.result.kind).toBe('error')
    expect(r.result.text).toMatch(/凭据缺失|未检测到/)
    expect(r.result.text).toContain('CODING_PLAN_API_KEY')
    expect(r.result.text).not.toMatch(/凭据无效|已失效|isolated/)
  })
  it('C-ASK-RATE command retains the real Chinese rate-limit diagnosis', async () => {
    const r = await outcome('C-ASK-RATE', 'rate', true)
    expect(r.result).toEqual({ kind: 'error', text: '副驾暂不可用：模型服务限流，请稍后再试。' })
  })
  it('C-ASK-NORMAL command returns the exact normal body', async () => {
    expect((await outcome('C-ASK-NORMAL', 'normal', true)).result).toEqual({ kind: 'success', text: healthy })
  })
})

describe('necessary-red: RA-AI06 command auth feedback', () => {
  it.each(['auth401', 'auth403', 'invalid'] as const)('R-%s command must not rewrite invalid credentials as missing', async behavior => {
    const r = await outcome(`R-${behavior}`, behavior, true)
    expect(r.result.kind).toBe('error')
    expect(r.result.text).toMatch(/凭据无效|已失效/)
    expect(r.result.text).not.toMatch(/PROD_KEY_MISSING|未检测到|凭据缺失|isolated/)
  })
})
