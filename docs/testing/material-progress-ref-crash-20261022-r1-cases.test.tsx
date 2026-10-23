import React, { Component, act, useState } from 'react'
import { JSDOM } from 'jsdom'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pmDomainSpec } from './src/core/storage.js'
import { addProject } from './src/core/projects.js'
import { addTask } from './src/core/tasks.js'
import { buildAssetRoutes } from './src/core/http/asset-route.js'
import { readStage } from './src/core/file-staging.js'
import { TaskDraftMaterials } from './src/client/shared/task-draft-materials.js'
import { createOpsSession, buildDraftOps, validateOps } from './src/client/shared/b2-ops.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
  'HTMLTextAreaElement', 'Element', 'Node', 'Event', 'MouseEvent']) {
  vi.stubGlobal(key, key === 'window' ? dom.window : (dom.window as any)[key])
}
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const { createRoot } = await import('react-dom/client')
const evidenceRoot = process.env.QA_EVIDENCE_ROOT!
const content = '# QA note\nref file ok\n' // 22 bytes, not Main's file content claim.
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex')
let seq = 0, caseRoot: string, container: HTMLDivElement
let view: ReturnType<typeof createRoot> | undefined
let facility: DomainFacility, domain: any, projectId: string
let pending: Promise<Response>[], calls: any[], events: any[], published: any[], caught: any[]
let saveCount: number, capabilityReady = false

