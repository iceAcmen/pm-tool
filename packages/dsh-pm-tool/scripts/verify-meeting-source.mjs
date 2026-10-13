import assert from 'node:assert'
import { findMeetingSources, pickPrimarySource } from '../lib/core/meeting-source.js'

// 数据：一场旧会、一场新会；新会里两个行动项都关联同一任务（多来源）；另有跨项目会议。
const meetings = [
  {
    id: 'mtg-0001', projectId: 'p-0001', title: '启动会', meetingDate: '2026-09-01',
    actions: [
      { id: 'ai-001', title: '调研用户', taskId: 't-0001' },
      { id: 'ai-002', title: '写方案', taskId: null },
    ],
  },
  {
    id: 'mtg-0003', projectId: 'p-0001', title: '周会三', meetingDate: '2026-09-20',
    actions: [
      { id: 'ai-001', title: '关联A', taskId: 't-0001' },
      { id: 'ai-002', title: '关联B', taskId: 't-0001' },
    ],
  },
  {
    id: 'mtg-0002', projectId: 'p-0001', title: '周会二', meetingDate: '2026-09-20',
    actions: [
      { id: 'ai-001', title: '关联C', taskId: 't-0001' },
    ],
  },
  // 跨项目会议也关联了 t-0001（前端用全量 meetings 反查，含其它项目）。
  {
    id: 'mtg-0100', projectId: 'p-0002', title: '跨项目评审', meetingDate: '2026-09-25',
    actions: [
      { id: 'ai-001', title: '跨项目行动', taskId: 't-0001' },
    ],
  },
]

// 命中：t-0001 有 5 条引用（含跨项目 mtg-0100 一条）
const refs = findMeetingSources(meetings, 't-0001')
assert.equal(refs.length, 5, '应汇总全部跨会引用（含其它项目会议）')

// 排序：meetingDate desc（mtg-0100 最新居首）；同日期 mtg-0003 在 mtg-0002 之前（id numeric desc）；
// mtg-0003 内 action 出现顺序稳定（ai-001 在 ai-002 前）。
assert.deepEqual(
  refs.map(r => [r.meetingId, r.actionId]),
  [['mtg-0100', 'ai-001'], ['mtg-0003', 'ai-001'], ['mtg-0003', 'ai-002'], ['mtg-0002', 'ai-001'], ['mtg-0001', 'ai-001']],
  '多来源按 meetingDate desc / id numeric desc / 行动项出现顺序稳定',
)

// primary = 排第一（最新、最大 id、首个行动项），并携带会议 projectId 供跨项目跳转
const primary = pickPrimarySource(refs)
assert.ok(primary)
assert.equal(primary.meetingId, 'mtg-0100')
assert.equal(primary.projectId, 'p-0002')
assert.equal(primary.actionId, 'ai-001')

// 无引用 → 空数组 / null，前端据此不渲染链接
assert.deepEqual(findMeetingSources(meetings, 't-9999'), [])
assert.equal(pickPrimarySource([]), null)

// 任务被删除后 action.taskId 悬空不抛错（安全删除语义）
const dangling = findMeetingSources([{ id: 'mtg-0009', title: 'X', meetingDate: '2026-01-01', actions: [{ id: 'ai-001', title: '悬空', taskId: 't-ghost' }] }], 't-ghost')
assert.equal(dangling.length, 1)
assert.equal(dangling[0].meetingId, 'mtg-0009')

console.log('verify-meeting-source OK')
