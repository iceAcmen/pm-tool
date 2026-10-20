/**
 * B2 任务资料区 attachments[] 与进展日志 progressLog[] 的领域写动作 + 纯派生辅助（U1=方案 A）。
 *
 * 边界：
 *  - 挂在 task 记录的可选数组上，复用 enqueueDomainWrite 串行临界区与 tasks 表备份；不建独立表。
 *  - link 复用 evidence.ts 的离线形状校验（http/https、≤2048、不联网）；deliverable 只存软引用 id +
 *    关联时刻冻结的 version/name 快照，写时复核存在性与同项目。
 *  - P3 进展日志：编辑=append 一条新 revision，旧正文不可覆盖；deletedAt 软删，restore 清除且 revision 全保留。
 *  - 不联网、不启动服务；nowIso/date 可注入便于离线单测。
 */
import { enqueueDomainWrite } from './projects.js'
import { normalizeEvidenceUrl, EvidenceUrlInvalidError } from './evidence.js'
import {
  taskWriteSchema,
  type AttachmentItem,
  type ProgressEntry,
  type ProgressRevision,
} from './task.js'
import type { PmDomain } from './storage.js'
import { localTodayIso } from './derived.js'

export class MaterialNotFoundError extends Error {}
export class ProgressEntryNotFoundError extends Error {}
export class MaterialDuplicateError extends Error {}
export class ProgressAuthorEmptyError extends Error {}
export class ProgressContentEmptyError extends Error {}

// ===== 纯派生辅助（只读，供 check/reflect/export/archive 与前端镜像共用口径）=====

/** current = 最新一条未删条目内的最后修订版。 */
export function currentRevision(entry: ProgressEntry): ProgressRevision {
  return entry.revisions[entry.revisions.length - 1]
}

/** effective 最新时间：最新修订版 revisedAt，缺省回落首版 createdAt。 */
export function effectiveAt(entry: ProgressEntry): string {
  const last = currentRevision(entry)
  return last?.revisedAt ?? entry.createdAt
}

