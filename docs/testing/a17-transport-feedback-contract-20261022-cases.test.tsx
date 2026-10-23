import React from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { appendFileSync, readFileSync } from 'node:fs'
import { PmPanel } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { TaskTable } from '../../packages/dsh-pm-tool/src/client/views/tasks.js'
import { ResultCard } from '../../packages/dsh-pm-tool/src/client/result-card.js'
import {
  buildActionLine, buildSuccessEnvelope, classifyFeedback, commandAccepted, prefixFeedbackOnce,
} from '../../packages/dsh-pm-tool/src/core/ui-feedback.js'

const input = JSON.parse(readFileSync(process.env.TF_INPUT!, 'utf8'))
const mounts: ReactTestRenderer[] = []
let view: ReactTestRenderer
let execute: ReturnType<typeof vi.fn>
let reader: any
const snapshot = {
  projects: [{ id: 'p-0001', name: 'A17 隔离组件控制' }],
  tasks: [], milestones: [], riskIssues: [], deliverables: [], meetings: [], reports: [],
}
const failures = [
  ['fetch', () => new Error('Failed to fetch')],
  ['a15-full', () => new Error('client api: commands/execute failed: Failed to fetch')],
  ['abort', () => Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' })],
  ['unknown-string', () => 'opaque transport reason'],
  ['unknown-object', () => ({ code: 17, cause: 'opaque' })],
] as const
const text = (n: any): string => typeof n === 'string' ? n : n.children.map(text).join('')
const table = () => view.root.findByType(TaskTable)
const card = () => view.root.findByType(ResultCard)
const cardNode = (v = view) => v.root.findAll(n =>
  typeof n.props.className === 'string' && n.props.className.split(' ').includes('pm-result-card'))[0]
const inspectCard = (v = view) => {
  const n = cardNode(v)
  return n ? {
    role: n.props.role, live: n.props['aria-live'], className: n.props.className,
    text: text(n), check: n.findAll(n => n.type === 'svg' &&
      String(n.props.className).includes('lucide-check')).length,
    triangle: n.findAll(n => n.type === 'svg' &&
      String(n.props.className).includes('lucide-triangle-alert')).length,
  } : null
}
function note(id: string, extra: any = {}) {
  appendFileSync(process.env.TF_OBSERVATIONS!, `${JSON.stringify({
    id, card: inspectCard(), calls: execute?.mock.calls.map(c => c[0]),
    tableDisabled: view?.root.findAllByType(TaskTable)[0]?.props.disabled, ...extra,
  })}\n`)
}
const button = (root: any, label: string) =>
  root.findAllByType('button').find((n: any) => text(n) === label)!
function pending() {
  let resolve!: (s: string) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<string>((ok, bad) => { resolve = ok; reject = bad })
  return { promise, resolve, reject }
}
async function open() {
  await act(async () => {
    view = create(<PmPanel execute={execute} executeRaw={vi.fn(() => {
      throw new Error('A17 run 不应调用 executeRaw')
    })}/>)
    mounts.push(view)
  })
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot'])
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
  vi.stubGlobal('fetch', () => { throw new Error('A17 禁网络') })
  vi.stubGlobal('FileReader', class {
    result: string | ArrayBuffer | null = null
    onload!: () => Promise<void>
    constructor() { reader = this }
    readAsText() {}
    readAsArrayBuffer() {}
  })
  execute = vi.fn(async (line: string) => {
    if (line === 'web snapshot') return JSON.stringify(snapshot)
    throw new Error(`A17 非预期宿主命令：${line}`)
  })
})
afterEach(() => {
  for (const v of mounts.splice(0)) act(() => v.unmount())
  vi.unstubAllGlobals()
})

