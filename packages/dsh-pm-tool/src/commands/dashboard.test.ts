import { describe, it, expect } from 'vitest'
import { parseDashboardScope, readDashboard, readProjectDashboards, handleDashboardCommand } from './dashboard.js'

function fakeDomain(store: Map<string, { value?: unknown; updatedAt?: string }>) {
  return {
    table: () => ({
      get: (k: string) => store.get(k),
      put: (k: string, v: { value?: unknown; updatedAt?: string }) => { store.set(k, v) },
      delete: (k: string) => { store.delete(k) },
      entries: () => store.entries(),
    }),
  } as never
}

const layout = { version: 1, widgets: [{ id: 'w1' }] }

describe('B4 dashboard 项目级作用域', () => {
  it('parseDashboardScope 识别 user/legacy/project:<id>，拒绝非法', () => {
    expect(parseDashboardScope('user')).toEqual({ kind: 'user' })
    expect(parseDashboardScope('project')).toEqual({ kind: 'legacyProject' })
    expect(parseDashboardScope('project:p-0001')).toEqual({ kind: 'project', projectId: 'p-0001' })
    expect(parseDashboardScope('project:x-1')).toBeNull()
    expect(parseDashboardScope('bogus')).toBeNull()
  })

  it('put 项目级隔离写 dashboard_project_<id>，不污染 user/legacy；get 读回；reset 只清本作用域', async () => {
    const store = new Map<string, { value?: unknown }>()
    const domain = fakeDomain(store)
    await handleDashboardCommand(`put project:p-0001 ${JSON.stringify(layout)}`, domain)
    await handleDashboardCommand(`put user ${JSON.stringify({ version: 2, widgets: [] })}`, domain)
    expect(readDashboard(domain, { kind: 'project', projectId: 'p-0001' })).toEqual(layout)
    expect(store.has('dashboard_project_p-0001')).toBe(true)
    const out = readProjectDashboards(domain)
    expect(out['p-0001']).toEqual(layout)
    expect(out['p-0002']).toBeUndefined()

    const get = await handleDashboardCommand('get project:p-0001', domain)
    expect(get.kind).toBe('success')
    expect(JSON.parse(get.text as string)).toEqual(layout)

    await handleDashboardCommand('reset project:p-0001', domain)
    expect(readDashboard(domain, { kind: 'project', projectId: 'p-0001' })).toBeNull()
    // user 与 legacy 不受影响。
    expect(readDashboard(domain, { kind: 'user' })).toEqual({ version: 2, widgets: [] })
  })

  it('非法布局（缺 version/widgets）put 拒绝零写', async () => {
    const store = new Map<string, { value?: unknown }>()
    const domain = fakeDomain(store)
    const bad = await handleDashboardCommand('put user {"foo":1}', domain)
    expect(bad.kind).toBe('error')
    expect(store.size).toBe(0)
  })
})
