/**
 * S0 成功回执基座（非假 toast）：绿边绿底，给出「结果」+「下一步」，反馈闭环 did-it-work / what-changed / what-next。
 * 持久结果用回执卡；瞬时自动消失的轻提示仍走既有 toast。
 */
import type { ReactNode } from 'react'

export interface ReceiptProps {
  /** 结果一句话（如「项目已创建」）。 */
  result: string
  /** 变更说明（可空）。 */
  detail?: string
  /** 下一步动作位（可空）。 */
  next?: ReactNode
  children?: ReactNode
}

export function Receipt({ result, detail, next, children }: ReceiptProps) {
  return (
    <div className="pm-receipt" role="status" aria-live="polite">
      <div className="pm-receipt__result">{result}</div>
      {detail ? <p className="pm-receipt__detail">{detail}</p> : null}
      {children}
      {next ? <div className="pm-receipt__next">{next}</div> : null}
    </div>
  )
}
