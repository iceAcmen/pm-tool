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

// #22：从仅 task.update 扩到里程碑/风险/交付物/会议四类实体的 create/update。
// op 命名：<entity>.create / <entity>.update；task.update 保持原样不动。
const ALLOWED_OPS = new Set([
  'task.update',
  'milestone.create', 'milestone.update',
  'risk.create', 'risk.update',
  'deliverable.create', 'deliverable.update',
  'meeting.create', 'meeting.update',
])
// 直接复用 task.ts 导出的 taskStatusSchema，避免复制常量导致两端漂移；
// 旧版误用 'doing' 会通过校验却在写库时被 zod 拒绝。
import { TASK_STATUSES } from './status.js'
const STATUS = new Set(TASK_STATUSES)

// ===== #22 四类实体的字段白名单与枚举（与各实体 zod schema 对齐，供前置校验/前端卡片） =====
const MILESTONE_STATUS = new Set(['planned', 'at_risk', 'achieved', 'missed'])
const RISK_TYPE = new Set(['risk', 'issue'])
const RISK_STATUS = new Set(['open', 'monitoring', 'closed'])
const RISK_PROB = new Set(['low', 'medium', 'high'])
const RISK_IMPACT = new Set(['low', 'medium', 'high', 'critical'])
const DELIVERABLE_STATUS = new Set(['planned', 'in_progress', 'submitted', 'accepted'])
const MEETING_STATUS = new Set(['draft', 'final'])

const isStr = (v: unknown): v is string => typeof v === 'string'
const isNullish = (v: unknown): boolean => v === null || v === undefined
const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr)
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

/** 字段校验器：返回 '' 表示合法，否则返回错误原因。 */
type FieldCheck = (v: unknown) => string

const strField: FieldCheck = v => (isStr(v) ? '' : '须为字符串')
const dateField: FieldCheck = v => (isValidDateStr(v) ? '' : '日期须为合法 YYYY-MM-DD')
const nullableDate: FieldCheck = v => (isNullish(v) || isValidDateStr(v) ? '' : '须为合法日期或 null')
const nullableEnum = (set: Set<string>): FieldCheck => v =>
  (isNullish(v) || set.has(String(v))) ? '' : `须为 ${[...set].join('/')} 或 null`
const enumField = (set: Set<string>): FieldCheck => v =>
  set.has(String(v)) ? '' : `须为 ${[...set].join('/')}`

// ===== P0 K2：task.update 受限直写窄集新增四字段前置闸（最终口径仍以 task.ts zod 落库校验为准） =====
// description：纯文本备注，≤2000 字；不做语义改写，模型只能补写客观说明。
const DESCRIPTION_MAX = 2000
const descriptionField: FieldCheck = v => {
  if (!isStr(v)) return '须为字符串'
  if (v.length > DESCRIPTION_MAX) return `长度不得超过 ${DESCRIPTION_MAX} 字`
  return ''
}
// http(s):// 链接，或相对路径形状（/绝对、./、../、含 / 的相对路径段）；禁空白，≤2048。
// 不联网探测、不校验可达性；非法形状（如裸词 "abc"）直接拒。
const HTTP_URL = /^https?:\/\/[^\s]+$/i
const REL_PATH = /^(\.{1,2}\/|\/)[^\s]*$|^[A-Za-z0-9._-]+\/[^\s]*$/
const URLISH_MAX = 2048
const urlishField: FieldCheck = v => {
  if (!isStr(v)) return '须为字符串'
  if (v.length > URLISH_MAX) return `长度不得超过 ${URLISH_MAX} 字符`
  const t = v.trim()
  if (HTTP_URL.test(t) || REL_PATH.test(t)) return ''
  return '须为 http(s):// 链接或相对路径'
}
// branch：纯字符串 ≤128（落库 zod 另有更严的分支名白名单，此处仅做窄集前置闸）。
const BRANCH_MAX = 128
const branchField: FieldCheck = v => {
  if (!isStr(v)) return '须为字符串'
  if (v.length > BRANCH_MAX) return `长度不得超过 ${BRANCH_MAX} 字符`
  return ''
}

