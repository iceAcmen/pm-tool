import { appendFileSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PmPanel } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { CopilotPanel } from '../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.js'
import { TaskTable } from '../../packages/dsh-pm-tool/src/client/views/tasks.js'
import { parseCopilotPlan, validatePlan } from '../../packages/dsh-pm-tool/src/core/copilot.js'

const input = JSON.parse(readFileSync(process.env.A14_REPLAY_INPUT!, 'utf8'))
const inertHandle = 'undo-a14-self-only'
const noop = () => {}
const mounts: ReactTestRenderer[] = []
const record = (id: string, data: unknown) => appendFileSync(process.env.A14_OBSERVATIONS!,
  `${JSON.stringify({ id, at: new Date().toISOString(), data })}\n`)
let local: Map<string, string>
let formValues: Map<string, unknown>
const text = (node: ReactTestInstance): string => node.children.map(child =>
  typeof child === 'string' ? child : text(child)).join('')
const find = (m: ReactTestRenderer, key: string, value: unknown) =>
  m.root.findAll(node => typeof node.type === 'string' && node.props[key] === value)[0]
const undoButtons = (m: ReactTestRenderer) => m.root.findAll(node =>
  node.type === 'button' && node.props.className === 'pm-copilot-undo-btn')
const mode = (m: ReactTestRenderer, next: string) => {
  const node = find(m, 'id', next === 'draft' ? 'cp-tab-draft' : 'cp-tab-diag')
  expect(node, '真实模式控件').toBeTruthy()
  act(() => node.props.onClick())
}
const pendingText = '仅本测试未发送文本'
function changeInput(m: ReactTestRenderer, value: string) {
  const node = find(m, 'className', 'pm-copilot-input')
  expect(node).toBeTruthy()
  act(() => node.props.onChange({ target: { value } }))
}

async function fixture() {
  const initial = structuredClone(input.snapshot)
  initial.tasks = initial.tasks.map((t: any) => input.initialTasks.find((x: any) => x.id === t.id) ?? t)
  let snapshot = initial
  let applied = false
  const calls: string[] = []
  const pending: Promise<unknown>[] = []
  // Only the transport is a double. No production handle, host handler, RPC, or business disk writes.
  const dispatch = async (line: string) => {
    calls.push(line)
    record('transport', { line, double: true, network: false })
    if (line === 'web snapshot') return { kind: 'success', text: JSON.stringify(snapshot) }
    if (line === 'model status') return { kind: 'success', text: input.modelStatus }
    if (line.startsWith('model mode ')) return { kind: 'success', text: '隔离测试车道' }
    if (line.startsWith('ask-provenance ')) return { kind: 'success', text: input.provenance }
    if (line.startsWith('ask p-0001 ')) return { kind: 'success', text: input.askText }
    if (line.startsWith('ask-apply p-0001 ')) {
      expect(applied).toBe(false)
      const json = line.slice('ask-apply p-0001 '.length).split(' --base ')[0]
      const actions = JSON.parse(json)
      expect(actions.map((a: any) => [a.stepId, a.id, a.needs]))
        .toEqual([['s1', 't-0001', []], ['s2', 't-0001', ['s1']], ['s3', 't-0002', []]])
      expect(JSON.parse(line.split(' --base ')[1])).toEqual(Object.fromEntries(
        input.initialTasks.map((t: any) => [t.id, t.updatedAt])))
      applied = true
      snapshot = { ...snapshot, tasks: snapshot.tasks.map((t: any) =>
        input.appliedTasks.find((x: any) => x.id === t.id) ?? t) }
      return { kind: 'success', text: input.applyText }
    }
    if (line === 'ask-undo list') {
      expect(applied).toBe(true)
      return { kind: 'success', text: JSON.stringify({ undoIds: [{ id: inertHandle, at: Date.now() }] }) }
    }
    if (line.startsWith('ask-undo')) throw new Error('本专家禁止执行任何 undo，包括测试 handle')
    if (line.startsWith('task update t-0001 ')) {
      const payload = JSON.parse(line.slice('task update t-0001 '.length))
      expect(payload.assignee).toBe('外部人工改派保留')
      expect(payload).not.toHaveProperty('draft')
      record('task-form-payload', { payload, responseIsArchivedDouble: true })
      snapshot = structuredClone(input.snapshot)
      return { kind: 'success', text: input.updateText }
    }
    throw new Error(`未授权测试传输: ${line}`)
  }
  const raw = (line: string) => {
    const result = dispatch(line)
    pending.push(result)
    return result
  }
  const execute = async (line: string) => (await raw(line)).text
  const flush = async () => {
    for (let i = 0; i < 12; i++) {
      const count = pending.length
      await Promise.all(pending)
      await new Promise(resolve => setTimeout(resolve, 0))
      if (count === pending.length) return
    }
    throw new Error('设施异步未排空')
  }
  local.set('pm-selected-project', 'p-0001')
  local.set('pm-view', 'tasks')
  let m!: ReactTestRenderer
  await act(async () => {
    m = create(createElement(PmPanel, { execute, executeRaw: raw }))
    await flush()
  })
  mounts.push(m)
  expect(m.root.findAllByType(TaskTable)).toHaveLength(1)
  await act(async () => { find(m, 'className', 'pm-button pm-top-secondary pm-copilot-open').props.onClick(); await flush() })
  expect(m.root.findAllByType(CopilotPanel)).toHaveLength(1)
  return { m, calls, flush, snapshot: () => snapshot }
}

