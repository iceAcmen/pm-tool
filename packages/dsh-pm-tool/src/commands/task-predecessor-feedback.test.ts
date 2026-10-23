import { describe, expect, it } from 'vitest'
import { handleTaskCommand } from './task.js'
import { addProject } from '../core/projects.js'
import { addTask, getTask, PredecessorRelationError, updateTask } from '../core/tasks.js'
import { classifyFeedback, commandAccepted } from '../core/ui-feedback.js'
import type { PmDomain } from '../core/storage.js'

function memoryStore() {
  const tables = new Map<string, Map<string, unknown>>()
  const writes: Array<[string, string]> = []
  const domain = { table: (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
    const rows = tables.get(name)!
    return {
      get: (id: string) => rows.get(id),
      put: (id: string, value: unknown) => {
        writes.push([name, id])
        rows.set(id, structuredClone(value))
      },
      entries: () => rows.entries(), keys: () => rows.keys(), list: () => [...rows.values()],
    }
  } } as unknown as PmDomain
  const snapshot = () => JSON.stringify([...tables].filter(([, rows]) => rows.size)
    .sort(([a], [b]) => a.localeCompare(b)).map(([name, rows]) => [name, [...rows]]))
  return { domain, writes, snapshot }
}

async function fixture() {
  const store = memoryStore()
  const p = await addProject(store.domain, { name: '关系反馈开发回归', startDate: '2026-01-01', targetDate: '2026-12-31' })
  const other = await addProject(store.domain, { name: '其他项目', startDate: '2026-01-01', targetDate: '2026-12-31' })
  const a = await addTask(store.domain, { projectId: p.id, title: '任务 A' })
  const b = await addTask(store.domain, { projectId: p.id, title: '任务 B', predecessorIds: [a.id] })
  const foreign = await addTask(store.domain, { projectId: other.id, title: '跨项目任务' })
  return { ...store, p, a, b, foreign }
}

describe('CF-R01 前置关系业务拒绝只返回已知原因', () => {
  it.each([
    ['自身', 't-0001', '前置依赖不能包含任务自身'],
    ['不存在', 't-9999', '前置依赖任务不存在：t-9999'],
    ['跨项目', 't-0003', '前置依赖任务 t-0003 不属于当前项目'],
    ['循环', 't-0002', '前置依赖存在循环：任务不能间接地依赖自己'],
  ])('%s：command 保完整中文原因、core 窄类型、全域零写', async (_label, id, reason) => {
    const s = await fixture(), before = s.snapshot(), puts = s.writes.length
    const patch = { title: '拒绝草稿', predecessorIds: [id] }
    const response = await handleTaskCommand(`update ${s.a.id} ${JSON.stringify(patch)}`, s.domain)
    expect(response).toEqual({ kind: 'error', text: reason })
    expect(classifyFeedback(`执行失败：${response.text}`, { kind: 'error' }))
      .toMatchObject({ isError: true, autoDismissMs: null, structured: false })
    expect(commandAccepted(`执行失败：${response.text}`)).toBe(false)
    await expect(updateTask(s.domain, s.a.id, patch)).rejects.toBeInstanceOf(PredecessorRelationError)
    expect(s.snapshot()).toBe(before)
    expect(s.writes).toHaveLength(puts)
  })

  it.each([
    ['t-0004', '前置依赖不能包含任务自身'],
    ['t-9999', '前置依赖任务不存在：t-9999'],
    ['t-0003', '前置依赖任务 t-0003 不属于当前项目'],
  ])('add 前置 %s：拒绝零写、不占用稳定 ID', async (id, reason) => {
    const s = await fixture(), before = s.snapshot(), puts = s.writes.length
    const response = await handleTaskCommand(`add ${JSON.stringify({
      projectId: s.p.id, title: '新建拒绝草稿', predecessorIds: [id],
    })}`, s.domain)
    expect(response).toEqual({ kind: 'error', text: reason })
    expect(s.snapshot()).toBe(before)
    expect(s.writes).toHaveLength(puts)
    const created = await addTask(s.domain, { projectId: s.p.id, title: '合法重试' })
    expect(created.id).toBe('t-0004')
  })

  it('解除成环后同草稿重试一次任务 put；合法依赖去重与成功信封不变', async () => {
    const s = await fixture(), puts = s.writes.length
    const rejected = await handleTaskCommand(`update ${s.a.id} ${JSON.stringify({
      title: '失败 / Error / permission 已修复', predecessorIds: [s.b.id],
    })}`, s.domain)
    expect(rejected.kind).toBe('error')
    expect(s.writes).toHaveLength(puts)
    const accepted = await handleTaskCommand(`update ${s.a.id} ${JSON.stringify({
      title: '失败 / Error / permission 已修复', predecessorIds: [],
    })}`, s.domain)
    expect(accepted.kind).toBe('success')
    expect(s.writes.slice(puts)).toEqual([['tasks', s.a.id]])
    expect(getTask(s.domain, s.a.id)?.predecessorIds).toBeUndefined()
    expect(classifyFeedback(accepted.text)).toMatchObject({ isError: false, structured: true, autoDismissMs: 3000 })
    expect(commandAccepted(accepted.text)).toBe(true)
    await updateTask(s.domain, s.b.id, { predecessorIds: [s.a.id, s.a.id] })
    expect(getTask(s.domain, s.b.id)?.predecessorIds).toEqual([s.a.id])
  })

  it.each([
    new Error('unknown-storage-detail /isolated/private-path'),
    new AggregateError([], 'unknown-aggregate-detail /isolated/private-path'),
  ])('未知异常不直接透出原文或路径：%s', async error => {
    const domain = { table: () => ({ get: () => { throw error } }) } as unknown as PmDomain
    const response = await handleTaskCommand('update t-0001 {"title":"保守拒绝"}', domain)
    expect(response).toEqual({ kind: 'error',
      text: '任务操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' })
  })

  it('AggregateError 的既有原始错误/回滚摘要不变', async () => {
    const error = new AggregateError([new Error('写入失败'), new Error('恢复记录失败')],
      '移动并重新编号失败，且部分任务记录恢复失败')
    const domain = { table: () => ({ get: () => { throw error } }) } as unknown as PmDomain
    const response = await handleTaskCommand('update t-0001 {"title":"回滚控制"}', domain)
    expect(response).toEqual({ kind: 'error', text: [
      error.message, '原始错误：写入失败', '恢复失败（1 项）：', '  - 恢复记录失败',
    ].join('\n') })
  })
})
