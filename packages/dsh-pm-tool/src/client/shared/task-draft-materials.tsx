/**
 * B2 任务抽屉「本地草稿」资料/进展面板（draft mode），配合 task-draft ops 信封提交。
 *
 * 与独立即时写 TaskMaterialsEditor 不同：本组件不 run 任何命令，只把用户动作追加到
 * 本地 OpsSession（clientId 别名 / 既有条目 op），提交时由 TaskForm 一次性合并进
 * task add / task update 的 draft.attachmentOps/progressOps，cancel 零写。
 *
 * - 既有条目只读展示；移除/改注/编辑修订/软删/恢复只追加 op，未提及项后端原样保留。
 * - 新增 link/deliverable 生成 c-n 别名，供新增进展 refs 前向引用。
 * - 校验失败就近报错、保留输入；成功不写盘，envelope 经 onDraft 上抛。
 * 不 import core；正文 MarkdownView 安全 AST，无 innerHTML。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createOpsSession,
  validateOps,
  buildDraftOps,
  type OpsSession,
  type TaskDraftOps,
} from './b2-ops.js'
import { stageAsset, cancelStagedAsset, StageUnavailable } from './stage-client.js'
import { buildAssetDownloadUrl } from './asset-client.js'
import { reconcileStagedCleanup } from './staged-lifecycle.js'
import {
  collectTaskMaterials,
  attachmentDisplay,
  visibleProgressLog,
  currentRevision,
  progressDisplayDate,
  formatBytes,
  shortHash,
  type MirrorTask,
} from './task-materials-mirror.js'
import { MarkdownView } from './markdown-view.js'

export interface DraftDeliverableOption {
  id: string
  name: string
  version?: string
}

export interface TaskDraftMaterialsProps {
  /** 既有任务（编辑）；新建传 undefined。 */
  task?: MirrorTask
  deliverableOptions: DraftDeliverableOption[]
  /** B3：暂存路由已注册才显示文件暂存输入（capabilities.stageCancel）。 */
  stageEnabled?: boolean
  /** B3：当前任务 id，供已存文件下载 URL 拼 taskId。 */
  taskId?: string
  /** B3：仅 capabilities.assetDownload 为真，已存文件才渲染下载链接，否则仅元信息。 */
  downloadEnabled?: boolean
  /** B3：父级命令成功同步置 true 的可变 ref；卸载据此跳过已消费暂存的 DELETE。 */
  submissionRef?: { current: boolean }
  /** 每次动作后上抛最新 envelope（无改动为 null）与校验错误；TaskForm 在 submit 合并。 */
  onDraft: (envelope: { draft: TaskDraftOps } | null, errors: string[]) => void
}

interface StagedRow {
  clientId: string
  stageId: string
  fileName: string
  size: number
  sha256: string
  expiresAt: string
}

function fmtDate(iso: string | undefined): string {
  return (iso ?? '').slice(0, 10)
}

