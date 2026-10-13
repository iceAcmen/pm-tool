/**
 * PROD-24 副驾多步规划 · 自动化门（AUTO）纯函数矩阵。
 * 被测：core/copilot.ts 新增 parseCopilotPlan / validatePlan / orderPlanSteps（复用 validateActions）。
 * 开发前应为 RED（函数尚未实现）；实现后全绿即本门 PASS 可推进。
 * 契约权威：docs/product/08-copilot-multistep-design.md + docs/testing/copilot-multistep-acceptance.md。
 */
import assert from 'node:assert/strict'
import {
  parseCopilotPlan,
  validatePlan,
  orderPlanSteps,
  forStepwiseApply,
} from '../lib/core/copilot.js'

const snap = { taskIds: ['t-1', 't-2', 't-3', 't-4', 't-5'] }

// ===== CMP-PARSE-01 旧格式 {"actions":[...]} 自动包成平凡计划 =====
{
  const p = parseCopilotPlan('诊断正文。\n```json\n{"actions":[{"op":"task.update","id":"t-1","patch":{"assignee":"赵六"}}]}\n```')
  assert.match(p.diagnosis, /诊断正文/)
  assert.equal(p.rawSteps.length, 1)
  const s = p.rawSteps[0]
  assert.ok(s.stepId, '应有 stepId')
  assert.deepEqual(s.needs, [])
  assert.equal(s.action.op, 'task.update')
  assert.equal(s.action.id, 't-1')
}

// ===== CMP-PARSE-02 新格式 {"plan":[...]} 与 {"steps":[...]} 两键均可解析 =====
{
  const a = parseCopilotPlan('```json\n{"plan":[{"stepId":"s1","title":"收尾","reason":"r","action":{"op":"task.update","id":"t-1","patch":{"status":"done"}},"needs":[],"riskNote":"同步周会"}]}\n```')
  assert.equal(a.rawSteps.length, 1)
  assert.equal(a.rawSteps[0].title, '收尾')
  assert.equal(a.rawSteps[0].reason, 'r')
  assert.equal(a.rawSteps[0].riskNote, '同步周会')
  const b = parseCopilotPlan('```json\n{"steps":[{"stepId":"s2","title":"b","action":{"op":"task.update","id":"t-2","patch":{"progress":10}},"needs":["s1"]}]}\n```')
  assert.equal(b.rawSteps.length, 1)
  assert.deepEqual(b.rawSteps[0].needs, ['s1'])
}

// ===== CMP-PARSE-03 markdown 围栏 + 前后噪声；诊断独立返回 =====
{
  const p = parseCopilotPlan('前面一句。\n```json\n{"plan":[{"stepId":"s1","action":{"op":"task.update","id":"t-1","patch":{"progress":1}}}]}\n```\n后面一句。')
  assert.match(p.diagnosis, /前面一句/)
  assert.match(p.diagnosis, /后面一句/)
  assert.equal(p.rawSteps.length, 1)
}

// ===== CMP-PARSE-04 乱码/空/抽不到 -> steps=[] 不抛错 =====
{
  for (const bad of ['完全没有 json。', '', 'not json at all', '{}', '{"nope":1}']) {
    const p = parseCopilotPlan(bad)
    assert.deepEqual(p.rawSteps, [], `输入 ${JSON.stringify(bad)} 应得空步`)
  }
}

// ===== CMP-CONTRACT-01 重复 stepId：后者拒、前者留，不整份拒 =====
{
  const plan = [
    { stepId: 's1', title: '一', action: { op: 'task.update', id: 't-1', patch: { progress: 1 } }, needs: [] },
    { stepId: 's1', title: '二(重复)', action: { op: 'task.update', id: 't-2', patch: { progress: 2 } }, needs: [] },
  ]
  const v = validatePlan(plan, snap)
  assert.equal(v.steps.length, 1, '重复 stepId 后者应被拒')
  assert.equal(v.steps[0].title, '一')
  assert.ok(v.rejected.some(r => /重复/.test(r.reason)), '拒绝原因应提及重复')
}

// ===== CMP-CONTRACT-02 reason 空不拒，仅标黄（前端）；此处断言不进 rejected =====
{
  const v = validatePlan([
    { stepId: 's1', title: 'x', reason: '', action: { op: 'task.update', id: 't-1', patch: { progress: 1 } }, needs: [] },
  ], snap)
  assert.equal(v.steps.length, 1)
  assert.equal(v.rejected.length, 0)
}

// ===== CMP-CONTRACT-03 riskNote 原样透传、不参与拒绝 =====
{
  const v = validatePlan([
    { stepId: 's1', title: 'x', reason: 'r', riskNote: '改完同步周会', action: { op: 'task.update', id: 't-1', patch: { progress: 1 } }, needs: [] },
  ], snap)
  assert.equal(v.steps[0].riskNote, '改完同步周会')
  assert.equal(v.rejected.length, 0)
}

