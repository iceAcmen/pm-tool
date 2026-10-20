/**
 * B6 会议纪要表单（records 分片）。
 *
 * 只消费 shared/records-props.ts 的 MeetingCallbacks，不拼命令、不 localmock 写：
 * - 保存：onSaveMeeting(projectId, meetingId|null, MeetingPayload)
 * - 删除：onDeleteMeeting(meetingId)（确认对话框由 panel 包裹）
 * - 行动项：onSaveAction / onPromoteAction / onDeleteAction（仅编辑态有会议 ID 可挂）
 *
 * 校验复用 form-validation.ts 的 validateMeetingForm（只读消费）；payload 经
 * normalizeMeetingPayload 归一。取消零写：未点保存不调用任何回调。
 */
import { useState } from 'react'
import css from '../records.css?raw'
import { validateMeetingForm, type FormFieldErrors } from '../../form-validation.js'
import type { Meeting, MeetingAction } from '../types.js'
import type { MeetingCallbacks, MeetingPayload, MeetingActionPayload } from '../../shared/records-props.js'
import {
  normalizeMeetingPayload,
  normalizeMeetingActionPayload,
  type MeetingFormRaw,
} from './records-payloads.js'
import { RecordsListbox } from './records-listbox.js'
import { MEETING_STATUS_OPTIONS, MEETING_ACTION_STATUS_OPTIONS } from './records-options.js'

export interface RecordsMeetingFormProps {
  projectId: string
  meeting?: Meeting
  callbacks: MeetingCallbacks
  disabled?: boolean
  onCancel: () => void
}

interface ActionDraft {
  key: string
  title: string
  owner: string
  dueDate: string
  status: string
  taskId: string
  riskIssueId: string
}

function actionToDraft(action: MeetingAction, index: number): ActionDraft {
  return {
    key: action.id || `new-${index}`,
    title: action.title,
    owner: action.owner,
    dueDate: action.dueDate ?? '',
    status: action.status,
    taskId: action.taskId ?? '',
    riskIssueId: action.riskIssueId ?? '',
  }
}

