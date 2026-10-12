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
    meetings: meetings.map((m: any) => ({ id: m.id, title: m.title, date: m.date, actions: m.actions ?? [] })),
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
