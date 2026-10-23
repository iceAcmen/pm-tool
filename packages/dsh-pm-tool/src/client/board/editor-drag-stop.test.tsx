import React from 'react'
import { readFileSync } from 'node:fs'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import RGL, { type Layout } from 'react-grid-layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BoardEditor, type BoardEditorProps } from './editor.js'
import * as projection from './projection.js'
import { parseLayout } from './persist.js'
import type { DashboardLayout, WidgetInstance } from './types.js'

// 专家原附件只读；不改尺寸、ID 或 config。这里只模拟测宽设施，不替换 RGL。
const fixture = JSON.parse(readFileSync(new URL('../../../../../docs/testing/board-fixture-clarification-20261021-fixture.json', import.meta.url), 'utf8')) as DashboardLayout
type GridInstance = React.Component & {
  state: { layout: Layout[], activeDrag: Layout | null }
  onDragStart: (i: string, x: number, y: number, event: unknown) => void
  onDrag: (i: string, x: number, y: number, event: unknown) => void
  onDragStop: (i: string, x: number, y: number, event: unknown) => void
  onResizeStart: (i: string, w: number, h: number, event: unknown) => void
  onResize: (i: string, w: number, h: number, event: unknown) => void
  onResizeStop: (i: string, w: number, h: number, event: unknown) => void
}
let mounted: ReactTestRenderer | undefined
let width = 960
let measure: () => void
let raf: () => void
let rendered: WidgetInstance[] = []
const event = { e: {}, node: {}, handle: 'se' }

beforeEach(() => {
  width = 960
  rendered = []
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() })
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => { raf = cb; return 1 })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('ResizeObserver', class {
    constructor(cb: () => void) { measure = cb }
    observe() {}
    disconnect() {}
  })
})
afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
  vi.unstubAllGlobals()
})

function mount(initialLayout = fixture) {
  expect(parseLayout(initialLayout)).toEqual(initialLayout)
  const props: BoardEditorProps = {
    initialLayout, data: { projects: [] } as unknown as BoardEditorProps['data'],
    actions: {} as BoardEditorProps['actions'], catalog: [], fieldWhitelist: {},
    grid: { cols: 12, rowHeight: 36, margin: [12, 12] },
    projection, parseLayout,
    renderCard: w => {
      const index = rendered.findIndex(item => item.i === w.i)
      if (index === -1) rendered.push(w)
      else rendered[index] = w
      return <span>{w.i}</span>
    },
    onTrial: () => '', onImportText: () => ({ ok: true, layout: initialLayout }),
    onExit: vi.fn(), onSave: vi.fn(), onReset: vi.fn(),
  }
  const document = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
  act(() => {
    mounted = create(<BoardEditor {...props}/>, {
      createNodeMock: () => ({
        get clientWidth() { return width },
        nodeType: 1, ownerDocument: document,
        addEventListener: vi.fn(), removeEventListener: vi.fn(),
      }),
    })
  })
  act(() => raf())
  return props
}

function grid(): GridInstance {
  // 包装类也保留真实 RGL 原型，不能用替代模型冒充其状态机。
  return mounted!.root.findAll(node => node.instance instanceof RGL)[0].instance as GridInstance
}
function canonical() { return structuredClone(rendered) }
function positions(items: Array<Layout | WidgetInstance['layout']>) {
  return items.map(({ i, x, y, w, h, minW, minH }) => ({ i, x, y, w, h, minW, minH }))
}
function assertStable() {
  const draft = canonical()
  expect(positions(grid().state.layout)).toEqual(positions(draft.map(w => w.layout)))
  expect(projection.findCanonicalCollisions(draft)).toEqual([])
  const bottom = Math.max(...draft.map(w => w.layout.y + w.layout.h))
  const host = mounted!.root.findAll(node => node.type === 'div' && node.props.className === 'react-grid-layout pm-rgl')[0]
  expect(host.props.style.height).toBe(`${bottom * 48 + 12}px`)
  const colWidth = (width - 12 * 13) / 12
  for (const w of draft) {
    const card = mounted!.root.findAll(node => node.type === 'div' && node.props['data-widget-id'] === w.i)[0]
    expect(card.props.style).toMatchObject({
      transform: `translate(${Math.round(w.layout.x * (colWidth + 12) + 12)}px,${w.layout.y * 48 + 12}px)`,
      width: `${Math.round(colWidth * w.layout.w + 12 * (w.layout.w - 1))}px`,
      height: `${w.layout.h * 48 - 12}px`,
    })
  }
  // 额外空闲渲染/测宽后仍必须一致，不只观察 stop 回调瞬间。
  act(() => measure())
  expect(positions(grid().state.layout)).toEqual(positions(draft.map(w => w.layout)))
}
function undoButton() {
  return mounted!.root.findAllByType('button').find(node => node.props.title === '撤销上一步（最多 20 步）')!
}
function undo() { act(() => undoButton().props.onClick()) }
function button(label: string) {
  return mounted!.root.findAllByType('button').find(node => node.children.includes(label))!
}
function drag(id: string, targetY: number) {
  const start = grid().state.layout.find(w => w.i === id)!
  const x = start.x
  const startY = start.y
  act(() => grid().onDragStart(id, x, startY, event))
  const step = targetY >= startY ? 1 : -1
  for (let y = startY + step; step > 0 ? y <= targetY : y >= targetY; y += step) {
    act(() => grid().onDrag(id, x, y, event))
  }
  const drop = structuredClone(grid().state.layout)
  act(() => grid().onDragStop(id, x, targetY, event))
  return drop
}
function resize(id: string, height: number) {
  const item = grid().state.layout.find(w => w.i === id)!
  act(() => grid().onResizeStart(id, item.w, item.h, event))
  const start = item.h
  const step = height >= start ? 1 : -1
  for (let h = start + step; step > 0 ? h <= height : h >= height; h += step) {
    act(() => grid().onResize(id, item.w, h, event))
  }
  act(() => grid().onResizeStop(id, item.w, height, event))
}

