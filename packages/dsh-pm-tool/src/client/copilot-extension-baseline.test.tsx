import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PmPanel } from './panel.js'
import { CopilotPanel } from './shared/drawers/sidecar-portal.js'
import { parseCopilotPlan, validatePlan, type CopilotAction } from '../core/copilot.js'
import { projectRecordSchema } from '../core/project.js'
import { taskRecordSchema } from '../core/task.js'
import { milestoneWriteSchema, milestoneCreateSchema } from '../core/milestone.js'
import { riskIssueWriteSchema, riskIssueCreateSchema } from '../core/risk-issue.js'
import { deliverableRecordSchema, deliverableCreateSchema } from '../core/deliverable.js'
import { meetingRecordSchema, meetingCreateSchema } from '../core/meeting.js'

// 真实父子组件与生产校验；仅浏览器设施/传输替身，不证明后端落盘或 GUI。
const at = '2026-10-22T02:00:00.000Z'
const changedAt = '2026-10-22T02:01:00.000Z'
const noop = () => {}
const mounts: ReactTestRenderer[] = []
let selectedProject: string
let storage: Map<string, string>
const text = (node: ReactTestInstance): string => node.children.map(c =>
  typeof c === 'string' ? c : text(c)).join('')
const rows = [
  ['task', 'tasks', 't', { progress: 61 }],
  ['milestone', 'milestones', 'm', { status: 'planned' }],
  ['risk', 'riskIssues', 'ri', { title: '建议风险标题' }],
  ['deliverable', 'deliverables', 'dlv', { status: 'planned' }],
  ['meeting', 'meetings', 'mtg', { title: '建议会议标题' }],
] as const

function initialSnapshot() {
  const projects = ['p-0001', 'p-0002'].map((id, i) => projectRecordSchema.parse({
    id, name: `基线项目${i + 1}`, description: '', owner: '', status: 'active',
    startDate: '2026-10-01', targetDate: '2026-10-31', createdAt: at, updatedAt: at,
  }))
  const common = projects.map(p => ({ projectId: p.id, createdAt: at, updatedAt: at }))
  return {
    projects, reports: [],
    tasks: common.map((c, i) => taskRecordSchema.parse({ ...c, id: `t-000${i + 1}`,
      parentId: null, code: '1', order: 1, title: '已有任务', description: '', assignee: '',
      status: 'todo', priority: 'P1', progress: 0, milestoneId: null })),
    milestones: common.map((c, i) => milestoneWriteSchema.parse({ ...c, id: `m-000${i + 1}`,
      title: '已有里程碑', targetDate: '2026-10-31', description: '', status: 'planned', achievedDate: null })),
    riskIssues: common.map((c, i) => riskIssueWriteSchema.parse({ ...c, id: `ri-000${i + 1}`,
      title: '已有风险', type: 'risk', description: '', owner: '', dueDate: null,
      status: 'open', probability: 'low', impact: 'low', responsePlan: '', solution: '' })),
    deliverables: common.map((c, i) => deliverableRecordSchema.parse({ ...c, id: `dlv-000${i + 1}`,
      name: '已有交付物', version: '', owner: '', status: 'planned', location: '',
      description: '', dueDate: null, history: [] })),
    meetings: common.map((c, i) => meetingRecordSchema.parse({ ...c, id: `mtg-000${i + 1}`,
      title: '已有会议', meetingDate: '2026-10-22', startTime: null, durationMinutes: null,
      location: '', facilitator: '', recorder: '', participants: [], status: 'draft',
      summary: '', topics: [], decisions: [], actions: [], sourceType: 'manual', sourceSessionId: null })),
  }
}
type Fixture = Awaited<ReturnType<typeof fixture>>
const child = (f: Fixture) => f.m.root.findByType(CopilotPanel)
const node = (f: Fixture, key: string, value: unknown) => {
  const found = f.m.root.findAll(n => typeof n.type === 'string' && n.props[key] === value)
  expect(found, `${key}=${String(value)}`).toHaveLength(1)
  return found[0]
}
const click = async (f: Fixture, key: string, value: unknown) =>
  act(async () => { node(f, key, value).props.onClick(); await f.flush() })
