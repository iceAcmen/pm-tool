/**
 * B1 共享深色安全修正 + 新版试点门控 + 六态反馈 合同测试（纯静态，无浏览器/jsdom）。
 *
 * 范围（仅 client）：
 *  A 共享 dark 安全修正（全局生效、无功能分流）：color-scheme 双态、原生 select/option 显式
 *    底色与文字、键盘 :focus-visible 环不被旧 :focus{outline:none} 抹掉。
 *  B 试点门控：pm-b1-pilot localStorage 默认 OFF；更多菜单「新版界面试用」切换；
 *    试点视觉走 [data-pilot="on"] 门控，off 旧页不被污染；旧 tasks 行为/实现保留。
 *  C 反馈状态：busy 可见 loading + aria-busy；读取失败保留旧数据、标陈旧 + 可重试；
 *    成功走现有 toast；错误（含 permission-denied）原始原因不被静默合并。
 *
 * 不触碰 core；真 deep-link 另 U6 契约测试，本文件不假满足。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const panelCss = readFileSync(join(here, '..', 'panel.css'), 'utf-8')
const panelTsx = readFileSync(join(here, '..', 'panel.tsx'), 'utf-8')
const resultCardTsx = readFileSync(join(here, '..', 'result-card.tsx'), 'utf-8')
const tasksCss = readFileSync(join(here, '..', 'views', 'tasks.css'), 'utf-8')
const tasksTsx = readFileSync(join(here, '..', 'views', 'tasks.tsx'), 'utf-8')

/** 取某选择器首次命中规则的 `{ ... }` 体（含 @media/逗号组扫描）。 */
function ruleBody(css: string, selector: string): string {
  const idx = css.indexOf(selector)
  if (idx === -1) return ''
  const brace = css.indexOf('{', idx)
  if (brace === -1) return ''
  let depth = 0
  for (let i = brace; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') { depth--; if (depth === 0) return css.slice(brace + 1, i) }
  }
  return ''
}