function snapshot(base: string): Record<string, any> {
  if (!existsSync(base)) return {}
  const result: Record<string, any> = {}
  function walk(path: string, prefix = '') {
    for (const name of readdirSync(path).sort()) {
      const p = join(path, name)
      if (statSync(p).isDirectory()) walk(p, `${prefix}${name}/`)
      else {
        const bytes = readFileSync(p)
        result[prefix + name] = { bytes: bytes.length, sha256: sha(bytes),
          ...(name.endsWith('.json') ? { json: JSON.parse(bytes.toString()) } : {}) }
      }
    }
  }
  walk(base)
  return result
}
function observe(label: string) {
  const record = { label, html: container.innerHTML, shell: !!container.querySelector('[data-qa-shell]'),
    refs: [...container.querySelectorAll<HTMLInputElement>('.pm-prog-ref input')].map(n => ({
      label: n.parentElement!.textContent, checked: n.checked,
    })), caught: structuredClone(caught), published: structuredClone(published), saveCount,
    tables: Object.fromEntries(['tasks', 'file_assets'].map(n => [n, [...domain.table(n).entries()]])),
    data: snapshot(join(caseRoot, 'data')), files: snapshot(join(caseRoot, 'files')) }
  events.push(record)
  return record
}
class Boundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    caught.push({ message: error.message, stack: error.stack, componentStack: info.componentStack })
  }
  render() { return this.state.failed ? <div data-qa-crashed/> : this.props.children }
}
async function mount(task?: any, ref = { current: false }) {
  await act(async () => {
    view = createRoot(container)
    view.render(<Boundary><div data-qa-shell><TaskDraftMaterials task={task}
      deliverableOptions={[]} stageEnabled submissionRef={ref}
      onDraft={(envelope, errors) => published.push({ envelope: structuredClone(envelope), errors })}/>
    </div></Boundary>)
  })
  expect(container.querySelector('[data-draft]')).not.toBeNull()
}
function field(label: string): HTMLInputElement | HTMLTextAreaElement {
  const node = container.querySelector(`[aria-label="${label}"]`)
  expect(node, `fixture field ${label}`).not.toBeNull()
  return node as any
}
async function fill(label: string, value: string) {
  const node = field(label)
  const proto = node.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype
    : dom.window.HTMLInputElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(node, value)
    node.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  expect(node.value).toBe(value)
}
async function button(text: string) {
  const node = [...container.querySelectorAll('button')].find(n => n.textContent === text)
  expect(node, `fixture button ${text}`).not.toBeUndefined()
  await act(async () => { node!.click() })
}
async function links() {
  for (const i of [1, 2]) {
    await fill('资料链接地址', `https://example.test/c${i}`)
    await fill('链接标题', `c${i}`)
    await button('加链接')
  }
  expect(published.at(-1).envelope.draft.attachmentOps.map((o: any) => o.clientId)).toEqual(['c-1', 'c-2'])
}
async function authorBody() {
  await fill('进展作者', '独立 QA')
  await fill('进展正文', '合法引用进展')
}
async function drain() {
  let count = -1
  while (count !== pending.length) {
    count = pending.length
    await Promise.all(pending)
  }
}
async function transport(url: string, init: RequestInit = {}) {
  const bytes = init.body instanceof dom.window.Blob
    ? await new Promise<Buffer>((resolve, reject) => {
      const reader = new dom.window.FileReader()
      reader.onload = () => resolve(Buffer.from(reader.result as ArrayBuffer))
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(init.body as any)
    }) : Buffer.alloc(0)
  const req = new EventEmitter() as any
  req.method = init.method ?? 'GET'; req.headers = init.headers ?? {}; req.resume = () => {}
  req[Symbol.asyncIterator] = async function* () { yield bytes }
  let body = Buffer.alloc(0)
  const headers: Record<string, string> = {}
  const res = { statusCode: 200, setHeader: (k: string, v: string) => { headers[k] = v },
    end: (v: Buffer | string) => { body = Buffer.isBuffer(v) ? v : Buffer.from(v ?? '') } } as any
  const routes = buildAssetRoutes({ getDomain: () => domain, auth: { requestRejection: () => undefined } })
  if (url.startsWith('/api/pm/v1/stages/')) await routes.cancelStage(req, res, url.split('/').at(-1)!)
  else {
    expect(url).toBe('/api/pm/v1/assets/upload')
    expect(bytes.toString()).toBe(content)
    expect(req.headers['x-pm-task-id']).toBeUndefined()
    await routes.upload(req, res)
  }
  calls.push({ url, method: req.method, status: res.statusCode, bytes: bytes.length,
    sha256: sha(bytes), response: JSON.parse(body.toString()), aborted: init.signal?.aborted })
  return new Response(body, { status: res.statusCode, headers })
}
async function pick() {
  expect(Buffer.byteLength(content)).toBe(22)
  const file = new dom.window.File([content], 'qa-note.md', { type: 'text/markdown' })
  const node = field('选择文件暂存（提交时随任务保存）') as HTMLInputElement
  await act(async () => {
    Object.defineProperty(node, 'files', { configurable: true,
      value: Object.assign([file], { item: (i: number) => i === 0 ? file : null }) })
    node.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
    await drain()
  })
  const ops = published.at(-1).envelope.draft.attachmentOps
  expect(ops.at(-1)).toMatchObject({ op: 'addFile', clientId: 'c-3' })
  const stageId = ops.at(-1).stageId
  expect((await readStage(stageId)).bytes.toString()).toBe(content)
  mkdirSync(join(caseRoot, 'raw-stage'), { recursive: true })
  writeFileSync(join(caseRoot, 'raw-stage/qa-note.md'), (await readStage(stageId)).bytes)
  writeFileSync(join(caseRoot, 'raw-stage/stage.json'),
    readFileSync(join(caseRoot, 'files/staging', `${stageId}.json`)))
  observe('file-ready')
}
async function refClick(index: number) {
  const node = container.querySelectorAll<HTMLInputElement>('.pm-prog-ref input')[index]
  expect(node, `planned ref index ${index}`).toBeDefined()
  observe(`before-click-${index}`)
  await act(async () => { node.click(); await drain() })
  const after = observe(`after-click-${index}`)
  expect(caught, '合法 refs 点击不得导致 render 异常').toEqual([])
  expect(after.shell, '资料草稿所属 shell 不得卸载').toBe(true)
  expect(container.querySelectorAll<HTMLInputElement>('.pm-prog-ref input')[index].checked).toBe(true)
}
async function append(expected: string[]) {
  await button('追加进展（草稿）')
  const last = published.at(-1)
  expect(last.errors).toEqual([])
  expect(last.envelope.draft.progressOps.at(-1)).toMatchObject({
    op: 'add', author: '独立 QA', content: '合法引用进展',
    ...(expected.length ? { refs: expected } : {}),
  })
  if (!expected.length) expect(last.envelope.draft.progressOps.at(-1).refs).toBeUndefined()
  observe('appended-planned-refs')
}
async function save(ref: { current: boolean }, expected: string[]) {
  expect(saveCount).toBe(0)
  saveCount++
  const result = await addTask(domain, { projectId, title: '真实单主保存控制', description: '正常说明',
    ...published.at(-1).envelope })
  ref.current = true
  const resolved = expected.map(alias => {
    const idx = published.at(-1).envelope.draft.attachmentOps.findIndex((o: any) => o.clientId === alias)
    return result.attachments![idx].id
  })
  expect(result.progressLog![0].refs ?? []).toEqual(resolved)
  expect(result.attachments).toHaveLength(3)
  expect([...domain.table('file_assets').entries()]).toHaveLength(1)
  const asset = [...domain.table('file_assets').entries()][0][1] as any
  expect(readFileSync(join(caseRoot, 'files', asset.relPath)).toString()).toBe(content)
  observe('single-main-save')
  await act(async () => { view!.unmount(); view = undefined; await drain() })
  expect(calls.filter(c => c.method === 'DELETE')).toEqual([])
}
beforeEach(async ctx => {
  caseRoot = join(evidenceRoot, `${++seq}-${ctx.task.name.split(' ')[0]}`)
  mkdirSync(caseRoot, { recursive: true })
  pending = []; calls = []; events = []; published = []; caught = []; saveCount = 0
  container = dom.window.document.createElement('div')
  dom.window.document.body.appendChild(container)
  vi.stubEnv('DSH_PM_FILE_ROOT', join(caseRoot, 'files'))
  const context = new Context()
  await context.plugin(Storage)
  context.storage.backend.register('json', new JsonStorageBackend(join(caseRoot, 'data')))
  facility = new DomainFacility(context, { backend: 'json', routes: {} })
  domain = await facility.open(pmDomainSpec)
  projectId = (await addProject(domain, { name: '合法引用种子', startDate: '2026-01-01',
    targetDate: '2026-12-31' })).id
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    const promise = transport(url, init); pending.push(promise); return promise
  })
  const original = console.error
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    events.push({ label: 'console.error', args: args.map(v => v instanceof Error
      ? { message: v.message, stack: v.stack } : String(v)) })
    original(...args)
  })
})
afterEach(async () => {
  observe('before-test-cleanup')
  if (view) await act(async () => { view!.unmount(); view = undefined; await drain() })
  await drain()
  observe('after-test-cleanup')
  writeFileSync(join(caseRoot, 'observations.json'), JSON.stringify({ events, calls, caught,
    saveCount, outcomeBoundary: saveCount ? 'DOMAIN_SAVE_EXECUTED' : 'MAIN_SAVE_NOT_REACHED' }, null, 2))
  await facility.closeAll()
  container.remove()
  vi.restoreAllMocks(); vi.unstubAllEnvs()
})

