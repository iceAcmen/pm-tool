import assert from 'node:assert'
import { diffAgainstPrevious } from '../lib/core/report-diff.js'

// 构造一份最小快照（只填 diff 关心的标量）。
// v0.8：tasks 带 calcVersion；旧记录缺省=0，新快照=1；averageProgress 可 null。
function rpt(id, periodEnd, { avgProgress, calcVersion = 1, overdue, exceptions }) {
  return {
    id,
    periodEnd,
    snapshot: {
      tasks: { averageProgress: avgProgress, calcVersion },
      exceptions: [
        ...Array.from({ length: overdue }, () => ({ kind: 'overdue_task' })),
        ...Array.from({ length: exceptions - overdue }, () => ({ kind: 'blocked_task' })),
      ],
    },
  }
}

// 面板已按 periodEnd 降序（新→旧）传入：r1 最新、r2 中间、r3 最旧。
// 「上一份」= 更旧的一行；最旧的 r3 是历史首份，没有更前一份 → null。
const reports = [
  rpt('r1', '2026-09-30', { avgProgress: 60, overdue: 1, exceptions: 3 }), // 最新
  rpt('r2', '2026-09-20', { avgProgress: 40, overdue: 3, exceptions: 3 }),
  rpt('r3', '2026-09-10', { avgProgress: 40, overdue: 3, exceptions: 5 }),
]

const diff = diffAgainstPrevious(reports)

// r1（最新）vs r2：avgProgress 60-40=+20、overdue 1-3=-2、exceptions 3-3=0
assert.deepEqual(diff.get('r1'), { avgProgress: 20, overdueTask: -2, exceptionCount: 0 })

// r2 vs r3：avgProgress 40-40=0、overdue 3-3=0、exceptions 3-5=-2
assert.deepEqual(diff.get('r2'), { avgProgress: 0, overdueTask: 0, exceptionCount: -2 })

// r3（历史首份）无更前一份 → 全部 null
assert.deepEqual(diff.get('r3'), { avgProgress: null, overdueTask: null, exceptionCount: null })

// 单份汇报：唯一一行无上一份 → null
const single = diffAgainstPrevious([rpt('r9', '2026-09-30', { avgProgress: 10, overdue: 0, exceptions: 0 })])
assert.deepEqual(single.get('r9'), { avgProgress: null, overdueTask: null, exceptionCount: null })

// 空数组
assert.equal(diffAgainstPrevious([]).size, 0)

// 乱序输入：内部排序后 Map 与有序输入完全一致（不依赖输入顺序）。
const shuffled = [reports[2], reports[0], reports[1]] // r3, r1, r2
const diffShuffled = diffAgainstPrevious(shuffled)
assert.deepEqual(Object.fromEntries(diffShuffled), Object.fromEntries(diff))

// 同 periodEnd 时按 id 数字降序决序：r10（id=10）排在 r2（id=2）之前（同为最新档）。
const tie = diffAgainstPrevious([
  rpt('r2', '2026-09-30', { avgProgress: 40, overdue: 0, exceptions: 1 }),
  rpt('r10', '2026-09-30', { avgProgress: 50, overdue: 0, exceptions: 2 }),
])
// 排序后 [r10(新), r2(旧)]：r10 vs r2 → avgProgress 50-40=+10、exceptions 2-1=+1
assert.deepEqual(tie.get('r10'), { avgProgress: 10, overdueTask: 0, exceptionCount: 1 })
// r2 是其中更旧者，无更前一份 → 全部 null（验证 id 决序确实让 r10 居首）
assert.deepEqual(tie.get('r2'), { avgProgress: null, overdueTask: null, exceptionCount: null })

// ---- v0.8 客观进度：异版本 / 一侧 null → avgProgress delta=null（不渲染徽标） ----
// (a) calcVersion 1 vs 0（新快照 vs 旧库快照）：口径不同，硬减即回归
const crossVer = diffAgainstPrevious([
  rpt('nv', '2026-10-30', { avgProgress: 60, calcVersion: 1, overdue: 1, exceptions: 1 }),
  rpt('ov', '2026-10-20', { avgProgress: 40, calcVersion: 0, overdue: 1, exceptions: 1 }),
])
assert.equal(crossVer.get('nv').avgProgress, null)
assert.equal(crossVer.get('nv').overdueTask, 0) // 非 avg 项口径不变
assert.equal(crossVer.get('nv').exceptionCount, 0)

// (b) 同版本但一侧 averageProgress=null（无清单覆盖叶子）→ 不拿 null 硬减
const oneNull = diffAgainstPrevious([
  rpt('nu', '2026-10-30', { avgProgress: null, calcVersion: 1, overdue: 0, exceptions: 0 }),
  rpt('nv2', '2026-10-20', { avgProgress: 30, calcVersion: 1, overdue: 0, exceptions: 0 }),
])
assert.equal(oneNull.get('nu').avgProgress, null)

// (c) 两侧均 null、同版本 → 仍 null（无可比证据）
const bothNull = diffAgainstPrevious([
  rpt('n3', '2026-10-30', { avgProgress: null, calcVersion: 1, overdue: 0, exceptions: 0 }),
  rpt('n4', '2026-10-20', { avgProgress: null, calcVersion: 1, overdue: 0, exceptions: 0 }),
])
assert.equal(bothNull.get('n3').avgProgress, null)

console.log('verify-report-diff OK')