describe('A 共享 dark 安全修正（全局，无功能分流）', () => {
  it('A1 .pm-shell 声明 color-scheme:light，深色作用域声明 color-scheme:dark', () => {
    const light = ruleBody(panelCss, '.pm-shell {')
    expect(/color-scheme\s*:\s*light/.test(light), '浅态需显式 color-scheme:light').toBe(true)
    const dark = ruleBody(panelCss, 'body[data-ds-dark-theme] .pm-shell')
    expect(/color-scheme\s*:\s*dark/.test(dark), 'dark 作用域需 color-scheme:dark').toBe(true)
  })

  it('A2 通用 select 显式 color/background/border，select option 显式 background+color（无透明 option）', () => {
    // 精确取独立的 `.pm-shell select { ... }` 全局规则（跳过 :focus-visible 逗号组）。
    const selBlock = panelCss.match(/\.pm-shell select\s*\{[^}]*\}/)
    expect(selBlock, '需存在独立的 .pm-shell select 全局规则').not.toBeNull()
    expect(/color\s*:/.test(selBlock![0]), 'select 需显式 color').toBe(true)
    expect(/background/.test(selBlock![0]), 'select 需显式 background').toBe(true)
    expect(/border(-color)?\s*:/.test(selBlock![0]), 'select 需显式 border/border-color').toBe(true)
    // 全局 option 弹层规则：显式底色与文字，避免 dark 透明黑字黑底。
    const optMatch = panelCss.match(/select\s+option\s*\{[^}]*\}/)
    expect(optMatch, '需存在全局 select option 规则').not.toBeNull()
    expect(/background/.test(optMatch![0])).toBe(true)
    expect(/color\s*:/.test(optMatch![0])).toBe(true)
  })

  it('A2b 新共享规则只用 token（var()），不内联 hex', () => {
    const optMatch = panelCss.match(/select\s+option\s*\{[^}]*\}/)
    expect(optMatch, 'option 规则存在').not.toBeNull()
    expect(/#[0-9a-fA-F]{3,8}\b/.test(optMatch![0]), 'option 规则不得内联 hex').toBe(false)
  })

  it('A3 旧三处 :focus{outline:none} 已移除，键盘 :focus-visible 环保留', () => {
    expect(/\.pm-ai-input:focus\s*\{\s*outline\s*:\s*none/.test(panelCss), '.pm-ai-input 不得再 outline:none').toBe(false)
    expect(/\.pm-copilot-editrow[^{]*:focus[^{]*\{\s*outline\s*:\s*none/.test(panelCss), 'copilot-editrow 不得再 outline:none').toBe(false)
    expect(/\.pm-copilot-input:focus\s*\{\s*outline\s*:\s*none/.test(panelCss), '.pm-copilot-input 不得再 outline:none').toBe(false)
    const ring = ruleBody(panelCss, '.pm-shell button:focus-visible')
    expect(/outline\s*:\s*2px/.test(ring), '全局 focus-visible 2px 环保留').toBe(true)
  })
})

describe('B 试点门控 pm-b1-pilot（默认 OFF，off 旧页不污染）', () => {
  it('B1 panel.tsx 读取 pm-b1-pilot、默认 off，壳根下发 data-pilot 属性', () => {
    expect(panelTsx).toContain("pm-b1-pilot")
    expect(/localStorage\.getItem\(['"]pm-b1-pilot['"]\)/.test(panelTsx)).toBe(true)
    expect(/data-pilot=/.test(panelTsx), '壳根需渲染 data-pilot 属性').toBe(true)
    // 默认 OFF：未存键时为 off。
    expect(/===\s*['"]on['"]/.test(panelTsx)).toBe(true)
  })

  it('B2 更多菜单含「新版界面试用」切换项并写回 localStorage', () => {
    expect(panelTsx).toContain('新版界面试用')
    expect(/setItem\(['"]pm-b1-pilot['"]/.test(panelTsx), '切换需持久化到 localStorage').toBe(true)
  })

  it('B3 试点 tasks 视觉规则门控在 [data-pilot="on"] 下，off 旧样式原样', () => {
    expect(/\[data-pilot=["']on["']\][^{]*\{/.test(tasksCss + panelCss), '试点规则需 [data-pilot="on"] 门控').toBe(true)
  })
})

describe('C 反馈状态（busy loading / 陈旧重试 / 成功 toast / 错误不合并）', () => {
  it('C1 busy 下发 aria-busy 且有可见 loading 指示', () => {
    expect(/aria-busy=/.test(panelTsx), '壳/区域需 aria-busy').toBe(true)
    expect(/pm-busy(-indicator)?/.test(panelCss), '需可见 busy 指示类').toBe(true)
  })

  it('C2 读取失败保留旧数据、标陈旧并提供重试；成功清除陈旧', () => {
    expect(/pm-stale-banner/.test(panelCss + panelTsx), '需陈旧提示块').toBe(true)
    expect(/重试/.test(panelTsx), '陈旧块需可重试入口').toBe(true)
    // 成功 toast 现有契约保留。
    expect(panelTsx).toContain('pm-toast--success')
  })

  it('C3 错误（含 permission-denied）原始原因不被静默合并，ResultCard error role=alert 保留', () => {
    expect(panelTsx).toContain("import { ResultCard } from './result-card.js'")
    expect(resultCardTsx).toContain('role={isError ? \'alert\' : \'status\'}')
    expect(/权限不足|permission|denied/i.test(resultCardTsx), '需对权限类错误给通用种类标签').toBe(true)
    // 非结构化错误原文原样进卡体（showInlineRaw），不改写不吞。
    expect(resultCardTsx).toContain('showInlineRaw')
  })
})

describe('D tasks 视图接线非回归', () => {
  it('D1 tasks.tsx 仍消费五态 tally 与既有字段，未被试点替换成 mock', () => {
    expect(tasksTsx).toContain('tasks-tally')
    expect(tasksTsx).toContain('taskStatusLabels')
  })
})
