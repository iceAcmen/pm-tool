import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  buildArchiveSnapshot,
  writeArchivePackage,
  ArchiveProjectNotFoundError,
  ArchiveTargetExistsError,
} from './archive.js'
import { reflectionRecordSchema, type PmDomain } from './storage.js'
import { buildReviewMaterials } from './review-materials.js'

// K16 最小保存包：只读构建 + 落盘验证（字段覆盖/README/拒覆盖/原数据零改动）。

const AT = '2026-10-09T00:00:00.000Z'
const reflectionCases = [
  {
    record: reflectionRecordSchema.parse({
      id: 'ref-archive-task', projectId: 'p-0001', taskId: 't-0001',
      sourceEvent: 'task-done', status: 'final', createdAt: AT, updatedAt: AT,
      draft: {
        title: '任务复盘', at: AT,
        lines: [
          { text: '联调一次通过', mark: 'known' },
          { text: '性能数据待核', mark: 'pending' },
          { text: '任务证据已保存', mark: 'known' },
          { text: '待补任务截图', mark: 'blank' },
          { text: '任务进度为100', mark: 'known' },
          { text: '任务完成日已记录', mark: 'known' },
        ],
        gaps: [],
      },
    }),
    knownLines: ['联调一次通过', '任务证据已保存', '任务进度为100', '任务完成日已记录'],
    gaps: [],
    association: { taskId: 't-0001', milestoneId: null, deliverableId: null },
  },
  {
    record: reflectionRecordSchema.parse({
      id: 'ref-archive-milestone', projectId: 'p-0001', milestoneId: 'm-0001',
      sourceEvent: 'milestone-achieved', status: 'draft', createdAt: AT, updatedAt: AT,
      draft: {
        title: '里程碑复盘', at: AT,
        lines: [
          { text: '待核里程碑偏差', mark: 'pending' },
          { text: '首版交付已达成', mark: 'known' },
          { text: '待补关联任务', mark: 'blank' },
        ],
        gaps: ['里程碑关联任务尚未闭环'],
      },
    }),
    knownLines: ['首版交付已达成'],
    gaps: ['里程碑关联任务尚未闭环'],
    association: { taskId: null, milestoneId: 'm-0001', deliverableId: null },
  },
  {
    record: reflectionRecordSchema.parse({
      id: 'ref-archive-deliverable', projectId: 'p-0001', deliverableId: 'd-0001',
      sourceEvent: 'deliverable-accepted', status: 'draft', createdAt: AT, updatedAt: AT,
      draft: {
        title: '交付物复盘', at: AT,
        lines: [
          { text: '发布包已验收', mark: 'known' },
          { text: '待核验收工时', mark: 'pending' },
          { text: '验收版本为v1.0', mark: 'known' },
          { text: '待补关联任务', mark: 'blank' },
        ],
        gaps: ['交付物关联任务尚未闭环'],
      },
    }),
    knownLines: ['发布包已验收', '验收版本为v1.0'],
    gaps: ['交付物关联任务尚未闭环'],
    association: { taskId: null, milestoneId: null, deliverableId: 'd-0001' },
  },
]

function freezeRecord(value: unknown) {
  if (!value || typeof value !== 'object') return
  Object.values(value).forEach(freezeRecord)
  Object.freeze(value)
}

function buildFakeDomain() {
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
  const domain = { table } as unknown as PmDomain
  domain.table('projects').put('p-0001', {
    id: 'p-0001', name: '归档项目', owner: '张三', status: 'active',
    startDate: '2026-10-01', targetDate: '2026-12-31', repoUrl: 'https://git.example.com/proj', branch: 'main',
    createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-18T00:00:00.000Z',
  })
  domain.table('tasks').put('t-0001', {
    id: 't-0001', projectId: 'p-0001', code: '1', title: '联调', status: 'done', progress: 100,
    priority: 'P1', assignee: '李四', startDate: '2026-10-02', dueDate: '2026-10-10', completedDate: '2026-10-09',
    evidenceUrl: 'https://evidence.example.com/t1', repoUrl: 'https://git.example.com/t1', branch: 'feature/t1',
    deliverableId: 'd-0001', milestoneId: 'm-0001', description: '完成联调',
  })
  domain.table('deliverables').put('d-0001', {
    id: 'd-0001', projectId: 'p-0001', name: '发布包', version: 'v1.0', owner: '王五',
    status: 'accepted', location: '/dist', dueDate: '2026-10-12', repoUrl: 'https://git.example.com/d1',
    history: [{ at: '2026-10-09T00:00:00.000Z', from: 'submitted', to: 'accepted' }],
    createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-12T00:00:00.000Z',
  })
  domain.table('milestones').put('m-0001', {
    id: 'm-0001', projectId: 'p-0001', title: '首版交付', status: 'achieved',
    targetDate: '2026-10-12', achievedDate: '2026-10-12', description: '里程碑达成',
  })
  domain.table('reflections').put('ref-0001', reflectionRecordSchema.parse({
    id: 'ref-0001', projectId: 'p-0001', taskId: 't-0001', sourceEvent: 'task-done', status: 'final',
    draft: {
      title: '联调复盘', at: AT,
      lines: [
        { text: '联调一次通过', mark: 'known' },
        { text: '性能数据待核', mark: 'pending' },
        { text: '待补：验收截图', mark: 'blank' },
      ],
      gaps: ['待补：验收截图'],
    },
    createdAt: '2026-10-09T00:00:00.000Z', updatedAt: '2026-10-09T00:00:00.000Z',
  }))
  return { domain, tables }
}

