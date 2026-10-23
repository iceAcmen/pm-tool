import React from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PmPanel } from './panel.js'
import { TaskTable } from './views/tasks.js'
import { ResultCard } from './result-card.js'
import { buildActionLine, buildSuccessEnvelope, classifyFeedback } from '../core/ui-feedback.js'
import { projectWriteSchema } from '../core/project.js'
import { taskWriteSchema } from '../core/task.js'

let view: ReactTestRenderer | undefined
let execute: ReturnType<typeof vi.fn>
let writer: ReturnType<typeof vi.fn>
const line = 'task update t-0001 {}'
const snapshot = {
  projects: [{ id: 'p-0001', name: '传输异常反馈隔离测试' }],
  tasks: [], milestones: [], riskIssues: [], deliverables: [], meetings: [], reports: [],
}
const errors = [
  ['fetch', () => new Error('Failed to fetch')],
  ['a15-full', () => new Error('client api: commands/execute failed: Failed to fetch')],
  ['abort', () => Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' })],
  ['unknown-string', () => 'opaque transport reason'],
  ['unknown-object', () => ({ code: 17, cause: 'opaque' })],
] as const
const matrix = errors.flatMap(([kind, make]) => [false, true].map(quiet => [kind, make, quiet] as const))
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
const table = () => view!.root.findByType(TaskTable)
const card = () => view!.root.findByType(ResultCard)
const cardNode = () => view!.root.findByProps({ className: 'pm-result-card pm-result-card--error' })
const button = (label: string) => cardNode().findAllByType('button').find(n => text(n) === label)!
function pending() {
  let reject!: (error: unknown) => void
  const promise = new Promise<string>((_, no) => { reject = no })
  return { promise, reject }
}
async function open() {
  await act(async () => { view = create(<PmPanel execute={execute} executeRaw={async () => {
    throw new Error('传输反馈单测禁止 raw 命令')
  }}/>) })
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot'])
}
async function rejectRun(error: unknown, quiet: boolean) {
  const gate = pending()
  execute.mockReturnValueOnce(gate.promise)
  let request!: Promise<boolean>
  await act(async () => { request = table().props.run(line, { quiet }) })
  expect(table().props.disabled).toBe(true)
  let duplicate: boolean | undefined
  await act(async () => { duplicate = await table().props.run(line, { quiet }) })
  expect(duplicate).toBe(false)
  let accepted: boolean | undefined
  await act(async () => { gate.reject(error); accepted = await request })
  expect(accepted).toBe(false)
  expect(table().props.disabled).toBe(false)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
}
beforeEach(() => {
  const events = new EventTarget()
  vi.stubGlobal('window', {
    location: { hash: '', pathname: '/', search: '' }, history: { replaceState: vi.fn() },
    matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
  })
  vi.stubGlobal('document', { activeElement: null })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
  vi.stubGlobal('fetch', () => { throw new Error('传输反馈单测禁止网络') })
  writer = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText: writer } })
  execute = vi.fn(async (command: string) => {
    if (command === 'web snapshot') return JSON.stringify(snapshot)
    throw new Error(`未预置命令：${command}`)
  })
})
afterEach(() => {
  if (view) act(() => view!.unmount())
  view = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it.each(matrix)('明确 catch %s quiet=%s/%s 保错误全文、false、解锁和同命令重试', async (_, make, quiet) => {
  await open()
  const error = make()
  const raw = error instanceof Error ? error.message : String(error)
  await rejectRun(error, quiet)
  const message = `执行失败：${raw}`
  expect(card().props.message).toBe(message)
  expect(cardNode().props.role).toBe('alert')
  expect(cardNode().props['aria-live']).toBe('assertive')
  expect(cardNode().findAll(n => n.type === 'svg' && String(n.props.className).includes('lucide-check'))).toHaveLength(0)
  expect(cardNode().findAll(n => n.type === 'svg' && String(n.props.className).includes('lucide-triangle-alert'))).toHaveLength(1)
  expect(text(view!.root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
  expect(classifyFeedback(message)).toMatchObject({ isError: true, autoDismissMs: null })
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
  expect(text(cardNode())).toContain('已复制')
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
  execute.mockResolvedValueOnce('任务已更新：Failed delivery / Error register')
  let retried: boolean | undefined
  await act(async () => { retried = await table().props.run(line, { quiet }) })
  expect(retried).toBe(true)
  expect(table().props.disabled).toBe(false)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line, line, 'web snapshot'])
})

it.each([
  '执行失败：client api: commands/execute failed: Failed to fetch',
  '执行失败:opaque transport reason',
  '执行失败',
])('已带失败场景不重复前缀：%s', async message => {
  await open()
  await rejectRun(new Error(message), false)
  expect(card().props.message).toBe(message)
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
})

it('长多行 Error.message 原全文显示和复制，quiet 不吞错且超3秒不消失', async () => {
  await open()
  vi.useFakeTimers()
  const raw = `client api: commands/execute failed: Failed to fetch\n${'opaque detail / Error register\n'.repeat(200)}尾部完整原因`
  await rejectRun(new Error(raw), true)
  const message = `执行失败：${raw}`
  expect(card().props.message).toBe(message)
  expect(text(view!.root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
  act(() => { vi.advanceTimersByTime(3100) })
  expect(card().props.message).toBe(message)
  expect(cardNode().props.role).toBe('alert')
  expect(table().props.disabled).toBe(false)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
})

const markedRaw = `Response parsing failed; received text follows:\n${
  buildSuccessEnvelope(['任务｜t-0001｜Failed delivery'], '{"id":"t-0001","title":"Error register"}')}`
const toast = () => view!.root.findAllByProps({ className: 'pm-toast pm-toast--success' })
const copyStates = () => view!.root.findAll(n => String(n.props.className).startsWith('pm-result-card__copy-state'))
it.each([false, true])('A18 标记原因quiet=%s完整alert/复制/无动作/持久，成功和close清上下文', async quiet => {
  await open()
  vi.useFakeTimers()
  const raw = `${markedRaw}\n${buildActionLine('不能执行错误动作', 'task remove t-0001 confirm')}\n  保留末尾  `
  await rejectRun(new Error(raw), quiet)
  const message = `执行失败：${raw}`
  expect(card().props.message).toBe(message)
  expect(card().props.context).toEqual({ kind: 'error' })
  expect(classifyFeedback(message, card().props.context)).toMatchObject({
    isError: true, structured: false, action: null, detail: null, autoDismissMs: null,
  })
  expect(cardNode().props.role).toBe('alert')
  expect(text(view!.root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
  expect(view!.root.findAllByProps({ className: 'pm-result-action' })).toHaveLength(0)
  expect(toast()).toHaveLength(0)
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
  act(() => { vi.advanceTimersByTime(10000) })
  expect(cardNode().props.role).toBe('alert')
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
  const success = `${buildActionLine('查看记录', 'task list p-0001')}\n${
    buildSuccessEnvelope(['任务｜t-0001｜失败 / Failed / Error register'], '{"title":"成功完整字段"}')}`
  execute.mockResolvedValueOnce(success)
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  expect(card().props.context).toBeUndefined()
  expect(view!.root.findByProps({ role: 'status', 'aria-live': 'polite', className: 'pm-result-card' })).toBeDefined()
  expect(copyStates()).toHaveLength(0)
  expect(toast()).toHaveLength(1)
  act(() => view!.root.findByProps({ 'aria-label': '关闭结果卡' }).props.onClick())
  expect(view!.root.findAllByType(ResultCard)).toHaveLength(0)
  expect(toast()).toHaveLength(0)
  execute.mockResolvedValueOnce(success)
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  expect(card().props.context).toBeUndefined()
  expect(toast()).toHaveLength(1)
})

it.each(['resolve', 'reject'] as const)('A18 相同error全文新消息清复制且旧%s不能污染', async outcome => {
  await open()
  await rejectRun(new Error(markedRaw), false)
  let resolve!: () => void, reject!: (error: Error) => void
  const delayed = new Promise<void>((ok, no) => { resolve = ok; reject = no })
  await act(async () => { button('复制原文').props.onClick() })
  expect(copyStates()).toHaveLength(1)
  writer.mockReturnValueOnce(delayed)
  act(() => button('复制原文').props.onClick())
  execute.mockRejectedValueOnce(new Error(markedRaw))
  await act(async () => { expect(await table().props.run(line, { quiet: true })).toBe(false) })
  expect(copyStates()).toHaveLength(0)
  await act(async () => { outcome === 'resolve' ? resolve() : reject(new Error('late denied')) })
  expect(copyStates()).toHaveLength(0)
  expect(cardNode().props.role).toBe('alert')
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual(Array.from({ length: 3 }, () => [`执行失败：${markedRaw}`]))
  expect(text(cardNode())).toContain('已复制')
})

it('A18 旧success timer已排队也不能隐藏新success，同值新消息重新计时', async () => {
  await open()
  vi.useFakeTimers()
  const success = buildSuccessEnvelope(['任务｜t-0001｜Failed / Error'])
  execute.mockResolvedValueOnce(success)
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  const oldTimer = vi.getTimerCount()
  expect(oldTimer).toBeGreaterThan(0)
  act(() => { vi.advanceTimersByTime(2900) })
  execute.mockResolvedValueOnce(success)
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  act(() => { vi.advanceTimersByTime(200) })
  expect(toast()).toHaveLength(1)
  execute.mockRejectedValueOnce(new Error(markedRaw))
  await act(async () => { expect(await table().props.run(line)).toBe(false) })
  act(() => { vi.advanceTimersByTime(4000) })
  expect(toast()).toHaveLength(0)
  expect(cardNode().props.role).toBe('alert')
  execute.mockResolvedValueOnce(success)
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  act(() => { vi.advanceTimersByTime(2999) })
  expect(toast()).toHaveLength(1)
  act(() => { vi.advanceTimersByTime(1) })
  expect(toast()).toHaveLength(0)
})

it('A18 已排队旧timer回调在新消息后调用不改变新toast', async () => {
  await open()
  const timers: Array<() => void> = []
  vi.stubGlobal('setTimeout', vi.fn((callback: () => void) => { timers.push(callback); return timers.length }))
  vi.stubGlobal('clearTimeout', vi.fn())
  const success = buildSuccessEnvelope(['任务｜t-0001｜Error register'])
  execute.mockResolvedValueOnce(success)
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  const oldCallback = timers.at(-1)!
  execute.mockResolvedValueOnce(success)
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  const newCallback = timers.at(-1)!
  expect(newCallback).not.toBe(oldCallback)
  act(() => oldCallback())
  expect(toast()).toHaveLength(1)
  act(() => newCallback())
  expect(toast()).toHaveLength(0)
})

it('A18 原TF-X08生产信封全文逐字显示复制，实际context持久且无toast', async () => {
  await open()
  vi.useFakeTimers()
  await rejectRun(new Error(markedRaw), true)
  const message = `执行失败：${markedRaw}`
  expect(cardNode().props.role).toBe('alert')
  expect(cardNode().props['aria-live']).toBe('assertive')
  expect(card().props.message).toBe(message)
  expect(text(view!.root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
  expect(classifyFeedback(message, card().props.context)).toEqual({
    isError: true, structured: false, summary: [message], detail: null, action: null, autoDismissMs: null,
  })
  expect(classifyFeedback(message)).toMatchObject({ isError: false, structured: true, autoDismissMs: 3000 })
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
  act(() => { vi.advanceTimersByTime(3100) })
  expect(cardNode().props.role).toBe('alert')
  expect(toast()).toHaveLength(0)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
})

it.each(['resolve', 'reject'] as const)('A18 面板同值正文catch→正常success清context，旧复制%s不串', async outcome => {
  await open()
  await rejectRun(new Error(markedRaw), false)
  const message = card().props.message
  let resolve!: () => void, reject!: (error: Error) => void
  writer.mockReturnValueOnce(new Promise<void>((ok, no) => { resolve = ok; reject = no }))
  act(() => button('复制原文').props.onClick())
  execute.mockResolvedValueOnce(message)
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  expect(view!.root.findAllByProps({ role: 'alert' })).toHaveLength(0)
  expect(toast()).toHaveLength(1)
  expect(view!.root.findAllByProps({ className: 'pm-result-card' })).toHaveLength(0)
  await act(async () => { outcome === 'resolve' ? resolve() : reject(new Error('late denied')) })
  expect(copyStates()).toHaveLength(0)
  expect(toast()).toHaveLength(1)
  execute.mockRejectedValueOnce(new Error(markedRaw))
  await act(async () => { expect(await table().props.run(line)).toBe(false) })
  expect(card().props.message).toBe(message)
  expect(card().props.context).toEqual({ kind: 'error' })
  expect(copyStates()).toHaveLength(0)
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message], [message]])
})

it('stale通知在main纵向内容位，失败保原项目任务/原因，重试成功不清旧error卡', async () => {
  const at = '2026-10-23T00:00:00.000Z'
  const project = projectWriteSchema.parse({
    id: 'p-0001', name: '陈旧通知隔离项目', description: '', owner: '', status: 'active',
    startDate: '2026-10-01', targetDate: '2026-10-31', createdAt: at, updatedAt: at,
  })
  const task = taskWriteSchema.parse({
    id: 't-0001', projectId: project.id, parentId: null, code: '1', title: '陈旧通知隔离任务',
    description: '原说明', assignee: '', status: 'todo', priority: 'P1', progress: 0,
    milestoneId: null, order: 1, createdAt: at, updatedAt: at,
  })
  const populated = { ...snapshot, projects: [project], tasks: [task] }
  execute.mockResolvedValue(JSON.stringify(populated))
  await open()
  const refresh = view!.root.findByProps({ 'aria-label': '刷新数据' })
  execute.mockRejectedValueOnce(new Error('stale snapshot original reason'))
  await act(async () => { refresh.props.onClick() })
  expect(table().props.tasks).toEqual([task])
  expect(text(view!.root)).toContain(project.name)
  const originalError = card().props.message
  expect(originalError).toContain('stale snapshot original reason')
  const banner = view!.root.findByProps({ className: 'pm-stale-banner' })
  expect(banner.props.role).toBe('status')
  expect(text(banner)).toContain('当前为上次读取的旧数据，最新内容暂未加载成功。')
  const retry = banner.findByProps({ className: 'pm-stale-banner__retry' })
  expect(text(retry)).toBe('重试')
  expect(retry.props.disabled).not.toBe(true)
  expect(banner.parent?.props.className).toBe('pm-main')
  expect(view!.root.findByProps({ className: 'pm-shell' }).children.includes(banner)).toBe(false)
  let resolve!: (value: string) => void
  execute.mockReturnValueOnce(new Promise<string>(ok => { resolve = ok }))
  await act(async () => { retry.props.onClick() })
  expect(table().props.tasks).toEqual([task])
  expect(table().props.disabled).toBe(true)
  await act(async () => { resolve(JSON.stringify(populated)) })
  expect(table().props.tasks).toEqual([task])
  expect(table().props.disabled).toBe(false)
  expect(view!.root.findAllByProps({ className: 'pm-stale-banner' })).toHaveLength(0)
  expect(card().props.message).toBe(originalError)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', 'web snapshot', 'web snapshot'])
})