/**
 * 校验 patch 的字段白名单。allowed: 字段名 -> 校验器；required: 创建时必填字段。
 * 返回首个错误原因，'' 表示全部合法；未知字段直接拒绝（白名单外不得透传到 repo）。
 */
function checkEntityFields(
  patch: Record<string, unknown>,
  allowed: Record<string, FieldCheck>,
  required: string[],
): string {
  const keys = Object.keys(patch)
  if (!keys.length) return '空 patch'
  for (const r of required) {
    if (isNullish(patch[r])) return `缺少必填字段 ${r}`
  }
  for (const k of keys) {
    const checker = allowed[k]
    if (!checker) return `未知字段 ${k}`
    const bad = checker(patch[k])
    if (bad) return `${k}：${bad}`
  }
  return ''
}

/** 风险 type 交叉约束：risk 必须概率、禁 solution；issue 概率必须 null、禁 responsePlan。 */
function checkRiskTypeCross(patch: Record<string, unknown>): string {
  const type = String(patch.type ?? '')
  if (type === 'risk') {
    if (!RISK_PROB.has(String(patch.probability))) return '风险必须填写 probability(low/medium/high)'
    if (!isNullish(patch.solution) && String(patch.solution) !== '') return '风险不使用 solution 字段，请填 responsePlan'
  } else if (type === 'issue') {
    if (!isNullish(patch.probability)) return '问题的 probability 必须为 null'
    if (!isNullish(patch.responsePlan) && String(patch.responsePlan) !== '') return '问题不使用 responsePlan 字段，请填 solution'
  }
  return ''
}

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

export interface ActionSnapshot {
  taskIds?: string[]
  milestoneIds?: string[]
  riskIds?: string[]
  deliverableIds?: string[]
  meetingIds?: string[]
}

