/**
 * B6 交付物表单（records 分片）。
 *
 * 只消费 DeliverableCallbacks，不拼命令、不 localmock：
 * - 保存：onSaveDeliverable(projectId, deliverableId|null, DeliverablePayload)
 * - 删除：onDeleteDeliverable(deliverableId)（只删登记，不删本地文件）
 * - 状态/版本留痕：history 只读投影（projectDeliverableHistory），状态变更走 payload.status + changeNote，
 *   无独立 status 命令；onViewStatusHistory 供 panel 展开历史。
 *
 * 校验复用 form-validation 的 validateDeliverableForm（只读消费）；取消零写。
 */
import { useState } from 'react'
import css from '../records.css?raw'
import { validateDeliverableForm, type FormFieldErrors } from '../../form-validation.js'
import type { Deliverable, Milestone } from '../types.js'
import type { DeliverableCallbacks, DeliverablePayload } from '../../shared/records-props.js'
import { normalizeDeliverablePayload, type DeliverableFormRaw } from './records-payloads.js'
import { RecordsListbox } from './records-listbox.js'
import { DELIVERABLE_STATUS_OPTIONS } from './records-options.js'
import { projectDeliverableHistory } from './records-history.js'
import { deliverableStatusLabels } from '../../../core/labels.js'

export interface RecordsDeliverableFormProps {
  projectId: string
  deliverable?: Deliverable
  callbacks: DeliverableCallbacks
  /** 同项目里程碑（U5 关联选择；空 = 不关联/解除）。 */
  milestones?: Milestone[]
  disabled?: boolean
  onCancel: () => void
}

