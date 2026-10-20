import { describe, it, expect } from 'vitest'
import {
  visibleProgressLog,
  currentRevision,
  effectiveAt,
  progressDisplayDate,
  collectTaskMaterials,
  findAttachmentById,
  attachmentDisplay,
  formatBytes,
  shortHash,
} from './task-materials-mirror.js'

const rev = (id: string, content: string, revisedAt: string) => ({
  id, date: '2026-10-19', author: 'Ice', content, refs: [], revisedAt,
})

describe('B2 progressLog 只读镜像', () => {
  it('current = 最后一条修订版，旧版正文原样保留', () => {
    const entry = {
      id: 'pl-1', date: '2026-10-19', author: 'Ice', createdAt: '2026-10-19T01:00:00Z',
      revisions: [rev('rv-1', '首版', '2026-10-19T01:00:00Z'), rev('rv-2', '修订版', '2026-10-19T09:00:00Z')],
    }
    const cur = currentRevision(entry)
    expect(cur.id).toBe('rv-2')
    expect(cur.content).toBe('修订版')
    expect(entry.revisions[0].content).toBe('首版')
  })

  it('effectiveAt 取最新修订 revisedAt，缺省回落 createdAt', () => {
    const withRev = {
      id: 'pl-1', date: '2026-10-19', author: 'Ice', createdAt: '2026-10-19T01:00:00Z',
      revisions: [rev('rv-1', 'a', '2026-10-19T01:00:00Z'), rev('rv-2', 'b', '2026-10-19T09:00:00Z')],
    }
    expect(effectiveAt(withRev)).toBe('2026-10-19T09:00:00Z')
    const legacy = {
      id: 'pl-2', date: '2026-10-18', author: 'Ice', createdAt: '2026-10-18T02:00:00Z',
      revisions: [{ id: 'rv-1', date: '2026-10-18', author: 'Ice', content: 'x', refs: [], revisedAt: '' }],
    }
    expect(effectiveAt(legacy)).toBe('2026-10-18T02:00:00Z')
  })

  it('主列表日期优先业务日期而非修订时间，避免 UTC 时间截断成前一天', () => {
    const entry = {
      id: 'pl-1', date: '2026-10-20', author: 'Ice', createdAt: '2026-10-19T16:00:00Z',
      revisions: [{ id: 'rv-1', date: '2026-10-20', author: 'Ice', content: 'x', revisedAt: '2026-10-19T16:00:00Z' }],
    }
    expect(progressDisplayDate(entry)).toBe('2026-10-20')
  })

  it('只展示 !deletedAt，按首版 date 倒序，同日期按 id 兜底', () => {
    const entries = [
      { id: 'pl-1', date: '2026-10-18', author: 'A', createdAt: 'c1', revisions: [rev('rv-1', 'a', 't1')] },
      { id: 'pl-2', date: '2026-10-20', author: 'B', createdAt: 'c2', revisions: [rev('rv-1', 'b', 't2')] },
      { id: 'pl-3', date: '2026-10-20', author: 'C', createdAt: 'c3', deletedAt: '2026-10-20T03:00:00Z', revisions: [rev('rv-1', 'c', 't3')] },
    ]
    const visible = visibleProgressLog({ progressLog: entries })
    expect(visible.map(e => e.id)).toEqual(['pl-2', 'pl-1'])
  })
})

