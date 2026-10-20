/**
 * B2 资料区 / 进展日志编辑器（独立组件，panel 在 TaskForm 内挂载）。
 *
 * 写动作全部走 core 专用命令（b2-commands 构造），不在此拼顶层 attachments/progressLog：
 *   material link | deliverable | remove；progress add | edit | delete(soft) | restore。
 * 表单一次性保存的 basic 字段仍由 TaskForm 的 task update 负责；本组件只做单项快速操作。
 *
 * 行为约束：
 * - 前置校验失败不调用 run()、保留本地输入；命令返回 error（run=false）不关抽屉、不清输入；
 * - 成功后 onChanged() 让 panel 刷新任务快照；正文统一 MarkdownView（安全 AST，无 innerHTML）；
 * - 软删条目不隐藏：单独「已删除」区可展开并 restore，revision 全保留；历史每版可回看。
 */
import { useState } from 'react'
import {
  collectTaskMaterials,
  attachmentDisplay,
  visibleProgressLog,
  currentRevision,
  effectiveAt,
  type MirrorTask,
  type MirrorProgressEntry,
} from './task-materials-mirror.js'
import { MarkdownView } from './markdown-view.js'
import {
  b2LinkValid,
  b2AuthorValid,
  b2ContentValid,
  materialLinkCmd,
  materialDeliverableCmd,
  materialRemoveCmd,
  progressAddCmd,
  progressEditCmd,
  progressDeleteCmd,
  progressRestoreCmd,
} from './b2-commands.js'

export interface DeliverableOption {
  id: string
  name: string
  version?: string
}

export interface TaskMaterialsEditorProps {
  taskId: string
  task: MirrorTask
  deliverableOptions: DeliverableOption[]
  busy?: boolean
  run: (cmd: string) => Promise<boolean>
  /** 写成功后刷新任务快照（panel refresh）。 */
  onChanged: () => void
  /** 就近/全局展示错误文本（命令失败时）。 */
  onError: (text: string) => void
}

function fmtDate(iso: string | undefined): string {
  return (iso ?? '').slice(0, 10)
}

