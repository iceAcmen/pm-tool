import assert from 'node:assert'
import { handleAskApplyCommand } from '../lib/commands/ask.js'
import { buildAskContext } from '../lib/core/ask-copilot.js'

// 内存假域：仅实现 ask-apply 用到的 table().get/entries/put
function makeDomain(records) {
  const store = JSON.parse(JSON.stringify(records))
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

console.log('verify-ask-apply OK（后端归属/冲突/幂等/部分成功/会议字段）')
