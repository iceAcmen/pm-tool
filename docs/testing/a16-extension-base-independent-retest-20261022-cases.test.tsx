import { appendFileSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PmPanel } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { CopilotPanel } from '../../packages/dsh-pm-tool/src/client/shared/drawers/sidecar-portal.js'
import { parseCopilotPlan, validatePlan } from '../../packages/dsh-pm-tool/src/core/copilot.js'
import { projectRecordSchema } from '../../packages/dsh-pm-tool/src/core/project.js'
import { taskRecordSchema } from '../../packages/dsh-pm-tool/src/core/task.js'
import { milestoneWriteSchema, milestoneCreateSchema } from '../../packages/dsh-pm-tool/src/core/milestone.js'
import { riskIssueWriteSchema, riskIssueCreateSchema } from '../../packages/dsh-pm-tool/src/core/risk-issue.js'
import { deliverableRecordSchema, deliverableCreateSchema } from '../../packages/dsh-pm-tool/src/core/deliverable.js'
import { meetingRecordSchema, meetingCreateSchema } from '../../packages/dsh-pm-tool/src/core/meeting.js'

const replay = JSON.parse(readFileSync(process.env.PC_INPUT!, 'utf8'))
const noop = () => {}
const mounts: ReactTestRenderer[] = []
const records: (() => unknown)[] = []
const tables = ['tasks', 'milestones', 'riskIssues', 'deliverables', 'meetings'] as const
const schemas = [taskRecordSchema, milestoneWriteSchema, riskIssueWriteSchema, deliverableRecordSchema, meetingRecordSchema]
const rows = [
  ['milestone', 'milestones', 'm', { status: 'planned' }],
  ['risk', 'riskIssues', 'ri', { title: '独立建议风险' }],
  ['deliverable', 'deliverables', 'dlv', { status: 'planned' }],
  ['meeting', 'meetings', 'mtg', { title: '独立建议会议' }],
] as const
type Row = { id: string, projectId: string, updatedAt: string, [key: string]: unknown }
const matrix = rows.flatMap(row => ['p-0001', 'p-0002'].map(project => [...row, project] as const))
const text = (n: ReactTestInstance): string => n.children.map(c => typeof c === 'string' ? c : text(c)).join('')
let projectId: string

