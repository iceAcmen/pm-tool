import { appendFileSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PmPanel } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { CopilotPanel } from '../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.js'
import { TaskTable } from '../../packages/dsh-pm-tool/src/client/views/tasks.js'
import { parseCopilotPlan, validatePlan } from '../../packages/dsh-pm-tool/src/core/copilot.js'
import { projectRecordSchema } from '../../packages/dsh-pm-tool/src/core/project.js'
import { taskRecordSchema } from '../../packages/dsh-pm-tool/src/core/task.js'

const input = JSON.parse(readFileSync(process.env.PC_INPUT!, 'utf8'))
const mounts: ReactTestRenderer[] = []
const noop = () => {}
let local: Map<string, string>
let formValues: Map<string, unknown>
const record = (id: string, data: unknown) => appendFileSync(process.env.PC_OBSERVATIONS!,
  `${JSON.stringify({ id, at: new Date().toISOString(), data })}\n`)
const text = (node: ReactTestInstance): string => node.children.map(child =>
  typeof child === 'string' ? child : text(child)).join('')
const find = (m: ReactTestRenderer, key: string, value: unknown) => {
  const node = m.root.findAll(n => typeof n.type === 'string' && n.props[key] === value)[0]
  expect(node, `missing current node ${key}=${value}`).toBeTruthy()
  return node
}
const selectedBase = () => ({
  ...Object.fromEntries(input.initial.tasks
    .filter((t: any) => t.projectId === 'p-0001').map((t: any) => [t.id, t.updatedAt])),
  'm-0001': input.initial.milestones.find((r: any) => r.id === 'm-0001').updatedAt,
  'm-0002': input.initial.milestones.find((r: any) => r.id === 'm-0002').updatedAt,
  'ri-0001': input.initial.riskIssues.find((r: any) => r.id === 'ri-0001').updatedAt,
  'ri-0002': input.initial.riskIssues.find((r: any) => r.id === 'ri-0002').updatedAt,
  'dlv-0001': input.initial.deliverables.find((r: any) => r.id === 'dlv-0001').updatedAt,
  'dlv-0002': input.initial.deliverables.find((r: any) => r.id === 'dlv-0002').updatedAt,
  'mtg-0001': input.initial.meetings.find((r: any) => r.id === 'mtg-0001').updatedAt,
  'mtg-0002': input.initial.meetings.find((r: any) => r.id === 'mtg-0002').updatedAt,
})
const parseApply = (line: string) => {
  const split = line.slice('ask-apply p-0001 '.length).split(' --base ')
  return { actions: JSON.parse(split[0]), base: JSON.parse(split[1]) }
}

