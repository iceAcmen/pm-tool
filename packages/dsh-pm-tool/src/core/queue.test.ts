import { describe, it, expect } from 'vitest'
import {
  deriveQueue,
  inQuietWindow,
  isMuteActive,
  isValidHhmm,
  queueLateDays,
  type QueueTaskInput,
  type MuteMap,
} from './queue.js'

// P1 K11 补记队列：读时派生纯函数离线单测（today/nowHhmm 固定注入，零墙钟/零写）。
// 契约见 docs/design/deep-integration-v2-p1-dev.md §2.2。

const TODAY = '2026-10-18'

function t(over: Partial<QueueTaskInput> & { id: string, title: string }): QueueTaskInput {
  return { status: 'todo', priority: 'P1', progress: 0, dueDate: null, ...over }
}

// ---- 入选规则 ----

describe('K11 入选：到期未达 / 排除规则', () => {
  it('到期未达（dueDate <= today，未 done、progress<100）入选', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 't1', title: '逾期两天', dueDate: '2026-10-16', status: 'in_progress', progress: 30 }),
      t({ id: 't2', title: '今天到期', dueDate: TODAY }),
    ], [], { today: TODAY })
    expect(q.top?.taskId).toBe('t1')
    expect(q.rest.map(i => i.taskId)).toEqual(['t2'])
    // 两个到期未达条目都在队列里（top + rest 合计）。
    expect([q.top, ...q.rest].filter(Boolean).map(i => i!.taskId).sort()).toEqual(['t1', 't2'])
  })

  it('未到期（dueDate > today）不入选', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 't1', title: '五天后到期', dueDate: '2026-10-23' }),
      t({ id: 't2', title: '无截止日', status: 'in_progress', progress: 10 }),
    ], [], { today: TODAY })
    expect(q.top).toBeNull()
    expect(q.rest).toEqual([])
  })

  it('done 或 progress=100 排除（即使逾期）', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 't1', title: '已完成逾期', status: 'done', progress: 100, dueDate: '2026-10-10' }),
      t({ id: 't2', title: '满进度未收尾', status: 'in_progress', progress: 100, dueDate: '2026-10-10' }),
      t({ id: 't3', title: '正常逾期', status: 'todo', dueDate: '2026-10-10' }),
    ], [], { today: TODAY })
    // done / progress=100 两条被排除，只剩 t3（进 top，rest 为空）。
    expect(q.top?.taskId).toBe('t3')
    expect(q.rest).toEqual([])
  })
})

// ---- 排序与迟到天数 ----

describe('K11 排序与迟到天数', () => {
  it('严重度排序：blocked > P0 > 逾期天数（多者在前）> 到期日升序', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 'due1', title: '今天到期普通', dueDate: TODAY, priority: 'P1' }),
      t({ id: 'late2', title: '逾期两天', dueDate: '2026-10-16', priority: 'P1' }),
      t({ id: 'p0', title: 'P0 今天到期', dueDate: TODAY, priority: 'P0', status: 'in_progress' }),
      t({ id: 'late5', title: '逾期五天', dueDate: '2026-10-13', priority: 'P1' }),
      t({ id: 'blk', title: '受阻逾期', status: 'blocked', dueDate: '2026-10-17', priority: 'P2' }),
    ], [], { today: TODAY })
    expect(q.top?.taskId).toBe('blk')
    expect(q.rest.map(i => i.taskId)).toEqual(['p0', 'late5', 'late2', 'due1'])
  })

  it('迟到天数计算：逾期 N 天如实给；今天到期/未来/无日期为 0', () => {
    expect(queueLateDays('2026-10-13', TODAY)).toBe(5)
    expect(queueLateDays(TODAY, TODAY)).toBe(0)
    expect(queueLateDays('2026-10-23', TODAY)).toBe(0)
    expect(queueLateDays(null, TODAY)).toBe(0)
    const q = deriveQueue('p-0001', [
      t({ id: 't1', title: '逾期五天', dueDate: '2026-10-13' }),
      t({ id: 't2', title: '今天到期', dueDate: TODAY }),
    ], [], { today: TODAY })
    const byId = Object.fromEntries([q.top, ...q.rest].filter(Boolean).map(i => [i!.taskId, i!]))
    expect(byId['t1'].lateDays).toBe(5)
    expect(byId['t2'].lateDays).toBe(0)
  })

  it('积压标识：逾期 ≥ LATE_DAYS(3) 天标 backlog，2 天不标', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 'b5', title: '逾期五天积压', dueDate: '2026-10-13' }),
      t({ id: 'b2', title: '逾期两天未达积压档', dueDate: '2026-10-16' }),
    ], [], { today: TODAY })
    const byId = Object.fromEntries([q.top, ...q.rest].filter(Boolean).map(i => [i!.taskId, i!]))
    expect(byId['b5'].backlog).toBe(true)
    expect(byId['b5'].lateDays).toBe(5)
    expect(byId['b2'].backlog).toBe(false)
  })

  it('Top1 + 折叠：top 唯一且不在 rest 重复', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 'a', title: '一', dueDate: '2026-10-16' }),
      t({ id: 'b', title: '二', dueDate: '2026-10-15', priority: 'P0' }),
      t({ id: 'c', title: '三', dueDate: TODAY }),
    ], [], { today: TODAY })
    expect(q.top?.taskId).toBe('b')
    expect(q.rest.map(i => i.taskId)).toEqual(['a', 'c'])
    expect(q.rest.some(i => i.taskId === q.top!.taskId)).toBe(false)
  })
})

