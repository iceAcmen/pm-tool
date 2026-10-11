/**
 * R14 进度汇报 AI 叙述：在确定性快照数字之上，让模型只写「本周进展/风险/下周计划」
 * 叙述段落。数字全部由我方确定性采集，AI 不得编造；叙述落入既有快照的
 * executiveSummary 字段（R9 已存在的自由文本字段），confirm 才生成快照落盘。
 *
 * 失败/无 key 时退化为既有确定性快照（generateProgressReport 不带叙述）。
 */
import { generateDraft, type LlmGateway } from './ai-client.js'
import { collectProjectReport, ReportProjectNotFoundError } from './report.js'
import type { PmDomain } from './storage.js'

export { ReportProjectNotFoundError }

const NARRATE_SYSTEM_PROMPT = [
  '你是项目经理的助手，基于我方提供的「确定性项目数据 JSON」撰写一段中文进度汇报叙述。',
  '严格要求：',
  '1. 只依据 JSON 里的数字与标题组织文字，不要编造任何数字、日期或不存在的事项。',
  '2. 用三小段依次写：本周进展、风险/阻塞、下周计划；每段 2~4 句，语气务实。',
  '3. 不要输出 JSON、不要标题符号以外的解释、不要重复罗列全部任务。',
].join('\n')

/** 计算「过去 N 天」的周期（确定性，本地时区日期）。 */
export function defaultPeriod(days = 7): { periodStart: string, periodEnd: string } {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { periodStart: iso(start), periodEnd: iso(end) }
}

/** 把确定性采集结果压缩成给模型的精简统计 JSON。 */
export function buildBrief(domain: PmDomain, projectId: string): Record<string, unknown> {
  const { project, tasks, milestones } = collectProjectReport(domain, projectId)
  const today = new Date().toISOString().slice(0, 10)
  const count = (status: string) => tasks.filter(t => t.status === status).length
  const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today)
  const upcomingMilestones = milestones.filter(m => m.status !== 'achieved' && m.targetDate >= today)
  return {
    项目: project.name,
    状态: project.status,
    目标日期: project.targetDate,
    任务总数: tasks.length,
    待办: count('todo'),
    进行中: count('in_progress'),
    已完成: count('done'),
    逾期未完成任务数: overdue.length,
    逾期任务: overdue.map(t => `${t.title}(截止${t.dueDate})`),
    里程碑总数: milestones.length,
    已达成里程碑: milestones.filter(m => m.status === 'achieved').length,
    未达成里程碑: upcomingMilestones.map(m => `${m.title}(${m.targetDate})`),
  }
}

/** 生成 AI 叙述段落（只调一次模型，不落盘）。 */
export async function generateNarrative(
  llm: LlmGateway | undefined,
  brief: Record<string, unknown>,
  route?: { provider: string, model: string },
): Promise<string> {
  return generateDraft(llm, {
    system: NARRATE_SYSTEM_PROMPT,
    user: `以下是本周确定性项目数据，请据此写进度汇报叙述：\n${JSON.stringify(brief, null, 2)}`,
    maxTokens: 900,
    provider: route?.provider,
    model: route?.model,
  })
}

// 草稿缓存：confirm 复用同一次生成，不再调模型（省免费额度）。
const narrativeCache = new Map<string, string>()
export function rememberNarrative(projectId: string, text: string): void { narrativeCache.set(projectId, text) }
export function recallNarrative(projectId: string): string | undefined { return narrativeCache.get(projectId) }
