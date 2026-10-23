// runner 将本专项原字节放到隔离 src/client 下；仅执行真实生产入口和 React DOM。
import React, { act } from 'react'
import { JSDOM } from 'jsdom'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pmDomainSpec, type PmDomain } from '../core/storage.js'
import { projectRecordSchema } from '../core/project.js'
import { taskWriteSchema } from '../core/task.js'
import { readExportAudit } from '../core/export.js'
import { enqueueDomainWrite } from '../core/projects.js'
import { apply } from '../index.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
  'HTMLSelectElement', 'HTMLTextAreaElement', 'Element', 'Node', 'Event', 'MouseEvent',
  'KeyboardEvent', 'FormData', 'MutationObserver']) {
  vi.stubGlobal(key, key === 'window' ? dom.window : (dom.window as any)[key])
}
dom.window.matchMedia = () => ({
  matches: false, addEventListener() {}, removeEventListener() {},
}) as any
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
vi.stubGlobal('localStorage', dom.window.localStorage)
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
vi.stubGlobal('requestAnimationFrame', (fn: () => void) => setTimeout(fn, 0))
vi.stubGlobal('cancelAnimationFrame', clearTimeout)
// jsdom 无 CSS.escape；本合法 fixture ID 均为无需转义的字母/数字/连字符。
vi.stubGlobal('CSS', { escape(value: string) {
  if (!/^[a-z0-9-]+$/.test(value)) throw new Error('设施：escape fixture 超出声明 ID 集合')
  return value
} })
const { createRoot } = await import('react-dom/client')
const { PmPanel } = await import('./panel.js')

const at = '2026-10-20T00:00:00.000Z'
const latest = '2026-10-23T08:09:10.000Z'
const longTitle = 'A顶层二' + '长标题'.repeat(50)
const audit = [
  { at: '2026-10-22T12:00:00.000Z', projectId: 'p-0001', format: 'plain', targetPath: '/fixture/old.txt', itemCount: 4 },
  { at: latest, projectId: 'p-0001', format: 'web', targetPath: '/fixture/current.html', itemCount: 4 },
  { at: '2026-10-21T12:00:00.000Z', projectId: 'p-0001', format: 'markdown', targetPath: '/fixture/array-last.md', itemCount: 4 },
  { at: 'invalid-date', projectId: 'p-0001', format: 'plain', targetPath: '/fixture/not-time.txt', itemCount: 4 },
  { at: '2099-01-01T00:00:00.000Z', projectId: 'p-0002', format: 'pdf', targetPath: '/fixture/invalid.pdf', itemCount: 4 },
  { at: 'invalid-date', projectId: 'p-0003', format: 'plain', targetPath: '/fixture/invalid-time.txt', itemCount: 4 },
  { at: '2099-01-01T00:00:00.000Z', projectId: 'p-9999', format: 'plain', targetPath: '/fixture/foreign.txt', itemCount: 4 },
  null, { projectId: 'p-0002', at: latest, format: 'web', itemCount: 4 },
]
let facility: DomainFacility
let domain: PmDomain
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement
let caseRoot: string
let sequence = 0
let handler: (invocation: any) => Promise<any>
let calls: any[]
let frames: any[]
let writes: any[]
let initial: Record<string, string>
let ctx: Context

