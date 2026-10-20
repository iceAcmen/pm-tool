/**
 * B2 任务「资料 + 进展记录」只读展示组件（独立可编译，不依赖 records/growth）。
 *
 * 边界：
 * - 纯只读，消费已绿的 task-materials-mirror 派生（attachments[] / progressLog[] 归一、软删过滤、去重）；
 * - 不发命令、不写盘、不持有 draft；写动作（link/deliverable/progress add|edit|delete|restore、
 *   task update 原子提交）由下一批在 panel 回调里接 data 原子命令，本组件不承载。
 * - 正文统一走 MarkdownView（安全 AST，无 innerHTML）；链接用 safeHref 结果，非 http/https 降级纯文本。
 */
import {
  collectTaskMaterials,
  attachmentDisplay,
  visibleProgressLog,
  currentRevision,
  effectiveAt,
  formatBytes,
  shortHash,
  type MirrorTask,
} from './task-materials-mirror.js'
import { buildAssetDownloadUrl } from './asset-client.js'
import { MarkdownView } from './markdown-view.js'

export interface TaskMaterialsViewProps {
  task: MirrorTask
  /** 紧凑密度（抽屉内）；默认 detail。 */
  density?: 'compact' | 'detail'
  /** B3：当前任务 id，供下载 URL 拼 taskId 查询；缺省仅显示元信息。 */
  taskId?: string
  /** B3：仅 capabilities.assetDownload 为真才渲染下载链接，否则只展示元信息（无链接）。 */
  downloadEnabled?: boolean
}

/** 日期归一显示：优先有效时间，缺省空串；不做时区换算。 */
function fmtDate(iso: string | undefined): string {
  return (iso ?? '').slice(0, 10)
}

export function TaskMaterialsView({ task, density = 'compact', taskId, downloadEnabled = false }: TaskMaterialsViewProps) {
  const materials = collectTaskMaterials(task)
  const log = visibleProgressLog(task)
  if (materials.length === 0 && log.length === 0) return null

  return (
    <div className="pm-materials-view" data-density={density}>
      {materials.length > 0 && (
        <section className="pm-materials-section" aria-label="任务资料">
          <h3 className="pm-materials-title">资料</h3>
          <ul className="pm-materials-list">
            {materials.map((m, i) => {
              const disp = attachmentDisplay(m)
              const key = m.refId || m.url || m.fileId || `mat-${i}`
              if (m.kind === 'file') {
                const size = formatBytes(m.size)
                const hash = shortHash(m.hash)
                return (
                  <li key={key} className="pm-materials-item pm-materials-file">
                    <svg className="pm-file-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <path fill="currentColor" d="M3 1.5A1.5 1.5 0 0 1 4.5 0h5.2L13 3.3v11.2A1.5 1.5 0 0 1 11.5 16h-7A1.5 1.5 0 0 1 3 14.5v-13zM9.5 1.1 12 3.6H9.5V1.1z"/>
                    </svg>
                    {downloadEnabled && m.fileId
                      ? (
                        <a className="pm-materials-text pm-file-download"
                          href={buildAssetDownloadUrl(m.fileId, taskId)}
                          download={disp.label} rel="noopener noreferrer">
                          {disp.label}
                        </a>
                      )
                      : <span className="pm-materials-text">{disp.label}</span>}
                    {size && <span className="pm-muted pm-materials-meta">{size}</span>}
                    {hash && <span className="pm-muted pm-materials-meta" title={m.hash}>sha {hash}</span>}
                    {m.note?.trim() && <span className="pm-muted pm-materials-note">{m.note.trim()}</span>}
                  </li>
                )
              }
              return (
                <li key={key} className="pm-materials-item">
                  {disp.href ? (
                    <a href={disp.href} target="_blank" rel="noopener noreferrer">{disp.label}</a>
                  ) : (
                    <span className="pm-materials-text">{disp.label}</span>
                  )}
                  {m.note?.trim() && <span className="pm-muted pm-materials-note">{m.note.trim()}</span>}
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {log.length > 0 && (
        <section className="pm-materials-section" aria-label="进展记录">
          <h3 className="pm-materials-title">进展记录</h3>
          <ol className="pm-progress-log">
            {log.map(entry => {
              const rev = currentRevision(entry)
              const when = fmtDate(effectiveAt(entry) || entry.date)
              const multi = entry.revisions.length > 1
              return (
                <li key={entry.id} className="pm-progress-entry">
                  <div className="pm-progress-head">
                    <span className="pm-progress-date">{when}</span>
                    {rev.author?.trim() && <span className="pm-progress-author">{rev.author.trim()}</span>}
                    {multi && <span className="pm-muted pm-progress-revs">{`${entry.revisions.length} 个版本`}</span>}
                  </div>
                  {rev.content?.trim()
                    ? <MarkdownView source={rev.content} density={density}/>
                    : <p className="pm-muted pm-progress-empty">（无正文）</p>}
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </div>
  )
}
