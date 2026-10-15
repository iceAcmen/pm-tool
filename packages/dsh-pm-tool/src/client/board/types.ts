/**
 * 可配置仪表盘框架类型（阶段①：只读喂数 + 布局编辑；不做筛选/排序 DSL、不做公式）。
 * 设计见 docs/可配置仪表盘技术方案.md §4。
 */
import type { ReactNode } from 'react'
import type { Snapshot } from '../panel.js'

/** 栅格规格：12 列，行高 36px，边距 [12,12]。 */
export const GRID = {
  cols: 12,
  rowHeight: 36,
  margin: [12, 12] as [number, number],
  breakpoints: { lg: 1200, md: 996, sm: 768 } as const,
  colsByBreakpoint: { lg: 12, md: 8, sm: 4 } as const,
}

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  static?: boolean
}

export type WidgetScope = 'global' | 'user'

/** 一个卡片实例（布局 JSON 里的一项）。 */
export interface WidgetInstance {
  i: string
  type: string
  config: Record<string, unknown>
  layout: LayoutItem
}

export interface DashboardLayout {
  version: number
  scope: WidgetScope
  widgets: WidgetInstance[]
}

export interface WidgetActions {
  openRecord: (projectId: string, type: string, id: string) => void
  pickProject: (id: string) => void
}

export interface WidgetContext<TConfig = Record<string, unknown>> {
  data: Snapshot
  config: TConfig
  actions: WidgetActions
  isEditing: boolean
}

export interface WidgetDescriptor<TConfig = Record<string, unknown>> {
  type: string
  name: string
  category: 'overview' | 'list' | 'kpi' | 'progress' | 'text'
  defaultW: number
  defaultH: number
  minW: number
  minH: number
  requiredSources: Array<'projects' | 'tasks' | 'milestones' | 'riskIssues' | 'deliverables' | 'meetings' | 'reports'>
  defaultConfig: TConfig
  render: (ctx: WidgetContext<TConfig>) => ReactNode
}
