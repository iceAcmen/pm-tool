/**
 * P1-B 补记队列「添加卡」持久化真实链路验证（临时 JSON 根，不碰真实业务数据）。
 *
 * 复刻 verify-dashboard.mjs 的 Context + DomainFacility + 真实命令 handler 模式。
 * 覆盖：
 *  1. 自定义旧布局保存 user 后，web snapshot 读回含 w-queue，旧 widget 深等不变；
 *  2. 新 Context（--reopen，等价重进/浏览器 reload）磁盘读回 w-queue 仍在，旧位置不动；
 *  3. 非法布局 put → kind=error，已有布局不变，不产生假成功。
 * DSH_PM_E2E=1 环境下运行。
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

const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-adopt-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) {
    command = definition
    return () => {}
  },
})

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}

async function snapshot() {
  return JSON.parse(await run('web snapshot'))
}

// 旧自定义布局（两张旧卡）。
const oldLayout = {
  version: 1,
  widgets: [
    { i: 'w-tasks', type: 'tasks', config: {}, layout: { i: 'w-tasks', x: 0, y: 0, w: 6, h: 4 } },
    { i: 'w-gantt', type: 'gantt', config: {}, layout: { i: 'w-gantt', x: 6, y: 4, w: 6, h: 4 } },
  ],
}
// adopt 后的布局 = 旧布局 + 追加到末尾空闲行的 w-queue（等价 appendQueueCard 输出）。
const adoptNext = {
  version: 1,
  scope: 'user',
  widgets: [
    ...oldLayout.widgets,
    { i: 'w-queue', type: 'queueCard', config: {}, layout: { i: 'w-queue', x: 0, y: 8, w: 4, h: 5, minW: 3, minH: 3 } },
  ],
}

try {
  await apply(ctx)
  assert.ok(facility.get('pmtool'))

  if (reopening) {
    // 新 Context（等价重进总览 / reload）：磁盘读回 w-queue 仍在，旧卡不动。
    const snap = await snapshot()
    assert.deepEqual(snap.dashboards.user, adoptNext)
    assert.equal(snap.dashboards.user.widgets.find(w => w.type === 'queueCard').layout.y, 8)
    assert.deepEqual(snap.dashboards.user.widgets.filter(w => w.type !== 'queueCard'), oldLayout.widgets)
    // 继续写 user，证明跨进程写链可用。
    await run(`dashboard put user ${JSON.stringify(adoptNext)}`)
    console.log('通过：新 Context 读回 w-queue 仍在，旧卡位置不变，写链跨进程可用。')
  } else {
    // 初始：两作用域 null。
    let snap = await snapshot()
    assert.equal(snap.dashboards.user, null)
    assert.equal(snap.dashboards.project, null)

    // 模拟 adopt：落盘 adoptNext（旧布局 + w-queue）。
    await run(`dashboard put user ${JSON.stringify(adoptNext)}`)
    snap = await snapshot()
    assert.deepEqual(snap.dashboards.user, adoptNext)
    // w-queue 存在且旧两张卡深等不变。
    const q = snap.dashboards.user.widgets.find(w => w.type === 'queueCard')
    assert.ok(q, '读回应含 queueCard')
    assert.deepEqual(q.layout, { i: 'w-queue', x: 0, y: 8, w: 4, h: 5, minW: 3, minH: 3 })
    assert.deepEqual(
      snap.dashboards.user.widgets.filter(w => w.type !== 'queueCard'),
      oldLayout.widgets,
    )

    // 失败路径：非法布局（缺 widgets）→ kind=error，已有布局不变，不假成功。
    await run('dashboard put user {"version":1}', 'error')
    snap = await snapshot()
    assert.deepEqual(snap.dashboards.user, adoptNext, '失败写入不得改动已存布局')

    console.log('通过：adopt 落盘读回 w-queue、旧卡不变；非法写入被拒且不污染。')
    await facility.closeAll()

    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`adopt 持久化链路全部通过。临时根：${root}`)
  }
} finally {
  await facility.closeAll()
}
