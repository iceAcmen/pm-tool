/**
 * B3 资产 HTTP 路由：upload（raw octet-stream 流式限长）/ download（任务+项目绑定鉴权）。
 *
 * 认证复用宿主 connection.requestRejection(完整 req)，与 preview 同一 gate；缺失 fail-closed 401。
 * upload：header 传 task/project/文件名/类型，body 为原始字节；Content-Length 预检 + 流式累计 10MiB 上限，
 *   超限 413，aborted 不写盘；落盘/登记/挂接由 attachFileToTask 单一临界区完成。
 * download：必须携带 taskId 且该任务（同项目）确实挂有该 assetId，禁止仅凭 assetId 全局取；
 *   Content-Disposition attachment（RFC5987）、nosniff/no-store，不回内部 relPath。
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { ASSET_MAX_BYTES } from './limits.js'
import type { PreviewAuthGate } from './preview-route.js'
import { attachFileToTask, resolveFileRoot, readAssetBuffer } from '../file-asset-store.js'
import { stageUpload, deleteStage } from '../file-staging.js'
import type { PmDomain, FileAssetRecord } from '../storage.js'

export const ASSET_UPLOAD_PATH = '/api/pm/v1/assets/upload'
export const ASSET_DOWNLOAD_PREFIX = '/api/pm/v1/assets'
export const STAGE_PREFIX = '/api/pm/v1/stages'

function writeSecurity(res: ServerResponse): void {
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-content-type-options', 'nosniff')
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  writeSecurity(res)
  res.end(JSON.stringify(payload))
}

function sendError(res: ServerResponse, status: number, code: string, message: string): void {
  sendJson(res, status, { error: { code, message } })
}

function bearerAuth(auth: PreviewAuthGate | undefined, req: IncomingMessage, res: ServerResponse): boolean {
  if (!auth) {
    sendError(res, 401, 'unauthorized', '请求未通过宿主认证')
    return false
  }
  try {
    const rejection = auth.requestRejection(req)
    if (rejection === 403) {
      sendError(res, 403, 'forbidden', '禁止访问')
      return false
    }
    if (rejection === 401) {
      sendError(res, 401, 'unauthorized', '请求未通过宿主认证')
      return false
    }
  } catch {
    sendError(res, 503, 'auth_unavailable', '认证服务暂不可用')
    return false
  }
  return true
}

/** 取并清洗 header；拒绝含换行/控制字符的值。 */
function headerValue(req: IncomingMessage, name: string): string | undefined {
  const v = req.headers[name]
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  if (!trimmed) return undefined
  if (/[\r\n\x00-\x1f]/.test(trimmed)) return undefined
  return trimmed
}

function sanitizeFileName(raw: string | undefined): string {
  if (!raw) return 'upload.bin'
  // 只保留 basename，去掉路径分隔与控制字符；空则回落。
  let name = raw.split(/[\\/]/).pop() ?? raw
  name = name.replace(/[\r\n\x00-\x1f]/g, '').trim()
  return name || 'upload.bin'
}

/** 新协议严格单次解码；无标记保留旧 URI 容错。sanitize 本身不得再解码。 */
function uploadFileName(req: IncomingMessage): { ok: true; fileName: string } | { ok: false } {
  const markerKey = 'x-pm-file-name-encoding'
  const nameKey = 'x-pm-file-name'
  const marker = req.headers[markerKey]
  if (marker === undefined) {
    let legacy = headerValue(req, nameKey)
    if (legacy) {
      try { legacy = decodeURIComponent(legacy) } catch { /* 旧请求保留 malformed-percent 原名。 */ }
    }
    return { ok: true, fileName: sanitizeFileName(legacy) }
  }
  const raw = req.headers[nameKey]
  if (marker !== 'uri-component' || typeof raw !== 'string' || !raw.trim()
    || !/^[\x20-\x7e]+$/.test(raw) || raw.includes(',')) return { ok: false }
  // Node 可把重复自定义头合并；原始头仍可见时也拒绝重复，不误走 legacy。
  for (const key of [markerKey, nameKey]) {
    let count = 0
    for (let i = 0; i < (req.rawHeaders?.length ?? 0); i += 2) {
      if (req.rawHeaders[i].toLowerCase() === key) count++
    }
    if (count > 1) return { ok: false }
  }
  try {
    return { ok: true, fileName: sanitizeFileName(decodeURIComponent(raw)) }
  } catch {
    return { ok: false }
  }
}

