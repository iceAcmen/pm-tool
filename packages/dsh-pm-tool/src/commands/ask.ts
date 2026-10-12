import type { PmDomain } from '../core/storage.js'
import type { LlmGateway } from '../core/ai-client.js'
import { generateDraft, AiDraftError } from '../core/ai-client.js'
import { resolveModelRoute, getModelMode, PROD_KEY_MISSING_TEXT } from '../core/model-route.js'
import { buildAskContext } from '../core/ask-copilot.js'

const SYSTEM = `你是项目经理副驾。基于给定项目数据，先用一段简洁中文回答用户问题（只读诊断）。
若确有可改进处，再在最后输出一个 json 代码块：{"actions":[{"op":"task.update","id":"任务ID","patch":{"字段":"值"}}]}。
patch 仅允许 assignee(字符串)/status(todo|doing|done)/progress(0-100整数)/dueDate(YYYY-MM-DD)。禁止删除、禁止批量、禁止未知字段。没有建议动作就不要输出 json 块。`

export function handleAskCommand(argument: string, domain: PmDomain | undefined, llm: LlmGateway | undefined) {
  if (!domain) return { kind: 'error' as const, text: '项目存储未就绪。' }
  const tokens = argument.split(/\s+/)
  const projectId = tokens[0]
  const question = tokens.slice(1).join(' ').trim()
  if (!projectId || !question) return { kind: 'error' as const, text: '请使用：/pm ask <项目ID> "<问题>"' }

  const project = domain.table('projects').get(projectId)
  if (!project) return { kind: 'error' as const, text: `未找到项目 ${projectId}` }

  const tasks = [...domain.table('tasks').entries()].map(([, v]) => v).filter(t => t.projectId === projectId)
  const risks = [...domain.table('risk_issues').entries()].map(([, v]) => v).filter(r => r.projectId === projectId)
  const milestones = [...domain.table('milestones').entries()].map(([, v]) => v).filter(m => m.projectId === projectId)

  const ctxText = buildAskContext({
    projectName: project.name ?? projectId,
    tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status, progress: t.progress ?? 0, assignee: t.assignee, dueDate: t.dueDate })),
    risks: risks.map(r => ({ id: r.id, title: r.title, severity: undefined, probability: r.probability ?? undefined, impact: r.impact ?? undefined })),
    milestones: milestones.map(m => ({ id: m.id, title: m.title, targetDate: m.targetDate, status: m.status })),
  })

  const route = resolveModelRoute(getModelMode(domain))
  const call = generateDraft(llm, {
    system: SYSTEM,
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
