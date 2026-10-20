/**
 * P2 能力 X7 愿景/OKR 层（分片B）。
 *
 * 契约见 docs/design/deep-integration-v2-p2-dev.md §三：
 * - 独立实体 okrs 表：单父 primaryOkrId 主归属（权重只认这一条），
 *   relatedOkrIds 软关联「关联目标」行——可见、标注 related:true、不计权重、不被收为子节点；
 * - agent 代起草归属建议 → 只进 settings 收件区 pmOkrInbox，未确认不创建 okr 记录（未确认不生效）；
 *   人 confirm → 创建 draft 记录 + 建议标已处理；人 ignore → 建议保留标 ignored；
 *   inbox clear → 季度回访集中清空已处理/已忽略条目（pending 保留）；
 * - 草稿/定稿复用 X6 机制：draft→confirmed 只能由人 update 触发，无自动定稿；
 * - cycleDue 仅 K11 类型预留，本期不实现周期调度；习惯层（每日补记/续接/66 天窗口/streak）不在本期。
 *
 * 纯函数（树形派生/收件区形状/建议→记录转换/形状校验）零网络零随机零墙钟，供 vitest 离线单测；
 * 领域写（add/update/suggest/confirm/ignore/clear）走 enqueueDomainWrite 串行队列 + okrRecordSchema 校验。
 */
import { z } from 'zod'
import { enqueueDomainWrite } from './projects.js'
import { okrRecordSchema, type OkrRecord, type PmDomain } from './storage.js'

// ---- 错误类型（中文报错风格参照 tasks.ts validateMilestoneRelation）----

export class OkrProjectNotFoundError extends Error {}
export class OkrPrimaryNotFoundError extends Error {}
export class OkrPrimaryProjectMismatchError extends Error {}
export class OkrRelatedNotFoundError extends Error {}
export class OkrRelatedProjectMismatchError extends Error {}
export class OkrSelfReferenceError extends Error {}
export class OkrNotFoundError extends Error {}
export class OkrSuggestionNotFoundError extends Error {}
export class OkrSuggestionAlreadyProcessedError extends Error {}

// ---- 形状 schema（strictObject 拒绝未知字段；落盘仍过契约层 okrRecordSchema）----

export const okrKindSchema = z.enum(['objective', 'key-result'])

const okrIdLikeSchema = z.string().regex(/^okr-[a-zA-Z0-9_-]+$/, 'OKR ID 只能包含字母、数字、下划线和连字符')

/** 人直接录入：projectId 由命令层位置参数注入，body 只接受业务字段。 */
export const okrCreateSchema = z.strictObject({
  title: z.string().trim().min(1, 'OKR 标题不能为空'),
  kind: okrKindSchema,
  primaryOkrId: z.string().nullable().optional(),
  relatedOkrIds: z.array(z.string()).optional(),
  owner: z.string().optional(),
  targetDate: z.iso.date({ error: '目标日期须为有效 YYYY-MM-DD' }).optional(),
  /** 说明/补充描述（兼容新增，optional；旧记录缺键照常读取，不批量迁移）。 */
  description: z.string().trim().optional(),
  status: z.enum(['draft', 'confirmed']).optional(),
  /** K11 周期触发接线点（类型预留，本期不实现周期调度，不产出任何定时任务）。 */
  cycleDue: z.string().optional(),
})

/** 更新：全部可选，至少一项；id/projectId/createdAt 不可改。 */
export const okrUpdateSchema = z.strictObject({
  title: z.string().trim().min(1, 'OKR 标题不能为空').optional(),
  kind: okrKindSchema.optional(),
  primaryOkrId: z.string().nullable().optional(),
  relatedOkrIds: z.array(z.string()).optional(),
  owner: z.string().nullable().optional(),
  targetDate: z.iso.date({ error: '目标日期须为有效 YYYY-MM-DD' }).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  status: z.enum(['draft', 'confirmed']).optional(),
  cycleDue: z.string().nullable().optional(),
}).refine(value => Object.keys(value).length > 0, '至少提供一个要更新的字段')

