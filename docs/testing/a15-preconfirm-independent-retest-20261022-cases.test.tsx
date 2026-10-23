import { appendFileSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CopilotPanel } from '../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.js'
import { parseCopilotPlan, validatePlan, type CopilotStep } from '../../packages/dsh-pm-tool/src/core/copilot.js'
import { taskRecordSchema } from '../../packages/dsh-pm-tool/src/core/task.js'
import { milestoneWriteSchema } from '../../packages/dsh-pm-tool/src/core/milestone.js'
import { riskIssueWriteSchema } from '../../packages/dsh-pm-tool/src/core/risk-issue.js'
import { deliverableRecordSchema } from '../../packages/dsh-pm-tool/src/core/deliverable.js'
import { meetingRecordSchema } from '../../packages/dsh-pm-tool/src/core/meeting.js'

const replay = JSON.parse(readFileSync(process.env.PC_INPUT!, 'utf8'))
const at = '2026-10-22T01:00:00.000Z'
const changedAt = '2026-10-22T01:01:00.000Z'
const stamps = ['2026-10-22T01:00:01.000Z', '2026-10-22T01:00:02.000Z', '2026-10-22T01:00:03.000Z']
const ids = { task: 't-0001', milestone: 'm-0001', risk: 'ri-0001', deliverable: 'dlv-0001', meeting: 'mtg-0001' }
const tables = { task: 'tasks', milestone: 'milestones', risk: 'riskIssues', deliverable: 'deliverables', meeting: 'meetings' } as const
type Entity = keyof typeof ids
type Row = { id: string, projectId: string, updatedAt: string, [key: string]: unknown }
type Reply = { kind: string, text: string }
type Payload = { actions: { op: string, id: string, patch: Record<string, unknown>, stepId: string, needs: string[] }[], base: Record<string, string> }
type Options = { entity?: Entity, firstReply?: Reply, throwFirst?: boolean, omitFirst?: boolean,
  snapshot?: 'throw' | 'wrong-project' | 'missing', undo?: 'old' | 'future' | 'no-at' | 'error' | 'delayed',
  externalOthers?: boolean, mixed?: boolean, grandchild?: boolean }
const noop = () => {}
const mounts: ReactTestRenderer[] = []
const records: (() => unknown)[] = []
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
const parse = (line: string): Payload => {
  const [a, b] = line.slice('ask-apply p-0001 '.length).split(' --base ')
  return { actions: JSON.parse(a), base: JSON.parse(b) }
}
const action = (stepId: string, entity: Entity, id: string, needs: string[], patch: Record<string, unknown>): CopilotStep =>
  ({ stepId, title: `独立${stepId}`, reason: '既有合同独立复验', needs, action: { op: `${entity}.update`, id, patch } })

