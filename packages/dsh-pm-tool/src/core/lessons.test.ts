import { describe, it, expect } from 'vitest'
import {
  addLesson,
  getLesson,
  listLessons,
  finalizeLesson,
  updateLessonDraft,
  normalizeLessonDraft,
  LessonNotFoundError,
  LessonProjectNotFoundError,
  LessonTaskRefNotFoundError,
} from './lessons.js'
import type { PmDomain } from './storage.js'

// X3 失败经验：纯函数归一 + 内存 fake 域集成，零网络/零墙钟。
// 草稿纪律复用 X6：known/pending/blank，留白不编造；仅人定稿；草稿不自动定稿。

function buildFakeDomain() {
  const tables = new Map<string, Map<string, unknown>>()
  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
    const m = tables.get(name)!
    return {
      get: (k: string) => m.get(k),
      put: async (k: string, v: unknown) => { m.set(k, v) },
      entries: () => m.entries(),
      delete: (k: string) => { m.delete(k) },
    }
  }
  const domain = { table } as unknown as PmDomain
  // 种子：项目 + 一个（已收尾的）任务，供 taskId 关联校验。
  domain.table('projects').put('p-0001', { id: 'p-0001', name: '验证项目' })
  domain.table('tasks').put('t-0001', { id: 't-0001', projectId: 'p-0001', title: '烂尾任务', status: 'wrapped' })
  return { domain, tables }
}

describe('normalizeLessonDraft 句级归一（复用 X6 纪律）', () => {
  it('markdown：待核→pending、待补→blank 并进 gaps，known 默认', () => {
    const { lines, gaps } = normalizeLessonDraft({
      markdown: ['排期过于乐观导致延期', '数据未验证', '待补：当时的客户反馈记录'].join('\n'),
    })
    expect(lines.map(l => [l.text, l.mark])).toEqual([
      ['排期过于乐观导致延期', 'known'],
      ['数据未验证', 'pending'],
      ['待补：当时的客户反馈记录', 'blank'],
    ])
    expect(gaps).toEqual(['待补：当时的客户反馈记录'])
  })

  it('句级 lines：mark 缺省 known；blank 行进 gaps；非法 mark 保守按 known', () => {
    const { lines, gaps } = normalizeLessonDraft({
      lines: [
        { text: '原因：需求中途变更', mark: 'known' },
        { text: '避免方法待补', mark: 'blank' },
        { text: '某条', mark: 'weird' as never },
      ],
    })
    expect(lines.map(l => l.mark)).toEqual(['known', 'blank', 'known'])
    expect(gaps).toContain('避免方法待补')
  })

  it('两者皆空：只留白一条 gap，不编造结论', () => {
    const { lines, gaps } = normalizeLessonDraft({})
    expect(lines).toEqual([])
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toContain('待补')
  })
})

describe('addLesson 录入与校验', () => {
  it('markdown 录入 draft，taskId 同项目可关联，落库可读回', async () => {
    const { domain } = buildFakeDomain()
    const rec = await addLesson(domain, {
      projectId: 'p-0001',
      taskId: 't-0001',
      markdown: '原因：排期过于乐观导致延期\n待核：真实工时偏差幅度',
    })
    expect(rec.status).toBe('draft')
    expect(rec.taskId).toBe('t-0001')
    expect(rec.lines.map(l => l.mark)).toEqual(['known', 'pending'])
    expect(getLesson(domain, rec.id)?.id).toBe(rec.id)
  })

  it('taskId 可空；项目不存在抛错；关联任务不存在/跨项目抛错', async () => {
    const { domain } = buildFakeDomain()
    await expect(addLesson(domain, { projectId: 'p-9999', markdown: 'x' }))
      .rejects.toBeInstanceOf(LessonProjectNotFoundError)
    await expect(addLesson(domain, { projectId: 'p-0001', taskId: 't-ghost', markdown: 'x' }))
      .rejects.toBeInstanceOf(LessonTaskRefNotFoundError)
    const ok = await addLesson(domain, { projectId: 'p-0001', markdown: '无关联任务的经验' })
    expect(ok.taskId).toBeUndefined()
  })
})

describe('list / final / edit', () => {
  it('list 按项目过滤升序；final 仅人触发 draft→final，重复 final 幂等', async () => {
    const { domain } = buildFakeDomain()
    const a = await addLesson(domain, { projectId: 'p-0001', markdown: '第一条经验' })
    const b = await addLesson(domain, { projectId: 'p-0001', markdown: '第二条经验' })
    const list = listLessons(domain, 'p-0001')
    expect(list.map(r => r.id)).toEqual([a.id, b.id])
    const finalized = await finalizeLesson(domain, a.id)
    expect(finalized?.status).toBe('final')
    const again = await finalizeLesson(domain, a.id)
    expect(again?.status).toBe('final')
    expect(again?.updatedAt).toBe(finalized?.updatedAt)
    // 未 final 的仍是 draft（不自动定稿）。
    expect(getLesson(domain, b.id)?.status).toBe('draft')
  })

  it('edit 重写 lines/gaps、保持 draft；final/edit 不存在抛 LessonNotFoundError', async () => {
    const { domain } = buildFakeDomain()
    const rec = await addLesson(domain, { projectId: 'p-0001', markdown: '初稿' })
    const updated = await updateLessonDraft(domain, rec.id, '补充：复盘会已确认结论\n待补：改进项跟踪')
    expect(updated?.status).toBe('draft')
    expect(updated?.lines.map(l => l.mark)).toEqual(['known', 'blank'])
    expect(updated?.gaps).toEqual(['待补：改进项跟踪'])
    await expect(finalizeLesson(domain, 'lesson-ghost')).rejects.toBeInstanceOf(LessonNotFoundError)
    await expect(updateLessonDraft(domain, 'lesson-ghost', 'x')).rejects.toBeInstanceOf(LessonNotFoundError)
  })
})
