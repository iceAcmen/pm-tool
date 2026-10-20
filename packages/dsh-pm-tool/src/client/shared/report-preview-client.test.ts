import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  fetchReportPreview,
  ReportPreviewUnavailable,
  REPORT_PREVIEW_ROUTE,
} from './report-preview-client.js'

afterEach(() => vi.unstubAllGlobals())

function jsonFetch(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  }))
}

const input = { projectId: 'p-1', periodStart: '2026-10-01', periodEnd: '2026-10-20' }

describe('fetchReportPreview same-origin POST /api/pm/v1/report-preview', () => {
  it('2xx：candidates 三元组映射（taskId/entryId/revisionId/author/date/content/refs），丢弃缺 taskId/entryId 项', async () => {
    vi.stubGlobal('fetch', jsonFetch({
      candidates: [
        { taskId: 't-1', entryId: 'pl-1', revisionId: 'rv-1', author: 'A', date: '2026-10-05', content: 'c', refs: [{ taskId: 't-1', entryId: 'pl-1', revisionId: 'rv-1' }] },
        { entryId: 'pl-2', content: '缺 taskId 丢弃' },
        { taskId: 't-2', content: '缺 entryId 丢弃' },
      ],
    }))
    const out = await fetchReportPreview(input)
    expect(out).toHaveLength(1)
    expect(out[0]).toEqual({
      taskId: 't-1', entryId: 'pl-1', revisionId: 'rv-1', author: 'A', date: '2026-10-05',
      content: 'c', refs: [{ taskId: 't-1', entryId: 'pl-1', revisionId: 'rv-1' }],
    })
  })

  it('请求体仅 projectId/periodStart/periodEnd；credentials same-origin、no-store、content-type JSON', async () => {
    const fetchMock = vi.fn(jsonFetch({ candidates: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await fetchReportPreview(input)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(REPORT_PREVIEW_ROUTE)
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('same-origin')
    expect(init.cache).toBe('no-store')
    expect(init.headers['content-type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual(input)
    // 不携带 selectedRefs（selector=all，候选由后端周期内聚合）
    expect(JSON.parse(init.body).selectedRefs).toBeUndefined()
  })

  it('非 2xx → ReportPreviewUnavailable 带 status（路由未就绪/鉴权拒绝，禁用预览入口而非写失败）', async () => {
    vi.stubGlobal('fetch', jsonFetch({ error: 'nope' }, 404))
    await expect(fetchReportPreview(input)).rejects.toMatchObject({ name: 'ReportPreviewUnavailable', status: 404 })
  })

  it('网络异常 → network 类型；AbortError → abort 类型（stale 由调用方忽略）', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    await expect(fetchReportPreview(input)).rejects.toMatchObject({ reason: 'network' })

    const abort = new DOMException('abort', 'AbortError')
    vi.stubGlobal('fetch', vi.fn(async () => { throw abort }))
    await expect(fetchReportPreview(input)).rejects.toMatchObject({ reason: 'abort' })
  })

  it('响应非合法 JSON → parse 类型错误', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not-json', { status: 200 })))
    await expect(fetchReportPreview(input)).rejects.toMatchObject({ reason: 'parse' })
  })

  it('candidates 缺省/空数组安全返回 []', async () => {
    vi.stubGlobal('fetch', jsonFetch({}))
    expect(await fetchReportPreview(input)).toEqual([])
  })
})

describe('ReportPreviewUnavailable 类型', () => {
  it('携带 status 与 reason', () => {
    const e = new ReportPreviewUnavailable('x', 500, 'http')
    expect(e).toBeInstanceOf(Error)
    expect(e.status).toBe(500)
    expect(e.reason).toBe('http')
  })
})
