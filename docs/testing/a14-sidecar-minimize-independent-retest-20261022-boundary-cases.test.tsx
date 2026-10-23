import { appendFileSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PmPanel, type Snapshot } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { CopilotPanel } from '../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.js'
import { TaskTable } from '../../packages/dsh-pm-tool/src/client/views/tasks.js'
import { projectRecordSchema } from '../../packages/dsh-pm-tool/src/core/project.js'
import { taskRecordSchema } from '../../packages/dsh-pm-tool/src/core/task.js'

const noop = () => {}
const at = '2026-10-22T00:00:00.000Z'
const mounts: ReactTestRenderer[] = []
let store: Map<string, string>
let keyboard: EventTarget
const openerFocus = vi.fn()
const record = (id: string, data: unknown) => appendFileSync(process.env.A14_OBSERVATIONS!,
  `${JSON.stringify({ id, data, at: new Date().toISOString() })}\n`)
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
const all = (m: ReactTestRenderer, key: string, value: unknown) =>
  m.root.findAll(n => typeof n.type === 'string' && n.props[key] === value)
const node = (m: ReactTestRenderer, key: string, value: unknown) => {
  const matches = all(m, key, value)
  expect(matches, `${key}=${String(value)}`).toHaveLength(1)
  return matches[0]
}
const click = (n: ReactTestInstance) => act(() => n.props.onClick())
const mode = (m: ReactTestRenderer, next: 'draft' | 'diagnosis') =>
  click(node(m, 'id', next === 'draft' ? 'cp-tab-draft' : 'cp-tab-diag'))
const type = (m: ReactTestRenderer, value: string) => act(() =>
  node(m, 'className', 'pm-copilot-input').props.onChange({ target: { value } }))
const minimize = (m: ReactTestRenderer) =>
  click(node(m, 'aria-label', '最小化为侧边标签（保留上下文）'))
const expand = (m: ReactTestRenderer) =>
  click(node(m, 'aria-label', '展开 AI 副驾，保留此前上下文'))
