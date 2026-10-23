import React, { act, useState } from 'react'
import { JSDOM } from 'jsdom'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
  'HTMLTextAreaElement', 'HTMLButtonElement', 'Element', 'Node', 'Event', 'MouseEvent',
  'FormData', 'MutationObserver']) {
  vi.stubGlobal(key, key === 'window' ? dom.window : (dom.window as any)[key])
}
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const { createRoot } = await import('react-dom/client')
const { RecordsDeliverableForm } = await import('./records-deliverable-form.js')
const { RecordsOverlay } = await import('./records-overlay.js')
const { RecordsListbox } = await import('./records-listbox.js')
const { DELIVERABLE_STATUS_OPTIONS } = await import('./records-options.js')

let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement
let events: unknown[]
let calls: { kind: string, args?: unknown[] }[]
let accepted = true
let caseName: string
const types = ['pointerdown', 'mousedown', 'focusin', 'pointerup', 'mouseup', 'click', 'submit']
function identity(node: EventTarget | null) {
  if (!(node instanceof dom.window.Element)) return String(node)
  return { tag: node.tagName, id: node.id, class: node.className,
    role: node.getAttribute('role'), aria: node.getAttribute('aria-label'),
    text: node.textContent?.trim().slice(0, 60) }
}
function trace(event: Event) {
  events.push({ phase: event.eventPhase, type: event.type, target: identity(event.target),
    path: event.composedPath().map(identity), active: identity(document.activeElement),
    defaultPrevented: event.defaultPrevented, isTrusted: event.isTrusted,
    detail: (event as MouseEvent).detail })
}
function state(label: string) {
  events.push({ label, expanded: trigger().getAttribute('aria-expanded'),
    labelText: trigger().textContent, options: container.querySelectorAll('[role=option]').length,
    backdrop: !!container.querySelector('.rb-lb-backdrop'),
    active: identity(document.activeElement), calls: structuredClone(calls),
    html: container.innerHTML })
}
function trigger() {
  return container.querySelector<HTMLButtonElement>('#deliverable-status')!
}
function save() {
  return container.querySelector<HTMLButtonElement>('button[type=submit]')!
}
async function pointer(node: HTMLElement) {
  expect(node).not.toBeNull()
  // JSDOM has no layout or PointerEvent implementation. This dispatch reaches
  // native/React DOM handlers; it does not claim browser coordinate hit-testing.
  await act(async () => {
    for (const type of ['pointerdown', 'mousedown']) {
      node.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: 1 }))
    }
    const button = node.closest('button')
    button?.focus()
  })
  await act(async () => {
    for (const type of ['pointerup', 'mouseup']) {
      node.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }))
    }
    node.click()
  })
}
async function selectAccepted(child: boolean) {
  await pointer(trigger())
  expect(trigger().getAttribute('aria-expanded')).toBe('true')
  const option = [...container.querySelectorAll<HTMLButtonElement>('[role=option]')]
    .find(n => n.textContent === '已验收')!
  state('before-pointer-accepted')
  await pointer(child ? option.querySelector('span')! : option)
  state('after-pointer-accepted')
}
function closed() {
  expect(trigger().getAttribute('aria-expanded')).toBe('false')
  expect(container.querySelector('[role=listbox]')).toBeNull()
  expect(container.querySelector('.rb-lb-backdrop')).toBeNull()
}
async function mount() {
  await act(async () => {
    root = createRoot(container)
    root.render(<RecordsOverlay eyebrow="交付物" title="编辑交付物"
      onClose={() => calls.push({ kind: 'close' })}>
      <RecordsDeliverableForm projectId="p-0001" deliverable={{
        id: 'dlv-0001', projectId: 'p-0001', name: 'QA交付物V1', version: 'v1',
        owner: '', status: 'planned', location: '', description: '', note: '合法备注',
        milestoneId: 'm-0001', dueDate: null, history: [], createdAt: '2026-10-21T00:00:00.000Z',
        updatedAt: '2026-10-21T00:00:00.000Z',
      }} milestones={[{
        id: 'm-0001', projectId: 'p-0001', title: 'QA里程碑', targetDate: '2026-10-31',
        status: 'planned', achievedDate: null, description: '', createdAt: '2026-10-21T00:00:00.000Z',
        updatedAt: '2026-10-21T00:00:00.000Z',
      }]} callbacks={{
        onSaveDeliverable: async (...args) => { calls.push({ kind: 'save', args }); return accepted },
        onSaved: () => calls.push({ kind: 'saved' }),
        onDeleteDeliverable: async (...args) => { calls.push({ kind: 'delete', args }); return true },
        onViewStatusHistory: (...args) => calls.push({ kind: 'history', args }),
      }} onCancel={() => calls.push({ kind: 'cancel' })}/>
    </RecordsOverlay>)
  })
  state('mounted')
}
beforeEach(ctx => {
  events = []; calls = []; accepted = true
  caseName = ctx.task.name.split(' ')[0]
  container = document.createElement('div')
  document.body.appendChild(container)
  for (const type of types) {
    document.addEventListener(type, trace, true)
    document.addEventListener(type, trace)
  }
})
afterEach(async () => {
  if (root) {
    state('before-cleanup')
    await act(async () => { root!.unmount(); root = undefined })
  }
  for (const type of types) {
    document.removeEventListener(type, trace, true)
    document.removeEventListener(type, trace)
  }
  const evidence = process.env.QA_POINTER_EVIDENCE_ROOT
  if (evidence) {
    mkdirSync(evidence, { recursive: true })
    writeFileSync(join(evidence, caseName + '.json'), JSON.stringify({ events, calls,
      reactVersion: React.version, boundary: '真实 React DOM form/overlay；无 GUI/布局/命中/RPC/落盘。' }, null, 2), { flag: 'wx' })
  }
  container.remove()
})

