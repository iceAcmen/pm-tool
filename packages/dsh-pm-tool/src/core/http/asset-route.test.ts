/**
 * B3 asset HTTP 路由单测：fake req/res + mock connection gate，不起活服务器。
 * 覆盖认证 fail-closed 401/403/503、405、upload 缺 task 400、Content-Length 超限 413、
 * download 缺参 400、资产未挂到本任务 403（禁止仅凭 assetId 全局取）、统一安全头。
 * 真实落盘/去重/下载字节由 verify-b3-asset 集成脚本覆盖。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, readdirSync, lstatSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildAssetRoutes, registerAssetRoute, ASSET_UPLOAD_PATH, ASSET_DOWNLOAD_PREFIX, STAGE_PREFIX } from './asset-route.js'
import type { PreviewAuthGate } from './preview-route.js'
import { pmDomainSpec, type PmDomain } from '../storage.js'
import { addProject } from '../projects.js'
import { addTask } from '../tasks.js'
import { readStage } from '../file-staging.js'
import { ASSET_MAX_BYTES } from './limits.js'

interface FakeRes {
  statusCode: number
  headers: Record<string, string>
  body: string
}

function makeRes(): FakeRes {
  return { statusCode: 200, headers: {}, body: '' }
}

function makeReq(method: string, url: string, headers: Record<string, string | string[]>, chunks: Buffer[] = []): IncomingMessage {
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

describe('A13 上传协议：真实 upload/JSON domain/隔离字节根，非 GUI/独立验收', () => {
  let root: string
  let files: string
  let domain: PmDomain
  let facility: DomainFacility
  let taskId: string
  let projectId: string
  let observations: unknown[]
  const originalName = 'QA 文件 原件.md'
  const original = readFileSync(`/private/tmp/pmtool-a11-native-files/${originalName}`)
  const originalSha = '87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a'
  const marker = 'x-pm-file-name-encoding'
  const nameHeader = 'x-pm-file-name'
  const encoded = (name: string) => ({ [marker]: 'uri-component', [nameHeader]: encodeURIComponent(name) })
  const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

  function manifest(dir: string): Record<string, string> {
    const result: Record<string, string> = {}
    function walk(path: string, prefix: string) {
      for (const entry of readdirSync(path).sort()) {
        const absolute = join(path, entry)
        const key = `${prefix}${entry}`
        const st = lstatSync(absolute)
        if (st.isDirectory()) {
          result[`${key}/`] = 'directory'
          walk(absolute, `${key}/`)
        } else if (st.isFile()) result[key] = hash(readFileSync(absolute))
      }
    }
    walk(dir, '')
    return result
  }
  function snapshot() {
    return { data: manifest(join(root, 'data')), files: manifest(files),
      tasks: [...domain.table('tasks').entries()], assets: [...domain.table('file_assets').entries()] }
  }
  async function upload(headers: Record<string, string | string[]>, bytes: Buffer = original, auth = openAuth, rawHeaders?: string[]) {
    let bodyReads = 0
    const req = makeReq('POST', ASSET_UPLOAD_PATH, headers, [bytes])
    req[Symbol.asyncIterator] = async function* () { bodyReads++; yield bytes }
    if (rawHeaders) req.rawHeaders = rawHeaders
    const res = makeRes()
    const before = snapshot()
    await buildAssetRoutes({ getDomain: () => domain, auth }).upload(req, resAdapter(res))
    const after = snapshot()
    const payload = JSON.parse(res.body)
    observations.push({ headers, rawHeaders, inputSize: bytes.length, inputSha256: hash(bytes),
      status: res.statusCode, response: payload, securityHeaders: res.headers, bodyReads, before, after })
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.body).not.toContain(files)
    return { res, payload, bodyReads, before, after }
  }
  beforeEach(async () => {
    expect(original.length).toBe(22)
    expect(hash(original)).toBe(originalSha)
    root = mkdtempSync(join(tmpdir(), 'a13-route-'))
    files = join(root, 'files')
    vi.stubEnv('DSH_PM_FILE_ROOT', files)
    const ctx = new Context()
    await ctx.plugin(Storage)
    ctx.storage.backend.register('json', new JsonStorageBackend(join(root, 'data')))
    facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
    domain = await facility.open(pmDomainSpec)
    projectId = (await addProject(domain, { name: 'A13合法隔离项目', startDate: '2026-01-01', targetDate: '2026-12-31' })).id
    taskId = (await addTask(domain, { projectId, title: 'A13合法任务' })).id
    // 首次创建空根不算上传写入；所有请求从这个明确初态开始。
    const { mkdirSync } = await import('node:fs')
    mkdirSync(files)
    observations = []
  })
  afterEach(async context => {
    writeFileSync(join(root, 'observations.json'), JSON.stringify({
      case: context.task.name, root, observations, final: snapshot(),
    }, null, 2))
    await facility.closeAll()
    vi.unstubAllEnvs()
  })

  it('A13-S01 原件真暂存201：Unicode/22/hash，DB零写、cancel幂等、无提前最终字节', async () => {
    const { payload, res, before, after } = await upload(encoded(originalName))
    expect(res.statusCode).toBe(201)
    expect(payload).toMatchObject({ fileName: originalName, size: 22, sha256: originalSha, mediaType: 'text/markdown' })
    expect(payload.stageId).toMatch(/^[a-f0-9]{32}$/)
    expect(payload.assetId).toBeUndefined()
    expect(after.data).toEqual(before.data)
    expect(after.tasks).toEqual(before.tasks)
    expect(after.assets).toEqual(before.assets)
    expect(Object.keys(after.files).sort()).toEqual([
      'staging/', `staging/${payload.stageId}.bin`, `staging/${payload.stageId}.json`,
    ].sort())
    expect((await readStage(payload.stageId)).bytes.equals(original)).toBe(true)
    const h = buildAssetRoutes({ getDomain: () => domain, auth: openAuth })
    for (const removed of [true, false]) {
      const cancel = makeRes()
      await h.cancelStage(makeReq('DELETE', `${STAGE_PREFIX}/${payload.stageId}`, {}), resAdapter(cancel), payload.stageId)
      expect(JSON.parse(cancel.body)).toEqual({ ok: true, removed })
    }
    expect(Object.keys(manifest(files))).toEqual(['staging/'])
  })

  it('A13-S02/S06 真直挂、同hash去重、真实授权下载原字节，拒错项目与未挂接任务', async () => {
    const { res, payload } = await upload({ ...encoded(originalName), 'x-pm-task-id': taskId, 'x-pm-project-id': projectId })
    expect(res.statusCode).toBe(200)
    expect(payload).toMatchObject({ fileName: originalName, size: 22, sha256: originalSha })
    const row = domain.table('file_assets').get(payload.assetId)!
    expect(row.projectId).toBe(projectId)
    expect(readFileSync(join(files, row.relPath)).equals(original)).toBe(true)
    const duplicate = await upload({ ...encoded('QA 文件 同字节.md'), 'x-pm-task-id': taskId })
    expect(duplicate.payload.assetId).toBe(payload.assetId)
    expect(duplicate.payload.alreadyAttached).toBe(true)
    expect(duplicate.after).toEqual(duplicate.before)
    const wrong = await upload({ ...encoded(originalName), 'x-pm-task-id': taskId, 'x-pm-project-id': 'p-9999' })
    expect(wrong.res.statusCode).toBe(403)
    expect(wrong.after).toEqual(wrong.before)
    const h = buildAssetRoutes({ getDomain: () => domain, auth: openAuth })
    const dl = makeRes()
    await h.download(makeReq('GET', '/', {}), resAdapter(dl), payload.assetId, taskId)
    expect(dl.statusCode).toBe(200)
    expect(hash(dl.body as unknown as Buffer)).toBe(originalSha)
    expect(dl.headers['content-disposition']).toBe(`attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`)
    expect(dl.headers['cache-control']).toBe('no-store')
    expect(dl.headers['x-content-type-options']).toBe('nosniff')
    const other = await addTask(domain, { projectId, title: '未挂接任务' })
    const forbidden = makeRes()
    await h.download(makeReq('GET', '/', {}), resAdapter(forbidden), payload.assetId, other.id)
    expect(forbidden.statusCode).toBe(403)
  })

  it.each([
    ['qa-note.md', 'qa-note.md'],
    ['QA file original.md', 'QA file original.md'],
    [encodeURIComponent('中文.md'), '中文.md'],
    ['plus+name.md', 'plus+name.md'],
    ['100%.md', '100%.md'],
    ['bad%2.md', 'bad%2.md'],
    ['bad%GG.md', 'bad%GG.md'],
  ])('A13-S03 legacy无标记 %s 保持旧结果 %s', async (wire, expected) => {
    const { res, payload } = await upload({ [nameHeader]: wire })
    expect(res.statusCode).toBe(201)
    expect(payload.fileName).toBe(expected)
  })

  const invalid: Array<[string, Record<string, string | string[]>]> = [
    ...['bad%.md', 'bad%2.md', 'bad%GG.md', '%E4%B8.md', '%FF.md', '%ED%A0%80.md'].map(wire =>
      [wire, { [marker]: 'uri-component', [nameHeader]: wire }] as [string, Record<string, string>]),
    ['unknown marker', { [marker]: 'base64', [nameHeader]: 'qa.md' }],
    ['empty marker', { [marker]: '', [nameHeader]: 'qa.md' }],
    ['whitespace marker', { [marker]: ' ', [nameHeader]: 'qa.md' }],
    ['missing name', { [marker]: 'uri-component' }],
    ['empty name', { [marker]: 'uri-component', [nameHeader]: '' }],
    ['whitespace name', { [marker]: 'uri-component', [nameHeader]: ' ' }],
    ['name array', { [marker]: 'uri-component', [nameHeader]: ['qa.md', 'qa.md'] }],
    ['marker array', { [marker]: ['uri-component'], [nameHeader]: 'qa.md' }],
    ['merged marker', { [marker]: 'uri-component, uri-component', [nameHeader]: 'qa.md' }],
    ['merged names', { [marker]: 'uri-component', [nameHeader]: 'qa.md, qb.md' }],
    ['raw unicode', { [marker]: 'uri-component', [nameHeader]: originalName }],
    ['raw control', { [marker]: 'uri-component', [nameHeader]: 'qa\r\n.md' }],
  ]
  it.each(invalid)('A13-S04/S05 %s：400、body未收集、DB/字节零写', async (_label, headers) => {
    for (const scope of [{}, { 'x-pm-task-id': taskId }]) {
      const result = await upload({ ...headers, ...scope })
      expect(result.res.statusCode).toBe(400)
      expect(result.payload.error.code).toBe('invalid_request')
      expect(result.bodyReads).toBe(0)
      expect(result.after).toEqual(result.before)
    }
  })

  it.each([nameHeader, marker])('A13-S05 rawHeaders 重复 %s 不接受合并后的单值', async key => {
    const headers = encoded('qa.md')
    const rawHeaders = [key, headers[key], key.toUpperCase(), headers[key]]
    const result = await upload(headers, original, openAuth, rawHeaders)
    expect(result.res.statusCode).toBe(400)
    expect(result.payload.error.code).toBe('invalid_request')
    expect(result.bodyReads).toBe(0)
    expect(result.after).toEqual(result.before)
  })

  it.each([
    ['literal%2Fname.md', 'literal%2Fname.md'],
    ['literal%5Cname.md', 'literal%5Cname.md'],
    ['literal%2E.md', 'literal%2E.md'],
    ['100% + #?.md', '100% + #?.md'],
    ['../../目录/原件.md', '原件.md'],
    ['C:\\目录\\原件.md', '原件.md'],
    ['原件\r\nX-Inject: 1.md', '原件X-Inject: 1.md'],
    ['\0原件.md', '原件.md'],
  ])('A13-S06/S07 %s 单decode后纯sanitize为 %s（stage和真实attach）', async (input, expected) => {
    const staged = await upload(encoded(input))
    expect(staged.res.statusCode).toBe(201)
    expect(staged.payload.fileName).toBe(expected)
    const attached = await upload({ ...encoded(input), 'x-pm-task-id': taskId })
    expect(attached.res.statusCode).toBe(200)
    expect(attached.payload.fileName).toBe(expected)
    expect(domain.table('file_assets').get(attached.payload.assetId)!.fileName).toBe(expected)
  })

  it.each(['../../evil.svg', 'evil.html', 'evil.exe', 'foo%2Esvg'])('A13-S08 %s 类型仍拒绝、零写', async name => {
    for (const scope of [{}, { 'x-pm-task-id': taskId }]) {
      const result = await upload({ ...encoded(name), ...scope })
      expect(result.res.statusCode).toBe(400)
      expect(result.payload.error.code).toBe('rejected')
      expect(result.after).toEqual(result.before)
    }
  })

  it('A13-G01 空/10MiB/10MiB+1，预检与流式原限制不变', async () => {
    const empty = await upload(encoded(originalName), Buffer.alloc(0))
    expect(empty.payload.error.code).toBe('empty_body')
    expect(empty.after).toEqual(empty.before)
    expect(ASSET_MAX_BYTES).toBe(10_485_760)
    const boundary = await upload(encoded(originalName), Buffer.alloc(ASSET_MAX_BYTES, 0x61))
    expect(boundary.res.statusCode).toBe(201)
    expect(boundary.payload.size).toBe(ASSET_MAX_BYTES)
    for (const declared of [{}, { 'content-length': String(ASSET_MAX_BYTES + 1) }]) {
      const result = await upload({ ...encoded(originalName), ...declared }, Buffer.alloc(ASSET_MAX_BYTES + 1, 0x61))
      expect(result.res.statusCode).toBe(413)
      expect(result.payload.error.code).toBe('body_too_large')
      expect(result.after).toEqual(result.before)
      expect(result.bodyReads).toBe('content-length' in declared ? 0 : 1)
    }
  })

  it.each([
    ['假.png', 'image/png', original],
    [originalName, 'image/png', original],
    [originalName, 'text/markdown', Buffer.from([0xff])],
    [originalName, 'text/markdown', Buffer.from('text\0')],
    [originalName, 'text/markdown', Buffer.from('<script>alert(1)</script>')],
  ])('A13-G02 %s/%s 原magic/MIME/文本安全拒绝，零写', async (name, type, bytes) => {
    for (const scope of [{}, { 'x-pm-task-id': taskId }]) {
      const result = await upload({ ...encoded(name), 'x-pm-media-type': type, ...scope }, bytes)
      expect(result.res.statusCode).toBe(400)
      expect(result.payload.error.code).toBe('rejected')
      expect(result.after).toEqual(result.before)
    }
  })

  it.each([
    [undefined, 401], [rejectAuth, 401], [forbidAuth, 403], [throwAuth, 503],
  ] as const)('A13-G04 gate %s 先于非法协议，不读body/不写', async (auth, status) => {
    let reads = 0
    const req = makeReq('POST', ASSET_UPLOAD_PATH, { [marker]: 'uri-component', [nameHeader]: 'bad%.md' })
    req[Symbol.asyncIterator] = async function* () { reads++; yield original }
    const res = makeRes()
    const before = snapshot()
    await buildAssetRoutes({ getDomain: () => domain, auth }).upload(req, resAdapter(res))
    expect(res.statusCode).toBe(status)
    expect(reads).toBe(0)
    expect(snapshot()).toEqual(before)
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    observations.push({ status, reads, before, after: snapshot() })
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
