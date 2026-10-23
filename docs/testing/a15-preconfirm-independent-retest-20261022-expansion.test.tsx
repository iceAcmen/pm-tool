import { appendFileSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PmPanel } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { CopilotPanel } from '../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.js'
import { parseCopilotPlan, validatePlan } from '../../packages/dsh-pm-tool/src/core/copilot.js'
import { milestoneWriteSchema } from '../../packages/dsh-pm-tool/src/core/milestone.js'
import { riskIssueWriteSchema } from '../../packages/dsh-pm-tool/src/core/risk-issue.js'
import { deliverableRecordSchema } from '../../packages/dsh-pm-tool/src/core/deliverable.js'
import { meetingRecordSchema } from '../../packages/dsh-pm-tool/src/core/meeting.js'

const replay = JSON.parse(readFileSync(process.env.PC_INPUT!, 'utf8'))
const at = '2026-10-22T02:00:00.000Z'
const mounts: ReactTestRenderer[] = []
const noop = () => {}
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
const common = { projectId: 'p-0001', createdAt: at, updatedAt: at }
const extensions = {
  milestones: [milestoneWriteSchema.parse({ ...common, id: 'm-0001', title: '父层里程碑', description: '',
    status: 'planned', targetDate: '2026-10-31', achievedDate: null })],
  riskIssues: [riskIssueWriteSchema.parse({ ...common, id: 'ri-0001', title: '父层风险', type: 'risk',
    description: '', owner: '', dueDate: null, status: 'open', probability: 'low', impact: 'low', responsePlan: '', solution: '' })],
  deliverables: [deliverableRecordSchema.parse({ ...common, id: 'dlv-0001', name: '父层交付物', version: '',
    owner: '', status: 'planned', location: '', description: '', dueDate: null, history: [] })],
  meetings: [meetingRecordSchema.parse({ ...common, id: 'mtg-0001', title: '父层会议', meetingDate: '2026-10-22',
    startTime: null, durationMinutes: null, location: '', facilitator: '', recorder: '', participants: [],
    status: 'draft', summary: '', topics: [], decisions: [], actions: [], sourceType: 'manual', sourceSessionId: null })],
}
beforeEach(() => {
  const local = new Map([['pm-selected-project', 'p-0001'], ['pm-view', 'tasks']])
  vi.stubGlobal('localStorage', { getItem: (k: string) => local.get(k) ?? null,
    setItem: (k: string, v: string) => local.set(k, v), removeItem: (k: string) => local.delete(k) })
  vi.stubGlobal('window', { location: { hash: '', search: '', pathname: '/' }, addEventListener: noop,
    removeEventListener: noop, setTimeout, clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) })
  vi.stubGlobal('document', { activeElement: null, querySelector: () => null, addEventListener: noop,
    removeEventListener: noop, body: { dataset: {} } })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 1 })
  vi.stubGlobal('cancelAnimationFrame', noop)
  vi.stubGlobal('fetch', () => { throw new Error('扩展复验禁止网络') })
})
afterEach(() => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

it.each([
  ['milestone', 'm-0001', { status: 'planned' }],
  ['risk', 'ri-0001', { title: '合法风险更新' }],
  ['deliverable', 'dlv-0001', { status: 'planned' }],
  ['meeting', 'mtg-0001', { title: '合法会议更新' }],
] as const)('IR-PARENT %s真实父层首次确认必须带生成时扩展base', async (entity, id, patch) => {
  const snapshot = { ...structuredClone(replay.initial), ...structuredClone(extensions) }
  const plan = [{ stepId: 'e1', title: '父层扩展确认', reason: '既有扩展冲突守卫', needs: [],
    action: { op: `${entity}.update`, id, patch } }]
  const askText = `父层复验\n\`\`\`json\n${JSON.stringify({ plan })}\n\`\`\``
  const valid = validatePlan(parseCopilotPlan(askText).rawSteps, { taskIds: snapshot.tasks
    .filter((t: any) => t.projectId === 'p-0001').map((t: any) => t.id),
    milestoneIds: ['m-0001'], riskIds: ['ri-0001'], deliverableIds: ['dlv-0001'], meetingIds: ['mtg-0001'] })
  expect(valid.rejected).toEqual([])
  expect(valid.steps).toHaveLength(1)
  const calls: string[] = []
  const pending: Promise<unknown>[] = []
  const dispatch = async (line: string) => {
    calls.push(line)
    if (line === 'web snapshot') return { kind: 'success', text: JSON.stringify(snapshot) }
    if (line === 'model status') return { kind: 'success', text: '当前模式：prod' }
    if (line.startsWith('ask-provenance ')) return { kind: 'success', text: '{"entries":[]}' }
    if (line.startsWith('ask p-0001 ')) return { kind: 'success', text: askText }
    // 明确应用0，避免桩制造实际成功或撤销；此例仅判第一发送的base。
    if (line.startsWith('ask-apply p-0001 ')) return { kind: 'success', text: '已应用 0 步；未执行 1 步' }
    throw new Error(`未授权扩展传输：${line}`)
  }
  const raw = (line: string) => { const p = dispatch(line); pending.push(p); return p }
  const execute = async (line: string) => (await raw(line)).text
  const flush = async () => {
    for (let i = 0; i < 20; i++) {
      const n = pending.length
      await Promise.all(pending); await new Promise(r => setTimeout(r, 0))
      if (n === pending.length) return
    }
    throw new Error('父层异步未排空')
  }
  let m!: ReactTestRenderer
  await act(async () => { m = create(createElement(PmPanel, { execute, executeRaw: raw })); await flush() })
  mounts.push(m)
  const node = (key: string, value: unknown) => {
    const found = m.root.findAll(n => typeof n.type === 'string' && n.props[key] === value)
    expect(found, `${key}=${String(value)}`).toHaveLength(1)
    return found[0]
  }
  const click = async (key: string, value: unknown) =>
    act(async () => { node(key, value).props.onClick(); await flush() })
  await click('className', 'pm-button pm-top-secondary pm-copilot-open')
  const child = m.root.findByType(CopilotPanel)
  expect(child.props.milestones).toHaveLength(1)
  expect(child.props.riskIssues).toHaveLength(1)
  expect(child.props.deliverables).toHaveLength(1)
  expect(child.props.meetings).toHaveLength(1)
  act(() => node('className', 'pm-copilot-input').props.onChange({ target: { value: '合法扩展更新' } }))
  await click('aria-label', '发送'); await click('id', 'cp-tab-draft')
  expect(text(m.root)).toContain('父层扩展确认')
  expect(calls.filter(c => c.startsWith('ask-apply '))).toHaveLength(0)
  await click('data-copilot-apply-batch', true)
  const sent = calls.filter(c => c.startsWith('ask-apply '))
  expect(sent).toHaveLength(1)
  const [actions, rawBase] = sent[0].slice('ask-apply p-0001 '.length).split(' --base ')
  expect(JSON.parse(actions)[0].id).toBe(id)
  const base = JSON.parse(rawBase)
  appendFileSync(process.env.PC_OBSERVATIONS!, `${JSON.stringify({ entity, id, expected: at, base, calls,
    boundary: 'actual PmPanel/CopilotPanel first-send SOURCE/AUTO; transport double, no GUI/storage' })}\n`)
  expect(base[id]).toBe(at)
})
