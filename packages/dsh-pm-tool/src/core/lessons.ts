/**
 * P2 X3 失败经验：失败/烂尾条目的经验沉淀（原因/教训/避免方法）。
 *
 * 纪律（复用 X6 草稿纪律，能力边界勿越界）：
 * - 句级 known（已核）/ pending（待核未验证）/ blank（待补留白）；证据不足只留白，绝不编造结论；
 * - 无积分/徽章；draft → final 仅由人经 `lesson final` 触发，草稿不自动定稿；
 * - 纯逻辑 + 领域写队列；不调模型、不自动从 wrapped 任务生成（入口由人显式录入）。
 *
 * 契约见 docs/design/deep-integration-v2-p2-dev.md §五。
 */
import { enqueueDomainWrite } from './projects.js'
import { lessonRecordSchema, type LessonRecord, type PmDomain } from './storage.js'
import { parseDraftMarkdown, type ReflectionMark } from './reflect.js'

export type LessonMark = ReflectionMark

export class LessonNotFoundError extends Error {}
export class LessonProjectNotFoundError extends Error {}
export class LessonTaskRefNotFoundError extends Error {}

/** add 入参：projectId 由命令层单独传；正文可给 markdown 或句级 lines，gaps 可显式补。 */
export interface LessonAddInput {
  projectId: string
  taskId?: string | null
  markdown?: string
  lines?: { text: string, mark?: LessonMark }[]
  gaps?: string[]
}

function makeId(): string {
  return `lesson-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const MARKS: readonly LessonMark[] = ['known', 'pending', 'blank']

/**
 * 把人录入内容归一成句级 lines + gaps（纯函数，可单测）：
 * - 优先 markdown（走 X6 parseDraftMarkdown：待核/未验证→pending，待补→blank 并进 gaps）；
 * - 否则用句级 lines（mark 缺省 known，非法 mark 按 known 保守处理；blank 行并进 gaps）；
 * - 两者都空 → 一条留白 gap，不编造任何经验结论。
 */
export function normalizeLessonDraft(input: {
  markdown?: string
  lines?: { text: string, mark?: LessonMark }[]
  gaps?: string[]
}): { lines: { text: string, mark: LessonMark }[], gaps: string[] } {
  const gaps: string[] = []
  if (Array.isArray(input.gaps)) {
    for (const g of input.gaps) {
      const text = String(g ?? '').trim()
      if (text && !gaps.includes(text)) gaps.push(text)
    }
  }

  const markdown = (input.markdown ?? '').trim()
  if (markdown) {
    const parsed = parseDraftMarkdown(markdown)
    for (const g of parsed.gaps) if (!gaps.includes(g)) gaps.push(g)
    return { lines: parsed.lines, gaps }
  }

  const lines: { text: string, mark: LessonMark }[] = []
  if (Array.isArray(input.lines)) {
    for (const raw of input.lines) {
      const text = String(raw?.text ?? '').trim()
      if (!text) continue
      const mark: LessonMark = MARKS.includes(raw?.mark as LessonMark) ? raw.mark as LessonMark : 'known'
      lines.push({ text, mark })
      if (mark === 'blank' && !gaps.includes(text)) gaps.push(text)
    }
  }

  if (!lines.length && !gaps.length) {
    gaps.push('待补：失败原因/教训/避免方法留白，由人补充（证据不足不编造）')
  }
  return { lines, gaps }
}

/** 校验关联任务：可空；给了必须存在且同项目。 */
function validateTaskRef(domain: PmDomain, projectId: string, taskId?: string | null): void {
  if (!taskId) return
  const task = domain.table('tasks').get(taskId)
  if (!task || task.projectId !== projectId) {
    throw new LessonTaskRefNotFoundError(`关联任务 ${taskId} 不存在或不属于项目 ${projectId}`)
  }
}

/** 人录入一条失败经验（draft）。projectId 必须存在；taskId 可空且须同项目。 */
export async function addLesson(domain: PmDomain, input: unknown): Promise<LessonRecord> {
  const fields = (input ?? {}) as Partial<LessonAddInput>
  const projectId = String(fields.projectId ?? '').trim()
  if (!projectId) throw new LessonProjectNotFoundError('缺少项目 ID')
  if (!domain.table('projects').get(projectId)) {
    throw new LessonProjectNotFoundError(`未找到项目：${projectId}`)
  }
  validateTaskRef(domain, projectId, fields.taskId ?? null)
  const { lines, gaps } = normalizeLessonDraft({
    markdown: fields.markdown,
    lines: fields.lines,
    gaps: fields.gaps,
  })

  return enqueueDomainWrite(domain, async () => {
    const at = new Date().toISOString()
    const record = lessonRecordSchema.parse({
      id: makeId(),
      projectId,
      taskId: fields.taskId || undefined,
      status: 'draft',
      lines,
      gaps,
      createdAt: at,
      updatedAt: at,
    })
    await domain.table('lessons').put(record.id, record)
    return structuredClone(record)
  })
}

/** 按 id 读取（深拷贝）；不存在返回 undefined。 */
export function getLesson(domain: PmDomain, id: string): LessonRecord | undefined {
  const record = domain.table('lessons').get(id) as LessonRecord | undefined
  return record ? structuredClone(record) : undefined
}

/** 列出某项目全部经验（按创建时间升序，深拷贝，只读）。 */
export function listLessons(domain: PmDomain, projectId: string): LessonRecord[] {
  return [...domain.table('lessons').entries()]
    .map(([, rec]) => rec as LessonRecord)
    .filter(rec => rec.projectId === projectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(rec => structuredClone(rec))
}

/** 人定稿：draft → final；已 final 原样返回；不存在抛 LessonNotFoundError。 */
export function finalizeLesson(domain: PmDomain, id: string): Promise<LessonRecord | undefined> {
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('lessons')
    const current = table.get(id) as LessonRecord | undefined
    if (!current) throw new LessonNotFoundError(`未找到经验记录：${id}`)
    if (current.status === 'final') return structuredClone(current)
    const next = lessonRecordSchema.parse({
      ...current,
      status: 'final',
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

/** 人补材料：重写 lines/gaps（句级保守标注），不改 status（定稿只走 finalizeLesson）。 */
export function updateLessonDraft(
  domain: PmDomain,
  id: string,
  markdown: string,
): Promise<LessonRecord | undefined> {
  const parsed = normalizeLessonDraft({ markdown })
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('lessons')
    const current = table.get(id) as LessonRecord | undefined
    if (!current) throw new LessonNotFoundError(`未找到经验记录：${id}`)
    const next = lessonRecordSchema.parse({
      ...current,
      lines: parsed.lines,
      gaps: parsed.gaps,
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}
