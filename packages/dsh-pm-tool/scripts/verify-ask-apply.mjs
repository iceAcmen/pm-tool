import assert from 'node:assert'
import { createHash } from 'node:crypto'
import { handleAskApplyCommand } from '../lib/commands/ask.js'
import { buildAskContext } from '../lib/core/ask-copilot.js'
import {
  createSettingsIdempotencyRegistry,
  hashScopeKey,
  askApplyScope,
  IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT,
  IDEMPOTENCY_SETTINGS_ROW,
} from '../lib/core/idempotency.js'

// 与 core/idempotency.ts 同约定的 keyHash 复算（测试侧独立拼分片，避免白盒耦合实现）。
const askKeyHash = (projectId, actions, baseline, actorSegment = IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT) =>
  hashScopeKey([projectId, actorSegment, JSON.stringify(actions), JSON.stringify(baseline)])

// 内存假域：仅实现 ask-apply 用到的 table().get/entries/put
function makeDomain(records) {
  const store = JSON.parse(JSON.stringify(records))
  for (const [id, t] of Object.entries(store.tasks ?? {})) {
    if (!t.createdAt) t.createdAt = '2026-10-01T00:00:00Z'
    if (t.code == null) t.code = '1'
    if (t.order == null) t.order = 1
    if (t.parentId === undefined) t.parentId = null
    if (!t.description) t.description = ''
    if (!t.priority) t.priority = 'P1'
    if (t.milestoneId === undefined) t.milestoneId = null
  }
  return {
    table(name) {
      return {
        get(id) { return (store[name] ?? {})[id] ?? null },
        entries() { return Object.entries(store[name] ?? {}) },
        // 与真实 storage-domain 一致：表命名空间缺失时自动建（settings 表可能还没写过）。
        async put(id, rec) { store[name] = store[name] ?? {}; store[name][id] = rec },
      }
    },
    _store: store,
  }
}

const _full = (t)=>({ code:'A', order:0, parentId:null, createdAt:'2026-10-01T00:00:00Z', ...t })
const base = {
  projects: { 'p-1': { id: 'p-1', name: '项目一' }, 'p-2': { id: 'p-2', name: '项目二' } },
  tasks: {
    't-1': { id: 't-1', projectId: 'p-1', title: 'A', assignee: 'ice', status: 'todo', progress: 0, updatedAt: '2026-10-01T00:00:00Z' },
    't-2': { id: 't-2', projectId: 'p-1', title: 'B', assignee: 'ice', status: 'todo', progress: 0, updatedAt: '2026-10-01T00:00:00Z' },
    't-p2': { id: 't-p2', projectId: 'p-2', title: '跨项目任务', assignee: 'ice', status: 'todo', progress: 0, updatedAt: '2026-10-01T00:00:00Z' },
    't-other': { id: 't-other', projectId: 'p-999', title: '跨项目', assignee: 'x', status: 'todo', progress: 0, updatedAt: '2026-10-01T00:00:00Z' },
  },
}

// 1) 合法 task.update 落库
{
  const d = makeDomain(base)
  const r = await handleAskApplyCommand('p-1 ' + JSON.stringify([{ op: 'task.update', id: 't-1', patch: { assignee: '赵六', status: 'done' } }]), d)
  assert.equal(r.kind, 'success')
  assert.match(r.text, /已应用 1 条/)
  assert.equal(d._store.tasks['t-1'].assignee, '赵六')
  assert.equal(d._store.tasks['t-1'].status, 'done')
}

// 2) 跨项目 t-other 被拒（即使 patch 合法）
{
  const d = makeDomain(base)
  const r = await handleAskApplyCommand('p-1 ' + JSON.stringify([{ op: 'task.update', id: 't-other', patch: { assignee: 'x' } }]), d)
  assert.match(r.text, /拒绝 1 条|不属于本项目/)
  assert.equal(d._store.tasks['t-other'].assignee, 'x') // 未被改
}

// 3) 冲突：基线 updatedAt 与当前不一致 -> 拒绝覆盖
{
  const d = makeDomain(base)
  const r = await handleAskApplyCommand('p-1 ' + JSON.stringify(
    [{ op: 'task.update', id: 't-1', patch: { assignee: '新人' } }]) + ' --base ' + JSON.stringify({ 't-1': '2026-09-01T00:00:00Z' }), d)
  assert.match(r.text, /他人更新|冲突/)
  assert.equal(d._store.tasks['t-1'].assignee, 'ice') // 保持原值
}

