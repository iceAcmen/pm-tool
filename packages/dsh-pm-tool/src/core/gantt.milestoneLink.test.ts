import { describe, it, expect } from 'vitest'
import { tasksByMilestone, milestoneTitleForTask, type MilestoneLinkedTask } from './gantt.js'

// D-08：任务↔里程碑「现字段 milestoneId」双向展示的纯投影（零 schema、零写库）。
// 分组与标题解析必须确定性、不改写入参；视图层只负责渲染与键盘可达。

const t = (id: string, title: string, milestoneId: string | null, code = '', status = 'todo', assignee = ''): MilestoneLinkedTask =>
  ({ id, title, code, status, assignee, milestoneId })

describe('tasksByMilestone 分组（milestones 视图 → 里程碑卡片关联任务）', () => {
  it('按 milestoneId 分组并保持输入顺序，剔除 null/空', () => {
    const list = [
      t('t-01', '设计稿', 'm-0002', 'T-01'),
      t('t-02', '开发', 'm-0002', 'T-02'),
      t('t-03', '无关联', null),
      t('t-04', '验收', 'm-0003', 'T-04'),
      t('t-05', '空串关联', ''),
    ]
    const map = tasksByMilestone(list)
    expect([...map.keys()]).toEqual(['m-0002', 'm-0003'])
    expect(map.get('m-0002')!.map(x => x.id)).toEqual(['t-01', 't-02'])
    expect(map.get('m-0003')!.map(x => x.id)).toEqual(['t-04'])
    expect(map.has('t-03' as never)).toBe(false)
  })

  it('无任何关联任务 → 空 Map（视图据此诚实显示「暂无关联任务」，不伪造）', () => {
    expect(tasksByMilestone([t('a', 'x', null), t('b', 'y', null)])).toEqual(new Map())
    expect(tasksByMilestone([])).toEqual(new Map())
  })

  it('不改写入参（纯函数：不回写/不增删字段）', () => {
    const list = [t('a', 'x', 'm-1')]
    const snapshot = JSON.stringify(list)
    tasksByMilestone(list)
    expect(JSON.stringify(list)).toBe(snapshot)
  })
})

describe('milestoneTitleForTask（甘特侧条体/标签展示任务现有关联）', () => {
  const milestones = [
    { id: 'm-0002', title: '需求冻结' },
    { id: 'm-0003', title: '正式发布' },
  ]
  it('命中返回里程碑标题；无关联/无此里程碑返回 null（不伪造）', () => {
    expect(milestoneTitleForTask(t('a', 'x', 'm-0002'), milestones)).toBe('需求冻结')
    expect(milestoneTitleForTask(t('b', 'y', 'm-0003'), milestones)).toBe('正式发布')
    expect(milestoneTitleForTask(t('c', 'z', null), milestones)).toBeNull()
    expect(milestoneTitleForTask(t('d', 'w', 'm-9999'), milestones)).toBeNull()
  })
})
