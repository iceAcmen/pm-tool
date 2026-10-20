/**
 * B6 P0 preview HTTP 路由单测：fake req/res + mock connection gate，不起活服务器。
 * 认证按真实签名传完整 IncomingMessage（断言 req identity，非 headers）；
 * 覆盖 401/403、无 gate 401、auth 异常 503、domain 未就绪 503、405、415、
 * 超限 413 与非法/空 JSON 400 区分、未知键 400、项目缺失 404、合法 200、统一安全头。
 */
import { describe, it, expect } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  buildPreviewRouteHandler,
  registerPreviewRoute,
  PREVIEW_API_PATH,
  type PreviewAuthGate,
  type PreviewWebServer,
} from './preview-route.js'
import type { PmDomain } from '../storage.js'

interface FakeRes {
  statusCode: number
  headers: Record<string, string>
  body: string
}

function makeRes(): FakeRes {
  return { statusCode: 200, headers: {}, body: '' }
}

function makeReq(method: string, headers: Record<string, string>, chunks: Buffer[] = []): IncomingMessage {
  return {
    method,
    headers,
    [Symbol.asyncIterator]: async function* () {
      for (const c of chunks) yield c
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

function jsonBody(obj: unknown): Buffer {
  return Buffer.from(JSON.stringify(obj), 'utf8')
}

const validPayload = {
  projectId: 'p-0001',
  periodStart: '2026-10-01',
  periodEnd: '2026-10-31',
  selectedRefs: [{ taskId: 't-0001', entryId: 'pl-1', revisionId: 'rv-1' }],
}

function stubDomain(projectExists: boolean): PmDomain {
  return {
    table(name: string) {
      if (name === 'projects') return { get: () => (projectExists ? { id: 'p-0001' } : undefined) }
      if (name === 'tasks') {
        return {
          entries: () =>
            [
              ['t-0001', {
                id: 't-0001',
                projectId: 'p-0001',
                progressLog: [{
                  id: 'pl-1', date: '2026-10-10',
                  revisions: [{ id: 'rv-1', author: 'Ray', date: '2026-10-10', content: '完成联调', refs: [], revisedAt: '2026-10-10T09:00:00.000Z' }],
                }],
              }],
            ].values(),
        }
      }
      return { entries: () => [].values() }
    },
  } as unknown as PmDomain
}

const openAuth: PreviewAuthGate = { requestRejection: () => undefined }

describe('B6 preview-route HTTP gate', () => {
  it('无 connection gate 时 fail-closed 401', async () => {
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true) })(
      makeReq('POST', { 'content-type': 'application/json' }, [jsonBody(validPayload)]),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(401)
  })

  it('gate 收到完整 req 而非 headers；401 返回 unauthorized', async () => {
    let seenReq: unknown
    const auth: PreviewAuthGate = { requestRejection: (req) => { seenReq = req; return 401 } }
    const res = makeRes()
    const req = makeReq('POST', { 'content-type': 'application/json' }, [jsonBody(validPayload)])
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true), auth })(req, resAdapter(res))
    expect(seenReq).toBe(req)
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body).error.code).toBe('unauthorized')
  })

  it('403 返回 forbidden（不写成 unauthorized）', async () => {
    const auth: PreviewAuthGate = { requestRejection: () => 403 }
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true), auth })(
      makeReq('POST', { 'content-type': 'application/json' }, [jsonBody(validPayload)]),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error.code).toBe('forbidden')
  })

  it('gate 抛错按 503 fail-closed，不泄内部', async () => {
    const auth: PreviewAuthGate = { requestRejection: () => { throw new Error('boom') } }
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true), auth })(makeReq('POST', {}, []), resAdapter(res))
    expect(res.statusCode).toBe(503)
    expect(JSON.parse(res.body).error.code).toBe('auth_unavailable')
    expect(res.body).not.toContain('boom')
  })

  it('domain 未就绪返回 503 storage_unavailable', async () => {
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => undefined, auth: openAuth })(
      makeReq('POST', { 'content-type': 'application/json' }, [jsonBody(validPayload)]),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(503)
    expect(JSON.parse(res.body).error.code).toBe('storage_unavailable')
  })

  it('GET 返回 405、allow POST，并带安全头', async () => {
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true), auth: openAuth })(makeReq('GET', {}), resAdapter(res))
    expect(res.statusCode).toBe(405)
    expect(res.headers.allow).toBe('POST')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('非 application/json 返回 415', async () => {
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true), auth: openAuth })(
      makeReq('POST', { 'content-type': 'text/plain' }, []),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(415)
  })

  it('Content-Length 超限返回 413（而非 400）', async () => {
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true), auth: openAuth })(
      makeReq('POST', { 'content-type': 'application/json', 'content-length': '99999999' }, []),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(413)
    expect(JSON.parse(res.body).error.code).toBe('body_too_large')
  })

  it('非法/空 JSON 返回 400 invalid_json', async () => {
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true), auth: openAuth })(
      makeReq('POST', { 'content-type': 'application/json' }, [Buffer.from('{nope', 'utf8')]),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error.code).toBe('invalid_json')
  })

  it('未知键被 strict schema 拒绝 400', async () => {
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true), auth: openAuth })(
      makeReq('POST', { 'content-type': 'application/json' }, [jsonBody({ ...validPayload, evil: 1 })]),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error.code).toBe('invalid_preview_request')
  })

  it('项目不存在返回 404', async () => {
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(false), auth: openAuth })(
      makeReq('POST', { 'content-type': 'application/json' }, [jsonBody(validPayload)]),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(404)
    expect(JSON.parse(res.body).error.code).toBe('project_not_found')
  })

  it('合法 POST 返回 candidates 与安全响应头', async () => {
    const res = makeRes()
    await buildPreviewRouteHandler({ getDomain: () => stubDomain(true), auth: openAuth })(
      makeReq('POST', { 'content-type': 'application/json' }, [jsonBody(validPayload)]),
      resAdapter(res),
    )
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)
    expect(data.candidates).toHaveLength(1)
    expect(data.candidates[0].content).toBe('完成联调')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['cache-control']).toBe('no-store')
    expect(PREVIEW_API_PATH).toBe('/api/pm/v1/report-preview')
  })
})

describe('preview 路由注册能力（不凭服务存在虚报）', () => {
  it('webServer/connection 缺失 → ok=false', () => {
    expect(registerPreviewRoute(undefined, openAuth, () => stubDomain(true)).ok).toBe(false)
    const ws: PreviewWebServer = { register: () => () => {} }
    expect(registerPreviewRoute(ws, undefined, () => stubDomain(true)).ok).toBe(false)
  })

  it('register 成功返回 disposer → ok=true 且可卸载', () => {
    let disposed = false
    const ws: PreviewWebServer = {
      register: (route) => {
        expect(route.path).toBe(PREVIEW_API_PATH)
        return () => { disposed = true }
      },
    }
    const r = registerPreviewRoute(ws, openAuth, () => stubDomain(true))
    expect(r.ok).toBe(true)
    r.dispose?.()
    expect(disposed).toBe(true)
  })

  it('路径冲突 register 抛错 → ok=false，不继续宣称可用', () => {
    const ws: PreviewWebServer = { register: () => { throw new Error('conflict') } }
    expect(registerPreviewRoute(ws, openAuth, () => stubDomain(true)).ok).toBe(false)
  })
})
