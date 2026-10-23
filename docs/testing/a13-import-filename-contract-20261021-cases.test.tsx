import { appendFileSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { parseCommand } from '@deepseek-ai/dsh-commands'
import { apply as applyHost } from '../../packages/dsh-pm-tool/src/index.js'
import { apply as applyClient } from '../../packages/dsh-pm-tool/src/client/index.js'
import { PmPanel } from '../../packages/dsh-pm-tool/src/client/panel.js'
import { TaskTable } from '../../packages/dsh-pm-tool/src/client/views/tasks.js'
import { openPmDomain } from '../../packages/dsh-pm-tool/src/core/storage.js'
import { listTasks } from '../../packages/dsh-pm-tool/src/core/tasks.js'
import { parseCsv, planGridCsvImport, readXlsxGridFromBuffer } from '../../packages/dsh-pm-tool/src/core/csv-import.js'

const noop = () => {}
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex')
const record = (id: string, data: unknown) => appendFileSync(process.env.A13_OBSERVATIONS!,
  `${JSON.stringify({ id, at: new Date().toISOString(), data })}\n`)
const formats = ['csv', 'xlsx'] as const
const names = [
  'QA 原生导入', '原生导入', 'QA "原生"导入', "QA '原生'导入",
  'QA\\原生导入', 'QA 原生"引号\'\\反斜杠',
]
const matrix = formats.flatMap(format => names.map(name => ({ format, name: `${name}.${format}` })))
const mounts: ReactTestRenderer[] = []
const facilities: DomainFacility[] = []
let local: Map<string, string>
let reader: { result: string | ArrayBuffer | null, onload: () => Promise<void>, mode: string }
const text = (node: ReactTestInstance): string => node.children.map(child =>
  typeof child === 'string' ? child : text(child)).join('')
function button(root: ReactTestInstance, label: string) {
  const found = root.findAllByType('button').find(node => text(node) === label)
  expect(found, `按钮 ${label}`).toBeTruthy()
  return found!
}
function disk(root: string): Record<string, string> {
  const files: Record<string, string> = {}
  function walk(dir: string, prefix: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name), `${prefix}${entry.name}/`)
      else if (entry.isFile()) files[`${prefix}${entry.name}`] = sha(readFileSync(join(dir, entry.name)))
    }
  }
  walk(root, '')
  return files
}
function input(format: typeof formats[number], invalid = false) {
  const name = `QA ${invalid ? '非法日期' : '原生导入'}.${format}`
  const bytes = readFileSync(join(process.env.A13_NATIVE_ROOT!, name))
  const content = format === 'csv' ? bytes.toString('utf8') : bytes.toString('base64')
  const array = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  return { bytes, content, read: format === 'csv' ? content : array }
}
async function open(root: string) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.provide('storageDomain', facility)
  facilities.push(facility)
  return { facility, domain: await openPmDomain(ctx) }
}
async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'a13-import-json-'))
  const storage = await open(root)
  let descriptor: any
  await applyHost({
    storageDomain: { open: async () => storage.domain },
    effect: (fn: () => unknown) => fn(), reflect: { get: () => undefined },
    commands: { register: (value: unknown) => { descriptor = value } },
    webServer: undefined, connection: undefined,
  } as any)
  expect(descriptor.name).toBe('pm')
  const calls: any[] = []
  const pending: Promise<unknown>[] = []
  const command = async (line: string) => {
    const parsed = parseCommand(line)
    expect(parsed?.name).toBe('pm')
    expect(parsed?.rawInput).toBe(line.slice(3))
    const result = await descriptor.handler({ rawInput: parsed!.rawInput })
    const call = { line, rawInput: parsed!.rawInput, result }
    calls.push(call)
    record('production-handler', { root, ...call, taskCount: [...storage.domain.table('tasks').entries()].length })
    return result
  }
  const success = async (raw: string) => {
    const result = await command(`/pm ${raw}`)
    expect(result.kind, result.text).toBe('success')
    return result
  }
  await success('project add {"name":"A13旁路","startDate":"2026-10-21","targetDate":"2026-12-31"}')
  await success('project add {"name":"A13文件名","startDate":"2026-10-21","targetDate":"2026-12-31"}')
  const projects = [...storage.domain.table('projects').entries()].map(([, value]) => value)
  const other = projects[0]
  const project = projects[1]
  await success(`task add ${JSON.stringify({ projectId: other.id, title: '旁路保留' })}`)
  const outside = structuredClone(listTasks(storage.domain, other.id))
  let gate: ((line: string) => Promise<void>) | undefined
  let failure: string | undefined
  const transport: any[] = []
  let api: any
  applyClient({
    sessions: { list: { getSnapshot: () => ({ ids: ['a13-session'] }) }, create: async () => 'a13-created' },
    remote: { commands: { execute: (_session: string, line: string, attachments: unknown[]) => {
      const operation = (async () => {
        transport.push({ session: _session, line, attachments })
        record('client-remote-capture', { session: _session, line, attachments })
        if (gate) await gate(line)
        if (line.endsWith(' confirm') && failure) {
          record('transport-only-failure', { line, failure, handlerCalled: false })
          if (failure === 'reject') throw new Error('传输中断')
          return { ok: true, value: { result: { kind: 'error', text: '传输返回拒绝' } } }
        }
        const result = await command(line)
        return { ok: true, value: { result } }
      })()
      pending.push(operation)
      return operation
    } } },
    slots: {
      inject: (_name: string, fn: () => unknown) => fn(),
      register: (options: any) => { if (options.key === 'pm-tool') api = options.inject() },
    },
  } as any)
  expect(typeof api.execute).toBe('function')
  const flush = async () => {
    for (let i = 0; i < 15; i++) {
      const count = pending.length
      await Promise.allSettled(pending)
      await new Promise(resolve => setTimeout(resolve, 0))
      if (count === pending.length) return
    }
    throw new Error('设施异步未排空')
  }
  return { ...storage, root, project, other, outside, calls, transport, api, command, success, flush,
    setFailure: (next: string | undefined) => { failure = next },
    setGate: (next: typeof gate) => { gate = next } }
}
type Fixture = Awaited<ReturnType<typeof fixture>>
async function mount(f: Fixture) {
  local.set('pm-selected-project', f.project.id)
  local.set('pm-view', 'tasks')
  let m!: ReactTestRenderer
  await act(async () => { m = create(createElement(PmPanel, f.api)); await f.flush() })
  mounts.push(m)
  expect(m.root.findAllByType(TaskTable)).toHaveLength(1)
  return m
}
async function select(f: Fixture, m: ReactTestRenderer, name: string, content: string | ArrayBuffer) {
  await act(async () => {
    m.root.findByProps({ className: 'pm-import-file' }).props.onChange({
      currentTarget: { files: [{ name }], value: name },
    })
    reader.result = content
    await reader.onload()
    await f.flush()
  })
}
async function confirm(f: Fixture, m: ReactTestRenderer) {
  await act(async () => { button(m.root, '确认落盘').props.onClick(); await f.flush() })
}
async function savedOracle(f: Fixture) {
  const tasks = listTasks(f.domain, f.project.id)
  expect(tasks).toHaveLength(2)
  expect(tasks[0]).toMatchObject({ title: 'QA原生导入根', parentId: null, code: '1', assignee: '测试甲',
    priority: 'P1', startDate: '2026-10-22', dueDate: '2026-11-01', progress: 0 })
  expect(tasks[1]).toMatchObject({ title: 'QA原生导入子', parentId: tasks[0].id, code: '1.1', assignee: '测试乙',
    priority: 'P2', startDate: '2026-10-22', dueDate: '2026-10-30', progress: 10 })
  expect(listTasks(f.domain, f.other.id)).toEqual(f.outside)
  const saved = disk(f.root)
  await f.facility.closeAll()
  const reopened = await open(f.root)
  expect(listTasks(reopened.domain, f.project.id)).toEqual(tasks)
  expect(disk(f.root)).toEqual(saved)
  record('json-reopen', { root: f.root, tasks, files: saved })
}

