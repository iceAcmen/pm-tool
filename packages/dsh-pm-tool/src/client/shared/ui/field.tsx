/**
 * S0 共享表单基座：Field（标签 + 受控控件 + 就近内联错误）与 FormSection（分区栅格）。
 * 自 panel.tsx 提升，标记与类名与原实现逐字一致，行为零变更。
 * - Field：required 星号、error 时红框（data-invalid）+ role=alert 就近错误；不传 error 渲染与旧版一致。
 * - FormSection：eyebrow 序号 + 标题 + 弱分隔线，组内两列栅格，窄屏塌一列（样式在 panel.css）。
 */
import type { ReactNode } from 'react'

export interface FieldProps {
  label: string
  children: ReactNode
  wide?: boolean
  required?: boolean
  error?: string
  errorId?: string
}

export function Field({ label, children, wide, required, error, errorId }: FieldProps) {
  return <label className="pm-field" data-wide={wide || undefined} data-invalid={error ? true : undefined}>
    <span>
      {label}
      {required && <span className="pm-field-required" aria-hidden="true"> *</span>}
    </span>
    {children}
    {error && <span className="pm-field-error" id={errorId} role="alert">{error}</span>}
  </label>
}

export interface FormSectionProps {
  index: string
  title: string
  children: ReactNode
}

export function FormSection({ index, title, children }: FormSectionProps) {
  return <section className="pm-form-section">
    <div className="pm-form-section-h">
      <span className="pm-form-section-n" aria-hidden="true">{index}</span>
      <span className="pm-form-section-title">{title}</span>
    </div>
    <div className="pm-form-section-grid">{children}</div>
  </section>
}