/** agent 代起草建议形状：只进收件区，不建记录。 */
export const okrSuggestionSchema = z.strictObject({
  title: z.string().trim().min(1, '建议标题不能为空'),
  kind: okrKindSchema,
  primaryOkrId: z.string().nullable().optional(),
  rationale: z.string().optional(),
})

export type OkrCreateInput = z.infer<typeof okrCreateSchema>
export type OkrUpdateInput = z.infer<typeof okrUpdateSchema>
export type OkrSuggestionInput = z.infer<typeof okrSuggestionSchema>

// ---- 收件区（settings 固定行 pmOkrInbox，数组只增；处理状态原地标注，不删 pending）----

export const OKR_INBOX_ROW = 'pmOkrInbox'

export type OkrSuggestionStatus = 'pending' | 'confirmed' | 'ignored'

export interface OkrSuggestion {
  id: string
  at: string
  projectId: string
  title: string
  kind: 'objective' | 'key-result'
  primaryOkrId: string | null
  rationale?: string
  status: OkrSuggestionStatus
  /** confirm 后回写创建出的 okr 记录 ID。 */
  confirmedOkrId?: string
  processedAt?: string
  ignoredAt?: string
}

interface InboxShape { entries?: unknown[] }

/** 同步读收件区全部条目（坏行/非数组诚实回落为空，不臆造）。 */
export function readOkrInbox(domain: PmDomain): OkrSuggestion[] {
  const row = domain.table('settings').get(OKR_INBOX_ROW) as { value?: unknown } | undefined
  const value = row?.value as InboxShape | undefined
  if (!value || typeof value !== 'object' || !Array.isArray(value.entries)) return []
  return value.entries.filter((e): e is OkrSuggestion =>
    !!e && typeof e === 'object' && 'id' in e && 'projectId' in e && 'status' in e,
  )
}

/** 按项目过滤收件区条目（默认只看 pending；includeProcessed=true 时连已处理/已忽略一起列）。 */
export function listOkrSuggestions(
  domain: PmDomain,
  projectId: string,
  options: { includeProcessed?: boolean } = {},
): OkrSuggestion[] {
  return readOkrInbox(domain)
    .filter(s => s.projectId === projectId && (options.includeProcessed || s.status === 'pending'))
    .map(s => structuredClone(s))
    .sort((a, b) => a.at.localeCompare(b.at))
}

// ---- ID 生成（与 session/provenance 既有随机后缀模式一致）----

