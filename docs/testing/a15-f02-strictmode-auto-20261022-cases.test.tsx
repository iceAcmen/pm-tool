import { createElement, StrictMode, useEffect } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pmDomainSpec, type PmDomain } from '../../packages/dsh-pm-tool/src/core/storage.js'
import { addProject } from '../../packages/dsh-pm-tool/src/core/projects.js'
import { addTask } from '../../packages/dsh-pm-tool/src/core/tasks.js'
import { buildAssetRoutes } from '../../packages/dsh-pm-tool/src/core/http/asset-route.js'
import { readStage } from '../../packages/dsh-pm-tool/src/core/file-staging.js'
import { TaskDraftMaterials } from '../../packages/dsh-pm-tool/src/client/shared/task-draft-materials.js'

const evidenceRoot = process.env.F02_EVIDENCE_ROOT!
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex')
const content = '# independent F02 stage\n'
const file = () => new File([content], 'F02 stage.md', { type: 'text/markdown' })
let sequence = 0
let root: string
let domain: PmDomain
let facility: DomainFacility
let projectId: string
let view: ReactTestRenderer | undefined
let tasks: Promise<Response>[]
let events: any[]
let published: any[]
let inputMock: { value: string }
let effects: string[]
let commands: Array<{ url: string; init: RequestInit; response?: any; status?: number }>
let consoles: string[]

