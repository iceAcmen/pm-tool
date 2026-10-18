/**
 * 可配置仪表盘框架类型（阶段②：卡片库抽屉 + 配置面板 + 筛选/排序 DSL；不含公式）。
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

export type WidgetScope = 'global' | 'project' | 'user'

/** 可作为卡片数据源的实体。 */
export type WidgetEntity =
  | 'projects' | 'tasks' | 'milestones' | 'riskIssues' | 'deliverables' | 'meetings' | 'reports'

/** 筛选算子（白名单，不暴露任意表达式）。 */
export type FilterOp = 'eq' | 'ne' | 'in' | 'gte' | 'lte' | 'contains' | 'isEmpty'

export interface FilterRule {
  field: string
  op: FilterOp
  value: string
}

export interface SortRule {
  field: string
  dir: 'asc' | 'desc'
}

/** 通用卡片配置（ zod 驱动校验在配置面板侧做；这里是运行时结构）。 */
export interface WidgetConfig {
  title?: string
  subtitle?: string
  /** 数据源实体（列表/指标类卡片）。 */
  entity?: WidgetEntity
  /** 项目范围：'all' 或具体 projectId。 */
  projectScope?: 'all' | string
  filters?: FilterRule[]
  sort?: SortRule | null
  /** 显示元素开关（按卡片自定义 key）。 */
  show?: Record<string, boolean>
  numberFormat?: 'pct' | 'int'
  /** textNote 正文。 */
  body?: string
  [key: string]: unknown
}

/** 一个卡片实例（布局 JSON 里的一项）。 */
export interface WidgetInstance {
  i: string
  type: string
  config: WidgetConfig
  layout: LayoutItem
}

export interface DashboardLayout {
  version: number
  scope: WidgetScope
  widgets: WidgetInstance[]
  updatedAt?: string
  updatedBy?: string
  revision?: number
}

export interface WidgetActions {
  openRecord: (projectId: string, type: string, id: string) => void
  pickProject: (id: string) => void
  /**
   * P1-D K11 命令通道接缝：面板接入后透传（execute/run 执行 `queue mute|unmute <id>`）。
   * 可选：分片B 面板接线前缺失时，队列卡不渲染静音按钮（不做僵尸点击）；只读浏览不受影响。
   * 命令行不带 `/pm` 前缀（与面板既有 execute 调用同口径，宿主自行补前缀）。
   */
  runCommand?: (line: string) => Promise<unknown>
  /**
   * 写操作成功后由面板触发快照刷新；返回 false 视为刷新失败（BoardBento 不得给成功态）。
   * 实现可返回 Promise<boolean> / boolean / void；面板接缝必须透传 Promise，不得 void 吞掉。
   */
  refreshBoard?: () => Promise<boolean> | boolean | void
}

/** 联动筛选维度。 */
export type LinkageDim = 'assignee' | 'status' | 'priority' | 'project'

/** 跨卡片联动筛选：dim -> 当前选中值（单值；再点同值取消）。 */
export type LinkageState = Partial<Record<LinkageDim, string>>

export interface WidgetContext<TConfig = WidgetConfig> {
  data: Snapshot
  config: TConfig
  actions: WidgetActions
  isEditing: boolean
  /** 当前联动筛选（浏览态由 BoardBento 注入；编辑态为 undefined）。 */
  linkage?: LinkageState
  /** 点击卡内可联动元素时回调（dim/value；value 为空表示清除该维）。 */
  onLink?: (dim: LinkageDim, value: string) => void
  /** 公式求值器：浏览态由主包惰性注入（expr-eval 在异步块）；未就绪时为 undefined。 */
  evaluateFormula?: (expr: string, ctx: import('./formula.js').FormulaContext) => import('./formula.js').FormulaResult
}

export type WidgetCategory = 'overview' | 'list' | 'kpi' | 'progress' | 'text'

export interface WidgetDescriptor<TConfig = WidgetConfig> {
  type: string
  name: string
  category: WidgetCategory
  /** 是否可被从卡片库添加到画布（内置 7 卡也可移除/再添加）。 */
  addable?: boolean
  /** 公式卡属阶段③，置灰不可加。 */
  disabled?: boolean
  defaultW: number
  defaultH: number
  minW: number
  minH: number
  requiredSources: Array<WidgetEntity>
  defaultConfig: TConfig
  render: (ctx: WidgetContext<TConfig>) => ReactNode
}
