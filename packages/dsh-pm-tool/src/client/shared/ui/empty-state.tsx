/**
 * S0 空态基座（诚实空，不把缺失当 0）：
 * - vacuum    真空：该实体还没有任何记录（虚线卡 + 「空是什么」+ 下一步主 CTA）。
 * - noResult  无结果：筛选/搜索无匹配，说明 + 清除条件入口（搜索不改 scope）。
 * - blocked   待接入/无权限：说明为何受限、哪里申请，置灰不报错，不弹假 toast。
 * 壳不伪造零；变体仅决定语气与辅助位，标题/说明/CTA 由调用方给。
 */
import type { ReactNode } from 'react'

export type EmptyVariant = 'vacuum' | 'noResult' | 'blocked'

export interface EmptyStateProps {
  variant?: EmptyVariant
  title: string
  description?: string
  /** 下一步主 CTA（vacuum/noResult 可用；blocked 一般给「了解/申请」次按钮）。 */
  action?: ReactNode
  /** noResult 的「清除条件」入口。 */
  onClear?: () => void
  children?: ReactNode
}

export function EmptyState({ variant = 'vacuum', title, description, action, onClear, children }: EmptyStateProps) {
  return (
    <div className={`pm-empty-card pm-empty-card--${variant}`} data-variant={variant}>
      <h3 className="pm-empty-card__title">{title}</h3>
      {description ? <p className="pm-empty-card__desc">{description}</p> : null}
      {children}
      <div className="pm-empty-card__actions">
        {variant === 'noResult' && onClear ? (
          <button type="button" className="pm-button" onClick={onClear}>清除筛选条件</button>
        ) : null}
        {action}
      </div>
    </div>
  )
}