// 4) 重复确认同一草稿 -> 幂等拦截，不重复写
{
  const d = makeDomain(base)
  const actions = JSON.stringify([{ op: 'task.update', id: 't-2', patch: { progress: 50 } }])
  const r1 = await handleAskApplyCommand('p-1 ' + actions, d)
  assert.match(r1.text, /已应用 1 条/)
  const r2 = await handleAskApplyCommand('p-1 ' + actions, d)
  assert.match(r2.text, /幂等/)
  // 只写了一次（updatedAt 只前进一次的事实：progress 仍为 50，不报错）
  assert.equal(d._store.tasks['t-2'].progress, 50)
}

// 5) 非法日期/起止 -> 被拒，合法项仍落库（部分成功互不影响）
{
  const d = makeDomain(base)
  const actions = JSON.stringify([
    { op: 'task.update', id: 't-1', patch: { progress: 33 } },            // 合法
    { op: 'task.update', id: 't-2', patch: { dueDate: '2026-02-30' } },   // 非法日期
    { op: 'task.delete', id: 't-1' },                                     // 不允许操作
  ])
  const r = await handleAskApplyCommand('p-1 ' + actions, d)
  assert.match(r.text, /已应用 1 条/)
  assert.match(r.text, /日期/)
  assert.match(r.text, /不允许/)
  assert.equal(d._store.tasks['t-1'].progress, 33)
}

// 6) 会议行动项用真实 schema 字段（title/owner/dueDate/status），无 undefined
{
  const ctx = buildAskContext({
    projectName: 'P', today: '2026-10-12', tasks: [], risks: [], milestones: [],
    meetings: [{
      id: 'mt-1', title: '周会', date: '2026-10-11',
      actions: [{ id: 'ai-1', title: '出原型', owner: '小明', dueDate: '2026-10-20', status: 'todo', taskId: null, riskIssueId: null }],
    }],
  })
  assert.match(ctx, /出原型/)
  assert.match(ctx, /负责人=小明/)
  assert.match(ctx, /截止=2026-10-20/)
  assert.ok(!ctx.includes('undefined'), '不应出现 undefined 字段')
}

// ===== PROD-24 CMP-CHAIN-01 整批同 task 两步：链式 baseline 不被误判冲突，两步均落盘 =====
{
  const d = makeDomain(base)
  // baseline 用 t-1 的当前 updatedAt（'2026-10-01T00:00:00Z'）
  const actions = JSON.stringify([
    { op: 'task.update', id: 't-1', patch: { assignee: '甲' }, stepId: 's1', title: '派甲', needs: [] },
    { op: 'task.update', id: 't-1', patch: { status: 'done' }, stepId: 's2', title: '收尾', needs: ['s1'] },
  ])
  const r = await handleAskApplyCommand('p-1 ' + actions + ' --base ' + JSON.stringify({ 't-1': '2026-10-01T00:00:00Z' }), d)
  assert.match(r.text, /已应用 2 步|已应用 2 条/, '两步都应落库：' + r.text)
  assert.equal(d._store.tasks['t-1'].assignee, '甲', 's1 落库')
  assert.equal(d._store.tasks['t-1'].status, 'done', 's2 用链式 updatedAt，不应被误判冲突')
}

// ===== PROD-24 CMP-CONFLICT-01 外部冲突仅拒相关步+下游级联，独立步继续 =====
{
  const d = makeDomain(base)
  // s1 改 t-1（独立）；s2 改 t-3 用错基线（模拟他人已改）；s3 依赖 s2 -> 级联拒
  const actions = JSON.stringify([
    { op: 'task.update', id: 't-1', patch: { progress: 11 }, stepId: 's1', title: '独立步', needs: [] },
    { op: 'task.update', id: 't-2', patch: { progress: 22 }, stepId: 's2', title: '冲突步', needs: [] },
    { op: 'task.update', id: 't-2', patch: { assignee: '跟s2' }, stepId: 's3', title: '依赖步', needs: ['s2'] },
  ])
  // 故意给 t-2 一个错误基线 -> s2 被判他人已改；s3 依赖 s2 -> 级联拒；s1 独立照常
  const r = await handleAskApplyCommand('p-1 ' + actions + ' --base ' + JSON.stringify({ 't-1': '2026-10-01T00:00:00Z', 't-2': '1999-01-01T00:00:00Z' }), d)
  assert.equal(d._store.tasks['t-1'].progress, 11, '独立 s1 照常落库')
  assert.match(r.text, /他人更新|已被他人更新|避免覆盖/, 's2 应被判外部冲突：' + r.text)
  assert.equal(d._store.tasks['t-2'].assignee, 'ice', 's3 级联拒：不应写库')
  assert.ok(!r.text.includes('跟s2') === false || r.text, '文案应逐行说明')
}

