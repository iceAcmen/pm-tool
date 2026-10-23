import React from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { appendFileSync } from 'node:fs'
import { PmPanel } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { TaskTable } from '../../packages/dsh-pm-tool/src/client/views/tasks.js'
import { ResultCard } from '../../packages/dsh-pm-tool/src/client/result-card.js'
import { buildActionLine, buildSuccessEnvelope, classifyFeedback } from '../../packages/dsh-pm-tool/src/core/ui-feedback.js'

let view: ReactTestRenderer | undefined
let execute: ReturnType<typeof vi.fn>, writer: ReturnType<typeof vi.fn>
const snapshot = { projects: [{ id: 'p-0001', name: '接口独立测试' }],
  tasks: [], milestones: [], riskIssues: [], deliverables: [], meetings: [], reports: [] }
const line = 'task update t-0001 {}'
const marked = `Response parsing failed\n${buildSuccessEnvelope(['Failed delivery'], '{"title":"Error register"}')}
${buildActionLine('不得执行', 'task remove t-0001 confirm')}\n  原因尾部  \n`
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
const table = () => view!.root.findByType(TaskTable)
const card = () => view!.root.findByType(ResultCard)
const toasts = () => view!.root.findAllByProps({ className: 'pm-toast pm-toast--success' })
const root = () => view!.root.findByProps({ className: 'pm-result-card pm-result-card--error' })
const observe = (id: string) => appendFileSync(process.env.TF_OBSERVATIONS!,
  `${JSON.stringify({ id, message: card().props.message, context: card().props.context,
    calls: execute.mock.calls, copies: writer.mock.calls, toasts: toasts().map(text) })}\n`)

beforeEach(() => {
  const events = new EventTarget()
  vi.stubGlobal('window', { location: { hash: '', pathname: '/', search: '' }, history: { replaceState: vi.fn() },
    matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout })
  vi.stubGlobal('document', { activeElement: null })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
  vi.stubGlobal('fetch', () => { throw new Error('本轮禁止网络') })
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

it.each([false, true].flatMap(quiet => ['marked', 'opaque'].map(kind => ({ quiet, kind }))))(
  'IV-01 quiet=$quiet kind=$kind 完整错误与生产分类同源', async ({ quiet, kind }) => {
    await act(async () => { view = create(<PmPanel execute={execute}/>) })
    vi.useFakeTimers()
    const raw = kind === 'marked' ? marked : 'opaque reason\n \t完整尾部  \n'
    const thrown = kind === 'marked' ? new Error(raw) : raw
    execute.mockRejectedValueOnce(thrown)
    await act(async () => { expect(await table().props.run(line, { quiet })).toBe(false) })
    const message = `执行失败：${raw}`
    expect(card().props.message).toBe(message)
    expect(card().props.context).toEqual({ kind: 'error' })
    expect(root().props.role).toBe('alert')
    expect(root().props['aria-live']).toBe('assertive')
    expect(text(view!.root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
    expect(classifyFeedback(message, card().props.context)).toEqual({
      isError: true, structured: false, summary: [message], detail: null, action: null, autoDismissMs: null,
    })
    expect(toasts()).toHaveLength(0)
    expect(view!.root.findAllByProps({ className: 'pm-result-action' })).toHaveLength(0)
    await act(async () => { root().findAllByType('button').find(n => text(n) === '复制原文')!.props.onClick() })
    expect(writer.mock.calls).toEqual([[message]])
    act(() => vi.advanceTimersByTime(20000))
    expect(root().props.role).toBe('alert')
    expect(card().props.message).toBe(message)
    expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line])
    expect(table().props.disabled).toBe(false)
    observe(`IV-01-${quiet}-${kind}`)
  },
)

it('IV-02 quiet成功仍只refresh一次，不发布新的全局消息', async () => {
  await act(async () => { view = create(<PmPanel execute={execute}/>) })
  execute.mockResolvedValueOnce(buildSuccessEnvelope(['已更新']))
  await act(async () => { expect(await table().props.run(line, { quiet: true })).toBe(true) })
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line, 'web snapshot'])
  expect(toasts()).toHaveLength(0)
  expect(view!.root.findAllByType(ResultCard)).toHaveLength(0)
})

it('IV-03 正常成功保持默认字符串协议、toast和清错误context', async () => {
  await act(async () => { view = create(<PmPanel execute={execute}/>) })
  execute.mockRejectedValueOnce(new Error(marked))
  await act(async () => { expect(await table().props.run(line)).toBe(false) })
  const message = card().props.message
  expect(classifyFeedback(message)).toMatchObject({ isError: false, autoDismissMs: 3000 })
  execute.mockResolvedValueOnce(message)
  await act(async () => { expect(await table().props.run(line)).toBe(true) })
  expect(card().props.context).toBeUndefined()
  expect(toasts()).toHaveLength(1)
  expect(view!.root.findAllByProps({ className: 'pm-result-action' })).toHaveLength(1)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', line, line, 'web snapshot'])
})
