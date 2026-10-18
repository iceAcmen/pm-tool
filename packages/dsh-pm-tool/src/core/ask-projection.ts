/**
 * K13 对话内只读投影 · 纯函数层（零写、零墙钟，today 注入）。
 *
 * 边界：本模块只做「身份解析 + 展示态派生」。任务的状态/进度/截止等业务值一律由
 * 调用方在渲染时从最新快照现取，本模块不保存、不传递 ask 发起时刻的旧状态，
 * 从函数层杜绝「投影显示过期状态」。
 */

/** 已校验计划步的最小形状（只取动作目标身份，不碰 patch 正文）。 */
export interface ProjectionPlanStep {
  action?: { op?: string, id?: string }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 从模型回答正文里抽取「已知任务」的 id（仅身份，不含状态）。
 * 词边界匹配，避免短 id（t-1）误命中长 id（t-10）；正文未提及的任务不臆造。
 */
export function extractReferencedTaskIds(text: string, knownIds: ReadonlySet<string>): string[] {
  const out: string[] = []
  if (!text) return out
  for (const id of knownIds) {
    if (!id || out.includes(id)) continue
    const re = new RegExp(`(^|[^A-Za-z0-9-])${escapeRe(id)}($|[^A-Za-z0-9-])`)
    if (re.test(text)) out.push(id)
  }
  return out
}

/** 从已校验计划步里收集 task.* 动作的目标任务 id（身份，去重保序；create 无 id 不收）。 */
export function planTaskIds(steps: ProjectionPlanStep[]): string[] {
  const out: string[] = []
  for (const s of steps) {
    const op = s.action?.op ?? ''
    const id = s.action?.id
    if (!id || !op.startsWith('task.')) continue
    if (!out.includes(id)) out.push(id)
  }
  return out
}

export type DueUrgency =
  | { kind: 'done', days: null }
  | { kind: 'overdue', days: number }
  | { kind: 'soon', days: number }
  | { kind: 'none', days: number | null }

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000)
}

/**
 * 截止紧迫度派生（today 注入；已完成 / 进度满 100 / 无截止日不告警）。
 * 口径与 derived.isTaskOverdue 对齐：status=done 或 progress≥100 视为完成。
 */
export function dueUrgency(
  task: { status?: string, progress?: number | null, dueDate?: string | null },
  today: string,
  soonDays = 3,
): DueUrgency {
  if (task.status === 'done' || (task.progress ?? 0) >= 100) return { kind: 'done', days: null }
  if (!task.dueDate) return { kind: 'none', days: null }
  const diff = dayDiff(today, task.dueDate)
  if (diff > 0) return { kind: 'overdue', days: diff }
  if (diff >= -soonDays) return { kind: 'soon', days: -diff }
  return { kind: 'none', days: diff }
}

/** 一条 ask-apply 落库批次的只读归并视图（身份/摘要，状态仍由调用方现取）。 */
export interface AppliedBatch {
  id: string
  createdAt: string
  summary: string
  /** 批次直接改动（basis）的任务 id 列表。 */
  basisTaskIds: string[]
  /** 撤销句柄是否已被使用（已撤销则如实标注）。 */
  undone: boolean
}

interface RawProvenanceEntry {
  id?: string
  kind?: string
  createdAt?: string
  summary?: string
  refs?: Array<{ table?: string, id?: string, role?: string }>
  undo?: { used?: boolean }
}

/**
 * 从 ask-provenance 返回的台账条目里取最近 N 条 ask-apply 批次（只读）。
 * 入参宽松 unknown（命令层 JSON 透传）；非法/缺字段静默跳过，不抛错、不编造。
 */
export function latestAppliedBatches(entries: unknown, limit = 1): AppliedBatch[] {
  if (!Array.isArray(entries)) return []
  const rows = entries
    .filter((e): e is RawProvenanceEntry => !!e && typeof e === 'object' && e.kind === 'ask-apply')
    .slice()
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .slice(0, Math.max(1, limit))
  return rows.map(e => ({
    id: String(e.id ?? ''),
    createdAt: String(e.createdAt ?? ''),
    summary: String(e.summary ?? 'AI 已应用改动'),
    basisTaskIds: (e.refs ?? [])
      .filter(r => r.table === 'tasks' && r.role === 'basis' && !!r.id)
      .map(r => String(r.id)),
    undone: e.undo?.used === true,
  }))
}

/**
 * 投影刷新成功门：父级 refresh 返回 boolean；`undefined` 兼容旧同步回调视为成功；
 * `false`=刷新失败，投影保留旧「数据截至」时钟、不照盖新时间。
 */
export function refreshSucceeded(result: boolean | void | undefined): boolean {
  return result === undefined || result !== false
}