export function makeOkrId(now: Date = new Date()): string {
  return `okr-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function makeSuggestionId(now: Date = new Date()): string {
  return `okrsug-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ---- 关系校验（存在性 + 同项目 + 不自指；参照 validateMilestoneRelation）----

/**
 * primaryOkrId：显式传入必须存在、与本项目同项目、不得自指；null/缺省=无父（根），放行。
 * relatedOkrIds：显式传入时每个必须存在、同项目、不得自指；去重后返回归一化列表；
 * 未传入（undefined）返回 undefined，调用方不得据此清空既有软关联。
 * selfId 传入时（update 场景）用于排除自指。
 */
export function validateOkrRelations(
  domain: PmDomain,
  projectId: string,
  primaryOkrId: string | null | undefined,
  relatedOkrIds: string[] | undefined,
  selfId?: string,
): string[] | undefined {
  if (primaryOkrId) {
    if (selfId && primaryOkrId === selfId) throw new OkrSelfReferenceError('不能把自己设为父目标')
    const parent = domain.table('okrs').get(primaryOkrId)
    if (!parent) throw new OkrPrimaryNotFoundError(`未找到父目标：${primaryOkrId}`)
    if (parent.projectId !== projectId) throw new OkrPrimaryProjectMismatchError('父目标不属于指定项目')
  }
  if (relatedOkrIds === undefined) return undefined
  const normalized: string[] = []
  const seen = new Set<string>()
  for (const raw of relatedOkrIds) {
    const id = raw.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    if (selfId && id === selfId) throw new OkrSelfReferenceError('不能把自己列入软关联')
    const target = domain.table('okrs').get(id)
    // D-12 / C-11 错误层级：标题 → 对象 ID → 白话原因 → 影响（不影响主归属）→ 修复动作 → 折叠技术原文。
    if (!target) {
      throw new OkrRelatedNotFoundError(
        [
          `未找到关联目标（软关联）｜对象 ID：${id}`,
          `原因：该 ID 在本项目目标库中不存在或已被删除。`,
          `影响：本条软关联不生效（不计权重、不参与进度裁决），不影响已设置的主归属。`,
          `修复：从列表选择一个存在的目标，或移除该 ID。`,
          `技术原文：未找到关联目标：${id}`,
        ].join('\n'),
      )
    }
    if (target.projectId !== projectId) {
      throw new OkrRelatedProjectMismatchError(
        [
          `关联目标不属于本项目｜对象 ID：${id}`,
          `原因：该目标属于其它项目，软关联不能跨项目引用。`,
          `影响：本条软关联不生效（不计权重、不参与进度裁决），不影响已设置的主归属。`,
          `修复：改选本项目目标，或移除该 ID。`,
          `技术原文：关联目标不属于指定项目`,
        ].join('\n'),
      )
    }
    normalized.push(id)
  }
  return normalized
}

// ---- 树形派生（纯函数：单父归属，软关联标注且不计权重）----

export interface OkrRelatedRef {
  id: string
  title: string
  kind: OkrRecord['kind']
  /** 软关联目标自身的权重归属组（=它自己的 primaryOkrId），不随本次关联改变。 */
  weightGroup: string | null
  related: true
}

export interface OkrTreeNode extends OkrRecord {
  /** 权重归属组：等于本记录自己的 primaryOkrId（单父）；根目标为 null。软关联不改变本组。 */
  weightGroup: string | null
  /** true = 本记录被其他记录列入 relatedOkrIds（软关联标注）；可见但不计入对方权重。 */
  related: boolean
  children: OkrTreeNode[]
  /** 本记录声明的软关联目标（独立列示，不作为子节点、不参与权重归属）。 */
  relatedTargets: OkrRelatedRef[]
}

export interface OkrTreeResult {
  /** 按 primaryOkrId 单父挂接的根节点（含可解析的无父目标）。 */
  tree: OkrTreeNode[]
  /** 父目标缺失/已失效的游离条目（不静默丢弃，单独列出供人修补）。 */
  orphans: OkrRecord[]
}

/** 排序：objective 在前、key-result 在后，再按 id 字典序（确定性，不依赖墙钟）。 */
function sortNodes(a: OkrRecord, b: OkrRecord): number {
  if (a.kind !== b.kind) return a.kind === 'objective' ? -1 : 1
  return a.id.localeCompare(b.id, 'en', { numeric: true })
}

/**
 * 树形派生：
 * - 权重只按 primaryOkrId 单父计算（weightGroup = 自身 primaryOkrId）；
 * - relatedOkrIds 软关联：被指向的记录标 related:true，只进 relatedTargets 独立列示，
 *   绝不被收为 referrer 的 children，也不改变自身 weightGroup；
 * - primaryOkrId 指向缺失记录的条目进 orphans，不静默丢弃。
 */
export function buildOkrTree(records: OkrRecord[]): OkrTreeResult {
  const byId = new Map<string, OkrRecord>(records.map(r => [r.id, r]))
  const relatedSet = new Set<string>()
  for (const rec of records) {
    for (const rid of rec.relatedOkrIds ?? []) {
      if (byId.has(rid)) relatedSet.add(rid)
    }
  }

  const nodes = new Map<string, OkrTreeNode>()
  for (const rec of records) {
    const relatedTargets: OkrRelatedRef[] = (rec.relatedOkrIds ?? [])
      .map(rid => byId.get(rid))
      .filter((t): t is OkrRecord => !!t)
      .map(t => ({ id: t.id, title: t.title, kind: t.kind, weightGroup: t.primaryOkrId, related: true as const }))
    nodes.set(rec.id, {
      ...structuredClone(rec),
      weightGroup: rec.primaryOkrId,
      related: relatedSet.has(rec.id),
      children: [],
      relatedTargets,
    })
  }

  const tree: OkrTreeNode[] = []
  const orphans: OkrRecord[] = []
  const visited = new Set<string>()
  for (const rec of records) {
    const node = nodes.get(rec.id)!
    if (!rec.primaryOkrId) {
      tree.push(node)
      continue
    }
    const parent = nodes.get(rec.primaryOkrId)
    if (!parent) {
      orphans.push(structuredClone(rec))
      continue
    }
    // 环保护：沿 primaryOkrId 上溯，回到自身则视为游离，避免无限递归。
    let cursor: OkrTreeNode | undefined = parent
    let cycle = false
    const chain = new Set<string>()
    while (cursor) {
      if (cursor.id === rec.id || chain.has(cursor.id)) { cycle = true; break }
      chain.add(cursor.id)
      cursor = cursor.primaryOkrId ? nodes.get(cursor.primaryOkrId) : undefined
    }
    if (cycle) {
      orphans.push(structuredClone(rec))
      continue
    }
    if (!visited.has(rec.id)) {
      parent.children.push(node)
      visited.add(rec.id)
    }
  }

  const sortSubtree = (list: OkrTreeNode[]) => {
    list.sort(sortNodes)
    for (const n of list) sortSubtree(n.children)
  }
  sortSubtree(tree)
  orphans.sort(sortNodes)
  return { tree, orphans }
}

// ---- 建议 → okr 记录转换（纯函数；confirm 时使用，产出 draft，不自动定稿）----

export function buildOkrRecordFromSuggestion(
  suggestion: OkrSuggestion,
  id: string,
  nowIso: string,
): OkrRecord {
  return okrRecordSchema.parse({
    id,
    projectId: suggestion.projectId,
    title: suggestion.title,
    kind: suggestion.kind,
    primaryOkrId: suggestion.primaryOkrId,
    relatedOkrIds: [],
    status: 'draft',
    createdAt: nowIso,
    updatedAt: nowIso,
  })
}

// ---- 领域写 ----

export function getOkr(domain: PmDomain, id: string): OkrRecord | undefined {
  okrIdLikeSchema.parse(id)
  const record = domain.table('okrs').get(id) as OkrRecord | undefined
  return record ? structuredClone(record) : undefined
}

export function listOkrsByProject(domain: PmDomain, projectId: string): OkrRecord[] {
  if (!domain.table('projects').get(projectId)) {
    throw new OkrProjectNotFoundError(`未找到项目：${projectId}`)
  }
  return [...domain.table('okrs').entries()]
    .map(([, raw]) => raw as OkrRecord)
    .filter(rec => rec.projectId === projectId)
    .map(rec => structuredClone(rec))
}

/** 人直接录入 OKR/KR（默认 draft）；关系存在性+同项目校验走串行写队列。 */
export function addOkr(domain: PmDomain, projectId: string, input: unknown): Promise<OkrRecord> {
  const fields = okrCreateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(projectId)) {
      throw new OkrProjectNotFoundError(`未找到项目：${projectId}`)
    }
    const relatedOkrIds = validateOkrRelations(domain, projectId, fields.primaryOkrId, fields.relatedOkrIds) ?? []
    const at = new Date().toISOString()
    const record = okrRecordSchema.parse({
      id: makeOkrId(),
      projectId,
      title: fields.title,
      kind: fields.kind,
      primaryOkrId: fields.primaryOkrId ?? null,
      relatedOkrIds,
      ...(fields.owner ? { owner: fields.owner } : {}),
      ...(fields.targetDate ? { targetDate: fields.targetDate } : {}),
      ...(fields.description ? { description: fields.description } : {}),
      status: fields.status ?? 'draft',
      ...(fields.cycleDue ? { cycleDue: fields.cycleDue } : {}),
      createdAt: at,
      updatedAt: at,
    })
    await domain.table('okrs').put(record.id, record)
    return structuredClone(record)
  })
}

