import assert from 'node:assert'
import { nextStatus, clampProgress, cleanDate, buildUpdate } from '../lib/core/task-inline.js'

assert.equal(nextStatus('todo'), 'doing')
assert.equal(nextStatus('doing'), 'done')
assert.equal(nextStatus('done'), 'todo')
assert.equal(nextStatus('bogus'), 'todo') // 非法值回 todo

assert.equal(clampProgress(0), 0)
assert.equal(clampProgress(55), 55)
assert.equal(clampProgress(150), 100)
assert.equal(clampProgress(-5), 0)
assert.equal(clampProgress('33'), 33)
assert.equal(clampProgress('x'), 0)

assert.equal(cleanDate('2026-10-20'), '2026-10-20')
assert.equal(cleanDate(''), null)
assert.equal(cleanDate('2026/10/20'), null)
assert.equal(cleanDate(null), null)

// buildUpdate 合法/空字段过滤
assert.deepEqual(buildUpdate({ status: 'done' }), { status: 'done' })
assert.deepEqual(buildUpdate({ progress: 100 }), { progress: 100, status: 'done' })
assert.deepEqual(buildUpdate({ progress: 80 }), { progress: 80 })
assert.deepEqual(buildUpdate({ dueDate: '2026-11-01' }), { dueDate: '2026-11-01' })
assert.deepEqual(buildUpdate({ progress: '', dueDate: 'bad' }), {})
assert.deepEqual(buildUpdate({ status: 'x' }), {})

console.log('verify-task-inline OK')
