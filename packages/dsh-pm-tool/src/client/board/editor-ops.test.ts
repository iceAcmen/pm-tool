import { describe, it, expect } from 'vitest'
import {
  nudgeWidgetLayout, buildFormulaExpression, validateFormulaConfig, serializeDashboardExport,
  snapshotBeforeGeometryChange,
} from './editor-ops.js'
import type { DashboardLayout, WidgetInstance } from './types.js'
import { projectToBreakpoint, reverseFromBreakpoint } from './projection.js'

const w = (i: string, x: number, y: number, w: number, h: number): WidgetInstance => ({
  i, type: 'recordList', config: {}, layout: { i, x, y, w, h, minW: 2, minH: 2 },
})

describe('nudgeWidgetLayout（I7 键盘微调：夹紧 + 碰撞交换，不改入参）', () => {
  it('右移到边界时按 cols-w 夹紧，不越界', () => {
    const widgets = [w('a', 10, 0, 2, 2)]
    const next = nudgeWidgetLayout(widgets, 'a', 5, 0, 12)
    expect(next[0].layout.x).toBe(10) // 10+2=12 已到右边界，夹紧到 10
    expect(next[0].layout.y).toBe(0)
    expect(widgets[0].layout.x).toBe(10) // 入参不变
  })

  it('上移到 y<0 时夹紧到 0', () => {
    const next = nudgeWidgetLayout([w('a', 2, 1, 2, 2)], 'a', 0, -5, 12)
    expect(next[0].layout.y).toBe(0)
  })

  it('落入他卡占用格时与该卡交换坐标，不产生重叠', () => {
    const widgets = [w('a', 0, 0, 2, 2), w('b', 2, 0, 2, 2)]
    const next = nudgeWidgetLayout(widgets, 'a', 2, 0, 12)
    const a = next.find(x => x.i === 'a')!
    const b = next.find(x => x.i === 'b')!
    expect(a.layout.x).toBe(2)
    expect(b.layout.x).toBe(0)
  })

  it('目标格空闲时直接平移', () => {
    const next = nudgeWidgetLayout([w('a', 0, 0, 2, 2), w('b', 6, 0, 2, 2)], 'a', 2, 0, 12)
    expect(next[0].layout.x).toBe(2)
  })

  it('未知 i 原样返回（不抛错）', () => {
    const widgets = [w('a', 0, 0, 2, 2)]
    expect(nudgeWidgetLayout(widgets, 'nope', 1, 0, 12)).toBe(widgets)
  })
})

describe('snapshotBeforeGeometryChange（连续拖拽保留真实操作前状态）', () => {
  it('即使当前 draft 已是拖后坐标，也用 RGL oldItem 重建拖前快照', () => {
    const afterDrag: DashboardLayout = {
      version: 1,
      scope: 'user',
      updatedAt: '2026-10-21',
      revision: 1,
      widgets: [w('a', 6, 4, 2, 2), w('b', 8, 0, 2, 2)],
    }
    const snapshot = snapshotBeforeGeometryChange(
      afterDrag,
      { i: 'a', x: 2, y: 1, w: 2, h: 2 },
      12,
      { projectToBreakpoint, reverseFromBreakpoint },
    )
    expect(snapshot.widgets.find(x => x.i === 'a')?.layout).toMatchObject({ x: 2, y: 1, w: 2, h: 2 })
    expect(snapshot.widgets.find(x => x.i === 'b')?.layout).toMatchObject({ x: 8, y: 0 })
    expect(afterDrag.widgets[0].layout).toMatchObject({ x: 6, y: 4 })
  })

  it('三次连续变化分别生成三个不同操作前快照，可严格逆序恢复', () => {
    const base: DashboardLayout = {
      version: 1,
      scope: 'user',
      updatedAt: '2026-10-21',
      revision: 1,
      widgets: [w('a', 0, 0, 2, 2)],
    }
    const states = [base, 2, 4, 6].reduce<DashboardLayout[]>((acc, x) => {
      if (typeof x !== 'number') return [x]
      const prev = acc.at(-1)!
      acc.push({ ...prev, widgets: prev.widgets.map(item => ({
        ...item,
        layout: { ...item.layout, x },
      })) })
      return acc
    }, [])
    const snapshots = states.slice(1).map((current, index) =>
      snapshotBeforeGeometryChange(
        current,
        states[index].widgets[0].layout,
        12,
        { projectToBreakpoint, reverseFromBreakpoint },
      ),
    )
    expect(snapshots.map(s => s.widgets[0].layout.x)).toEqual([0, 2, 4])
    expect([...snapshots].reverse().map(s => s.widgets[0].layout.x)).toEqual([4, 2, 0])
  })
})