async function fixture(blockedFirst = false) {
  let snapshot = structuredClone(input.initial)
  const calls: string[] = []
  const responses: unknown[] = []
  const pending: Promise<unknown>[] = []
  let appliedCalls = 0
  const dispatch = async (line: string) => {
    calls.push(line)
    let result: { kind: string, text: string }
    if (line === 'web snapshot') result = { kind: 'success', text: JSON.stringify(snapshot) }
    else if (line === 'model status') result = { kind: 'success', text: '当前模式：prod（生产）' }
    else if (line.startsWith('ask-provenance ')) result = { kind: 'success', text: '{"entries":[]}' }
    else if (line.startsWith('ask p-0001 ')) result = { kind: 'success', text: input.askText }
    else if (line === 'ask-undo list') result = { kind: 'success', text: '{"undoIds":[]}' }
    else if (line.startsWith('task update t-0001 ')) {
      snapshot = structuredClone(input.external)
      result = { kind: 'success', text: input.updateText }
    } else if (line.startsWith('ask-apply p-0001 ')) {
      const { actions } = parseApply(line)
      appliedCalls++
      if (blockedFirst && appliedCalls === 1) {
        // Fault injection at transport only; this is not a claimed original GUI event.
        snapshot = structuredClone(input.external)
        result = { kind: 'success',
          text: '已应用 0 步；未执行 1 步（s1 t-0001 推进任务一：内容已被他人更新，为避免覆盖未执行）' }
      } else {
        const id = actions[0]?.stepId
        if (actions.length === 1 && input.stepSnapshots[id]) snapshot = structuredClone(input.stepSnapshots[id])
        result = { kind: 'success', text: actions.length === 3 ? input.applyText :
          `已应用 1 步（${id} ${actions[0].id} ${actions[0].title}）` }
      }
    } else throw new Error(`unauthorized transport ${line}`)
    responses.push({ line, result })
    record('transport', { line, result, transportDouble: true, network: false })
    return result
  }
  const executeRaw = (line: string) => {
    const result = dispatch(line)
    pending.push(result)
    return result
  }
  const execute = async (line: string) => (await executeRaw(line)).text
  const flush = async () => {
    for (let i = 0; i < 15; i++) {
      const count = pending.length
      await Promise.all(pending)
      await new Promise(resolve => setTimeout(resolve, 0))
      if (count === pending.length) return
    }
    throw new Error('pending transport did not drain')
  }
  local.set('pm-selected-project', 'p-0001')
  local.set('pm-view', 'tasks')
  let m!: ReactTestRenderer
  await act(async () => { m = create(createElement(PmPanel, { execute, executeRaw })); await flush() })
  mounts.push(m)
  expect(m.root.findAllByType(TaskTable)).toHaveLength(1)
  await act(async () => {
    find(m, 'className', 'pm-button pm-top-secondary pm-copilot-open').props.onClick()
    await flush()
  })
  expect(m.root.findAllByType(CopilotPanel)).toHaveLength(1)
  return { m, calls, responses, flush, snapshot: () => snapshot }
}
type Fixture = Awaited<ReturnType<typeof fixture>>
async function click(f: Fixture, key: string, value: unknown) {
  await act(async () => { find(f.m, key, value).props.onClick(); await f.flush() })
}
async function generate(f: Fixture) {
  for (const p of input.initial.projects) expect(projectRecordSchema.safeParse(p).success).toBe(true)
  for (const t of input.initial.tasks) expect(taskRecordSchema.safeParse(t).success).toBe(true)
  for (const t of input.external.tasks) expect(taskRecordSchema.safeParse(t).success).toBe(true)
  const parsed = parseCopilotPlan(input.askText)
  const valid = validatePlan(parsed.rawSteps, {
    taskIds: input.initial.tasks.filter((t: any) => t.projectId === 'p-0001').map((t: any) => t.id),
    milestoneIds: [], riskIds: [], deliverableIds: [], meetingIds: [],
  })
  expect(valid.rejected).toEqual([])
  expect(valid.steps.map(s => [s.stepId, s.action.id, s.needs]))
    .toEqual([['s1', 't-0001', []], ['s2', 't-0001', ['s1']], ['s3', 't-0002', []]])
  act(() => find(f.m, 'className', 'pm-copilot-input').props.onChange({ target: { value: '确认前外部改动冲突三步' } }))
  await click(f, 'aria-label', '发送')
  await click(f, 'id', 'cp-tab-draft')
  expect(f.m.root.findAll(n => n.type === 'input' && 'data-copilot-check' in n.props)).toHaveLength(3)
  expect(f.calls.filter(c => c.startsWith('ask-apply'))).toEqual([])
}
const applyCalls = (f: Fixture) => f.calls.filter(c => c.startsWith('ask-apply')).map(parseApply)

