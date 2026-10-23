import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import { HabitsView, type HabitInboxSuggestion, type HabitsViewProps } from './habits.js'

const mounts: ReactTestRenderer[] = []
const states = ['pending', 'confirmed', 'ignored'] as const
const text = (node: ReactTestInstance): string => node.children
  .map(child => typeof child === 'string' ? child : text(child)).join('')
const hasClass = (node: ReactTestInstance, name: string) =>
  typeof node.type === 'string' && String(node.props.className ?? '').split(' ').includes(name)
const suggestion = (status: HabitInboxSuggestion['status'], okrId?: string): HabitInboxSuggestion => ({
  id: `suggestion-${status}`, projectId: 'p-a', at: '2026-10-22T00:00:00.000Z',
  title: '建议正文', rationale: '原理由', status, okrId,
})
function mount(props: HabitsViewProps) {
  let renderer!: ReactTestRenderer
  act(() => { renderer = create(createElement(HabitsView, props)) })
  mounts.push(renderer)
  return renderer
}
const row = (renderer: ReactTestRenderer) =>
  renderer.root.find(node => hasClass(node, 'pm-habit-suggestion'))
afterEach(() => { for (const renderer of mounts.splice(0)) act(() => renderer.unmount()) })

it.each(states)('%s 明示项目的混合清单只取自身项目精确 ID，不取前置外项目同 ID', status => {
  const run = vi.fn(async () => true), onSaved = vi.fn()
  const props: HabitsViewProps = {
    projectId: 'p-a', inbox: [suggestion(status, 'okr-same-id')], run, onSaved,
    okrs: [
      { projectId: 'p-b', id: 'okr-same-id', title: '外项目误配标题' },
      { projectId: 'p-a', id: 'okr-decoy', title: '同名目标' },
      { projectId: 'p-a', id: 'okr-same-id', title: '同名目标' },
    ],
  }
  const before = JSON.stringify(props)
  const renderer = mount(props)
  const association = row(renderer).find(node => hasClass(node, 'pm-habit-suggestion-okr'))
  expect(text(association)).toBe('关联 OKR：同名目标（okr-same-id）')
  expect(text(row(renderer))).not.toContain('外项目误配标题')
  expect(text(row(renderer))).not.toContain('okr-decoy')
  act(() => renderer.update(createElement(HabitsView, { ...props, okrs: [...props.okrs!].reverse() })))
  expect(text(row(renderer))).toContain('关联 OKR：同名目标（okr-same-id）')
  expect(JSON.stringify(props)).toBe(before)
  expect(run).not.toHaveBeenCalled()
  expect(onSaved).not.toHaveBeenCalled()
})

it.each(states)('%s 只有外项目精确 ID 时仍保旧 ID，不借外项目或别建议标题', status => {
  const renderer = mount({
    projectId: 'p-a', inbox: [suggestion(status, 'okr-old')],
    okrs: [
      { projectId: 'p-b', id: 'okr-old', title: '不能借用的标题' },
      { projectId: 'p-a', id: 'okr-current', title: '当前别目标' },
    ],
  })
  const association = row(renderer).find(node => hasClass(node, 'pm-habit-suggestion-okr'))
  expect(text(association)).toBe('关联 OKR：okr-old')
  expect(text(row(renderer))).not.toMatch(/不能借用的标题|当前别目标|未关联/)
})

it.each(states)('%s 无关联仍省略整行，不发明目标或操作', status => {
  const renderer = mount({
    projectId: 'p-a', inbox: [suggestion(status)],
    okrs: [{ projectId: 'p-a', id: 'okr-a', title: '不能借用的目标' }],
  })
  expect(row(renderer).findAll(node => hasClass(node, 'pm-habit-suggestion-okr'))).toHaveLength(0)
  expect(text(row(renderer))).not.toContain('关联 OKR')
  expect(text(row(renderer))).toContain('原理由')
  expect(row(renderer).findAllByType('button')).toHaveLength(status === 'pending' ? 2 : 0)
})

it('旧的同项目最小 refs 无项目字段时保持兼容，标题恰为 ID 仍可辨', () => {
  const renderer = mount({
    projectId: 'p-a', inbox: [suggestion('confirmed', 'okr-plain')],
    okrs: [{ id: 'okr-plain', title: 'okr-plain' }],
  })
  expect(text(row(renderer))).toContain('关联 OKR：okr-plain')
})

it('长 ID/标记外形标题是普通块文本，局部可收缩换行不添加播报或交互（非 GUI）', () => {
  const id = `okr-${'x'.repeat(400)}`
  const title = `<script>目标 & "保真"</script>${'长目标'.repeat(80)}`
  const renderer = mount({
    projectId: 'p-a', inbox: [suggestion('ignored', id)],
    okrs: [{ projectId: 'p-a', id, title }],
  })
  const association = row(renderer).find(node => hasClass(node, 'pm-habit-suggestion-okr'))
  expect(association.type).toBe('p')
  expect(text(association)).toBe(`关联 OKR：${title}（${id}）`)
  expect(association.props.style).toMatchObject({ minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere' })
  expect(association.props.role).toBeUndefined()
  expect(association.props['aria-live']).toBeUndefined()
  expect(association.findAll(node => node.props.dangerouslySetInnerHTML !== undefined)).toHaveLength(0)
  expect(association.findAll(node => ['a', 'button', 'input', 'script'].includes(String(node.type)))).toHaveLength(0)
})
