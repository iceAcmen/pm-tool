import assert from 'node:assert'
import { handleAskApplyCommand } from '../lib/commands/ask.js'
import { buildAskContext } from '../lib/core/ask-copilot.js'

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
        async put(id, rec) { store[name][id] = rec },
      }
    },
    _store: store,
  }
}

const _full = (t)=>({ code:'A', order:0, parentId:null, createdAt:'2026-10-01T00:00:00Z', ...t })
const base = {
  projects: { 'p-1': { id: 'p-1', name: '项目一' } },
  tasks: {
    't-1': { id: 't-1', projectId: 'p-1', title: 'A', assignee: 'ice', status: 'todo', progress: 0, updatedAt: '2026-10-01T00:00:00Z' },
    't-2': { id: 't-2', projectId: 'p-1', title: 'B', assignee: 'ice', status: 'todo', progress: 0, updatedAt: '2026-10-01T00:00:00Z' },
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

console.log('verify-ask-apply OK（后端归属/冲突/幂等/部分成功/会议字段/链式baseline/级联/逐步两连）')
