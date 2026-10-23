import React from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { appendFileSync } from 'node:fs'
import { PmPanel } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { TaskTable } from '../../packages/dsh-pm-tool/src/client/views/tasks.js'
import { ResultCard } from '../../packages/dsh-pm-tool/src/client/result-card.js'
import { buildActionLine, buildSuccessEnvelope, classifyFeedback } from '../../packages/dsh-pm-tool/src/core/ui-feedback.js'

let view: ReactTestRenderer
let execute: ReturnType<typeof vi.fn>
let writer: ReturnType<typeof vi.fn>
const line = 'task update t-0001 {}'
const snapshot = { projects: [{ id: 'p-0001', name: '独立 A17' }],
  tasks: [], milestones: [], riskIssues: [], deliverables: [], meetings: [], reports: [] }
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
const table = () => view.root.findByType(TaskTable)
const card = () => view.root.findByType(ResultCard)
const node = () => view.root.findAll(n => typeof n.props.className === 'string' &&
  n.props.className.split(' ').includes('pm-result-card'))[0]
const button = (label: string) => node().findAllByType('button').find(n => text(n) === label)!
function pending<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void
  const promise = new Promise<T>((ok, no) => { resolve = ok; reject = no })
  return { promise, resolve, reject }
}
function observe(id: string) {
  appendFileSync(process.env.TF_OBSERVATIONS!, `${JSON.stringify({
    id, message: card().props.message, card: node() ? {
      role: node().props.role, live: node().props['aria-live'], className: node().props.className,
      text: text(node()),
    } : null, disabled: table().props.disabled, calls: execute.mock.calls.map(c => c[0]),
    copied: writer.mock.calls, classified: classifyFeedback(card().props.message),
  })}\n`)
}
async function open() {
  await act(async () => { view = create(<PmPanel execute={execute}/>) })
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot'])
}
async function fail(error: unknown, quiet = false) {
  const gate = pending<string>()
  execute.mockReturnValueOnce(gate.promise)
  let request!: Promise<boolean>
  await act(async () => { request = table().props.run(line, { quiet }) })
  expect(table().props.disabled).toBe(true)
  let duplicate: unknown
  await act(async () => { duplicate = await table().props.run(line, { quiet }) })
  expect(duplicate).toBe(false)
  let result: unknown
  await act(async () => { gate.reject(error); result = await request })
  expect(result).toBe(false)
  expect(table().props.disabled).toBe(false)
}
function expectError() {
  expect(node()?.props.role).toBe('alert')
  expect(node().props['aria-live']).toBe('assertive')
  expect(node().props.className).toContain('pm-result-card--error')
  expect(node().findAll(n => n.type === 'svg' && String(n.props.className).includes('lucide-check'))).toHaveLength(0)
  expect(node().findAll(n => n.type === 'svg' && String(n.props.className).includes('lucide-triangle-alert'))).toHaveLength(1)
  expect(classifyFeedback(card().props.message).autoDismissMs).toBeNull()
}
beforeEach(() => {
  const events = new EventTarget()
  vi.stubGlobal('window', { location: { hash: '', pathname: '/', search: '' },
    history: { replaceState: vi.fn() },
    matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout })
  vi.stubGlobal('document', { activeElement: null })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
  vi.stubGlobal('fetch', () => { throw new Error('独立 A17 禁网络') })
  writer = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText: writer } })
  execute = vi.fn(async (command: string) => {
    if (command === 'web snapshot') return JSON.stringify(snapshot)
    throw new Error(`未预置宿主命令：${command}`)
  })
})
afterEach(() => {
  if (view) act(() => view.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const unknowns = [
  ['null', () => null, 'null'], ['undefined', () => undefined, 'undefined'],
  ['number', () => 17, '17'], ['string', () => 'opaque success / Failed / Error', 'opaque success / Failed / Error'],
  ['custom-string', () => ({ toString: () => 'opaque object / preserved' }), 'opaque object / preserved'],
] as const
it.each(unknowns.flatMap(([kind, make, raw]) => [false, true].map(quiet => ({ kind, make, raw, quiet }))))
('TF-X01 unknown $kind quiet=$quiet 原转换/持久错误/明确重试', async ({ make, raw, quiet }) => {
  await open()
  await fail(make(), quiet)
  expect(card().props.message).toBe(`执行失败：${raw}`)
  observe('TF-X01-failed')
  expectError()
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[`执行失败：${raw}`]])
  expect(text(node())).toContain('已复制')
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
  vi.useFakeTimers()
  act(() => vi.advanceTimersByTime(3100))
  expectError()
  execute.mockResolvedValueOnce('任务已更新：Error register / Failed delivery')
  let retried: unknown
  await act(async () => { retried = await table().props.run(line, { quiet }) })
  expect(retried).toBe(true)
  expect(table().props.disabled).toBe(false)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line, line, 'web snapshot'])
  if (!quiet) expect(node().props.role).toBe('status')
  observe('TF-X01-retried')
})

