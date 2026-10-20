/**
 * v0.6 人工反馈回归：UI 反馈纯函数（无 React/无 DOM/无写，可离线单测）。
 *  - formatNoticeLines / extractBackupPath：Notice 多行展示与备份路径抽取
 *  - shouldHandleGlobalKbd：面板全局任务表键盘导航门控（overlay/输入控件/修饰键时让位）
 *  - sampleGanttTicks：甘特时间轴抽样标签（水平间距足够、首 tick 带年份）
 */

/** 把命令返回的多行文本规整为展示行数组：按行拆、trim、丢空串。 */
export function formatNoticeLines(message: string): string[] {
  return message
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

/**
 * 反馈分型（§5/J5）：命令层成功动作用稳定信封把「短摘要」与「完整字段」分开，
 * 客户端只把摘要喂给自动消失的成功提示，完整字段进独立可展开详情卡，绝不进 toast。
 *  - `[pm:summary]` 前缀行：成功短摘要（≤2 行，无 HTML/Markdown/完整实体）。
 *  - `[pm:detail]` 标记行之后：完整字段（详情卡内容，不进提示条）。
 * 无信封的既有命令原样回退（structured=false），不被吞、不改写。
 */
export const PM_SUMMARY_PREFIX = '[pm:summary]'
export const PM_DETAIL_MARKER = '[pm:detail]'
/**
 * 动作行标记：AI 草稿预览等「内容/动作分离」场景，把可触发命令挂在独立动作行，
 * 命令不进保存正文、不与草稿内容混排。格式：`[pm:action]<按钮文案>：<可执行命令>`。
 * 与 success 信封解耦：草稿预览本身持久（不加 [pm:summary]），仅用本标记标注动作。
 */
export const PM_ACTION_MARKER = '[pm:action]'
/** 成功提示自动消失时长（合同 §5：success 3s；错误持久）。 */
export const FEEDBACK_SUCCESS_TTL_MS = 3000

/** 结构化动作（UI 据此渲染独立按钮；命令绝不进保存正文）。 */
export interface FeedbackAction {
  /** 按钮文案（如「确认入库」「确认建会」）。 */
  label: string
  /** 可执行命令串（如 /pm report narrate p-0001 confirm）。 */
  command: string
}

export interface ParsedFeedback {
  /** 是否为命令层结构化信封（否则走原样回退）。 */
  structured: boolean
  /** 成功短摘要行（已去前缀、trim）。 */
  summary: string[]
  /** 完整字段详情（可展开卡）；无则 null。 */
  detail: string | null
  /** 独立动作（确认命令等）；无则 null。原样回退文本也会抽取动作行。 */
  action: FeedbackAction | null
}

/** 解析 `[pm:action]文案：命令` 动作行；格式不符返回 null。 */
export function parseActionLine(line: string): FeedbackAction | null {
  const body = line.slice(PM_ACTION_MARKER.length).trim()
  if (!body) return null
  const sep = /[：:]/.exec(body)
  if (!sep) return null
  const label = body.slice(0, sep.index).trim()
  const command = body.slice(sep.index + 1).trim()
  if (!label || !command) return null
  return { label, command }
}

/** 构造动作行（AI 草稿预览等 content/action 分离场景；命令不进保存正文）。 */
export function buildActionLine(label: string, command: string): string {
  return `${PM_ACTION_MARKER}${label}：${command}`
}

/**
 * 构造成功结构化信封：≤2 行短摘要（类型｜ID｜标题｜变更字段），完整字段进 detail 折叠区。
 * 七类写实体（task/milestone/risk-issue/meeting/report/deliverable/project）统一走本形态。
 */
export function buildSuccessEnvelope(summaryLines: Array<string | null | undefined>, detail?: string | null): string {
  const lines = summaryLines
    .filter((line): line is string => !!line && line.trim().length > 0)
    .map(line => `${PM_SUMMARY_PREFIX}${line.trim()}`)
  if (detail && detail.trim()) {
    lines.push(PM_DETAIL_MARKER, detail.trim())
  }
  return lines.join('\n')
}

export function parseFeedback(text: string): ParsedFeedback {
  const lines = text.split('\n')
  const action = lines
    .map(l => l.trim())
    .filter(l => l.startsWith(PM_ACTION_MARKER))
    .map(parseActionLine)
    .find((a): a is FeedbackAction => !!a) ?? null
  const hasSummary = lines.some(l => l.trimStart().startsWith(PM_SUMMARY_PREFIX))
  if (!hasSummary) {
    // 非结构化回退：动作行单独抽出，不混进展示正文（content/action 分离）。
    const body = lines
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith(PM_ACTION_MARKER))
    return { structured: false, summary: body, detail: null, action }
  }
  const summary: string[] = []
  const detail: string[] = []
  let inDetail = false
  for (const raw of lines) {
    const line = raw.trim()
    if (line === PM_DETAIL_MARKER) { inDetail = true; continue }
    if (inDetail) { detail.push(raw); continue }
    if (line.startsWith(PM_ACTION_MARKER)) continue
    if (line.startsWith(PM_SUMMARY_PREFIX)) {
      const s = line.slice(PM_SUMMARY_PREFIX.length).trim()
      if (s) summary.push(s)
    }
  }
  return { structured: true, summary, detail: detail.join('\n').trim() || null, action }
}

