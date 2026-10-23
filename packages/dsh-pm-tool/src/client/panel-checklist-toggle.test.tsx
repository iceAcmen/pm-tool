import React from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PmPanel } from './panel.js'
import { TaskTable } from './views/tasks.js'

let view: ReactTestRenderer | undefined
let execute: ReturnType<typeof vi.fn>
let task: any
beforeEach(() => {
  const events = new EventTarget()
  vi.stubGlobal('window', {
    location: { hash: '', pathname: '/', search: '' }, history: { replaceState: vi.fn() },
    matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
  })
  vi.stubGlobal('document', { activeElement: null })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
  task = { id: 't-0001', projectId: 'p-0001', code: '1', title: '已有叶子', status: 'todo', priority: 'P1',
    progress: 40, manualProgress: 30, checklist: [
      { id: 'c-stable-1', text: '已完成检查点', done: true },
      { id: 'c-stable-2', text: '未完成检查点', done: false },
    ] }
  execute = vi.fn(async (line: string) => {
    if (line === 'web snapshot') return JSON.stringify({
      projects: [{ id: 'p-0001', name: '清单验收' }], tasks: [task],
      milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [],
    })
    const match = line.match(/^task checklist toggle t-0001 (\S+) (true|false)$/)
    if (!match) throw new Error('意外命令')
    task = { ...task, checklist: task.checklist.map((i: any) => i.id === match[1] ? { ...i, done: match[2] === 'true' } : i) }
    return '清单已更新'
  })
})
afterEach(() => {
  if (view) act(() => view!.unmount())
  view = undefined
  vi.unstubAllGlobals()
})
async function open() {
  await act(async () => { view = create(<PmPanel execute={execute}/>) })
  await act(async () => { view!.root.findByType(TaskTable).props.onEdit(task) })
}
const checkbox = () => view!.root.findAllByType('input').find(n => n.props['aria-label'] === '清单：未完成检查点')!

describe('既有任务清单显式目标态入口', () => {
  it('浏览零写，勾选发stableID和目标态，刷新真源后显示且不改人工/status/legacy', async () => {
    await open()
    expect(execute.mock.calls.map(c => c[0])).toEqual(['web snapshot'])
    expect(checkbox()).toBeTruthy()
    expect(checkbox().props.checked).toBe(false)
    await act(async () => { await checkbox().props.onChange({ currentTarget: { checked: true } }) })
    expect(execute.mock.calls.map(c => c[0])).toContain('task checklist toggle t-0001 c-stable-2 true')
    expect(checkbox().props.checked).toBe(true)
    expect(task.manualProgress).toBe(30); expect(task.progress).toBe(40); expect(task.status).toBe('todo')
    await act(async () => { await checkbox().props.onChange({ currentTarget: { checked: false } }) })
    expect(checkbox().props.checked).toBe(false)
    expect(execute.mock.calls.map(c => c[0])).toContain('task checklist toggle t-0001 c-stable-2 false')
  })
  it('命令失败保原实态并结束busy，显示就近中文错误', async () => {
    await open()
    execute.mockRejectedValueOnce(new Error('隔离写入失败'))
    expect(checkbox()).toBeTruthy()
    await act(async () => { await checkbox().props.onChange({ currentTarget: { checked: true } }) })
    expect(checkbox().props.checked).toBe(false)
    expect(checkbox().props.disabled).toBe(false)
    const messages = view!.root.findAll(n => n.props.role === 'alert')
      .map(n => n.children.filter(c => typeof c === 'string').join(''))
    expect(messages.join('\n')).toContain('清单更新失败')
  })
})
