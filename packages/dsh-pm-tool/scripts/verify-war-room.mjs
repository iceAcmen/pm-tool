import assert from 'node:assert'
import { computeKPI, buildAgenda, groupRiskMatrix, matrixCell } from '../lib/core/war-room.js'

const today = '2026-10-12'
// KPI
const tasks = [
  { id: 't1', projectId: 'p1', status: 'done', progress: 100 },
  { id: 't2', projectId: 'p1', status: 'doing', progress: 30, dueDate: '2026-10-01' }, // 逾期
  { id: 't3', projectId: 'p1', status: 'todo', progress: 0, dueDate: '2026-10-15' },  // 临期
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
