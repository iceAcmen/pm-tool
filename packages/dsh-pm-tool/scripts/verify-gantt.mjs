import assert from 'node:assert'
import {
  dateRange, shiftDatesByDrag, barGeometry, todayOffset, daysFrom,
  progressRatio, progressFill, barLabelPolicy, shortDate, dependencyEdges,
  parentBarRange, milestoneOffset, taskDurationDays, routeEdge,
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

// GI-PURE-03：legacy 口径 progressRatio（v0.8 起 @deprecated 冻结，阶段三删除前行为不变）
assert.equal(progressRatio(0, 'todo'), 0)
assert.equal(progressRatio(50, 'todo'), 0.5)
assert.equal(progressRatio(100, 'todo'), 1)
assert.equal(progressRatio(30, 'done'), 1)
assert.equal(progressRatio(undefined, 'todo'), 0)
assert.equal(progressRatio(150, 'todo'), 1) // 超界钳制

// v0.8 progressFill：只认真源 TaskProgress.value；null（无填充）与 0（0% 填充）严格区分
const tp = (value) => ({
  value, source: value === null ? 'none' : 'checklist', checklist: null,
  coverage: { coveredLeaves: 0, totalLeaves: 0 }, pendingAcceptance: false,
  pendingAcceptanceCount: 0, legacyProgress: null, warnings: [],
})
assert.equal(progressFill(tp(0)), 0)        // 0 → 0 填充，显示 0%
assert.equal(progressFill(tp(50)), 0.5)
assert.equal(progressFill(tp(100)), 1)      // 全勾=100%
assert.equal(progressFill(tp(150)), 1)      // 超界钳制
assert.equal(progressFill(tp(null)), null)  // null → 无填充（不画实心、不显示百分比）
// 关键红线：done 但无清单信号（value=null）→ 仍无填充，绝不伪造 100%
assert.equal(progressFill(tp(null)), null)

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

// ---------- routeEdge：FS 依赖连线路由（紧贴 / 正常 / 重叠 三类，确定性纯函数） ----------

// 1) 紧贴型 FS（A 结束次日即 B 开始，gap=4 < tightPx=8）：短 L 形，
//    垂直通道必须落在间隙 (x1, x2) 内——不压 A（止于 x1）、不穿 B（起于 x2）。
const tight = routeEdge({ x1: 100, y1: 12, x2: 104, y2: 36, bRight: 154 })
assert.equal(tight.kind, 'tight')
assert.ok(100 < tight.channelX && tight.channelX < 104, `紧贴通道应在间隙内：${tight.channelX}`)
assert.equal(tight.endX, 104) // 箭头落 B 左缘
assert.equal(tight.endY, 36)
assert.ok(tight.d.startsWith('M 100 12'), '路径应自 A 右缘出发')
assert.ok(tight.d.endsWith('H 104'), '路径应止于 B 左缘')
assert.ok(tight.d.includes('Q 102 12 102 14'), '紧贴应圆角折角（间隙内安全通道，钳制不越界）')

// 2) 正常 FS（gap=64 >= tightPx）：标准 L 形，通道自 A 右缘探出短 stub。
const norm = routeEdge({ x1: 96, y1: 12, x2: 160, y2: 36, bRight: 200 })
assert.equal(norm.kind, 'normal')
assert.ok(96 < norm.channelX && norm.channelX < 160, `正常通道应在间隙内：${norm.channelX}`)
assert.equal(norm.endX, 160)
assert.ok(norm.d.includes('V 29'), '正常 L 应含垂直段（y 自 12 下行到 36，圆角半径 7）')

// 上行边（B 在 A 上方）：垂直段方向随符号，关键节点顺序不变。
const up = routeEdge({ x1: 96, y1: 36, x2: 160, y2: 12, bRight: 200 })
assert.equal(up.kind, 'normal')
assert.ok(up.d.includes('Q 128 36 128 29'), '上行边圆角应朝上方（sy=-1）')

// 3) 重叠型（x2 < x1，前置结束晚于后置开始）：绕行到右侧安全走廊，不穿条。
//    A 右缘 176（行0 y=12），B 左缘 48 / 右缘 96（行1 y=36）。
const ov = routeEdge({ x1: 176, y1: 12, x2: 48, y2: 36, bRight: 96 })
assert.equal(ov.kind, 'overlap')
assert.ok(ov.channelX > 176 && ov.channelX > 96,
  `重叠走廊必须在两端条缘之外（右绕）：${ov.channelX}`)
assert.equal(ov.endX, 96) // 箭头落 B 条右缘、方向朝左指向后置
assert.equal(ov.endY, 36)
assert.ok(ov.d.startsWith('M 176 12'), '路径仍自 A 右缘出发')
assert.ok(ov.d.endsWith('H 96'), '路径折返后止于 B 右缘（朝左进入后置）')
assert.ok(ov.d.includes('V 29'), 'U 形走廊应含垂直段')

// 不穿条硬断言：重叠走廊 x 严格大于两端条缘，整条垂直段不会与任一任务条相交。
assert.ok(ov.channelX > Math.max(176, 96), '走廊必须在 max(x1,bRight) 之外')

// 4) 多线错峰：lane 越大走廊越右移，同输入同 lane 结果一致；宽间隙下通道不被钳死。
const wide = { x1: 0, y1: 0, x2: 200, y2: 24 }
const l0 = routeEdge(wide, { lane: 0 })
const l1 = routeEdge(wide, { lane: 1 })
const l2 = routeEdge(wide, { lane: 2 })
assert.ok(l0.channelX < l1.channelX && l1.channelX < l2.channelX,
  `错峰通道应随 lane 右移：${l0.channelX}/${l1.channelX}/${l2.channelX}`)
assert.ok(l2.channelX < 200, '错峰通道不得推出间隙压到 B 条上')
// 重叠边错峰同理
const ovLane = routeEdge({ x1: 176, y1: 12, x2: 48, y2: 36, bRight: 96 }, { lane: 2 })
assert.ok(ovLane.channelX > ov.channelX, '重叠走廊错峰应更靠右')

// 5) 确定性：同输入两次调用 path d 逐字符一致（无随机/无时间依赖）。
assert.deepEqual(routeEdge({ x1: 176, y1: 12, x2: 48, y2: 36, bRight: 96 }), ov)
assert.equal(routeEdge({ x1: 96, y1: 12, x2: 112, y2: 36 }).d,
             routeEdge({ x1: 96, y1: 12, x2: 112, y2: 36 }).d)

// 6) bRight 缺省回退不抛异常（调用方不传时按 x2+16 近似）。
const fb = routeEdge({ x1: 176, y1: 12, x2: 48, y2: 36 })
assert.equal(fb.kind, 'overlap')
assert.ok(Number.isFinite(fb.channelX) && Number.isFinite(fb.endX))

console.log('verify-gantt OK')