beforeEach(() => {
  local = new Map()
  formValues = new Map()
  vi.stubGlobal('localStorage', { getItem: (k: string) => local.get(k) ?? null,
    setItem: (k: string, v: string) => local.set(k, v), removeItem: (k: string) => local.delete(k) })
  vi.stubGlobal('window', { location: { hash: '', search: '', pathname: '/' }, addEventListener: noop,
    removeEventListener: noop, setTimeout, clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) })
  vi.stubGlobal('document', { activeElement: null, querySelector: () => null,
    addEventListener: noop, removeEventListener: noop, body: { dataset: {} } })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 1 })
  vi.stubGlobal('cancelAnimationFrame', noop)
  vi.stubGlobal('fetch', () => { throw new Error('network forbidden') })
  vi.stubGlobal('FormData', class {
    get(k: string) { return formValues.get(k) ?? null }
    getAll() { return [] }
  })
})
afterEach(() => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

it('PC-C01 控制：真实父子合法三步首次整批送原始base和needs', async () => {
  const f = await fixture()
  await generate(f)
  await click(f, 'className', 'pm-copilot-apply-main')
  expect(applyCalls(f)).toHaveLength(1)
  expect(applyCalls(f)[0].base).toEqual(selectedBase())
  expect(applyCalls(f)[0].actions.map((a: any) => [a.stepId, a.needs]))
    .toEqual([['s1', []], ['s2', ['s1']], ['s3', []]])
  record('PC-C01', { calls: f.calls, boundary: 'source transport contract, not backend acceptance' })
})

it('PC-C02 控制：真实逐步成功返回能连续发送三步', async () => {
  const f = await fixture()
  await generate(f)
  const button = f.m.root.findAll(n => n.type === 'button' && text(n) === '逐步执行')[0]
  expect(button).toBeTruthy()
  await act(async () => { button.props.onClick(); await f.flush() })
  expect(applyCalls(f).map(x => x.actions[0].stepId)).toEqual(['s1', 's2', 's3'])
  expect(applyCalls(f)[0].base).toEqual(selectedBase())
  record('PC-C02', { calls: f.calls, responses: f.responses })
})

it('PC-A01 红：生成后最小化正常TaskForm外改再展开确认必须保原base', async () => {
  const f = await fixture()
  await generate(f)
  const originalChild = f.m.root.findByType(CopilotPanel)
  await click(f, 'aria-label', '最小化为侧边标签（保留上下文）')
  act(() => f.m.root.findByType(TaskTable).props.onEdit(f.snapshot().tasks.find((t: any) => t.id === 't-0001')))
  const task = f.snapshot().tasks.find((t: any) => t.id === 't-0001')
  for (const [key, value] of Object.entries(task)) formValues.set(key, value)
  formValues.set('assignee', '确认前外部改派保留')
  const form = f.m.root.findAll(n => n.type === 'form' && n.props.className === 'pm-drawer-form')[0]
  expect(form).toBeTruthy()
  await act(async () => {
    form.props.onSubmit({ preventDefault: noop, currentTarget: { elements: { namedItem: () => null } } })
    await f.flush()
  })
  const update = f.calls.filter(c => c.startsWith('task update t-0001 '))
  expect(update).toHaveLength(1)
  expect(JSON.parse(update[0].slice('task update t-0001 '.length)).assignee).toBe('确认前外部改派保留')
  await click(f, 'aria-label', '展开 AI 副驾，保留此前上下文')
  expect(f.m.root.findByType(CopilotPanel)).toBe(originalChild)
  expect(f.m.root.findByType(CopilotPanel).props.baselineMap['t-0001'])
    .toBe(input.external.tasks.find((t: any) => t.id === 't-0001').updatedAt)
  expect(text(f.m.root)).toContain('你打开草稿后台账有变化')
  expect(find(f.m, 'data-copilot-edit', 's2.assignee').props.value).toBe('新句柄撤销甲')
  await click(f, 'className', 'pm-copilot-apply-main')
  expect(f.calls.filter(c => c.startsWith('ask p-0001 '))).toHaveLength(1)
  expect(applyCalls(f)).toHaveLength(1)
  record('PC-A01', { beforeBase: selectedBase(), sent: applyCalls(f), calls: f.calls })
  expect(applyCalls(f)[0].base).toEqual(selectedBase())
})

it('PC-A02 红：kind成功但s1应用0步不得继续发送依赖s2，独立s3继续', async () => {
  const f = await fixture(true)
  await generate(f)
  const button = f.m.root.findAll(n => n.type === 'button' && text(n) === '逐步执行')[0]
  expect(button).toBeTruthy()
  await act(async () => { button.props.onClick(); await f.flush() })
  expect(applyCalls(f)[0].base).toEqual(selectedBase())
  expect(JSON.stringify(f.responses)).toContain('已应用 0 步')
  record('PC-A02', { calls: f.calls, sent: applyCalls(f), responses: f.responses,
    boundary: 'injected command reply at transport; no original GUI failure claim' })
  expect(applyCalls(f).map(x => x.actions[0].stepId)).toEqual(['s1', 's3'])
})
