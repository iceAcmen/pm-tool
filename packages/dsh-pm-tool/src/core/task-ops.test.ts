/**
 * task 原子 ops 信封纯引擎单测（零网络、零墙钟、fake domain）。
 * 覆盖：no-op 保留稳定 ID/历史/软删、addLink/addDeliverable(服务端重算冻结)/remove/updateNote、
 * progress add(clientId 别名前向引用)/edit(append rv-2 继承 author/date)/delete/restore、
 * 坏 op 抛错零写、跨项目/非法 URL/重复 alias/向后引用/raw-ops 互斥。
 */
import { describe, it, expect } from 'vitest'
import {
  applyTaskDraftOps,
  rejectRawAndOpsMixed,
  TaskOpsError,
  type TaskDraft,
} from './task-materials.js'
import type { PmDomain } from './storage.js'
import type { AttachmentItem, ProgressEntry } from './task.js'

const ISO = '2026-10-20T08:00:00.000Z'

function fakeDomain(deliverables: Record<string, { projectId: string; version?: string; name?: string }>): PmDomain {
  return {
    table(name: string) {
      if (name === 'deliverables') {
        return { get: (id: string) => deliverables[id] }
      }
      return { get: () => undefined, entries: () => [].values() }
    },
  } as unknown as PmDomain
}

const baseAttachments: AttachmentItem[] = [
  { id: 'at-1', kind: 'link', url: 'https://example.com/old', addedAt: ISO, title: '旧链' },
]
const baseProgress: ProgressEntry[] = [
  {
    id: 'pl-1',
    date: '2026-10-19',
    author: 'Ice',
    createdAt: ISO,
    revisions: [
      { id: 'rv-1', date: '2026-10-19', author: 'Ice', content: '首版', revisedAt: ISO },
      { id: 'rv-2', date: '2026-10-20', author: 'Ray', content: '二版', revisedAt: ISO },
    ],
  },
  {
    id: 'pl-2',
    date: '2026-10-18',
    author: 'Ice',
    createdAt: ISO,
    deletedAt: ISO,
    revisions: [{ id: 'rv-1', date: '2026-10-18', author: 'Ice', content: '已删', revisedAt: ISO }],
  },
]

describe('task ops 信封：no-op 原样保留稳定 ID/历史/软删', () => {
  it('空 ops 不改动既有条目、revisions、deletedAt', () => {
    const out = applyTaskDraftOps(fakeDomain({}), 'p-0001',
      { attachments: baseAttachments, progressLog: baseProgress }, {}, ISO)
    expect(out.attachments).toEqual(baseAttachments)
    expect(out.progressLog).toEqual(baseProgress)
    // 不原地改基
    expect(baseProgress[0].revisions).toHaveLength(2)
  })
})

describe('attachmentOps：分配、重算冻结、摘除、改注', () => {
  it('addLink 续号 at-2；addDeliverable 服务端重算 frozen；remove；updateNote 改 title', () => {
    const domain = fakeDomain({ 'dlv-1': { projectId: 'p-0001', version: 'v2.0', name: '合同.pdf' } })
    const out = applyTaskDraftOps(domain, 'p-0001',
      { attachments: baseAttachments },
      {
        attachmentOps: [
          { op: 'addLink', clientId: 'c-1', url: 'https://example.com/new', note: '新链' },
          { op: 'addDeliverable', clientId: 'c-2', deliverableId: 'dlv-1' },
          { op: 'remove', id: 'at-1' },
          { op: 'updateNote', id: 'at-2', title: '改名' },
        ],
      }, ISO)
    expect(out.attachments.map(a => a.id)).toEqual(['at-2', 'at-3'])
    const dlv = out.attachments.find(a => a.kind === 'deliverable')!
    expect(dlv.kind === 'deliverable' && dlv.frozenVersion).toBe('v2.0')
    expect(dlv.kind === 'deliverable' && dlv.frozenName).toBe('合同.pdf')
    const link = out.attachments.find(a => a.kind === 'link')!
    expect(link.kind === 'link' && link.title).toBe('改名')
  })

  it('跨项目交付物 / 非法 URL / 重复 clientId / 未知 id 抛错零写', () => {
    const domain = fakeDomain({ 'dlv-9': { projectId: 'p-OTHER', version: 'v1', name: 'x' } })
    expect(() => applyTaskDraftOps(domain, 'p-0001', {},
      { attachmentOps: [{ op: 'addDeliverable', deliverableId: 'dlv-9' }] }, ISO)).toThrow(/项目/)
    expect(() => applyTaskDraftOps(fakeDomain({}), 'p-0001', {},
      { attachmentOps: [{ op: 'addLink', url: 'ftp://bad' }] }, ISO)).toThrow()
    expect(() => applyTaskDraftOps(fakeDomain({}), 'p-0001', {},
      { attachmentOps: [
        { op: 'addLink', clientId: 'c-1', url: 'https://a.com' },
        { op: 'addLink', clientId: 'c-1', url: 'https://b.com' },
      ] }, ISO)).toThrow(/重复/)
    expect(() => applyTaskDraftOps(fakeDomain({}), 'p-0001', {},
      { attachmentOps: [{ op: 'remove', id: 'at-99' }] }, ISO)).toThrow(/不存在/)
    // title 只用于 link
    expect(() => applyTaskDraftOps(fakeDomain({ 'dlv-1': { projectId: 'p-0001' } }), 'p-0001',
      { attachments: [{ id: 'at-1', kind: 'deliverable', deliverableId: 'dlv-1', addedAt: ISO }] as AttachmentItem[] },
      { attachmentOps: [{ op: 'updateNote', id: 'at-1', title: 'x' }] }, ISO)).toThrow(/link/)
  })
})