async function fixture(entity: string, table: string, id: string, patch: object, project: string, createOp = false) {
  projectId = project
  const snapshot: Record<string, any> = { ...structuredClone(replay.initial) }
  snapshot.projects = replay.initial.projects.map((p: any) => projectRecordSchema.parse(p))
  tables.forEach((table, i) => {
    snapshot[table] = ['p-0001', 'p-0002'].flatMap((projectId, j) =>
      [1, 2].map((n, k) => schemas[i].parse({
        ...structuredClone(replay.initial[table][0]), projectId,
        id: `${['t', 'm', 'ri', 'dlv', 'mtg'][i]}-000${j * 2 + n}`,
        ...(table === 'tasks' ? { parentId: null, code: String(n), order: n, status: 'todo', progress: 0 } : {}),
        createdAt: '2026-10-22T03:00:00.000Z',
        updatedAt: `2026-10-22T03:0${i}:${String(j * 2 + k).padStart(2, '0')}.000Z`,
      })))
  })
  const baseFrom = () => Object.fromEntries(tables.flatMap(table => snapshot[table]
    .filter((r: Row) => r.projectId === projectId).map((r: Row) => [r.id, r.updatedAt])))
  const originalBase = baseFrom()
  const action = { op: `${entity}.${createOp ? 'create' : 'update'}`, ...(!createOp ? { id } : {}), patch }
  const plan = [{ stepId: 'x1', title: '独立父层确认', reason: '既有扩展基线守卫', needs: [], action }]
  const askText = '独立合法计划\n```json\n' + JSON.stringify({ plan }) + '\n```'
  const idsOf = (table: string) => snapshot[table].filter((r: Row) => r.projectId === projectId).map((r: Row) => r.id)
  const validation = validatePlan(parseCopilotPlan(askText).rawSteps, { taskIds: idsOf('tasks'),
    milestoneIds: idsOf('milestones'), riskIds: idsOf('riskIssues'), deliverableIds: idsOf('deliverables'), meetingIds: idsOf('meetings') })
  expect(validation.rejected).toEqual([])
  expect(validation.steps).toHaveLength(1)
  const calls: string[] = []
  const pending: Promise<unknown>[] = []
  const dispatch = async (line: string) => {
    calls.push(line)
    if (line === 'web snapshot') return { kind: 'success', text: JSON.stringify(snapshot) }
    if (line === 'model status') return { kind: 'success', text: '当前模式：prod' }
    if (line.startsWith('ask-provenance ')) return { kind: 'success', text: '{"entries":[]}' }
    if (line.startsWith(`ask ${projectId} `)) return { kind: 'success', text: askText }
    if (line.startsWith(`ask-apply ${projectId} `)) return { kind: 'success', text: '已应用 0 步；未执行 1 步' }
    throw new Error(`独立父层未授权传输 ${line}`)
  }
  const raw = (line: string) => {
    const p = dispatch(line)
    pending.push(p.catch(noop))
    return p
  }
  const execute = async (line: string) => (await raw(line)).text
  const flush = async () => {
    for (let i = 0; i < 20; i++) {
      const n = pending.length
      await Promise.all(pending); await new Promise(r => setTimeout(r, 0))
      if (n === pending.length) return
    }
    throw new Error('独立父层异步未排空')
  }
  const storage = new Map([['pm-selected-project', projectId], ['pm-view', 'tasks']])
  vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) })
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
  const child = () => m.root.findByType(CopilotPanel)
  expect(child().props.projectId).toBe(projectId)
  const payloads = () => calls.filter(c => c.startsWith('ask-apply ')).map(line => {
    expect(line.startsWith(`ask-apply ${projectId} `)).toBe(true)
    const [a, b] = line.slice(`ask-apply ${projectId} `.length).split(' --base ')
    return { actions: JSON.parse(a), base: JSON.parse(b) }
  })
  const generate = async () => {
    await click('id', 'cp-tab-diag')
    act(() => node('className', 'pm-copilot-input').props.onChange({ target: { value: '独立父层生成' } }))
    await click('aria-label', '发送'); await click('id', 'cp-tab-draft')
    expect(node('data-copilot-check', 'x1').props.checked).toBe(true)
  }
  const refresh = async () => {
    const originalChild = child()
    for (const table of tables) for (const r of snapshot[table]) {
      if (r.projectId !== projectId) continue
      r.updatedAt = '2026-10-22T03:10:00.000Z'
      if ('title' in r) r.title = '独立正常刷新最新标题'
      if ('name' in r) r.name = '独立正常刷新最新名称'
    }
    await click('aria-label', '刷新数据')
    expect(child()).toBe(originalChild)
    for (const table of tables) {
      expect(child().props[table]).toHaveLength(2)
      expect(child().props[table].every((r: Row) => r.projectId === projectId && r.updatedAt === '2026-10-22T03:10:00.000Z')).toBe(true)
    }
  }
  records.push(() => ({ entity, table, projectId, id, originalBase, latestBase: baseFrom(), calls, sent: payloads(),
    boundary: 'real PmPanel/CopilotPanel + production schemas; transport returns zero, no GUI/backend/storage acceptance' }))
  return { m, child, click, node, generate, refresh, originalBase, latestBase: baseFrom, payloads, calls,
    expectedAction: { ...action, stepId: 'x1', title: '独立父层确认', needs: [] } }
}
beforeEach(() => {
  vi.stubGlobal('window', { location: { hash: '', search: '', pathname: '/' }, addEventListener: noop,
    removeEventListener: noop, setTimeout, clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) })
  vi.stubGlobal('document', { activeElement: null, querySelector: () => null, addEventListener: noop,
    removeEventListener: noop, body: { dataset: {} } })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('requestAnimationFrame', (f: () => void) => { f(); return 1 })
  vi.stubGlobal('cancelAnimationFrame', noop)
  vi.stubGlobal('fetch', () => { throw new Error('独立父层禁止网络') })
})
afterEach(() => {
  for (const get of records.splice(0)) appendFileSync(process.env.PC_OBSERVATIONS!, `${JSON.stringify(get())}\n`)
  for (const m of mounts.splice(0)) act(() => m.unmount())
  vi.unstubAllGlobals()
})

