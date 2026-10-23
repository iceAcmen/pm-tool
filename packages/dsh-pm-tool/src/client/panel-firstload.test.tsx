import React, { act, StrictMode, type ReactNode } from 'react'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { projectWriteSchema } from '../core/project.js'
import { taskWriteSchema } from '../core/task.js'

// Reuse the existing DOM harness dependencies without requiring the main document.
const require = createRequire(import.meta.url)
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options: { url: string }) => { window: Window & typeof globalThis }
}
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
const doc = dom.window.document
function installDom() {
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
    'HTMLTextAreaElement', 'HTMLSelectElement', 'Element', 'Node', 'Event', 'MouseEvent',
    'KeyboardEvent', 'FormData', 'MutationObserver', 'localStorage'] as const) {
    vi.stubGlobal(key, key === 'window' ? dom.window : dom.window[key])
  }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => setTimeout(() => fn(0), 0))
  vi.stubGlobal('cancelAnimationFrame', clearTimeout)
  vi.stubGlobal('CSS', { escape: (id: string) => {
    if (!/^[a-z][a-z0-9-]*$/i.test(id)) throw new Error('仅支持既有合法 fixture ID')
    return id
  } })
}
installDom()
Object.defineProperty(dom.window, 'matchMedia', { value: () => ({
  matches: false, addEventListener() {}, removeEventListener() {},
}) })
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
const { createRoot } = require('react-dom/client') as {
  createRoot: (node: Element) => { render: (node: ReactNode) => void; unmount: () => void }
}
const { PmPanel } = await import('./panel.js')
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement
let execute: ReturnType<typeof vi.fn>
let fetchImpl: ReturnType<typeof vi.fn>
const observations: unknown[] = []
const at = '2026-10-23T00:00:00.000Z'
const project = projectWriteSchema.parse({
  id: 'p-0001', name: '首读隔离项目', description: '', owner: '首读负责人', status: 'active',
  startDate: '2026-10-01', targetDate: '2026-10-31', createdAt: at, updatedAt: at,
})
const task = taskWriteSchema.parse({
  id: 't-0001', projectId: project.id, parentId: null, code: '1', title: '首读隔离任务',
  description: '', assignee: '', status: 'todo', priority: 'P1', progress: 0, milestoneId: null,
  order: 1, createdAt: at, updatedAt: at,
})
const empty = { projects: [], tasks: [], milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [] }
const populated = { ...empty, projects: [project], tasks: [task] }
const pending = () => {
  let resolve!: (value: string) => void
  let reject!: (error: Error) => void
  const promise = new Promise<string>((ok, no) => { resolve = ok; reject = no })
  return { promise, resolve, reject }
}
const content = () => container.textContent ?? ''
const status = () => [...container.querySelectorAll('[role="status"]')].map(n => n.textContent ?? '').join('\n')
const button = (label: string): HTMLButtonElement => {
  const nodes = [...container.querySelectorAll<HTMLButtonElement>('button')].filter(n =>
    n.textContent === label || n.getAttribute('aria-label') === label)
  expect(nodes, label).toHaveLength(1)
  return nodes[0]
}
function observe(label: string, input: unknown = populated) {
  observations.push({
    label, input, inputSha256: createHash('sha256').update(JSON.stringify(input)).digest('hex'),
    content: content(), status: status(), html: container.innerHTML,
    calls: execute.mock.calls.map(c => c[0]), handshake: fetchImpl.mock.calls,
  })
}
function noFalseEmpty() {
  expect(content()).not.toContain('暂无项目')
  expect(content()).not.toContain('建立第一个项目')
}
function loading() {
  noFalseEmpty()
  expect(status()).toContain('正在读取项目数据')
  expect(content()).not.toContain('上次读取的旧数据')
  expect(container.querySelector('.pm-stale-banner__retry')).toBeNull()
}
function loaded() {
  noFalseEmpty()
  expect(content()).toContain('首读隔离项目')
  expect(content()).toContain('首读隔离任务')
  expect(status()).not.toContain('正在读取项目数据')
}
async function mount(strict = false) {
  await act(async () => {
    root = createRoot(container)
    const panel = <PmPanel execute={execute} executeRaw={async () => {
      throw new Error('首读专项禁止 raw 命令')
    }}/>
    root.render(strict ? <StrictMode>{panel}</StrictMode> : panel)
  })
}
async function click(label: string) {
  await act(async () => { button(label).click() })
}
beforeEach(() => {
  installDom()
  dom.window.localStorage.clear()
  dom.window.history.replaceState(null, '', '/')
  container = doc.createElement('div')
  doc.body.appendChild(container)
  execute = vi.fn().mockResolvedValue(JSON.stringify(populated))
  fetchImpl = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetchImpl)
})
afterEach(async () => {
  observe('before-unmount')
  if (root) await act(async () => { root!.unmount(); root = undefined })
  container.remove()
  vi.unstubAllGlobals()
  if (process.env.FIRSTLOAD_OBSERVATIONS) writeFileSync(process.env.FIRSTLOAD_OBSERVATIONS,
    JSON.stringify(observations, null, 2) + '\n')
})

