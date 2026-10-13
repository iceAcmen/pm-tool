/**
 * PROD-23 项目健康分：纯离线派生，不落盘、不写库、不带随机。
 * 计分规则在 zod-free 的 derived.ts，供服务端与浏览器面板共用。
 */
import type { PmDomain } from './storage.js'
import { collectStats, type ProjectStats } from './stats.js'
import {
  scoreFromInputs,
  type HealthLamp,
  type HealthFactor,
  type HealthInputs,
} from './derived.js'

export type { HealthLamp, HealthFactor, HealthInputs }
export { scoreFromInputs }

export interface ProjectHealth {
  projectId: string
  lamp: HealthLamp
  /** 0–100；任务数为 0 时为 null（灰灯、数据不足）。 */
  score: number | null
  factors: HealthFactor[]
  /** 固定免责声明。 */
  note: string
}

export const HEALTH_NOTE = '健康参考分（自动计算，仅供排期参考，不做绩效评价）'

export function healthFromStats(ps: ProjectStats): ProjectHealth {
  const { lamp, score, factors } = scoreFromInputs({
    taskTotal: ps.taskTotal,
    overdueTasks: ps.overdueTasks,
    taskBlocked: ps.taskBlocked,
    openHighRisk: ps.openRiskByImpact.high,
    openCriticalRisk: ps.openRiskByImpact.critical,
    milestoneOverdue: ps.milestoneOverdue,
  })
  return { projectId: ps.projectId, lamp, score, factors, note: HEALTH_NOTE }
}

/** 聚合某项目健康分；today 注入保证确定性。 */
export function computeProjectHealth(
  domain: PmDomain,
  projectId: string,
  today?: string,
): ProjectHealth {
  const stats = collectStats(domain, projectId, today)
  const ps = stats.projects.find(item => item.projectId === projectId)
  if (!ps) {
    return { projectId, lamp: 'gray', score: null, factors: [], note: HEALTH_NOTE }
  }
  return healthFromStats(ps)
}
