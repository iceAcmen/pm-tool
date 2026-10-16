/**
 * v0.8 客观进度真源（objective progress derivation）——纯函数、无副作用、零写库、browser-safe。
 *
 * 冻结依据：docs/testing/objective-progress-acceptance.md（§0.1 公共 API、§0.2 口径红线）。
 * 口径要点：
 *  - 客观 value 只来自「非空 checklist 的 checked/total」；status=done / 历史手填 progress 绝不伪造百分比。
 *  - 全勾即 100；全勾但 status!=='done' 仅挂独立「待验收」标签，不封顶、不改 status。
 *  - 父/项目只对「有非空 checklist 的后代叶子」等权平均原始分数，最终 round 一次；父/中间节点不入分母。
 *  - legacy progress（含 0）原值旁注，不入 objective、不入 rollup。
 *  - 缺 id / 悬空父 / 跨项目父 / 成环 → warnings 降级，不挂死、不跨项目汇总。
 *
 * 本模块刻意不 import Zod / Node / 任何运行时，输入按结构鸭子类型读取，便于四界面与离线测试共用。
 */

// ---------- 公开类型 ----------

/** 清单项（与正在开发的 task schema 解耦：只需要 done 布尔）。 */
export interface ProgressChecklistItem {
  id?: string
  text?: string
  done?: boolean
}

/** 派生所需的最小任务形状；真实 task 记录是其超集。 */
export interface ProgressTaskInput {
  id?: string | null
  projectId?: string | null
  parentId?: string | null
  status?: string
  progress?: number | null
  checklist?: readonly ProgressChecklistItem[] | null
}

export type ProgressSource = 'checklist' | 'rollup' | 'none'

export interface TaskProgressChecklist { checked: number; total: number }
export interface TaskProgressCoverage { coveredLeaves: number; totalLeaves: number }

/** 叶子/父/项目统一返回形状。 */
export interface TaskProgress {
  /** 有客观清单信号 0..100；无信号 = null（证据不足，不是 0）。 */
  value: number | null
  /** 叶子来自 checklist；父/项目汇总来自 rollup；无信号 none。没有 'done'/'legacy'。 */
  source: ProgressSource
  /** 叶子清单 checked/total 单独字段；父节点恒为 null。 */
  checklist: TaskProgressChecklist | null
  /** 父=有清单后代叶数/全部后代叶数；叶子=自身清单口径。 */
  coverage: TaskProgressCoverage
  /** 全勾且 status!=='done'（独立标签）。 */
  pendingAcceptance: boolean
  /** 子树内待验收节点计数。 */
  pendingAcceptanceCount: number
  /** 历史手填 progress 原值（含 0），仅供旁注，绝不入 objective。 */
  legacyProgress: number | null
  /** 软告警 + 异常降级。 */
  warnings: string[]
}

/** 项目级汇总结果。 */
export interface ProjectProgress {
  projectId: string
  value: number | null
  coverage: TaskProgressCoverage
  pendingAcceptanceCount: number
  warnings: string[]
}

// ---------- 内部聚合结构 ----------

interface LeafAgg {
  /** 覆盖叶原始 checked/total 分数之和（未 round，供最终一次 round）。 */
  sum: number
  /** 有非空清单的后代叶子数。 */
  covered: number
  /** 全部后代叶子数（含无清单）。 */
  total: number
  /** 子树内待验收叶子数。 */
  pending: number
}

const emptyAgg = (): LeafAgg => ({ sum: 0, covered: 0, total: 0, pending: 0 })

function fold(parent: LeafAgg, child: LeafAgg): void {
  parent.sum += child.sum
  parent.covered += child.covered
  parent.total += child.total
  parent.pending += child.pending
}

interface Computed {
  byId: Map<string, ProgressTaskInput>
  results: Map<string, TaskProgress>
  /** 每个项目一份叶子聚合（仅叶子贡献，不重复计中间节点）。 */
  projectAgg: Map<string, LeafAgg>
  /** 项目级结构性告警。 */
  projectWarn: Map<string, string[]>
  /** 无法挂到任何有效 id 上的丢弃告警（缺 id 项等）。 */
  droppedWarnings: string[]
}

