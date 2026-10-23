import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { PmPanel } from './src/client/panel.js'
import { pmDomainSpec, type PmDomain } from './src/core/storage.js'
import { handleBackupCommand, quoteBackupPath } from './src/commands/backup.js'

let view: ReactTestRenderer | undefined
let facility: DomainFacility
let domain: PmDomain
let root: string
let file: string
let env: Record<string, string | undefined>
let calls: { line: string; result: unknown }[]
const fixture = () => process.env.PM_BACKUP_FIXTURE_DIR!
const json = (x: unknown) => JSON.parse(JSON.stringify(x))
async function manifest(path: string): Promise<Record<string, unknown>> {
  let list
  try { list = await readdir(path, { withFileTypes: true }) } catch (e: any) {
    if (e.code === 'ENOENT') return {}
    throw e
  }
  const out: Record<string, unknown> = {}
  for (const item of list.sort((a, b) => a.name.localeCompare(b.name))) {
    const p = join(path, item.name)
    out[item.name] = item.isDirectory() ? await manifest(p) :
      { size: (await readFile(p)).length, sha256: createHash('sha256').update(await readFile(p)).digest('hex') }
  }
  return out
}
const tables = () => json(Object.fromEntries(Object.keys(pmDomainSpec.tables).map(name =>
  [name, [...domain.table(name as never).entries()]])))
const state = async () => ({ tables: tables(), disk: await manifest(root) })
const snapshot = JSON.stringify({
  projects: [], tasks: [], milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [],
})
const button = (name: string) => view!.root.findAllByType('button').find(n => n.children.includes(name))!
const setPath = (value: string) => act(() =>
  view!.root.findByProps({ id: 'pm-restore-path' }).props.onChange({ currentTarget: { value } }))
const preview = async () => act(async () => { await button('预检本机备份').props.onClick() })
async function second(cancel = false) {
  let pending!: Promise<void>
  act(() => { pending = view!.root.findByProps({ className: 'pm-button pm-button-primary pm-restore-confirm' }).props.onClick() })
  expect(calls.filter(x => / confirm$/.test(x.line))).toHaveLength(0)
  const dialog = view!.root.findByProps({ role: 'dialog' })
  await act(async () => {
    dialog.findAllByType('button').find(n => n.children.includes(cancel ? '取消' : '确认恢复'))!.props.onClick()
    await pending
  })
}
beforeEach(async context => {
  root = join(process.env.PM_BACKUP_WEB_TMP!, `seam-${context.task.id}`)
  await mkdir(root, { recursive: true })
  env = Object.fromEntries(['DSH_PM_FILE_ROOT', 'DSH_PM_BACKUP_DIR'].map(k => [k, process.env[k]]))
  process.env.DSH_PM_FILE_ROOT = join(root, 'files')
  process.env.DSH_PM_BACKUP_DIR = join(root, 'backups')
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
  facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  domain = await facility.open(pmDomainSpec)
  const source = JSON.parse(await readFile(join(fixture(), 'backup.json'), 'utf8'))
  file = join(root, "QA owner's backup with spaces\\literal.json")
  await cp(join(fixture(), 'backup.json'), file)
  await cp(join(fixture(), `backup.json.files.${source.fileBundleId}`),
    `${file}.files.${source.fileBundleId}`, { recursive: true })
  calls = []
  const events = new EventTarget()
  vi.stubGlobal('window', {
    location: { hash: '', pathname: '/', search: '' }, history: { replaceState: vi.fn() },
    matchMedia: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
  })
  vi.stubGlobal('document', { activeElement: null })
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() })
  const execute = async (line: string) => {
    if (line === 'web snapshot') { calls.push({ line, result: snapshot }); return snapshot }
    const result = await handleBackupCommand(line, domain)
    calls.push({ line, result })
    // Production client execute contract: errors reject; successful commands return text.
    if (result.kind === 'error') throw new Error(String(result.text))
    return result.text
  }
  await act(async () => { view = create(createElement(PmPanel, { execute })) })
  act(() => button('更多').props.onClick())
})
afterEach(async context => {
  if (view) act(() => view!.unmount())
  view = undefined
  await writeFile(join(root, 'seam-observations.json'), JSON.stringify({
    case: context.task.name, pid: process.pid, calls, final: await state(),
  }, null, 2))
  await facility.closeAll()
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  vi.unstubAllGlobals()
})

it('BW02/BW03/BW04：真实面板→真handler完整F5路径，空格单引号反斜杠不被shellescape；预检取消零写', async () => {
  const before = await state()
  setPath(file)
  await preview()
  expect(calls[1].line).toBe(`restore "${file}"`)
  expect(calls[1].result).toMatchObject({ kind: 'success' })
  expect(await state()).toEqual(before)
  act(() => view!.root.findByProps({ className: 'pm-tool-button pm-restore-cancel' }).props.onClick())
  expect(await state()).toEqual(before)
  expect(calls).toHaveLength(2)
  act(() => button('更多').props.onClick())
  expect(view!.root.findByProps({ id: 'pm-restore-path' }).props.value).toBe(file)
})