async function generate(f: Awaited<ReturnType<typeof fixture>>) {
  changeInput(f.m, '混合撤销三步来源核验')
  await act(async () => { find(f.m, 'aria-label', '发送').props.onClick(); await f.flush() })
  mode(f.m, 'draft')
  expect(f.m.root.findAll(node => node.type === 'div' && 'data-copilot-step' in node.props)).toHaveLength(3)
}
async function apply(f: Awaited<ReturnType<typeof fixture>>) {
  await generate(f)
  await act(async () => { find(f.m, 'className', 'pm-copilot-apply-main').props.onClick(); await f.flush() })
  expect(undoButtons(f.m)).toHaveLength(1)
  expect(text(undoButtons(f.m)[0]).trim()).toBe('撤销 · 整批 3 步')
  expect(f.calls.filter(c => c === 'ask-undo list')).toHaveLength(1)
}
async function minimize(f: Awaited<ReturnType<typeof fixture>>) {
  await act(async () => {
    find(f.m, 'aria-label', '最小化为侧边标签（保留上下文）').props.onClick()
    await f.flush()
  })
  record('minimized', { copilotInstances: f.m.root.findAllByType(CopilotPanel).length,
    tab: !!find(f.m, 'className', 'pm-sidecar-tab') })
}
async function expand(f: Awaited<ReturnType<typeof fixture>>) {
  await act(async () => {
    find(f.m, 'aria-label', '展开 AI 副驾，保留此前上下文').props.onClick()
    await f.flush()
  })
  record('expanded', { copilotInstances: f.m.root.findAllByType(CopilotPanel).length,
    undoLabels: undoButtons(f.m).map(text), modelStatusCalls: f.calls.filter(c => c === 'model status').length })
}
const noUndo = (calls: string[]) => expect(calls.filter(c => c.startsWith('ask-undo') && c !== 'ask-undo list')).toEqual([])

