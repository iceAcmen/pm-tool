import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RecordsMeetingForm } from './records-meeting-form.js'
import { RecordsListbox } from './records-listbox.js'
import { addProject } from '../../../core/projects.js'
import { addMeeting, addMeetingAction, getMeeting } from '../../../core/meetings.js'
import type { PmDomain } from '../../../core/storage.js'
import type { MeetingCallbacks } from '../../shared/records-props.js'

// 使用既有 Vite 的 CSS parser，不新增依赖；这是源码布局合同，不执行浏览器布局。
const require = createRequire(import.meta.url)
const viteRequire = createRequire(createRequire(require.resolve('vitest/package.json')).resolve('vite'))
interface CssNode {
  type: string
  selector?: string
  name?: string
  params?: string
  prop?: string
  value?: string
  nodes?: CssNode[]
}
const css = readFileSync(new URL('../records.css', import.meta.url), 'utf8')
const stylesheet = (viteRequire('postcss') as { parse: (source: string) => CssNode }).parse(css)
function rule(selector: string, nodes = stylesheet.nodes ?? []): CssNode {
  const found = nodes.find(node => node.type === 'rule' && node.selector === selector)
  expect(found, `缺少布局规则 ${selector}`).toBeDefined()
  return found!
}
const declarations = (node: CssNode) => Object.fromEntries(
  (node.nodes ?? []).filter(child => child.type === 'decl').map(child => [child.prop, child.value]),
)
const noop = () => {}
const mounts: ReactTestRenderer[] = []
const text = (node: ReactTestInstance): string => node.children.map(child =>
  typeof child === 'string' ? child : text(child)).join('')

async function mountActions(count: number) {
  const tables = new Map<string, Map<string, unknown>>()
  const domain = { table(name: string) {
    if (!tables.has(name)) tables.set(name, new Map())
    const table = tables.get(name)!
    return { get: (id: string) => table.get(id), put: (id: string, value: unknown) => table.set(id, value),
      entries: () => table.entries(), keys: () => table.keys(), list: () => [...table.values()],
      delete: (id: string) => table.delete(id) }
  } } as unknown as PmDomain
  const project = await addProject(domain, { name: 'A11 布局合同', startDate: '2026-10-21', targetDate: '2026-12-31' })
  const meeting = await addMeeting(domain, { projectId: project.id, title: '布局会议', meetingDate: '2026-10-21' })
  for (const title of ['失败待重试一', '第二行动项'].slice(0, count)) {
    await addMeetingAction(domain, meeting.id, { title, owner: '负责人', dueDate: '2026-10-28' })
  }
  const saved = getMeeting(domain, meeting.id)!
  const callbacks: MeetingCallbacks = {
    onSaveMeeting: vi.fn(async () => true), onDeleteMeeting: vi.fn(async () => true),
    onSaveAction: vi.fn(async () => true), onPromoteAction: vi.fn(async () => true),
    onDeleteAction: vi.fn(async () => true), onSaved: vi.fn(),
  }
  let renderer!: ReactTestRenderer
  act(() => { renderer = create(createElement(RecordsMeetingForm, {
    projectId: project.id, meeting: saved, callbacks, onCancel: noop,
  })) })
  mounts.push(renderer)
  return { renderer, saved, callbacks }
}

afterEach(() => {
  for (const renderer of mounts.splice(0)) act(() => renderer.unmount())
})

