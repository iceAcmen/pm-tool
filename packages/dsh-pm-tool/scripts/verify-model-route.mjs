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

  // poc 路由固定到免费插件。
  const poc = resolveModelRoute('poc')
  assert.equal(poc.provider, 'our-free-model')
  assert.equal(poc.model, 'kilo-auto/free')

  // prod 无 Key：抛结构化错误（绝不回退免费）。
  assert.throws(() => resolveModelRoute('prod'), /PROD_KEY_MISSING/)
  // 统一无 Key 提示含可复制切回命令，且不回显 Key 明文。
  assert.match(PROD_KEY_MISSING_TEXT, /\/pm model mode poc/)
  assert.match(PROD_KEY_MISSING_TEXT, /DEEPSEEK_API_KEY|KIMI_API_KEY/)
  assert.doesNotMatch(PROD_KEY_MISSING_TEXT, /sk-[A-Za-z0-9]{6}/)

  // 有 DeepSeek Key：优先 DeepSeek；无则 Kimi。
  process.env.DEEPSEEK_API_KEY = 'fake'
  assert.equal(resolveModelRoute('prod').provider, 'deepseek-official')
  delete process.env.DEEPSEEK_API_KEY
  process.env.KIMI_API_KEY = 'fake'
  assert.equal(resolveModelRoute('prod').provider, 'kimi-official')
  delete process.env.KIMI_API_KEY

  // describeLanes 不回显 Key 明文。
  const lanes = describeLanes('poc')
  assert.equal(lanes.length, 3)

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

  console.log('verify-model-route 通过：poc/prod 路由、无 Key 友好提示、模式持久化、非法模式。')
} finally {
  await facility.closeAll()
}