export function TaskMaterialsEditor({
  taskId, task, deliverableOptions, busy, run, onChanged, onError,
}: TaskMaterialsEditorProps) {
  // ---- 资料：加链接 ----
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkNote, setLinkNote] = useState('')
  // ---- 资料：关联交付物 ----
  const [dlvId, setDlvId] = useState('')
  const [dlvNote, setDlvNote] = useState('')
  // ---- 进展：新增 ----
  const [pAuthor, setPAuthor] = useState('')
  const [pContent, setPContent] = useState('')
  const [pDate, setPDate] = useState('')
  // ---- 进展：内联编辑（按 entryId 开） ----
  const [editId, setEditId] = useState<string | null>(null)
  const [editAuthor, setEditAuthor] = useState('')
  const [editContent, setEditContent] = useState('')
  const [historyOpen, setHistoryOpen] = useState<string | null>(null)
  const [deletedOpen, setDeletedOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const materials = collectTaskMaterials(task)
  const activeLog = visibleProgressLog(task)
  const deletedLog = (task.progressLog ?? []).filter(e => e.deletedAt)

  const guard = (ok: boolean, msg: string): boolean => {
    if (!ok) { onError(msg); return false }
    return true
  }

  const act = async (cmd: string): Promise<boolean> => {
    setPending(true)
    try {
      const ok = await run(cmd)
      if (ok) onChanged()
      return ok
    } finally {
      setPending(false)
    }
  }

  const submitLink = async () => {
    if (!guard(b2LinkValid(linkUrl), '链接须为 http/https，且不含空白或特殊字符。')) return
    await act(materialLinkCmd(taskId, { url: linkUrl, title: linkTitle, note: linkNote }))
  }

  const submitDeliverable = async () => {
    if (!guard(!!dlvId.trim(), '请选择要关联的交付物。')) return
    await act(materialDeliverableCmd(taskId, { deliverableId: dlvId, note: dlvNote }))
  }

  const removeMaterial = async (attachmentId: string) => {
    await act(materialRemoveCmd(taskId, attachmentId))
  }

  const submitProgressAdd = async () => {
    if (!guard(b2AuthorValid(pAuthor), '请填写进展作者。')) return
    if (!guard(b2ContentValid(pContent), '进展正文不能为空。')) return
    await act(progressAddCmd(taskId, { author: pAuthor, content: pContent, date: pDate || undefined }))
  }

  const startEdit = (entry: MirrorProgressEntry) => {
    setEditId(entry.id)
    const cur = currentRevision(entry)
    setEditAuthor(cur.author)
    setEditContent(cur.content)
  }

  const submitEdit = async (entryId: string) => {
    if (!guard(b2AuthorValid(editAuthor), '请填写作者。')) return
    if (!guard(b2ContentValid(editContent), '正文不能为空。')) return
    const ok = await act(progressEditCmd(taskId, entryId, { author: editAuthor, content: editContent }))
    if (ok) setEditId(null)
  }

  const softDelete = async (entryId: string) => {
    await act(progressDeleteCmd(taskId, entryId))
  }

  const restore = async (entryId: string) => {
    await act(progressRestoreCmd(taskId, entryId))
  }

  const disabled = busy || pending

  return (
    <div className="pm-materials-editor" data-density="compact">
      {/* ===== 资料 ===== */}
      <section className="pm-mat-section" aria-label="任务资料">
        <h3 className="pm-mat-title">资料</h3>
        {materials.length > 0 && (
          <ul className="pm-mat-list">
            {materials.map((m, i) => {
              const disp = attachmentDisplay(m)
              const key = m.refId || m.url || m.fileId || `mat-${i}`
              if (m.kind === 'file') {
                // B3：文件元数据只读展示；attachmentOps 不含 addFile/remove，路由原子挂载，此处不提供操作。
                return (
                  <li key={key} className="pm-mat-item">
                    <span className="pm-mat-text">{disp.label}</span>
                    {m.size != null && <span className="pm-muted pm-mat-note">{m.size} B</span>}
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
                    <button type="button" className="pm-mat-remove" disabled={disabled}
                      onClick={() => removeMaterial(m.id!)}>移除</button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div className="pm-mat-form">
          <label className="pm-mat-field">
            <span className="pm-mat-label">资料链接</span>
            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.currentTarget.value)}
              placeholder="https://…" aria-label="资料链接地址"/>
          </label>
          <label className="pm-mat-field">
            <span className="pm-mat-label">标题（可选）</span>
            <input type="text" value={linkTitle} onChange={e => setLinkTitle(e.currentTarget.value)}
              placeholder="链接标题" aria-label="链接标题"/>
          </label>
          <label className="pm-mat-field">
            <span className="pm-mat-label">备注（可选）</span>
            <input type="text" value={linkNote} onChange={e => setLinkNote(e.currentTarget.value)}
              placeholder="链接备注" aria-label="链接备注"/>
          </label>
          <button type="button" className="pm-button" disabled={disabled} onClick={submitLink}>加链接</button>
        </div>
        <div className="pm-mat-form">
          <label className="pm-mat-field">
            <span className="pm-mat-label">交付物</span>
            <select value={dlvId} onChange={e => setDlvId(e.currentTarget.value)} aria-label="选择交付物">
              <option value="">选择交付物（可选）</option>
              {deliverableOptions.map(d => (
                <option key={d.id} value={d.id}>{d.name}{d.version ? `（${d.version}）` : ''}</option>
              ))}
            </select>
          </label>
          <label className="pm-mat-field">
            <span className="pm-mat-label">备注（可选）</span>
            <input type="text" value={dlvNote} onChange={e => setDlvNote(e.currentTarget.value)}
              placeholder="交付物备注" aria-label="交付物备注"/>
          </label>
          <button type="button" className="pm-button" disabled={disabled} onClick={submitDeliverable}>关联交付物</button>
        </div>
      </section>

      {/* ===== 进展日志 ===== */}
      <section className="pm-mat-section" aria-label="进展日志">
        <h3 className="pm-mat-title">进展日志</h3>
        <ol className="pm-prog-list">
          {activeLog.map(entry => {
            const cur = currentRevision(entry)
            const expanded = historyOpen === entry.id
            const editing = editId === entry.id
            return (
              <li key={entry.id} className="pm-prog-entry">
                <div className="pm-prog-head">
                  <span className="pm-prog-date">{fmtDate(effectiveAt(entry) || entry.date)}</span>
                  <span className="pm-prog-author">{cur.author}</span>
                  <button type="button" className="pm-prog-link" disabled={disabled}
                    onClick={() => setHistoryOpen(expanded ? null : entry.id)}>
                    {expanded ? '收起历史' : `历史（${entry.revisions.length} 版）`}
                  </button>
                  <button type="button" className="pm-prog-link" disabled={disabled}
                    onClick={() => startEdit(entry)}>编辑</button>
                  <button type="button" className="pm-prog-link pm-prog-danger" disabled={disabled}
                    onClick={() => softDelete(entry.id)}>删除</button>
                </div>
                {editing ? (
                  <div className="pm-prog-edit">
                    <input type="text" value={editAuthor} onChange={e => setEditAuthor(e.currentTarget.value)}
                      placeholder="作者" aria-label="修订作者"/>
                    <textarea rows={3} value={editContent} onChange={e => setEditContent(e.currentTarget.value)}
                      placeholder="修订正文（追加新版本，不改写旧版）"/>
                    <div className="pm-prog-edit-actions">
                      <button type="button" className="pm-button" disabled={disabled}
                        onClick={() => submitEdit(entry.id)}>保存修订</button>
                      <button type="button" className="pm-button" disabled={disabled}
                        onClick={() => setEditId(null)}>取消</button>
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
          <button type="button" className="pm-button" disabled={disabled} onClick={submitProgressAdd}>追加进展</button>
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
                      <button type="button" className="pm-prog-link" disabled={disabled}
                        onClick={() => restore(entry.id)}>恢复</button>
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