/** 流式累计字节到有界 Buffer；超限/abort 立即终止。 */
function collectBounded(req: IncomingMessage, max: number): Promise<{ ok: true; bytes: Buffer } | { ok: false; reason: 'too_large' | 'aborted' | 'empty' }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    let size = 0
    let done = false
    const finish = (r: { ok: false; reason: 'too_large' | 'aborted' | 'empty' }) => {
      if (done) return
      done = true
      req.resume()
      resolve(r)
    }
    req.on('aborted', () => finish({ ok: false, reason: 'aborted' }))
    req.on('error', () => finish({ ok: false, reason: 'aborted' }))
    ;(async () => {
      for await (const raw of req as AsyncIterable<Buffer>) {
        const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw))
        size += chunk.byteLength
        if (size > max) {
          finish({ ok: false, reason: 'too_large' })
          return
        }
        chunks.push(chunk)
      }
      if (done) return
      const bytes = Buffer.concat(chunks, size)
      resolve(bytes.length === 0 ? { ok: false, reason: 'empty' } : { ok: true, bytes })
    })().catch(() => finish({ ok: false, reason: 'aborted' }))
  })
}

export interface AssetAttachResult {
  asset: { id: string; fileName: string; mediaType: string; size: number; sha256: string }
  attachment: { id: string }
  alreadyAttached: boolean
}

export interface AssetResolvedFile {
  fileName: string
  mediaType: string
  size: number
  bytes: Buffer
}

export interface AssetRouteDeps {
  getDomain: () => PmDomain | undefined
  auth?: PreviewAuthGate
  /** 测试缝：注入 attach；缺省走真实 attachFileToTask（内容寻址落盘+临界区挂接）。 */
  attachFile?: (taskId: string, input: { originalName: string; declaredMediaType?: string; bytes: Buffer; note?: string }) => Promise<AssetAttachResult>
  /** 测试缝：注入字节解析；缺省走 file_assets 元数据 + readAssetBuffer。 */
  resolveAsset?: (assetId: string, taskId: string) => Promise<AssetResolvedFile | undefined>
}

