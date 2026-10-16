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

// ---------- routeEdge：FS 连线（normal / tight / overlap），箭头尖落 B 左缘、通道不压 marker ----------

// 最小 SVG path 采样器（仅 M/L/H/V/Q），用于"不穿条"硬断言。
function interpLine(list, ax, ay, bx, by, n = 26) {
  for (let s = 0; s <= n; s++) { const t = s / n; list.push([ax + (bx - ax) * t, ay + (by - ay) * t]) }
}
function samplePath(d) {
  const tokens = d.replace(/([MLHVQ])/g, ' $1').trim().split(/\s+/g)
  const list = []
  let x = 0, y = 0, prev = null
  for (let i = 0; i < tokens.length; ) {
    const c = tokens[i]
    if ('MLHVQ'.includes(c)) { prev = c; i++ }
    if (prev === 'M') { x = +tokens[i]; y = +tokens[i + 1]; i += 2; list.push([x, y]) }
    else if (prev === 'L') { const nx = +tokens[i], ny = +tokens[i + 1]; i += 2; interpLine(list, x, y, nx, ny); x = nx; y = ny }
    else if (prev === 'H') { const nx = +tokens[i]; i += 1; interpLine(list, x, y, nx, y); x = nx }
    else if (prev === 'V') { const ny = +tokens[i]; i += 1; interpLine(list, x, y, x, ny); y = ny }
    else if (prev === 'Q') {
      const qx = +tokens[i], qy = +tokens[i + 1], ex = +tokens[i + 2], ey = +tokens[i + 3]; i += 4
      for (let s = 0; s <= 30; s++) { const t = s / 30, mt = 1 - t
        list.push([mt * mt * x + 2 * mt * t * qx + t * t * ex, mt * mt * y + 2 * mt * t * qy + t * t * ey]) }
      x = ex; y = ey
    }
  }
  return list
}

const ARROW_CLEAR = 8 // 与 routeEdge 默认一致
const BAR_HALF = 6    // 条体纵向半高（y±6）
// 非重叠 FS 不变量：箭头段 ≥8、通道 ≤ x2-6、不穿条、尖落 B 左缘、纯函数。
function assertFS(label, edge, opts) {
  const res = routeEdge(edge, opts)
  const { x1, y1, x2, y2 } = edge
  assert.equal(res.endX, x2, `${label}：箭头尖落 B 左缘 x2`)
  assert.equal(res.endY, y2, `${label}：endY=y2`)
  assert.ok(res.d.startsWith(`M ${r1(x1)} ${r1(y1)}`), `${label}：自 A 右缘出发`)
  assert.ok(res.d.endsWith(`H ${r1(x2)}`), `${label}：路径止于 B 左缘（箭头前的水平段）`)
  assert.ok(!res.d.includes('NaN') && !res.d.includes('Infinity'), `${label}：path 无 NaN/Infinity`)
  // 箭头段与通道不压 marker
  assert.ok(x2 - res.channelX >= ARROW_CLEAR,
    `${label}：箭头段 x2-ch=${x2 - res.channelX} 应 ≥ ${ARROW_CLEAR}（通道不压三角）`)
  assert.ok(res.channelX <= x2 - 6,
    `${label}：通道 ch=${res.channelX} 应 ≤ x2-6=${x2 - 6}（marker 三角占 x2-5~x2+1）`)
  // 不穿条：A 条纵向范围内 x≥x1；B 条纵向范围内 x≤x2（0.5 容差吃圆角子像素）
  const pts = samplePath(res.d)
  for (const [px, py] of pts) {
    if (Math.abs(py - y1) <= BAR_HALF) assert.ok(px >= x1 - 0.5, `${label}：穿 A 条 at (${px},${py})`)
    if (Math.abs(py - y2) <= BAR_HALF) assert.ok(px <= x2 + 0.5, `${label}：穿 B 条 at (${px},${py})`)
  }
  return res
}
const r1 = n => Math.round(n * 10) / 10

