import { describe, it, expect } from 'vitest'
import {
  idleStaleSnapshot,
  beginRefresh,
  commitRefresh,
  failRefresh,
  isFresh,
  staleStatusLabel,
  lastUpdatedLabel,
} from './stale-placeholder.js'

// F10 / 规范 §12-21：刷新中保留旧数据并标「更新中/陈旧」+最后更新时间，不用空白替换可信旧数据。
// 本模块面向未来远程/AI 路径占位，不启用真实远程，仅校验状态转移口径。

describe('stale-placeholder 状态机', () => {
  it('idle：无数据、不刷新、不陈旧、无错误', () => {
    const s = idleStaleSnapshot()
    expect(s.data).toBeNull()
    expect(s.refreshing).toBe(false)
    expect(s.stale).toBe(false)
    expect(s.updatedAt).toBeNull()
    expect(s.error).toBeNull()
    expect(isFresh(s)).toBe(false)
  })

  it('beginRefresh：保留旧数据与最后更新时间，置更新中，不清空 data', () => {
    const prev = idleStaleSnapshot({ items: [1, 2] }, '2026-10-18T01:00:00Z')
    const next = beginRefresh(prev)
    expect(next.data).toEqual({ items: [1, 2] }) // 旧数据保留
    expect(next.refreshing).toBe(true)
    expect(next.stale).toBe(false)
    expect(next.updatedAt).toBe('2026-10-18T01:00:00Z')
    expect(next.error).toBeNull()
    expect(isFresh(next)).toBe(false)
    expect(staleStatusLabel(next)).toBe('更新中')
  })

  it('commitRefresh：替换新数据，清更新中/陈旧/错误，记录成功时间', () => {
    const prev = beginRefresh(idleStaleSnapshot({ old: 1 }, '2026-10-18T01:00:00Z'))
    const next = commitRefresh(prev, { fresh: true }, '2026-10-18T02:00:00Z')
    expect(next.data).toEqual({ fresh: true })
    expect(next.refreshing).toBe(false)
    expect(next.stale).toBe(false)
    expect(next.updatedAt).toBe('2026-10-18T02:00:00Z')
    expect(next.error).toBeNull()
    expect(isFresh(next)).toBe(true)
    expect(staleStatusLabel(next)).toBe('')
  })

  it('failRefresh：保留旧数据与最后更新时间，标陈旧并记录错误，绝不清空', () => {
    const prev = commitRefresh(
      beginRefresh(idleStaleSnapshot({ keep: '旧数据' }, '2026-10-18T01:00:00Z')),
      { keep: '旧数据' },
      '2026-10-18T01:00:00Z',
    )
    const refreshing = beginRefresh(prev)
    const failed = failRefresh(refreshing, '网络超时')
    expect(failed.data).toEqual({ keep: '旧数据' }) // 旧数据保留，不替换成空白
    expect(failed.refreshing).toBe(false)
    expect(failed.stale).toBe(true)
    expect(failed.updatedAt).toBe('2026-10-18T01:00:00Z')
    expect(failed.error).toBe('网络超时')
    expect(isFresh(failed)).toBe(false)
    expect(staleStatusLabel(failed)).toBe('数据可能已陈旧')
  })

  it('失败后再次刷新成功：陈旧清除，数据替换为新值', () => {
    const failed = failRefresh(beginRefresh(idleStaleSnapshot({ a: 1 }, 't1')), 'boom')
    const refreshed = beginRefresh(failed)
    const ok = commitRefresh(refreshed, { a: 2 }, 't2')
    expect(ok.stale).toBe(false)
    expect(ok.error).toBeNull()
    expect(ok.data).toEqual({ a: 2 })
    expect(isFresh(ok)).toBe(true)
  })

  it('lastUpdatedLabel：ISO 截取 UTC 日期时间，空值/非法返回空串', () => {
    expect(lastUpdatedLabel('2026-10-18T01:05:00Z')).toBe('最后更新 2026-10-18 01:05')
    expect(lastUpdatedLabel('2026-10-18 09:30')).toBe('最后更新 2026-10-18 09:30')
    expect(lastUpdatedLabel(null)).toBe('')
    expect(lastUpdatedLabel(undefined)).toBe('')
    expect(lastUpdatedLabel('')).toBe('')
    expect(lastUpdatedLabel('not-a-date')).toBe('')
  })
})