let tmpRoot = ''
afterEach(() => { if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true }); tmpRoot = '' })

describe('真实 schema 反思 draft 投影', () => {
  it.each(reflectionCases)('$record.sourceEvent 保留真实ID/关联/known顺序/gaps，不收pending/blank', ({ record, knownLines, gaps, association }) => {
    const { domain, tables } = buildFakeDomain()
    tables.get('reflections')!.clear()
    const source = structuredClone(record)
    freezeRecord(source)
    tables.get('reflections')!.set(source.id, source)
    const before = structuredClone([...tables.entries()])
    const snap = buildArchiveSnapshot(domain, 'p-0001', AT)
    expect(snap.reflections).toEqual([{
      id: record.id, ...association, sourceEvent: record.sourceEvent, status: record.status,
      knownLines, gaps, createdAt: AT, updatedAt: AT,
    }])
    expect([...tables.entries()]).toEqual(before)
    expect(tables.get('reflections')!.get(record.id)).toBe(source)
  })

  it('空lines与仅pending/blank仍保留非空gaps，不伪造known', () => {
    const { domain, tables } = buildFakeDomain()
    tables.get('reflections')!.clear()
    const empty = reflectionRecordSchema.parse({
      ...reflectionCases[2].record, id: 'ref-archive-empty',
      draft: { title: '空草稿', at: AT, lines: [], gaps: ['待补空草稿证据', '待补验收记录'] },
    })
    const unverified = reflectionRecordSchema.parse({
      ...reflectionCases[1].record, id: 'ref-archive-unverified',
      draft: {
        title: '未核草稿', at: AT,
        lines: [{ text: '待核内容', mark: 'pending' }, { text: '', mark: 'blank' }],
        gaps: ['待补未核证据'],
      },
    })
    for (const record of [empty, unverified]) {
      freezeRecord(record)
      tables.get('reflections')!.set(record.id, record)
    }
    const before = structuredClone([...tables.entries()])
    const snap = buildArchiveSnapshot(domain, 'p-0001', AT)
    expect(snap.reflections.map(r => [r.id, r.knownLines, r.gaps])).toEqual([
      ['ref-archive-empty', [], ['待补空草稿证据', '待补验收记录']],
      ['ref-archive-unverified', [], ['待补未核证据']],
    ])
    expect([...tables.entries()]).toEqual(before)
  })

  it('三事件共7行/2gap按源顺序收录，跨项目不串，review7行不退化，原对象不变', () => {
    const { domain, tables } = buildFakeDomain()
    tables.get('reflections')!.clear()
    const foreign = reflectionRecordSchema.parse({
      ...reflectionCases[0].record, id: 'ref-archive-foreign', projectId: 'p-0002',
      draft: { title: '别项目', at: AT, lines: [{ text: '不可串入', mark: 'known' }], gaps: ['别项目缺口'] },
    })
    const sources = [reflectionCases[0].record, foreign, reflectionCases[1].record, reflectionCases[2].record]
      .map(r => structuredClone(r))
    for (const record of sources) {
      freezeRecord(record)
      tables.get('reflections')!.set(record.id, record)
    }
    const before = structuredClone([...tables.entries()])
    const snap = buildArchiveSnapshot(domain, 'p-0001', AT)
    expect(snap.reflections.map(r => r.id)).toEqual([
      'ref-archive-task', 'ref-archive-milestone', 'ref-archive-deliverable',
    ])
    const expected = [
      '联调一次通过', '任务证据已保存', '任务进度为100', '任务完成日已记录',
      '首版交付已达成', '发布包已验收', '验收版本为v1.0',
    ]
    expect(snap.reflections.flatMap(r => r.knownLines)).toEqual(expected)
    expect(snap.reflections.flatMap(r => r.gaps)).toEqual([
      '里程碑关联任务尚未闭环', '交付物关联任务尚未闭环',
    ])
    const review = buildReviewMaterials({
      projectId: 'p-0001', today: '2026-10-18', periodStart: '2026-10-01', periodEnd: '2026-10-18',
      tasks: [], milestones: [], reflections: sources,
    })
    expect(review.reflections.flatMap(r => r.knownLines)).toEqual(expected)
    expect(review.counts.reflectionKnownLines).toBe(7)
    expect([...tables.entries()]).toEqual(before)
    for (const source of sources) expect(tables.get('reflections')!.get(source.id)).toBe(source)
  })
})

