/**
 * B6 records 应用内确定性 listbox（替代原生闭合 <select>）。
 *
 * 纯受控：value/options/onChange 由父组件传入；不写盘、不发请求。
 * 支持搜索过滤、ArrowUp/Down 环形移动、Enter 选中、Escape 关闭；全局 :focus-visible 环由壳层提供。
 * 选项模型复用 records-options 的纯函数，保证过滤/高亮与单测口径一致。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import css from '../records.css?raw'
import { filterOptions, moveHighlight, type RecordOption } from './records-options.js'

export interface RecordsListboxProps {
  id: string
  value: string | null
  options: readonly RecordOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** 无匹配时的提示文案。 */
  emptyText?: string
  /** 是否显示搜索框（长选项如负责人/里程碑开启；短状态可关）。 */
  searchable?: boolean
  ariaLabel?: string
}

export function RecordsListbox(props: RecordsListboxProps) {
  const {
    id, value, options, onChange,
    placeholder = '请选择', disabled = false,
    emptyText = '无匹配项', searchable = false, ariaLabel,
  } = props

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => filterOptions(options, searchable ? query : ''), [options, query, searchable])
  const currentLabel = options.find(o => o.value === value)?.label ?? ''

  useEffect(() => {
    if (open && searchable) {
      searchRef.current?.focus()
    }
  }, [open, searchable])

  // 打开时高亮当前值所在项。
  useEffect(() => {
    if (open) {
      const idx = filtered.findIndex(o => o.value === value)
      setActive(idx)
    } else {
      setQuery('')
    }
  }, [open, filtered, value])

  const choose = (option: RecordOption) => {
    onChange(option.value)
    setOpen(false)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setOpen(true)
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive(a => moveHighlight(a, filtered.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(a => moveHighlight(a, filtered.length, -1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const pick = active >= 0 ? filtered[active] : filtered[0]
      if (pick) choose(pick)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="rb-lb" ref={rootRef}>
      <style>{css}</style>
      <button
        type="button"
        id={id}
        className="rb-lb-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        onKeyDown={onKeyDown}
      >
        <span className={currentLabel ? 'rb-lb-value' : 'rb-lb-value rb-lb-placeholder'}>
          {currentLabel || placeholder}
        </span>
        <span className="rb-lb-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <>
          <div className="rb-lb-backdrop" onClick={event => {
            // 外层 label 的默认激活会再点 trigger，抵消本次关闭。
            event.preventDefault()
            setOpen(false)
          }} />
          <div className="rb-lb-menu" role="listbox" aria-label={ariaLabel}>
            {searchable && (
              <input
                ref={searchRef}
                className="rb-lb-search"
                type="text"
                placeholder="筛选…"
                aria-label="筛选选项"
                value={query}
                onChange={e => { setQuery(e.currentTarget.value); setActive(-1) }}
              />
            )}
            {filtered.length === 0 && <div className="rb-lb-empty">{emptyText}</div>}
            {filtered.map((option, idx) => (
              <button
                type="button"
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`rb-lb-option${idx === active ? ' is-active' : ''}${option.value === value ? ' is-selected' : ''}`}
                onMouseEnter={() => setActive(idx)}
                onClick={event => {
                  // 选项卸载后的外层 label 默认激活会再次点击 trigger。
                  event.preventDefault()
                  choose(option)
                }}
              >
                <span>{option.label}</span>
                {option.hint && <span className="rb-lb-hint">{option.hint}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
