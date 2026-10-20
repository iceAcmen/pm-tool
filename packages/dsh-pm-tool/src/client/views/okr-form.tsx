/**
 * B7 OKR 受控表单组件（独立，供 panel 抽屉导入；不重造域、不发命令）。
 *
 * 边界：
 * - 组件只维护本地草稿 + 复用 ../form-validation.js 的 validateOkrForm 做字段校验；
 *   通过 onSubmit(values) 把值交回 panel，由 panel 走既有 `okr add|update` 通道。
 * - 组件内部不调用 run()、不直接写 store；AI copilot 白名单不含 okr 写，此处不新增。
 * - 取消（onCancel）仅关闭抽屉、不写盘；busy 时禁用提交且不清空已填；校验错误就近展示。
 * - 类型/状态/负责人/父目标复用 records-listbox 受控应用内 listbox（import-only，不改 records 源）；
 *   选项由 panel 注入，缺失时退回内置/文本，不自行造名册。
 */
import { useState } from 'react'
import css from './growth-form.css?raw'
import { RecordsListbox } from './records/records-listbox.js'
import {
  validateOkrForm,
  OKR_KINDS,
  OKR_STATUSES,
  type OkrFormValues,
  type FormFieldErrors,
} from '../form-validation.js'
import type { RecordOption } from './records/records-options.js'
import type { OkrFormComponentProps } from './growth-form-props.js'

const KIND_OPTS: readonly RecordOption[] = [
  { value: 'objective', label: '目标 O' },
  { value: 'key-result', label: '关键结果 KR' },
]
const DEFAULT_STATUS_OPTS: readonly RecordOption[] = OKR_STATUSES.map(s =>
  s === 'confirmed' ? { value: s, label: '已定稿' } : { value: s, label: '草稿' },
)

export function OkrForm({
  initial, objectiveIds, ownerOptions, primaryOptions, statusOptions,
  busy, disabled, errors: externalErrors, onSubmit, onCancel,
}: OkrFormComponentProps) {
  const [draft, setDraft] = useState<OkrFormValues>({ ...initial })
  const [touched, setTouched] = useState(false)

  const set = <K extends keyof OkrFormValues>(key: K, value: OkrFormValues[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }))

  const statusOpts = statusOptions ?? DEFAULT_STATUS_OPTS
  const localErrors = validateOkrForm(draft, objectiveIds ?? new Set())
  const errors: FormFieldErrors = { ...localErrors, ...(externalErrors ?? {}) }
  const invalid = touched && Object.keys(errors).length > 0

  const submit = () => {
    setTouched(true)
    if (Object.keys(validateOkrForm(draft, objectiveIds ?? new Set())).length > 0) return
    void onSubmit(draft)
  }

  return (
    <div className="gf-root">
      <style>{css}</style>

      <div className="gf-row">
        <div className="gf-field" data-invalid={!!errors.title}>
          <label className="gf-label" htmlFor="gf-okr-title">标题 <span className="gf-required">*</span></label>
          <input id="gf-okr-title" className="gf-input" value={draft.title} disabled={disabled}
            onChange={e => set('title', e.target.value)} placeholder="如：Q4 完成灰度发布" />
          {errors.title && <span className="gf-error" role="alert">{errors.title}</span>}
        </div>

        <div className="gf-field" data-invalid={!!errors.kind}>
          <label className="gf-label" id="gf-okr-kind-label">类型 <span className="gf-required">*</span></label>
          <RecordsListbox id="gf-okr-kind" ariaLabel="类型" searchable={false}
            value={draft.kind} options={KIND_OPTS} disabled={disabled}
            onChange={v => set('kind', v as OkrFormValues['kind'])} />
          {errors.kind && <span className="gf-error" role="alert">{errors.kind}</span>}
        </div>
      </div>

      <div className="gf-row">
        <div className="gf-field" data-invalid={!!errors.owner}>
          <label className="gf-label" id="gf-okr-owner-label">负责人</label>
          {ownerOptions && ownerOptions.length > 0 ? (
            <RecordsListbox id="gf-okr-owner" ariaLabel="负责人" searchable
              value={draft.owner ?? null} options={ownerOptions} disabled={disabled}
              placeholder="（未指定）"
              onChange={v => set('owner', v)} />
          ) : (
            <input id="gf-okr-owner" className="gf-input" value={draft.owner ?? ''} disabled={disabled}
              onChange={e => set('owner', e.target.value)} placeholder="选填" />
          )}
          {errors.owner && <span className="gf-error" role="alert">{errors.owner}</span>}
        </div>
        <div className="gf-field" data-invalid={!!errors.targetDate}>
          <label className="gf-label" htmlFor="gf-okr-date">目标日期</label>
          <input id="gf-okr-date" type="date" className="gf-input" value={draft.targetDate ?? ''} disabled={disabled}
            onChange={e => set('targetDate', e.target.value)} />
          {errors.targetDate && <span className="gf-error" role="alert">{errors.targetDate}</span>}
        </div>
      </div>

      {draft.kind === 'key-result' && (
        <div className="gf-row">
          <div className="gf-field" data-invalid={!!errors.primaryOkrId}>
            <label className="gf-label" id="gf-okr-primary-label">父目标（KR 主归属）</label>
            {primaryOptions && primaryOptions.length > 0 ? (
              <RecordsListbox id="gf-okr-primary" ariaLabel="父目标（主归属）" searchable
                value={draft.primaryOkrId || null} options={primaryOptions} disabled={disabled}
                placeholder="（未指定，可后补）"
                onChange={v => set('primaryOkrId', v)} />
            ) : (
              <input id="gf-okr-primary" className="gf-input" value={draft.primaryOkrId ?? ''} disabled={disabled}
                onChange={e => set('primaryOkrId', e.target.value)} placeholder="objective ID" />
            )}
            {errors.primaryOkrId && <span className="gf-error" role="alert">{errors.primaryOkrId}</span>}
          </div>
          <div className="gf-field">
            <label className="gf-label" htmlFor="gf-okr-related">软关联目标（逗号分隔 ID）</label>
            <input id="gf-okr-related" className="gf-input" value={draft.relatedOkrIds ?? ''} disabled={disabled}
              onChange={e => set('relatedOkrIds', e.target.value)} placeholder="选填，不计权重" />
          </div>
        </div>
      )}

      <div className="gf-row">
        <div className="gf-field" data-invalid={!!errors.status}>
          <label className="gf-label" id="gf-okr-status-label">状态</label>
          <RecordsListbox id="gf-okr-status" ariaLabel="状态" searchable={false}
            value={draft.status ?? 'draft'} options={statusOpts} disabled={disabled}
            onChange={v => set('status', v as OkrFormValues['status'])} />
          {errors.status && <span className="gf-error" role="alert">{errors.status}</span>}
        </div>
      </div>

      <div className="gf-field">
        <label className="gf-label" htmlFor="gf-okr-desc">补充描述（安全 Markdown）</label>
        <textarea id="gf-okr-desc" className="gf-textarea" value={draft.description ?? ''} disabled={disabled}
          onChange={e => set('description', e.target.value)} placeholder="选填" />
      </div>

      <div className="gf-actions">
        <button type="button" className="gf-btn" onClick={onCancel} disabled={busy}>取消</button>
        <button type="button" className="gf-btn gf-btn--primary" onClick={submit} disabled={busy || disabled || invalid}>
          {busy ? '保存中…' : '保存'}
        </button>
      </div>
      <span className="gf-hint">枚举：{OKR_KINDS.join(' / ')}；状态：{OKR_STATUSES.join(' / ')}</span>
    </div>
  )
}
