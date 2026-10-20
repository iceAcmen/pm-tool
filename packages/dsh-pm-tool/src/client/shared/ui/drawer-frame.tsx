/**
 * S0 抽屉基座（presentational 合同）：header(标题 + 关闭) / body(可滚动) / footer(固定，取消居左·主操作居右)。
 * 现有 DrawerPanel 的焦点陷阱 / ESC / 滚动恢复 / 焦点归还逻辑保留在 panel.tsx，不在此重写；
 * 本组件只提供未来抽屉复用的结构槽位与约定，供并行片以同一骨架组装。
 */
import type { ReactNode } from 'react'
import { IconButton } from './button.js'

export interface DrawerFrameProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** 固定 footer 操作组（取消 / 危险删除 / 主操作）。 */
  footer?: ReactNode
  /** aria-label 透传（默认用 title）。 */
  ariaLabel?: string
}

export function DrawerFrame({ title, onClose, children, footer, ariaLabel }: DrawerFrameProps) {
  return (
    <aside className="pm-drawer" role="dialog" aria-modal="true" aria-label={ariaLabel ?? title}>
      <header>
        <div><span>项目记录</span><h2>{title}</h2></div>
        <IconButton label="关闭抽屉" onClick={onClose}>
          <span aria-hidden="true">✕</span>
        </IconButton>
      </header>
      <div className="pm-drawer-body">{children}</div>
      {footer ? <div className="pm-drawer-actions">{footer}</div> : null}
    </aside>
  )
}