it.each(matrix)('IX01 %s %s/%s 初发严格五类全base且隔离%s', async (entity, table, prefix, patch, project) => {
  const id = `${prefix}-000${project === 'p-0001' ? 1 : 3}`
  const f = await fixture(entity, table, id, patch, project)
  for (const t of tables) expect(f.child().props[t]).toHaveLength(2)
  await f.generate()
  expect(f.payloads()).toEqual([])
  await f.click('data-copilot-apply-batch', true)
  expect(f.payloads()).toEqual([{ base: f.originalBase, actions: [f.expectedAction] }])
  expect(Object.keys(f.payloads()[0].base)).toHaveLength(10)
  expect(f.payloads()[0].base[id]).toBe(f.originalBase[id])
})
it.each(matrix)('IX02 %s %s/%s 正常刷新只变props、确认保原base %s', async (entity, table, prefix, patch, project) => {
  const id = `${prefix}-000${project === 'p-0001' ? 1 : 3}`
  const f = await fixture(entity, table, id, patch, project)
  await f.generate()
  await f.click('aria-label', '最小化为侧边标签（保留上下文）')
  await f.refresh()
  await f.click('aria-label', '展开 AI 副驾，保留此前上下文')
  expect(f.child().props.baselineMap[id]).toBe('2026-10-22T03:10:00.000Z')
  const latest = f.child().props[table][0]
  expect(latest.title ?? latest.name).toBe(table === 'deliverables' ? '独立正常刷新最新名称' : '独立正常刷新最新标题')
  expect(f.payloads()).toEqual([])
  await f.click('data-copilot-apply-batch', true)
  expect(f.payloads()).toEqual([{ base: f.originalBase, actions: [f.expectedAction] }])
  expect(f.calls.filter(c => c.startsWith(`ask ${project} `))).toHaveLength(1)
})
it.each(matrix)('IX03 %s %s/%s 取消零apply、再生成使用新base %s', async (entity, table, prefix, patch, project) => {
  const id = `${prefix}-000${project === 'p-0001' ? 1 : 3}`
  const f = await fixture(entity, table, id, patch, project)
  await f.generate(); await f.refresh()
  await f.click('data-copilot-cancel', true)
  expect(f.m.root.findAll(n => n.type === 'input' && n.props['data-copilot-check'] === 'x1')).toHaveLength(0)
  expect(f.payloads()).toEqual([])
  expect(f.calls).not.toContain('ask-undo list')
  await f.generate()
  expect(f.payloads()).toEqual([])
  await f.click('data-copilot-apply-batch', true)
  expect(f.payloads()).toEqual([{ base: f.latestBase(), actions: [f.expectedAction] }])
  expect(f.calls.filter(c => c.startsWith(`ask ${project} `))).toHaveLength(2)
})
it.each([
  ['milestone', 'milestones', { title: '独立新里程碑', targetDate: '2026-10-31' }, milestoneCreateSchema],
  ['risk', 'riskIssues', { type: 'risk', title: '独立新风险', impact: 'low', probability: 'low' }, riskIssueCreateSchema],
  ['deliverable', 'deliverables', { name: '独立新交付物' }, deliverableCreateSchema],
  ['meeting', 'meetings', { title: '独立新会议', meetingDate: '2026-10-22' }, meetingCreateSchema],
] as const)('IX04 %s 已存记录项目create不造建议旧ID', async (entity, table, patch, schema) => {
  expect(schema.safeParse({ projectId: 'p-0001', ...patch }).success).toBe(true)
  const f = await fixture(entity, table, '', patch, 'p-0001', true)
  await f.generate()
  expect(f.payloads()).toEqual([])
  await f.click('data-copilot-apply-batch', true)
  expect(f.payloads()).toEqual([{ base: f.originalBase, actions: [f.expectedAction] }])
  expect(f.payloads()[0].actions[0]).not.toHaveProperty('id')
  expect(Object.keys(f.payloads()[0].base)).toHaveLength(10)
})
