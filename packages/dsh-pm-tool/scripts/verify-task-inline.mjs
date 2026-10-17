import assert from 'node:assert'
import { clampProgress, cleanDate, buildUpdate, parseProgressInput } from '../lib/core/task-inline.js'

// 当前契约：进度输入解析（旧 nextStatus 状态轮转已移除，不再测）。
// null/undefined/空串/非有限 → undefined（语义「不写该字段」）；合法 → 0..100 四舍五入整数。
assert.equal(parseProgressInput(null), undefined)
assert.equal(parseProgressInput(undefined), undefined)
assert.equal(parseProgressInput(''), undefined)
assert.equal(parseProgressInput('   '), undefined) // trim 空白
assert.equal(parseProgressInput(NaN), undefined)
assert.equal(parseProgressInput(Infinity), undefined)
assert.equal(parseProgressInput(0), 0)
assert.equal(parseProgressInput(55), 55)
assert.equal(parseProgressInput('33'), 33)
assert.equal(parseProgressInput(150), 100) // 超界钳制
assert.equal(parseProgressInput(-5), 0)

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