describe('控制', () => {
  it('C01 React18真实DOM点击与currentTarget生命周期控制', async () => {
    const seen: any[] = [], retained: any[] = []
    function Probe() {
      const [checked, setChecked] = useState(false)
      return <input type="checkbox" checked={checked} onChange={e => {
        seen.push({ checked: e.currentTarget.checked, isInput: e.currentTarget instanceof dom.window.HTMLInputElement })
        retained.push(e)
        const value = e.currentTarget.checked
        setChecked(() => value)
      }}/>
    }
    await act(async () => { view = createRoot(container); view.render(<Probe/>) })
    for (let i = 0; i < 2; i++) {
      await act(async () => { container.querySelector('input')!.click() })
      expect(retained[i].currentTarget).toBeNull()
    }
    expect(seen).toEqual([{ checked: true, isInput: true }, { checked: false, isInput: true }])
    events.push({ label: 'real-synthetic-event-lifecycle', seen,
      afterDispatch: retained.map(e => e.currentTarget), nativeTypes: retained.map(e => e.nativeEvent.type) })
    capabilityReady = true
  })
  it('C02 原OpsSession保c-2与file c-3单信封计划refs', () => {
    const s = createOpsSession()
    s.addLink({ url: 'https://example.test/c1' }); s.addLink({ url: 'https://example.test/c2' })
    s.addFile({ stageId: 'a'.repeat(32) })
    s.addProgress({ author: '独立 QA', content: '合法引用进展', refs: ['c-2', 'c-3'] })
    expect(validateOps(s.attachmentOps, s.progressOps)).toEqual({ ok: true, errors: [] })
    expect(buildDraftOps(s.attachmentOps, s.progressOps)!.draft.progressOps![0].refs).toEqual(['c-2', 'c-3'])
    events.push({ label: 'production-OpsSession-control', envelope: buildDraftOps(s.attachmentOps, s.progressOps) })
  })
  it('C03 原组件不选refs，两link真file一次主save与成功卸载控制', async () => {
    expect(capabilityReady, 'BLOCKED: C01事件设施').toBe(true)
    const ref = { current: false }
    await mount(undefined, ref); await links(); await pick(); await authorBody()
    await append([]); await save(ref, [])
  })
})
describe('必要红', () => {
  it('N01 合法既有两资料真实click保计划refs', async () => {
    expect(capabilityReady, 'BLOCKED: C01事件设施').toBe(true)
    const task = await addTask(domain, { projectId, title: '合法既有任务',
      draft: { attachmentOps: [
        { op: 'addLink', url: 'https://example.test/old1', clientId: 'c-1' },
        { op: 'addLink', url: 'https://example.test/old2', clientId: 'c-2' },
      ] } })
    await mount(task); await authorBody(); observe('existing-ready')
    await refClick(0); await refClick(1)
    await append(task.attachments!.map(a => a.id!))
  })
  it('N02 两新link真实click c-2保计划refs', async () => {
    expect(capabilityReady, 'BLOCKED: C01事件设施').toBe(true)
    await mount(); await links(); await authorBody()
    await refClick(1); await append(['c-2'])
  })
  it('N03 两link真file真实click c-2再c-3并一次主save', async () => {
    expect(capabilityReady, 'BLOCKED: C01事件设施').toBe(true)
    const ref = { current: false }
    await mount(undefined, ref); await links(); await pick(); await authorBody()
    await refClick(1); await refClick(2)
    await append(['c-2', 'c-3']); await save(ref, ['c-2', 'c-3'])
  })
  it('N04 两link真file真实click c-3再c-2并一次主save', async () => {
    expect(capabilityReady, 'BLOCKED: C01事件设施').toBe(true)
    const ref = { current: false }
    await mount(undefined, ref); await links(); await pick(); await authorBody()
    await refClick(2); await refClick(1)
    await append(['c-3', 'c-2']); await save(ref, ['c-3', 'c-2'])
  })
})
