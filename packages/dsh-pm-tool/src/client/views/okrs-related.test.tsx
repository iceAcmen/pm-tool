import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildOkrTree, type OkrViewRecord } from './okr-model.js'
import type { OkrsViewProps } from './okrs.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node',
  'Event', 'MouseEvent', 'MutationObserver']) {
  vi.stubGlobal(key, key === 'window' ? dom.window : (dom.window as any)[key])
}
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const { createRoot } = await import('react-dom/client')
const { OkrsView } = await import('./okrs.js')

let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement
let observations: unknown[]
let caseName: string
let sequence = 0
const callbacks = {
  run: vi.fn(async () => true), onSaved: vi.fn(), onCreate: vi.fn(), onEdit: vi.fn(),
}
const fetchGuard = vi.fn(async () => { throw new Error('只读 OKR 呈现不得发网络请求') })

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
function fixture(status: OkrViewRecord['status'] = 'draft'): OkrViewRecord[] {
  return freeze([
    { id: 'okr-a', projectId: 'p-a', title: '主目标 A', kind: 'objective',
      primaryOkrId: null, relatedOkrIds: [], status: 'confirmed' },
    { id: 'okr-b', projectId: 'p-a', title: '第二目标 B', kind: 'objective',
      primaryOkrId: null, relatedOkrIds: [], status: 'draft' },
    { id: 'kr-a', projectId: 'p-a', title: '原合法 KR', kind: 'key-result',
      primaryOkrId: 'okr-a', relatedOkrIds: ['okr-b'], status },
  ] as OkrViewRecord[])
}
function observe(label: string, okrs?: OkrViewRecord[]) {
  observations.push({ label, html: container.innerHTML, okrs,
    rows: [...container.querySelectorAll('.pm-okr-related-row')].map(row => ({
      text: row.textContent, krTitle: row.closest('.pm-okr-kr')?.querySelector('.pm-okr-kr-title')?.textContent ?? null,
    })),
    calls: Object.fromEntries(Object.entries(callbacks).map(([key, fn]) => [key, fn.mock.calls])),
    fetchCalls: fetchGuard.mock.calls,
  })
}
async function render(okrs: OkrViewRecord[], extra: Partial<OkrsViewProps> = {}) {
  await act(async () => {
    root ??= createRoot(container)
    root.render(<OkrsView projectId="p-a" okrs={okrs} {...callbacks} {...extra}/>)
  })
  observe('render', okrs)
}
function krNode(title = '原合法 KR') {
  const node = [...container.querySelectorAll<HTMLElement>('.pm-okr-kr')]
    .find(n => n.querySelector('.pm-okr-kr-title')?.textContent === title)
  expect(node, `真实 KR 节点 ${title}`).toBeDefined()
  return node!
}
function roots() {
  return [...container.querySelectorAll<HTMLElement>('.pm-okr-node')]
}
function primaryInvariant(okrs: OkrViewRecord[]) {
  expect(roots().map(n => n.querySelector('.pm-okr-title')?.textContent)).toEqual(['主目标 A', '第二目标 B'])
  expect([...roots()[0].querySelectorAll('.pm-okr-kr-title')].map(n => n.textContent)).toEqual(['原合法 KR'])
  expect(roots()[1].querySelectorAll('.pm-okr-kr')).toHaveLength(0)
  expect(krNode().querySelector('.pm-okr-own-note')?.textContent).toBe('主归属：主目标 A')
  const tree = buildOkrTree(okrs, 'p-a')
  expect(tree.roots.find(n => n.record.id === 'okr-a')!.children.map(n => n.record.id)).toEqual(['kr-a'])
  expect(tree.roots.find(n => n.record.id === 'okr-b')!.children).toEqual([])
  expect(okrs.find(n => n.id === 'kr-a')!.primaryOkrId).toBe('okr-a')
}
function association(node = krNode(), title = '第二目标 B', id = 'okr-b') {
  const rows = node.querySelectorAll('.pm-okr-related-row')
  expect(rows, 'KR 必须邻接展示自己声明的关联，不能借父 root 的行').toHaveLength(1)
  expect(rows[0].textContent).toBe(`关联：${title}（${id} · 只展示，不参与权重）`)
  expect(rows[0].closest('.pm-okr-kr')).toBe(node)
}
function zeroWrite() {
  for (const fn of Object.values(callbacks)) expect(fn).not.toHaveBeenCalled()
  expect(fetchGuard).not.toHaveBeenCalled()
}
beforeEach(ctx => {
  observations = []
  caseName = `${++sequence}-${ctx.task.name.split(' ')[0]}`
  for (const fn of Object.values(callbacks)) fn.mockClear()
  fetchGuard.mockClear()
  vi.stubGlobal('fetch', fetchGuard)
  container = document.createElement('div')
  document.body.appendChild(container)
})
afterEach(async () => {
  observe('before-unmount')
  if (root) await act(async () => { root!.unmount(); root = undefined })
  const output = process.env.P2004_DOM_EVIDENCE
  if (output) {
    mkdirSync(output, { recursive: true })
    writeFileSync(join(output, `${caseName}.json`), JSON.stringify({
      reactVersion: React.version, observations,
      boundary: '真实 OkrsView/React DOM；无 GUI 布局、RPC、持久化或独立 PASS。',
    }, null, 2), { flag: 'wx' })
  }
  container.remove()
})

