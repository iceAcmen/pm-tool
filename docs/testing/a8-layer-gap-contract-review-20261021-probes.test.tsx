import { appendFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PmPanel } from './src/client/panel.js'
import { TaskTable } from './src/client/views/tasks.js'
import { MeetingsView } from './src/client/views/meetings.js'
import { RecordsMeetingForm } from './src/client/views/records/records-meeting-form.js'
import { RecordsDeliverableForm } from './src/client/views/records/records-deliverable-form.js'
import { createMeetingCallbacks, createDeliverableCallbacks } from './src/client/shared/records-callbacks.js'
import { addProject } from './src/core/projects.js'
import { addTask, listTasks } from './src/core/tasks.js'
import { addMeeting, addMeetingAction, getMeeting } from './src/core/meetings.js'
import { handleMeetingCommand } from './src/commands/meeting.js'
import { handleTaskCommand } from './src/commands/task.js'
import type { PmDomain } from './src/core/storage.js'

const noop = () => {}
const mounts: ReactTestRenderer[] = []
const record = (id: string, data: unknown) => appendFileSync(process.env.QA_OBSERVATIONS!,
  JSON.stringify({ id, at: new Date().toISOString(), data }) + '\n')
const text = (n: ReactTestInstance): string => n.children.map(c =>
  typeof c === 'string' ? c : text(c)).join('')