const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
function rawTree(dir: string, prefix = ''): Record<string, string> {
  return Object.fromEntries(readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap(e => {
    const path = join(prefix, e.name)
    return e.isDirectory() ? Object.entries(rawTree(dir, path))
      : [[path, digest(readFileSync(join(dir, path)))]]
  }))
}
async function register() {
  // 只用宿主预置的真实 domain 与注册捕获接口；不注册业务镜像、不开服务或端口。
  await facility.closeAll()
  const open = facility.open.bind(facility)
  vi.spyOn(facility, 'open').mockImplementation(async spec => {
    domain = await open(spec)
    return domain as any
  })
  ctx.provide('storageDomain', facility)
  ctx.provide('commands', { register: (definition: any) => { handler = definition.handler; return () => {} } })
  ctx.provide('webServer', { register: () => () => {} })
  ctx.provide('connection', { requestRejection: () => 401 })
  await apply(ctx)
  await enqueueDomainWrite(domain, async () => {})
  await new Promise(ok => setTimeout(ok, 10))
}
async function execute(line: string) {
  const before = rawTree(join(caseRoot, 'database'))
  const result = await handler({ rawInput: line, attachments: [] })
  calls.push({ line, result, before, after: rawTree(join(caseRoot, 'database')) })
  expect(result.kind, result.text).toBe('success')
  return result.text as string
}
function observe(label: string) {
  const rows = [...container.querySelectorAll<HTMLElement>('[data-pm-row]')].map(row => ({
    id: row.dataset.pmRow, class: row.className,
    slot: row.querySelector('.pm-export-slot')?.textContent ?? null,
    slotInTaskCell: !!row.querySelector('.pt-task .pm-export-slot, .pt-gname .pm-export-slot'),
    slotInActions: !!row.querySelector('.pt-acts .pm-export-slot'),
    edit: row.querySelector('button[aria-label^="编辑"]')?.getAttribute('aria-label'),
    handle: row.querySelector('.pt-code')?.textContent, text: row.textContent,
    time: row.querySelector('time')?.getAttribute('datetime') ?? null,
  }))
  frames.push({ label, rows, html: container.innerHTML, calls: structuredClone(calls), writes: structuredClone(writes),
    raw: rawTree(join(caseRoot, 'database')) })
  return rows
}
function assertZeroWrite() {
  expect(writes, '只读 command/切项目/refresh/reentry 不得调用业务 put/delete').toEqual([])
  expect(rawTree(join(caseRoot, 'database')), '真实 JSON 全字节保留，包括 audit/sent/archive updatedAt').toEqual(initial)
  expect(calls.every(call => call.line === 'web snapshot')).toBe(true)
}
async function mount() {
  await act(async () => {
    root = createRoot(container)
    root.render(<PmPanel execute={execute} />)
  })
  observe('mounted-real-panel')
}
async function unmount() {
  if (root) await act(async () => { root!.unmount(); root = undefined })
}
async function click(selector: string) {
  const button = container.querySelector<HTMLButtonElement>(selector)
  expect(button, `设施：实际按钮 ${selector}`).not.toBeNull()
  await act(async () => { button!.click() })
}
async function pick(name: string) {
  await click('.pm-project-switcher-btn')
  const option = [...container.querySelectorAll<HTMLButtonElement>('.pm-project-menu-item')]
    .find(node => node.textContent?.includes(name))
  expect(option, `设施：真实项目选项 ${name}`).toBeDefined()
  await act(async () => { option!.click() })
  observe(`selected-${name}`)
}
function assertSlots(ids: string[], exported: boolean) {
  const rows = observe(exported ? 'assert-exported' : 'assert-none')
  expect(rows.map(row => row.id)).toEqual(ids)
  for (const row of rows) {
    expect.soft(row.slot ?? '', `实际行 ${row.id} 静态出站文本`).toContain(exported ? '已导出' : '未导出')
    if (exported) {
      expect.soft(row.slot ?? '').toContain('08:09')
      expect.soft(row.slot ?? '').toContain('外部为唯一事实源')
      expect.soft(row.time, '必须绑定真实项目 ISO at，而非假时间/另一项目').toBe(latest)
    } else expect.soft(row.time).toBeNull()
    expect.soft(row.edit, '编辑动作继续可达').toBeTruthy()
    expect.soft(row.slotInActions, '长文本不占狭窄编辑列').toBe(false)
    expect.soft(row.slotInTaskCell).toBe(true)
    const slot = container.querySelector<HTMLElement>(`[data-pm-row="${row.id}"] .pm-export-slot`)
    expect.soft(slot?.style.whiteSpace).toBe('normal')
    expect.soft(slot?.style.overflowWrap).toBe('anywhere')
    expect.soft(slot?.parentElement?.style.flexWrap).toBe('wrap')
  }
  assertZeroWrite()
}
function seedView(grouped: boolean) {
  dom.window.localStorage.setItem('pm-task-views:p-0001', JSON.stringify({
    version: 1, defaultViewId: 'slot-view',
    views: [{ id: 'slot-view', name: '原 U4 排序', state: {
      query: '', chip: 'all', grouped, sort: 'code',
      sorts: [{ field: 'priority', dir: 'asc' }, { field: 'dueDate', dir: 'desc' }],
    } }],
  }))
}

