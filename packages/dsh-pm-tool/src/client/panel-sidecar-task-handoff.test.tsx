import React, { act } from 'react'
import { readFileSync, writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { projectRecordSchema } from '../core/project.js'
import { taskRecordSchema } from '../core/task.js'

// Real parent, sidecar, DrawerPanel and TaskForm; only DOM facilities and transport are isolated.
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
  'HTMLTextAreaElement', 'HTMLSelectElement', 'Element', 'Node', 'Event', 'MouseEvent',
  'KeyboardEvent', 'FormData', 'MutationObserver', 'localStorage']) {
  vi.stubGlobal(key, key === 'window' ? dom.window : (dom.window as any)[key])
}
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => setTimeout(() => fn(0), 0))
vi.stubGlobal('cancelAnimationFrame', clearTimeout)
vi.stubGlobal('CSS', { escape: (id: string) => {
  if (!/^[a-z][a-z0-9-]*$/i.test(id)) throw new Error('This facility only supports fixture IDs')
  return id
} })
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
Object.defineProperty(dom.window, 'matchMedia', { value: () => ({
  matches: false, addEventListener() {}, removeEventListener() {},
}) })
const style = document.createElement('style')
style.textContent = readFileSync(new URL('./panel.css', import.meta.url), 'utf8')
document.head.appendChild(style)
const { createRoot } = await import('react-dom/client')
const { PmPanel } = await import('./panel.js')

const at = '2026-10-23T00:00:00.000Z'
const oldAnswer = 't-0006 当前未指派，进度0%。'
const unsent = '本轮未发送问题'
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement
let snapshot: any
let initial: any
let calls: string[]
let observations: unknown[] = []

const flush = () => new Promise(resolve => setTimeout(resolve, 15))
const query = <T extends Element = HTMLElement>(selector: string): T => {
  const element = container.querySelector<T>(selector)
  expect(element, selector).not.toBeNull()
  return element!
}
const button = (label: string, parent: Element = container): HTMLButtonElement => {
  const found = [...parent.querySelectorAll<HTMLButtonElement>('button')].filter(el =>
    el.textContent === label || el.getAttribute('aria-label') === label)
  expect(found, label).toHaveLength(1)
  return found[0]
}
const click = async (element: HTMLElement) => {
  await act(async () => { element.click(); await flush() })
}
const fill = async (selector: string, value: string) => {
  const element = query<HTMLInputElement>(selector)
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
}
const esc = async () => {
  await act(async () => {
    document.activeElement!.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
      key: 'Escape', bubbles: true, cancelable: true,
    }))
    await flush()
  })
}
function observe(label: string) {
  const sidecar = container.querySelector<HTMLElement>('.pm-sidecar')
  observations.push({
    label, calls: [...calls], html: container.innerHTML,
    sidecarHidden: sidecar?.hidden, sidecarDisplay: sidecar ? dom.window.getComputedStyle(sidecar).display : null,
    focus: document.activeElement?.outerHTML, snapshot: structuredClone(snapshot),
  })
}
const assertContext = (sidecar: HTMLElement, messages: HTMLElement) => {
  expect(query('.pm-sidecar')).toBe(sidecar)
  expect(query('.pm-copilot-messages')).toBe(messages)
  expect(query('.pm-copilot-bubble.pm-copilot-ai').textContent).toBe(oldAnswer)
  expect(query('.pm-proj-card').textContent).toContain('负责人：P1004刷新负责人')
  expect(query('.pm-proj-card').textContent).toContain('进度：47%')
  expect(query('.pm-proj-changed').textContent).toContain('回答后该任务又有更新')
  expect(query<HTMLInputElement>('.pm-copilot-input').value).toBe(unsent)
  expect(snapshot.tasks[0].attachments).toEqual(initial.tasks[0].attachments)
  expect(snapshot.tasks[0].progressLog).toEqual(initial.tasks[0].progressLog)
  expect(calls.filter(line => line.startsWith('ask p-0001 '))).toHaveLength(1)
}
async function prepare() {
  await click(query('.pm-copilot-open'))
  await fill('.pm-copilot-input', '当前任务情况')
  await click(button('发送'))
  expect(query('.pm-copilot-bubble.pm-copilot-ai').textContent).toBe(oldAnswer)
  // A later read-only snapshot supplies updated task props; no model/history rewriting.
  snapshot.tasks[0] = { ...snapshot.tasks[0], assignee: 'P1004刷新负责人', progress: 47,
    updatedAt: '2026-10-23T00:01:00.000Z' }
  await click(query('.pm-proj-refresh'))
  await fill('.pm-copilot-input', unsent)
  const sidecar = query('.pm-sidecar')
  const messages = query('.pm-copilot-messages')
  const opener = button('打开任务')
  const before = [...calls]
  opener.focus()
  observe('before-open')
  await click(opener)
  observe('first-open')
  expect(query('[role="dialog"]').getAttribute('aria-label')).toBe('编辑任务')
  const title = query<HTMLInputElement>('.pm-drawer [name="title"]')
  expect(title.value).toBe('P1004任务')
  expect(query<HTMLInputElement>('.pm-drawer [name="assignee"]').value).toBe('P1004刷新负责人')
  expect(query<HTMLInputElement>('.pm-drawer [name="progress"]').value).toBe('47')
  expect(document.activeElement).toBe(title)
  expect(calls).toEqual(before)
  return { sidecar, messages, opener, before }
}
function assertYielded() {
  // Production CSS is read unchanged: this fails on the current visible z=60 sidecar.
  expect(dom.window.getComputedStyle(query('.pm-sidecar')).display,
    'P1004: 首次打开必须让出TaskForm交互面，不能保留前置副驾').toBe('none')
  const tab = container.querySelector<HTMLElement>('.pm-sidecar-tab')
  expect(!tab || tab.hidden, 'P1004: 交接期间不得留下前置展开标签').toBe(true)
}
async function assertReturned(f: Awaited<ReturnType<typeof prepare>>) {
  await act(flush)
  observe('direct-return')
  expect(container.querySelector('.pm-drawer-layer')).toBeNull()
  expect(dom.window.getComputedStyle(f.sidecar).display).not.toBe('none')
  expect(document.activeElement, 'P1004: 退出归还同一打开任务按钮').toBe(f.opener)
  assertContext(f.sidecar, f.messages)
}

