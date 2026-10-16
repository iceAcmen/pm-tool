// 验证 renderMarkdown 安全：正常语法渲染 + 恶意输入不产生可执行标签/危险 href。
// renderMarkdown 是 widgets.tsx 内联函数，这里用等价的独立实现复刻同一规则做断言。
import assert from 'node:assert/strict'

function renderMarkdown(src) {
  const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const lines = esc.split(/\r?\n/)
  const out = []
  let listType = null
  const closeList = () => { if (listType) { out.push(listType === 'ul' ? '</ul>' : '</ol>'); listType = null } }
  for (const line of lines) {
    if (/^\s*(-\s*){3,}$/.test(line) || /^\s*(\*\s*){3,}$/.test(line)) { closeList(); out.push('<hr/>'); continue }
    if (/^#{1,3}\s+/.test(line)) { closeList(); out.push('<div class="pm-md-h">' + inline(line.replace(/^#{1,3}\s+/, '')) + '</div>'); continue }
    if (/^\s*&gt;\s?/.test(line)) { closeList(); out.push('<blockquote class="pm-md-q">' + inline(line.replace(/^\s*&gt;\s?/, '')) + '</blockquote>'); continue }
    const task = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/)
    if (task) {
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul' }
      const checked = task[1].toLowerCase() === 'x'
      out.push(`<li class="pm-md-task"><input type="checkbox" disabled ${checked ? 'checked' : ''}/> ` + inline(task[2]) + '</li>')
      continue
    }
    const ul = line.match(/^(\s*)[-*]\s+(.*)$/)
    if (ul) { if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul' } out.push('<li>' + inline(ul[2]) + '</li>'); continue }
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) { if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol' } out.push('<li>' + inline(ol[1]) + '</li>'); continue }
    closeList()
    if (line.trim() === '') out.push('')
    else out.push('<p>' + inline(line) + '</p>')
  }
  closeList()
  return out.join('\n')
  function inline(s) {
    return s
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_m, text, url) => {
        const safe = /^https?:\/\//i.test(url) ? url : '#'
        return `<a href="${safe}" target="_blank" rel="noreferrer">${text}</a>`
      })
  }
}

// 正常语法
const ok = renderMarkdown('**粗体** ~~删除~~ `code`\n- 甲\n1. 乙\n> 引用\n---\n[链接](https://a.com)')
assert.match(ok, /<b>/)
assert.match(ok, /<del>/)
assert.match(ok, /<code>/)
assert.match(ok, /<ol>/)
assert.match(ok, /<blockquote/)
assert.match(ok, /<hr\/>/)
assert.ok(ok.includes('href="https://a.com"'))

// 恶意输入
const evil = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '[x](javascript:alert(1))',
  '[y](data:text/html,<script>alert(1)</script>)',
  '<a href="javascript:alert(1)">click</a>',
  '"><script>alert(1)</script>',
]
for (const e of evil) {
  const h = renderMarkdown(e)
  assert.ok(!/<script[\s>]/i.test(h), 'no <script tag: ' + h)
  assert.ok(!/<img/i.test(h), 'no <img tag: ' + h)
  assert.ok(!/href="javascript:/i.test(h), 'no javascript href: ' + h)
  assert.ok(!/href="data:/i.test(h), 'no data href: ' + h)
}
console.log('PASS markdown safe:', ok.slice(0, 60))
