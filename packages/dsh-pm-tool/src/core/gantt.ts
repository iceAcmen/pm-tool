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

// ---------- D-08：任务↔里程碑「现字段 milestoneId」只读投影（零 schema、零写库） ----------

/** 关联任务的结构子集（视图 Task 即可适配），不引入新存储字段。 */
export interface MilestoneLinkedTask {
  id: string
  title: string
  code?: string
  status?: string
  assignee?: string
  milestoneId?: string | null
}

/**
 * 按现有 milestoneId 把任务分组到里程碑（milestones 视图卡片关联任务清单用）。
 * 剔除 null/空串关联；保持输入顺序；纯函数，不回写任务。无关联任务 → 空 Map，
 * 由视图诚实显示「暂无关联任务」，不得伪造。
 */
export function tasksByMilestone<T extends MilestoneLinkedTask>(tasks: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const task of tasks) {
    const mid = task.milestoneId?.trim()
    if (!mid) continue
    const arr = map.get(mid)
    if (arr) arr.push(task)
    else map.set(mid, [task])
  }
  return map
}

/**
 * 甘特侧：由任务现有 milestoneId 解析里程碑标题用于条体/标签展示。
 * 无关联或里程碑不存在返回 null（视图省略 chip），绝不伪造名称。
 */
export function milestoneTitleForTask(
  task: Pick<MilestoneLinkedTask, 'milestoneId'>,
  milestones: { id: string, title: string }[],
): string | null {
  const mid = task.milestoneId?.trim()
  if (!mid) return null
  const hit = milestones.find(m => m.id === mid)
  return hit ? hit.title : null
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

export type EdgeRouteKind = 'tight' | 'normal' | 'overlap' | 'overlap-tight'

export interface EdgeRouteOpts {
  /** 最后水平箭头段（channel→x2）最小长度（px）：保证通道不压 marker 三角。默认 8。 */
  arrowClear?: number
  /** A 右缘到垂直通道的最小水平探出（px）。默认 6。 */
  stubA?: number
  /** 紧贴判定阈值（px）：旧 0 <= x2-x1 < tightPx 时按紧贴 FS 渲染。默认 8。 */
  tightPx?: number
  /** 重叠绕行：安全走廊离 max(x1, bRight) 的水平余量。默认 12。 */
  detourGap?: number
  /** 错峰步距：lane>0 时走廊/通道整体右移 lane*laneStep px。默认 14。 */
  laneStep?: number
  /** 圆角半径（px）。默认 6。 */
  cornerR?: number
  /** 错峰通道编号：0=直连，1,2… 逐级右移（多条边共享起止行时避免叠线）。默认 0。 */
  lane?: number
  /** 每天像素（粒度：日16/周11/月7）：重叠 ≤ 2 天判为「轻度重叠/衔接」走小凹形。默认 16。 */
  pxPerDay?: number
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
 * 坐标事实：x1=A 右缘、x2=B 左缘（gap=x2-x1）。marker 三角向左占约 x2-5~x2+1，
 * 故垂直通道 ch 必须 ≤ x2-6，且最后水平段（ch→x2）长度 ≥ arrowClear，箭头才不与竖线重叠。
 *
 * x2≥x1（FS 非重叠）按 gap 分三种：
 *  - normal（gap ≥ stubA+arrowClear，间隙够）：自 A 右缘探出 stubA 后垂直下行的标准 L，
 *    箭头段 ≥ arrowClear；
 *  - tight（arrowClear ≤ gap < stubA+arrowClear）：A 右缘直接垂直、无 A stub，
 *    再水平到 B 左缘，箭头段 = gap ≥ arrowClear；
 *  - tight（gap < arrowClear，含 gap=0 紧贴）：用「小凹形」在行间把通道让到 B 左缘左侧
 *    （ch=x2-arrowClear）——先垂直深入行间离开 A 条，在行间空隙水平让到 ch 再下行，
 *    水平向左段绝不落在 y1 行（不穿 A 条）；
 *  - overlap（gap < -2*pxPerDay，前置结束晚于后置开始 2 天以上）：绕行到 max(x1,bRight)+detourGap 的
 *    右侧安全走廊，圆角 U 形折返，箭头落 B 右缘、朝左指向后置；
 *  - overlap-tight（-2*pxPerDay ≤ gap < 0，A.due=B.start 当天衔接、重叠 1~2 天）：
 *    与 gap=0 紧贴同一条「小凹形」路径，行间空隙水平让位，箭头朝右落 B 左缘。
 *
 * lane>0 仅在 normal 间隙仍能容纳时把通道右移 lane*laneStep，否则回退 lane=0。
 */
export function routeEdge(
  edge: { x1: number, y1: number, x2: number, y2: number, bRight?: number },
  opts: EdgeRouteOpts = {},
): EdgeRoute {
  // marker 实宽 = markerWidth(6) × stroke-width(1.5) = 9px；纯水平箭头段必须 ≥ 9px，
  // 否则 marker 覆盖范围跨入圆角、方向被渲染歪（短水平段箭头朝左的根因）。
  const arrowClear = opts.arrowClear ?? 9
  const stubA = opts.stubA ?? 6
  const detourGap = opts.detourGap ?? 12
  const laneStep = opts.laneStep ?? 14
  const cornerR = opts.cornerR ?? 6
  const lane = opts.lane ?? 0
  const pxPerDay = opts.pxPerDay ?? 16
  const { x1, y1, x2, y2 } = edge
  const bRight = edge.bRight ?? x2 + 16
  const dy = y2 - y1
  const ady = Math.abs(dy)
  const sy = dy === 0 ? 1 : Math.sign(dy)
  const gap = x2 - x1

  // ---- 严重重叠（gap < -2*pxPerDay：前置结束晚于后置开始 2 天以上）：
  // 右侧安全走廊，圆角 U 形，箭头落 B 右缘朝左 ----
  if (gap < -2 * pxPerDay) {
    const ch = Math.max(x1, bRight) + detourGap + lane * laneStep
    const rr = Math.min(cornerR, detourGap)
    const endX = bRight
    if (dy === 0) {
      return { d: `M ${r1(x1)} ${r1(y1)} H ${r1(ch)} V ${r1(y1)} H ${r1(endX)}`, kind: 'overlap', channelX: ch, endX, endY: y2 }
    }
    const d = [
      `M ${r1(x1)} ${r1(y1)}`,
      `H ${r1(ch - rr)}`,
      `Q ${r1(ch)} ${r1(y1)} ${r1(ch)} ${r1(y1 + sy * rr)}`,
      `V ${r1(y2 - sy * rr)}`,
      `Q ${r1(ch)} ${r1(y2)} ${r1(ch - rr)} ${r1(y2)}`,
      `H ${r1(endX)}`,
    ].join(' ')
    return { d, kind: 'overlap', channelX: ch, endX, endY: y2 }
  }

  // ---- 同条（dy=0）：直接水平 ----
  if (dy === 0) {
    return { d: `M ${r1(x1)} ${r1(y1)} H ${r1(x2)}`, kind: gap >= stubA + arrowClear ? 'normal' : 'tight', channelX: x1, endX: x2, endY: y2 }
  }

  // ---- 情况1：normal 标准 L（通道在 A 右缘右侧间隙）----
  // 用实际几何判定：最后纯水平段（圆角结束→x2）必须 ≥ arrowClear，否则 marker 歪。
  let chN = x1 + stubA + lane * laneStep
  let rrN = Math.min(cornerR, chN - x1, x2 - chN, ady / 2)
  if (x2 - (chN + rrN) < arrowClear) { // lane 错峰放不下 → 回退 lane=0
    chN = x1 + stubA
    rrN = Math.min(cornerR, chN - x1, x2 - chN, ady / 2)
  }
  if (x2 - (chN + rrN) >= arrowClear) {
    const d = [
      `M ${r1(x1)} ${r1(y1)}`,
      `H ${r1(chN - rrN)}`,
      `Q ${r1(chN)} ${r1(y1)} ${r1(chN)} ${r1(y1 + sy * rrN)}`,
      `V ${r1(y2 - sy * rrN)}`,
      `Q ${r1(chN)} ${r1(y2)} ${r1(chN + rrN)} ${r1(y2)}`,
      `H ${r1(x2)}`,
    ].join(' ')
    return { d, kind: 'normal', channelX: chN, endX: x2, endY: y2 }
  }

  // ---- 情况2：tight（A 右缘直接垂直，无 A 探出）----
  // 圆角随可用间隙自适应收紧：间隙越小圆角越小，保证纯水平段 ≥ arrowClear；
  // rrT=0（gap=arrowClear）时退化为直角。
  const rrT = Math.min(cornerR, gap - arrowClear, ady / 2)
  if (rrT >= 0) {
    const corner = rrT > 0
      ? `Q ${r1(x1)} ${r1(y2)} ${r1(x1 + rrT)} ${r1(y2)}`
      : ''
    const vEnd = rrT > 0 ? y2 - sy * rrT : y2
    const d = [
      `M ${r1(x1)} ${r1(y1)}`,
      `V ${r1(vEnd)}`,
      corner,
      `H ${r1(x2)}`,
    ].filter(Boolean).join(' ')
    return { d, kind: 'tight', channelX: x1, endX: x2, endY: y2 }
  }

  // ---- 情况3：gap < arrowClear（含 gap=0 紧贴；及 gap∈[-2pxPerDay,0) 的轻度重叠/衔接）
  // 「行间小凹形」：先垂直进入行间空隙（A 条底缘下方），在行间水平让位到 ch，再下行，
  // 最后留足纯水平箭头段（≥ marker 实宽）指向 B 左缘、箭头朝右。
  // 水平让位段完全落在行间空隙，绝不穿 A/B 条；marker 覆盖范围不跨圆角，方向才稳定。
  // gap≥0 → kind='tight'；gap<0（重叠 1~2 天）→ kind='overlap-tight'，绝不走严重重叠的大 U。
  const barHalf = 8
  const arrowTail = 10 // 纯水平箭头段（markerWidth6 × stroke-width1.5 = 9px，留 10）
  const t1 = ady / 2    // 行间空隙中央
  // 圆角：垂直段与水平让位段都必须在行间空隙内（离开 A 条底缘 / B 条顶缘各 ≥2px）
  const rr = Math.min(
    4,
    Math.max(0, t1 - barHalf - 2),
    Math.max(0, ady - t1 - barHalf - 2),
  )
  const ch = x2 - arrowTail - rr
  const d = [
    `M ${r1(x1)} ${r1(y1)}`,
    `V ${r1(y1 + sy * (t1 - rr))}`,
    `Q ${r1(x1)} ${r1(y1 + sy * t1)} ${r1(x1 - rr)} ${r1(y1 + sy * t1)}`,
    `H ${r1(ch)}`,
    `Q ${r1(ch)} ${r1(y1 + sy * t1)} ${r1(ch)} ${r1(y1 + sy * (t1 + rr))}`,
    `V ${r1(y2 - sy * rr)}`,
    `Q ${r1(ch)} ${r1(y2)} ${r1(ch + rr)} ${r1(y2)}`,
    `H ${r1(x2)}`,
  ].join(' ')
  return { d, kind: gap < 0 ? 'overlap-tight' : 'tight', channelX: ch, endX: x2, endY: y2 }
}

// ---------- 关键路径 CPM（AON 活动节点，只读纯函数） ----------
// 红线（GI-CP-01~05）：只算不写——本函数无 I/O、不调用任何 run/execute、不回写派生字段；
// 成环不打断、缺日期不补、不自动顺延。ES/EF/LS/LF 为「相对组件起点的整数天偏移」，
// 工期取既有 startDate/dueDate（含端点，单日=1），不建模 lag（FS 零间隔），确定性无随机无墙钟。

export interface CpmTaskInput {
  id: string
  startDate?: string
  dueDate?: string
  predecessorIds?: string[]
}

export interface CpmNode {
  id: string
  /** 工期天数（含端点）；缺日期为 null（不参与计算）。 */
  durationDays: number | null
  /** 最早开始 / 最早完成（天偏移）；缺日期或成环为 null。 */
  es: number | null
  ef: number | null
  /** 最晚开始 / 最晚完成（天偏移）；缺日期或成环为 null。 */
  ls: number | null
  lf: number | null
  /** 总时差（LS-ES，天）；缺日期或成环为 null。 */
  slack: number | null
  /** 总时差=0 → 在关键路径上。 */
  onCriticalPath: boolean
  /** 命中成环节点（不参与正/反遍历，不高亮，不自动打断）。 */
  inCycle: boolean
  /** 缺 startDate 或 dueDate（不参与，不高亮，不自动补日期）。 */
  missingDate: boolean
}

export interface CpmEdge {
  fromId: string
  toId: string
  /** 两端都在关键路径上 → 该连线属关键路径（用于描边高亮）。 */
  onCriticalPath: boolean
}

export interface CpmReport {
  nodes: Record<string, CpmNode>
  /** 关键路径任务 id，按 ES 升序（并列按 id 字典序，保证确定性）。 */
  criticalPath: string[]
  edges: CpmEdge[]
  skipped: { selfLoop: number, dangling: number, cycle: number, missingDate: number }
  cycleTaskIds: string[]
  missingDateTaskIds: string[]
  danglingPredecessors: { taskId: string, missingId: string }[]
  hasCycle: boolean
  hasMissingDate: boolean
  /** 人类可读降级说明（tooltip / 空态用），只陈述事实，不做修复建议式写动作。 */
  warnings: string[]
}

/** 在原始 predecessorIds 图（前置→后继）上找成环节点集合（3 色迭代 DFS，不成栈溢出/不死循环）。 */
function findCpmCycleIds(tasks: CpmTaskInput[]): Set<string> {
  const byId = new Map(tasks.map(t => [t.id, t]))
  const succ = new Map<string, string[]>()
  for (const t of tasks) {
    for (const pid of t.predecessorIds ?? []) {
      if (pid === t.id || !byId.has(pid)) continue // 自指/悬空不入环检测图
      const arr = succ.get(pid) ?? []
      arr.push(t.id)
      succ.set(pid, arr)
    }
  }
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map(tasks.map(t => [t.id, WHITE]))
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
 * 关键路径只读计算。诚实降级：
 *  - 成环：环上节点跳过正/反遍历，标 inCycle，不自动打断/改期；
 *  - 缺日期：该节点不参与，标 missingDate，不自动补日期/顺延；
 *  - 悬空/自指：边跳过并计数；
 *  - 多个连通分量：按分量各自取组件最大 EF 做反向遍历，短分量不会被全局终点挤出假时差；
 *  - 多结束任务：各汇点 LF=组件最大 EF，内部取 min 传播。
 */
export function criticalPath(tasks: CpmTaskInput[]): CpmReport {
  const byId = new Map(tasks.map(t => [t.id, t]))
  const cycle = findCpmCycleIds(tasks)
  const skipped = { selfLoop: 0, dangling: 0, cycle: 0, missingDate: 0 }
  const cycleTaskIds: string[] = []
  const missingDateTaskIds: string[] = []
  const danglingPredecessors: { taskId: string, missingId: string }[] = []

  const nodes: Record<string, CpmNode> = {}
  const dated = new Set<string>()
  for (const t of tasks) {
    const missingDate = !t.startDate || !t.dueDate
    const inCycle = cycle.has(t.id)
    if (missingDate) { skipped.missingDate++; missingDateTaskIds.push(t.id) }
    if (inCycle) cycleTaskIds.push(t.id)
    nodes[t.id] = {
      id: t.id,
      durationDays: missingDate ? null : taskDurationDays(t.startDate as string, t.dueDate as string),
      es: null, ef: null, ls: null, lf: null, slack: null,
      onCriticalPath: false, inCycle, missingDate,
    }
    if (!missingDate && !inCycle) dated.add(t.id)
  }

  // 合法边：两端都已排期、都不在环内；自指/悬空/成环/缺日期在此剔除并计数。
  const adj = new Map<string, string[]>()   // pred -> succ（合法）
  const radj = new Map<string, string[]>() // succ -> pred（合法）
  const edges: CpmEdge[] = []
  const addEdge = (p: string, s: string) => {
    const a = adj.get(p) ?? []; a.push(s); adj.set(p, a)
    const b = radj.get(s) ?? []; b.push(p); radj.set(s, b)
    edges.push({ fromId: p, toId: s, onCriticalPath: false })
  }
  for (const t of tasks) {
    for (const pid of t.predecessorIds ?? []) {
      if (pid === t.id) { skipped.selfLoop++; continue }
      const p = byId.get(pid)
      if (!p) { skipped.dangling++; danglingPredecessors.push({ taskId: t.id, missingId: pid }); continue }
      if (cycle.has(pid) || cycle.has(t.id)) { skipped.cycle++; continue }
      if (!dated.has(pid) || !dated.has(t.id)) { skipped.missingDate++; continue }
      addEdge(pid, t.id)
    }
  }

  // 连通分量（合法无向边）：并查集，保证每个分量独立取组件最大 EF。
  const parent = new Map<string, string>()
  const find = (x: string): string => {
    let r = x
    while (parent.get(r) !== r) r = parent.get(r) as string
    let cur = x
    while (parent.get(cur) !== r) { const n = parent.get(cur) as string; parent.set(cur, r); cur = n }
    return r
  }
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }
  for (const id of dated) parent.set(id, id)
  for (const e of edges) { if (parent.has(e.fromId) && parent.has(e.toId)) union(e.fromId, e.toId) }

  // 按分量分组
  const comps = new Map<string, string[]>()
  for (const id of dated) {
    const r = find(id)
    const arr = comps.get(r) ?? []; arr.push(id); comps.set(r, arr)
  }

  for (const members of comps.values()) {
    const mem = new Set(members)
    // 正向遍历（Kahn）：ES=max(前置 EF)，根 ES=0。
    const indeg = new Map<string, number>()
    for (const id of mem) indeg.set(id, (radj.get(id) ?? []).filter(p => mem.has(p)).length)
    const queue = members.filter(id => (indeg.get(id) ?? 0) === 0).sort()
    for (const id of queue) {
      nodes[id].es = 0
      nodes[id].ef = (nodes[id].es as number) + (nodes[id].durationDays as number)
    }
    let head = 0
    while (head < queue.length) {
      const u = queue[head++]
      for (const v of adj.get(u) ?? []) {
        if (!mem.has(v)) continue
        const cand = nodes[u].ef as number
        if ((nodes[v].es ?? -Infinity) < cand) {
          nodes[v].es = cand
          nodes[v].ef = cand + (nodes[v].durationDays as number)
        }
        const d = (indeg.get(v) ?? 0) - 1
        indeg.set(v, d)
        if (d === 0) queue.push(v)
      }
    }
    // 组件最大 EF（多结束任务取最大值）。
    let compMax = 0
    for (const id of mem) compMax = Math.max(compMax, nodes[id].ef as number)
    // 反向遍历（Kahn）：汇点 LF=compMax，LF=min(后继 LF)，LS=LF-工期，slack=LS-ES。
    const outdeg = new Map<string, number>()
    for (const id of mem) outdeg.set(id, (adj.get(id) ?? []).filter(s => mem.has(s)).length)
    const rq = members.filter(id => (outdeg.get(id) ?? 0) === 0).sort()
    for (const id of rq) {
      nodes[id].lf = compMax
      nodes[id].ls = compMax - (nodes[id].durationDays as number)
      nodes[id].slack = (nodes[id].ls as number) - (nodes[id].es as number)
    }
    let rh = 0
    while (rh < rq.length) {
      const u = rq[rh++]
      for (const p of radj.get(u) ?? []) {
        if (!mem.has(p)) continue
        // 前驱 LF = min(后继 LS)：用后继最晚开始时刻，而非后继最晚完成。
        const cand = nodes[u].ls as number
        if ((nodes[p].lf ?? Infinity) > cand) {
          nodes[p].lf = cand
          nodes[p].ls = cand - (nodes[p].durationDays as number)
          nodes[p].slack = (nodes[p].ls as number) - (nodes[p].es as number)
        }
        const d = (outdeg.get(p) ?? 0) - 1
        outdeg.set(p, d)
        if (d === 0) rq.push(p)
      }
    }
    // 关键判定：总时差=0（整数天，容差 0）。
    for (const id of mem) nodes[id].onCriticalPath = (nodes[id].slack as number) === 0
  }

  // 关键边：两端都在关键路径。
  for (const e of edges) {
    e.onCriticalPath = nodes[e.fromId].onCriticalPath && nodes[e.toId].onCriticalPath
  }

  // 关键路径汇总：onCriticalPath=true，按 ES 升序、并列按 id（确定性）。
  const criticalPath = Object.values(nodes)
    .filter(n => n.onCriticalPath)
    .sort((a, b) => (a.es as number) - (b.es as number) || a.id.localeCompare(b.id))
    .map(n => n.id)

  const warnings: string[] = []
  if (cycleTaskIds.length) {
    warnings.push(`存在成环依赖（${[...cycleTaskIds].sort().join('、')}），该循环无法计算关键路径，已跳过，未自动打断或改期。`)
  }
  if (missingDateTaskIds.length) {
    warnings.push(`任务 ${[...missingDateTaskIds].sort().join('、')} 缺少开始或截止日期，该段无法纳入关键路径计算，未自动补日期或顺延。`)
  }

  return {
    nodes,
    criticalPath,
    edges,
    skipped,
    cycleTaskIds: [...cycleTaskIds].sort(),
    missingDateTaskIds: [...missingDateTaskIds].sort(),
    danglingPredecessors,
    hasCycle: cycleTaskIds.length > 0,
    hasMissingDate: missingDateTaskIds.length > 0,
    warnings,
  }
}
