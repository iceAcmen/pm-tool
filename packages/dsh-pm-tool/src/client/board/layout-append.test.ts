import { describe, it, expect } from 'vitest'
import { appendQueueCard, hasQueueCard } from './layout-append.js'
import type { DashboardLayout, WidgetInstance } from './types.js'

// 追加 w-queue 纯函数：只在末尾空闲行追加，不动旧卡，幂等。

const base = (): DashboardLayout => ({
  version: 1,
  scope: 'user',
  widgets: [
    { i: 'w-tasks', type: 'tasks', config: {}, layout: { i: 'w-tasks', x: 0, y: 0, w: 6, h: 4 } },
    { i: 'w-gantt', type: 'gantt', config: {}, layout: { i: 'w-gantt', x: 6, y: 4, w: 6, h: 4 } },
  ],
})

describe('appendQueueCard', () => {
  it('无 queueCard 时追加到末尾空闲行，旧卡深等不变', () => {
    const before = base()
    const oldWidgets = JSON.parse(JSON.stringify(before.widgets))
    const next = appendQueueCard(before)
    expect(next).not.toBe(before)
    expect(next.widgets.slice(0, before.widgets.length)).toEqual(before.widgets)
    expect(JSON.parse(JSON.stringify(before.widgets))).toEqual(oldWidgets)
    const q = next.widgets.find(w => w.type === 'queueCard')
    expect(q).toBeDefined()
    expect(q!.layout).toMatchObject({ i: 'w-queue', x: 0, y: 8, w: 4, h: 5, minW: 3, minH: 3 })
  })

  it('已含 queueCard 时幂等，原样返回同一引用', () => {
    const layout: DashboardLayout = {
      ...base(),
      widgets: [...base().widgets, {
        i: 'w-queue', type: 'queueCard', config: {}, layout: { i: 'w-queue', x: 0, y: 8, w: 4, h: 5 },
      } as WidgetInstance],
    }
    expect(hasQueueCard(layout)).toBe(true)
    expect(appendQueueCard(layout)).toBe(layout)
    expect(layout.widgets.filter(w => w.type === 'queueCard')).toHaveLength(1)
  })

  it('空布局从 y=0 追加', () => {
    const empty: DashboardLayout = { version: 1, scope: 'user', widgets: [] }
    const next = appendQueueCard(empty)
    expect(next.widgets).toHaveLength(1)
    expect(next.widgets[0].layout.y).toBe(0)
  })
})
