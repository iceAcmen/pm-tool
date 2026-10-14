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
