import { createElement, StrictMode, useEffect, useState, act, version } from 'react'
import { JSDOM } from 'jsdom'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pmDomainSpec, type PmDomain } from '../../packages/dsh-pm-tool/src/core/storage.js'
import { addProject } from '../../packages/dsh-pm-tool/src/core/projects.js'
import { addTask } from '../../packages/dsh-pm-tool/src/core/tasks.js'
import { buildAssetRoutes } from '../../packages/dsh-pm-tool/src/core/http/asset-route.js'
import { readStage } from '../../packages/dsh-pm-tool/src/core/file-staging.js'
import { TaskDraftMaterials } from '../../packages/dsh-pm-tool/src/client/shared/task-draft-materials.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
  'Element', 'Node', 'Event', 'MouseEvent']) vi.stubGlobal(name, name === 'window' ? dom.window : dom.window[name])
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
// ReactDOM must initialize after document exists; all React imports are aliased to one React18.
const { createRoot } = await import('react-dom/client')
const reactDom = await import('react-dom')
const evidenceRoot = process.env.F02_EVIDENCE_ROOT!
const content = '# independent F02 DOM stage\n'
const fileName = 'F02 DOM stage.md'
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex')
const file = () => new dom.window.File([content], fileName, { type: 'text/markdown' })
let sequence = 0
let root: string
let container: HTMLDivElement
let view: ReturnType<typeof createRoot> | undefined
let domain: PmDomain
let facility: DomainFacility
let projectId: string
let tasks: Promise<Response>[]
let commands: any[]
let published: any[]
let events: any[]
let effects: Record<string, string[]>
let consoles: string[]
let valueSets: any[]
let releases: Array<() => void>
let capabilityReady = false
let eventReady = false

