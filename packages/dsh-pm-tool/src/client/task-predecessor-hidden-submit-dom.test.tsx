import React, { Component, act } from 'react'
import { JSDOM } from 'jsdom'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { handleTaskCommand } from '../commands/task.js'
import { addProject } from '../core/projects.js'
import { addTask, getTask } from '../core/tasks.js'
import { taskWriteSchema } from '../core/task.js'
import type { PmDomain } from '../core/storage.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
  'HTMLTextAreaElement', 'HTMLSelectElement', 'Element', 'Node', 'Event', 'MouseEvent',
  'FormData', 'MutationObserver']) {
  vi.stubGlobal(key, key === 'window' ? dom.window : (dom.window as any)[key])
}
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const { createRoot } = await import('react-dom/client')
// The independent transform only exposes the unchanged private production TaskForm.
const panel = await import('./panel.js')
const TaskForm = (panel as any).TaskForm as React.ComponentType<any>
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement, caseRoot: string, sequence = 0
let events: any[], caught: any[], calls: any[], submitted: number
let records: any[], store: ReturnType<typeof memoryStore>, initial: any, beforeSubmit: any
let commandCompletion: Promise<boolean> | undefined

function memoryStore() {
  const tables = new Map<string, Map<string, any>>()
  const writes: any[] = []
  const domain = { table: (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
    const rows = tables.get(name)!
    return {
      get: (id: string) => structuredClone(rows.get(id)),
      put: (id: string, value: unknown) => {
        writes.push({ table: name, id, before: structuredClone(rows.get(id)), after: structuredClone(value) })
        rows.set(id, structuredClone(value))
      },
      entries: () => rows.entries(), keys: () => rows.keys(), list: () => [...rows.values()],
    }
  } } as unknown as PmDomain
  const snapshot = () => [...tables].filter(([, rows]) => rows.size)
    .sort(([a], [b]) => a.localeCompare(b)).map(([name, rows]) =>
      [name, [...rows].sort(([a], [b]) => a.localeCompare(b)).map(([id, value]) => [id, structuredClone(value)])])
  return { domain, writes, snapshot }
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
    title: form?.querySelector<HTMLInputElement>('[name="title"]')?.value,
    search: form?.querySelector<HTMLInputElement>('.pm-pred-search')?.value,
    checkboxes: [...container.querySelectorAll<HTMLInputElement>('input[name="predecessorIds"]')]
      .map(node => ({ id: node.value, checked: node.checked, type: node.type })),
    formDataPredecessors: form ? new dom.window.FormData(form).getAll('predecessorIds').map(String) : null,
    footer: container.querySelector('.pm-pred-footer')?.textContent,
    submitted, caught: structuredClone(caught), calls: structuredClone(calls),
    fixtureSha256: digest(records), domainSha256: store ? digest(store.snapshot()) : null,
    taskReadback: store ? structuredClone(getTask(store.domain, 't-0004')) : null,
    writes: store ? structuredClone(store.writes) : [],
  }
  events.push(value)
  return value
}

