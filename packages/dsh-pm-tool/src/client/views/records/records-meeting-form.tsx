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
import { useRef, useState } from 'react'
import css from '../records.css?raw'
import { validateMeetingForm, type FormFieldErrors } from '../../form-validation.js'
import type { Meeting, MeetingAction, Task, RiskIssue } from '../types.js'
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
  tasks?: readonly Pick<Task, 'id' | 'projectId' | 'code' | 'title'>[]
  riskIssues?: readonly Pick<RiskIssue, 'id' | 'projectId' | 'type' | 'title'>[]
  disabled?: boolean
  onCancel: () => void
}

interface ActionDraft {
  key: string
  actionId: string | null
  submitted?: boolean
  title: string
  owner: string
  dueDate: string
  status: string
  taskId: string
  riskIssueId: string
}

function actionToDraft(action: MeetingAction): ActionDraft {
  return {
    key: action.id,
    actionId: action.id,
    title: action.title,
    owner: action.owner,
    dueDate: action.dueDate ?? '',
    status: action.status,
    taskId: action.taskId ?? '',
    riskIssueId: action.riskIssueId ?? '',
  }
}

export function RecordsMeetingForm(props: RecordsMeetingFormProps) {
  const { projectId, meeting, callbacks, tasks = [], riskIssues = [], disabled = false, onCancel } = props
  const meetingProjectId = meeting?.projectId ?? projectId
  const taskOptions = tasks.filter(task => task.projectId === meetingProjectId)
  const issueOptions = riskIssues.filter(issue => issue.projectId === meetingProjectId && issue.type === 'issue')
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
  const [saveError, setSaveError] = useState('')
  const writeLock = useRef(false)
  const newKey = useRef(0)
  const submittedNewKeys = useRef(new Set<string>())
  const [drafts, setDrafts] = useState<ActionDraft[]>(
    meeting?.actions.map(actionToDraft) ?? [],
  )

  const setField = (field: keyof MeetingFormRaw, value: string) => {
    if (disabled || writeLock.current) return
    const next = { ...values, [field]: value }
    setValues(next)
    setErrors(validateMeetingForm(next))
  }

  const setDraftField = (draft: ActionDraft, field: keyof MeetingActionPayload, value: string) => {
    if (disabled || writeLock.current || submittedNewKeys.current.has(draft.key)) return
    setDrafts(prev => prev.map(item => item.key === draft.key ? { ...item, [field]: value } : item))
  }

  const isEmptyNewDraft = (draft: ActionDraft) => !draft.actionId
    && !draft.title.trim() && !draft.owner.trim() && !draft.dueDate
    && draft.status === 'todo' && !draft.taskId && !draft.riskIssueId

  const write = async (operation: () => Promise<boolean>) => {
    if (disabled || writeLock.current) return
    writeLock.current = true
    setSubmitting(true)
    setSaveError('')
    try {
      if (await operation()) callbacks.onSaved()
      else setSaveError('保存未完成，输入已保留；请检查后重试。')
    } catch {
      setSaveError('保存失败，输入已保留；请重试。')
    } finally {
      writeLock.current = false
      setSubmitting(false)
    }
  }

  const persistAction = async (draft: ActionDraft): Promise<boolean> => {
    if (!meeting) return false
    if (submittedNewKeys.current.has(draft.key)) return true
    const payload: MeetingActionPayload = normalizeMeetingActionPayload(draft)
    const ok = await callbacks.onSaveAction(meeting.id, draft.actionId, payload)
    if (ok && !draft.actionId) {
      // 布尔回调不返回新 ID：确认成功的新行不重复 add，重开后再按真实 ID 编辑。
      submittedNewKeys.current.add(draft.key)
      setDrafts(prev => prev.map(item => item.key === draft.key ? { ...item, submitted: true } : item))
    }
    return ok
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled || writeLock.current) return
    const nextErrors = validateMeetingForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    if (drafts.some(draft => !submittedNewKeys.current.has(draft.key)
      && !isEmptyNewDraft(draft) && !draft.title.trim())) {
      setSaveError('请填写行动项标题；输入已保留。')
      return
    }
    await write(async () => {
      const payload: MeetingPayload = normalizeMeetingPayload(values)
      const ok = await callbacks.onSaveMeeting(meetingProjectId, meeting?.id ?? null, payload)
      if (!ok) return false
      if (meeting) {
        for (const draft of drafts) {
          if (isEmptyNewDraft(draft)) continue
          if (!await persistAction(draft)) return false
        }
      }
      return true
    })
  }

  const saveAction = async (draft: ActionDraft) => {
    if (!meeting || disabled || writeLock.current || submittedNewKeys.current.has(draft.key)) return
    if (!draft.title.trim()) {
      setSaveError('请填写行动项标题；输入已保留。')
      return
    }
    await write(() => persistAction(draft))
  }

  return (
    <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
      <style>{css}</style>
      {saveError && <p className="pm-field-error" role="alert">{saveError}</p>}
      <fieldset className="pm-drawer-form" disabled={disabled || submitting}
        style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>

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
              disabled={disabled || submitting}
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
            <div className="rb-meeting-actions">
            {drafts.map(draft => {
              const existing = meeting.actions.find(action => action.id === draft.actionId)
              const rowDisabled = disabled || submitting || !!draft.submitted
              return (
                <div className="rb-action-row" key={draft.key} data-action-id={draft.actionId ?? undefined}>
                  <label className="pm-field rb-action-title"><span>行动项标题</span>
                    <input aria-label="行动项标题" placeholder="行动项标题" value={draft.title} disabled={rowDisabled}
                      onChange={e => setDraftField(draft, 'title', e.currentTarget.value)} />
                  </label>
                  <label className="pm-field"><span>负责人</span>
                    <input aria-label="负责人" placeholder="负责人" value={draft.owner} disabled={rowDisabled}
                      onChange={e => setDraftField(draft, 'owner', e.currentTarget.value)} />
                  </label>
                  <label className="pm-field"><span>截止</span>
                    <input type="date" aria-label="截止" value={draft.dueDate} disabled={rowDisabled}
                      onChange={e => setDraftField(draft, 'dueDate', e.currentTarget.value)} />
                  </label>
                  <label className="pm-field"><span>行动项状态</span>
                    <RecordsListbox
                      id={`action-status-${draft.key}`}
                      value={draft.status}
                      options={MEETING_ACTION_STATUS_OPTIONS}
                      onChange={v => setDraftField(draft, 'status', v)}
                      ariaLabel="行动项状态"
                      disabled={rowDisabled}
                    />
                  </label>
                  <div className="rb-action-links">
                  <label className="pm-field"><span>关联任务</span>
                  <select aria-label="关联任务" value={draft.taskId} disabled={rowDisabled}
                    onChange={event => {
                      const value = event.currentTarget.value
                      if (value && !taskOptions.some(task => task.id === value)) return
                      setDraftField(draft, 'taskId', value)
                    }}>
                    <option value="">不关联任务</option>
                    {draft.taskId && !taskOptions.some(task => task.id === draft.taskId) && (
                      <option value={draft.taskId} disabled>已关联任务 {draft.taskId}（候选不可用）</option>
                    )}
                    {taskOptions.map(task => <option key={task.id} value={task.id}>{task.code} {task.title}</option>)}
                  </select>
                  </label>
                  <label className="pm-field"><span>关联问题</span>
                  <select aria-label="关联问题" value={draft.riskIssueId} disabled={rowDisabled}
                    onChange={event => {
                      const value = event.currentTarget.value
                      if (value && !issueOptions.some(issue => issue.id === value)) return
                      setDraftField(draft, 'riskIssueId', value)
                    }}>
                    <option value="">不关联问题</option>
                    {draft.riskIssueId && !issueOptions.some(issue => issue.id === draft.riskIssueId) && (
                      <option value={draft.riskIssueId} disabled>已关联问题 {draft.riskIssueId}（候选不可用）</option>
                    )}
                    {issueOptions.map(issue => <option key={issue.id} value={issue.id}>{issue.title}</option>)}
                  </select>
                  </label>
                  </div>
                  <div className="rb-action-commands">
                  <button type="button" className="pm-button" disabled={rowDisabled}
                    onClick={() => void saveAction(draft)}>保存</button>
                  {existing && (
                    <button type="button" className="pm-button" disabled={rowDisabled}
                      onClick={() => void write(() => callbacks.onPromoteAction(meeting.id, existing.id))}>
                      转任务
                    </button>
                  )}
                  {existing && (
                    <button type="button" className="pm-button pm-button-danger" disabled={rowDisabled}
                      onClick={() => void write(() => callbacks.onDeleteAction(meeting.id, existing.id))}>
                      删除
                    </button>
                  )}
                  </div>
                  {draft.submitted && <span role="status">此新行已保存，重开会议后可继续编辑。</span>}
                </div>
              )
            })}
            <button type="button" className="pm-button" disabled={disabled || submitting} onClick={() => {
              if (disabled || writeLock.current) return
              const key = `new-${newKey.current++}`
              setDrafts(prev => [...prev, {
                key, actionId: null, title: '', owner: '', dueDate: '', status: 'todo', taskId: '', riskIssueId: '',
              }])
            }}>添加行动项</button>
            </div>
          </div>
        </section>
      )}
      </fieldset>

      <div className="pm-drawer-actions">
        {meeting && (
          <button type="button" className="pm-button pm-button-danger pm-actions-left" disabled={disabled || submitting}
            onClick={() => void write(() => callbacks.onDeleteMeeting(meeting.id))}>
            删除会议
          </button>
        )}
        <button type="button" className="pm-button" onClick={() => {
          if (!disabled && !writeLock.current) onCancel()
        }} disabled={disabled || submitting}>取消</button>
        <button type="submit" className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
          {submitting ? '提交中…' : meeting ? '保存会议' : '新增会议'}
        </button>
      </div>
    </form>
  )
}
