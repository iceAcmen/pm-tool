/**
 * 共享安全 Markdown 视图（契约 §3.5）：消费 markdown.ts 的 AST，纯 React 元素输出。
 * 无 innerHTML / 无 eval / 无危险 URL；编辑→预览→存储→详情→导出五环节同一 renderer。
 * 样式复用既有 .pm-md-* 令牌类（panel.css），表格列数由数据内联给定，不写死两列。
 */
import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  parseMarkdownBlocks, parseInline, safeHref,
  lintMarkdownDraft, applyMarkdownFormat,
  type MdBlock, type MdInline, type MarkdownFormatAction,
} from './markdown.js'

function renderInline(node: MdInline, key: number): ReactNode {
  switch (node.kind) {
    case 'text':
      return <Fragment key={key}>{node.text}</Fragment>
    case 'break':
      return <br key={key} />
    case 'code':
      return <code key={key} className="pm-md-code">{node.text}</code>
    case 'bold':
      return <strong key={key}>{node.children.map((c, i) => renderInline(c, i))}</strong>
    case 'italic':
      return <em key={key}>{node.children.map((c, i) => renderInline(c, i))}</em>
    case 'strike':
      return <del key={key}>{node.children.map((c, i) => renderInline(c, i))}</del>
    case 'link': {
      // safeHref 已在解析层过滤协议；这里二次兜底，null 一律降级纯文本。
      const href = safeHref(node.href)
      if (!href) return <Fragment key={key}>{`[${node.text}]`}</Fragment>
      return (
        <a key={key} href={href} target="_blank" rel="noreferrer noopener" className="pm-md-link">
          {node.text}
        </a>
      )
    }
    default:
      return null
  }
}

function renderInlineList(inline: MdInline[]): ReactNode {
  return inline.map((n, i) => renderInline(n, i))
}

function renderBlock(block: MdBlock, key: number): ReactNode {
  switch (block.type) {
    case 'heading': {
      const Tag = (`h${block.level}`) as 'h1'
      return <Tag key={key} className={`pm-md-h${block.level}`}>{renderInlineList(block.inline)}</Tag>
    }
    case 'paragraph':
      return <p key={key} className="pm-md-p">{renderInlineList(block.inline)}</p>
    case 'ul':
      return (
        <ul key={key}>
          {block.items.map((item, i) => <li key={i}>{renderInlineList(item)}</li>)}
        </ul>
      )
    case 'ol':
      return (
        <ol key={key}>
          {block.items.map((item, i) => <li key={i}>{renderInlineList(item)}</li>)}
        </ol>
      )
    case 'task':
      return (
        <ul key={key} className="pm-md-task-list">
          {block.items.map((item, i) => (
            <li key={i} className="pm-md-task">
              <input type="checkbox" disabled checked={item.checked} readOnly aria-label={item.checked ? '已完成' : '未完成'} />
              <span>{renderInlineList(item.inline)}</span>
            </li>
          ))}
        </ul>
      )
    case 'quote':
      return <blockquote key={key} className="pm-md-q">{renderInlineList(block.inline)}</blockquote>
    case 'code':
      return (
        <pre key={key} className="pm-md-pre">
          {block.lang ? <div className="pm-md-pre-lang" aria-hidden="true">{block.lang}</div> : null}
          <code>{block.code}</code>
        </pre>
      )
    case 'table': {
      const cols = Math.max(block.header.length, ...block.rows.map((r) => r.length))
      return (
        <div key={key} className="pm-md-table" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          <div className="pm-md-tr pm-md-tr-head">
            {block.header.map((cell, i) => <span key={i} className="pm-md-th">{renderInlineList(cell)}</span>)}
          </div>
          {block.rows.map((row, ri) => (
            <div key={ri} className="pm-md-tr">
              {row.map((cell, ci) => <span key={ci} className="pm-md-td">{renderInlineList(cell)}</span>)}
            </div>
          ))}
        </div>
      )
    }
    case 'hr':
      return <hr key={key} className="pm-md-hr" />
    default:
      return null
  }
}

export type MarkdownDensity = 'compact' | 'detail'

export interface MarkdownViewProps {
  /** 正文（B 组接缝命名 source；text 为兼容别名，二者等价，优先 source）。 */
  source?: string
  /** @deprecated 兼容别名，等同 source。 */
  text?: string
  className?: string
  /** 密度变体：compact=编辑态紧凑；detail=详情态舒展（只改排版，不改语义/内容）。 */
  density?: MarkdownDensity
}

/** 共享安全 Markdown 渲染入口；空文本不渲染空壳。 */
export function MarkdownView({ source, text, className, density = 'detail' }: MarkdownViewProps) {
  const content = source ?? text ?? ''
  const blocks = parseMarkdownBlocks(content)
  if (!blocks.length) return null
  const densityCls = density === 'compact' ? 'pm-md--compact' : 'pm-md--detail'
  return (
    <div className={`pm-md ${densityCls}${className ? ` ${className}` : ''}`}>
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  )
}

// ---------- C-12 Markdown 双态编辑器（源码编辑 + 即时预览 + 基础语法辅助） ----------

const FORMAT_ACTIONS: { key: MarkdownFormatAction; label: string; hint: string }[] = [
  { key: 'heading', label: '标题', hint: '在当前行插入 ## 标题' },
  { key: 'bold', label: '加粗', hint: '把选中文字包成 **加粗**' },
  { key: 'bullet', label: '列表', hint: '为选中行加 - 列表项' },
  { key: 'link', label: '链接', hint: '插入 [文字](https://) 链接' },
]