// 短间隙矩阵：日 PX=16 / 周 PX=11 / 月 PX=7；行差 28（相邻行）。
const dy = 28
const cases = [
  { label: 'gap=0 紧贴（结束次日=开始，日）', edge: { x1: 100, y1: 12, x2: 100, y2: 40, bRight: 150 }, kind: 'tight' },
  { label: 'gap=7 月粒度 1 天（<8）', edge: { x1: 100, y1: 12, x2: 107, y2: 40, bRight: 180 }, kind: 'tight' },
  { label: 'gap=8 边界（case2）', edge: { x1: 100, y1: 12, x2: 108, y2: 40, bRight: 160 }, kind: 'tight' },
  { label: 'gap=11 周粒度 1 天（[8,14)）', edge: { x1: 100, y1: 12, x2: 111, y2: 40, bRight: 170 }, kind: 'tight' },
  { label: 'gap=13（case2 上限）', edge: { x1: 100, y1: 12, x2: 113, y2: 40, bRight: 172 }, kind: 'tight' },
  { label: 'gap=14 边界（case1）', edge: { x1: 100, y1: 12, x2: 114, y2: 40, bRight: 172 }, kind: 'normal' },
  { label: 'gap=16 日粒度 1 天（≥14）', edge: { x1: 100, y1: 12, x2: 116, y2: 40, bRight: 176 }, kind: 'normal' },
  { label: 'gap=32 日粒度 2 天', edge: { x1: 100, y1: 12, x2: 132, y2: 40, bRight: 192 }, kind: 'normal' },
]
for (const c of cases) {
  const res = assertFS(c.label, c.edge)
  assert.equal(res.kind, c.kind, `${c.label}：kind 应=${c.kind}`)
}

// 上行（B 在 A 上方）gap=0 / gap=16：通道与箭头段不变量同样成立。
assertFS('上行 gap=0', { x1: 100, y1: 40, x2: 100, y2: 12, bRight: 150 })
assertFS('上行 gap=16', { x1: 100, y1: 40, x2: 116, y2: 12, bRight: 176 })

// 多行（dy=56）gap=0 小凹形：t1 受 8 封顶，凹形纵向更舒展。
const far = assertFS('gap=0 隔两行', { x1: 100, y1: 12, x2: 100, y2: 68, bRight: 150 })
assert.equal(far.kind, 'tight')

// ---------- 轻度重叠/衔接（-2*pxPerDay ≤ gap < 0，A.due=B.start 当天重叠）→ 行间小凹形 ----------
// 与紧贴同形状：ch=x2-8、箭头朝右落 B 左缘；绝不走严重 overlap 大 U。
// 日 PX=16：gap=-16（重叠 1 天，A.due=B.start）/ gap=-32（重叠 2 天，边界）。
const lot1 = assertFS('轻度重叠 gap=-16（A.due=B.start，日）',
  { x1: 100, y1: 12, x2: 84, y2: 40, bRight: 130 }, { pxPerDay: 16 })
assert.equal(lot1.kind, 'overlap-tight', '轻度重叠必须是 overlap-tight，不得误入 overlap 大 U')
assert.ok(lot1.channelX < lot1.endX, '通道 ch 必须在 B 左缘左侧')
assert.ok(lot1.channelX <= 84 - 6, `通道 ch=${lot1.channelX} 应 ≤ x2-6`)
// 水平左移段（H ch，恰好 y=y1+t1=20）必须落在行间空隙，不压 A/B 条纵向带
const hSeg = samplePath(lot1.d).filter(([, py]) => Math.abs(py - 20) < 0.5)
assert.ok(hSeg.length > 1, '应存在水平左移段')
for (const [px, py] of hSeg) {
  assert.ok(!(Math.abs(py - 12) <= BAR_HALF), `左移段压 A 条 at (${px},${py})`)
  assert.ok(!(Math.abs(py - 40) <= BAR_HALF), `左移段压 B 条 at (${px},${py})`)
}

const lot2 = assertFS('轻度重叠 gap=-32（重叠 2 天边界，日）',
  { x1: 100, y1: 12, x2: 68, y2: 40, bRight: 114 }, { pxPerDay: 16 })
assert.equal(lot2.kind, 'overlap-tight')

// 上行（B 在 A 上方）轻度重叠对称成立。
const lotUp = assertFS('上行 轻度重叠 gap=-16',
  { x1: 100, y1: 40, x2: 84, y2: 12, bRight: 130 }, { pxPerDay: 16 })
