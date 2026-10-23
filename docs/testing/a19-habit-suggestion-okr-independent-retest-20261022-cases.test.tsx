import { appendFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import { HabitsView, type HabitInboxSuggestion, type HabitsViewProps } from '../../packages/dsh-pm-tool/src/client/views/habits.js'

const states = ['pending', 'confirmed', 'ignored'] as const
const mounts: ReactTestRenderer[] = []
const text = (node: ReactTestInstance): string => node.children
  .map(child => typeof child === 'string' ? child : text(child)).join('')
const hasClass = (node: ReactTestInstance, name: string) =>
  typeof node.type === 'string' && String(node.props.className ?? '').split(' ').includes(name)
const make = (status: HabitInboxSuggestion['status'], okrId?: string): HabitInboxSuggestion => ({
  id: `independent-${status}`, projectId: 'project-a', at: '2026-10-22T00:00:00.000Z',
  title: 'Independent suggestion', rationale: 'Original rationale', status, okrId,
})
function mount(props: HabitsViewProps) {
  let renderer!: ReactTestRenderer
  act(() => { renderer = create(createElement(HabitsView, props)) })
  mounts.push(renderer)
  return renderer
}
function row(renderer: ReactTestRenderer, id: string) {
  const item = renderer.root.findAll(node => hasClass(node, 'pm-habit-suggestion'))
    .find(node => node.findAll(n => hasClass(n, 'pm-habit-suggestion-id')).some(n => text(n) === id))
  expect(item).toBeTruthy()
  return item!
}
function association(renderer: ReactTestRenderer, id: string) {
  const node = row(renderer, id).find(n => hasClass(n, 'pm-habit-suggestion-okr'))
  appendFileSync(process.env.HS_OBSERVATIONS!, `${JSON.stringify({ id, text: text(node) })}\n`)
  return node
}
const freeze = <T,>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
afterEach(() => {
  for (const renderer of mounts.splice(0)) act(() => renderer.unmount())
  vi.restoreAllMocks()
})

it.each(states)('IR-ID %s exact ID, not substring, index, habit or another suggestion', status => {
  const id = 'okr-target'
  const renderer = mount({
    projectId: 'project-a', inbox: [make(status, id),
      { ...make('pending', 'okr-target-extra'), id: 'other-suggestion' }],
    habits: [{ id: 'habit-decoy', projectId: 'project-a', title: 'Decoy habit',
      status: 'final', okrId: 'okr-target-extra', checkIns: [],
      streak: { current: 0, longest: 0, totalDays: 0 } }],
    okrs: [
      { id: 'okr-target-extra', title: 'Suffix decoy' },
      { id: 'prefix-okr-target', title: 'Prefix decoy' },
      { id, title: 'Exact title' },
    ],
  })
  expect(text(association(renderer, `independent-${status}`))).toBe(`关联 OKR：Exact title（${id}）`)
  expect(text(row(renderer, `independent-${status}`))).not.toMatch(/Suffix decoy|Prefix decoy|okr-target-extra/)
})

it.each(states)('IR-PROJECT %s full same-name refs and project switch keep exact ownership', status => {
  const run = vi.fn(async () => true), onSaved = vi.fn()
  const okrs = [
    { projectId: 'project-b', id: 'okr-a', title: 'Foreign ID collision' },
    { projectId: 'project-b', id: 'okr-b', title: 'Same name' },
    { projectId: 'project-a', id: 'okr-a-decoy', title: 'Same name' },
    { projectId: 'project-a', id: 'okr-a', title: 'Same name' },
  ]
  const inbox = [make(status, 'okr-a'),
    { ...make(status, 'okr-b'), id: 'suggestion-b', projectId: 'project-b' }]
  const props = freeze({ projectId: 'project-a', inbox, okrs, run, onSaved })
  const before = JSON.stringify(props)
  const renderer = mount(props)
  expect(text(association(renderer, `independent-${status}`))).toBe('关联 OKR：Same name（okr-a）')
  expect(text(row(renderer, `independent-${status}`))).not.toMatch(/Foreign ID collision|okr-a-decoy|okr-b/)
  act(() => renderer.update(createElement(HabitsView, {
    ...props, projectId: 'project-b', okrs: [...okrs].reverse(),
  })))
  expect(text(association(renderer, 'suggestion-b'))).toBe('关联 OKR：Same name（okr-b）')
  expect(renderer.root.findAll(n => hasClass(n, 'pm-habit-suggestion'))).toHaveLength(1)
  expect(JSON.stringify(props)).toBe(before)
  expect(run).not.toHaveBeenCalled()
  expect(onSaved).not.toHaveBeenCalled()
})

it.each(states)('IR-MISSING %s undefined, empty, foreign-only refs retain original ID', status => {
  const props: HabitsViewProps = {
    projectId: 'project-a', inbox: [make(status, 'okr-missing')],
    run: vi.fn(async () => true), onSaved: vi.fn(),
  }
  const renderer = mount(props)
  for (const okrs of [undefined, [], [
    { projectId: 'project-b', id: 'okr-missing', title: 'Foreign title' },
    { projectId: 'project-a', id: 'okr-existing', title: 'Other title' },
  ]]) {
    act(() => renderer.update(createElement(HabitsView, { ...props, okrs })))
    expect(text(association(renderer, `independent-${status}`))).toBe('关联 OKR：okr-missing')
    expect(text(row(renderer, `independent-${status}`))).not.toMatch(/Foreign title|Other title|未关联/)
  }
  expect(props.run).not.toHaveBeenCalled()
  expect(props.onSaved).not.toHaveBeenCalled()
})

it.each(states)('IR-NONE %s no association adds no target or action', status => {
  const run = vi.fn(async () => true), onSaved = vi.fn()
  const renderer = mount({ projectId: 'project-a', inbox: [make(status)],
    okrs: [{ id: 'okr-nearby', title: 'Nearby title' }], run, onSaved })
  const item = row(renderer, `independent-${status}`)
  expect(item.findAll(n => hasClass(n, 'pm-habit-suggestion-okr'))).toHaveLength(0)
  expect(text(item)).not.toMatch(/Nearby title|okr-nearby|关联 OKR/)
  expect(item.findAllByType('button').map(text)).toEqual(status === 'pending'
    ? ['采纳并建习惯草稿', '忽略'] : [])
  expect(run).not.toHaveBeenCalled()
  expect(onSaved).not.toHaveBeenCalled()
})

it.each(['confirm', 'ignore'] as const)('IR-ACTION %s exact parameters, false no refresh, processed remount', async action => {
  const run = vi.fn(async () => false), onSaved = vi.fn()
  const id = `hs-real-${action}-123`
  const pending = { ...make('pending', 'okr-retained'), id }
  const props: HabitsViewProps = { projectId: 'project-a', inbox: [pending], run, onSaved,
    okrs: [{ projectId: 'project-a', id: 'okr-retained', title: 'Before processing' }] }
  const renderer = mount(props)
  expect(run).not.toHaveBeenCalled()
  const index = action === 'confirm' ? 0 : 1
  await act(async () => row(renderer, id).findAllByType('button')[index].props.onClick())
  expect(run.mock.calls).toEqual([[`habit ${action} ${id}`]])
  expect(onSaved).not.toHaveBeenCalled()
  run.mockResolvedValueOnce(true)
  await act(async () => row(renderer, id).findAllByType('button')[index].props.onClick())
  expect(run.mock.calls).toEqual([[`habit ${action} ${id}`], [`habit ${action} ${id}`]])
  expect(onSaved).toHaveBeenCalledTimes(1)
  const processed = { ...pending, status: action === 'confirm' ? 'confirmed' as const : 'ignored' as const }
  const next: HabitsViewProps = { ...props, inbox: [processed],
    okrs: [{ projectId: 'project-a', id: 'okr-retained', title: 'Renamed after processing' }] }
  act(() => renderer.update(createElement(HabitsView, next)))
  expect(text(association(renderer, id))).toBe('关联 OKR：Renamed after processing（okr-retained）')
  expect(text(row(renderer, id))).toContain('Original rationale')
  expect(text(row(renderer, id))).not.toContain('Before processing')
  expect(row(renderer, id).findAllByType('button')).toHaveLength(0)
  act(() => renderer.unmount())
  const remounted = mount(next)
  expect(text(association(remounted, id))).toBe('关联 OKR：Renamed after processing（okr-retained）')
  expect(row(remounted, id).props['data-state']).toBe(processed.status)
  expect(row(remounted, id).findAllByType('button')).toHaveLength(0)
  expect(run).toHaveBeenCalledTimes(2)
  expect(onSaved).toHaveBeenCalledTimes(1)
})

it('IR-TEXT HTML-looking title stays literal renderer text, no new interaction or live role', () => {
  const title = '<script>alert("x")</script><img src=x onerror=alert(1)> & <a href="javascript:x">link</a>'
  const props: HabitsViewProps = { projectId: 'project-a', inbox: [make('ignored', 'okr-html')],
    okrs: [{ projectId: 'project-a', id: 'okr-html', title }] }
  const node = association(mount(props), 'independent-ignored')
  expect(node.type).toBe('p')
  expect(text(node)).toBe(`关联 OKR：${title}（okr-html）`)
  expect(node.props.role).toBeUndefined()
  expect(node.props['aria-live']).toBeUndefined()
  expect(node.findAll(n => n.props.dangerouslySetInnerHTML !== undefined)).toHaveLength(0)
  expect(node.findAll(n => ['a', 'script', 'img', 'button', 'input'].includes(String(n.type)))).toHaveLength(0)
  expect(node.children.every(child => typeof child === 'string')).toBe(true)
})
