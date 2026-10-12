/**
 * PROD-20 AI 项目副驾 MVP：解析与校验纯函数（离线可测）。
 * 安全红线：任何写动作必须经 validateActions 逐条校验后、由 PM 在草稿卡点【确认执行】才落库；
 * 删除/级联/未知字段一律拒绝；模型输出不可信，抽不到动作=空数组不报错。
 */

export interface CopilotAction {
  op: string
  id?: string
  patch?: Record<string, unknown>
  [k: string]: unknown
}

const ALLOWED_OPS = new Set(['task.update'])
// 必须与 core/task.ts 的 taskStatusSchema 严格一致（todo/in_progress/blocked/done）；
// 旧版误用 'doing' 会通过校验却在写库时被 zod 拒绝——这里对齐真实存储枚举。
const STATUS = new Set(['todo', 'in_progress', 'blocked', 'done'])

/** 真实日历合法性：YYYY-MM-DD 且不是 2 月 30 这类不存在的日期；过去/未来都可接受。 */
export function isValidDateStr(v: unknown): boolean {
  const s = String(v ?? '')
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false
  // 用 UTC 构造并回串校验，杜绝 2026-02-30 / 2026-13-99 这类非法日历日期。
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d
}

/** 从模型带噪声/围栏输出里稳健抽出动作数组；失败返回 []。 */
export function parseCopilotActions(text: string): CopilotAction[] {
  if (!text || typeof text !== 'string') return []
  // 优先找 ```json ... ``` 围栏；否则尝试裸 JSON 块
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence ? fence[1] : text
  // 找第一个 { 到最后一个 } 之间的内容
  const s = candidate.indexOf('{')
  const e = candidate.lastIndexOf('}')
  if (s < 0 || e <= s) return []
  let obj: unknown
  try { obj = JSON.parse(candidate.slice(s, e + 1)) } catch { return [] }
  const arr = (obj as { actions?: unknown })?.actions
  if (!Array.isArray(arr)) return []
  return arr.filter((a): a is CopilotAction => !!a && typeof a === 'object')
}

export interface ValidationResult {
  accepted: CopilotAction[]
  rejected: { action: CopilotAction, reason: string }[]
}

/** 逐条校验：op 白名单、目标存在、字段合法。非法剔除并给原因。 */
export function validateActions(
  actions: CopilotAction[],
  snapshot: { taskIds?: string[] },
): ValidationResult {
  const accepted: CopilotAction[] = []
  const rejected: { action: CopilotAction, reason: string }[] = []
  const ids = new Set(snapshot.taskIds ?? [])
  for (const a of actions) {
    if (!ALLOWED_OPS.has(a.op)) { rejected.push({ action: a, reason: `不允许的操作 ${a.op}` }); continue }
    if (a.op === 'task.update') {
      if (!a.id || !ids.has(a.id)) { rejected.push({ action: a, reason: `任务 ${a.id ?? '(无 id)'} 不存在` }); continue }
      const patch = (a.patch ?? {}) as Record<string, unknown>
      const keys = Object.keys(patch)
      if (!keys.length) { rejected.push({ action: a, reason: '空 patch' }); continue }
      let bad = ''
      for (const k of keys) {
        const v = patch[k]
        if (k === 'status') { if (!STATUS.has(String(v))) bad = `非法状态 ${String(v)}` }
        else if (k === 'progress') { const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > 100) bad = '进度须 0-100 整数' }
        else if (k === 'dueDate' || k === 'startDate') { if (!isValidDateStr(v)) bad = '日期须合法 YYYY-MM-DD' }
        else if (k === 'assignee') { if (typeof v !== 'string') bad = '负责人须为字符串' }
        else { bad = `未知字段 ${k}` }
        if (bad) break
      }
      // 起止顺序：同一次 patch 同时给了 startDate 与 dueDate 时，不得 start > due。
      if (!bad && typeof patch.startDate === 'string' && typeof patch.dueDate === 'string') {
        if (String(patch.startDate) > String(patch.dueDate)) bad = '开始日期不得晚于截止日期'
      }
      if (bad) { rejected.push({ action: a, reason: bad }); continue }
      accepted.push(a)
    }
  }
  return { accepted, rejected }
}