describe('buildFormulaExpression（白名单口径，无自由表达式）', () => {
  it('count 不需要字段：count(rows)', () => {
    expect(buildFormulaExpression({ caliber: 'count', field: '', conditions: [] })).toBe('count(rows)')
  })
  it('sum/avg/rowMin/rowMax 用目标字段拼安全表达式', () => {
    expect(buildFormulaExpression({ caliber: 'sum', field: 'estimate', conditions: [] })).toBe('sum(rows,"estimate")')
    expect(buildFormulaExpression({ caliber: 'avg', field: 'estimate', conditions: [] })).toBe('avg(rows,"estimate")')
    expect(buildFormulaExpression({ caliber: 'rowMin', field: 'estimate', conditions: [] })).toBe('rowMin(rows,"estimate")')
    expect(buildFormulaExpression({ caliber: 'rowMax', field: 'estimate', conditions: [] })).toBe('rowMax(rows,"estimate")')
  })
  it('countIf 取首个有值条件拼 countIf(rows,字段,值)', () => {
    expect(buildFormulaExpression({
      caliber: 'countIf', field: 'status',
      conditions: [{ connector: 'AND', field: 'status', op: 'eq', value: 'done' }],
    })).toBe('countIf(rows,"status","done")')
  })
  it('pct 包一层占比', () => {
    expect(buildFormulaExpression({
      caliber: 'pct', field: 'status',
      conditions: [{ connector: 'AND', field: 'status', op: 'eq', value: 'done' }],
    })).toBe('pct(countIf(rows,"status","done"),count(rows))')
  })
  it('缺字段/缺值返回空串（由校验报错）', () => {
    expect(buildFormulaExpression({ caliber: 'sum', field: '', conditions: [] })).toBe('')
    expect(buildFormulaExpression({ caliber: 'countIf', field: 'status', conditions: [{ connector: 'AND', field: 'status', op: 'eq', value: '' }] })).toBe('')
    expect(buildFormulaExpression({ caliber: '', field: '', conditions: [] })).toBe('')
  })
})

describe('validateFormulaConfig（红错误清单，空 = 可应用）', () => {
  it('口径为空 → 统计口径不能为空', () => {
    expect(validateFormulaConfig({ caliber: '', field: '', conditions: [] })).toContain('统计口径不能为空')
  })
  it('sum 缺目标字段 → 字段错误', () => {
    const errs = validateFormulaConfig({ caliber: 'sum', field: '', conditions: [] })
    expect(errs.some(e => e.includes('目标字段'))).toBe(true)
  })
  it('countIf 条件值缺失 → 条件值错误 + 表达式空错误', () => {
    const errs = validateFormulaConfig({
      caliber: 'countIf', field: 'status',
      conditions: [{ connector: 'AND', field: 'status', op: 'eq', value: '' }],
    })
    expect(errs.some(e => e.includes('右侧值缺失'))).toBe(true)
    expect(errs.some(e => e.includes('表达式预览为空'))).toBe(true)
  })
  it('合法 count → 无错误，应用按钮可用', () => {
    expect(validateFormulaConfig({ caliber: 'count', field: '', conditions: [] })).toEqual([])
  })
  it('合法 countIf（字段+值齐全）→ 无错误', () => {
    const errs = validateFormulaConfig({
      caliber: 'countIf', field: 'status',
      conditions: [{ connector: 'AND', field: 'status', op: 'eq', value: 'done' }],
    })
    expect(errs).toEqual([])
  })
})

describe('serializeDashboardExport（导出紧凑 JSON，结构与落盘一致）', () => {
  it('保留版本/作用域/卡数，剥去运行时冗余', () => {
    const layout: DashboardLayout = {
      version: 1, scope: 'user', updatedAt: '2026-10-20', revision: 3,
      widgets: [
        w('a', 0, 0, 3, 3),
        w('b', 3, 0, 3, 2),
      ],
    }
    const out = JSON.parse(serializeDashboardExport(layout, 'user'))
    expect(out.version).toBe(1)
    expect(out.scope).toBe('user')
    expect(out.revision).toBe(3)
    expect(out.widgets).toHaveLength(2)
    expect(out.widgets[0].layout).toMatchObject({ i: 'a', x: 0, y: 0, w: 3, h: 3 })
    // 不泄露未声明的运行时键
    expect(Object.keys(out.widgets[0]).sort()).toEqual(['config', 'i', 'layout', 'type'])
  })
})