beforeEach(() => {
  local = new Map()
  vi.stubGlobal('localStorage', { getItem: (k: string) => local.get(k) ?? null,
    setItem: (k: string, v: string) => local.set(k, v), removeItem: (k: string) => local.delete(k) })
  vi.stubGlobal('window', { location: { hash: '', search: '', pathname: '/' },
    addEventListener: noop, removeEventListener: noop, setTimeout, clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }) })
  vi.stubGlobal('document', { activeElement: null, querySelector: () => null,
    addEventListener: noop, removeEventListener: noop, body: { dataset: {} } })
  vi.stubGlobal('HTMLElement', class {})
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { fn(); return 1 })
  vi.stubGlobal('cancelAnimationFrame', noop)
  vi.stubGlobal('FileReader', class {
    result: string | ArrayBuffer | null = null
    onload!: () => Promise<void>
    mode = ''
    constructor() { reader = this }
    readAsText() { this.mode = 'text' }
    readAsArrayBuffer() { this.mode = 'array' }
  })
})
afterEach(async () => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  for (const facility of facilities.splice(0)) await facility.closeAll()
  vi.unstubAllGlobals()
})

it('FIXTURE-01 原四文件hash/长度与生产预检合法性', async () => {
  const expected = JSON.parse(readFileSync(join(process.env.A13_NATIVE_ROOT!, 'source-hashes.json'), 'utf8'))
  const f = await fixture()
  for (const format of formats) {
    for (const invalid of [false, true]) {
      const value = input(format, invalid)
      const name = `QA ${invalid ? '非法日期' : '原生导入'}.${format}`
      expect(value.bytes.length).toBe(expected[name].bytes)
      expect(sha(value.bytes)).toBe(expected[name].sha)
      const grid = format === 'csv' ? parseCsv(value.content) : await readXlsxGridFromBuffer(value.bytes)
      if (invalid) expect(() => planGridCsvImport(f.domain, f.project.id, grid)).toThrow(/第 3 行.*dueDate/)
      else {
        const plan = planGridCsvImport(f.domain, f.project.id, grid)
        expect(plan.total).toBe(2)
        expect(plan.outline.map(row => row.title)).toEqual(['QA原生导入根', 'QA原生导入子'])
      }
      record('fixture-validity', { name, size: value.bytes.length, hash: sha(value.bytes), grid })
    }
  }
})

