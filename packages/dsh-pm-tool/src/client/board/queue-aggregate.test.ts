import { describe, it, expect } from 'vitest'
import { aggregateQueue, isExemptFromMute } from './queue-aggregate.js'

// K11 看板聚合：snapshot.queue=Record<projectId,Queue> → 合并视图，纯函数零 I/O。

const names = new Map([
  ['p-0001', '项目甲'],
  ['p-0002', '项目乙'],
])

const item = (over: Record<string, unknown>) => over

describe('aggregateQueue：状态判定', () => {
  it('missing：快照无 queue 字段 → state=missing，不给假空态', () => {
    const agg = aggregateQueue(undefined, names)
    expect(agg.state).toBe('missing')
    expect(agg.top).toBeNull()
    expect(agg.rest).toEqual([])
  })

  it('malformed：queue 字段存在但非对象 → state=malformed，不抛错', () => {
    expect(aggregateQueue([], names).state).toBe('malformed')
    expect(aggregateQueue('nope', names).state).toBe('malformed')
    expect(aggregateQueue(null, names).state).toBe('malformed')
  })

  it('ready 空：空对象 → state=ready、top=null、rest=[]（诚实空态由卡片层呈现）', () => {
    const agg = aggregateQueue({}, names)
    expect(agg.state).toBe('ready')
    expect(agg.top).toBeNull()
    expect(agg.rest).toEqual([])
  })
})

describe('aggregateQueue：跨项目合并与排序', () => {
  it('合并两项目条目，条目携带 projectId/projectName', () => {
    const agg = aggregateQueue({
      'p-0001': { top: item({ taskId: 't1', title: '甲逾期', lateDays: 2 }), rest: [] },
      'p-0002': { top: null, rest: [item({ taskId: 't2', title: '乙今天到期', dueDate: '2026-10-18' })] },
    }, names)
    expect(agg.state).toBe('ready')
    expect(agg.top?.taskId).toBe('t1')
    const t2 = agg.rest.find(i => i.taskId === 't2')
    expect(t2?.projectId).toBe('p-0002')
    expect(t2?.projectName).toBe('项目乙')
  })

  it('严重度排序：blocked > P0 > late(逾期天数降序) > due(到期日升序)', () => {
    const agg = aggregateQueue({
      'p-0001': {
        top: null,
        rest: [
          item({ taskId: 'due1', title: '今天到期', dueDate: '2026-10-18' }),
          item({ taskId: 'late2', title: '逾期两天', lateDays: 2 }),
          item({ taskId: 'p0', title: 'P0 今天到期', priority: 'P0' }),
          item({ taskId: 'late5', title: '逾期五天', lateDays: 5 }),
          item({ taskId: 'blk', title: '受阻', status: 'blocked' }),
        ],
      },
    }, names)
    expect(agg.top?.taskId).toBe('blk')
    expect(agg.rest.map(i => i.taskId)).toEqual(['p0', 'late5', 'late2', 'due1'])
  })
})

describe('aggregateQueue：quiet / mute / 豁免', () => {
  it('任一项目 quietMode → quietMode=true、top=null、rest 全保留', () => {
    const agg = aggregateQueue({
      'p-0001': { quietMode: true, top: item({ taskId: 't1', title: '甲' }), rest: [] },
      'p-0002': { top: null, rest: [item({ taskId: 't2', title: '乙' })] },
    }, names)
    expect(agg.quietMode).toBe(true)
    expect(agg.top).toBeNull()
    expect(agg.rest.map(i => i.taskId).sort()).toEqual(['t1', 't2'])
  })

  it('muted 非豁免条目退出 top，仍在 rest；muted 关键项（blocked/迟到>0）豁免进 top', () => {
    const agg = aggregateQueue({
      'p-0001': {
        top: null,
        rest: [
          item({ taskId: 'm-p0', title: '被静音 P0 今天到期', muted: true, priority: 'P0' }),
          item({ taskId: 'm-blk', title: '被静音受阻', muted: true, status: 'blocked' }),
          item({ taskId: 'open', title: '未静音普通逾期', lateDays: 1 }),
        ],
      },
    }, names)
    expect(agg.top?.taskId).toBe('m-blk')
    expect(agg.rest.map(i => i.taskId).sort()).toEqual(['m-p0', 'open'])
    const mp0 = agg.rest.find(i => i.taskId === 'm-p0')
    expect(mp0?.muted).toBe(true)
  })

  it('isExemptFromMute：blocked 或 lateDays>0 豁免，其余不豁免', () => {
    expect(isExemptFromMute({ severity: 'blocked', lateDays: 0 })).toBe(true)
    expect(isExemptFromMute({ severity: 'p0', lateDays: 3 })).toBe(true)
    expect(isExemptFromMute({ severity: 'p0', lateDays: 0 })).toBe(false)
    expect(isExemptFromMute({ severity: 'due', lateDays: 0 })).toBe(false)
  })
})