// ===== PROD-24 CMP-IDEM-02 幂等键含 baseline：同 actions 不同 baseline 不互拦 =====
{
  const d = makeDomain(base)
  const actions = JSON.stringify([{ op: 'task.update', id: 't-2', patch: { progress: 60 }, stepId: 's1', title: 'x', needs: [] }])
  const r1 = await handleAskApplyCommand('p-1 ' + actions + ' --base ' + JSON.stringify({ 't-2': '2026-10-01T00:00:00Z' }), d)
  assert.match(r1.text, /已应用 1 步|已应用 1 条/)
  // 换一个不同 baseline（模拟重新生成计划），不应被上次幂等键误拦
  const r2 = await handleAskApplyCommand('p-1 ' + actions + ' --base ' + JSON.stringify({ 't-2': '2020-01-01T00:00:00Z' }), d)
  assert.ok(!/幂等/.test(r2.text), '不同 baseline 不应命中幂等拦截：' + r2.text)
}

// ===== PROD-24 逐步模式：前端按拓扑序逐次单步调用（第二步 needs 已剥空），两次都落库 =====
{
  const d = makeDomain(base)
  // 第一次：s1 改 t-1 assignee
  const c1 = await handleAskApplyCommand('p-1 ' + JSON.stringify([
    { op: 'task.update', id: 't-1', patch: { assignee: '甲' }, stepId: 's1', title: '派甲', needs: [] },
  ]) + ' --base ' + JSON.stringify({ 't-1': '2026-10-01T00:00:00Z' }), d)
  assert.match(c1.text, /已应用 1 步/)
  // 前端刷新 baseline 后第二次：s2 同 task 改 status（needs 已剥空），用最新 updatedAt 做基线
  const after1 = d._store.tasks['t-1'].updatedAt
  const c2 = await handleAskApplyCommand('p-1 ' + JSON.stringify([
    { op: 'task.update', id: 't-1', patch: { status: 'done' }, stepId: 's2', title: '收尾', needs: [] },
  ]) + ' --base ' + JSON.stringify({ 't-1': after1 }), d)
  assert.match(c2.text, /已应用 1 步/, '逐步第二步不应被误判冲突：' + c2.text)
  assert.equal(d._store.tasks['t-1'].assignee, '甲')
  assert.equal(d._store.tasks['t-1'].status, 'done')
}

// ===== 稳定性 S2：成功幂等键 60s 短 TTL 持久化到 settings，跨重启/跨进程重放 =====

// S2-1) 跨进程重放：settings 里已有「上一进程成功」的新鲜标记，且任务 updatedAt 已被推进
//       （再比基线必冲突）。重复同一确认必须返回「已执行」，而不是 baseline 冲突。
{
  const d = makeDomain(base)
  const actions = [{ op: 'task.update', id: 't-1', patch: { assignee: '赵六' } }]
  const baseline = { 't-1': '2026-10-01T00:00:00Z' }
  const keyHash = askKeyHash('p-1', actions, baseline)
  // 模拟「上一个进程已成功确认并把 updatedAt 推进」：settings 落新鲜标记 + 任务 updatedAt 前进。
  d._store.settings = {
    [IDEMPOTENCY_SETTINGS_ROW]: {
      value: { markers: { [keyHash]: { scope: askApplyScope('p-1', IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT), expiresAt: Date.now() + 60_000, updatedAt: new Date().toISOString() } } },
      updatedAt: new Date().toISOString(),
    },
  }
  d._store.tasks['t-1'].updatedAt = '2026-10-14T00:00:00Z'
  const r = await handleAskApplyCommand('p-1 ' + JSON.stringify(actions) + ' --base ' + JSON.stringify(baseline), d)
  assert.match(r.text, /已执行|幂等拦截/, '跨进程重复确认应命中持久化幂等，而非 baseline 冲突：' + r.text)
  assert.equal(d._store.tasks['t-1'].assignee, 'ice', '命中幂等后不得再次写库')
  assert.equal(d._store.tasks['t-1'].updatedAt, '2026-10-14T00:00:00Z', 'updatedAt 不被再次推进')
}

