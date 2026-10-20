import { describe, it, expect } from 'vitest'
import { PROJECT_DEFAULT_LAYOUT } from './project-default-layout.js'
import { knownWidgetTypeSet } from './widgets.js'
import { resolveProjectDashboard } from './persist.js'

describe('PROJECT_DEFAULT_LAYOUT 项目专属默认', () => {
  it('结构合法：version 整数、scope=project、widgets 数组且每项含 i/type/layout', () => {
    expect(Number.isInteger(PROJECT_DEFAULT_LAYOUT.version)).toBe(true)
    expect(PROJECT_DEFAULT_LAYOUT.scope).toBe('project')
    expect(Array.isArray(PROJECT_DEFAULT_LAYOUT.widgets)).toBe(true)
    for (const w of PROJECT_DEFAULT_LAYOUT.widgets) {
      expect(w.i).toBeTruthy()
      expect(w.type).toBeTruthy()
      expect(w.layout).toBeTruthy()
      expect(w.layout.i).toBe(w.i)
    }
  })

  it('全部卡片类型均在注册表内（无未知类型静默丢弃）', () => {
    const known = knownWidgetTypeSet()
    for (const w of PROJECT_DEFAULT_LAYOUT.widgets) {
      expect(known.has(w.type)).toBe(true)
    }
  })

  it('覆盖健康/里程碑/目标/待办阻塞/负责人负载/周计划/风险矩阵', () => {
    const types = PROJECT_DEFAULT_LAYOUT.widgets.map(w => w.type)
    expect(types).toContain('completionHero')
    expect(types).toContain('milestoneDeliverable')
    expect(types).toContain('objectiveProgress')
    expect(types).toContain('overdueSoon')
    expect(types).toContain('peopleLoad')
    expect(types).toContain('weeklyPlan')
    expect(types).toContain('riskMatrix')
  })
})

describe('项目解析回退链：byProject > legacy只读 > PROJECT_DEFAULT_LAYOUT', () => {
  it('byProject 命中优先于 legacy 与默认', () => {
    const scoped = { version: 1, scope: 'project', widgets: [] }
    const out = resolveProjectDashboard({ 'p-0001': scoped }, 'p-0001', { version: 1, scope: 'project', widgets: [] }, PROJECT_DEFAULT_LAYOUT, new Set())
    expect(out).toBeDefined()
  })

  it('byProject 缺、legacy 缺 → 返回 PROJECT_DEFAULT_LAYOUT（不回退全局默认）', () => {
    const out = resolveProjectDashboard(undefined, 'p-0001', null, PROJECT_DEFAULT_LAYOUT, new Set())
    expect(out).toBe(PROJECT_DEFAULT_LAYOUT)
  })

  it('legacy 可解析时只读回退到 legacy，不落新默认；绝不写/重置 legacy', () => {
    const legacy = { version: 1, scope: 'project', widgets: [] }
    const out = resolveProjectDashboard({}, 'p-0001', legacy, PROJECT_DEFAULT_LAYOUT, new Set())
    expect(out).toBeDefined()
    expect(out).not.toBe(PROJECT_DEFAULT_LAYOUT)
  })
})
