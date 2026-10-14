import type { PmDomain } from '../core/storage.js'
import type { LlmGateway } from '../core/ai-client.js'
import { generateDraft, AiDraftError } from '../core/ai-client.js'
import { resolveModelRoute, getModelMode, PROD_KEY_MISSING_TEXT } from '../core/model-route.js'
import { buildAskContext, localToday, COPILOT_SYSTEM } from '../core/ask-copilot.js'

export function handleAskCommand(argument: string, domain: PmDomain | undefined, llm: LlmGateway | undefined) {
  // PROD-20 E2E 测试缝：仅当 DSH_PM_E2E=1 时可用，不调模型，返回固定"模拟模型原始输出"，
  // 后续 parseCopilotActions→validateActions→渲染→确认落盘与真实 ask 完全同路径；生产/所有者实例不注册。
  if (process.env.DSH_PM_E2E === '1' && /(^|\s)fixture(\s|$)/.test(argument)) {
    const projectId = argument.split(/\s+/).filter(t => t !== 'fixture')[0]
    if (!domain || !domain.table('projects').get(projectId ?? '')) {
      return { kind: 'error' as const, text: '未找到项目' }
    }
    // 动态取本项目前几个任务，避免硬编码 t-9001/9002 与隔离夹具不一致
    const tasks = [...domain.table('tasks').entries()].map(([, v]) => v as { id: string, projectId?: string })
      .filter(t => t.projectId === projectId).map(t => t.id)
    if (tasks.length < 1) return { kind: 'error' as const, text: '项目暂无任务，无法演示草稿' }
    const okId = tasks[0]
    const delId = tasks[1] ?? tasks[0]
    const cycleId = tasks[2] ?? delId
    // 多步计划：s1 收尾（合法）→ s2 同任务改派（合法链式）；s3 删除步（应被白名单拒）；s4/s5 环依赖（应被 DAG 拒）。
    const plan = [
      { stepId: 's1', title: '收尾任务', reason: '进度已完成、阻塞已解', action: { op: 'task.update', id: okId, patch: { status: 'done', progress: 100 } }, needs: [], riskNote: '改完同步周会' },
      { stepId: 's2', title: '改派负责人', reason: 's1 释放了人力', action: { op: 'task.update', id: okId, patch: { assignee: '赵六' } }, needs: ['s1'] },
      { stepId: 's3', title: '删除任务(应被拒)', reason: '演示白名单拒绝', action: { op: 'task.delete', id: delId }, needs: [] },
      { stepId: 's4', title: '环依赖a(应被拒)', reason: '演示环局部拒', action: { op: 'task.update', id: cycleId, patch: { progress: 10 } }, needs: ['s5'] },
      { stepId: 's5', title: '环依赖b(应被拒)', reason: '演示环局部拒', action: { op: 'task.update', id: cycleId, patch: { progress: 20 } }, needs: ['s4'] },
    ]
    return {
      kind: 'success' as const,
      text: `【E2E 固定诊断】今天是 ${localToday()}，该项目任务进度滞后，建议先收尾 ${okId} 再改派。
\`\`\`json
{"plan":${JSON.stringify(plan)}}
\`\`\``,
    }
  }
  if (!domain) return { kind: 'error' as const, text: '项目存储未就绪。' }
  const tokens = argument.split(/\s+/)
  const projectId = tokens[0]
  const question = tokens.slice(1).join(' ').trim()
  if (!projectId || !question) return { kind: 'error' as const, text: '请使用：/pm ask <项目ID> "<问题>"' }

  const project = domain.table('projects').get(projectId)
  if (!project) return { kind: 'error' as const, text: `未找到项目 ${projectId}` }

  const list = (name: string): any[] => [...(domain.table as any)(name).entries()].map(([, v]) => v).filter((x: any) => x.projectId === projectId)
  const tasks = list('tasks')
  const risks = list('risk_issues')
  const milestones = list('milestones')
  const meetings = list('meetings')
  const reports = list('reports')
  const deliverables = list('deliverables')

  const ctxText = buildAskContext({
    projectName: project.name ?? projectId,
    today: localToday(),
    tasks: tasks.map((t: any) => ({ id: t.id, title: t.title, status: t.status, progress: t.progress ?? 0, assignee: t.assignee, dueDate: t.dueDate, startDate: t.startDate })),
    risks: risks.map((r: any) => ({ id: r.id, title: r.title, status: r.status, severity: r.severity, probability: r.probability, impact: r.impact })),
    milestones: milestones.map((m: any) => ({ id: m.id, title: m.title, targetDate: m.targetDate, status: m.status })),
    meetings: meetings.map((m: any) => ({ id: m.id, title: m.title, date: m.meetingDate, actions: m.actions ?? [] })),
    reports: reports.map((r: any) => ({ id: r.id, title: r.title ?? r.kind ?? r.id, date: r.date })),
    deliverables: deliverables.map((d: any) => ({ id: d.id, title: d.title, status: d.status, dueDate: d.dueDate })),
  })

  const route = resolveModelRoute(getModelMode(domain))
  const call = generateDraft(llm, {
    system: COPILOT_SYSTEM,
    user: `【项目数据】\n${ctxText}\n\n【用户问题】${question}`,
    maxTokens: 4000,
    provider: route.provider,
    model: route.model,
    models: route.models ? [...route.models] : undefined,
  })
  return call.then(text => ({ kind: 'success' as const, text })).catch((error: unknown) => {
    if (error instanceof AiDraftError && (error.message === 'PROD_KEY_MISSING' || /Key|密钥/.test(error.message))) {
      return { kind: 'error' as const, text: PROD_KEY_MISSING_TEXT }
    }
    return { kind: 'error' as const, text: `副驾暂不可用：${error instanceof Error ? error.message : String(error)}` }
  })
}

