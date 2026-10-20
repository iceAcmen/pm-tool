import { describe, it, expect } from 'vitest'
import {
  parseMarkdownBlocks, parseInline, safeHref,
  lintMarkdownDraft, sanitizeMarkdownDraft, applyMarkdownFormat,
} from './markdown.js'

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

describe('C-12 lintMarkdownDraft 就近温和语法提示（不阻断）', () => {
  it('完整语法无提示', () => {
    const src = '## 进展\n**已完成**原型\n- 甲\n[官网](https://example.com)'
    expect(lintMarkdownDraft(src)).toEqual([])
  })

  it('奇数加粗 / 反引号 / 未闭合围栏分别给出 kind 提示', () => {
    expect(lintMarkdownDraft('**未闭合加粗')).toContainEqual(expect.objectContaining({ kind: 'bold' }))
    expect(lintMarkdownDraft('行内 `代码 未闭合')).toContainEqual(expect.objectContaining({ kind: 'code' }))
    expect(lintMarkdownDraft('```ts\nconst a = 1')).toContainEqual(expect.objectContaining({ kind: 'fence' }))
  })

  it('非 http(s) 链接与缺右括号链接给 link 提示，合法链接不报', () => {
    expect(lintMarkdownDraft('[x](javascript:alert(1))')).toContainEqual(expect.objectContaining({ kind: 'link' }))
    expect(lintMarkdownDraft('[未完成](https://a.com/b')).toContainEqual(expect.objectContaining({ kind: 'link' }))
    expect(lintMarkdownDraft('[ok](https://a.com)')).toEqual([])
  })
})

describe('C-12 sanitizeMarkdownDraft 落盘清洗（防 XSS 不丢 Markdown）', () => {
  it('剥离原始 HTML 标签并保留内部文字，Markdown 语法原样保留', () => {
    const src = '## 标题\n**加粗** <script>alert(1)</script>正文 <img src=x onerror=alert(1)>\n- 列表项'
    const out = sanitizeMarkdownDraft(src)
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('onerror')
    expect(out).toContain('## 标题')
    expect(out).toContain('**加粗**')
    expect(out).toContain('- 列表项')
    expect(out).toContain('正文')
  })

  it('去除 AI 尾注 / 确认命令 / [pm:action] 行，连续空行收敛', () => {
    const src = '正文\nAI 归纳草稿\n确认命令：report x\n[pm:action] 按钮\n以上为草稿仅供参考\n\n\n\n收尾'
    const out = sanitizeMarkdownDraft(src)
    expect(out).not.toContain('AI 归纳草稿')
    expect(out).not.toContain('确认命令：')
    expect(out).not.toContain('[pm:action]')
    expect(out).not.toContain('以上为草稿')
    expect(out).toContain('正文')
    expect(out).toContain('收尾')
    expect(out).not.toMatch(/\n{3,}/)
  })

  it('正常 Markdown 叙述清洗后保持不变', () => {
    const prose = '本周进展：完成原型设计。风险：联调可能延期。下周计划：启动开发。'
    expect(sanitizeMarkdownDraft(prose)).toBe(prose)
  })
})

describe('C-12 applyMarkdownFormat 工具条插入语法', () => {
  it('标题在当前行首插入 ## ，已有标题不重复加', () => {
    const r = applyMarkdownFormat('第一段\n第二段', 6, 6, 'heading')
    expect(r.text).toBe('第一段\n## 第二段')
    expect(applyMarkdownFormat('## 已有标题', 4, 4, 'heading').text).toBe('## 已有标题')
  })

  it('加粗包裹选区，空选区给占位并选中内部', () => {
    const r = applyMarkdownFormat('重点文字', 0, 2, 'bold')
    expect(r.text).toBe('**重点**文字')
    const empty = applyMarkdownFormat('', 0, 0, 'bold')
    expect(empty.text).toBe('**加粗**')
    expect(empty.end - empty.start).toBe(2)
  })

  it('列表逐行加 - 前缀，已有列表项不重复', () => {
    const r = applyMarkdownFormat('甲\n乙', 0, 4, 'bullet')
    expect(r.text).toBe('- 甲\n- 乙')
    expect(applyMarkdownFormat('- 已有', 0, 5, 'bullet').text).toBe('- 已有')
  })

  it('链接插入 [文字](https://) 且光标落在 URL 处', () => {
    const r = applyMarkdownFormat('官网', 0, 2, 'link')
    expect(r.text).toBe('[官网](https://)')
    expect(r.start).toBe('[官网]('.length)
  })
})
