/**
 * R17 会议行动项转任务专项验证：dry-run 不落盘、confirm 创建任务字段正确且回写 taskId、重复 promote 幂等、重启读回。
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
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-promote-'))

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw, expected = 'success') {
  const result = await command.handler({ rawInput: raw, attachments: [] })
  assert.equal(result.kind, expected, `${raw}：${result.text}`)
  return result.text
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  if (reopening) {
    const meeting = domain.table('meetings').get('mtg-0001')
    const action = meeting.actions[0]
    const task = domain.table('tasks').get(action.taskId)
    assert.ok(action.taskId, '行动项应已回写 taskId')
    assert.ok(task && task.title === '出具设计稿初稿' && task.assignee === '张三' && task.dueDate === '2026-10-15', '读回任务字段正确')
    console.log('通过：重启读回，任务已创建且行动项回写关联。')
    process.exit(0)
  }

  await run('project add {"name":"转任务项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  await run('meeting add {"projectId":"p-0001","title":"周会","meetingDate":"2026-10-11"}')
  await run('meeting action add mtg-0001 {"title":"出具设计稿初稿","owner":"张三","dueDate":"2026-10-15"}')

  // 1) dry-run 不落盘
  const before = [...domain.table('tasks').entries()].length
  await run('meeting action promote mtg-0001 ai-001')
  assert.equal([...domain.table('tasks').entries()].length, before, 'dry-run 不得写盘')
  assert.ok(!domain.table('meetings').get('mtg-0001').actions[0].taskId, 'dry-run 不得回写')

  // 2) confirm 创建任务并回写
  await run('meeting action promote mtg-0001 ai-001 confirm')
  const after = [...domain.table('tasks').entries()].map(([, t]) => t)
  assert.equal(after.length, 1)
  assert.equal(after[0].title, '出具设计稿初稿')
  assert.equal(after[0].assignee, '张三')
  assert.equal(after[0].dueDate, '2026-10-15')
  assert.equal(domain.table('meetings').get('mtg-0001').actions[0].taskId, after[0].id)

  // 3) 幂等：再次 promote 不重复创建
  await run('meeting action promote mtg-0001 ai-001 confirm')
  assert.equal([...domain.table('tasks').entries()].length, 1, '幂等不得重复创建')

  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], { stdio: 'inherit' })
  assert.equal(child.status, 0, '重启读回应通过')
  console.log('verify-promote 全部通过。')
} finally {
  await facility.closeAll()
}
