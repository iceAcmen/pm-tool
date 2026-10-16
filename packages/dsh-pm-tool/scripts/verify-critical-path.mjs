/**
 * 关键路径 CPM 只读纯函数表驱动离线锁定（GI-CP-01~05 的 AUTO 部分）。
 *
 * 覆盖：
 *  - GI-CP-01 线性链 A→B→C 全排期：ES/EF/LS/LF/slack 正确，全在关键路径，关键边高亮；
 *  - GI-CP-02 成环 A→B→A：不崩溃/不无限递归，环上节点 inCycle 不高亮，不自动打断/改期；
 *  - GI-CP-03 链上缺日期：缺日期节点 missingDate 降级不高亮，边跳过，不自动补日期/顺延；
 *  - GI-CP-04 零写静态：core/gantt.ts 无 run(/execute(/fs 写命令串；
 *  - 确定性：同输入两次逐字节一致（全新进程由 verify-isolation 另行保证）；
 *  - 附带：并行时差分支非关键、多连通分量各自取组件终点、自指/悬空计数、空输入不抛。
 *
 * 纯函数无 I/O、无随机、无墙钟；本脚本不写任何业务数据。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { criticalPath } from '../lib/core/gantt.js'

const here = dirname(fileURLToPath(import.meta.url))

// ---------- GI-CP-01：线性链 A→B→C 全排期，另挂一条有时差的并行分支 D ----------
// A 10-01~10-03 工期3；B 10-05~10-08 工期4；C 10-10~10-11 工期2；
// D 10-01~10-02 工期2，前置 A（挂在 A 后、不接 B/C），应有正时差、不在关键路径。
const chain = criticalPath([
  { id: 'A', startDate: '2026-10-01', dueDate: '2026-10-03' },
  { id: 'B', startDate: '2026-10-05', dueDate: '2026-10-08', predecessorIds: ['A'] },
  { id: 'C', startDate: '2026-10-10', dueDate: '2026-10-11', predecessorIds: ['B'] },
  { id: 'D', startDate: '2026-10-01', dueDate: '2026-10-02', predecessorIds: ['A'] },
])
const nA = chain.nodes.A, nB = chain.nodes.B, nC = chain.nodes.C, nD = chain.nodes.D
// 正向：ES=0/EF=3，B ES=3/EF=7，C ES=7/EF=9
assert.equal(nA.es, 0); assert.equal(nA.ef, 3)
assert.equal(nB.es, 3); assert.equal(nB.ef, 7)
assert.equal(nC.es, 7); assert.equal(nC.ef, 9)
// 反向：组件最大 EF=9；C LF=9/LS=7/slack0；B LF=7/LS=3/slack0；A LF=3/LS=0/slack0
assert.equal(nC.lf, 9); assert.equal(nC.ls, 7); assert.equal(nC.slack, 0)
assert.equal(nB.lf, 7); assert.equal(nB.ls, 3); assert.equal(nB.slack, 0)
assert.equal(nA.lf, 3); assert.equal(nA.ls, 0); assert.equal(nA.slack, 0)
// 关键路径 = A,B,C（按 ES 升序），D 不在
assert.deepEqual(chain.criticalPath, ['A', 'B', 'C'])
assert.equal(nA.onCriticalPath, true)
assert.equal(nB.onCriticalPath, true)
assert.equal(nC.onCriticalPath, true)
// 并行 D：ES=3 EF=5，LF=9 LS=7，slack=4（>0）非关键
assert.equal(nD.es, 3); assert.equal(nD.ef, 5)
assert.equal(nD.lf, 9); assert.equal(nD.ls, 7); assert.equal(nD.slack, 4)
assert.equal(nD.onCriticalPath, false)
// 关键边：A→B、B→C 关键；A→D 非关键
const edge = (f, t) => chain.edges.find(e => e.fromId === f && e.toId === t)
assert.equal(edge('A', 'B').onCriticalPath, true)
assert.equal(edge('B', 'C').onCriticalPath, true)
assert.equal(edge('A', 'D').onCriticalPath, false)

// ---------- GI-CP-02：成环 A→B→A（两者都排期）：不崩、不递归死循环、不高亮、不打断 ----------
const cyc = criticalPath([
  { id: 'X', startDate: '2026-10-01', dueDate: '2026-10-03', predecessorIds: ['Y'] },
  { id: 'Y', startDate: '2026-10-05', dueDate: '2026-10-08', predecessorIds: ['X'] },
])
assert.equal(cyc.hasCycle, true)
assert.deepEqual([...cyc.cycleTaskIds].sort(), ['X', 'Y'])
assert.equal(cyc.nodes.X.inCycle, true)
assert.equal(cyc.nodes.Y.inCycle, true)
// 环上节点不参与正/反遍历：ES/EF/LS/LF/slack 全 null，不高亮
assert.equal(cyc.nodes.X.es, null); assert.equal(cyc.nodes.X.slack, null)
assert.equal(cyc.nodes.Y.es, null); assert.equal(cyc.nodes.Y.onCriticalPath, false)
assert.equal(cyc.nodes.X.onCriticalPath, false)
assert.deepEqual(cyc.criticalPath, [])
assert.equal(cyc.skipped.cycle, 2)
// 合法边不产出（环边被剔除）
assert.equal(cyc.edges.length, 0)
// 诚实降级说明：明确「无法计算/未自动打断」
assert.ok(cyc.warnings.some(w => w.includes('成环') && w.includes('未自动打断')), '应给出成环降级说明')

// ---------- GI-CP-03：链上某任务缺日期 → 该段降级，不补日期、不顺延 ----------
const miss = criticalPath([
  { id: 'P', startDate: '2026-10-01', dueDate: '2026-10-03' },
  { id: 'Q', startDate: '2026-10-05', predecessorIds: ['P'] }, // 缺 dueDate
  { id: 'R', dueDate: '2026-10-08' },                        // 缺 startDate（孤立）
])
assert.equal(miss.hasMissingDate, true)
assert.ok(miss.missingDateTaskIds.includes('Q'))
assert.ok(miss.missingDateTaskIds.includes('R'))
assert.equal(miss.nodes.Q.missingDate, true)
assert.equal(miss.nodes.Q.onCriticalPath, false)
assert.equal(miss.nodes.Q.durationDays, null)
assert.equal(miss.nodes.R.missingDate, true)
// P→Q 边因缺日期被剔除（missingDate 计数），P 作为独立已排期节点自身关键（slack0）
assert.equal(miss.edges.length, 0)
assert.ok(miss.skipped.missingDate >= 1)
assert.equal(miss.nodes.P.onCriticalPath, true)
assert.ok(miss.warnings.some(w => w.includes('缺少开始') && w.includes('未自动补日期')), '应给出缺日期降级说明')

// ---------- 多连通分量：两条互不相连的链，短分量不被全局终点挤出假时差 ----------
const multi = criticalPath([
  { id: 'a1', startDate: '2026-10-01', dueDate: '2026-10-02' },
  { id: 'a2', startDate: '2026-10-03', dueDate: '2026-10-04', predecessorIds: ['a1'] },
  { id: 'b1', startDate: '2026-11-01', dueDate: '2026-11-05' }, // 独立分量
])
assert.equal(multi.nodes.a1.slack, 0)
assert.equal(multi.nodes.a2.slack, 0)
assert.equal(multi.nodes.b1.slack, 0, '独立短分量自身关键，不被他分量终点给假正时差')
assert.equal(multi.nodes.b1.onCriticalPath, true)

// ---------- 自指 / 悬空：计数降级，不崩、不写 ----------
const odd = criticalPath([
  { id: 'S', startDate: '2026-10-01', dueDate: '2026-10-03', predecessorIds: ['S'] },
  { id: 'T', startDate: '2026-10-05', dueDate: '2026-10-08', predecessorIds: ['ghost'] },
])
assert.equal(odd.skipped.selfLoop, 1)
assert.equal(odd.skipped.dangling, 1)
assert.deepEqual(odd.danglingPredecessors, [{ taskId: 'T', missingId: 'ghost' }])
// 自指边/悬空边剔除后，S、T 作为独立已排期节点各自关键
assert.equal(odd.nodes.S.onCriticalPath, true)
assert.equal(odd.nodes.T.onCriticalPath, true)

// ---------- 空输入：不抛、空结构、无 NaN ----------
const empty = criticalPath([])
assert.deepEqual(empty.criticalPath, [])
assert.deepEqual(empty.nodes, {})
assert.equal(empty.skipped.selfLoop, 0)
assert.equal(empty.skipped.dangling, 0)
assert.equal(empty.skipped.cycle, 0)
assert.equal(empty.skipped.missingDate, 0)
assert.equal(empty.hasCycle, false)
assert.equal(empty.hasMissingDate, false)
assert.deepEqual(empty.warnings, [])

// ---------- 确定性：同输入两次逐字节一致（无随机/无墙钟） ----------
const once = JSON.stringify(criticalPath([
  { id: 'A', startDate: '2026-10-01', dueDate: '2026-10-03' },
  { id: 'B', startDate: '2026-10-05', dueDate: '2026-10-08', predecessorIds: ['A'] },
]))
const twice = JSON.stringify(criticalPath([
  { id: 'A', startDate: '2026-10-01', dueDate: '2026-10-03' },
  { id: 'B', startDate: '2026-10-05', dueDate: '2026-10-08', predecessorIds: ['A'] },
]))
assert.equal(once, twice, '关键路径纯函数同输入必须逐字节一致')

// ---------- GI-CP-04 / GI-COLLAB-01：core/gantt.ts 零写静态 grep ----------
const ganttSrc = readFileSync(join(here, '..', 'src', 'core', 'gantt.ts'), 'utf8')
assert.doesNotMatch(ganttSrc, /\brun\s*\(/, 'core/gantt.ts 不得含 run( 写命令')
assert.doesNotMatch(ganttSrc, /\bexecute\s*\(/, 'core/gantt.ts 不得含 execute( 写命令')
assert.doesNotMatch(ganttSrc, /writeFileSync|writeFile|appendFileSync|appendFile|mkdirSync|rmSync|fs\./,
  'core/gantt.ts 不得含任何 fs 写/删调用')

console.log('verify-critical-path OK')
