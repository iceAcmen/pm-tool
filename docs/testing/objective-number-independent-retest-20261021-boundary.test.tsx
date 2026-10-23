// 独立专家补测，原 F2/报告常量作为 oracle，不从产品算法反算 expected。
import { appendFileSync, readFileSync, readdirSync, statSync, mkdtempSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { TaskTable } from './tasks.js'
import { Overview } from './overview.js'
import { GanttView } from './gantt.js'
import { handleTaskCommand } from '../../commands/task.js'
import { taskRecordSchema, type Task } from '../../core/task.js'
import { pmDomainSpec } from '../../core/storage.js'
import { getTask, listTasks } from '../../core/tasks.js'
import { precheckBackup, applyBackup, validateBackup, collectBackup } from '../../core/backup.js'
import { deriveProjectProgress, deriveProgressMap } from '../../core/progress-derivation.js'

const fixture = JSON.parse(readFileSync(process.env.QA_FIXTURE!, 'utf8'))
const backup = validateBackup(JSON.parse(readFileSync(process.env.QA_BACKUP!, 'utf8')))
const noop = () => {}
const run = vi.fn(async (_line: string) => true)
const mounts: ReactTestRenderer[] = []
const facilities: DomainFacility[] = []
const event = (id: string, data: unknown) => appendFileSync(process.env.QA_EVIDENCE!,
  JSON.stringify({ id, at: new Date().toISOString(), data }) + '\n')
const fresh = (): Task[] => fixture.tasks.map((t: unknown) => taskRecordSchema.parse(t))
const text = (n: ReactTestInstance): string => n.children.map(c =>
  typeof c === 'string' ? c : text(c)).join('')
function mount(element: ReturnType<typeof createElement>) {
  let rendered!: ReactTestRenderer
  act(() => { rendered = create(element) })
  mounts.push(rendered)
  return rendered
}
function tasksElement(tasks: Task[]) {
  return createElement(TaskTable, { tasks, milestones: [], projectId: fixture.ids.project,
    onCreate: noop, onEdit: noop, onGenWbs: noop, onSaved: noop, run, execute: async () => '' })
}
function overviewElement(tasks: Task[]) {
  return createElement(Overview, { tasks, milestones: [], riskIssues: [],
    project: backup.projects[0] })
}
function cell(root: ReactTestInstance, id: string, className = 'pt-cell pt-prog') {
  return root.findByProps({ 'data-pm-row': id }).findByProps({ className })
}
function manifest(root: string): Record<string, unknown> {
  return Object.fromEntries(readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const file = join(root, entry.name)
    if (entry.isDirectory()) return Object.entries(manifest(file))
    const s = statSync(file)
    return [[file, { sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
      size: s.size, mtimeMs: s.mtimeMs }]]
  }))
}
async function domainFixture(oldUrl?: string) {
  const root = mkdtempSync(join(tmpdir(), 'independent-op-domain-'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  facilities.push(facility)
  const domain = await facility.open(pmDomainSpec)
  const data = structuredClone(backup)
  if (oldUrl) data.tasks.find(t => t.id === fixture.ids.L3)!.evidenceUrl = oldUrl
  await precheckBackup(data)
  await applyBackup(domain, data, join(root, 'backups'))
  return { domain, root }
}
beforeEach(() => {
  run.mockClear()
  vi.stubGlobal('window', { addEventListener: noop, removeEventListener: noop,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout })
})
afterEach(async () => {
  for (const m of mounts.splice(0)) act(() => m.unmount())
  for (const f of facilities.splice(0)) await f.closeAll()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('OP-SRC-01/OP-RU-01 原F2合法且常量：P63覆盖2/3、项目66覆盖4/7、pending1', () => {
  const tasks = fresh()
  expect(tasks).toEqual(fixture.tasks)
  const parent = deriveProgressMap(tasks).get(fixture.ids.P)!
  const project = deriveProjectProgress(tasks, fixture.ids.project)
  expect(parent.value).toBe(63)
  expect(parent.coverage).toMatchObject({ coveredLeaves: 2, totalLeaves: 3 })
  expect(project.value).toBe(66)
  expect(project.coverage).toMatchObject({ coveredLeaves: 4, totalLeaves: 7 })
  expect(project.pendingAcceptanceCount).toBe(1)
  event('OP-SRC-01/F2', { parent, project, expected: { parent: 63, project: 66, covered: '4/7' } })
})

it('OP-LEG-04/EV-02/BD-04 真实旧JSON恢复后列表/树/总览/甘特mount和unmount零写', async () => {
  const { domain, root } = await domainFixture('javascript:legacy(1)')
  const before = manifest(root)
  const records = listTasks(domain, fixture.ids.project)
  const input = structuredClone(records)
  const table = mount(tasksElement(records))
  act(() => table.root.findByProps({ className: 'pt-ghost pm-group-toggle' }).props.onClick())
  mount(overviewElement(records))
  mount(createElement(GanttView, { tasks: records, milestones: [], run, onEdit: noop, onCreate: noop }))
  for (const m of mounts.splice(0)) act(() => m.unmount())
  expect(records).toEqual(input)
  expect(run).not.toHaveBeenCalled()
  expect(manifest(root)).toEqual(before)
  event('OP-LEG-04/AUTO-render-only', { before, after: manifest(root), records: input })
})

it.each([30, 0])('RA-OP01/02 真实命令人工%d再clear：列表/tree/总览同一父63，JSON客观不变', async manual => {
  const { domain } = await domainFixture()
  const id = fixture.ids.P
  const before = structuredClone(getTask(domain, id))
  const response = await handleTaskCommand(`update ${id} ${JSON.stringify({
    manualProgress: manual, manualProgressNote: '独立现场确认',
  })}`, domain)
  expect(response.kind).toBe('success')
  const records = listTasks(domain, fixture.ids.project)
  const table = mount(tasksElement(records))
  const assertTable = () => {
    expect(text(cell(table.root, id))).toContain(`人工设定 ${manual}%`)
    expect(text(cell(table.root, id))).toContain('客观 63%')
    expect(text(cell(table.root, id))).toContain('覆盖 2/3')
  }
  assertTable()
  act(() => table.root.findByProps({ className: 'pt-ghost pm-group-toggle' }).props.onClick())
  assertTable()
  const overview = mount(overviewElement(records))
  const phase = overview.root.findAllByProps({ className: 'ov-phase' }).find(n => text(n).includes('F2-P'))!
  expect(text(phase)).toContain(`人工设定 ${manual}%`)
  expect(text(phase)).toContain('客观 63%')
  expect(deriveProjectProgress(records, fixture.ids.project).value).toBe(66)
  expect((await handleTaskCommand(`update ${id} {"manualProgress":null}`, domain)).kind).toBe('success')
  const cleared = listTasks(domain, fixture.ids.project)
  act(() => table.update(tasksElement(cleared)))
  expect(text(cell(table.root, id))).not.toContain('人工设定')
  expect(text(cell(table.root, id))).toContain('客观 63%')
  expect(getTask(domain, id)!.manualProgressNote).toBeUndefined()
  expect(getTask(domain, id)!.checklist).toEqual(before!.checklist)
  expect(getTask(domain, id)!.progress).toBe(before!.progress)
  expect(getTask(domain, id)!.status).toBe(before!.status)
  event(`RA-OP01/02/manual-${manual}`, { response, before, after: getTask(domain, id) })
})

it('OP-EV-01/DV-06 列表非空零勾显示0但无清单null无bar；总览null只显示—及证据不足', () => {
  const tasks = fresh()
  tasks.find(t => t.id === fixture.ids.L1)!.checklist!.forEach(i => { i.done = false })
  const table = mount(tasksElement(tasks))
  const zero = cell(table.root, fixture.ids.L1)
  const absent = cell(table.root, fixture.ids.L3)
  expect(text(zero)).toContain('客观 0%')
  expect(text(zero)).not.toContain('证据不足')
  expect(zero.findByProps({ className: 'pt-bar' }).findByType('i').props.style.width).toBe('0%')
  expect(text(absent)).toContain('客观 证据不足')
  expect(absent.findAllByProps({ className: 'pt-bar' })).toHaveLength(0)
  const overview = mount(overviewElement(tasks))
  const phase = overview.root.findAllByProps({ className: 'ov-phase' }).find(n => text(n).includes('F2-L6'))!
  expect(text(phase)).toContain('证据不足')
  expect(text(phase.findByProps({ className: 'ov-pct' }))).toBe('—')
  event('OP-EV-01/render', { zero: text(zero), absent: text(absent), nullPhase: text(phase) })
})

it.each(['javascript:alert(1)', 'data:text/html,qa', 'ftp://example.com/a', '//example.com',
  'https://', '不是链接', '', 'https://example.com/' + 'a'.repeat(2048)])(
  'RA-OP04 非法新写%s：生产add/update同其他字段组合均拒绝，完整JSON清单零变化', async url => {
    const { domain, root } = await domainFixture('javascript:legacy(1)')
    const before = manifest(root)
    const record = structuredClone(getTask(domain, fixture.ids.L3))
    const added = await handleTaskCommand(`add ${JSON.stringify({
      projectId: fixture.ids.project, title: '不可创建', effortHours: 3.5, evidenceUrl: url,
    })}`, domain)
    const updated = await handleTaskCommand(`update ${fixture.ids.L3} ${JSON.stringify({
      title: '不可改名', evidenceUrl: url, manualProgress: 30,
    })}`, domain)
    expect(added.kind).toBe('error')
    expect(updated.kind).toBe('error')
    expect(getTask(domain, fixture.ids.L3)).toEqual(record)
    expect(manifest(root)).toEqual(before)
    event('RA-OP04/invalid-write', { url, added, updated, record, before, after: manifest(root) })
  })

it('RA-OP04 合法http(s)trim及工时3.5：旧值无关更新/备份往返保留，不改legacy/checklist/status', async () => {
  const { domain, root } = await domainFixture('javascript:legacy(1)')
  const old = structuredClone(getTask(domain, fixture.ids.L3))
  expect((await handleTaskCommand(`update ${fixture.ids.L3} {"description":"只改说明"}`, domain)).kind).toBe('success')
  expect(getTask(domain, fixture.ids.L3)!.evidenceUrl).toBe(old!.evidenceUrl)
  const beforeRead = manifest(root)
  const roundtrip = collectBackup(domain)
  await precheckBackup(roundtrip)
  expect(roundtrip.tasks.find(t => t.id === fixture.ids.L3)!.evidenceUrl).toBe(old!.evidenceUrl)
  expect(manifest(root)).toEqual(beforeRead)
  const target = structuredClone(getTask(domain, fixture.ids.L1))!
  for (const url of [' http://example.com/qa ', ' https://example.com/qa ']) {
    expect((await handleTaskCommand(`update ${target.id} ${JSON.stringify({
      evidenceUrl: url, effortHours: 3.5,
    })}`, domain)).kind).toBe('success')
    expect(getTask(domain, target.id)!.evidenceUrl).toBe(url.trim())
    expect(getTask(domain, target.id)!.effortHours).toBe(3.5)
    expect(getTask(domain, target.id)!.checklist).toEqual(target.checklist)
    expect(getTask(domain, target.id)!.progress).toBe(target.progress)
    expect(getTask(domain, target.id)!.status).toBe(target.status)
  }
  const beforeBad = manifest(root)
  expect((await handleTaskCommand(`update ${target.id} {"effortHours":-1}`, domain)).kind).toBe('error')
  expect(manifest(root)).toEqual(beforeBad)
  event('RA-OP04/valid-and-old', { old, restored: getTask(domain, old!.id), target: getTask(domain, target.id) })
})

it('OP-SRC-05/RA-OP01 甘特人工70填70保客观40；键盘生产命令只改日期和updatedAt', async () => {
  const { domain } = await domainFixture()
  const id = fixture.ids.L5
  await handleTaskCommand(`update ${id} {"manualProgress":70,"startDate":"2026-10-21","dueDate":"2026-10-23"}`, domain)
  const before = structuredClone(listTasks(domain, fixture.ids.project))
  const sent: string[] = []
  const productionRun = async (line: string) => {
    sent.push(line)
    return (await handleTaskCommand(line.replace(/^task /, ''), domain)).kind === 'success'
  }
  const rendered = mount(createElement(GanttView, { tasks: before, milestones: [], run: productionRun,
    onEdit: noop, onCreate: noop }))
  const bar = rendered.root.findByProps({ 'data-task-id': id })
  expect(bar.findByProps({ className: 'pm-gantt-bar-progress' }).props.style.width).toBe('70%')
  expect(bar.props['aria-label']).toContain('人工设定 70%')
  expect(bar.props['aria-label']).toContain('客观 40%')
  await act(async () => { await bar.props.onKeyDown({ key: 'ArrowRight', preventDefault: noop }) })
  expect(sent).toEqual([`task update ${id} {"startDate":"2026-10-22","dueDate":"2026-10-24"}`])
  const after = listTasks(domain, fixture.ids.project)
  const targetBefore = before.find(t => t.id === id)!
  const targetAfter = after.find(t => t.id === id)!
  const fields = Object.keys({ ...targetBefore, ...targetAfter }).filter(k =>
    JSON.stringify((targetBefore as any)[k]) !== JSON.stringify((targetAfter as any)[k]))
  expect(fields.filter(k => k !== 'updatedAt').sort()).toEqual(['dueDate', 'startDate'])
  expect(after.filter(t => t.id !== id)).toEqual(before.filter(t => t.id !== id))
  expect(deriveProgressMap(after).get(id)!.value).toBe(40)
  event('OP-SRC-05/date-only', { sent, fields, before: targetBefore, after: targetAfter })
})

it('GNHD-01 合法原F2两code：状态在同编号cell、不进任务列，失败仍保手动原值', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('window', { addEventListener: noop, removeEventListener: noop,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout })
  const tasks = fresh().filter(t => [fixture.ids.P, fixture.ids.L4].includes(t.id))
  tasks.forEach(t => { taskRecordSchema.parse(t) })
  const before = structuredClone(tasks)
  const writer = vi.fn().mockRejectedValue(new Error('denied'))
  vi.stubGlobal('navigator', { clipboard: { writeText: writer } })
  const rendered = mount(tasksElement(tasks))
  const code = cell(rendered.root, tasks[0].id, 'pt-cell pt-code')
  const button = code.findByType('button')
  const originalValue = text(button.findByProps({ className: 'pt-code-val' }))
  await act(async () => { button.props.onClick({ stopPropagation: noop }) })
  expect(writer.mock.calls).toEqual([[originalValue]])
  expect(text(button.findByProps({ className: 'pt-code-val' }))).toBe(originalValue)
  const feedback = code.findByProps({ role: 'status' })
  expect(feedback.parent).toBe(code)
  expect(text(feedback)).toBe('复制失败')
  expect(code.findAllByType('svg')).toHaveLength(1)
  const row = rendered.root.findByProps({ 'data-pm-row': tasks[0].id })
  const taskCell = row.findAll(n => typeof n.type === 'string' &&
    /^pt-cell /.test(n.props.className ?? '') && text(n).includes(tasks[0].title))[0]
  expect(taskCell).toBeDefined()
  expect(text(taskCell)).not.toContain('复制失败')
  expect(button.props.title).toContain('手动')
  act(() => { vi.advanceTimersByTime(1600) })
  expect(code.findAllByProps({ role: 'status' })).toHaveLength(0)
  expect(tasks).toEqual(before)
  expect(run).not.toHaveBeenCalled()
  event('GNHD-01/legal-code-structure-only', { originalValue, copyArgs: writer.mock.calls, originalTasks: before })
})

it('RA-OP05 真实完成/显式日期/反转；旧done不补日期，不改清单或造item doneAt', async () => {
  const { domain } = await domainFixture()
  const id = fixture.ids.L1
  const before = structuredClone(getTask(domain, id))!
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  expect(getTask(domain, fixture.ids.L6)!.completedDate).toBeUndefined()
  expect((await handleTaskCommand(`update ${id} {"status":"done"}`, domain)).kind).toBe('success')
  expect(getTask(domain, id)!.completedDate).toBe(today)
  expect(getTask(domain, id)!.checklist).toEqual(before.checklist)
  expect((await handleTaskCommand(`update ${id} {"completedDate":"2026-10-20"}`, domain)).kind).toBe('success')
  expect(getTask(domain, id)!.completedDate).toBe('2026-10-20')
  expect((await handleTaskCommand(`update ${id} {"status":"todo"}`, domain)).kind).toBe('success')
  expect(getTask(domain, id)!.completedDate).toBeUndefined()
  expect(getTask(domain, fixture.ids.L6)!.completedDate).toBeUndefined()
  expect(getTask(domain, id)!.checklist).toEqual(before.checklist)
  expect(getTask(domain, id)!.progress).toBe(before.progress)
  event('RA-OP05/dates', { today, before, after: getTask(domain, id) })
})
