/**
 * P3 X7 习惯层 · 前端只读展示纯模型（零 I/O、零写、零墙钟、零裁决）。
 *
 * - streak 为纯数字档案，前端不重算连续段、不给积分/徽章/动效；
 * - okrId 仅做标题解析（由面板注入 OKR 清单），存在性/合法性由后端校验，前端不参与裁决；
 * - 本模块不读盘不写盘，快照数据由 panel 注入。
 */

/** 与 core/storage.ts habitRecordSchema.streak 对齐；纯数字档案，前端不重算连续段。 */
export interface HabitStreak {
  current: number
  lastDate?: string
  longest: number
  totalDays: number
}

/** 可选 OKR 最小清单（标题解析用，只读）。 */
export interface HabitOkrRef {
  id: string
  title: string
}

export type HabitStatus = 'draft' | 'confirmed' | 'final'

/** 状态徽章文案：draft=草稿（建议/录入），confirmed=已确认（人轻确认），final=已定稿（人定稿）；前端不定稿。 */
export function habitStatusLabel(status: HabitStatus): string {
  if (status === 'final') return '已定稿'
  if (status === 'confirmed') return '已确认'
  return '草稿'
}

/** streak 纯文本档案：「当前连续 N 天 · 历史最长 M 天 · 累计 X 天」，无徽章、无动效。 */
export function streakArchiveText(streak: HabitStreak): string {
  return `当前连续 ${streak.current} 天 · 历史最长 ${streak.longest} 天 · 累计 ${streak.totalDays} 天`
}

/**
 * 关联 OKR 标题解析：命中注入清单返回标题；缺失时回退原始 okrId（如实展示，不伪造、不裁决）。
 * 无 okrId 返回 undefined（调用方整行省略）。
 */
export function resolveHabitOkrTitle(okrId: string | undefined, refs: HabitOkrRef[] | undefined): string | undefined {
  if (!okrId) return undefined
  const hit = (refs ?? []).find(r => r.id === okrId)
  return hit ? hit.title : okrId
}

/** 收件区待确认数：仅 status==='pending' 计入；confirmed/ignored 均不计；undefined 返回 0。 */
export function countPendingHabitInbox(
  inbox: { projectId: string; status?: string }[] | undefined,
  projectId: string,
): number {
  if (!inbox) return 0
  return inbox.filter(s => s.projectId === projectId && s.status === 'pending').length
}

// ===== D-13 长日志：近期 14 天展开、更早按月折叠；旧重复记录展示层去重（不删用户数据、不写库） =====

/** 打卡条目前端镜像（与 core/storage checkIns 对齐，纯展示用）。 */
export interface HabitCheckInEntry {
  at: string
  backfilled: boolean
  note?: string
}

/** 月份折叠组（默认折叠，由视图层本地状态控制展开）。 */
export interface HabitCheckInMonth {
  key: string
  label: string
  entries: HabitCheckInEntry[]
}

/** 近期窗口：今天及过去 13 天（共 14 天）展开，更早按自然月折叠。 */
export const HABIT_RECENT_DAYS = 14

/** YYYY-MM-DD 平移 n 天（UTC 纯日期算术，不读本地时区墙钟）。 */
function shiftIsoDay(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + delta))
  return dt.toISOString().slice(0, 10)
}

/**
 * 展示层同日去重：旧版本可能留下同日两条（补记重复），此处只在渲染时折叠为一条，
 * 优先保留带备注者；不改写存储、不批量删除任何历史记录。返回按日期倒序。
 */
export function dedupeCheckIns(list: HabitCheckInEntry[]): HabitCheckInEntry[] {
  const byDate = new Map<string, HabitCheckInEntry>()
  for (const entry of list) {
    const prev = byDate.get(entry.at)
    if (!prev || (!prev.note && entry.note)) byDate.set(entry.at, entry)
  }
  return [...byDate.values()].sort((a, b) => b.at.localeCompare(a.at))
}

/**
 * 长日志分组：窗口内（今天往前 13 天，含今天）进 recent 平铺展开；
 * 更早按 YYYY-MM 自然月归组（倒序），默认折叠，补记标记/备注原样保留。
 */
export function groupCheckInsByRecency(
  list: HabitCheckInEntry[] | undefined,
  todayIso: string,
): { recent: HabitCheckInEntry[]; months: HabitCheckInMonth[] } {
  const deduped = dedupeCheckIns(list ?? [])
  const windowStart = shiftIsoDay(todayIso, -(HABIT_RECENT_DAYS - 1))
  const recent: HabitCheckInEntry[] = []
  const monthMap = new Map<string, HabitCheckInEntry[]>()
  for (const entry of deduped) {
    if (entry.at >= windowStart && entry.at <= todayIso) {
      recent.push(entry)
      continue
    }
    const key = entry.at.slice(0, 7)
    const bucket = monthMap.get(key) ?? []
    bucket.push(entry)
    monthMap.set(key, bucket)
  }
  const months: HabitCheckInMonth[] = [...monthMap.entries()]
    .map(([key, entries]) => ({
      key,
      label: `${key.slice(0, 4)} 年 ${Number(key.slice(5, 7))} 月`,
      entries: entries.slice().sort((a, b) => b.at.localeCompare(a.at)),
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
  return { recent, months }
}
