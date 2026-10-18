import { describe, it, expect } from 'vitest'
import { handleTaskCommand } from './task.js'
import { addProject } from '../core/projects.js'
import { addTask } from '../core/tasks.js'
import { classifyFeedback, FEEDBACK_SUCCESS_TTL_MS } from '../core/ui-feedback.js'
import type { PmDomain } from '../core/storage.js'

/**
 * J5 真实链回归（D7）：真实 handleTaskCommand('update …') → CommandResult →
 * panel run 复用的同一生产映射 classifyFeedback → Notice 展示契约。
 * 内存隔离 domain（不落盘、不碰正式 data），不引入 jsdom。
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

describe('J5 真实链：task update 成功 CommandResult → classifyFeedback → Notice 契约', () => {
  it('成功：摘要 ≤2 行、无 details/任务 ID/代码围栏，完整字段仅进 detail，TTL=3000', async () => {
    const domain = memoryDomain()
    const project = await addProject(domain, { name: 'J5 回归项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
    const task = await addTask(domain, {
      projectId: project.id, title: '补充验收说明', status: 'in_progress', progress: 50,
    })

    const res = await handleTaskCommand(
      `update ${task.id} ${JSON.stringify({ description: '周一客户对齐了验收口径' })}`,
      domain,
    )
    expect(res.kind).toBe('success')
    // 与 panel run → Notice 复用同一生产映射，不复制策略。
    const fb = classifyFeedback(res.text)
    expect(fb.isError).toBe(false)
    expect(fb.structured).toBe(true)
    // 摘要最多 2 行语义。
    expect(fb.summary.length).toBeLessThanOrEqual(2)
    const summary = fb.summary.join('\n')
    expect(summary).toContain(`任务已更新｜${task.id}`)
    expect(summary).toContain('已修改：说明')
    // 摘要无 <details>、无「任务 ID：」、无代码围栏、无完整实体。
    expect(summary).not.toContain('<details>')
    expect(summary).not.toContain('任务 ID：')
    expect(summary).not.toContain('```')
    // 完整字段只进独立 detail，不进摘要（摘要只给变更字段，不 dump 整实体）。
    expect(fb.detail).toBeTruthy()
    expect(fb.detail).toContain('补充验收说明')
    expect(summary).not.toContain('createdAt')
    expect(summary).not.toContain('updatedAt')
    expect(summary).not.toMatch(/进度：\s*\d+%/)
    // 成功结构化提示 3s 自动消失。
    expect(fb.autoDismissMs).toBe(FEEDBACK_SUCCESS_TTL_MS)
  })

  it('错误：持久（不自动消失）、单处、走回退文本', async () => {
    const domain = memoryDomain()
    await addProject(domain, { name: 'J5 错误项目', startDate: '2026-10-10', targetDate: '2026-12-31' })

    const res = await handleTaskCommand('update t-9999 {"description":"x"}', domain)
    expect(res.kind).toBe('error')
    const fb = classifyFeedback(res.text)
    expect(fb.isError).toBe(true)
    // 错误持久：autoDismissMs 为 null（不自动消失）。
    expect(fb.autoDismissMs).toBeNull()
    expect(fb.summary.length).toBeGreaterThan(0)
  })
})
