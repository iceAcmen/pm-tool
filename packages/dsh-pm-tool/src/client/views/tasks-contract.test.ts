import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const tasks = readFileSync(join(here, 'tasks.tsx'), 'utf8')

/**
 * 批次 1A · G-A tasks 视图静态合同门（C/T）。
 * 不渲染、不写库：只锁死「空态走 S0 合同 / 删除不可撤销确认 / 行内直改同源 tally」
 * 这些不得回退到私有空块或绕过确认的行为。R 视觉采证留待合流 F。
 */
describe('G-A tasks 视图 S0 合同门（批次 1A）', () => {
  it('真空 / 无结果态复用 S0 EmptyState，不再用私有 pt-empty 块', () => {
    expect(tasks).toContain("import { EmptyState, PmButton } from '../shared/ui/index.js'")
    expect(tasks).toContain('variant="vacuum"')
    expect(tasks).toContain('variant="noResult"')
    // 真空保留 AI 生成 WBS 下一步 CTA（PmButton primary）
    expect(tasks).toContain('用 AI 一键生成 WBS')
    // 无结果提供清除入口：重置搜索词与快捷筛选，搜索不改 scope
    expect(tasks).toContain("onClear={() => { setQuery(''); setChip('all') }}")
  })

  it('批量删除走 confirmDanger 不可撤销二次确认，不直接删', () => {
    expect(tasks).toContain('confirmBatchDelete')
    expect(tasks).toContain('confirmDanger({')
    expect(tasks).toContain('此操作不可撤销')
    expect(tasks).toContain('确认级联删除')
  })

  it('行内状态/截止/进度直改走 buildUpdate，计数同源 tallyTasksByStatus/donePercent', () => {
    expect(tasks).toContain('buildUpdate({ status: e.currentTarget.value })')
    expect(tasks).toContain('tallyTasksByStatus(tasks.map(t => t.status))')
    expect(tasks).toContain('donePercent(statusTally, tasks.length)')
  })

  it('命名视图保存/分享/删除与导出菜单保留，不被空态改造破坏', () => {
    expect(tasks).toContain('confirmSaveAs')
    expect(tasks).toContain('shareSnapshot')
    expect(tasks).toContain('deleteTaskView')
    expect(tasks).toContain('tasksToCsv')
  })
})
