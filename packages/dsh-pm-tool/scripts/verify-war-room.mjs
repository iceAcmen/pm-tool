import assert from 'node:assert'
import { computeKPI, buildAgenda, groupRiskMatrix, matrixCell } from '../lib/core/war-room.js'

const today = '2026-10-12'
// KPI（状态一律用 src/core/status.ts 真枚举：todo/in_progress/blocked/done）
const tasks = [
  { id: 't1', projectId: 'p1', status: 'done', progress: 100 },
  { id: 't2', projectId: 'p1', status: 'in_progress', progress: 30, dueDate: '2026-10-01' }, // 进行中+逾期
  { id: 't3', projectId: 'p1', status: 'todo', progress: 0, dueDate: '2026-10-15' },          // 未开始+临期
]
const ms = [{ id: 'm1', projectId: 'p1', status: 'open', targetDate: '2026-10-16' }]
const risks = [
  { id: 'r1', projectId: 'p1', status: 'open', probability: 'high', impact: 'high' },
  { id: 'r2', projectId: 'p1', status: 'closed', probability: 'high', impact: 'high' }, // 闭环排除
  { id: 'r3', projectId: 'p1', status: 'open', probability: 'low', impact: 'critical' }, // critical->high
]
const kpi = computeKPI(tasks, ms, risks, today)
assert.equal(kpi.total, 3)
assert.equal(kpi.doneRate, 33)
assert.equal(kpi.inProgress, 1)
assert.equal(kpi.overdueTasks, 1)
assert.equal(kpi.upcomingMilestones, 1)
assert.equal(kpi.openRisks, 2)

// 无数据
const empty = computeKPI([], [], [], today)
assert.equal(empty.doneRate, 0)

// 状态真源边界：todo/in_progress/blocked/done 枚举口径；
//   - inProgress 只认真枚举 'in_progress'，历史误写字面量 'doing' 不得计入（回归守卫）；
//   - done 口径保持原样：status==='done' 或 progress>=100（progress=100 为含边界）。
const b = computeKPI([
  { id: 'b-todo', projectId: 'p1', status: 'todo', progress: 0 },
  { id: 'b-doing1', projectId: 'p1', status: 'in_progress', progress: 50 },
  { id: 'b-doing2', projectId: 'p1', status: 'in_progress', progress: 80 },
  { id: 'b-blocked', projectId: 'p1', status: 'blocked', progress: 50 },
  { id: 'b-done', projectId: 'p1', status: 'done', progress: 0 },
  { id: 'b-p100', projectId: 'p1', status: 'todo', progress: 100 }, // progress 含边界即 done
  { id: 'b-bogus', projectId: 'p1', status: 'doing', progress: 50 },  // 非真枚举，不计 in_progress
], [], [], today)
assert.equal(b.total, 7)
assert.equal(b.doneRate, 29)   // done(b-done) + progress>=100(b-p100) = 2/7 ≈ 29%
assert.equal(b.inProgress, 2)  // 仅两个真枚举 in_progress；b-bogus 'doing' 不计

// Agenda：按日期升序，逾期在前
const agenda = buildAgenda(tasks, ms, today)
assert.deepEqual(agenda.map(a => a.id), ['t2', 't3', 'm1'])
assert.equal(agenda[0].overdue, true)

// 矩阵归格
assert.deepEqual(matrixCell('high', 'critical'), { row: 'high', col: 'high' })
assert.deepEqual(matrixCell('low', 'low'), { row: 'low', col: 'low' })
const cells = groupRiskMatrix(risks)
assert.deepEqual(cells['high/high'].map(r => r.id), ['r1'])
assert.deepEqual(cells['low/high'].map(r => r.id), ['r3'])
assert.ok(!cells['high/high']?.includes(risks[1])) // closed 排除

console.log('verify-war-room OK')
