/**
 * §1 PageShell 统一壳（A 组主导，全部视图同口径）：
 * - 单层左右内边距 --pm-shell-pad-x（≥768=22px，<768=14px，容器查询切换），
 *   禁止各视图自加 padding 找齐（旧 okrs/habits `4px 2px 24px`、各页自定 padding 作废）。
 * - 页题 16px/700、副标题 12.5px、页头→内容 gap 16px（窄 12px）。
 * - empty 槽三态分开：真空/过滤无结果/能力待接入由调用方传入，壳不伪造零。
 */
import type { ReactNode } from 'react'

export interface PageShellProps {
  /** bare=true 时仅提供单层 padding，不渲染页头（视图自带标题/B 组视图沿用自有页头）。 */
  bare?: boolean
  title?: ReactNode
  subtitle?: ReactNode
  /** 页头右侧操作组（主 CTA 外露；视图/密度进溢出菜单）。 */
  actions?: ReactNode
  /** 空态槽：传入时替换 body（真空/过滤/待接入各自的诚实空态卡）。 */
  empty?: ReactNode
  children?: ReactNode
  /** 追加根类（视图自有区块样式挂接，不改壳 padding）。 */
  className?: string
}

export function PageShell({ bare = false, title, subtitle, actions, empty, children, className }: PageShellProps) {
  if (bare) {
    // 纯 padding 壳：统一单层 --pm-shell-pad-x，避免视图自叠 padding；不造页头。
    return <div className={`pm-page pm-page--bare${className ? ` ${className}` : ''}`}>{children}</div>
  }
  return (
    <div className={`pm-page${className ? ` ${className}` : ''}`}>
      <header className="pm-page__head">
        <div className="pm-page__titles">
          <h1 className="pm-page__title">{title}</h1>
          {subtitle != null && subtitle !== '' ? <p className="pm-page__sub">{subtitle}</p> : null}
        </div>
        {actions ? <div className="pm-page__actions">{actions}</div> : null}
      </header>
      {empty != null
        ? <div className="pm-page__empty">{empty}</div>
        : <div className="pm-page__body">{children}</div>}
    </div>
  )
}