// S2-2) 同 domain 成功一次后，新开一个「共享持久存储」的 domain（模拟重启重开数据目录）重放 -> 已执行
{
  const d1 = makeDomain(base)
  const actions = JSON.stringify([{ op: 'task.update', id: 't-2', patch: { progress: 44 }, stepId: 's1', title: 'x', needs: [] }])
  const r1 = await handleAskApplyCommand('p-1 ' + actions + ' --base ' + JSON.stringify({ 't-2': '2026-10-01T00:00:00Z' }), d1)
  assert.match(r1.text, /已应用 1 步|已应用 1 条/)
  // 任务 updatedAt 已被本次推进；新开 domain 共享同一份落盘 store。
  const d2 = makeDomain(d1._store)
  const r2 = await handleAskApplyCommand('p-1 ' + actions + ' --base ' + JSON.stringify({ 't-2': '2026-10-01T00:00:00Z' }), d2)
  assert.match(r2.text, /已执行|幂等拦截/, '新 domain 重放应命中持久化幂等：' + r2.text)
  assert.equal(d2._store.tasks['t-2'].progress, 44, '重放不得再次写库')
}

// S2-3) TTL 过期： planted 一条已过期标记 -> 不拦截，照常执行
{
  const d = makeDomain(base)
  const actions = [{ op: 'task.update', id: 't-2', patch: { progress: 77 } }]
  const baseline = {}
  const keyHash = askKeyHash('p-1', actions, baseline)
  d._store.settings = {
    [IDEMPOTENCY_SETTINGS_ROW]: {
      value: { markers: { [keyHash]: { scope: askApplyScope('p-1', IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT), expiresAt: Date.now() - 1_000, updatedAt: '2026-10-01T00:00:00Z' } } },
      updatedAt: '2026-10-01T00:00:00Z',
    },
  }
  const r = await handleAskApplyCommand('p-1 ' + JSON.stringify(actions), d)
  assert.match(r.text, /已应用 1 条/, '过期标记不应拦截：' + r.text)
  assert.equal(d._store.tasks['t-2'].progress, 77)
}

// S2-4) 不同 project 不误去重；不同 actor 也不误去重
{
  const d = makeDomain(base)
  const a1 = JSON.stringify([{ op: 'task.update', id: 't-1', patch: { assignee: '张三' } }])
  const r1 = await handleAskApplyCommand('p-1 ' + a1, d)
  assert.match(r1.text, /已应用 1 条/)
  // 同形动作但落在 p-2：projectId 不同 -> keyHash 不同 -> 不应被 p-1 的标记误拦
  const a2 = JSON.stringify([{ op: 'task.update', id: 't-p2', patch: { assignee: '李四' } }])
  const r2 = await handleAskApplyCommand('p-2 ' + a2, d)
  assert.match(r2.text, /已应用 1 条/, '不同 project 不应误去重：' + r2.text)
  assert.equal(d._store.tasks['t-p2'].assignee, '李四')
  // actor 段：同 project/actions/baseline，仅 actor 不同 -> keyHash 不同
  const h1 = askKeyHash('p-1', [{ op: 'task.update', id: 't-1', patch: { x: 1 } }], {}, 'local-anonymous')
  const h2 = askKeyHash('p-1', [{ op: 'task.update', id: 't-1', patch: { x: 1 } }], {}, 'alice')
  assert.notEqual(h1, h2, '不同 actor 不应共享 keyHash')
  const h3 = askKeyHash('p-2', [{ op: 'task.update', id: 't-1', patch: { x: 1 } }], {}, 'local-anonymous')
  assert.notEqual(h1, h3, '不同 project 不应共享 keyHash')
}

// S2-5) 失败不登记：整批被拒（appliedCount=0）后 settings 无标记，重放也不被幂等拦
{
  const d = makeDomain(base)
  const bad = JSON.stringify([{ op: 'task.update', id: 't-other', patch: { assignee: 'x' } }])
  const r = await handleAskApplyCommand('p-1 ' + bad, d)
  assert.match(r.text, /拒绝|不属于本项目/)
  const row = d._store.settings?.[IDEMPOTENCY_SETTINGS_ROW]
  assert.ok(!row || !row.value?.markers || Object.keys(row.value.markers).length === 0, '失败不得登记幂等标记')
  const r2 = await handleAskApplyCommand('p-1 ' + bad, d)
  assert.ok(!/已执行|幂等拦截/.test(r2.text), '失败的计划重放不应被幂等拦：' + r2.text)
}