describe('交付物真实 DOM 指针诊断', () => {
  for (const child of [false, true]) {
    it(`${child ? 'D02' : 'D01'} 指针选 ${child ? 'option 内 span' : 'option button'} 后闭合并指针 save`, async () => {
      await mount()
      await selectAccepted(child)
      expect(trigger().textContent).toContain('已验收')
      closed()
      expect(calls).toEqual([])
      await pointer(save())
      state('after-pointer-save')
      expect(calls).toEqual([{ kind: 'save', args: ['p-0001', 'dlv-0001', {
        name: 'QA交付物V1', version: 'v1', owner: '', status: 'accepted', location: '',
        description: '', dueDate: null, repoUrl: '', branch: '', milestoneId: 'm-0001', note: '合法备注',
      }] }, { kind: 'saved' }])
    })
  }
  it('D03 重复指针 trigger 一次关闭且零 save', async () => {
    await mount()
    await pointer(trigger()); state('trigger-open')
    await pointer(trigger()); state('trigger-close')
    closed()
    expect(calls).toEqual([])
  })
  it('D04 指针 backdrop 关闭且零 save', async () => {
    await mount()
    await pointer(trigger())
    await pointer(container.querySelector<HTMLElement>('.rb-lb-backdrop')!)
    state('backdrop-click')
    closed()
    expect(calls).toEqual([])
  })
  it('D05 指针选项后 save 返回 false 保留输入并允许再点 save', async () => {
    accepted = false
    await mount(); await selectAccepted(true)
    closed()
    await pointer(save())
    state('after-false-save')
    expect(calls.map(c => c.kind)).toEqual(['save'])
    expect(trigger().textContent).toContain('已验收')
    expect([...container.querySelectorAll<HTMLTextAreaElement>('textarea')].some(n => n.value === '合法备注')).toBe(true)
    expect(save().disabled).toBe(false)
    accepted = true
    await pointer(save())
    expect(calls.map(c => c.kind)).toEqual(['save', 'save', 'saved'])
    expect(calls[0].args).toEqual(calls[1].args)
  })
  for (const labelled of [true, false]) {
    it(`${labelled ? 'D06' : 'D07'} 最小生产 listbox 在 ${labelled ? 'label' : 'div'} 内 backdrop 一次关闭`, async () => {
      function Minimal() {
        const [value, setValue] = useState('planned')
        const listbox = <RecordsListbox id="deliverable-status" value={value}
          options={DELIVERABLE_STATUS_OPTIONS} onChange={setValue}/>
        return labelled ? <label>状态{listbox}</label> : <div>状态{listbox}</div>
      }
      await act(async () => { root = createRoot(container); root.render(<Minimal/>) })
      await pointer(trigger())
      const start = events.length
      await pointer(container.querySelector<HTMLElement>('.rb-lb-backdrop')!)
      state('minimal-backdrop')
      const forwarded = events.slice(start).filter((event: any) =>
        event.type === 'click' && event.phase === 1 && event.target.id === 'deliverable-status')
      expect(forwarded, 'backdrop 不得默认激活 label 的关联 trigger').toEqual([])
      closed()
      expect(calls).toEqual([])
    })
  }
  for (const child of [false, true]) {
    it(`${child ? 'D09' : 'D08'} 真实表单 ${child ? 'option 内 span' : 'option button'} 取消默认激活且选中零 save`, async () => {
      await mount()
      await pointer(trigger())
      const option = [...container.querySelectorAll<HTMLButtonElement>('[role=option]')]
        .find(n => n.textContent === '已验收')!
      const start = events.length
      await pointer(child ? option.querySelector('span')! : option)
      state('option-default-action')
      const selectionEvents = events.slice(start) as any[]
      const selectionClicks = selectionEvents.filter(event =>
        event.type === 'click' && event.phase === 3 &&
        (event.target.role === 'option' || event.path.some((node: any) => node?.role === 'option')))
      expect(selectionClicks).toHaveLength(1)
      // 观察公开 DOM 默认动作取消标志；不手工模拟 label 的额外激活。
      // JSDOM 的最终闭合不代表浏览器默认动作时序或真实坐标命中。
      expect(selectionClicks[0].defaultPrevented, 'option click 必须取消外 label 默认激活').toBe(true)
      const forwarded = selectionEvents.filter(event =>
        event.type === 'click' && event.phase === 1 && event.target.id === 'deliverable-status')
      expect(forwarded, '选项不得额外激活关联 trigger').toEqual([])
      expect(trigger().textContent).toContain('已验收')
      closed()
      expect(calls).toEqual([])
    })
  }
})
