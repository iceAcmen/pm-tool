import { describe, it, expect } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { exportProjectMarkdown, renderProjectPlain, renderProjectWebHtml } from './export.js'

const NOTE = '评审备注 <img src=x onerror=alert(1)>'

function deliverable(over: Record<string, unknown> = {}) {
  return {
    id: 'dlv-0001',
    projectId: 'p-0001',
    name: '发布包',
    version: 'v1.0',
    owner: '王五',
    status: 'planned',
    location: '服务器 /release',
    description: '',
    dueDate: null,
    milestoneId: 'm-ok',
    note: NOTE,
    history: [],
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-20T08:00:00.000Z',
    ...over,
  }
}

function bundle(dlv = deliverable()) {
  return {
    project: {
      id: 'p-0001', name: 'P', status: 'active', owner: 'O',
      startDate: '2026-10-01', targetDate: '2026-12-31', description: '', tags: [],
    },
    tasks: [],
    milestones: [],
    deliverables: [dlv],
    reflections: [],
    deliverableById: new Map([[dlv.id, dlv]]),
    reflectionByTask: new Map(),
    fileAssetById: new Map(),
  }
}

function fakeDomain() {
  const tables = new Map<string, Map<string, unknown>>()
  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
    const m = tables.get(name)!
    return {
      get: (k: string) => m.get(k),
      put: async (k: string, v: unknown) => { m.set(k, v) },
      entries: () => m.entries(),
      delete: (k: string) => { m.delete(k) },
    }
  }
  tables.set('projects', new Map([['p-0001', { id: 'p-0001', name: 'P', status: 'active', owner: 'O', startDate: '2026-10-01', targetDate: '2026-12-31', description: '', tags: [] }]]))
  tables.set('deliverables', new Map([['dlv-0001', deliverable()]]))
  return { table } as never
}

describe('U5 deliverable milestoneId/note 三档导出', () => {
  it('Markdown 台账输出关联里程碑与备注', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pm-export-u5-'))
    const { content } = await exportProjectMarkdown(fakeDomain(), 'p-0001', dir, true)
    expect(content).toContain('关联里程碑')
    expect(content).toContain('备注')
    expect(content).toContain('m-ok')
    expect(content).toContain('评审备注')
    expect(content).toContain('&lt;img')
    expect(content).not.toContain('<img src=x')
  })

  it('Web HTML 输出字段并转义恶意备注', () => {
    const html = renderProjectWebHtml(bundle() as never, '2026-10-20T08:00:00.000Z')
    expect(html).toContain('关联里程碑：m-ok')
    expect(html).toContain('评审备注')
    expect(html).toContain('&lt;img')
    expect(html).not.toContain('<img src=x')
  })

  it('plain 输出关联里程碑与备注，无 HTML 标签', () => {
    const text = renderProjectPlain(bundle() as never, '2026-10-20T08:00:00.000Z')
    expect(text).toContain('关联里程碑：m-ok')
    expect(text).toContain('备注：评审备注')
    expect(text).not.toMatch(/<[^>]+>/)
  })
})
