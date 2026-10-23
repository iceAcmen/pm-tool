import { appendFileSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import { HabitsView, type HabitInboxSuggestion, type HabitsViewProps } from '../../packages/dsh-pm-tool/src/client/views/habits.js'
import { HabitForm } from '../../packages/dsh-pm-tool/src/client/views/habit-form.js'
import { RecordsListbox } from '../../packages/dsh-pm-tool/src/client/views/records/records-listbox.js'
import type { HabitFormValues } from '../../packages/dsh-pm-tool/src/client/form-validation.js'

const original = JSON.parse(readFileSync(process.env.HS_FIXTURE!, 'utf8'))
const states = ['pending', 'confirmed', 'ignored'] as const
const mounts: ReactTestRenderer[] = []
const text = (node: ReactTestInstance): string => node.children
  .map(child => typeof child === 'string' ? child : text(child)).join('')
const hasClass = (node: ReactTestInstance, name: string) =>
  typeof node.type === 'string' && String(node.props.className ?? '').split(' ').includes(name)
function observe(id: string, value: unknown) {
  appendFileSync(process.env.HS_OBSERVATIONS!, `${JSON.stringify({ id, value })}\n`)
}
function mount(props: HabitsViewProps) {
  let renderer!: ReactTestRenderer
  act(() => { renderer = create(createElement(HabitsView, props)) })
  mounts.push(renderer)
  return renderer
}
function row(renderer: ReactTestRenderer, id: string) {
  const result = renderer.root.findAll(node => hasClass(node, 'pm-habit-suggestion'))
    .find(node => node.findAll(n => hasClass(n, 'pm-habit-suggestion-id')).some(n => text(n) === id))
  expect(result, `suggestion ${id}`).toBeTruthy()
  return result!
}
function association(renderer: ReactTestRenderer, id: string, title: string | undefined, okrId: string) {
  const item = row(renderer, id), body = text(item)
  observe(id, { body, state: item.props['data-state'], expectedTitle: title, expectedOkrId: okrId })
  expect(body, `${id} 自身关联标签`).toContain('关联 OKR')
  if (title) expect(body, `${id} 自身真实目标标题`).toContain(title)
  expect(body, `${id} 自身原关联 ID`).toContain(okrId)
}
const suggestion = (status: HabitInboxSuggestion['status'], okrId?: string): HabitInboxSuggestion => ({
  id: `hs-${status}`, projectId: 'p-a', at: '2026-10-22T00:00:00.000Z',
  title: `建议${status}`, rationale: `理由${status}`, status, ...(okrId ? { okrId } : {}),
})
const refs = [
  { id: 'okr-a-1', title: '交付可核查目标一' },
  { id: 'okr-a-2', title: '项目复盘目标二' },
  { id: 'okr-a-3', title: '减少返工目标三' },
]
const decoyTitle = '仅既有习惯使用的目标'
const base = (inbox: HabitInboxSuggestion[]): HabitsViewProps => ({
  projectId: 'p-a', inbox, okrs: [...refs, { id: 'okr-decoy', title: decoyTitle }],
  habits: [{ id: 'habit-decoy', projectId: 'p-a', title: '不能借关联的既有习惯', okrId: 'okr-decoy',
    status: 'final', checkIns: [], streak: { current: 0, longest: 0, totalDays: 0 } }],
})
const deepFreeze = <T,>(value: T): T => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
afterEach(() => {
  for (const renderer of mounts.splice(0)) act(() => renderer.unmount())
  vi.restoreAllMocks()
})

it('HS-R01 原真实 pending 两建议各自显示目标标题与原 ID', () => {
  const snap = original.pending
  const props = { projectId: 'p-0001', habits: snap.habits, inbox: snap.habitInbox,
    okrs: snap.okrs.filter((o: { projectId: string }) => o.projectId === 'p-0001') }
  const renderer = mount(props)
  for (const s of snap.habitInbox) association(renderer, s.id, 'F5目标', s.okrId)
})
it.each([['HS-R02', 'confirmed'], ['HS-R03', 'ignored']] as const)('%s 原真实 %s 重进建议仍显示自身目标及 ID', (id, status) => {
  const snap = original.reentry
  const renderer = mount({ projectId: 'p-0001', habits: snap.habits, inbox: snap.habitInbox,
    okrs: snap.okrs.filter((o: { projectId: string }) => o.projectId === 'p-0001') })
  const s = snap.habitInbox.find((item: HabitInboxSuggestion) => item.status === status)
  observe(id, { suggestion: s })
  association(renderer, s.id, 'F5目标', s.okrId)
})
it.each(states)('HS-R04 %s 多建议不同目标，重排仍按自己的 ID 解析', status => {
  const inbox = states.map((s, index) => suggestion(s, refs[index].id))
  const renderer = mount(base(inbox))
  const index = states.indexOf(status)
  association(renderer, `hs-${status}`, refs[index].title, refs[index].id)
  act(() => renderer.update(createElement(HabitsView, { ...base(inbox), okrs: [...refs].reverse() })))
  association(renderer, `hs-${status}`, refs[index].title, refs[index].id)
  expect(text(row(renderer, `hs-${status}`))).not.toContain(decoyTitle)
  for (const other of refs.filter(r => r.id !== refs[index].id)) {
    expect(text(row(renderer, `hs-${status}`))).not.toContain(other.title)
    expect(text(row(renderer, `hs-${status}`))).not.toContain(other.id)
  }
})
it.each(states)('HS-R05 %s missing 旧 ID 诚实保留，不借有效习惯或别建议目标', status => {
  const renderer = mount(base([suggestion(status, 'okr-old-missing'),
    { ...suggestion('pending', 'okr-a-1'), id: 'hs-other-valid' }]))
  association(renderer, `hs-${status}`, undefined, 'okr-old-missing')
  const body = text(row(renderer, `hs-${status}`))
  expect(body).not.toContain(decoyTitle)
  expect(body).not.toContain(refs[0].title)
  expect(body).not.toContain('未关联')
})
it('HS-R06 注入清单 undefined 或空数组均保旧关联 ID', () => {
  const props = base([suggestion('pending', 'okr-old-missing')])
  const renderer = mount({ ...props, okrs: undefined })
  association(renderer, 'hs-pending', undefined, 'okr-old-missing')
  act(() => renderer.update(createElement(HabitsView, { ...props, okrs: [] })))
  association(renderer, 'hs-pending', undefined, 'okr-old-missing')
})
it('HS-R07 当前注入标题更新和重挂生效，关联 ID 不变，零命令', () => {
  const run = vi.fn(async () => true), onSaved = vi.fn()
  const props = { ...base([suggestion('confirmed', 'okr-a-1')]), run, onSaved }
  const renderer = mount(props)
  association(renderer, 'hs-confirmed', refs[0].title, 'okr-a-1')
  const next = { ...props, okrs: [{ id: 'okr-a-1', title: '当前快照更新标题' }] }
  act(() => renderer.update(createElement(HabitsView, next)))
  association(renderer, 'hs-confirmed', '当前快照更新标题', 'okr-a-1')
  expect(text(row(renderer, 'hs-confirmed'))).not.toContain(refs[0].title)
  act(() => renderer.unmount())
  association(mount(next), 'hs-confirmed', '当前快照更新标题', 'okr-a-1')
  expect(run).not.toHaveBeenCalled()
  expect(onSaved).not.toHaveBeenCalled()
})
it('HS-R08 panel 同项目注入边界下同名不同 ID 不误配，外项目旧 ID 不借同名标题', () => {
  const snapshot = [
    { projectId: 'p-b', id: 'okr-b-same', title: '同名目标' },
    { projectId: 'p-a', id: 'okr-a-same', title: '同名目标' },
    { projectId: 'p-a', id: 'okr-a-second', title: '同名目标' },
  ]
  const inbox = [suggestion('pending', 'okr-a-second'), suggestion('ignored', 'okr-b-same'),
    { ...suggestion('confirmed', 'okr-b-same'), id: 'hs-b', projectId: 'p-b' }]
  const props = { ...base(inbox), okrs: snapshot.filter(o => o.projectId === 'p-a') }
  const renderer = mount(props)
  association(renderer, 'hs-pending', '同名目标', 'okr-a-second')
  association(renderer, 'hs-ignored', undefined, 'okr-b-same')
  expect(text(row(renderer, 'hs-ignored'))).not.toContain('同名目标')
  expect(text(row(renderer, 'hs-pending'))).not.toContain('okr-a-same')
  act(() => renderer.update(createElement(HabitsView, { ...props, projectId: 'p-b',
    okrs: snapshot.filter(o => o.projectId === 'p-b') })))
  association(renderer, 'hs-b', '同名目标', 'okr-b-same')
})
it('HS-R09 长标题和标记外形按普通文本全文显示，ID可读，无新交互或innerHTML（非布局GUI）', () => {
  const title = `项目质量复盘${'长标题'.repeat(25)} <目标> & "保真"`
  const props = { ...base([suggestion('ignored', 'okr-long-target-1234567890')]),
    okrs: [{ id: 'okr-long-target-1234567890', title }] }
  const renderer = mount(props)
  association(renderer, 'hs-ignored', title, 'okr-long-target-1234567890')
  const item = row(renderer, 'hs-ignored')
  expect(item.findAll(node => node.props.dangerouslySetInnerHTML !== undefined)).toHaveLength(0)
  expect(item.findAllByType('a')).toHaveLength(0)
  expect(item.findAllByType('button')).toHaveLength(0)
  expect(item.findAllByType('input')).toHaveLength(0)
})
it.each(states)('HS-C01 %s 原理由/稳定 ID/状态/动作保留', status => {
  const renderer = mount(base([suggestion(status, 'okr-a-1')]))
  const item = row(renderer, `hs-${status}`)
  expect(item.type).toBe('li')
  expect(item.props['data-state']).toBe(status)
  expect(text(item)).toContain(`理由${status}`)
  expect(item.findAllByType('button').map(text)).toEqual(status === 'pending'
    ? ['采纳并建习惯草稿', '忽略'] : [])
  if (status !== 'pending') expect(text(item)).toContain(status === 'confirmed' ? '已采纳' : '已忽略')
})
it.each(states)('HS-C02 %s 无关联可省略或诚实显示，不借既有 habit 目标', status => {
  const renderer = mount(base([suggestion(status)]))
  const body = text(row(renderer, `hs-${status}`))
  observe(`HS-C02-${status}`, { body })
  expect(body).not.toContain(decoyTitle)
  expect(body).not.toContain('okr-decoy')
  for (const ref of refs) expect(body).not.toContain(ref.title)
  expect(body).not.toMatch(/按\s*OKR|已关联\s*\d|关联统计/)
  if (body.includes('关联 OKR')) expect(body).toMatch(/未关联|不关联/)
})
it('HS-C03 外项目建议过滤，跨项目同名旧引用不借当前目标', () => {
  const inbox = [suggestion('pending', 'okr-b-same'),
    { ...suggestion('ignored', 'okr-a-1'), id: 'hs-hidden', projectId: 'p-b' }]
  const renderer = mount({ ...base(inbox), okrs: [{ id: 'okr-a-same', title: '同名目标' }] })
  expect(renderer.root.findAll(node => hasClass(node, 'pm-habit-suggestion'))).toHaveLength(1)
  expect(text(row(renderer, 'hs-pending'))).not.toContain('同名目标')
  expect(text(renderer.root)).not.toContain('hs-hidden')
})
it('HS-C04 冻结props挂载/重排/重挂全文不变，零run/onSaved', () => {
  const run = vi.fn(async () => true), onSaved = vi.fn()
  const props = { ...base(states.map((s, i) => suggestion(s, refs[i].id))), run, onSaved }
  const before = JSON.stringify(props)
  deepFreeze(props)
  const renderer = mount(props)
  act(() => renderer.update(createElement(HabitsView, { ...props, inbox: [...props.inbox!].reverse() })))
  act(() => renderer.unmount())
  mount(props)
  expect(JSON.stringify(props)).toBe(before)
  expect(run).not.toHaveBeenCalled()
  expect(onSaved).not.toHaveBeenCalled()
})
it('HS-C05 原 pending confirm/ignore 参数和 true才刷新保持，processed无写按钮', async () => {
  const run = vi.fn(async () => true), onSaved = vi.fn()
  const props = { ...base([suggestion('pending', 'okr-a-1')]), run, onSaved }
  const renderer = mount(props)
  await act(async () => row(renderer, 'hs-pending').findAllByType('button')[0].props.onClick())
  expect(run).toHaveBeenLastCalledWith('habit confirm hs-pending')
  expect(onSaved).toHaveBeenCalledTimes(1)
  run.mockResolvedValueOnce(false)
  await act(async () => row(renderer, 'hs-pending').findAllByType('button')[1].props.onClick())
  expect(run).toHaveBeenLastCalledWith('habit ignore hs-pending')
  expect(onSaved).toHaveBeenCalledTimes(1)
  act(() => renderer.update(createElement(HabitsView, { ...props, inbox: [suggestion('confirmed', 'okr-a-1')] })))
  expect(row(renderer, 'hs-confirmed').findAllByType('button')).toHaveLength(0)
  expect(run).toHaveBeenCalledTimes(2)
})
it('HS-C06 真实 HabitForm / RecordsListbox 控制：原关联值、选空、主保存与取消保持', async () => {
  const initial: HabitFormValues = { title: '原习惯', goal: '保目标', frequency: '每天',
    notes: '保备注', okrId: 'okr-a-1' }
  const options = [{ value: '', label: '不关联' }, { value: 'okr-a-1', label: '原目标（okr-a-1）' }]
  const onSubmit = vi.fn(), onCancel = vi.fn()
  let renderer!: ReactTestRenderer
  act(() => { renderer = create(createElement(HabitForm, { initial, okrOptions: options,
    busy: false, disabled: false, onSubmit, onCancel })) })
  mounts.push(renderer)
  const listbox = renderer.root.findByType(RecordsListbox)
  expect(listbox.props.value).toBe('okr-a-1')
  expect(listbox.props.options).toEqual(options)
  expect(onSubmit).not.toHaveBeenCalled()
  act(() => listbox.props.onChange(''))
  expect(renderer.root.findByType(RecordsListbox).props.value).toBeNull()
  await act(async () => renderer.root.findAllByType('button').find(n => text(n) === '保存')!.props.onClick())
  expect(onSubmit).toHaveBeenCalledTimes(1)
  expect(onSubmit).toHaveBeenCalledWith({ ...initial, okrId: '' })
  act(() => renderer.root.findAllByType('button').find(n => text(n) === '取消')!.props.onClick())
  expect(onCancel).toHaveBeenCalledTimes(1)
  expect(initial.okrId).toBe('okr-a-1')
})