describe('buildArchiveSnapshot 只读字段覆盖', () => {
  it('origin/exportedAt/archivedAt + 任务/交付物/证据/复盘known/里程碑 齐全', () => {
    const { domain } = buildFakeDomain()
    const snap = buildArchiveSnapshot(domain, 'p-0001', '2026-10-18T08:00:00.000Z')
    expect(snap.origin).toBe('pm-tool')
    expect(snap.kind).toBe('pm-tool-archive')
    expect(snap.exportedAt).toBe('2026-10-18T08:00:00.000Z')
    expect(snap.archivedAt).toBe('2026-10-18T08:00:00.000Z')
    expect(snap.tasks).toHaveLength(1)
    expect(snap.tasks[0]).toMatchObject({ id: 't-0001', status: 'done', evidenceUrl: 'https://evidence.example.com/t1' })
    expect(snap.deliverables[0]).toMatchObject({ id: 'd-0001', status: 'accepted', history: expect.any(Array) })
    // 证据：任务 evidenceUrl + 任务 repoUrl + 交付物 repoUrl 三类，去重。
    expect(snap.evidence.map(e => e.kind).sort()).toEqual(['deliverable-repo', 'task-evidence', 'task-repo'])
    // 复盘只收 known 行，pending 不进包；gaps 保留。
    expect(snap.reflections[0].knownLines).toEqual(['联调一次通过'])
    expect(snap.reflections[0].gaps).toEqual(['待补：验收截图'])
    expect(snap.milestones[0]).toMatchObject({ id: 'm-0001', status: 'achieved' })
  })

  it('项目不存在抛错；构建不改原数据（只读）', () => {
    const { domain } = buildFakeDomain()
    expect(() => buildArchiveSnapshot(domain, 'p-ghost')).toThrow(ArchiveProjectNotFoundError)
    const before = structuredClone([...domain.table('tasks').entries()])
    buildArchiveSnapshot(domain, 'p-0001')
    expect([...domain.table('tasks').entries()]).toEqual(before)
  })
})

describe('writeArchivePackage 落盘：README / 拒覆盖 / confirm', () => {
  it('生成 package.json 与 README-字段说明.md，含字段说明', async () => {
    const { domain } = buildFakeDomain()
    tmpRoot = mkdtempSync(path.join(tmpdir(), 'p2c-archive-'))
    const target = path.join(tmpRoot, 'pkg')
    const snap = buildArchiveSnapshot(domain, 'p-0001', '2026-10-18T08:00:00.000Z')
    const dir = await writeArchivePackage(snap, target)
    expect(existsSync(path.join(dir, 'package.json'))).toBe(true)
    const readme = await import('node:fs/promises').then(fs => fs.readFile(path.join(dir, 'README-字段说明.md'), 'utf8'))
    expect(readme).toContain('字段说明')
    expect(readme).toContain('exportedAt')
    expect(readme).toContain('origin')
  })

  it('目录已存在且无 confirm 抛 ArchiveTargetExistsError；confirm 覆盖', async () => {
    const { domain } = buildFakeDomain()
    tmpRoot = mkdtempSync(path.join(tmpdir(), 'p2c-archive-'))
    const target = path.join(tmpRoot, 'pkg')
    const snap = buildArchiveSnapshot(domain, 'p-0001', '2026-10-18T08:00:00.000Z')
    await writeArchivePackage(snap, target)
    await expect(writeArchivePackage(snap, target)).rejects.toBeInstanceOf(ArchiveTargetExistsError)
    const again = await writeArchivePackage(snap, target, { confirm: true })
    expect(again).toBe(target)
  })
})
