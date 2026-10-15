// OP-AUTO：客观进度派生专项离线断言（真源 src/core/progress-derivation.ts）。
// 纯函数、无副作用、零回写；覆盖冻结矩阵 docs/testing/objective-progress-acceptance.md
// 中可自动化的 AUTO 用例（OP-DV/RU/LEG/EX/EV/BD 边界）。本脚本不写盘、不碰 data/。
import assert from 'node:assert'
import {
  deriveProgressMap,
  deriveTaskProgress,
  deriveProjectProgress,
  progressHeadline,
  formatProgressValue,
  checklistFraction,
} from '../lib/core/progress-derivation.js'

// 构造一个最小任务记录（结构鸭子类型，与正在开发的 task schema 解耦）。
const t = (id, opts = {}) => ({
  id,
  projectId: opts.projectId ?? 'P1',
  parentId: opts.parentId ?? null,
  title: id,
  status: opts.status ?? 'todo',
  progress: typeof opts.progress === 'number' ? opts.progress : 0,
  checklist: opts.checklist, // undefined = 无清单；[] = 空清单
})
const cl = (n, doneCount) =>
  Array.from({ length: n }, (_, i) => ({ id: `i${i + 1}`, text: `项${i + 1}`, done: i < doneCount }))

let ran = 0
const check = (name, fn) => { fn(); ran++; console.log(`  ✓ ${name}`) }

// ---------- OP-DV：叶子清单客观派生 ----------
check('OP-DV-01 清单百分比=checked/total：1/4 2/4 3/4 4/4 → 25/50/75/100', () => {
  for (const [done, want] of [[1, 25], [2, 50], [3, 75], [4, 100]]) {
    const m = deriveProgressMap([t('L', { checklist: cl(4, done) })])
    assert.equal(m.get('L').value, want)
    assert.equal(m.get('L').source, 'checklist')
  }
  // 同输入恒同输出
  const a = deriveProgressMap([t('L', { checklist: cl(4, 2) })])
  const b = deriveProgressMap([t('L', { checklist: cl(4, 2) })])
  assert.deepEqual(a.get('L'), b.get('L'))
})

check('OP-DV-02 全勾=100 + 待验收标签，不封顶不改 status', () => {
  const m = deriveProgressMap([t('L', { checklist: cl(4, 4), status: 'todo' })])
  const p = m.get('L')
  assert.equal(p.value, 100)
  assert.equal(p.pendingAcceptance, true)
  assert.equal(p.pendingAcceptanceCount, 1)
})

check('OP-DV-03 done+未全勾=实际比例+中文软告警，不改 value', () => {
  const m = deriveProgressMap([t('L', { checklist: cl(5, 2), status: 'done' })])
  const p = m.get('L')
  assert.equal(p.value, 40)
  assert.ok(p.warnings.some(w => w.includes('完成') && w.includes('清单') && w.includes('2/5')), JSON.stringify(p.warnings))
})

check('OP-DV-04/06 done 不伪造无清单 leaf 100；无清单 → null（非 0）', () => {
  let m = deriveProgressMap([t('L', { status: 'done' })])
  assert.equal(m.get('L').value, null)
  assert.equal(m.get('L').source, 'none')
  m = deriveProgressMap([t('L', {})])
  assert.equal(m.get('L').value, null)
  assert.notEqual(m.get('L').value, 0) // null 与 0 类型区分
})

check('OP-DV-05 leaf 暴露 checklist={checked,total} 单独字段', () => {
  const m = deriveProgressMap([t('L', { checklist: cl(5, 3) })])
  assert.deepEqual(m.get('L').checklist, { checked: 3, total: 5 })
  assert.equal(checklistFraction(m.get('L')), '3/5')
})

check('OP-DV-07 status 变动不凭空改清单百分比', () => {
  const base = [t('L', { checklist: cl(4, 1), status: 'todo' })]
  const a = deriveProgressMap(base).get('L').value
  const b = deriveProgressMap([t('L', { checklist: cl(4, 1), status: 'in_progress' })]).get('L').value
  assert.equal(a, b)
})

