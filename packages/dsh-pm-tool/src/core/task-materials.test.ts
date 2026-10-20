import { describe, it, expect } from 'vitest'
import {
  attachmentItemSchema,
  progressEntrySchema,
  taskAttachmentsSchema,
  taskProgressLogSchema,
  taskCreateSchema,
  taskUpdateSchema,
} from './task.js'
import {
  currentRevision,
  effectiveAt,
  visibleProgressLog,
  taskHasMaterials,
  collectMaterials,
} from './task-materials.js'
import type { AttachmentItem, ProgressEntry } from './task.js'

// B2 纯函数/strict schema 离线单测（零 domain、零网络、零墙钟）。
// 持久化链路（追加/软删/恢复/备份往返）由 scripts/verify-b2-materials.mjs 集成覆盖。

const ISO = '2026-10-20T08:00:00.000Z'

function linkAtt(over: Partial<AttachmentItem & { kind: 'link' }> = {}): AttachmentItem {
  return { id: 'at-1', kind: 'link', url: 'https://example.com/a', addedAt: ISO, ...over } as AttachmentItem
}
function entry(over: Partial<ProgressEntry> = {}): ProgressEntry {
  return {
    id: 'pl-1',
    date: '2026-10-20',
    author: 'Ice',
    createdAt: ISO,
    revisions: [{ id: 'rv-1', date: '2026-10-20', author: 'Ice', content: '首版', revisedAt: ISO }],
    ...over,
  }
}

describe('B2-A02/A07 strict schema：attachments 判别联合与未知键拒绝', () => {
  it('合法 link 项通过；deliverable 软引用项通过', () => {
    expect(attachmentItemSchema.parse(linkAtt())).toMatchObject({ kind: 'link', url: 'https://example.com/a' })
    const d = attachmentItemSchema.parse({
      id: 'at-2', kind: 'deliverable', deliverableId: 'dlv-1', addedAt: ISO, frozenVersion: 'v1.0',
    })
    expect(d.kind).toBe('deliverable')
  })

  it('非法协议 ftp / 超长 / 空 url 被拒', () => {
    expect(() => attachmentItemSchema.parse(linkAtt({ url: 'ftp://example.com/f' }))).toThrow()
    expect(() => attachmentItemSchema.parse(linkAtt({ url: 'https://x.com/' + 'a'.repeat(2048) }))).toThrow()
    expect(() => attachmentItemSchema.parse(linkAtt({ url: '   ' }))).toThrow()
  })

  it('deliverable kind 缺 deliverableId / 错 id 格式被拒；未知键被拒', () => {
    expect(() => attachmentItemSchema.parse({ id: 'at-1', kind: 'deliverable', addedAt: ISO })).toThrow()
    expect(() => attachmentItemSchema.parse({ id: 'at-1', kind: 'deliverable', deliverableId: 'x-1', addedAt: ISO })).toThrow()
    expect(() => attachmentItemSchema.parse({ id: 'at-1', kind: 'link', url: 'https://ok.com', addedAt: ISO, extra: 1 })).toThrow()
  })

  it('资料项 id 重复被数组 schema 拒绝；create/update strictObject 拒收 attachments/progressLog', () => {
    expect(() => taskAttachmentsSchema.parse([linkAtt(), linkAtt()])).toThrow(/唯一/)
    expect(() => taskCreateSchema.parse({
      projectId: 'p-0001', title: 't', attachments: [linkAtt()],
    })).toThrow()
    expect(() => taskUpdateSchema.parse({ attachments: [linkAtt()] })).toThrow()
    expect(() => taskUpdateSchema.parse({ progressLog: [] })).toThrow()
  })

  it('本批仅 deliverable|link：file kind 不被判别联合接受', () => {
    expect(() => attachmentItemSchema.parse({ id: 'at-1', kind: 'file', path: '/x', addedAt: ISO })).toThrow()
  })
})

describe('B2-A08 P3 修订版 append-only schema', () => {
  it('合法条目通过；空 author/空 content 被拒；修订版 id 重复被拒', () => {
    expect(() => progressEntrySchema.parse(entry())).not.toThrow()
    expect(() => progressEntrySchema.parse(entry({ author: '   ' }))).toThrow()
    expect(() => progressEntrySchema.parse(entry({ revisions: [{ id: 'rv-1', date: '2026-10-20', author: 'A', content: 'c', revisedAt: ISO }] }))).not.toThrow()
    expect(() => progressEntrySchema.parse(entry({
      revisions: [
        { id: 'rv-1', date: '2026-10-20', author: 'A', content: 'c1', revisedAt: ISO },
        { id: 'rv-1', date: '2026-10-21', author: 'A', content: 'c2', revisedAt: ISO },
      ],
    }))).toThrow(/唯一/)
    expect(() => progressEntrySchema.parse(entry({ revisions: [] }))).toThrow()
  })

  it('条目 id 重复被数组 schema 拒绝', () => {
    expect(() => taskProgressLogSchema.parse([entry(), entry()])).toThrow(/唯一/)
  })
})

describe('P3 纯派生：current/effective/软删可见/双读材料', () => {
  it('currentRevision 取最后一版，旧版正文保留；effectiveAt 取最新 revisedAt', () => {
    const e = entry({
      revisions: [
        { id: 'rv-1', date: '2026-10-20', author: 'A', content: '首版正文', revisedAt: '2026-10-20T08:00:00.000Z' },
        { id: 'rv-2', date: '2026-10-21', author: 'B', content: '修订正文', revisedAt: '2026-10-21T09:00:00.000Z' },
      ],
    })
    expect(currentRevision(e).content).toBe('修订正文')
    expect(e.revisions[0].content).toBe('首版正文') // 旧版不可覆盖
    expect(effectiveAt(e)).toBe('2026-10-21T09:00:00.000Z')
  })

  it('effectiveAt 缺最新 revisedAt 时回落 createdAt', () => {
    const e = entry()
    expect(effectiveAt(e)).toBe(e.revisions[0].revisedAt)
  })

  it('visibleProgressLog 过滤软删并按 date 倒序', () => {
    const a = entry({ id: 'pl-1', date: '2026-10-19' })
    const b = entry({ id: 'pl-2', date: '2026-10-20' })
    const c = entry({ id: 'pl-3', date: '2026-10-18', deletedAt: ISO })
    const vis = visibleProgressLog({ progressLog: [a, b, c] })
    expect(vis.map(x => x.id)).toEqual(['pl-2', 'pl-1'])
  })

  it('taskHasMaterials 双读：旧 evidenceUrl/deliverableId 与新数组/清单都算材料', () => {
    expect(taskHasMaterials({ evidenceUrl: 'https://ok.com' })).toBe(true)
    expect(taskHasMaterials({ deliverableId: 'dlv-1' })).toBe(true)
    expect(taskHasMaterials({ attachments: [linkAtt()] })).toBe(true)
    expect(taskHasMaterials({ checklist: [{ done: true }] })).toBe(true)
    expect(taskHasMaterials({})).toBe(false)
    // progressLog 叙事不计入完成材料
    expect(taskHasMaterials({ progressLog: [entry()] })).toBe(false)
  })

  it('collectMaterials 合并旧键与新数组，标注来源', () => {
    const rows = collectMaterials({
      evidenceUrl: 'https://legacy.com',
      deliverableId: 'dlv-9',
      attachments: [linkAtt({ url: 'https://new.com' })],
    })
    expect(rows).toHaveLength(3)
    expect(rows.map(r => r.source)).toEqual(['legacy', 'legacy', 'attachments'])
  })
})