it.each(formats)('BASE-01 %s 同字节ASCII真实组件预览/confirm/重开', async format => {
  const f = await fixture()
  const m = await mount(f)
  const value = input(format)
  const before = disk(f.root)
  await select(f, m, `qa.${format}`, value.read)
  const preview = f.calls.find(call => call.line.startsWith('/pm task import-content'))!
  expect(preview.result.kind, preview.result.text).toBe('success')
  expect(preview.line).toContain(JSON.stringify(value.content))
  expect(reader.mode).toBe(format === 'csv' ? 'text' : 'array')
  expect(disk(f.root)).toEqual(before)
  await confirm(f, m)
  const calls = f.calls.filter(call => call.line.startsWith('/pm task import-content'))
  expect(calls[1].line).toBe(`${preview.line} confirm`)
  expect(m.root.findAllByProps({ className: 'pt-import' })).toHaveLength(0)
  await savedOracle(f)
})

it('BASE-02 旧无引号ASCII生产命令仍兼容', async () => {
  const f = await fixture()
  const line = `task import-content ${f.project.id} qa.csv ${JSON.stringify(input('csv').content)}`
  await f.success(line)
  await f.success(`${line} confirm`)
  await savedOracle(f)
})

it.each(formats)('BASE-03 %s preview取消/重开全库零写', async format => {
  const f = await fixture()
  const m = await mount(f)
  const before = disk(f.root)
  await select(f, m, `qa.${format}`, input(format).read)
  act(() => button(m.root.findByProps({ className: 'pt-import' }), '取消').props.onClick())
  expect(f.calls.filter(call => call.line.endsWith(' confirm'))).toHaveLength(0)
  expect(disk(f.root)).toEqual(before)
  await f.facility.closeAll()
  const reopened = await open(f.root)
  expect(listTasks(reopened.domain, f.project.id)).toEqual([])
  expect(disk(f.root)).toEqual(before)
})