it('BW02/BW07：真实两层确认第二次才执行path confirm，十三表/字节精确等于原expected', async () => {
  setPath(file)
  const before = await state()
  await preview()
  expect(await state()).toEqual(before)
  await second()
  expect(calls.map(x => x.line)).toEqual(['web snapshot', `restore "${file}"`, `restore "${file}" confirm`, 'web snapshot'])
  const expected = JSON.parse(await readFile(join(fixture(), 'expected.json'), 'utf8'))
  expect(tables()).toMatchObject(expected.tables)
  for (const [rel, expectedFile] of Object.entries(expected.manifest)) {
    const bytes = await readFile(join(root, 'files', rel))
    expect({ size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }).toEqual(expectedFile)
  }
  expect(tables().sessions).toEqual([])
  expect(tables().checks).toEqual([])
  await writeFile(join(process.env.PM_BACKUP_WEB_TMP!, 'reopen-target.json'), JSON.stringify({
    root, data: join(root, 'data'), files: join(root, 'files'), expected: join(fixture(), 'expected.json'), parentPid: process.pid,
  }))
})

it('BW04：危险dialog取消不发confirm，保原路径/preview/全根', async () => {
  const before = await state()
  setPath(file)
  await preview()
  await second(true)
  expect(calls).toHaveLength(2)
  expect(await state()).toEqual(before)
  expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(1)
})

it.each(['missing', 'invalid-content'])('BW01/BW04：真实%s失败保输入，无确认成功态，零写', async mode => {
  if (mode === 'missing') file += '.missing'
  else {
    const source = JSON.parse(await readFile(file, 'utf8'))
    source.extra.file_assets[0][1].relPath = '../outside'
    await writeFile(file, JSON.stringify(source))
  }
  const before = await state()
  setPath(file)
  await preview()
  expect(calls[1].result).toMatchObject({ kind: 'error' })
  expect(await state()).toEqual(before)
  expect(view!.root.findByProps({ id: 'pm-restore-path' }).props.value).toBe(file)
  expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(0)
})

it('BW03：空路径按钮禁用；双引号/换行前端拒；其他控制字符真实后端拒且零写', async () => {
  expect(button('预检本机备份').props.disabled).toBe(true)
  setPath('   ')
  expect(button('预检本机备份').props.disabled).toBe(true)
  for (const value of ['/tmp/"x".json', '/tmp/x\nconfirm', '/tmp/x\rconfirm', '/tmp/x\tconfirm', '/tmp/x\0confirm']) {
    const before = await state()
    setPath(value)
    await preview()
    expect(await state()).toEqual(before)
    expect(view!.root.findByProps({ id: 'pm-restore-path' }).props.value).toBe(value)
    expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(0)
  }
  expect(calls.filter(x => / confirm$/.test(x.line))).toHaveLength(0)
  expect(calls.slice(1).every(x => (x.result as any).kind === 'error')).toBe(true)
})

it('BW03：后端onekind quote支持双引号；同时两kind/断token/额外args拒绝不注入', async () => {
  const withDouble = join(root, 'double" quote.json')
  await cp(file, withDouble)
  const source = JSON.parse(await readFile(file, 'utf8'))
  await cp(`${file}.files.${source.fileBundleId}`, `${withDouble}.files.${source.fileBundleId}`, { recursive: true })
  const before = await state()
  expect((await handleBackupCommand(`restore ${quoteBackupPath(withDouble)}`, domain)).kind).toBe('success')
  expect(quoteBackupPath(withDouble)).toBe(`'${withDouble}'`)
  expect(() => quoteBackupPath('both\'"')).toThrow()
  for (const argument of [`restore "${file}"confirm`, `restore "${file}`, `restore "${file}" confirm extra`, `restore "${file}" confirm confirm`]) {
    expect((await handleBackupCommand(argument, domain)).kind).toBe('error')
    expect(await state()).toEqual(before)
  }
})

it('BW04：预检后字节外部变坏，第二确认重新完整预检失败；保path/preview且零DB/files写', async () => {
  setPath(file)
  await preview()
  const source = JSON.parse(await readFile(file, 'utf8'))
  await writeFile(join(`${file}.files.${source.fileBundleId}`, source.extra.file_assets[0][1].relPath), 'changed')
  const before = await state()
  await second()
  expect(calls[2].result).toMatchObject({ kind: 'error' })
  expect(await state()).toEqual(before)
  expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(1)
})

it('BW01/BW05：真实FileReader JSON-only F5拒且无假preview，F3内容双确认兼容', async () => {
  let text = await readFile(join(fixture(), 'backup.json'), 'utf8')
  vi.stubGlobal('FileReader', class {
    result = ''
    onload: (() => void) | undefined
    readAsText() { this.result = text; this.onload?.() }
  })
  const select = async () => act(async () => {
    view!.root.findByProps({ className: 'pm-file-input pm-restore-file' }).props.onChange({
      currentTarget: { files: [{ name: 'backup.json' }], value: 'selected' },
    })
  })
  const before = await state()
  await select()
  expect(calls[1].result).toMatchObject({ kind: 'error' })
  expect(String((calls[1].result as any).text)).toMatch(/未检验.*字节/)
  expect(view!.root.findAllByProps({ className: 'pm-restore-preview' })).toHaveLength(0)
  expect(await state()).toEqual(before)
  text = await readFile(join(fixture(), '../F3/backup.json'), 'utf8')
  await select()
  expect(calls[2].result).toMatchObject({ kind: 'success' })
  await second()
  expect(calls[3].line).toBe(`restore-content ${JSON.stringify(text)} confirm`)
  expect(domain.table('tasks').get('t-0001')!.progressLog![0].revisions).toHaveLength(3)
  expect([...domain.table('file_assets').entries()]).toEqual([])
})