describe('P2OKR-R1-01 KR 自有软关联只读呈现', () => {
  it.each(['draft', 'confirmed'] as const)('%s A+第二B+KR 的关联标题/标记邻KR且只呈一次', async status => {
    const okrs = fixture(status)
    const before = JSON.stringify(okrs)
    await render(okrs)
    primaryInvariant(okrs)
    expect(krNode().querySelector('.pm-okr-status')?.textContent).toBe(status === 'draft' ? '草稿' : '已定稿')
    association()
    expect(container.querySelectorAll('.pm-okr-related-row')).toHaveLength(1)
    expect(JSON.stringify(okrs)).toBe(before)
    zeroWrite()
  })

  it('RERENDER 清空消失、恢复再现，主父/主children/状态/输入不变且零写', async () => {
    const original = fixture('confirmed')
    const cleared = freeze(original.map(o => o.id === 'kr-a' ? { ...o, relatedOkrIds: [] } : o))
    const before = [JSON.stringify(original), JSON.stringify(cleared)]
    await render(original)
    primaryInvariant(original)
    association()
    await render(cleared)
    primaryInvariant(cleared)
    expect(krNode().querySelector('.pm-okr-status')?.textContent).toBe('已定稿')
    expect(krNode().querySelector('.pm-okr-related')).toBeNull()
    expect(container.querySelectorAll('.pm-okr-related-row')).toHaveLength(0)
    await render(original)
    primaryInvariant(original)
    association()
    expect(container.querySelectorAll('.pm-okr-related-row')).toHaveLength(1)
    expect([JSON.stringify(original), JSON.stringify(cleared)]).toEqual(before)
    zeroWrite()
  })

  it('ROOT 父自身related原样保留，不借给无related的KR', async () => {
    const okrs = freeze(fixture().map(o => ({
      ...o, relatedOkrIds: o.id === 'okr-a' ? ['okr-b'] : [],
    })))
    await render(okrs)
    primaryInvariant(okrs)
    expect(krNode().querySelector('.pm-okr-related')).toBeNull()
    const row = roots()[0].querySelector('.pm-okr-related-row')!
    expect(row.textContent).toBe('关联：第二目标 B（okr-b · 只展示，不参与权重）')
    expect(row.closest('.pm-okr-kr')).toBeNull()
    expect(container.querySelectorAll('.pm-okr-related-row')).toHaveLength(1)
    zeroWrite()
  })

  it('SIBLING 同父KR只消费各自related，不拷贝到父或兄弟', async () => {
    const okrs = freeze([...fixture(), {
      id: 'kr-sibling', projectId: 'p-a', title: '无关联兄弟 KR', kind: 'key-result' as const,
      primaryOkrId: 'okr-a', relatedOkrIds: [], status: 'draft' as const,
    }])
    await render(okrs)
    association()
    expect(krNode('无关联兄弟 KR').querySelector('.pm-okr-related')).toBeNull()
    expect(container.querySelectorAll('.pm-okr-related-row')).toHaveLength(1)
    expect(roots()[1].querySelectorAll('.pm-okr-kr')).toHaveLength(0)
    zeroWrite()
  })

  it('ORPHAN 同一呈现窄复用，不伪造主父或进入第二目标children', async () => {
    const okrs = freeze(fixture().map(o => o.id === 'kr-a' ? { ...o, primaryOkrId: null } : o))
    await render(okrs)
    expect(krNode().closest('.pm-okr-orphans')).not.toBeNull()
    expect(krNode().querySelector('.pm-okr-own-note')?.textContent).toBe('未挂主归属')
    association()
    expect(roots().every(n => !n.querySelector('.pm-okr-kr'))).toBe(true)
    expect(buildOkrTree(okrs, 'p-a').orphans.map(n => n.record.id)).toEqual(['kr-a'])
    expect(container.querySelectorAll('.pm-okr-related-row')).toHaveLength(1)
    zeroWrite()
  })

  it('REORDER 快照重排/更新关联标题后仍取实际精确ID且一次', async () => {
    const original = fixture()
    await render(original)
    association()
    const updated = freeze([...original].reverse().map(o =>
      o.id === 'okr-b' ? { ...o, title: '第二目标 B 新标题' } : o))
    await render(updated)
    association(krNode(), '第二目标 B 新标题')
    expect(krNode().querySelector('.pm-okr-own-note')?.textContent).toBe('主归属：主目标 A')
    expect(container.querySelectorAll('.pm-okr-related-row')).toHaveLength(1)
    zeroWrite()
  })

  it('TEXT 关联标题作为普通文本，仅展示不增加确认/编辑/链接动作', async () => {
    const title = '<script>关联 & "原文"</script>'
    const okrs = freeze(fixture().map(o => o.id === 'okr-b' ? { ...o, title } : o))
    await render(okrs)
    association(krNode(), title)
    const row = krNode().querySelector('.pm-okr-related-row')!
    expect(row.querySelectorAll('script,a,button,input')).toHaveLength(0)
    expect(row.getAttribute('role')).toBeNull()
    expect(row.getAttribute('aria-live')).toBeNull()
    zeroWrite()
  })
})