function compute(tasks: readonly ProgressTaskInput[]): Computed {
  const byId = new Map<string, ProgressTaskInput>()
  const nodeWarn = new Map<string, string[]>()
  const pushWarn = (id: string, msg: string) => {
    const arr = nodeWarn.get(id) ?? []
    arr.push(msg)
    nodeWarn.set(id, arr)
  }
  const droppedWarnings: string[] = []

  // 1) 建 id 索引（检测缺 id / 重复 id）。
  let firstValidId: string | null = null
  for (const entry of tasks) {
    const id = entry && typeof entry.id === 'string' && entry.id !== '' ? entry.id : null
    if (!id) {
      droppedWarnings.push('存在缺少合法 id 的任务记录，已跳过该条，不参与派生。')
      continue
    }
    if (firstValidId === null) firstValidId = id
    if (byId.has(id)) {
      pushWarn(id, `任务 ID「${id}」重复，后续重复记录已忽略，以首次出现为准。`)
      continue
    }
    byId.set(id, entry)
  }

  // 2) 建树（只接受「存在且同项目」的父边；其余按根 + 告警）。
  const children = new Map<string, string[]>()
  const roots: string[] = []
  for (const [id, task] of byId) {
    const pid = task.parentId
    const hasParentRef = typeof pid === 'string' && pid !== ''
    if (!hasParentRef) {
      roots.push(id)
      continue
    }
    const parent = byId.get(pid as string)
    if (!parent) {
      pushWarn(id, `任务「${id}」的父任务「${pid}」不存在，已按顶层任务处理。`)
      roots.push(id)
      continue
    }
    if ((parent.projectId ?? null) !== (task.projectId ?? null)) {
      pushWarn(id, `任务「${id}」的父任务「${pid}」属于其他项目，已按独立任务处理，不跨项目汇总。`)
      roots.push(id)
      continue
    }
    if (!children.has(pid as string)) children.set(pid as string, [])
    children.get(pid as string)!.push(id)
  }

  // 3) 迭代后序遍历（显式栈，深树不爆栈；O(n + 清单项数)，不为每父构造后代叶数组）。
  const color = new Map<string, 0 | 1 | 2>() // 0 未访 / 1 栈中 / 2 完成
  const leafAggOut = new Map<string, LeafAgg>()
  const results = new Map<string, TaskProgress>()
  const projectAgg = new Map<string, LeafAgg>()
  const projectWarn = new Map<string, string[]>()
  const pushProjWarn = (projectId: string, msg: string) => {
    const arr = projectWarn.get(projectId) ?? []
    arr.push(msg)
    projectWarn.set(projectId, arr)
  }
  const projKey = (task: ProgressTaskInput) => (typeof task.projectId === 'string' && task.projectId !== '' ? task.projectId : '__unknown__')
  const projAggOf = (key: string): LeafAgg => {
    let a = projectAgg.get(key)
    if (!a) { a = emptyAgg(); projectAgg.set(key, a) }
    return a
  }

  const deriveOne = (id: string): void => {
    const task = byId.get(id)!
    const kids = children.get(id) ?? []
    const warnings = [...(nodeWarn.get(id) ?? [])]
    const legacyProgress = typeof task.progress === 'number' && Number.isFinite(task.progress) ? task.progress : null

    if (kids.length === 0) {
      // ---- 叶子：客观只认非空 checklist ----
      const raw = Array.isArray(task.checklist) ? task.checklist : []
      const total = raw.length
      let checked = 0
      for (const item of raw) if (item && item.done === true) checked++
      const hasObjective = total > 0
      // 对外百分比一律 clamp（清单比率天然 0..100，此处为防御性收口脏值）。
      const value = hasObjective ? clampProgress(Math.round((checked / total) * 100)) : null
      const source: ProgressSource = hasObjective ? 'checklist' : 'none'
      const pending = hasObjective && checked === total && task.status !== 'done'
      if (task.status === 'done' && hasObjective && checked < total) {
        warnings.push(`任务已标记完成，但清单仅勾选 ${checked}/${total}，请确认验收。`)
      }
      results.set(id, {
        value,
        source,
        checklist: hasObjective ? { checked, total } : null,
        coverage: { coveredLeaves: hasObjective ? 1 : 0, totalLeaves: 1 },
        pendingAcceptance: pending,
        pendingAcceptanceCount: pending ? 1 : 0,
        legacyProgress,
        warnings,
      })
      // 叶子聚合（仅叶子进入项目/父汇总）
      leafAggOut.set(id, {
        sum: hasObjective ? checked / total : 0,
        covered: hasObjective ? 1 : 0,
        total: 1,
        pending: pending ? 1 : 0,
      })
      fold(projAggOf(projKey(task)), leafAggOut.get(id)!)
      for (const w of warnings) if (w.includes('其他项目') || w.includes('父任务') || w.includes('环')) pushProjWarn(projKey(task), w)
    } else {
      // ---- 内部节点：仅累计已完成子节点聚合（环边不入） ----
      results.set(id, {
        value: null, // 框架在 frame 结束时回填
        source: 'none',
        checklist: null,
        coverage: { coveredLeaves: 0, totalLeaves: 0 },
        pendingAcceptance: false,
        pendingAcceptanceCount: 0,
        legacyProgress,
        warnings,
      })
    }
  }

  const finishInternal = (id: string, agg: LeafAgg): void => {
    const value = agg.covered > 0 ? clampProgress(Math.round((agg.sum / agg.covered) * 100)) : null
    results.set(id, {
      value,
      source: agg.covered > 0 ? 'rollup' : 'none',
      checklist: null,
      coverage: { coveredLeaves: agg.covered, totalLeaves: agg.total },
      pendingAcceptance: false,
      pendingAcceptanceCount: agg.pending,
      legacyProgress: results.get(id)!.legacyProgress,
      warnings: results.get(id)!.warnings,
    })
    leafAggOut.set(id, agg)
  }

  const dfs = (startId: string): void => {
    if (color.get(startId) === 2) return
    color.set(startId, 1)
    const stack: { id: string; idx: number; agg: LeafAgg }[] = [
      { id: startId, idx: 0, agg: emptyAgg() },
    ]
    deriveOne(startId)
    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      const kids = children.get(frame.id) ?? []
      if (frame.idx < kids.length) {
        const kid = kids[frame.idx++]
        const c = color.get(kid) ?? 0
        if (c === 0) {
          color.set(kid, 1)
          deriveOne(kid)
          stack.push({ id: kid, idx: 0, agg: emptyAgg() })
        } else if (c === 1) {
          // 回边 = 父链成环：双边告警，环边不折叠。
          const msg = `任务「${frame.id}」与「${kid}」父链成环，环上子树已跳过，不参与汇总。`
          const was = nodeWarn.get(frame.id) ?? []
          if (!was.includes(msg)) pushWarn(frame.id, msg)
          const msg2 = `任务「${kid}」与「${frame.id}」父链成环，环上子树已跳过，不参与汇总。`
          const was2 = nodeWarn.get(kid) ?? []
          if (!was2.includes(msg2)) pushWarn(kid, msg2)
          // 把刚 deriveOne 出来的占位 warnings 补上环告警
          const r1 = results.get(frame.id)
          if (r1 && !r1.warnings.includes(msg)) r1.warnings.push(msg)
          const r2 = results.get(kid)
          if (r2 && !r2.warnings.includes(msg2)) r2.warnings.push(msg2)
        } else {
          // c === 2：子树完成，折叠其叶子聚合
          const childAgg = leafAggOut.get(kid)
          if (childAgg) fold(frame.agg, childAgg)
        }
      } else {
        color.set(frame.id, 2)
        stack.pop()
        const kidsNow = children.get(frame.id) ?? []
        if (kidsNow.length > 0) finishInternal(frame.id, frame.agg)
        if (stack.length > 0) {
          const parentAgg = leafAggOut.get(frame.id)
          if (parentAgg) fold(stack[stack.length - 1].agg, parentAgg)
        }
      }
    }
  }

  for (const root of roots) dfs(root)
  // 环孤岛：从未被访问到的有效节点（整段成环）也补算，保证结果 Map 齐全。
  for (const id of byId.keys()) if (color.get(id) !== 2) dfs(id)

  // 无法挂 id 的丢弃告警挂到首个有效节点（确定性，便于下游/测试观测）。
  if (droppedWarnings.length > 0 && firstValidId && results.has(firstValidId)) {
    for (const w of droppedWarnings) results.get(firstValidId)!.warnings.push(w)
  }

  return { byId, results, projectAgg, projectWarn, droppedWarnings }
}