it('TF-X02 长 Error.message 全文显示复制，quiet/关闭不重发', async () => {
  await open()
  const raw = `Response channel failed\n${'Error / Failed / opaque detail\n'.repeat(240)}保留尾部`
  await fail(new Error(raw), true)
  const message = `执行失败：${raw}`
  expect(card().props.message).toBe(message)
  expect(text(view.root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
  expectError()
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
  observe('TF-X02')
  act(() => node().findByProps({ 'aria-label': '关闭结果卡' }).props.onClick())
  expect(node()).toBeUndefined()
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
})

it.each(['resolve', 'reject'])('TF-X03 旧复制 %s 晚到不能污染新 catch 消息', async outcome => {
  await open()
  await fail(new Error('first transport reason'))
  const first = card().props.message
  const gate = pending<void>()
  writer.mockReturnValueOnce(gate.promise)
  act(() => button('复制原文').props.onClick())
  await fail(new Error('second transport reason'), true)
  const second = card().props.message
  expect(second).not.toBe(first)
  expect(view.root.findAll(n => String(n.props.className).startsWith('pm-result-card__copy-state'))).toHaveLength(0)
  await act(async () => { outcome === 'resolve' ? gate.resolve(undefined) : gate.reject(new Error('late denied')) })
  expect(view.root.findAll(n => String(n.props.className).startsWith('pm-result-card__copy-state'))).toHaveLength(0)
  expect(card().props.message).toBe(second)
  expectError()
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[first], [second]])
  expect(text(node())).toContain('已复制')
  observe(`TF-X03-${outcome}`)
})

it('TF-X04 当前复制拒绝不假成功，不改变命令错误与解锁', async () => {
  await open()
  await fail(new Error('client api: commands/execute failed: Failed to fetch'))
  writer.mockRejectedValueOnce(new Error('clipboard denied'))
  await act(async () => { button('复制原文').props.onClick() })
  expect(text(node())).toContain('复制失败，请手动复制')
  expect(text(node())).not.toContain('已复制')
  expectError()
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
  observe('TF-X04')
})

it('TF-X05 catch→成功信封→catch 保状态/详情/动作/复制代际', async () => {
  await open()
  await fail(new Error('Failed to fetch'))
  await act(async () => { button('复制原文').props.onClick() })
  const detail = JSON.stringify({ title: '失败 / Failed / Error register', description: '正文不能广扫误红' })
  const message = `${buildActionLine('查看记录', 'task list p-0001')}\n${buildSuccessEnvelope(['任务｜t-0001｜失败 / Failed / Error register'], detail)}`
  execute.mockResolvedValueOnce(message)
  let accepted: unknown
  await act(async () => { accepted = await table().props.run(line) })
  expect(accepted).toBe(true)
  expect(node().props.role).toBe('status')
  expect(node().props['aria-live']).toBe('polite')
  expect(node().props.className).not.toContain('--error')
  expect(text(node())).not.toContain('已复制')
  act(() => button('详情 ▾').props.onClick())
  expect(text(view.root.findByProps({ className: 'pm-result-card__detail' }))).toBe(detail)
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls.at(-1)).toEqual([message])
  observe('TF-X05-success')
  await fail(new Error('third transport reason'), true)
  expect(view.root.findAllByProps({ className: 'pm-result-card__detail' })).toHaveLength(0)
  expect(text(node())).not.toContain('已复制')
  expectError()
  observe('TF-X05-error')
})

it('TF-X06 结构化成功短提示3秒，随后明确错误仍持久', async () => {
  await open()
  vi.useFakeTimers()
  execute.mockResolvedValueOnce(buildSuccessEnvelope(['任务｜t-0001｜Error register']))
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  expect(node()).toBeUndefined()
  expect(view.root.findAll(n => n.props.role === 'status' && n.props['aria-live'] === 'polite').length).toBeGreaterThan(0)
  act(() => vi.advanceTimersByTime(3100))
  expect(view.root.findAll(n => n.props.role === 'status' && n.props['aria-live'] === 'polite')).toHaveLength(0)
  await fail(new Error('plain transport cause'))
  act(() => vi.advanceTimersByTime(3100))
  expectError()
  observe('TF-X06')
})

it.each(['执行失败', '执行失败：Failed to fetch', '执行失败:opaque cause'])
('TF-X07 已有场景前缀原样且单次 %s', async raw => {
  await open()
  await fail(new Error(raw))
  expect(card().props.message).toBe(raw)
  expectError()
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[raw]])
  observe('TF-X07')
})

it('TF-X08 明确 catch 原因含成功信封标记也不能显示成功或吞掉全文', async () => {
  await open()
  const raw = `Response parsing failed; received text follows:\n${buildSuccessEnvelope(['任务｜t-0001｜Failed delivery'], '{"id":"t-0001","title":"Error register"}')}`
  await fail(new Error(raw), true)
  const message = `执行失败：${raw}`
  expect(card().props.message).toBe(message)
  observe('TF-X08-before-assertion')
  expectError()
  expect(text(view.root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
  await act(async () => { button('复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
})