function snapshot(base: string) {
  const records: Record<string, any> = {}
  function walk(dir: string, prefix = '') {
    if (!existsSync(dir)) return
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name)
      const stat = lstatSync(path)
      if (stat.isDirectory()) walk(path, `${prefix}${name}/`)
      else {
        if (!stat.isFile()) throw new Error(`unexpected non-regular fixture ${path}`)
        const bytes = readFileSync(path)
        records[prefix + name] = { bytes: bytes.length, sha256: sha(bytes),
          ...(name.endsWith('.json') ? { json: JSON.parse(bytes.toString()) } : {}) }
      }
    }
  }
  walk(base)
  return records
}
function observe(label: string) {
  const value = {
    label, data: snapshot(join(root, 'data')), files: snapshot(join(root, 'files')),
    tables: Object.fromEntries(['projects', 'tasks', 'file_assets'].map(name =>
      [name, [...domain.table(name as any).entries()]])),
    published: structuredClone(published), effects: [...effects],
  }
  events.push(value)
  return value
}
function zeroBusiness() {
  expect([...domain.table('tasks').entries()]).toHaveLength(0)
  expect([...domain.table('file_assets').entries()]).toHaveLength(0)
}
function Probe() {
  useEffect(() => {
    effects.push('setup')
    return () => { effects.push('cleanup') }
  }, [])
  return null
}
function mount(submissionRef = { current: false }, label = 'mount') {
  act(() => {
    view = create(createElement(StrictMode, null,
      createElement(TaskDraftMaterials, {
        deliverableOptions: [], stageEnabled: true, submissionRef,
        onDraft: (envelope, errors) => {
          published.push(envelope)
          events.push({ label: 'publish', owner: label, envelope: structuredClone(envelope), errors })
        },
      }),
      createElement(Probe),
    ), { createNodeMock: node => node.type === 'input' && node.props.type === 'file' ? inputMock : null })
  })
  events.push({ label, effects: [...effects] })
}
function unmount() {
  act(() => view!.unmount())
  view = undefined
}
function pick() {
  view!.root.findAllByType('input').find(node => node.props.type === 'file')!
    .props.onChange({ target: { files: [file()] } })
}
async function drain() {
  let count = -1
  while (count !== tasks.length) {
    count = tasks.length
    await Promise.all(tasks)
  }
}
async function pickAndSettle() {
  await act(async () => { pick(); await drain() })
}
async function transport(url: string, init: RequestInit = {}) {
  const entry = { url, init } as typeof commands[number]
  commands.push(entry)
  const req = new EventEmitter() as any
  req.method = init.method ?? 'GET'
  req.headers = init.headers ?? {}
  req.resume = () => {}
  const bytes = init.body instanceof Blob ? Buffer.from(await init.body.arrayBuffer()) : Buffer.alloc(0)
  req[Symbol.asyncIterator] = async function* () { yield bytes }
  let body = Buffer.alloc(0)
  const headers: Record<string, string> = {}
  const res = {
    statusCode: 200,
    setHeader: (key: string, value: string) => { headers[key] = value },
    end: (value: Buffer | string) => { body = Buffer.isBuffer(value) ? value : Buffer.from(value ?? '') },
  } as any
  const routes = buildAssetRoutes({ getDomain: () => domain, auth: { requestRejection: () => undefined } })
  if (url.startsWith('/api/pm/v1/stages/')) await routes.cancelStage(req, res, url.split('/').at(-1)!)
  else {
    expect(url).toBe('/api/pm/v1/assets/upload')
    expect(req.method).toBe('POST')
    expect(req.headers['x-pm-task-id']).toBeUndefined()
    expect(req.headers['x-pm-file-name-encoding']).toBe('uri-component')
    expect(decodeURIComponent(req.headers['x-pm-file-name'])).toBe('F02 stage.md')
    expect(init.credentials).toBe('same-origin')
    expect(init.cache).toBe('no-store')
    expect(init.signal).toBeInstanceOf(AbortSignal)
    await routes.upload(req, res)
  }
  entry.response = JSON.parse(body.toString())
  entry.status = res.statusCode
  events.push({ label: 'handler-response', url, method: req.method, status: entry.status,
    headers, body: entry.response, requestBytes: bytes.length, requestSha: sha(bytes),
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
  expect(sidecar.fileName).toBe('F02 stage.md')
  expect(sidecar.sha256).toBe(sha(content))
  expect(sidecar.size).toBe(Buffer.byteLength(content))
  expect(staged.meta).toEqual({ stageId, ...sidecar })
  zeroBusiness()
  return observe('stage-sidecar-before-save')
}
async function saveAndVerify(submissionRef: { current: boolean }, stageId: string) {
  const saved = await addTask(domain, { projectId, title: 'F02 independent saved', ...published.at(-1)! })
  submissionRef.current = true
  expect(saved.attachments).toHaveLength(1)
  expect([...domain.table('tasks').entries()]).toHaveLength(1)
  expect([...domain.table('file_assets').entries()]).toHaveLength(1)
  const asset = [...domain.table('file_assets').entries()][0][1] as any
  expect(saved.attachments![0]).toMatchObject({ kind: 'file', assetId: asset.id })
  expect(readFileSync(join(root, 'files', asset.relPath)).toString()).toBe(content)
  await expect(readStage(stageId)).rejects.toThrow()
  const rawTask = JSON.parse(readFileSync(join(root, 'data/pmtool/tasks', `${saved.id}.json`), 'utf8'))
  const rawAsset = JSON.parse(readFileSync(join(root, 'data/pmtool/file_assets', `${asset.id}.json`), 'utf8'))
  expect(rawTask.record).toEqual(domain.table('tasks').get(saved.id))
  expect(rawAsset.record).toEqual(asset)
  const before = observe('raw-saved-before-unmount')
  unmount()
  await drain()
  const after = observe('saved-after-unmount')
  expect(after.files).toEqual(before.files)
  expect(after.data).toEqual(before.data)
  expect(commands.filter(command => command.init.method === 'DELETE' && command.url.endsWith(stageId))).toHaveLength(0)
  return saved
}

beforeEach(async () => {
  root = join(evidenceRoot, `case-${++sequence}`)
  mkdirSync(root, { recursive: true })
  tasks = []; events = []; published = []; commands = []; effects = []; consoles = []
  inputMock = { value: 'selected' }
  vi.spyOn(console, 'error').mockImplementation((...args) => { consoles.push(args.map(String).join(' ')) })
  vi.spyOn(console, 'warn').mockImplementation((...args) => { consoles.push(args.map(String).join(' ')) })
  vi.stubEnv('DSH_PM_FILE_ROOT', join(root, 'files'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
  facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  domain = await facility.open(pmDomainSpec) as PmDomain
  projectId = (await addProject(domain, {
    name: 'F02 independent', startDate: '2026-01-01', targetDate: '2026-12-31',
  })).id
  vi.stubGlobal('fetch', request)
  observe('initial')
})
afterEach(async context => {
  try {
    if (view) unmount()
    await drain()
    observe('final')
    await facility.closeAll()
  } finally {
    writeFileSync(join(root, 'evidence.json'), JSON.stringify({
      caseName: context.task.name, state: context.task.result?.state,
      effects, events, consoles,
      commands: commands.map(c => ({
        url: c.url, method: c.init.method, credentials: c.init.credentials, cache: c.init.cache,
        requestHeaders: c.init.headers, signalPresent: !!c.init.signal,
        signalAbortedAtEnd: c.init.signal?.aborted, response: c.response, status: c.status,
      })),
    }, null, 2))
    vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs()
  }
})

describe('RA-F02 independent real component AUTO', () => {
  it('CAPABILITY renderer StrictMode effect counts are measured, not presumed doubled', () => {
    let renders = 0
    function Counter() {
      renders++
      useEffect(() => {
        effects.push('setup')
        return () => { effects.push('cleanup') }
      }, [])
      return createElement(TaskDraftMaterials, { deliverableOptions: [], stageEnabled: true, onDraft: () => {} })
    }
    act(() => { view = create(createElement(StrictMode, null, createElement(Counter))) })
    const mounted = { renders, effects: [...effects] }
    unmount()
    events.push({ label: 'strict-renderer-capability', mounted, unmounted: { renders, effects: [...effects] },
      automaticStrictEffectsObserved: mounted.effects.filter(e => e === 'setup').length >= 2
        && mounted.effects.includes('cleanup') })
    expect(mounted.effects.filter(e => e === 'setup').length).toBeGreaterThanOrEqual(1)
    expect(effects.at(-1)).toBe('cleanup')
    zeroBusiness()
  })

  it('AUTO StrictMode explicit remount aborts old late201, DELETEs real stage, new mount saves', async () => {
    let release!: (response: Response) => void
    let oldResponse!: Response
    let first = true
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      const response = await request(url, init)
      if (init.method !== 'POST' || !first) return response
      first = false
      oldResponse = response
      return new Promise<Response>(resolve => { release = resolve })
    })
    mount({ current: false }, 'old')
    await pickAndSettle()
    const oldStage = (await oldResponse.clone().json()).stageId
    await verifyStage(oldStage)
    expect(published).toHaveLength(0)
    unmount()
    expect(commands[0].init.signal!.aborted).toBe(true)
    const ref = { current: false }
    mount(ref, 'new')
    await pickAndSettle()
    expect(published).toHaveLength(1)
    const newStage = published[0].draft.attachmentOps[0].stageId
    expect(newStage).not.toBe(oldStage)
    await verifyStage(newStage)
    await act(async () => { release(oldResponse) })
    await drain()
    expect(published).toHaveLength(1)
    await expect(readStage(oldStage)).rejects.toThrow()
    expect(commands.filter(c => c.init.method === 'DELETE')).toHaveLength(1)
    expect(commands.find(c => c.init.method === 'DELETE')).toMatchObject({
      url: `/api/pm/v1/stages/${oldStage}`, status: 200, response: { ok: true, removed: true },
    })
    expect(commands[1].init.signal!.aborted).toBe(false)
    observe('old-continuation-cleaned')
    await saveAndVerify(ref, newStage)
    expect(effects).toEqual(['setup', 'cleanup', 'setup', 'cleanup'])
    expect(consoles).toEqual([])
  })

  it('AUTO StrictMode successful unpublished-save stage unmount cleanup removes bin and sidecar', async () => {
    mount()
    await pickAndSettle()
    const stageId = published[0].draft.attachmentOps[0].stageId
    const before = await verifyStage(stageId)
    unmount()
    await drain()
    await expect(readStage(stageId)).rejects.toThrow()
    const after = observe('cancelled')
    expect(after.data).toEqual(before.data)
    expect(Object.keys(after.files)).toHaveLength(0)
    expect(commands.filter(c => c.init.method === 'DELETE')).toHaveLength(1)
    expect(commands.at(-1)!.response).toEqual({ ok: true, removed: true })
    zeroBusiness()
    expect(consoles).toEqual([])
  })

  it('AUTO StrictMode transfer failure restores busy props and file ref, retry saves exactly once', async () => {
    let reject!: (error: Error) => void
    vi.stubGlobal('fetch', vi.fn().mockImplementationOnce((url: string, init: RequestInit) => {
      events.push({ label: 'transfer-held', url, signalPresent: !!init.signal })
      return new Promise<Response>((_, rejectFn) => { reject = rejectFn })
    }).mockImplementation(request))
    const ref = { current: false }
    mount(ref)
    const before = observe('before-failure')
    act(() => { pick() })
    expect(view!.root.findByProps({ type: 'file' }).props.disabled).toBe(true)
    await act(async () => { reject(new Error('F02 transport rejected')) })
    expect(view!.root.findByProps({ type: 'file' }).props.disabled).toBe(false)
    expect(inputMock.value).toBe('')
    expect(view!.root.findByProps({ role: 'alert' }).children.join('')).toContain('F02 transport rejected')
    const after = observe('failed-zero-write')
    expect(after.data).toEqual(before.data)
    expect(after.files).toEqual(before.files)
    expect(published).toHaveLength(0)
    zeroBusiness()
    await pickAndSettle()
    expect(published).toHaveLength(1)
    expect(view!.root.findAllByProps({ role: 'alert' })).toHaveLength(0)
    const stageId = published[0].draft.attachmentOps[0].stageId
    await verifyStage(stageId)
    await saveAndVerify(ref, stageId)
    expect(commands.filter(c => c.init.method === 'POST')).toHaveLength(1)
    expect(consoles).toEqual([])
  })
})
