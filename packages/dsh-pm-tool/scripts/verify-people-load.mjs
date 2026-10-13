/**
 * 人员与负载视图纯函数确定性验证（P0 / v0.5.1）。
 *
 * 被测：`groupOpenTasksByAssignee(tasks, projects, { today?, withinDays? })`
 * （src/core/people-load.ts → 构建后 lib/core/people-load.js）。
 * 纯函数、零写库、零 schema；today 注入保证可复算。
 *
 * 用例对齐 docs/testing/people-load-acceptance.md 的 PL-PURE-01..14（冻结矩阵）。
 * 期望值均为手工算好的独立字面量，不用代码重算（避免 tautological）。
 */
import assert from 'node:assert/strict'
import { groupOpenTasksByAssignee } from '../lib/core/people-load.js'

const TODAY = '2026-10-13' // 注入固定今天：昨天 10-12 / 今天 10-13 / +7 = 10-20 / +8 = 10-21
const projects = [
  { id: 'pA', name: '项目A' },
  { id: 'pB', name: '项目B' },
]

function task(over) {
  return {
    id: 't', projectId: 'pA', code: '1', title: '任务',
    assignee: '', status: 'todo', progress: 0, priority: 'P1',
    ...over,
  }
}

// PL-PURE-01：trim + 折叠 + casefold 后同键、合并一组；done 不计。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p1-1', assignee: '张三 ', status: 'todo', progress: 0 }),
    task({ id: 'p1-2', assignee: '张三', status: 'in_progress', progress: 30 }),
  ], projects, { today: TODAY })
  assert.equal(r.people.length, 1, 'trim 后应合并为 1 人')
  assert.equal(r.people[0].openTotal, 2)
  assert.equal(r.people[0].todo, 1)
  assert.equal(r.people[0].inProgress, 1)
}

// PL-PURE-02：展示名 = 组内出现次数最多的原始写法，并列取首见。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p2-1', assignee: 'Zhang San' }),
    task({ id: 'p2-2', assignee: 'Zhang San' }),
    task({ id: 'p2-3', assignee: 'zhang san' }),
  ], projects, { today: TODAY })
  assert.equal(r.people.length, 1)
  assert.equal(r.people[0].display, 'Zhang San', '出现 2 次的写法应胜出')
}

// PL-PURE-03：全角空格（U+3000）与半角内部空白均折叠为单空格 → 同键。
// 注意：'李四'(无空格) 与 '李 四'(有空格) 按契约是不同漂移组（反例不合并）。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p3-1', assignee: '李 四' }),   // 半角单空格
    task({ id: 'p3-2', assignee: '李　四' }),   // 全角空格
    task({ id: 'p3-3', assignee: '李  四' }),   // 半角双空格
    task({ id: 'p3-4', assignee: '李四' }),      // 无空格 → 漂移，独立成组
  ], projects, { today: TODAY })
  assert.equal(r.people.length, 2, '有空格的三种写法应折叠为同键；无空格者漂移独立')
  const withSpace = r.people.find(p => p.display === '李 四')
  assert.equal(withSpace.openTotal, 3)
  const noSpace = r.people.find(p => p.display === '李四')
  assert.equal(noSpace.openTotal, 1)
}

// PL-PURE-04：每卡完整指标（todo/in_progress/blocked/逾期/临期/P0/跨项目数/最近截止）。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p4-1', projectId: 'pA', assignee: '王五', status: 'todo', progress: 0, priority: 'P0', dueDate: '2026-10-12' }), // 逾期 + P0
    task({ id: 'p4-2', projectId: 'pB', assignee: '王五', status: 'in_progress', progress: 50, priority: 'P1', dueDate: '2026-10-20' }), // 临期(第7天)
    task({ id: 'p4-3', projectId: 'pB', assignee: '王五', status: 'blocked', progress: 30, priority: 'P2' }), // 受阻，无截止
  ], projects, { today: TODAY })
  assert.equal(r.people.length, 1)
  const p = r.people[0]
  assert.equal(p.openTotal, 3)
  assert.equal(p.todo, 1)
  assert.equal(p.inProgress, 1)
  assert.equal(p.blocked, 1)
  assert.equal(p.overdue, 1, '昨天到期的 open 任务应逾期')
  assert.equal(p.dueSoon, 1, '第 7 天应临期')
  assert.equal(p.p0, 1)
  assert.equal(p.projectCount, 2, '跨 pA/pB 两个项目')
  assert.equal(p.nextDue, '2026-10-20', '最近未来截止应为临期那条（逾期的不算未来）')
}

