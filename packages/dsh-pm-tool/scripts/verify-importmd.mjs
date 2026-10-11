/**
 * T2-A 可编辑 WBS 预览落盘专项：编辑后的 Markdown（改过/增删行）经 task importmd 落盘，
 * 编号/父子正确、不触发模型；dry-run 不落盘；坏 JSON 报错。
 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-importmd-'))

// 模拟用户编辑后的清单：改过文字、增删了子任务、勾选了完成项
const MARKDOWN = [
  '- [ ] 需求梳理（已改名）',
  '  - [x] 已完成的子任务',
  '  - [ ] 新增的子任务',
  '- [ ] 视觉设计',
].join('\n')

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw) {
  const r = await command.handler({ rawInput: raw, attachments: [] })
  return r
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  if (reopening) {
    const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
    assert.equal(tasks.length, 4, '读回应为编辑后的 4 个任务')
    const root1 = tasks.find(t => t.title === '需求梳理（已改名）')
    assert.ok(root1, '应含改名后的根任务')
    const child = tasks.find(t => t.parentId === root1.id)
    assert.ok(child, '应有子任务')
    assert.equal(tasks.filter(t => t.progress === 100).length, 1, '勾选完成项应 progress=100')
    console.log('通过：importmd 重启读回，编辑后清单父子/勾选正确。')
    process.exit(0)
  }

  await run('project add {"name":"编辑落盘","startDate":"2026-01-01","targetDate":"2026-12-31"}')

  // 坏 JSON 报错
  const bad = await run('task importmd p-0001 not-a-json confirm')
  assert.equal(bad.kind, 'error')

  // dry-run 不落盘
  const before = [...domain.table('tasks').entries()].length
  const dry = await run(`task importmd p-0001 ${JSON.stringify(MARKDOWN)}`)
  assert.match(dry.text, /已解析编辑后的清单/)
  assert.equal([...domain.table('tasks').entries()].length, before, 'dry-run 不落盘')

  // confirm 落盘（无模型）
  await run(`task importmd p-0001 ${JSON.stringify(MARKDOWN)} confirm`)
  const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
  assert.equal(tasks.length, 4)

  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], { stdio: 'inherit' })
  assert.equal(child.status, 0)
  console.log('verify-importmd 全部通过。')
} finally {
  await facility.closeAll()
}
