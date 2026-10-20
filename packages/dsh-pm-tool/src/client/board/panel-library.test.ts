import { describe, it, expect } from 'vitest'
import { filterCatalogItems, locateWidgetByType } from './editor-ops.js'
import type { WidgetInstance } from './types.js'

const catalog = [
  { type: 'recordList', name: '任务清单', category: 'overview' },
  { type: 'completionHero', name: '完成概览', category: 'overview' },
  { type: 'milestoneDeliverable', name: '里程碑交付物', category: 'progress' },
]

const w = (i: string, type: string, x: number, y: number, wSize: number, h: number): WidgetInstance => ({
  i, type, config: { title: i }, layout: { i, x, y, w: wSize, h: h, minW: 2, minH: 2 },
})

describe('D-02 卡片库搜索与空态（纯函数）', () => {
  it('空关键词返回全量，无空态误判', () => {
    expect(filterCatalogItems(catalog, '').length).toBe(3)
    expect(filterCatalogItems(catalog, '   ').length).toBe(3)
  })
  it('按名称/类型大小写不敏感匹配，无匹配返回空数组（触发「无匹配卡片」空态）', () => {
    expect(filterCatalogItems(catalog, '任务').map(d => d.type)).toEqual(['recordList'])
    expect(filterCatalogItems(catalog, 'HERO'.toLowerCase()).map(d => d.type)).toEqual(['completionHero'])
    expect(filterCatalogItems(catalog, '不存在的卡片')).toEqual([])
  })
})

describe('D-02 已在画布·定位（纯函数）', () => {
  it('按类型返回画布首个实例，不改入参', () => {
    const widgets = [w('u1', 'recordList', 0, 0, 4, 4), w('u2', 'completionHero', 0, 4, 4, 7)]
    const before = widgets.map(x => x.layout.y)
    const hit = locateWidgetByType(widgets, 'completionHero')
    expect(hit?.layout.i).toBe('u2')
    expect(widgets.map(x => x.layout.y)).toEqual(before)
  })
  it('类型不在画布时返回 undefined（定位按钮仍安全退出，不抛错）', () => {
    const widgets = [w('u1', 'recordList', 0, 0, 4, 4)]
    expect(locateWidgetByType(widgets, 'completionHero')).toBeUndefined()
  })
})
