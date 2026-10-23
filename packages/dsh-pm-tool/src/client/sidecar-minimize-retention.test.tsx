import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PmPanel, type Snapshot } from './panel.js'
import { CopilotPanel } from './shared/drawers/sidecar-portal.js'
import { TaskTable } from './views/tasks.js'
import { taskRecordSchema } from '../core/task.js'
import { projectRecordSchema } from '../core/project.js'

// 真实父子组件；仅浏览器设施和命令传输为桩，不访问宿主/模型/落盘或真实句柄。
const noop = () => {}
const at = '2026-10-22T00:00:00.000Z'
const unsent = '未发送的本地上下文'
let storage: Map<string, string>
let formValues: Map<string, unknown>
let keys: EventTarget
const mounts: ReactTestRenderer[] = []
const openerFocus = vi.fn()
const text = (node: ReactTestInstance): string => node.children.map(child =>
  typeof child === 'string' ? child : text(child)).join('')
const nodes = (m: ReactTestRenderer, key: string, value: unknown) =>
  m.root.findAll(node => typeof node.type === 'string' && node.props[key] === value)
const node = (m: ReactTestRenderer, key: string, value: unknown) => {
  const found = nodes(m, key, value)
  expect(found, `${key}=${String(value)}`).toHaveLength(1)
  return found[0]
}
const sidecar = (m: ReactTestRenderer) => m.root.findByType(CopilotPanel)
const undo = (m: ReactTestRenderer) => nodes(m, 'className', 'pm-copilot-undo-btn')
const visible = (element: ReactTestInstance): boolean => {
  for (let ancestor: ReactTestInstance | null = element; ancestor; ancestor = ancestor.parent)
    if (ancestor.props.hidden === true) return false
  return true
}
const click = (target: ReactTestInstance) => act(() => target.props.onClick())
const mode = (m: ReactTestRenderer, next: 'diagnosis' | 'draft') =>
  click(node(m, 'id', next === 'draft' ? 'cp-tab-draft' : 'cp-tab-diag'))
const typeInput = (m: ReactTestRenderer, value: string) => act(() =>
  node(m, 'className', 'pm-copilot-input').props.onChange({ target: { value } }))
const minimize = (m: ReactTestRenderer) =>
  click(node(m, 'aria-label', '最小化为侧边标签（保留上下文）'))
const expand = (m: ReactTestRenderer) =>
  click(node(m, 'aria-label', '展开 AI 副驾，保留此前上下文'))
const writeCalls = (calls: string[]) => calls.filter(line =>
  /^(?:ask-apply|ask-undo(?! list)|capture-apply|task (?:update|add|delete))\b/.test(line))

