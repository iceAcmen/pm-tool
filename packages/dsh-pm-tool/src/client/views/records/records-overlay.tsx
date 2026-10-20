/**
 * B6 records 视图内受控弹层外壳。
 *
 * 复用 panel.css 全局 `.pm-drawer-layer / .pm-drawer-scrim / .pm-drawer / .pm-drawer-body`
 * （token 化、深浅跟随），不自造遮罩色。仅在视图拿到可选 records 回调时由视图内部打开；
 * 未接线时视图仍走原有 onCreate/onEdit 交给 panel 抽屉。外壳只负责布局/关闭，不含写逻辑。
 */
import { useEffect, type ReactNode } from 'react'

export interface RecordsOverlayProps {
  eyebrow: string
  title: string
  onClose: () => void
  children: ReactNode
}

export function RecordsOverlay({ eyebrow, title, onClose, children }: RecordsOverlayProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="pm-drawer-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="pm-drawer-scrim" aria-label="关闭" onClick={onClose} />
      <div className="pm-drawer">
        <header>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </header>
        <div className="pm-drawer-body">{children}</div>
      </div>
    </div>
  )
}
