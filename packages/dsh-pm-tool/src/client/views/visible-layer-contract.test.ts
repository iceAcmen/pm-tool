import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 批次 1A · 可见层合同门（C/T）。
 * 证明每个本分片页面都有「非空态」的局部 CSS 可见改动（层级/chip/批量条/390 档），
 * 而不是只补测试证明旧代码。只读本文件，不渲染、不写库。R 像素采证留待合流 F。
 */
const here = dirname(fileURLToPath(import.meta.url))
const css = (f: string) => readFileSync(join(here, f), 'utf8')
const tsx = (f: string) => readFileSync(join(here, f), 'utf8')

describe('1A 可见层：每页局部 CSS 非空态改动 + 390 档', () => {
  it('meetings：分段激活层级 / 状态 chip / 390 单列紧凑', () => {
    const c = css('meetings.css')
    expect(c).toContain('1A visible layer')
    expect(c).toContain('max-width: 390px')
    expect(c).toContain('.mt-seg button.is-on')
    expect(tsx('meetings.tsx')).toContain('mt-chip')
    expect(tsx('meetings.tsx')).toContain('PmButton')
  })

  it('reports：分段激活层级 / 快照条数字对齐 / 390 两列', () => {
    const c = css('reports.css')
    expect(c).toContain('1A visible layer')
    expect(c).toContain('max-width: 390px')
    expect(c).toContain('.rp-seg-btn.is-on')
    expect(tsx('reports.tsx')).toContain('PmButton')
  })

  it('deliverables：状态 chip 激活层级 / 概览条数字对齐 / 390 单列', () => {
    const c = css('deliverables.css')
    expect(c).toContain('1A visible layer')
    expect(c).toContain('max-width: 390px')
    expect(c).toContain('.dv-chip.active')
    expect(tsx('deliverables.tsx')).toContain('PmButton')
  })

  it('tasks：批量条危险层级 / 筛选 chip 激活 / 390 换行，且删除仍走不可撤销确认', () => {
    const c = css('tasks.css')
    expect(c).toContain('1A visible layer')
    expect(c).toContain('max-width: 390px')
    expect(c).toContain('.pt-batch .pt-danger')
    expect(tsx('tasks.tsx')).toContain('pt-batch')
    expect(tsx('tasks.tsx')).toContain('confirmDanger')
    expect(tsx('tasks.tsx')).toContain('此操作不可撤销')
  })

  it('overview：主按钮层级 / 状态 chip / 仓库按钮 390 堆叠，健康环保留', () => {
    const c = css('overview.css')
    expect(c).toContain('1A visible layer')
    expect(c).toContain('max-width: 390px')
    expect(c).toContain('.ov-btn.primary')
    expect(tsx('overview.tsx')).toContain('<HealthRing')
    expect(tsx('overview.tsx')).toContain('target="_blank" rel="noopener noreferrer"')
  })
})