it('首读真实项目延迟不误空，成功后显示原项目和任务', async () => {
  const gate = pending()
  execute.mockReturnValueOnce(gate.promise)
  await mount()
  observe('project-pending')
  loading()
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot'])
  await act(async () => { gate.resolve(JSON.stringify(populated)) })
  observe('project-success')
  loaded()
})

it('首读空库仍先未知，只在真实空成功后显示首项目引导', async () => {
  const gate = pending()
  execute.mockReturnValueOnce(gate.promise)
  await mount()
  observe('empty-pending', empty)
  loading()
  await act(async () => { gate.resolve(JSON.stringify(empty)) })
  observe('empty-success', empty)
  expect(content()).toContain('暂无项目')
  expect(content()).toContain('建立第一个项目')
  expect(status()).not.toContain('正在读取项目数据')
  expect(container.querySelector('.pm-stale-banner')).toBeNull()
})

it('首次失败无假旧数据，可见原原因，重试仍未知直到真实成功', async () => {
  const first = pending(), retry = pending()
  execute.mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise)
  await mount()
  await act(async () => { first.reject(new Error('first snapshot transport failed')) })
  observe('first-failed')
  noFalseEmpty()
  expect(status()).toContain('首次读取失败')
  expect(content()).toContain('first snapshot transport failed')
  expect(content()).not.toContain('上次读取的旧数据')
  expect(status()).not.toContain('正在读取项目数据')
  await click('重试')
  observe('first-retry-pending')
  loading()
  await act(async () => { retry.resolve(JSON.stringify(populated)) })
  observe('first-retry-success')
  loaded()
  expect(container.querySelector('.pm-stale-banner')).toBeNull()
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', 'web snapshot'])
})

it('已有成功后刷新失败保原内容和陈旧重试，重试不退回首读', async () => {
  const failed = pending(), retry = pending()
  execute.mockResolvedValueOnce(JSON.stringify(populated)).mockReturnValueOnce(failed.promise).mockReturnValueOnce(retry.promise)
  await mount()
  const row = container.querySelector('[data-pm-row="t-0001"]')
  expect(row).not.toBeNull()
  await click('刷新数据')
  observe('success-refresh-pending')
  loaded()
  await act(async () => { failed.reject(new Error('later snapshot failed')) })
  observe('success-refresh-failed')
  loaded()
  expect(status()).toContain('上次读取的旧数据')
  expect(content()).toContain('later snapshot failed')
  expect(content()).not.toContain('首次读取失败')
  expect(container.querySelector('[data-pm-row="t-0001"]')).toBe(row)
  await click('重试')
  observe('stale-retry-pending')
  loaded()
  await act(async () => { retry.resolve(JSON.stringify(populated)) })
  observe('stale-retry-success')
  loaded()
  expect(container.querySelector('.pm-stale-banner')).toBeNull()
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', 'web snapshot', 'web snapshot'])
})

it('成功空库之后的失败仍是已成功数据，不伪装首次失败', async () => {
  execute.mockResolvedValueOnce(JSON.stringify(empty)).mockRejectedValueOnce(new Error('empty refresh failed'))
  await mount()
  await click('刷新数据')
  observe('empty-success-then-failed', empty)
  expect(content()).toContain('建立第一个项目')
  expect(status()).toContain('上次读取的旧数据')
  expect(content()).not.toContain('首次读取失败')
  execute.mockResolvedValueOnce(JSON.stringify(populated))
  await click('重试')
  loaded()
})

it.each(['empty', 'project', 'reject'] as const)('真实Strict重挂载旧%s不能宣布首读成功或失败、不能回告launcher', async outcome => {
  const old = pending(), current = pending()
  dom.window.history.replaceState(null, '', '/#pm-launch=18345.FIRST')
  execute.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
  await mount(true)
  expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot', 'web snapshot'])
  await act(async () => {
    if (outcome === 'reject') old.reject(new Error('obsolete generation error'))
    else old.resolve(JSON.stringify(outcome === 'empty' ? empty : populated))
  })
  observe(`strict-old-${outcome}`)
  loading()
  expect(content()).not.toContain('obsolete generation error')
  expect(content()).not.toContain('首读隔离任务')
  expect(fetchImpl).not.toHaveBeenCalled()
  expect(dom.window.location.hash).toContain('pm-launch=18345.FIRST')
  await act(async () => { current.resolve(JSON.stringify(populated)) })
  observe(`strict-current-success-${outcome}`)
  loaded()
  expect(fetchImpl).toHaveBeenCalledTimes(1)
  expect(dom.window.location.hash).toBe('')
})

it('已有成功数据的通用命令busy不冒充首次pending', async () => {
  const gate = pending()
  await mount()
  await click('按状态分组')
  execute.mockReturnValueOnce(gate.promise)
  await click('完成 首读隔离任务')
  observe('generic-command-pending')
  loaded()
  expect(container.querySelector('.pm-shell')?.getAttribute('aria-busy')).toBe('true')
  await act(async () => { gate.reject(new Error('generic command rejected')) })
  observe('generic-command-failed')
  loaded()
  expect(content()).not.toContain('首次读取失败')
})
