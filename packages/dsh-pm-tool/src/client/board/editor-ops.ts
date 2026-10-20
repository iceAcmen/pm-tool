/**
 * 看板编辑器纯逻辑（board 持有，无 DOM / 无写盘副作用，供 vitest 直接覆盖）。
 *
 * 拆分目的（gap B-3/B-4）：把编辑器异步块内原本闭包在组件里的离散动作抽成纯函数，
 * 使「键盘方向键微调（含碰撞交换/边界夹紧）」「公式白名单口径构建与红错误清单」
 * 「导出布局序列化」可在不挂载 React 的单测中断言；组件只负责调用与渲染，行为零变更。
 */
import type { DashboardLayout, FilterRule, WidgetInstance } from './types.js'

export type FilterOp = FilterRule['op']

/* ---------- 键盘微调（拖拽的非指针替代） ---------- */

/**
 * 按 dx/dy 把卡片移动一格；落入他卡占用格时与该卡交换坐标（不产生重叠），
 * 边界按 cols 夹紧（x∈[0, cols-w]，y≥0）。返回新数组，不改入参。
 * 与 editor.tsx 原闭包实现逐行同口径（命中即交换，否则用夹紧后的 nx/ny）。
 */
export function nudgeWidgetLayout(
  widgets: WidgetInstance[],
  i: string,
  dx: number,
  dy: number,
  cols: number,
): WidgetInstance[] {
  const next = widgets.map(w => ({ ...w, layout: { ...w.layout } }))
  const cur = next.find(w => w.layout.i === i)
  if (!cur) return widgets
  const L = cur.layout
  const nx = Math.max(0, Math.min(L.x + dx, cols - L.w))
  const ny = Math.max(0, L.y + dy)
  const hit = next.find(o => o.layout.i !== i
    && nx < o.layout.x + o.layout.w && nx + L.w > o.layout.x
    && ny < o.layout.y + o.layout.h && ny + L.h > o.layout.y)
  if (hit) {
    const hx = hit.layout.x
    const hy = hit.layout.y
    hit.layout.x = L.x
    hit.layout.y = L.y
    cur.layout.x = hx
    cur.layout.y = hy
  } else {
    cur.layout.x = nx
    cur.layout.y = ny
  }
  return next
}

/* ---------- 位置与尺寸：只有明确操作才更新 canonical 草稿 ---------- */
export function applyWidgetGeometry(widgets: WidgetInstance[], id: string, patch: Partial<WidgetInstance['layout']>, cols: number): WidgetInstance[] {
  const target = widgets.find(w => w.layout.i === id)
  if (!target) return widgets
  const width = Math.max(target.layout.minW ?? 1, Math.min(cols, Math.round(patch.w ?? target.layout.w)))
  const height = Math.max(target.layout.minH ?? 1, Math.round(patch.h ?? target.layout.h))
  const fixed = { ...target, layout: { ...target.layout, w: width, h: height,
    x: Math.max(0, Math.min(cols - width, Math.round(patch.x ?? target.layout.x))),
    y: Math.max(0, Math.round(patch.y ?? target.layout.y)) } }
  const placed = [fixed.layout]
  const others = widgets.filter(w => w.layout.i !== id).map(w => {
    const l = { ...w.layout }
    let hit = placed.find(p => p.x < l.x + l.w && l.x < p.x + p.w && p.y < l.y + l.h && l.y < p.y + p.h)
    while (hit) {
      l.y = hit.y + hit.h
      hit = placed.find(p => p.x < l.x + l.w && l.x < p.x + p.w && p.y < l.y + l.h && l.y < p.y + p.h)
    }
    placed.push(l)
    return { ...w, layout: l }
  })
  const next = new Map(others.map(w => [w.layout.i, w]))
  next.set(id, fixed)
  return widgets.map(w => next.get(w.layout.i)!)
}

/** 显式推荐排版：按现有阅读顺序填充多列，只改位置尺寸；配置与卡片实例全部保留。 */
export function arrangeWidgetLayout(widgets: WidgetInstance[], cols: number): WidgetInstance[] {
  const placed: WidgetInstance['layout'][] = []
  return widgets.map(w => {
    const tall = ['completionHero', 'projectScale', 'recordList', 'queueCard'].includes(w.type)
    const wide = ['milestoneDeliverable', 'peopleLoad', 'weeklyPlan', 'completionTrend'].includes(w.type)
    const width = Math.min(cols, Math.max(w.layout.minW ?? 1, wide ? 8 : 4))
    const height = Math.max(w.layout.minH ?? 1, tall ? 7 : wide ? 5 : 4)
    let x = 0, y = 0
    search: for (; y < 10000; y++) {
      for (x = 0; x <= cols - width; x++) {
        if (!placed.some(p => p.x < x + width && x < p.x + p.w && p.y < y + height && y < p.y + p.h)) break search
      }
    }
    const layout = { ...w.layout, x, y, w: width, h: height }
    placed.push(layout)
    return { ...w, layout }
  })
}

