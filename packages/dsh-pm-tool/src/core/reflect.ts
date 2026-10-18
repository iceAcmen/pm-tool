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
import type { Milestone } from './milestone.js'
import type { Deliverable } from './deliverable.js'
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

/** X6-L2：反查里程碑/交付物关联任务所需的窄字段（不吃完整 Task，便于纯函数单测）。 */
export interface LinkedTaskDraftInput {
  id: string
  title: string
  status: string
  progress?: number | null
  evidenceUrl?: string
}

/**
 * 关联任务清单行的保守定级（纯函数）：
 * - done 且有佐证链接 → known（只陈述「已连接」，不评判质量）；
 * - done 但无佐证 → pending（已完成待核）并进 gaps 留白；
 * - 未完成 → pending（未完成）并进 gaps 留白，绝不编造完成结论。
 */
function linkedTaskLines(
  linkedTasks: LinkedTaskDraftInput[],
  lines: ReflectionRecord['draft']['lines'],
  gaps: string[],
): void {
  for (const task of linkedTasks) {
    const done = task.status === 'done'
    const hasEvidence = !!task.evidenceUrl
    if (done && hasEvidence) {
      lines.push({ text: `关联任务已完成并有佐证：${task.title}（${task.id}）`, mark: 'known' })
    } else if (done) {
      lines.push({
        text: `关联任务已完成待核：${task.title}（${task.id}，缺佐证链接，质量由人复核）`,
        mark: 'pending',
      })
      gaps.push(`待补：任务 ${task.id}「${task.title}」的完成佐证材料`)
    } else {
      lines.push({
        text: `关联任务未完成：${task.title}（${task.id}，当前状态 ${task.status}）`,
        mark: 'pending',
      })
      gaps.push(`待补：关联任务 ${task.id}「${task.title}」尚未闭环（未完成/缺证据，留白不编造）`)
    }
  }
}

/**
 * X6-L2 里程碑达成复盘草稿（纯函数，可单测）：
 * - title=`${title} · 里程碑达成复盘（草稿）`；
 * - known 行=达成日期（缺省落本地今天，不编造精确时刻）+ 说明/达成标准摘要（截断 200 字）；
 * - 关联任务清单行（task.milestoneId 反查，未完成/无证据任务标 pending）；
 * - gaps=未达成/缺证据清单，留白不编造；无关联任务时留白提示由人核对覆盖范围。
 * 克制清单不变：无积分/连胜/动效/徽章；句级已核/待核/留白；仅事件触发。
 */
export function buildMilestoneReflectionDraft(
  milestone: Pick<Milestone, 'title' | 'achievedDate' | 'description'>,
  linkedTasks: LinkedTaskDraftInput[],
  at: string,
): ReflectionRecord['draft'] {
  const lines: ReflectionRecord['draft']['lines'] = [
    { text: `达成时刻 ${milestone.achievedDate ?? localTodayIso()}`, mark: 'known' },
  ]
  const description = truncate(milestone.description ?? '', DESCRIPTION_MAX)
  if (description) lines.push({ text: `里程碑说明/达成标准：${description}`, mark: 'known' })
  const gaps: string[] = []
  if (linkedTasks.length === 0) {
    gaps.push('待补：未反查到关联任务清单，达成覆盖范围由人核对（留白不编造）')
  }
  linkedTaskLines(linkedTasks, lines, gaps)
  return {
    title: `${milestone.title} · 里程碑达成复盘（草稿）`,
    at,
    lines,
    gaps,
  }
}

/**
 * X6-L2 交付验收复盘草稿（纯函数，可单测）：
 * - title=`${name} · 交付验收复盘（草稿）`；
 * - known 行=验收状态 + 版本/存放位置 + 说明摘要 + 已登记仓库连接（只陈述已连接，不评判质量）；
 * - 关联任务行（task.deliverableId 反查，未完成/无证据任务标 pending）；
 * - gaps=验收证据缺失清单，留白不编造。
 */
