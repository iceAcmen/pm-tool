/**
 * records 分片（B6）周期预设与描述纯函数（无墙钟、无 DOM、不落盘）。
 *
 * 供汇报「周期选择 → 本地只读预览 → 保存」选择器使用：today 由调用方传入，
 * 不自行取系统时间，保证单测确定性。周一为一周起点。
 */

export interface PeriodPreset {
  key: 'thisWeek' | 'lastWeek' | 'custom'
  label: string
  start: string
  end: string
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

/** ISO 日期 → 周几（0=周日 … 6=周六）。 */
function weekday(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay()
}

/** 本周（周一→周日）与上周预设；custom 由用户手填起止。 */
export function periodPresets(today: string): PeriodPreset[] {
  const dow = weekday(today)
  const mondayOffset = (dow + 6) % 7 // 周日 0 → 回退 6 天到周一
  const thisMonday = addDaysIso(today, -mondayOffset)
  const thisSunday = addDaysIso(thisMonday, 6)
  const lastMonday = addDaysIso(thisMonday, -7)
  const lastSunday = addDaysIso(thisMonday, -1)
  return [
    { key: 'thisWeek', label: '本周', start: thisMonday, end: thisSunday },
    { key: 'lastWeek', label: '上周', start: lastMonday, end: lastSunday },
    { key: 'custom', label: '自定义', start: '', end: '' },
  ]
}

export type PeriodKind = 'w' | 'm' | 'c'

/** 由起止天数推导周期类型（与列表展示同源）：≤10 周报、≤45 月报、其余自定义。 */
export function periodKind(start: string, end: string): PeriodKind {
  const ms = Date.parse(`${end}T00:00:00`) - Date.parse(`${start}T00:00:00`)
  const days = Math.round(ms / 86_400_000)
  if (days <= 10) return 'w'
  if (days <= 45) return 'm'
  return 'c'
}

export const PERIOD_KIND_LABEL: Record<PeriodKind, string> = { w: '周报', m: '月报', c: '自定义' }

/** 校验周期：起止必填、真实日历日、结束不早于开始；返回字段错误（空对象=通过）。 */
export function validatePeriod(start: string, end: string): { periodStart?: string, periodEnd?: string } {
  const errors: { periodStart?: string, periodEnd?: string } = {}
  const s = start.trim()
  const e = end.trim()
  if (!s) errors.periodStart = '请选择周期开始日期'
  else if (!isIsoDate(s)) errors.periodStart = '开始日期须为有效的 YYYY-MM-DD'
  if (!e) errors.periodEnd = '请选择周期结束日期'
  else if (!isIsoDate(e)) errors.periodEnd = '结束日期须为有效的 YYYY-MM-DD'
  if (s && e && isIsoDate(s) && isIsoDate(e) && e < s) {
    errors.periodEnd = '周期结束日期不得早于开始日期'
  }
  return errors
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}
