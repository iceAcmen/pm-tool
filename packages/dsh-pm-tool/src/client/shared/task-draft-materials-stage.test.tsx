import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { EventEmitter } from 'node:events'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pmDomainSpec, type PmDomain } from '../../core/storage.js'
import { addProject } from '../../core/projects.js'
import { addTask } from '../../core/tasks.js'
import { buildAssetRoutes } from '../../core/http/asset-route.js'
import { readStage } from '../../core/file-staging.js'
import { TaskDraftMaterials } from './task-draft-materials.js'

// 真实组件、真实stage handler及JSON领域库；仅网络传输延迟/失败受控。
let view: ReactTestRenderer | undefined
let facility: DomainFacility
let domain: PmDomain
let projectId: string
let published: Array<{ draft: { attachmentOps: Array<{ stageId: string }> } } | null>
let commands: Array<{ method: string; signal?: AbortSignal }>
let transportTasks: Array<Promise<Response>>
const file = () => new File(['# stage lifecycle\n'], 'stage.md', { type: 'text/markdown' })

async function transport(url: string, init: RequestInit = {}): Promise<Response> {
  const req = new EventEmitter() as any
  req.method = init.method ?? 'GET'
  req.headers = init.headers ?? {}
  req.resume = () => {}
  const bytes = init.body instanceof Blob ? Buffer.from(await init.body.arrayBuffer()) : Buffer.alloc(0)
  req[Symbol.asyncIterator] = async function* () { yield bytes }
  let body = Buffer.alloc(0)
  const headers: Record<string, string> = {}
  const res = {
    statusCode: 200, setHeader: (key: string, value: string) => { headers[key] = value },
    end: (value: Buffer | string) => { body = Buffer.isBuffer(value) ? value : Buffer.from(value ?? '') },
  } as any
  const routes = buildAssetRoutes({ getDomain: () => domain, auth: { requestRejection: () => undefined } })
  if (url.includes('/stages/')) await routes.cancelStage(req, res, url.split('/').at(-1)!)
  else await routes.upload(req, res)
  return new Response(body, { status: res.statusCode, headers })
}
function request(url: string, init: RequestInit = {}) {
  commands.push({ method: init.method ?? 'GET', signal: init.signal ?? undefined })
  const result = transport(url, init)
  transportTasks.push(result)
  return result
}
beforeEach(async () => {
  published = []; commands = []; transportTasks = []
  const root = mkdtempSync(join(tmpdir(), 'pm-task-stage-test-'))
  vi.stubEnv('DSH_PM_FILE_ROOT', join(root, 'files'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
  facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  domain = await facility.open(pmDomainSpec) as PmDomain
  projectId = (await addProject(domain, { name: 'stage QA', startDate: '2026-01-01', targetDate: '2026-12-31' })).id
  vi.stubGlobal('fetch', request)
})
afterEach(async () => {
  if (view) act(() => view!.unmount())
  view = undefined
  await Promise.all(transportTasks)
  await facility.closeAll()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
function mount(submissionRef = { current: false }) {
  act(() => {
    view = create(createElement(TaskDraftMaterials, {
      deliverableOptions: [], stageEnabled: true, submissionRef,
      onDraft: envelope => { published.push(envelope as typeof published[number]) },
    }), { createNodeMock: () => ({ value: '' }) })
  })
}
function pick() {
  view!.root.findAllByType('input').find(node => node.props.type === 'file')!
    .props.onChange({ target: { files: [file()] } })
}
async function pickAndSettle() {
  await act(async () => { pick(); await Promise.all(transportTasks) })
}

describe('MFR-F05 真实文件暂存组件取消与完成归属', () => {
  it('成功stage后卸载回收，真实主save后卸载不删已消费资产', async () => {
    mount()
    await pickAndSettle()
    const stage = published.at(-1)!.draft.attachmentOps[0].stageId
    expect((await readStage(stage)).bytes.toString()).toBe('# stage lifecycle\n')
    act(() => view!.unmount()); view = undefined
    await Promise.all(transportTasks)
    expect(commands.filter(c => c.method === 'DELETE')).toHaveLength(1)
    await expect(readStage(stage)).rejects.toThrow()
    const ref = { current: false }
    commands = []
    mount(ref)
    await pickAndSettle()
    const saved = await addTask(domain, { projectId, title: 'stage saved', ...published.at(-1)! })
    expect(saved.attachments).toHaveLength(1)
    ref.current = true
    act(() => view!.unmount()); view = undefined
    await Promise.all(transportTasks)
    expect(commands.filter(c => c.method === 'DELETE')).toHaveLength(0)
    expect([...domain.table('file_assets').entries()]).toHaveLength(1)
  })

  it('服务已产生201但continuation迟到，卸载后不publish且真实DELETE回收stage', async () => {
    let release!: (value: Response) => void
    let response!: Response
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      if (init.method === 'DELETE') return request(url, init)
      response = await request(url, init)
      return new Promise<Response>(resolve => { release = resolve })
    })
    mount()
    await pickAndSettle()
    const stage = (await response.clone().json()).stageId
    act(() => view!.unmount()); view = undefined
    expect(commands[0].signal!.aborted).toBe(true)
    await act(async () => { release(response) })
    await Promise.all(transportTasks)
    expect(published).toHaveLength(0)
    expect(commands.filter(c => c.method === 'DELETE')).toHaveLength(1)
    await expect(readStage(stage)).rejects.toThrow()
    expect([...domain.table('tasks').entries()]).toHaveLength(0)
  })

  it('旧卸载上传迟到不能向新组件发布；新上传仍可保存', async () => {
    let release!: (value: Response) => void
    let response!: Response
    let first = true
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      const result = await request(url, init)
      if (init.method !== 'POST' || !first) return result
      first = false; response = result
      return new Promise<Response>(resolve => { release = resolve })
    })
    mount(); await pickAndSettle()
    act(() => view!.unmount()); view = undefined
    mount(); await pickAndSettle()
    expect(published).toHaveLength(1)
    const newStage = published[0]!.draft.attachmentOps[0].stageId
    await act(async () => { release(response) })
    await Promise.all(transportTasks)
    expect(published).toHaveLength(1)
    expect((await readStage(newStage)).bytes.toString()).toBe('# stage lifecycle\n')
  })

  it('网络拒绝恢复busy/保错误，重选文件可成功', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('QA network'))
      .mockImplementation(request))
    mount()
    await act(async () => { pick() })
    expect(view!.root.findByProps({ role: 'alert' }).children.join('')).toContain('QA network')
    expect(view!.root.findAllByType('input').find(node => node.props.type === 'file')!.props.disabled).toBe(false)
    await pickAndSettle()
    expect(published).toHaveLength(1)
  })
})