describe('FW-T01/T02 真实 BoardEditor + RGL 多帧显式提交', () => {
  it('六全宽卡 A 逐行到 D 后，不让邻卡逃至其下，稳定显示等于草稿', () => {
    mount()
    const drop = drag('w-hero', 12)
    const a = drop.find(w => w.i === 'w-hero')!
    const d = drop.find(w => w.i === 'w-obj')!
    expect(a.y).toBeGreaterThanOrEqual(d.y + d.h)
    const draft = canonical()
    expect(draft.find(w => w.i === a.i)!.layout.y).toBeGreaterThanOrEqual(draft.find(w => w.i === d.i)!.layout.y + d.h)
    expect(Math.min(...draft.map(w => w.layout.y))).toBe(0)
    expect(draft.map(({ layout, ...w }) => ({ ...w, layout: { ...layout, y: 0 } })))
      .toEqual(fixture.widgets.map(({ layout, ...w }) => ({ ...w, layout: { ...layout, y: 0 } })))
    assertStable()
    expect(undoButton().props.disabled).toBe(false)
    undo()
    expect(canonical()).toEqual(fixture.widgets)
    expect(undoButton().props.disabled).toBe(true)
    assertStable()
  })

  it('两卡最小碰撞链逐帧拖动后保留 B 在 A 前面', () => {
    mount({ ...fixture, widgets: fixture.widgets.slice(0, 2) })
    drag('w-hero', 12)
    expect(canonical().find(w => w.i === 'w-ms-deliver')!.layout.y).toBe(0)
    expect(canonical().find(w => w.i === 'w-hero')!.layout.y).toBe(2)
    assertStable()
  })

  it.each([true, false])('缩放内部先变高后提交，归一草稿与旧 props 同值=%s 仍同步高度', sameValue => {
    mount()
    const before = canonical()
    // 合法高度内来回缩放 A，使其他卡已被真实 RGL 碰撞下推。
    const item = grid().state.layout.find(w => w.i === 'w-hero')!
    act(() => grid().onResizeStart(item.i, item.w, item.h, event))
    act(() => grid().onResize(item.i, item.w, 7, event))
    if (sameValue) {
      act(() => grid().onResize(item.i, item.w, 6, event))
      expect(grid().state.layout.some(w => w.i === 'w-ms-deliver' && w.y > 6)).toBe(true)
    }
    act(() => grid().onResizeStop(item.i, item.w, sameValue ? 6 : 7, event))
    expect(canonical()).toEqual(sameValue ? before : before.map(w => ({
      ...w, layout: { ...w.layout, y: w.i === 'w-hero' ? 0 : w.layout.y + 1, h: w.i === 'w-hero' ? 7 : w.layout.h },
    })))
    assertStable()
    undo()
    expect(canonical()).toEqual(before)
    expect(undoButton().props.disabled).toBe(true)
    assertStable()
  })
})

describe('FW-T03 显式历史与被动宽度/面板保护', () => {
  it('三次多帧拖动各只入一次历史，逆序三撤销恢复且末态 disabled', () => {
    mount()
    const states = [canonical()]
    drag('w-hero', 12); states.push(canonical()); assertStable()
    drag('w-ms-deliver', 5); states.push(canonical()); assertStable()
    drag('w-hero', 0); assertStable()
    for (const state of states.reverse()) {
      undo()
      expect(canonical()).toEqual(state)
      assertStable()
    }
    expect(undoButton().props.disabled).toBe(true)
  })

  it('拖动/缩放三动作三撤销，面板与 ResizeObserver 不改草稿或历史', () => {
    const props = mount()
    const states = [canonical()]
    drag('w-hero', 12); states.push(canonical())
    resize('w-hero', 7); states.push(canonical())
    resize('w-risk', 4)
    assertStable()
    const beforePassive = canonical()
    const instance = grid()
    act(() => button('＋ 卡片库').props.onClick())
    width = 640
    act(() => measure())
    assertStable()
    act(() => button('× 卡片库').props.onClick())
    const hero = mounted!.root.findAll(node => node.type === 'div' && node.props['data-widget-id'] === 'w-hero')[0]
    act(() => hero.props.onClick({ stopPropagation() {} }))
    width = 720
    act(() => measure())
    assertStable()
    act(() => mounted!.root.findByProps({ className: 'pm-cfg-x' }).props.onClick())
    width = 960
    act(() => measure())
    expect(grid()).toBe(instance)
    expect(canonical()).toEqual(beforePassive)
    expect(props.onSave).not.toHaveBeenCalled()
    expect(props.onReset).not.toHaveBeenCalled()
    for (const state of states.reverse()) {
      undo()
      expect(canonical()).toEqual(state)
      assertStable()
    }
    expect(undoButton().props.disabled).toBe(true)
  })

  it('合法含空洞布局挂载及被动测宽不自动排版、不入历史', () => {
    const layout = structuredClone(fixture)
    layout.widgets.forEach(w => { w.layout.y += 3 })
    mount(layout)
    expect(canonical()).toEqual(layout.widgets)
    assertStable()
    width = 600
    act(() => measure())
    expect(canonical()).toEqual(layout.widgets)
    assertStable()
    expect(undoButton().props.disabled).toBe(true)
  })
})
