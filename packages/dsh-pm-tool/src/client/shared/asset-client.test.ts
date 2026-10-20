import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  uploadAsset,
  buildAssetDownloadUrl,
  AssetUnavailable,
  ASSET_UPLOAD_ROUTE,
} from './asset-client.js'

afterEach(() => vi.unstubAllGlobals())

function jsonFetch(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  }))
}

const envelope = {
  assetId: 'fa-1',
  attachmentId: 'at-9',
  fileName: '设计稿.pdf',
  mediaType: 'application/pdf',
  size: 204800,
  sha256: 'abcdef1234567890',
  alreadyAttached: true,
}

describe('uploadAsset same-origin POST /api/pm/v1/assets/upload', () => {
  it('2xx：信封映射（assetId/attachmentId/fileName/mediaType/size/sha256/alreadyAttached）', async () => {
    vi.stubGlobal('fetch', jsonFetch(envelope))
    const out = await uploadAsset({ body: new Blob(['x'], { type: 'application/pdf' }), fileName: '设计稿.pdf' })
    expect(out).toEqual({
      assetId: 'fa-1', attachmentId: 'at-9', fileName: '设计稿.pdf', mediaType: 'application/pdf',
      size: 204800, sha256: 'abcdef1234567890', alreadyAttached: true,
    })
  })

  it('attachmentId 缺失回落 null；alreadyAttached 字符串 "true" 归一为布尔', async () => {
    vi.stubGlobal('fetch', jsonFetch({ ...envelope, attachmentId: '', alreadyAttached: 'true' }))
    const out = await uploadAsset({ body: new Blob(['x']) })
    expect(out.attachmentId).toBeNull()
    expect(out.alreadyAttached).toBe(true)
  })

  it('POST 原始 octet：body 原样直传，content-type 取 meta/body，文件名走 content-disposition，credentials same-origin/no-store', async () => {
    const fetchMock = vi.fn(jsonFetch(envelope))
    vi.stubGlobal('fetch', fetchMock)
    const body = new Blob(['bytes'], { type: 'image/png' })
    await uploadAsset({ body, fileName: 'a.png', mediaType: 'image/png' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(ASSET_UPLOAD_ROUTE)
    expect(init.method).toBe('POST')
    expect(init.body).toBe(body)
    expect(init.credentials).toBe('same-origin')
    expect(init.cache).toBe('no-store')
    expect(init.headers['content-type']).toBe('image/png')
    expect(String(init.headers['content-disposition'])).toContain('a.png')
  })

  it('非 2xx → AssetUnavailable(http, status)；解析失败 → parse；中止 → abort；网络 → network', async () => {
    vi.stubGlobal('fetch', jsonFetch({}, 500))
    await expect(uploadAsset({ body: new Blob(['x']) })).rejects.toMatchObject({ name: 'AssetUnavailable', reason: 'http', status: 500 })

    vi.stubGlobal('fetch', async () => new Response('not-json', { status: 200 }))
    await expect(uploadAsset({ body: new Blob(['x']) })).rejects.toMatchObject({ reason: 'parse' })

    vi.stubGlobal('fetch', async () => { throw new DOMException('aborted', 'AbortError') })
    await expect(uploadAsset({ body: new Blob(['x']) })).rejects.toMatchObject({ reason: 'abort' })

    vi.stubGlobal('fetch', async () => { throw new Error('network down') })
    await expect(uploadAsset({ body: new Blob(['x']) })).rejects.toMatchObject({ reason: 'network' })
  })
})

describe('buildAssetDownloadUrl', () => {
  it('带 taskId 拼 query；不带则仅路径', () => {
    expect(buildAssetDownloadUrl('fa-1', 't-7')).toBe('/api/pm/v1/assets/fa-1?taskId=t-7')
    expect(buildAssetDownloadUrl('fa-1')).toBe('/api/pm/v1/assets/fa-1')
  })

  it('fileId/taskId 特殊字符经 encodeURIComponent 编码', () => {
    const url = buildAssetDownloadUrl('fa-1 b', 't-7/a?b')
    expect(url).toBe('/api/pm/v1/assets/fa-1%20b?taskId=t-7%2Fa%3Fb')
  })
})
