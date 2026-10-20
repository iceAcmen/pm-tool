import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(HERE, './board.css'), 'utf8')

describe('D-03 顶条与卡群层级留白（board 局部，不动 panel.css）', () => {
  it('head 与卡群间距 ≥16px（覆盖 panel.css 的 12px）', () => {
    expect(/\.pm-bento\s+\.pm-bento-head\s*\{[^}]*margin-bottom:\s*16px/.test(css)).toBe(true)
  })
  it('窄屏工具条允许换行，不再 nowrap 压卡', () => {
    expect(/@media[^{]*768[^{]*\{[\s\S]*?\.pm-bento\s+\.pm-bento-tools\s*\{[^}]*flex-wrap:\s*wrap/.test(css)).toBe(true)
  })
})
