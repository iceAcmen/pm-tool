/**
 * B3 暂存（staged）上传/取消 same-origin 客户端（与 direct uploadAsset 分离，不复用）。
 *
 * 路由契约（data）：
 *   - 暂存：POST `/api/pm/v1/assets/upload`，**不带 x-pm-task-id**，原始 octet body，
 *     整个文件名经 encodeURIComponent + `x-pm-file-name-encoding: uri-component` 携带，
 *     类型经 `x-pm-media-type` 头携带；201 返回
 *     `{ stageId, fileName, mediaType, size, sha256, expiresAt }`，不落 file_assets、不挂任务。
 *   - 取消：DELETE `/api/pm/v1/stages/:stageId` → `{ ok, removed }`（幂等，best-effort）。
 *
 * 用途边界：仅用于新建/编辑主草稿的文件暂存；提交成功由后端 prepareStage/finalizeStage 提升，
 * 前端**不得**在成功后 DELETE；提交失败保留 stage 供重试；关闭/取消 best-effort 回收，失败由 TTL sweep 兜底。
 * 纯 fetch，不 import core/domain，不直连存储；非 2xx/网络/中止/解析 → 抛 typed 错误。
 */

export const STAGE_UPLOAD_ROUTE = '/api/pm/v1/assets/upload'
export const STAGE_CANCEL_PREFIX = '/api/pm/v1/stages/'

export class StageUnavailable extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly reason: 'network' | 'http' | 'parse' | 'abort' | 'expired' = 'http',
  ) {
    super(message)
    this.name = 'StageUnavailable'
  }
}

/** 201 暂存响应信封。 */
export interface StageUploadResult {
  stageId: string
  fileName: string
  mediaType: string
  size: number
  sha256: string
  /** ISO 过期时间（sweep 前有效），供 UI 提示重传。 */
  expiresAt: string
}

export interface StageUploadInput {
  body: Blob
  fileName?: string
  mediaType?: string
  signal?: AbortSignal
}

function asText(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function asSize(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function mapStage(raw: Record<string, unknown>): StageUploadResult {
  return {
    stageId: asText(raw.stageId),
    fileName: asText(raw.fileName),
    mediaType: asText(raw.mediaType),
    size: asSize(raw.size),
    sha256: asText(raw.sha256),
    expiresAt: asText(raw.expiresAt),
  }
}

/** POST 暂存（无 taskId）；返回 201 信封。413/400 等非 2xx 抛 StageUnavailable(http)。 */
export async function stageAsset(input: StageUploadInput): Promise<StageUploadResult> {
  const mediaType = input.mediaType || input.body.type || 'application/octet-stream'
  const fileName = input.fileName || ''
  let res: Response
  try {
    res = await fetch(STAGE_UPLOAD_ROUTE, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'content-type': mediaType,
        'x-pm-file-name': encodeURIComponent(fileName),
        ...(fileName ? { 'x-pm-file-name-encoding': 'uri-component' } : {}),
        'x-pm-media-type': mediaType,
      },
      body: input.body,
      signal: input.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new StageUnavailable('暂存上传已取消', undefined, 'abort')
    }
    throw new StageUnavailable(`暂存上传失败：${error instanceof Error ? error.message : String(error)}`, undefined, 'network')
  }
  if (res.status === 410 || res.status === 404) {
    throw new StageUnavailable('暂存已过期，请重新上传', res.status, 'expired')
  }
  if (!res.ok) {
    throw new StageUnavailable(`暂存服务返回 ${res.status}`, res.status, 'http')
  }
  let raw: Record<string, unknown>
  try {
    raw = await res.json()
  } catch {
    throw new StageUnavailable('暂存响应不是合法 JSON', res.status, 'parse')
  }
  return mapStage(raw)
}

/** DELETE 取消暂存（幂等，best-effort；失败不抛给关闭流程，由调用方忽略）。 */
export async function cancelStagedAsset(stageId: string, signal?: AbortSignal): Promise<{ ok: boolean, removed: boolean }> {
  try {
    const res = await fetch(`${STAGE_CANCEL_PREFIX}${encodeURIComponent(stageId)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
    })
    if (!res.ok) return { ok: false, removed: false }
    const raw = await res.json().catch(() => ({} as Record<string, unknown>))
    return { ok: raw.ok === true, removed: raw.removed === true }
  } catch {
    return { ok: false, removed: false }
  }
}
