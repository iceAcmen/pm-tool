/**
 * 补记队列卡追加（纯函数，便于单测）。
 * 仅在布局末尾空闲行追加 w-queue；不移动/重排任何已有卡片，不改旧卡位置/尺寸/隐藏偏好。
 */
import type { DashboardLayout, WidgetInstance } from './types.js'

/** 布局中是否已含补记队列卡（单实例）。 */
export function hasQueueCard(layout: DashboardLayout): boolean {
  return layout.widgets.some(w => w.type === 'queueCard')
}

/**
 * 返回追加 w-queue 后的新布局；已含 queueCard 时原样返回同一引用（幂等）。
 * 新卡 w=4,h=5,minW=3,minH=3，落在 x=0、y=max(旧卡 y+h) 的末尾空闲行。
 */
export function appendQueueCard(layout: DashboardLayout): DashboardLayout {
  if (hasQueueCard(layout)) return layout
  const y = Math.max(0, ...layout.widgets.map(w => w.layout.y + w.layout.h))
  const widget: WidgetInstance = {
    i: 'w-queue',
    type: 'queueCard',
    config: {},
    layout: { i: 'w-queue', x: 0, y, w: 4, h: 5, minW: 3, minH: 3 },
  }
  return { ...layout, widgets: [...layout.widgets, widget] }
}