describe('progressOps：alias 引用、edit 追加 revision、delete/restore', () => {
  it('add 用前面 clientId 别名解析；edit 追加 rv-3 继承 author/date 且保留旧版', () => {
    const domain = fakeDomain({})
    const out = applyTaskDraftOps(domain, 'p-0001',
      { attachments: baseAttachments, progressLog: baseProgress },
      {
        attachmentOps: [{ op: 'addLink', clientId: 'c-1', url: 'https://example.com/c' }],
        progressOps: [
          { op: 'add', author: 'Sam', content: '新进展', refs: ['c-1'] },
          { op: 'edit', id: 'pl-1', content: '三版正文', refs: ['at-1'] },
        ],
      }, ISO)
    const added = out.progressLog.find(e => e.id === 'pl-3')!
    expect(added.revisions[0].refs).toEqual(['at-2'])
    const edited = out.progressLog.find(e => e.id === 'pl-1')!
    expect(edited.revisions).toHaveLength(3)
    expect(edited.revisions.map(r => r.id)).toEqual(['rv-1', 'rv-2', 'rv-3'])
    expect(edited.revisions[2].author).toBe('Ray') // 继承 rv-2
    expect(edited.revisions[2].date).toBe('2026-10-20')
    expect(edited.revisions[2].refs).toEqual(['at-1'])
    // 旧版正文未被覆盖
    expect(edited.revisions[0].content).toBe('首版')
  })

  it('delete 软删保留 revisions；restore 清除 deletedAt；重复 delete/restore 按现命令语义抛错', () => {
    const out = applyTaskDraftOps(fakeDomain({}), 'p-0001',
      { progressLog: baseProgress },
      { progressOps: [{ op: 'delete', id: 'pl-1' }, { op: 'restore', id: 'pl-2' }] }, ISO)
    expect(out.progressLog.find(e => e.id === 'pl-1')!.deletedAt).toBe(ISO)
    expect(out.progressLog.find(e => e.id === 'pl-1')!.revisions).toHaveLength(2)
    expect(out.progressLog.find(e => e.id === 'pl-2')!.deletedAt).toBeUndefined()
    expect(() => applyTaskDraftOps(fakeDomain({}), 'p-0001',
      { progressLog: baseProgress }, { progressOps: [{ op: 'delete', id: 'pl-2' }] }, ISO)).toThrow(/软删/)
    expect(() => applyTaskDraftOps(fakeDomain({}), 'p-0001',
      { progressLog: baseProgress }, { progressOps: [{ op: 'restore', id: 'pl-1' }] }, ISO)).toThrow(/可恢复/)
  })

  it('向后引用 clientId / 未知 ref / 编辑已删条目抛错', () => {
    expect(() => applyTaskDraftOps(fakeDomain({}), 'p-0001', {},
      { progressOps: [{ op: 'add', author: 'A', content: 'c', refs: ['c-later'] }] }, ISO)).toThrow(/引用/)
    expect(() => applyTaskDraftOps(fakeDomain({}), 'p-0001', { progressLog: baseProgress },
      { progressOps: [{ op: 'edit', id: 'pl-2', content: 'x' }] }, ISO)).toThrow(/未找到/)
  })
})

describe('raw 数组与 ops 互斥', () => {
  it('同区 raw 与 ops 同传抛 TaskOpsError', () => {
    const mixed: TaskDraft = {
      attachments: [{ kind: 'link', url: 'https://a.com' }],
      attachmentOps: [{ op: 'addLink', url: 'https://b.com' }],
    }
    expect(() => rejectRawAndOpsMixed(mixed)).toThrow(TaskOpsError)
    const mixed2: TaskDraft = {
      progressLog: [{ author: 'A', content: 'c' }],
      progressOps: [{ op: 'add', author: 'A', content: 'c' }],
    }
    expect(() => rejectRawAndOpsMixed(mixed2)).toThrow(/互斥/)
    expect(() => rejectRawAndOpsMixed({})).not.toThrow()
  })
})
