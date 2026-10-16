/**
 * PROD-20 后端编排：把当前项目快照压成中文上下文，调当前车道模型给只读诊断 + 草稿动作。
 * 写动作一律不自动执行——由前端草稿卡点【确认执行】才落库。
 * 上下文只喂"当前真实数据"：缺会议/汇报/交付物时显式标注"无"，禁止模型把缺信息推断为事实。
 */
import { generateDraft, type LlmGateway } from './ai-client.js'
import { parseCopilotActions, validateActions, type CopilotAction } from './copilot.js'
import type { ModelRoute } from './model-route.js'
import type { Meeting, MeetingAction } from './meeting.js'

/** 对外暴露的统一 SYSTEM（ask.ts 复用同一处，避免状态枚举等口径漂移）。 */
export const COPILOT_SYSTEM = `你是项目经理副驾。基于给定项目数据（含"今天"日期），先用一段简洁中文回答用户问题（只读诊断）。
所有相对时间判断必须以给定的"今天"为锚，不要假设今天是别的日期；数据里没有的实体（会议/汇报/交付物）就说"暂无"，不要编造。
若确有可改进处，再在最后输出一个 json 代码块，给出多步计划：{"plan":[{"stepId":"s1","title":"一句人话","reason":"为什么这样改","action":{"op":"task.update","id":"任务ID","patch":{"字段":"值"}},"needs":[],"riskNote":"可选软风险提示"}]}。
- stepId 用 s1/s2…唯一编号；needs 填依赖的前置 stepId（无依赖填 []）；同一步要改同一任务的多个字段就合并成一步，不要拆成两步。
- 整份计划不超过 8 步、不超过 10 条不同任务；做不到就少给几步。
- 允许的写操作与字段（模型只产出草稿，PM 确认后才落库）：
  - task.update：改任务；patch 仅 assignee(字符串)/status(todo|in_progress|blocked|done)/progress(0-100整数)/dueDate/startDate(合法 YYYY-MM-DD，start 不得晚于 due)。
  - milestone.create / milestone.update：里程碑；create 必填 title、targetDate(YYYY-MM-DD)，可选 status(planned|at_risk|achieved|missed)/achievedDate/description；update 可改 title/targetDate/status/achievedDate/description。achieved 必须给 achievedDate，非 achieved 必须 achievedDate=null。
  - risk.create / risk.update：风险/问题；create 必填 type(risk|issue)、title、impact(low|medium|high|critical)，可选 description/owner/dueDate/status(open|monitoring|closed)/probability(low|medium|high)/responsePlan/solution；risk 必须给 probability 且不填 solution，issue 的 probability 必须为 null 且不填 responsePlan。
  - deliverable.create / deliverable.update：交付物；create 必填 name，可选 version/owner/status(planned|in_progress|submitted|accepted)/location/description/dueDate/repoUrl/branch。
  - meeting.create / meeting.update：会议；create 必填 title、meetingDate(YYYY-MM-DD)，可选 startTime(HH:mm)/durationMinutes(1-1440)/location/facilitator/recorder/participants(字符串数组)/status(draft|final)/summary/topics(数组)/decisions(数组)/notes。
- 禁止删除、禁止移动、禁止未知字段、禁止改汇报；create 动作不要带 id（系统自动编号），update 必须带现有实体 id。
- 没有建议动作就不要输出 json 块。`

export interface AskContext {
  projectName: string
  today: string // YYYY-MM-DD（本地日零点日期，由调用方注入，便于离线测试）
  tasks: { id: string, title: string, status: string, progress: number, assignee?: string, dueDate?: string, startDate?: string }[]
  risks: { id: string, title: string, status?: string, severity?: string, probability?: string, impact?: string }[]
  milestones: { id: string, title: string, targetDate?: string, status: string }[]
  meetings?: { id: string, title: string, date?: string, actions?: MeetingAction[] }[]
  reports?: { id: string, title: string, date?: string, kind?: string }[]
  deliverables?: { id: string, title: string, status?: string, dueDate?: string }[]
}

/** 把实体列表压成一行；为空时显式标注，避免模型误以为"没提到=不存在"以外的结论。 */
function joinOrNote(label: string, items: string[]): string {
  return items.length ? `${label}（${items.length}）：` + items.join('；') : `${label}：暂无`
}

export function buildAskContext(c: AskContext): string {
  const lines: string[] = [
    `项目：${c.projectName}`,
    `今天（本地日期）：${c.today}。请以此为唯一日历锚点判断逾期/临期。`,
  ]
  lines.push(joinOrNote('任务', c.tasks.map(t =>
    `${t.id} ${t.title}[${t.status} ${t.progress}%${t.assignee ? ` 负责人=${t.assignee}` : ''}${t.startDate ? ` 起=${t.startDate}` : ''}${t.dueDate ? ` 截止=${t.dueDate}` : ''}]`)))
  lines.push(joinOrNote('里程碑', c.milestones.map(m =>
    `${m.id} ${m.title}[${m.status}${m.targetDate ? ` ${m.targetDate}` : ''}]`)))
  lines.push(joinOrNote('风险/问题', c.risks.map(r =>
    `${r.id} ${r.title}[状态=${r.status ?? '未知'}${[r.severity, r.probability, r.impact].filter(Boolean).join('/')}]`)))
  // 会议行动项 / 汇报 / 交付物：有则摘要，无则显式"暂无"，不推断。
  lines.push(joinOrNote('会议及行动项', (c.meetings ?? []).map(m =>
    `${m.id} ${m.title}${m.date ? `(${m.date})` : ''}${m.actions?.length ? ' 行动项：' + m.actions.map(a => `${a.id}:${a.title}[${a.status}${a.owner ? ` 负责人=${a.owner}` : ''}${a.dueDate ? ` 截止=${a.dueDate}` : ''}]`).join('，') : ''}`)))
  lines.push(joinOrNote('进度汇报', (c.reports ?? []).map(r => `${r.id} ${r.title}${r.date ? `(${r.date})` : ''}`)))
  lines.push(joinOrNote('交付物', (c.deliverables ?? []).map(d => `${d.id} ${d.title}[${d.status ?? '?'}${d.dueDate ? ` ${d.dueDate}` : ''}]`)))
  return lines.join('\n')
}

export interface AskResult {
  diagnosis: string
  accepted: CopilotAction[]
  rejected: { action: CopilotAction, reason: string }[]
}

/** 本地日零点 YYYY-MM-DD（Asia/Shanghai 语义由调用方环境决定；离线测试直接传 today）。 */
export function localToday(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function askCopilot(
  llm: LlmGateway | undefined,
  route: ModelRoute,
  ctxText: string,
  question: string,
  taskIds: string[],
): Promise<AskResult> {
  // user 结构：项目快照（稳定前缀，多轮追问命中缓存）在前，用户问题（变化）在最后。
  const raw = await generateDraft(llm, {
    system: COPILOT_SYSTEM,
    user: `【项目数据】\n${ctxText}\n\n【用户问题】${question}`,
    maxTokens: 4000,
    models: route.models,
  })
  const v = validateActions(parseCopilotActions(raw), { taskIds })
  // 诊断 = 去掉 json 块后的正文
  const diagnosis = raw.replace(/```(?:json)?[\s\S]*?```/gi, '').trim() || '（模型未给出诊断正文）'
  return { diagnosis, accepted: v.accepted, rejected: v.rejected }
}
