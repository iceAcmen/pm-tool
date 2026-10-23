import React from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { appendFileSync } from 'node:fs'
import { PmPanel } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { TaskTable } from '../../packages/dsh-pm-tool/src/client/views/tasks.js'
import { ResultCard } from '../../packages/dsh-pm-tool/src/client/result-card.js'
import { buildActionLine, buildSuccessEnvelope, classifyFeedback } from '../../packages/dsh-pm-tool/src/core/ui-feedback.js'

let view: ReactTestRenderer | undefined
let execute: ReturnType<typeof vi.fn>, writer: ReturnType<typeof vi.fn>
const line = 'task update t-0001 {}'
const snapshot = { projects: [{ id: 'p-0001', name: 'A18 independent' }],
  tasks: [], milestones: [], riskIssues: [], deliverables: [], meetings: [], reports: [] }
const exactRaw = `Response parsing failed; received text follows:\n${buildSuccessEnvelope(
  ['任务｜t-0001｜Failed delivery'], '{"id":"t-0001","title":"Error register"}')}`
const marked = `${exactRaw}\n${buildActionLine('Never execute reason', 'task remove t-0001 confirm')}\n \t尾部  \n\n`
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
const table = () => view!.root.findByType(TaskTable)
const card = () => view!.root.findByType(ResultCard)
const node = () => view!.root.findAll(n => typeof n.props.className === 'string' &&
  n.props.className.split(' ').includes('pm-result-card'))[0]