// ---------- 公开 API ----------

/**
 * 一次后序 O(n + 清单项数) 派生全量进度。返回 Map<taskId, TaskProgress>。
 * 纯函数：不修改入参、不写库。
 */
export function deriveProgressMap(tasks: readonly ProgressTaskInput[]): Map<string, TaskProgress> {
  return compute(tasks).results
}

/** 便捷单点查询：传入已派生的 Map，或直接传 tasks 数组（内部自动派生）。 */
export function deriveTaskProgress(
  taskId: string,
  context: Map<string, TaskProgress> | readonly ProgressTaskInput[],
): TaskProgress | undefined {
  const map = context instanceof Map ? context : deriveProgressMap(context)
  return map.get(taskId)
}

/**
 * 项目级汇总：与父 rollup 同语义——只对项目内有清单的叶子等权平均原始分数，
 * 最终 round 一次；中间节点/父任务不入分母。项目无覆盖叶子 → value=null。
 */
export function deriveProjectProgress(
  tasks: readonly ProgressTaskInput[],
  projectId: string,
): ProjectProgress {
  const c = compute(tasks)
  const agg = c.projectAgg.get(projectId) ?? emptyAgg()
  return {
    projectId,
    value: agg.covered > 0 ? clampProgress(Math.round((agg.sum / agg.covered) * 100)) : null,
    coverage: { coveredLeaves: agg.covered, totalLeaves: agg.total },
    pendingAcceptanceCount: agg.pending,
    warnings: [...(c.projectWarn.get(projectId) ?? [])],
  }
}