/** 逐条校验：op 白名单、目标存在（update）、字段合法。非法剔除并给原因。 */
export function validateActions(
  actions: CopilotAction[],
  snapshot: ActionSnapshot,
): ValidationResult {
  const accepted: CopilotAction[] = []
  const rejected: { action: CopilotAction, reason: string }[] = []
  const taskIds = new Set(snapshot.taskIds ?? [])
  const milestoneIds = new Set(snapshot.milestoneIds ?? [])
  const riskIds = new Set(snapshot.riskIds ?? [])
  const deliverableIds = new Set(snapshot.deliverableIds ?? [])
  const meetingIds = new Set(snapshot.meetingIds ?? [])
  for (const a of actions) {
    if (!ALLOWED_OPS.has(a.op)) { rejected.push({ action: a, reason: `不允许的操作 ${a.op}` }); continue }
    if (a.op === 'task.update') {
      if (!a.id || !taskIds.has(a.id)) { rejected.push({ action: a, reason: `任务 ${a.id ?? '(无 id)'} 不存在` }); continue }
      const patch = (a.patch ?? {}) as Record<string, unknown>
      const keys = Object.keys(patch)
      if (!keys.length) { rejected.push({ action: a, reason: '空 patch' }); continue }
      let bad = ''
      for (const k of keys) {
        const v = patch[k]
        if (k === 'status') {
          // X2：AI 不得直写 wrapped（已收尾是人显式决策，非模型可代判）。
          if (String(v) === 'wrapped') bad = 'AI 不得直接写 wrapped（已收尾是人显式决策，请由人手动收尾）'
          else if (!STATUS.has(String(v) as 'todo')) bad = `非法状态 ${String(v)}`
        }
        else if (k === 'progress') { const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > 100) bad = '进度须 0-100 整数' }
        else if (k === 'dueDate' || k === 'startDate') { if (!isValidDateStr(v)) bad = '日期须合法 YYYY-MM-DD' }
        else if (k === 'assignee') { if (typeof v !== 'string') bad = '负责人须为字符串' }
        // P0 K2 窄集新增：仅客观备注/证据链接/仓库链接/分支名可直写；标题/优先级/工时/清单等仍拒。
        else if (k === 'description') { const f = descriptionField(v); if (f) bad = `description：${f}` }
        else if (k === 'evidenceUrl' || k === 'repoUrl') { const f = urlishField(v); if (f) bad = `${k}：${f}` }
        else if (k === 'branch') { const f = branchField(v); if (f) bad = `branch：${f}` }
        else { bad = `未知字段 ${k}` }
        if (bad) break
      }
      // 起止顺序：同一次 patch 同时给了 startDate 与 dueDate 时，不得 start > due。
      if (!bad && typeof patch.startDate === 'string' && typeof patch.dueDate === 'string') {
        if (String(patch.startDate) > String(patch.dueDate)) bad = '开始日期不得晚于截止日期'
      }
      if (bad) { rejected.push({ action: a, reason: bad }); continue }
      accepted.push(a)
      continue
    }

    // ===== #22 四类实体 create/update =====
    const patch = (a.patch ?? {}) as Record<string, unknown>
    const isCreate = a.op.endsWith('.create')

    // 里程碑
    if (a.op === 'milestone.create' || a.op === 'milestone.update') {
      const allowed: Record<string, FieldCheck> = {
        title: strField, targetDate: dateField, status: enumField(MILESTONE_STATUS),
        achievedDate: nullableDate, description: strField,
      }
      const required = isCreate ? ['title', 'targetDate'] : []
      let bad = checkEntityFields(patch, allowed, required)
      if (!bad && a.op === 'milestone.update') {
        if (!a.id || !milestoneIds.has(a.id)) { rejected.push({ action: a, reason: `里程碑 ${a.id ?? '(无 id)'} 不存在` }); continue }
      }
      if (!bad) bad = checkMilestoneStatusCross(patch)
      if (bad) { rejected.push({ action: a, reason: bad }); continue }
      accepted.push(a)
      continue
    }

    // 风险/问题
    if (a.op === 'risk.create' || a.op === 'risk.update') {
      const allowed: Record<string, FieldCheck> = {
        title: strField, description: strField, owner: strField, dueDate: nullableDate,
        status: enumField(RISK_STATUS), probability: nullableEnum(RISK_PROB),
        impact: enumField(RISK_IMPACT), responsePlan: strField, solution: strField,
      }
      // type 仅创建可给；更新不得改类型。
      if (a.op === 'risk.create') allowed.type = enumField(RISK_TYPE)
      const required = isCreate ? ['type', 'title', 'impact'] : []
      let bad = checkEntityFields(patch, allowed, required)
      if (!bad && a.op === 'risk.update') {
        if (!a.id || !riskIds.has(a.id)) { rejected.push({ action: a, reason: `风险/问题 ${a.id ?? '(无 id)'} 不存在` }); continue }
      }
      if (!bad) bad = checkRiskTypeCross(patch)
      if (bad) { rejected.push({ action: a, reason: bad }); continue }
      accepted.push(a)
      continue
    }

    // 交付物
    if (a.op === 'deliverable.create' || a.op === 'deliverable.update') {
      const allowed: Record<string, FieldCheck> = {
        name: strField, version: strField, owner: strField,
        // X2：AI 不得直写 wrapped（已收尾是人显式决策）；枚举集本就不含 wrapped，这里给出明确中文拒因。
        status: v => String(v) === 'wrapped'
          ? 'AI 不得直接写 wrapped（已收尾是人显式决策，请由人手动收尾）'
          : enumField(DELIVERABLE_STATUS)(v),
        location: strField, description: strField, dueDate: nullableDate,
        repoUrl: strField, branch: strField,
      }
      const required = isCreate ? ['name'] : []
      const bad = checkEntityFields(patch, allowed, required)
      if (!bad && a.op === 'deliverable.update') {
        if (!a.id || !deliverableIds.has(a.id)) { rejected.push({ action: a, reason: `交付物 ${a.id ?? '(无 id)'} 不存在` }); continue }
      }
      if (bad) { rejected.push({ action: a, reason: bad }); continue }
      accepted.push(a)
      continue
    }

    // 会议
    if (a.op === 'meeting.create' || a.op === 'meeting.update') {
      const allowed: Record<string, FieldCheck> = {
        title: strField, meetingDate: dateField,
        startTime: v => (isNullish(v) || HHMM.test(String(v))) ? '' : '时间须为 HH:mm 或 null',
        durationMinutes: v => (isNullish(v) || (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 1440)) ? '' : '时长须为 1-1440 整数或 null',
        location: strField, facilitator: strField, recorder: strField,
        participants: v => (isStrList(v) ? '' : '须为字符串数组'), status: enumField(MEETING_STATUS),
        summary: strField, topics: v => (isStrList(v) ? '' : '须为字符串数组'), decisions: v => (isStrList(v) ? '' : '须为字符串数组'), notes: strField,
      }
      const required = isCreate ? ['title', 'meetingDate'] : []
      const bad = checkEntityFields(patch, allowed, required)
      if (!bad && a.op === 'meeting.update') {
        if (!a.id || !meetingIds.has(a.id)) { rejected.push({ action: a, reason: `会议 ${a.id ?? '(无 id)'} 不存在` }); continue }
      }
      if (bad) { rejected.push({ action: a, reason: bad }); continue }
      accepted.push(a)
      continue
    }
  }
  return { accepted, rejected }
}

