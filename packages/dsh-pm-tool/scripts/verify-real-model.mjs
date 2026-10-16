/**
 * 真实调用验证（非 mock）。自动识别 Key 类型，验证真实网络下的模型行为：
 *
 *  - DeepSeek 官方 Key（platform.deepseek.com）：直连 anthropic-messages 端点，验证
 *      ① 副驾 high 产生思考块 + 可解析 JSON；② 相同前缀第二次命中缓存；③ WBS off 无思考块。
 *  - OpenRouter Key（sk-or-v1，当前 POC）：走 openai-completions 端点 openrouter/free，验证
 *      真实链路下副驾 JSON 可靠、WBS 清单可生成（思考档/缓存为官方端点特性，此路径不适用）。
 *
 * Key 从 ~/.dsh/.credentials.yaml 读取，绝不打印、不入库。
 * 运行：node scripts/verify-real-model.mjs
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'

const credPath = path.join(os.homedir(), '.dsh/.credentials.yaml')
const raw = fs.readFileSync(credPath, 'utf8')
const readKey = n => new RegExp(n + ':\\s*([^\\s]+)').exec(raw)?.[1]
const dsKey = readKey('DEEPSEEK_API_KEY')
const orKey = readKey('OPENROUTER_API_KEY')

// ---- 场景文案（与真实系统一致）----
const COPILOT_SYSTEM = [
  '你是资深项目经理副驾。基于项目数据回答，并在最后输出一个严格 JSON 的行动计划。',
  'JSON 格式：{"summary":"一句话结论","actions":[{"type":"task|milestone|note","title":"...","detail":"..."}]}。',
].join('\n')
const COPILOT_USER = '项目：官网改版，开始 2026-10-08，目标 2026-11-30。今天 2026-10-17。'
  + '任务：设计稿（逾期）、前端开发（进行中）、测试（未开始）。请诊断并给计划。'
const WBS_USER = '请把「做一个移动端打卡小程序」拆解为 WBS 清单。'
const WBS_SYSTEM = '你是 WBS 拆解助手。把目标拆解为 Markdown 勾选清单，只输出清单，不要解释。'

function extractPlan(text) {
  const m = /\{[\s\S]*"actions"[\s\S]*\}/.exec(text)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

// ============ 路径 A：DeepSeek 官方 Key ============
async function verifyOfficial(key) {
  const URL_ = 'https://api.deepseek.com/anthropic/v1/messages'
  const headers = {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  }
  async function call({ effort, system, user, maxTokens }) {
    const body = {
      model: 'deepseek-flash', stream: false, max_tokens: maxTokens, system,
      messages: [{ role: 'user', content: user }],
      thinking: { type: effort === 'off' ? 'disabled' : 'enabled' },
      ...(effort === 'off' ? {} : { output_config: { effort } }),
    }
    const res = await fetch(URL_, { method: 'POST', headers, body: JSON.stringify(body) })
    const json = await res.json()
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 300)}`)
    return json
  }
  const types = d => (d.content ?? []).map(b => b.type)
  const text = d => (d.content ?? []).filter(b => b.type === 'text').map(b => b.text).join('').trim()

  // ① 副驾 high
  const c1 = await call({ effort: 'high', system: COPILOT_SYSTEM, user: COPILOT_USER, maxTokens: 4000 })
  console.log('[副驾 high] content 类型:', types(c1))
  console.log('[副驾 high] usage:', JSON.stringify(c1.usage))
  assert.ok(types(c1).some(t => /thinking|reasoning/.test(t)), 'high 必须产生思考块')
  const plan = extractPlan(text(c1))
  assert.ok(plan && Array.isArray(plan.actions) && plan.actions.length > 0, '副驾须输出可解析 JSON 计划')
  console.log('[副驾 high] actions 数量:', plan.actions.length, '；summary:', plan.summary)

  // ② 缓存命中
  const c2 = await call({ effort: 'high', system: COPILOT_SYSTEM, user: COPILOT_USER, maxTokens: 4000 })
  const cache1 = c1.usage?.cache_read_input_tokens ?? 0
  const cache2 = c2.usage?.cache_read_input_tokens ?? 0
  console.log(`[缓存] 第一次 cache_read=${cache1}，第二次=${cache2}`)
  assert.ok(cache2 > cache1, '第二次相同前缀应命中缓存')

  // ③ WBS off
  const w = await call({ effort: 'off', system: WBS_SYSTEM, user: WBS_USER, maxTokens: 8192 })
  console.log('[WBS off] content 类型:', types(w))
  assert.ok(!types(w).some(t => /thinking|reasoning/.test(t)), 'off 不得产生思考块')
  assert.ok(/- \[ \]/.test(text(w)), 'WBS 须为勾选清单')
  console.log('verify-real-model[官方] PASS（high 思考+JSON / 缓存命中 / off 无思考）')
}

// ============ 路径 B：OpenRouter（POC 免费链路）============
async function verifyOpenRouter(key) {
  const URL_ = 'https://openrouter.ai/api/v1/chat/completions'
  const headers = {
    Authorization: `Bearer ${key}`,
    'content-type': 'application/json',
    'HTTP-Referer': 'http://127.0.0.1:5199',
    'X-Title': 'dsh-pm-tool',
  }
  async function call({ system, user, maxTokens }) {
    const body = {
      model: 'openrouter/free',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }
    const res = await fetch(URL_, { method: 'POST', headers, body: JSON.stringify(body) })
    const json = await res.json()
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 300)}`)
    return json
  }
  const text = d => (d.choices ?? []).map(c => c.message?.content ?? '').join('').trim()

  // 副驾 JSON
  const c = await call({ system: COPILOT_SYSTEM, user: COPILOT_USER, maxTokens: 4000 })
  console.log('[副驾·POC] usage:', JSON.stringify(c.usage))
  const plan = extractPlan(text(c))
  assert.ok(plan && Array.isArray(plan.actions) && plan.actions.length > 0, 'POC 副驾须输出可解析 JSON 计划')
  console.log('[副驾·POC] actions 数量:', plan.actions.length, '；summary:', plan.summary)

  // WBS 清单
  const w = await call({ system: WBS_SYSTEM, user: WBS_USER, maxTokens: 8192 })
  assert.ok(/- \[ \]/.test(text(w)), 'POC WBS 须为勾选清单')
  console.log('[WBS·POC] 清单前 3 行:\n' + text(w).split('\n').slice(0, 3).join('\n'))
  console.log('verify-real-model[OpenRouter/POC] PASS（真实链路 JSON 可靠 + WBS 可生成）')
  console.log('注：思考档（high/off）与 Prompt Caching 为 DeepSeek 官方端点特性；配官方 Key 后可验证完整三档。')
}

try {
  // 官方 DeepSeek key 形如 sk- 且非 sk-or；OpenRouter key 为 sk-or-v1。
  if (dsKey && !dsKey.startsWith('sk-or')) {
    console.log('检测到 DeepSeek 官方 Key，验证完整三档路由。\n')
    await verifyOfficial(dsKey)
  } else if (orKey) {
    console.log('未检测到 DeepSeek 官方 Key；当前为 OpenRouter Key（POC），验证真实免费链路。\n')
    await verifyOpenRouter(orKey)
  } else {
    console.error('未找到任何可用 Key，跳过真实调用验证。')
    process.exit(1)
  }
} catch (error) {
  console.error('verify-real-model 失败：', error)
  process.exit(1)
}