// 编辑器自带局部样式（自包含，不改 panel.css / records.css / reports.css 全局规则）。
const MD_EDITOR_STYLE = `
.pm-md-editor { display: flex; flex-direction: column; gap: 6px; }
.pm-md-editor-bar { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.pm-md-editor-tools { display: flex; gap: 2px; flex-wrap: wrap; }
.pm-md-editor-tool {
  border: 1px solid var(--line, #d8dce3); background: var(--field-bg, #f4f6f8);
  color: var(--ink-2, #3a4150); border-radius: 6px; padding: 3px 9px;
  font-size: 12px; font-weight: 600; cursor: pointer; line-height: 1.4;
}
.pm-md-editor-tool:hover { background: var(--hover-bg, #eceff3); }
.pm-md-editor-seg { margin-left: auto; display: flex; gap: 2px; background: var(--field-bg, #f4f6f8); border: 1px solid var(--line, #d8dce3); border-radius: 6px; padding: 2px; }
.pm-md-editor-seg button { border: 0; background: transparent; color: var(--muted, #6b7280); font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 4px; cursor: pointer; }
.pm-md-editor-seg button.is-on { background: var(--surface, #fff); color: var(--ink, #1f2430); box-shadow: 0 1px 2px rgba(0,0,0,.08); }
.pm-md-editor-textarea {
  width: 100%; box-sizing: border-box; resize: vertical;
  border: 1px solid var(--line, #d8dce3); border-radius: 8px;
  background: var(--field-bg, #f4f6f8); color: var(--ink, #1f2430);
  padding: 10px 12px; font-family: var(--pm-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 13px; line-height: 1.6; min-height: 120px;
}
.pm-md-editor-textarea:focus-visible { outline: 2px solid color-mix(in srgb, var(--c-prog, #3b82f6) 55%, transparent); outline-offset: 1px; }
.pm-md-editor-preview {
  border: 1px dashed var(--line, #d8dce3); border-radius: 8px; padding: 10px 12px;
  min-height: 120px; background: var(--surface, #fff);
}
.pm-md-editor-empty { color: var(--faint, #9aa1ad); font-size: 12px; }
.pm-md-editor-issues { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 3px; }
.pm-md-editor-issues li { font-size: 12px; color: var(--muted, #6b7280); padding-left: 14px; position: relative; }
.pm-md-editor-issues li::before { content: "•"; position: absolute; left: 2px; color: var(--faint, #9aa1ad); }
`

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  minRows?: number
  ariaLabel?: string
  density?: MarkdownDensity
  className?: string
}

/**
 * C-12 双态 Markdown 编辑器：源码编辑与即时预览分段切换，格式工具条只插入语法标记（非 WYSIWYG）；
 * 语法问题就近温和列出，不阻断、不清空输入。安全渲染复用 MarkdownView（零 innerHTML）。
 */
export function MarkdownEditor({ value, onChange, minRows = 6, ariaLabel, density = 'compact', className }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const [view, setView] = useState<'source' | 'preview'>('source')
  const issues = useMemo(() => lintMarkdownDraft(value), [value])

  const apply = (action: MarkdownFormatAction) => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = applyMarkdownFormat(value, start, end, action)
    onChange(next.text)
    requestAnimationFrame(() => {
      const node = ref.current
      if (!node) return
      node.focus()
      node.setSelectionRange(next.start, next.end)
    })
  }

  return (
    <div className={`pm-md-editor${className ? ` ${className}` : ''}`}>
      <style>{MD_EDITOR_STYLE}</style>
      <div className="pm-md-editor-bar">
        <div className="pm-md-editor-tools" role="group" aria-label="Markdown 格式辅助">
          {FORMAT_ACTIONS.map(a => (
            <button key={a.key} type="button" className="pm-md-editor-tool" title={a.hint}
              onClick={() => apply(a.key)}>{a.label}</button>
          ))}
        </div>
        <div className="pm-md-editor-seg" role="group" aria-label="编辑 / 预览切换">
          <button type="button" className={view === 'source' ? 'is-on' : ''} aria-pressed={view === 'source'}
            onClick={() => setView('source')}>源码</button>
          <button type="button" className={view === 'preview' ? 'is-on' : ''} aria-pressed={view === 'preview'}
            onClick={() => setView('preview')}>预览</button>
        </div>
      </div>
      {view === 'source' ? (
        <>
          <textarea
            ref={ref}
            className="pm-md-editor-textarea"
            rows={minRows}
            value={value}
            aria-label={ariaLabel ?? 'Markdown 源码编辑'}
            onChange={event => onChange(event.currentTarget.value)}
          />
          {issues.length > 0 && (
            <ul className="pm-md-editor-issues" role="status" aria-label="Markdown 语法提示">
              {issues.map((issue, i) => <li key={i}>{issue.message}</li>)}
            </ul>
          )}
        </>
      ) : (
        <div className="pm-md-editor-preview">
          {value.trim()
            ? <MarkdownView source={value} density={density} />
            : <p className="pm-md-editor-empty">（暂无内容，切回源码继续编辑）</p>}
        </div>
      )}
    </div>
  )
}

// 供板卡/详情按需直接消费 AST（board owner 可选）。
export { parseMarkdownBlocks, parseInline, safeHref }