export function buildAssetRoutes({ getDomain, auth, attachFile, resolveAsset }: AssetRouteDeps) {
  // ---- POST /api/pm/v1/assets/upload ----
  async function upload(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('allow', 'POST')
      writeSecurity(res)
      res.end()
      return
    }
    if (!bearerAuth(auth, req, res)) return
    const taskId = headerValue(req, 'x-pm-task-id')
    if (taskId && !/^t-\d+$/.test(taskId)) {
      sendError(res, 400, 'invalid_request', 'x-pm-task-id 须为 t-N')
      return
    }
    const projectHeader = headerValue(req, 'x-pm-project-id')
    const parsedName = uploadFileName(req)
    if (!parsedName.ok) {
      sendError(res, 400, 'invalid_request', '文件名编码协议非法')
      return
    }
    const fileName = parsedName.fileName
    const mediaType = headerValue(req, 'x-pm-media-type')
    const declared = Number(req.headers['content-length'])
    if (Number.isSafeInteger(declared) && declared > ASSET_MAX_BYTES) {
      req.resume()
      sendError(res, 413, 'body_too_large', '文件超过 10MiB 上限')
      return
    }
    const collected = await collectBounded(req, ASSET_MAX_BYTES)
    if (!collected.ok) {
      if (collected.reason === 'too_large') sendError(res, 413, 'body_too_large', '文件超过 10MiB 上限')
      else if (collected.reason === 'empty') sendError(res, 400, 'empty_body', '文件内容为空')
      else sendError(res, 400, 'request_aborted', '上传中断，未写盘')
      return
    }

    // 无 taskId：新任务/未保存表单 → 暂存，返回 opaque stageId，不写 file_assets、不挂任务。
    if (!taskId) {
      try {
        const stage = await stageUpload({ originalName: fileName, declaredMediaType: mediaType, bytes: collected.bytes })
        sendJson(res, 201, {
          stageId: stage.stageId,
          fileName: stage.fileName,
          mediaType: stage.mediaType,
          size: stage.size,
          sha256: stage.sha256,
          expiresAt: stage.expiresAt,
        })
      } catch (error) {
        sendError(res, 400, 'rejected', error instanceof Error ? error.message : '文件被拒绝')
      }
      return
    }

    const domain = getDomain()
    if (!domain) {
      sendError(res, 503, 'storage_unavailable', '项目存储暂不可用')
      return
    }
    const taskRow = domain.table('tasks').get(taskId) as { projectId?: string } | undefined
    if (!taskRow) {
      sendError(res, 404, 'task_not_found', '未找到任务')
      return
    }
    if (projectHeader && taskRow.projectId !== projectHeader) {
      sendError(res, 403, 'forbidden', '任务与声明项目不一致')
      return
    }
    try {
      const result = attachFile
        ? await attachFile(taskId, { originalName: fileName, declaredMediaType: mediaType, bytes: collected.bytes })
        : await attachFileToTask(domain, taskId, {
            originalName: fileName,
            declaredMediaType: mediaType,
            bytes: collected.bytes,
          })
      sendJson(res, 200, {
        assetId: result.asset.id,
        attachmentId: result.attachment.id,
        fileName: result.asset.fileName,
        mediaType: result.asset.mediaType,
        size: result.asset.size,
        sha256: result.asset.sha256,
        alreadyAttached: result.alreadyAttached,
      })
    } catch (error) {
      sendError(res, 400, 'rejected', error instanceof Error ? error.message : '文件被拒绝')
    }
  }

  // ---- DELETE /api/pm/v1/stages/:stageId（cancel，清暂存字节，幂等）----
  async function cancelStage(req: IncomingMessage, res: ServerResponse, stageId: string): Promise<void> {
    if (req.method !== 'DELETE') {
      res.statusCode = 405
      res.setHeader('allow', 'DELETE')
      writeSecurity(res)
      res.end()
      return
    }
    if (!bearerAuth(auth, req, res)) return
    if (!/^[a-f0-9]{32}$/.test(stageId)) {
      sendError(res, 400, 'invalid_request', '非法 stageId')
      return
    }
    const removed = await deleteStage(stageId)
    sendJson(res, 200, { ok: true, removed })
  }

  // ---- GET /api/pm/v1/assets/:assetId?taskId=t-N ----
  async function download(req: IncomingMessage, res: ServerResponse, assetId: string, taskId: string | undefined): Promise<void> {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('allow', 'GET')
      writeSecurity(res)
      res.end()
      return
    }
    if (!bearerAuth(auth, req, res)) return
    if (!/^fa-\d+$/.test(assetId) || !taskId || !/^t-\d+$/.test(taskId)) {
      sendError(res, 400, 'invalid_request', '缺少合法的 assetId 与 taskId')
      return
    }
    const domain = getDomain()
    if (!domain) {
      sendError(res, 503, 'storage_unavailable', '项目存储暂不可用')
      return
    }
    const taskRow = domain.table('tasks').get(taskId) as { projectId?: string; attachments?: unknown[] } | undefined
    if (!taskRow) {
      sendError(res, 404, 'task_not_found', '未找到任务')
      return
    }
    const linked = (taskRow.attachments ?? []).some(a =>
      (a as { kind?: string; assetId?: string }).kind === 'file'
      && (a as { assetId?: string }).assetId === assetId)
    if (!linked) {
      // 不暴露资产是否存在：未挂到本任务一律 forbidden。
      sendError(res, 403, 'forbidden', '该资产未挂接到此任务')
      return
    }
    let file: AssetResolvedFile | undefined
    try {
      if (resolveAsset) {
        file = await resolveAsset(assetId, taskId)
      } else {
        const meta = domain.table('file_assets').get(assetId) as FileAssetRecord | undefined
        if (!meta || meta.projectId !== taskRow.projectId) {
          sendError(res, 404, 'asset_not_found', '未找到资产')
          return
        }
        const root = await resolveFileRoot()
        const bytes = await readAssetBuffer(root, meta.relPath)
        file = { fileName: meta.fileName, mediaType: meta.mediaType, size: meta.size, bytes }
      }
    } catch {
      sendError(res, 404, 'asset_not_found', '资产字节不可读')
      return
    }
    if (!file) {
      sendError(res, 404, 'asset_not_found', '未找到资产')
      return
    }
    res.statusCode = 200
    res.setHeader('content-type', file.mediaType || 'application/octet-stream')
    res.setHeader('content-length', String(file.bytes.byteLength))
    res.setHeader('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`)
    writeSecurity(res)
    res.end(file.bytes)
  }

  // 统一 dispatcher：宿主只挂一个 handler，内部按 pathname/query 分发 upload/download。
  async function dispatch(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let pathname = '/'
    let query = new URLSearchParams()
    try {
      const u = new URL(req.url ?? '/', 'http://localhost')
      pathname = u.pathname
      query = u.searchParams
    } catch {
      sendError(res, 400, 'invalid_request', '请求地址非法')
      return
    }
    routeAssetRequest({ upload, download, cancelStage }, req, res, pathname, query)
  }

  return { upload, download, cancelStage, dispatch }
}