// ---------- OP-LEG：legacy 手填只旁注 ----------
check('OP-LEG-01/02 无清单 legacy=40/80 → objective=null，legacyProgress 旁注', () => {
  const m = deriveProgressMap([
    t('A', { progress: 40 }),
    t('B', { progress: 80, status: 'in_progress' }),
  ])
  assert.equal(m.get('A').value, null)
  assert.equal(m.get('B').value, null)
  assert.equal(m.get('A').legacyProgress, 40)
  assert.equal(m.get('B').legacyProgress, 80)
})

check('OP-LEG legacy 含 0 也只旁注、不伪造', () => {
  const m = deriveProgressMap([t('Z', { progress: 0 })])
  assert.equal(m.get('Z').value, null)
  assert.equal(m.get('Z').legacyProgress, 0) // 0 也作为原值带出
})

// ---------- OP-RU：父 rollup ----------
check('OP-RU-01 父=有清单后代叶等权均值，不含父自身手填', () => {
  const m = deriveProgressMap([
    t('P', { progress: 100 }),
    t('L1', { parentId: 'P', checklist: cl(2, 1) }), // 50
    t('L2', { parentId: 'P', checklist: cl(4, 3) }), // 75
  ])
  assert.equal(m.get('P').value, 63) // round((50+75)/2)=63
  assert.equal(m.get('P').source, 'rollup')
  assert.deepEqual(m.get('P').coverage, { coveredLeaves: 2, totalLeaves: 2 })
})

check('OP-RU-02 无清单叶不进均值，只入 totalLeaves', () => {
  const m = deriveProgressMap([
    t('P'),
    t('L1', { parentId: 'P', checklist: cl(2, 1) }), // 50 covered
    t('L2', { parentId: 'P', progress: 30 }),        // legacy 无清单
    t('L3', { parentId: 'P' }),                       // 完全无信号
  ])
  assert.equal(m.get('P').value, 50)
  assert.deepEqual(m.get('P').coverage, { coveredLeaves: 1, totalLeaves: 3 })
})

check('OP-RU-03/04 coverage 命名：不足叫「已覆盖任务清单完成度」，全覆盖叫「整体完成率」', () => {
  const m = deriveProgressMap([
    t('P'),
    t('L1', { parentId: 'P', checklist: cl(2, 1) }),
    t('L2', { parentId: 'P' }),
  ])
  assert.equal(progressHeadline(m.get('P')), '已覆盖任务清单完成度')
  assert.equal(formatProgressValue(m.get('P')), '50%')

  const m2 = deriveProgressMap([
    t('P'),
    t('L1', { parentId: 'P', checklist: cl(1, 0) }), // 0
    t('L2', { parentId: 'P', checklist: cl(1, 1) }), // 100
  ])
  assert.equal(m2.get('P').value, 50)
  assert.equal(progressHeadline(m2.get('P')), '整体完成率')
})

check('OP-RU-05 covered=0 → value=null', () => {
  const m = deriveProgressMap([
    t('P', { progress: 80 }),
    t('L1', { parentId: 'P' }),
    t('L2', { parentId: 'P' }),
  ])
  assert.equal(m.get('P').value, null)
  assert.deepEqual(m.get('P').coverage, { coveredLeaves: 0, totalLeaves: 2 })
})

check('OP-RU-06 中间节点不重复计（P→M→L1/L2）', () => {
  const m = deriveProgressMap([
    t('P'),
    t('M', { parentId: 'P' }),
    t('L1', { parentId: 'M', checklist: cl(2, 1) }), // 50
    t('L2', { parentId: 'M', checklist: cl(4, 3) }), // 75
  ])
  assert.equal(m.get('M').value, 63)
  assert.equal(m.get('P').value, 63) // 同集合{L1,L2}，M 不再入分母
  assert.deepEqual(m.get('P').coverage, { coveredLeaves: 2, totalLeaves: 2 })
})