async function mount() {
  store = memoryStore()
  const project = await addProject(store.domain, {
    name: '隐藏前置关系保存独立测试', startDate: '2026-01-01', targetDate: '2026-12-31',
  })
  expect(project.id).toBe('p-0001')
  records = []
  for (let n = 1; n <= 4; n++) {
    const task = await addTask(store.domain, {
      projectId: project.id, title: n === 4 ? '已有任务四' : `候选任务${n}`,
      description: '合法已有任务说明', assignee: 'QA', status: 'todo', priority: 'P1',
      startDate: '2026-01-01', dueDate: '2026-12-31', progress: 0,
      ...(n === 4 ? { predecessorIds: ['t-0002'] } : {}),
    })
    expect(task.id).toBe(`t-000${n}`)
    records.push(taskWriteSchema.parse(task))
  }
  expect(records[3].predecessorIds).toEqual(['t-0002'])
  expect(records.slice(0, 3).every(t => !(t.predecessorIds ?? []).length)).toBe(true)
  initial = { records: structuredClone(records), fixtureSha256: digest(records),
    snapshot: store.snapshot(), writes: store.writes.length }
  expect(typeof TaskForm, 'BLOCKED_FACILITY: private export adapter').toBe('function')
  await act(async () => {
    root = createRoot(container)
    root.render(<Boundary><TaskForm
      projectId={project.id} task={records[3]} tasks={records} milestones={[]} meetings={[]}
      assigneeCandidates={['QA']} deliverableOptions={[]} disabled={false}
      stageEnabled={false} downloadEnabled={false}
      run={(line: string) => {
        commandCompletion = (async () => {
          const match = /^task update (t-\d+) ([\s\S]+)$/.exec(line)
          calls.push({ kind: 'run', line, taskId: match?.[1],
            payload: match ? JSON.parse(match[2]) : null })
          expect(match, '生产 submit 必须调用 task update 命令').not.toBeNull()
          const response = await handleTaskCommand(line.slice('task '.length), store.domain)
          calls.push({ kind: 'handler-result', response: structuredClone(response) })
          return response.kind === 'success'
        })()
        return commandCompletion
      }}
      onSaved={() => calls.push({ kind: 'onSaved' })}
      onCancel={() => calls.push({ kind: 'onCancel' })}
      onOpenMeeting={() => calls.push({ kind: 'onOpenMeeting' })}
      onChanged={() => calls.push({ kind: 'onChanged' })}
      onError={(text: string) => calls.push({ kind: 'onError', text })}/>
    </Boundary>)
  })
  const form = container.querySelector<HTMLFormElement>('form.pm-drawer-form')
  expect(form).not.toBeNull()
  form!.addEventListener('submit', () => { submitted++ })
  expect(observe('mounted-existing-t4').formDataPredecessors).toEqual(['t-0002'])
}

function assertNoWrite() {
  expect(calls, '搜索与标题输入不得调用命令/业务回调/网络').toEqual([])
  expect(submitted).toBe(0)
  expect(store.snapshot()).toEqual(initial.snapshot)
  expect(store.writes).toHaveLength(initial.writes)
  expect(digest(records)).toBe(initial.fixtureSha256)
  expect(caught).toEqual([])
  expect(container.querySelector('form.pm-drawer-form')).not.toBeNull()
  expect(container.querySelector('.pm-pred-footer')?.textContent).toBe('已选 1 项')
}

async function fill(selector: string, value: string) {
  const node = container.querySelector<HTMLInputElement>(selector)
  expect(node, `fixture input ${selector}`).not.toBeNull()
  observe(`before-input-${value}`)
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(node, value)
    node!.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  observe(`after-input-${value}`)
  expect(container.querySelector<HTMLInputElement>(selector)?.value).toBe(value)
  assertNoWrite()
}

async function savePreservingRelation() {
  const title = `已有任务四只改标题${sequence}`
  await fill('[name="title"]', title)
  const button = [...container.querySelectorAll<HTMLButtonElement>('button')]
    .find(node => node.textContent === '保存更改')
  expect(button, '真实主保存按钮').toBeDefined()
  expect(button!.disabled).toBe(false)
  beforeSubmit = observe('before-primary-save')
  await act(async () => {
    button!.click()
    if (commandCompletion) await commandCompletion
  })
  const after = observe('after-primary-save-handler-complete')
  expect(submitted, '必须触达原生产 submit，不止取 FormData').toBe(1)
  expect(calls.map(c => c.kind)).toEqual(['run', 'handler-result', 'onSaved'])
  const run = calls.find(c => c.kind === 'run')
  expect(run.taskId).toBe('t-0004')
  expect(run.payload.title).toBe(title)
  expect(calls.find(c => c.kind === 'handler-result').response.kind).toBe('success')
  expect(store.writes.slice(initial.writes).map(w => [w.table, w.id])).toEqual([['tasks', 't-0004']])
  expect(after.taskReadback.id).toBe('t-0004')
  expect(after.taskReadback.title).toBe(title)
  const withoutEditedTask = (snapshot: any[]) => snapshot.map(([name, rows]) =>
    [name, name === 'tasks' ? rows.filter(([id]: any) => id !== 't-0004') : rows])
  expect(withoutEditedTask(store.snapshot())).toEqual(withoutEditedTask(initial.snapshot))
  expect(digest(records)).toBe(initial.fixtureSha256)
  expect(caught).toEqual([])
  expect(after.formPresent).toBe(true)
  // Assert only after submit/handler/write, retaining both payload and core readback evidence on RED.
  expect.soft(run.payload.predecessorIds, 'TPC02: 搜索是只读过滤，保存 payload 必须保既有 t2').toEqual(['t-0002'])
  expect.soft(after.taskReadback.predecessorIds ?? [], 'TPC02: 真实 handler/core 内存回读必须保既有 t2').toEqual(['t-0002'])
}

