import assert from 'node:assert'
import {
  dateRange, shiftDatesByDrag, barGeometry, todayOffset, daysFrom,
  progressRatio, barLabelPolicy, shortDate, dependencyEdges,
  parentBarRange, milestoneOffset, taskDurationDays,
} from '../lib/core/gantt.js'

// ---------- 既有口径（v0.7.1 回归） ----------
// 日期范围
const r = dateRange([
  { startDate: '2026-10-01', dueDate: '2026-10-10' },
  { startDate: '2026-10-20', targetDate: '2026-10-20' },
])
assert.equal(r.start, '2026-09-28') // pad 3 天
assert.equal(r.end, '2026-10-23')
assert.equal(dateRange([]), null)

// bar geometry：最小宽度 1 天（GI-PURE-01）
const g = barGeometry({ id: 't1', startDate: '2026-10-01', dueDate: '2026-10-03' }, '2026-09-28', 25)
assert.deepEqual(g, { leftDays: 3, widthDays: 3 })
assert.equal(barGeometry({ id: 'x' }, '2026-09-28', 25), null) // 缺日期
// GI-PURE-01：单日任务不退化 0 宽
const single = barGeometry({ id: 's', startDate: '2026-10-01', dueDate: '2026-10-01' }, '2026-09-28', 25)
assert.deepEqual(single, { leftDays: 3, widthDays: 1 })

// GI-PURE-02：仅一条日期 → 未排期分支，不出条、不抛 NaN
assert.equal(barGeometry({ id: 'a', startDate: '2026-10-01' }, '2026-09-28', 25), null)
assert.equal(barGeometry({ id: 'b', dueDate: '2026-10-01' }, '2026-09-28', 25), null)

// today line（GI-PURE-09 边界由渲染层钳制，这里验证偏移口径）
assert.equal(todayOffset('2026-09-28', '2026-10-04'), 6)

// 拖拽平移：每天 16px，拖 32px = +2 天（GI-PURE-08：只含 start/due 两键）
const shifted = shiftDatesByDrag('2026-10-01', '2026-10-03', 32, 16)
assert.deepEqual(shifted, { startDate: '2026-10-03', dueDate: '2026-10-05' })
assert.deepEqual(Object.keys(shifted).sort(), ['dueDate', 'startDate'])

// 负拖
const back = shiftDatesByDrag('2026-10-01', '2026-10-03', -16, 16)
assert.deepEqual(back, { startDate: '2026-09-30', dueDate: '2026-10-02' })

// 非法区间钳制（极小 delta 不移不破坏 start<=due）
const clamp = shiftDatesByDrag('2026-10-01', '2026-10-01', 0, 16)
assert.ok(clamp.startDate <= clamp.dueDate)

// ---------- 本轮增强（GI-PURE-03/04/05/06/07 + 里程碑无 NaN） ----------

// GI-PURE-03：进度比例 = progress/100；done 与 100 等价完成态
assert.equal(progressRatio(0, 'todo'), 0)
assert.equal(progressRatio(50, 'todo'), 0.5)
assert.equal(progressRatio(100, 'todo'), 1)
assert.equal(progressRatio(30, 'done'), 1)
assert.equal(progressRatio(undefined, 'todo'), 0)
assert.equal(progressRatio(150, 'todo'), 1) // 超界钳制

// GI-PURE-06：窄条三态决策（PX=16）——条内 / 条右侧外置 / 仅 tooltip
assert.equal(barLabelPolicy(1, 16), 'hidden')   // 单日 16px：不硬塞
assert.equal(barLabelPolicy(3, 16), 'outside')   // 48px：外置
assert.equal(barLabelPolicy(10, 16), 'inside')  // 160px：条内
// 决策确定：同输入两次一致
assert.equal(barLabelPolicy(2, 16), barLabelPolicy(2, 16))

// 短日期格式（条内/外置用 MM-DD）
assert.equal(shortDate('2026-10-05'), '10-05')

