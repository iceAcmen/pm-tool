/**
 * PROD-22 方案A：甘特排期几何纯函数（无 React/DOM，可离线单测）。
 * 只用现有 startDate/dueDate/targetDate/progress/predecessorIds，不新增表、不做自动排程。
 * 全部为只读派生：不写库、不调用任何写命令；依赖关系唯一真源是 predecessorIds。
 */
import type { TaskProgress } from './progress-derivation.js'

const DAY = 86_400_000

export interface GanttTask {
  id: string
  startDate?: string
  dueDate?: string
}

/** 计算项目整体日期范围 [minStart, maxEnd]（天粒度）；无日期返回 null。 */
export function dateRange(items: { startDate?: string, dueDate?: string, targetDate?: string }[], padDays = 3): { start: string, end: string } | null {
  let min = Infinity
  let max = -Infinity
  for (const it of items) {
    const s = it.startDate ?? it.targetDate
    const e = it.dueDate ?? it.targetDate
    if (s) min = Math.min(min, Date.parse(s))
    if (e) max = Math.max(max, Date.parse(e))
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  const fmt = (t: number) => new Date(t).toISOString().slice(0, 10)
  return { start: fmt(min - padDays * DAY), end: fmt(max + padDays * DAY) }
}

/** 某日期相对轴起点的天数偏移。 */
export function daysFrom(date: string, axisStart: string): number {
  return Math.round((Date.parse(date) - Date.parse(axisStart)) / DAY)
}

/**
 * 拖拽：把像素增量转成“整体平移 N 天”，返回新的起止日期（按天取整）。
 * pxPerDay 为每天像素宽；钳制 start<=due（保持原时长平移，不改变长度）。
 * 返回值只含 startDate/dueDate 两键——拖拽落库白名单，不碰 progress/predecessorIds。
 */
export function shiftDatesByDrag(
  startDate: string,
  dueDate: string,
  deltaPx: number,
  pxPerDay: number,
): { startDate: string, dueDate: string } {
  const shiftDays = Math.round(deltaPx / pxPerDay)
  const day = (d: string, n: number) => new Date(Date.parse(d) + n * DAY).toISOString().slice(0, 10)
  let ns = day(startDate, shiftDays)
  let nd = day(dueDate, shiftDays)
  // 非法区间钳制：start 不得晚于 due
  if (Date.parse(ns) > Date.parse(nd)) { nd = ns }
  return { startDate: ns, dueDate: nd }
}

/** 任务条几何：leftDays/widthDays，供渲染。仅“两条都有”才出条。 */
export function barGeometry(task: GanttTask, axisStart: string, _axisDays: number) {
  if (!task.startDate || !task.dueDate) return null
  const s = daysFrom(task.startDate, axisStart)
  const e = daysFrom(task.dueDate, axisStart)
  return { leftDays: s, widthDays: Math.max(1, e - s + 1) }
}

/** 今天在轴上的天数偏移（用于参考线）。超出轴范围的绘制钳制由渲染层负责。 */
export function todayOffset(axisStart: string, today: string): number {
  return daysFrom(today, axisStart)
}

/** 工期天数（含端点）：单日 = 1。ARIA 与 tooltip 用。 */
export function taskDurationDays(startDate: string, dueDate: string): number {
  return Math.max(1, Math.round((Date.parse(dueDate) - Date.parse(startDate)) / DAY) + 1)
}

/**
 * @deprecated v0.8 客观进度上线后，此函数用 legacy progress/status 伪造完成度，
 * 与客观口径冲突（status==='done' 无清单信号也返回 1）。阶段二冻结原实现一行不动、
 * 禁止新增调用点；阶段三 UI 切换到 progressFill 后删除本函数。
 */
export function progressRatio(progress: number | undefined, status?: string): number {
  if (status === 'done') return 1
  const p = Number.isFinite(progress) ? (progress as number) : 0
  return Math.min(1, Math.max(0, p / 100))
}

/**
 * v0.8 客观进度填充比例（纯渲染，无 I/O、无写副作用）。
 * 入参为真源 progress-derivation 的 TaskProgress：
 *  - value===null → 返回 null（无填充：不画实心条、不显示百分比；
 *    与 value===0 返回 0 严格区分——0 是「0% 填充」，null 是「证据不足/无填充」）；
 *  - value 有值时 value/100，钳制 0..1。
 * 函数签名不接收 status：status==='done' 但无清单信号绝不伪造 100% 完成。
 */
export function progressFill(p: TaskProgress): number | null {
  if (p.value === null) return null
  return Math.min(1, Math.max(0, p.value / 100))
}

/** MM-DD 短日期（条内/外置标签用）。 */
export function shortDate(iso: string): string {
  return iso.slice(5)
}

/**
 * 窄条标签三态决策（GI-PURE-06，确定无随机）：
 *  - inside：条足够宽，日期文字放条内；
 *  - outside：条窄，日期外置到条右侧行侧，不溢出画布；
 *  - hidden：过窄，条内不硬塞，仅 tooltip/标签列可读。
 */
export type BarLabelPolicy = 'inside' | 'outside' | 'hidden'
export function barLabelPolicy(widthDays: number, pxPerDay: number): BarLabelPolicy {
  const barPx = widthDays * pxPerDay
  if (barPx >= 88) return 'inside'   // ≈6 天@16px：放得下 "MM-DD ~ MM-DD"
  if (barPx >= 28) return 'outside' // ≈2 天@16px：外置
  return 'hidden'
}

/**
 * 父任务条只读派生范围：子任务 min(start) ~ max(due)。
 * 父条不被当作独立排期源，本函数绝不回写父任务日期；无排期子任务返回 null。
 */
export function parentBarRange(children: { startDate?: string, dueDate?: string }[]): { start: string, end: string } | null {
  let min = Infinity
  let max = -Infinity
  for (const c of children) {
    if (c.startDate) min = Math.min(min, Date.parse(c.startDate))
    if (c.dueDate) max = Math.max(max, Date.parse(c.dueDate))
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  const fmt = (t: number) => new Date(t).toISOString().slice(0, 10)
  return { start: fmt(min), end: fmt(max) }
}

/** 里程碑单点横坐标（天偏移）；无 targetDate 返回 null——不画、不出现 NaN。 */
export function milestoneOffset(m: { targetDate?: string }, axisStart: string): number | null {
  if (!m.targetDate) return null
  return daysFrom(m.targetDate, axisStart)
}

// ---------- 依赖边（Finish-to-Start，只读派生） ----------

export interface GanttDepTask extends GanttTask {
  predecessorIds?: string[]
}

export interface GanttEdge {
  fromId: string // 前置（A 条右缘出发）
  toId: string   // 后继（B 条左缘到达）
  x1: number; y1: number // 起点 px（相对画布原点）
  x2: number; y2: number // 终点 px
}

export interface GanttEdgeReport {
  edges: GanttEdge[]
  skipped: { selfLoop: number, dangling: number, cycle: number, missingDate: number }
  cycleTaskIds: string[]
}

/** 在 predecessorIds 图（边：前置→后继）上找成环节点集合（3 色 DFS，不递归死循环）。 */
function findCycleTaskIds(tasks: GanttDepTask[]): Set<string> {
  const byId = new Map(tasks.map(t => [t.id, t]))
  const succ = new Map<string, string[]>()
  for (const t of tasks) {
    for (const pid of t.predecessorIds ?? []) {
      if (pid === t.id || !byId.has(pid)) continue // 自指/悬空不入图
      const arr = succ.get(pid) ?? []
      arr.push(t.id)
      succ.set(pid, arr)
    }
  }
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map<string, number>(tasks.map(t => [t.id, WHITE]))
  const cycle = new Set<string>()
  for (const start of tasks) {
    if (color.get(start.id) !== WHITE) continue
    color.set(start.id, GRAY)
    const stack: [string, number][] = [[start.id, 0]]
    while (stack.length) {
      const top = stack[stack.length - 1]
      const list = succ.get(top[0]) ?? []
      if (top[1] >= list.length) {
        color.set(top[0], BLACK)
        stack.pop()
        continue
      }
      const next = list[top[1]]
      top[1]++
      const c = color.get(next) ?? WHITE
      if (c === GRAY) {
        // 命中回边：从 next 到栈顶的环上节点全部标记
        for (let k = stack.length - 1; k >= 0; k--) {
          cycle.add(stack[k][0])
          if (stack[k][0] === next) break
        }
      } else if (c === WHITE) {
        color.set(next, GRAY)
        stack.push([next, 0])
      }
    }
  }
  return cycle
}

/**
 * 计算 FS 依赖边像素几何（A.dueDate 条右缘 → B.startDate 条左缘）。
 * 真源唯一：只读 predecessorIds，不读任何派生缓存字段。
 * 诚实降级：自指 / 悬空 / 成环 / 缺日期 一律不画该边，并计入 skipped；函数不抛异常。
 * rowIndexOf 缺省按数组下标；行高缺省 24px（与 .pm-gantt-row 一致）。
 */
export function dependencyEdges(
  tasks: GanttDepTask[],
  axisStart: string,
  pxPerDay: number,
  opts: { rowHeight?: number, rowIndexOf?: (id: string) => number } = {},
): GanttEdgeReport {
  const rowHeight = opts.rowHeight ?? 24
  const idxOf = opts.rowIndexOf ?? ((id: string) => tasks.findIndex(t => t.id === id))
  const byId = new Map(tasks.map(t => [t.id, t]))
  const cycle = findCycleTaskIds(tasks)
  const skipped = { selfLoop: 0, dangling: 0, cycle: 0, missingDate: 0 }
  const edges: GanttEdge[] = []
  const px = (dayOffset: number) => dayOffset * pxPerDay

  for (const b of tasks) {
    for (const pid of b.predecessorIds ?? []) {
      if (pid === b.id) { skipped.selfLoop++; continue }
      const a = byId.get(pid)
      if (!a) { skipped.dangling++; continue }
      if (cycle.has(a.id) || cycle.has(b.id)) { skipped.cycle++; continue }
      if (!a.startDate || !a.dueDate || !b.startDate || !b.dueDate) { skipped.missingDate++; continue }
      const x1 = px(daysFrom(a.dueDate as string, axisStart) + 1) // A 条右缘
      const x2 = px(daysFrom(b.startDate, axisStart))           // B 条左缘
      edges.push({
        fromId: a.id, toId: b.id,
        x1, y1: rowHeight * idxOf(a.id) + rowHeight / 2,
        x2, y2: rowHeight * idxOf(b.id) + rowHeight / 2,
      })
    }
  }
  return { edges, skipped, cycleTaskIds: [...cycle] }
}

// ---------- 依赖边路由（FS 连线形状：紧贴 L / 正常 L / 重叠绕行） ----------

export type EdgeRouteKind = 'tight' | 'normal' | 'overlap'

export interface EdgeRouteOpts {
  /** 紧贴判定阈值（px）：0 <= x2-x1 < tightPx 时按紧贴 FS 渲染。默认 8。 */
  tightPx?: number
  /** 重叠绕行：安全走廊离 max(x1, bRight) 的水平余量。默认 12。 */
  detourGap?: number
  /** 错峰步距：lane>0 时走廊/通道整体右移 lane*laneStep px。默认 14。 */
  laneStep?: number
  /** 圆角半径（px）。默认 7。 */
  cornerR?: number
  /** 错峰通道编号：0=直连，1,2… 逐级右移（多条边共享起止行时避免叠线）。默认 0。 */
  lane?: number
}

export interface EdgeRoute {
  /** SVG path d（绝对坐标，画布原点）。 */
  d: string
  kind: EdgeRouteKind
  /** 垂直通道所在 x（单测/巡检用：紧贴/正常时必落在 (x1, x2) 间隙内；重叠时必在走廊上）。 */
  channelX: number
  /** 箭头尖落点（B 条边缘：紧贴/正常=左缘 x2，重叠=右缘 bRight）。 */
  endX: number
  endY: number
}

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * 把一条 FS 依赖边（A 条右缘 → B 条左缘）路由成圆角折线路径。
 * 纯函数：无 DOM、无随机、无写副作用；同输入必同输出。
 *
 * 三类（由 x2-x1 确定性判定）：
 *  - tight 紧贴 FS（0 <= x2-x1 < tightPx，A 结束次日即 B 开始）：
 *    短而顺的 L 形，垂直通道取间隙 (x1, x2) 的中点——必落在两条之间的空隙里，
 *    不穿 A、不压 B；
 *  - normal 正常 FS（x2-x1 >= tightPx）：标准 L 形，自 A 右缘探出短 stub 后垂直下行；
 *  - overlap 重叠（x2 < x1，前置结束晚于后置开始）：连线**绕行**到
 *    max(x1, bRight)+detourGap 的右侧安全走廊，圆角 U 形折返，
 *    不穿过任何任务条；箭头落在 B 条右缘、方向朝左指向后置。
 *
 * lane>0 时通道整体右移 lane*laneStep，供多条同起止边错峰不叠线。
 * bRight 缺省按 x2+16 近似（调用方已知 B 条宽时务必传入精确右缘）。
 */
export function routeEdge(
  edge: { x1: number, y1: number, x2: number, y2: number, bRight?: number },
  opts: EdgeRouteOpts = {},
): EdgeRoute {
  const tightPx = opts.tightPx ?? 8
  const detourGap = opts.detourGap ?? 12
  const laneStep = opts.laneStep ?? 14
  const cornerR = opts.cornerR ?? 7
  const lane = opts.lane ?? 0
  const { x1, y1, x2, y2 } = edge
  const bRight = edge.bRight ?? x2 + 16
  const dy = y2 - y1
  const sy = dy === 0 ? 1 : Math.sign(dy)

  const kind: EdgeRouteKind = x2 >= x1 + tightPx ? 'normal' : x2 >= x1 ? 'tight' : 'overlap'

  if (kind === 'overlap') {
    // 右侧安全走廊：严格在 A 右缘与 B 右缘之外，水平段贴两端条缘出发，不穿条。
    const ch = Math.max(x1, bRight) + detourGap + lane * laneStep
    const rr = Math.min(cornerR, detourGap)
    const endX = bRight
    if (dy === 0) {
      return { d: `M ${r1(x1)} ${r1(y1)} H ${r1(ch)} V ${r1(y1)} H ${r1(endX)}`, kind, channelX: ch, endX, endY: y2 }
    }
    const d = [
      `M ${r1(x1)} ${r1(y1)}`,
      `H ${r1(ch - rr)}`,
      `Q ${r1(ch)} ${r1(y1)} ${r1(ch)} ${r1(y1 + sy * rr)}`,
      `V ${r1(y2 - sy * rr)}`,
      `Q ${r1(ch)} ${r1(y2)} ${r1(ch - rr)} ${r1(y2)}`,
      `H ${r1(endX)}`,
    ].join(' ')
    return { d, kind, channelX: ch, endX, endY: y2 }
  }

  // tight / normal：垂直通道必须落在间隙 (x1, x2) 内——既不压 A（A 止于 x1），也不压 B（B 起于 x2）。
  const gap = x2 - x1
  const stub = kind === 'tight'
    ? Math.max(3, gap / 2)                          // 紧贴：通道居间隙中点
    : Math.max(14, gap / 2) + lane * laneStep        // 正常：自 A 右缘探出短 stub
  // 钳制：lane 错峰不得把通道推出间隙落到 B 条上；圆角半径同时受两侧间隙约束，绝不越界穿条。
  const ch = Math.min(x1 + stub, x2 - 2)
  const rr = Math.min(cornerR, ch - x1, x2 - ch, Math.abs(dy) / 2 || 999)
  const endX = x2
  if (dy === 0) {
    return { d: `M ${r1(x1)} ${r1(y1)} H ${r1(endX)}`, kind, channelX: ch, endX, endY: y2 }
  }
  const d = [
    `M ${r1(x1)} ${r1(y1)}`,
    `H ${r1(ch - rr)}`,
    `Q ${r1(ch)} ${r1(y1)} ${r1(ch)} ${r1(y1 + sy * rr)}`,
    `V ${r1(y2 - sy * rr)}`,
    `Q ${r1(ch)} ${r1(y2)} ${r1(ch + rr)} ${r1(y2)}`,
    `H ${r1(endX)}`,
  ].join(' ')
  return { d, kind, channelX: ch, endX, endY: y2 }
}
