/**
 * X6-L1 即时复盘草稿（轻量草稿，克制文本）。
 *
 * 定位（能力边界，勿越界）：
 * - 任务标记 done 时自动生成一份【草稿】，供人事后补材料；草稿不进定稿流、不替代验收。
 * - 业务完成（status=done）≠ 复盘定稿（final）；final 只能由人经 `/pm reflect <id> final` 主动定稿。
 * - 句级标注：known（已核/可直接引用）/ pending（待核、未验证）/ blank（待补、证据缺失留白）；
 *   证据不足只留白，绝不编造结论、不造积分/连胜/动效/徽章。
 * - done 触发钩子 best-effort：草稿写失败仅 console.warn，绝不阻断任务落库。
 *
 * 契约见 docs/design/deep-integration-v2-p0-dev.md §三（X6-L1）。
 */
import { enqueueDomainWrite } from './projects.js'
import { reflectionRecordSchema, type PmDomain, type ReflectionRecord } from './storage.js'
import type { Task } from './task.js'
import { localTodayIso } from './derived.js'

export class ReflectionNotFoundError extends Error {}

/** 句级标注：known=已核 / pending=待核未验证 / blank=待补留白。 */
export type ReflectionMark = ReflectionRecord['draft']['lines'][number]['mark']

/** 描述截断上限（与 ask 上下文备注口径同量级，避免长文淹没草稿）。 */
const DESCRIPTION_MAX = 200

function makeId(): string {
  return `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed
}

/**
 * 保守标注（纯函数，可单测）：人补材料时对每一行文本定级。
 * 默认 known；出现「待核/未验证」字样判 pending；出现「待补」判 blank。
 * 不做语义猜测，只按显式字样分级。
 */
export function classifyDraftMark(text: string): ReflectionMark {
  if (/待补/.test(text)) return 'blank'
  if (/待核|未验证/.test(text)) return 'pending'
  return 'known'
}

/**
 * 把人补的 markdown 正文拆成草稿行与留白清单（纯函数，可单测）。
 * 每行一条；空行/纯分隔线跳过；句级 mark 由 classifyDraftMark 保守标注；
 * blank 行同时进入 gaps（证据/材料缺失留白，不编造）。
 */
export function parseDraftMarkdown(markdown: string): {
  lines: { text: string, mark: ReflectionMark }[]
  gaps: string[]
} {
  const lines: { text: string, mark: ReflectionMark }[] = []
  const gaps: string[] = []
  for (const raw of markdown.split(/\r?\n/)) {
    const text = raw.trim().replace(/^[-*•]\s+/, '').trim()
    if (!text) continue
    if (/^#{1,6}\s+/.test(text) || /^[-*_]{3,}$/.test(text)) continue
    const mark = classifyDraftMark(text)
    lines.push({ text, mark })
    if (mark === 'blank') gaps.push(text)
  }
  return { lines, gaps }
}

/**
 * 构造初始草稿（纯函数，可单测）：
 * - 首行 known 记录完成时刻（completedDate 优先，缺省落本地今天，不编造精确时刻）；
 * - description 存在则追加一条 known（截断 200 字）；
 * - 已登记证据链接 / 已挂交付物 ID 各追加一条 known（只陈述「已连接」，不评判质量）；
 * - 无证据链接、无清单、无交付物 ID 时，gap 留白「待补：交付验收材料与证据链接」。
 */
export function buildReflectionDraft(
  task: Pick<Task, 'title' | 'description' | 'completedDate' | 'evidenceUrl' | 'checklist' | 'deliverableId'>,
  at: string,
): ReflectionRecord['draft'] {
  const lines: ReflectionRecord['draft']['lines'] = [
    { text: `完成时刻 ${task.completedDate ?? localTodayIso()}`, mark: 'known' },
  ]
  const description = truncate(task.description ?? '', DESCRIPTION_MAX)
  if (description) lines.push({ text: `任务说明：${description}`, mark: 'known' })
  if (task.evidenceUrl) lines.push({ text: '已登记客观佐证链接（质量由人复核）', mark: 'known' })
  if (task.deliverableId) {
    lines.push({ text: `关联交付物 ${task.deliverableId}（连接字段；交付物本身由交付物台账维护，本字段不自动生成交付物）`, mark: 'known' })
  }
  const gaps: string[] = []
  const hasChecklist = Array.isArray(task.checklist) && task.checklist.length > 0
  if (!task.evidenceUrl && !hasChecklist && !task.deliverableId) {
    gaps.push('待补：交付验收材料与证据链接')
  }
  return {
    title: `${task.title} · 完成即时复盘（草稿）`,
    at,
    lines,
    gaps,
  }
}

/** 按任务 id 查最新一条复盘记录（同步读，深拷贝）。 */
export function getReflection(domain: PmDomain, taskId: string): ReflectionRecord | undefined {
  let latest: ReflectionRecord | undefined
  for (const [, rec] of domain.table('reflections').entries()) {
    const r = rec as ReflectionRecord
    if (r.taskId !== taskId) continue
    if (!latest || r.createdAt > latest.createdAt) latest = r
  }
  return latest ? structuredClone(latest) : undefined
}

/** 列出某项目全部复盘记录（按创建时间升序，深拷贝）。 */
export function listReflections(domain: PmDomain, projectId: string): ReflectionRecord[] {
  return [...domain.table('reflections').entries()]
    .map(([, rec]) => rec as ReflectionRecord)
    .filter(rec => rec.projectId === projectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(rec => structuredClone(rec))
}

/**
 * done 事件钩子：任务刚落库为 done 且该任务尚无复盘记录时创建草稿。
 * 幂等：已有 draft/final 记录则直接返回既有记录，不重复建。
 * best-effort 由调用方 catch；本函数自身仍走串行写队列，失败向外抛。
 */
export function ensureReflectionOnDone(domain: PmDomain, task: Task): Promise<ReflectionRecord | undefined> {
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('reflections')
    const existing = getReflection(domain, task.id)
    if (existing) return structuredClone(existing)
    const at = new Date().toISOString()
    const record = reflectionRecordSchema.parse({
      id: makeId(),
      projectId: task.projectId,
      taskId: task.id,
      status: 'draft',
      sourceEvent: 'task-done',
      draft: buildReflectionDraft(task, at),
      createdAt: at,
      updatedAt: at,
    })
    await table.put(record.id, record)
    return structuredClone(record)
  })
}

/** 人定稿：draft → final。已 final 原样返回；不存在抛 ReflectionNotFoundError。 */
export function finalizeReflection(domain: PmDomain, id: string): Promise<ReflectionRecord | undefined> {
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('reflections')
    const current = table.get(id) as ReflectionRecord | undefined
    if (!current) throw new ReflectionNotFoundError(`未找到复盘记录：${id}`)
    if (current.status === 'final') return structuredClone(current)
    const next = reflectionRecordSchema.parse({
      ...current,
      status: 'final',
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

/**
 * 人补材料：重写 draft.lines 与 gaps（不自动生成内容），不改 status（定稿仍只走 finalizeReflection），
 * 句级 mark 保守标注。
 */
export function updateReflectionDraft(
  domain: PmDomain,
  id: string,
  markdown: string,
): Promise<ReflectionRecord | undefined> {
  const parsed = parseDraftMarkdown(markdown)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('reflections')
    const current = table.get(id) as ReflectionRecord | undefined
    if (!current) throw new ReflectionNotFoundError(`未找到复盘记录：${id}`)
    const next = reflectionRecordSchema.parse({
      ...current,
      draft: {
        ...current.draft,
        lines: parsed.lines,
        gaps: parsed.gaps,
      },
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}
