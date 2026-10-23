import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import { RecordsMeetingForm } from './records-meeting-form.js'
import { RecordsListbox } from './records-listbox.js'
import { createMeetingCallbacks } from '../../shared/records-callbacks.js'
import { addProject } from '../../../core/projects.js'
import { addTask } from '../../../core/tasks.js'
import { addRiskIssue } from '../../../core/risk-issues.js'
import { addMeeting, addMeetingAction, getMeeting } from '../../../core/meetings.js'
import { handleMeetingCommand } from '../../../commands/meeting.js'
import type { PmDomain } from '../../../core/storage.js'

// 复制到独立冻结 src 后运行；真实组件/命令/内存领域，不是浏览器或磁盘测试。
const noop = () => {}
const mounts: ReactTestRenderer[] = []
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === 'string' ? child : text(child)).join('')
const rows = (renderer: ReactTestRenderer) => renderer.root.findAllByProps({ className: 'rb-action-row' })
const button = (node: ReactTestInstance, label: string) => {
  const found = node.findAllByType('button').find(child => text(child) === label)
  expect(found, label).toBeDefined()
  return found!
}
async function change(row: ReactTestInstance, label: string, value: string) {
  await act(async () => row.findByProps({ 'aria-label': label }).props.onChange({ currentTarget: { value } }))
}
async function submit(renderer: ReactTestRenderer) {
  await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault: noop }))
}
async function fixture(count = 2) {
  const tables = new Map<string, Map<string, unknown>>()
  const domain = { table(name: string) {
    if (!tables.has(name)) tables.set(name, new Map())
    const table = tables.get(name)!
    return { get: (id: string) => table.get(id), put: (id: string, value: unknown) => table.set(id, value),
      entries: () => table.entries(), keys: () => table.keys(), list: () => [...table.values()],
      delete: (id: string) => table.delete(id) }
  } } as unknown as PmDomain
  const snapshot = () => JSON.stringify([...tables].map(([name, table]) => [name, [...table]]))
  const project = await addProject(domain, { name: '独立 A11', startDate: '2026-10-21', targetDate: '2026-12-31' })
  const other = await addProject(domain, { name: '独立跨项目控制', startDate: '2026-10-21', targetDate: '2026-12-31' })
  const long = '关联选项完整长标题不能丢失'.repeat(30)
  const task = await addTask(domain, { projectId: project.id, title: long })
  const otherTask = await addTask(domain, { projectId: other.id, title: '不应出现任务' })
  const issue = await addRiskIssue(domain, { projectId: project.id, type: 'issue', title: long, impact: 'low' })
  const risk = await addRiskIssue(domain, { projectId: project.id, type: 'risk', title: '风险不可作问题', impact: 'low', probability: 'low' })
  const otherIssue = await addRiskIssue(domain, { projectId: other.id, type: 'issue', title: '不应出现问题', impact: 'low' })
  const meeting = await addMeeting(domain, { projectId: project.id, title: '独立会议', meetingDate: '2026-10-21',
    participants: ['甲', '乙'], decisions: ['保留决议'], notes: '保留备注' })
  for (const title of ['原一', '原二'].slice(0, count)) {
    await addMeetingAction(domain, meeting.id, { title, owner: '原负责人', dueDate: '2026-10-29',
      taskId: task.id, riskIssueId: issue.id })
  }
  const lines: string[] = []
  const confirmations: unknown[] = []
  const callbacks = createMeetingCallbacks({ projectId: project.id, refresh: noop, confirm: async opts => {
    confirmations.push(opts); return true
  }, run: async line => {
    lines.push(line)
    return (await handleMeetingCommand(line.slice('meeting '.length), domain)).kind === 'success'
  } })
  callbacks.onSaved = vi.fn()
  const cancel = vi.fn()
  const props = { projectId: project.id, meeting: getMeeting(domain, meeting.id)!, callbacks, onCancel: cancel,
    tasks: [task, otherTask], riskIssues: [issue, risk, otherIssue] }
  let renderer!: ReactTestRenderer
  act(() => { renderer = create(createElement(RecordsMeetingForm, props)) })
  mounts.push(renderer)
  return { domain, snapshot, project, other, task, otherTask, issue, risk, otherIssue, long,
    meeting: props.meeting, callbacks, cancel, lines, confirmations, renderer, props }
}
afterEach(() => {
  for (const renderer of mounts.splice(0)) act(() => renderer.unmount())
})

