/**
 * B2 任务资料 attachments[] / 进展日志 progressLog[] 的前端只读镜像。
 *
 * 边界：纯只读派生，口径与 core/task-materials.ts 的纯函数对齐，但不 import core（client bundle 独立）；
 * 不做任何写动作、不连服务、不造 mock。写（draft/commit/逐条 material|progress）仍走 data 原子命令，
 * 本模块只负责渲染前的归一化、软删过滤、去重与安全回显。
 */
import { safeHref } from './markdown.js'

export interface MirrorRevision {
  id: string
  date: string
  author: string
  content: string
  refs?: string[]
  revisedAt?: string
}

export interface MirrorProgressEntry {
  id: string
  date: string
  author: string
  createdAt: string
  revisions: MirrorRevision[]
  refs?: string[]
  deletedAt?: string
}

export interface MirrorAttachment {
  id?: string
  kind: 'link' | 'deliverable' | 'file'
  url?: string
  deliverableId?: string
  title?: string
  note?: string
  frozenVersion?: string
  frozenName?: string
  addedAt?: string
  /** B3 文件（upload 路由就绪前只读展示元数据；attachmentOps 不含 addFile，路由原子挂载）。 */
  fileId?: string
  /** 核心 file 附件软引用 file_assets 的 fa-N（下载 URL 用）；归一后镜像到 fileId。 */
  assetId?: string
  fileName?: string
  size?: number
  hash?: string
}

/** 字节数人类可读（只读展示，不做单位换算以外的处理）。 */
export function formatBytes(bytes: number | undefined): string {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return ''
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB']
  let v = n / 1024
  let u = 0
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u += 1 }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[u]}`
}

/** 短哈希（只读展示前 8 位；完整 hash 不外露在 UI）。 */
export function shortHash(hash: string | undefined): string {
  const h = (hash ?? '').trim()
  return h.length > 8 ? h.slice(0, 8) : h
}

export interface MirrorTask {
  evidenceUrl?: string | null
  deliverableId?: string | null
  attachments?: MirrorAttachment[] | null
  progressLog?: MirrorProgressEntry[] | null
}

/** current = 最新一条修订版；旧版正文原样保留不覆盖。 */
export function currentRevision(entry: MirrorProgressEntry): MirrorRevision {
  return entry.revisions[entry.revisions.length - 1]
}

/** 主列表展示业务日期：优先当前修订版 date，缺省回落条目首版 date；修订时间只用于历史审计。 */
export function progressDisplayDate(entry: MirrorProgressEntry): string {
  return currentRevision(entry)?.date || entry.date
}

/** effective 最新时间：最新修订 revisedAt，缺省回落 createdAt。 */
export function effectiveAt(entry: MirrorProgressEntry): string {
  const last = currentRevision(entry)
  return last?.revisedAt || entry.createdAt
}

/** 只展示 !deletedAt，按首版 date 倒序，同日期按 id 兜底稳定。 */
export function visibleProgressLog(task: { progressLog?: MirrorProgressEntry[] | null | undefined }): MirrorProgressEntry[] {
  return (task.progressLog ?? [])
    .filter(e => !e.deletedAt)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

export interface CollectedMaterial extends MirrorAttachment {
  source: 'legacy' | 'attachments'
  /** deliverable 的引用 id（与 core collectMaterials 口径一致）。 */
  refId?: string
}

type MaterialBase = Partial<MirrorAttachment> & { source: CollectedMaterial['source'] }

/**
 * 合并旧单键 evidenceUrl/deliverableId 与新 attachments 数组；
 * link 按 url 去重、deliverable 按 deliverableId 去重，legacy 在前，不改原记录。
 */
export function collectTaskMaterials(task: MirrorTask): CollectedMaterial[] {
  const out: CollectedMaterial[] = []
  const seenLink = new Set<string>()
  const seenDeliverable = new Set<string>()
  const pushLink = (url: string | undefined, base: MaterialBase): void => {
    const u = (url ?? '').trim()
    if (!u || seenLink.has(u)) return
    seenLink.add(u)
    out.push({ ...base, kind: 'link', url: u })
  }
  const pushDeliverable = (refId: string | undefined, base: MaterialBase): void => {
    const id = (refId ?? '').trim()
    if (!id || seenDeliverable.has(id)) return
    seenDeliverable.add(id)
    out.push({ ...base, kind: 'deliverable', deliverableId: id, refId: id })
  }
  if (task.evidenceUrl?.trim()) pushLink(task.evidenceUrl, { source: 'legacy' })
  if (task.deliverableId) pushDeliverable(task.deliverableId, { source: 'legacy' })
  for (const item of task.attachments ?? []) {
    if (item.kind === 'link') pushLink(item.url, { ...item, source: 'attachments' })
    else if (item.kind === 'file') out.push({ ...item, fileId: item.fileId ?? item.assetId, source: 'attachments' })
    else pushDeliverable(item.deliverableId, { ...item, source: 'attachments' })
  }
  return out
}

/** 按 at-id 在当前 attachments 数组里定位（供 progressLog.refs 解析）。 */
export function findAttachmentById(task: MirrorTask, id: string): MirrorAttachment | undefined {
  return (task.attachments ?? []).find(a => a.id === id)
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url.trim()
  }
}

export interface AttachmentDisplay {
  label: string
  href: string | null
}

/**
 * 资料项安全回显：链接优先标题，否则取 host；非 http/https 给 href=null 纯文本降级；
 * 交付物用冻结快照名 + 版本，源记录缺失也不崩溃。
 */
export function attachmentDisplay(item: MirrorAttachment): AttachmentDisplay {
  if (item.kind === 'file') {
    const name = item.fileName?.trim() || `文件 ${item.fileId ?? ''}`.trim()
    return { label: name, href: null }
  }
  if (item.kind === 'deliverable') {
    const name = item.frozenName?.trim() || `交付物 ${item.deliverableId ?? ''}`.trim()
    const version = item.frozenVersion?.trim()
    return { label: version ? `${name}（${version}）` : name, href: null }
  }
  const href = safeHref(item.url ?? '')
  const title = item.title?.trim()
  if (title) return { label: title, href }
  return { label: hostOf(item.url ?? ''), href }
}