/** 未软删的条目，按首版 date 倒序（同日期按 id 兜底稳定）。 */
export function visibleProgressLog(task: { progressLog?: ProgressEntry[] | undefined }): ProgressEntry[] {
  return (task.progressLog ?? [])
    .filter(e => !e.deletedAt)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

/**
 * 完成材料判定（check 规则 d / reflect gap 双读口径）：
 * 旧单键 evidenceUrl/deliverableId、新数组 link/deliverable 资料项、非空清单，任一即视为已登记材料。
 * progressLog 是叙事进展，不计入「完成材料」。
 */
export function taskHasMaterials(task: {
  evidenceUrl?: string | null
  deliverableId?: string | null
  attachments?: unknown[] | null
  checklist?: unknown[] | null
}): boolean {
  if (task.evidenceUrl?.trim()) return true
  if (task.deliverableId) return true
  if (Array.isArray(task.attachments) && task.attachments.length > 0) return true
  if (Array.isArray(task.checklist) && task.checklist.length > 0) return true
  return false
}

/** 归一化资料清单（旧键 + 新数组 + file 资产），供导出/档案/述职去重展示，不改变原记录。
 *  file 项只带 assetId（refId），文件名/大小/短哈希由带 domain 的消费方 join file_assets 后安全展示。 */
export interface CollectedMaterial {
  source: 'legacy' | 'attachments'
  kind: 'link' | 'deliverable' | 'file'
  refId?: string
  url?: string
}
export function collectMaterials(task: {
  evidenceUrl?: string | null
  deliverableId?: string | null
  attachments?: AttachmentItem[] | undefined
}): CollectedMaterial[] {
  const out: CollectedMaterial[] = []
  if (task.evidenceUrl?.trim()) {
    out.push({ source: 'legacy', kind: 'link', url: task.evidenceUrl.trim() })
  }
  if (task.deliverableId) {
    out.push({ source: 'legacy', kind: 'deliverable', refId: task.deliverableId })
  }
  for (const item of task.attachments ?? []) {
    if (item.kind === 'link') out.push({ source: 'attachments', kind: 'link', url: item.url })
    else if (item.kind === 'deliverable') out.push({ source: 'attachments', kind: 'deliverable', refId: item.deliverableId })
    else if (item.kind === 'file') out.push({ source: 'attachments', kind: 'file', refId: item.assetId })
  }
  return out
}

// ===== ID 生成（按目标任务现有数组扫描，保持任务内唯一）=====

function nextAttachmentId(existing: AttachmentItem[] | undefined): string {
  let max = 0
  for (const item of existing ?? []) {
    const m = /^at-(\d+)$/.exec(item.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `at-${max + 1}`
}

function nextEntryId(existing: ProgressEntry[] | undefined): string {
  let max = 0
  for (const e of existing ?? []) {
    const m = /^pl-(\d+)$/.exec(e.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `pl-${max + 1}`
}

function nextRevisionId(entry: ProgressEntry): string {
  let max = 0
  for (const r of entry.revisions) {
    const m = /^rv-(\d+)$/.exec(r.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `rv-${max + 1}`
}

function loadTaskOrThrow(domain: PmDomain, taskId: string) {
  const record = domain.table('tasks').get(taskId)
  if (!record) throw new MaterialNotFoundError(`未找到任务：${taskId}`)
  return record
}

// ===== 原子 draft commit：新建/编辑任务两区（attachments + progressLog）一次受控落库 =====
//
// 设计：客户端新建/编辑表单把「资料区」与「进展日志」作为一个 draft 整体提交，
// 服务端在【同一 enqueueDomainWrite 临界区】内先把全部草稿归一化+校验，全部通过才 put；
// 任一项失败在 put 之前抛出，整批零写（不会出现任务已建/已改但资料或日志半写）。
// 「取消」= 客户端不调用本动作，天然零写，不产生任何记录。

export interface AttachmentDraft {
  kind: 'link' | 'deliverable'
  url?: string
  deliverableId?: string
  title?: string
  note?: string
}

export interface ProgressDraft {
  date?: string
  author: string
  content: string
  refs?: string[]
}

export interface TaskDraft {
  /** raw 整体数组：仅 create-only（整体重建，编辑禁用）。 */
  attachments?: AttachmentDraft[]
  progressLog?: ProgressDraft[]
  /** ops 信封：编辑安全，与对应 raw 数组互斥。 */
  attachmentOps?: AttachmentOp[]
  progressOps?: ProgressOp[]
}

/** raw 数组与对应 ops 互斥，避免歧义；任一方非法整批零写。 */
export function rejectRawAndOpsMixed(draft: TaskDraft | undefined): void {
  if (!draft) return
  if (draft.attachments && draft.attachmentOps) {
    throw new TaskOpsError('draft.attachments 与 draft.attachmentOps 互斥，二选一')
  }
  if (draft.progressLog && draft.progressOps) {
    throw new TaskOpsError('draft.progressLog 与 draft.progressOps 互斥，二选一')
  }
}

export const ATTACHMENTS_DRAFT_MAX = 50
export const PROGRESS_DRAFT_MAX = 100

/** 归一化资料草稿（在临界区内调用，可复核交付物存在性/同项目）。导出供 updateTask 同事务复用。 */
export function normalizeAttachmentDrafts(
  domain: PmDomain,
  projectId: string,
  existing: AttachmentItem[] | undefined,
  drafts: AttachmentDraft[] | undefined,
  at: string,
): AttachmentItem[] {
  const base = structuredClone(existing ?? [])
  let max = 0
  for (const item of base) {
    const m = /^at-(\d+)$/.exec(item.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  const out: AttachmentItem[] = []
  const seen = new Set<string>()
  for (const draft of drafts ?? []) {
    if (out.length >= ATTACHMENTS_DRAFT_MAX) throw new MaterialDuplicateError(`资料项最多 ${ATTACHMENTS_DRAFT_MAX} 条`)
    if (draft.kind === 'link') {
      const url = normalizeEvidenceUrl(draft.url)
      if (seen.has(`link:${url}`)) throw new MaterialDuplicateError('资料区存在重复链接：' + url)
      seen.add(`link:${url}`)
      const item: AttachmentItem = { id: `at-${++max}`, kind: 'link', url, addedAt: at }
      if (draft.title?.trim()) item.title = draft.title.trim()
      if (draft.note?.trim()) item.note = draft.note.trim()
      out.push(item)
    } else if (draft.kind === 'deliverable') {
      const deliverableId = String(draft.deliverableId ?? '').trim()
      if (!deliverableId) throw new MaterialNotFoundError('deliverable 草稿缺少 deliverableId')
      const deliverable = domain.table('deliverables').get(deliverableId)
      if (!deliverable) throw new MaterialNotFoundError(`未找到交付物：${deliverableId}`)
      if (deliverable.projectId !== projectId) throw new MaterialNotFoundError('交付物不属于当前项目')
      if (seen.has(`deliverable:${deliverableId}`)) throw new MaterialDuplicateError('资料区存在重复交付物：' + deliverableId)
      seen.add(`deliverable:${deliverableId}`)
      const item: AttachmentItem = {
        id: `at-${++max}`,
        kind: 'deliverable',
        deliverableId,
        addedAt: at,
        frozenVersion: typeof deliverable.version === 'string' ? deliverable.version : '',
        frozenName: typeof deliverable.name === 'string' ? deliverable.name : '',
      }
      if (draft.note?.trim()) item.note = draft.note.trim()
      out.push(item)
    } else {
      throw new MaterialNotFoundError('资料草稿 kind 只能是 link 或 deliverable')
    }
  }
  return out
}

/** 归一化进展草稿（首版 revision，作者/正文非空，日期缺省取当日）。导出供 updateTask 同事务复用。 */
export function normalizeProgressDrafts(
  existing: ProgressEntry[] | undefined,
  drafts: ProgressDraft[] | undefined,
  at: string,
  activeAttachments: AttachmentItem[] | undefined,
): ProgressEntry[] {
  const base = structuredClone(existing ?? [])
  let max = 0
  for (const e of base) {
    const m = /^pl-(\d+)$/.exec(e.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  const out: ProgressEntry[] = []
  for (const draft of drafts ?? []) {
    if (out.length >= PROGRESS_DRAFT_MAX) throw new ProgressContentEmptyError(`进展日志最多 ${PROGRESS_DRAFT_MAX} 条`)
    const author = String(draft.author ?? '').trim()
    const content = String(draft.content ?? '').trim()
    if (!author) throw new ProgressAuthorEmptyError('进展作者不能为空')
    if (!content) throw new ProgressContentEmptyError('进展正文不能为空')
    assertRefsOnActiveAttachments(activeAttachments, draft.refs, '新建进展 refs')
    const date = draft.date?.trim() || localTodayIso()
    const entry: ProgressEntry = {
      id: `pl-${++max}`,
      date,
      author,
      createdAt: at,
      revisions: [{ id: 'rv-1', date, author, content, revisedAt: at }],
    }
    if (draft.refs?.length) entry.refs = [...new Set(draft.refs)]
    out.push(entry)
  }
  return out
}

/** 新建任务 draft 归一化（无既有数组），供 addTask 在同一临界区合并，失败零写。 */
export function normalizeTaskDraft(
  domain: PmDomain,
  projectId: string,
  draft: TaskDraft | undefined,
  at: string,
): { attachments: AttachmentItem[]; progressLog: ProgressEntry[] } {
  const attachments = normalizeAttachmentDrafts(domain, projectId, undefined, draft?.attachments, at)
  return {
    attachments,
    progressLog: normalizeProgressDrafts(undefined, draft?.progressLog, at, attachments),
  }
}

// ===== 原子 ops 信封：编辑安全，稳定 ID / P3 历史保留，顺序应用于克隆副本，全量校验后单次 put =====
//
// 与破坏性 raw draft（create-only 整体重建）互补：编辑表单用 ops 表达增删改，未提及的既有条目
// 原样保留（stable id、revisions、deletedAt 不动）。raw 数组与对应 ops 互斥；update 拒绝 raw 数组。

export const ATTACHMENT_OPS_MAX = 50
export const PROGRESS_OPS_MAX = 100
const CLIENT_ID_RE = /^c-[A-Za-z0-9_-]{1,32}$/

export interface AttachmentOp {
  op: 'addLink' | 'addDeliverable' | 'remove' | 'updateNote' | 'addFile'
  /** 仅 add* 使用；前端临时别名，禁止与 at-N 撞号，批内唯一，供后续 progress.add.refs 前向引用。 */
  clientId?: string
  url?: string
  deliverableId?: string
  id?: string
  title?: string
  note?: string
  /** addFile：暂存 stageId（32 hex），由事务边界 prepare→提升，引擎纯阶段不处理。 */
  stageId?: string
}

export interface ProgressOp {
  op: 'add' | 'edit' | 'delete' | 'restore'
  clientId?: string
  id?: string
  author?: string
  content?: string
  date?: string
  /** add：at-N 或前面 add 的 clientId；edit：精确替换本修订版 refs（不传则不改）。 */
  refs?: string[]
}

export interface TaskDraftOps {
  attachmentOps?: AttachmentOp[]
  progressOps?: ProgressOp[]
}

export class TaskOpsError extends Error {}

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/**
 * 纯应用：在克隆的既有数组上按序执行 ops，返回新数组；任一校验失败立即抛出（调用方在 put 前零写）。
 * 先全部 attachmentOps（建立 clientId→at-N 映射与最终资料区），再 progressOps（refs 向前解析）。
 */
export function applyTaskDraftOps(
  domain: PmDomain,
  projectId: string,
  base: { attachments?: AttachmentItem[]; progressLog?: ProgressEntry[] },
  ops: TaskDraftOps,
  at: string,
): { attachments: AttachmentItem[]; progressLog: ProgressEntry[] } {
  const attachments = structuredClone(base.attachments ?? [])
  const progressLog = structuredClone(base.progressLog ?? [])
  const clientIds = new Set<string>()
  const clientToAt = new Map<string, string>()

  const attachmentOps = ops.attachmentOps ?? []
  const progressOps = ops.progressOps ?? []
  if (attachmentOps.length > ATTACHMENT_OPS_MAX) throw new TaskOpsError(`资料操作最多 ${ATTACHMENT_OPS_MAX} 条`)
  if (progressOps.length > PROGRESS_OPS_MAX) throw new TaskOpsError(`进展操作最多 ${PROGRESS_OPS_MAX} 条`)

  for (const o of attachmentOps) {
    if (o.clientId !== undefined) {
      if (!CLIENT_ID_RE.test(o.clientId)) throw new TaskOpsError(`clientId 格式非法：${o.clientId}`)
      if (clientIds.has(o.clientId)) throw new TaskOpsError(`clientId 重复：${o.clientId}`)
      clientIds.add(o.clientId)
    }
    if (o.op === 'addLink') {
      const url = normalizeEvidenceUrl(o.url)
      if (attachments.some(a => a.kind === 'link' && a.url === url)) {
        throw new MaterialDuplicateError('该链接已在资料区：' + url)
      }
      const item: AttachmentItem = { id: nextAttachmentId(attachments), kind: 'link', url, addedAt: at }
      if (o.title?.trim()) item.title = o.title.trim()
      if (o.note?.trim()) item.note = o.note.trim()
      attachments.push(item)
      if (o.clientId) clientToAt.set(o.clientId, item.id)
    } else if (o.op === 'addDeliverable') {
      const deliverableId = String(o.deliverableId ?? '').trim()
      if (!deliverableId) throw new TaskOpsError('addDeliverable 缺少 deliverableId')
      const deliverable = domain.table('deliverables').get(deliverableId)
      if (!deliverable) throw new MaterialNotFoundError(`未找到交付物：${deliverableId}`)
      if (deliverable.projectId !== projectId) throw new MaterialNotFoundError('交付物不属于当前项目')
      if (attachments.some(a => a.kind === 'deliverable' && a.deliverableId === deliverableId)) {
        throw new MaterialDuplicateError('该交付物已挂在资料区：' + deliverableId)
      }
      const item: AttachmentItem = {
        id: nextAttachmentId(attachments),
        kind: 'deliverable',
        deliverableId,
        addedAt: at,
        frozenVersion: typeof deliverable.version === 'string' ? deliverable.version : '',
        frozenName: typeof deliverable.name === 'string' ? deliverable.name : '',
      }
      if (o.note?.trim()) item.note = o.note.trim()
      attachments.push(item)
      if (o.clientId) clientToAt.set(o.clientId, item.id)
    } else if (o.op === 'remove') {
      const idx = attachments.findIndex(a => a.id === o.id)
      if (idx < 0) throw new MaterialNotFoundError(`资料项不存在：${o.id}`)
      attachments.splice(idx, 1)
    } else if (o.op === 'updateNote') {
      const target = attachments.find(a => a.id === o.id)
      if (!target) throw new MaterialNotFoundError(`资料项不存在：${o.id}`)
      if (target.kind === 'deliverable' && o.title?.trim()) {
        throw new TaskOpsError('title 仅适用于 link 资料项')
      }
      if (o.note !== undefined) {
        if (o.note.trim()) target.note = o.note.trim()
        else delete target.note
      }
      if (target.kind === 'link' && o.title !== undefined) {
        if (o.title.trim()) target.title = o.title.trim()
        else delete target.title
      }
    } else {
      throw new TaskOpsError(`未知资料操作：${String((o as { op?: unknown }).op)}`)
    }
  }

  const resolveRef = (ref: string, label: string): string => {
    const mapped = clientToAt.get(ref)
    if (mapped) return mapped
    if (/^at-\d+$/.test(ref) && attachments.some(a => a.id === ref)) return ref
    throw new MaterialNotFoundError(`${label} 引用的资料项 ${ref} 不在本任务当前资料区`)
  }

  for (const o of progressOps) {
    if (o.op === 'add') {
      const author = String(o.author ?? '').trim()
      const content = String(o.content ?? '').trim()
      if (!author) throw new ProgressAuthorEmptyError('进展作者不能为空')
      if (!content) throw new ProgressContentEmptyError('进展正文不能为空')
      const date = o.date?.trim() || localTodayIso()
      if (!isValidIsoDate(date)) throw new TaskOpsError('进展日期须为 YYYY-MM-DD')
      const refs = o.refs?.length ? [...new Set(o.refs.map(r => resolveRef(r, '进展 refs')))] : undefined
      const entry: ProgressEntry = {
        id: nextEntryId(progressLog),
        date,
        author,
        createdAt: at,
        revisions: [{ id: 'rv-1', date, author, content, ...(refs?.length ? { refs } : {}), revisedAt: at }],
        ...(refs?.length ? { refs } : {}),
      }
      progressLog.push(entry)
    } else if (o.op === 'edit') {
      const entry = progressLog.find(e => e.id === o.id)
      if (!entry || entry.deletedAt) throw new ProgressEntryNotFoundError(`未找到进展条目：${o.id}`)
      const content = String(o.content ?? '').trim()
      if (!content) throw new ProgressContentEmptyError('编辑修订版正文不能为空')
      const author = o.author?.trim()
      if (author === '') throw new ProgressAuthorEmptyError('作者不能为空')
      const last = currentRevision(entry)
      const refs = o.refs ? [...new Set(o.refs.map(r => resolveRef(r, '修订版 refs')))] : undefined
      const revision: ProgressRevision = {
        id: nextRevisionId(entry),
        date: o.date?.trim() || last.date,
        author: author || last.author,
        content,
        ...(refs ? { refs } : {}),
        revisedAt: at,
      }
      entry.revisions.push(revision)
    } else if (o.op === 'delete') {
      const entry = progressLog.find(e => e.id === o.id)
      if (!entry) throw new ProgressEntryNotFoundError(`未找到进展条目：${o.id}`)
      if (entry.deletedAt) throw new ProgressEntryNotFoundError(`进展条目已是软删状态：${o.id}`)
      entry.deletedAt = at
    } else if (o.op === 'restore') {
      const entry = progressLog.find(e => e.id === o.id)
      if (!entry || !entry.deletedAt) throw new ProgressEntryNotFoundError(`未找到可恢复的进展条目：${o.id}`)
      delete entry.deletedAt
    } else {
      throw new TaskOpsError(`未知进展操作：${String((o as { op?: unknown }).op)}`)
    }
  }

  return { attachments, progressLog }
}

/**
 * 编辑任务 draft 原子提交：两区整体替换（未提交的区保留现状），同一临界区校验+落库，失败零写。
 * 与逐条 material/progress 追加互补：表单一次性保存走这里，避免先建任务再逐条挂接的半写。
 */
export function commitTaskDraft(
  domain: PmDomain,
  taskId: string,
  draft: TaskDraft,
  nowIso?: string,
): Promise<Record<string, unknown>> {
  const at = nowIso ?? new Date().toISOString()
  return enqueueDomainWrite(domain, async () => {
    const record = loadTaskOrThrow(domain, taskId) as Record<string, unknown>
    // 先全部归一化+校验，任何错误在 put 之前抛出 → 零写。
    const attachments = normalizeAttachmentDrafts(
      domain,
      record.projectId as string,
      record.attachments as AttachmentItem[] | undefined,
      draft.attachments,
      at,
    )
    const progressLog = normalizeProgressDrafts(
      record.progressLog as ProgressEntry[] | undefined,
      draft.progressLog,
      at,
      attachments,
    )
    const nextInput: Record<string, unknown> = {
      ...record,
      attachments,
      progressLog,
      id: record.id,
      updatedAt: at,
    }
    const next = taskWriteSchema.parse(nextInput)
    await domain.table('tasks').put(taskId, next)
    return structuredClone(next)
  })
}

/**
 * material apply：在同一临界区把 ops 信封应用到既有任务，保稳定 ID/P3 历史，全量校验后单次 put，失败零写。
 * 供 CLI `material apply` 与未来表单直调；与破坏性 raw commit 互补。
 */
export function applyTaskOpsToTask(
  domain: PmDomain,
  taskId: string,
  ops: TaskDraftOps,
  nowIso?: string,
): Promise<Record<string, unknown>> {
  const at = nowIso ?? new Date().toISOString()
  return enqueueDomainWrite(domain, async () => {
    const record = loadTaskOrThrow(domain, taskId) as Record<string, unknown>
    const applied = applyTaskDraftOps(
      domain,
      record.projectId as string,
      {
        attachments: record.attachments as AttachmentItem[] | undefined,
        progressLog: record.progressLog as ProgressEntry[] | undefined,
      },
      ops,
      at,
    )
    const nextInput: Record<string, unknown> = {
      ...record,
      attachments: applied.attachments,
      progressLog: applied.progressLog,
      id: record.id,
      updatedAt: at,
    }
    const next = taskWriteSchema.parse(nextInput)
    await domain.table('tasks').put(taskId, next)
    return structuredClone(next)
  })
}

// ===== C8：写时校验 progressLog.refs 必须指向本任务当前 active attachments =====

/**
 * refs 只能引用本任务资料区里当前仍存在（active，未被 remove 摘除）的 at-N。
 * 不存在 / 已移除 / 属其它任务的引用一律在 put 前抛出，整批零写；不做静默悬空引用。
 */
export function assertRefsOnActiveAttachments(
  attachments: AttachmentItem[] | undefined,
  refs: string[] | undefined,
  label: string,
): void {
  if (!refs || refs.length === 0) return
  const activeIds = new Set((attachments ?? []).map(a => a.id))
  for (const ref of refs) {
    if (!activeIds.has(ref)) {
      throw new MaterialNotFoundError(`${label} 引用的资料项 ${ref} 不在本任务当前资料区（不存在或已被移除），已拒绝且零写`)
    }
  }
}

// ===== attachments：加链 / 关联交付物 / 移除（unlink 不删源）=====

export interface AddLinkInput {
  url: string
  title?: string
  note?: string
}

export function addLinkAttachment(domain: PmDomain, taskId: string, input: AddLinkInput, nowIso?: string): Promise<Record<string, unknown>> {
  const url = normalizeEvidenceUrl(input.url)
  return enqueueDomainWrite(domain, async () => {
    const record = loadTaskOrThrow(domain, taskId) as Record<string, unknown>
    const attachments = structuredClone((record.attachments as AttachmentItem[] | undefined) ?? [])
    if (attachments.some(a => a.kind === 'link' && a.url === url)) {
      throw new MaterialDuplicateError('该链接已挂在本任务上')
    }
    const at: AttachmentItem = {
      id: nextAttachmentId(attachments),
      kind: 'link',
      url,
      addedAt: nowIso ?? new Date().toISOString(),
    }
    if (input.title?.trim()) at.title = input.title.trim()
    if (input.note?.trim()) at.note = input.note.trim()
    attachments.push(at)
    const next = await persist(domain, taskId, record, { attachments })
    return structuredClone(next.attachments?.find(a => a.id === at.id) ?? at)
  })
}

export interface AddDeliverableInput {
  deliverableId: string
  note?: string
}

export function addDeliverableAttachment(domain: PmDomain, taskId: string, input: AddDeliverableInput, nowIso?: string): Promise<Record<string, unknown>> {
  const deliverableId = String(input.deliverableId ?? '').trim()
  return enqueueDomainWrite(domain, async () => {
    const record = loadTaskOrThrow(domain, taskId) as Record<string, unknown>
    // 写时复核存在性 + 同项目；冻结关联时刻的 version/name 快照（P2）。
    const deliverable = domain.table('deliverables').get(deliverableId)
    if (!deliverable) throw new MaterialNotFoundError(`未找到交付物：${deliverableId}`)
    if (deliverable.projectId !== record.projectId) throw new MaterialNotFoundError('交付物不属于当前项目')
    const attachments = structuredClone((record.attachments as AttachmentItem[] | undefined) ?? [])
    if (attachments.some(a => a.kind === 'deliverable' && a.deliverableId === deliverableId)) {
      throw new MaterialDuplicateError('该交付物已挂在本任务上')
    }
    const at: AttachmentItem = {
      id: nextAttachmentId(attachments),
      kind: 'deliverable',
      deliverableId,
      addedAt: nowIso ?? new Date().toISOString(),
      frozenVersion: typeof deliverable.version === 'string' ? deliverable.version : '',
      frozenName: typeof deliverable.name === 'string' ? deliverable.name : '',
    }
    if (input.note?.trim()) at.note = input.note.trim()
    attachments.push(at)
    const next = await persist(domain, taskId, record, { attachments })
    return structuredClone(next.attachments?.find(a => a.id === at.id) ?? at)
  })
}

/** 仅从本任务资料数组摘掉该项，绝不删交付物记录/URL/源。 */
export function removeAttachment(domain: PmDomain, taskId: string, attachmentId: string): Promise<boolean> {
  return enqueueDomainWrite(domain, async () => {
    const record = loadTaskOrThrow(domain, taskId) as Record<string, unknown>
    const attachments = structuredClone((record.attachments as AttachmentItem[] | undefined) ?? [])
    const idx = attachments.findIndex(a => a.id === attachmentId)
    if (idx < 0) throw new MaterialNotFoundError(`本任务没有资料项：${attachmentId}`)
    attachments.splice(idx, 1)
    await persist(domain, taskId, record, { attachments })
    return true
  })
}

// ===== progressLog：追加首版 / 编辑追加修订版 / 软删 / 恢复 =====

export interface ProgressAppendInput {
  date?: string
  author: string
  content: string
  refs?: string[]
}

export function progressAppend(domain: PmDomain, taskId: string, input: ProgressAppendInput, nowIso?: string): Promise<ProgressEntry> {
  const author = String(input.author ?? '').trim()
  const content = String(input.content ?? '').trim()
  if (!author) throw new ProgressAuthorEmptyError('作者不能为空')
  if (!content) throw new ProgressContentEmptyError('正文不能为空')
  return enqueueDomainWrite(domain, async () => {
    const record = loadTaskOrThrow(domain, taskId) as Record<string, unknown>
    assertRefsOnActiveAttachments(record.attachments as AttachmentItem[] | undefined, input.refs, '进展条目 refs')
    const progressLog = structuredClone((record.progressLog as ProgressEntry[] | undefined) ?? [])
    const at = nowIso ?? new Date().toISOString()
    const entry: ProgressEntry = {
      id: nextEntryId(progressLog),
      date: input.date?.trim() || localTodayIso(),
      author,
      createdAt: at,
      revisions: [{
        id: 'rv-1',
        date: input.date?.trim() || localTodayIso(),
        author,
        content,
        ...(input.refs?.length ? { refs: [...new Set(input.refs)] } : {}),
        revisedAt: at,
      }],
      ...(input.refs?.length ? { refs: [...new Set(input.refs)] } : {}),
    }
    progressLog.push(entry)
    const next = await persist(domain, taskId, record, { progressLog })
    return structuredClone(next.progressLog!.find(e => e.id === entry.id)!)
  })
}

export interface ProgressEditInput {
  date?: string
  author?: string
  content: string
  refs?: string[]
}

/** 编辑=追加一条新 revision，旧 revisions 正文不可覆盖。 */
export function progressEditRevision(
  domain: PmDomain,
  taskId: string,
  entryId: string,
  input: ProgressEditInput,
  nowIso?: string,
): Promise<ProgressEntry> {
  const content = String(input.content ?? '').trim()
  if (!content) throw new ProgressContentEmptyError('正文不能为空')
  const author = input.author?.trim()
  if (author === '') throw new ProgressAuthorEmptyError('作者不能为空')
  return enqueueDomainWrite(domain, async () => {
    const record = loadTaskOrThrow(domain, taskId) as Record<string, unknown>
    const progressLog = structuredClone((record.progressLog as ProgressEntry[] | undefined) ?? [])
    const entry = progressLog.find(e => e.id === entryId)
    if (!entry || entry.deletedAt) throw new ProgressEntryNotFoundError(`未找到进展条目：${entryId}`)
    assertRefsOnActiveAttachments(record.attachments as AttachmentItem[] | undefined, input.refs, '修订版 refs')
    const at = nowIso ?? new Date().toISOString()
    const last = currentRevision(entry)
    const revision: ProgressRevision = {
      id: nextRevisionId(entry),
      date: input.date?.trim() || last.date,
      author: author || last.author,
      content,
      ...(input.refs ? { refs: [...new Set(input.refs)] } : {}),
      revisedAt: at,
    }
    entry.revisions.push(revision)
    const next = await persist(domain, taskId, record, { progressLog })
    return structuredClone(next.progressLog!.find(e => e.id === entry.id)!)
  })
}

/** 软删：写 deletedAt，revisions 全保留；不删条目。 */
export function progressSoftDelete(domain: PmDomain, taskId: string, entryId: string, nowIso?: string): Promise<ProgressEntry> {
  return enqueueDomainWrite(domain, async () => {
    const record = loadTaskOrThrow(domain, taskId) as Record<string, unknown>
    const progressLog = structuredClone((record.progressLog as ProgressEntry[] | undefined) ?? [])
    const entry = progressLog.find(e => e.id === entryId)
    if (!entry) throw new ProgressEntryNotFoundError(`未找到进展条目：${entryId}`)
    if (entry.deletedAt) throw new ProgressEntryNotFoundError(`进展条目已是软删状态：${entryId}`)
    entry.deletedAt = nowIso ?? new Date().toISOString()
    const next = await persist(domain, taskId, record, { progressLog })
    return structuredClone(next.progressLog!.find(e => e.id === entryId)!)
  })
}

/** 恢复：清除 deletedAt，revision 不丢。 */
export function progressRestore(domain: PmDomain, taskId: string, entryId: string): Promise<ProgressEntry> {
  return enqueueDomainWrite(domain, async () => {
    const record = loadTaskOrThrow(domain, taskId) as Record<string, unknown>
    const progressLog = structuredClone((record.progressLog as ProgressEntry[] | undefined) ?? [])
    const entry = progressLog.find(e => e.id === entryId)
    if (!entry || !entry.deletedAt) throw new ProgressEntryNotFoundError(`未找到可恢复的进展条目：${entryId}`)
    delete entry.deletedAt
    const next = await persist(domain, taskId, record, { progressLog })
    return structuredClone(next.progressLog!.find(e => e.id === entryId)!)
  })
}

// ===== 落库（复用 taskWriteSchema 校验 + 全局写队列）=====

async function persist(
  domain: PmDomain,
  taskId: string,
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
) {
  const nextInput: Record<string, unknown> = {
    ...current,
    ...patch,
    id: current.id,
    updatedAt: new Date().toISOString(),
  }
  const next = taskWriteSchema.parse(nextInput)
  await domain.table('tasks').put(taskId, next)
  return next
}

export { EvidenceUrlInvalidError }
