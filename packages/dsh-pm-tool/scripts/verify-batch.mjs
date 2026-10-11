/**
 * T2-B 批量操作专项：批量更新状态/进度/负责人；批量级联删除 dry-run 列总数、缺 confirm 不落盘、
 * confirm 删整棵且保留旁支、重启读回。
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
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-batch-'))

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw) {
  return command.handler({ rawInput: raw, attachments: [] })
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  if (reopening) {
    const tasks = [...domain.table('tasks').entries()].map(([, t]) => t)
    // 应只剩旁支 t-0004
    assert.equal(tasks.length, 1, '读回应只剩旁支 1 个任务')
    assert.equal(tasks[0].title, '旁支保留')
    console.log('通过：批量删除重启读回，旁支保留。')
    process.exit(0)
  }

  await run('project add {"name":"批量","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  await run('task add {"projectId":"p-0001","title":"父A"}')
  await run('task add {"projectId":"p-0001","title":"子A1","parentId":"t-0001"}')
  await run('task add {"projectId":"p-0001","title":"旁支保留"}')

  // 批量更新
  const up = await run('task batch update t-0001,t-0002 {"status":"done"}')
  assert.match(up.text, /成功 2 个/)
  assert.equal(domain.table('tasks').get('t-0001').status, 'done')

  // 批量删除 dry-run（含后代）
  const before = [...domain.table('tasks').entries()].length
  const dry = await run('task batch delete t-0001')
  assert.match(dry.text, /共 2 个/) // t-0001 及其子 t-0002
  assert.equal([...domain.table('tasks').entries()].length, before, 'dry-run 不落盘')

  // confirm 批量级联删除
  await run('task batch delete t-0001 confirm')
  const after = [...domain.table('tasks').entries()].map(([, t]) => t)
  assert.equal(after.length, 1, '删整棵后只剩旁支')
  assert.equal(after[0].title, '旁支保留')

  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], { stdio: 'inherit' })
  assert.equal(child.status, 0)
  console.log('verify-batch 全部通过。')
} finally {
  await facility.closeAll()
}
