/**
 * 共享安全 Markdown 视图（契约 §3.5）：消费 markdown.ts 的 AST，纯 React 元素输出。
 * 无 innerHTML / 无 eval / 无危险 URL；编辑→预览→存储→详情→导出五环节同一 renderer。
 * 样式复用既有 .pm-md-* 令牌类（panel.css），表格列数由数据内联给定，不写死两列。
 */
import { Fragment, type ReactNode } from 'react'
import {
  parseMarkdownBlocks, parseInline, safeHref,
  type MdBlock, type MdInline,
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

// 供板卡/详情按需直接消费 AST（board owner 可选）。
export { parseMarkdownBlocks, parseInline, safeHref }
