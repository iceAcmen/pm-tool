/**
 * S0 错误态基座：发生了什么(what) + 为什么(why) + 怎么修(howToFix)，role=alert；
 * 失败不清旧数据、不卸载调用方表单（保输入由调用方维持），提供重试位。
 * stale（陈旧数据）由调用方另标横幅，本组件只承担一次失败的就近说明。
 */
import type { ReactNode } from 'react'

export interface ErrorBlockProps {
  title?: string
  /** 发生了什么。 */
  what: string
  /** 为什么失败（可空）。 */
  why?: string
  /** 怎么修 / 下一步（可空）。 */
  howToFix?: string
  retryLabel?: string
  onRetry?: () => void
  children?: ReactNode
}

export function ErrorBlock({
  title = '操作未完成', what, why, howToFix, retryLabel = '重试', onRetry, children,
}: ErrorBlockProps) {
  return (
    <div className="pm-error-block" role="alert" aria-live="assertive">
      <h3 className="pm-error-block__title">{title}</h3>
      <p className="pm-error-block__what">{what}</p>
      {why ? <p className="pm-error-block__why">{why}</p> : null}
      {howToFix ? <p className="pm-error-block__fix">{howToFix}</p> : null}
      {children}
      {onRetry ? (
        <div className="pm-error-block__actions">
          <button type="button" className="pm-button pm-button-primary" onClick={onRetry}>{retryLabel}</button>
        </div>
      ) : null}
    </div>
  )
}