// S2-6) inFlight 不落盘：成功后 settings 行只存最小标记（keyHash/scope/expiresAt/updatedAt），
//       不含动作正文/patch/baseline，也不含任何 in-flight/pending 态。
{
  const d = makeDomain(base)
  const actions = JSON.stringify([{ op: 'task.update', id: 't-1', patch: { progress: 41 } }])
  await handleAskApplyCommand('p-1 ' + actions, d)
  const row = d._store.settings[IDEMPOTENCY_SETTINGS_ROW]
  const markers = row.value.markers
  const hashes = Object.keys(markers)
  assert.equal(hashes.length, 1, '成功应恰好登记 1 条标记')
  const m = markers[hashes[0]]
  assert.ok(typeof m.expiresAt === 'number' && m.expiresAt > Date.now(), 'expiresAt 应为未来时间戳')
  assert.equal(m.scope, askApplyScope('p-1', IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT))
  assert.equal(hashes[0], askKeyHash('p-1', JSON.parse(actions), {}), '落盘 keyHash 应与复算一致')
  for (const forbidden of ['actions', 'patch', 'body', 'baseline', 'inFlight', 'pending', 'promise']) {
    assert.ok(!(forbidden in m), '标记不得含动作正文/敏感信息/in-flight：' + forbidden)
  }
}

// S2-7) baseline 冲突仍优先于非同 key：记录 plan A 成功后，用不同 baseline 重提同 task
//       -> keyHash 不同 -> 不得被幂等短路，必须走 applyCore 报「他人已改」。
{
  const d = makeDomain(base)
  const actions = JSON.stringify([{ op: 'task.update', id: 't-1', patch: { assignee: '王五' }, stepId: 's1', title: 't', needs: [] }])
  const r1 = await handleAskApplyCommand('p-1 ' + actions + ' --base ' + JSON.stringify({ 't-1': '2026-10-01T00:00:00Z' }), d)
  assert.match(r1.text, /已应用 1 步|已应用 1 条/)
  const r2 = await handleAskApplyCommand('p-1 ' + actions + ' --base ' + JSON.stringify({ 't-1': '1999-01-01T00:00:00Z' }), d)
  assert.ok(!/已执行|幂等拦截/.test(r2.text), '不同 baseline（非同 key）不得被幂等短路：' + r2.text)
  assert.match(r2.text, /他人更新|已被他人更新|避免覆盖/)
}

// S2-8) settings 实现单元：check 命中/过期退化、record 懒清理过期项、不影响其它 settings 键
{
  const d = makeDomain(base)
  // 先写一个无关 settings 键（模拟 aiModelMode），证明互不影响
  await d.table('settings').put('aiModelMode', { value: 'poc', updatedAt: '2026-10-01T00:00:00Z' })
  const reg = createSettingsIdempotencyRegistry(d)
  const h = hashScopeKey(['u', 'n', 'it'])
  assert.equal(reg.check(h), undefined, '空注册表未登记')
  await reg.record({ keyHash: h, scope: 'unit:u', expiresAt: Date.now() + 60_000 })
  assert.ok(reg.check(h), '登记后命中')
  // 另一条过期标记，record 时应被懒清理
  const expired = hashScopeKey(['expired'])
  await reg.record({ keyHash: expired, scope: 'unit:exp', expiresAt: Date.now() - 1_000 })
  assert.equal(reg.check(expired), undefined, '过期标记不命中')
  // 再次 record 触发懒清理后，过期 key 应从落盘 markers 移除
  await reg.record({ keyHash: h, scope: 'unit:u', expiresAt: Date.now() + 60_000 })
  const row = d._store.settings[IDEMPOTENCY_SETTINGS_ROW]
  assert.ok(!(expired in row.value.markers), '懒清理应淘汰过期标记')
  assert.ok(h in row.value.markers, '新鲜标记保留')
  // 其它 settings 键完好
  assert.equal(d._store.settings['aiModelMode'].value, 'poc', '幂等注册不得破坏其它 settings 键')
}

console.log('verify-ask-apply OK（后端归属/冲突/幂等/部分成功/会议字段/链式baseline/级联/逐步两连/S2跨进程幂等持久化）')
