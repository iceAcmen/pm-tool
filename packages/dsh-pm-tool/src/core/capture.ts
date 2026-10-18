/**
 * P0 K4 对话补档 / K3 证据闭环：capture 纯逻辑（零网络、零随机、零墙钟，离线可测）。
 *
 * 职责边界（对应 docs/design/deep-integration-v2-p0-dev.md §三 K4/K3）：
 * - 构造发给模型的观察模式提示词；
 * - 防御性解析模型返回的草稿 JSON（剥 ```json 围栏、容忍围栏外文字）；
 * - 校验草稿候选：title 非空、dueDate 为合法 YYYY-MM-DD、evidence 为合法 http(s) URL 数组、
 *   字段走白名单（拒绝 title/status/priority/progress 等状态/排期类越权字段）。
 *
 * 本模块不碰 domain、不写库、不调模型；落库由 commands/capture.ts 经 addTask/updateTask 完成。
 * capture 是「整理成草稿 → 人确认（capture-apply）→ 落库」，模型绝不直接建任务。
 */

/** 一个待办候选（capture 草稿条目）。evidence 为候选自带的佐证链接列表，单条取第一个挂 evidenceUrl。 */
export interface CaptureCandidate {
  title: string
  dueDate?: string
  assignee?: string
  description?: string
  evidence?: string[]
}

/** capture 观察模式草稿（模型输出经防御性归一化后的形态）。 */
export interface CaptureDraft {
  candidates: CaptureCandidate[]
  note?: string
}

/** capture-apply 只接受候选白名单内字段；status/priority/progress/parentId/milestoneId 等一律拒绝。 */
const CANDIDATE_FIELDS = new Set(['title', 'dueDate', 'assignee', 'description', 'evidence'])

/** 草稿顶层允许出现的键（candidates 必需；note 为观察提示，不参与落库）。 */
const DRAFT_FIELDS = new Set(['candidates', 'note', 'evidenceCandidates'])

export class CaptureDraftParseError extends Error {}

// ---- 日期 / URL 形状谓词（离线，不联网探测）----

/**
 * 合法 YYYY-MM-DD：格式 + 真实日历日期（拒绝 2026-02-30、2026-13-01 等）。
 * 与 task.ts 的 z.iso.date 口径一致，但纯函数实现，便于离线单测。
 */
export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return false
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const dt = new Date(Date.UTC(year, month - 1, day))
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day
}

/** 合法 http/https 链接（trim、上限 2048，与 task.evidenceUrl 长度口径一致）；不做可达性探测。 */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2048) return false
  try {
    const u = new URL(trimmed)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// ---- 模型输出解析（剥围栏、取首个 JSON 对象/数组）----

/** 从模型原始文本中抽取首个 JSON 对象或数组；容忍 ```json 围栏与前后多余文字。 */
export function extractJsonBlock(raw: string): unknown {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new CaptureDraftParseError('模型未返回正文。')
  }
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)
  const body = fenced?.[1] ?? raw
  const startObj = body.indexOf('{')
  const startArr = body.indexOf('[')
  let start = -1
  let open = '{'
  if (startObj === -1) {
    start = startArr
    open = '['
  } else if (startArr === -1) {
    start = startObj
  } else {
    start = Math.min(startObj, startArr)
    open = startObj <= startArr ? '{' : '['
  }
  const close = open === '{' ? body.lastIndexOf('}') : body.lastIndexOf(']')
  if (start === -1 || close === -1 || close <= start) {
    throw new CaptureDraftParseError('模型未返回可用的 JSON 草稿结构。')
  }
  try {
    return JSON.parse(body.slice(start, close + 1))
  } catch {
    throw new CaptureDraftParseError('模型返回的 JSON 无法解析，请检查草稿格式。')
  }
}

/** 把解析结果防御性归一化为 CaptureDraft：缺 candidates 视为空数组，字符串 trim，证据逐项清洗。 */
export function normalizeCaptureDraft(parsed: unknown): CaptureDraft {
  if (Array.isArray(parsed)) {
    return { candidates: normalizeCandidateList(parsed) }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new CaptureDraftParseError('草稿须为包含 candidates 数组的 JSON 对象。')
  }
  const obj = parsed as Record<string, unknown>
  const rawList = Array.isArray(obj.candidates) ? obj.candidates : []
  return {
    candidates: normalizeCandidateList(rawList),
    note: typeof obj.note === 'string' ? obj.note.trim() : undefined,
  }
}

function normalizeCandidateList(list: unknown[]): CaptureCandidate[] {
  const out: CaptureCandidate[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const candidate: CaptureCandidate = {
      title: String(rec.title ?? '').trim(),
    }
    if (typeof rec.dueDate === 'string' && rec.dueDate.trim()) candidate.dueDate = rec.dueDate.trim()
    if (typeof rec.assignee === 'string' && rec.assignee.trim()) candidate.assignee = rec.assignee.trim()
    if (typeof rec.description === 'string' && rec.description.trim()) candidate.description = rec.description.trim()
    if (Array.isArray(rec.evidence)) {
      const urls = rec.evidence
        .map(u => String(u ?? '').trim())
        .filter(Boolean)
      if (urls.length) candidate.evidence = urls
    }
    out.push(candidate)
  }
  return out
}

// ---- apply 前的严格校验（全部通过才允许落库；任一问题即整批拒绝，零写入）----

export interface CaptureValidationResult {
  /** 通过校验的干净候选（按输入顺序）。 */
  accepted: CaptureCandidate[]
  /** 全部问题（中文，带序号，供命令层整批报错展示）。 */
  errors: string[]
}

