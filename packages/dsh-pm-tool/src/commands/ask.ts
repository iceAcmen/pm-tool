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
    return {
      kind: 'success' as const,
      text: `【E2E 固定诊断】今天是 ${localToday()}，该项目任务进度滞后，建议把 t-9001 收尾并指定负责人。
\`\`\`json
{"actions":[{"op":"task.update","id":"t-9001","patch":{"assignee":"赵六","status":"done"}},{"op":"task.delete","id":"t-9002"},{"op":"task.update","id":"t-9001","patch":{"progress":200}}]}
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

const recentDrafts = new Map<string, number>() // key -> 过期时间戳（已成功执行）
const inFlight = new Map<string, Promise<AskApplyResult>>() // key -> 正在执行的结果（并发去重）
const DRAFT_TTL_MS = 60_000

function draftKey(projectId: string, actions: CopilotAction[]): string {
  return `${projectId}:${JSON.stringify(actions)}`
}

export interface AskApplyResult {
  kind: 'success' | 'error'
  text: string
}

async function applyCore(projectId: string, actions: CopilotAction[], baseline: Record<string, string>, domain: PmDomain): Promise<AskApplyResult> {
  // 清理过期 TTL
  const now = Date.now()
  for (const [k, exp] of recentDrafts) if (exp <= now) recentDrafts.delete(k)

  // 从 domain 重读当前项目全部任务，后端校验归属/字段/日期
  const tasks = [...domain.table('tasks').entries()].map(([, v]) => v as { id: string, projectId?: string, updatedAt?: string })
  const liveIds = new Set(tasks.filter(t => t.projectId === projectId).map(t => t.id))
  const v = validateActions(actions, { taskIds: [...liveIds] })

  const applied: string[] = []
  const rejected: string[] = []
  for (const a of v.accepted) {
    const rec = tasks.find(t => t.id === a.id) as { id: string, projectId?: string, updatedAt?: string } | undefined
    if (!rec || rec.projectId !== projectId) { rejected.push(`${a.id}：不存在或不属于本项目`); continue }
    // 冲突：草稿基线 updatedAt 与当前不一致 -> 他人已改，拒绝覆盖
    const base = baseline[a.id ?? '']
    if (base && rec.updatedAt && rec.updatedAt !== base) { rejected.push(`${a.id}：内容已被他人更新，为避免覆盖未执行`); continue }
    try {
      await updateTask(domain, a.id!, (a.patch ?? {}) as Record<string, unknown>)
      applied.push(`${a.id}`)
    } catch (e) {
      rejected.push(`${a.id}：写库失败（${e instanceof Error ? e.message : String(e)}）`)
    }
  }
  const extra = v.rejected.map(r => `${r.action.id ?? '(无id)'}：${r.reason}`)
  const text = `已应用 ${applied.length} 条${applied.length ? `（${applied.join(', ')}）` : ''}`
    + (rejected.length ? `；未执行 ${rejected.length} 条（${rejected.join('；')}）` : '')
    + (extra.length ? `；拒绝 ${extra.length} 条（${extra.join('；')}）` : '')
  return { kind: 'success', text }
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

  const key = draftKey(projectId, actions)
  const now = Date.now()
  const seenAt = recentDrafts.get(key)
  if (seenAt && seenAt > now) {
    return { kind: 'success', text: '该草稿已确认过，为避免重复写库未再次执行（幂等拦截）。' }
  }
  // 并发去重：in-flight 中同一草稿直接共享结果，杜绝 await 前检查通过后双写。
  const flying = inFlight.get(key)
  if (flying) return flying

  const promise = applyCore(projectId, actions, baseline, domain)
  inFlight.set(key, promise)
  try {
    const res = await promise
    if (res.text.includes('已应用 0 条') === false) recentDrafts.set(key, Date.now() + DRAFT_TTL_MS)
    return res
  } finally {
    inFlight.delete(key)
  }
}