function windowError(event: ErrorEvent) {
  events.push({ label: 'window.error', message: event.message, stack: event.error?.stack })
}
beforeEach(ctx => {
  const evidenceRoot = process.env.QA_EVIDENCE_ROOT
  expect(evidenceRoot, 'BLOCKED_FACILITY: independently owned evidence root').toBeTruthy()
  caseRoot = join(evidenceRoot!, `${++sequence}-${ctx.task.name.split(' ')[0]}`)
  mkdirSync(caseRoot, { recursive: true, mode: 0o700 })
  events = []; caught = []; calls = []; records = []; submitted = 0
  store = undefined as any; initial = undefined; beforeSubmit = undefined; commandCompletion = undefined
  container = dom.window.document.createElement('div')
  dom.window.document.body.appendChild(container)
  vi.stubGlobal('fetch', async (...args: unknown[]) => {
    calls.push({ kind: 'fetch', args: args.map(String) })
    throw new Error('本合同禁止网络调用')
  })
  for (const name of ['error', 'warn'] as const) {
    const original = console[name]
    vi.spyOn(console, name).mockImplementation((...args) => {
      events.push({ label: `console.${name}`, args: args.map(value => value instanceof Error
        ? { message: value.message, stack: value.stack } : String(value)) })
      original(...args)
    })
  }
  dom.window.addEventListener('error', windowError)
})
afterEach(async () => {
  observe('before-cleanup')
  if (root) await act(async () => { root!.unmount(); root = undefined })
  observe('after-cleanup')
  writeFileSync(join(caseRoot, 'observations.json'), JSON.stringify({
    initial, beforeSubmit, events, caught, calls, submitted, records,
    finalFixtureSha256: digest(records), finalSnapshot: store?.snapshot(), writes: store?.writes,
    boundary: '真实 TaskForm submit -> run 薄接线 -> 原 handleTaskCommand/core -> 内存 PmDomain；无 JSON 落盘/重启/正式数据/GUI证据；无 checkbox 点击',
  }, null, 2) + '\n', { flag: 'wx' })
  container.remove()
  dom.window.removeEventListener('error', windowError)
  vi.restoreAllMocks()
})

describe('TPC02 真实主保存保隐藏前置关系', () => {
  it('HPS-C01 无搜索只改标题保存保既有关系', async () => {
    await mount(); assertNoWrite()
    await savePreservingRelation()
  })
  it('HPS-C02 搜索隐藏后恢复搜索再保存保既有关系', async () => {
    await mount()
    await fill('.pm-pred-search', '候选任务1')
    expect(observe('hidden-before-restore').checkboxes.map(n => n.id)).toEqual(['t-0001'])
    await fill('.pm-pred-search', '')
    expect(observe('restored-search').formDataPredecessors).toEqual(['t-0002'])
    await savePreservingRelation()
  })
  it('HPS-C03 搜索仍显示已选t2保存保既有关系', async () => {
    await mount()
    await fill('.pm-pred-search', '候选任务2')
    expect(observe('selected-visible').checkboxes.map(n => n.id)).toEqual(['t-0002'])
    await savePreservingRelation()
  })
  it('HPS-N01 搜索只剩t1隐藏已选t2主保存必须保关系', async () => {
    await mount()
    await fill('.pm-pred-search', '候选任务1')
    expect(observe('selected-hidden-only-t1-visible').checkboxes.map(n => n.id)).toEqual(['t-0001'])
    await savePreservingRelation()
  })
  it('HPS-N02 搜索无匹配隐藏所有选项主保存必须保关系', async () => {
    await mount()
    await fill('.pm-pred-search', '不存在的候选任务')
    expect(observe('all-options-hidden').checkboxes).toEqual([])
    await savePreservingRelation()
  })
})