/** 注册宿主可见的 WebServer（exact 优先于 prefix，上传走 exact、下载走 prefix）。 */
export interface AssetWebServer {
  register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: unknown, res: unknown) => Promise<void> }): () => void
}

/** 纯注册：webServer/connection 齐备且两条路由均成功返回 disposer 才 ok=true；缺失/抛错 ok=false。 */
export function registerAssetRoute(
  webServer: AssetWebServer | undefined,
  connection: PreviewAuthGate | undefined,
  getDomain: () => PmDomain | undefined,
): { ok: boolean; uploadOk: boolean; downloadOk: boolean; stageOk: boolean; dispose?: () => void } {
  if (!webServer || !connection) return { ok: false, uploadOk: false, downloadOk: false, stageOk: false }
  const handlers = buildAssetRoutes({ getDomain, auth: connection })
  const disposers: Array<() => void> = []
  let uploadOk = false
  let downloadOk = false
  let stageOk = false
  try {
    const disposeUpload = webServer.register({
      kind: 'exact',
      path: ASSET_UPLOAD_PATH,
      handler: handlers.dispatch as (req: unknown, res: unknown) => Promise<void>,
    })
    if (typeof disposeUpload === 'function') {
      disposers.push(disposeUpload)
      uploadOk = true
    }
  } catch {
    console.warn('[pm-tool] asset upload 路由注册跳过（宿主 webServer 冲突或不可用）')
  }
  try {
    const disposeDownload = webServer.register({
      kind: 'prefix',
      path: ASSET_DOWNLOAD_PREFIX,
      handler: handlers.dispatch as (req: unknown, res: unknown) => Promise<void>,
    })
    if (typeof disposeDownload === 'function') {
      disposers.push(disposeDownload)
      downloadOk = true
    }
  } catch {
    console.warn('[pm-tool] asset download 路由注册跳过（宿主 webServer 冲突或不可用）')
  }
  try {
    const disposeStage = webServer.register({
      kind: 'prefix',
      path: STAGE_PREFIX,
      handler: handlers.dispatch as (req: unknown, res: unknown) => Promise<void>,
    })
    if (typeof disposeStage === 'function') {
      disposers.push(disposeStage)
      stageOk = true
    }
  } catch {
    console.warn('[pm-tool] stage cancel 路由注册跳过（宿主 webServer 冲突或不可用）')
  }
  const ok = uploadOk && downloadOk && stageOk
  return {
    ok,
    uploadOk,
    downloadOk,
    stageOk,
    dispose: disposers.length ? () => disposers.forEach(d => d()) : undefined,
  }
}

/** 路由分发：upload 精确匹配；download 匹配 /assets/<fa-N>；cancel 匹配 /stages/<stageId>。返回是否命中。 */
export function routeAssetRequest(
  handlers: {
    upload: (req: IncomingMessage, res: ServerResponse) => Promise<void>
    download: (req: IncomingMessage, res: ServerResponse, assetId: string, taskId?: string) => Promise<void>
    cancelStage: (req: IncomingMessage, res: ServerResponse, stageId: string) => Promise<void>
  },
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  query: URLSearchParams,
): boolean {
  if (pathname === ASSET_UPLOAD_PATH) {
    void handlers.upload(req, res)
    return true
  }
  const dl = /^\/api\/pm\/v1\/assets\/(fa-\d+)$/.exec(pathname)
  if (dl) {
    void handlers.download(req, res, dl[1], query.get('taskId') ?? undefined)
    return true
  }
  const st = /^\/api\/pm\/v1\/stages\/([a-f0-9]{32})$/.exec(pathname)
  if (st) {
    void handlers.cancelStage(req, res, st[1])
    return true
  }
  return false
}
