import React, { Component, act, useState } from 'react'
import { JSDOM } from 'jsdom'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taskWriteSchema } from '../core/task.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
  'HTMLTextAreaElement', 'HTMLSelectElement', 'Element', 'Node', 'Event', 'MouseEvent',
  'FormData', 'MutationObserver']) {
  vi.stubGlobal(key, key === 'window' ? dom.window : (dom.window as any)[key])
}
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const { createRoot } = await import('react-dom/client')
// Only the independent Vitest adapter exposes this private production component.
const panel = await import('./panel.js')
const TaskForm = (panel as any).TaskForm as React.ComponentType<any>
const evidenceRoot = process.env.QA_EVIDENCE_ROOT
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement
let events: any[], caught: any[], calls: any[], records: any[]
let caseRoot: string, sequence = 0, controlReady = false
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

function seed(predecessorIds: string[] = [], reverseEdge = false) {
  records = [1, 2, 3, 4].map(n => taskWriteSchema.parse({
    id: `t-000${n}`, projectId: 'p-0001', parentId: null, code: String(n), order: n,
    title: n === 4 ? '已有任务四' : `候选任务${n}`, description: '合法已有任务说明',
    assignee: 'QA', status: 'todo', priority: 'P1', progress: 0, milestoneId: null,
    startDate: '2026-01-01', dueDate: '2026-12-31',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...(n === 4 && predecessorIds.length ? { predecessorIds } : {}),
    ...(n === 1 && reverseEdge ? { predecessorIds: ['t-0004'] } : {}),
  }))
  expect(records.every(t => (t.predecessorIds ?? []).every((id: string) =>
    id !== t.id && records.some(x => x.id === id && x.projectId === t.projectId)))).toBe(true)
  // The only initial edges are t4 -> t2 or t1 -> t4; these are acyclic.
  expect(!(predecessorIds.includes('t-0001') && reverseEdge)).toBe(true)
}
class Boundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    caught.push({ message: error.message, stack: error.stack, componentStack: info.componentStack })
  }
  render() { return this.state.failed ? <div data-qa-crashed/> : this.props.children }
}
function observe(label: string) {
  const form = container.querySelector<HTMLFormElement>('form.pm-drawer-form')
  const value = {
    label, html: container.innerHTML, formPresent: !!form,
    shellMarker: !!container.querySelector('[data-qa-taskform]'),
    title: form?.querySelector<HTMLInputElement>('[name="title"]')?.value,
    search: form?.querySelector<HTMLInputElement>('.pm-pred-search')?.value,
    checkboxes: [...container.querySelectorAll<HTMLInputElement>('input[name="predecessorIds"]')]
      .map(n => ({ id: n.value, checked: n.checked, type: n.type })),
    selected: form ? new dom.window.FormData(form).getAll('predecessorIds').map(String) : null,
    footer: container.querySelector('.pm-pred-footer')?.textContent,
    caught: structuredClone(caught), calls: structuredClone(calls),
    recordsSha256: digest(records),
  }
  events.push(value)
  return value
}
async function mount(predecessorIds: string[] = [], reverseEdge = false) {
  seed(predecessorIds, reverseEdge)
  expect(typeof TaskForm, 'BLOCKED_FACILITY: private component export adapter').toBe('function')
  await act(async () => {
    root = createRoot(container)
    root.render(<Boundary><div data-qa-taskform><TaskForm
      projectId="p-0001" task={records[3]} tasks={records} milestones={[]} meetings={[]}
      assigneeCandidates={['QA']} deliverableOptions={[]} disabled={false}
      stageEnabled={false} downloadEnabled={false}
      run={async (line: string) => { calls.push({ kind: 'run', line }); return false }}
      onSaved={() => calls.push({ kind: 'onSaved' })}
      onCancel={() => calls.push({ kind: 'onCancel' })}
      onOpenMeeting={() => calls.push({ kind: 'onOpenMeeting' })}
      onChanged={() => calls.push({ kind: 'onChanged' })}
      onError={(text: string) => calls.push({ kind: 'onError', text })}/>
    </div></Boundary>)
  })
  expect(container.querySelector('form.pm-drawer-form')).not.toBeNull()
  expect(container.querySelector('input[name="predecessorIds"][value="t-0004"]')).toBeNull()
  observe('mounted-existing-t4')
}
function assertSelection(expected: string[]) {
  const state = observe(`assert-selected-${expected.join(',')}`)
  expect(caught, '真实 TaskForm 不得因未提交前置点击发生 render 错误').toEqual([])
  expect(state.formPresent, '真实 TaskForm 未保存时不得卸载').toBe(true)
  expect(state.selected!.sort()).toEqual([...expected].sort())
  expect(state.footer).toBe(`已选 ${expected.length} 项`)
  for (const input of state.checkboxes.filter(n => n.type === 'checkbox')) {
    expect(input.checked, input.id).toBe(expected.includes(input.id))
  }
  expect(calls.filter(c => c.kind !== 'onCancel'), 'submit 前零命令/网络/业务回调').toEqual([])
}
async function input(selector: string, value: string) {
  const node = container.querySelector<HTMLInputElement>(selector)
  expect(node, `fixture input ${selector}`).not.toBeNull()
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(node, value)
  node!.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
}
async function fill(selector: string, value: string) {
  observe(`before-input-${value}`)
  await act(async () => { await input(selector, value) })
  observe(`after-input-${value}`)
  expect(container.querySelector<HTMLInputElement>(selector)?.value).toBe(value)
}
async function rapid() {
  observe('before-rapid-title-search')
  await act(async () => {
    for (const value of ['连续', '连续标题', '连续标题最终']) await input('[name="title"]', value)
    for (const value of ['候', '候选', '']) await input('.pm-pred-search', value)
  })
  observe('after-rapid-title-search')
  expect(container.querySelector<HTMLInputElement>('[name="title"]')?.value).toBe('连续标题最终')
  expect(container.querySelector<HTMLInputElement>('.pm-pred-search')?.value).toBe('')
}
async function click(id: string, expected: string[]) {
  const node = container.querySelector<HTMLInputElement>(`input[type="checkbox"][name="predecessorIds"][value="${id}"]`)
  expect(node, `fixture checkbox ${id}`).not.toBeNull()
  observe(`before-click-${id}`)
  await act(async () => { node!.click() })
  observe(`after-click-${id}`)
  assertSelection(expected)
}
beforeEach(ctx => {
  expect(evidenceRoot, 'BLOCKED_FACILITY: evidence root must be independently owned').toBeTruthy()
  caseRoot = join(evidenceRoot!, `${++sequence}-${ctx.task.name.split(' ')[0]}`)
  mkdirSync(caseRoot, { recursive: true })
  events = []; caught = []; calls = []; records = []
  container = dom.window.document.createElement('div')
  dom.window.document.body.appendChild(container)
  vi.stubGlobal('fetch', async (...args: unknown[]) => {
    calls.push({ kind: 'fetch', args: args.map(String) })
    throw new Error('非本计划网络调用')
  })
  for (const name of ['error', 'warn'] as const) {
    const original = console[name]
    vi.spyOn(console, name).mockImplementation((...args) => {
      events.push({ label: `console.${name}`, args: args.map(v => v instanceof Error
        ? { message: v.message, stack: v.stack } : String(v)) })
      original(...args)
    })
  }
  dom.window.addEventListener('error', windowError)
})
function windowError(event: ErrorEvent) {
  events.push({ label: 'window.error', message: event.message, stack: event.error?.stack })
}
afterEach(async () => {
  observe('before-cleanup')
  if (root) await act(async () => { root!.unmount(); root = undefined })
  observe('after-cleanup')
  writeFileSync(join(caseRoot, 'observations.json'), JSON.stringify({
    events, caught, calls, records, finalRecordsSha256: digest(records),
    boundary: '真实 TaskForm 子树；未点击 submit，不冒宿主 PM shell 或业务持久化',
  }, null, 2), { flag: 'wx' })
  container.remove()
  dom.window.removeEventListener('error', windowError)
  vi.restoreAllMocks()
})

