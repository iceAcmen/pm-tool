/**
 * 跨项目看板布局持久化确定性验证。使用独立系统临时目录，不污染真实业务数据。
 *
 * 覆盖：put user/project 后 web snapshot 的 dashboards 读回且内容一致；
 * 重启（--reopen）读回；reset 后对应作用域变 null；非法 scope / JSON / 缺 version·widgets 被拒；
 * 其余 7 个 snapshot 字段不受影响。
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
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-dashboard-'))
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

// 布局样例：含嵌套对象/数组，证明后端透明存取、不丢结构。
const userLayout = {
  version: 2,
  widgets: [
    { id: 'w-1', type: 'tasks', x: 0, y: 0, w: 6, h: 4, config: { projectId: 'p-0001', hidden: false } },
    { id: 'w-2', type: 'gantt', x: 6, y: 0, w: 6, h: 8, config: {} },
  ],
}
const projectLayout = {
  version: 2,
  widgets: [{ id: 'w-p1', type: 'risk-issues', x: 0, y: 0, w: 12, h: 6, config: { severity: ['high'] } }],
}

try {
  await apply(ctx)
  assert.ok(facility.get('pmtool'))

  if (reopening) {
    // 上一进程：project 已保存、user 已 reset。本进程（新 Context）应原样读回。
    const snap = await snapshot()
    assert.deepEqual(snap.dashboards.project, projectLayout)
    assert.equal(snap.dashboards.user, null)
    // 7 个业务字段仍为数组（空或已有数据时也应是数组）。
    for (const key of ['projects', 'tasks', 'milestones', 'riskIssues', 'meetings', 'reports', 'deliverables']) {
      assert.ok(Array.isArray(snap[key]), `snapshot.${key} 应为数组`)
    }
    // 重启后继续写入 user，验证写链跨进程可用。
    await run(`dashboard put user ${JSON.stringify(userLayout)}`)
    const snap2 = await snapshot()
    assert.deepEqual(snap2.dashboards.user, userLayout)
    console.log('通过：全新进程读回 project 布局、user 为 null，并能继续写入。')
  } else {
    // 初始：两个作用域都为 null，且 7 个业务字段为数组。
    let snap = await snapshot()
    assert.equal(snap.dashboards.user, null)
    assert.equal(snap.dashboards.project, null)
    for (const key of ['projects', 'tasks', 'milestones', 'riskIssues', 'meetings', 'reports', 'deliverables']) {
      assert.ok(Array.isArray(snap[key]), `snapshot.${key} 应为数组，实际：${JSON.stringify(snap[key])}`)
    }

    // put user 后读回且内容一致。
    await run(`dashboard put user ${JSON.stringify(userLayout)}`)
    snap = await snapshot()
    assert.deepEqual(snap.dashboards.user, userLayout)
    assert.equal(snap.dashboards.project, null)

    // put project 同理。
    await run(`dashboard put project ${JSON.stringify(projectLayout)}`)
    snap = await snapshot()
    assert.deepEqual(snap.dashboards.user, userLayout)
    assert.deepEqual(snap.dashboards.project, projectLayout)

    // reset user 后该作用域变 null，project 不受影响。
    await run('dashboard reset user')
    snap = await snapshot()
    assert.equal(snap.dashboards.user, null)
    assert.deepEqual(snap.dashboards.project, projectLayout)

    // 非法输入一律 kind=error。
    for (const input of [
      'dashboard',
      'dashboard bogus',
      'dashboard put',
      'dashboard put theme',
      'dashboard put user',
      'dashboard put user not-json-at-all',
      'dashboard put user {broken',
      'dashboard put user {"widgets":[]}',           // 缺 version
      'dashboard put user {"version":"2","widgets":[]}', // version 非整数
      'dashboard put user {"version":2}',             // 缺 widgets
      'dashboard put user {"version":2,"widgets":{}}',  // widgets 非数组
      'dashboard reset',
      'dashboard reset theme',
      'dashboard reset user extra',
    ]) {
      await run(input, 'error')
    }

    // reset project 后两个作用域都为 null。
    await run('dashboard reset project')
    snap = await snapshot()
    assert.equal(snap.dashboards.user, null)
    assert.equal(snap.dashboards.project, null)

    // reset 不存在的键也应成功（幂等）。
    await run('dashboard reset user')

    // 业务字段数组属性仍不受影响。
    for (const key of ['projects', 'tasks', 'milestones', 'riskIssues', 'meetings', 'reports', 'deliverables']) {
      assert.ok(Array.isArray(snap[key]), `snapshot.${key} 应为数组`)
    }

    // 为 --reopen 分支准备磁盘状态：user 保持 null，project 重新落盘。
    await run(`dashboard put project ${JSON.stringify(projectLayout)}`)
    console.log('通过：put/reset 读回、非法输入拒绝、snapshot 其余字段不受影响。')
    await facility.closeAll()

    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`全部看板布局校验通过。临时数据保留于：${root}`)
  }
} finally {
  await facility.closeAll()
}