// GI-PURE-04：FS 依赖边几何（A.dueDate 右缘 → B.startDate 左缘）
// 轴起点 2026-09-28，PX=16：A 10-01~10-03 → leftDays 3、width 3 → 右缘第 6 天 = 96px；
// B 10-05~10-08 → leftDays 7 = 112px。行高 24，圆心 y = idx*24+12。
const A = { id: 'A', startDate: '2026-10-01', dueDate: '2026-10-03' }
const B = { id: 'B', startDate: '2026-10-05', dueDate: '2026-10-08', predecessorIds: ['A'] }
const rep = dependencyEdges([A, B], '2026-09-28', 16)
assert.equal(rep.edges.length, 1)
assert.equal(rep.edges[0].fromId, 'A')
assert.equal(rep.edges[0].toId, 'B')
assert.equal(rep.edges[0].x1, 96)  // A 条右缘
assert.equal(rep.edges[0].x2, 112) // B 条左缘
assert.equal(rep.edges[0].y1, 12)
assert.equal(rep.edges[0].y2, 36)

// GI-PURE-05：自指 / 悬空 / 成环 → 不画边、不递归死循环、降级结构而非抛异常
const rep2 = dependencyEdges([
  { id: 'S', startDate: '2026-10-01', dueDate: '2026-10-03', predecessorIds: ['S'] },
  { id: 'D', startDate: '2026-10-01', dueDate: '2026-10-03', predecessorIds: ['ghost'] },
  { id: 'C1', startDate: '2026-10-01', dueDate: '2026-10-03', predecessorIds: ['C2'] },
  { id: 'C2', startDate: '2026-10-05', dueDate: '2026-10-08', predecessorIds: ['C1'] },
], '2026-09-28', 16)
assert.equal(rep2.edges.length, 0)
assert.equal(rep2.skipped.selfLoop, 1)
assert.equal(rep2.skipped.dangling, 1)
assert.equal(rep2.skipped.cycle, 2)

// GI-PURE-05：缺日期 → missingDate 降级，不画半空边
const rep3 = dependencyEdges([
  { id: 'X', startDate: '2026-10-01', predecessorIds: ['Y'] }, // 缺 dueDate
  { id: 'Y', startDate: '2026-10-01', dueDate: '2026-10-03' },
], '2026-09-28', 16)
assert.equal(rep3.edges.length, 0)
assert.equal(rep3.skipped.missingDate, 1)

// GI-PURE-07：父条只读派生 = 子 min(start)~max(due)；无排期子任务 → null
const pr = parentBarRange([
  { startDate: '2026-10-01', dueDate: '2026-10-03' },
  { startDate: '2026-10-05', dueDate: '2026-10-08' },
])
assert.deepEqual(pr, { start: '2026-10-01', end: '2026-10-08' })
assert.equal(parentBarRange([{ startDate: '2026-10-01' }]), null)
assert.equal(parentBarRange([]), null)

// GI-PURE-11 / 无日期里程碑：返回 null，绝不 NaN
assert.equal(milestoneOffset({ targetDate: undefined }, '2026-09-28'), null)
assert.equal(milestoneOffset({}, '2026-09-28'), null)
assert.equal(milestoneOffset({ targetDate: '2026-10-01' }, '2026-09-28'), 3)

// 工期（ARIA 用）：含端点，单日 = 1
assert.equal(taskDurationDays('2026-10-01', '2026-10-03'), 3)
assert.equal(taskDurationDays('2026-10-01', '2026-10-01'), 1)

// 反向/重叠边：A 在 B 之后排期但 B 依赖 A（x1 > x2）——仍画边，几何可由两端点确定
// 轴 2026-09-28，PX=16：A 10-05~10-08 → 右缘 (10+1)*16=176；B 10-01~10-03 → 左缘 3*16=48
const repRev = dependencyEdges([
  { id: 'A', startDate: '2026-10-05', dueDate: '2026-10-08' },
  { id: 'B', startDate: '2026-10-01', dueDate: '2026-10-03', predecessorIds: ['A'] },
], '2026-09-28', 16)
assert.equal(repRev.edges.length, 1)
assert.equal(repRev.edges[0].fromId, 'A')
assert.equal(repRev.edges[0].toId, 'B')
assert.equal(repRev.edges[0].x1, 176)
assert.equal(repRev.edges[0].x2, 48) // x1 > x2：反向不丢边，终点由渲染层贴到箭头基座

// GI-PURE-11：空输入不抛异常
assert.deepEqual(dependencyEdges([], '2026-09-28', 16), {
  edges: [], skipped: { selfLoop: 0, dangling: 0, cycle: 0, missingDate: 0 }, cycleTaskIds: [],
})

console.log('verify-gantt OK')
