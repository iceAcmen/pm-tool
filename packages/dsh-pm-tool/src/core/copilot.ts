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
const STATUS = new Set(['todo', 'doing', 'done'])

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
        else if (k === 'dueDate' || k === 'startDate') { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) bad = '日期须 YYYY-MM-DD' }
        else if (k === 'assignee') { if (typeof v !== 'string') bad = '负责人须为字符串' }
        else { bad = `未知字段 ${k}` }
        if (bad) break
      }
      if (bad) { rejected.push({ action: a, reason: bad }); continue }
      accepted.push(a)
    }
  }
  return { accepted, rejected }
}
