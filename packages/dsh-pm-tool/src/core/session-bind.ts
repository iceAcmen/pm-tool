/**
 * P0 K9 会话结存：任务 ↔ 会话单向绑定 + 结存摘要沉淀。
 *
 * 边界（docs/design/deep-integration-v2-p0-dev.md §三 K9）：
 * - 单向结存：只把会话标识与 note 沉淀到本工具的 sessions 表，不做双向同步、不回写外部平台；
 * - 同 taskId + sessionId 重复 bind = 合并 note 追加、刷新 updatedAt，不新建第二条；
 * - 写库一律走 enqueueDomainWrite 串行队列 + sessionRecordSchema 校验，不 table.put 绕过。
 *
 * 纯函数（validate/merge/find/build）零网络/零随机/零墙钟，供 vitest 离线单测；
 * 领域写函数（bindSession/listSessionsByProject/listSessionNotes）依赖 domain。
 */
import { enqueueDomainWrite } from './projects.js'
import { getTask } from './tasks.js'
import { sessionRecordSchema, type SessionRecord } from './storage.js'
import type { PmDomain } from './storage.js'

export class SessionBindError extends Error {}

// ---- 纯函数（可离线单测）----

/** 绑定输入校验：taskId/sessionId 非空且形状合法；note 可选文本。返回中文问题清单（空 = 通过）。 */
export function validateSessionBindInput(taskId: unknown, sessionId: unknown, note?: unknown): string[] {
  const errors: string[] = []
  if (typeof taskId !== 'string' || !taskId.trim()) {
    errors.push('任务 ID 不能为空')
  } else if (!/^[a-zA-Z0-9_-]+$/.test(taskId.trim())) {
    errors.push('任务 ID 只能包含字母、数字、下划线和连字符')
  }
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    errors.push('会话 ID 不能为空')
  } else if (sessionId.trim().length > 128) {
    errors.push('会话 ID 过长（上限 128 字符）')
  }
  if (note !== undefined && note !== null && typeof note !== 'string') {
    errors.push('结存摘要 note 须为文本')
  }
  return errors
}

/** 合并两段 note：去空白、去重、以「；」连接；两段都空返回 undefined。 */
export function mergeNotes(existing: string | undefined, incoming: string | undefined): string | undefined {
  const parts = [existing, incoming]
    .map(n => (typeof n === 'string' ? n.trim() : ''))
    .filter(Boolean)
  const unique = [...new Set(parts)]
  return unique.length ? unique.join('；') : undefined
}

/** 在 sessions 表条目里按 taskId + sessionId 找既有绑定（精确匹配）。 */
export function findSessionRecord(
  entries: Iterable<[string, unknown]>,
  taskId: string,
  sessionId: string,
): SessionRecord | undefined {
  for (const [, raw] of entries) {
    const rec = raw as Partial<SessionRecord>
    if (rec && rec.taskId === taskId && rec.sessionId === sessionId) {
      return rec as SessionRecord
    }
  }
  return undefined
}

/** 合并既有绑定：note 追加合并、刷新 updatedAt，保留原 id/createdAt/projectId/taskId/sessionId。 */
export function buildMergedRecord(existing: SessionRecord, incomingNote: string | undefined, nowIso: string): SessionRecord {
  return sessionRecordSchema.parse({
    ...existing,
    note: mergeNotes(existing.note, incomingNote),
    updatedAt: nowIso,
  })
}

/** 生成绑定 ID：session-<ts36>-<rand6>（与 provenance/undo 既有随机后缀模式一致）。 */
export function makeSessionRecordId(now: Date = new Date()): string {
  return `session-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ---- 领域写（串行队列 + schema 校验 + 落盘）----

export interface BindSessionInput {
  taskId: string
  sessionId: string
  note?: string
}

export interface BindSessionResult {
  record: SessionRecord
  /** true = 命中既有绑定并合并 note；false = 新建绑定。 */
  merged: boolean
}

/**
 * 绑定任务与会话：校验任务存在 → 同 taskId+sessionId 已存在则合并 note 刷新时间，否则新建。
 * projectId 从任务记录取，不接受调用方传入（防止跨项目错绑）。
 */
export async function bindSession(domain: PmDomain, input: BindSessionInput): Promise<BindSessionResult> {
  const errors = validateSessionBindInput(input.taskId, input.sessionId, input.note)
  if (errors.length) throw new SessionBindError(errors.join('；'))
  const task = getTask(domain, input.taskId.trim())
  if (!task) throw new SessionBindError(`未找到任务：${input.taskId}`)

  const table = domain.table('sessions')
  return enqueueDomainWrite(domain, async () => {
    const nowIso = new Date().toISOString()
    const existing = findSessionRecord(table.entries(), task.id, input.sessionId.trim())
    if (existing) {
      const record = buildMergedRecord(existing, input.note?.trim(), nowIso)
      await table.put(existing.id, record)
      return { record, merged: true }
    }
    const record = sessionRecordSchema.parse({
      id: makeSessionRecordId(),
      projectId: task.projectId,
      taskId: task.id,
      sessionId: input.sessionId.trim(),
      note: input.note?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    await table.put(record.id, record)
    return { record, merged: false }
  })
}

/** 按项目列出全部会话绑定（按 updatedAt 升序，深拷贝）。 */
export function listSessionsByProject(domain: PmDomain, projectId: string): SessionRecord[] {
  return [...domain.table('sessions').entries()]
    .map(([, raw]) => raw as SessionRecord)
    .filter(rec => rec.projectId === projectId)
    .map(rec => structuredClone(rec))
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
}

/** 按任务列出全部结存摘要（按 updatedAt 升序，深拷贝）。 */
export function listSessionNotes(domain: PmDomain, taskId: string): SessionRecord[] {
  return [...domain.table('sessions').entries()]
    .map(([, raw]) => raw as SessionRecord)
    .filter(rec => rec.taskId === taskId)
    .map(rec => structuredClone(rec))
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
}
