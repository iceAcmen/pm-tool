import { act } from 'react'
import { JSDOM } from 'jsdom'
import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pmDomainSpec, type PmDomain } from '../../core/storage.js'
import { addProject } from '../../core/projects.js'
import { addTask, getTask } from '../../core/tasks.js'
import { buildAssetRoutes } from '../../core/http/asset-route.js'
import { readStage } from '../../core/file-staging.js'
import { TaskDraftMaterials, type TaskDraftMaterialsProps } from './task-draft-materials.js'
import type { TaskDraftOps } from './b2-ops.js'

// React/ReactDOM 18.3.1 同实例 + JSDOM 25.0.1；真实 dispatch，不保活 currentTarget。
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement',
  'HTMLTextAreaElement', 'Element', 'Node', 'Event', 'MouseEvent']) {
  vi.stubGlobal(key, key === 'window' ? dom.window : (dom.window as any)[key])
}
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const { createRoot } = await import('react-dom/client')
const content = '# QA note\nref file ok\n'
let root: string, container: HTMLDivElement, facility: DomainFacility, domain: PmDomain, projectId: string
let view: ReturnType<typeof createRoot> | undefined
let published: { envelope: { draft: TaskDraftOps } | null; errors: string[] }[]
let pending: Promise<Response>[], requests: { method: string; status: number }[]

function latest() {
  expect(published.at(-1)!.errors).toEqual([])
  return published.at(-1)!.envelope!
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
  const res = { statusCode: 200, setHeader: () => {},
    end: (v: Buffer | string) => { body = Buffer.isBuffer(v) ? v : Buffer.from(v ?? '') } } as any
  const routes = buildAssetRoutes({ getDomain: () => domain, auth: { requestRejection: () => undefined } })
  if (url.startsWith('/api/pm/v1/stages/')) await routes.cancelStage(req, res, url.split('/').at(-1)!)
  else {
    expect(url).toBe('/api/pm/v1/assets/upload')
    expect(bytes).toEqual(Buffer.from(content))
    await routes.upload(req, res)
  }
  requests.push({ method: req.method, status: res.statusCode })
  return new Response(body, { status: res.statusCode })
}
async function mount(task?: TaskDraftMaterialsProps['task'], submissionRef = { current: false }) {
  await act(async () => {
    view = createRoot(container)
    view.render(<TaskDraftMaterials task={task} deliverableOptions={[]} stageEnabled
      submissionRef={submissionRef} onDraft={(envelope, errors) => {
        published.push({ envelope: structuredClone(envelope), errors })
      }}/>)
  })
}
async function unmount() {
  await act(async () => { view!.unmount(); view = undefined; await drain() })
}
async function fill(label: string, value: string) {
  const node = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[aria-label="${label}"]`)!
  expect(node).not.toBeNull()
  const proto = node.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(node, value)
    node.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  expect(node.value).toBe(value)
}
async function button(label: string) {
  const node = [...container.querySelectorAll('button')].find(n => n.textContent === label)
  expect(node).toBeDefined()
  await act(async () => { node!.click(); await drain() })
}
const checkboxes = () => [...container.querySelectorAll<HTMLInputElement>('.pm-prog-ref input')]
async function toggle(index: number, checked: boolean) {
  expect(checkboxes()[index]).toBeDefined()
  await act(async () => { checkboxes()[index].click(); await drain() })
  expect(container.querySelector('[data-draft]')).not.toBeNull()
  expect(checkboxes()[index].checked).toBe(checked)
}
async function links() {
  for (const i of [1, 2]) {
    await fill('资料链接地址', `https://example.test/c${i}`)
    await fill('链接标题', `c${i}`)
    await button('加链接')
    expect(checkboxes()).toHaveLength(i)
  }
  expect(latest().draft.attachmentOps!.map(o => o.clientId)).toEqual(['c-1', 'c-2'])
}
async function authorBody() {
  await fill('进展作者', '引用回归')
  await fill('进展正文', '合法引用进展')
}
async function append(refs: string[]) {
  await button('追加进展（草稿）')
  expect(latest().draft.progressOps!.at(-1)).toEqual({
    op: 'add', author: '引用回归', content: '合法引用进展', refs,
  })
  expect(checkboxes().map(n => n.checked)).toEqual(checkboxes().map(() => false))
}
async function pick() {
  const file = new dom.window.File([content], 'qa-note.md', { type: 'text/markdown' })
  const node = container.querySelector<HTMLInputElement>('input[type="file"]')!
  // 只提供 chooser 的 FileList 边界，不模拟事件/产品 handler/状态。
  await act(async () => {
    Object.defineProperty(node, 'files', { configurable: true,
      value: Object.assign([file], { item: (i: number) => i === 0 ? file : null }) })
    node.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
    await drain()
  })
  expect(requests).toEqual([{ method: 'POST', status: 201 }])
  expect(checkboxes()).toHaveLength(3)
  const op = latest().draft.attachmentOps!.at(-1)!
  expect(op).toMatchObject({ op: 'addFile', clientId: 'c-3' })
  expect((await readStage(op.stageId!)).bytes).toEqual(Buffer.from(content))
  return op.stageId!
}
beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), 'pm-material-ref-dom-'))
  vi.stubEnv('DSH_PM_FILE_ROOT', join(root, 'files'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
  facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  domain = await facility.open(pmDomainSpec) as PmDomain
  projectId = (await addProject(domain, { name: '资料引用回归', startDate: '2026-01-01', targetDate: '2026-12-31' })).id
  container = dom.window.document.createElement('div')
  dom.window.document.body.appendChild(container)
  published = []; pending = []; requests = []
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    const promise = transport(url, init); pending.push(promise); return promise
  })
})
afterEach(async () => {
  if (view) await unmount()
  await drain()
  await facility.closeAll()
  container.remove()
  vi.restoreAllMocks(); vi.unstubAllEnvs()
})
afterAll(() => { vi.unstubAllGlobals(); dom.window.close() })

