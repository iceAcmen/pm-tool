import assert from 'node:assert/strict'
import { generateDraft, AiDraftError } from '../lib/core/ai-client.js'

// 造一个可按模型行为返回的 mock gateway。
function chunkText(text) { return { type: 'text-delta', text } }
function mockGateway(behaviorByModel) {
  return {
    async prepareCall({ model }) {
      const b = behaviorByModel[model]
      return {
        config: {},
        async *stream() {
          if (b?.err) throw b.err
          for (const t of b?.chunks ?? []) yield chunkText(t)
        },
      }
    },
  }
}

// 记录 prepareCall 收到的 provider/model/maxTokens，用于断言兜底常量与显式透传。
function recordingGateway(behaviorByModel) {
  const calls = []
  return {
    calls,
    async prepareCall({ provider, model, maxTokens }) {
      calls.push({ provider, model, maxTokens })
      const b = behaviorByModel?.[model]
      return {
        config: {},
        async *stream() {
          if (b?.err) throw b.err
          for (const t of b?.chunks ?? []) yield chunkText(t)
        },
      }
    },
  }
}

// 1) 链上前两个空/error，第三个成功 -> 换模后成功。
{
  const g = mockGateway({
    'kilo-auto/free': { chunks: [], finish: false },           // 空正文
    'openrouter/free': { err: new Error('upstream boom') },  // 抛错
    'openrouter/free2': { chunks: ['- [ ] a\n', '- [ ] b'], finish: true },
  })
  const out = await generateDraft(g, { system: 's', user: 'u', models: ['kilo-auto/free', 'openrouter/free', 'openrouter/free2'] })
  assert.match(out, /^- \[ \] a/)
}

// 2) 链上全部失败 -> 抛 AiDraftError 中文且不含英文原文。
{
  const g = mockGateway({
    m1: { chunks: [], finish: false },
    m2: { chunks: [], finish: false },
  })
  await assert.rejects(
    () => generateDraft(g, { system: 's', user: 'u', models: ['m1', 'm2'] }),
    (e) => e instanceof AiDraftError && /免费池多次尝试/.test(e.message),
  )
}

// 3) 限流硬错误 -> 不换模、直接抛 RATE_LIMIT。
{
  const g = mockGateway({
    m1: { err: Object.assign(new Error('rate'), { code: 'RATE_LIMIT' }) },
    m2: { chunks: ['ok'], finish: true },
  })
  await assert.rejects(
    () => generateDraft(g, { system: 's', user: 'u', models: ['m1', 'm2'] }),
    (e) => e.code === 'RATE_LIMIT',
  )
}
// 4) 未显式 provider/model（匿名 PoC）：兜底必须解析到 our-free-model / kilo-auto/free（A4）。
{
  const g = recordingGateway({ 'kilo-auto/free': { chunks: ['ok'], finish: true } })
  let out
  try {
    out = await generateDraft(g, { system: 's', user: 'u' })
  } catch {
    // 兜底模型不是 kilo-auto/free 时会空响应；先把 prepareCall 配置记录下来再统一断言。
  }
  assert.ok(g.calls.length >= 1, 'prepareCall 至少被调用一次')
  assert.equal(g.calls[0].provider, 'our-free-model')
  assert.equal(g.calls[0].model, 'kilo-auto/free')
  assert.equal(out, 'ok')
}

// 5) 匿名 PoC 鉴权失败：中文文案不得错误要求 OPENROUTER_API_KEY（A4 / 错误文案统一）。
{
  const g = {
    async prepareCall() {
      throw Object.assign(new Error('denied'), { code: 'INVALID_CREDENTIAL' })
    },
  }
  await assert.rejects(
    () => generateDraft(g, { system: 's', user: 'u' }),
    (e) => {
      assert.ok(e instanceof AiDraftError)
      assert.equal(e.code, 'INVALID_CREDENTIAL')
      assert.doesNotMatch(e.message, /OPENROUTER_API_KEY/)
      return true
    },
  )
}

// 6) 显式 prod provider/model 必须原样透传，兜底常量不得污染（回归保护）。
{
  const g = recordingGateway({ 'deepseek-chat': { chunks: ['hi'], finish: true } })
  const out = await generateDraft(g, { system: 's', user: 'u', provider: 'deepseek-official', model: 'deepseek-chat' })
  assert.equal(out, 'hi')
  assert.equal(g.calls[0].provider, 'deepseek-official')
  assert.equal(g.calls[0].model, 'deepseek-chat')
}

// 7) 显式 prod provider 缺适配器：NO_ADAPTER 文案必须点名实际 attempted provider，不得误报 our-free-model。
{
  const g = {
    async prepareCall() { throw Object.assign(new Error('no adapter'), { code: 'NO_ADAPTER' }) },
  }
  await assert.rejects(
    () => generateDraft(g, { system: 's', user: 'u', provider: 'deepseek-official', model: 'deepseek-chat' }),
    (e) => {
      assert.ok(e instanceof AiDraftError)
      assert.equal(e.code, 'NO_ADAPTER')
      assert.match(e.message, /deepseek-official/)
      assert.doesNotMatch(e.message, /our-free-model/)
      return true
    },
  )
}

// 8) 默认（匿名 PoC）缺适配器：NO_ADAPTER 文案仍点名默认兜底 provider our-free-model。
{
  const g = {
    async prepareCall() { throw Object.assign(new Error('no adapter'), { code: 'NO_ADAPTER' }) },
  }
  await assert.rejects(
    () => generateDraft(g, { system: 's', user: 'u' }),
    (e) => {
      assert.ok(e instanceof AiDraftError)
      assert.equal(e.code, 'NO_ADAPTER')
      assert.match(e.message, /our-free-model/)
      return true
    },
  )
}

console.log('verify-ai-client: PASS (降级链换模 / 全失败中文 / 限流不换池 / 兜底默认 our-free-model·kilo-auto-free / 鉴权文案不指 OPENROUTER / 显式 prod 透传 / NO_ADAPTER 文案按实际 provider)')
