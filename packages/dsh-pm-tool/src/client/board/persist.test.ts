import { describe, it, expect } from 'vitest'
import { bboxOverlap, findCollisions, sanitizeLayout, loadDashboard, resolveDashboard, parseLayout } from './persist.js'
import type { DashboardLayout, WidgetInstance } from './types.js'

const w = (i: string, x: number, y: number, w: number, h: number, type = 'recordList'): WidgetInstance => ({
  i, type, config: {}, layout: { i, x, y, w, h, minW: 2, minH: 2 },
})
const layout = (widgets: WidgetInstance[]): DashboardLayout => ({ version: 1, scope: 'user', widgets })

describe('bboxOverlap / findCollisions（R-B3）', () => {
  it('相邻不相交，重叠才判定', () => {
    expect(bboxOverlap(w('a', 0, 0, 4, 3).layout, w('b', 4, 0, 4, 3).layout)).toBe(false)
    expect(bboxOverlap(w('a', 0, 0, 4, 3).layout, w('b', 1, 1, 4, 3).layout)).toBe(true)
  })
  it('findCollisions 返回相交卡对，无碰撞为空', () => {
    const l = layout([w('a', 0, 0, 4, 3), w('b', 0, 0, 4, 3), w('c', 0, 10, 4, 3)])
    expect(findCollisions(l.widgets)).toEqual([['a', 'b']])
    expect(findCollisions(layout([w('a', 0, 0, 4, 3), w('c', 0, 10, 4, 3)]).widgets)).toEqual([])
  })
})

describe('sanitizeLayout（R-B11 夹紧/未知跳过/下沉）', () => {
  const known = new Set(['recordList', 'completionHero'])

  it('越界坐标夹紧到网格，不整份拒绝', () => {
    const raw = layout([w('a', 20, 0, 80, 3)])
    const r = sanitizeLayout(raw, 12, known)
    expect(r.widgets[0].layout.x).toBe(0)
    expect(r.widgets[0].layout.w).toBe(12)
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('未知类型跳过并列名，合法卡保留（不静默重置、不白屏）', () => {
    const raw = layout([w('ghost', 0, 0, 4, 3, 'notARealCard'), w('a', 0, 0, 4, 3)])
    const r = sanitizeLayout(raw, 12, known)
    expect(r.widgets.map(x => x.layout.i)).toEqual(['a'])
    expect(r.skipped.join(';')).toContain('notARealCard')
  })

  it('碰撞卡向下一空行下沉，不静默覆盖对方坐标', () => {
    const raw = layout([w('a', 0, 0, 4, 3), w('b', 0, 0, 4, 3)])
    const r = sanitizeLayout(raw, 12, known)
    const byId = Object.fromEntries(r.widgets.map(x => [x.layout.i, x]))
    expect(byId.a.layout.y).toBe(0)
    expect(byId.b.layout.y).toBe(3)
    expect(findCollisions(r.widgets)).toEqual([])
  })

  it('minW/minH 被尊重，不低于声明下限', () => {
    const raw = layout([{ ...w('a', 0, 0, 1, 1), layout: { i: 'a', x: 0, y: 0, w: 1, h: 1, minW: 3, minH: 2 } }])
    const r = sanitizeLayout(raw, 12, known)
    expect(r.widgets[0].layout.w).toBeGreaterThanOrEqual(3)
    expect(r.widgets[0].layout.h).toBeGreaterThanOrEqual(2)
  })
})

// R4：真实旧布局回归——11 类既有卡全部识别、身份/config/坐标尺寸原样保留，仅跳过未来未知类型，不静默重置。
const KNOWN11 = new Set([
  'completionHero', 'milestoneDeliverable', 'projectScale', 'objectiveProgress', 'peopleLoad',
  'riskMatrix', 'weeklyPlan', 'completionTrend', 'kpiMetric', 'recordList', 'queueCard',
])

describe('旧布局 fixture 回归（11 类不丢/不重叠/不静默重置）', () => {
  const fixture = () => ({
    version: 1, scope: 'user',
    widgets: [
      { i: 'w-hero', type: 'completionHero', config: { note: 'keep' }, layout: { i: 'w-hero', x: 0, y: 0, w: 4, h: 10 } },
      { i: 'w-ms', type: 'milestoneDeliverable', config: {}, layout: { i: 'w-ms', x: 4, y: 0, w: 8, h: 3 } },
      { i: 'w-scale', type: 'projectScale', config: { k: 1 }, layout: { i: 'w-scale', x: 4, y: 3, w: 4, h: 4 } },
      { i: 'w-obj', type: 'objectiveProgress', config: {}, layout: { i: 'w-obj', x: 8, y: 3, w: 4, h: 4 } },
      { i: 'w-load', type: 'peopleLoad', config: {}, layout: { i: 'w-load', x: 4, y: 7, w: 8, h: 3 } },
      { i: 'w-risk', type: 'riskMatrix', config: {}, layout: { i: 'w-risk', x: 0, y: 10, w: 4, h: 4 } },
      { i: 'w-week', type: 'weeklyPlan', config: {}, layout: { i: 'w-week', x: 4, y: 10, w: 8, h: 4 } },
      { i: 'w-trend', type: 'completionTrend', config: {}, layout: { i: 'w-trend', x: 0, y: 14, w: 6, h: 4 } },
      { i: 'w-kpi', type: 'kpiMetric', config: { formula: 'count' }, layout: { i: 'w-kpi', x: 6, y: 14, w: 6, h: 4 } },
      { i: 'w-list', type: 'recordList', config: { entity: 'task' }, layout: { i: 'w-list', x: 0, y: 18, w: 12, h: 4 } },
      { i: 'w-queue', type: 'queueCard', config: {}, layout: { i: 'w-queue', x: 0, y: 22, w: 4, h: 5 } },
      // 未来未知类型：仅跳过这一条，其余原样保留。
      { i: 'w-future', type: 'futureUnknownCard', config: {}, layout: { i: 'w-future', x: 0, y: 28, w: 4, h: 3 } },
    ],
  })

  it('11 类全部保留，身份/config/x/y/w/h 不变，未知仅跳过一条', () => {
    const r = loadDashboard(fixture(), KNOWN11)
    expect(r).not.toBeNull()
    const kept = r!.layout.widgets
    expect(kept).toHaveLength(11)
    expect(r!.skipped).toEqual(['futureUnknownCard（w-future）'])
    const byId = Object.fromEntries(kept.map(x => [x.layout.i, x]))
    // 身份与 config 原样
    expect(byId['w-hero'].config).toEqual({ note: 'keep' })
    expect(byId['w-kpi'].config).toEqual({ formula: 'count' })
    // 坐标/尺寸原样（无越界即不夹紧）
    expect(byId['w-scale'].layout).toMatchObject({ x: 4, y: 3, w: 4, h: 4 })
    expect(byId['w-queue'].layout).toMatchObject({ x: 0, y: 22, w: 4, h: 5 })
    // 无重叠
    expect(findCollisions(kept)).toEqual([])
  })

  it('resolveDashboard 显式 knownTypes 首屏不误删（空集合才回退默认）', () => {
    const fb = parseLayout({ version: 1, scope: 'user', widgets: [] })!
    const out = resolveDashboard(fixture(), null, fb, KNOWN11)
    expect(out.widgets).toHaveLength(11)
    expect(out.widgets.every(x => KNOWN11.has(x.type))).toBe(true)
  })
})
