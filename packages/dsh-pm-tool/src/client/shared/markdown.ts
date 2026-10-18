/**
 * 共享安全 Markdown 纯解析器（契约 §3.5）：
 * - 零 DOM / 零 innerHTML / 零 eval；只产出不可变 AST，由 markdown-view.tsx 用 React 元素渲染。
 * - 链接仅放行 http/https（safeHref 返回 null 时降级为纯文本）；其余协议（javascript:/data:/file:）一律不进 href。
 * - 不跨仓 import 宿主 GFM 包；子集：标题/无序有序列表/任务清单/引用/分隔线/围栏代码/表格/加粗/斜体/删除线/行内 code/链接。
 * - 本模块不依赖 React，可在 Node 下直接做行为测试。
 *
 * 安全模型：所有正文最终由 React 文本节点输出（自动转义），不存在 HTML 注入面；
 * 本文件唯一需要主动过滤的是 URL 协议白名单。
 */

export type MdInline =
  | { kind: 'text'; text: string }
  | { kind: 'break' }
  | { kind: 'bold'; children: MdInline[] }
  | { kind: 'italic'; children: MdInline[] }
  | { kind: 'strike'; children: MdInline[] }
  | { kind: 'code'; text: string }
  | { kind: 'link'; text: string; href: string }

export interface MdTaskItem { checked: boolean; inline: MdInline[] }

