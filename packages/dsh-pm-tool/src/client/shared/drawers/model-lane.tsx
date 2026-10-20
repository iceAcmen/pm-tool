/**
 * G-D 模型车道切换（AI 助手 / AI 副驾共用）：PoC 免费网关 vs 生产自有 Key。
 * 视觉为胶囊式 segmented，跟随深浅主题；compact 用于窄栏。
 * 从 panel.tsx 按实体抽离，行为零变更（I6 键盘 roving tabindex 保留）。
 */
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import Zap from 'lucide-react/dist/esm/icons/zap.mjs'
import KeyRound from 'lucide-react/dist/esm/icons/key-round.mjs'

export function LaneSwitcher({ lane, busy, onChange, compact }: {
  lane: 'poc' | 'prod'
  busy?: boolean
  onChange: (lane: 'poc' | 'prod') => void
  compact?: boolean
}) {
  // I6：自定义 tab 完整键盘行为——←/→（↑/↓）循环移动选中并跟随焦点，roving tabindex。
  const order = ['poc', 'prod'] as const
  const onKey = (ev: ReactKeyboardEvent<HTMLDivElement>) => {
    if (busy) return
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft' && ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return
    ev.preventDefault()
    const list = ev.currentTarget
    const idx = order.indexOf(lane)
    const next = order[(idx + (ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : order.length - 1)) % order.length]
    onChange(next)
    requestAnimationFrame(() => {
      const btns = [...list.querySelectorAll<HTMLElement>('[role=tab]')]
      btns[order.indexOf(next)]?.focus()
    })
  }
  return <div className={'pm-lane-switch pm-model-lane' + (compact ? ' is-compact' : '')} role="tablist" aria-label="模型车道" onKeyDown={onKey}>
    <button type="button" role="tab" aria-selected={lane === 'poc'} tabIndex={lane === 'poc' ? 0 : -1} disabled={busy}
      className={'pm-lane-poc' + (lane === 'poc' ? ' is-on' : '')} onClick={() => onChange('poc')}>
      <Zap size={13}/> PoC 免费
    </button>
    <button type="button" role="tab" aria-selected={lane === 'prod'} tabIndex={lane === 'prod' ? 0 : -1} disabled={busy}
      className={'pm-lane-prod' + (lane === 'prod' ? ' is-on' : '')} onClick={() => onChange('prod')}>
      <KeyRound size={13}/> 生产 Key
    </button>
  </div>
}