beforeEach(async test => {
  caseRoot = join(process.env.P2002_OUTPUT!, `${++sequence}-${test.task.name.split(' ')[0]}`)
  mkdirSync(join(caseRoot, 'database'), { recursive: true })
  calls = []; frames = []; writes = []
  dom.window.localStorage.clear()
  dom.window.localStorage.setItem('pm-selected-project', 'p-0001')
  dom.window.localStorage.setItem('pm-last-view', 'tasks')
  container = dom.window.document.createElement('div')
  dom.window.document.body.append(container)
  vi.stubGlobal('fetch', () => { throw new Error('设施：本专项不准网络') })
  ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(join(caseRoot, 'database')))
  facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.storage.mount('domain', facility)
  domain = await facility.open(pmDomainSpec)
  for (let n = 1; n <= 3; n++) {
    const id = `p-000${n}`
    await domain.table('projects').put(id, projectRecordSchema.parse({
      id, name: ['项目A', '项目B', '项目C'][n - 1], status: 'active',
      description: '真实 schema 测试项目', owner: '负责人',
      startDate: '2026-10-01', targetDate: '2026-12-31', createdAt: at, updatedAt: at,
    }))
  }
  const tasks = [
    { id: 't-0001', code: '2', order: 2, priority: 'P1', parentId: null, title: longTitle, status: 'todo' },
    { id: 't-0002', code: '1', order: 1, priority: 'P0', parentId: null, title: 'A顶层一', status: 'todo' },
    { id: 't-0003', code: '1.1', order: 1, priority: 'P1', parentId: 't-0002', title: 'A子层', status: 'in_progress' },
    { id: 't-0004', code: '3', order: 3, priority: 'P2', parentId: null, title: 'A收尾', status: 'wrapped' },
    { id: 't-0005', code: '1', order: 1, priority: 'P1', parentId: null, title: 'B真无记录', status: 'todo', projectId: 'p-0002' },
  ]
  for (const row of tasks) {
    await domain.table('tasks').put(row.id, taskWriteSchema.parse({
      projectId: 'p-0001', description: '原说明', assignee: '执行人', progress: 0,
      dueDate: '2026-12-01', milestoneId: null, createdAt: at, updatedAt: at,
      checklist: [{ id: 'check-1', text: '原清单', done: false }], ...row,
    }))
  }
  if (!test.task.name.startsWith('S08')) {
    await domain.table('settings').put('pmExportAudit', {
      value: test.task.name.startsWith('S07') ? { damaged: true } : audit, updatedAt: at,
    })
  }
  await domain.table('settings').put('pmExportSent', { value: [audit[0]], updatedAt: at })
  await domain.table('settings').put('pmExportSentArchive', { value: [audit[2]], updatedAt: at })
  await register()
  for (const name of Object.keys(pmDomainSpec.tables)) {
    const table = domain.table(name as any) as any
    for (const method of ['put', 'delete']) {
      if (typeof table[method] === 'function') vi.spyOn(table, method).mockImplementation((...args: any[]) => {
        writes.push({ table: name, method, args })
        throw new Error('只读阶段禁止业务写')
      })
    }
  }
  initial = rawTree(join(caseRoot, 'database'))
  frames.push({ label: 'legal-schema-fixture', auditRead: readExportAudit(domain), initial })
})

afterEach(async () => {
  observe('final-before-unmount')
  await unmount()
  await facility?.closeAll()
  frames.push({ label: 'closed', raw: rawTree(join(caseRoot, 'database')), writes, calls })
  writeFileSync(join(caseRoot, 'observations.json'), JSON.stringify(frames, null, 2) + '\n', { flag: 'wx' })
  container.remove()
  vi.restoreAllMocks()
})

