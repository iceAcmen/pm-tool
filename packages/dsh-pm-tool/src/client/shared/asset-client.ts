/**
 * B3 资产上传/下载 same-origin 客户端（data 提供精确路由；未就绪前不接线、不在主表单调用）。
 *
 * 路由契约（data）：
 *   - 上传：POST 原始 octet `/api/pm/v1/assets/upload`（headers 携带文件名/类型参数），
 *     返回 `{ assetId, attachmentId, fileName, mediaType, size, sha256, alreadyAttached }`。
 *     注意：当前路由在上传时即落盘并挂载 attachment（alreadyAttached 表示是否已存在），
 *     该行为只适合「已保存后 quick manage」，**不得在新建/编辑主草稿提交前调用**（否则 cancel 非零写）；
 *     主表单需等 data 的 staged 临时资产 + finalize 绑定 ops 合同。
 *   - 下载：GET `/api/pm/v1/assets/fa-N?taskId=t-N`（同站，鉴权经 connection）。
 *
 * 边界：纯 fetch，不 import core/domain，不直连存储；响应非 2xx/网络/中止/解析 → 抛 typed 错误；
 * capability 标志由调用方按 snapshot 独立门控；本模块不做大小/类型强制（domain 校验）。
 */

export const ASSET_UPLOAD_ROUTE = '/api/pm/v1/assets/upload'
export const ASSET_DOWNLOAD_ROUTE = '/api/pm/v1/assets'

export class AssetUnavailable extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly reason: 'network' | 'http' | 'parse' | 'abort' = 'http',
  ) {
    super(message)
    this.name = 'AssetUnavailable'
  }
}

/** 上传响应信封（字段以 data 返回为准，缺失宽松回落）。 */
export interface AssetUploadResult {
  assetId: string
  attachmentId: string | null
  fileName: string
  mediaType: string
  size: number
  sha256: string
  alreadyAttached: boolean
}

export interface AssetUploadInput {
  /** 原始字节（File/Blob），body 原样直传。 */
  body: Blob
  /** 显式文件名（缺省取 file.name）。 */
  fileName?: string
  /** 显式 mediaType（缺省取 body.type，再回落 octet-stream）。 */
  mediaType?: string
  signal?: AbortSignal
}

function asText(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function asBool(v: unknown): boolean {
  return v === true || v === 'true'
}

function asSize(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function mapResult(raw: Record<string, unknown>): AssetUploadResult {
  return {
    assetId: asText(raw.assetId),
    attachmentId: asText(raw.attachmentId) || null,
    fileName: asText(raw.fileName),
    mediaType: asText(raw.mediaType),
    size: asSize(raw.size),
    sha256: asText(raw.sha256),
    alreadyAttached: asBool(raw.alreadyAttached),
  }
}

/** POST 原始 octet 上传；返回映射后的信封。失败抛 AssetUnavailable。 */
export async function uploadAsset(input: AssetUploadInput): Promise<AssetUploadResult> {
  const mediaType = input.mediaType || input.body.type || 'application/octet-stream'
  const fileName = input.fileName || ''
  let res: Response
  try {
    res = await fetch(ASSET_UPLOAD_ROUTE, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'content-type': mediaType,
        // headers 参数：文件名经 Content-Disposition 携带，避免多字节/空格在 URL 编码出错。
        ...(fileName ? { 'content-disposition': `attachment; filename="${fileName.replace(/"/g, '')}"` } : {}),
      },
      body: input.body,
      signal: input.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AssetUnavailable('上传已取消', undefined, 'abort')
    }
    throw new AssetUnavailable(`上传请求失败：${error instanceof Error ? error.message : String(error)}`, undefined, 'network')
  }
  if (!res.ok) {
    throw new AssetUnavailable(`上传服务返回 ${res.status}`, res.status, 'http')
  }
  let raw: Record<string, unknown>
  try {
    raw = await res.json()
  } catch {
    throw new AssetUnavailable('上传响应不是合法 JSON', res.status, 'parse')
  }
  return mapResult(raw)
}

/**
 * 组装同站下载 URL（GET `/api/pm/v1/assets/fa-N?taskId=t-N`）。
 * 调用方把结果放进 `<a href>` 并设 download 属性；本函数不触发下载、不取字节。
 */
export function buildAssetDownloadUrl(fileId: string, taskId?: string): string {
  const base = `${ASSET_DOWNLOAD_ROUTE}/${encodeURIComponent(fileId)}`
  return taskId ? `${base}?taskId=${encodeURIComponent(taskId)}` : base
}
