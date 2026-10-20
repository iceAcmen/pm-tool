/**
 * B6 进度汇报表单（records 分片）：周期选择 → 本地只读预览 → 保存固定快照。
 *
 * 只消费 ReportCallbacks，不拼命令、不 localmock 持久：
 * - 新建：onGeneratePeriod(projectId, periodStart, periodEnd, ReportPayload, selectedRefs)
 * - 编辑：onUpdateReport(reportId, ReportPayload)（周期已固定，禁用不可改，不传 excerpts 即保留旧摘录）
 * - 删除 onDeleteReport；导出 onExportReport（fire-and-forget）
 * - onPreviewPeriod 权威 dry-run（零写，返回候选三元组）；缺失时仅本地 derived 只读预览，
 *   不据此写库，不伪造已保存。stale/伪造由后端复核零写回错，前端不做本地冲突判断。
 *
 * 旧 frozen snapshot 正文只读保护：编辑态不改 period、不覆盖 snapshot，仅提交正文 payload。
 */
import { useEffect, useMemo, useState } from 'react'
import css from '../records.css?raw'
import type { ProgressReport } from '../types.js'
import type { ReportCallbacks, ReportPayload, ReportPreviewCandidate } from '../../shared/records-props.js'
import { normalizeReportPayload } from './records-payloads.js'
import { RecordsListbox } from './records-listbox.js'
import { REPORT_STATUS_OPTIONS, REPORT_SOURCE_OPTIONS } from './records-options.js'
import { periodPresets, validatePeriod, PERIOD_KIND_LABEL } from './records-period.js'
import {
  buildLocalPreview,
  type LocalPreviewInput,
} from './records-preview.js'
import {
  candidateKey,
  toggleKey,
  setAllKeys,
  preserveChecked,
  buildSelectedRefs,
  withinFrozenLimit,
  FROZEN_EXCERPTS_MAX,
} from './records-preview-authoritative.js'

/** 已冻结摘录只读投影（client types.ts 未声明该字段，本地结构只读访问，不改原记录）。 */
interface FrozenExcerpt {
  id: string
  taskId: string
  entryId: string
  revisionId: string
  contentSnapshot: string
  author: string
  date: string
}

export interface RecordsReportFormProps {
  projectId: string
  report?: ProgressReport
  callbacks: ReportCallbacks
  disabled?: boolean
  onCancel: () => void
  /**
   * 本地只读预览的当前 revision 原始数据（无权威 dry-run 时的回退派生，authoritative:false，不落盘）。
   */
  previewSource?: Omit<LocalPreviewInput, 'periodStart' | 'periodEnd'>
  /** 权威 dry-run 候选（data report preview）；缺失才回退本地派生预览。 */
  onPreviewPeriod?: ReportCallbacks['onPreviewPeriod']
}

