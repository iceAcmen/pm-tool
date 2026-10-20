import { describe, it, expect } from 'vitest'
import {
  createOpsSession,
  validateOps,
  buildDraftOps,
  type AttachmentOp,
  type ProgressOp,
} from './b2-ops.js'

describe('alias / forward refs（create 与 edit 统一走 ops 信封）', () => {
  it('addLink 带 clientId 别名，progress.add refs 前向引用该别名，不发明 at-N', () => {
    const s = createOpsSession()
    s.addLink({ url: 'https://example.com/a', clientId: 'c-1', title: '资料一' })
    s.addProgress({ author: '张三', content: '完成调研', refs: ['c-1'] })
    const draft = buildDraftOps(s.attachmentOps, s.progressOps)
    expect(draft).not.toBeNull()
    expect(draft!.draft.attachmentOps[0]).toMatchObject({ op: 'addLink', clientId: 'c-1', url: 'https://example.com/a' })
    expect(draft!.draft.progressOps[0]).toMatchObject({ op: 'add', author: '张三', refs: ['c-1'] })
    // 不出现 client 自造的 at-N
    const flat = JSON.stringify(draft)
    expect(flat).not.toContain('at-')
  })

  it('addDeliverable 同样可被后续 progress refs 前向引用', () => {
    const s = createOpsSession()
    s.addDeliverable({ deliverableId: 'dlv-9', clientId: 'c-2', note: '交付物快照' })
    s.addProgress({ author: '李四', content: '已交付', refs: ['c-2'] })
    const draft = buildDraftOps(s.attachmentOps, s.progressOps)!
    expect(draft.draft.attachmentOps[0]).toMatchObject({ op: 'addDeliverable', clientId: 'c-2', deliverableId: 'dlv-9' })
    expect(draft.draft.progressOps[0].refs).toEqual(['c-2'])
  })
})

describe('existing edit：在既有条目上增修订/软删/恢复/改注/摘除，未提及项原样保留', () => {
  it('remove / updateNote / progress.edit / delete / restore 按 journal 顺序精确输出', () => {
    const s = createOpsSession()
    s.removeAttachment('at-3')
    s.updateNote('at-1', { note: '更新备注', title: '新标题' })
    s.editProgress('pl-2', { author: '王五', content: '补充进展', date: '2026-10-20' })
    s.deleteProgress('pl-1')
    s.restoreProgress('pl-1')

    const draft = buildDraftOps(s.attachmentOps, s.progressOps)!
    const att: AttachmentOp[] = draft.draft.attachmentOps
    const pro: ProgressOp[] = draft.draft.progressOps
    expect(att[0]).toEqual({ op: 'remove', id: 'at-3' })
    expect(att[1]).toEqual({ op: 'updateNote', id: 'at-1', note: '更新备注', title: '新标题' })
    expect(pro[0]).toEqual({ op: 'edit', id: 'pl-2', author: '王五', content: '补充进展', date: '2026-10-20' })
    expect(pro[1]).toEqual({ op: 'delete', id: 'pl-1' })
    expect(pro[2]).toEqual({ op: 'restore', id: 'pl-1' })
  })

  it('未改动 → 无 ops，buildDraftOps 返回 null（unchanged noops，不发 draft 键）', () => {
    const s = createOpsSession()
    expect(buildDraftOps(s.attachmentOps, s.progressOps)).toBeNull()
  })
})

describe('校验：非法整批零写，错误全部收集', () => {
  it('非 http(s) 链接、空作者/空正文被拒', () => {
    const att: AttachmentOp[] = [{ op: 'addLink', url: 'ftp://bad' }]
    const pro: ProgressOp[] = [
      { op: 'add', author: '', content: 'x' },
      { op: 'add', author: 'a', content: '' },
    ]
    const v = validateOps(att, pro)
    expect(v.ok).toBe(false)
    expect(v.errors.join('\n')).toContain('http(s)')
    expect(v.errors.join('\n')).toContain('作者')
    expect(v.errors.join('\n')).toContain('正文')
  })

  it('addDeliverable 缺 deliverableId 被拒；updateNote 缺目标 id 被拒', () => {
    const v = validateOps(
      [{ op: 'addDeliverable' }, { op: 'updateNote', note: 'x' }],
      [],
    )
    expect(v.ok).toBe(false)
    expect(v.errors.join('\n')).toContain('deliverableId')
    expect(v.errors.join('\n')).toContain('id')
  })
})

describe('submit 精确 JSON 形状', () => {
  it('buildDraftOps 输出 { draft: { attachmentOps, progressOps } }，空数组省略键', () => {
    const s = createOpsSession()
    s.addLink({ url: 'https://e.com', clientId: 'c-1' })
    const draft = buildDraftOps(s.attachmentOps, s.progressOps)!
    expect(Object.keys(draft.draft)).toEqual(['attachmentOps'])
    expect(draft.draft.progressOps).toBeUndefined()
    expect(draft.draft.attachmentOps[0].op).toBe('addLink')
  })
})

describe('B3 addFile 暂存 op 与 forgetClient 撤销', () => {
  it('addFile 分配 clientId、携带 stageId/note，进入 attachmentOps；缺 stageId 校验报错', () => {
    const s = createOpsSession()
    const cid = s.addFile({ stageId: 'a'.repeat(32), note: '附件说明' })
    expect(cid).toMatch(/^c-\d+$/)
    const draft = buildDraftOps(s.attachmentOps, s.progressOps)!
    expect(draft.draft.attachmentOps[0]).toMatchObject({ op: 'addFile', clientId: cid, stageId: 'a'.repeat(32), note: '附件说明' })

    const bad = createOpsSession()
    bad.addFile({ stageId: '   ' })
    const v = validateOps(bad.attachmentOps, bad.progressOps)
    expect(v.ok).toBe(false)
    expect(v.errors.join('\n')).toContain('stageId')
  })

  it('forgetClient 移除该别名的 addFile（及同别名 add），其余 op 保留', () => {
    const s = createOpsSession()
    const cid = s.addFile({ stageId: 'b'.repeat(32) })
    s.addLink({ url: 'https://e.com', clientId: 'c-9' })
    s.forgetClient(cid)
    expect(s.attachmentOps.every(o => o.clientId !== cid)).toBe(true)
    expect(s.attachmentOps.some(o => o.op === 'addLink')).toBe(true)
  })

  it('forgetClient 级联剔除进展 refs 中对该别名的引用，但保留该进展本身', () => {
    const s = createOpsSession()
    const cid = s.addFile({ stageId: 'c'.repeat(32) })
    s.addProgress({ author: '王五', content: '依据附件', refs: [cid, 'at-3'] })
    s.forgetClient(cid)
    const prog = s.progressOps[0]
    expect(prog.op).toBe('add')
    expect(prog.refs).toEqual(['at-3'])
    expect(s.attachmentOps.every(o => o.clientId !== cid)).toBe(true)
  })
})
