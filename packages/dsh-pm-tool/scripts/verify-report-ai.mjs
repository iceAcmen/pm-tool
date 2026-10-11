/**
 * R14 专项验证：进度汇报 AI 叙述（mock LLM，不发真实请求）。
 *  1) narrate 预览：AI 段落 + 确定性快照数字摘要，不落盘；
 *  2) narrate confirm：生成带 executiveSummary 的进度快照，confirm 复用草稿；
 *  3) 模型 QUOTA 失败 → 优雅降级，不写盘。
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
import { listProgressReports } from '../lib/core/progress-reports.js'

delete process.env.DEEPSEEK_API_KEY

const PROSE = '本周进展：完成原型设计。风险：联调可能延期。下周计划：启动开发。'

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
  const root = mkdtempSync(join(tmpdir(), 'pm-tool-report-ai-'))
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

async function seed(run) {
  await run('project add {"name":"汇报项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  await run('task add {"projectId":"p-0001","title":"原型设计","status":"done","progress":100}')
  await run('task add {"projectId":"p-0001","title":"联调","status":"in_progress","progress":30}')
}

try {
  {
    const { domain, run } = await build(makeLlm(PROSE))
    await seed(run)

    const preview = await run('report narrate p-0001')
    assert.equal(preview.kind, 'success', `预览应成功：${preview.text}`)
    assert.match(preview.text, /本周进展：完成原型设计/, '应输出 AI 叙述')
    assert.match(preview.text, /尚未写入/, '预览应声明未落盘')
    assert.equal(listProgressReports(domain, 'p-0001').length, 0, '预览不得写盘')

    const confirmed = await run('report narrate p-0001 confirm')
    assert.equal(confirmed.kind, 'success', `confirm 应成功：${confirmed.text}`)
    assert.match(confirmed.text, /executiveSummary 已写入/)
    const reports = listProgressReports(domain, 'p-0001')
    assert.equal(reports.length, 1, 'confirm 应生成 1 份快照')
    assert.equal(reports[0].executiveSummary, PROSE, '快照的 executiveSummary 应为 AI 叙述')
    assert.ok(reports[0].snapshot.tasks.total >= 2, '快照数字应来自确定性采集')
    console.log('通过：narrate 预览不落盘，confirm 生成带 AI 叙述的确定性快照。')
  }

  {
    const quotaErr = Object.assign(new Error('quota'), { code: 'QUOTA' })
    const { domain, run } = await build(makeLlm('', quotaErr))
    await seed(run)
    const r = await run('report narrate p-0001')
    assert.equal(r.kind, 'error', 'QUOTA 应返回 error')
    assert.match(r.text, /额度|AI 叙述暂不可用/, `应给降级提示：${r.text}`)
    assert.equal(listProgressReports(domain, 'p-0001').length, 0, '失败时不得写盘')
    console.log('通过：模型额度耗尽时优雅降级，未生成快照。')
  }

  console.log('R14 verify-report-ai 全部通过。')
} catch (error) {
  console.error('verify-report-ai 失败：', error)
  process.exit(1)
}