assert.equal(lotUp.kind, 'overlap-tight')

// 周/月粒度阈值同步（pxPerDay=11/7）：-2PX 边界判定正确。
const wk1 = routeEdge({ x1: 100, y1: 12, x2: 89, y2: 40, bRight: 130 }, { pxPerDay: 11 }) // gap=-11 ≥ -22
assert.equal(wk1.kind, 'overlap-tight', '周粒度重叠 1 天应判轻度')
const wkSev = routeEdge({ x1: 100, y1: 12, x2: 60, y2: 40, bRight: 110 }, { pxPerDay: 11 }) // gap=-40 < -22
assert.equal(wkSev.kind, 'overlap', '周粒度重叠 >2 天应走严重走廊')
const mo1 = routeEdge({ x1: 100, y1: 12, x2: 93, y2: 40, bRight: 130 }, { pxPerDay: 7 })   // gap=-7 ≥ -14
assert.equal(mo1.kind, 'overlap-tight', '月粒度重叠 1 天应判轻度')
const moSev = routeEdge({ x1: 100, y1: 12, x2: 80, y2: 40, bRight: 120 }, { pxPerDay: 7 })   // gap=-20 < -14
assert.equal(moSev.kind, 'overlap', '月粒度重叠 >2 天应走严重走廊')

// overlap（x2<x1）：右侧安全走廊，箭头落 B 右缘朝左。
const ov = routeEdge({ x1: 176, y1: 12, x2: 48, y2: 40, bRight: 96 })
assert.equal(ov.kind, 'overlap')
assert.ok(ov.channelX > Math.max(176, 96), `重叠走廊必须在两端条缘之外：${ov.channelX}`)
assert.equal(ov.endX, 96, '箭头落 B 右缘')
assert.ok(ov.d.startsWith('M 176 12') && ov.d.endsWith('H 96'), '折返后止于 B 右缘')
const ovPts = samplePath(ov.d)
for (const [px, py] of ovPts) {
  // A 条（y1=12，止于 x1=176）：路径从右缘出发向右，x≥x1。
  if (Math.abs(py - 12) <= BAR_HALF) assert.ok(px >= 176 - 0.5, `overlap 穿 A：${px},${py}`)
  // B 条（y2=40，x∈[48,96]）：路径在右侧走廊（x≥bRight），最后从右缘进入，x≥bRight。
  if (Math.abs(py - 40) <= BAR_HALF) assert.ok(px >= 96 - 0.5, `overlap 穿 B：${px},${py}`)
}
// 重叠错峰：lane 越大走廊越右。
assert.ok(routeEdge({ x1: 176, y1: 12, x2: 48, y2: 40, bRight: 96 }, { lane: 2 }).channelX > ov.channelX)

// normal 错峰：lane 右移，放不下自动回退 lane=0（不越过 B 左缘）。
const wide = { x1: 0, y1: 12, x2: 200, y2: 40 }
const l0 = routeEdge(wide, { lane: 0 })
const l1 = routeEdge(wide, { lane: 1 })
const l2 = routeEdge(wide, { lane: 2 })
assert.ok(l0.channelX < l1.channelX && l1.channelX < l2.channelX, '错峰通道随 lane 右移')
assert.ok(l2.channelX <= 200 - 8, 'lane 放不下时回退，箭头段仍 ≥8')

// 同条（dy=0）：直接水平，不抛异常。
const same = routeEdge({ x1: 100, y1: 12, x2: 120, y2: 12, bRight: 170 })
assert.equal(same.d, 'M 100 12 H 120')

// 确定性：同输入 path 逐字符一致。
assert.equal(routeEdge({ x1: 100, y1: 12, x2: 100, y2: 40, bRight: 150 }).d,
             routeEdge({ x1: 100, y1: 12, x2: 100, y2: 40, bRight: 150 }).d)
// bRight 缺省（overlap 近似）不抛异常。
assert.ok(Number.isFinite(routeEdge({ x1: 176, y1: 12, x2: 48, y2: 40 }).channelX))

console.log('verify-gantt OK')