export type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; inline: MdInline[] }
  | { type: 'paragraph'; inline: MdInline[] }
  | { type: 'ul'; items: MdInline[][] }
  | { type: 'ol'; items: MdInline[][] }
  | { type: 'task'; items: MdTaskItem[] }
  | { type: 'quote'; inline: MdInline[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'table'; header: MdInline[][]; rows: MdInline[][][] }
  | { type: 'hr' }

/** 仅放行 http/https 链接；非法协议/相对协议返回 null（渲染层降级纯文本）。 */
export function safeHref(url: string): string | null {
  const trimmed = url.trim()
  if (!/^https?:\/\//i.test(trimmed)) return null
  // 拒绝控制字符与空白夹带（正则已排除空白，这里再挡一次反斜杠伪装）。
  if (/[\s\x00-\x1f\\]/.test(trimmed)) return null
  return trimmed
}

interface InlinePattern {
  re: RegExp
  build: (m: RegExpExecArray) => MdInline
}

const INLINE_PATTERNS: InlinePattern[] = [
  { re: /`([^`]+)`/, build: (m) => ({ kind: 'code', text: m[1] }) },
  {
    re: /\[([^\]]+)\]\((https?:[^)\s]+)\)/i,
    build: (m) => {
      const href = safeHref(m[2])
      return href
        ? { kind: 'link', text: m[1], href }
        : { kind: 'text', text: `[${m[1]}](${m[2]})` }
    },
  },
  { re: /\*\*([^*]+)\*\*/, build: (m) => ({ kind: 'bold', children: parseInline(m[1]) }) },
  { re: /~~([^~]+)~~/, build: (m) => ({ kind: 'strike', children: parseInline(m[1]) }) },
  { re: /(?<!\*)\*([^*\n]+)\*(?!\*)/, build: (m) => ({ kind: 'italic', children: parseInline(m[1]) }) },
]

/** 行内解析：单趟扫描，取最早命中的片段；未命中余量作纯文本。 */
export function parseInline(src: string): MdInline[] {
  const out: MdInline[] = []
  let rest = src
  while (rest.length > 0) {
    let hit: { index: number; length: number; node: MdInline } | null = null
    for (const p of INLINE_PATTERNS) {
      const m = p.re.exec(rest)
      if (m && (hit === null || m.index < hit.index)) {
        hit = { index: m.index, length: m[0].length, node: p.build(m) }
      }
    }
    if (!hit) {
      out.push({ kind: 'text', text: rest })
      break
    }
    if (hit.index > 0) out.push({ kind: 'text', text: rest.slice(0, hit.index) })
    out.push(hit.node)
    rest = rest.slice(hit.index + hit.length)
  }
  return out
}

/** 表格行拆分：| a | b | → ['a','b']；首尾空竖线忽略。 */
function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|')
    .map((c) => c.trim())
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c))
}

/**
 * 块级解析：\r\n 归一；围栏代码块整块收进 code；连续竖线行构成表格；
 * 空行分隔段落，段内单硬换行以 break 节点保留（编辑→预览→详情不丢换行）。
 */
export function parseMarkdownBlocks(src: string): MdBlock[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: MdBlock[] = []
  let i = 0

  const flushParagraph = (buf: string[]) => {
    if (!buf.length) return
    const inline: MdInline[] = []
    buf.forEach((line, idx) => {
      if (idx > 0) inline.push({ kind: 'break' })
      inline.push(...parseInline(line))
    })
    blocks.push({ type: 'paragraph', inline })
  }
  let paraBuf: string[] = []

  while (i < lines.length) {
    const line = lines[i]

    // 围栏代码块 ```lang ... ```
    const fence = /^\s*```(\w*)\s*$/.exec(line)
    if (fence) {
      flushParagraph(paraBuf); paraBuf = []
      const lang = fence[1] ?? ''
      const code: string[] = []
      i += 1
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        code.push(lines[i])
        i += 1
      }
      i += 1 // 跳过闭合围栏
      blocks.push({ type: 'code', lang, code: code.join('\n') })
      continue
    }

    // 空行
    if (line.trim() === '') {
      flushParagraph(paraBuf); paraBuf = []
      i += 1
      continue
    }

    // 标题 ####
    const head = /^(#{1,4})\s+(.*)$/.exec(line)
    if (head) {
      flushParagraph(paraBuf); paraBuf = []
      blocks.push({ type: 'heading', level: head[1].length as 1 | 2 | 3 | 4, inline: parseInline(head[2].trim()) })
      i += 1
      continue
    }

    // 分隔线 --- / ***
    if (/^\s*(-\s*){3,}$/.test(line) || /^\s*(\*\s*){3,}$/.test(line)) {
      flushParagraph(paraBuf); paraBuf = []
      blocks.push({ type: 'hr' })
      i += 1
      continue
    }

    // 表格：首行竖线 + 次行分隔线
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushParagraph(paraBuf); paraBuf = []
      const header: MdInline[][] = splitTableRow(line).map((cell) => parseInline(cell))
      i += 2
      const tableRows: MdInline[][][] = []
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        const row: MdInline[][] = splitTableRow(lines[i]).map((cell) => parseInline(cell))
        tableRows.push(row)
        i += 1
      }
      blocks.push({ type: 'table', header, rows: tableRows })
      continue
    }

    // 引用 >
    const quote = /^\s*>\s?(.*)$/.exec(line)
    if (quote) {
      flushParagraph(paraBuf); paraBuf = []
      const qLines: string[] = [quote[1]]
      i += 1
      while (i < lines.length) {
        const q = /^\s*>\s?(.*)$/.exec(lines[i])
        if (!q) break
        qLines.push(q[1])
        i += 1
      }
      const inline: MdInline[] = []
      qLines.forEach((l, idx) => {
        if (idx > 0) inline.push({ kind: 'break' })
        inline.push(...parseInline(l))
      })
      blocks.push({ type: 'quote', inline })
      continue
    }

    // 任务清单 - [ ] / - [x]
    const task = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/.exec(line)
    if (task) {
      flushParagraph(paraBuf); paraBuf = []
      const items: MdTaskItem[] = [{ checked: task[1].toLowerCase() === 'x', inline: parseInline(task[2]) }]
      i += 1
      while (i < lines.length) {
        const t = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/.exec(lines[i])
        if (!t) break
        items.push({ checked: t[1].toLowerCase() === 'x', inline: parseInline(t[2]) })
        i += 1
      }
      blocks.push({ type: 'task', items })
      continue
    }

    // 无序列表 - *
    const ul = /^\s*[-*]\s+(.*)$/.exec(line)
    if (ul) {
      flushParagraph(paraBuf); paraBuf = []
      const items: MdInline[][] = [parseInline(ul[1])]
      i += 1
      while (i < lines.length) {
        const u = /^\s*[-*]\s+(.*)$/.exec(lines[i])
        if (!u) break
        items.push(parseInline(u[1]))
        i += 1
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // 有序列表 1.
    const ol = /^\s*\d+\.\s+(.*)$/.exec(line)
    if (ol) {
      flushParagraph(paraBuf); paraBuf = []
      const items: MdInline[][] = [parseInline(ol[1])]
      i += 1
      while (i < lines.length) {
        const o = /^\s*\d+\.\s+(.*)$/.exec(lines[i])
        if (!o) break
        items.push(parseInline(o[1]))
        i += 1
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    paraBuf.push(line)
    i += 1
  }
  flushParagraph(paraBuf)
  return blocks
}
