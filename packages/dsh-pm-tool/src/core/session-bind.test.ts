import { describe, it, expect } from 'vitest'
import {
  validateSessionBindInput,
  mergeNotes,
  findSessionRecord,
  buildMergedRecord,
} from './session-bind.js'
import type { SessionRecord } from './storage.js'

// P0 K9：session-bind 纯函数离线单测（零网络/零随机/零墙钟）。

const baseRecord: SessionRecord = {
  id: 'session-abc123-def456',
  projectId: 'p-0001',
  taskId: 't-0001',
  sessionId: 's-0411',
  note: '首次结存：确认了验收范围',
  createdAt: '2026-10-18T01:00:00.000Z',
  updatedAt: '2026-10-18T01:00:00.000Z',
}

describe('validateSessionBindInput：绑定输入校验', () => {
  it('合法输入返回空问题', () => {
    expect(validateSessionBindInput('t-0001', 's-0411', '补充一句')).toEqual([])
  })
  it('空任务 ID / 空会话 ID 报错', () => {
    expect(validateSessionBindInput('', 's-0411').join('；')).toContain('任务 ID 不能为空')
    expect(validateSessionBindInput('t-0001', '').join('；')).toContain('会话 ID 不能为空')
  })
  it('任务 ID 含非法字符报错', () => {
    expect(validateSessionBindInput('t 0001', 's-0411').join('；')).toContain('下划线和连字符')
  })
  it('note 非文本报错', () => {
    expect(validateSessionBindInput('t-0001', 's-0411', 123).join('；')).toContain('结存摘要 note 须为文本')
  })
})

describe('mergeNotes：note 追加合并、去重、去空白', () => {
  it('两段都空返回 undefined', () => {
    expect(mergeNotes(undefined, undefined)).toBeUndefined()
    expect(mergeNotes('   ', '')).toBeUndefined()
  })
  it('仅一段原样保留（trim）', () => {
    expect(mergeNotes('  只此一段  ', undefined)).toBe('只此一段')
  })
  it('两段以「；」连接', () => {
    expect(mergeNotes('第一段', '第二段')).toBe('第一段；第二段')
  })
  it('相同 note 去重不重复堆叠', () => {
    expect(mergeNotes('同一句', '同一句')).toBe('同一句')
  })
})

describe('findSessionRecord：按 taskId + sessionId 精确匹配', () => {
  const entries: [string, unknown][] = [
    ['session-abc123-def456', baseRecord],
    ['session-zzz', { ...baseRecord, id: 'session-zzz', sessionId: 's-0999' }],
  ]
  it('命中同 taskId+sessionId', () => {
    expect(findSessionRecord(entries, 't-0001', 's-0411')?.id).toBe('session-abc123-def456')
  })
  it('sessionId 不同不命中', () => {
    expect(findSessionRecord(entries, 't-0001', 's-0999')?.id).toBe('session-zzz')
    expect(findSessionRecord(entries, 't-0002', 's-0411')).toBeUndefined()
  })
})

describe('buildMergedRecord：合并 note、刷新 updatedAt、保留原身份', () => {
  it('追加新 note 并刷新 updatedAt，保留 id/createdAt', () => {
    const merged = buildMergedRecord(baseRecord, '补充：材料已归档', '2026-10-18T02:00:00.000Z')
    expect(merged.id).toBe(baseRecord.id)
    expect(merged.createdAt).toBe(baseRecord.createdAt)
    expect(merged.updatedAt).toBe('2026-10-18T02:00:00.000Z')
    expect(merged.note).toBe('首次结存：确认了验收范围；补充：材料已归档')
  })
  it('无新 note 时保留原 note', () => {
    const merged = buildMergedRecord(baseRecord, undefined, '2026-10-18T02:00:00.000Z')
    expect(merged.note).toBe('首次结存：确认了验收范围')
  })
})
