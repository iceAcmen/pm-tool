import { appendFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import * as XLSX from 'xlsx'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { TaskTable } from './tasks.js'
import { handleTaskCommand } from '../../commands/task.js'
import { addProject } from '../../core/projects.js'
import { listTasks } from '../../core/tasks.js'
import { openPmDomain } from '../../core/storage.js'

const noop = () => {}
const csv = '层级,标题,负责人,优先级,开始,截止,进度\n1,A9父,张三,P1,2026-10-21,2026-11-10,20\n2,A9子,李四,P2,2026-10-22,2026-11-09,30'
const csvFilename = 'QA 原生"引号\'\\反斜杠.csv'
const xlsxFilename = 'QA 原生"引号\'\\反斜杠.xlsx'
const mounts: ReactTestRenderer[] = []
const facilities: DomainFacility[] = []
let reader: { result: string | ArrayBuffer | null, onload: () => Promise<void> }
function observe(data: unknown) {
  if (process.env.A9_IMPORT_OBSERVATIONS) {
    appendFileSync(process.env.A9_IMPORT_OBSERVATIONS, `${JSON.stringify(data)}\n`)
  }
}

async function open(root: string) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  ctx.provide('storageDomain', facility)
  facilities.push(facility)
  const domain = await openPmDomain(ctx)
  observe({ event: 'open', root, tasks: [...domain.table('tasks').entries()] })
  return { facility, domain }
}

async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'pmtool-a9-import-data-'))
  const storage = await open(root)
  const project = await addProject(storage.domain, {
    name: 'A9 导入确认', startDate: '2026-10-21', targetDate: '2026-12-31',
  })
  const calls: { phase: string, line: string, kind: string, text: string }[] = []
  const command = async (phase: string, line: string) => {
    const result = await handleTaskCommand(line.slice('task '.length), storage.domain)
    calls.push({ phase, line, kind: result.kind, text: result.text })
    observe({ event: 'command', root, phase, line, result, tasks: listTasks(storage.domain, project.id) })
    return result
  }
  const onSaved = vi.fn()
  const run = vi.fn(async (line: string) => (await command('confirm', line)).kind === 'success')
  const execute = vi.fn(async (line: string) => (await command('preview', line)).text)
  let mounted!: ReactTestRenderer
  act(() => {
    mounted = create(createElement(TaskTable, {
      tasks: [], milestones: [], projectId: project.id, onCreate: noop, onEdit: noop,
      onGenWbs: noop, onSaved, execute, run,
    }))
  })
  mounts.push(mounted)
  return { ...storage, root, project, calls, command, run, execute, onSaved, mounted }
}

function text(node: ReactTestInstance): string {
  return node.children.map(child => typeof child === 'string' ? child : text(child)).join('')
}
function button(root: ReactTestInstance, label: string) {
  return root.findAllByType('button').find(node => text(node) === label)!
}
async function select(mounted: ReactTestRenderer, content: string | ArrayBuffer = csv, name = csvFilename) {
  await act(async () => {
    mounted.root.findByProps({ className: 'pm-import-file' }).props.onChange({
      currentTarget: { files: [{ name }], value: name },
    })
    reader.result = content
    await reader.onload()
  })
}
async function confirm(mounted: ReactTestRenderer) {
  await act(async () => {
    button(mounted.root, '确认落盘').props.onClick()
    await mounted.root.findByType(TaskTable).props.run.mock.results.at(-1).value.catch(noop)
  })
}

beforeEach(() => {
  const local = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => local.set(key, value),
  })
  vi.stubGlobal('window', { addEventListener: noop, removeEventListener: noop,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout })
  vi.stubGlobal('FileReader', class {
    result: string | ArrayBuffer | null = null
    onload!: () => Promise<void>
    constructor() { reader = this }
    readAsText() {}
    readAsArrayBuffer() {}
  })
})
afterEach(async () => {
  for (const mounted of mounts.splice(0)) act(() => mounted.unmount())
  for (const facility of facilities.splice(0)) await facility.closeAll()
  vi.unstubAllGlobals()
})

