/**
 * A2 专项验证：任务级联删除（dry-run / 缺 cascade 拒绝 / cascade 删整棵不动旁支 / 重启读回）。
 * 使用独立临时目录；含全新子进程重启读回。
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
import { listTasks } from '../lib/core/tasks.js'

delete process.env.DEEPSEEK_API_KEY

const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-cascade-'))

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
    const tasks = listTasks(domain, 'p-0001')
    const codes = new Set(tasks.map(t => t.code))
    // 级联删掉了 1/1.1/1.2 整棵；旁支 2/2.1 仍在。
    assert.ok(!codes.has('1') && !codes.has('1.1') && !codes.has('1.2'), '根及其后代应已被删')
    assert.ok(codes.has('2') && codes.has('2.1'), '旁支 2/2.1 应保留')
    console.log('通过：重启读回，级联删除的子树已消失、旁支完好。')
    process.exit(0)
  }

  await run('project add {"name":"级联删除项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  // 树：1(根) -> 1.1, 1.2；旁支 2 -> 2.1
  await run('task add {"projectId":"p-0001","title":"根任务"}')
  await run('task add {"projectId":"p-0001","title":"子任务A","parentId":"t-0001"}')
  await run('task add {"projectId":"p-0001","title":"子任务B","parentId":"t-0001"}')
  await run('task add {"projectId":"p-0001","title":"旁支根","parentId":null}')
  await run('task add {"projectId":"p-0001","title":"旁支子","parentId":"t-0004"}')

  // 1) dry-run：列出整棵子树，不落盘
  const preview = await run('task delete t-0001')
  assert.match(preview, /含 2 个子任务/)
  assert.match(preview, /1.2｜t-0003/, 'dry-run 应列出后代')
  assert.equal(listTasks(domain, 'p-0001').length, 5, 'dry-run 不得写盘')

  // 2) 缺 cascade：confirm 仍拒绝
  const refused = await run('task delete t-0001 confirm', 'error')
  assert.match(refused, /仍有子任务|cascade/, '应拒绝并引导 cascade')
  assert.equal(listTasks(domain, 'p-0001').length, 5, '被拒绝时不得写盘')

  // 3) cascade confirm：删整棵 1/1.1/1.2，旁支 2/2.1 保留
  const done = await run('task delete t-0001 cascade confirm')
  assert.match(done, /已级联删除 3 个任务/)
  const after = listTasks(domain, 'p-0001')
  assert.equal(after.length, 2, '应仅剩旁支 2 个')
  const codes = after.map(t => t.code).sort()
  assert.deepEqual(codes, ['2', '2.1'].sort(), '旁支 2/2.1 完好')

  // 重启读回
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], { stdio: 'inherit' })
  assert.equal(child.status, 0, '重启读回应通过')
  console.log('verify-cascade 全部通过。')
} catch (error) {
  console.error('verify-cascade 失败：', error)
  process.exit(1)
}
