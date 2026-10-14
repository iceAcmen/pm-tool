/**
 * S4-A2 离线优先契约测试：llm 可选注入（真实 Cordis Context，非静态 grep）。
 *
 * 核 Cordis 4.0.5-alpha.1 真实语义：
 *   - inject 数组里每个名字都是「必需依赖」：fiber._refresh() 对 inject 逐项查 impl，
 *     任一缺失 -> epoch=INACTIVE -> apply 永不执行（即「插件加载失败」）。
 *   - 本版本无 `?` 可选后缀语法；可选服务的正确做法是「不列入 inject」，
 *     代码内用 ctx.reflect.get(name, false) 读取（缺失返回 undefined，不抛错）。
 *
 * 本脚本用真实 `new Context()` + 真实 storage 栈 + `ctx.plugin(pmPlugin)`（不是直接调 apply，
 * 那样会绕过 fiber/inject 激活语义），覆盖两个契约：
 *   A) 缺 llm 的 profile：插件仍激活、核心台账可用（project/task/milestone 命令可用），
 *      ask/生成能力返回明确中文 NO_LLM 降级，而不是插件压根没加载。
 *   B) 有 fake llm：ask 真实走 generateDraft 路径（prepareCall 收到 our-free-model/kilo-auto/free
 *      兜底路由），返回模型文本 —— 证明有 llm 路径不回归。
 *
 * 隔离约定同 verify-command.mjs：数据根为 os.tmpdir() 下一次性 mkdtemp，不写正式 data/。
 * 运行：先 pnpm run build，再 node scripts/verify-llm-optional.mjs
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'

const here = dirname(fileURLToPath(import.meta.url))

/** 装配一个带真实 storageDomain + commands 桩的 Cordis Context；不 provide llm。 */
async function assembleContext({ provideLlm }) {
  const dataRoot = mkdtempSync(join(tmpdir(), 'pm-tool-llm-opt-'))
  console.log(`[verify-llm-optional] 数据根（隔离）= ${dataRoot}${provideLlm ? '（带 fake llm）' : '（无 llm）'}`)

  const ctx = new Context()
  await ctx.plugin(Storage)
  const backend = new JsonStorageBackend(dataRoot)
  ctx.storage.backend.register('json', backend)
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })

  ctx.provide('storageDomain', facility)
  let captured
  ctx.provide('commands', {
    register(definition) {
      captured = definition
      return () => {}
    },
  })

  if (provideLlm) {
    // 记录每次 prepareCall 入参；对任意模型都回固定文本（契约：不真打网络）。
    const calls = []
    const fakeGateway = {
      calls,
      async prepareCall({ provider, model, maxTokens }) {
        calls.push({ provider, model, maxTokens })
        return {
          config: {},
          async *stream() {
            yield { type: 'text-delta', text: 'FAKE_LLM_ANSWER' }
          },
        }
      },
    }
    ctx.provide('llm', fakeGateway)
    return { ctx, facility, getCaptured: () => captured, fakeGateway }
  }
  return { ctx, facility, getCaptured: () => captured, fakeGateway: null }
}

const pmPlugin = await import('../lib/index.js')

// ===== 契约 A：缺 llm 的 profile，插件仍加载，核心台账可用，ask 返回中文 NO_LLM 降级 =====
{
  const { ctx, facility, getCaptured } = await assembleContext({ provideLlm: false })

  // 走真实 fiber 激活：inject 含 llm 且未 provide llm 时，fiber 停在 INACTIVE，apply 不执行。
  await ctx.plugin(pmPlugin)
  const captured = getCaptured()
  assert.ok(
    captured,
    '缺 llm 时插件必须仍被激活并注册 /pm 命令（inject 不得把 llm 列为必需依赖）',
  )

  const run = (rawInput) => captured.handler({ rawInput, attachments: [] })

  // 核心台账：project add / task list / milestone list 全部离线可用。
  const added = await run('project add {"name":"离线演示","startDate":"2026-10-14","targetDate":"2026-10-31"}')
  assert.equal(added.kind, 'success', `project add 应成功：${added.text}`)
  const idMatch = /项目 ID：(p-\d+)/.exec(added.text)
  assert.ok(idMatch, 'project add 输出应包含项目 ID')
  const projectId = idMatch[1]

  const taskList = await run(`task list ${projectId}`)
  assert.equal(taskList.kind, 'success', `task list 应可用：${taskList.text}`)

  const milestoneList = await run(`milestone list ${projectId}`)
  assert.equal(milestoneList.kind, 'success', `milestone list 应可用：${milestoneList.text}`)

  // ask/生成能力：不抛插件加载错，而是明确中文 NO_LLM 降级。
  const ask = await run(`ask ${projectId} "进度如何"`)
  assert.equal(ask.kind, 'error', '缺 llm 时 ask 应返回降级错误而非成功调模型')
  assert.match(
    ask.text,
    /未装载 LLM|AI 草稿不可用/,
    `ask 降级文案必须明确中文说明未装载 LLM，实际：${ask.text}`,
  )
  console.log('[契约A] 缺 llm：插件已加载；project/task/milestone 可用；ask 降级 =', ask.text)

  await facility.closeAll()
}

// ===== 契约 B：有 fake llm，ask 真实走 generateDraft 路径，不回归 =====
{
  const { ctx, facility, getCaptured, fakeGateway } = await assembleContext({ provideLlm: true })

  await ctx.plugin(pmPlugin)
  const captured = getCaptured()
  assert.ok(captured, '带 llm 时插件同样必须注册 /pm 命令')

  const run = (rawInput) => captured.handler({ rawInput, attachments: [] })

  const added = await run('project add {"name":"有模型演示","startDate":"2026-10-14","targetDate":"2026-10-31"}')
  assert.equal(added.kind, 'success', `project add 应成功：${added.text}`)
  const projectId = /项目 ID：(p-\d+)/.exec(added.text)[1]

  const ask = await run(`ask ${projectId} "进度如何"`)
  assert.equal(ask.kind, 'success', `带 llm 时 ask 应成功返回模型文本：${ask.text}`)
  assert.match(ask.text, /FAKE_LLM_ANSWER/, 'ask 返回文本必须来自 fake llm')

  // 兜底路由契约：未显式 provider/model 时必须解析到 our-free-model / kilo-auto/free。
  assert.ok(fakeGateway.calls.length >= 1, 'prepareCall 至少被调用一次')
  assert.equal(fakeGateway.calls[0].provider, 'our-free-model')
  assert.equal(fakeGateway.calls[0].model, 'kilo-auto/free')
  console.log('[契约B] 有 fake llm：ask 真实走 generateDraft；prepareCall 首调 =',
    JSON.stringify(fakeGateway.calls[0]))

  await facility.closeAll()
}

console.log('verify-llm-optional: PASS（缺 llm 仍加载核心台账+ask 中文 NO_LLM 降级 / 有 fake llm ask 真实走 generateDraft 不回归）')