it('LG-05 CSV：预览零写，确认原内容末尾confirm，落库两层树并重开读回字段', async () => {
  const f = await fixture()
  await select(f.mounted)
  expect(listTasks(f.domain, f.project.id)).toHaveLength(0)
  expect(f.calls[0].line).toBe(`task import-content ${f.project.id} ${JSON.stringify(csvFilename)} ${JSON.stringify(csv)}`)
  await confirm(f.mounted)
  expect(f.calls[1].line).toBe(`${f.calls[0].line} confirm`)
  expect(listTasks(f.domain, f.project.id)).toHaveLength(2)
  expect(f.onSaved).toHaveBeenCalledTimes(1)
  expect(f.mounted.root.findAllByProps({ className: 'pt-import' })).toHaveLength(0)
  await f.facility.closeAll()
  const reopened = await open(f.root)
  const tasks = listTasks(reopened.domain, f.project.id)
  expect(tasks).toHaveLength(2)
  expect(tasks[0]).toMatchObject({
    title: 'A9父', parentId: null, code: '1', assignee: '张三',
    priority: 'P1', startDate: '2026-10-21', dueDate: '2026-11-10', progress: 20,
  })
  expect(tasks[1]).toMatchObject({
    title: 'A9子', parentId: tasks[0].id, code: '1.1', assignee: '李四',
    priority: 'P2', startDate: '2026-10-22', dueDate: '2026-11-09', progress: 30,
  })
})

it('LG-05 busy：同一帧连点只发一次确认，在途禁取消/重选，成功仍只建两条', async () => {
  const f = await fixture()
  await select(f.mounted)
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  f.run.mockImplementation(async line => {
    await pending
    return (await f.command('confirm', line)).kind === 'success'
  })
  const click = button(f.mounted.root, '确认落盘').props.onClick
  act(() => { click(); click() })
  const confirmCount = f.run.mock.calls.length
  const confirmDisabled = button(f.mounted.root, '确认落盘').props.disabled
  const cancel = button(f.mounted.root.findByProps({ className: 'pt-import' }), '取消')
  const cancelDisabled = cancel.props.disabled
  const fileDisabled = f.mounted.root.findByProps({ className: 'pm-import-file' }).props.disabled
  act(() => cancel.props.onClick())
  const stayedOpen = f.mounted.root.findAllByProps({ className: 'pt-import' }).length === 1
  await act(async () => {
    release()
    await Promise.all(f.run.mock.results.map(result => result.value))
  })
  expect(confirmCount).toBe(1)
  expect(confirmDisabled).toBe(true)
  expect(cancelDisabled).toBe(true)
  expect(fileDisabled).toBe(true)
  expect(stayedOpen).toBe(true)
  expect(listTasks(f.domain, f.project.id)).toHaveLength(2)
  expect(f.onSaved).toHaveBeenCalledTimes(1)
})

function spreadsheet() {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['层级', '标题', '负责人', '优先级', '开始', '截止', '进度'],
    [1, 'A9父', '张三', 'P1', '2026-10-21', '2026-11-10', 20],
    [2, 'A9子', '李四', 'P2', '2026-10-22', '2026-11-09', 30],
  ]), 'tasks')
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

it('LG-05 XLSX：FileReader二进制→生产解析，预览零写，确认原base64落库并重开树', async () => {
  const f = await fixture()
  const bytes = spreadsheet()
  await select(f.mounted, bytes, xlsxFilename)
  expect(listTasks(f.domain, f.project.id)).toHaveLength(0)
  expect(f.calls[0].line).toBe(
    `task import-content ${f.project.id} ${JSON.stringify(xlsxFilename)} ${JSON.stringify(Buffer.from(bytes).toString('base64'))}`,
  )
  await confirm(f.mounted)
  expect(f.calls[1].line).toBe(`${f.calls[0].line} confirm`)
  expect(listTasks(f.domain, f.project.id)).toHaveLength(2)
  await f.facility.closeAll()
  const reopened = await open(f.root)
  const tasks = listTasks(reopened.domain, f.project.id)
  expect(tasks).toHaveLength(2)
  expect(tasks[0]).toMatchObject({
    parentId: null, code: '1', title: 'A9父', assignee: '张三',
    priority: 'P1', startDate: '2026-10-21', dueDate: '2026-11-10', progress: 20,
  })
  expect(tasks[1]).toMatchObject({
    parentId: tasks[0].id, code: '1.1', title: 'A9子', assignee: '李四',
    priority: 'P2', startDate: '2026-10-22', dueDate: '2026-11-09', progress: 30,
  })
  expect(f.onSaved).toHaveBeenCalledTimes(1)
})

