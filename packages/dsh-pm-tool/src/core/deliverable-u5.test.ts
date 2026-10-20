import { describe, it, expect } from 'vitest'
import { addDeliverable, updateDeliverable, DeliverableMilestoneNotFoundError } from './deliverables.js'

function table(store: Map<string, unknown>) {
  return {
    get: (k: string) => store.get(k),
    put: (k: string, v: unknown) => { store.set(k, v) },
    delete: (k: string) => { store.delete(k) },
    entries: () => store.entries(),
    keys: () => store.keys(),
  }
}

function fakeDomain() {
  const stores: Record<string, Map<string, unknown>> = {
    projects: new Map([['p-0001', { id: 'p-0001', name: 'A' }], ['p-0002', { id: 'p-0002', name: 'B' }]]),
    milestones: new Map([
      ['m-ok', { id: 'm-ok', projectId: 'p-0001', title: 'M1' }],
      ['m-other', { id: 'm-other', projectId: 'p-0002', title: 'M2' }],
    ]),
    deliverables: new Map(),
  }
  return { table: (name: string) => table(stores[name] ??= new Map()) } as never
}

describe('U5 deliverable.milestoneId 关联与 note', () => {
  it('同项目里程碑关联 + note 持久化；null 不关联', async () => {
    const domain = fakeDomain()
    const d = await addDeliverable(domain, {
      projectId: 'p-0001',
      name: '交付物一',
      milestoneId: 'm-ok',
      note: '验收备注',
    })
    expect(d.milestoneId).toBe('m-ok')
    expect(d.note).toBe('验收备注')

    const cleared = await updateDeliverable(domain, d.id, { milestoneId: null, note: '改备注' })
    expect(cleared?.milestoneId).toBeNull()
    expect(cleared?.note).toBe('改备注')
  })

  it('跨项目/不存在里程碑拒绝零写', async () => {
    const domain = fakeDomain()
    await expect(addDeliverable(domain, { projectId: 'p-0001', name: 'x', milestoneId: 'm-other' }))
      .rejects.toBeInstanceOf(DeliverableMilestoneNotFoundError)
    await expect(addDeliverable(domain, { projectId: 'p-0001', name: 'x', milestoneId: 'm-missing' }))
      .rejects.toBeInstanceOf(DeliverableMilestoneNotFoundError)
    expect(domain.table('deliverables').entries().next().done).toBe(true)
  })
})
