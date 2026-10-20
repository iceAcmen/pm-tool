/**
 * B3 asset HTTP 路由单测：fake req/res + mock connection gate，不起活服务器。
 * 覆盖认证 fail-closed 401/403/503、405、upload 缺 task 400、Content-Length 超限 413、
 * download 缺参 400、资产未挂到本任务 403（禁止仅凭 assetId 全局取）、统一安全头。
 * 真实落盘/去重/下载字节由 verify-b3-asset 集成脚本覆盖。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildAssetRoutes, registerAssetRoute, ASSET_UPLOAD_PATH, ASSET_DOWNLOAD_PREFIX, STAGE_PREFIX } from './asset-route.js'
import type { PreviewAuthGate } from './preview-route.js'
import type { PmDomain } from '../storage.js'

interface FakeRes {
  statusCode: number
  headers: Record<string, string>
  body: string
}

function makeRes(): FakeRes {
  return { statusCode: 200, headers: {}, body: '' }
}

function makeReq(method: string, url: string, headers: Record<string, string>, chunks: Buffer[] = []): IncomingMessage {
  const listeners: Record<string, Array<() => void>> = {}
  return {
    method,
    url,
    headers,
    [Symbol.asyncIterator]: async function* () {
      for (const c of chunks) yield c
    },
    on(event: string, cb: () => void) {
      ;(listeners[event] ??= []).push(cb)
    },
    emit(event: string) {
      listeners[event]?.forEach(cb => cb())
    },
    resume() {},
  } as unknown as IncomingMessage
}

function resAdapter(fake: FakeRes): ServerResponse {
  const adapter = {
    setHeader(k: string, v: string) { fake.headers[k.toLowerCase()] = v },
    end(body?: string) { fake.body = body ?? '' },
  }
  Object.defineProperty(adapter, 'statusCode', {
    get: () => fake.statusCode,
    set: (v: number) => { fake.statusCode = v },
  })
  return adapter as unknown as ServerResponse
}

function stubDomain(taskRow: unknown): PmDomain {
  return {
    table(name: string) {
      if (name === 'tasks') {
        return { get: () => taskRow, put: async () => {}, entries: () => [].values() }
      }
      if (name === 'file_assets') {
        return { get: () => undefined, put: async () => {}, entries: () => [].values() }
      }
      return { get: () => undefined, put: async () => {}, entries: () => [].values() }
    },
  } as unknown as PmDomain
}

const openAuth: PreviewAuthGate = { requestRejection: () => undefined }
const forbidAuth: PreviewAuthGate = { requestRejection: () => 403 }
const rejectAuth: PreviewAuthGate = { requestRejection: () => 401 }
const throwAuth: PreviewAuthGate = { requestRejection: () => { throw new Error('gate down') } }

describe('B3 asset-route 宿主注册契约', () => {
  it('prefix 注册路径无尾斜杠，兼容宿主 p 与 p/<anything> 语义', () => {
    const routes: Array<{ kind: string; path: string }> = []
    const result = registerAssetRoute({
      register(route) { routes.push({ kind: route.kind, path: route.path }); return () => {} },
    }, openAuth, () => stubDomain(undefined))
    expect(result.ok).toBe(true)
    expect(routes).toEqual([
      { kind: 'exact', path: ASSET_UPLOAD_PATH },
      { kind: 'prefix', path: ASSET_DOWNLOAD_PREFIX },
      { kind: 'prefix', path: STAGE_PREFIX },
    ])
    expect(ASSET_DOWNLOAD_PREFIX.endsWith('/')).toBe(false)
    expect(STAGE_PREFIX.endsWith('/')).toBe(false)
  })
})

describe('B3 asset-route HTTP gate', () => {
  let tmp: string
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'pm-route-'))
    process.env.DSH_PM_FILE_ROOT = tmp
  })
  afterEach(() => {
    delete process.env.DSH_PM_FILE_ROOT
    rmSync(tmp, { recursive: true, force: true })
  })

  it('无 connection gate 时 upload fail-closed 401', async () => {
    const res = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth: undefined })
    await h.upload(makeReq('POST', ASSET_UPLOAD_PATH, {}), resAdapter(res))
    expect(res.statusCode).toBe(401)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('gate 403 → forbidden，gate 401 → unauthorized', async () => {
    for (const [auth, code] of [[forbidAuth, 403], [rejectAuth, 401]] as const) {
      const res = makeRes()
      const h = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth })
      await h.upload(makeReq('POST', ASSET_UPLOAD_PATH, {}), resAdapter(res))
      expect(res.statusCode).toBe(code)
    }
  })

  it('gate 异常 → 503 auth_unavailable，不泄内部', async () => {
    const res = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth: throwAuth })
    await h.upload(makeReq('POST', ASSET_UPLOAD_PATH, {}), resAdapter(res))
    expect(res.statusCode).toBe(503)
    expect(res.body).not.toContain('gate down')
  })

  it('非 POST upload → 405 且 Allow:POST', async () => {
    const res = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth: openAuth })
    await h.upload(makeReq('GET', ASSET_UPLOAD_PATH, {}), resAdapter(res))
    expect(res.statusCode).toBe(405)
    expect(res.headers['allow']).toBe('POST')
  })

  it('非法 x-pm-task-id（非 t-N）→ 400 invalid_request', async () => {
    const res = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth: openAuth })
    await h.upload(makeReq('POST', ASSET_UPLOAD_PATH, { 'x-pm-task-id': 'bad', 'x-pm-file-name': 'a.md' }, [Buffer.from('x')]), resAdapter(res))
    expect(res.statusCode).toBe(400)
  })

  it('Content-Length 超 10MiB → 413 body_too_large', async () => {
    const res = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth: openAuth })
    await h.upload(makeReq('POST', ASSET_UPLOAD_PATH, { 'x-pm-task-id': 't-0001', 'content-length': '11000000' }), resAdapter(res))
    expect(res.statusCode).toBe(413)
  })

  it('download 缺 taskId → 400', async () => {
    const res = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain({ projectId: 'p-0001', attachments: [] }), auth: openAuth })
    await h.download(makeReq('GET', '/api/pm/v1/assets/fa-1', {}), resAdapter(res), 'fa-1', undefined)
    expect(res.statusCode).toBe(400)
  })

  it('资产未挂到本任务 → 403（禁止仅凭 assetId 全局取）', async () => {
    const res = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain({ projectId: 'p-0001', attachments: [] }), auth: openAuth })
    await h.download(makeReq('GET', '/api/pm/v1/assets/fa-1?taskId=t-0001', {}), resAdapter(res), 'fa-1', 't-0001')
    expect(res.statusCode).toBe(403)
  })

  it('download 非 GET → 405 Allow:GET', async () => {
    const res = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth: openAuth })
    await h.download(makeReq('POST', '/api/pm/v1/assets/fa-1?taskId=t-0001', {}), resAdapter(res), 'fa-1', 't-0001')
    expect(res.statusCode).toBe(405)
    expect(res.headers['allow']).toBe('GET')
  })

  it('无 taskId 的 upload 走暂存：201 返回 opaque stageId，不挂任务/不写资产', async () => {
    const res = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth: openAuth })
    const md = Buffer.from('# 标题\n正文\n', 'utf8')
    await h.upload(
      makeReq('POST', ASSET_UPLOAD_PATH, { 'x-pm-file-name': 'note.md', 'content-type': 'text/markdown' }, [md]),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.stageId).toMatch(/^[a-f0-9]{32}$/)
    expect(body.size).toBe(md.length)
    expect(body.expiresAt).toBeTruthy()
    expect(body.assetId).toBeUndefined()
  })

  it('cancel 无 auth → 401；非 DELETE → 405', async () => {
    const noAuth = makeRes()
    const h0 = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth: undefined })
    await h0.cancelStage(makeReq('DELETE', '/api/pm/v1/stages/abc', {}), resAdapter(noAuth), 'a'.repeat(32))
    expect(noAuth.statusCode).toBe(401)
    const m = makeRes()
    const h = buildAssetRoutes({ getDomain: () => stubDomain(undefined), auth: openAuth })
    await h.cancelStage(makeReq('POST', '/api/pm/v1/stages/abc', {}), resAdapter(m), 'a'.repeat(32))
    expect(m.statusCode).toBe(405)
    expect(m.headers['allow']).toBe('DELETE')
  })

  it('直挂 upload 通过注入 attachFile 返回响应契约；download 字节一致且带 disposition', async () => {
    const bytes = Buffer.from('hello', 'utf8')
    const resUp = makeRes()
    const h = buildAssetRoutes({
      getDomain: () => stubDomain({ projectId: 'p-0001', attachments: [{ kind: 'file', assetId: 'fa-1' }] }),
      auth: openAuth,
      attachFile: async () => ({
        asset: { id: 'fa-1', fileName: 'a.txt', mediaType: 'text/plain', size: 5, sha256: 'x'.repeat(64) },
        attachment: { id: 'at-1' },
        alreadyAttached: false,
      }),
      resolveAsset: async () => ({ fileName: 'a.txt', mediaType: 'text/plain', size: 5, bytes }),
    })
    await h.upload(
      makeReq('POST', ASSET_UPLOAD_PATH, { 'x-pm-task-id': 't-0001', 'x-pm-file-name': 'a.txt' }, [bytes]),
      resAdapter(resUp),
    )
    expect(resUp.statusCode).toBe(200)
    const up = JSON.parse(resUp.body)
    expect(up.assetId).toBe('fa-1')
    expect(up.attachmentId).toBe('at-1')

    const resDl = makeRes()
    await h.download(
      makeReq('GET', '/api/pm/v1/assets/fa-1?taskId=t-0001', {}),
      resAdapter(resDl),
      'fa-1',
      't-0001',
    )
    expect(resDl.statusCode).toBe(200)
    expect(Buffer.isBuffer(resDl.body) ? resDl.body.equals(bytes) : resDl.body === 'hello').toBe(true)
    expect(resDl.headers['content-disposition']).toContain("attachment; filename*=UTF-8''")
    expect(resDl.headers['x-content-type-options']).toBe('nosniff')
  })

  it('projectId 头与任务项目不一致 → 403，不挂接', async () => {
    const res = makeRes()
    let captured = ''
    const h = buildAssetRoutes({
      getDomain: () => stubDomain({ projectId: 'p-0001', attachments: [] }),
      auth: openAuth,
      attachFile: async (_t, input) => {
        captured = input.originalName
        return { asset: { id: 'fa-1', fileName: 'a.txt', mediaType: 'text/plain', size: 1, sha256: 'z' }, attachment: { id: 'at-1' }, alreadyAttached: false }
      },
    })
    const req = makeReq('POST', ASSET_UPLOAD_PATH, { 'x-pm-task-id': 't-0001', 'x-pm-project-id': 'p-0099', 'x-pm-file-name': 'a.txt' }, [Buffer.from('x')])
    await h.upload(req, resAdapter(res))
    expect(res.statusCode).toBe(403)
    expect(captured).toBe('')
  })

  it('恶意文件名取 basename 并剥除控制字符/换行，不出现路径', async () => {
    const res = makeRes()
    let captured = ''
    const h = buildAssetRoutes({
      getDomain: () => stubDomain({ projectId: 'p-0001', attachments: [] }),
      auth: openAuth,
      attachFile: async (_t, input) => {
        captured = input.originalName
        return { asset: { id: 'fa-1', fileName: 'a.txt', mediaType: 'text/plain', size: 1, sha256: 'z' }, attachment: { id: 'at-1' }, alreadyAttached: false }
      },
    })
    const evil = encodeURIComponent('../../etc/passwd\r\nX-Inject: 1')
    await h.upload(
      makeReq('POST', ASSET_UPLOAD_PATH, { 'x-pm-task-id': 't-0001', 'x-pm-file-name': evil }, [Buffer.from('x')]),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(200)
    expect(captured).not.toContain('/')
    expect(captured).not.toContain('\n')
    expect(captured).not.toContain('..')
  })

  it('aborted 中断 → 400 request_aborted，不调用 attach', async () => {
    const res = makeRes()
    let called = false
    const h = buildAssetRoutes({
      getDomain: () => stubDomain({ projectId: 'p-0001', attachments: [] }),
      auth: openAuth,
      attachFile: async () => {
        called = true
        return { asset: { id: 'fa-1', fileName: 'a.txt', mediaType: 'text/plain', size: 1, sha256: 'z' }, attachment: { id: 'at-1' }, alreadyAttached: false }
      },
    })
    const req = makeReq('POST', ASSET_UPLOAD_PATH, { 'x-pm-task-id': 't-0001' }, [])
    req.emit('aborted')
    await h.upload(req, resAdapter(res))
    expect(res.statusCode).toBe(400)
    expect(called).toBe(false)
  })
})