/** 错误判定（集中一处）：命中即持久单处提示，不自动消失。 */
export function feedbackIsError(text: string): boolean {
  return /失败|错误|拒绝|不可用|无法处理|未找到|不支持|不合法|无效|被阻止|缺失/i.test(text)
}

/**
 * O3 写命令是否被接受（决定是否关抽屉）：
 *  - 复用既有 feedbackIsError 集中判定，不另造中文正则；
 *  - 命中错误 → false（调用方保留抽屉、就近展示错误，不 onSaved 关层）；
 *  - 结构化成功信封、无信封的既有成功文本、只读预览（不含错误词）→ true。
 * 只读预览文本（如「只读预览 / 尚未写入」）不含错误词，不得被误判为失败。
 */
export function commandAccepted(response: string): boolean {
  return !feedbackIsError(response)
}

export interface ClassifiedFeedback {
  /** 错误态：持久、单处、role=alert。 */
  isError: boolean
  /** 是否命令层结构化信封（否则原样回退）。 */
  structured: boolean
  /** 成功短摘要行（≤2 行）。 */
  summary: string[]
  /** 完整字段详情（独立展开卡）；无则 null。 */
  detail: string | null
  /** 独立动作（确认命令等）；无则 null。 */
  action: FeedbackAction | null
  /** 成功结构化提示自动消失时长；错误/非结构化返回 null（持久）。 */
  autoDismissMs: number | null
}

/**
 * panel run → Notice 共用的反馈映射（生产唯一实现，测试复用，不复制策略）：
 * 分型 → 错误判定 → TTL。成功结构化提示 3s 自动消失；错误与无信封原样回退均持久。
 */
export function classifyFeedback(message: string): ClassifiedFeedback {
  const parsed = parseFeedback(message)
  const isError = feedbackIsError(message)
  return {
    isError,
    structured: parsed.structured,
    summary: parsed.summary,
    detail: parsed.detail,
    action: parsed.action,
    autoDismissMs: !isError && parsed.structured ? FEEDBACK_SUCCESS_TTL_MS : null,
  }
}

/**
 * 解析 `model status` 输出里的「当前模型车道」。
 * 只认两种信号：① 带 ▶ 标记的当前车道行（▶ [poc]/▶ [prod]）；② 首行「当前车道：PoC/生产」。
 * 绝不靠 contains('[prod]')——status 会把两条车道都列出来，均含 [poc]/[prod]。
 */
export function parseActiveModelLane(statusText: string): 'poc' | 'prod' | null {
  const lines = statusText.split('\n')
  const arrowLine = lines.find(line => line.includes('▶'))
  if (arrowLine) {
    if (/\[prod\]/.test(arrowLine)) return 'prod'
    if (/\[poc\]/.test(arrowLine)) return 'poc'
  }
  const first = lines[0] ?? ''
  if (/当前车道[：:]/.test(first)) {
    if (/poc/i.test(first)) return 'poc'
    if (/生产|prod/i.test(first)) return 'prod'
  }
  return null
}