const undo = (m: ReactTestRenderer) => all(m, 'className', 'pm-copilot-undo-btn')
const writes = (calls: string[]) => calls.filter(c => /^(?:ask-apply|ask-undo(?! list)|capture-apply|task update)\b/.test(c))
function visible(n: ReactTestInstance) {
  for (let p: ReactTestInstance | null = n; p; p = p.parent) if (p.props.hidden === true) return false
  return true
}
function key(name: string) {
  const event = new Event('keydown')
  Object.defineProperty(event, 'key', { value: name })
  act(() => keyboard.dispatchEvent(event))
}
async function fixture() {
  const projects = ['p-0001', 'p-0002'].map(id => projectRecordSchema.parse({
    id, name: id, description: '', owner: '', status: 'active', createdAt: at, updatedAt: at,
    startDate: '2026-10-01', targetDate: '2026-10-31',
  }))
  let snapshot: Snapshot = { projects, tasks: projects.map((p, i) => taskRecordSchema.parse({
    id: `t-000${i + 1}`, projectId: p.id, parentId: null, title: `任务${i + 1}`,
    description: '', assignee: '原负责人', status: 'todo', priority: 'P1', progress: 0,
    milestoneId: null, code: '1', order: 1, createdAt: at, updatedAt: at,
  })), milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [] }
  const ask = '独立设施合法计划\n```json\n' + JSON.stringify({ plan: [
    { stepId: 's1', title: '进度', reason: '明确候选', needs: [],
      action: { op: 'task.update', id: 't-0001', patch: { progress: 70 } } },
    { stepId: 's2', title: '负责人', reason: '明确候选', needs: ['s1'],
      action: { op: 'task.update', id: 't-0001', patch: { assignee: '计划负责人' } } },
  ] }) + '\n```'
  const calls: string[] = []
  const pending: Promise<unknown>[] = []
  let applied = false
  const dispatch = async (line: string) => {
    calls.push(line)
    if (line === 'web snapshot') return JSON.stringify(snapshot)
    if (line === 'model status') return '当前车道：poc'
    if (line.startsWith('ask-provenance ')) return '{"entries":[]}'
    if (line.startsWith('ask p-0001 ')) return ask
    if (line.startsWith('ask-apply p-0001 ')) { applied = true; return '已应用 2 步' }
    if (line === 'ask-undo list') {
      expect(applied).toBe(true)
      return '{"undoIds":[{"id":"undo-independent-inert","at":1}]}'
    }
    if (line.startsWith('capture p-0001 ')) return '草稿编号：draft-independent-inert\n隔离候选'
    throw new Error(`禁止未授权传输/RPC：${line}`)
  }
  const raw = (line: string) => {
    const p = dispatch(line).then(text => ({ kind: 'success' as const, text }))
    pending.push(p)
    return p
  }
  const flush = async () => {
    for (let i = 0; i < 12; i++) {
      const count = pending.length
      await Promise.all(pending)
      await new Promise(resolve => setTimeout(resolve, 0))
      if (count === pending.length) return
    }
    throw new Error('独立设施未排空')
  }
  store.set('pm-selected-project', 'p-0001')
  store.set('pm-view', 'tasks')
  let m!: ReactTestRenderer
  await act(async () => {
    m = create(createElement(PmPanel, { execute: async line => (await raw(line)).text, executeRaw: raw }), {
      createNodeMock: element => element.props.className === 'pm-button pm-top-secondary pm-copilot-open'
        ? { focus: openerFocus } : null,
    })
    await flush()
  })
  mounts.push(m)
  click(node(m, 'className', 'pm-button pm-top-secondary pm-copilot-open'))
  await act(flush)
  return { m, calls, flush, snapshot: () => snapshot,
    replace: () => { snapshot = { ...snapshot, tasks: snapshot.tasks.map(t => t.id === 't-0001'
      ? { ...t, title: '最新主任务', updatedAt: '2026-10-22T00:03:00.000Z' } : t) } } }
}
async function generate(f: Awaited<ReturnType<typeof fixture>>) {
  type(f.m, '独立明确生成')
  await act(async () => { node(f.m, 'aria-label', '发送').props.onClick(); await f.flush() })
  mode(f.m, 'draft')
  expect(all(f.m, 'data-copilot-check', 's1')).toHaveLength(1)
}
async function apply(f: Awaited<ReturnType<typeof fixture>>) {
  await generate(f)
  await act(async () => { node(f.m, 'className', 'pm-copilot-apply-main').props.onClick(); await f.flush() })
  expect(undo(f.m)).toHaveLength(1)
}
async function switchProject(f: Awaited<ReturnType<typeof fixture>>) {
  click(node(f.m, 'className', 'pm-project-switcher-btn'))
  const option = f.m.root.findAllByType('button').find(n => n.props.role === 'option' && text(n).includes('p-0002'))
  expect(option).toBeTruthy()
  click(option!)
  await act(f.flush)
}
beforeEach(() => {
  store = new Map()
  keyboard = new EventTarget()
  openerFocus.mockClear()
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) })
  vi.stubGlobal('window', { location: { hash: '', search: '', pathname: '/' },
    addEventListener: keyboard.addEventListener.bind(keyboard), removeEventListener: keyboard.removeEventListener.bind(keyboard),
    setTimeout, clearTimeout, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) })
  vi.stubGlobal('document', { activeElement: null, querySelector: () => null,
    addEventListener: noop, removeEventListener: noop, body: { dataset: {} } })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 1 })
  vi.stubGlobal('cancelAnimationFrame', noop)
  vi.stubGlobal('fetch', () => { throw new Error('独立复验禁止网络') })
})
afterEach(() => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

it('BOUNDARY 关闭/重开保留原父模式、卸载本地撤销/输入，不捞历史句柄', async () => {
  const f = await fixture()
  await apply(f)
  mode(f.m, 'diagnosis'); type(f.m, '未发送关闭前')
  const original = f.m.root.findByType(CopilotPanel)
  click(node(f.m, 'aria-label', '关闭副驾（ESC）'))
  expect(f.m.root.findAllByType(CopilotPanel)).toHaveLength(0)
  expect(openerFocus).toHaveBeenCalledOnce()
  click(node(f.m, 'className', 'pm-button pm-top-secondary pm-copilot-open'))
  await act(f.flush)
  expect(f.m.root.findByType(CopilotPanel)).not.toBe(original)
  expect(undo(f.m)).toHaveLength(0)
  expect(node(f.m, 'className', 'pm-copilot-input').props.value).toBe('')
  expect(node(f.m, 'id', 'cp-tab-diag').props['aria-selected']).toBe(true)
  expect(f.calls.filter(c => c === 'ask-undo list')).toHaveLength(1)
  record('close-reopen', { undo: undo(f.m).length, input: '', calls: f.calls })
})

it('BOUNDARY 隐藏时Tab不被副驾全局拦截；ESC真实事件关闭/归焦回调且卸载监听', async () => {
  const f = await fixture()
  minimize(f.m)
  const tab = node(f.m, 'className', 'pm-sidecar-tab')
  expect(visible(tab)).toBe(true)
  const e = new Event('keydown', { cancelable: true })
  Object.defineProperty(e, 'key', { value: 'Tab' })
  act(() => keyboard.dispatchEvent(e))
  expect(e.defaultPrevented).toBe(false)
  expect(openerFocus).not.toHaveBeenCalled()
  key('Escape')
  expect(f.m.root.findAllByType(CopilotPanel)).toHaveLength(0)
  expect(all(f.m, 'className', 'pm-sidecar-tab')).toHaveLength(0)
  expect(openerFocus).toHaveBeenCalledOnce()
  key('Escape')
  expect(openerFocus).toHaveBeenCalledOnce()
  record('keyboard', { tabPrevented: e.defaultPrevented, focusCallback: openerFocus.mock.calls.length,
    boundary: 'EventTarget和ref回调；不是浏览器Tab序列或真实activeElement证明' })
})

it('BOUNDARY 已有上下文的展开态切项目与旧版同语义：同子身份/实时props/零自动写', async () => {
  const f = await fixture()
  await apply(f)
  mode(f.m, 'diagnosis'); type(f.m, '切项目前未发送')
  const child = f.m.root.findByType(CopilotPanel)
  const beforeWrites = writes(f.calls)
  await switchProject(f)
  expect(f.m.root.findByType(CopilotPanel)).toBe(child)
  expect(child.props.projectId).toBe('p-0002')
  expect(child.props.tasks.map((t: { id: string }) => t.id)).toEqual(['t-0002'])
  expect(Object.keys(child.props.baselineMap)).toEqual(['t-0002'])
  expect(node(f.m, 'className', 'pm-copilot-input').props.value).toBe('切项目前未发送')
  expect(undo(f.m)).toHaveLength(1)
  expect(writes(f.calls)).toEqual(beforeWrites)
  record('switch-expanded', { sameIdentity: true, projectId: child.props.projectId,
    tasks: child.props.tasks.map((t: { id: string }) => t.id), input: '切项目前未发送', undo: 1, calls: f.calls,
    boundary: '原有本地状态继承，不签跨项目后端handle可用/算法安全' })
})

it('RETENTION 隐藏aside不进入可达结构，主任务操作与竖标签仍在；重复展开同子身份', async () => {
  const f = await fixture()
  const child = f.m.root.findByType(CopilotPanel)
  const aside = node(f.m, 'className', 'pm-sidecar')
  const calls = [...f.calls]
  for (let i = 0; i < 3; i++) {
    minimize(f.m)
    expect(f.m.root.findByType(CopilotPanel)).toBe(child)
    expect(node(f.m, 'className', 'pm-sidecar')).toBe(aside)
    expect(aside.props.hidden).toBe(true)
    expect(visible(node(f.m, 'className', 'pm-copilot-input'))).toBe(false)
    expect(visible(node(f.m, 'className', 'pm-sidecar-tab'))).toBe(true)
    expect(visible(f.m.root.findByType(TaskTable))).toBe(true)
    expand(f.m)
    expect(aside.props.hidden).toBe(false)
    expect(visible(node(f.m, 'className', 'pm-copilot-input'))).toBe(true)
  }
  expect(f.calls).toEqual(calls)
  const css = readFileSync(new URL('../../packages/dsh-pm-tool/src/client/panel.css', import.meta.url), 'utf8')
  expect(css).toMatch(/\.pm-sidecar\[hidden\]\s*\{\s*display:\s*none;\s*\}/)
  record('hidden-structure', { stable: true, hiddenAncestor: true, zeroExtraRequests: true,
    boundary: 'CSS和React结构；实际布局/指针/无障碍树仍GUI NOT_RUN' })
})

it('RETENTION 重新查当前节点核未确认勾选/编辑/消息/未发送，最新props和openedAt提醒', async () => {
  const f = await fixture()
  await generate(f)
  act(() => node(f.m, 'data-copilot-check', 's2').props.onChange({ target: { checked: false } }))
  act(() => node(f.m, 'data-copilot-edit', 's1.progress').props.onChange({ target: { value: '74' } }))
  mode(f.m, 'diagnosis'); type(f.m, '独立保留未发送')
  const child = f.m.root.findByType(CopilotPanel)
  minimize(f.m)
  f.replace()
  await act(async () => { await child.props.onSaved(); await f.flush() })
  expect(f.m.root.findByType(CopilotPanel)).toBe(child)
  expect(child.props.tasks[0].title).toBe('最新主任务')
  expect(child.props.baselineMap['t-0001']).toBe('2026-10-22T00:03:00.000Z')
  expand(f.m)
  expect(node(f.m, 'className', 'pm-copilot-input').props.value).toBe('独立保留未发送')
  expect(text(node(f.m, 'className', 'pm-copilot-messages'))).toContain('独立明确生成')
  mode(f.m, 'draft')
  expect(node(f.m, 'data-copilot-check', 's2').props.checked).toBe(false)
  expect(node(f.m, 'data-copilot-edit', 's1.progress').props.value).toBe(74)
  expect(text(f.m.root)).toContain('你打开草稿后台账有变化')
  mode(f.m, 'diagnosis'); mode(f.m, 'draft')
  expect(node(f.m, 'data-copilot-check', 's2').props.checked).toBe(false)
  expect(node(f.m, 'data-copilot-edit', 's1.progress').props.value).toBe(74)
  expect(writes(f.calls)).toEqual([])
  record('fresh-nodes', { checked: false, edited: 74, unsent: '独立保留未发送',
    latestTitle: child.props.tasks[0].title, baseline: child.props.baselineMap, writes: [] })
})

it('RETENTION 补档未确认候选/输入隐藏期间保存，零自动落库', async () => {
  const f = await fixture()
  click(node(f.m, 'className', 'pm-capture-toggle'))
  act(() => node(f.m, 'className', 'pm-capture-text').props.onChange({ target: { value: '独立补档候选' } }))
  const button = f.m.root.findAllByType('button').find(n => text(n) === '生成草稿')!
  await act(async () => { button.props.onClick(); await f.flush() })
  const before = [...f.calls]
  minimize(f.m); expand(f.m)
  expect(node(f.m, 'className', 'pm-capture-text').props.value).toBe('独立补档候选')
  expect(all(f.m, 'aria-label', '补档草稿（未写入，可一键确认落库）')).toHaveLength(1)
  expect(f.calls).toEqual(before)
  expect(writes(f.calls)).toEqual([])
  record('capture', { unconfirmed: true, zeroWrites: true, calls: f.calls })
})
