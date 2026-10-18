import { describe, it, expect } from 'vitest'
import { handleHabitCommand } from './habit.js'
import { addProject } from '../core/projects.js'
import { addHabit } from '../core/habits.js'
import { addOkr } from '../core/okr.js'
import { classifyFeedback, FEEDBACK_SUCCESS_TTL_MS } from '../core/ui-feedback.js'
import type { PmDomain } from '../core/storage.js'

/**
 * 隔离内存域（不落盘、不碰正式 data）：真实 handleHabitCommand → CommandResult →
 * 生产映射 classifyFeedback 的成功信封契约（habit add/update）。
 */
function memoryDomain(): PmDomain {
  const tables = new Map<string, Map<string, unknown>>()
  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
    const m = tables.get(name)!
    return {
      get: (id: string) => m.get(id),
      put: (id: string, v: unknown) => { m.set(id, v) },
      entries: () => m.entries(),
      keys: () => m.keys(),
      list: () => [...m.values()],
    }
  }
  return { table } as unknown as PmDomain
}

describe('habit add/update：成功 CommandResult → classifyFeedback → 结构化信封契约', () => {
  it('add：结构化成功，摘要 ≤2 行，完整字段进 detail，TTL=3000；含 goal/frequency/notes', async () => {
    const domain = memoryDomain()
    const project = await addProject(domain, { name: '习惯回归项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    const res = await handleHabitCommand(
      `add ${project.id} ${JSON.stringify({ title: '晨走', goal: '一周五练', frequency: '每天', notes: '雨天改室内' })}`,
      domain,
    )
    expect(res.kind).toBe('success')
    const fb = classifyFeedback(res.text)
    expect(fb.isError).toBe(false)
    expect(fb.structured).toBe(true)
    expect(fb.summary.length).toBeLessThanOrEqual(2)
    expect(fb.summary.join('\n')).toContain('习惯已录入（草稿）')
    expect(fb.summary.join('\n')).toContain('晨走')
    expect(fb.detail).toBeTruthy()
    expect(fb.detail).toContain('目标：一周五练')
    expect(fb.detail).toContain('频率：每天')
    expect(fb.detail).toContain('备注：雨天改室内')
    // 摘要不 dump 完整时间戳/系统字段。
    expect(fb.summary.join('\n')).not.toContain('createdAt')
    expect(fb.autoDismissMs).toBe(FEEDBACK_SUCCESS_TTL_MS)
  })

  it('update：改名 + 补 goal/frequency/notes，摘要列变更字段，detail 含完整新值', async () => {
    const domain = memoryDomain()
    const project = await addProject(domain, { name: '习惯更新项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    const created = await addHabit(domain, project.id, { title: '晨走' })
    const res = await handleHabitCommand(
      `update ${created.id} ${JSON.stringify({ title: '清晨快走', goal: '一周五练', frequency: '每天', notes: '雨天改室内' })}`,
      domain,
    )
    expect(res.kind).toBe('success')
    const fb = classifyFeedback(res.text)
    expect(fb.isError).toBe(false)
    expect(fb.structured).toBe(true)
    expect(fb.summary.length).toBeLessThanOrEqual(2)
    const summary = fb.summary.join('\n')
    expect(summary).toContain(`习惯已更新｜${created.id}`)
    expect(summary).toContain('清晨快走')
    expect(summary).toContain('已修改：标题、目标、频率、备注')
    expect(fb.detail).toContain('目标：一周五练')
    expect(fb.detail).toContain('备注：雨天改室内')
    expect(fb.autoDismissMs).toBe(FEEDBACK_SUCCESS_TTL_MS)
  })

  it('update 换绑同项目 okrId、null 解绑；摘要区分 关联OKR / 取消关联OKR', async () => {
    const domain = memoryDomain()
    const project = await addProject(domain, { name: '习惯绑定项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    const okr = await addOkr(domain, project.id, { title: 'O', kind: 'objective' })
    const created = await addHabit(domain, project.id, { title: '晨走' })
    const bind = await handleHabitCommand(
      `update ${created.id} ${JSON.stringify({ okrId: okr.id })}`,
      domain,
    )
    expect(bind.kind).toBe('success')
    expect(classifyFeedback(bind.text).summary.join('\n')).toContain('关联OKR')
    const unbind = await handleHabitCommand(
      `update ${created.id} ${JSON.stringify({ okrId: null })}`,
      domain,
    )
    expect(unbind.kind).toBe('success')
    expect(classifyFeedback(unbind.text).summary.join('\n')).toContain('取消关联OKR')
  })

  it('错误（未找到习惯）：持久 autoDismissMs=null，走回退文本', async () => {
    const domain = memoryDomain()
    await addProject(domain, { name: '习惯错误项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    const res = await handleHabitCommand('update habit-nope {"title":"x"}', domain)
    expect(res.kind).toBe('error')
    const fb = classifyFeedback(res.text)
    expect(fb.isError).toBe(true)
    expect(fb.autoDismissMs).toBeNull()
    expect(fb.summary.length).toBeGreaterThan(0)
  })
})
