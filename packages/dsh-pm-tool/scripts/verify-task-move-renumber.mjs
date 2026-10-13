/**
 * PROD-04：move + renumber 复合原子动作专项。独立系统临时目录，不污染正式数据。
 * 校验：--renumber 移动后 code 立即连续（非旧编号）；循环保护；失败整体回滚；
 *       新进程重开 domain 读回 parent/order/code 一致。
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
import { addProject } from '../lib/core/projects.js'
import { getTask, listTasks } from '../lib/core/tasks.js'
import { apply } from '../lib/index.js'

const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-moverenumber-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) { command = definition; return () => {} },
})

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}
const add = value => `task add ${JSON.stringify(value)}`
const codes = pid => listTasks(facility.get('pmtool'), pid).map(t => t.code)

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  if (reopening) {
    // 新进程重开：按 id 读回上一轮落盘结果，校验 parent/order/code 一致。
    assert.equal(getTask(domain, 't-0001').parentId, null)
    assert.equal(getTask(domain, 't-0001').code, '1')
    assert.equal(getTask(domain, 't-0002').parentId, null)
    assert.equal(getTask(domain, 't-0002').code, '2')
    assert.equal(getTask(domain, 't-0003').parentId, 't-0001')
    assert.equal(getTask(domain, 't-0003').code, '2.1')
    assert.equal(getTask(domain, 't-0003').order, 1)
    console.log('通过：新进程重开 domain，读回 parent/order/code 与落盘一致。')
  } else {
    const project = await addProject(domain, { name: '移动重编号项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    const pid = project.id

    // 树：t-0001 根一(1) / t-0003 子一(1.1)挂在 t-0001 下 / t-0002 根二(2)
    await run(add({ projectId: pid, title: '根一' }))
    await run(add({ projectId: pid, title: '根二' }))
    await run(add({ projectId: pid, parentId: 't-0001', title: '子一' }))
    assert.deepEqual(codes(pid), ['1', '1.1', '2'])

    // 1) 复合动作：把 子一(t-0003) 挂到 根二(t-0002) 下，移动后立即重编号。
    assert.match(await run('task move t-0003 t-0002 --renumber'), /当前未执行移动/) // 预览不落盘
    await run('task move t-0003 t-0002 --renumber confirm')
    assert.equal(getTask(domain, 't-0003').parentId, 't-0002')
    assert.equal(getTask(domain, 't-0003').code, '2.1', '复合动作后 code 应立即连续，而非旧 1.1')
    assert.deepEqual(codes(pid), ['1', '2', '2.1'])

    // 2) 旧 move 兼容：不带 --renumber，移动后保留旧编号。
    await run('task move t-0003 t-0001 confirm')
    assert.equal(getTask(domain, 't-0003').parentId, 't-0001')
    assert.equal(getTask(domain, 't-0003').code, '2.1', '旧 move 不重编号，保留移动时编号')

    // 3) 循环保护（复合动作）：把根一(t-0001)移到其子任务(t-0003)下 → 报错且状态不变。
    const snapshotBefore = listTasks(domain, pid).map(t => [t.id, t.code, t.parentId])
    await run('task move t-0001 t-0003 --renumber confirm', 'error')
    assert.equal(getTask(domain, 't-0001').parentId, null)
    assert.deepEqual(
      listTasks(domain, pid).map(t => [t.id, t.code, t.parentId]),
      snapshotBefore,
      '循环拒绝后任务树应保持不变（无半套状态）',
    )

    // 4) 失败原子性：重编号阶段人为写失败 → 本项目任务整体回滚到移动前。
    const table = domain.table('tasks')
    const originalPut = table.put
    let writes = 0
    table.put = async (...args) => {
      writes += 1
      if (writes === 3) throw new Error('验证用复合写入失败')
      return originalPut.apply(table, args)
    }
    const beforeRollback = listTasks(domain, pid).map(t => [t.id, t.code, t.parentId, t.order])
    try {
      await run('task move t-0002 root --renumber confirm', 'error')
    } finally {
      table.put = originalPut
    }
    assert.deepEqual(
      listTasks(domain, pid).map(t => [t.id, t.code, t.parentId, t.order]),
      beforeRollback,
      '复合动作失败后本项目任务应整体回滚',
    )

    console.log('通过：PROD-04 复合 move+renumber 原子性、循环保护、旧 move 兼容与失败回滚。')
    // 新进程重开读回，验证落盘持久性。
    await facility.closeAll()
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
  }
} finally {
  await facility.closeAll()
}