describe('B2 attachments 双读与展示', () => {
  it('合并旧单键 evidenceUrl/deliverableId 与新数组，去重', () => {
    const materials = collectTaskMaterials({
      evidenceUrl: 'https://example.com/spec',
      deliverableId: 'dlv-1',
      attachments: [
        { id: 'at-1', kind: 'link', url: 'https://example.com/spec', addedAt: 't' },
        { id: 'at-2', kind: 'deliverable', deliverableId: 'dlv-2', frozenVersion: 'v2', frozenName: '手册', addedAt: 't' },
      ],
    })
    const links = materials.filter(m => m.kind === 'link')
    const dlvs = materials.filter(m => m.kind === 'deliverable')
    expect(links).toHaveLength(1)
    expect(dlvs.map(d => d.refId)).toEqual(['dlv-1', 'dlv-2'])
  })

  it('findAttachmentById 命中，refs 可解析到资料项', () => {
    const task = {
      attachments: [
        { id: 'at-1', kind: 'link', url: 'https://a.example.com', addedAt: 't' },
        { id: 'at-2', kind: 'deliverable', deliverableId: 'dlv-2', addedAt: 't' },
      ],
    }
    expect(findAttachmentById(task, 'at-2')?.kind).toBe('deliverable')
    expect(findAttachmentById(task, 'missing')).toBeUndefined()
  })

  it('链接回显：有标题用标题，否则取 host；非法协议给纯文本降级', () => {
    expect(attachmentDisplay({ id: 'at-1', kind: 'link', url: 'https://docs.example.com/guide', title: '需求说明书', addedAt: 't' }).label).toBe('需求说明书')
    const bare = attachmentDisplay({ id: 'at-2', kind: 'link', url: 'https://docs.example.com/guide', addedAt: 't' })
    expect(bare.label).toContain('docs.example.com')
    const bad = attachmentDisplay({ id: 'at-3', kind: 'link', url: 'ftp://x/y', addedAt: 't' })
    expect(bare.href).toBe('https://docs.example.com/guide')
    expect(bad.href).toBeNull()
  })

  it('交付物冻结版本/名称快照进展示，源不可用时不崩溃', () => {
    const d = attachmentDisplay({ id: 'at-2', kind: 'deliverable', deliverableId: 'dlv-9', frozenVersion: 'v1.2', frozenName: '验收报告', addedAt: 't' })
    expect(d.label).toContain('验收报告')
    expect(d.label).toContain('v1.2')
  })
})

describe('B3 file 只读元数据分支', () => {
  it('file 附件随收集透传，不与 link/deliverable 去重吞并', () => {
    const materials = collectTaskMaterials({
      attachments: [
        { id: 'at-1', kind: 'link', url: 'https://e.com', addedAt: 't' },
        { id: 'at-2', kind: 'file', fileId: 'f-1', fileName: '设计稿.pdf', size: 204800, hash: 'abcdef1234567890', addedAt: 't' },
      ],
    })
    expect(materials).toHaveLength(2)
    const file = materials.find(m => m.kind === 'file')!
    expect(file.fileName).toBe('设计稿.pdf')
    expect(attachmentDisplay(file).href).toBeNull()
    expect(attachmentDisplay(file).label).toBe('设计稿.pdf')
  })

  it('核心 file 附件以 assetId（fa-N）软引用，mirror 归一到 fileId 供下载 URL', () => {
    const materials = collectTaskMaterials({
      attachments: [
        { id: 'at-9', kind: 'file', assetId: 'fa-3', addedAt: '2026-10-20T00:00:00Z', note: '说明' },
      ],
    })
    const file = materials.find(m => m.kind === 'file')!
    expect(file.assetId).toBe('fa-3')
    expect(file.fileId).toBe('fa-3')
    // 显式 fileId 优先，不被 assetId 覆盖
    const explicit = collectTaskMaterials({
      attachments: [{ id: 'at-9', kind: 'file', fileId: 'f-9', assetId: 'fa-3', addedAt: 't' }],
    })
    expect(explicit[0].fileId).toBe('f-9')
  })

  it('formatBytes 人类可读，非法/缺失返回空串', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(204800)).toContain('KB')
    expect(formatBytes(undefined)).toBe('')
    expect(formatBytes(-1)).toBe('')
  })

  it('shortHash 仅取前 8 位，短哈希原样返回', () => {
    expect(shortHash('abcdef1234567890')).toBe('abcdef12')
    expect(shortHash('ab12')).toBe('ab12')
    expect(shortHash(undefined)).toBe('')
  })
})
