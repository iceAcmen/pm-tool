/**
 * G-B 排期协作展示层纯映射（零 I/O、零写）。
 *
 * 把业务状态枚举映射为 { label, tone }，供视图渲染 chip/图例/行状态使用；
 * 视图不内联散落文案与色调，保证跨页语义一致（同状态=同文案+同色调）。
 * 本模块不做计算、不派生数字，只做展示层合同。
 */

export type Tone = 'done' | 'prog' | 'block' | 'late' | 'idle'

export interface StatePresenter {
  label: string
  tone: Tone
}

/** 里程碑四态：计划中 / 有风险 / 已达成 / 已延期。 */
export const MILESTONE_STATE: Record<string, StatePresenter> = {
  planned: { label: '计划中', tone: 'prog' },
  at_risk: { label: '有风险', tone: 'block' },
  achieved: { label: '已达成', tone: 'done' },
  missed: { label: '已延期', tone: 'late' },
}

/** 风险严重度三档：低 / 中 / 高。 */
export const RISK_SEVERITY: Record<'low' | 'mid' | 'high', StatePresenter> = {
  low: { label: '低', tone: 'done' },
  mid: { label: '中', tone: 'block' },
  high: { label: '高', tone: 'late' },
}

/** 甘特粒度：日 / 周 / 月。 */
export const GANTT_GRANULARITY: Record<'day' | 'week' | 'month', string> = {
  day: '日',
  week: '周',
  month: '月',
}

export function milestonePresenter(status: string): StatePresenter {
  return MILESTONE_STATE[status] ?? { label: status, tone: 'idle' }
}

export function riskSeverityPresenter(sev: 'low' | 'mid' | 'high'): StatePresenter {
  return RISK_SEVERITY[sev]
}
