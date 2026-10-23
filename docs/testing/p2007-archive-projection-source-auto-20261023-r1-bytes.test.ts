import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'vitest'
import { buildArchiveSnapshot } from './src/core/archive.js'
import { reflectionRecordSchema, type PmDomain } from './src/core/storage.js'
import { projectRecordSchema } from './src/core/project.js'
import { buildReviewMaterials } from './src/core/review-materials.js'

// 原公开封包仅作为值输入；所有调用均为本轮复制的生产模块，不执行采证helper。
const ids = ['ref-mvi5z85j-yk04ji', 'ref-mvk0iiij-42f7xa', 'ref-mvk0n0me-25tmos']
const fixture = (id: string) => JSON.parse(readFileSync(path.join('fixtures', `${id}.json`), 'utf8')).record
const originalRecords = ids.map(id => reflectionRecordSchema.parse(fixture(id)))
const project = projectRecordSchema.parse(fixture('p-0001'))
const expectedKnown = [
  ['完成时刻 2026-10-21', '已登记客观佐证链接（质量由人复核）',
    '关联交付物 dlv-0001（连接字段；交付物本身由交付物台账维护，本字段不自动生成交付物）',
    '资料区已登记：1 条链接、1 项交付物（质量由人复核）'],
  ['达成时刻 2026-10-22'],
  ['验收状态：accepted（验收结论由人确认，草稿不替代验收）', '版本/存放：版本 v1；位置 未填写'],
]
const gap = '待补：关联任务 t-0001「F3-fixture-F5」尚未闭环（未完成/缺证据，留白不编造）'
const expectedGaps = [[], [gap], [gap]]
function freeze(value: unknown) {
  if (!value || typeof value !== 'object') return
  Object.values(value).forEach(freeze)
  Object.freeze(value)
}
function domainFor(records: typeof originalRecords) {
  const tables = new Map<string, Map<string, unknown>>([
    ['projects', new Map([[project.id, structuredClone(project)]])],
    ['reflections', new Map(records.map(r => [r.id, r]))],
    ['tasks', new Map()], ['deliverables', new Map()], ['milestones', new Map()],
  ])
  for (const table of tables.values()) for (const value of table.values()) freeze(value)
  const domain = {
    table(name: string) {
      const table = tables.get(name)
      assert(table, `未预置的领域表：${name}`)
      return {
        get: (key: string) => table.get(key),
        entries: () => table.entries(),
        put: () => { throw new Error('只读投影不得写表') },
        delete: () => { throw new Error('只读投影不得删表') },
      }
    },
  } as unknown as PmDomain
  return { domain, tables }
}
const NOW = '2026-10-23T00:00:00.000Z'

describe('独立生产投影字节断言', () => {
  it('原三事件7known/2gap逐UTF8字节与关联时间一致，跨项目不串，review不退化', () => {
    const records = structuredClone(originalRecords)
    const foreign = reflectionRecordSchema.parse({
      ...records[0], id: 'ref-independent-foreign', projectId: 'p-0002',
      draft: { ...records[0].draft, lines: [{ text: 'FOREIGN-EXCLUDED', mark: 'known' }], gaps: ['FOREIGN-GAP'] },
    })
    const sources = [records[0], foreign, records[1], records[2]]
    const { domain, tables } = domainFor(sources)
    const before = structuredClone([...tables.entries()])
    const snapshot = buildArchiveSnapshot(domain, 'p-0001', NOW)
    assert.deepEqual(snapshot.reflections.map(r => r.id), ids)
    const associations = [
      { taskId: 't-0001', milestoneId: null, deliverableId: null },
      { taskId: null, milestoneId: 'm-0001', deliverableId: null },
      { taskId: null, milestoneId: null, deliverableId: 'dlv-0001' },
    ]
    const events = ['task-done', 'milestone-achieved', 'deliverable-accepted']
    snapshot.reflections.forEach((r, i) => {
      assert.deepEqual(r, {
        id: ids[i], ...associations[i], sourceEvent: events[i], status: 'draft',
        knownLines: expectedKnown[i], gaps: expectedGaps[i],
        createdAt: records[i].createdAt, updatedAt: records[i].updatedAt,
      })
      for (const key of ['knownLines', 'gaps'] as const) {
        const expected = key === 'knownLines' ? expectedKnown[i] : expectedGaps[i]
        const actual = r[key] as string[]
        actual.forEach((s, j) => assert.deepEqual(Buffer.from(s, 'utf8'), Buffer.from(expected[j], 'utf8')))
      }
    })
    assert.equal(snapshot.reflections.flatMap(r => r.knownLines).length, 7)
    assert.equal(snapshot.reflections.flatMap(r => r.gaps).length, 2)
    const review = buildReviewMaterials({
      projectId: 'p-0001', today: '2026-10-23', periodStart: '2026-10-16', periodEnd: '2026-10-23',
      tasks: [], milestones: [], reflections: sources,
    })
    assert.deepEqual(review.reflections.flatMap(r => r.knownLines), expectedKnown.flat())
    assert.equal(review.counts.reflectionKnownLines, 7)
    assert.deepEqual([...tables.entries()], before)
    sources.forEach(r => assert.equal(tables.get('reflections')!.get(r.id), r))
    writeFileSync(path.join(process.env.P2007_SOURCE_AUTO_OUTPUT!, 'original-records-projection.json'),
      `${JSON.stringify({ snapshot, review, knownUTF8: expectedKnown.flat().map(s => Buffer.from(s).toString('hex')),
        gapUTF8: expectedGaps.flat().map(s => Buffer.from(s).toString('hex')) }, null, 2)}\n`, { flag: 'wx' })
  })

  it('真实schema的空lines及pending/blank保留非空gaps，不伪造known且不改原对象', () => {
    const records = [
      reflectionRecordSchema.parse({ ...originalRecords[1], id: 'ref-independent-empty',
        draft: { title: 'empty', at: NOW, lines: [], gaps: ['EMPTY-GAP-1', 'EMPTY-GAP-2'] } }),
      reflectionRecordSchema.parse({ ...originalRecords[2], id: 'ref-independent-unverified',
        draft: { title: 'unverified', at: NOW,
          lines: [{ text: 'PENDING-EXCLUDED', mark: 'pending' }, { text: '', mark: 'blank' }],
          gaps: ['UNVERIFIED-GAP'] } }),
    ]
    const { domain, tables } = domainFor(records)
    const before = structuredClone([...tables.entries()])
    const actual = buildArchiveSnapshot(domain, 'p-0001', NOW)
    assert.deepEqual(actual.reflections.map(r => [r.id, r.knownLines, r.gaps]), [
      ['ref-independent-empty', [], ['EMPTY-GAP-1', 'EMPTY-GAP-2']],
      ['ref-independent-unverified', [], ['UNVERIFIED-GAP']],
    ])
    assert.deepEqual([...tables.entries()], before)
  })

  it('真实schema接受原嵌套记录并拒旧顶层伪fixture，不要求产品兼容非法draft缺失', () => {
    originalRecords.forEach(r => assert(reflectionRecordSchema.safeParse(r).success))
    const { draft, ...rest } = originalRecords[0]
    assert.equal(reflectionRecordSchema.safeParse({ ...rest, lines: draft.lines, gaps: draft.gaps }).success, false)
    assert.equal(reflectionRecordSchema.safeParse({ ...originalRecords[0], id: 'r-0001', sourceEvent: 'task.done' }).success, false)
  })
})
