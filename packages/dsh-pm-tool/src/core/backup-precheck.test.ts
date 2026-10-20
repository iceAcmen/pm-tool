import { describe, expect, it } from 'vitest'
import { precheckBackup } from './backup.js'

const now = '2026-10-20T00:00:00.000Z'

function baseBackup(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    projects: [{
      id: 'p-0001',
      name: '示例项目',
      description: '',
      owner: 'Ice',
      status: 'active',
      startDate: '2026-10-01',
      targetDate: '2026-11-30',
      createdAt: now,
      updatedAt: now,
    }],
    tasks: [],
    milestones: [{
      id: 'm-0001',
      projectId: 'p-0001',
      title: '里程碑',
      targetDate: '2026-11-01',
      status: 'planned',
      achievedDate: null,
      description: '',
      createdAt: now,
      updatedAt: now,
    }],
    riskIssues: [],
    meetings: [],
    reports: [],
    deliverables: [],
    ...overrides,
  }
}

function deliverable(milestoneId: string | null, id = 'dlv-0001'): Record<string, unknown> {
  return {
    id,
    projectId: 'p-0001',
    name: '验收报告',
    version: 'v1.0',
    owner: 'Ice',
    status: 'planned',
    location: '',
    description: '',
    dueDate: null,
    milestoneId,
    note: '',
    history: [{ at: now, field: 'created', from: '', to: 'planned', by: 'Ice', note: '创建交付物' }],
    createdAt: now,
    updatedAt: now,
  }
}

function legacyReport(): Record<string, unknown> {
  return {
    id: 'rpt-0001',
    projectId: 'p-0001',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    title: '旧汇报',
    status: 'draft',
    executiveSummary: '旧摘要',
    completedWork: [],
    nextPlans: [],
    blockers: [],
    snapshotAt: now,
    snapshot: {
      project: { name: 'P', owner: '', status: 'active', targetDate: '2026-10-31' },
      tasks: { total: 0, todo: 0, inProgress: 0, blocked: 0, done: 0, averageProgress: null },
      milestones: { total: 0, achieved: 0, atRisk: 0, missed: 0 },
      meetings: { inPeriod: 0, decisions: 0 },
      periodMilestones: [],
      periodMeetings: [],
      exceptions: [],
    },
    createdAt: now,
    updatedAt: now,
  }
}

describe('backup precheck U5 consistency', () => {
  it('legacy report without source fields normalizes to manual/null before schema parse', async () => {
    await expect(precheckBackup(baseBackup({
      reports: [legacyReport()],
    }) as never)).resolves.toBeUndefined()
  })

  it('valid deliverable milestone relation passes precheck', async () => {
    await expect(precheckBackup(baseBackup({
      deliverables: [deliverable('m-0001')],
    }) as never)).resolves.toBeUndefined()
  })

  it('dangling or cross-project deliverable milestoneId rejects before restore writes', async () => {
    await expect(precheckBackup(baseBackup({
      deliverables: [deliverable('m-missing', 'dlv-0002')],
    }) as never)).rejects.toThrow(/milestoneId/)
  })

  it('task deliverableId existing in another project rejects before restore writes', async () => {
    await expect(precheckBackup(baseBackup({
      projects: [
        {
          id: 'p-0001', name: '项目一', description: '', owner: 'Ice', status: 'active',
          startDate: '2026-10-01', targetDate: '2026-11-30', createdAt: now, updatedAt: now,
        },
        {
          id: 'p-0002', name: '项目二', description: '', owner: 'Ray', status: 'active',
          startDate: '2026-10-01', targetDate: '2026-11-30', createdAt: now, updatedAt: now,
        },
      ],
      milestones: [],
      deliverables: [{
        id: 'dlv-0002', projectId: 'p-0002', name: '外项目交付物', version: 'v1.0',
        owner: 'Ray', status: 'planned', location: '', description: '', dueDate: null,
        milestoneId: null, note: '', history: [], createdAt: now, updatedAt: now,
      }],
      tasks: [{
        id: 't-0001', projectId: 'p-0001', parentId: null, title: '跨项目交付物任务',
        description: '', assignee: '', status: 'todo', priority: 'P1',
        progress: 0, milestoneId: null, deliverableId: 'dlv-0002',
        code: '1', order: 1, createdAt: now, updatedAt: now,
      }],
    }) as never)).rejects.toThrow(/交付物/)
  })

  it('task milestoneId existing in another project rejects before restore writes', async () => {
    await expect(precheckBackup(baseBackup({
      projects: [
        {
          id: 'p-0001', name: '项目一', description: '', owner: 'Ice', status: 'active',
          startDate: '2026-10-01', targetDate: '2026-11-30', createdAt: now, updatedAt: now,
        },
        {
          id: 'p-0002', name: '项目二', description: '', owner: 'Ray', status: 'active',
          startDate: '2026-10-01', targetDate: '2026-11-30', createdAt: now, updatedAt: now,
        },
      ],
      milestones: [
        {
          id: 'm-0001', projectId: 'p-0001', title: '本项目里程碑', targetDate: '2026-11-01',
          status: 'planned', achievedDate: null, description: '', createdAt: now, updatedAt: now,
        },
        {
          id: 'm-0002', projectId: 'p-0002', title: '外项目里程碑', targetDate: '2026-11-01',
          status: 'planned', achievedDate: null, description: '', createdAt: now, updatedAt: now,
        },
      ],
      tasks: [{
        id: 't-0001', projectId: 'p-0001', parentId: null, title: '跨项目里程碑任务',
        description: '', assignee: '', status: 'todo', priority: 'P1',
        progress: 0, milestoneId: 'm-0002',
        code: '1', order: 1, createdAt: now, updatedAt: now,
      }],
    }) as never)).rejects.toThrow(/milestoneId/)
  })
})
