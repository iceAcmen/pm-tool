import React from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BoardBento } from './BoardBento.js'
import { parseLayout } from './persist.js'

// 挂载真实父组件，仅替代动态编辑器界面；父保存/刷新/反馈链原样执行。
const bridge = vi.hoisted(() => ({ props: null as any }))
const fixture = JSON.parse(readFileSync(new URL('../../../../../docs/testing/board-fixture-clarification-20261021-fixture.json', import.meta.url), 'utf8'))
vi.mock('../panel.js', () => ({ CrossProjectPeople: () => null }))
vi.mock('./widgets.js', async () => {
  const fixture = JSON.parse(readFileSync(new URL('../../../../../docs/testing/board-fixture-clarification-20261021-fixture.json', import.meta.url), 'utf8'))
  const types = [...fixture.widgets.map((w: any) => w.type), 'queueCard']
  return {
    WIDGET_REGISTRY: new Map(types.map(type => [type, { render: () => null }])),
    WIDGET_CATALOG: [], DEFAULT_LAYOUT: fixture, FIELD_WHITELIST: {},
    knownWidgetTypeSet: () => new Set(types), todayIso: () => '2026-10-21', rawListFor: () => [],
  }
})
vi.mock('./query.js', () => ({ selectEntity: () => [], applyFilter: () => [] }))
vi.mock('./editor.js', () => ({
  BoardEditor: (props: any) => { bridge.props = props; return <div data-feedback-editor/> },
}))

let view: ReactTestRenderer | undefined
let save: ReturnType<typeof vi.fn>, reset: ReturnType<typeof vi.fn>, refresh: ReturnType<typeof vi.fn>
const text = (node: any): string => typeof node === 'string' ? node : (node.children ?? []).map(text).join('')
const button = (label: string) => view!.root.findAllByType('button').find(n => text(n).includes(label))!
const feedback = () => view!.root.findAll(n => n.type === 'div' && n.props.className?.includes('pm-bento-validation'))
const deferred = () => {
  let resolve!: (value?: unknown) => void
  const promise = new Promise(ok => { resolve = ok })
  return { promise, resolve }
}
async function mount(projectId?: string) {
  expect(parseLayout(fixture)).toEqual(fixture)
  const data = { projects: [], tasks: [], milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [],
    dashboards: projectId ? { byProject: { [projectId]: fixture } } : { user: fixture } }
  await act(async () => { view = create(<BoardBento data={data as any}
    actions={{ refreshBoard: refresh, openRecord: vi.fn(), pickProject: vi.fn() } as any}
    persistence={{ onSave: save, onReset: reset }} projectId={projectId}/>) })
}
async function edit() {
  await act(async () => { button('布局编辑').props.onClick(); await vi.dynamicImportSettled() })
}
function expectFeedback(kind: 'success' | 'error', message: string) {
  expect(feedback()).toHaveLength(1)
  const node = feedback()[0]
  expect(text(node)).toContain(message)
  expect(node.props.role).toBe(kind === 'success' ? 'status' : 'alert')
  expect(node.props.className.includes('pm-bento-validation--success')).toBe(kind === 'success')
}
beforeEach(() => {
  bridge.props = null
  save = vi.fn().mockResolvedValue(undefined)
  reset = vi.fn().mockResolvedValue(undefined)
  refresh = vi.fn().mockResolvedValue(true)
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() })
  vi.stubGlobal('fetch', () => { throw new Error('组件反馈用例禁止网络') })
})
afterEach(() => {
  if (view) act(() => view!.unmount())
  view = undefined
  vi.unstubAllGlobals()
})

describe('看板父反馈真实组件回归', () => {
  it.each([undefined, 'project-feedback'])('保存成功反馈与实际scope %s', async projectId => {
    await mount(projectId); await edit()
    await act(async () => { await bridge.props.onSave('user', fixture) })
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(projectId ? `project:${projectId}` : 'user', fixture)
    expect(refresh).toHaveBeenCalledTimes(1)
    expectFeedback('success', '布局已保存并刷新。')
  })
  it('保存和刷新在途均不提前成功，刷新结束才改变反馈', async () => {
    const disk = deferred(), snapshot = deferred()
    save.mockReturnValue(disk.promise); refresh.mockReturnValue(snapshot.promise)
    await mount(); await edit()
    let request!: Promise<void>
    await act(async () => { request = bridge.props.onSave('user', fixture) })
    expect(feedback()).toHaveLength(0); expect(refresh).not.toHaveBeenCalled()
    await act(async () => { disk.resolve() })
    expect(feedback()).toHaveLength(0); expect(refresh).toHaveBeenCalledTimes(1)
    await act(async () => { snapshot.resolve(true); await request })
    expectFeedback('success', '布局已保存并刷新。')
  })
  it.each(['save', 'refresh', 'false'])('保存失败 %s 仍显示真实错误并重抛', async failure => {
    if (failure === 'save') save.mockRejectedValue(new Error('落盘拒绝'))
    else if (failure === 'refresh') refresh.mockRejectedValue(new Error('刷新拒绝'))
    else refresh.mockResolvedValue(false)
    await mount(); await edit()
    await act(async () => { await expect(bridge.props.onSave('user', fixture)).rejects.toThrow() })
    expectFeedback('error', '保存失败')
    expect(refresh).toHaveBeenCalledTimes(failure === 'save' ? 0 : 1)
  })
  it('重置成功后再次失败替换旧成功反馈，异常不被父组件吞掉', async () => {
    await mount(); await edit()
    await act(async () => { await bridge.props.onReset() })
    expectFeedback('success', '已恢复默认布局。')
    reset.mockRejectedValueOnce(new Error('重置拒绝'))
    await act(async () => { await expect(bridge.props.onReset()).rejects.toThrow('重置拒绝') })
    expectFeedback('error', '重置失败')
  })
  it.each([true, false])('补记追加反馈success=%s且关闭不写业务', async success => {
    refresh.mockResolvedValue(success)
    await mount()
    await act(async () => { button('添加补记队列').props.onClick() })
    expectFeedback(success ? 'success' : 'error', success ? '已添加补记队列' : '添加补记队列失败')
    const count = save.mock.calls.length
    act(() => view!.root.findByProps({ 'aria-label': '关闭' }).props.onClick())
    expect(feedback()).toHaveLength(0)
    expect(save).toHaveBeenCalledTimes(count)
  })
})