function snapshot(base: string) {
  const result: Record<string, any> = {}
  function walk(path: string, prefix = '') {
    if (!existsSync(path)) return
    for (const name of readdirSync(path).sort()) {
      const target = join(path, name)
      const stat = lstatSync(target)
      if (stat.isDirectory()) walk(target, `${prefix}${name}/`)
      else {
        if (!stat.isFile()) throw new Error(`nonregular fixture ${target}`)
        const bytes = readFileSync(target)
        result[prefix + name] = { bytes: bytes.length, sha256: sha(bytes),
          ...(name.endsWith('.json') ? { json: JSON.parse(bytes.toString()) } : {}) }
      }
    }
  }
  walk(base)
  return result
}
function input(): HTMLInputElement {
  return container.querySelector('input[type=file]')!
}
function observe(label: string) {
  const field = input()
  const record = { label, data: snapshot(join(root, 'data')), files: snapshot(join(root, 'files')),
    tables: Object.fromEntries(['projects', 'tasks', 'file_assets'].map(name =>
      [name, [...domain.table(name as any).entries()]])),
    published: structuredClone(published), effects: structuredClone(effects),
    dom: { html: container.innerHTML, text: container.textContent, inputPresent: !!field,
      disabled: field?.disabled, disabledAttribute: field?.getAttribute('disabled'),
      value: field?.value, files: field ? Array.from(field.files ?? []).map(f => ({
        name: f.name, size: f.size, type: f.type, isJSDOMFile: f instanceof dom.window.File,
      })) : [], alert: container.querySelector('[role=alert]')?.textContent ?? null },
  }
  events.push(record)
  return record
}
function zeroBusiness() {
  expect([...domain.table('tasks').entries()]).toHaveLength(0)
  expect([...domain.table('file_assets').entries()]).toHaveLength(0)
}
function Probe({ owner }: { owner: string }) {
  useEffect(() => {
    effects[owner].push('setup')
    events.push({ label: 'probe-effect', owner, action: 'setup' })
    return () => {
      effects[owner].push('cleanup')
      events.push({ label: 'probe-effect', owner, action: 'cleanup' })
    }
  }, [])
  return null
}
async function mount(ref = { current: false }, owner = 'mount', strict = true) {
  effects[owner] = []
  const tree = createElement('div', null, createElement(TaskDraftMaterials, {
    deliverableOptions: [], stageEnabled: true, submissionRef: ref,
    onDraft: (envelope, errors) => {
      published.push(envelope)
      events.push({ label: 'publish', owner, envelope: structuredClone(envelope), errors })
    },
  }), createElement(Probe, { owner }))
  await act(async () => {
    view = createRoot(container)
    view.render(strict ? createElement(StrictMode, null, tree) : tree)
  })
  observe(`mounted-${owner}`)
  expect(effects[owner]).toEqual(strict ? ['setup', 'cleanup', 'setup'] : ['setup'])
  expect(input()).toBeInstanceOf(dom.window.HTMLInputElement)
  expect(input().disabled).toBe(false)
}
async function unmount() {
  if (!view) return
  await act(async () => { view!.unmount() })
  view = undefined
}
// JSDOM has no native chooser. Only the DOM files selection fixture is injected;
// the real Event bubbles through ReactDOM, never through a direct product callback.
function select(field: HTMLInputElement, selected: File[]) {
  const list = Object.assign([...selected], { item: (i: number) => selected[i] ?? null })
  Object.defineProperty(field, 'files', { configurable: true, value: list })
  const beforeValue = field.value
  field.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
  events.push({ label: 'dom-change', filesFixture: 'array-like files with item; not native FileList/chooser',
    selected: selected.map(f => ({ name: f.name, size: f.size, realJSDOMFile: f instanceof dom.window.File })),
    beforeValue, actualEvent: 'window.Event(change,bubbles=true)' })
}
async function drain() {
  let count = -1
  while (count !== tasks.length) {
    count = tasks.length
    await Promise.all(tasks)
  }
}
async function pickAndSettle(selected = file()) {
  await act(async () => { select(input(), [selected]); await drain() })
}
async function bytesOf(body: any): Promise<Buffer> {
  if (body instanceof dom.window.Blob) {
    return await new Promise((resolve, reject) => {
      const reader = new dom.window.FileReader()
      reader.onload = () => resolve(Buffer.from(reader.result as ArrayBuffer))
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(body)
    })
  }
  return body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : Buffer.alloc(0)
}
async function transport(url: string, init: RequestInit = {}) {
  const entry = { url, init } as any
  commands.push(entry)
  const req = new EventEmitter() as any
  req.method = init.method ?? 'GET'
  req.headers = init.headers ?? {}
  req.resume = () => {}
  const bytes = await bytesOf(init.body)
  req[Symbol.asyncIterator] = async function* () { yield bytes }
  let body = Buffer.alloc(0)
  const headers: Record<string, string> = {}
  const res = { statusCode: 200, setHeader: (k: string, v: string) => { headers[k] = v },
    end: (v: Buffer | string) => { body = Buffer.isBuffer(v) ? v : Buffer.from(v ?? '') } } as any
  const routes = buildAssetRoutes({ getDomain: () => domain, auth: { requestRejection: () => undefined } })
  if (url.startsWith('/api/pm/v1/stages/')) {
    expect(req.method).toBe('DELETE')
    await routes.cancelStage(req, res, url.split('/').at(-1)!)
  } else {
    expect(url).toBe('/api/pm/v1/assets/upload')
    expect(req.method).toBe('POST')
    expect(req.headers['x-pm-task-id']).toBeUndefined()
    expect(req.headers['x-pm-file-name-encoding']).toBe('uri-component')
    expect(decodeURIComponent(req.headers['x-pm-file-name'])).toBe(fileName)
    expect(bytes.toString()).toBe(content)
    expect(init.signal).toBeInstanceOf(AbortSignal)
    await routes.upload(req, res)
  }
  expect(init.credentials).toBe('same-origin')
  expect(init.cache).toBe('no-store')
  entry.status = res.statusCode
  entry.response = JSON.parse(body.toString())
  events.push({ label: 'real-handler-response', url, method: req.method, status: entry.status,
    response: entry.response, headers, requestBytes: bytes.length, requestSha: sha(bytes),
    signalAborted: init.signal?.aborted })
  return new Response(body, { status: res.statusCode, headers })
}
function request(url: string, init: RequestInit = {}) {
  const result = transport(url, init)
  tasks.push(result)
  return result
}
async function verifyStage(stageId: string) {
  const staged = await readStage(stageId)
  expect(staged.bytes.toString()).toBe(content)
  const sidecar = JSON.parse(readFileSync(join(root, 'files/staging', `${stageId}.json`), 'utf8'))
  expect(staged.meta).toEqual({ stageId, ...sidecar })
  expect(sidecar).toMatchObject({ fileName, size: Buffer.byteLength(content), sha256: sha(content) })
  expect(readFileSync(join(root, 'files/staging', `${stageId}.bin`)).toString()).toBe(content)
  const rawRoot = join(root, 'raw-stages', stageId)
  mkdirSync(rawRoot, { recursive: true })
  writeFileSync(join(rawRoot, 'stage.bin'), staged.bytes)
  writeFileSync(join(rawRoot, 'stage.json'), readFileSync(join(root, 'files/staging', `${stageId}.json`)))
  expect(commands.find(c => c.init.method === 'POST' && c.response?.stageId === stageId).status).toBe(201)
  return observe(`stage-${stageId}`)
}
async function saveAndVerify(ref: { current: boolean }, stageId: string) {
  const saved = await addTask(domain, { projectId, title: 'F02 DOM saved once', ...published.at(-1)! })
  ref.current = true
  events.push({ label: 'real-domain-addTask', taskId: saved.id, submissionRef: true })
  expect(saved.attachments).toHaveLength(1)
  expect([...domain.table('tasks').entries()]).toHaveLength(1)
  expect([...domain.table('file_assets').entries()]).toHaveLength(1)
  const asset = [...domain.table('file_assets').entries()][0][1] as any
  expect(saved.attachments![0]).toMatchObject({ kind: 'file', assetId: asset.id })
  expect(readFileSync(join(root, 'files', asset.relPath)).toString()).toBe(content)
  await expect(readStage(stageId)).rejects.toThrow()
  expect(snapshot(join(root, 'files/staging'))).toEqual({})
  const rawTask = JSON.parse(readFileSync(join(root, 'data/pmtool/tasks', `${saved.id}.json`), 'utf8'))
  const rawAsset = JSON.parse(readFileSync(join(root, 'data/pmtool/file_assets', `${asset.id}.json`), 'utf8'))
  expect(rawTask.record).toEqual(domain.table('tasks').get(saved.id))
  expect(rawAsset.record).toEqual(asset)
  expect(rawTask.version).toBe(2)
  const before = observe('saved-before-unmount')
  await unmount()
  await drain()
  const after = observe('saved-after-unmount')
  expect(after.data).toEqual(before.data)
  expect(after.files).toEqual(before.files)
  expect(commands.filter(c => c.init.method === 'DELETE' && c.url.endsWith(stageId))).toHaveLength(0)
  expect(consoles).toEqual([])
}
function requireControls() {
  expect(capabilityReady, 'BLOCKED: automatic effects control must succeed before product').toBe(true)
  expect(eventReady, 'BLOCKED: DOM event control must succeed before product').toBe(true)
}