// PL-PURE-05：空 assignee 与纯空白归一后为空 → 同入「未分配」桶，固定置顶。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p5-1', projectId: 'pA', assignee: '', status: 'todo', progress: 0, dueDate: '2026-10-12' }),
    task({ id: 'p5-2', projectId: 'pA', assignee: '   ', status: 'todo', progress: 0 }),
    task({ id: 'p5-3', projectId: 'pB', assignee: '赵六', status: 'todo', progress: 0 }),
  ], projects, { today: TODAY })
  assert.ok(r.unassigned, '应有未分配桶')
  assert.equal(r.unassigned.openTotal, 2)
  assert.equal(r.unassigned.overdue, 1)
  // 未分配固定置顶：people 列表第一位是未分配（在赵六之前）。
  assert.equal(r.people[0].display, '赵六', '未分配置顶时，people 数组本身只放正常人；未分配单独在 report.unassigned')
}

// PL-PURE-06：done / progress>=100 一律不计；只有 done 任务的人不出现在列表。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p6-1', assignee: '已完成A', status: 'done', progress: 100 }),
    task({ id: 'p6-2', assignee: '已完成B', status: 'todo', progress: 100 }), // progress>=100 视同完成
    task({ id: 'p6-3', assignee: '只完成D', status: 'done', progress: 100 }),
  ], projects, { today: TODAY })
  assert.equal(r.people.length, 0, '全部完成 → 无人成卡')
  assert.equal(r.unassigned, null, '无 open 空 assignee → 无未分配桶')
}

// PL-PURE-07：日期边界 —— 逾期 / 临期(0..7) / 远期(>7)，第 7 天临期、第 8 天转远期。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p7-1', assignee: '边界', status: 'todo', progress: 0, dueDate: '2026-10-12' }), // 昨天 逾期
    task({ id: 'p7-2', assignee: '边界', status: 'todo', progress: 0, dueDate: '2026-10-13' }), // 今天 临期(0)
    task({ id: 'p7-3', assignee: '边界', status: 'todo', progress: 0, dueDate: '2026-10-20' }), // 第7天 仍临期
    task({ id: 'p7-4', assignee: '边界', status: 'todo', progress: 0, dueDate: '2026-10-21' }), // 第8天 转远期
  ], projects, { today: TODAY })
  const p = r.people[0]
  assert.equal(p.overdue, 1)
  assert.equal(p.dueSoon, 2, '今天与第 7 天都算临期')
  // 远期那条进 bucket='open'
  const buckets = p.tasks.map(t => t.bucket)
  assert.ok(buckets.includes('open'), '第 8 天应归 open(远期)')
  assert.equal(p.tasks.find(t => t.id === 'p7-4').bucket, 'open')
}

// PL-PURE-08：确定性 —— 同输入跑两次逐字节一致。
{
  const fixture = [
    task({ id: 'p8-1', projectId: 'pA', assignee: '钱七', status: 'blocked', progress: 20, dueDate: '2026-10-12' }),
    task({ id: 'p8-2', projectId: 'pB', assignee: '钱七', status: 'in_progress', progress: 80, dueDate: '2026-10-25' }),
  ]
  const a = groupOpenTasksByAssignee(fixture, projects, { today: TODAY })
  const b = groupOpenTasksByAssignee(fixture, projects, { today: TODAY })
  assert.deepEqual(a, b, '同输入必须逐字节一致')
}