/** 校验单个候选；返回干净候选与问题清单（问题非空时 candidate 不可用于落库）。 */
export function validateCaptureCandidate(raw: unknown, index: number): { candidate: CaptureCandidate | null, errors: string[] } {
  const errors: string[] = []
  const label = `第 ${index + 1} 条候选`
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { candidate: null, errors: [`${label}：须为对象`] }
  }
  const rec = raw as Record<string, unknown>

  const unknownKeys = Object.keys(rec).filter(k => !CANDIDATE_FIELDS.has(k))
  if (unknownKeys.length) {
    errors.push(`${label}：包含不支持的字段 ${unknownKeys.join('、')}（capture 草稿只允许 title/dueDate/assignee/description/evidence）`)
  }

  const title = typeof rec.title === 'string' ? rec.title.trim() : ''
  if (!title) errors.push(`${label}：标题（title）不能为空`)

  let dueDate: string | undefined
  if (rec.dueDate !== undefined && rec.dueDate !== null && rec.dueDate !== '') {
    if (!isValidIsoDate(rec.dueDate)) {
      errors.push(`${label}：截止日期 dueDate 须为合法 YYYY-MM-DD（收到 ${String(rec.dueDate)}）`)
    } else {
      dueDate = rec.dueDate
    }
  }

  let assignee: string | undefined
  if (typeof rec.assignee === 'string' && rec.assignee.trim()) assignee = rec.assignee.trim()

  let description: string | undefined
  if (typeof rec.description === 'string' && rec.description.trim()) description = rec.description.trim()

  let evidence: string[] | undefined
  if (rec.evidence !== undefined) {
    if (!Array.isArray(rec.evidence)) {
      errors.push(`${label}：evidence 须为 URL 数组`)
    } else {
      const urls: string[] = []
      rec.evidence.forEach((u, ei) => {
        if (!isHttpUrl(u)) {
          errors.push(`${label}：第 ${ei + 1} 条证据不是合法 http/https 链接（${String(u)}）`)
        } else {
          urls.push((u as string).trim())
        }
      })
      if (urls.length) evidence = urls
    }
  }

  if (errors.length) return { candidate: null, errors }
  const candidate: CaptureCandidate = { title }
  if (dueDate) candidate.dueDate = dueDate
  if (assignee) candidate.assignee = assignee
  if (description) candidate.description = description
  if (evidence) candidate.evidence = evidence
  return { candidate, errors: [] }
}

/**
 * 校验整份 apply 草稿：顶层须为含 candidates 数组的对象；逐条校验。
 * 返回全部通过的干净候选与全部问题；命令层在 errors 非空时整批拒绝（不落库）。
 */
export function validateCaptureDraft(parsed: unknown): CaptureValidationResult {
  const errors: string[] = []
  if (Array.isArray(parsed)) {
    // 容忍顶层直接给数组：按 candidates 逐条校验。
    const accepted: CaptureCandidate[] = []
    parsed.forEach((item, i) => {
      const { candidate, errors: itemErrors } = validateCaptureCandidate(item, i)
      errors.push(...itemErrors)
      if (candidate) accepted.push(candidate)
    })
    return { accepted, errors }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { accepted: [], errors: ['草稿须为包含 candidates 数组的 JSON 对象'] }
  }
  const obj = parsed as Record<string, unknown>
  const unknownTop = Object.keys(obj).filter(k => !DRAFT_FIELDS.has(k))
  if (unknownTop.length) {
    errors.push(`草稿顶层包含不支持的字段 ${unknownTop.join('、')}（只允许 candidates/note）`)
  }
  if (!Array.isArray(obj.candidates)) {
    return { accepted: [], errors: ['草稿须包含 candidates 数组'] }
  }
  const accepted: CaptureCandidate[] = []
  obj.candidates.forEach((item, i) => {
    const { candidate, errors: itemErrors } = validateCaptureCandidate(item, i)
    errors.push(...itemErrors)
    if (candidate) accepted.push(candidate)
  })
  return { accepted, errors }
}

// ---- 观察模式提示词（只整理草稿，绝不要求模型写库）----

export const CAPTURE_SYSTEM_PROMPT = [
  '你是项目经理的对话补档助手：把用户粘贴的一段工作对话/聊天记录整理成「待办候选」草稿。',
  '严格要求：',
  '1. 只输出一个 ```json ``` 代码块，结构如下，不要任何额外解释文字：',
  '{',
  '  "candidates": [',
  '    {"title": "简短动宾短语的待办标题", "dueDate": "YYYY-MM-DD 或省略", "assignee": "负责人姓名或省略", "description": "一句话背景或省略", "evidence": ["https://..."]}',
  '  ],',
  '  "note": "观察模式：仅展示未落库；确认后经 /pm capture-apply 落库"',
  '}',
  '2. 只提炼对话里明确出现的待办/承诺/跟进项；推断不出的日期、负责人一律省略，绝不编造。',
  '3. 标题用简短中文动宾短语，不要带状态、优先级、进度或编号；不要生成 status/priority/progress 等字段。',
  '4. evidence 只收录对话里明确出现的 http/https 链接；没有就省略该键。',
  '5. 对话里没有待办时，candidates 给空数组。',
].join('\n')

/** 构造观察模式 user 消息（项目快照只给项目名，不灌任务明细，避免模型替人拍板排期）。 */
export function buildCaptureUserPrompt(projectName: string, dialogue: string, today: string): string {
  return [
    `【项目】${projectName}`,
    `【今天】${today}`,
    '',
    '【待整理对话原文】',
    dialogue.trim(),
    '',
    '请把其中明确的待办/承诺/跟进项整理成上述 JSON 草稿（仅草稿，不要写库）。',
  ].join('\n')
}
