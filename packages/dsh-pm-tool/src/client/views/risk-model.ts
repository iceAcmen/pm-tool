/**
 * G-B 风险/问题纯模型（零 I/O、零写）。
 *
 * 口径（与 risk-issues.tsx 原内联一致，行为保持）：
 * - 问题（type=issue）无概率，绝不进概率矩阵；
 * - 严重度 = 概率权重 × 影响权重：≤2 低危（绿）、3~4 中危（琥珀）、≥6 高危（红）；
 * - 概率缺失按最低（low=1）计；影响 critical=4。
 */

export type Severity = 'low' | 'mid' | 'high'

const PROB_W = { low: 1, medium: 2, high: 3 } as const
const IMPACT_W = { low: 1, medium: 2, high: 3, critical: 4 } as const

export interface SeverityInput {
  probability?: 'low' | 'medium' | 'high' | null
  impact: 'low' | 'medium' | 'high' | 'critical'
}

/** 得分 ≤2 低危；3~4 中危；≥6 高危。概率缺失按 low 计。 */
export function severityOf(r: SeverityInput): Severity {
  const p = r.probability ? PROB_W[r.probability] : 1
  const score = p * IMPACT_W[r.impact]
  if (score <= 2) return 'low'
  if (score <= 4) return 'mid'
  return 'high'
}

/** 仅风险进矩阵；问题（issue）被排除，不参与概率×影响分桶。 */
export function isRiskRecord(r: { type: string }): boolean {
  return r.type === 'risk'
}

/** 从全量记录中挑出进入矩阵的风险（问题一律剔除）。 */
export function risksForMatrix<T extends { type: string }>(records: T[]): T[] {
  return records.filter(isRiskRecord)
}
