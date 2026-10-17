import { describe, it, expect } from 'vitest'
import { buildUpdate, TASK_STATUSES } from './task-inline.js'

// PROD-03 行内编辑纯逻辑单测：状态枚举对齐权威 status.ts。

describe('buildUpdate：状态枚举对齐 todo/in_progress/blocked/done', () => {
  it('in_progress（进行中）正确写入，不再被旧白名单丢弃', () => {
    expect(buildUpdate({ status: 'in_progress' })).toEqual({ status: 'in_progress' })
  })

  it('blocked（受阻）正确写入，不再被旧白名单丢弃', () => {
    expect(buildUpdate({ status: 'blocked' })).toEqual({ status: 'blocked' })
  })

  it('todo / done 正常写入', () => {
    expect(buildUpdate({ status: 'todo' })).toEqual({ status: 'todo' })
    expect(buildUpdate({ status: 'done' })).toEqual({ status: 'done' })
  })

  it('非法状态值被丢弃，返回 {}（调用方据此静默返回）', () => {
    expect(buildUpdate({ status: 'xxx' })).toEqual({})
  })

  it('旧枚举残留 doing 不再被接受（历史 bug 不复现）', () => {
    expect(buildUpdate({ status: 'doing' })).toEqual({})
  })

  it('进度 100 联动置 done；合法进度原样 round 落库', () => {
    expect(buildUpdate({ progress: 100 })).toEqual({ progress: 100, status: 'done' })
    expect(buildUpdate({ progress: 55 })).toEqual({ progress: 55 })
  })

  it('合法 dueDate 写入，非法日期丢弃', () => {
    expect(buildUpdate({ dueDate: '2026-12-01' }).dueDate).toBe('2026-12-01')
    expect(buildUpdate({ dueDate: '12/01/2026' })).toEqual({})
  })

  it('转发权威枚举，与 status.ts 单一来源一致', () => {
    expect([...TASK_STATUSES]).toEqual(['todo', 'in_progress', 'blocked', 'done'])
  })
})
