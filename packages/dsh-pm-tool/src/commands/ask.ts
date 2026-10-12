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

// ===== PROD-20 后端应用守卫（第1步加固） =====
// 前端确认不再直接循环 `task update`，而是把草稿动作交给后端：
// 服务器从 domain 重读、校验「目标属于当前项目 + 允许字段 + 真实日期」，
// 对有基线 updatedAt 的条目做冲突比较（他人已改则拒绝覆盖），并用内存 TTL 做草稿幂等，
// 防止重复/并发确认重复写库。不新增表、不把任何 token 当授权。
import { validateActions, type CopilotAction } from '../core/copilot.js'

const appliedDrafts = new Map<string, number>() // key -> 过期时间戳
const DRAFT_TTL_MS = 60_000

function draftKey(projectId: string, actions: CopilotAction[]): string {
  return `${projectId}:${JSON.stringify(actions)}`
}

export interface AskApplyResult {
  kind: 'success' | 'error'
  text: string
}

export async function handleAskApplyCommand(argument: string, domain: PmDomain | undefined): Promise<AskApplyResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  // 形如: <projectId> <jsonActions> [--base <jsonUpdatedAtMap>]
  const m = /^(\S+)\s+([\s\S]*)$/.exec(argument.trim())
  if (!m) return { kind: 'error', text: '用法：ask-apply <项目ID> <json动作数组>' }
  const projectId = m[1]
  const rest = m[2]
  // 拆分 --base
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
  let baseline: Record<string, string> = {}
  if (baseMatch) { try { baseline = JSON.parse(baseMatch[1]) } catch { /* ignore */ } }

  const key = draftKey(projectId, actions)
  const now = Date.now()
  const seenAt = appliedDrafts.get(key)
  if (seenAt && seenAt > now) {
    return { kind: 'success', text: '该草稿已确认过，为避免重复写库未再次执行（幂等拦截）。' }
  }

  // 从 domain 重读当前项目全部任务，后端校验归属/字段/日期
  const tasks = [...domain.table('tasks').entries()].map(([, v]) => v as { id: string, projectId?: string, updatedAt?: string })
  const liveIds = new Set(tasks.filter(t => t.projectId === projectId).map(t => t.id))
  const v = validateActions(actions, { taskIds: [...liveIds] })

  const applied: string[] = []
  const rejected: string[] = []
  for (const a of v.accepted) {
    const rec = tasks.find(t => t.id === a.id) as (Record<string, unknown> & { id: string, updatedAt?: string }) | undefined
    if (!rec || rec.projectId !== projectId) { rejected.push(`${a.id}：不存在或不属于本项目`); continue }
    // 冲突：草稿基线 updatedAt 与当前不一致 -> 他人已改，拒绝覆盖
    const base = baseline[a.id ?? '']
    if (base && rec.updatedAt && rec.updatedAt !== base) { rejected.push(`${a.id}：内容已被他人更新，为避免覆盖未执行`); continue }
    const next = { ...rec, ...(a.patch ?? {}), updatedAt: new Date().toISOString() }
    try {
      await (domain.table("tasks") as any).put(a.id!, next)
      applied.push(`${a.id}`)
    } catch (e) {
      rejected.push(`${a.id}：写库失败（${e instanceof Error ? e.message : String(e)}）`)
    }
  }
  // 记录幂等（仅当确实执行了写动作）
  if (applied.length) appliedDrafts.set(key, now + DRAFT_TTL_MS)
  const extra = v.rejected.map(r => `${r.action.id ?? '(无id)'}：${r.reason}`)
  const text = `已应用 ${applied.length} 条${applied.length ? `（${applied.join(', ')}）` : ''}`
    + (rejected.length ? `；未执行 ${rejected.length} 条（${rejected.join('；')}）` : '')
    + (extra.length ? `；拒绝 ${extra.length} 条（${extra.join('；')}）` : '')
  return { kind: 'success', text }
}
