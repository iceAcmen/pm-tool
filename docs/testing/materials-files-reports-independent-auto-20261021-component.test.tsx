// 真实生产组件 + 生产暂存/取消路由 + JSON存储，只有传输被受控替换，无GUI结论。
import React, { StrictMode } from 'react'
import { create, act, type ReactTestRenderer } from 'react-test-renderer'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec } from './src/core/storage.js'
import { addProject } from './src/core/projects.js'
import { addTask } from './src/core/tasks.js'
import { buildAssetRoutes } from './src/core/http/asset-route.js'
import { readStage } from './src/core/file-staging.js'
import { TaskDraftMaterials } from './src/client/shared/task-draft-materials.js'
import { MarkdownView } from './src/client/shared/markdown-view.js'

let root: string, facility: DomainFacility, domain: any, pid: string, view: ReactTestRenderer | undefined
let calls: Array<{ url: string; method: string; signal?: AbortSignal }>, published: any[]
let transportTasks: Array<Promise<Response>>
const own = process.env.QA_OWN!
async function performTransport(url: string, init: RequestInit = {}) {
  const req = new EventEmitter() as any
  req.method = init.method ?? 'GET'; req.headers = init.headers ?? {}; req.resume = () => {}
  const bytes = init.body instanceof Blob ? Buffer.from(await init.body.arrayBuffer()) : Buffer.alloc(0)
  req[Symbol.asyncIterator] = async function* () { yield bytes }
  const headers: Record<string, string> = {}
  let body: Buffer = Buffer.alloc(0)
  const res = { statusCode: 200, setHeader: (k: string, v: string) => { headers[k] = v },
    end: (b: Buffer | string) => { body = Buffer.isBuffer(b) ? b : Buffer.from(b ?? '') } } as any
  const handlers = buildAssetRoutes({ getDomain: () => domain, auth: { requestRejection: () => undefined } })
  if (url.includes('/stages/')) await handlers.cancelStage(req, res, url.split('/').at(-1)!)
  else await handlers.upload(req, res)
  return new Response(body as any, { status: res.statusCode, headers })
}
function transport(url: string, init: RequestInit = {}) {
  const result = performTransport(url, init)
  transportTasks.push(result)
  return result
}
function mount(ref = { current: false }) {
  act(() => {
    view = create(<StrictMode><TaskDraftMaterials deliverableOptions={[]} stageEnabled
      submissionRef={ref} onDraft={(...v) => published.push(v)}/></StrictMode>,
    { createNodeMock: () => ({ value: '' }) })
  })
}
async function pick(waitForIdle = true) {
  const file = new File(['# component QA\n'], 'component.md', { type: 'text/markdown' })
  await act(async () => {
    view!.root.findAllByType('input').find(n => n.props.type === 'file')!.props.onChange({ target: { files: [file] } })
    await Promise.all(transportTasks)
  })
  if (waitForIdle) await vi.waitFor(() =>
    expect(view!.root.findAllByType('input').find(n => n.props.type === 'file')!.props.disabled).toBe(false),
  { timeout: 3000, interval: 10 })
}
async function settle() { await act(async () => { await Promise.all(transportTasks) }) }
beforeEach(async () => {
  root = fs.mkdtempSync(path.join(own, 'component-'))
  process.env.DSH_PM_FILE_ROOT = path.join(root, 'files')
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(path.join(root, 'data')))
  facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  domain = await facility.open(pmDomainSpec)
  pid = (await addProject(domain, { name: '组件真实库', startDate: '2026-01-01', targetDate: '2026-12-31' })).id
  calls = []; published = []; transportTasks = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    calls.push({ url, method: init.method ?? 'GET', signal: init.signal ?? undefined })
    return transport(url, init)
  })
})
afterEach(async () => {
  if (view) { act(() => view!.unmount()); view = undefined }
  await settle()
  await facility.closeAll()
  vi.unstubAllGlobals()
})

