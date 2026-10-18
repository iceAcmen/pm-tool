import { describe, it, expect } from 'vitest'
import { buildUpdate, clampProgress, parseProgressInput, TASK_STATUSES } from './task-inline.js'
import { parseCsvTasks, planGridCsvImport } from './csv-import.js'
import type { PmDomain } from './storage.js'

// PROD-03 行内编辑纯逻辑单测：状态枚举对齐权威 status.ts，写路径进度钳制单一来源。

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
    expect([...TASK_STATUSES]).toEqual(['todo', 'in_progress', 'blocked', 'done', 'wrapped'])
  })
})

describe('clampProgress：写路径「必须有值」（非有限 → 0，round，0..100）', () => {
  it('数字/数字字符串 round 后钳制到 0..100', () => {
    expect(clampProgress(80.4)).toBe(80)
    expect(clampProgress(80.6)).toBe(81)
    expect(clampProgress('60')).toBe(60)
    expect(clampProgress(150)).toBe(100)
    expect(clampProgress(-5)).toBe(0)
  })

  it('非有限值回退 0（不写 NaN/Infinity 进库）', () => {
    expect(clampProgress(NaN)).toBe(0)
    expect(clampProgress(Infinity)).toBe(0)
    expect(clampProgress('abc')).toBe(0)
  })
})

describe('parseProgressInput：写路径「可选字段」（空/非法 → undefined 不写）', () => {
  it('数字与数字字符串合法解析为 round 后的 0..100', () => {
    expect(parseProgressInput(80)).toBe(80)
    expect(parseProgressInput('80')).toBe(80)
    expect(parseProgressInput(80.4)).toBe(80)
    expect(parseProgressInput(80.6)).toBe(81)
  })

  it('越界值钳制：150→100，-5→0', () => {
    expect(parseProgressInput(150)).toBe(100)
    expect(parseProgressInput(-5)).toBe(0)
  })

  it('null / undefined / 空串 / 纯空白 → undefined（不写该字段）', () => {
    expect(parseProgressInput(null)).toBeUndefined()
    expect(parseProgressInput(undefined)).toBeUndefined()
    expect(parseProgressInput('')).toBeUndefined()
    expect(parseProgressInput('   ')).toBeUndefined()
  })

  it('NaN / Infinity / 非数字串 → undefined', () => {
    expect(parseProgressInput(NaN)).toBeUndefined()
    expect(parseProgressInput(Infinity)).toBeUndefined()
    expect(parseProgressInput('abc')).toBeUndefined()
  })
})

describe('CSV 进度列行为（parseCsvTasks，与改前等价）', () => {
  const csv = [
    '标题,进度',
    '任务A,80',
    '任务B,80%',
    '任务C,',
    '任务D,abc',
    '任务E,150',
    '任务F,-5',
    '任务G,  ',
  ].join('\n')

  const rows = parseCsvTasks(csv)
  const byTitle = Object.fromEntries(rows.map(r => [r.title, r.progress]))

  it('整数与百分号等价解析为同一数值', () => {
    expect(byTitle['任务A']).toBe(80)
    expect(byTitle['任务B']).toBe(80)
  })

  it('空 / 纯空白 / 非法串 → undefined（不写进度）', () => {
    expect(byTitle['任务C']).toBeUndefined()
    expect(byTitle['任务G']).toBeUndefined()
    expect(byTitle['任务D']).toBeUndefined()
  })

  it('越界钳制：150→100，-5→0', () => {
    expect(byTitle['任务E']).toBe(100)
    expect(byTitle['任务F']).toBe(0)
  })
})

describe('网格导入路径（planGridCsvImport → parseGridTasks）进度列同口径', () => {
  // 仅需满足 ensureProject 的最小 mock，不触碰真实存储。
  const mockDomain = {
    table: () => ({ get: (id: string) => (id === 'p-0001' ? { id: 'p-0001', name: '测试项目' } : undefined) }),
  } as unknown as PmDomain

  it('百分号/空行正常出计划，深度与编号不被进度解析影响', () => {
    const grid = [
      ['标题', '进度'],
      ['父任务', '80%'],
      ['子任务', ''],
    ]
    const plan = planGridCsvImport(mockDomain, 'p-0001', grid)
    expect(plan.total).toBe(2)
    expect(plan.outline.map(o => o.title)).toEqual(['父任务', '子任务'])
    expect(plan.outline.map(o => o.code)).toEqual(['1', '2'])
  })
})