// ===== PROD-20 后端应用守卫（加固） =====
// 前端确认不再直接循环 `task update`，而是把草稿动作交给后端：
// 服务器从 domain 重读、校验「目标属于当前项目 + 允许字段 + 真实日期」，
// 对有基线 updatedAt 的条目做冲突比较（他人已改则拒绝覆盖）。
// 写库一律走既有 updateTask 领域路径（enqueueDomainWrite 串行 + 起止/关系校验），
// 不再 table.put 绕过。同草稿并发：用 in-flight Promise 在 await 前原子占用，并发方共享同一结果，
// 杜绝双写；完成后写 TTL，失败清理 in-flight。不新增表、不把任何 token 当授权。
import { validateActions, type CopilotAction } from '../core/copilot.js'
import { updateTask } from '../core/tasks.js'
import {
  createSettingsIdempotencyRegistry,
  hashScopeKey,
  askApplyScope,
  IDEMPOTENCY_TTL_MS,
  IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT,
} from '../core/idempotency.js'

// 并发去重仍是纯内存（不落盘）：同一进程内 await 前原子占用，并发方共享同一结果，杜绝双写。
// 键用 keyHash（与持久化注册表一致），这里不存动作正文。
const inFlight = new Map<string, Promise<AskApplyResult>>()

// 幂等键分片 = projectId + actorSegment + JSON(actions) + JSON(baseline)，再取 SHA-256：
// 同一勾选集合 60s 内重复确认才拦截；不同 baseline（重新生成计划）/ 不同子集（逐步模式）/
// 不同 project / 不同 actor 互不误拦。落盘只存 hash 与最小标记，不存动作正文。
function applyKeyHash(projectId: string, actions: CopilotAction[], baseline: Record<string, string>, actorSegment: string): string {
  return hashScopeKey([projectId, actorSegment, JSON.stringify(actions), JSON.stringify(baseline)])
}

export interface AskApplyResult {
  kind: 'success' | 'error'
  text: string
  appliedCount?: number
}

async function applyCore(projectId: string, actions: CopilotAction[], baseline: Record<string, string>, domain: PmDomain): Promise<AskApplyResult> {
  // 从 domain 重读当前项目全部任务，后端校验归属/字段/日期
  const tasks = [...domain.table('tasks').entries()].map(([, v]) => v as { id: string, projectId?: string, updatedAt?: string })
  const liveIds = new Set(tasks.filter(t => t.projectId === projectId).map(t => t.id))
  const v = validateActions(actions, { taskIds: [...liveIds] })

  // 计划步带 stepId/title/needs 元数据（旧扁平 action 无这些字段，行为不变）。
  const isPlan = actions.some(a => typeof a.stepId === 'string')
  const unit = isPlan ? '步' : '条'
  const label = (a: CopilotAction): string => {
    const sid = typeof a.stepId === 'string' ? a.stepId : ''
    const title = typeof a.title === 'string' ? a.title : ''
    const id = String(a.id ?? '(无id)')
    return sid ? `${sid} ${id}${title ? ` ${title}` : ''}` : id
  }

  const applied: string[] = []
  const blocked: string[] = []
  const appliedStepIds = new Set<string>()
  for (const a of v.accepted) {
    // 依赖级联：本步 needs 指向的前置 stepId 未全部落库 -> 本步跳过（不自动补偿/重试）。
    const needs = Array.isArray(a.needs) ? a.needs.filter((n): n is string => typeof n === 'string') : []
    if (needs.some(n => !appliedStepIds.has(n))) { blocked.push(`${label(a)}：依赖步骤未执行，已跳过`); continue }
    const rec = tasks.find(t => t.id === a.id) as { id: string, projectId?: string, updatedAt?: string } | undefined
    if (!rec || rec.projectId !== projectId) { blocked.push(`${label(a)}：不存在或不属于本项目`); continue }
    // 冲突：草稿基线 updatedAt 与当前不一致 -> 他人已改，拒绝覆盖
    const base = baseline[a.id ?? '']
    if (base && rec.updatedAt && rec.updatedAt !== base) { blocked.push(`${label(a)}：内容已被他人更新，为避免覆盖未执行`); continue }
    try {
      const next = await updateTask(domain, a.id!, (a.patch ?? {}) as Record<string, unknown>)
      // 链式 baseline：同目标后续步用本次落库后的新 updatedAt 比较，不被误判「他人已改」；仅本次调用内存，不持久。
      if (next?.updatedAt) {
        baseline[a.id!] = next.updatedAt
        rec.updatedAt = next.updatedAt // 同步本地快照，供同目标后续步冲突比较
      }
      if (typeof a.stepId === 'string') appliedStepIds.add(a.stepId)
      applied.push(label(a))
    } catch (e) {
      blocked.push(`${label(a)}：写库失败（${e instanceof Error ? e.message : String(e)}）`)
    }
  }
  const extra = v.rejected.map(r => `${r.action.id ?? '(无id)'}：${r.reason}`)
  const text = `已应用 ${applied.length} ${unit}${applied.length ? `（${applied.join('；')}）` : ''}`
    + (blocked.length ? `；未执行 ${blocked.length} ${unit}（${blocked.join('；')}）` : '')
    + (extra.length ? `；拒绝 ${extra.length} ${unit}（${extra.join('；')}）` : '')
  return { kind: 'success', text, appliedCount: applied.length }
}