/* ---------- 公式卡：白名单口径构建 + 红错误清单（设计 §7，无自由表达式） ---------- */

/** 白名单统计口径（与 formula-expr.ts 注册函数一一对应；不暴露任意文本求值）。 */
export type FormulaCaliber = 'count' | 'sum' | 'avg' | 'rowMin' | 'rowMax' | 'countIf' | 'pct'

export interface FormulaCondition {
  /** 连接词：设计表单固定 AND（OR 留作扩展位，当前不渲染切换）。 */
  connector: 'AND'
  field: string
  op: FilterOp
  value: string
}

export interface FormulaBuildInput {
  /** '' = 未选择口径（非法，触发红错误）。 */
  caliber: '' | FormulaCaliber
  /** 目标数值字段（sum/avg/rowMin/rowMax/countIf/pct 需要；count 不需要）。 */
  field: string
  conditions: FormulaCondition[]
}

/** 口径是否要求目标字段。 */
const CALIBER_NEEDS_FIELD: ReadonlySet<FormulaCaliber> = new Set(['sum', 'avg', 'rowMin', 'rowMax', 'countIf', 'pct'])
/** countIf/pct 的判定值取自首个有值条件。 */
const CALIBER_NEEDS_VALUE: ReadonlySet<FormulaCaliber> = new Set(['countIf', 'pct'])

/** 由白名单口径 + 字段 + 条件构建 expr-eval 安全表达式；口径缺失返回空串（由校验报错）。 */
export function buildFormulaExpression(input: FormulaBuildInput): string {
  const { caliber, field, conditions } = input
  const f = field.trim()
  const value = conditions.find(c => c.value.trim())?.value.trim() ?? ''
  switch (caliber) {
    case 'count': return 'count(rows)'
    case 'sum': return f ? `sum(rows,"${f}")` : ''
    case 'avg': return f ? `avg(rows,"${f}")` : ''
    case 'rowMin': return f ? `rowMin(rows,"${f}")` : ''
    case 'rowMax': return f ? `rowMax(rows,"${f}")` : ''
    case 'countIf': return f && value ? `countIf(rows,"${f}","${value}")` : ''
    case 'pct': return f && value ? `pct(countIf(rows,"${f}","${value}"),count(rows))` : ''
    default: return ''
  }
}

/**
 * 红错误清单（设计 61：口径空 / 条件值缺失 / 表达式空 → 应用禁用）。
 * 返回空数组 = 可应用；每条是直接展示给用户的中文错误串。
 */
export function validateFormulaConfig(input: FormulaBuildInput): string[] {
  const errors: string[] = []
  const { caliber, field, conditions } = input
  if (!caliber) {
    errors.push('统计口径不能为空')
    return errors
  }
  if (CALIBER_NEEDS_FIELD.has(caliber) && !field.trim()) {
    errors.push(`统计口径「${caliberLabel(caliber)}」需要选择目标字段`)
  }
  for (const c of conditions) {
    if (CALIBER_NEEDS_VALUE.has(caliber) && c.field && !c.value.trim()) {
      errors.push(`条件「${c.field} ${opLabel(c.op)}」右侧值缺失，条件不完整`)
    }
  }
  const expr = buildFormulaExpression(input)
  if (!expr) errors.push('表达式预览为空，无法应用')
  return errors
}

function caliberLabel(c: FormulaCaliber): string {
  return ({ count: '计数', sum: '求和', avg: '平均', rowMin: '最小值', rowMax: '最大值', countIf: '条件计数', pct: '占比' } as Record<FormulaCaliber, string>)[c]
}

function opLabel(op: FilterOp): string {
  return ({ eq: '等于', ne: '不等于', in: '属于', gte: '大于等于', lte: '小于等于', contains: '包含', isEmpty: '为空' } as Record<FilterOp, string>)[op]
}

/* ---------- 导出序列化（紧凑 JSON，与落盘结构一致） ---------- */

/** 导出布局：剥去运行时冗余、按 scope 标记，返回紧凑 JSON 串（下载用，不改后端）。 */
export function serializeDashboardExport(layout: DashboardLayout, scope: string): string {
  const slim: DashboardLayout = {
    version: layout.version,
    scope: layout.scope,
    updatedAt: layout.updatedAt,
    updatedBy: layout.updatedBy,
    revision: layout.revision,
    widgets: layout.widgets.map(w => ({
      i: w.i,
      type: w.type,
      config: w.config,
      layout: {
        i: w.layout.i,
        x: w.layout.x,
        y: w.layout.y,
        w: w.layout.w,
        h: w.layout.h,
        minW: w.layout.minW,
        minH: w.layout.minH,
      },
    })),
  }
  return JSON.stringify({ ...slim, scope }, null, 2)
}
