/**
 * 390 响应式契约测试（纯静态，无浏览器/jsdom）：
 * 交付前核对卡（.pm-check-*）在窄屏必须流式换行、文本列可收缩，不得靠 overflow:hidden 遮蔽；
 * 表格（.pt-scroll）保留内部横滚属例外。同时校验 tasks.tsx 的类名接线不漂移。
 *
 * 背景：panel.css:210 `.pm-shell button{white-space:nowrap}` 会继承到检查卡按钮内文字，
 * 导致 head-sub / item 标题说明单行不换行、固有宽度撑破卡片（sw>cw）被父级 hidden 右裁。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, 'tasks.css'), 'utf-8')
const tsx = readFileSync(join(here, 'tasks.tsx'), 'utf-8')

/** 聚合所有命中 `<selector>` 的规则体（含逗号选择器组与 @media 覆盖），声明取并集。 */
function ruleBody(selector: string): string {
  const needle = `.pm-tasks-root ${selector}`
  let merged = ''
  let from = 0
  for (;;) {
    const idx = css.indexOf(needle, from)
    if (idx === -1) break
    from = idx + needle.length
    // 跳过逗号选择器组里的后续选择器，定位本规则的 `{`
    const brace = css.indexOf('{', idx)
    if (brace === -1) break
    let depth = 0
    let end = brace
    for (let i = brace; i < css.length; i++) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    merged += css.slice(brace + 1, end) + '\n'
  }
  return merged
}

const has = (body: string, decl: RegExp) => decl.test(body)

describe('交付前核对卡 390 流式换行契约（不得 nowrap 撑破 / 不靠 hidden 遮蔽）', () => {
  it('头部按钮与副标题恢复 normal，文本列可收缩', () => {
    const head = ruleBody('.pm-check-head')
    expect(head).toContain('white-space: normal')
    const txt = ruleBody('.pm-check-head-txt')
    expect(has(txt, /min-width:\s*0/)).toBe(true)
    const sub = ruleBody('.pm-check-head-sub')
    expect(sub).toContain('white-space: normal')
    expect(has(sub, /overflow-wrap:\s*anywhere/)).toBe(true)
    expect(has(sub, /white-space:\s*nowrap/)).toBe(false)
  })

  it('条目按钮流式换行、min-width:0、max-width:100%，文字 normal 可断', () => {
    const item = ruleBody('.pm-check-item')
    expect(item).toContain('white-space: normal')
    expect(has(item, /flex-wrap:\s*wrap/)).toBe(true)
    expect(has(item, /min-width:\s*0/)).toBe(true)
    expect(has(item, /max-width:\s*100%/)).toBe(true)

    const main = ruleBody('.pm-check-main')
    expect(has(main, /flex:\s*1\s+1\s+0/)).toBe(true)
    expect(has(main, /min-width:\s*0/)).toBe(true)
    expect(has(main, /overflow-wrap:\s*anywhere/)).toBe(true)

    for (const sel of ['.pm-check-title', '.pm-check-reason', '.pm-check-suggest']) {
      const body = ruleBody(sel)
      expect(body, sel).toContain('white-space: normal')
      expect(has(body, /overflow-wrap:\s*anywhere/), sel).toBe(true)
      expect(has(body, /white-space:\s*nowrap/), `${sel} 不得 nowrap`).toBe(false)
    }
  })

  it('卡片盒模型 border-box / max-width:100%，模块不给检查卡加 overflow:hidden 遮蔽', () => {
    const card = ruleBody('.pm-check-card')
    expect(has(card, /box-sizing:\s*border-box/)).toBe(true)
    expect(has(card, /max-width:\s*100%/)).toBe(true)
    // 模块不得用 overflow:hidden 裁掉检查卡（panel 外壳既有 hidden 不归本模块改）。
    expect(has(card, /overflow\s*:\s*hidden/)).toBe(false)
  })

  it('表格 .pt-scroll 保留内部横滚（表格例外），文本卡不靠横滚', () => {
    const scroll = ruleBody('.pt-scroll')
    expect(has(scroll, /overflow(?:-x)?\s*:\s*auto/)).toBe(true)
  })
})

describe('tasks.tsx 检查卡类名接线不漂移', () => {
  const wired = [
    'pm-check-card', 'pm-check-head', 'pm-check-head-txt', 'pm-check-head-sub',
    'pm-check-count', 'pm-check-body', 'pm-check-group', 'pm-check-item',
    'pm-check-rule', 'pm-check-main', 'pm-check-title', 'pm-check-reason',
    'pm-check-suggest', 'pm-check-foot',
  ]
  for (const cls of wired) {
    it(`渲染包含 .${cls}`, () => {
      expect(tsx).toContain(cls)
    })
  }
})