// ===== CMP-CONTRACT-04 action 缺 op/id/patch 非对象 -> 该步拒，其余合法步照常 =====
{
  const v = validatePlan([
    { stepId: 's1', title: '坏', action: { id: 't-1', patch: {} }, needs: [] },
    { stepId: 's2', title: '好', action: { op: 'task.update', id: 't-2', patch: { progress: 5 } }, needs: [] },
  ], snap)
  assert.equal(v.steps.length, 1)
  assert.equal(v.steps[0].stepId, 's2')
  assert.equal(v.rejected.length, 1)
}

// ===== CMP-DAG-01 拓扑：s2.needs=[s1] -> s1 在 s2 前；同级按数组序；两次运行一致 =====
{
  const plan = [
    { stepId: 's2', title: '后', action: { op: 'task.update', id: 't-2', patch: { progress: 2 } }, needs: ['s1'] },
    { stepId: 's1', title: '前', action: { op: 'task.update', id: 't-1', patch: { progress: 1 } }, needs: [] },
    { stepId: 's3', title: '独立', action: { op: 'task.update', id: 't-3', patch: { progress: 3 } }, needs: [] },
  ]
  const o1 = validatePlan(plan, snap).steps.map(s => s.stepId)
  const o2 = validatePlan(plan, snap).steps.map(s => s.stepId)
  assert.deepEqual(o1, o2, '两次运行顺序逐字节一致')
  assert.equal(o1.indexOf('s1'), 0, 's1 必须排在 s2 前')
  assert.ok(o1.indexOf('s1') < o1.indexOf('s2'))
}

// ===== CMP-DAG-02 环 s1<->s2 + 独立 s3：环成员全拒，s3 照常入序 =====
{
  const v = validatePlan([
    { stepId: 's1', title: '环1', action: { op: 'task.update', id: 't-1', patch: { progress: 1 } }, needs: ['s2'] },
    { stepId: 's2', title: '环2', action: { op: 'task.update', id: 't-2', patch: { progress: 2 } }, needs: ['s1'] },
    { stepId: 's3', title: '独立', action: { op: 'task.update', id: 't-3', patch: { progress: 3 } }, needs: [] },
  ], snap)
  assert.deepEqual(v.steps.map(s => s.stepId), ['s3'])
  assert.equal(v.rejected.length, 2)
  assert.ok(v.rejected.every(r => /依赖/.test(r.reason)), '拒绝原因应提及依赖无法解析')
}

// ===== CMP-DAG-03 悬空 needs sx -> s3 拒，依赖 s3 的 s4 级联拒，独立步照常 =====
{
  const v = validatePlan([
    { stepId: 's3', title: '悬空', action: { op: 'task.update', id: 't-3', patch: { progress: 3 } }, needs: ['sx'] },
    { stepId: 's4', title: '级联', action: { op: 'task.update', id: 't-4', patch: { progress: 4 } }, needs: ['s3'] },
    { stepId: 's1', title: '独立', action: { op: 'task.update', id: 't-1', patch: { progress: 1 } }, needs: [] },
  ], snap)
  assert.deepEqual(v.steps.map(s => s.stepId), ['s1'])
  assert.equal(v.rejected.length, 2)
}

// ===== CMP-DAG-04 自指 s1.needs=[s1] -> 拒，其余独立步照常 =====
{
  const v = validatePlan([
    { stepId: 's1', title: '自指', action: { op: 'task.update', id: 't-1', patch: { progress: 1 } }, needs: ['s1'] },
    { stepId: 's2', title: '独立', action: { op: 'task.update', id: 't-2', patch: { progress: 2 } }, needs: [] },
  ], snap)
  assert.deepEqual(v.steps.map(s => s.stepId), ['s2'])
  assert.equal(v.rejected.length, 1)
}

// ===== CMP-DAG-05 整份 9 步 -> 整份拒绝、一条不发、accepted=0 =====
{
  const nine = Array.from({ length: 9 }, (_, i) => ({
    stepId: `s${i + 1}`, title: `步${i + 1}`,
    action: { op: 'task.update', id: `t-${(i % 5) + 1}`, patch: { progress: i } }, needs: [],
  }))
  const v = validatePlan(nine, snap)
  assert.equal(v.steps.length, 0, '>8 步必须整份拒绝、不发任何步')
  assert.ok(v.rejected.some(r => /计划过大|≤8|8 步/.test(r.reason)), '文案应引导拆小')
}

// ===== CMP-DAG-06 8 步但触及 11 个不同 taskId -> 整份拒绝（任务数>10 护栏） =====
{
  const eight = Array.from({ length: 8 }, (_, i) => ({
    stepId: `s${i + 1}`, title: `步${i + 1}`,
    action: { op: 'task.update', id: `tx-${i + 1}`, patch: { progress: i } }, needs: [],
  }))
  // 8 步里前 8 个不同任务 + 额外凑到 11：补两步不同任务（共 10 步但 11 任务），任务数护栏触发
  eight.push(
    { stepId: 's9', title: 'x', action: { op: 'task.update', id: 'tx-9', patch: { progress: 9 } }, needs: [] },
    { stepId: 's10', title: 'y', action: { op: 'task.update', id: 'tx-10', patch: { progress: 10 } }, needs: [] },
  )
  const snap11 = { taskIds: Array.from({ length: 11 }, (_, i) => `tx-${i + 1}`) }
  const v = validatePlan(eight, snap11)
  assert.equal(v.steps.length, 0, '触及 >10 任务必须整份拒绝')
  assert.ok(v.rejected.some(r => /任务|计划过大/.test(r.reason)))
}