async function fixture(o: Options = {}) {
  const entity = o.entity ?? 'task'
  const targetId = ids[entity]
  const tasks = replay.initial.tasks.filter((t: Row) => t.projectId === 'p-0001').map((t: Row) =>
    taskRecordSchema.parse({ ...t, status: 'todo', progress: 0, assignee: '独立初态', createdAt: at, updatedAt: at }))
  const common = { projectId: 'p-0001', createdAt: at, updatedAt: at }
  const seed = {
    tasks,
    milestones: [milestoneWriteSchema.parse({ ...common, id: ids.milestone, title: '独立里程碑',
      description: '', status: 'planned', targetDate: '2026-10-31', achievedDate: null })],
    riskIssues: [riskIssueWriteSchema.parse({ ...common, id: ids.risk, title: '独立风险', type: 'risk',
      description: '', owner: '', dueDate: null, status: 'open', probability: 'low', impact: 'low', responsePlan: '', solution: '' })],
    deliverables: [deliverableRecordSchema.parse({ ...common, id: ids.deliverable, name: '独立交付物',
      version: '', owner: '', status: 'planned', location: '', description: '', dueDate: null, history: [] })],
    meetings: [meetingRecordSchema.parse({ ...common, id: ids.meeting, title: '独立会议',
      meetingDate: '2026-10-22', startTime: null, durationMinutes: null, location: '', facilitator: '',
      recorder: '', participants: [], status: 'draft', summary: '', topics: [], decisions: [], actions: [],
      sourceType: 'manual', sourceSessionId: null })],
  }
  const state = structuredClone(seed) as unknown as Record<string, Row[]>
  const baseOf = () => Object.fromEntries(Object.values(state).flat().map(r => [r.id, r.updatedAt]))
  const originalBase = baseOf()
  let liveBase = baseOf()
  const patch = entity === 'task' ? { progress: 71 } : entity === 'risk' || entity === 'meeting'
    ? { title: '独立更新标题' } : { status: 'planned' }
  const plan = [action('s1', entity, targetId, [], patch),
    action('s2', entity, targetId, ['s1'], entity === 'task' ? { assignee: '独立链式负责人' } : patch),
    action('s3', 'task', 't-0002', [], { progress: 44 }),
    ...(o.grandchild ? [action('s4', 'task', 't-0002', ['s2'], { assignee: '不应发送' })] : [])]
  const askText = `t-0001 只读诊断\n\`\`\`json\n${JSON.stringify({ plan })}\n\`\`\``
  const validated = validatePlan(parseCopilotPlan(askText).rawSteps, { taskIds: tasks.map(t => t.id),
    milestoneIds: [ids.milestone], riskIds: [ids.risk], deliverableIds: [ids.deliverable], meetingIds: [ids.meeting] })
  expect(validated.rejected).toEqual([])
  expect(validated.steps.map(s => s.stepId)).toEqual(plan.map(s => s.stepId))
  const calls: string[] = []
  const replies: { line: string, reply?: Reply, error?: string }[] = []
  const pending: Promise<unknown>[] = []
  let applyIndex = 0
  let freshAt = 0
  let freshId = ''
  let mode: 'draft' | 'diagnosis' = 'diagnosis'
  let m!: ReactTestRenderer
  const externalOthers = () => {
    for (const r of Object.values(state).flat().filter(r => r.id !== targetId)) r.updatedAt = changedAt
    state.tasks.find(r => r.id === 't-0002')!.assignee = '独立外改保留'
  }
  // 这是明确的内存传输 double，不调用或冒充真实后端；它拒绝不匹配 base。
  const dispatch = async (line: string): Promise<Reply> => {
    calls.push(line)
    if (line === 'model status') return { kind: 'success', text: '当前模式：prod' }
    if (line.startsWith('ask-provenance ')) return { kind: 'success', text: '{"entries":[]}' }
    if (line.startsWith('ask p-0001 ')) return { kind: 'success', text: askText }
    if (line === 'ask-undo list') {
      if (o.undo === 'error') throw new Error('独立撤销读取失败')
      if (o.undo === 'delayed') await new Promise(r => setTimeout(r, 5))
      const undoAt = o.undo === 'old' ? 1 : o.undo === 'future' ? Date.now() + 60000 :
        o.undo === 'delayed' ? Date.now() : freshAt
      return { kind: 'success', text: JSON.stringify({ undoIds: [
        { id: 'undo-independent-old', at: 1 }, { id: freshId, ...(o.undo === 'no-at' ? {} : { at: undoAt }) },
      ] }) }
    }
    if (/^ask-undo undo-independent-/.test(line)) return { kind: 'success', text: '独立传输撤销响应（非落盘）' }
    if (line === 'web snapshot') {
      if (o.snapshot === 'throw') throw new Error('独立snapshot失败')
      const returned = structuredClone(state)
      if (o.snapshot === 'wrong-project') returned[tables[entity]].find(r => r.id === targetId)!.projectId = 'p-0002'
      if (o.snapshot === 'missing') returned[tables[entity]] = returned[tables[entity]].filter(r => r.id !== targetId)
      return { kind: 'success', text: JSON.stringify(returned) }
    }
    if (line.startsWith('ask-apply p-0001 ')) {
      applyIndex++
      if (o.throwFirst && applyIndex === 1) throw new Error('独立首步传输失败')
      const sent = parse(line)
      if (applyIndex === 1 && o.firstReply) {
        if (o.externalOthers) externalOthers()
        return o.firstReply
      }
      const accepted = sent.actions.filter(a => {
        const row = state[tables[a.op.split('.')[0] as Entity]].find(r => r.id === a.id)
        return row && row.projectId === 'p-0001' && sent.base[a.id] === row.updatedAt
      })
      const selected = o.mixed ? accepted.filter(a => a.stepId === 's3') : accepted
      for (const a of selected) {
        const row = state[tables[a.op.split('.')[0] as Entity]].find(r => r.id === a.id)!
        Object.assign(row, a.patch, { updatedAt: stamps[Math.min(applyIndex - 1, 2)] })
      }
      if (o.externalOthers && applyIndex === 1) externalOthers()
      if (selected.length) { freshAt = Date.now(); freshId = `undo-independent-${applyIndex}` }
      return { kind: 'success', text: `已应用 ${selected.length} 步；未执行 ${sent.actions.length - selected.length} 步` }
    }
    throw new Error(`未经授权的传输：${line}`)
  }
  const raw = (line: string) => {
    const p = dispatch(line).then(reply => { replies.push({ line, reply }); return reply },
      e => { replies.push({ line, error: String(e) }); throw e })
    pending.push(p.catch(noop))
    return p
  }
  const execute = async (line: string) => (await raw(line)).text
  const flush = async () => {
    for (let i = 0; i < 20; i++) {
      const n = pending.length
      await Promise.all(pending)
      await new Promise(r => setTimeout(r, 0))
      if (n === pending.length) return
    }
    throw new Error('独立设施未排空')
  }
  const saved = vi.fn(async () => {
    liveBase = baseOf()
    m.update(render())
    return true
  })
  const render = () => createElement(CopilotPanel, { projectId: 'p-0001', ...structuredClone(state),
    tasks: structuredClone(state.tasks) as any, baselineMap: liveBase, execute, executeRaw: raw,
    disabled: false, onSaved: saved, mode, onModeChange: next => { mode = next; m.update(render()) } })
  await act(async () => { m = create(render()); await flush() })
  mounts.push(m)
  records.push(() => ({ options: o, originalBase, calls, replies, final: state,
    boundary: 'React + in-memory base-enforcing transport double, no backend/GUI/storage acceptance' }))
  const node = (key: string, value: unknown) => {
    const found = m.root.findAll(n => typeof n.type === 'string' && n.props[key] === value)
    expect(found, `独立selector ${key}=${String(value)}`).toHaveLength(1)
    return found[0]
  }
  const click = async (key: string, value: unknown) =>
    act(async () => { node(key, value).props.onClick(); await flush() })
  const generate = async () => {
    await click('id', 'cp-tab-diag')
    act(() => node('className', 'pm-copilot-input').props.onChange({ target: { value: '独立复验现有计划' } }))
    await click('aria-label', '发送')
    await click('id', 'cp-tab-draft')
    expect(m.root.findAll(n => n.type === 'input' && 'data-copilot-check' in n.props)).toHaveLength(plan.length)
  }
  const manualChange = () => {
    Object.assign(state.tasks[0], { assignee: '独立确认前外改', progress: 19, updatedAt: changedAt })
    liveBase = baseOf()
    act(() => m.update(render()))
  }
  return { m, node, click, generate, manualChange, calls, replies, originalBase, targetId, state,
    payloads: () => calls.filter(c => c.startsWith('ask-apply ')).map(parse),
    apply: (kind: 'batch' | 'stepwise') => click(`data-copilot-apply-${kind}`, true),
    undoButtons: () => m.root.findAll(n => n.type === 'button' && n.props.className === 'pm-copilot-undo-btn') }
}