const toast = () => view!.root.findAllByProps({ className: 'pm-toast pm-toast--success' })
const copyState = () => view!.root.findAll(n => String(n.props.className).startsWith('pm-result-card__copy-state'))
const button = (label: string) => node().findAllByType('button').find(n => text(n) === label)!
function deferred<T>() {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void
  const promise = new Promise<T>((ok, no) => { resolve = ok; reject = no })
  return { promise, resolve, reject }
}
function observe(id: string, extra = {}) {
  appendFileSync(process.env.TF_OBSERVATIONS!, `${JSON.stringify({ id, ...extra,
    message: card().props.message, context: card().props.context ?? null, generation: card().props.messageGeneration,
    classified: classifyFeedback(card().props.message, card().props.context),
    card: node() ? { role: node().props.role, live: node().props['aria-live'], text: text(node()) } : null,
    toasts: toast().map(text), copies: writer.mock.calls, calls: execute.mock.calls.map(c => c[0]),
  })}\n`)
}
async function open() {
  await act(async () => { view = create(<PmPanel execute={execute}/>) })
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot'])
}
async function fail(raw: string, quiet = false) {
  const gate = deferred<string>()
  execute.mockReturnValueOnce(gate.promise)
  let request!: Promise<boolean>
  await act(async () => { request = table().props.run(line, { quiet }) })
  expect(table().props.disabled).toBe(true)
  await act(async () => { expect(await table().props.run(line, { quiet })).toBe(false) })
  await act(async () => { gate.reject(new Error(raw)); expect(await request).toBe(false) })
  expect(table().props.disabled).toBe(false)
}
async function success(message: string, quiet = false) {
  execute.mockResolvedValueOnce(message)
  await act(async () => { expect(await table().props.run(line, { quiet })).toBe(true) })
  expect(table().props.disabled).toBe(false)
}
function error(message: string) {
  expect(card().props.message).toBe(message)
  expect(card().props.context).toEqual({ kind: 'error' })
  expect(node().props.role).toBe('alert')
  expect(node().props['aria-live']).toBe('assertive')
  expect(node().props.className).toContain('pm-result-card--error')
  expect(node().findAll(n => n.type === 'svg' && String(n.props.className).includes('lucide-check'))).toHaveLength(0)
  expect(node().findAll(n => n.type === 'svg' && String(n.props.className).includes('lucide-triangle-alert'))).toHaveLength(1)
  expect(text(view!.root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
  expect(classifyFeedback(message, card().props.context)).toEqual({
    isError: true, structured: false, summary: [message], detail: null, action: null, autoDismissMs: null,
  })
  expect(view!.root.findAllByProps({ className: 'pm-result-action' })).toHaveLength(0)
  expect(view!.root.findAllByProps({ className: 'pm-result-card__toggle' })).toHaveLength(0)
  expect(toast()).toHaveLength(0)
}
beforeEach(() => {
  const events = new EventTarget()
  vi.stubGlobal('window', { location: { hash: '', pathname: '/', search: '' },
    history: { replaceState: vi.fn() }, matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout })
  vi.stubGlobal('document', { activeElement: null })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
  vi.stubGlobal('fetch', () => { throw new Error('A18 independent forbids network') })
  writer = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText: writer } })
  execute = vi.fn(async (command: string) => {
    if (command === 'web snapshot') return JSON.stringify(snapshot)
    throw new Error(`Unexpected command ${command}`)
  })
})
afterEach(() => {
  if (view) act(() => view!.unmount())
  view = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it.each([false, true])('A18-X01 exact original TF-X08 quiet=%s full text/copy/persistence/no action', async quiet => {
  await open()
  vi.useFakeTimers()
  await fail(exactRaw, quiet)
  const message = `执行失败：${exactRaw}`
  error(message)
  expect(classifyFeedback(message)).toMatchObject({ isError: false, structured: true, autoDismissMs: 3000 })
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
  expect(text(node())).toContain('已复制')
  act(() => vi.advanceTimersByTime(20000))
  error(message)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
  observe('A18-X01-complete', { quiet, exactOriginalBody: true })
})

it.each([false, true])('A18-X02 marked action and whitespace reason quiet=%s never executes or truncates', async quiet => {
  await open()
  vi.useFakeTimers()
  await fail(marked, quiet)
  const message = `执行失败：${marked}`
  error(message)
  expect(node().findAllByType('button').map(text)).toEqual(['', '复制原文'])
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
  act(() => vi.advanceTimersByTime(60000))
  error(message)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
  observe('A18-X02-complete', { quiet })
})

it.each(['resolve', 'reject'])('A18-X03 same string error-success-error with late copy %s', async outcome => {
  await open()
  await fail(marked)
  const message = card().props.message, first = card().props.messageGeneration
  const gate = deferred<void>()
  writer.mockReturnValueOnce(gate.promise)
  act(() => button('复制原文').props.onClick())
  await success(message)
  expect(card().props.context).toBeUndefined()
  expect(card().props.messageGeneration).toBeGreaterThan(first)
  expect(node().props.role).toBe('status')
  expect(view!.root.findAllByProps({ className: 'pm-result-action' })).toHaveLength(1)
  expect(toast()).toHaveLength(1)
  act(() => button('详情 ▾').props.onClick())
  expect(view!.root.findAllByProps({ className: 'pm-result-card__detail' })).toHaveLength(1)
  const second = card().props.messageGeneration
  await fail(marked, true)
  expect(card().props.messageGeneration).toBeGreaterThan(second)
  error(message)
  await act(async () => { outcome === 'resolve' ? gate.resolve(undefined) : gate.reject(new Error('late copy denied')) })
  expect(copyState()).toHaveLength(0)
  expect(view!.root.findAllByProps({ className: 'pm-result-card__detail' })).toHaveLength(0)
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message], [message]])
  expect(text(node())).toContain('已复制')
  observe(`A18-X03-${outcome}`)
})

it.each(['resolve', 'reject'])('A18-X04 identical error new generation invalidates copy %s', async outcome => {
  await open()
  await fail(marked)
  const first = card().props.messageGeneration
  const gate = deferred<void>()
  writer.mockReturnValueOnce(gate.promise)
  act(() => button('复制原文').props.onClick())
  await fail(marked, true)
  expect(card().props.messageGeneration).toBeGreaterThan(first)
  await act(async () => { outcome === 'resolve' ? gate.resolve(undefined) : gate.reject(new Error('old denied')) })
  expect(copyState()).toHaveLength(0)
  error(`执行失败：${marked}`)
  await act(async () => { button('复制原文').props.onClick() })
  expect(text(node())).toContain('已复制')
  observe(`A18-X04-${outcome}`)
})

