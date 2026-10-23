import { useLayoutEffect, useRef, useState } from 'react'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle.mjs'
import Check from 'lucide-react/dist/esm/icons/check.mjs'
import X from 'lucide-react/dist/esm/icons/x.mjs'
import { classifyFeedback, extractBackupPath, shouldPersistResultCard, type FeedbackContext } from '../core/ui-feedback.js'
import { copyResultText, type ClipboardWriter } from './result-card-copy.js'

/** 只认原因开头的明确权限拒绝，不把排查建议或引用正文当作诊断。 */
function hasPermissionDenialReason(message: string): boolean {
  const reason = message.trimStart()
    .replace(/^(?:执行失败|备份\/恢复失败|备份失败|恢复失败)[：:]\s*/, '')
    .replace(/^Error:\s*/i, '')
  return /^(?:权限不足|无权|\b(?:EACCES|EPERM)\b|permission denied\b)/i.test(reason)
}

/** 共用结果卡；复制状态属于本条原文，迟到的旧复制不能改变新原文反馈。 */
export function ResultCard({ message, context, messageGeneration, onClose, onAction, writeText }: {
  message: string
  context?: FeedbackContext
  messageGeneration?: number
  onClose: () => void
  onAction: (command: string) => void
  writeText?: ClipboardWriter
}) {
  const fb = classifyFeedback(message, context)
  const [detailOpen, setDetailOpen] = useState(false)
  const [copyState, setCopyState] = useState<'copied' | 'failed' | null>(null)
  const generation = useRef(0)
  useLayoutEffect(() => {
    generation.current += 1
    setDetailOpen(false)
    setCopyState(null)
    return () => { generation.current += 1 }
  }, [message, context?.kind, messageGeneration])
  const path = extractBackupPath(message)
  const isError = fb.isError
  if (!shouldPersistResultCard(fb, path)) return null
  const showInlineRaw = !fb.structured
  const isPermissionDenied = isError && hasPermissionDenialReason(message)
  const copy = async (value: string) => {
    const requestGeneration = generation.current
    const copied = await copyResultText(value, writeText)
    if (requestGeneration === generation.current) setCopyState(copied ? 'copied' : 'failed')
  }
  return (
    <div className={`pm-result-card${isError ? ' pm-result-card--error' : ''}`}
      role={isError ? 'alert' : 'status'} aria-live={isError ? 'assertive' : 'polite'}>
      <div className="pm-result-card__bar">
        {isError ? <AlertTriangle size={15}/> : <Check size={15}/>}
        <div className="pm-result-card__summary">
          {isPermissionDenied && <div className="pm-result-card__kind">权限不足</div>}
          {showInlineRaw ? message : fb.summary.join('\n')}
        </div>
        <button className="pm-plain-icon" aria-label="关闭结果卡" onClick={onClose}><X size={14}/></button>
      </div>
      {fb.detail && (
        <>
          <button className="pm-result-card__toggle" aria-expanded={detailOpen}
            onClick={() => setDetailOpen(v => !v)}>{detailOpen ? '收起详情 ▴' : '详情 ▾'}</button>
          {detailOpen ? <pre className="pm-result-card__detail">{fb.detail}</pre> : null}
        </>
      )}
      {fb.action && (
        <div className="pm-result-card__actions">
          <button className="pm-result-action" onClick={() => onAction(fb.action!.command)}>{fb.action.label}</button>
        </div>
      )}
      <div className="pm-result-card__actions">
        <button className="pm-result-card__copy" onClick={() => { void copy(message) }}>复制原文</button>
        {path && <button className="pm-result-card__copy" onClick={() => { void copy(path) }}>复制路径</button>}
        {copyState && (
          <span className={`pm-result-card__copy-state pm-result-card__copy-state--${copyState}`} role="status">
            {copyState === 'copied' ? '已复制' : '复制失败，请手动复制'}
          </span>
        )}
      </div>
    </div>
  )
}
