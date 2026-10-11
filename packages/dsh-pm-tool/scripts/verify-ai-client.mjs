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
console.log('verify-ai-client: PASS (降级链换模 / 全失败中文 / 限流不换池)')
