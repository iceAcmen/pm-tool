/**
 * P0 任务页工具条 / 顶部间距返修 · 静态合同门（C/T，不渲染、不写库）。
 * 锁死：宿主嵌入顶部安全间距、宽屏一行/嵌入两行/390 收纳、chips 横滚、密度长 chip 收起；
 * 并回归保护批量条/不可撤销删除/行内 tally/视图保存分享/导出/导入模板/分组排序不被返修破坏。
 * R 像素采证由 Aha/正式运行在已签名会话完成，本测试不替代截图。
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, 'tasks.css'), 'utf-8')
const tsx = readFileSync(join(here, 'tasks.tsx'), 'utf8')

/** 剥掉所有 @media 块，只保留顶层（非媒体）规则体，用于检查窄屏规则是否泄漏到桌面。 */
function topLevel(c: string): string {
  let out = ''
  let i = 0
  while (i < c.length) {
    const m = /@media[^{]*\{/.exec(c.slice(i))
    if (!m) { out += c.slice(i); break }
    out += c.slice(i, i + m.index)
    // 跳过整棵 @media（按花括号配平）
    let depth = 0
    const start = i + m.index + m[0].length - 1
    for (let j = start; j < c.length; j++) {
      if (c[j] === '{') depth++
      else if (c[j] === '}') { depth--; if (depth === 0) { i = j + 1; break } }
    }
  }
  return out
}

describe('P0 工具条分组 / 顶部间距 / 响应式（tasks.css）', () => {
  it('顶部安全间距：pt-head 有 padding-top，h1 不贴宿主上沿', () => {
    expect(css).toMatch(/\.pm-tasks-root \.pt-head\s*\{[^}]*padding-top:\s*var\(--sp-2\)/s)
  })

  it('宽屏 ≥1080：pt-toolbar space-between 单行优先，动作簇居右换行兜底', () => {
    const wide = css.match(/@media \(min-width: 1080px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(wide).toContain('justify-content: space-between')
    expect(wide).toContain('flex-wrap: wrap')
    expect(wide).toContain('.pt-tools')
  })

  it('嵌入中宽 561–1079：视图+chips 一行、动作簇一行（column 两行），密度长 chip 收起', () => {
    const mid = css.match(/@media \(min-width: 561px\) and \(max-width: 1079px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(mid).toContain('flex-direction: column')
    expect(mid).toContain('.pt-viewleft')
    expect(mid).toContain('.pt-tools')
    expect(mid).toMatch(/\.pt-density-chip\s*\{[^}]*display:\s*none/)
  })

  it('窄屏 ≤560：chips 横向滚动单行不堆列，密度长 chip 收起', () => {
    // 取最后一个 ≤560 媒体块（P0 追加段）
    const blocks = [...css.matchAll(/@media \(max-width: 560px\)\s*\{/g)]
    const last = blocks[blocks.length - 1]
    const tail = last ? css.slice(last.index) : ''
    expect(tail).toContain('.pt-chips')
    expect(tail).toMatch(/\.pt-chips\s*\{[^}]*overflow-x:\s*auto/)
    expect(tail).toContain('.pt-density-chip')
  })

  it('窄屏 ≤560：组织动作段在自身宽度内换行，不把旧排序控件裁到视口外', () => {
    const blocks = [...css.matchAll(/@media \(max-width: 560px\)\s*\{/g)]
    const last = blocks[blocks.length - 1]
    const tail = last ? css.slice(last.index) : ''
    expect(tail).toMatch(/\.pt-seg-org\s*\{[^}]*flex-wrap:\s*wrap/)
    expect(tail).toMatch(/\.pt-seg-org\s*\{[^}]*max-width:\s*100%/)
  })

  it('390：动作簇两行内收纳、密度 seg 均分，不顶出父宽', () => {
    const n390 = css.match(/@media \(max-width: 390px\)\s*\{([\s\S]*?)\n\}/g)?.at(-1) ?? ''
    expect(n390).toContain('.pt-tools')
    expect(n390).toContain('.pt-density-seg')
  })

  it('窄屏视图切换器整行规则不得泄漏到桌面（顶层不得出现 pt-viewleft/pt-viewswitch width:100%）', () => {
    const top = topLevel(css)
    expect(top).not.toMatch(/\.pt-viewleft\s*\{[^}]*width:\s*100%/)
    expect(top).not.toMatch(/\.pt-viewswitch\s*\{[^}]*width:\s*100%/)
    expect(top).not.toMatch(/\.pt-viewswitch-btn\s*\{[^}]*width:\s*100%/)
  })
})

describe('P0 回归保护：既有任务能力不得被返修破坏（tasks.tsx）', () => {
  it('批量条 + 不可撤销删除确认保留', () => {
    expect(tsx).toContain('标为完成')
    expect(tsx).toContain('confirmBatchDelete')
    expect(tsx).toContain('此操作不可撤销')
    expect(tsx).toContain('确认级联删除')
  })
  it('行内状态直改 + 同源 tally/donePercent 保留', () => {
    expect(tsx).toContain('buildUpdate({ status: e.currentTarget.value })')
    expect(tsx).toContain('tallyTasksByStatus(tasks.map(t => t.status))')
    expect(tsx).toContain('donePercent(statusTally, tasks.length)')
  })
  it('命名视图保存/分享、导出菜单、导入模板、分组开关、排序、密度、搜索保留', () => {
    expect(tsx).toContain('confirmSaveAs')
    expect(tsx).toContain('shareSnapshot')
    expect(tsx).toContain("exportAs('md')")
    expect(tsx).toContain('pm-import-template')
    expect(tsx).toContain('pm-import-file')
    expect(tsx).toContain('pm-group-toggle')
    expect(tsx).toContain('pm-sort-select')
    expect(tsx).toContain("onDensityChange?.('comfortable')")
    expect(tsx).toContain("onDensityChange?.('compact')")
    expect(tsx).toContain('搜索任务名称 / 编号')
  })
})