describe('RA-P2002-OUTBOUND-SLOT 真实 schema/command snapshot/React DOM', () => {
  it('S01 真 audit 取最大 at 非数组末，B隔离，窄投影与非法只读防御', async () => {
    const snap = JSON.parse(await execute('web snapshot'))
    expect.soft(snap.latestExports).toEqual({
      'p-0001': { at: latest, format: 'web' }, 'p-0002': null, 'p-0003': null,
    })
    expect(snap).not.toHaveProperty('pmExportAudit')
    expect(JSON.stringify(snap)).not.toContain('/fixture/')
    expect(snap.tasks).toHaveLength(5)
    assertZeroWrite()
  })
  it('S02 真 panel 顶层与子层同项目 time/文本，编辑列不被长 slot 占用', async () => {
    await mount()
    assertSlots(['t-0002', 't-0003', 't-0001', 't-0004'], true)
  })
  it('S03 切真实B无记录，再切A/refresh/面板重进始终同源零写', async () => {
    await mount()
    await pick('项目B')
    assertSlots(['t-0005'], false)
    await pick('项目A')
    await click('button[aria-label="刷新数据"]')
    assertSlots(['t-0002', 't-0003', 't-0001', 't-0004'], true)
    await unmount()
    await mount()
    assertSlots(['t-0002', 't-0003', 't-0001', 't-0004'], true)
    expect(calls.length).toBeGreaterThanOrEqual(3)
  })
  it('S04 原U4多规则树排序/编号/状态/清单保持，各行都有slot', async () => {
    seedView(false)
    await mount()
    assertSlots(['t-0002', 't-0003', 't-0001', 't-0004'], true)
    const rows = observe('u4-tree')
    expect(rows.map(row => row.handle)).toEqual(['1', '1.1', '2', '3'])
    expect(rows.filter(row => row.id !== 't-0002').every(row => row.text?.includes('清单 0/1'))).toBe(true)
    const snap = JSON.parse(await execute('web snapshot'))
    expect(snap.tasks.find((t: any) => t.id === 't-0004').status).toBe('wrapped')
    assertZeroWrite()
  })
  it('S05 原U4状态分组实际leafRow同样真time/slot，非空分组头冒充行', async () => {
    seedView(true)
    await mount()
    const ids = observe('grouped-loaded').map(row => row.id) as string[]
    expect([...ids].sort()).toEqual(['t-0001', 't-0002', 't-0003', 't-0004'])
    assertSlots(ids, true)
    expect(container.querySelectorAll('.pm-export-slot')).toHaveLength(4)
    expect(observe('grouped-wrap').find(row => row.id === 't-0004')?.text).toContain('已收尾')
  })
  it('S06 长标题/完整slot保持真实编辑入口，开关未改表单零业务写', async () => {
    await mount()
    await click('[data-pm-row="t-0001"] .pt-acts button')
    const titleInput = container.querySelector<HTMLInputElement>('form.pm-drawer-form [name="title"]')
    expect(titleInput?.value).toBe(longTitle)
    assertZeroWrite()
    const cancel = [...container.querySelectorAll<HTMLButtonElement>('form.pm-drawer-form button')]
      .find(button => button.textContent?.trim() === '取消')
    expect(cancel).toBeDefined()
    await act(async () => { cancel!.click() })
    expect(container.querySelector('form.pm-drawer-form')).toBeNull()
    assertSlots(['t-0002', 't-0003', 't-0001', 't-0004'], true)
  })
  it.each(['S07 非数组 audit 按既有read回落', 'S08 缺 audit 行按既有read回落'])('%s', async () => {
    const snap = JSON.parse(await execute('web snapshot'))
    expect(snap.latestExports).toEqual({ 'p-0001': null, 'p-0002': null, 'p-0003': null })
    await mount()
    assertSlots(['t-0002', 't-0003', 't-0001', 't-0004'], false)
  })
})
