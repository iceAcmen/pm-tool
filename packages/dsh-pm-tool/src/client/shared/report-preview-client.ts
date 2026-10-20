/**
 * B6 周期预览 same-origin JSON 客户端（策略 B：data 在插件 webServer 暴露精确路由，前端不解析 CLI 文本）。
 *
 * 路由契约（data 提供，未就绪前不接线、不调用）：
 *   POST `/api/pm/v1/report-preview`，content-type: application/json，credentials: same-origin，
 *   cache: no-store，no-sniff；auth 经 connection（requestRejection）；body 仅 projectId/periodStart/periodEnd，
 *   不传 selector = 周期内全部未删条目；返回 `{ candidates: ReportPreviewCandidate[] }`。
 *
 * 边界：
 * - 纯客户端 fetch，不 import core/domain，不直连存储；
 * - response 非 2xx / 网络 / 中止 → 抛 typed 错误，由调用方禁用预览入口并说明原因，其余 report CRUD 不受影响；
 * - candidates.content 一律按纯文本交 MarkdownView 安全渲染，绝不当 HTML；
 * - AbortController 信号透传，过期响应由调用方忽略（stale 丢弃，不回写）。
 */
import type { ReportPreviewCandidate } from './records-props.js'

/** 路由未就绪 / 非 2xx / 鉴权拒绝 / 网络失败 的统一类型，便于 UI 区分「禁用预览」与「写失败」。 */
export class ReportPreviewUnavailable extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly reason: 'network' | 'http' | 'parse' | 'abort' = 'http',
  ) {
    super(message)
    this.name = 'ReportPreviewUnavailable'
  }
}

export const REPORT_PREVIEW_ROUTE = '/api/pm/v1/report-preview'

export interface ReportPreviewFetchInput {
  projectId: string
  periodStart: string
  periodEnd: string
  signal?: AbortSignal
}

interface RawCandidate {
  taskId?: unknown
  entryId?: unknown
  revisionId?: unknown
  author?: unknown
  date?: unknown
  content?: unknown
  refs?: unknown
  taskTitle?: unknown
}

function asText(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function mapCandidate(raw: RawCandidate): ReportPreviewCandidate | null {
  const taskId = asText(raw.taskId)
  const entryId = asText(raw.entryId)
  if (!taskId || !entryId) return null
  const refs = Array.isArray(raw.refs)
    ? raw.refs
        .map(r => {
          const obj = (r ?? {}) as Record<string, unknown>
          const t = asText(obj.taskId), e = asText(obj.entryId)
          if (!t || !e) return null
          return { taskId: t, entryId: e, ...(asText(obj.revisionId) ? { revisionId: asText(obj.revisionId) } : {}) }
        })
        .filter((x): x is ReportPreviewCandidate['refs'][number] => x !== null)
    : []
  return {
    taskId,
    entryId,
    ...(asText(raw.revisionId) ? { revisionId: asText(raw.revisionId) } : {}),
    author: asText(raw.author),
    date: asText(raw.date),
    content: asText(raw.content),
    refs,
    ...(asText(raw.taskTitle) ? { taskTitle: asText(raw.taskTitle) } : {}),
  }
}

export async function fetchReportPreview(input: ReportPreviewFetchInput): Promise<ReportPreviewCandidate[]> {
  let res: Response
  try {
    res = await fetch(REPORT_PREVIEW_ROUTE, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectId: input.projectId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      }),
      signal: input.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ReportPreviewUnavailable('预览已取消', undefined, 'abort')
    }
    throw new ReportPreviewUnavailable(`预览请求失败：${error instanceof Error ? error.message : String(error)}`, undefined, 'network')
  }
  if (!res.ok) {
    throw new ReportPreviewUnavailable(`预览服务返回 ${res.status}`, res.status, 'http')
  }
  let body: { candidates?: RawCandidate[] }
  try {
    body = await res.json()
  } catch {
    throw new ReportPreviewUnavailable('预览响应不是合法 JSON', res.status, 'parse')
  }
  return (body.candidates ?? [])
    .map(mapCandidate)
    .filter((c): c is ReportPreviewCandidate => c !== null)
}
