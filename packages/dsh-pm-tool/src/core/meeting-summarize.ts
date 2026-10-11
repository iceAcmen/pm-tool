/**
 * R15 会议纪要归纳：把粘贴的原始速记交给模型，归纳为
 * { title, summary, topics[], decisions[], actions:[{title,owner,dueDate?}] }，
 * 经防御性解析后映射既有 meeting 草稿；confirm 才建会议并挂行动项。
 *
 * 免费随机模型 JSON 不稳定，故：① 提示要求 ```json 围栏；② 剥围栏后 JSON.parse；
 * ③ 失败/字段缺失时降级（不崩、可退回手工 meeting add）。行动项逐条复用 addMeetingAction。
 */
import { generateDraft, AiDraftError, type LlmGateway } from './ai-client.js'

const SUMMARIZE_SYSTEM_PROMPT = [
  '你是会议秘书，把用户给的原始速记/录音转写归纳为结构化会议纪要。',
  '严格只输出一个 ```json ``` 代码块，结构如下，不要任何额外文字：',
  '{',
  '  "title": "会议标题（一句话）",',
  '  "summary": "整体结论摘要（2~3 句中文）",',
  '  "topics": ["议题1", "议题2"],',
  '  "decisions": ["决议1", "决议2"],',
  '  "actions": [{"title": "行动项标题", "owner": "负责人姓名或空串", "dueDate": "YYYY-MM-DD 或空串"}]',
  '}',
  '要求：topics/decisions/actions 都用数组；没有的项给空数组；dueDate 尽量给具体日期，无法判断给空串。',
].join('\n')

export interface SummarizedAction { title: string, owner: string, dueDate: string | null }
export interface SummarizedMeeting {
  title: string
  summary: string
  topics: string[]
  decisions: string[]
  actions: SummarizedAction[]
}

/** 从模型输出里剥 ```json 围栏并 JSON.parse；容忍围栏外多余文字。 */
function extractJson(raw: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)
  const body = fenced?.[1] ?? raw
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new AiDraftError('BAD_JSON', '模型未返回可用的 JSON 纪要结构。')
  return JSON.parse(body.slice(start, end + 1))
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item ?? '').trim()).filter(Boolean)
}

/** 防御性归一化为 SummarizedMeeting（容错缺失/多余字段）。 */
export function parseSummarizedDraft(raw: string): SummarizedMeeting {
  let data: Record<string, unknown>
  try {
    const parsed = extractJson(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new AiDraftError('BAD_JSON', '模型返回的不是 JSON 对象。')
    }
    data = parsed as Record<string, unknown>
  } catch (error) {
    if (error instanceof AiDraftError) throw error
    throw new AiDraftError('BAD_JSON', '模型返回的 JSON 无法解析。')
  }
  const actionsRaw = Array.isArray(data.actions) ? data.actions : []
  return {
    title: String(data.title ?? '').trim() || '未命名会议',
    summary: String(data.summary ?? '').trim(),
    topics: asStringArray(data.topics),
    decisions: asStringArray(data.decisions),
    actions: actionsRaw
      .map(item => (item && typeof item === 'object' ? item as Record<string, unknown> : {}))
      .map(item => ({
        title: String(item.title ?? '').trim(),
        owner: String(item.owner ?? '').trim(),
        dueDate: String(item.dueDate ?? '').trim() || null,
      }))
      .filter(item => item.title),
  }
}

/** 生成归纳草稿（只调一次模型，返回原始文本，由调用方 parseSummarizedDraft）。 */
export async function summarizeTranscript(llm: LlmGateway | undefined, transcript: string): Promise<string> {
  return generateDraft(llm, {
    system: SUMMARIZE_SYSTEM_PROMPT,
    user: `请归纳以下会议原始速记：\n${transcript}`,
    maxTokens: 1200,
  })
}

// 草稿缓存：confirm 复用同一次解析结果，不再调模型。
const draftCache = new Map<string, SummarizedMeeting>()
export function rememberSummary(key: string, draft: SummarizedMeeting): void { draftCache.set(key, draft) }
export function recallSummary(key: string): SummarizedMeeting | undefined { return draftCache.get(key) }