beforeEach(() => {
  local = new Map()
  formValues = new Map()
  vi.stubGlobal('localStorage', { getItem: (k: string) => local.get(k) ?? null,
    setItem: (k: string, v: string) => local.set(k, v), removeItem: (k: string) => local.delete(k) })
  vi.stubGlobal('window', { location: { hash: '', search: '', pathname: '/' },
    addEventListener: noop, removeEventListener: noop, setTimeout, clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) })
  vi.stubGlobal('document', { activeElement: null, querySelector: () => null,
    addEventListener: noop, removeEventListener: noop, body: { dataset: {} } })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 1 })
  vi.stubGlobal('cancelAnimationFrame', noop)
  vi.stubGlobal('fetch', () => { throw new Error('测试禁止网络') })
  vi.stubGlobal('FormData', class {
    get(k: string) { return formValues.get(k) ?? null }
    getAll(k: string) { return k === 'predecessorIds' ? [] : [] }
  })
})
afterEach(() => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

it('BASE SM-B01 合法原计划/真实组件批确认/不最小化刷新保撤销', async () => {
  const plan = parseCopilotPlan(input.askText)
  const validated = validatePlan(plan.rawSteps, { taskIds: input.initialTasks.map((t: any) => t.id),
    milestoneIds: [], riskIds: [], deliverableIds: [], meetingIds: [] })
  expect(validated.steps).toHaveLength(3)
  expect(validated.rejected).toEqual([])
  const f = await fixture()
  await apply(f)
  mode(f.m, 'diagnosis')
  changeInput(f.m, pendingText)
  await act(async () => { await f.m.root.findByType(CopilotPanel).props.onSaved(); await f.flush() })
  expect(undoButtons(f.m)).toHaveLength(1)
  expect(find(f.m, 'className', 'pm-copilot-input').props.value).toBe(pendingText)
  expect(f.calls.filter(c => c === 'model status')).toHaveLength(1)
  noUndo(f.calls)
  record('SM-B01', { calls: f.calls, undoLabels: undoButtons(f.m).map(text) })
})

it('AUTO SM-A01 最小化/展开必须保 fresh undo且不重挂载', async () => {
  const f = await fixture()
  await apply(f)
  const before = [...f.calls]
  await minimize(f)
  await expand(f)
  noUndo(f.calls)
  expect(f.calls.filter(c => c.startsWith('ask-apply'))).toHaveLength(1)
  record('SM-A01', { before, after: f.calls })
  expect.soft(undoButtons(f.m)).toHaveLength(1)
  expect.soft(f.calls.filter(c => c === 'model status')).toHaveLength(1)
})

it('AUTO SM-A02 最小化主TaskForm保存后保撤销与未发送输入', async () => {
  const f = await fixture()
  await apply(f)
  mode(f.m, 'diagnosis')
  changeInput(f.m, pendingText)
  act(() => f.m.root.findByType(TaskTable).props.onEdit(f.snapshot().tasks.find((t: any) => t.id === 't-0001')))
  await minimize(f)
  const task = f.snapshot().tasks.find((t: any) => t.id === 't-0001')
  for (const [key, value] of Object.entries(task)) formValues.set(key, value)
  formValues.set('assignee', '外部人工改派保留')
  const form = f.m.root.findAll(node => node.type === 'form' && node.props.className === 'pm-drawer-form')[0]
  expect(form).toBeTruthy()
  await act(async () => { form.props.onSubmit({ preventDefault: noop, currentTarget: { elements: { namedItem: () => null } } }); await f.flush() })
  expect(f.calls.filter(c => c.startsWith('task update t-0001 '))).toHaveLength(1)
  expect(f.snapshot().tasks.find((t: any) => t.id === 't-0001').assignee).toBe('外部人工改派保留')
  expect(f.snapshot().tasks.find((t: any) => t.id === 't-0001').progressLog).toEqual(task.progressLog)
  await expand(f)
  noUndo(f.calls)
  expect(f.calls.filter(c => c.startsWith('ask p-0001 '))).toHaveLength(1)
  record('SM-A02', { calls: f.calls, pendingInput: find(f.m, 'className', 'pm-copilot-input')?.props.value })
  expect.soft(undoButtons(f.m)).toHaveLength(1)
  expect.soft(find(f.m, 'className', 'pm-copilot-input').props.value).toBe(pendingText)
})

it('AUTO SM-A03 最小化/展开保草稿勾选编辑与未发送文本零确认', async () => {
  const f = await fixture()
  await generate(f)
  act(() => find(f.m, 'data-copilot-check', 's2').props.onChange({ target: { checked: false } }))
  act(() => find(f.m, 'data-copilot-edit', 's1.progress').props.onChange({ target: { value: '71' } }))
  mode(f.m, 'diagnosis')
  changeInput(f.m, pendingText)
  mode(f.m, 'draft')
  await minimize(f)
  await expand(f)
  expect(f.calls.filter(c => c.startsWith('ask-apply') || c.startsWith('ask-undo'))).toEqual([])
  const checks = f.m.root.findAll(node => node.type === 'input' && 'data-copilot-check' in node.props)
  const edited = find(f.m, 'data-copilot-edit', 's1.progress')?.props.value
  expect(find(f.m, 'id', 'cp-tab-draft').props['aria-selected']).toBe(true)
  mode(f.m, 'diagnosis')
  const unsent = find(f.m, 'className', 'pm-copilot-input').props.value
  record('SM-A03', { checkCount: checks.length, checks: checks.map(n => [n.props['data-copilot-check'], n.props.checked]), edited, unsent, calls: f.calls })
  expect.soft(checks).toHaveLength(3)
  expect.soft(checks.find(n => n.props['data-copilot-check'] === 's2')?.props.checked).toBe(false)
  expect.soft(edited).toBe(71)
  expect.soft(unsent).toBe(pendingText)
})
