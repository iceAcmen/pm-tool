import { describe, it, expect } from 'vitest'
import { WIDGET_REGISTRY, WIDGET_CATALOG, DEFAULT_LAYOUT, knownWidgetTypeSet } from './widgets.js'
import { loadDashboard } from './persist.js'

// R4：registry 与运行时 renderer 同源完整性——防止类型键映射漂移导致旧卡被误判未知。
describe('WIDGET_REGISTRY 同源完整性', () => {
  it('每个注册类型都带 render，且 catalog 类型 ⊆ registry', () => {
    for (const [type, desc] of WIDGET_REGISTRY) {
      expect(typeof desc.render, `${type} 缺 render`).toBe('function')
      expect(desc.type).toBe(type)
    }
    for (const entry of WIDGET_CATALOG) {
      expect(WIDGET_REGISTRY.has(entry.type), `catalog ${entry.type} 不在 registry`).toBe(true)
    }
  })

  it('默认布局引用的类型全部可渲染（不静默丢卡）', () => {
    for (const w of DEFAULT_LAYOUT.widgets) {
      expect(WIDGET_REGISTRY.has(w.type), `默认布局 ${w.type} 未注册`).toBe(true)
    }
  })

  it('R4 回传的 11 类既有卡全部注册', () => {
    for (const type of [
      'completionHero', 'milestoneDeliverable', 'projectScale', 'objectiveProgress', 'peopleLoad',
      'riskMatrix', 'weeklyPlan', 'completionTrend', 'kpiMetric', 'recordList', 'queueCard',
    ]) {
      expect(WIDGET_REGISTRY.has(type), `${type} 未注册`).toBe(true)
    }
  })

  // DEF-B1 钉住 BoardBento 真实 knownTypes 表达式：helper 必须取到全部 registry key，
  // 经同一 loadDashboard 归一默认布局时 kept=全部、skipped=0（防止 Object.keys(Map)=[] 全跳过回归）。
  it('BoardBento 同源 knownTypes 经 loadDashboard：默认布局全保留、skipped=0', () => {
    const known = knownWidgetTypeSet()
    expect(known.size).toBe(WIDGET_REGISTRY.size)
    const loaded = loadDashboard(DEFAULT_LAYOUT, known)
    expect(loaded).not.toBeNull()
    expect(loaded!.skipped.length, `不应跳过：${loaded!.skipped.join(',')}`).toBe(0)
    expect(loaded!.layout.widgets.length).toBe(DEFAULT_LAYOUT.widgets.length)
  })
})