/** 人更新（含 draft→confirmed 人定稿）；id/projectId/createdAt 不可改。 */
export function updateOkr(domain: PmDomain, id: string, input: unknown): Promise<OkrRecord | undefined> {
  okrIdLikeSchema.parse(id)
  const fields: OkrUpdateInput = okrUpdateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('okrs')
    const current = table.get(id) as OkrRecord | undefined
    if (!current) return undefined
    // primaryOkrId / relatedOkrIds 任一显式传入都统一走一次关系校验（存在性+同项目+不自指）；
    // 都未传入时返回 undefined，不得清空既有软关联。
    const relatedOkrIds = (fields.primaryOkrId !== undefined || fields.relatedOkrIds !== undefined)
      ? validateOkrRelations(domain, current.projectId, fields.primaryOkrId, fields.relatedOkrIds, id)
      : undefined
    const nextInput: Record<string, unknown> = {
      ...current,
      ...fields,
      id: current.id,
      projectId: current.projectId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    if (relatedOkrIds !== undefined) nextInput.relatedOkrIds = relatedOkrIds
    // null 清除可选字段（与 task/deliverable 清空口径同构），不留 null 污染记录。
    if (fields.targetDate === null) delete nextInput.targetDate
    if (fields.owner === null) delete nextInput.owner
    if (fields.description === null) delete nextInput.description
    if (fields.cycleDue === null) delete nextInput.cycleDue
    const next = okrRecordSchema.parse(nextInput)
    await table.put(id, next)
    return structuredClone(next)
  })
}