function mount(element: ReturnType<typeof createElement>) {
  let m!: ReactTestRenderer
  act(() => { m = create(element) })
  mounts.push(m)
  return m
}
function button(root: ReactTestInstance, name: string) {
  return root.findAllByType('button').find(n => text(n) === name)!
}
function memoryDomain(): PmDomain {
  const tables = new Map<string, Map<string, unknown>>()
  return { table(name: string) {
    if (!tables.has(name)) tables.set(name, new Map())
    const m = tables.get(name)!
    return { get: (id: string) => m.get(id), put: (id: string, v: unknown) => m.set(id, v),
      entries: () => m.entries(), keys: () => m.keys(), list: () => [...m.values()],
      delete: (id: string) => m.delete(id) }
  } } as unknown as PmDomain
}
async function fixture() {
  const domain = memoryDomain()
  const project = await addProject(domain, { name: 'A8 合同核验', startDate: '2026-10-21', targetDate: '2026-12-31' })
  const task = await addTask(domain, { projectId: project.id, title: 'A8 叶子任务', assignee: '张三' })
  const meeting = await addMeeting(domain, { projectId: project.id, title: 'A8 会议', meetingDate: '2026-10-21' })
  await addMeetingAction(domain, meeting.id, { title: 'A8 行动项', owner: '李四', taskId: task.id })
  return { domain, project, task, meeting: getMeeting(domain, meeting.id)! }
}
function meetingCallbacks(domain: PmDomain, lines: string[]) {
  return createMeetingCallbacks({ projectId: 'p-0001', refresh: noop, confirm: async () => true,
    run: async line => { lines.push(line); return (await handleMeetingCommand(line.slice('meeting '.length), domain)).kind === 'success' } })
}
beforeEach(() => {
  const storage = new Map([['pm-view', 'tasks']])
  vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) })
  vi.stubGlobal('window', { location: { hash: '', pathname: '/', search: '' },
    addEventListener: noop, removeEventListener: noop,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) })
  vi.stubGlobal('document', { activeElement: null, addEventListener: noop, removeEventListener: noop,
    querySelector: () => null, body: { dataset: {} } })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 1 })
  vi.stubGlobal('cancelAnimationFrame', noop)
})
afterEach(() => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

it('LG-01 control：真实 records 行内保存保留已存关联和稳定 ID，主保存不提交 action 草稿', async () => {
  const f = await fixture()
  const lines: string[] = []
  const m = mount(createElement(RecordsMeetingForm, { projectId: f.project.id, meeting: f.meeting,
    callbacks: meetingCallbacks(f.domain, lines), onCancel: noop }))
  const id = f.meeting.actions[0].id
  const row = m.root.findByProps({ className: 'rb-action-row' })
  await act(async () => row.findByProps({ 'aria-label': '行动项标题' }).props.onChange({ currentTarget: { value: 'A8 修改标题' } }))
  await act(async () => m.root.findByType('form').props.onSubmit({ preventDefault: noop }))
  expect(getMeeting(f.domain, f.meeting.id)!.actions[0].title).toBe('A8 行动项')
  await act(async () => button(row, '保存').props.onClick())
  const saved = getMeeting(f.domain, f.meeting.id)!.actions[0]
  record('LG-01-control', { lines, saved })
  expect(saved.id).toBe(id)
  expect(saved.taskId).toBe(f.task.id)
  expect(saved.title).toBe('A8 修改标题')
})

it('LG-01 contract：默认 MeetingsView 编辑真实 records 必须有任务/问题关联及解除入口', async () => {
  const f = await fixture()
  const fallback = vi.fn()
  const m = mount(createElement(MeetingsView, { meetings: [f.meeting], onCreate: fallback, onEdit: fallback,
    records: { projectId: f.project.id, callbacks: meetingCallbacks(f.domain, []) } }))
  const edit = m.root.findByProps({ 'aria-label': '编辑会议' })
  await act(async () => edit.props.onClick())
  expect(fallback).not.toHaveBeenCalled()
  const actual = m.root.findByType(RecordsMeetingForm)
  const row = actual.findByProps({ className: 'rb-action-row' })
  const controls = row.findAll(n => typeof n.type === 'string'
    && ['input', 'select', 'button', 'textarea'].includes(n.type)).map(n => ({
    type: n.type, name: n.props.name, label: n.props['aria-label'], role: n.props.role,
    value: n.props.value, text: text(n),
  }))
  record('LG-01-default-entry', { actualComponent: actual.type.name, controls,
    fallbackCalls: fallback.mock.calls.length })
  const association = controls.filter(n => /关联.*(任务|问题)|(任务|问题).*关联/.test(`${n.label ?? ''} ${n.name ?? ''} ${n.text}`))
  expect(association.length, '默认生产行动项缺已承诺任务/问题关联入口').toBeGreaterThanOrEqual(2)
})

it('LG-01b contract：原 test-cases 主保存必须提交已编辑行动项', async () => {
  const f = await fixture()
  const lines: string[] = []
  const m = mount(createElement(RecordsMeetingForm, { projectId: f.project.id, meeting: f.meeting,
    callbacks: meetingCallbacks(f.domain, lines), onCancel: noop }))
  await act(async () => m.root.findByProps({ 'aria-label': '行动项标题' }).props.onChange({
    currentTarget: { value: 'A8 主保存行动项' },
  }))
  await act(async () => m.root.findByType('form').props.onSubmit({ preventDefault: noop }))
  const saved = getMeeting(f.domain, f.meeting.id)!
  record('LG-01b', { lines, saved, expectedActionTitle: 'A8 主保存行动项' })
  expect(saved.actions[0].title, '原验收承诺主保存应读回行动项变更').toBe('A8 主保存行动项')
})

it('LG-02 control：新会议只写会议，编辑后新增行动项走既有分命令，取消零写', async () => {
  const f = await fixture()
  const lines: string[] = []
  const callbacks = meetingCallbacks(f.domain, lines)
  const cancel = vi.fn()
  const m = mount(createElement(RecordsMeetingForm, { projectId: f.project.id, callbacks, onCancel: cancel }))
  for (const [name, value] of [['title', 'A8 新会议'], ['meetingDate', '2026-10-21'], ['decisions', 'A8 决议']]) {
    await act(async () => m.root.findByProps({ name }).props.onChange({ currentTarget: { value } }))
  }
  const createActionCount = m.root.findAllByType('button').filter(n => text(n) === '添加行动项').length
  await act(async () => button(m.root, '取消').props.onClick())
  expect(lines).toEqual([])
  await act(async () => m.root.findByType('form').props.onSubmit({ preventDefault: noop }))
  const newlyCreated = Array.from(f.domain.table('meetings').entries()).map(([, v]) => v).find(v => v.title === 'A8 新会议')!
  expect(newlyCreated.actions).toEqual([])
  act(() => m.update(createElement(RecordsMeetingForm, { key: 'edit', projectId: f.project.id,
    meeting: newlyCreated, callbacks, onCancel: cancel })))
  await act(async () => button(m.root, '添加行动项').props.onClick())
  const row = m.root.findByProps({ className: 'rb-action-row' })
  await act(async () => row.findByProps({ 'aria-label': '行动项标题' }).props.onChange({ currentTarget: { value: 'A8 新行动项' } }))
  await act(async () => button(row, '保存').props.onClick())
  const saved = getMeeting(f.domain, newlyCreated.id)!
  record('LG-02', { createActionCount, lines, saved, cancelCalls: cancel.mock.calls.length })
  expect(saved.actions).toHaveLength(1)
  expect(lines[0]).toMatch(/^meeting add /)
  expect(lines[1]).toMatch(/^meeting action add /)
})

it('LG-03 control：生产交付物 owner 自由输入/清空不要求候选 popup', async () => {
  const lines: string[] = []
  const callbacks = createDeliverableCallbacks({ projectId: 'p-0001', refresh: noop,
    confirm: async () => true, run: async line => { lines.push(line); return true } })
  const m = mount(createElement(RecordsDeliverableForm, { projectId: 'p-0001', callbacks, onCancel: noop }))
  const owner = m.root.findAllByType('label').find(n => text(n) === '负责人')!.findByType('input')
  const name = m.root.findAllByType('label').find(n => text(n).startsWith('交付物名称'))!.findByType('input')
  await act(async () => name.props.onChange({ currentTarget: { value: 'A8 交付物' } }))
  await act(async () => owner.props.onChange({ currentTarget: { value: '全新人名' } }))
  await act(async () => m.root.findByType('form').props.onSubmit({ preventDefault: noop }))
  await act(async () => owner.props.onChange({ currentTarget: { value: '' } }))
  await act(async () => m.root.findByType('form').props.onSubmit({ preventDefault: noop }))
  record('LG-03', { ownerList: owner.props.list ?? null, lines })
  expect(JSON.parse(lines[0].slice('deliverable add '.length)).owner).toBe('全新人名')
  expect(JSON.parse(lines[1].slice('deliverable add '.length)).owner).toBe('')
})

it('LG-04 contract：真实 PmPanel 任务入口到 TaskForm，叶子清单必须可勾选', async () => {
  const f = await fixture()
  await handleTaskCommand(`checklist add ${f.task.id} A8 检查点一`, f.domain)
  await handleTaskCommand(`checklist add ${f.task.id} A8 检查点二`, f.domain)
  const items = listTasks(f.domain, f.project.id)[0].checklist!
  await handleTaskCommand(`checklist toggle ${f.task.id} ${items[0].id} true`, f.domain)
  const snapshot = { projects: [f.project], tasks: listTasks(f.domain, f.project.id),
    milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [] }
  const execute = vi.fn(async () => JSON.stringify(snapshot))
  let m!: ReactTestRenderer
  await act(async () => { m = create(createElement(PmPanel, { execute })); mounts.push(m) })
  const table = m.root.findByType(TaskTable)
  await act(async () => table.props.onEdit(snapshot.tasks[0]))
  const form = m.root.findAll(n => typeof n.type === 'function' && n.type.name === 'TaskForm')[0]
  expect(form).toBeTruthy()
  const boxes = form.findAllByType('input').filter(n => n.props.type === 'checkbox')
  const controls = boxes.map(n => ({ label: n.props['aria-label'], name: n.props.name, checked: n.props.checked }))
  record('LG-04', { form: form.type.name, text: text(form), checkboxes: controls,
    checklist: snapshot.tasks[0].checklist, executeCalls: execute.mock.calls })
  expect(boxes.length, 'OP-GUI-01 已承诺抽屉 toggle，不是只读分数').toBeGreaterThanOrEqual(2)
})

it('LG-05 contract：真实 TaskTable 选择 CSV→预览零写→确认落盘必须创建任务', async () => {
  const domain = memoryDomain()
  const project = await addProject(domain, { name: 'A8 导入', startDate: '2026-10-21', targetDate: '2026-12-31' })
  const csv = '层级,标题,负责人\n1,A8父,张三\n2,A8子,李四'
  let reader!: { result: string, onload: () => Promise<void> }
  vi.stubGlobal('FileReader', class {
    result = csv
    onload!: () => Promise<void>
    constructor() { reader = this }
    readAsText() {}
  })
  const calls: { phase: string, line: string, result: unknown }[] = []
  const command = async (phase: string, line: string) => {
    const result = await handleTaskCommand(line.slice('task '.length), domain)
    calls.push({ phase, line, result })
    return result
  }
  const onSaved = vi.fn()
  const m = mount(createElement(TaskTable, { tasks: [], milestones: [], projectId: project.id,
    onCreate: noop, onEdit: noop, onGenWbs: noop, onSaved,
    execute: async line => (await command('preview', line)).text,
    run: async line => (await command('confirm', line)).kind === 'success' }))
  await act(async () => m.root.findByProps({ className: 'pm-import-file' }).props.onChange({
    currentTarget: { files: [{ name: 'a8.csv' }], value: 'a8.csv' },
  }))
  await act(async () => reader.onload())
  expect(listTasks(domain, project.id)).toHaveLength(0)
  await act(async () => button(m.root, '确认落盘').props.onClick())
  const actualCount = listTasks(domain, project.id).length
  const previewClosed = m.root.findAllByProps({ className: 'pm-import-confirm' }).length === 0
  const control = await handleTaskCommand(`import-content ${project.id} a8.csv ${JSON.stringify(csv)} confirm`, domain)
  const controlTasks = listTasks(domain, project.id)
  record('LG-05', { calls, actualCount, previewClosed, onSavedCalls: onSaved.mock.calls.length, control, controlTasks })
  expect(control.kind).toBe('success')
  expect(controlTasks).toHaveLength(2)
  expect(controlTasks[1].parentId).toBe(controlTasks[0].id)
  expect(actualCount, '真实确认按钮重复 dry-run 未落盘').toBe(2)
})
