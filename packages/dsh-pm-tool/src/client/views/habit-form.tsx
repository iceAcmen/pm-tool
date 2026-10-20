/**
 * B7 习惯受控表单组件（独立，供 panel 抽屉导入；不重造域、不发命令）。
 *
 * 边界：
 * - 本地草稿 + 复用 ../form-validation.js 的 validateHabitForm 做长度/格式校验；
 *   通过 onSubmit(values) 交回 panel，由 panel 走既有 `habit add|update` 通道。
 * - 组件不调用 run()、不直接写 store；status/checkIns/streak 由确认/打卡通道管理，不进表单。
 * - 取消仅关闭；busy 禁用提交不清空；错误就近展示。
 */
import { useState } from 'react'
import css from './growth-form.css?raw'
import { RecordsListbox } from './records/records-listbox.js'
import {
  validateHabitForm,
  type HabitFormValues,
  type FormFieldErrors,
} from '../form-validation.js'
import type { HabitFormComponentProps } from './growth-form-props.js'

export function HabitForm({
  initial, okrOptions, busy, disabled, errors: externalErrors, onSubmit, onCancel,
}: HabitFormComponentProps) {
  const [draft, setDraft] = useState<HabitFormValues>({ ...initial })
  const [touched, setTouched] = useState(false)

  const set = <K extends keyof HabitFormValues>(key: K, value: HabitFormValues[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }))

  const localErrors = validateHabitForm(draft)
  const errors: FormFieldErrors = { ...localErrors, ...(externalErrors ?? {}) }
  const invalid = touched && Object.keys(errors).length > 0

  const submit = () => {
    setTouched(true)
    if (Object.keys(validateHabitForm(draft)).length > 0) return
    void onSubmit(draft)
  }

  return (
    <div className="gf-root">
      <style>{css}</style>

      <div className="gf-field" data-invalid={!!errors.title}>
        <label className="gf-label" htmlFor="gf-habit-title">习惯名称 <span className="gf-required">*</span></label>
        <input id="gf-habit-title" className="gf-input" value={draft.title} disabled={disabled}
          onChange={e => set('title', e.target.value)} placeholder="如：每日晨跑 5km" />
        {errors.title && <span className="gf-error" role="alert">{errors.title}</span>}
      </div>

      <div className="gf-row">
        <div className="gf-field" data-invalid={!!errors.goal}>
          <label className="gf-label" htmlFor="gf-habit-goal">目标 / 期望结果（≤200 字）</label>
          <textarea id="gf-habit-goal" className="gf-textarea" rows={3} value={draft.goal ?? ''} disabled={disabled}
            onChange={e => set('goal', e.target.value)} placeholder="选填" />
          {errors.goal && <span className="gf-error" role="alert">{errors.goal}</span>}
        </div>
        <div className="gf-field" data-invalid={!!errors.frequency}>
          <label className="gf-label" htmlFor="gf-habit-freq">频率（≤40 字）</label>
          <input id="gf-habit-freq" className="gf-input" value={draft.frequency ?? ''} disabled={disabled}
            onChange={e => set('frequency', e.target.value)} placeholder="如：每天 / 工作日" />
          {errors.frequency && <span className="gf-error" role="alert">{errors.frequency}</span>}
        </div>
      </div>

      <div className="gf-field" data-invalid={!!errors.okrId}>
        <label className="gf-label" id="gf-habit-okr-label">关联 OKR（选填，仅展示不参与裁决）</label>
        {okrOptions && okrOptions.length > 0 ? (
          <RecordsListbox id="gf-habit-okr" ariaLabel="关联 OKR" searchable
            value={draft.okrId || null} options={okrOptions} disabled={disabled}
            placeholder="（不关联）"
            onChange={v => set('okrId', v)} />
        ) : (
          <input id="gf-habit-okr" className="gf-input" value={draft.okrId ?? ''} disabled={disabled}
            onChange={e => set('okrId', e.target.value)} placeholder="OKR ID；存在性由后端校验" />
        )}
        {errors.okrId && <span className="gf-error" role="alert">{errors.okrId}</span>}
      </div>

      <div className="gf-field" data-invalid={!!errors.notes}>
        <label className="gf-label" htmlFor="gf-habit-notes">备注（≤500 字）</label>
        <textarea id="gf-habit-notes" className="gf-textarea" value={draft.notes ?? ''} disabled={disabled}
          onChange={e => set('notes', e.target.value)} placeholder="选填" />
        {errors.notes && <span className="gf-error" role="alert">{errors.notes}</span>}
      </div>

      <div className="gf-actions">
        <button type="button" className="gf-btn" onClick={onCancel} disabled={busy}>取消</button>
        <button type="button" className="gf-btn gf-btn--primary" onClick={submit} disabled={busy || disabled || invalid}>
          {busy ? '保存中…' : '保存'}
        </button>
      </div>
      <span className="gf-hint">状态（草稿/已确认/定稿）与打卡连续段由确认/打卡通道管理，不在此表单设置。</span>
    </div>
  )
}
