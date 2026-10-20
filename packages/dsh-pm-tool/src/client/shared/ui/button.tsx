/**
 * S0 共享按钮合同：基于既有 .pm-button 类，统一 primary / ghost(默认) / danger / sm 变体，
 * 禁用 opacity.45、busy(aria-busy + 提交中文案)。不新增视觉风格，只收敛变体入口。
 * 图标按钮（仅通用动作、须 aria-label）见 IconButton。
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type PmButtonVariant = 'primary' | 'ghost' | 'danger'

export interface PmButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PmButtonVariant
  /** 紧凑尺寸（sm），用于工具条/批量条等次要动作。 */
  size?: 'md' | 'sm'
  /** 提交中：禁用并挂 aria-busy；文案由调用方传入（如「提交中…」）。 */
  busy?: boolean
  children: ReactNode
}

const VARIANT_CLASS: Record<PmButtonVariant, string> = {
  primary: 'pm-button-primary',
  ghost: '',
  danger: 'pm-button-danger',
}

export function PmButton({ variant = 'ghost', size = 'md', busy = false, disabled, className, children, ...rest }: PmButtonProps) {
  const classes = ['pm-button', VARIANT_CLASS[variant], size === 'sm' ? 'pm-button-sm' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <button
      {...rest}
      className={className ? `${classes} ${className}` : classes}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      {children}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 通用动作的可访问名称（必填：图标按钮不单靠图标表达）。 */
  label: string
  children: ReactNode
}

/** 34×34 通用动作图标按钮，必须提供 aria-label（label）。 */
export function IconButton({ label, children, className, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      type={rest.type ?? 'button'}
      aria-label={label}
      className={className ? `pm-icon-button ${className}` : 'pm-icon-button'}
    >
      {children}
    </button>
  )
}