beforeEach(async () => {
  localStorage.clear()
  localStorage.setItem('pm-selected-project', 'p-0001')
  const project = projectRecordSchema.parse({ id: 'p-0001', name: 'P1004隔离项目',
    description: '', owner: '', status: 'active', startDate: '2026-10-01', targetDate: '2026-10-31',
    createdAt: at, updatedAt: at })
  const task = taskRecordSchema.parse({ id: 't-0006', projectId: project.id, parentId: null,
    code: '5', title: 'P1004任务', description: '原始说明', assignee: '', status: 'todo',
    priority: 'P1', progress: 0, milestoneId: null, order: 5, createdAt: at, updatedAt: at,
    attachments: [{ id: 'at-0001', kind: 'link', url: 'https://example.com/evidence', addedAt: at }],
    progressLog: [{ id: 'pl-0001', date: '2026-10-23', author: '甲', createdAt: at,
      revisions: [{ id: 'rv-0001', date: '2026-10-23', author: '甲', content: '历史保留', revisedAt: at }] }],
  })
  snapshot = { projects: [project], tasks: [task], milestones: [], riskIssues: [],
    meetings: [], reports: [], deliverables: [] }
  initial = structuredClone(snapshot)
  calls = []
  const execute = async (line: string) => {
    calls.push(line)
    if (line === 'web snapshot') return JSON.stringify(snapshot)
    if (line === 'model status') return '当前车道：poc'
    if (line === 'ask-provenance p-0001') return '{"entries":[]}'
    if (line.startsWith('ask p-0001 ')) return oldAnswer
    if (line.startsWith('task update t-0006 ')) {
      const patch = JSON.parse(line.slice('task update t-0006 '.length))
      expect(patch).not.toHaveProperty('attachments')
      expect(patch).not.toHaveProperty('progressLog')
      snapshot.tasks[0] = { ...snapshot.tasks[0], ...patch, updatedAt: '2026-10-23T00:02:00.000Z' }
      return '任务已更新'
    }
    throw new Error(`本专项禁止其它命令：${line}`)
  }
  vi.stubGlobal('fetch', () => { throw new Error('本专项禁止网络') })
  container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => {
    root = createRoot(container)
    root.render(<PmPanel execute={execute} executeRaw={async line => ({ kind: 'success', text: await execute(line) })}/>)
    await flush()
  })
})
afterEach(async () => {
  observe('before-unmount')
  if (root) await act(async () => { root!.unmount(); root = undefined; await flush() })
  container.remove()
  if (process.env.P1004_OBSERVATIONS) writeFileSync(process.env.P1004_OBSERVATIONS,
    JSON.stringify(observations, null, 2) + '\n')
})

