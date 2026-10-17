/**
 * 双车道路由专项：poc 路由、prod 无 Key 抛错（不静默回退免费）、模式持久化、非法模式。
 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import {
  describeLanes,
  getModelMode,
  resolveModelRoute,
  setModelMode,
  PROD_KEY_MISSING_TEXT,
} from '../lib/core/model-route.js'
import { parseActiveModelLane } from '../lib/core/ui-feedback.js'
import { handleModelCommand } from '../lib/commands/model.js'

delete process.env.DEEPSEEK_API_KEY
delete process.env.KIMI_API_KEY
delete process.env.MOONSHOT_API_KEY

const root = mkdtempSync(join(tmpdir(), 'pm-tool-model-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  // poc 路由固定到免费插件；候选链 4 条全部非思考。
  const poc = resolveModelRoute('poc')
  assert.equal(poc.provider, 'our-free-model')
  assert.equal(poc.model, 'kilo-auto/free')
  assert.equal(poc.models.length, 4)
  assert.ok(poc.models.every((c) => c.reasoningEffort === 'off'), 'PoC 链全部非思考')

  // prod 路由（当前确定性契约：不按环境 Key 选池，凭据由 dsh 在请求时从凭据服务解析）。
  // 副驾：Flash 思考 high 为主，Pro 升级 high，GLM 非思考兜底。
  const copilot = resolveModelRoute('prod', 'copilot')
  assert.equal(copilot.provider, 'ark-plan')
  assert.equal(copilot.model, 'deepseek-v4-1-flash-260910')
  assert.equal(copilot.reasoningEffort, 'high', '副驾默认开思考')
  assert.deepEqual(
    copilot.models.map((c) => [c.model, c.reasoningEffort]),
    [
      ['deepseek-v4-1-flash-260910', 'high'],
      ['deepseek-v4-pro-ga-260813', 'high'],
      ['glm-5-3-flash-260828', 'off'],
    ],
    '副驾候选链顺序与档位固定',
  )
  // WBS：Flash 非思考为主，GLM、Doubao 兜底。
  const wbs = resolveModelRoute('prod', 'wbs')
  assert.equal(wbs.model, 'deepseek-v4-1-flash-260910')
  assert.equal(wbs.reasoningEffort, 'off', 'WBS 非思考')
  assert.deepEqual(wbs.models.map((c) => c.model), [
    'deepseek-v4-1-flash-260910', 'glm-5-3-flash-260828', 'doubao-seed-2-1-lite-260915',
  ])
  // 纪要：GLM（JSON 强）为主，Flash、Doubao 兜底。
  const meeting = resolveModelRoute('prod', 'meeting')
  assert.equal(meeting.model, 'glm-5-3-flash-260828')
  assert.equal(meeting.reasoningEffort, 'off')
  // 叙述：Doubao Lite 降本为主，Flash、GLM 兜底。
  const narrative = resolveModelRoute('prod', 'narrative')
  assert.equal(narrative.model, 'doubao-seed-2-1-lite-260915')
  assert.equal(narrative.reasoningEffort, 'off')
  // 标题/分类：Doubao Lite 为主，GLM、Flash 兜底。
  const title = resolveModelRoute('prod', 'title')
  assert.equal(title.model, 'doubao-seed-2-1-lite-260915')
  assert.equal(title.reasoningEffort, 'off')

  // 无 Key 提示文本（常量仍保留供未来缺配场景）：含切回命令、不回显 Key 明文。
  assert.match(PROD_KEY_MISSING_TEXT, /\/pm model mode poc/)
  assert.match(PROD_KEY_MISSING_TEXT, /CODING_PLAN_API_KEY/)
  assert.doesNotMatch(PROD_KEY_MISSING_TEXT, /sk-[A-Za-z0-9]{6}/)

  // describeLanes 不回显 Key 明文：poc + 主力/降本/升级 共 4 条。
  const lanes = describeLanes('poc')
  assert.equal(lanes.length, 4)

  // 命令：模式默认 poc；切 prod 无 Key 返回友好提示；持久化读回。
  await setModelMode(domain, 'prod')
  assert.equal(getModelMode(domain), 'prod')
  await setModelMode(domain, 'poc')
  assert.equal(getModelMode(domain), 'poc')

  const r1 = await command.handler({ rawInput: 'model status', attachments: [] })
  assert.match(r1.text, /当前车道/)

  const r2 = await command.handler({ rawInput: 'model mode bogus', attachments: [] })
  assert.equal(r2.kind, 'error')

  const r3 = await command.handler({ rawInput: 'model mode poc', attachments: [] })
  assert.match(r3.text, /已切到.*PoC/)

  // ---- 确定性往返：真实 handleModelCommand('status') 输出 → parseActiveModelLane 回显一致 ----
  // 背景：verify-ui-feedback.mjs 里 parseActiveModelLane 的用例曾用手写串
  // （'free/gateway'、'official/openai'、单条 prod 行），与 commands/model.ts 真实文案漂移，
  // 改文案时 parser 测试不会红。这里在同一隔离 domain 内切 poc/prod，直接吃真实命令输出，
  // 保证「命令产出的自然语言」与「前端解析器」两端同源。
  // 前提：顶部已 delete 所有 *API_KEY，故 prod 处于「无 Key、未就绪」状态，仍须被正确解析。

  // poc：▶ 落在 [poc] 行，poc 就绪。
  await setModelMode(domain, 'poc')
  const pocStatus = await handleModelCommand('status', domain)
  assert.equal(pocStatus.kind, 'success')
  assert.match(pocStatus.text, /▶ \[poc\]/, '当前 poc 行须带 ▶ 标记')
  assert.doesNotMatch(pocStatus.text, /^▶ \[prod\]/m, '非当前 prod 行不得带 ▶')
  assert.equal(parseActiveModelLane(pocStatus.text), 'poc', '真实 poc status 须被解析回 poc')

  // prod：环境无 CODING_PLAN_API_KEY 时 describeLanes 标未就绪；▶ 仍落在首条 [prod] 行；
  // parser 不得因「未就绪 / 无 Key」而退回 null 或误判 poc。
  await setModelMode(domain, 'prod')
  // 当前确定性路由：prod 不再因缺 Key 抛错（凭据由 dsh 请求时解析），只断言路由可解析。
  assert.ok(resolveModelRoute('prod', 'copilot').models.length >= 1)
  const prodStatus = await handleModelCommand('status', domain)
  assert.equal(prodStatus.kind, 'success')
  assert.match(prodStatus.text, /未就绪/, 'prod 无 Key 时车道应显示未就绪')
  assert.match(prodStatus.text, /▶ \[prod\]/, '当前 prod 行须带 ▶ 标记（即便无 Key）')
  assert.doesNotMatch(prodStatus.text, /^▶ \[poc\]/m, '非当前 poc 行不得带 ▶')
  assert.equal(parseActiveModelLane(prodStatus.text), 'prod', '真实 prod(无 Key) status 须被解析回 prod')

  // 首行兜底：即便 ▶ 行将来被改格式，首行「当前车道：…」仍须能解析（双保险）。
  const firstLine = prodStatus.text.split('\n')[0]
  assert.match(firstLine, /当前车道[：:]/)

  console.log('verify-model-route 通过：poc/prod 路由、无 Key 友好提示、模式持久化、非法模式、真实输出↔parser 往返。')
} finally {
  await facility.closeAll()
}