/**
 * agent 代起草归属建议：纯追加进 settings 收件区，不创建 okr 记录（未确认不生效）。
 * 形状校验通过即落收件区；父目标存在性留到 confirm 时校验（建议可指向尚未建立的目标）。
 */
export function suggestOkr(domain: PmDomain, projectId: string, input: unknown): Promise<OkrSuggestion> {
  const fields = okrSuggestionSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(projectId)) {
      throw new OkrProjectNotFoundError(`未找到项目：${projectId}`)
    }
    const at = new Date().toISOString()
    const suggestion: OkrSuggestion = {
      id: makeSuggestionId(),
      at,
      projectId,
      title: fields.title,
      kind: fields.kind,
      primaryOkrId: fields.primaryOkrId ?? null,
      ...(fields.rationale ? { rationale: fields.rationale } : {}),
      status: 'pending',
    }
    const entries = [...readOkrInbox(domain), suggestion]
    await domain.table('settings').put(OKR_INBOX_ROW, {
      value: { entries },
      updatedAt: at,
    })
    return structuredClone(suggestion)
  })
}

/** 人确认建议 → 创建 draft okr 记录 + 建议标 confirmed（不自动定稿）。 */
export function confirmOkrSuggestion(domain: PmDomain, suggestionId: string): Promise<{ suggestion: OkrSuggestion; record: OkrRecord }> {
  return enqueueDomainWrite(domain, async () => {
    const entries = readOkrInbox(domain)
    const suggestion = entries.find(s => s.id === suggestionId)
    if (!suggestion) throw new OkrSuggestionNotFoundError(`未找到建议：${suggestionId}`)
    if (suggestion.status !== 'pending') {
      throw new OkrSuggestionAlreadyProcessedError(
        suggestion.status === 'confirmed' ? '该建议已确认过' : '该建议已被忽略，如需采纳请重新建议或直接录入',
      )
    }
    // confirm 时才做父目标存在性 + 同项目校验（建议阶段不拦截）。
    validateOkrRelations(domain, suggestion.projectId, suggestion.primaryOkrId, undefined)
    const at = new Date().toISOString()
    const record = buildOkrRecordFromSuggestion(suggestion, makeOkrId(), at)
    await domain.table('okrs').put(record.id, record)
    const updated: OkrSuggestion = {
      ...suggestion,
      status: 'confirmed',
      confirmedOkrId: record.id,
      processedAt: at,
    }
    await domain.table('settings').put(OKR_INBOX_ROW, {
      value: { entries: entries.map(s => (s.id === suggestionId ? updated : s)) },
      updatedAt: at,
    })
    return { suggestion: structuredClone(updated), record: structuredClone(record) }
  })
}

