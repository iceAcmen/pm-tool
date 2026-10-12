/**
 * PROD-20 后端编排：把当前项目快照压成中文上下文，调当前车道模型给只读诊断 + 草稿动作。
 * 写动作一律不自动执行——由前端草稿卡点【确认执行】才落库。
 */
import { generateDraft, type LlmGateway } from './ai-client.js'
import { parseCopilotActions, validateActions, type CopilotAction } from './copilot.js'

export interface AskContext {
  projectName: string
  tasks: { id: string, title: string, status: string, progress: number, assignee?: string, dueDate?: string }[]
  risks: { id: string, title: string, severity?: string, probability?: string, impact?: string }[]
  milestones: { id: string, title: string, targetDate?: string, status: string }[]
}

export function buildAskContext(c: AskContext): string {
  const lines: string[] = [`项目：${c.projectName}`]
  lines.push(`任务（${c.tasks.length}）：` + c.tasks.map(t => `${t.id} ${t.title}[${t.status} ${t.progress}%${t.assignee ? ` 负责人=${t.assignee}` : ''}${t.dueDate ? ` 截止=${t.dueDate}` : ''}]`).join('；'))
  lines.push(`里程碑（${c.milestones.length}）：` + c.milestones.map(m => `${m.id} ${m.title}[${m.status}${m.targetDate ? ` ${m.targetDate}` : ''}]`).join('；'))
  lines.push(`风险（${c.risks.length}）：` + c.risks.map(r => `${r.id} ${r.title}[${[r.probability, r.impact, r.severity].filter(Boolean).join('/')}]`).join('；'))
  return lines.join('\n')
}

const SYSTEM = `你是项目经理副驾。基于给定项目数据，先用一段简洁中文回答用户问题（只读诊断）。
若确有可改进处，再在最后输出一个 json 代码块：{"actions":[{"op":"task.update","id":"任务ID","patch":{"字段":"值"}}]}。
patch 仅允许 assignee(字符串)/status(todo|doing|done)/progress(0-100整数)/dueDate(YYYY-MM-DD)。禁止删除、禁止批量、禁止未知字段。没有建议动作就不要输出 json 块。`

export interface AskResult {
  diagnosis: string
  accepted: CopilotAction[]
  rejected: { action: CopilotAction, reason: string }[]
}

export async function askCopilot(
  llm: LlmGateway | undefined,
  route: { provider: string, model: string, models?: string[] },
  ctxText: string,
  question: string,
  taskIds: string[],
): Promise<AskResult> {
  const raw = await generateDraft(llm, {
    system: SYSTEM,
    user: `【项目数据】\n${ctxText}\n\n【用户问题】${question}`,
    maxTokens: 4000,
    provider: route.provider,
    model: route.model,
    models: route.models ? [...route.models] : undefined,
  })
  const v = validateActions(parseCopilotActions(raw), { taskIds })
  // 诊断 = 去掉 json 块后的正文
  const diagnosis = raw.replace(/```(?:json)?[\s\S]*?```/gi, '').trim() || '（模型未给出诊断正文）'
  return { diagnosis, accepted: v.accepted, rejected: v.rejected }
}
