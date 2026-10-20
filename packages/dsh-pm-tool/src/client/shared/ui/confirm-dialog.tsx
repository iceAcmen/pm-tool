/**
 * S0 危险确认基座（declarative presentational）：居中 440、danger 红边、
 * 「取消」零写（不点确认不产生任何动作）、确认二次显式；ESC/点遮罩等同取消。
 * 现有 imperative `confirmDanger` 阻断流保留在 confirm-dialog.tsx（panel 树内单例宿主），
 * 本组件供并行片需要声明式确认框时复用，不替换既有阻断流。
 */
import type { ReactNode } from 'react'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  /** 对象/影响说明（不可撤销须明示）。 */
  impact?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** neutral=true 时不用 danger 红边（备份/转任务等非破坏确认）。 */
  neutral?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}

export function ConfirmDialog({
  open, title, impact, message, confirmLabel = '确认删除', cancelLabel = '取消',
  neutral = false, busy = false, onConfirm, onCancel, children,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="pm-confirm-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className={`pm-confirm-dialog${neutral ? ' pm-confirm-neutral' : ' pm-confirm-danger'}`}
        role="dialog" aria-modal="true" aria-labelledby="pm-confirm-title">
        <h2 id="pm-confirm-title" className="pm-confirm-title">{title}</h2>
        {children}
        {impact && <p className="pm-confirm-impact">{impact}</p>}
        {message && <p className="pm-confirm-msg">{message}</p>}
        <div className="pm-confirm-actions">
          <button
            type="button"
            className={neutral ? 'pm-button pm-button-primary' : 'pm-button pm-button-danger'}
            disabled={busy}
            aria-busy={busy || undefined}
            onClick={onConfirm}
          >{confirmLabel}</button>
          <button type="button" className="pm-button" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  )
}
