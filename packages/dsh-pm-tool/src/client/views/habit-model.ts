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