it.each(['csv', 'xlsx'])('LG-05 取消%s：预览与取消均零任务写，重进仍空', async format => {
  const f = await fixture()
  await select(f.mounted, format === 'csv' ? csv : spreadsheet(), `a9.${format}`)
  expect(listTasks(f.domain, f.project.id)).toHaveLength(0)
  act(() => button(f.mounted.root.findByProps({ className: 'pt-import' }), '取消').props.onClick())
  expect(f.run).not.toHaveBeenCalled()
  expect(f.onSaved).not.toHaveBeenCalled()
  expect(f.mounted.root.findAllByProps({ className: 'pt-import' })).toHaveLength(0)
  await f.facility.closeAll()
  const reopened = await open(f.root)
  expect(listTasks(reopened.domain, f.project.id)).toHaveLength(0)
})

it('LG-05 非法列：生产预览失败无确认入口，取消与重开均零写', async () => {
  const f = await fixture()
  await select(f.mounted, '层级,未知列\n1,坏内容')
  expect(f.calls[0].kind).toBe('error')
  expect(text(f.mounted.root.findByProps({ className: 'pt-import' }))).toMatch(/导入失败/)
  expect(f.mounted.root.findAllByProps({ className: 'pt-primary pm-import-confirm' })).toHaveLength(0)
  act(() => button(f.mounted.root.findByProps({ className: 'pt-import' }), '取消').props.onClick())
  expect(f.run).not.toHaveBeenCalled()
  await f.facility.closeAll()
  const reopened = await open(f.root)
  expect(listTasks(reopened.domain, f.project.id)).toHaveLength(0)
})

it('LG-05 首行非法日期在预览拒绝且零写，无确认入口，取消重开仍零写', async () => {
  const f = await fixture()
  await select(f.mounted, csv.replace('2026-11-10', '2026-02-30'))
  expect(listTasks(f.domain, f.project.id)).toHaveLength(0)
  expect(f.calls[0].kind).toBe('error')
  expect(f.calls[0].text).toMatch(/导入失败/)
  expect(f.mounted.root.findAllByProps({ className: 'pt-primary pm-import-confirm' })).toHaveLength(0)
  expect(f.run).not.toHaveBeenCalled()
  expect(f.mounted.root.findAllByProps({ className: 'pt-import' })).toHaveLength(1)
  expect(f.onSaved).not.toHaveBeenCalled()
  expect(listTasks(f.domain, f.project.id)).toHaveLength(0)
  act(() => button(f.mounted.root.findByProps({ className: 'pt-import' }), '取消').props.onClick())
  await f.facility.closeAll()
  const reopened = await open(f.root)
  expect(listTasks(reopened.domain, f.project.id)).toHaveLength(0)
})

it.each(['false', 'reject'])('LG-05 失败%s：保原预览和内容，可重试且仅成功关闭', async mode => {
  const f = await fixture()
  await select(f.mounted)
  const original = text(f.mounted.root.findByProps({ className: 'pt-import' }).findByType('pre'))
  if (mode === 'false') f.run.mockResolvedValueOnce(false)
  else f.run.mockRejectedValueOnce(new Error('传输中断'))
  await confirm(f.mounted)
  expect(listTasks(f.domain, f.project.id)).toHaveLength(0)
  expect(f.onSaved).not.toHaveBeenCalled()
  expect(text(f.mounted.root.findByProps({ className: 'pt-import' }).findByType('pre'))).toBe(original)
  const alerts = f.mounted.root.findByProps({ className: 'pt-import' }).findAllByProps({ role: 'alert' })
  expect(alerts).toHaveLength(1)
  expect(text(alerts[0])).toMatch(/失败.*重试/)
  expect(button(f.mounted.root, '确认落盘').props.disabled).toBe(false)
  await confirm(f.mounted)
  expect(f.run.mock.calls.map(([line]) => line)).toEqual([
    `${f.calls[0].line} confirm`, `${f.calls[0].line} confirm`,
  ])
  expect(listTasks(f.domain, f.project.id)).toHaveLength(2)
  expect(f.onSaved).toHaveBeenCalledTimes(1)
})