beforeEach(async () => {
  root = join(evidenceRoot, `case-${++sequence}`)
  mkdirSync(root, { recursive: true })
  tasks = []; commands = []; published = []; events = []; effects = {}; consoles = []; valueSets = []; releases = []
  container = document.createElement('div')
  document.body.append(container)
  vi.spyOn(console, 'error').mockImplementation((...args) => { consoles.push(args.map(String).join(' ')) })
  vi.spyOn(console, 'warn').mockImplementation((...args) => { consoles.push(args.map(String).join(' ')) })
  const valueDescriptor = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!
  vi.spyOn(dom.window.HTMLInputElement.prototype, 'value', 'set').mockImplementation(function (value) {
    valueSets.push({ type: this.type, value, nativeSetterDelegated: true })
    valueDescriptor.set!.call(this, value)
  })
  vi.stubEnv('DSH_PM_FILE_ROOT', join(root, 'files'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
  facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  domain = await facility.open(pmDomainSpec) as PmDomain
  projectId = (await addProject(domain, {
    name: 'F02 DOM independent', startDate: '2026-01-01', targetDate: '2026-12-31',
  })).id
  vi.stubGlobal('fetch', request)
  observe('initial')
})
afterEach(async context => {
  try {
    await unmount()
    await act(async () => { for (const release of releases) release(); await drain() })
    observe('final')
    await facility.closeAll()
  } finally {
    writeFileSync(join(root, 'evidence.json'), JSON.stringify({
      caseName: context.task.name, resultAtAfterEach: context.task.result,
      reactVersion: version, reactDomVersion: reactDom.version, effects, events, consoles, valueSets,
      controls: { capabilityReady, eventReady },
      commands: commands.map(c => ({ url: c.url, method: c.init.method, credentials: c.init.credentials,
        cache: c.init.cache, requestHeaders: c.init.headers, signalPresent: !!c.init.signal,
        signalAbortedAtEnd: c.init.signal?.aborted, status: c.status, response: c.response })),
    }, null, 2))
    container.remove()
    vi.restoreAllMocks(); vi.unstubAllEnvs()
  }
})
afterAll(() => { dom.window.close(); vi.unstubAllGlobals() })

describe('F02 independent automatic StrictEffects real DOM', () => {
  it('DOM-C01 createRoot automatic setup cleanup setup, final cleanup, non-strict control', async () => {
    expect(version).toBe('18.3.1')
    expect(reactDom.version).toBe('18.3.1')
    await mount({ current: false }, 'strict')
    expect(effects.strict).toEqual(['setup', 'cleanup', 'setup'])
    expect(published).toHaveLength(0)
    await unmount()
    expect(effects.strict).toEqual(['setup', 'cleanup', 'setup', 'cleanup'])
    await mount({ current: false }, 'non-strict', false)
    expect(effects['non-strict']).toEqual(['setup'])
    await unmount()
    expect(effects['non-strict']).toEqual(['setup', 'cleanup'])
    zeroBusiness()
    expect(commands).toHaveLength(0)
    expect(consoles).toEqual([])
    capabilityReady = true
    observe('capability-confirmed-automatic-not-explicit-remount')
  })

  it('DOM-C02 real File change event reaches React once and DOM state flushes through act', async () => {
    expect(capabilityReady).toBe(true)
    let resolve!: () => void
    const changed: any[] = []
    function Control() {
      const [busy, setBusy] = useState(false)
      return createElement('input', { type: 'file', disabled: busy, onChange: async (e: any) => {
        const selected = e.target.files[0]
        changed.push({ name: selected.name, bytes: (await bytesOf(selected)).toString() })
        setBusy(true)
        await new Promise<void>(r => { resolve = r })
        setBusy(false)
      } })
    }
    await act(async () => { view = createRoot(container); view.render(createElement(StrictMode, null, createElement(Control))) })
    await act(async () => { select(input(), [file()]); await new Promise(r => setTimeout(r, 10)) })
    expect(changed).toEqual([{ name: fileName, bytes: content }])
    expect(input().disabled).toBe(true)
    observe('control-busy')
    await act(async () => { resolve() })
    expect(input().disabled).toBe(false)
    expect(consoles).toEqual([])
    events.push({ label: 'event-control', changed, onChangeCalls: changed.length })
    eventReady = true
  })

  it('DOM-F01 automatic replay then transfer reject restores busy/input, same File retry saves once', async () => {
    requireControls()
    let reject!: (e: Error) => void
    let attempts = 0
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      if (init.method === 'POST' && ++attempts === 1) {
        events.push({ label: 'transfer-held', url, signalPresent: !!init.signal })
        return new Promise<Response>((_, r) => { reject = r })
      }
      return request(url, init)
    })
    const ref = { current: false }
    await mount(ref, 'retry')
    const selected = file()
    const before = observe('before-error')
    await act(async () => { select(input(), []) })
    expect(attempts).toBe(0)
    await act(async () => { select(input(), [selected]) })
    expect(input().disabled).toBe(true)
    expect(container.textContent).toContain('上传暂存中')
    observe('product-busy')
    await act(async () => { reject(new Error('F02 DOM transport rejected')) })
    expect(input().disabled).toBe(false)
    expect(input().value).toBe('')
    expect(valueSets.filter(s => s.type === 'file' && s.value === '' && s.nativeSetterDelegated)).toHaveLength(1)
    expect(container.querySelector('[role=alert]')?.textContent).toContain('F02 DOM transport rejected')
    const failed = observe('error-zero-write')
    expect(failed.data).toEqual(before.data)
    expect(failed.files).toEqual(before.files)
    expect(published).toHaveLength(0)
    zeroBusiness()
    await pickAndSettle(selected)
    expect(published).toHaveLength(1)
    expect(input().disabled).toBe(false)
    expect(container.querySelector('[role=alert]')).toBeNull()
    expect(container.querySelector('.pm-staged-list')?.textContent).toContain(fileName)
    const stage = published[0].draft.attachmentOps[0].stageId
    await verifyStage(stage)
    await saveAndVerify(ref, stage)
    expect(attempts).toBe(2)
    expect(effects.retry).toEqual(['setup', 'cleanup', 'setup', 'cleanup'])
  })

  it('DOM-F02 after automatic replay real handler201 held, unmount abort late continuation DELETE zero taskasset', async () => {
    requireControls()
    let release!: () => void
    let response!: Response
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      const result = await request(url, init)
      if (init.method === 'DELETE') return result
      response = result
      return new Promise<Response>(resolve => {
        release = () => resolve(response)
        releases.push(release)
      })
    })
    await mount({ current: false }, 'late')
    const before = observe('before-late')
    await pickAndSettle()
    const stage = (await response.clone().json()).stageId
    await verifyStage(stage)
    zeroBusiness()
    expect(published).toHaveLength(0)
    expect(input().disabled).toBe(true)
    await unmount()
    expect(commands[0].init.signal.aborted).toBe(true)
    expect(effects.late).toEqual(['setup', 'cleanup', 'setup', 'cleanup'])
    await act(async () => { release(); await drain() })
    await drain()
    expect(published).toHaveLength(0)
    await expect(readStage(stage)).rejects.toThrow()
    expect(commands.filter(c => c.init.method === 'DELETE')).toHaveLength(1)
    expect(commands.at(-1)).toMatchObject({ status: 200, response: { ok: true, removed: true } })
    const after = observe('late-cleaned')
    expect(after.data).toEqual(before.data)
    expect(after.files).toEqual(before.files)
    zeroBusiness()
    expect(consoles).toEqual([])
  })

  it('DOM-F03 old held201 isolated from new automatic-replayed mount, new saves/finalizes then retains', async () => {
    requireControls()
    let release!: () => void
    let response!: Response
    let first = true
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      const result = await request(url, init)
      if (init.method !== 'POST' || !first) return result
      first = false; response = result
      return new Promise<Response>(resolve => { release = () => resolve(response); releases.push(release) })
    })
    await mount({ current: false }, 'old')
    await pickAndSettle()
    const oldStage = (await response.clone().json()).stageId
    await verifyStage(oldStage)
    zeroBusiness()
    await unmount()
    expect(commands[0].init.signal.aborted).toBe(true)
    const ref = { current: false }
    await mount(ref, 'new')
    await pickAndSettle()
    expect(published).toHaveLength(1)
    const newStage = published[0].draft.attachmentOps[0].stageId
    expect(newStage).not.toBe(oldStage)
    await verifyStage(newStage)
    zeroBusiness()
    await act(async () => { release(); await drain() })
    await drain()
    expect(published).toHaveLength(1)
    expect(events.filter(e => e.label === 'publish').map(e => e.owner)).toEqual(['new'])
    await expect(readStage(oldStage)).rejects.toThrow()
    expect(commands.filter(c => c.init.method === 'DELETE')).toHaveLength(1)
    expect(commands.at(-1)).toMatchObject({ url: `/api/pm/v1/stages/${oldStage}`,
      status: 200, response: { ok: true, removed: true } })
    expect(commands[1].init.signal.aborted).toBe(false)
    observe('old-201-reclaimed-new-stage-intact')
    await saveAndVerify(ref, newStage)
    expect(effects.old).toEqual(['setup', 'cleanup', 'setup', 'cleanup'])
    expect(effects.new).toEqual(['setup', 'cleanup', 'setup', 'cleanup'])
  })

  it('DOM-F04 automatic replay followed by real stage201, unsaved unmount removes bin sidecar no business write', async () => {
    requireControls()
    await mount({ current: false }, 'unsaved')
    const before = observe('unsaved-before')
    await pickAndSettle()
    expect(published).toHaveLength(1)
    const stage = published[0].draft.attachmentOps[0].stageId
    await verifyStage(stage)
    zeroBusiness()
    await unmount()
    await drain()
    await expect(readStage(stage)).rejects.toThrow()
    const after = observe('unsaved-cancelled')
    expect(after.data).toEqual(before.data)
    expect(after.files).toEqual(before.files)
    expect(commands.filter(c => c.init.method === 'DELETE')).toHaveLength(1)
    expect(commands.at(-1)).toMatchObject({ status: 200, response: { ok: true, removed: true } })
    expect(effects.unsaved).toEqual(['setup', 'cleanup', 'setup', 'cleanup'])
    zeroBusiness()
    expect(consoles).toEqual([])
  })
})