// ===== CMP-DAG-07 8 步且触及 ≤10 任务（边界）-> 通过预算护栏正常入序 =====
{
  const eight = Array.from({ length: 8 }, (_, i) => ({
    stepId: `s${i + 1}`, title: `步${i + 1}`,
    action: { op: 'task.update', id: `t-${(i % 5) + 1}`, patch: { progress: i } }, needs: [],
  }))
  const v = validatePlan(eight, snap)
  assert.equal(v.rejected.length, 0, '8 步/≤10 任务不应触发预算护栏')
  assert.equal(v.steps.length, 8)
}

// ===== CMP-ACTION-01 task.delete/create/move -> 拒、不进可勾选 =====
{
  const v = validatePlan([
    { stepId: 's1', title: '删', action: { op: 'task.delete', id: 't-1' }, needs: [] },
    { stepId: 's2', title: '正常', action: { op: 'task.update', id: 't-2', patch: { progress: 1 } }, needs: [] },
  ], snap)
  assert.equal(v.steps.length, 1)
  assert.match(v.rejected[0].reason, /不允许的操作 task.delete/)
}

// ===== CMP-ACTION-02 逐字段非法复用 v0.5 校验，非法步不拖合法步 =====
{
  const v = validatePlan([
    { stepId: 'a', title: 'doing', action: { op: 'task.update', id: 't-1', patch: { status: 'doing' } }, needs: [] },
    { stepId: 'b', title: '进度200', action: { op: 'task.update', id: 't-1', patch: { progress: 200 } }, needs: [] },
    { stepId: 'c', title: '坏日期', action: { op: 'task.update', id: 't-1', patch: { dueDate: '2026-02-30' } }, needs: [] },
    { stepId: 'd', title: '未知字段', action: { op: 'task.update', id: 't-1', patch: { foo: 1 } }, needs: [] },
    { stepId: 'e', title: '空patch', action: { op: 'task.update', id: 't-1', patch: {} }, needs: [] },
    { stepId: 'ok', title: '合法', action: { op: 'task.update', id: 't-2', patch: { progress: 5 } }, needs: [] },
  ], snap)
  assert.equal(v.steps.length, 1)
  assert.equal(v.rejected.length, 5)
  assert.match(v.rejected.find(r => r.reason.includes('非法状态'))?.reason ?? '', /非法状态/)
}

// ===== CMP-ACTION-03 start>due 拒；正常区间放行 =====
{
  const bad = validatePlan([
    { stepId: 'a', title: '倒挂', action: { op: 'task.update', id: 't-1', patch: { startDate: '2026-12-01', dueDate: '2026-10-01' } }, needs: [] },
  ], snap)
  assert.equal(bad.steps.length, 0)
  assert.match(bad.rejected[0].reason, /开始日期不得晚于/)
  const ok = validatePlan([
    { stepId: 'a', title: '正常区间', action: { op: 'task.update', id: 't-1', patch: { startDate: '2026-10-01', dueDate: '2026-12-01' } }, needs: [] },
  ], snap)
  assert.equal(ok.steps.length, 1)
}

// ===== CMP-CHAIN-01 同目标两步：无论模型怎么写 needs，按数组先后强制串行 =====
{
  const ordered = orderPlanSteps([
    { stepId: 's1', title: '先', action: { op: 'task.update', id: 't-1', patch: { assignee: '甲' } }, needs: [] },
    { stepId: 's2', title: '后', action: { op: 'task.update', id: 't-1', patch: { status: 'done' } }, needs: [] },
  ])
  assert.deepEqual(ordered.map(s => s.stepId), ['s1', 's2'], '同 task 必须按数组先后串行')
}

// ===== forStepwiseApply：返回 needs 清空的浅拷贝，不改原对象 =====
{
  const orig = { stepId: 's1', title: 'x', reason: 'r', action: { op: 'task.update', id: 't-1', patch: { status: 'done' } }, needs: ['s0'] }
  const one = forStepwiseApply(orig)
  assert.deepEqual(one.needs, [], '逐步发送体 needs 必须清空')
  assert.equal(one.op, 'task.update')
  assert.equal(one.id, 't-1')
  assert.deepEqual(one.patch, { status: 'done' })
  assert.deepEqual(orig.needs, ['s0'], '不得改动原 step')
  assert.notEqual(one.patch, orig.action.patch, 'patch 应是浅拷贝')
}

console.log('verify-copilot-plan OK（解析/兼容/DAG/环/悬空/预算/同目标串行/白名单/逐步剥needs）')
