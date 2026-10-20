import { describe, it, expect } from 'vitest'
import { parseMarkdownBlocks, parseInline, safeHref } from './markdown.js'

describe('safeHref 协议白名单（T5 XSS）', () => {
  it('放行 http/https，拦截 javascript:/data:/file:/相对协议', () => {
    expect(safeHref('https://example.com/a')).toBe('https://example.com/a')
    expect(safeHref('http://example.com')).toBe('http://example.com')
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('data:text/html,x')).toBeNull()
    expect(safeHref('file:///etc/passwd')).toBeNull()
    expect(safeHref('/relative/path')).toBeNull()
    expect(safeHref('https://ok.com/a b')).toBeNull()
  })
})

describe('safeHref S0 协议拦截补充（控制字符 / 伪装 / 大小写）', () => {
  it('大小写 http/https 均放行，首尾空白修剪', () => {
    expect(safeHref('  HTTPS://Example.com/A  ')).toBe('HTTPS://Example.com/A')
    expect(safeHref('Http://a.io')).toBe('Http://a.io')
  })

  it('vbscript:/mailto:/tel: 与协议省略/反斜杠伪装一律拒绝', () => {
    expect(safeHref('vbscript:msgbox(1)')).toBeNull()
    expect(safeHref('mailto:a@b.com')).toBeNull()
    expect(safeHref('tel:+86100')).toBeNull()
    expect(safeHref('//evil.com')).toBeNull()
    expect(safeHref('https:\\\\evil.com')).toBeNull()
  })

  it('控制字符（tab/换行/反斜杠夹带）拒绝，不进 href', () => {
    expect(safeHref('https://ok.com/a\tb')).toBeNull()
    expect(safeHref('https://ok.com/a\nb')).toBeNull()
    expect(safeHref('')).toBeNull()
  })
})

describe('parseInline 行内子集', () => {
  it('加粗 / 行内 code / 链接 / 删除线 / 斜体', () => {
    const nodes = parseInline('**重点** `code` [官方](https://x.com) ~~旧~~ *斜*')
    const kinds = nodes.map((n) => n.kind)
    expect(kinds).toContain('bold')
    expect(kinds).toContain('code')
    expect(kinds).toContain('link')
    expect(kinds).toContain('strike')
    expect(kinds).toContain('italic')
    const link = nodes.find((n) => n.kind === 'link')
    expect(link?.kind === 'link' && link.href).toBe('https://x.com')
  })

  it('危险链接降级为纯文本，不产出 link 节点', () => {
    const nodes = parseInline('[点我](javascript:alert(1))')
    expect(nodes.some((n) => n.kind === 'link')).toBe(false)
    expect(nodes[0]).toMatchObject({ kind: 'text', text: '[点我](javascript:alert(1))' })
  })
})

describe('parseMarkdownBlocks 块级往返（T7 不丢内容）', () => {
  it('标题 / 无序 / 有序 / 任务清单 / 引用 / 分隔线', () => {
    const src = [
      '# 一级标题',
      '',
      '- 甲项',
      '- 乙项',
      '',
      '1. 第一步',
      '2. 第二步',
      '',
      '- [x] 已完成',
      '- [ ] 待办',
      '',
      '> 引用一行',
      '',
      '---',
    ].join('\n')
    const blocks = parseMarkdownBlocks(src)
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'ul', 'ol', 'task', 'quote', 'hr'])
    const task = blocks[3]
    expect(task.type === 'task' && task.items[0].checked).toBe(true)
    expect(task.type === 'task' && task.items[1].checked).toBe(false)
  })

  it('围栏代码块整块保留，不被当段落', () => {
    const src = '说明\n```ts\nconst a = 1\nconst b = 2\n```\n收尾'
    const blocks = parseMarkdownBlocks(src)
    const code = blocks.find((b) => b.type === 'code')
    expect(code?.type === 'code' && code.code).toBe('const a = 1\nconst b = 2')
    expect(code?.type === 'code' && code.lang).toBe('ts')
  })

  it('表格表头/行拆分，列数一致', () => {
    const src = '| A | B |\n| --- | --- |\n| 1 | 2 |'
    const blocks = parseMarkdownBlocks(src)
    const table = blocks[0]
    expect(table.type === 'table' && table.header).toHaveLength(2)
    expect(table.type === 'table' && table.rows[0]).toHaveLength(2)
  })

  it('段内单硬换行以 break 节点保留，二次打开原文不丢', () => {
    const src = '第一行\n第二行'
    const blocks = parseMarkdownBlocks(src)
    const p = blocks[0]
    expect(p.type === 'paragraph' && p.inline.some((n) => n.kind === 'break')).toBe(true)
  })

  it('空输入返回空块数组，不伪造内容', () => {
    expect(parseMarkdownBlocks('')).toEqual([])
    expect(parseMarkdownBlocks('   \n  ')).toEqual([])
  })
})