const expectedBase = (projectId: string, stamp = at) => Object.fromEntries(
  rows.map(([, , prefix]) => [`${prefix}-000${projectId === 'p-0001' ? 1 : 2}`, stamp]),
)
const applyCalls = (f: Fixture) => f.calls.filter(c => c.startsWith('ask-apply ')).map(line => {
  const [raw, base] = line.slice(`ask-apply ${selectedProject} `.length).split(' --base ')
  return { actions: JSON.parse(raw), base: JSON.parse(base) }
})

async function fixture(action: CopilotAction, empty = false, chain?: 'success' | 'blocked') {
  let snapshot = initialSnapshot()
  if (empty) for (const [, collection] of rows) snapshot[collection] = []
  const plan = [{ stepId: 'e1', title: '父层基线确认', reason: '既有确认前冲突守卫', needs: [], action }]
  if (chain) {
    snapshot.tasks.push(taskRecordSchema.parse({ ...snapshot.tasks[0], id: 't-0003', code: '2', order: 2 }))
    plan.push(
      { stepId: 'e2', title: '同目标依赖', reason: '父层成功链', needs: ['e1'],
        action: { op: 'task.update', id: 't-0001', patch: { assignee: '链式负责人' } } },
      { stepId: 'e3', title: '独立目标', reason: '前置失败仍可独立', needs: [],
        action: { op: 'task.update', id: 't-0003', patch: { progress: 37 } } },
    )
  }
  const askText = '合法计划\n```json\n' + JSON.stringify({ plan }) + '\n```'
  const scoped = <T extends { projectId: string, id: string }>(records: T[]) =>
    records.filter(r => r.projectId === selectedProject).map(r => r.id)
  const valid = validatePlan(parseCopilotPlan(askText).rawSteps, {
    taskIds: scoped(snapshot.tasks), milestoneIds: scoped(snapshot.milestones),
    riskIds: scoped(snapshot.riskIssues), deliverableIds: scoped(snapshot.deliverables),
    meetingIds: scoped(snapshot.meetings),
  })
  expect(valid.rejected).toEqual([])
  expect(valid.steps).toHaveLength(plan.length)
  const calls: string[] = []
  const acceptedSteps: string[] = []
  const pending: Promise<unknown>[] = []
  const dispatch = async (line: string) => {
    calls.push(line)
    if (line === 'web snapshot') return { kind: 'success', text: JSON.stringify(snapshot) }
    if (line === 'model status') return { kind: 'success', text: '当前模式：prod' }
    if (line.startsWith('ask-provenance ')) return { kind: 'success', text: '{"entries":[]}' }
    if (line.startsWith(`ask ${selectedProject} `)) return { kind: 'success', text: askText }
    if (line === 'ask-undo list') return { kind: 'success', text: '{"undoIds":[]}' }
    if (line.startsWith(`ask-apply ${selectedProject} `)) {
      // 首发用例明确应用0；链式用例仅在内存替身校验base并模拟单调成功，无落盘/句柄。
      const [actions, rawBase] = line.slice(`ask-apply ${selectedProject} `.length).split(' --base ')
      const a = JSON.parse(actions)[0], base = JSON.parse(rawBase)
      const task = snapshot.tasks.find(t => t.id === a.id && t.projectId === selectedProject)
      if (!chain || (chain === 'blocked' && a.stepId === 'e1') || !task || base[a.id] !== task.updatedAt)
        return { kind: 'success', text: '已应用 0 步；未执行 1 步' }
      acceptedSteps.push(a.stepId)
      Object.assign(task, a.patch, { updatedAt: `2026-10-22T02:0${acceptedSteps.length + 1}:00.000Z` })
      taskRecordSchema.parse(task)
      return { kind: 'success', text: '已应用 1 步' }
    }
    throw new Error(`未授权基线传输：${line}`)
  }
  const raw = (line: string) => {
    const promise = dispatch(line)
    pending.push(promise.catch(noop))
    return promise
  }
  const execute = async (line: string) => (await raw(line)).text
  const flush = async () => {
    for (let i = 0; i < 20; i++) {
      const n = pending.length
      await Promise.all(pending); await new Promise(r => setTimeout(r, 0))
      if (n === pending.length) return
    }
    throw new Error('父层传输未排空')
  }
  let m!: ReactTestRenderer
  await act(async () => { m = create(createElement(PmPanel, { execute, executeRaw: raw })); await flush() })
  mounts.push(m)
  const f = { m, calls, flush, acceptedSteps, externalChange: () => {
    for (const [, collection] of rows) for (const r of snapshot[collection]) {
      r.updatedAt = changedAt
      if ('title' in r) r.title = '正常刷新最新标题'
      if ('name' in r) r.name = '正常刷新最新交付物'
    }
  } }
  await click(f, 'className', 'pm-button pm-top-secondary pm-copilot-open')
  expect(child(f).props.projectId).toBe(selectedProject)
  return f
}
async function generate(f: Fixture) {
  await click(f, 'id', 'cp-tab-diag')
  act(() => node(f, 'className', 'pm-copilot-input').props.onChange({ target: { value: '生成合法基线计划' } }))
  await click(f, 'aria-label', '发送')
  await click(f, 'id', 'cp-tab-draft')
  expect(node(f, 'data-copilot-check', 'e1').props.checked).toBe(true)
}
async function refreshChanged(f: Fixture) {
  const originalChild = child(f)
  f.externalChange()
  await click(f, 'aria-label', '刷新数据')
  expect(child(f)).toBe(originalChild)
  expect(child(f).props.baselineMap).toEqual(expectedBase(selectedProject, changedAt))
  for (const [, collection] of rows) {
    expect(child(f).props[collection]).toHaveLength(1)
    expect(child(f).props[collection][0].updatedAt).toBe(changedAt)
  }
}
beforeEach(() => {
  selectedProject = 'p-0001'
  storage = new Map([['pm-selected-project', selectedProject], ['pm-view', 'tasks']])
  vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) })
  vi.stubGlobal('window', { location: { hash: '', search: '', pathname: '/' }, addEventListener: noop,
    removeEventListener: noop, setTimeout, clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) })
  vi.stubGlobal('document', { activeElement: null, querySelector: () => null, addEventListener: noop,
    removeEventListener: noop, body: { dataset: {} } })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 1 })
  vi.stubGlobal('cancelAnimationFrame', noop)
  vi.stubGlobal('fetch', () => { throw new Error('父层基线测试禁止网络') })
})
afterEach(() => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

it.each(rows)('EB01 %s 初发包含五类既有基线且不含其他项目', async (entity, collection, prefix, patch) => {
  const f = await fixture({ op: `${entity}.update`, id: `${prefix}-0001`, patch })
  expect(child(f).props[collection]).toHaveLength(1)
  expect(child(f).props.baselineMap).toEqual(expectedBase(selectedProject))
  await generate(f)
  expect(applyCalls(f)).toEqual([])
  await click(f, 'data-copilot-apply-batch', true)
  expect(applyCalls(f)).toHaveLength(1)
  expect(applyCalls(f)[0].base).toEqual(expectedBase(selectedProject))
  expect(applyCalls(f)[0].actions).toEqual([
    { op: `${entity}.update`, id: `${prefix}-0001`, patch, stepId: 'e1', title: '父层基线确认', needs: [] },
  ])
})

it.each(rows)('EB02 %s 生成后正常父层刷新只改props、确认仍送原base', async (entity, collection, prefix, patch) => {
  const f = await fixture({ op: `${entity}.update`, id: `${prefix}-0001`, patch })
  await generate(f)
  await refreshChanged(f)
  const latest = child(f).props[collection][0]
  expect(latest.title ?? latest.name).toBe(collection === 'deliverables' ? '正常刷新最新交付物' : '正常刷新最新标题')
  expect(applyCalls(f)).toEqual([])
  await click(f, 'data-copilot-apply-batch', true)
  expect(applyCalls(f)).toHaveLength(1)
  expect(applyCalls(f)[0].base).toEqual(expectedBase(selectedProject))
  expect(f.calls.filter(c => c.startsWith('ask p-0001 '))).toHaveLength(1)
})

it.each(rows)('EB03 %s 取消零apply、正常刷新再生成使用新base', async (entity, collection, prefix, patch) => {
  const f = await fixture({ op: `${entity}.update`, id: `${prefix}-0001`, patch })
  await generate(f)
  await click(f, 'data-copilot-cancel', true)
  expect(f.m.root.findAll(n => n.props['data-copilot-check'] === 'e1')).toHaveLength(0)
  expect(applyCalls(f)).toEqual([])
  await refreshChanged(f)
  expect(child(f).props[collection][0].updatedAt).toBe(changedAt)
  await generate(f)
  expect(applyCalls(f)).toEqual([])
  await click(f, 'data-copilot-apply-batch', true)
  expect(applyCalls(f)).toHaveLength(1)
  expect(applyCalls(f)[0].base).toEqual(expectedBase(selectedProject, changedAt))
  expect(f.calls.filter(c => c.startsWith('ask p-0001 '))).toHaveLength(2)
})

const creates = [
  ['milestone', { title: '新里程碑', targetDate: '2026-10-31' }, milestoneCreateSchema],
  ['risk', { type: 'risk', title: '新风险', impact: 'low', probability: 'low' }, riskIssueCreateSchema],
  ['deliverable', { name: '新交付物' }, deliverableCreateSchema],
  ['meeting', { title: '新会议', meetingDate: '2026-10-22' }, meetingCreateSchema],
] as const
it.each(creates)('EB04 %s 空项目create不伪造旧id/base，不改变动作协议', async (entity, patch, schema) => {
  expect(schema.safeParse({ projectId: selectedProject, ...patch }).success).toBe(true)
  const f = await fixture({ op: `${entity}.create`, patch }, true)
  expect(child(f).props.baselineMap).toEqual({})
  await generate(f)
  expect(applyCalls(f)).toEqual([])
  await click(f, 'data-copilot-apply-batch', true)
  expect(applyCalls(f)).toHaveLength(1)
  expect(applyCalls(f)[0]).toEqual({
    base: {}, actions: [{ op: `${entity}.create`, patch, stepId: 'e1', title: '父层基线确认', needs: [] }],
  })
})

it('EB05 第二项目只收自身五类基线', async () => {
  selectedProject = 'p-0002'
  storage.set('pm-selected-project', selectedProject)
  const f = await fixture({ op: 'milestone.update', id: 'm-0002', patch: { status: 'planned' } })
  await generate(f)
  await click(f, 'data-copilot-apply-batch', true)
  expect(applyCalls(f)[0].base).toEqual(expectedBase(selectedProject))
  expect(Object.keys(applyCalls(f)[0].base)).not.toContain('m-0001')
})

it('EB06 生成前父层刷新从最新props捕获五类base', async () => {
  const f = await fixture({ op: 'meeting.update', id: 'mtg-0001', patch: { title: '建议会议标题' } })
  await refreshChanged(f)
  await generate(f)
  await click(f, 'data-copilot-apply-batch', true)
  expect(applyCalls(f)[0].base).toEqual(expectedBase(selectedProject, changedAt))
})

async function stepwise(f: Fixture) {
  const buttons = f.m.root.findAll(n => n.type === 'button' && text(n) === '逐步执行')
  expect(buttons).toHaveLength(1)
  await act(async () => { buttons[0].props.onClick(); await f.flush() })
}
it('EB07 丰富父层任务成功链仅推进成功task，其余四类base不变', async () => {
  const f = await fixture({ op: 'task.update', id: 't-0001', patch: { progress: 61 } }, false, 'success')
  await generate(f)
  await stepwise(f)
  expect(f.acceptedSteps).toEqual(['e1', 'e2', 'e3'])
  const sent = applyCalls(f)
  expect(sent.map(s => s.actions[0].stepId)).toEqual(['e1', 'e2', 'e3'])
  const originalBase = { ...expectedBase(selectedProject), 't-0003': at }
  expect(sent[0].base).toEqual(originalBase)
  expect(sent[1].base).toEqual({ ...originalBase, 't-0001': '2026-10-22T02:02:00.000Z' })
  expect(sent[2].base).toEqual({ ...originalBase, 't-0001': '2026-10-22T02:03:00.000Z' })
})
it('EB08 丰富父层应用0不发送task依赖，独立task仍送原五类base', async () => {
  const f = await fixture({ op: 'task.update', id: 't-0001', patch: { progress: 61 } }, false, 'blocked')
  await generate(f)
  await stepwise(f)
  expect(f.acceptedSteps).toEqual(['e3'])
  const sent = applyCalls(f)
  expect(sent.map(s => s.actions[0].stepId)).toEqual(['e1', 'e3'])
  const originalBase = { ...expectedBase(selectedProject), 't-0003': at }
  expect(sent[0].base).toEqual(originalBase)
  expect(sent[1].base).toEqual(originalBase)
})