check('最终 round 一次：中间节点不逐节点 round，避免累积误差', () => {
  // 叶原始分数 1/3=33.33、1/3=33.33、1/4=25：
  // 原始均值 = (1/3+1/3+1/4)/3 = 30.555… → 31；若先逐叶 round 成 33/33/25 再平均 → 30.33 → 30。
  const m = deriveProgressMap([
    t('P'),
    t('L1', { parentId: 'P', checklist: cl(3, 1) }),
    t('L2', { parentId: 'P', checklist: cl(3, 1) }),
    t('L3', { parentId: 'P', checklist: cl(4, 1) }),
  ])
  assert.equal(m.get('L1').value, 33) // 叶子自身终态 round 一次
  assert.equal(m.get('P').value, 31)
})

// ---------- OP-EX：异常降级 ----------
check('OP-EX-01 一次迭代全量 Map + 确定性', () => {
  const rows = [t('P'), t('L1', { parentId: 'P', checklist: cl(2, 1) })]
  const m1 = deriveProgressMap(rows)
  const m2 = deriveProgressMap(rows)
  assert.equal(m1.size, 2)
  assert.deepEqual(m1.get('P'), m2.get('P'))
})

check('OP-EX-02 父链成环 → warnings、不挂死', () => {
  const m = deriveProgressMap([
    { ...t('A', { projectId: 'P1' }), parentId: 'B' },
    { ...t('B', { projectId: 'P1' }), parentId: 'A' },
  ])
  assert.ok(m.get('A').warnings.some(w => w.includes('环')), JSON.stringify(m.get('A').warnings))
  assert.ok(m.get('B').warnings.some(w => w.includes('环')), JSON.stringify(m.get('B').warnings))
})

check('OP-EX-03 缺 id / 悬空父引用 → warnings、不抛', () => {
  const m = deriveProgressMap([
    t('Good', { checklist: cl(2, 1) }),
    { id: undefined, projectId: 'P1', parentId: null, status: 'todo' },
    t('Dangle', { parentId: 'ghost' }),
  ])
  assert.equal(m.get('Good').value, 50) // 合法节点照常派生
  assert.ok(m.get('Dangle').warnings.some(w => w.includes('ghost') || w.includes('父')), JSON.stringify(m.get('Dangle').warnings))
})

check('OP-EX-04 跨项目父引用不跨项目汇总', () => {
  const m = deriveProgressMap([
    t('Qleaf', { projectId: 'Q', checklist: cl(1, 1) }), // 100%
    t('Proot', { projectId: 'P' }),
    t('Pchild', { projectId: 'P', parentId: 'Qleaf' }), // 跨项目父边 → 警告，按 P 独立根
  ])
  assert.ok(m.get('Pchild').warnings.some(w => w.includes('其他项目') || w.includes('跨项目')), JSON.stringify(m.get('Pchild').warnings))
  // Pchild 作为 P 的无清单根叶：Qleaf 的 100 不得混入
  assert.equal(m.get('Pchild').value, null)
  const proj = deriveProjectProgress([
    t('Qleaf', { projectId: 'Q', checklist: cl(1, 1) }),
    t('Proot', { projectId: 'P' }),
    t('Pchild', { projectId: 'P', parentId: 'Qleaf' }),
  ], 'P')
  assert.equal(proj.value, null) // 项目 P 无覆盖叶，不含 Qleaf 的 100
})

check('OP-EX-05 pendingAcceptanceCount 沿子树累计', () => {
  const m = deriveProgressMap([
    t('Root'),
    t('Mid', { parentId: 'Root' }),
    t('PA1', { parentId: 'Mid', checklist: cl(3, 3), status: 'todo' }), // 待验收
    t('PA2', { parentId: 'Root', checklist: cl(2, 2), status: 'in_progress' }), // 待验收
    t('DoneL', { parentId: 'Root', checklist: cl(2, 2), status: 'done' }), // 已验收
  ])
  assert.equal(m.get('PA1').pendingAcceptance, true)
  assert.equal(m.get('PA2').pendingAcceptance, true)
  assert.equal(m.get('DoneL').pendingAcceptance, false)
  assert.equal(m.get('Root').pendingAcceptanceCount, 2)
})

