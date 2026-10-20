/**
 * P2-1 总览看板「需要关注」窄屏返修 · 静态合同门（C/T，不渲染、不写库）。
 * 锁死：≤560 负责人下沉次行（flex-basis 100% / order 3），日期留首行右端；
 * 宽屏单行布局与既有关注行能力不被破坏。R 像素由正式 3172 采证，本测试不替代截图。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const panelCss = readFileSync(resolve(HERE, '../panel.css'), 'utf-8')
const widgetsTsx = readFileSync(resolve(HERE, 'widgets.tsx'), 'utf-8')

describe('需要关注窄屏负责人下沉（panel.css）', () => {
  it('宽屏基版：单行 flex、标题 flex:1、日期 muted，保持不变', () => {
    expect(panelCss).toMatch(/\.pm-attn\s*\{[^}]*display:\s*flex[^}]*align-items:\s*center/)
    expect(panelCss).toContain('.pm-attn > span:nth-child(2) { flex: 1; }')
    expect(panelCss).toContain('.pm-attn-arr { color: var(--pm-muted); }')
  })

  it('≤560：flex-wrap，负责人 faint 占满次行（order 3 / flex-basis 100%），日期不换行', () => {
    expect(panelCss).toContain('flex-wrap: wrap')
    expect(panelCss).toMatch(/\.pm-attn \.pm-bento-faint\s*\{[^}]*flex:\s*1 1 100%/)
    expect(panelCss).toContain('order: 3')
    expect(panelCss).toContain('.pm-attn-arr { flex: 0 0 auto; }')
  })
})

describe('回归：关注行既有能力保留（widgets.tsx）', () => {
  it('打开记录动作、空态脚注、无主任务计数保留', () => {
    expect(widgetsTsx).toContain('actions.openRecord(t.projectId, \'task\', t.id)')
    expect(widgetsTsx).toContain('当前无需特别关注的任务。')
    expect(widgetsTsx).toContain('项无主任务')
  })
})