// PL-PURE-09：默认风险排序 逾期desc→受阻desc→临期desc→最近截止asc→总数desc；同级键字典序。
{
  const r = groupOpenTasksByAssignee([
    // P1: 逾期2 受阻1
    task({ id: 'p9-1', assignee: 'P1', status: 'todo', progress: 0, dueDate: '2026-10-11' }),
    task({ id: 'p9-2', assignee: 'P1', status: 'todo', progress: 0, dueDate: '2026-10-12' }),
    task({ id: 'p9-3', assignee: 'P1', status: 'blocked', progress: 50 }),
    // P2: 逾期0 受阻3 临期1
    task({ id: 'p9-4', assignee: 'P2', status: 'blocked', progress: 50 }),
    task({ id: 'p9-5', assignee: 'P2', status: 'blocked', progress: 50 }),
    task({ id: 'p9-6', assignee: 'P2', status: 'blocked', progress: 50 }),
    task({ id: 'p9-7', assignee: 'P2', status: 'todo', progress: 0, dueDate: '2026-10-15' }),
    // P3: 逾期0 受阻0 临期5
    ...[0, 1, 2, 3, 4].map(i => task({ id: `p9-8-${i}`, assignee: 'P3', status: 'todo', progress: 0, dueDate: '2026-10-16' })),
    // P4: 全 0 但 open 9
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => task({ id: `p9-9-${i}`, assignee: 'P4', status: 'in_progress', progress: 10 })),
    // 未分配 1 条
    task({ id: 'p9-u', assignee: '', status: 'todo', progress: 0 }),
  ], projects, { today: TODAY })
  assert.ok(r.unassigned, '未分配桶存在')
  assert.deepEqual(r.people.map(p => p.display), ['P1', 'P2', 'P3', 'P4'],
    '风险序：P1(逾期2) → P2(受阻3) → P3(临期5) → P4(全0但open9)')
}

// PL-PURE-10：多负责人串不切分，整体入单一组合组一次，带 multiOwner。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p10-1', assignee: '张三,李四', status: 'todo', progress: 0 }),
  ], projects, { today: TODAY })
  assert.equal(r.people.length, 1)
  assert.equal(r.people[0].multiOwner, true)
  assert.equal(r.people[0].openTotal, 1, '该任务只计入组合组一次')
}

// PL-PURE-11：'张三,李四' 与 '张三 和 李四' 各自独立成组，不得与单人 '张三' 合并。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p11-1', assignee: '张三,李四', status: 'todo', progress: 0 }),
    task({ id: 'p11-2', assignee: '张三 和 李四', status: 'todo', progress: 0 }),
    task({ id: 'p11-3', assignee: '张三', status: 'todo', progress: 0 }),
  ], projects, { today: TODAY })
  const keys = r.people.map(p => p.key).sort()
  assert.deepEqual(keys, ['张三', '张三 和 李四', '张三,李四'].map(s => s.toLowerCase()), '三个独立组合/单人组')
  const single = r.people.find(p => p.key === '张三')
  const combined = r.people.find(p => p.key === '张三,李四')
  assert.equal(single.multiOwner, false)
  assert.equal(combined.multiOwner, true)
}

// PL-PURE-12：同一 assignee 跨 pA/pB 合并到人组，跨项目数=2，任务各自带来源项目名。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p12-1', projectId: 'pA', assignee: '跨项目人', status: 'todo', progress: 0 }),
    task({ id: 'p12-2', projectId: 'pB', assignee: '跨项目人', status: 'todo', progress: 0 }),
  ], projects, { today: TODAY })
  const p = r.people[0]
  assert.equal(p.projectCount, 2)
  assert.deepEqual(p.tasks.map(t => t.projectName).sort(), ['项目A', '项目B'])
}

// PL-PURE-13：空输入 / 全部完成 → 空人员列表，无 NaN/undefined，不抛异常。
{
  const r1 = groupOpenTasksByAssignee([], projects, { today: TODAY })
  assert.equal(r1.people.length, 0)
  assert.equal(r1.unassigned, null)
  const r2 = groupOpenTasksByAssignee([
    task({ id: 'p13-1', assignee: '全做完', status: 'done', progress: 100 }),
  ], projects, { today: TODAY })
  assert.equal(r2.people.length, 0)
}

// PL-PURE-14：blocked 正确累加；状态枚举用 in_progress（不复抄 war-room 'doing' 笔误）。
{
  const r = groupOpenTasksByAssignee([
    task({ id: 'p14-1', assignee: '受阻人', status: 'blocked', progress: 10 }),
    task({ id: 'p14-2', assignee: '受阻人', status: 'blocked', progress: 10 }),
    task({ id: 'p14-3', assignee: '受阻人', status: 'doing', progress: 10 }), // 非真实枚举：应视为未知 open，不计入 inProgress
  ], projects, { today: TODAY })
  const p = r.people.find(x => x.display === '受阻人')
  assert.equal(p.blocked, 2, 'blocked 应正确累加')
  assert.equal(p.openTotal, 3, 'doing 虽非枚举，仍算 open 一条')
}

console.log('verify-people-load OK')