describe('资料进展真实 DOM 引用回归', () => {
  it('既有 at-ID 可选择及取消选择，不提前写既有任务', async () => {
    const task = await addTask(domain, { projectId, title: '既有资料',
      draft: { attachmentOps: [
        { op: 'addLink', url: 'https://example.test/old1', clientId: 'c-1' },
        { op: 'addLink', url: 'https://example.test/old2', clientId: 'c-2' },
      ] } })
    const before = structuredClone(getTask(domain, task.id))
    await mount(task); await authorBody()
    await toggle(0, true); await toggle(1, true); await toggle(0, false)
    await append(['at-2'])
    expect(getTask(domain, task.id)).toEqual(before)
  })
  it('两 link 立即出现候选，c-2 反复切换后单 addTask 保真实 at-2', async () => {
    await mount(); await links(); await authorBody()
    await toggle(1, true); await toggle(1, false); await toggle(1, true)
    await toggle(0, true); await toggle(0, false); await append(['c-2'])
    const saved = await addTask(domain, { projectId, title: '两链接主保存', ...latest() })
    expect(saved.attachments!.map(a => a.id)).toEqual(['at-1', 'at-2'])
    expect(getTask(domain, saved.id)!.progressLog![0].refs).toEqual(['at-2'])
    expect(requests).toEqual([])
  })
  it('c-2 与 file 选择/取消后 refs 精确，真实字节落库且成功卸载不 DELETE', async () => {
    const submitted = { current: false }
    await mount(undefined, submitted); await links(); await pick(); await authorBody()
    await toggle(2, true); await toggle(2, false); await toggle(2, true)
    await toggle(1, true); await toggle(1, false); await toggle(1, true)
    await append(['c-3', 'c-2'])
    const saved = await addTask(domain, { projectId, title: '文件主保存', description: '正常说明', ...latest() })
    submitted.current = true
    expect(saved.attachments!.map(a => a.id)).toEqual(['at-1', 'at-2', 'at-3'])
    expect(getTask(domain, saved.id)!.progressLog![0].refs).toEqual(['at-3', 'at-2'])
    const assets = [...domain.table('file_assets').entries()]
    expect(assets).toHaveLength(1)
    expect(saved.attachments![2].assetId).toBe(assets[0][0])
    const asset = assets[0][1] as { relPath: string; size: number }
    expect(asset.size).toBe(22)
    expect(readFileSync(join(root, 'files', asset.relPath))).toEqual(Buffer.from(content))
    await unmount()
    expect(requests).toEqual([{ method: 'POST', status: 201 }])
    expect(readFileSync(join(root, 'files', asset.relPath))).toEqual(Buffer.from(content))
  })
  it('有 refs 未提交直接取消仍回收 stage，任务/资产零写', async () => {
    await mount(); await links(); const stage = await pick(); await authorBody()
    await toggle(1, true); await toggle(2, true); await append(['c-2', 'c-3'])
    expect([...domain.table('tasks').entries()]).toEqual([])
    expect([...domain.table('file_assets').entries()]).toEqual([])
    await unmount()
    expect(requests).toEqual([{ method: 'POST', status: 201 }, { method: 'DELETE', status: 200 }])
    await expect(readStage(stage)).rejects.toThrow()
    expect(readdirSync(join(root, 'files/staging'))).toEqual([])
    expect([...domain.table('tasks').entries()]).toEqual([])
    expect([...domain.table('file_assets').entries()]).toEqual([])
  })
  it('移除 file 后候选与已追加 refs 同步剔除 c-3，保 c-2', async () => {
    await mount(); await links(); const stage = await pick(); await authorBody()
    await toggle(1, true); await toggle(2, true); await append(['c-2', 'c-3'])
    await button('移除暂存')
    expect(checkboxes()).toHaveLength(2)
    expect(latest().draft.attachmentOps!.map(o => o.clientId)).toEqual(['c-1', 'c-2'])
    expect(latest().draft.progressOps![0].refs).toEqual(['c-2'])
    await expect(readStage(stage)).rejects.toThrow()
    await unmount()
    expect(requests).toEqual([{ method: 'POST', status: 201 }, { method: 'DELETE', status: 200 }])
  })
})
