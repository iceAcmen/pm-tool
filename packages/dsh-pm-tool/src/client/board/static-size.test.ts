import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const boardCss = readFileSync(new URL('./board.css', import.meta.url), 'utf8')
const panelCss = readFileSync(new URL('../panel.css', import.meta.url), 'utf8')
const source = readFileSync(new URL('./BoardBento.tsx', import.meta.url), 'utf8')

// 这是高度链的回归锁，真实 bbox/滚动和拖缩仍须浏览器验收，不用本测试冒充 GUI PASS。
describe('浏览态看板：卡体尺寸不能超出用户配置的网格', () => {
  it('浏览态 slot 使用与网格行高一致的明确高度，不只有 minHeight', () => {
    expect(source).toContain('className="pm-bento-static-slot"')
    expect(source).toContain('height: (p.h * GRID.rowHeight) + ((p.h - 1) * GRID.margin[1])')
  })
  it('所有浏览态卡体填满 slot 且内容多时内滚，不盖住下一卡', () => {
    expect(boardCss).toMatch(/\.pm-bento \.pm-bento-static-slot > \.pm-bento-card\s*\{[^}]*height:\s*100%/)
    expect(boardCss).toMatch(/\.pm-bento \.pm-bento-static-slot > \.pm-bento-card\s*\{[^}]*overflow-y:\s*auto/)
    expect(boardCss).toMatch(/\.pm-bento \.pm-bento-static-slot > \.pm-bento-card > \*\s*\{[^}]*flex-shrink:\s*0/)
  })
  it('窄屏不再用旧两列 auto/important 推翻 canonical 断点投影', () => {
    expect(panelCss).not.toContain('grid-column: auto !important; grid-row: auto !important; min-height: 0 !important;')
    expect(panelCss).not.toContain('.pm-bento-grid-static { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: auto; }')
  })
})