it.each(['失败复盘', 'Failed delivery', 'Error register'])('TF-C01 成功合法标题 %s 不误红', async title => {
  await open()
  const detail = JSON.stringify({ id: 't-0001', title, description: '成功正文保留完整字段' })
  const message = `${buildActionLine('查看记录', 'task list p-0001')}\n${buildSuccessEnvelope([`任务｜t-0001｜${title}`], detail)}`
  execute.mockResolvedValueOnce(message)
  let accepted: unknown
  await act(async () => { accepted = await table().props.run('task update t-0001 {}') })
  const fb = classifyFeedback(message)
  note('TF-C01', { title, accepted, message, classified: fb })
  expect(accepted).toBe(true)
  expect(commandAccepted(message)).toBe(true)
  expect(fb.isError).toBe(false)
  expect(fb.autoDismissMs).toBe(3000)
  expect(inspectCard()).toMatchObject({ role: 'status', live: 'polite', check: 1, triangle: 0 })
  expect(cardNode().props.className).not.toContain('--error')
  act(() => button(cardNode(), '详情 ▾').props.onClick())
  expect(text(view.root.findByProps({ className: 'pm-result-card__detail' }))).toBe(detail)
  const writer = vi.fn().mockResolvedValue(undefined)
  act(() => view.update(<ResultCard message={message} onClose={() => {}} onAction={() => {}} writeText={writer}/>))
  await act(async () => { button(cardNode(), '复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
})

it.each(['任务已更新：Failed delivery', '任务已更新：Error register'])('TF-C02 无信封英文合法成功 %s', async message => {
  await open()
  execute.mockResolvedValueOnce(message)
  let accepted: unknown
  await act(async () => { accepted = await table().props.run('task update t-0001 {}') })
  note('TF-C02', { message, accepted })
  expect(accepted).toBe(true)
  expect(card().props.message).toBe(message)
  expect(inspectCard()).toMatchObject({ role: 'status', live: 'polite', check: 1, triangle: 0 })
})

it.each(failures)('TF-C03 已有场景前缀能力控制 %s', async (kind, make) => {
  const error = make()
  const raw = error instanceof Error ? error.message : String(error)
  const message = prefixFeedbackOnce('执行失败', error)
  const writer = vi.fn().mockResolvedValue(undefined)
  act(() => {
    view = create(<ResultCard message={message} onClose={() => {}} onAction={() => {}} writeText={writer}/>)
    mounts.push(view)
  })
  const fb = classifyFeedback(message)
  note('TF-C03', { kind, raw, message, classified: fb, explicitContextControlOnly: true })
  expect(message).toBe(`执行失败：${raw}`)
  expect(prefixFeedbackOnce('执行失败', message)).toBe(message)
  expect(fb.isError).toBe(true)
  expect(fb.autoDismissMs).toBeNull()
  expect(inspectCard()).toMatchObject({ role: 'alert', live: 'assertive', check: 0, triangle: 1 })
  expect(cardNode().props.className).toContain('pm-result-card--error')
  await act(async () => { button(cardNode(), '复制原文').props.onClick() })
  expect(writer.mock.calls).toEqual([[message]])
})

it.each(failures)('TF-F01 真实 PmPanel catch 必须错误呈现 %s', async (kind, make) => {
  await open()
  const gate = pending(), error = make()
  const raw = error instanceof Error ? error.message : String(error)
  execute.mockReturnValueOnce(gate.promise)
  let request!: Promise<boolean>
  await act(async () => { request = table().props.run('task update t-0001 {}') })
  expect(table().props.disabled).toBe(true)
  expect(cardNode()).toBeUndefined()
  let duplicate: unknown
  await act(async () => { duplicate = await table().props.run('task update t-0001 {}') })
  expect(duplicate).toBe(false)
  let accepted: unknown
  await act(async () => { gate.reject(error); accepted = await request })
  const message = card().props.message
  note('TF-F01', { kind, raw, message, accepted, duplicate, classified: classifyFeedback(message) })
  expect(accepted).toBe(false)
  expect(table().props.disabled).toBe(false)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', 'task update t-0001 {}'])
  expect(message).toContain(raw)
  // 原因由实际 catch 确定，不要求任何特定修复实现或英文关键词。
  expect(inspectCard()?.role).toBe('alert')
  expect(inspectCard()).toMatchObject({ live: 'assertive', check: 0, triangle: 1 })
  expect(cardNode().props.className).toContain('pm-result-card--error')
  expect(classifyFeedback(message).autoDismissMs).toBeNull()
})

it.each(['csv', 'xlsx'])('TF-C04 真实父子组件 %s 保同预览 busy/失败/明确重试', async format => {
  await open()
  const f = input.imports[format]
  execute.mockResolvedValueOnce(f.previewText)
  await act(async () => {
    view.root.findByProps({ className: 'pm-import-file' }).props.onChange({
      currentTarget: { files: [{ name: f.filename }], value: f.filename },
    })
    reader.result = format === 'csv' ? f.content : Uint8Array.from(Buffer.from(f.content, 'base64')).buffer
    await reader.onload()
  })
  expect(execute.mock.calls.at(-1)?.[0]).toBe(f.previewLine)
  const preview = () => view.root.findByProps({ className: 'pt-import' })
  const before = text(preview().findByType('pre'))
  const gate = pending()
  execute.mockReturnValueOnce(gate.promise)
  const click = button(preview(), '确认落盘').props.onClick
  act(() => { click(); click() })
  expect(preview().props['aria-busy']).toBe(true)
  expect(button(preview(), '确认落盘').props.disabled).toBe(true)
  expect(button(preview(), '取消').props.disabled).toBe(true)
  expect(view.root.findByProps({ className: 'pm-import-file' }).props.disabled).toBe(true)
  expect(execute.mock.calls.filter(c => c[0] === f.confirmLine)).toHaveLength(1)
  await act(async () => { gate.reject(new Error(input.a15Error)) })
  const after = text(preview().findByType('pre'))
  note('TF-C04-failed', { format, before, after, ariaBusy: preview().props['aria-busy'] })
  expect(after).toBe(before)
  expect(preview().props['aria-busy']).toBe(false)
  expect(text(preview().findByProps({ role: 'alert' }))).toBe('导入失败，预览已保留，请重试。')
  expect(button(preview(), '确认落盘').props.disabled).toBe(false)
  expect(button(preview(), '取消').props.disabled).toBe(false)
  expect(view.root.findByProps({ className: 'pm-import-file' }).props.disabled).toBe(false)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', f.previewLine, f.confirmLine])
  execute.mockResolvedValueOnce(f.retryText)
  await act(async () => { button(preview(), '确认落盘').props.onClick() })
  note('TF-C04-retried', { format, previewClosed: view.root.findAllByProps({ className: 'pt-import' }).length === 0 })
  expect(view.root.findAllByProps({ className: 'pt-import' })).toHaveLength(0)
  expect(execute.mock.calls.filter(c => c[0] === f.confirmLine).map(c => c[0])).toEqual([f.confirmLine, f.confirmLine])
  expect(execute.mock.calls.filter(c => c[0] === f.previewLine)).toHaveLength(1)
  expect(table().props.disabled).toBe(false)
})