it('BASE-04 同帧双确认busy/取消/重选锁不变', async () => {
  const f = await fixture()
  const m = await mount(f)
  await select(f, m, 'qa.csv', input('csv').read)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  f.setGate(async line => { if (line.endsWith(' confirm')) await gate })
  const click = button(m.root, '确认落盘').props.onClick
  act(() => { click(); click() })
  const count = f.transport.filter(call => call.line.endsWith(' confirm')).length
  const confirmDisabled = button(m.root, '确认落盘').props.disabled
  const cancel = button(m.root.findByProps({ className: 'pt-import' }), '取消')
  const cancelDisabled = cancel.props.disabled
  const file = m.root.findByProps({ className: 'pm-import-file' })
  const fileDisabled = file.props.disabled
  const previews = f.transport.filter(call => call.line.startsWith('/pm task import-content')).length
  act(() => {
    cancel.props.onClick()
    file.props.onChange({ currentTarget: { files: [{ name: 'other.csv' }], value: 'other.csv' } })
  })
  const stayed = m.root.findAllByProps({ className: 'pt-import' }).length
  const after = f.transport.filter(call => call.line.startsWith('/pm task import-content')).length
  await act(async () => { release(); await f.flush() })
  expect({ count, confirmDisabled, cancelDisabled, fileDisabled, stayed, after })
    .toEqual({ count: 1, confirmDisabled: true, cancelDisabled: true, fileDisabled: true, stayed: 1, after: previews })
  await savedOracle(f)
})

it.each(['false', 'reject'])('BASE-05 %s失败保原预览/原confirm可重试', async mode => {
  const f = await fixture()
  const m = await mount(f)
  await select(f, m, 'qa.csv', input('csv').read)
  const preview = f.calls.find(call => call.line.startsWith('/pm task import-content'))!
  const before = disk(f.root)
  const original = text(m.root.findByProps({ className: 'pt-import' }).findByType('pre'))
  // 明确的执行边界失败注入，不替代产品分词/导入。
  f.setFailure(mode)
  await confirm(f, m)
  expect(disk(f.root)).toEqual(before)
  expect(text(m.root.findByProps({ className: 'pt-import' }).findByType('pre'))).toBe(original)
  expect(button(m.root, '确认落盘').props.disabled).toBe(false)
  expect(m.root.findByProps({ className: 'pt-import' }).findAllByProps({ role: 'alert' })).toHaveLength(1)
  f.setFailure(undefined)
  await confirm(f, m)
  expect(f.transport.filter(call => call.line.endsWith(' confirm')).map(call => call.line))
    .toEqual([`${preview.line} confirm`, `${preview.line} confirm`])
  await savedOracle(f)
})

it.each(formats)('BASE-06 %s 原非法后行preview/两次直接confirm零写', async format => {
  const f = await fixture()
  const m = await mount(f)
  const before = disk(f.root)
  await select(f, m, `qa.${format}`, input(format, true).read)
  const preview = f.calls.find(call => call.line.startsWith('/pm task import-content'))!
  expect(preview.result.kind).toBe('error')
  expect(preview.result.text).toMatch(/第 3 行.*dueDate/)
  expect(m.root.findAllByProps({ className: 'pt-primary pm-import-confirm' })).toHaveLength(0)
  for (let i = 0; i < 2; i++) {
    const result = await f.command(`${preview.line} confirm`)
    expect(result.kind).toBe('error')
    expect(result.text).toMatch(/第 3 行.*dueDate/)
    expect(disk(f.root)).toEqual(before)
  }
  act(() => button(m.root.findByProps({ className: 'pt-import' }), '取消').props.onClick())
  await f.facility.closeAll()
  await open(f.root)
  expect(disk(f.root)).toEqual(before)
})

