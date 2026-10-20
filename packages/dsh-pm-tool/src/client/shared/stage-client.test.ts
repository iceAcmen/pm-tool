import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  stageAsset,
  cancelStagedAsset,
  StageUnavailable,
  STAGE_UPLOAD_ROUTE,
} from './stage-client.js'

afterEach(() => vi.unstubAllGlobals())

function jsonFetch(body: unknown, status = 201) {
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  }))
}

const envelope = {
  stageId: 'a'.repeat(32),
  fileName: '设计稿.pdf',
  mediaType: 'application/pdf',
  size: 204800,
  sha256: 'abcdef1234567890',
  expiresAt: '2026-10-20T12:00:00Z',
}

describe('stageAsset 暂存 POST（无 taskId）', () => {
  it('201：信封映射（stageId/fileName/mediaType/size/sha256/expiresAt）', async () => {
    vi.stubGlobal('fetch', jsonFetch(envelope))
    const out = await stageAsset({ body: new Blob(['x'], { type: 'application/pdf' }), fileName: '设计稿.pdf' })
    expect(out).toEqual(envelope)
  })

  it('POST 原始 octet：无 x-pm-task-id，头携带 x-pm-file-name/x-pm-media-type，credentials same-origin/no-store', async () => {
    const fetchMock = vi.fn(jsonFetch(envelope))
    vi.stubGlobal('fetch', fetchMock)
    const body = new Blob(['bytes'], { type: 'image/png' })
    await stageAsset({ body, fileName: 'a.png', mediaType: 'image/png' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(STAGE_UPLOAD_ROUTE)
    expect(init.method).toBe('POST')
    expect(init.body).toBe(body)
    expect(init.credentials).toBe('same-origin')
    expect(init.cache).toBe('no-store')
    expect(init.headers['x-pm-file-name']).toBe('a.png')
    expect(init.headers['x-pm-media-type']).toBe('image/png')
    expect(init.headers['x-pm-task-id']).toBeUndefined()
    expect(init.headers['content-type']).toBe('image/png')
  })

  it('abort signal 透传给 fetch；外部 abort 中止并抛 abort，不发成功信封', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn(async (_url: unknown, init: RequestInit) => {
      expect(init.signal).toBe(controller.signal)
      controller.abort()
      throw new DOMException('aborted', 'AbortError')
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(stageAsset({ body: new Blob(['x']), signal: controller.signal }))
      .rejects.toMatchObject({ reason: 'abort' })
  })

  it('410/404 → expired；非 2xx → http；解析失败 → parse；中止 → abort；网络 → network', async () => {
    vi.stubGlobal('fetch', jsonFetch({}, 410))
    await expect(stageAsset({ body: new Blob(['x']) })).rejects.toMatchObject({ reason: 'expired', status: 410 })

    vi.stubGlobal('fetch', jsonFetch({}, 500))
    await expect(stageAsset({ body: new Blob(['x']) })).rejects.toMatchObject({ reason: 'http', status: 500 })

    vi.stubGlobal('fetch', async () => new Response('not-json', { status: 201 }))
    await expect(stageAsset({ body: new Blob(['x']) })).rejects.toMatchObject({ reason: 'parse' })

    vi.stubGlobal('fetch', async () => { throw new DOMException('aborted', 'AbortError') })
    await expect(stageAsset({ body: new Blob(['x']) })).rejects.toMatchObject({ reason: 'abort' })

    vi.stubGlobal('fetch', async () => { throw new Error('down') })
    await expect(stageAsset({ body: new Blob(['x']) })).rejects.toMatchObject({ reason: 'network' })
  })
})

describe('cancelStagedAsset DELETE /api/pm/v1/stages/:stageId', () => {
  it('200：解析 {ok,removed}；失败/异常返回 {ok:false} 不抛', async () => {
    const fetchMock = vi.fn(jsonFetch({ ok: true, removed: true }, 200))
    vi.stubGlobal('fetch', fetchMock)
    const out = await cancelStagedAsset('a'.repeat(32))
    expect(out).toEqual({ ok: true, removed: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`/api/pm/v1/stages/${'a'.repeat(32)}`)
    expect(init.method).toBe('DELETE')
    expect(init.credentials).toBe('same-origin')

    vi.stubGlobal('fetch', async () => new Response('', { status: 500 }))
    expect(await cancelStagedAsset('x')).toEqual({ ok: false, removed: false })

    vi.stubGlobal('fetch', async () => { throw new Error('net') })
    expect(await cancelStagedAsset('x')).toEqual({ ok: false, removed: false })
  })
})
