// §5.3 Confirm：替代原生 window.confirm 的阻断式自定义确认（随 PmPanel 树渲染，fixed 浮层）。
// 展示对象类型 + 标题 + ID + 级联/影响数；danger 确认；ESC/取消；焦点归还；防重复提交。
import { useEffect, useRef, useState } from 'react'

export interface ConfirmOptions {
  /** 对话框标题（默认「请确认」）。 */
  title?: string
  /** 对象类型，如「项目」「任务」「里程碑」。 */
  objectType?: string
  /** 对象标题。 */
  objectTitle?: string
  /** 对象 ID。 */
  objectId?: string
  /** 级联 / 影响说明（未知/将被阻止需明确写出）。 */
  impact?: string
  /** 确认按钮文案（默认「确认删除」）。 */
  confirmLabel?: string
  /** 非破坏（备份/转任务/删已保存视图）：不使用 danger 红色。 */
  neutral?: boolean
  /** 补充说明。 */
  message?: string
}

interface Pending extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

let current: Pending | null = null
const listeners = new Set<() => void>()
function emit() { for (const fn of listeners) fn() }

/** 阻断式确认；返回 true=用户确认，false=取消/ESC。 */
export function confirmDanger(opts: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    current = { ...opts, resolve }
    emit()
  })
}

function settle(ok: boolean) {
  const p = current
  current = null
  emit()
  p?.resolve(ok)
}

/** 在 PmPanel 树内渲染一次；订阅模块级单例状态。 */
export function ConfirmHost() {
  const [, force] = useState(0)
  const okRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<Element | null>(null)

  useEffect(() => {
    const fn = () => force(n => n + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])

  const p = current

  useEffect(() => {
    if (!p) return
    lastFocus.current = document.activeElement
    okRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); settle(false) }
      if (e.key === 'Enter') { e.preventDefault(); settle(true) }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      ;(lastFocus.current as HTMLElement | null)?.focus?.()
    }
  }, [p])

  if (!p) return null

  const neutral = !!p.neutral
  return (
    <div className="pm-confirm-overlay" onMouseDown={e => { if (e.target === e.currentTarget) settle(false) }}>
      <div className={`pm-confirm-dialog${neutral ? ' pm-confirm-neutral' : ' pm-confirm-danger'}`}
        role="dialog" aria-modal="true" aria-labelledby="pm-confirm-title">
        <h2 id="pm-confirm-title" className="pm-confirm-title">{p.title ?? '请确认'}</h2>
        <ul className="pm-confirm-meta">
          {p.objectType && <li><span>对象类型</span><strong>{p.objectType}</strong></li>}
          {p.objectTitle && <li><span>标题</span><strong>{p.objectTitle}</strong></li>}
          {p.objectId && <li><span>ID</span><code>{p.objectId}</code></li>}
        </ul>
        {p.impact && <p className="pm-confirm-impact">{p.impact}</p>}
        {p.message && <p className="pm-confirm-msg">{p.message}</p>}
        <div className="pm-confirm-actions">
          <button type="button" ref={okRef} className={neutral ? 'pm-button pm-button-primary' : 'pm-button pm-button-danger'}
            onClick={() => settle(true)}>
            {p.confirmLabel ?? '确认删除'}
          </button>
          <button type="button" className="pm-button" onClick={() => settle(false)}>取消</button>
        </div>
      </div>
    </div>
  )
}
