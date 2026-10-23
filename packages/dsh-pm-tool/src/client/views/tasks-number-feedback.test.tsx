import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskTable } from './tasks.js'

const noop = () => {}
const tasks = [1, 2].map(n => ({
  id: `t-${n}`, projectId: 'p-number', parentId: null, code: String(n),
  title: `编号测试${n}`, description: '', assignee: '', status: 'todo',
  priority: 'P1', progress: 0, milestoneId: null,
}))
let mounted: ReactTestRenderer
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('window', {
    addEventListener: noop, removeEventListener: noop,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
  })
})
afterEach(() => {
  if (mounted) act(() => mounted.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function text(node: ReactTestInstance): string {
  return node.children.map(child => typeof child === 'string' ? child : text(child)).join('')
}

function render() {
  act(() => {
    mounted = create(createElement(TaskTable, {
      tasks, milestones: [], projectId: 'p-number', onCreate: noop, onEdit: noop,
      onGenWbs: noop, onSaved: noop, run: async () => true, execute: async () => '',
    }))
  })
}
function cell(id: string) {
  return mounted.root.findByProps({ 'data-pm-row': id }).findByProps({ className: 'pt-cell pt-code' })
}
function button(id: string) { return cell(id).findByType('button') }
async function copy(id: string) {
  await act(async () => { button(id).props.onClick({ stopPropagation: noop }) })
}

describe('GNHD-01 编号复制真实组件结构与计时契约（非GUI样式验收）', () => {
  it('成功反馈独立于62px按钮和图标，编号仍保留；1599ms不早清、1600ms复原', async () => {
    const writer = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: writer } })
    render()
    await copy('t-1')
    expect(text(button('t-1').findByProps({ className: 'pt-code-val' }))).toBe('1')
    const feedback = cell('t-1').findByProps({ role: 'status' })
    expect(text(feedback)).toBe('已复制')
    expect(feedback.parent).toBe(cell('t-1'))
    expect(feedback.findAllByType('svg')).toHaveLength(0)
    expect(writer.mock.calls).toEqual([['1']])
    expect(cell('t-2').findAllByProps({ role: 'status' })).toHaveLength(0)
    act(() => { vi.advanceTimersByTime(1599) })
    expect(text(cell('t-1').findByProps({ role: 'status' }))).toBe('已复制')
    act(() => { vi.advanceTimersByTime(1) })
    expect(cell('t-1').findAllByProps({ role: 'status' })).toHaveLength(0)
    expect(button('t-1').props['aria-label']).toBe('复制编号 1')
  })

  it.each(['denied', 'missing'])('失败%s显示全文并保可选原编号，无假成功，1600ms复原', async mode => {
    const writer = vi.fn().mockRejectedValue(new Error('Denied'))
    vi.stubGlobal('navigator', mode === 'missing' ? {} : { clipboard: { writeText: writer } })
    render()
    await copy('t-1')
    const value = button('t-1').findByProps({ className: 'pt-code-val' })
    expect(text(value)).toBe('1')
    const feedback = cell('t-1').findByProps({ role: 'status' })
    expect(text(feedback)).toBe('复制失败')
    expect(feedback.parent).toBe(cell('t-1'))
    expect(text(cell('t-1'))).not.toContain('已复制')
    expect(button('t-1').props.title).toContain('手动')
    act(() => { vi.advanceTimersByTime(1600) })
    expect(cell('t-1').findAllByProps({ role: 'status' })).toHaveLength(0)
    expect(text(value)).toBe('1')
  })

  it('第二行复制时第一行反馈清除，只向剪贴板交原编号；reset仍归属对应行', async () => {
    const writer = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: writer } })
    render()
    await copy('t-1')
    act(() => { vi.advanceTimersByTime(800) })
    await copy('t-2')
    expect(cell('t-1').findAllByProps({ role: 'status' })).toHaveLength(0)
    expect(text(cell('t-2').findByProps({ role: 'status' }))).toBe('已复制')
    expect(writer.mock.calls).toEqual([['1'], ['2']])
    act(() => { vi.advanceTimersByTime(1600) })
    expect(cell('t-2').findAllByProps({ role: 'status' })).toHaveLength(0)
  })

  it('反馈独立样式允许列内换行而非hidden/ellipsis；失败编号可选，固定62px列不拓宽', () => {
    const css = readFileSync(new URL('./tasks.css', import.meta.url), 'utf8')
    const rule = css.match(/\.pm-tasks-root \.pt-code-feedback\s*\{([^}]+)\}/)?.[1]
    expect(rule).toBeDefined()
    expect(rule).toContain('overflow-wrap: anywhere')
    expect(rule).toContain('white-space: normal')
    expect(rule).not.toMatch(/overflow:\s*hidden|text-overflow:\s*ellipsis/)
    expect(css).toMatch(/\.pt-code-btn\.failed \.pt-code-val\s*\{[^}]*user-select:\s*text/)
    expect(css).toContain('grid-template-columns: 22px 28px 62px')
  })
})