export function TaskDraftMaterials({ task, deliverableOptions, stageEnabled, taskId, downloadEnabled = false, submissionRef, onDraft }: TaskDraftMaterialsProps) {
  const sessionRef = useRef<OpsSession | null>(null)
  if (!sessionRef.current) sessionRef.current = createOpsSession()
  const session = sessionRef.current

  const [, bump] = useState(0)
  const rerender = () => bump(n => n + 1)
  const publish = () => {
    const v = validateOps(session.attachmentOps, session.progressOps)
    const envelope = buildDraftOps(session.attachmentOps, session.progressOps)
    onDraft(envelope, v.errors)
  }

  // ---- B3 暂存文件（无 taskId 暂存；提交成功后端 finalize，取消 best-effort 回收） ----
  const [stagedRows, setStagedRows] = useState<StagedRow[]>([])
  const [staging, setStaging] = useState(false)
  const [fileError, setFileError] = useState('')
  const rowsRef = useRef<StagedRow[]>([])
  rowsRef.current = stagedRows
  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  // 仅在组件真正卸载（取消/关闭抽屉）时中止在途上传并按纯决策回收未消费暂存；
  // 普通重渲染不触发；失败由 TTL sweep 兜底，不阻断关闭。
  useEffect(() => () => {
    abortRef.current?.abort()
    const submitted = submissionRef?.current ?? false
    const plan = reconcileStagedCleanup(rowsRef.current, submitted)
    for (const stageId of plan.cancel) void cancelStagedAsset(stageId)
  }, [])

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    setFileError('')
    setStaging(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const stage = await stageAsset({ body: file, fileName: file.name, mediaType: file.type || undefined, signal: controller.signal })
      const clientId = session.addFile({ stageId: stage.stageId })
      setStagedRows(prev => [...prev, {
        clientId,
        stageId: stage.stageId,
        fileName: stage.fileName,
        size: stage.size,
        sha256: stage.sha256,
        expiresAt: stage.expiresAt,
      }])
      rerender(); publish()
    } catch (error) {
      if (controller.signal.aborted) return
      if (error instanceof StageUnavailable && error.reason === 'expired') {
        setFileError('暂存已过期，请重新选择文件上传')
      } else {
        setFileError(error instanceof Error ? error.message : '文件暂存失败')
      }
      // 重置 input，允许直接重选同一文件重试。
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      abortRef.current = null
      setStaging(false)
    }
  }

  const removeStaged = (row: StagedRow) => {
    session.forgetClient(row.clientId)
    void cancelStagedAsset(row.stageId)
    setStagedRows(prev => prev.filter(r => r.stageId !== row.stageId))
    rerender(); publish()
  }

  // ---- 新增资料：链接 ----
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkNote, setLinkNote] = useState('')
  // ---- 新增资料：交付物 ----
  const [dlvId, setDlvId] = useState('')
  const [dlvNote, setDlvNote] = useState('')
  // ---- 新增进展 ----
  const [pAuthor, setPAuthor] = useState('')
  const [pDate, setPDate] = useState('')
  const [pContent, setPContent] = useState('')
  const [pRefs, setPRefs] = useState<string[]>([])
  // ---- 内联编辑既有进展 ----
  const [editId, setEditId] = useState<string | null>(null)
  const [editAuthor, setEditAuthor] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editDate, setEditDate] = useState('')
  // ---- 改注既有资料 ----
  const [noteEditId, setNoteEditId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [titleText, setTitleText] = useState('')
  const [historyOpen, setHistoryOpen] = useState<string | null>(null)
  const [deletedOpen, setDeletedOpen] = useState(false)

  const materials = useMemo(() => collectTaskMaterials(task ?? {}), [task])
  const activeLog = visibleProgressLog(task ?? {})
  const deletedLog = (task?.progressLog ?? []).filter(e => e.deletedAt)

  // 可选 refs：既有 at-N + 本次新增别名 clientId。
  const refOptions = useMemo(() => {
    const existing = (task?.attachments ?? [])
      .filter(a => a.id)
      .map(a => ({ value: a.id!, label: attachmentDisplay(a).label }))
    const stagedByName = new Map(stagedRows.map(r => [r.clientId, r.fileName]))
    const aliases = session.attachmentOps
      .filter(o => o.clientId)
      .map(o => ({
        value: o.clientId!,
        label: o.op === 'addFile'
          ? `新文件（${o.clientId}）${stagedByName.get(o.clientId!) ?? ''}`
          : `新资料（${o.clientId}）${o.op === 'addLink' ? o.url : o.deliverableId ?? ''}`,
      }))
    return [...existing, ...aliases]
  }, [task, session.attachmentOps, stagedRows])

  const addLink = () => {
    session.addLink({ url: linkUrl, title: linkTitle, note: linkNote })
    setLinkUrl(''); setLinkTitle(''); setLinkNote('')
    rerender(); publish()
  }
  const addDeliverable = () => {
    if (!dlvId.trim()) return
    session.addDeliverable({ deliverableId: dlvId, note: dlvNote })
    setDlvId(''); setDlvNote('')
    rerender(); publish()
  }
  const removeAttachment = (id: string) => {
    session.removeAttachment(id)
    rerender(); publish()
  }
  const saveNote = (id: string) => {
    session.updateNote(id, { note: noteText, title: titleText })
    setNoteEditId(null); setNoteText(''); setTitleText('')
    rerender(); publish()
  }
  const addProgress = () => {
    session.addProgress({ author: pAuthor, content: pContent, date: pDate || undefined, refs: pRefs })
    setPAuthor(''); setPDate(''); setPContent(''); setPRefs([])
    rerender(); publish()
  }
  const startEdit = (entryId: string, author: string, content: string, date: string) => {
    setEditId(entryId); setEditAuthor(author); setEditContent(content); setEditDate(date)
  }
  const saveEdit = () => {
    if (!editId) return
    session.editProgress(editId, { author: editAuthor, content: editContent, date: editDate || undefined })
    setEditId(null)
    rerender(); publish()
  }
  const deleteProgress = (id: string) => { session.deleteProgress(id); rerender(); publish() }
  const restoreProgress = (id: string) => { session.restoreProgress(id); rerender(); publish() }

  const staged = session.attachmentOps.length + session.progressOps.length

  return (
    <div className="pm-materials-editor" data-density="compact" data-draft="true">
      <section className="pm-mat-section" aria-label="任务资料（草稿）">
        <h3 className="pm-mat-title">资料{staged > 0 ? `（待提交 ${staged} 项变更）` : ''}</h3>
        {materials.length > 0 && (
          <ul className="pm-mat-list">
            {materials.map((m, i) => {
              const disp = attachmentDisplay(m)
              const key = m.refId || m.url || `mat-${i}`
              const editingNote = noteEditId === m.id
              if (m.kind === 'file') {
                const canDownload = downloadEnabled && Boolean(m.fileId)
                return (
                  <li key={key} className="pm-mat-item pm-materials-file">
                    <svg className="pm-file-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <path fill="currentColor" d="M3 1.5A1.5 1.5 0 0 1 4.5 0h5.2L13 3.3v11.2A1.5 1.5 0 0 1 11.5 16h-7A1.5 1.5 0 0 1 3 14.5v-13zM9.5 1.1 12 3.6H9.5V1.1z"/>
                    </svg>
                    {canDownload ? (
                      <a className="pm-mat-text pm-file-download"
                        href={buildAssetDownloadUrl(m.fileId!, taskId)} download={disp.label} rel="noopener noreferrer">
                        {disp.label}
                      </a>
                    ) : (
                      <span className="pm-mat-text">{disp.label}</span>
                    )}
                    {m.size ? <span className="pm-muted pm-materials-meta">{formatBytes(m.size)}</span> : null}
                    {m.note?.trim() && <span className="pm-muted pm-mat-note">{m.note.trim()}</span>}
                  </li>
                )
              }
              return (
                <li key={key} className="pm-mat-item">
                  {disp.href
                    ? <a href={disp.href} target="_blank" rel="noopener noreferrer">{disp.label}</a>
                    : <span className="pm-mat-text">{disp.label}</span>}
                  {m.note?.trim() && <span className="pm-muted pm-mat-note">{m.note.trim()}</span>}
                  {m.id && (
                    editingNote ? (
                      <span className="pm-mat-note-edit">
                        <input value={titleText} onChange={e => setTitleText(e.currentTarget.value)}
                          placeholder="标题（仅链接）" aria-label="资料标题"/>
                        <input value={noteText} onChange={e => setNoteText(e.currentTarget.value)}
                          placeholder="备注" aria-label="资料备注"/>
                        <button type="button" className="pm-button" onClick={() => saveNote(m.id!)}>保存</button>
                        <button type="button" className="pm-button" onClick={() => setNoteEditId(null)}>取消</button>
                      </span>
                    ) : (
                      <span className="pm-mat-actions">
                        <button type="button" className="pm-mat-link"
                          onClick={() => { setNoteEditId(m.id!); setNoteText(m.note ?? ''); setTitleText(m.title ?? '') }}>改注</button>
                        <button type="button" className="pm-mat-remove" onClick={() => removeAttachment(m.id!)}>移除</button>
                      </span>
                    )
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div className="pm-mat-form">
          <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.currentTarget.value)}
            placeholder="https://… 资料链接" aria-label="资料链接地址"/>
          <input type="text" value={linkTitle} onChange={e => setLinkTitle(e.currentTarget.value)}
            placeholder="标题（可选）" aria-label="链接标题"/>
          <input type="text" value={linkNote} onChange={e => setLinkNote(e.currentTarget.value)}
            placeholder="备注（可选）" aria-label="链接备注"/>
          <button type="button" className="pm-button" onClick={addLink}>加链接</button>
        </div>
        <div className="pm-mat-form">
          <select value={dlvId} onChange={e => setDlvId(e.currentTarget.value)} aria-label="选择交付物">
            <option value="">选择交付物（可选）</option>
            {deliverableOptions.map(d => (
              <option key={d.id} value={d.id}>{d.name}{d.version ? `（${d.version}）` : ''}</option>
            ))}
          </select>
          <input type="text" value={dlvNote} onChange={e => setDlvNote(e.currentTarget.value)}
            placeholder="备注（可选）" aria-label="交付物备注"/>
          <button type="button" className="pm-button" onClick={addDeliverable}>关联交付物</button>
        </div>

        {stageEnabled && (
          <div className="pm-mat-form pm-file-stage">
            <label className="pm-file-pick">
              <input ref={fileInputRef} type="file" disabled={staging} onChange={e => void onPickFile(e.target.files?.[0])}
                aria-label="选择文件暂存（提交时随任务保存）"/>
              <span>{staging ? '上传暂存中…' : '选择文件（暂存，提交时保存）'}</span>
            </label>
            {fileError && <span className="pm-prog-danger" role="alert">{fileError}</span>}
          </div>
        )}
        {stagedRows.length > 0 && (
          <ul className="pm-mat-list pm-staged-list">
            {stagedRows.map(row => (
              <li key={row.stageId} className="pm-mat-item pm-materials-file">
                <svg className="pm-file-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path fill="currentColor" d="M3 1.5A1.5 1.5 0 0 1 4.5 0h5.2L13 3.3v11.2A1.5 1.5 0 0 1 11.5 16h-7A1.5 1.5 0 0 1 3 14.5v-13zM9.5 1.1 12 3.6H9.5V1.1z"/>
                </svg>
                <span className="pm-materials-text">{row.fileName}</span>
                {row.size > 0 && <span className="pm-muted pm-materials-meta">{formatBytes(row.size)}</span>}
                {row.sha256 && <span className="pm-muted pm-materials-meta" title={row.sha256}>sha {shortHash(row.sha256)}</span>}
                <span className="pm-mat-actions">
                  <button type="button" className="pm-mat-remove" onClick={() => removeStaged(row)}>移除暂存</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pm-mat-section" aria-label="进展日志（草稿）">
        <h3 className="pm-mat-title">进展日志</h3>
        <ol className="pm-prog-list">
          {activeLog.map(entry => {
            const cur = currentRevision(entry)
            const expanded = historyOpen === entry.id
            const editing = editId === entry.id
            return (
              <li key={entry.id} className="pm-prog-entry">
                <div className="pm-prog-head">
                  <span className="pm-prog-date">{fmtDate(progressDisplayDate(entry))}</span>
                  <span className="pm-prog-author">{cur.author}</span>
                  <button type="button" className="pm-prog-link"
                    onClick={() => setHistoryOpen(expanded ? null : entry.id)}>
                    {expanded ? '收起历史' : `历史（${entry.revisions.length} 版）`}
                  </button>
                  <button type="button" className="pm-prog-link"
                    onClick={() => startEdit(entry.id, cur.author, cur.content, cur.date)}>编辑</button>
                  <button type="button" className="pm-prog-link pm-prog-danger"
                    onClick={() => deleteProgress(entry.id)}>删除</button>
                </div>
                {editing ? (
                  <div className="pm-prog-edit">
                    <input type="text" value={editAuthor} onChange={e => setEditAuthor(e.currentTarget.value)}
                      placeholder="作者" aria-label="修订作者"/>
                    <input type="date" value={editDate} onChange={e => setEditDate(e.currentTarget.value)} aria-label="修订日期"/>
                    <textarea rows={3} value={editContent} onChange={e => setEditContent(e.currentTarget.value)}
                      placeholder="修订正文（追加新版本，不改写旧版）"/>
                    <div className="pm-prog-edit-actions">
                      <button type="button" className="pm-button pm-button-primary" onClick={saveEdit}>保存修订</button>
                      <button type="button" className="pm-button" onClick={() => setEditId(null)}>取消</button>
                    </div>
                  </div>
                ) : (
                  <MarkdownView source={cur.content} density="compact"/>
                )}
                {expanded && (
                  <div className="pm-prog-history">
                    {entry.revisions.map((rv, idx) => (
                      <div key={rv.id} className="pm-prog-rev">
                        <div className="pm-prog-head">
                          <span className="pm-prog-date">v{idx + 1} · {fmtDate(rv.revisedAt || rv.date)}</span>
                          <span className="pm-prog-author">{rv.author}</span>
                        </div>
                        <MarkdownView source={rv.content} density="compact"/>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        <div className="pm-mat-form pm-prog-add">
          <input type="text" value={pAuthor} onChange={e => setPAuthor(e.currentTarget.value)}
            placeholder="作者" aria-label="进展作者"/>
          <input type="date" value={pDate} onChange={e => setPDate(e.currentTarget.value)} aria-label="进展日期"/>
          <textarea rows={2} value={pContent} onChange={e => setPContent(e.currentTarget.value)}
            placeholder="记录本次进展（Markdown）" aria-label="进展正文"/>
          {refOptions.length > 0 && (
            <div className="pm-prog-refs">
              {refOptions.map(r => (
                <label key={r.value} className="pm-prog-ref">
                  <input type="checkbox" checked={pRefs.includes(r.value)}
                    onChange={e => setPRefs(prev => e.currentTarget.checked ? [...prev, r.value] : prev.filter(v => v !== r.value))}/>
                  {r.label}
                </label>
              ))}
            </div>
          )}
          <button type="button" className="pm-button pm-button-primary" onClick={addProgress}>追加进展（草稿）</button>
        </div>

        {deletedLog.length > 0 && (
          <div className="pm-prog-deleted">
            <button type="button" className="pm-prog-link" onClick={() => setDeletedOpen(!deletedOpen)}>
              {deletedOpen ? '收起已删除' : `已删除（${deletedLog.length}）`}
            </button>
            {deletedOpen && (
              <ul className="pm-prog-list">
                {deletedLog.map(entry => (
                  <li key={entry.id} className="pm-prog-entry pm-prog-entry--deleted">
                    <div className="pm-prog-head">
                      <span className="pm-prog-date">{entry.date}</span>
                      <span className="pm-prog-author">{entry.author}</span>
                      <span className="pm-muted">已软删（{entry.revisions.length} 版保留）</span>
                      <button type="button" className="pm-prog-link" onClick={() => restoreProgress(entry.id)}>恢复</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