export function RecordsDeliverableForm(props: RecordsDeliverableFormProps) {
  const { projectId, deliverable, callbacks, milestones = [], disabled = false, onCancel } = props
  const [values, setValues] = useState<DeliverableFormRaw>({
    name: deliverable?.name ?? '',
    version: deliverable?.version ?? '',
    owner: deliverable?.owner ?? '',
    status: deliverable?.status ?? 'planned',
    location: deliverable?.location ?? '',
    description: deliverable?.description ?? '',
    dueDate: deliverable?.dueDate ?? '',
    changeNote: '',
    repoUrl: deliverable?.repoUrl ?? '',
    branch: deliverable?.branch ?? '',
    milestoneId: deliverable?.milestoneId ?? '',
    note: deliverable?.note ?? '',
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // U5：里程碑选项含「不关联」（空值 → payload.milestoneId=null 解除关联）。
  const milestoneOptions = [
    { value: '', label: '不关联里程碑' },
    ...milestones.map(m => ({ value: m.id, label: m.title })),
  ]

  const setField = (field: keyof DeliverableFormRaw, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    setErrors(validateDeliverableForm(next))
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const nextErrors = validateDeliverableForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSubmitting(true)
    try {
      const payload: DeliverablePayload = normalizeDeliverablePayload(values)
      const ok = await callbacks.onSaveDeliverable(projectId, deliverable?.id ?? null, payload)
      if (ok) callbacks.onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  const historyRows = deliverable ? projectDeliverableHistory(deliverable.history, deliverableStatusLabels) : []

  return (
    <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
      <style>{css}</style>

      <section className="pm-form-section">
        <div className="pm-form-section-h">
          <span className="pm-form-section-n" aria-hidden="true">01</span>
          <span className="pm-form-section-title">基础信息</span>
        </div>
        <div className="pm-form-section-grid">
          <label className="pm-field" data-wide data-invalid={!!errors.name}>
            <span>交付物名称<span className="pm-field-required" aria-hidden="true"> *</span></span>
            <input value={values.name} autoFocus
              onChange={e => setField('name', e.currentTarget.value)}
              aria-required="true" aria-invalid={errors.name ? true : undefined} />
            {errors.name && <span className="pm-field-error" role="alert">{errors.name}</span>}
          </label>
          <label className="pm-field"><span>版本</span>
            <input placeholder="如 v1.0" value={values.version}
              onChange={e => setField('version', e.currentTarget.value)} /></label>
          <label className="pm-field"><span>状态</span>
            <RecordsListbox id="deliverable-status" value={values.status ?? null} options={DELIVERABLE_STATUS_OPTIONS}
              onChange={v => setField('status', v)} ariaLabel="交付物状态" disabled={disabled} /></label>
          <label className="pm-field"><span>负责人</span>
            <input value={values.owner} onChange={e => setField('owner', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>关联里程碑（可选，清空即解除）</span>
            <RecordsListbox id="deliverable-milestone" value={values.milestoneId ?? ''} options={milestoneOptions}
              onChange={v => setField('milestoneId', v)} ariaLabel="关联里程碑" disabled={disabled} /></label>
          <label className="pm-field" data-wide><span>位置（路径 / 链接 / 存放说明）</span>
            <input placeholder="exports/交付物.md 或 https://..." value={values.location}
              onChange={e => setField('location', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>说明</span>
            <textarea rows={4} value={values.description}
              onChange={e => setField('description', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>备注（可选，仅内部记录）</span>
            <textarea rows={2} value={values.note ?? ''}
              onChange={e => setField('note', e.currentTarget.value)} /></label>
          {deliverable && (
            <label className="pm-field" data-wide><span>本次变更说明（版本/状态变化时留痕）</span>
              <input placeholder="如：提交评审、验收通过" value={values.changeNote}
                onChange={e => setField('changeNote', e.currentTarget.value)} /></label>
          )}
        </div>
      </section>

      <section className="pm-form-section">
        <div className="pm-form-section-h">
          <span className="pm-form-section-n" aria-hidden="true">02</span>
          <span className="pm-form-section-title">排期与仓库</span>
        </div>
        <div className="pm-form-section-grid">
          <label className="pm-field" data-wide data-invalid={!!errors.dueDate}>
            <span>计划交付日期</span>
            <input type="date" value={values.dueDate}
              onChange={e => setField('dueDate', e.currentTarget.value)}
              aria-invalid={errors.dueDate ? true : undefined} />
            {errors.dueDate && <span className="pm-field-error" role="alert">{errors.dueDate}</span>}
          </label>
          <label className="pm-field" data-invalid={!!errors.repoUrl}>
            <span>仓库地址（可选）</span>
            <input placeholder="https://host/org/repo.git" value={values.repoUrl}
              onChange={e => setField('repoUrl', e.currentTarget.value)}
              aria-invalid={errors.repoUrl ? true : undefined} />
            {errors.repoUrl && <span className="pm-field-error" role="alert">{errors.repoUrl}</span>}
          </label>
          <label className="pm-field" data-invalid={!!errors.branch}>
            <span>分支（可选）</span>
            <input placeholder="main" value={values.branch}
              onChange={e => setField('branch', e.currentTarget.value)}
              aria-invalid={errors.branch ? true : undefined} />
            {errors.branch && <span className="pm-field-error" role="alert">{errors.branch}</span>}
          </label>
        </div>
      </section>

      {deliverable && (
        <section className="rb-history">
          <h3>版本 / 状态变更留痕（{historyRows.length}）</h3>
          <button type="button" className="pm-button" onClick={() => callbacks.onViewStatusHistory(deliverable.id)}>
            查看历史
          </button>
          {historyRows.length > 0 && (
            <ul>
              {historyRows.map(row => (
                <li key={row.key}>
                  <strong>{row.target}：{row.transition}</strong>
                  <div className="rb-history-meta">{row.at.slice(0, 10)}{row.by ? ` · ${row.by}` : ''}</div>
                  {row.note && <div className="rb-history-note">{row.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="pm-drawer-actions">
        {deliverable && (
          <button type="button" className="pm-button pm-button-danger pm-actions-left" disabled={disabled}
            onClick={() => void callbacks.onDeleteDeliverable(deliverable.id).then(ok => ok && callbacks.onSaved())}>
            删除
          </button>
        )}
        <button type="button" className="pm-button" onClick={onCancel} disabled={disabled}>取消</button>
        <button type="submit" className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
          {submitting ? '提交中…' : deliverable ? '保存更改' : '新增交付物'}
        </button>
      </div>
    </form>
  )
}