// ---------- 空清单 / 重复 id ----------
check('空清单 [] = 无信号（不是 0%）', () => {
  const m = deriveProgressMap([t('E', { checklist: [] })])
  assert.equal(m.get('E').value, null)
  assert.equal(m.get('E').checklist, null)
  assert.equal(m.get('E').source, 'none')
})

check('重复 id → 警告，不挂死', () => {
  const rows = [
    t('Dup', { checklist: cl(2, 1) }),
    t('Dup', { checklist: cl(1, 0) }),
  ]
  const m = deriveProgressMap(rows)
  assert.equal(m.size, 1)
  assert.ok(m.get('Dup').warnings.some(w => w.includes('重复')), JSON.stringify(m.get('Dup').warnings))
  assert.equal(m.get('Dup').value, 50) // 保留首次
})

// ---------- 深树 / 大树安全 ----------
check('深树（链 500 层）不栈溢出且结果正确', () => {
  const rows = []
  rows.push(t('n0'))
  for (let i = 1; i <= 500; i++) rows.push(t(`n${i}`, { parentId: `n${i - 1}` }))
  rows.push(t('leaf', { parentId: 'n500', checklist: cl(4, 3) })) // 75
  const m = deriveProgressMap(rows)
  assert.equal(m.get('n0').value, 75)
  assert.equal(m.get('leaf').value, 75)
  assert.deepEqual(m.get('n0').coverage, { coveredLeaves: 1, totalLeaves: 1 })
})

check('大树（2000 叶）量级 O(n)、等权均值正确', () => {
  const rows = [t('Root')]
  for (let i = 0; i < 2000; i++) {
    // 一半有清单=50，一半无清单
    rows.push(i % 2 === 0
      ? t(`L${i}`, { parentId: 'Root', checklist: cl(2, 1) })
      : t(`L${i}`, { parentId: 'Root' }))
  }
  const start = Date.now()
  const m = deriveProgressMap(rows)
  const ms = Date.now() - start
  assert.equal(m.get('Root').value, 50)
  assert.deepEqual(m.get('Root').coverage, { coveredLeaves: 1000, totalLeaves: 2000 })
  assert.ok(ms < 2000, `大树 ${ms}ms 应在 2s 内`)
})

// ---------- 冻结输入不变 / 纯函数 ----------
check('派生只读：输入 tasks 不被改动', () => {
  const rows = [
    t('P'),
    t('L', { parentId: 'P', checklist: cl(3, 2), status: 'done' }),
  ]
  const before = JSON.stringify(rows)
  deriveProgressMap(rows)
  deriveProjectProgress(rows, 'P1')
  assert.equal(JSON.stringify(rows), before)
})

// ---------- 便捷函数 / 项目汇总 ----------
check('deriveTaskProgress(taskId, map) 复用同一份计算', () => {
  const rows = [t('P'), t('L', { parentId: 'P', checklist: cl(5, 3) })]
  const map = deriveProgressMap(rows)
  assert.equal(deriveTaskProgress('L', map).value, 60)
  assert.equal(deriveTaskProgress('missing', map), undefined)
})

check('deriveProjectProgress 同语义、不重复计中间节点', () => {
  const rows = [
    t('P'),
    t('M', { parentId: 'P' }),
    t('L1', { parentId: 'M', checklist: cl(2, 1) }), // 50
    t('L2', { parentId: 'M', checklist: cl(4, 3) }), // 75
  ]
  const proj = deriveProjectProgress(rows, 'P1')
  assert.equal(proj.value, 63) // 只取 L1/L2 等权，M 不入分母
  assert.deepEqual(proj.coverage, { coveredLeaves: 2, totalLeaves: 2 })
  assert.equal(deriveProjectProgress([t('X')], 'P1').value, null) // 无覆盖叶
})

check('无信号文案：null → 证据不足；叶子独立渲染', () => {
  const m = deriveProgressMap([t('None')])
  assert.equal(formatProgressValue(m.get('None')), '证据不足')
  assert.equal(progressHeadline(m.get('None')), '尚未建立客观进度')
  assert.equal(checklistFraction(m.get('P') ?? m.get('None')), null)
})

console.log(`verify-objective-progress OK（${ran} 组断言）`)