export function RecordsReportForm(props: RecordsReportFormProps) {
  const { projectId, report, callbacks, disabled = false, onCancel, previewSource, onPreviewPeriod } = props
  const editMode = Boolean(report)

  const [presetKey, setPresetKey] = useState<'thisWeek' | 'lastWeek' | 'custom'>('thisWeek')
  const [periodStart, setPeriodStart] = useState(report?.periodStart ?? '')
  const [periodEnd, setPeriodEnd] = useState(report?.periodEnd ?? '')
  const [values, setValues] = useState({
    title: report?.title ?? '',
    status: report?.status ?? 'draft',
    executiveSummary: report?.executiveSummary ?? '',
    completedWork: report?.completedWork.join('\n') ?? '',
    nextPlans: report?.nextPlans.join('\n') ?? '',
    blockers: report?.blockers.join('\n') ?? '',
  })
  const [errors, setErrors] = useState<{ periodStart?: string, periodEnd?: string, sourceSessionId?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  // U5 来源：新建可选 manual/session，session 必填会话 ID；编辑态只读，update 不带 source（不可改）。
  const [sourceType, setSourceType] = useState<'manual' | 'session'>(report?.sourceType === 'session' ? 'session' : 'manual')
  const [sourceSessionId, setSourceSessionId] = useState<string>(report?.sourceSessionId ?? '')

  // 权威 dry-run 候选（data report preview，零写）。
  const [candidates, setCandidates] = useState<ReportPreviewCandidate[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [previewBusy, setPreviewBusy] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [refreshNonce, setRefreshNonce] = useState(0)

  const periodValid = Object.keys(validatePeriod(periodStart, periodEnd)).length === 0

  // 周期合法且有权威回调时拉取候选（零写）；stale/伪造由后端判定，UI 不做本地 revision 比对。
  useEffect(() => {
    if (editMode || !onPreviewPeriod || !periodValid) {
      setCandidates([])
      setChecked(new Set())
      setPreviewError(null)
      return
    }
    let cancelled = false
    setPreviewBusy(true)
    setPreviewError(null)
    onPreviewPeriod(projectId, periodStart, periodEnd)
      .then(list => {
        if (cancelled) return
        setCandidates(list)
        // 重预览保勾选：首次全选；后续仅保留仍存在的已勾选项，不自动勾新、不重置。
        setChecked(prev => preserveChecked(prev, list))
      })
      .catch(err => {
        if (cancelled) return
        setPreviewError(err instanceof Error ? err.message : '候选预览失败，请重试')
        setCandidates([])
        setChecked(new Set())
      })
      .finally(() => { if (!cancelled) setPreviewBusy(false) })
    return () => { cancelled = true }
  }, [editMode, onPreviewPeriod, projectId, periodStart, periodEnd, periodValid, refreshNonce])

  // 复合 selectedRefs{taskId,entryId,revisionId}，后端复核真实 task-entry-revision，stale/伪造零写。
  const selectedRefs = useMemo(
    () => buildSelectedRefs(candidates, checked),
    [candidates, checked],
  )
  const selectedCount = selectedRefs.length
  const overLimit = !withinFrozenLimit(selectedCount)

  // 编辑态已存冻结摘录：只读投影，update 不传 excerpts 即保留，绝不覆盖。
  const frozenExcerpts = useMemo<FrozenExcerpt[]>(() => {
    if (!report) return []
    const maybe = (report as Partial<ProgressReport> & { excerpts?: readonly FrozenExcerpt[] }).excerpts
    return maybe ? [...maybe] : []
  }, [report])

  const toggleCandidate = (key: string) => setChecked(prev => toggleKey(prev, key))
  const toggleAll = (next: boolean) => setChecked(setAllKeys(candidates, next))
  // 手动重新预览：重拉候选，保留已勾选策略与已输入正文。
  const refreshPreview = () => setRefreshNonce(n => n + 1)

  const presets = useMemo(
    () => previewSource?.today
      ? periodPresets(previewSource.today)
      : [{ key: 'custom' as const, label: '自定义', start: '', end: '' }],
    [previewSource?.today],
  )

  const pickPreset = (key: string) => {
    setPresetKey(key as typeof presetKey)
    const preset = presets.find(p => p.key === key)
    if (preset && preset.key !== 'custom') {
      setPeriodStart(preset.start)
      setPeriodEnd(preset.end)
      setErrors({})
    }
  }

  // 本地只读预览：仅当无权威 dry-run 且有原始数据时回退；authoritative=false，非固定快照。
  const localPreview = useMemo(() => {
    if (editMode || !previewSource || onPreviewPeriod) return null
    const errs = validatePeriod(periodStart, periodEnd)
    if (Object.keys(errs).length > 0) return null
    return buildLocalPreview({ ...previewSource, periodStart, periodEnd })
  }, [editMode, previewSource, onPreviewPeriod, periodStart, periodEnd])

  const setField = (field: keyof typeof values, value: string) =>
    setValues(prev => ({ ...prev, [field]: value }))

  const [selectionNote, setSelectionNote] = useState<string | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (!editMode) {
      const errs: { periodStart?: string, periodEnd?: string, sourceSessionId?: string } = { ...validatePeriod(periodStart, periodEnd) }
      // U5：session 来源必须填非空会话 ID；manual 不校验。
      if (sourceType === 'session' && !sourceSessionId.trim()) {
        errs.sourceSessionId = '会话生成来源必须填写会话 ID'
      }
      setErrors(errs)
      if (Object.keys(errs).length > 0) return
      // 仅前端可判定的硬拦截：超 50 上限。stale/伪造由后端复核并零写回错，UI 保留输入、不关层。
      if (candidates.length > 0 && overLimit) {
        setSelectionNote(`一次冻结摘录最多 ${FROZEN_EXCERPTS_MAX} 条，请减少选择。`)
        return
      }
      setSelectionNote(null)
    }
    setSubmitting(true)
    try {
      const base = normalizeReportPayload(values)
      let payload: ReportPayload
      if (editMode) {
        // U5：来源不可改，update 剥离 sourceType/sourceSessionId。
        const { sourceType: _st, sourceSessionId: _ss, ...rest } = base
        payload = rest
      } else {
        payload = {
          ...base,
          sourceType,
          sourceSessionId: sourceType === 'session' ? sourceSessionId.trim() : null,
        }
      }
      const ok = report
        ? await callbacks.onUpdateReport(report.id, payload)
        : await callbacks.onGeneratePeriod(projectId, periodStart, periodEnd, payload, selectedRefs)
      // 失败保留输入与层；成功才由 onSaved 关层刷新。
      if (ok) callbacks.onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="pm-drawer-form" noValidate onSubmit={event => void submit(event)}>
      <style>{css}</style>

      <section className="pm-form-section">
        <div className="pm-form-section-h">
          <span className="pm-form-section-n" aria-hidden="true">01</span>
          <span className="pm-form-section-title">汇报内容</span>
        </div>
        <div className="pm-form-section-grid">
          <label className="pm-field" data-wide>
            <span>汇报标题（留空按项目和周期自动生成）</span>
            <input value={values.title} autoFocus
              onChange={e => setField('title', e.currentTarget.value)} />
          </label>
          <label className="pm-field">
            <span>状态</span>
            <RecordsListbox id="report-status" value={values.status} options={REPORT_STATUS_OPTIONS}
              onChange={v => setField('status', v)} ariaLabel="汇报状态" disabled={disabled} />
          </label>
          {editMode && (
            <label className="pm-field" data-wide>
              <span>来源（不可改）</span>
              <input readOnly disabled
                value={sourceType === 'session' ? `会话生成${sourceSessionId ? ` · ${sourceSessionId}` : ''}` : '手动撰写'} />
            </label>
          )}
          {!editMode && (
            <label className="pm-field">
              <span>来源</span>
              <RecordsListbox id="report-source" value={sourceType} options={REPORT_SOURCE_OPTIONS}
                onChange={v => setSourceType(v as 'manual' | 'session')} ariaLabel="汇报来源" />
            </label>
          )}
          {!editMode && sourceType === 'session' && (
            <label className="pm-field" data-wide data-invalid={!!errors.sourceSessionId}>
              <span>会话 ID（必填）</span>
              <input value={sourceSessionId} placeholder="会话来源 ID"
                onChange={e => setSourceSessionId(e.currentTarget.value)} />
              {errors.sourceSessionId && <em className="pm-field-error">{errors.sourceSessionId}</em>}
            </label>
          )}
          <label className="pm-field" data-wide><span>管理摘要</span>
            <textarea rows={4} value={values.executiveSummary}
              onChange={e => setField('executiveSummary', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>已完成事项（每行一项）</span>
            <textarea rows={4} value={values.completedWork}
              onChange={e => setField('completedWork', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>下期计划（每行一项）</span>
            <textarea rows={4} value={values.nextPlans}
              onChange={e => setField('nextPlans', e.currentTarget.value)} /></label>
          <label className="pm-field" data-wide><span>阻塞说明（每行一项）</span>
            <textarea rows={3} value={values.blockers}
              onChange={e => setField('blockers', e.currentTarget.value)} /></label>
        </div>
      </section>

      <section className="pm-form-section">
        <div className="pm-form-section-h">
          <span className="pm-form-section-n" aria-hidden="true">02</span>
          <span className="pm-form-section-title">周期{editMode ? '（已固定，不可改）' : ''}</span>
        </div>
        <div className="pm-form-section-grid">
          {!editMode && (
            <label className="pm-field">
              <span>周期预设</span>
              <RecordsListbox
                id="report-preset"
                value={presetKey}
                options={presets.map(p => ({ value: p.key, label: p.label }))}
                onChange={pickPreset}
                ariaLabel="周期预设"
              />
            </label>
          )}
          <label className="pm-field" data-invalid={!!errors.periodStart}>
            <span>周期开始{editMode ? '' : ' *'}</span>
            <input type="date" value={periodStart} disabled={editMode}
              onChange={e => { setPeriodStart(e.currentTarget.value); setErrors(validatePeriod(e.currentTarget.value, periodEnd)) }} />
            {errors.periodStart && <span className="pm-field-error" role="alert">{errors.periodStart}</span>}
          </label>
          <label className="pm-field" data-invalid={!!errors.periodEnd}>
            <span>周期结束{editMode ? '' : ' *'}</span>
            <input type="date" value={periodEnd} disabled={editMode}
              onChange={e => { setPeriodEnd(e.currentTarget.value); setErrors(validatePeriod(periodStart, e.currentTarget.value)) }} />
            {errors.periodEnd && <span className="pm-field-error" role="alert">{errors.periodEnd}</span>}
          </label>
        </div>

        {!editMode && onPreviewPeriod && (
          <div className="rb-candidates" aria-label="权威候选进展（只读 dry-run，未写库）">
            <div className="rb-preview-title">
              权威候选 · 只读预览（未写库）{previewBusy ? ' · 加载中…' : ''} · 已选 {selectedCount}/{candidates.length}
            </div>
            {previewError && <div className="rb-warn" role="alert">{previewError}</div>}
            {overLimit && (
              <div className="rb-warn" role="alert">已选 {selectedCount} 条，超过冻结上限 {FROZEN_EXCERPTS_MAX} 条。</div>
            )}
            {candidates.length > 0 && (
              <>
                <label className="rb-checkall">
                  <input type="checkbox" checked={selectedCount === candidates.length}
                    onChange={e => toggleAll(e.target.checked)} />
                  全选（默认周期内全部未删条目）
                </label>
                <ul className="rb-candidate-list">
                  {candidates.map(c => {
                    const key = candidateKey(c)
                    const on = checked.has(key)
                    return (
                      <li key={key}>
                        <label>
                          <input type="checkbox" checked={on} onChange={() => toggleCandidate(key)} />
                          <span className="rb-candidate-meta">
                            {c.date} · {c.author} · {c.taskTitle ?? c.taskId} · {c.entryId}/{c.revisionId}
                          </span>
                          <span className="rb-candidate-content">{c.content}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
                <button type="button" className="pm-button" onClick={refreshPreview} disabled={previewBusy}>重新预览</button>
              </>
            )}
          </div>
        )}

        {editMode && frozenExcerpts.length > 0 && (
          <div className="rb-history">
            <h3>已冻结摘录（{frozenExcerpts.length}，只读保护，更新不覆盖）</h3>
            <ul>
              {frozenExcerpts.map(ex => (
                <li key={ex.id}>
                  <strong>{ex.date} · {ex.author} · {ex.entryId}/{ex.revisionId}</strong>
                  <div className="rb-history-note">{ex.contentSnapshot}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectionNote && <div className="rb-warn" role="alert">{selectionNote}</div>}

        {localPreview && (
          <div className="rb-preview" aria-label="本地只读预览">
            <div className="rb-preview-title">
              本地只读预览 · {PERIOD_KIND_LABEL[localPreview.periodType]}
              （非固定快照，保存后由系统生成权威快照）
            </div>
            <div className="rb-preview-grid">
              <div className="rb-preview-cell"><span className="rb-preview-k">任务总数</span><span className="rb-preview-v">{localPreview.tasks.total}</span></div>
              <div className="rb-preview-cell"><span className="rb-preview-k">已完成</span><span className="rb-preview-v">{localPreview.tasks.done}</span></div>
              <div className="rb-preview-cell"><span className="rb-preview-k">进行中</span><span className="rb-preview-v">{localPreview.tasks.inProgress}</span></div>
              <div className="rb-preview-cell"><span className="rb-preview-k">受阻</span><span className="rb-preview-v">{localPreview.tasks.blocked}</span></div>
              <div className="rb-preview-cell"><span className="rb-preview-k">周期会议</span><span className="rb-preview-v">{localPreview.meetings.inPeriod}</span></div>
              <div className="rb-preview-cell"><span className="rb-preview-k">异常项</span><span className="rb-preview-v">{localPreview.exceptions.length}</span></div>
            </div>
          </div>
        )}
      </section>

      <div className="pm-drawer-actions">
        {report && (
          <>
            <button type="button" className="pm-button pm-button-danger pm-actions-left" disabled={disabled}
              onClick={() => void callbacks.onDeleteReport(report.id).then(ok => ok && callbacks.onSaved())}>
              删除
            </button>
            <button type="button" className="pm-button" disabled={disabled}
              onClick={() => callbacks.onExportReport(report.id)}>
              导出 Markdown
            </button>
          </>
        )}
        <button type="button" className="pm-button" onClick={onCancel} disabled={disabled}>取消</button>
        <button type="submit" className="pm-button pm-button-primary" disabled={disabled || submitting} aria-busy={submitting || undefined}>
          {submitting ? '提交中…' : report ? '保存汇报' : '生成固定快照'}
        </button>
      </div>
    </form>
  )
}
