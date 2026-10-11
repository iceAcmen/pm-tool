/**
 * R13 专项验证：智能 WBS 拆解（AI 草稿）。
 * 用 mock LLM 网关（不发真实网络请求）验证：
 *  1) 无 confirm：生成勾选清单草稿并 dry-run 预览（不落盘）；
 *  2) confirm：复用草稿落盘为 WBS 任务树（父子/编号正确），不再调模型；
 *  3) 模型抛 RATE_LIMIT / 返回空正文：优雅降级为中文提示，不写盘、不崩。
 * 使用独立临时目录，不污染真实业务数据。
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
import { listTasks } from '../lib/core/tasks.js'

delete process.env.DEEPSEEK_API_KEY

const WBS_SCRIPT = [
  '- [ ] 总体方案',
  '  - [ ] 调研竞品',
  '  - [ ] 输出交互原型',
  '- [ ] 排期计划',
].join('\n')

// 脚本化 mock：text=返回正文；throwError=prepareCall 抛出的错误。
function makeLlm(text, throwError) {
  return {
    prepareCall: async () => {
      if (throwError) throw throwError
      return {
        config: {},
        stream: async function* stream() {
          yield { type: 'text-delta', index: 0, text }
          yield { type: 'finish', reason: { kind: 'stop' } }
        },
      }
    },
  }
}

async function build(llm) {
  const root = mkdtempSync(join(tmpdir(), 'pm-tool-wbs-'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.provide('storageDomain', facility)
  ctx.provide('llm', llm)
  let command
  ctx.provide('commands', {
    register(definition) { command = definition; return () => {} },
  })
  await apply(ctx)
  return { domain: facility.get('pmtool'), run: (raw) => command.handler({ rawInput: raw, attachments: [] }) }
}

const goalArgs = '做 一个 打卡 小程序' // 预览与 confirm 用同一串，保证草稿缓存键命中

try {
  // ---- 路径 1+2：成功生成 → 预览不落盘 → confirm 落盘 ----
  {
    const { domain, run } = await build(makeLlm(WBS_SCRIPT))
    await run('project add {"name":"WBS 验证项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')

    const preview = await run(`task wbs p-0001 ${goalArgs}`)
    assert.equal(preview.kind, 'success', `预览应成功：${preview.text}`)
    assert.match(preview.text, /AI 拆解草稿/)
    assert.match(preview.text, /总体方案/)
    assert.match(preview.text, /1\.1.*调研竞品/)
    assert.match(preview.text, /当前未写入/)
    assert.equal(listTasks(domain, 'p-0001').length, 0, '预览阶段不得写盘')

    const confirmed = await run(`task wbs p-0001 ${goalArgs} confirm`)
    assert.equal(confirmed.kind, 'success', `confirm 应成功：${confirmed.text}`)
    assert.match(confirmed.text, /已按 AI 草稿创建 4 个任务/)
    const tasks = listTasks(domain, 'p-0001')
    assert.equal(tasks.length, 4, '应落盘 4 个任务')
    const byCode = new Map(tasks.map(t => [t.code, t]))
    assert.ok(byCode.has('1') && byCode.has('1.1') && byCode.has('2'), '应还原 WBS 父子编号')
    assert.equal(byCode.get('1.1').parentId, byCode.get('1').id, '1.1 的父任务应为 1')
    console.log('通过：AI 草稿 dry-run 预览不落盘，confirm 按草稿落盘为 WBS 任务树。')
  }

  // ---- 路径 3a：模型限流 → 优雅降级，不写盘 ----
  {
    const rateErr = Object.assign(new Error('rate limited'), { code: 'RATE_LIMIT' })
    const { domain, run } = await build(makeLlm('', rateErr))
    await run('project add {"name":"降级项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
    const r = await run(`task wbs p-0001 ${goalArgs}`)
    assert.equal(r.kind, 'error', '限流应返回 error')
    assert.match(r.text, /限流/, `应给中文降级提示：${r.text}`)
    assert.equal(listTasks(domain, 'p-0001').length, 0, '限流时不得写盘')
    console.log('通过：模型限流时优雅降级为中文提示，台账未被写入。')
  }

  // ---- 路径 3b：模型返回空正文（推理占满 max_tokens）→ 优雅降级 ----
  {
    const { domain, run } = await build(makeLlm('')) // 空正文
    await run('project add {"name":"空正文项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
    const r = await run(`task wbs p-0001 ${goalArgs}`)
    assert.equal(r.kind, 'error', '空正文应返回 error')
    assert.match(r.text, /AI 拆解暂不可用/, `应提示暂不可用：${r.text}`)
    assert.equal(listTasks(domain, 'p-0001').length, 0, '空正文时不得写盘')
    console.log('通过：空正文时优雅降级，台账未被写入。')
  }

  // ---- 路径 4：stream reject AbortError（免费池偶发超时/中断）→ 归一为中文 MODEL_TIMEOUT ----
  {
    const abortLlm = {
      prepareCall: async () => ({
        config: {},
        stream: async function* stream() {
          throw Object.assign(new Error('This operation was aborted'), { name: 'AbortError' })
        },
      }),
    }
    const { domain, run } = await build(abortLlm)
    await run('project add {"name":"超时项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
    const r = await run(`task wbs p-0001 ${goalArgs}`)
    assert.equal(r.kind, 'error', 'AbortError 应返回 error')
    assert.match(r.text, /超时或被中断|重试一次/, `应归一为中文超时提示：${r.text}`)
    assert.doesNotMatch(r.text, /aborted/, '不应把英文 abort 文案直抛到界面')
    assert.equal(listTasks(domain, 'p-0001').length, 0, '超时时不得写盘')
    console.log('通过：stream 超时/中断归一为中文 MODEL_TIMEOUT，台账未被写入。')
  }

  console.log('R13 verify-wbs 全部通过。')
} catch (error) {
  console.error('verify-wbs 失败：', error)
  process.exit(1)
}
