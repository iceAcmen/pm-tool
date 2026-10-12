import assert from 'node:assert'
import { dateRange, shiftDatesByDrag, barGeometry, todayOffset, daysFrom } from '../lib/core/gantt.js'

// 日期范围
const r = dateRange([
  { startDate: '2026-10-01', dueDate: '2026-10-10' },
  { startDate: '2026-10-20', targetDate: '2026-10-20' },
])
assert.equal(r.start, '2026-09-28') // pad 3 天
assert.equal(r.end, '2026-10-23')
assert.equal(dateRange([]), null)

// bar geometry
const g = barGeometry({ id: 't1', startDate: '2026-10-01', dueDate: '2026-10-03' }, '2026-09-28', 25)
assert.deepEqual(g, { leftDays: 3, widthDays: 3 })
assert.equal(barGeometry({ id: 'x' }, '2026-09-28', 25), null) // 缺日期

// today line
assert.equal(todayOffset('2026-09-28', '2026-10-04'), 6)

// 拖拽平移：每天 16px，拖 32px = +2 天
const shifted = shiftDatesByDrag('2026-10-01', '2026-10-03', 32, 16)
assert.deepEqual(shifted, { startDate: '2026-10-03', dueDate: '2026-10-05' })

// 负拖
const back = shiftDatesByDrag('2026-10-01', '2026-10-03', -16, 16)
assert.deepEqual(back, { startDate: '2026-09-30', dueDate: '2026-10-02' })

// 非法区间钳制（极小 delta 不移不破坏 start<=due）
const clamp = shiftDatesByDrag('2026-10-01', '2026-10-01', 0, 16)
assert.ok(clamp.startDate <= clamp.dueDate)

console.log('verify-gantt OK')
