import { describe, it, expect } from 'vitest'
import { scopeSnapshot } from './scope-snapshot.js'

// 宽松 fixture：只造过滤相关字段，其余按 Snapshot 结构宽松传入。
const base = {
  projects: [{ id: 'p-0001' }, { id: 'p-0002' }],
  tasks: [{ projectId: 'p-0001' }, { projectId: 'p-0002' }, { projectId: 'p-0001' }],
  milestones: [{ projectId: 'p-0001' }, { projectId: 'p-0002' }],
  riskIssues: [{ projectId: 'p-0002' }, { projectId: 'p-0001' }],
  meetings: [{ projectId: 'p-0001' }, { projectId: 'p-0002' }],
  reports: [{ projectId: 'p-0002' }, { projectId: 'p-0001' }],
  deliverables: [{ projectId: 'p-0001' }, { projectId: 'p-0002' }],
  okrs: [{ projectId: 'p-0001' }, { projectId: 'p-0002' }],
  okrInbox: [{ projectId: 'p-0002' }, { projectId: 'p-0001' }],
  habits: [{ projectId: 'p-0001' }, { projectId: 'p-0002' }],
  habitInbox: [{ projectId: 'p-0002' }, { projectId: 'p-0001' }],
  settings: { keep: true },
  capabilities: { httpAvailable: true },
  dashboards: { user: { version: 1, widgets: [] } },
  fileAssets: { 'fa-1': { id: 'fa-1' } },
} as never

describe('scopeSnapshot 项目收窄', () => {
  it('projects 仅留当前项目，其余列表按 projectId 过滤', () => {
    const out = scopeSnapshot(base, 'p-0001')
    expect(out.projects.map(p => p.id)).toEqual(['p-0001'])
    expect(out.tasks).toHaveLength(2)
    expect(out.milestones).toHaveLength(1)
    expect(out.riskIssues).toHaveLength(1)
    expect(out.meetings).toHaveLength(1)
    expect(out.reports).toHaveLength(1)
    expect(out.deliverables).toHaveLength(1)
    expect(out.okrs).toHaveLength(1)
    expect(out.okrInbox).toHaveLength(1)
    expect(out.habits).toHaveLength(1)
    expect(out.habitInbox).toHaveLength(1)
    // 全部归属校验
    for (const list of [out.tasks, out.milestones, out.riskIssues, out.meetings, out.reports, out.deliverables, out.okrs, out.okrInbox, out.habits, out.habitInbox]) {
      expect(list.every(x => x.projectId === 'p-0001')).toBe(true)
    }
  })

  it('settings/capabilities/dashboards 原样保留；fileAssets 无归属字段故清空防跨项目泄漏', () => {
    const out = scopeSnapshot(base, 'p-0001')
    expect(out.settings).toBe(base.settings)
    expect(out.capabilities).toBe(base.capabilities)
    expect(out.dashboards).toBe(base.dashboards)
    expect(out.fileAssets).toEqual({})
  })

  it('不改写原快照（原数组内容不变）', () => {
    const taskCount = base.tasks.length
    const projectCount = base.projects.length
    scopeSnapshot(base, 'p-0001')
    expect(base.tasks).toHaveLength(taskCount)
    expect(base.projects).toHaveLength(projectCount)
    expect(base.tasks.every(t => 'projectId' in t)).toBe(true)
  })

  it('缺省可选列表（undefined）回落空数组，不抛', () => {
    const sparse = { projects: [{ id: 'p-0001' }], tasks: [] } as never
    const out = scopeSnapshot(sparse, 'p-0001')
    expect(out.okrs).toEqual([])
    expect(out.habits).toEqual([])
    expect(out.reports).toEqual([])
  })
})