// ---- mute 二态 + TTL ----

describe('K11 mute 二态与 ttlDays 过期清理', () => {
  it('mute 后：top 排除、rest 可见且标 muted', () => {
    const mute: MuteMap = { p0: { mutedAt: '2026-10-18T01:00:00.000Z', ttlDays: 7 } }
    const q = deriveQueue('p-0001', [
      t({ id: 'p0', title: '被静音的 P0', dueDate: TODAY, priority: 'P0' }),
      t({ id: 'open', title: '未静音普通逾期', dueDate: '2026-10-16' }),
    ], [], { today: TODAY, mute })
    expect(q.top?.taskId).toBe('open')
    const muted = q.rest.find(i => i.taskId === 'p0')
    expect(muted?.muted).toBe(true)
    expect(muted?.mutedUntil).toBe('2026-10-25')
  })

  it('ttlDays 过期自动失效：过期条目按未静音处理并进 top', () => {
    const mute: MuteMap = {
      fresh: { mutedAt: '2026-10-18T01:00:00.000Z', ttlDays: 7 },
      expired: { mutedAt: '2026-10-01T01:00:00.000Z', ttlDays: 7 },
    }
    expect(isMuteActive(mute.expired, TODAY)).toBe(false)
    expect(isMuteActive(mute.fresh, TODAY)).toBe(true)
    const q = deriveQueue('p-0001', [
      t({ id: 'expired', title: '静音已过期', dueDate: TODAY, priority: 'P0' }),
      t({ id: 'fresh', title: '静音仍有效', dueDate: TODAY, priority: 'P0' }),
    ], [], { today: TODAY, mute })
    expect(q.top?.taskId).toBe('expired')
    expect(q.top?.muted).toBe(false)
    expect(q.rest.find(i => i.taskId === 'fresh')?.muted).toBe(true)
  })

  it('关键项豁免：blocked 或 lateDays>0 的 muted 任务仍进 top', () => {
    const mute: MuteMap = {
      blk: { mutedAt: '2026-10-18T01:00:00.000Z', ttlDays: 7 },
      late: { mutedAt: '2026-10-18T01:00:00.000Z', ttlDays: 7 },
      p0due: { mutedAt: '2026-10-18T01:00:00.000Z', ttlDays: 7 },
    }
    const q = deriveQueue('p-0001', [
      t({ id: 'blk', title: '受阻被静音', status: 'blocked', dueDate: '2026-10-17' }),
      t({ id: 'late', title: '逾期被静音', dueDate: '2026-10-10' }),
      t({ id: 'p0due', title: 'P0 今天到期被静音（非豁免）', dueDate: TODAY, priority: 'P0' }),
    ], [], { today: TODAY, mute })
    expect(q.top?.taskId).toBe('blk')
    expect(q.top?.muted).toBe(true)
    expect(q.rest.map(i => i.taskId).sort()).toEqual(['late', 'p0due'])
    expect(q.rest.find(i => i.taskId === 'late')?.muted).toBe(true)
    expect(q.rest.find(i => i.taskId === 'p0due')?.muted).toBe(true)
  })
})

// ---- K9 缺席 ----

