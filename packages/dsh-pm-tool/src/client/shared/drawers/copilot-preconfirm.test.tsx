import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CopilotPanel } from './sidecar-portal.js'
import { taskRecordSchema } from '../../../core/task.js'
import { milestoneWriteSchema } from '../../../core/milestone.js'
import { riskIssueWriteSchema } from '../../../core/risk-issue.js'
import { deliverableRecordSchema } from '../../../core/deliverable.js'
import { meetingRecordSchema } from '../../../core/meeting.js'
import { parseCopilotPlan, validatePlan, type CopilotStep } from '../../../core/copilot.js'
import type { Task } from '../../panel.js'

// 真实副驾组件；仅传输与浏览器设施为桩，不声明后端/GUI/独立验收通过。
const at = '2026-10-22T00:00:00.000Z'
const next = '2026-10-22T00:01:00.000Z'
const external = '2026-10-22T00:02:00.000Z'
const noop = () => {}
const mounts: ReactTestRenderer[] = []
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
const step = (stepId: string, id: string, needs: string[] = [], op = 'task.update'): CopilotStep => ({
  stepId, title: stepId, reason: '隔离回归', needs,
  action: { op, id, patch: op === 'task.update' ? { progress: 73 } : { status: 'planned' } },
})
const three = () => [step('s1', 't-0001'), step('s2', 't-0001', ['s1']), step('s3', 't-0002')]
type Reply = { kind: string, text: string }
type RecordRow = { id: string, projectId: string, updatedAt: string }
type Options = {
  plan?: CopilotStep[]
  result?: (index: number) => Reply
  throwFirst?: boolean
  staleUndo?: boolean
  noUndoAt?: boolean
  failSnapshot?: boolean
  failUndo?: boolean
}
async function fixture(o: Options = {}) {
  const tasks = ['t-0001', 't-0002'].map((id, i) => taskRecordSchema.parse({
    id, projectId: 'p-0001', parentId: null, code: String(i + 1), title: id, description: '', assignee: '原负责人',
    status: 'todo', priority: 'P1', progress: 0, milestoneId: null, order: 1, createdAt: at, updatedAt: at,
  })) as Task[]
  const common = { projectId: 'p-0001', createdAt: at, updatedAt: at }
  const initial = { tasks,
    milestones: [milestoneWriteSchema.parse({ ...common, id: 'm-0001', title: '里程碑', description: '',
      status: 'planned', targetDate: '2026-10-31', achievedDate: null })],
    riskIssues: [riskIssueWriteSchema.parse({ ...common, id: 'ri-0001', title: '风险', type: 'risk',
      description: '', owner: '', dueDate: null, status: 'open', probability: 'low', impact: 'low',
      responsePlan: '', solution: '' })],
    deliverables: [deliverableRecordSchema.parse({ ...common, id: 'dlv-0001', name: '交付物', version: '',
      owner: '', status: 'planned', location: '', description: '', dueDate: null, history: [] })],
    meetings: [meetingRecordSchema.parse({ ...common, id: 'mtg-0001', title: '会议', meetingDate: '2026-10-22',
      startTime: null, durationMinutes: null, location: '', facilitator: '', recorder: '', participants: [],
      status: 'draft', summary: '', topics: [], decisions: [], actions: [], sourceType: 'manual', sourceSessionId: null })],
  }
  let snapshot = structuredClone(initial)
  let liveBase = Object.fromEntries(Object.values(initial).flat().map(r => [r.id, r.updatedAt]))
  const plan = o.plan ?? three()
  const askText = 't-0001 只读状态\n```json\n' + JSON.stringify({ plan }) + '\n```'
  const parsed = parseCopilotPlan(askText)
  const valid = validatePlan(parsed.rawSteps, { taskIds: tasks.map(t => t.id), milestoneIds: ['m-0001'],
    riskIds: ['ri-0001'], deliverableIds: ['dlv-0001'], meetingIds: ['mtg-0001'] })
  expect(valid.rejected).toEqual([])
  expect(valid.steps.map(s => s.stepId)).toEqual(plan.map(s => s.stepId))
  const originalBase = { ...liveBase }
  const calls: string[] = []
  const pending: Promise<unknown>[] = []
  const tableOf: Record<string, keyof typeof snapshot> = {
    task: 'tasks', milestone: 'milestones', risk: 'riskIssues', deliverable: 'deliverables', meeting: 'meetings',
  }
  let count = 0
  let freshAt = 0
  const dispatch = async (line: string): Promise<Reply> => {
    calls.push(line)
    if (line === 'model status') return { kind: 'success', text: '当前模式：prod' }
    if (line.startsWith('ask-provenance')) return { kind: 'success', text: '{"entries":[]}' }
    if (line.startsWith('ask p-0001 ')) return { kind: 'success', text: askText }
    if (line === 'ask-undo list') {
      if (o.failUndo) throw new Error('撤销列表不可用')
      return { kind: 'success', text: JSON.stringify({ undoIds: [
        { id: `undo-inert-${count}`, ...(o.noUndoAt ? {} : { at: o.staleUndo ? 1 : freshAt }) },
        { id: 'undo-old-inert', at: 1 },
      ] }) }
    }
    if (line === 'web snapshot') {
      if (o.failSnapshot) throw new Error('快照不可用')
      return { kind: 'success', text: JSON.stringify(snapshot) }
    }
    if (line.startsWith('ask-apply p-0001 ')) {
      count++
      if (o.throwFirst && count === 1) throw new Error('第一步传输失败')
      const payload = parseApply(line)
      const result = o.result?.(count) ?? { kind: 'success', text: `已应用 ${payload.actions.length} 步` }
      freshAt = Date.now()
      // 所有快照都带外改t2/扩展键；不能把无关目标的最新值洗入执行基线。
      snapshot.tasks[1].updatedAt = external
      for (const table of ['milestones', 'riskIssues', 'deliverables', 'meetings'] as const)
        snapshot[table][0].updatedAt = external
      if (/^已应用 [1-9]\d* 步/.test(result.text) && result.kind === 'success') {
        for (const a of payload.actions) {
          const row = (snapshot[tableOf[a.op.split('.')[0]]] as RecordRow[]).find(r => r.id === a.id)
          if (row) row.updatedAt = next
        }
      }
      return result
    }
    throw new Error(`禁止传输：${line}`)
  }
  const executeRaw = (line: string) => {
    const p = dispatch(line)
    pending.push(p.catch(noop))
    return p
  }
  const execute = async (line: string) => (await executeRaw(line)).text
  const onSaved = vi.fn(async () => true)
  const flush = async () => {
    for (let i = 0; i < 15; i++) {
      const before = pending.length
      await Promise.all(pending)
      await new Promise(r => setTimeout(r, 0))
      if (before === pending.length) return
    }
    throw new Error('未排空异步传输')
  }
  let m!: ReactTestRenderer
  let mode: 'diagnosis' | 'draft' = 'diagnosis'
  const render = () => createElement(CopilotPanel, { projectId: 'p-0001', ...initial,
    tasks: snapshot.tasks, baselineMap: liveBase, execute, executeRaw, disabled: false, onSaved, mode,
    onModeChange: value => { mode = value; m.update(render()) } })
  await act(async () => { m = create(render()); await flush() })
  mounts.push(m)
  const node = (key: string, value: unknown) => {
    const all = m.root.findAll(n => typeof n.type === 'string' && n.props[key] === value)
    expect(all, `${key}=${String(value)}`).toHaveLength(1)
    return all[0]
  }
  const click = async (key: string, value: unknown) => {
    await act(async () => { node(key, value).props.onClick(); await flush() })
  }
  const generate = async () => {
    await click('id', 'cp-tab-diag')
    act(() => node('className', 'pm-copilot-input').props.onChange({ target: { value: '生成既有计划' } }))
    await click('aria-label', '发送')
    await click('id', 'cp-tab-draft')
  }
  const replaceLive = () => {
    snapshot.tasks[0] = { ...snapshot.tasks[0], assignee: '外部负责人', progress: 18, updatedAt: external }
    liveBase = Object.fromEntries(Object.values(snapshot).flat().map(r => [r.id, r.updatedAt]))
    act(() => m.update(render()))
  }
  return { m, calls, node, click, generate, originalBase, replaceLive, onSaved,
    apply: (kind: 'batch' | 'stepwise') => click(`data-copilot-apply-${kind}`, true),
    payloads: () => calls.filter(c => c.startsWith('ask-apply')).map(parseApply) }
}
function parseApply(line: string) {
  const [actions, base] = line.slice('ask-apply p-0001 '.length).split(' --base ')
  return { actions: JSON.parse(actions) as { op: string, id: string, stepId: string, needs: string[], patch: Record<string, unknown> }[],
    base: JSON.parse(base) as Record<string, string> }
}
beforeEach(() => {
  vi.stubGlobal('fetch', () => { throw new Error('禁止网络') })
})
afterEach(() => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

describe('PC01/PC02 开发回归（真实副驾，非独立PASS）', () => {
  it('确认首步保生成基线；最新只读投影仍显示外改', async () => {
    const f = await fixture()
    await f.generate(); f.replaceLive()
    expect(text(f.m.root)).toContain('你打开草稿后台账有变化')
    await f.click('id', 'cp-tab-diag')
    expect(text(f.m.root)).toContain('负责人：外部负责人')
    expect(text(f.m.root)).toContain('进度：18%')
    await f.click('id', 'cp-tab-draft'); await f.apply('batch')
    expect(f.payloads()[0].base).toEqual(f.originalBase)
    expect(f.calls.filter(c => c.startsWith('ask p-0001 '))).toHaveLength(1)
  })
  it('成功链式仅推进t1；独立t2及四扩展的原基线全部保留', async () => {
    const f = await fixture()
    await f.generate(); await f.apply('stepwise')
    const sent = f.payloads()
    expect(sent.map(x => x.actions[0].stepId)).toEqual(['s1', 's2', 's3'])
    expect(sent[0].base).toEqual(f.originalBase)
    expect(sent[1].base).toEqual({ ...f.originalBase, 't-0001': next })
    expect(sent[2].base).toEqual({ ...f.originalBase, 't-0001': next })
    expect(sent.map(x => x.actions[0].needs)).toEqual([[], [], []])
  })
  it.each([
    { kind: 'success', text: '已应用 0 步；未执行 1 步' },
    { kind: 'error', text: '已应用 1 步但返回错误' },
    { kind: 'success', text: '该计划已执行过（幂等拦截）' },
    { kind: 'success', text: '未知成功文本' },
  ])('首步未确证应用时不发依赖/不捞旧undo，独立继续：$text', async reply => {
    const f = await fixture({ result: index => index === 1 ? reply : { kind: 'success', text: '已应用 1 步' } })
    await f.generate(); await f.apply('stepwise')
    expect(f.payloads().map(x => x.actions[0].stepId)).toEqual(['s1', 's3'])
    expect(f.payloads()[1].base).toEqual(f.originalBase)
    expect(f.calls.filter(c => c === 'ask-undo list')).toHaveLength(1)
    await f.click('id', 'cp-tab-diag')
    expect(text(f.m.root)).toContain('s2：依赖步骤未执行，已跳过')
  })
  it('传输抛错也不发下游，但不阻断独立目标', async () => {
    const f = await fixture({ throwFirst: true })
    await f.generate(); await f.apply('stepwise')
    expect(f.payloads().map(x => x.actions[0].stepId)).toEqual(['s1', 's3'])
    expect(f.calls.filter(c => c === 'ask-undo list')).toHaveLength(1)
  })
  it('前置未勾选时不发依赖；行内编辑原样保留', async () => {
    const f = await fixture()
    await f.generate()
    act(() => f.node('data-copilot-check', 's1').props.onChange({ target: { checked: false } }))
    act(() => f.node('data-copilot-edit', 's3.progress').props.onChange({ target: { value: '44' } }))
    await f.apply('stepwise')
    expect(f.payloads().map(x => x.actions[0].stepId)).toEqual(['s3'])
    expect(f.payloads()[0].actions[0].patch.progress).toBe(44)
    expect(f.payloads()[0].base).toEqual(f.originalBase)
  })
  it('取消零写，明确再生成才采纳新基线', async () => {
    const f = await fixture()
    await f.generate(); f.replaceLive(); await f.click('data-copilot-cancel', true)
    expect(f.payloads()).toEqual([])
    expect(f.calls).not.toContain('ask-undo list')
    await f.generate(); await f.apply('batch')
    expect(f.payloads()[0].base['t-0001']).toBe(external)
    expect(f.calls.filter(c => c.startsWith('ask p-0001 '))).toHaveLength(2)
  })
  it.each(['milestone', 'risk', 'deliverable', 'meeting'])('四扩展同目标成功链式保其他键：%s', async entity => {
    const ids: Record<string, string> = { milestone: 'm-0001', risk: 'ri-0001', deliverable: 'dlv-0001', meeting: 'mtg-0001' }
    const id = ids[entity]
    const patch = entity === 'risk' ? { title: '更新风险' } : entity === 'meeting' ? { title: '更新会议' } : { status: 'planned' }
    const plan = [step('e1', id, [], `${entity}.update`), step('e2', id, ['e1'], `${entity}.update`), step('s3', 't-0002')]
    for (const s of plan.slice(0, 2)) s.action.patch = patch
    const f = await fixture({ plan })
    await f.generate(); await f.apply('stepwise')
    expect(f.payloads()[0].base).toEqual(f.originalBase)
    expect(f.payloads()[1].base).toEqual({ ...f.originalBase, [id]: next })
    expect(f.payloads()[2].base).toEqual({ ...f.originalBase, [id]: next })
  })
  it.each([
    { result: () => ({ kind: 'success', text: '已应用 0 步' }) },
    { result: () => ({ kind: 'error', text: '拒绝' }) },
  ])('整批没有实际应用不查询undo', async options => {
    const f = await fixture(options)
    await f.generate(); await f.apply('batch')
    expect(f.calls).not.toContain('ask-undo list')
    expect(f.m.root.findAll(n => n.props.className === 'pm-copilot-undo-btn')).toHaveLength(0)
  })
  it.each([{ staleUndo: true }, { noUndoAt: true }])('成功但列表只有旧/无时点句柄不伪造freshundo', async options => {
    const f = await fixture(options)
    await f.generate(); await f.apply('batch')
    expect(f.calls.filter(c => c === 'ask-undo list')).toHaveLength(1)
    expect(f.m.root.findAll(n => n.props.className === 'pm-copilot-undo-btn')).toHaveLength(0)
  })
  it('mixed实际1步仅显示1步freshundo，不自动执行撤销', async () => {
    const f = await fixture({ result: () => ({ kind: 'success', text: '已应用 1 步；未执行 2 步' }) })
    await f.generate(); await f.apply('batch')
    const buttons = f.m.root.findAll(n => n.props.className === 'pm-copilot-undo-btn')
    expect(buttons).toHaveLength(1)
    expect(text(buttons[0])).toContain('整批 1 步')
    expect(f.calls.some(c => /^ask-undo(?! list)/.test(c))).toBe(false)
  })
  it.each([{ failSnapshot: true }, { failUndo: true }])('只读设施失败不把无关base洗白/不阻断独立继续', async options => {
    const f = await fixture(options)
    await f.generate(); await f.apply('stepwise')
    expect(f.payloads().map(x => x.actions[0].stepId)).toEqual(['s1', 's2', 's3'])
    expect(f.payloads()[2].base['t-0002']).toBe(at)
    if (options.failSnapshot) expect(f.payloads()[1].base['t-0001']).toBe(at)
  })
})
