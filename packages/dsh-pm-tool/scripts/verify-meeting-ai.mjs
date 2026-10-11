/**
 * R15 专项验证：会议纪要 AI 归纳（mock LLM，不发真实请求）。
 *  1) summarize 预览：解析 JSON 草稿（议题/结论/行动项），不落盘；
 *  2) summarize confirm：建 draft 会议并逐条挂行动项；
 *  3) 模型返回非 JSON → 优雅降级（BAD_JSON），不写盘。
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
import { listMeetings } from '../lib/core/meetings.js'

delete process.env.DEEPSEEK_API_KEY

const JSON_DRAFT = '```json\n' + JSON.stringify({
  title: '项目周会',
  summary: '确认本周发布范围与验收时间',
  topics: ['发布范围', '验收标准'],
  decisions: ['按期发布 1.0'],
  actions: [{ title: '完成验收清单', owner: 'Ice', dueDate: '2026-10-20' }],
}) + '\n```'

function makeLlm(text) {
  return {
    prepareCall: async () => ({
      config: {},
      stream: async function* stream() {
        yield { type: 'text-delta', index: 0, text }
        yield { type: 'finish', reason: { kind: 'stop' } }
      },
    }),
  }
}

async function build(llm) {
  const root = mkdtempSync(join(tmpdir(), 'pm-tool-meeting-ai-'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.provide('storageDomain', facility)
  ctx.provide('llm', llm)
  let command
  ctx.provide('commands', { register(d) { command = d; return () => {} } })
  await apply(ctx)
  return { domain: facility.get('pmtool'), run: (raw) => command.handler({ rawInput: raw, attachments: [] }) }
}

const transcript = '今天讨论了发布范围和验收时间 决定按期发 1.0'

try {
  {
    const { domain, run } = await build(makeLlm(JSON_DRAFT))
    await run('project add {"name":"纪要项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')

    const preview = await run(`meeting summarize p-0001 ${transcript}`)
    assert.equal(preview.kind, 'success', `预览应成功：${preview.text}`)
    assert.match(preview.text, /AI 归纳草稿/)
    assert.match(preview.text, /标题：项目周会/)
    assert.match(preview.text, /完成验收清单｜负责人 Ice｜截止 2026-10-20/)
    assert.equal(listMeetings(domain, 'p-0001').length, 0, '预览不得写盘')

    const confirmed = await run(`meeting summarize p-0001 ${transcript} confirm`)
    assert.equal(confirmed.kind, 'success', `confirm 应成功：${confirmed.text}`)
    assert.match(confirmed.text, /已按 AI 草稿创建 draft 会议纪要/)
    const meetings = listMeetings(domain, 'p-0001')
    assert.equal(meetings.length, 1, 'confirm 应建 1 条会议')
    assert.equal(meetings[0].title, '项目周会')
    assert.equal(meetings[0].status, 'draft')
    assert.equal(meetings[0].actions.length, 1, '应挂 1 个行动项')
    assert.equal(meetings[0].actions[0].owner, 'Ice')
    console.log('通过：summarize 预览不落盘，confirm 建 draft 会议并挂行动项。')
  }

  {
    const { domain, run } = await build(makeLlm('模型只会说：今天聊了很多，没给 JSON。'))
    await run('project add {"name":"坏JSON项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
    const r = await run(`meeting summarize p-0001 ${transcript}`)
    assert.equal(r.kind, 'error', '非 JSON 应返回 error')
    assert.match(r.text, /AI 纪要归纳暂不可用|JSON/, `应给降级提示：${r.text}`)
    assert.equal(listMeetings(domain, 'p-0001').length, 0, '解析失败时不得写盘')
    console.log('通过：模型返回非 JSON 时优雅降级，未建会议。')
  }

  console.log('R15 verify-meeting-ai 全部通过。')
} catch (error) {
  console.error('verify-meeting-ai 失败：', error)
  process.exit(1)
}