/** 里程碑 achieved 交叉约束：achieved 必须有 achievedDate；非 achieved 必须 achievedDate=null。 */
function checkMilestoneStatusCross(patch: Record<string, unknown>): string {
  const status = String(patch.status ?? '')
  if (status === 'achieved' && isNullish(patch.achievedDate)) return '状态 achieved 时必须填写 achievedDate'
  if (status && status !== 'achieved' && !isNullish(patch.achievedDate)) return '非 achieved 状态 achievedDate 必须为 null'
  return ''
}

// ===== PROD-24 多步规划（PROD-24）纯函数：解析 / DAG / 预算 / 同目标串行 =====
// 计划只活在前端内存；唯一写动作仍为 task.update，复用上方 validateActions 逐条字段校验。

/** 一步计划（模型给 stepId/title/reason/action/needs/riskNote）。 */
export interface CopilotStep {
  stepId: string
  title: string
  reason: string
  action: CopilotAction
  needs: string[]
  riskNote?: string
}

/** 解析产出的原始步（尚未做 DAG/字段判定）。 */
export type RawPlanStep = CopilotStep

export interface PlanRejection { stepId?: string, reason: string }

export interface ValidatedPlan {
  /** 拓扑序后的可执行步（已过预算 + DAG + 字段校验）。 */
  steps: CopilotStep[]
  /** 计划级被拒步（重复 stepId / 字段非法 / 环 / 悬空依赖）。 */
  rejected: PlanRejection[]
}

export interface ParsedPlan {
  /** 去掉 json 块后的诊断正文。 */
  diagnosis: string
  /** 模型给的原始步（含旧 actions 包成的平凡步）。 */
  rawSteps: RawPlanStep[]
}