function initialSnapshot(): Snapshot {
  const projects = ['p-0001', 'p-0002'].map((id, index) => projectRecordSchema.parse({
    id, name: `隔离项目${index + 1}`, description: '', owner: '', status: 'active',
    startDate: '2026-10-01', targetDate: '2026-10-31', createdAt: at, updatedAt: at,
  }))
  const tasks = projects.map((project, index) => taskRecordSchema.parse({
    id: `t-000${index + 1}`, projectId: project.id, parentId: null, title: `隔离任务${index + 1}`,
    description: '原描述', assignee: '原负责人', status: 'todo', priority: 'P1', progress: 0,
    milestoneId: null, code: '1', order: 1, createdAt: at, updatedAt: at,
    attachments: [{ id: 'at-0001', kind: 'link', url: 'https://example.com/evidence', addedAt: at }],
    progressLog: [{ id: 'pl-0001', date: '2026-10-22', author: '甲', createdAt: at,
      revisions: [{ id: 'rv-0001', date: '2026-10-22', author: '甲', content: '历史保留', revisedAt: at }] }],
  }))
  return { projects, tasks, milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [] }
}
async function fixture() {
  let snapshot = initialSnapshot()
  let applyCount = 0
  let failApply = false
  let failTask = false
  let failSnapshot = false
  const calls: string[] = []
  const pending: Promise<unknown>[] = []
  const askText = 't-0001 的只读诊断\n```json\n' + JSON.stringify({ plan: [
    { stepId: 's1', title: '改进度', reason: '隔离用例', needs: [],
      action: { op: 'task.update', id: 't-0001', patch: { progress: 71 } } },
    { stepId: 's2', title: '改负责人', reason: '隔离用例', needs: ['s1'],
      action: { op: 'task.update', id: 't-0001', patch: { assignee: '计划负责人' } } },
  ] }) + '\n```'
  const dispatch = async (line: string) => {
    calls.push(line)
    if (line === 'web snapshot') {
      if (failSnapshot) throw new Error('隔离快照失败')
      return JSON.stringify(snapshot)
    }
    if (line === 'model status') return '当前车道：poc'
    if (line.startsWith('ask-provenance ')) return '{"entries":[]}'
    if (line.startsWith('ask p-0001 ')) return askText
    if (line.startsWith('ask-apply p-0001 ')) {
      if (failApply) throw new Error('隔离确认失败，保留草稿')
      applyCount++
      return '已应用 2 步'
    }
    if (line === 'ask-undo list') {
      expect(applyCount).toBeGreaterThan(0)
      return JSON.stringify({ undoIds: [{ id: `undo-sm01-inert-${applyCount}`, at: Date.now() }] })
    }
    if (line.startsWith('ask-undo')) throw new Error('禁止执行任何撤销')
    if (line.startsWith('capture p-0001 ')) return '草稿编号：draft-sm01-inert\n仅隔离候选预览'
    if (line.startsWith('capture-apply')) throw new Error('禁止自动补档确认')
    if (line.startsWith('task update t-0001 ')) {
      if (failTask) throw new Error('隔离主保存失败')
      const patch = JSON.parse(line.slice('task update t-0001 '.length))
      expect(patch).not.toHaveProperty('attachments')
      expect(patch).not.toHaveProperty('progressLog')
      snapshot = { ...snapshot, tasks: snapshot.tasks.map(task => task.id === 't-0001'
        ? { ...task, assignee: String(patch.assignee), updatedAt: '2026-10-22T00:01:00.000Z' } : task) }
      return '任务已更新'
    }
    throw new Error(`未授权传输：${line}`)
  }
  const raw = (line: string) => {
    const promise = dispatch(line).then(text => ({ kind: 'success' as const, text }))
    // 保留业务拒绝给组件处理，排空设施不重复抛出已被组件捕获的错误。
    pending.push(promise.catch(noop))
    return promise
  }
  const execute = async (line: string) => (await raw(line)).text
  const flush = async () => {
    for (let i = 0; i < 15; i++) {
      const count = pending.length
      await Promise.all(pending)
      await new Promise(resolve => setTimeout(resolve, 0))
      if (count === pending.length) return
    }
    throw new Error('异步设施未排空')
  }
  storage.set('pm-selected-project', 'p-0001')
  storage.set('pm-view', 'tasks')
  let m!: ReactTestRenderer
  await act(async () => {
    m = create(createElement(PmPanel, { execute, executeRaw: raw }), {
      createNodeMock: element => element.props.className === 'pm-button pm-top-secondary pm-copilot-open'
        ? { focus: openerFocus } : null,
    })
    await flush()
  })
  mounts.push(m)
  click(node(m, 'className', 'pm-button pm-top-secondary pm-copilot-open'))
  await act(flush)
  return { m, calls, flush, snapshot: () => snapshot,
    replaceTask: () => { snapshot = { ...snapshot, tasks: snapshot.tasks.map(task => task.id === 't-0001'
      ? { ...task, title: '外部最新任务', assignee: '外部负责人', updatedAt: '2026-10-22T00:02:00.000Z' } : task) } },
    failApply: () => { failApply = true },
    failTask: () => { failTask = true },
    failSnapshot: (next: boolean) => { failSnapshot = next },
  }
}
async function generate(f: Awaited<ReturnType<typeof fixture>>) {
  mode(f.m, 'diagnosis')
  typeInput(f.m, '明确生成隔离计划')
  await act(async () => { node(f.m, 'aria-label', '发送').props.onClick(); await f.flush() })
  mode(f.m, 'draft')
  expect(nodes(f.m, 'data-copilot-check', 's1')).toHaveLength(1)
}
async function apply(f: Awaited<ReturnType<typeof fixture>>) {
  await generate(f)
  await act(async () => { node(f.m, 'className', 'pm-copilot-apply-main').props.onClick(); await f.flush() })
}
function openTask(f: Awaited<ReturnType<typeof fixture>>) {
  act(() => f.m.root.findByType(TaskTable).props.onEdit(f.snapshot().tasks[0]))
  for (const [key, value] of Object.entries(f.snapshot().tasks[0])) formValues.set(key, value)
}
async function submitTask(f: Awaited<ReturnType<typeof fixture>>) {
  await act(async () => {
    node(f.m, 'className', 'pm-drawer-form').props.onSubmit({
      preventDefault: noop, currentTarget: { elements: { namedItem: () => null } },
    })
    await f.flush()
  })
}