/**
 * 键盘行导航纯函数：给定「可见行 id 序列」与当前行 id，按 delta（+1/-1）移动并钳到边界。
 * 鼠标点击/聚焦任意行时把 activeId 直接设为该行 id；j/k 再相对它移动。
 * 返回新的 activeId（空序列→null）。
 */
export function nextRowId(visibleIds: string[], currentId: string | null, delta: number): string | null {
  if (visibleIds.length === 0) return null
  const cur = currentId && visibleIds.includes(currentId) ? visibleIds.indexOf(currentId) : -1
  const base = cur < 0 ? 0 : cur
  const next = Math.max(0, Math.min(visibleIds.length - 1, base + delta))
  return visibleIds[next]
}

/** 从多行通知里抽出备份文件路径（识别「文件：…」行）；无则返回 null。 */
export function extractBackupPath(message: string): string | null {
  for (const raw of message.split('\n')) {
    const line = raw.trim()
    const match = /^(?:文件[:：]|备份已生成[:：]\s*文件[:：])?\s*(.+pmtool-backup-[^\s]+\.json)\s*$/i.exec(line)
    if (match) return match[1]
  }
  return null
}

/** 全局键盘导航门控输入最小形状。 */
export interface KbdGateInput {
  key: string
  targetTag?: string
  targetEditable?: boolean
  ctrl?: boolean
  meta?: boolean
  alt?: boolean
  /** 任一浮层打开：抽屉 / 移动弹窗 / 副驾 / 总览看板。 */
  overlayOpen?: boolean
}

/**
 * 决定是否让「任务表全局键盘导航（j/k/Space/Enter/Delete）」生效。
 * 规则：修饰键、焦点在输入类控件、或任一浮层打开时一律让位；其余放行（再交给 panel-kbd 判定具体键）。
 */
export function shouldHandleGlobalKbd(e: KbdGateInput): boolean {
  if (e.ctrl || e.meta || e.alt) return false
  if (e.overlayOpen) return false
  const tag = (e.targetTag ?? '').toUpperCase()
  // 输入类控件、链接/按钮（Tab 聚焦后 Space/Enter 应触发其原生行为，而非全局勾选/打开当前行）一律让位。
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A' || e.targetEditable) return false
  return true
}

/** 单个甘特轴标签。 */
export interface GanttTick {
  /** 距轴起点的天数（用于 left = leftDays * pxPerDay）。 */
  leftDays: number
  /** 展示文本（MM-DD；首个或年初带年份）。 */
  label: string
  date: string
}

const DAY_MS = 86_400_000
function parseDay(iso: string): number { return Date.parse(iso) }

/**
 * 抽样甘特日期轴标签：保证相邻标签水平间距足够（默认 46px），不重叠。
 * 首 tick 带年份（YYYY-MM-DD）；其余 MM-DD。start 之前/当日为第 0 天。
 */
export function sampleGanttTicks(start: string, end: string, pxPerDay: number, minStepPx = 46): GanttTick[] {
  const totalDays = Math.max(0, Math.round((parseDay(end) - parseDay(start)) / DAY_MS))
  const pxD = Math.max(1, pxPerDay)
  // 短标签（MM-DD ≈ 34px）与长标签（YYYY-MM-DD ≈ 66px）宽度不同：
  // 上一个 tick 是长标签时，到下一个 tick 的间隔要按长标签宽度预留，避免首/跨年 tick 重叠。
  const shortStep = Math.max(1, Math.ceil(minStepPx / pxD))
  const longStep = Math.max(shortStep, Math.ceil(68 / pxD))
  const ticks: GanttTick[] = []
  let d = 0
  while (d <= totalDays) {
    const date = new Date(parseDay(start) + d * DAY_MS).toISOString().slice(0, 10)
    const isFirst = ticks.length === 0
    const isYear = isFirst || date.endsWith('-01-01')
    ticks.push({ leftDays: d, label: isYear ? date : date.slice(5), date })
    d += isYear ? longStep : shortStep
  }
  return ticks
}
