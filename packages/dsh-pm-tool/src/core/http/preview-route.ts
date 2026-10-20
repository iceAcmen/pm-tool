/**
 * B6 结构化只读 preview HTTP 路由（P0）。
 *
 * 认证：复用宿主 connection.requestRejection（login-token cookie + Host/Origin 围栏），按真实签名
 * 传完整 IncomingMessage，不自造 header、不泄 token；gate 缺失 fail-closed 401，gate 抛错 503 generic。
 * webServer/connection 任一缺失则 capabilities.httpAvailable=false，CLI-only 降级。
 *
 * 安全：POST-only（避免 query 携带进展正文进日志）；Content-Type 必须 application/json；strict schema
 * 拒未知键；body 先按 Content-Length 预检、再流式限长 64KiB（超限 413，非法/空 JSON 400）；
 * 所有响应统一 nosniff/no-store；错误统一 JSON，不回绝对路径/stack。只读：不落盘、不写库。
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { z } from 'zod'
import { selectedRefSchema } from '../progress-report.js'
import { previewProgressReport, ProgressReportProjectNotFoundError } from '../progress-reports.js'
import type { PmDomain } from '../storage.js'
import { PREVIEW_MAX_BODY_BYTES } from './limits.js'

export const PREVIEW_API_PATH = '/api/pm/v1/report-preview'

/** 宿主认证 gate：按真实签名收完整请求，返回 401/403 拒因，undefined 放行。 */
export interface PreviewAuthGate {
  requestRejection(req: IncomingMessage): 401 | 403 | undefined
}

const wirePreviewSchema = z.strictObject({
  projectId: z.string().regex(/^p-\d+$/, '项目 ID 格式应为 p-数字'),
  periodStart: z.iso.date({ error: '开始日期须为 YYYY-MM-DD' }),
  periodEnd: z.iso.date({ error: '结束日期须为 YYYY-MM-DD' }),
  selectedRefs: z.array(selectedRefSchema).max(50, '一次预览最多选择 50 条').optional(),
})

/** 所有响应统一安全头。 */
function writeSecurityHeaders(res: ServerResponse): void {
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-content-type-options', 'nosniff')
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  writeSecurityHeaders(res)
  res.end(JSON.stringify(payload))
}

function sendError(res: ServerResponse, status: number, code: string, message: string): void {
  sendJson(res, status, { error: { code, message } })
}

type BodyRead =
  | { ok: true; body: unknown }
  | { ok: false; reason: 'too_large' | 'invalid' }

/**
 * 先按 Content-Length 预检，再流式限长；区分超限(too_large)与非法/空 JSON(invalid)。
 * 不把两者混为一谈：超限 413，非法 400。
 */
async function readBoundedJson(req: IncomingMessage): Promise<BodyRead> {
  const declared = Number(req.headers['content-length'])
  if (Number.isSafeInteger(declared) && declared > PREVIEW_MAX_BODY_BYTES) {
    req.resume()
    return { ok: false, reason: 'too_large' }
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const raw of req as AsyncIterable<Buffer>) {
    const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw))
    size += chunk.byteLength
    if (size > PREVIEW_MAX_BODY_BYTES) {
      req.resume()
      return { ok: false, reason: 'too_large' }
    }
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks, size).toString('utf8').trim()
  if (!text) return { ok: false, reason: 'invalid' }
  try {
    return { ok: true, body: JSON.parse(text) }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}

export interface PreviewRouteDeps {
  /** 延迟取域：注册不依赖 domain 就绪，请求时未就绪返回 503。 */
  getDomain: () => PmDomain | undefined
  auth?: PreviewAuthGate
}

/** 宿主 webServer 最小结构（exact 注册，返回 disposer）。 */
export interface PreviewWebServer {
  register(route: { kind: 'exact'; path: string; handler: (req: unknown, res: unknown) => Promise<void> }): () => void
}

/**
 * 纯注册：webServer 与 connection 齐备、register 成功返回 disposer 才 ok=true；
 * 缺失/冲突/抛错一律 ok=false（泛化日志，不泄内部），snapshot 以该结果为准，不凭「服务存在」虚报。
 */
export function registerPreviewRoute(
  webServer: PreviewWebServer | undefined,
  connection: PreviewAuthGate | undefined,
  getDomain: () => PmDomain | undefined,
): { ok: boolean; dispose?: () => void } {
  if (!webServer || !connection) return { ok: false }
  try {
    const dispose = webServer.register({
      kind: 'exact',
      path: PREVIEW_API_PATH,
      handler: buildPreviewRouteHandler({ getDomain, auth: connection }) as
        (req: unknown, res: unknown) => Promise<void>,
    })
    return { ok: typeof dispose === 'function', dispose }
  } catch {
    console.warn('[pm-tool] preview API 路由注册跳过（宿主 webServer 冲突或不可用）')
    return { ok: false }
  }
}

/** 构造 WebRoute handler（不含注册动作，便于 fake req/res 单测）。 */
export function buildPreviewRouteHandler({ getDomain, auth }: PreviewRouteDeps) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    // 认证 gate：缺失 fail-closed 401；403 forbidden；gate 服务异常 503，不裸露内部。
    if (!auth) {
      sendError(res, 401, 'unauthorized', '请求未通过宿主认证')
      return
    }
    try {
      const rejection = auth.requestRejection(req)
      if (rejection === 403) {
        sendError(res, 403, 'forbidden', '禁止访问')
        return
      }
      if (rejection === 401) {
        sendError(res, 401, 'unauthorized', '请求未通过宿主认证')
        return
      }
    } catch {
      sendError(res, 503, 'auth_unavailable', '认证服务暂不可用')
      return
    }

    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('allow', 'POST')
      writeSecurityHeaders(res)
      res.end()
      return
    }
    const contentType = String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
    if (contentType !== 'application/json') {
      sendError(res, 415, 'unsupported_media_type', '仅接受 application/json')
      return
    }

    const read = await readBoundedJson(req)
    if (!read.ok && read.reason === 'too_large') {
      sendError(res, 413, 'body_too_large', '请求体超出大小上限')
      return
    }
    if (!read.ok) {
      sendError(res, 400, 'invalid_json', '请求体为空或不是合法 JSON')
      return
    }
    const parsed = wirePreviewSchema.safeParse(read.body)
    if (!parsed.success) {
      sendError(res, 400, 'invalid_preview_request', '预览请求字段不合法（可能含未知键）')
      return
    }

    const domain = getDomain()
    if (!domain) {
      sendError(res, 503, 'storage_unavailable', '项目存储暂不可用')
      return
    }

    try {
      const result = previewProgressReport(domain, parsed.data)
      sendJson(res, 200, result)
    } catch (error) {
      if (error instanceof ProgressReportProjectNotFoundError) {
        sendError(res, 404, 'project_not_found', '未找到项目')
        return
      }
      // 周期倒挂等可预期输入错误给具体码；其余（stale/软删/跨项目）走稳定 generic，不泄内部。
      sendError(res, 400, 'invalid_preview_period', '预览周期或选择不合法')
    }
  }
}
