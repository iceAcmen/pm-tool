import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PmPanel } from './panel.js'

// 真实PmPanel与ConfirmHost；只控制宿主返回，路径不会由浏览器文件名推断。
const snapshot = JSON.stringify({
  projects: [{ id: 'p-0001', name: '恢复反馈' }], tasks: [], milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [],
})
let view: ReactTestRenderer | undefined
let execute: ReturnType<typeof vi.fn>
beforeEach(async () => {
  const events = new EventTarget()
  vi.stubGlobal('window', {
    location: { hash: '', pathname: '/', search: '' },
    history: { replaceState: vi.fn() },
    matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
  })
  vi.stubGlobal('document', { activeElement: null })
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
  execute = vi.fn(async (line: string) => line === 'web snapshot' ? snapshot : '备份文件校验通过（演练，尚未恢复）')
  await act(async () => { view = create(createElement(PmPanel, { execute })) })
  act(() => button('更多').props.onClick())
})
afterEach(() => {
  if (view) act(() => view!.unmount())
  view = undefined
  vi.unstubAllGlobals()
})
function button(label: string) {
  return view!.root.findAllByType('button').find(node => node.children.includes(label))!
}
function path(value: string) {
  act(() => view!.root.findByProps({ id: 'pm-restore-path' }).props.onChange({ currentTarget: { value } }))
}

describe('网页本机路径恢复：真实入口、双确认、取消与错误', () => {
  it.each(['manifest 与元数据不符', '缺少字节 bundle', 'manifest 路径越界'])('命令组合错误%s只呈现一个场景前缀，保原因/输入且不确认', async reason => {
    const value = '/private/tmp/QA backup/backup.json'
    path(value)
    const raw = `备份/恢复失败：${reason}`
    execute.mockImplementation(async line => line === 'web snapshot' ? snapshot : Promise.reject(new Error(raw)))
    await act(async () => { await button('预检本机备份').props.onClick() })
    const collect = (node: any): string => typeof node === 'string' ? node : (node.children ?? []).map(collect).join('')
    const text = view!.root.findAllByProps({ role: 'alert' }).map(collect).join('\n')
    expect(text).toContain(raw)
    expect(text).not.toContain('恢复失败：备份/恢复失败')
    expect(view!.root.findByProps({ id: 'pm-restore-path' }).props.value).toBe(value)
    expect(execute.mock.calls).toHaveLength(2)
    expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(0)
  })

  it('完整长路径预检位于主内容纵向区，保留全部警告和输出', async () => {
    const value = `/private/tmp/${'完整长路径'.repeat(70)}/backup.json`
    const output = `预检通过\n${value}\n十三表和两个真实附件`
    execute.mockImplementation(async line => line === 'web snapshot' ? snapshot : output)
    path(value)
    await act(async () => { await button('预检本机备份').props.onClick() })
    const preview = view!.root.findByProps({ className: 'pm-restore-preview' })
    expect(preview.parent?.props.className).toBe('pm-main')
    expect(preview.findByProps({ className: 'pm-restore-preview-text' }).children).toEqual([output])
    expect(preview.findByProps({ className: 'pm-restore-preview-warning' }).children).toContain(value)
    expect(preview.findAllByType('button')).toHaveLength(2)
  })

  it('完整含空格/单引号路径仅演练，取消不发送confirm', async () => {
    path("/private/tmp/QA owner's backup/backup.json")
    await act(async () => { await button('预检本机备份').props.onClick() })
    expect(execute.mock.calls.map(([line]) => line)).toEqual([
      'web snapshot', `restore "/private/tmp/QA owner's backup/backup.json"`,
    ])
    expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(1)
    act(() => view!.root.findByProps({ className: 'pm-tool-button pm-restore-cancel' }).props.onClick())
    expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(0)
    expect(execute).toHaveBeenCalledTimes(2)
  })

  it('预检后第一次确认只开危险对话框，第二次明确确认才发送原路径并刷新', async () => {
    const value = '/private/tmp/QA backup/backup.json'
    path(value)
    await act(async () => { await button('预检本机备份').props.onClick() })
    let first!: Promise<void>
    act(() => { first = view!.root.findByProps({ className: 'pm-button pm-button-primary pm-restore-confirm' }).props.onClick() })
    expect(execute).toHaveBeenCalledTimes(2)
    const dialog = view!.root.findByProps({ role: 'dialog' })
    expect(dialog.findByProps({ className: 'pm-confirm-title' }).children).toEqual(['确认整体恢复？'])
    await act(async () => {
      dialog.findAllByType('button').find(node => node.children.includes('确认恢复'))!.props.onClick()
      await first
    })
    expect(execute.mock.calls.map(([line]) => line)).toEqual([
      'web snapshot', `restore "${value}"`, `restore "${value}" confirm`, 'web snapshot',
    ])
    expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(0)
  })

  it.each(['"/private/tmp/x" confirm', '/private/tmp/x\nconfirm'])('不支持的路径%s拒绝，不发业务命令', async value => {
    path(value)
    await act(async () => { await button('预检本机备份').props.onClick() })
    expect(execute).toHaveBeenCalledTimes(1)
    expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(0)
  })

  it('真实预检失败保输入且不显示确认成功态', async () => {
    const value = '/private/tmp/missing/backup.json'
    path(value)
    execute.mockImplementation(async line => line === 'web snapshot' ? snapshot : Promise.reject(new Error('附件字节缺失')))
    await act(async () => { await button('预检本机备份').props.onClick() })
    expect(view!.root.findByProps({ id: 'pm-restore-path' }).props.value).toBe(value)
    expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(0)
    expect(execute.mock.calls).toHaveLength(2)
  })
})