describe('A10-MGUI-F01 真实 RecordsMeetingForm 布局合同（非 GUI）', () => {
  it.each([0, 1, 2])('已存 %i 行：独立全宽容器承载每行及末尾添加动作，保留完整控件', async count => {
    const { renderer, saved, callbacks } = await mountActions(count)
    const container = renderer.root.findAllByProps({ className: 'rb-meeting-actions' })
    expect(container).toHaveLength(1)
    expect(container[0].parent?.props.className).toBe('pm-form-section-grid')
    const rows = renderer.root.findAllByProps({ className: 'rb-action-row' })
    expect(rows).toHaveLength(count)
    expect(container[0].children).toHaveLength(count + 1)
    rows.forEach((row, index) => {
      expect(row.parent).toBe(container[0])
      expect(row.props['data-action-id']).toBe(saved.actions[index].id)
      const title = row.findByProps({ 'aria-label': '行动项标题' })
      expect(title.props.value).toBe(saved.actions[index].title)
      expect(title.parent?.props.className).toBe('pm-field rb-action-title')
      for (const label of ['负责人', '截止', '关联任务', '关联问题']) {
        expect(row.findByProps({ 'aria-label': label }).parent?.type).toBe('label')
      }
      expect(row.findByType(RecordsListbox).props.id).toBe(`action-status-${saved.actions[index].id}`)
      const commands = row.findByProps({ className: 'rb-action-commands' })
      expect(commands.findAllByType('button').map(text)).toEqual(['保存', '转任务', '删除'])
    })
    const add = container[0].children.at(-1) as ReactTestInstance
    expect(add.type).toBe('button')
    expect(text(add)).toBe('添加行动项')
    expect(renderer.root.findAllByType('button').filter(node => text(node) === '保存会议')).toHaveLength(1)
    expect(renderer.root.findAllByType('button').filter(node => text(node) === '取消')).toHaveLength(1)
    expect(callbacks.onSaveAction).not.toHaveBeenCalled()
    expect(callbacks.onSaveMeeting).not.toHaveBeenCalled()
  })

  it('空会议添加 0→1→2 草稿仍在同一容器末尾，各行标题不共占一个父栅格单元', async () => {
    const { renderer, callbacks } = await mountActions(0)
    for (const count of [1, 2]) {
      const add = renderer.root.findAllByType('button').find(node => text(node) === '添加行动项')!
      act(() => add.props.onClick())
      const container = renderer.root.findAllByProps({ className: 'rb-meeting-actions' })
      expect(container).toHaveLength(1)
      const rows = renderer.root.findAllByProps({ className: 'rb-action-row' })
      expect(rows).toHaveLength(count)
      expect(rows.every(row => row.parent === container[0])).toBe(true)
      expect(rows.map(row => row.findByType(RecordsListbox).props.id)).toEqual(
        count === 1 ? ['action-status-new-0'] : ['action-status-new-0', 'action-status-new-1'],
      )
      expect(rows.at(-1)!.findByProps({ className: 'rb-action-commands' }).findAllByType('button').map(text)).toEqual(['保存'])
      expect(text(container[0].children.at(-1) as ReactTestInstance)).toBe('添加行动项')
    }
    expect(callbacks.onSaveAction).not.toHaveBeenCalled()
    expect(callbacks.onSaveMeeting).not.toHaveBeenCalled()
  })

  it('专属容器与每行占全宽，标题/关联/行操作独立全宽，控件可收缩且不隐藏内容', () => {
    expect(declarations(rule('.rb-meeting-actions'))).toMatchObject({
      'grid-column': '1 / -1', display: 'grid', 'grid-template-columns': 'minmax(0, 1fr)',
      'min-width': '0', 'container-type': 'inline-size', 'container-name': 'rb-meeting-actions',
    })
    expect(declarations(rule('.rb-action-row'))).toMatchObject({
      'grid-column': '1 / -1', display: 'grid', 'grid-template-columns': 'minmax(0, 1fr)', 'min-width': '0',
    })
    expect(declarations(rule('.rb-action-title, .rb-action-links, .rb-action-commands, .rb-action-row > [role="status"]')))
      .toMatchObject({ 'grid-column': '1 / -1', 'min-width': '0' })
    expect(declarations(rule('.rb-action-row input, .rb-action-row select, .rb-action-row .rb-lb')))
      .toMatchObject({ 'min-width': '0', width: '100%', 'max-width': '100%', 'box-sizing': 'border-box' })
    expect(declarations(rule('.rb-action-commands'))).toMatchObject({ display: 'flex', 'flex-wrap': 'wrap' })
    expect(declarations(rule('.rb-action-row .rb-lb-value')))
      .toMatchObject({ overflow: 'visible', 'white-space': 'normal', 'overflow-wrap': 'anywhere' })
    const actionRules = (stylesheet.nodes ?? []).filter(node => node.selector?.includes('.rb-action')
      || node.selector?.includes('.rb-meeting-actions'))
    expect(actionRules.flatMap(node => node.nodes ?? []).some(node =>
      node.prop === 'overflow' && ['hidden', 'clip'].includes(node.value ?? ''))).toBe(false)
  })

  it('多列增强由行动项容器实际宽度触发，不依赖 viewport media query', () => {
    const containers = (stylesheet.nodes ?? []).filter(node => node.type === 'atrule' && node.name === 'container')
    const medium = containers.find(node => node.params === 'rb-meeting-actions (min-width: 24rem)')
    const wide = containers.find(node => node.params === 'rb-meeting-actions (min-width: 30rem)')
    expect(medium).toBeDefined()
    expect(wide).toBeDefined()
    expect(declarations(rule('.rb-action-row, .rb-action-links', medium!.nodes)))
      .toMatchObject({ 'grid-template-columns': 'repeat(2, minmax(0, 1fr))' })
    expect(declarations(rule('.rb-action-row', wide!.nodes)))
      .toMatchObject({ 'grid-template-columns': 'repeat(3, minmax(0, 1fr))' })
    const media = (stylesheet.nodes ?? []).filter(node => node.type === 'atrule' && node.name === 'media')
    expect(media.flatMap(node => node.nodes ?? []).some(node => node.selector?.includes('.rb-action'))).toBe(false)
  })
})