it.each(matrix)('AUTO-NAME $format $name 真实组件到生产handler完整参数', async ({ format, name }) => {
  const f = await fixture()
  const m = await mount(f)
  const value = input(format)
  const before = disk(f.root)
  await select(f, m, name, value.read)
  const preview = f.calls.find(call => call.line.startsWith('/pm task import-content'))!
  expect(disk(f.root)).toEqual(before)
  expect(preview.line).toContain(JSON.stringify(value.content))
  record('filename-preview', { format, name, ...preview, sourceHash: sha(value.bytes) })
  expect(preview.result.kind, preview.result.text).toBe('success')
  expect(preview.result.text).toContain(`已解析上传文件 ${name}：`)
  await confirm(f, m)
  const calls = f.calls.filter(call => call.line.startsWith('/pm task import-content'))
  expect(calls[1].line).toBe(`${preview.line} confirm`)
  expect(calls[1].result.kind, calls[1].result.text).toBe('success')
  await savedOracle(f)
})

it.each(formats)('AUTO-TEMPLATE %s 两模板JSON quote及confirm后缀采样', async format => {
  const f = await fixture()
  const value = input(format)
  const name = `QA 原生导入.${format}`
  const ascii = await f.command(`/pm task import-content ${f.project.id} qa.${format} ${JSON.stringify(value.content)}`)
  expect(ascii.kind).toBe('success')
  const captures: string[] = []
  const execute = async (line: string) => {
    captures.push(line)
    record('template-only-controlled-transport', { line, control: 'same-byte ASCII production preview' })
    return ascii.text
  }
  const run = vi.fn(async (line: string) => { captures.push(line); return false })
  let m!: ReactTestRenderer
  act(() => { m = create(createElement(TaskTable, {
    tasks: [], milestones: [], projectId: f.project.id, onCreate: noop, onEdit: noop,
    onGenWbs: noop, onSaved: noop, execute, run,
  })) })
  mounts.push(m)
  const before = disk(f.root)
  await select(f, m, name, value.read)
  await act(async () => { button(m.root, '确认落盘').props.onClick(); await Promise.all(run.mock.results.map(r => r.value)) })
  record('both-template-capture', { format, name, captures, productionAcceptance: false })
  expect(disk(f.root)).toEqual(before)
  expect(captures[1]).toBe(`${captures[0]} confirm`)
  const expected = `task import-content ${f.project.id} ${JSON.stringify(name)} ${JSON.stringify(value.content)}`
  expect.soft(captures[0]).toBe(expected)
  expect.soft(captures[1]).toBe(`${expected} confirm`)
})

it.each(matrix)('PROTOCOL-QUOTE $format $name 实际生产JSON文件名协议preview/confirm', async ({ format, name }) => {
  const f = await fixture()
  const value = input(format)
  const before = disk(f.root)
  const line = `/pm task import-content ${f.project.id} ${JSON.stringify(name)} ${JSON.stringify(value.content)}`
  const preview = await f.command(line)
  expect(disk(f.root)).toEqual(before)
  const confirmed = await f.command(`${line} confirm`)
  record('json-quote-protocol', { format, name, line, preview, confirmed, files: disk(f.root) })
  if (confirmed.kind === 'error') expect(disk(f.root)).toEqual(before)
  expect.soft(preview.kind, `preview: ${preview.text}`).toBe('success')
  expect.soft(preview.text).toContain(`已解析上传文件 ${name}：`)
  expect.soft(confirmed.kind, `confirm: ${confirmed.text}`).toBe('success')
  if (preview.kind === 'success' && confirmed.kind === 'success') await savedOracle(f)
})
