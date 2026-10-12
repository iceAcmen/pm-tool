import assert from 'node:assert'
import { resolveRecordLocation, findRecord } from '../lib/core/record-location.js'

// 各类型映射
assert.deepEqual(resolveRecordLocation('task'), { view: 'tasks', drawerKind: 'task' })
assert.deepEqual(resolveRecordLocation('milestone'), { view: 'milestones', drawerKind: 'milestone' })
assert.deepEqual(resolveRecordLocation('risk'), { view: 'risk-issues', drawerKind: 'risk-issue' })
assert.deepEqual(resolveRecordLocation('meeting'), { view: 'meetings', drawerKind: 'meeting' })
assert.deepEqual(resolveRecordLocation('report'), { view: 'reports', drawerKind: 'report' })
assert.deepEqual(resolveRecordLocation('deliverable'), { view: 'deliverables', drawerKind: 'deliverable' })
assert.equal(resolveRecordLocation('unknown'), null)

// findRecord：命中 / 缺失回退 / 跨类型不误配
const snap = { tasks: [{ id: 't-1', projectId: 'p-1', title: 'x' }], meetings: [{ id: 'm-1', projectId: 'p-1' }] }
assert.equal(findRecord(snap, 'task', 't-1').record.title, 'x')
assert.equal(findRecord(snap, 'meeting', 'm-1').record.id, 'm-1')
assert.equal(findRecord(snap, 'task', 'nope'), null)        // 缺失回退
assert.equal(findRecord(snap, 'meeting', 't-1'), null)       // 跨类型不误配
assert.equal(findRecord(snap, 'bogus', 't-1'), null)

console.log('verify-record-location OK')
