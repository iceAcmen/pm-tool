import React from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import { appendFileSync, readFileSync } from 'node:fs'
import { handleTaskCommand } from '../../packages/dsh-pm-tool/src/commands/task.js'
import { addProject } from '../../packages/dsh-pm-tool/src/core/projects.js'
import { addTask, getTask, updateTask } from '../../packages/dsh-pm-tool/src/core/tasks.js'
import { classifyFeedback, commandAccepted } from '../../packages/dsh-pm-tool/src/core/ui-feedback.js'
import { ResultCard } from '../../packages/dsh-pm-tool/src/client/result-card.js'
import type { PmDomain } from '../../packages/dsh-pm-tool/src/core/storage.js'

const cycleReason = '前置依赖存在循环：任务不能间接地依赖自己'
const generic = '任务操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。'
let view: ReactTestRenderer | undefined
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
function observe(id: string, facts: unknown) {
  appendFileSync(process.env.CF_OBSERVATIONS!, `${JSON.stringify({ id, facts })}\n`)
}
function memoryDomain() {
  const tables = new Map<string, Map<string, unknown>>()
  const writes: Array<{ table: string, id: string, value: unknown }> = []
  const domain = { table: (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
    const rows = tables.get(name)!
    return {
      get: (id: string) => rows.get(id),
      put: (id: string, value: unknown) => {
        writes.push({ table: name, id, value: structuredClone(value) })
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
  const store = memoryDomain()
  const p = await addProject(store.domain, { name: '循环原因独立控制', startDate: '2026-01-01', targetDate: '2026-12-31' })
  await addProject(store.domain, { name: '跨项目控制', startDate: '2026-01-01', targetDate: '2026-12-31' })
  for (let i = 1; i <= 9; i++) {
    const task = await addTask(store.domain, { projectId: p.id, title: `合法任务${i}` })
    expect(task.id).toBe(`t-${String(i).padStart(4, '0')}`)
  }
  const seed = await handleTaskCommand('update t-0008 {"predecessorIds":["t-0009"]}', store.domain)
  expect(seed.kind).toBe('success')
  expect(getTask(store.domain, 't-0008')?.predecessorIds).toEqual(['t-0009'])
  expect(getTask(store.domain, 't-0009')?.predecessorIds).toBeUndefined()
  return store
}
function render(message: string, error = true) {
  act(() => { view = create(<ResultCard message={message} context={error ? { kind: 'error' } : undefined}
    onClose={() => {}} onAction={() => { throw new Error('原因不能成为动作') }}/>) })
  return view!.root
}
function cardError(message: string) {
  const root = render(message)
  const card = root.findByProps({ role: 'alert' })
  expect(card.props['aria-live']).toBe('assertive')
  expect(card.props.className).toContain('pm-result-card--error')
  expect(text(root.findByProps({ className: 'pm-result-card__summary' }))).toContain(message)
  expect(root.findAllByProps({ className: 'pm-result-action' })).toHaveLength(0)
  expect(root.findAllByProps({ className: 'pm-result-card__toggle' })).toHaveLength(0)
  return root
}
afterEach(() => {
  if (view) act(() => view!.unmount())
  view = undefined
  vi.unstubAllGlobals()
})

it('CF-C01 合法 t8→t9，真实 core 反选成环保持原原因与零 put', async () => {
  const s = await fixture(), before = s.snapshot(), writes = s.writes.length
  await expect(updateTask(s.domain, 't-0009', { title: '拒绝草稿', predecessorIds: ['t-0008'] }))
    .rejects.toThrow(cycleReason)
  expect(s.snapshot()).toBe(before)
  expect(s.writes).toHaveLength(writes)
  observe('CF-C01', { before, after: s.snapshot(), newWrites: s.writes.slice(writes), cycleReason })
})

it('CF-R01 真实 command 必须保循环原因而非存储权限兜底，失败零写', async () => {
  const s = await fixture(), before = s.snapshot(), writes = s.writes.length
  const response = await handleTaskCommand('update t-0009 {"title":"拒绝草稿","predecessorIds":["t-0008"]}', s.domain)
  observe('CF-R01', { response, before, after: s.snapshot(), newWrites: s.writes.slice(writes) })
  expect(response.kind).toBe('error')
  expect(s.snapshot()).toBe(before)
  expect(s.writes).toHaveLength(writes)
  expect(classifyFeedback(`执行失败：${response.text}`, { kind: 'error' }).autoDismissMs).toBeNull()
  expect(response.text).toContain(cycleReason)
  const root = cardError(`执行失败：${response.text}`)
  expect(root.findAllByProps({ className: 'pm-result-card__kind' })).toHaveLength(0)
})

it('CF-R02 45真实RPC通用排查建议不能被生产ResultCard标为权限不足', () => {
  const input = JSON.parse(readFileSync(process.env.CF_INPUT!, 'utf8'))
  expect(input.hostResponse.kind).toBe('error')
  expect(input.hostResponse.text).toBe(generic)
  const message = `执行失败：${input.hostResponse.text}`
  const root = cardError(message)
  observe('CF-R02', { message, cardText: text(root),
    kinds: root.findAllByProps({ className: 'pm-result-card__kind' }).map(text) })
  expect(root.findAllByProps({ className: 'pm-result-card__kind' })).toHaveLength(0)
  expect(text(root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
})

it('CF-C02 同被拒草稿只解除前置，retry真实成功一次任务put', async () => {
  const s = await fixture()
  const rejected = await handleTaskCommand('update t-0009 {"title":"同草稿重试","predecessorIds":["t-0008"]}', s.domain)
  expect(rejected.kind).toBe('error')
  const writes = s.writes.length
  const response = await handleTaskCommand('update t-0009 {"title":"同草稿重试","predecessorIds":[]}', s.domain)
  expect(response.kind).toBe('success')
  expect(getTask(s.domain, 't-0009')?.title).toBe('同草稿重试')
  expect(getTask(s.domain, 't-0009')?.predecessorIds).toBeUndefined()
  expect(s.writes.slice(writes).map(w => [w.table, w.id])).toEqual([['tasks', 't-0009']])
  expect(classifyFeedback(response.text)).toMatchObject({ isError: false, structured: true, autoDismissMs: 3000 })
  expect(commandAccepted(response.text)).toBe(true)
  observe('CF-C02', { rejected, response, newWrites: s.writes.slice(writes) })
})

it.each(['失败 / Error / Failed 清单已修复', '权限 / permission 清单已整理'])(
  'CF-C03 真实成功合法标题 %s 不误红不显示权限标签', async title => {
    const s = await fixture()
    const response = await handleTaskCommand(`update t-0009 ${JSON.stringify({ title })}`, s.domain)
    expect(response.kind).toBe('success')
    expect(classifyFeedback(response.text)).toMatchObject({ isError: false, structured: true, autoDismissMs: 3000 })
    expect(commandAccepted(response.text)).toBe(true)
    const root = render(response.text, false)
    expect(root.findAllByProps({ role: 'alert' })).toHaveLength(0)
    expect(root.findAllByProps({ className: 'pm-result-card__kind' })).toHaveLength(0)
    observe('CF-C03', { title, response })
  })

it.each(['执行失败：权限不足，无法写入目录。', '执行失败：EACCES: permission denied, open /isolated/example.json'])(
  'CF-C04 明确权限拒绝原因 %s 保留现有标签和全文', message => {
    const root = cardError(message)
    expect(root.findAllByProps({ className: 'pm-result-card__kind' }).map(text)).toEqual(['权限不足'])
    observe('CF-C04', { message, cardText: text(root) })
  })

it('CF-C05 未知存储异常继续保守error兜底，不直接泄露原始异常', async () => {
  const domain = { table: () => ({ get: () => { throw new Error('unknown-storage-detail /isolated/private-path') } }) } as unknown as PmDomain
  const response = await handleTaskCommand('update t-0009 {"title":"保守拒绝"}', domain)
  expect(response.kind).toBe('error')
  expect(response.text).toBe(generic)
  expect(response.text).not.toContain('unknown-storage-detail')
  observe('CF-C05', { response })
})

it('CF-C06 既有typed里程碑错误仍保原因，零写', async () => {
  const s = await fixture(), before = s.snapshot(), writes = s.writes.length
  const response = await handleTaskCommand('update t-0009 {"milestoneId":"m-9999"}', s.domain)
  expect(response.kind).toBe('error')
  expect(response.text).toBe('未找到里程碑：m-9999')
  expect(s.snapshot()).toBe(before)
  expect(s.writes).toHaveLength(writes)
  observe('CF-C06', { response, newWrites: s.writes.slice(writes) })
})