/** 从带围栏/噪声的文本里抽出首个 JSON 对象；抽不到返回 undefined（不抛错）。 */
function extractJsonObject(text: string): Record<string, unknown> | undefined {
  if (!text || typeof text !== 'string') return undefined
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence ? fence[1] : text
  const s = candidate.indexOf('{')
  const e = candidate.lastIndexOf('}')
  if (s < 0 || e <= s) return undefined
  try {
    const obj = JSON.parse(candidate.slice(s, e + 1))
    return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

/**
 * 解析模型输出为计划步。兼容三种形状：新 {"plan":[…]}、{"steps":[…]}、旧 {"actions":[…]}。
 * 抽不到任何块 -> rawSteps=[] 且不抛错；诊断正文（去 json 块）独立返回。
 */
export function parseCopilotPlan(text: string): ParsedPlan {
  const diagnosis = text.replace(/```(?:json)?[\s\S]*?```/gi, '').trim() || '（模型未给出诊断正文）'
  const obj = extractJsonObject(text)
  let arr: unknown = undefined
  let isOldActions = false
  if (obj) {
    if (Array.isArray(obj.plan)) arr = obj.plan
    else if (Array.isArray(obj.steps)) arr = obj.steps
    else if (Array.isArray(obj.actions)) { arr = obj.actions; isOldActions = true }
  }
  const rawSteps: RawPlanStep[] = []
  if (Array.isArray(arr)) {
    arr.forEach((item, i) => {
      // 旧格式：把每个 action 包成平凡步（无依赖、无理由）。
      if (isOldActions) {
        const action = item && typeof item === 'object'
          ? item as CopilotAction
          : { op: String(item) }
        rawSteps.push({ stepId: `s${i + 1}`, title: String(action.id ?? ''), reason: '', action, needs: [] })
        return
      }
      if (!item || typeof item !== 'object') return
      const it = item as Record<string, unknown>
      const action = it.action && typeof it.action === 'object'
        ? it.action as CopilotAction
        : { op: typeof it.op === 'string' ? it.op : '', id: it.id, patch: it.patch } as unknown as CopilotAction
      const needs = Array.isArray(it.needs) ? it.needs.filter((n): n is string => typeof n === 'string') : []
      rawSteps.push({
        stepId: typeof it.stepId === 'string' && it.stepId ? it.stepId : `s${i + 1}`,
        title: typeof it.title === 'string' ? it.title : '',
        reason: typeof it.reason === 'string' ? it.reason : '',
        action,
        needs,
        riskNote: typeof it.riskNote === 'string' ? it.riskNote : undefined,
      })
    })
  }
  return { diagnosis, rawSteps }
}

/**
 * 拓扑 + 同目标强制串行。返回可完全排定的步（Kahn，按数组下标确定性兜底）；
 * 处于环中（含自指）的步不在返回里——调用方据此判为「依赖无法解析」。
 * 边：needs[u]=[v] 表示 v 必须先于 u；同 taskId 的步按数组先后隐式加边（优先于模型声明）。
 */
export function orderPlanSteps<T extends { stepId: string, action: CopilotAction, needs: string[] }>(steps: T[]): T[] {
  const idxOf = new Map(steps.map((s, i) => [s.stepId, i]))
  const indeg = new Map<string, number>(steps.map(s => [s.stepId, 0]))
  const dependents = new Map<string, string[]>()
  const addEdge = (from: string, to: string): void => {
    if (!idxOf.has(from) || !idxOf.has(to)) return
    indeg.set(to, (indeg.get(to) ?? 0) + 1)
    dependents.set(from, [...(dependents.get(from) ?? []), to])
  }
  for (const s of steps) {
    for (const need of s.needs ?? []) addEdge(need, s.stepId)
    // 同目标隐式串行：前面的同 task 步 -> 后面的同 task 步
    for (const other of steps) {
      if (other === s) continue
      if (idxOf.get(other.stepId)! < idxOf.get(s.stepId)! && other.action?.id && other.action.id === s.action?.id) {
        addEdge(other.stepId, s.stepId)
      }
    }
  }
  const ready = steps.filter(s => (indeg.get(s.stepId) ?? 0) === 0)
    .sort((a, b) => idxOf.get(a.stepId)! - idxOf.get(b.stepId)!)
  const ordered: T[] = []
  const done = new Set<string>()
  while (ready.length) {
    ready.sort((a, b) => idxOf.get(a.stepId)! - idxOf.get(b.stepId)!)
    const cur = ready.shift()!
    ordered.push(cur)
    done.add(cur.stepId)
    for (const dep of dependents.get(cur.stepId) ?? []) {
      indeg.set(dep, (indeg.get(dep) ?? 0) - 1)
      if ((indeg.get(dep) ?? 0) === 0 && !done.has(dep) && !ready.some(r => r.stepId === dep)) {
        ready.push(steps.find(s => s.stepId === dep)!)
      }
    }
  }
  return ordered
}

/** 预算护栏常量：整份步数上限 / 触及任务数上限，超过即整份拒绝、一条不发。 */
export const PLAN_MAX_STEPS = 8
export const PLAN_MAX_TASKS = 10

/**
 * 计划级校验：重复 stepId 拒 -> 预算护栏（>8 步或 >10 任务整份拒）-> 逐字段复用 validateActions
 * -> DAG 环/悬空依赖局部拒+下游级联 -> 同目标隐式串行拓扑序。坏步不拖合法独立步。
 */
export function validatePlan(rawSteps: RawPlanStep[], snapshot: ActionSnapshot): ValidatedPlan {
  const rejected: PlanRejection[] = []

  // 1) 重复 stepId：后者拒，不整份拒。
  const seen = new Set<string>()
  const unique: RawPlanStep[] = []
  for (const s of rawSteps) {
    if (!s || typeof s !== 'object') { rejected.push({ reason: '步骤格式非法，已跳过' }); continue }
    const sid = s.stepId || '?'
    if (seen.has(sid)) { rejected.push({ stepId: sid, reason: `步骤 ${sid} 重复，已跳过该步` }); continue }
    seen.add(sid)
    unique.push(s)
  }

  // 2) 预算护栏：超上限整份拒绝、一条不发（不做 8 收 1 拒）。
  const taskSet = new Set(unique.map(s => s.action?.id).filter((x): x is string => !!x))
  if (unique.length > PLAN_MAX_STEPS) {
    return { steps: [], rejected: [...rejected, { reason: `计划过大（${unique.length} 步），请拆成 ≤${PLAN_MAX_STEPS} 步后再确认` }] }
  }
  if (taskSet.size > PLAN_MAX_TASKS) {
    return { steps: [], rejected: [...rejected, { reason: `计划触及 ${taskSet.size} 条任务（>${PLAN_MAX_TASKS}），请拆小后再确认` }] }
  }

  // 3) 逐字段校验复用 validateActions；非法步局部拒，不拖合法步。
  const actions = unique.map(s => s.action)
  const v = validateActions(actions, snapshot)
  const badAction = new Set(v.rejected.map(r => r.action))
  const healthy: RawPlanStep[] = []
  for (const s of unique) {
    if (badAction.has(s.action)) {
      const reason = v.rejected.find(r => r.action === s.action)?.reason ?? '动作不合法'
      rejected.push({ stepId: s.stepId, reason: `${s.action?.id ?? '(无id)'}：${reason}` })
    } else {
      healthy.push(s)
    }
  }

  // 4) 悬空依赖级联到不动点：needs 指向不在剩余集的 stepId -> 该步拒；其下游依赖被拒步的也随之级联拒。
  let pool = healthy
  let changed = true
  while (changed) {
    const ids = new Set(pool.map(s => s.stepId))
    const next: RawPlanStep[] = []
    changed = false
    for (const s of pool) {
      const missing = (s.needs ?? []).find(n => !ids.has(n))
      if (missing) {
        rejected.push({ stepId: s.stepId, reason: `依赖 ${missing} 无法解析，已跳过该步` })
        changed = true
      } else {
        next.push(s)
      }
    }
    pool = next
  }

  // 5) 拓扑 + 同目标串行；环中步不在 ordered 里，判为「依赖存在环」。
  const ordered = orderPlanSteps(pool)
  const orderedIds = new Set(ordered.map(s => s.stepId))
  for (const s of pool) {
    if (!orderedIds.has(s.stepId)) rejected.push({ stepId: s.stepId, reason: '依赖存在环，已跳过该步' })
  }
  return { steps: ordered, rejected }
}

/**
 * 逐步模式：把一步转成「单次 ask-apply」发送体——needs 清空（单步无前置可级联），
 * 返回浅拷贝（patch 也浅拷贝），不改动原 step。整批仍用带 needs 的数组由服务端级联守卫。
 */
export function forStepwiseApply(step: CopilotStep): CopilotAction {
  return {
    op: step.action.op,
    id: step.action.id,
    patch: step.action.patch ? { ...step.action.patch } : undefined,
    stepId: step.stepId,
    title: step.title,
    needs: [],
  }
}