export function buildDeliverableReflectionDraft(
  deliverable: Pick<Deliverable, 'name' | 'version' | 'status' | 'location' | 'description' | 'repoUrl'>,
  linkedTasks: LinkedTaskDraftInput[],
  at: string,
): ReflectionRecord['draft'] {
  const lines: ReflectionRecord['draft']['lines'] = [
    { text: `验收状态：${deliverable.status}（验收结论由人确认，草稿不替代验收）`, mark: 'known' },
    {
      text: `版本/存放：版本 ${deliverable.version || '未填写'}；位置 ${deliverable.location || '未填写'}`,
      mark: 'known',
    },
  ]
  const description = truncate(deliverable.description ?? '', DESCRIPTION_MAX)
  if (description) lines.push({ text: `交付物说明：${description}`, mark: 'known' })
  if (deliverable.repoUrl) {
    lines.push({ text: `已登记仓库连接（质量由人复核）：${deliverable.repoUrl}`, mark: 'known' })
  }
  const gaps: string[] = []
  if (linkedTasks.length === 0) {
    gaps.push('待补：未反查到关联任务清单，验收覆盖范围由人核对（留白不编造）')
  }
  linkedTaskLines(linkedTasks, lines, gaps)
  const anyTaskEvidence = linkedTasks.some(task => task.evidenceUrl)
  if (!anyTaskEvidence && !deliverable.repoUrl) {
    gaps.push('待补：验收材料与证据链接')
  }
  return {
    title: `${deliverable.name} · 交付验收复盘（草稿）`,
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

/**
 * X6-L2 里程碑达成事件钩子：状态刚变 achieved 且该里程碑尚无复盘记录时创建草稿。
 * 幂等：已有 draft/final 记录（按 milestoneId 匹配）则直接返回既有记录，不重复建。
 * best-effort 由调用方 catch；本函数自身仍走串行写队列，失败向外抛。
 */
export function ensureReflectionOnMilestone(
  domain: PmDomain,
  milestone: Milestone,
): Promise<ReflectionRecord | undefined> {
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('reflections')
    for (const [, rec] of table.entries()) {
      const existing = rec as ReflectionRecord
      if (existing.milestoneId === milestone.id) return structuredClone(existing)
    }
    const linkedTasks = [...domain.table('tasks').entries()]
      .map(([, task]) => task as Task)
      .filter(task => task.milestoneId === milestone.id)
    const at = new Date().toISOString()
    const record = reflectionRecordSchema.parse({
      id: makeId(),
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      status: 'draft',
      sourceEvent: 'milestone-achieved',
      draft: buildMilestoneReflectionDraft(milestone, linkedTasks, at),
      createdAt: at,
      updatedAt: at,
    })
    await table.put(record.id, record)
    return structuredClone(record)
  })
}

/**
 * X6-L2 交付验收事件钩子：状态刚变 accepted 且该交付物尚无复盘记录时创建草稿。
 * 幂等：已有 draft/final 记录（按 deliverableId 匹配）则直接返回既有记录，不重复建。
 * best-effort 由调用方 catch；本函数自身仍走串行写队列，失败向外抛。
 */
export function ensureReflectionOnDeliverable(
  domain: PmDomain,
  deliverable: Deliverable,
): Promise<ReflectionRecord | undefined> {
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('reflections')
    for (const [, rec] of table.entries()) {
      const existing = rec as ReflectionRecord
      if (existing.deliverableId === deliverable.id) return structuredClone(existing)
    }
    const linkedTasks = [...domain.table('tasks').entries()]
      .map(([, task]) => task as Task)
      .filter(task => task.deliverableId === deliverable.id)
    const at = new Date().toISOString()
    const record = reflectionRecordSchema.parse({
      id: makeId(),
      projectId: deliverable.projectId,
      deliverableId: deliverable.id,
      status: 'draft',
      sourceEvent: 'deliverable-accepted',
      draft: buildDeliverableReflectionDraft(deliverable, linkedTasks, at),
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