// ---------- 展示 helper（命名诚实：与状态/百分比独立） ----------

/**
 * 表头/标题命名：
 *  - value=null → 「尚未建立客观进度」（证据不足）。
 *  - coveredLeaves<totalLeaves → 「已覆盖任务清单完成度」（不得叫整体完成率）。
 *  - 全覆盖 → 「整体完成率」。
 */
export function progressHeadline(p: TaskProgress): string {
  if (p.value === null) return '尚未建立客观进度'
  if (p.coverage.coveredLeaves < p.coverage.totalLeaves) return '已覆盖任务清单完成度'
  return '整体完成率'
}

/** 百分比文案：value=null → 「证据不足」，否则「n%」（对外值先 clamp，不出现越界百分比）。与状态独立。 */
export function formatProgressValue(p: TaskProgress): string {
  return p.value === null ? '证据不足' : `${clampProgress(p.value)}%`
}

/** 叶子清单独立分数文案（如 3/5）；父节点/无清单返回 null。 */
export function checklistFraction(p: TaskProgress): string | null {
  return p.checklist ? `${p.checklist.checked}/${p.checklist.total}` : null
}

/**
 * 展示用进度：clamp 到 0..100（非有限数 NaN/±Infinity/null/undefined → 0）。
 * 只用于对外展示，绝不回写、不改写原始存储值；手工手填/旧记录脏值（如 123）
 * 经此统一落到边界，避免出现越界百分比 chip。
 */
export function clampProgress(p: number | null | undefined): number {
  if (typeof p !== 'number' || !Number.isFinite(p)) return 0
  return Math.min(100, Math.max(0, p))
}

/**
 * 原始值是否越界（给了数值但非有限数 或 <0 或 >100）：供 UI 决定是否内联提示/纠正，
 * 纯检测、不自动改写。null / undefined = 未设定，不算越界，返回 false。
 */
export function isProgressOutOfRange(p: number | null | undefined): boolean {
  if (typeof p !== 'number') return false
  return !Number.isFinite(p) || p < 0 || p > 100
}

// ---------- #23 客观/人工双轨解析（纯函数、无 I/O、无回写） ----------

/** 任务上的人工设定元数据（结构鸭子类型；真实 Task 是其超集）。 */
export interface TaskProgressMetaInput {
  manualProgress?: number | null
  manualProgressNote?: string
}

/**
 * 客观派生（清单 checked/total）与人工设定并存、明确区分：
 *  - objective：清单客观派生值（来自 deriveProgressMap），绝不被 manual 污染；
 *  - manual：人工显式设定值（0..100），可缺省；
 *  - display：展示值 = manual ?? objective（无两者 → null）；
 *  - mode：'manual'（人工设定，带徽标）/ 'objective'（客观清单）/ 'none'（证据不足）。
 * 纯函数：不修改入参、不读墙钟、不写库、无 I/O。
 */
export interface TaskProgressMeta {
  objective: number | null
  manual: number | null
  display: number | null
  mode: 'objective' | 'manual' | 'none'
  manualNote?: string
}

export function resolveTaskProgressMeta(
  task: TaskProgressMetaInput,
  derived: TaskProgress | undefined,
): TaskProgressMeta {
  const objective = derived?.value ?? null
  // manual 保留原始值（供 isProgressOutOfRange 检测脏值、UI 内联提示/纠正），
  // 不在这里改写原始设定；仅 display 对外展示值做 clamp。
  const manual = typeof task.manualProgress === 'number' && Number.isFinite(task.manualProgress)
    ? task.manualProgress
    : null
  const rawDisplay = manual ?? objective
  const display = rawDisplay === null ? null : clampProgress(rawDisplay)
  const mode: TaskProgressMeta['mode'] = manual !== null
    ? 'manual'
    : objective !== null
      ? 'objective'
      : 'none'
  return {
    objective,
    manual,
    display,
    mode,
    manualNote: task.manualProgressNote || undefined,
  }
}
