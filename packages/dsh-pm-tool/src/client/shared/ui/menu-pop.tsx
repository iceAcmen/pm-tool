/**
 * S0 弹出菜单基座：白底强边框 12px 阴影；分组标题(pm-menu-caption) / 选中(on) /
 * 分隔线(sep) / 禁用项置灰带说明。窄屏贴左由 CSS 负责。本组件只给结构与语义，
 * 打开/关闭/点外/Esc 行为由调用方（与既有 ProjectSwitcher 同一套键盘可访问逻辑）实现。
 */
import type { ReactNode } from 'react'

export interface MenuPopProps {
  label: string
  children: ReactNode
  className?: string
}

export function MenuPop({ label, children, className }: MenuPopProps) {
  return (
    <div className={`pm-menu-pop${className ? ` ${className}` : ''}`} role="menu" aria-label={label}>
      {children}
    </div>
  )
}

export function MenuGroup({ caption, children }: { caption: string, children: ReactNode }) {
  return (
    <div className="pm-menu-group">
      <div className="pm-menu-caption">{caption}</div>
      {children}
    </div>
  )
}

export interface MenuItemProps {
  children: ReactNode
  /** 当前选中（高亮 + on 标记）。 */
  on?: boolean
  /** 禁用：置灰，可附说明，不触发动作。 */
  disabled?: boolean
  /** 禁用项的屏外/就近说明。 */
  hint?: string
  onSelect?: () => void
}

export function MenuItem({ children, on = false, disabled = false, hint, onSelect }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`pm-menu-item${on ? ' pm-menu-item--on' : ''}${disabled ? ' pm-menu-item--disabled' : ''}`}
      aria-disabled={disabled || undefined}
      aria-current={on || undefined}
      disabled={disabled}
      onClick={disabled ? undefined : onSelect}
    >
      <span className="pm-menu-item__label">{children}</span>
      {hint ? <span className="pm-menu-item__hint">{hint}</span> : null}
    </button>
  )
}

/** 分组间分隔线。 */
export function MenuSeparator() {
  return <div className="pm-menu-divider" aria-hidden="true" />
}