export function RecordsMeetingForm(props: RecordsMeetingFormProps) {
  const { projectId, meeting, callbacks, disabled = false, onCancel } = props
  const [values, setValues] = useState<MeetingFormRaw>({
    title: meeting?.title ?? '',
    meetingDate: meeting?.meetingDate ?? '',
    startTime: meeting?.startTime ?? '',
    durationMinutes: meeting?.durationMinutes != null ? String(meeting.durationMinutes) : '',
    location: meeting?.location ?? '',
    facilitator: meeting?.facilitator ?? '',
    recorder: meeting?.recorder ?? '',
    participants: meeting?.participants.join('\n') ?? '',
    status: meeting?.status ?? 'draft',
    summary: meeting?.summary ?? '',
    topics: meeting?.topics.join('\n') ?? '',
    decisions: meeting?.decisions.join('\n') ?? '',
    notes: meeting?.notes ?? '',
  })
  const [errors, setErrors] = useState<FormFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [drafts, setDrafts] = useState<ActionDraft[]>(
    meeting?.actions.map(actionToDraft) ?? [],
  )

  const setField = (field: keyof MeetingFormRaw, value: string) => {
    const next = { ...values, [field]: value }
    setValues(next)
    setErrors(validateMeetingForm(next))
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const nextErrors = validateMeetingForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSubmitting(true)
    try {
      const payload: MeetingPayload = normalizeMeetingPayload(values)
      const ok = await callbacks.onSaveMeeting(projectId, meeting?.id ?? null, payload)
      if (ok) callbacks.onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  const saveAction = async (draft: ActionDraft, actionId: string | null) => {
    if (!meeting) return
    const payload: MeetingActionPayload = normalizeMeetingActionPayload(draft)
    if (!payload.title) return
    const ok = await callbacks.onSaveAction(meeting.id, actionId, payload)
    if (ok) callbacks.onSaved()
  }

  return (
    <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
      <style>{css}</style>

      <section className="pm-form-section">
        <div className="pm-form-section-h">
          <span className="pm-form-section-n" aria-hidden="true">01</span>
          <span className="pm-form-section-title">基础信息</span>
        </div>
        <div className="pm-form-section-grid">
          <label className="pm-field" data-wide data-invalid={!!errors.title}>
            <span>会议标题<span className="pm-field-required" aria-hidden="true"> *</span></span>
            <input
              name="title" value={values.title} autoFocus
              onChange={e => setField('title', e.currentTarget.value)}
              aria-required="true" aria-invalid={errors.title ? true : undefined}
            />
            {errors.title && <span className="pm-field-error" role="alert">{errors.title}</span>}
          </label>

          <label className="pm-field">
            <span>状态</span>
            <RecordsListbox
              id="meeting-status"
              value={values.status ?? null}
              options={MEETING_STATUS_OPTIONS}
              onChange={v => setField('status', v)}
              ariaLabel="会议状态"
              disabled={disabled}
            />
          </label>

          <label className="pm-field"><span>主持人</span>
            <input name="facilitator" value={values.facilitator}
              onChange={e => setField('facilitator', e.currentTarget.value)} /></label>
          <label className="pm-field"><span>记录人</span>
            <input name="recorder" value={values.recorder}
              onChange={e => setField('recorder', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>地点 / 链接</span>
            <input name="location" value={values.location}
              onChange={e => setField('location', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>参会人（每行一人）</span>
            <textarea name="participants" rows={3} value={values.participants}
              onChange={e => setField('participants', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>会议摘要</span>
            <textarea name="summary" rows={4} value={values.summary}
              onChange={e => setField('summary', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>议题（每行一项）</span>
            <textarea name="topics" rows={4} value={values.topics}
              onChange={e => setField('topics', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>决议（每行一项）</span>
            <textarea name="decisions" rows={4} value={values.decisions}
              onChange={e => setField('decisions', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>备注</span>
            <textarea name="notes" rows={3} value={values.notes}
              onChange={e => setField('notes', e.currentTarget.value)} /></label>
        </div>
      </section>

      <section className="pm-form-section">
        <div className="pm-form-section-h">
          <span className="pm-form-section-n" aria-hidden="true">02</span>
          <span className="pm-form-section-title">排期</span>
        </div>
        <div className="pm-form-section-grid">
          <label className="pm-field" data-invalid={!!errors.meetingDate}>
            <span>会议日期<span className="pm-field-required" aria-hidden="true"> *</span></span>
            <input type="date" name="meetingDate" value={values.meetingDate}
              onChange={e => setField('meetingDate', e.currentTarget.value)}
              aria-required="true" aria-invalid={errors.meetingDate ? true : undefined} />
            {errors.meetingDate && <span className="pm-field-error" role="alert">{errors.meetingDate}</span>}
          </label>
          <label className="pm-field"><span>开始时间</span>
            <input type="time" name="startTime" value={values.startTime}
              onChange={e => setField('startTime', e.currentTarget.value)} /></label>
          <label className="pm-field" data-invalid={!!errors.durationMinutes}>
            <span>时长（分钟）</span>
            <input type="number" min={1} max={1440} name="durationMinutes" value={values.durationMinutes}
              onChange={e => setField('durationMinutes', e.currentTarget.value)}
              aria-invalid={errors.durationMinutes ? true : undefined} />
            {errors.durationMinutes && <span className="pm-field-error" role="alert">{errors.durationMinutes}</span>}
          </label>
        </div>
      </section>

      {meeting && (
        <section className="pm-form-section">
          <div className="pm-form-section-h">
            <span className="pm-form-section-n" aria-hidden="true">03</span>
            <span className="pm-form-section-title">行动项（{drafts.length}）</span>
          </div>
          <div className="pm-form-section-grid">
            {drafts.map((draft, idx) => {
              const existing = meeting.actions[idx]
              return (
                <div className="rb-action-row" key={draft.key}>
                  <input aria-label="行动项标题" placeholder="行动项标题" value={draft.title}
                    onChange={e => setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, title: e.currentTarget.value } : d))} />
                  <input aria-label="负责人" placeholder="负责人" value={draft.owner}
                    onChange={e => setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, owner: e.currentTarget.value } : d))} />
                  <input type="date" aria-label="截止" value={draft.dueDate}
                    onChange={e => setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, dueDate: e.currentTarget.value } : d))} />
                  <RecordsListbox
                    id={`action-status-${idx}`}
                    value={draft.status}
                    options={MEETING_ACTION_STATUS_OPTIONS}
                    onChange={v => setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, status: v } : d))}
                    ariaLabel="行动项状态"
                  />
                  <button type="button" className="pm-button"
                    onClick={() => void saveAction(draft, existing?.id ?? null)}>保存</button>
                  {existing && (
                    <button type="button" className="pm-button"
                      onClick={() => void callbacks.onPromoteAction(meeting.id, existing.id).then(ok => ok && callbacks.onSaved())}>
                      转任务
                    </button>
                  )}
                  {existing && (
                    <button type="button" className="pm-button pm-button-danger"
                      onClick={() => void callbacks.onDeleteAction(meeting.id, existing.id).then(ok => ok && callbacks.onSaved())}>
                      删除
                    </button>
                  )}
                </div>
              )
            })}
            <button type="button" className="pm-button" onClick={() => setDrafts(prev => [...prev, {
              key: `new-${prev.length}`, title: '', owner: '', dueDate: '', status: 'todo', taskId: '', riskIssueId: '',
            }])}>添加行动项</button>
          </div>
        </section>
      )}

      <div className="pm-drawer-actions">
        {meeting && (
          <button type="button" className="pm-button pm-button-danger pm-actions-left" disabled={disabled}
            onClick={() => void callbacks.onDeleteMeeting(meeting.id).then(ok => ok && callbacks.onSaved())}>
            删除会议
          </button>
        )}
        <button type="button" className="pm-button" onClick={onCancel} disabled={disabled}>取消</button>
        <button type="submit" className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
          {submitting ? '提交中…' : meeting ? '保存会议' : '新增会议'}
        </button>
      </div>
    </form>
  )
}