beforeEach(() => {
  storage = new Map()
  formValues = new Map()
  keys = new EventTarget()
  openerFocus.mockClear()
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) })
  vi.stubGlobal('window', { location: { hash: '', search: '', pathname: '/' },
    addEventListener: keys.addEventListener.bind(keys), removeEventListener: keys.removeEventListener.bind(keys),
    setTimeout, clearTimeout, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) })
  vi.stubGlobal('document', { activeElement: null, querySelector: () => null,
    addEventListener: noop, removeEventListener: noop, body: { dataset: {} } })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 1 })
  vi.stubGlobal('cancelAnimationFrame', noop)
  vi.stubGlobal('fetch', () => { throw new Error('禁止网络') })
  vi.stubGlobal('FormData', class {
    get(key: string) { return formValues.get(key) ?? null }
    getAll() { return [] }
    entries() { return formValues.entries() }
  })
})
afterEach(() => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

describe('SM01 开发回归：最小化生命周期与既有边界（非GUI/独立审签）', () => {
  it('同一aside/子组件反复最小化不重挂载，独立竖标签可达，零自动请求', async () => {
    const f = await fixture()
    const original = sidecar(f.m)
    const aside = node(f.m, 'className', 'pm-sidecar')
    const before = [...f.calls]
    for (let i = 0; i < 3; i++) {
      minimize(f.m)
      expect(node(f.m, 'className', 'pm-sidecar')).toBe(aside)
      expect(sidecar(f.m)).toBe(original)
      expect(aside.props.hidden).toBe(true)
      expect(visible(node(f.m, 'className', 'pm-sidecar-tab'))).toBe(true)
      expect(visible(node(f.m, 'className', 'pm-copilot-input'))).toBe(false)
      expect(node(f.m, 'className', 'pm-sidecar-tab').parent).not.toBe(aside)
      expand(f.m)
      expect(aside.props.hidden).toBe(false)
      expect(visible(node(f.m, 'className', 'pm-copilot-input'))).toBe(true)
    }
    expect(f.calls).toEqual(before)
  })

  it('hidden规则覆盖display:flex；几何和滚动仍由原fixed/body规则承担', () => {
    const css = readFileSync(new URL('./panel.css', import.meta.url), 'utf8')
    expect(css).toContain('.pm-sidecar[hidden] { display: none; }')
    expect(css).toMatch(/\.pm-sidecar\s*\{[^}]*position: fixed;[^}]*display: flex;/)
    expect(css).toContain('.pm-sidecar-body { flex: 1 1 auto; min-height: 0; overflow-y: auto;')
  })

  it('未确认消息/勾选/编辑/输入保留，隐藏期间最新tasks/baseline实时刷新且保留openedAt警告', async () => {
    const f = await fixture()
    await generate(f)
    act(() => node(f.m, 'data-copilot-check', 's2').props.onChange({ target: { checked: false } }))
    act(() => node(f.m, 'data-copilot-edit', 's1.progress').props.onChange({ target: { value: '72' } }))
    mode(f.m, 'diagnosis')
    typeInput(f.m, unsent)
    minimize(f.m)
    const original = sidecar(f.m)
    f.replaceTask()
    await act(async () => { await original.props.onSaved(); await f.flush() })
    expect(sidecar(f.m)).toBe(original)
    expect(original.props.tasks[0].title).toBe('外部最新任务')
    expect(original.props.baselineMap['t-0001']).toBe('2026-10-22T00:02:00.000Z')
    expand(f.m)
    expect(node(f.m, 'className', 'pm-copilot-input').props.value).toBe(unsent)
    expect(text(node(f.m, 'className', 'pm-copilot-messages'))).toContain('明确生成隔离计划')
    expect(text(f.m.root)).toContain('外部最新任务')
    mode(f.m, 'draft')
    expect(text(f.m.root)).toContain('你打开草稿后台账有变化')
    expect(node(f.m, 'data-copilot-check', 's2').props.checked).toBe(false)
    expect(node(f.m, 'data-copilot-edit', 's1.progress').props.value).toBe(72)
    expect(writeCalls(f.calls)).toEqual([])
  })

  it('副驾取消仅清计划；最小化不自动确认或重生成', async () => {
    const f = await fixture()
    await generate(f)
    minimize(f.m); expand(f.m)
    click(node(f.m, 'data-copilot-cancel', true))
    expect(nodes(f.m, 'data-copilot-check', 's1')).toHaveLength(0)
    expect(f.calls.filter(line => line.startsWith('ask p-0001 '))).toHaveLength(1)
    expect(writeCalls(f.calls)).toEqual([])
  })

  it('明确apply失败后保编辑草稿/错误；再最小化不会重试或捞句柄', async () => {
    const f = await fixture()
    await generate(f)
    f.failApply()
    await act(async () => { node(f.m, 'className', 'pm-copilot-apply-main').props.onClick(); await f.flush() })
    const before = [...f.calls]
    minimize(f.m); expand(f.m)
    expect(nodes(f.m, 'data-copilot-check', 's1')).toHaveLength(1)
    expect(undo(f.m)).toHaveLength(0)
    mode(f.m, 'diagnosis')
    expect(text(f.m.root)).toContain('隔离确认失败')
    expect(f.calls).toEqual(before)
    expect(f.calls).not.toContain('ask-undo list')
  })

  it('补档展开/未发送文本/生成后未确认draft保留，零自动capture-apply', async () => {
    const f = await fixture()
    click(node(f.m, 'className', 'pm-capture-toggle'))
    act(() => node(f.m, 'className', 'pm-capture-text').props.onChange({ target: { value: '仅隔离观察' } }))
    const generateButton = f.m.root.findAllByType('button').find(button => text(button) === '生成草稿')!
    await act(async () => { generateButton.props.onClick(); await f.flush() })
    const before = [...f.calls]
    minimize(f.m); expand(f.m)
    expect(node(f.m, 'className', 'pm-capture-toggle').props['aria-expanded']).toBe(true)
    expect(node(f.m, 'className', 'pm-capture-text').props.value).toBe('仅隔离观察')
    expect(nodes(f.m, 'aria-label', '补档草稿（未写入，可一键确认落库）')).toHaveLength(1)
    expect(f.calls).toEqual(before)
    expect(writeCalls(f.calls)).toEqual([])
  })

  it('四次明确确认后仅保最近三条本地句柄，隐藏/展开不查询历史或执行撤销', async () => {
    const f = await fixture()
    for (let i = 0; i < 4; i++) await apply(f)
    expect(undo(f.m)).toHaveLength(3)
    const buttons = undo(f.m)
    const before = [...f.calls]
    minimize(f.m); expand(f.m)
    expect(undo(f.m)).toEqual(buttons)
    expect(f.calls).toEqual(before)
    expect(f.calls.filter(line => line === 'ask-undo list')).toHaveLength(4)
    expect(f.calls.filter(line => /^ask-undo(?! list)/.test(line))).toEqual([])
  })

  it('主表单干净取消仍可达/真正关闭，副驾撤销及未发送内容保持', async () => {
    const f = await fixture()
    await apply(f)
    mode(f.m, 'diagnosis'); typeInput(f.m, unsent)
    openTask(f); minimize(f.m)
    const form = node(f.m, 'className', 'pm-drawer-form')
    const cancel = form.findAllByType('button').find(button => text(button) === '取消')!
    expect(visible(cancel)).toBe(true)
    click(cancel)
    expect(nodes(f.m, 'className', 'pm-drawer-form')).toHaveLength(0)
    expand(f.m)
    expect(undo(f.m)).toHaveLength(1)
    expect(node(f.m, 'className', 'pm-copilot-input').props.value).toBe(unsent)
    expect(f.calls.filter(line => line.startsWith('task update'))).toEqual([])
  })

  it('主保存失败不关闭表单或丢副驾；主保存成功实时props及历史数组保留', async () => {
    const f = await fixture()
    await apply(f)
    mode(f.m, 'diagnosis'); typeInput(f.m, unsent)
    openTask(f); minimize(f.m)
    const history = structuredClone(f.snapshot().tasks[0])
    formValues.set('assignee', '人工改派')
    await submitTask(f)
    expect(nodes(f.m, 'className', 'pm-drawer-form')).toHaveLength(0)
    expect(sidecar(f.m).props.tasks[0].assignee).toBe('人工改派')
    expect(sidecar(f.m).props.tasks[0].attachments).toEqual(history.attachments)
    expect(sidecar(f.m).props.tasks[0].progressLog).toEqual(history.progressLog)
    openTask(f)
    f.failTask()
    await submitTask(f)
    expect(nodes(f.m, 'className', 'pm-drawer-form')).toHaveLength(1)
    expect(text(f.m.root)).toContain('隔离主保存失败')
    expand(f.m)
    expect(undo(f.m)).toHaveLength(1)
    expect(node(f.m, 'className', 'pm-copilot-input').props.value).toBe(unsent)
  })

  it('快照失败/重试保持同一副驾与草稿，不伪造最新投影', async () => {
    const f = await fixture()
    await generate(f); mode(f.m, 'diagnosis'); typeInput(f.m, unsent)
    const original = sidecar(f.m)
    minimize(f.m)
    f.failSnapshot(true)
    await act(async () => { expect(await original.props.onSaved()).toBe(false); await f.flush() })
    expect(sidecar(f.m)).toBe(original)
    expect(original.props.tasks[0].title).toBe('隔离任务1')
    f.failSnapshot(false)
    await act(async () => { expect(await original.props.onSaved()).toBe(true); await f.flush() })
    expand(f.m)
    expect(sidecar(f.m)).toBe(original)
    expect(node(f.m, 'className', 'pm-copilot-input').props.value).toBe(unsent)
    mode(f.m, 'draft')
    expect(nodes(f.m, 'data-copilot-check', 's1')).toHaveLength(1)
    expect(writeCalls(f.calls)).toEqual([])
  })

  it('明确关闭/ESC仍真正卸载并归还开关焦点，再开不重建fresh撤销', async () => {
    const f = await fixture()
    await apply(f)
    click(node(f.m, 'aria-label', '关闭副驾（ESC）'))
    expect(f.m.root.findAllByType(CopilotPanel)).toHaveLength(0)
    expect(openerFocus).toHaveBeenCalledOnce()
    click(node(f.m, 'className', 'pm-button pm-top-secondary pm-copilot-open'))
    await act(f.flush)
    expect(undo(f.m)).toHaveLength(0)
    minimize(f.m)
    act(() => {
      const event = new Event('keydown')
      Object.defineProperty(event, 'key', { value: 'Escape' })
      keys.dispatchEvent(event)
    })
    expect(f.m.root.findAllByType(CopilotPanel)).toHaveLength(0)
    expect(nodes(f.m, 'className', 'pm-sidecar-tab')).toHaveLength(0)
    expect(openerFocus).toHaveBeenCalledTimes(2)
    expect(f.calls.filter(line => line === 'ask-undo list')).toHaveLength(1)
  })

  it('切项目沿用既有projectId/props切换语义，隐藏不锁旧任务也不恢复历史句柄', async () => {
    const f = await fixture()
    minimize(f.m)
    click(node(f.m, 'className', 'pm-project-switcher-btn'))
    const option = f.m.root.findAllByType('button').find(button =>
      button.props.role === 'option' && text(button).includes('p-0002'))!
    click(option)
    await act(f.flush)
    expect(sidecar(f.m).props.projectId).toBe('p-0002')
    expect(sidecar(f.m).props.tasks.map((task: { id: string }) => task.id)).toEqual(['t-0002'])
    expect(node(f.m, 'className', 'pm-sidecar').props.hidden).toBe(true)
    expand(f.m)
    expect(undo(f.m)).toHaveLength(0)
    expect(writeCalls(f.calls)).toEqual([])
    expect(f.calls.filter(line => line.startsWith('ask '))).toEqual([])
  })
})