/** 人忽略建议：保留在收件区标 ignored（可逆，不删除）。 */
export function ignoreOkrSuggestion(domain: PmDomain, suggestionId: string): Promise<OkrSuggestion> {
  return enqueueDomainWrite(domain, async () => {
    const entries = readOkrInbox(domain)
    const suggestion = entries.find(s => s.id === suggestionId)
    if (!suggestion) throw new OkrSuggestionNotFoundError(`未找到建议：${suggestionId}`)
    if (suggestion.status !== 'pending') {
      throw new OkrSuggestionAlreadyProcessedError(
        suggestion.status === 'confirmed' ? '该建议已确认过，不能再忽略' : '该建议已被忽略',
      )
    }
    const at = new Date().toISOString()
    const updated: OkrSuggestion = { ...suggestion, status: 'ignored', ignoredAt: at }
    await domain.table('settings').put(OKR_INBOX_ROW, {
      value: { entries: entries.map(s => (s.id === suggestionId ? updated : s)) },
      updatedAt: at,
    })
    return structuredClone(updated)
  })
}

/** 季度回访集中清空：删除本项目已处理（confirmed）/已忽略（ignored）条目，pending 保留。 */
export function clearProcessedSuggestions(domain: PmDomain, projectId: string): Promise<number> {
  return enqueueDomainWrite(domain, async () => {
    const entries = readOkrInbox(domain)
    const kept = entries.filter(s => !(s.projectId === projectId && s.status !== 'pending'))
    const removed = entries.length - kept.length
    if (removed > 0) {
      await domain.table('settings').put(OKR_INBOX_ROW, {
        value: { entries: kept },
        updatedAt: new Date().toISOString(),
      })
    }
    return removed
  })
}

// ---- zod 中文报错描述（与 task/milestone 命令层同构）----

const OKR_FIELD_LABELS: Record<string, string> = {
  title: '标题（非空文本）',
  kind: '类型（objective 目标 / key-result 关键结果）',
  primaryOkrId: '父目标 ID 或 null（须同项目存在）',
  relatedOkrIds: '软关联目标 ID 数组（可见不计权重，须同项目存在）',
  owner: '负责人（文本）',
  targetDate: '目标日期（有效 YYYY-MM-DD）',
  description: '说明/补充描述（文本，传 null 清空）',
  status: '状态（draft 草稿 / confirmed 定稿，定稿只能由人触发）',
  cycleDue: '周期接线点（K11 预留，本期不调度）',
}

export function describeOkrValidation(error: z.ZodError): string {
  return [...new Set(error.issues.map(issue =>
    issue.code === 'unrecognized_keys'
      ? '包含不支持的字段；ID、项目归属和时间戳由系统生成'
      : issue.code === 'custom'
        ? issue.message
        : (OKR_FIELD_LABELS[String(issue.path[0])] ?? 'OKR 字段格式不正确'),
  ))].join('；')
}