describe('aggregateQueue：防御性', () => {
  it('单个项目条目形状异常（非对象）跳过，不影响其余项目', () => {
    const agg = aggregateQueue({
      'p-0001': 'broken',
      'p-0002': { top: item({ taskId: 't2', title: '乙' }), rest: [] },
    }, names)
    expect(agg.top?.taskId).toBe('t2')
    expect(agg.rest).toEqual([])
  })

  it('条目缺 taskId 被丢弃，不抛错，且标记 partial（不无声吞掉）', () => {
    const agg = aggregateQueue({
      'p-0001': { top: { title: '无 id' }, rest: [{ title: '也无 id' }] },
    }, names)
    expect(agg.state).toBe('ready')
    expect(agg.top).toBeNull()
    expect(agg.rest).toEqual([])
    expect(agg.partial).toBe(true)
  })
})

describe('aggregateQueue：结构/条目校验（杜绝假空态）', () => {
  it('全坏：{p:null} → malformed，不返回 ready 空', () => {
    expect(aggregateQueue({ 'p-0001': null }, names).state).toBe('malformed')
  })

  it('全坏：{p:{bad:1}}（队列结构异常）→ malformed', () => {
    expect(aggregateQueue({ 'p-0001': { bad: 1 } }, names).state).toBe('malformed')
  })

  it('结构合法但条目全坏（无 taskId）→ ready 空 + partial=true（显式提示，不静默吞掉）', () => {
    const agg = aggregateQueue({ 'p-0001': { top: { id: 'old' }, rest: [] } }, names)
    expect(agg.state).toBe('ready')
    expect(agg.top).toBeNull()
    expect(agg.rest).toEqual([])
    expect(agg.partial).toBe(true)
  })

  it('有好有坏：好队列列出、坏队列跳过，partial=true 显式提示', () => {
    const agg = aggregateQueue({
      'p-0001': { top: item({ taskId: 't1', title: '好条目' }), rest: [] },
      'p-0002': { bad: 1 },
    }, names)
    expect(agg.state).toBe('ready')
    expect(agg.top?.taskId).toBe('t1')
    expect(agg.rest).toEqual([])
    expect(agg.partial).toBe(true)
  })

  it('有好有坏：坏条目（无 taskId）跳过，好条目保留，partial=true', () => {
    const agg = aggregateQueue({
      'p-0001': {
        top: item({ taskId: 't1', title: '好 top' }),
        rest: [{ id: 'old' }, item({ taskId: 't2', title: '好 rest' })],
      },
    }, names)
    expect(agg.state).toBe('ready')
    expect(agg.top?.taskId).toBe('t1')
    expect(agg.rest.map(i => i.taskId)).toEqual(['t2'])
    expect(agg.partial).toBe(true)
  })

  it('合法空：{} 无项目 → ready 空、partial=false（诚实空态）', () => {
    const agg = aggregateQueue({}, names)
    expect(agg.state).toBe('ready')
    expect(agg.top).toBeNull()
    expect(agg.rest).toEqual([])
    expect(agg.partial).toBe(false)
  })

  it('合法空：有效 top:null / rest:[] → ready 空、partial=false', () => {
    const agg = aggregateQueue({ 'p-0001': { top: null, rest: [] } }, names)
    expect(agg.state).toBe('ready')
    expect(agg.top).toBeNull()
    expect(agg.rest).toEqual([])
    expect(agg.partial).toBe(false)
  })
})