beforeEach(() => vi.stubGlobal('fetch', () => { throw new Error('独立复验禁止网络') }))
afterEach(() => {
  for (const get of records.splice(0)) appendFileSync(process.env.PC_OBSERVATIONS!, `${JSON.stringify(get())}\n`)
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

it('IR-C01 单调新snapshot + base核验控制：同目标两次成功后独立继续', async () => {
  const f = await fixture()
  await f.generate()
  expect(f.payloads()).toEqual([])
  await f.apply('stepwise')
  expect(f.payloads().map(p => p.actions[0].stepId)).toEqual(['s1', 's2', 's3'])
  expect(f.payloads().map(p => p.base)).toEqual([f.originalBase,
    { ...f.originalBase, 't-0001': stamps[0] }, { ...f.originalBase, 't-0001': stamps[1] }])
  expect(f.replies.filter(r => r.line.startsWith('ask-apply ')).map(r => r.reply?.text))
    .toEqual(Array(3).fill('已应用 1 步；未执行 0 步'))
  expect(f.state.tasks[0].assignee).toBe('独立链式负责人')
  expect(f.state.tasks[1].progress).toBe(44)
  expect(f.calls.some(c => /^ask-undo(?! list)/.test(c))).toBe(false)
})

it.each(['task', 'milestone', 'risk', 'deliverable', 'meeting'] as Entity[])(
  'IR-A01 仅成功target %s推进；四扩展/其他外改keys不洗白', async entity => {
    const f = await fixture({ entity, externalOthers: true })
    await f.generate(); await f.apply('stepwise')
    const sent = f.payloads()
    expect(sent.map(p => p.actions[0].stepId)).toEqual(['s1', 's2', 's3'])
    expect(sent[0].base).toEqual(f.originalBase)
    expect(sent[1].base).toEqual({ ...f.originalBase, [f.targetId]: stamps[0] })
    expect(sent[2].base).toEqual({ ...f.originalBase, [f.targetId]: stamps[1] })
    expect(f.replies.filter(r => r.line.startsWith('ask-apply ')).map(r => r.reply?.text))
      .toEqual(['已应用 1 步；未执行 0 步', '已应用 1 步；未执行 0 步', '已应用 0 步；未执行 1 步'])
    expect(f.state.tasks[1].assignee).toBe('独立外改保留')
    expect(f.state.tasks[1].progress).toBe(0)
    expect(f.calls.filter(c => c === 'ask-undo list')).toHaveLength(2)
  })

it.each([
  { kind: 'success', text: '已应用 0 步；未执行 1 步' },
  { kind: 'error', text: '已应用 1 步' },
  { kind: 'success', text: '该计划已确认过，为避免重复写库未再次执行（幂等拦截）' },
  { kind: 'success', text: '成功但未提供应用结果' },
  { kind: 'success', text: '已应用 10 步' },
])('IR-A02 首步未确证一应用：$text，不发依赖/只独立继续', async firstReply => {
  const f = await fixture({ firstReply, grandchild: true })
  await f.generate(); await f.apply('stepwise')
  expect(f.payloads().map(p => p.actions[0].stepId)).toEqual(['s1', 's3'])
  expect(f.payloads()[1].base).toEqual(f.originalBase)
  expect(f.calls.filter(c => c === 'ask-undo list')).toHaveLength(1)
  await f.click('id', 'cp-tab-diag')
  expect(text(f.m.root)).toContain('s2：依赖步骤未执行，已跳过')
  expect(text(f.m.root)).toContain('s4：依赖步骤未执行，已跳过')
})

it('IR-A03 传输抛错不误认成功、独立继续', async () => {
  const f = await fixture({ throwFirst: true })
  await f.generate(); await f.apply('stepwise')
  expect(f.payloads().map(p => p.actions[0].stepId)).toEqual(['s1', 's3'])
  expect(f.payloads()[1].base).toEqual(f.originalBase)
  expect(f.calls.filter(c => c === 'ask-undo list')).toHaveLength(1)
})

it.each(['throw', 'wrong-project', 'missing'] as const)(
  'IR-A04 重读%s不采错target；成功集合与base分离', async snapshot => {
    const f = await fixture({ snapshot })
    await f.generate(); await f.apply('stepwise')
    expect(f.payloads().map(p => p.actions[0].stepId)).toEqual(['s1', 's2', 's3'])
    expect(f.payloads()[1].base).toEqual(f.originalBase)
    expect(f.replies.filter(r => r.line.startsWith('ask-apply ')).map(r => r.reply?.text))
      .toEqual(['已应用 1 步；未执行 0 步', '已应用 0 步；未执行 1 步', '已应用 1 步；未执行 0 步'])
  })

it('IR-A05 取消与最新投影零apply；明确再生成才接受外改base', async () => {
  const f = await fixture()
  await f.generate(); f.manualChange()
  expect(text(f.m.root)).toContain('你打开草稿后台账有变化')
  await f.click('id', 'cp-tab-diag')
  expect(text(f.m.root)).toContain('负责人：独立确认前外改')
  await f.click('id', 'cp-tab-draft'); await f.click('data-copilot-cancel', true)
  expect(f.payloads()).toEqual([])
  expect(f.calls).not.toContain('ask-undo list')
  await f.generate(); await f.apply('batch')
  expect(f.payloads()[0].base['t-0001']).toBe(changedAt)
  expect(f.calls.filter(c => c.startsWith('ask p-0001 '))).toHaveLength(2)
})

it('IR-A06 未勾选前置不发下游；编辑非法禁用、纠正后原值发送', async () => {
  const f = await fixture()
  await f.generate()
  act(() => f.node('data-copilot-check', 's1').props.onChange({ target: { checked: false } }))
  act(() => f.node('data-copilot-edit', 's3.progress').props.onChange({ target: { value: '101' } }))
  expect(f.node('data-copilot-apply-stepwise', true).props.disabled).toBe(true)
  expect(f.node('data-copilot-apply-batch', true).props.disabled).toBe(true)
  act(() => f.node('data-copilot-edit', 's3.progress').props.onChange({ target: { value: '45' } }))
  expect(f.node('data-copilot-apply-stepwise', true).props.disabled).toBe(false)
  await f.apply('stepwise')
  expect(f.payloads().map(p => p.actions[0].stepId)).toEqual(['s3'])
  expect(f.payloads()[0].actions[0].patch.progress).toBe(45)
  expect(f.payloads()[0].base).toEqual(f.originalBase)
})

it.each(['old', 'future', 'no-at', 'error'] as const)('IR-A07 %s撤销列表不伪造fresh入口', async undo => {
  const f = await fixture({ undo })
  await f.generate(); await f.apply('batch')
  expect(f.calls.filter(c => c === 'ask-undo list')).toHaveLength(1)
  expect(f.undoButtons()).toHaveLength(0)
})

it('IR-A08 mixed只标实际一步；延迟列表fresh入口，零自动撤销', async () => {
  const f = await fixture({ mixed: true, undo: 'delayed' })
  await f.generate(); await f.apply('batch')
  expect(f.undoButtons()).toHaveLength(1)
  expect(text(f.undoButtons()[0])).toContain('整批 1 步')
  expect(f.calls.some(c => /^ask-undo(?! list)/.test(c))).toBe(false)
  await act(async () => { f.undoButtons()[0].props.onClick(); await new Promise(r => setTimeout(r, 10)) })
  expect(f.calls.filter(c => /^ask-undo(?! list)/.test(c))).toHaveLength(1)
  expect(f.undoButtons()).toHaveLength(0)
})

it('IR-A09 整批应用0不捞任何undo', async () => {
  const f = await fixture({ firstReply: { kind: 'success', text: '已应用 0 步；未执行 3 步' } })
  await f.generate(); await f.apply('batch')
  expect(f.calls).not.toContain('ask-undo list')
  expect(f.undoButtons()).toHaveLength(0)
})
