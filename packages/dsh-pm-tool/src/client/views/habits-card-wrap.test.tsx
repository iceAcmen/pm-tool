import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, expect, it } from 'vitest'
import { HabitsView, type HabitsViewProps } from './habits.js'

const mounts: ReactTestRenderer[] = []
const text = (node: ReactTestInstance): string => node.children
  .map(child => typeof child === 'string' ? child : text(child)).join('')
const hasClass = (node: ReactTestInstance, name: string) =>
  typeof node.type === 'string' && String(node.props.className ?? '').split(' ').includes(name)

function mount(props: HabitsViewProps) {
  let renderer!: ReactTestRenderer
  act(() => { renderer = create(createElement(HabitsView, props)) })
  mounts.push(renderer)
  return renderer
}

afterEach(() => {
  for (const renderer of mounts.splice(0)) act(() => renderer.unmount())
})

it('旧习惯卡保留关联目标全文和声明，并用独立文本节点承载长内容', () => {
  const title = `交付目标-${'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.repeat(8)}`
  const renderer = mount({
    projectId: 'p-1',
    habits: [{
      id: 'habit-1', projectId: 'p-1', title: '每日复盘', status: 'confirmed',
      okrId: 'okr-1', checkIns: [], streak: { current: 0, longest: 0, totalDays: 0 },
      createdAt: '2026-10-22T00:00:00.000Z',
    }],
    okrs: [{ id: 'okr-1', title }],
  })
  const badge = renderer.root.find(node => hasClass(node, 'pm-habit-okr'))
  const content = badge.find(node => hasClass(node, 'pm-habit-okr-text'))

  expect(text(content)).toBe(`关联 OKR：${title}（只展示，不参与裁决）`)
  expect(text(content)).not.toContain('okr-1')
  expect(badge.findByType('svg').props).toMatchObject({ width: 11, height: 11 })
  expect(badge.findAllByType('button')).toHaveLength(0)
  expect(badge.findAllByType('a')).toHaveLength(0)
})

it('旧习惯卡换行约束局限在关联 badge、文本和装饰图标', () => {
  const css = readFileSync(new URL('../panel.css', import.meta.url), 'utf8')
  const badgeRule = css.match(/\.pm-habit-okr\s*\{([^}]*)\}/)?.[1] ?? ''
  const iconRule = css.match(/\.pm-habit-okr\s*>\s*svg\s*\{([^}]*)\}/)?.[1] ?? ''
  const textRule = css.match(/\.pm-habit-okr-text\s*\{([^}]*)\}/)?.[1] ?? ''

  expect(badgeRule).toMatch(/max-width:\s*100%/)
  expect(badgeRule).toMatch(/min-width:\s*0/)
  expect(badgeRule).toMatch(/overflow-wrap:\s*anywhere/)
  expect(badgeRule).toMatch(/white-space:\s*normal/)
  expect(badgeRule).not.toMatch(/overflow:\s*(?:hidden|clip)|text-overflow:\s*ellipsis/)
  expect(iconRule).toMatch(/flex:\s*0\s+0\s+auto/)
  expect(textRule).toMatch(/min-width:\s*0/)
  expect(textRule).toMatch(/overflow-wrap:\s*anywhere/)
})