describe('设施与产品控制', () => {
  it('C01 React18 SyntheticEvent 选取消生命周期控制', async () => {
    const seen: any[] = [], retained: any[] = []
    function Probe() {
      const [checked, setChecked] = useState(false)
      return <input type="checkbox" checked={checked} onChange={e => {
        seen.push({ checked: e.currentTarget.checked, input: e.currentTarget instanceof dom.window.HTMLInputElement })
        retained.push(e)
        const next = e.currentTarget.checked
        setChecked(() => next)
      }}/>
    }
    await act(async () => { root = createRoot(container); root.render(<Probe/>) })
    for (let i = 0; i < 2; i++) {
      await act(async () => { container.querySelector('input')!.click() })
      expect(retained[i].currentTarget).toBeNull()
      expect(container.querySelector<HTMLInputElement>('input')!.checked).toBe(i === 0)
    }
    expect(seen).toEqual([{ checked: true, input: true }, { checked: false, input: true }])
    events.push({ label: 'synthetic-event-control', seen, afterDispatch: retained.map(e => e.currentTarget) })
    controlReady = true
  })
  it('C02 已有选择搜索保留与干净取消控制', async () => {
    expect(controlReady, 'BLOCKED_FACILITY: C01').toBe(true)
    await mount(['t-0002']); assertSelection(['t-0002'])
    await fill('.pm-pred-search', '候选任务1'); assertSelection(['t-0002'])
    await fill('.pm-pred-search', ''); assertSelection(['t-0002'])
    const cancel = [...container.querySelectorAll('button')].find(n => n.textContent === '取消')
    expect(cancel, 'fixture clean cancel').toBeDefined()
    await act(async () => { cancel!.click() })
    expect(calls).toEqual([{ kind: 'onCancel' }])
  })
  it('C03 已有编辑连续标题输入零写控制', async () => {
    expect(controlReady, 'BLOCKED_FACILITY: C01').toBe(true)
    await mount(); await rapid(); assertSelection([])
  })
})
describe('实际 TaskForm 必要红', () => {
  it('N01 编辑 t4 填标题再选反向 t1 未提交必须存活', async () => {
    expect(controlReady, 'BLOCKED_FACILITY: C01').toBe(true)
    await mount([], true)
    const before = digest(records)
    await fill('[name="title"]', '已有任务四本地改名')
    await click('t-0001', ['t-0001'])
    expect(digest(records)).toBe(before)
  })
  it('N02 编辑已有前置 t2 填标题再反选未提交必须存活', async () => {
    expect(controlReady, 'BLOCKED_FACILITY: C01').toBe(true)
    await mount(['t-0002'])
    const before = digest(records)
    await fill('[name="title"]', '已有任务四反选')
    await click('t-0002', [])
    expect(digest(records)).toBe(before)
  })
  it('N03 选择取消与 rapid input 交叉保持精确集合', async () => {
    expect(controlReady, 'BLOCKED_FACILITY: C01').toBe(true)
    await mount()
    await click('t-0002', ['t-0002'])
    await rapid()
    await click('t-0001', ['t-0002', 't-0001'])
    await click('t-0002', ['t-0001'])
    await click('t-0001', [])
  })
  it('N04 已有前置 rapid input 后选取消重选保持精确集合', async () => {
    expect(controlReady, 'BLOCKED_FACILITY: C01').toBe(true)
    await mount(['t-0002']); await rapid()
    await click('t-0001', ['t-0001', 't-0002'])
    await click('t-0002', ['t-0001'])
    await click('t-0002', ['t-0001', 't-0002'])
  })
})