it('IND01 六个可见字段标签及长原值/选项完整存在，未吞标签或删控件（不签实际长菜单）', async () => {
  const f = await fixture()
  for (const row of rows(f.renderer)) {
    const labels = row.findAllByType('label')
    expect(labels.map(label => text(label.findAllByType('span')[0]))).toEqual(
      ['行动项标题', '负责人', '截止', '行动项状态', '关联任务', '关联问题'])
    const taskSelect = row.findByProps({ 'aria-label': '关联任务' })
    const issueSelect = row.findByProps({ 'aria-label': '关联问题' })
    expect(taskSelect.findAllByType('option').map(o => [o.props.value, text(o)])).toEqual(
      [['', '不关联任务'], [f.task.id, `${f.task.code} ${f.long}`]])
    expect(issueSelect.findAllByType('option').map(o => [o.props.value, text(o)])).toEqual(
      [['', '不关联问题'], [f.issue.id, f.long]])
    expect(row.findByType(RecordsListbox).props.ariaLabel).toBe('行动项状态')
    expect(row.findByProps({ className: 'rb-action-commands' }).findAllByType('button').map(text)).toEqual(['保存', '转任务', '删除'])
  }
  expect(f.lines).toEqual([])
})

it('IND02 两旧行错误词标题/状态/负责人/截止与关联 clear→restore 主保存按稳定ID保历史', async () => {
  const f = await fixture()
  const before = structuredClone(f.meeting)
  for (const [i, row] of rows(f.renderer).entries()) {
    await change(row, '行动项标题', i === 0 ? '失败待重试一' : '错误处理已完成二')
    await change(row, '负责人', `负责人${i}`)
    await change(row, '截止', '2026-11-02')
    await act(async () => row.findByType(RecordsListbox).props.onChange(i === 0 ? 'in_progress' : 'done'))
    await change(row, '关联任务', '')
    await change(row, '关联问题', '')
  }
  await submit(f.renderer)
  const saved = getMeeting(f.domain, f.meeting.id)!
  expect(saved.actions).toEqual(before.actions.map((action, i) => ({ ...action,
    title: i === 0 ? '失败待重试一' : '错误处理已完成二', owner: `负责人${i}`, dueDate: '2026-11-02',
    status: i === 0 ? 'in_progress' : 'done', taskId: null, riskIssueId: null })))
  for (const key of Object.keys(before).filter(k => !['actions', 'updatedAt'].includes(k))) {
    expect(saved[key as keyof typeof saved]).toEqual(before[key as keyof typeof before])
  }
  expect(f.lines).toHaveLength(3)
  expect(f.lines[0].startsWith(`meeting update ${f.meeting.id} `)).toBe(true)
  expect(f.lines.slice(1).map(line => line.split(' ').slice(0, 5).join(' '))).toEqual(
    f.meeting.actions.map(action => `meeting action update ${f.meeting.id} ${action.id}`))
  const restore = rows(f.renderer)[0]
  await change(restore, '关联任务', f.task.id)
  await change(restore, '关联问题', f.issue.id)
  await submit(f.renderer)
  expect(getMeeting(f.domain, f.meeting.id)!.actions[0]).toMatchObject({
    id: before.actions[0].id, taskId: f.task.id, riskIssueId: f.issue.id })
  expect(f.callbacks.onSaved).toHaveBeenCalledTimes(2)
})

it('IND03 新行填长稿后取消，原领域全部表字节序列不变（内存零写）', async () => {
  const f = await fixture(0)
  const before = f.snapshot()
  await act(async () => button(f.renderer.root, '添加行动项').props.onClick())
  const row = rows(f.renderer)[0]
  await change(row, '行动项标题', f.long)
  await change(row, '关联任务', f.task.id)
  await change(row, '关联问题', f.issue.id)
  expect(row.findByProps({ 'aria-label': '行动项标题' }).props.value).toBe(f.long)
  await act(async () => button(f.renderer.root, '取消').props.onClick())
  expect(f.cancel).toHaveBeenCalledTimes(1)
  expect(f.lines).toEqual([])
  expect(f.snapshot()).toBe(before)
})