describe('RA-F01/F02 独立生产组件 AUTO', () => {
  it('RA-F01/component-cancel: mount→真stage→unmount取消→再mount无残留；StrictMode包装不是浏览器严格双effect', async () => {
    mount()
    await pick()
    expect(published.length).toBeGreaterThan(0)
    const stage = published.at(-1)[0].draft.attachmentOps[0].stageId
    expect((await readStage(stage)).bytes.toString()).toBe('# component QA\n')
    expect([...domain.table('file_assets').entries()]).toHaveLength(0)
    act(() => view!.unmount()); view = undefined
    await settle()
    expect(calls.filter(c => c.method === 'DELETE')).toHaveLength(1)
    await expect(readStage(stage)).rejects.toThrow()
    mount()
    expect(view!.root.findAllByProps({ className: 'pm-staged-list' })).toHaveLength(0)
  })
  it('RA-F01/component-finalized:真实主save后submissionRef=true卸载不DELETE已消费stage', async () => {
    const ref = { current: false }
    mount(ref); await pick()
    const envelope = published.at(-1)[0]
    const saved = await addTask(domain, { projectId: pid, title: '组件后主保存', ...envelope })
    expect(saved.attachments).toHaveLength(1)
    ref.current = true
    act(() => view!.unmount()); view = undefined
    await settle()
    expect(calls.filter(c => c.method === 'DELETE')).toHaveLength(0)
    expect([...domain.table('file_assets').entries()]).toHaveLength(1)
  })
  it('RA-F02/component-abort:在途传输abort真实触发，取消不发布草稿/不入库', async () => {
    let signal: AbortSignal | undefined
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      signal = init.signal!
      return new Promise((_resolve, reject) => signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
    })
    mount(); await pick(false)
    expect(signal?.aborted).toBe(false)
    act(() => view!.unmount()); view = undefined
    await settle()
    expect(signal?.aborted).toBe(true)
    expect(published).toHaveLength(0)
    expect([...domain.table('file_assets').entries()]).toHaveLength(0)
    expect([...domain.table('tasks').entries()]).toHaveLength(0)
  })
  it('RA-F02/component-retry:网络拒绝显示原因且busy复原→重选→成功一行', async () => {
    let first = true
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method! })
      if (first) { first = false; return Promise.reject(new Error('QA网络拒绝')) }
      return transport(url, init)
    })
    mount(); await pick()
    expect(view!.root.findAllByProps({ role: 'alert' }).map(n => n.children.join('')).join('')).toContain('QA网络拒绝')
    expect(view!.root.findAllByType('input').find(n => n.props.type === 'file')!.props.disabled).toBe(false)
    await pick()
    expect(view!.root.findAll(n => n.props.className === 'pm-mat-list pm-staged-list')).toHaveLength(1)
    expect(published.at(-1)[0].draft.attachmentOps).toHaveLength(1)
  })
  it('RA-F02/component-late-success:卸载后晚成功不可发布或漏回收；传输完成但continuation延迟', async () => {
    let release: ((r: Response) => void) | undefined, response: Response | undefined
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method!, signal: init.signal ?? undefined })
      if (init.method === 'DELETE') return transport(url, init)
      response = await transport(url, init)
      return new Promise<Response>(resolve => { release = resolve })
    })
    mount(); await pick(false)
    expect(release).toBeTypeOf('function')
    const stage = (await response!.clone().json()).stageId
    act(() => view!.unmount()); view = undefined
    await act(async () => { release!(response!) })
    await settle()
    expect(published).toHaveLength(0)
    expect(calls.filter(c => c.method === 'DELETE')).toHaveLength(1)
    await expect(readStage(stage)).rejects.toThrow()
  })
  it('RA-F02/component-remount-late:旧卸载晚201不得串新组件草稿，新上传可真主save', async () => {
    let first = true, release!: (r: Response) => void, response!: Response
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method!, signal: init.signal ?? undefined })
      const result = await transport(url, init)
      if (init.method !== 'POST' || !first) return result
      first = false; response = result
      return new Promise<Response>(resolve => { release = resolve })
    })
    mount(); await pick(false)
    const oldStage = (await response.clone().json()).stageId
    act(() => view!.unmount()); view = undefined
    const ref = { current: false }
    mount(ref); await pick()
    const newEnvelope = published.at(-1)[0], count = published.length
    await act(async () => { release(response) })
    await settle()
    expect(published).toHaveLength(count)
    await expect(readStage(oldStage)).rejects.toThrow()
    const saved = await addTask(domain, { projectId: pid, title: '新一代有效上传', ...newEnvelope })
    expect(saved.attachments).toHaveLength(1)
    ref.current = true
    act(() => view!.unmount()); view = undefined
    await settle()
    expect(calls.filter(c => c.method === 'DELETE')).toHaveLength(1)
    expect([...domain.table('file_assets').entries()]).toHaveLength(1)
  })
})
describe('RA-R05真实安全渲染组件AUTO', () => {
  it('AST只产文本/安全链接，不产script、危险href或dangerouslySetInnerHTML', () => {
    const source = '|A|B|\n|---|---|\n|1|2|\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n```js\n<script>code</script>\n```'
    act(() => { view = create(<MarkdownView source={source}/>) })
    expect(view!.root.findAllByType('script')).toHaveLength(0)
    expect(view!.root.findAll(n => Boolean(n.props.dangerouslySetInnerHTML))).toHaveLength(0)
    expect(view!.root.findAllByType('a').some(a => /javascript:|data:/.test(a.props.href))).toBe(false)
    expect(view!.root.findAllByType('pre')).toHaveLength(1)
  })
})
