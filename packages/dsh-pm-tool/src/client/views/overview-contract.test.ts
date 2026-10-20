import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const overview = readFileSync(join(here, 'overview.tsx'), 'utf8')

/**
 * 批次 1A · G-A overview（B4 指挥舱）静态合同门（C/T）。
 * 锁死：健康分走 core 不手算、健康环/分解渲染、提醒按严重度分组、
 * 仓库安全打开/复制、团队负载四态分段条。R 视觉采证留待合流 F。
 */
describe('G-A overview 视图 S0/core 合同门（批次 1A）', () => {
  it('健康分复用 core scoreFromInputs，不手算；健康环与分解渲染，灯链 data-lamp', () => {
    expect(overview).toContain('scoreFromInputs as healthFromInputs')
    expect(overview).toContain('const health = healthFromInputs({')
    expect(overview).toContain('<HealthRing score={health.score}')
    expect(overview).toContain('<HealthBreakdown')
    expect(overview).toContain('data-lamp={health.score === null ? \'gray\' : health.lamp}')
  })

  it('提醒按严重度分组：逾期(需立即处理) → 受阻/无主(需关注) → 临期(近期安排) → 正常', () => {
    expect(overview).toContain("key: 'late', title: '需立即处理'")
    expect(overview).toContain("key: 'block', title: '需关注'")
    expect(overview).toContain("key: 'prog', title: '近期安排'")
    expect(overview).toContain('项任务已逾期，需优先处理')
    expect(overview).toContain('项任务受阻，等待解除阻塞')
  })

  it('仓库「打开」新标签安全跳转(noOpener)，「复制」走 clipboard 并给已复制反馈', () => {
    expect(overview).toContain('target="_blank" rel="noopener noreferrer"')
    expect(overview).toContain('navigator.clipboard.writeText(project.repoUrl)')
    expect(overview).toContain('{copied ? \'已复制\' : \'复制\'}')
  })

  it('团队负载四态分段条同源渲染 done/prog/todo/block，不手算百分比', () => {
    expect(overview).toContain('flexGrow: tr.done')
    expect(overview).toContain('flexGrow: tr.prog')
    expect(overview).toContain('flexGrow: tr.todo')
    expect(overview).toContain('flexGrow: tr.block')
  })
})