it('IND04 首新行成功/次新行失败保长稿和完整提示，retry不重复add，仍同容器', async () => {
  const f = await fixture(0)
  const original = f.callbacks.onSaveAction
  let fail = true
  f.callbacks.onSaveAction = (mid, id, payload) =>
    fail && payload.title === f.long ? Promise.resolve(false) : original(mid, id, payload)
  for (const title of ['失败词合法成功', f.long]) {
    await act(async () => button(f.renderer.root, '添加行动项').props.onClick())
    await change(rows(f.renderer).at(-1)!, '行动项标题', title)
  }
  await submit(f.renderer)
  expect(f.callbacks.onSaved).not.toHaveBeenCalled()
  expect(getMeeting(f.domain, f.meeting.id)!.actions.map(a => a.title)).toEqual(['失败词合法成功'])
  const container = f.renderer.root.findByProps({ className: 'rb-meeting-actions' })
  expect(rows(f.renderer).every(row => row.parent === container)).toBe(true)
  expect(text(rows(f.renderer)[0].findByProps({ role: 'status' }))).toBe('此新行已保存，重开会议后可继续编辑。')
  expect(rows(f.renderer)[1].findByProps({ 'aria-label': '行动项标题' }).props.value).toBe(f.long)
  expect(rows(f.renderer)[0].findByProps({ 'aria-label': '行动项标题' }).props.disabled).toBe(true)
  fail = false
  await submit(f.renderer)
  expect(getMeeting(f.domain, f.meeting.id)!.actions.map(a => [a.id, a.title])).toEqual([
    ['ai-001', '失败词合法成功'], ['ai-002', f.long]])
  expect(f.lines.filter(line => line.startsWith('meeting action add'))).toHaveLength(2)
  expect(f.callbacks.onSaved).toHaveBeenCalledTimes(1)
})

it('IND05 busy/disabled在直接调用控件handler时仍拒改稿/添加/取消/写，false后可重试', async () => {
  const f = await fixture()
  let release!: (value: boolean) => void
  f.callbacks.onSaveMeeting = vi.fn(() => new Promise(resolve => { release = resolve }))
  const oldTitle = rows(f.renderer)[0].findByProps({ 'aria-label': '行动项标题' }).props.value
  await submit(f.renderer)
  await change(rows(f.renderer)[0], '行动项标题', 'busy不可改')
  await act(async () => {
    button(f.renderer.root, '添加行动项').props.onClick()
    button(f.renderer.root, '取消').props.onClick()
    button(rows(f.renderer)[0], '保存').props.onClick()
  })
  expect(rows(f.renderer)).toHaveLength(2)
  expect(rows(f.renderer)[0].findByProps({ 'aria-label': '行动项标题' }).props.value).toBe(oldTitle)
  expect(f.cancel).not.toHaveBeenCalled()
  expect(f.lines).toEqual([])
  await act(async () => release(false))
  act(() => f.renderer.update(createElement(RecordsMeetingForm, { ...f.props, disabled: true })))
  await change(rows(f.renderer)[0], '负责人', 'disabled不可改')
  await submit(f.renderer)
  expect(rows(f.renderer)[0].findByProps({ 'aria-label': '负责人' }).props.value).toBe('原负责人')
  expect(f.callbacks.onSaveMeeting).toHaveBeenCalledTimes(1)
})

it('IND06 行按钮保存/转任务/删除仍绑定实际 stableID及原confirm，不因新容器错对象', async () => {
  const f = await fixture()
  const row = rows(f.renderer)[1]
  const id = f.meeting.actions[1].id
  await change(row, '行动项标题', '第二行独立保存')
  await act(async () => button(row, '保存').props.onClick())
  expect(getMeeting(f.domain, f.meeting.id)!.actions[1]).toMatchObject({ id, title: '第二行独立保存' })
  await act(async () => button(row, '转任务').props.onClick())
  expect(f.lines.at(-1)).toBe(`meeting action promote ${f.meeting.id} ${id} confirm`)
  await act(async () => button(row, '删除').props.onClick())
  expect(f.lines.at(-1)).toBe(`meeting action delete ${f.meeting.id} ${id} confirm`)
  expect(getMeeting(f.domain, f.meeting.id)!.actions.map(a => a.id)).toEqual([f.meeting.actions[0].id])
  expect(f.confirmations).toHaveLength(2)
})

it('IND07 传入projectId不同仍按会议实际归属筛选和保存，跨项目/risk handler值拒绝', async () => {
  const f = await fixture()
  act(() => f.renderer.update(createElement(RecordsMeetingForm, { ...f.props, projectId: f.other.id })))
  const row = rows(f.renderer)[0]
  await change(row, '关联任务', f.otherTask.id)
  await change(row, '关联问题', f.risk.id)
  await change(row, '关联问题', f.otherIssue.id)
  expect(row.findByProps({ 'aria-label': '关联任务' }).props.value).toBe(f.task.id)
  expect(row.findByProps({ 'aria-label': '关联问题' }).props.value).toBe(f.issue.id)
  await submit(f.renderer)
  expect(getMeeting(f.domain, f.meeting.id)!.projectId).toBe(f.project.id)
  expect(getMeeting(f.domain, f.meeting.id)!.actions).toEqual(f.meeting.actions)
})