describe('P1004 真实副驾到TaskForm开发专项（非GUI/独立验收）', () => {
  it.each(['取消', '关闭抽屉', 'Escape'])('首次打开让层、%s直接退出且保原卡/最新投影/归焦', async exit => {
    const f = await prepare()
    assertYielded()
    if (exit === 'Escape') await esc()
    else await click(button(exit, query('.pm-drawer')))
    await assertReturned(f)
    expect(calls).toEqual(f.before)
  })

  it('ESC只退出目标抽屉，不能同时关闭或重建副驾', async () => {
    const f = await prepare()
    await esc()
    await assertReturned(f)
    expect(calls).toEqual(f.before)
  })

  it('取消放弃确认先保稿与交接，再明确放弃返回，零命令', async () => {
    const f = await prepare()
    assertYielded()
    await fill('.pm-drawer [name="title"]', '未保存标题')
    await click(button('取消', query('.pm-drawer')))
    expect(query('.pm-confirm-dialog').textContent).toContain('放弃未保存修改')
    await click(button('取消', query('.pm-confirm-dialog')))
    assertYielded()
    expect(query<HTMLInputElement>('.pm-drawer [name="title"]').value).toBe('未保存标题')
    await click(button('关闭抽屉', query('.pm-drawer')))
    await click(button('放弃修改', query('.pm-confirm-dialog')))
    await assertReturned(f)
    expect(snapshot.tasks[0].title).toBe('P1004任务')
    expect(calls).toEqual(f.before)
  })

  it('明确主save仍只有原task.update，历史保留并返回同一副驾', async () => {
    const f = await prepare()
    assertYielded()
    await fill('.pm-drawer [name="assignee"]', '人主保存负责人')
    await click(button('保存更改', query('.pm-drawer')))
    await act(flush)
    expect(container.querySelector('.pm-drawer-layer')).toBeNull()
    expect(query('.pm-sidecar')).toBe(f.sidecar)
    expect(query('.pm-copilot-messages')).toBe(f.messages)
    expect(document.activeElement).toBe(f.opener)
    expect(query('.pm-copilot-bubble.pm-copilot-ai').textContent).toBe(oldAnswer)
    expect(query('.pm-proj-card').textContent).toContain('人主保存负责人')
    expect(snapshot.tasks[0].attachments).toEqual(initial.tasks[0].attachments)
    expect(snapshot.tasks[0].progressLog).toEqual(initial.tasks[0].progressLog)
    expect(calls.slice(f.before.length).map(line => line.split(' ')[0])).toEqual(['task', 'web'])
    expect(calls.filter(line => line.startsWith('ask p-0001 '))).toHaveLength(1)
  })

  it('重复交接不留下隐藏状态；原最小化/展开与显式关闭语义不变', async () => {
    const f = await prepare()
    await click(button('取消', query('.pm-drawer')))
    await assertReturned(f)
    await click(f.opener)
    assertYielded()
    await click(button('关闭抽屉', query('.pm-drawer')))
    await assertReturned(f)
    await click(button('最小化为侧边标签（保留上下文）'))
    expect(dom.window.getComputedStyle(f.sidecar).display).toBe('none')
    await click(button('展开 AI 副驾，保留此前上下文'))
    assertContext(f.sidecar, f.messages)
    await click(button('关闭副驾（ESC）'))
    expect(container.querySelector('.pm-sidecar')).toBeNull()
    expect(document.activeElement).toBe(query('.pm-copilot-open'))
    expect(calls).toEqual(f.before)
  })
})