it.each(['resolve', 'reject'])('A18-X05 close then same success and error late copy %s cannot leak', async outcome => {
  await open()
  await fail(marked)
  const message = card().props.message
  const gate = deferred<void>()
  writer.mockReturnValueOnce(gate.promise)
  act(() => button('复制原文').props.onClick())
  act(() => node().findByProps({ 'aria-label': '关闭结果卡' }).props.onClick())
  expect(view!.root.findAllByType(ResultCard)).toHaveLength(0)
  expect(toast()).toHaveLength(0)
  await success(message)
  expect(card().props.context).toBeUndefined()
  expect(node().props.role).toBe('status')
  await act(async () => { outcome === 'resolve' ? gate.resolve(undefined) : gate.reject(new Error('old denied')) })
  expect(copyState()).toHaveLength(0)
  await fail(marked)
  error(message)
  expect(copyState()).toHaveLength(0)
  observe(`A18-X05-${outcome}`)
})

it('A18-X06 identical success generation resets full TTL after previous expiry', async () => {
  await open()
  vi.useFakeTimers()
  const message = buildSuccessEnvelope(['失败 / Failed / Error'])
  await success(message)
  const first = card().props.messageGeneration
  act(() => vi.advanceTimersByTime(3000))
  expect(toast()).toHaveLength(0)
  await success(message)
  expect(card().props.messageGeneration).toBeGreaterThan(first)
  expect(toast()).toHaveLength(1)
  act(() => vi.advanceTimersByTime(2999))
  expect(toast()).toHaveLength(1)
  act(() => vi.advanceTimersByTime(1))
  expect(toast()).toHaveLength(0)
  expect(card().props.context).toBeUndefined()
  observe('A18-X06')
})

it('A18-X07 queued old timers across catch and close never hide new same success', async () => {
  await open()
  const callbacks: Array<() => void> = []
  vi.stubGlobal('setTimeout', vi.fn((f: () => void) => { callbacks.push(f); return callbacks.length }))
  vi.stubGlobal('clearTimeout', vi.fn())
  const message = `${buildActionLine('Open', 'task list p-0001')}\n${buildSuccessEnvelope(['Failed / Error'])}`
  await success(message)
  const old = callbacks.at(-1)!
  await fail(marked)
  act(() => old())
  error(`执行失败：${marked}`)
  act(() => node().findByProps({ 'aria-label': '关闭结果卡' }).props.onClick())
  act(() => old())
  expect(toast()).toHaveLength(0)
  await success(message)
  const current = callbacks.at(-1)!
  expect(current).not.toBe(old)
  act(() => { old(); old() })
  expect(toast()).toHaveLength(1)
  act(() => current())
  expect(toast()).toHaveLength(0)
  await success(message)
  act(() => { current(); old() })
  expect(toast()).toHaveLength(1)
  observe('A18-X07')
})

it('A18-X08 quiet success keeps existing error context and does not silently clear message', async () => {
  await open()
  await fail(marked)
  const message = card().props.message, generation = card().props.messageGeneration
  await success(buildSuccessEnvelope(['quiet success']), true)
  expect(card().props.messageGeneration).toBe(generation)
  error(message)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line, line, 'web snapshot'])
  observe('A18-X08')
})

it('A18-X09 current copy rejection remains error and full text, retry only copies', async () => {
  await open()
  await fail(marked)
  writer.mockRejectedValueOnce(new Error('clipboard denied'))
  await act(async () => { button('复制原文').props.onClick() })
  error(`执行失败：${marked}`)
  expect(text(node())).toContain('复制失败，请手动复制')
  expect(text(node())).not.toContain('已复制')
  await act(async () => { button('复制原文').props.onClick() })
  expect(text(node())).toContain('已复制')
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
  observe('A18-X09')
})

it.each(['resolve', 'reject'])('A18-X10 unmounted old card copy %s cannot mark reopened message', async outcome => {
  await open()
  await fail(marked)
  const gate = deferred<void>()
  writer.mockReturnValueOnce(gate.promise)
  act(() => button('复制原文').props.onClick())
  act(() => view!.unmount())
  await act(async () => { view = create(<PmPanel execute={execute}/>) })
  await fail(marked)
  await act(async () => { outcome === 'resolve' ? gate.resolve(undefined) : gate.reject(new Error('unmounted denied')) })
  expect(copyState()).toHaveLength(0)
  error(`执行失败：${marked}`)
  observe(`A18-X10-${outcome}`)
})