describe('K11 K9 缺席队列', () => {
  it('sessions 有绑定且 updatedAt===createdAt → 缺席条目进 rest，不进 top', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 'abs', title: '绑定后零更新', status: 'in_progress', progress: 10,
        createdAt: '2026-10-15T09:00:00.000Z', updatedAt: '2026-10-15T09:00:00.000Z' }),
      t({ id: 'due', title: '正常逾期', dueDate: '2026-10-16' }),
    ], [{ taskId: 'abs' }], { today: TODAY })
    expect(q.top?.taskId).toBe('due')
    const absent = q.rest.find(i => i.taskId === 'abs')
    expect(absent?.absent).toBe(true)
    expect(absent?.lateDays).toBe(0)
  })

  it('绑定后有更新（updatedAt!==createdAt）→ 不缺席；无绑定 → 不缺席', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 'followed', title: '已跟进', status: 'in_progress', progress: 40,
        createdAt: '2026-10-15T09:00:00.000Z', updatedAt: '2026-10-17T09:00:00.000Z' }),
      t({ id: 'nobind', title: '无绑定', status: 'in_progress', progress: 40,
        createdAt: '2026-10-15T09:00:00.000Z', updatedAt: '2026-10-17T09:00:00.000Z' }),
    ], [{ taskId: 'followed' }], { today: TODAY })
    expect(q.top).toBeNull()
    expect(q.rest).toEqual([])
  })
})

// ---- 时段静默 ----

describe('K11 时段静默 quietMode', () => {
  it('静默时段内：quietMode=true、top 置空、rest 保留', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 'a', title: '逾期', dueDate: '2026-10-16' }),
      t({ id: 'b', title: '今天到期', dueDate: TODAY }),
    ], [], { today: TODAY, nowHhmm: '12:00', quiet: { from: '08:00', to: '20:00' } })
    expect(q.quietMode).toBe(true)
    expect(q.top).toBeNull()
    expect(q.rest.map(i => i.taskId)).toEqual(['a', 'b'])
  })

  it('静默时段外：quietMode=false，top 正常取', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 'a', title: '逾期', dueDate: '2026-10-16' }),
    ], [], { today: TODAY, nowHhmm: '07:00', quiet: { from: '08:00', to: '20:00' } })
    expect(q.quietMode).toBe(false)
    expect(q.top?.taskId).toBe('a')
  })

  it('跨夜窗口（22:00–06:00）判定；nowHhmm 缺省按非静默不误压', () => {
    expect(inQuietWindow('23:30', '22:00', '06:00')).toBe(true)
    expect(inQuietWindow('05:59', '22:00', '06:00')).toBe(true)
    expect(inQuietWindow('12:00', '22:00', '06:00')).toBe(false)
    const q = deriveQueue('p-0001', [t({ id: 'a', title: '逾期', dueDate: '2026-10-16' })], [],
      { today: TODAY, quiet: { from: '22:00', to: '06:00' } })
    expect(q.quietMode).toBe(false)
    expect(q.top?.taskId).toBe('a')
  })

  it('HH:MM 校验：合法通过，非法拒绝', () => {
    expect(isValidHhmm('08:00')).toBe(true)
    expect(isValidHhmm('23:59')).toBe(true)
    expect(isValidHhmm('24:00')).toBe(false)
    expect(isValidHhmm('8:0')).toBe(false)
    expect(isValidHhmm(null)).toBe(false)
  })
})

// ---- 首次打开 / 预留字段 ----

describe('K11 首次打开与预留接线点', () => {
  it('首次打开（无打卡）openedAt=null，队列照常生成', () => {
    const q = deriveQueue('p-0001', [t({ id: 'a', title: '逾期', dueDate: '2026-10-16' })], [], { today: TODAY })
    expect(q.openedAt).toBeNull()
    expect(q.top?.taskId).toBe('a')
  })

  it('openedAt 透传；X7 cycleDue / X8 backfill 本期不产出（条目上不出现）', () => {
    const q = deriveQueue('p-0001', [t({ id: 'a', title: '逾期', dueDate: '2026-10-16' })], [],
      { today: TODAY, openedAt: '2026-10-17T08:00:00.000Z' })
    expect(q.openedAt).toBe('2026-10-17T08:00:00.000Z')
    expect('cycleDue' in q.top!).toBe(false)
    expect('backfill' in q.top!).toBe(false)
  })
})

describe('X2 wrapped 口径：已收尾不进队列', () => {
  it('wrapped 即使到期/逾期也不入选（done 排除规则之外单独剔除）', () => {
    const q = deriveQueue('p-0001', [
      t({ id: 'w1', title: '已收尾逾期', status: 'wrapped', dueDate: '2026-10-16', progress: 0 }),
      t({ id: 'n1', title: '正常逾期', status: 'in_progress', dueDate: '2026-10-16', progress: 20 }),
    ], [], { today: TODAY })
    const ids = [q.top, ...q.rest].filter(Boolean).map(i => i!.taskId)
    expect(ids).toEqual(['n1'])
  })
})