export async function handleAskApplyCommand(argument: string, domain: PmDomain | undefined): Promise<AskApplyResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  // 形如: <projectId> <jsonActions> [--base <jsonUpdatedAtMap>]
  const m = /^(\S+)\s+([\s\S]*)$/.exec(argument.trim())
  if (!m) return { kind: 'error', text: '用法：ask-apply <项目ID> <json动作数组>' }
  const projectId = m[1]
  const rest = m[2]
  const baseMatch = /--base\s+(\{[\s\S]*\})\s*$/.exec(rest)
  const actionsJson = baseMatch ? rest.slice(0, baseMatch.index).trim() : rest.trim()
  let actions: CopilotAction[]
  try {
    const obj = JSON.parse(actionsJson)
    actions = Array.isArray(obj) ? obj : (obj.actions ?? [])
    if (!Array.isArray(actions)) throw new Error('动作须为数组')
  } catch {
    return { kind: 'error', text: '动作 JSON 无法解析。' }
  }
  if (!domain.table('projects').get(projectId)) return { kind: 'error', text: `未找到项目 ${projectId}` }
  // 基线：若传了必须是合法对象映射；malformed 直接报错（不再静默 ignore）。
  let baseline: Record<string, string> = {}
  if (baseMatch) {
    try {
      const parsed = JSON.parse(baseMatch[1])
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('基线须为对象')
      baseline = parsed
    } catch {
      return { kind: 'error', text: '确认基线（--base）格式非法，已中止以防误覆盖。' }
    }
  }

  // actorSegment 预留：当前无账号体系，统一 local-anonymous；未来不同 actor 不互去重。
  const actorSegment = IDEMPOTENCY_ACTOR_SEGMENT_DEFAULT
  const keyHash = applyKeyHash(projectId, actions, baseline, actorSegment)
  const registry = createSettingsIdempotencyRegistry(domain)

  // 持久化幂等（60s 短 TTL）：成功标记落盘后的「顺序重放」（重启 / 新进程重开同一数据 root，
  // 按时间先后再次确认同一计划）直接返回「已执行」，避免因 updatedAt 已被本次确认推进、
  // 再比旧基线而误报「他人已改」冲突。注意：本标记只覆盖顺序重放，不提供跨进程并发互斥——
  // 跨进程同时双写仍由 updateTask 写队列 / 基线比较兜底，不在本幂等语义内。
  if (registry.check(keyHash)) {
    return { kind: 'success', text: '该计划已执行过（幂等拦截），为避免重复写库未再次执行。' }
  }
  // 并发去重（纯内存）：in-flight 中同一草稿直接共享结果，杜绝 await 前检查通过后双写。
  const flying = inFlight.get(keyHash)
  if (flying) return flying

  const promise = applyCore(projectId, actions, baseline, domain)
  inFlight.set(keyHash, promise)
  try {
    const res = await promise
    // 只有真正落库成功（appliedCount>0）才登记幂等标记；失败/全拒绝不登记。
    if ((res.appliedCount ?? 0) > 0) {
      try {
        await registry.record({
          keyHash,
          scope: askApplyScope(projectId, actorSegment),
          expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
        })
      } catch {
        // 幂等登记失败不影响已落库业务结果（最坏 60s 内可能重写一次，由 baseline/串行写兜底）。
      }
    }
    return res
  } finally {
    inFlight.delete(keyHash)
  }
}

