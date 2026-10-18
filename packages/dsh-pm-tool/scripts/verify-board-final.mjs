/**
 * R4-final B 侧验证证据（不改产品）：
 *  A) 从【构建产物 lib/client/board】同 registry/helper/loadDashboard 归一旧 11 类布局，
 *     记录身份/config/x/y/w/h；静态 12 列网格 bbox 相交=0（不做响应式断点夹紧，不虚称多断点）；
 *  B) 隔离临时根（mkdtempSync，不碰正式 data）走真实命令链：dashboard put user →
 *     web snapshot 刷新读回 → 新 Context（--reopen）重载读回，逐卡核 i/type/config/x/y/w/h，
 *     且保存后碰撞仍为 0。
 * 说明：响应式断点的 CSS/RGL 重排属浏览态 DOM，需另一 DOM 探针；本脚本钉住静态网格 bbox 零相交
 * 与持久化/重载身份不丢。
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
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-board-final-'))

// ---- A) 构建产物运行时：旧 11 类归一 + 零碰撞（12/8/4/1 列）----
const { knownWidgetTypeSet } = await import('../lib/client/board/widgets.js')
const { loadDashboard, findCollisions } = await import('../lib/client/board/persist.js')

const oldLayout11 = {
  version: 1, scope: 'global',
  widgets: [
    { i: 'old-hero', type: 'completionHero', config: { headline: '季度完成概览' }, layout: { i: 'old-hero', x: 0, y: 0, w: 4, h: 6 } },
    { i: 'old-ms', type: 'milestoneDeliverable', config: { note: '里程碑/交付物' }, layout: { i: 'old-ms', x: 4, y: 0, w: 8, h: 3 } },
    { i: 'old-scale', type: 'projectScale', config: { metric: '规模' }, layout: { i: 'old-scale', x: 4, y: 3, w: 4, h: 4 } },
    { i: 'old-obj', type: 'objectiveProgress', config: { goal: '目标进度' }, layout: { i: 'old-obj', x: 8, y: 3, w: 4, h: 4 } },
    { i: 'old-load', type: 'peopleLoad', config: { view: '负载' }, layout: { i: 'old-load', x: 4, y: 7, w: 8, h: 3 } },
    { i: 'old-risk', type: 'riskMatrix', config: { matrix: '风险矩阵' }, layout: { i: 'old-risk', x: 0, y: 10, w: 4, h: 4 } },
    { i: 'old-week', type: 'weeklyPlan', config: { week: '周计划' }, layout: { i: 'old-week', x: 4, y: 10, w: 8, h: 4 } },
    { i: 'old-trend', type: 'completionTrend', config: { chart: '完成趋势' }, layout: { i: 'old-trend', x: 0, y: 14, w: 6, h: 4 } },
    { i: 'old-kpi', type: 'kpiMetric', config: { kpi: '关键指标' }, layout: { i: 'old-kpi', x: 6, y: 14, w: 6, h: 4 } },
    { i: 'old-list', type: 'recordList', config: { list: '记录清单' }, layout: { i: 'old-list', x: 0, y: 18, w: 6, h: 5 } },
    { i: 'old-queue', type: 'queueCard', config: { queue: '补记队列' }, layout: { i: 'old-queue', x: 6, y: 18, w: 6, h: 5 } },
  ],
}

const known = knownWidgetTypeSet()
const loaded = loadDashboard(oldLayout11, known)
assert.ok(loaded, '旧布局应可解析')
assert.equal(loaded.skipped.length, 0, `旧 11 类不应跳过：${loaded.skipped.join(',')}`)
assert.equal(loaded.layout.widgets.length, 11, '旧布局应保留 11 张卡')
// 记录身份/config/x/y/w/h（保存前快照）。
const record = loaded.layout.widgets.map(w => ({
  i: w.i, type: w.type, config: w.config, x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h,
}))
// 静态 12 列网格 bbox 零相交（本脚本不做响应式断点夹紧/迁移，不虚称多断点；
// 浏览态 CSS/RGL 重排属另一 DOM 探针）。
const collisions = findCollisions(loaded.layout.widgets)
assert.equal(collisions.length, 0, `静态布局存在 bbox 相交：${collisions.map(c => c.join('-')).join(',')}`)
console.log('[board-final] old-11 kept=11 skipped=0; 静态12列 bbox collisions=0')
for (const r of record) console.log(`[board-final] ${r.i} ${r.type} config=${JSON.stringify(r.config)} @${r.x},${r.y} ${r.w}x${r.h}`)

// ---- B) 隔离 Context：put → snapshot 刷新读回 → 新 Context 重载 ----
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(definition) { command = definition; return () => {} } })

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}
async function snapshot() { return JSON.parse(await run('web snapshot')) }

try {
  await apply(ctx)
  assert.ok(facility.get('pmtool'))

  if (reopening) {
    // 新 Context：上一进程已 put user=oldLayout11；原样读回并核字段、零碰撞。
    const snap = await snapshot()
    assert.deepEqual(snap.dashboards.user, oldLayout11, '新 Context 读回的 user 布局须与保存一致')
    const reloaded = loadDashboard(snap.dashboards.user, known)
    assert.equal(reloaded.skipped.length, 0, '重载后不应跳过')
    assert.equal(findCollisions(reloaded.layout.widgets).length, 0, '重载后 bbox 仍零相交')
    console.log('[board-final] 新 Context 重载读回：11 类身份/config/x/y/w/h 一致，碰撞=0')
  } else {
    // 保存 → 刷新 snapshot 读回（同进程）。
    await run(`dashboard put user ${JSON.stringify(oldLayout11)}`)
    const snap = await snapshot()
    assert.deepEqual(snap.dashboards.user, oldLayout11, '刷新 snapshot 读回须与保存一致')
    const saved = loadDashboard(snap.dashboards.user, known)
    assert.equal(saved.layout.widgets.length, 11, '保存后 11 卡保留')
    assert.equal(findCollisions(saved.layout.widgets).length, 0, '保存后 bbox 零相交')
    console.log('[board-final] 保存→刷新 snapshot：11 类一致，碰撞=0；准备新 Context 重载')
    await facility.closeAll()

    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
    console.log(`[board-final] PASS（临时目录：${root}）`)
  }
} finally {
  await facility.closeAll()
}
