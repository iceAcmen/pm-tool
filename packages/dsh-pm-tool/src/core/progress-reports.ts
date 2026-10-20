/** 进度汇报 CRUD：生成时聚合并固化快照，后续源数据变化不回写。 */
import {
  progressReportGenerateSchema,
  progressReportIdSchema,
  progressReportRecordSchema,
  progressReportStatusSchema,
  progressReportUpdateSchema,
  normalizeProgressReportRecord,
  type ProgressReport,
  type ProgressReportStatus,
  type ProgressSnapshot,
  type SelectedRef,
} from './progress-report.js'
import { projectIdSchema } from './project.js'
import { enqueueDomainWrite } from './projects.js'
import { deriveProjectProgress, deriveProgressMap } from './progress-derivation.js'
import { isTaskOverdue } from './derived.js'
import type { PmDomain } from './storage.js'

export class ProgressReportProjectNotFoundError extends Error {}
export class ExcerptReferenceInvalidError extends Error {}

/** B6 只读预览（dry-run）：不写 reports 表，从现有 tasks.progressLog 派生周期内可选进展候选。 */
export interface PreviewCandidate {
  taskId: string
  entryId: string
  revisionId: string
  author: string
  date: string
  content: string
  refs: string[]
}

export interface ReportPreviewInput {
  projectId: string
  periodStart: string
  periodEnd: string
  /** 复合选择器：taskId+entryId(+revisionId)；pl-N 每任务局部序号，禁止裸 entryId 跨任务匹配。 */
  selectedRefs?: SelectedRef[]
}

export function previewProgressReport(domain: PmDomain, input: ReportPreviewInput): {
  projectId: string
  periodStart: string
  periodEnd: string
  candidates: PreviewCandidate[]
} {
  const project = domain.table('projects').get(input.projectId)
  if (!project) throw new ProgressReportProjectNotFoundError(`未找到项目：${input.projectId}`)
  if (input.periodEnd < input.periodStart) {
    throw new ExcerptReferenceInvalidError('周期结束日期不能早于开始日期')
  }
  // 复合选择：按 taskId+entryId 匹配；带 revisionId 时进一步精确到该修订版，避免 pl-N 跨任务撞号。
  const selected = input.selectedRefs ?? null
  const candidates: PreviewCandidate[] = []
  for (const [, task] of domain.table('tasks').entries()) {
    if (task.projectId !== input.projectId) continue
    for (const entry of task.progressLog ?? []) {
      if (entry.deletedAt) continue
      if (entry.date < input.periodStart || entry.date > input.periodEnd) continue
      if (selected && !selected.some(ref =>
        ref.taskId === task.id
        && ref.entryId === entry.id
        && (!ref.revisionId || entry.revisions[entry.revisions.length - 1]?.id === ref.revisionId),
      )) continue
      const current = entry.revisions[entry.revisions.length - 1]
      candidates.push({
        taskId: task.id,
        entryId: entry.id,
        revisionId: current.id,
        author: current.author,
        date: current.date,
        content: current.content,
        refs: current.refs ?? entry.refs ?? [],
      })
    }
  }
  candidates.sort((a, b) => a.date.localeCompare(b.date) || a.entryId.localeCompare(b.entryId, 'en', { numeric: true }))
  return { projectId: input.projectId, periodStart: input.periodStart, periodEnd: input.periodEnd, candidates }
}

/**
 * 写前复核冻结摘录（excerpts 直路径）：
 *  - 任务必须存在且 projectId 与本报告一致（拒跨项目真实条目）；
 *  - 条目存在且未软删（deletedAt 缺省，拒 soft-deleted）；
 *  - 修订版存在，contentSnapshot/author/date 与该修订版真实值一致（拒伪造来源）。
 * sourceKind 字面量、excerpt id 唯一、shape 由 frozenExcerptSchema 在 schema 层先拒；此处任何不符即零写。
 */
function validateExcerptReferences(domain: PmDomain, projectId: string, excerpts: unknown): void {
  if (!Array.isArray(excerpts) || excerpts.length === 0) return
  for (const ex of excerpts) {
    const task = domain.table('tasks').get(ex.taskId)
    if (!task || task.projectId !== projectId) {
      throw new ExcerptReferenceInvalidError(`摘录任务不存在或不属于本报告项目（${projectId}）：${ex.taskId}`)
    }
    const entry = (task.progressLog ?? []).find((e: { id: string; deletedAt?: string }) => e.id === ex.entryId)
    if (!entry || entry.deletedAt) {
      throw new ExcerptReferenceInvalidError(`摘录条目不存在或已软删：${ex.taskId}/${ex.entryId}`)
    }
    const revision = entry.revisions.find((r: { id: string }) => r.id === ex.revisionId)
    if (!revision) {
      throw new ExcerptReferenceInvalidError(`冻结摘录引用不存在：${ex.taskId}/${ex.entryId}/${ex.revisionId}`)
    }
    if (revision.content !== ex.contentSnapshot) {
      throw new ExcerptReferenceInvalidError(`摘录正文与所选修订版不符（${ex.taskId}/${ex.entryId}/${ex.revisionId}），拒绝伪造来源`)
    }
    if (revision.author !== ex.author) {
      throw new ExcerptReferenceInvalidError(`摘录作者与修订版作者不符（${ex.taskId}/${ex.entryId}），拒绝伪造来源`)
    }
    // P3 effective 日期以所选修订版自身 date 为准（编辑可另带日期），不与 entry.date 混用。
    if (revision.date !== ex.date) {
      throw new ExcerptReferenceInvalidError(`摘录日期与所选修订版日期不符（${ex.taskId}/${ex.entryId}/${ex.revisionId}），拒绝伪造来源`)
    }
  }
}

interface FreezeProgressEntry {
  id: string
  date: string
  deletedAt?: string
  revisions: { id: string; author: string; content: string }[]
}

/**
 * B6：按复合选择器（taskId+entryId+可选 revisionId）在同项目内精确冻结指定修订版快照。
 * - 定位到 taskId（项目内）→ entryId → revisionId；缺 revisionId 取当前最新。
 * - 显式带 revisionId 但该版已非最新（预览后源被 edit/append）→ 冲突报错，要求重新预览，绝不静默抓最新。
 * - 冻结后日志再 append 新 revision 不回改本快照；任务/条目不存在、跨项目、已软抛即拒绝零写。
 */
function freezeSelectedEntries(
  domain: PmDomain,
  projectId: string,
  selectedRefs: SelectedRef[],
  capturedAt: string,
): unknown[] {
  const out: unknown[] = []
  const seen = new Set<string>()
  for (const ref of selectedRefs) {
    const key = `${ref.taskId}/${ref.entryId}/${ref.revisionId ?? 'latest'}`
    if (seen.has(key)) continue
    seen.add(key)
    const task = domain.table('tasks').get(ref.taskId)
    if (!task || task.projectId !== projectId) {
      throw new ExcerptReferenceInvalidError(`选中任务不存在或不属于本项目：${ref.taskId}`)
    }
    const entry = (task.progressLog ?? []).find((e: FreezeProgressEntry) => e.id === ref.entryId)
    if (!entry || entry.deletedAt) {
      throw new ExcerptReferenceInvalidError(`选中的进展条目不存在或已删除：${ref.taskId}/${ref.entryId}`)
    }
    const latest = entry.revisions[entry.revisions.length - 1]
    let revision = latest
    if (ref.revisionId) {
      const picked = entry.revisions.find(r => r.id === ref.revisionId)
      if (!picked) {
        throw new ExcerptReferenceInvalidError(`选中的修订版不存在：${ref.taskId}/${ref.entryId}/${ref.revisionId}`)
      }
      if (picked.id !== latest.id) {
        throw new ExcerptReferenceInvalidError(`源已更新（${ref.taskId}/${ref.entryId} 现最新为 ${latest.id}），请重新预览后再生成`)
      }
      revision = picked
    }
    out.push({
      id: `ex-${out.length + 1}`,
      taskId: task.id,
      sourceKind: 'progress' as const,
      entryId: entry.id,
      revisionId: revision.id,
      contentSnapshot: revision.content,
      author: revision.author,
      date: revision.date,
      capturedAt,
    })
  }
  return out
}

function inRange(value: string, start: string, end: string): boolean {
  return value >= start && value <= end
}

function collectSnapshot(
  domain: PmDomain,
  projectId: string,
  start: string,
  end: string,
  snapshotAt: string,
): ProgressSnapshot {
  const project = domain.table('projects').get(projectId)!
  const tasks = [...domain.table('tasks').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId)
  const milestones = [...domain.table('milestones').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId)
  const meetings = [...domain.table('meetings').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId && inRange(item.meetingDate, start, end))
  const riskIssues = [...domain.table('risk_issues').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId)
  const today = snapshotAt.slice(0, 10)
  const exceptions: ProgressSnapshot['exceptions'] = []
  // 先按 projectId 过滤（上方已做）再派生真源——绝不跨项目汇总。
  const progressMap = deriveProgressMap(tasks)

  for (const task of tasks) {
    if (task.status === 'blocked') {
      exceptions.push({
        kind: 'blocked_task', severity: 'critical', id: task.id, title: task.title,
        detail: '任务当前处于受阻状态', owner: task.assignee, dueDate: task.dueDate ?? null,
      })
    }
    // 逾期口径统一走 derived.isTaskOverdue（未完成 且 progress<100 且 dueDate<today）。
    if (isTaskOverdue(task, today)) {
      // 逾期文案诚实化：有客观清单信号报客观进度；否则旁注原手填值并标明未入客观口径。
      const prog = progressMap.get(task.id)
      exceptions.push({
        kind: 'overdue_task', severity: 'critical', id: task.id, title: task.title,
        detail: prog && prog.value !== null
          ? `任务已逾期，客观进度 ${prog.value}%`
          : `任务已逾期，原手填进度 ${task.progress}%（未入客观口径）`,
        owner: task.assignee, dueDate: task.dueDate ?? null,
      })
    }
  }
  for (const milestone of milestones.filter(item => ['at_risk', 'missed'].includes(item.status))) {
    exceptions.push({
      kind: 'milestone',
      severity: milestone.status === 'missed' ? 'critical' : 'warning',
      id: milestone.id,
      title: milestone.title,
      detail: milestone.status === 'missed' ? '里程碑已错过' : '里程碑存在风险',
      owner: '',
      dueDate: milestone.targetDate,
    })
  }
  for (const item of riskIssues.filter(item =>
    item.status !== 'closed' && ['high', 'critical'].includes(item.impact))) {
    exceptions.push({
      kind: 'risk_issue',
      severity: item.impact === 'critical' ? 'critical' : 'warning',
      id: item.id,
      title: item.title,
      detail: `${item.type === 'risk' ? '风险' : '问题'}未关闭，影响为 ${item.impact}`,
      owner: item.owner,
      dueDate: item.dueDate,
    })
  }
  for (const [, meeting] of domain.table('meetings').entries()) {
    if (meeting.projectId !== projectId) continue
    for (const action of meeting.actions) {
      if (!['done', 'cancelled'].includes(action.status) && action.dueDate && action.dueDate < today) {
        exceptions.push({
          kind: 'overdue_action', severity: 'warning', id: `${meeting.id}/${action.id}`,
          title: action.title, detail: `会议行动项已逾期（${meeting.title}）`,
          owner: action.owner, dueDate: action.dueDate,
        })
      }
    }
  }

  const periodMilestones = milestones
    .filter(item => inRange(item.targetDate, start, end)
      || Boolean(item.achievedDate && inRange(item.achievedDate, start, end)))
    .map(item => ({ id: item.id, title: item.title, targetDate: item.targetDate, status: item.status }))
  // v0.8：项目平均进度只认真源——有非空 checklist 的后代叶子等权平均（真源内部只 round 一次）。
  // 父/中间节点手填 progress 一律不入分母；项目无覆盖叶子 → null（证据不足，不是 0）。
  const projectProgress = deriveProjectProgress(tasks, projectId)
  return {
    project: { name: project.name, owner: project.owner, status: project.status, targetDate: project.targetDate },
    tasks: {
      total: tasks.length,
      todo: tasks.filter(item => item.status === 'todo').length,
      inProgress: tasks.filter(item => item.status === 'in_progress').length,
      blocked: tasks.filter(item => item.status === 'blocked').length,
      done: tasks.filter(item => item.status === 'done').length,
      averageProgress: projectProgress.value,
      calcVersion: 1,
    },
    milestones: {
      total: milestones.length,
      achieved: milestones.filter(item => item.status === 'achieved').length,
      atRisk: milestones.filter(item => item.status === 'at_risk').length,
      missed: milestones.filter(item => item.status === 'missed').length,
    },
    meetings: {
      inPeriod: meetings.length,
      decisions: meetings.reduce((sum, item) => sum + item.decisions.length, 0),
    },
    periodMilestones,
    periodMeetings: meetings.map(item => ({
      id: item.id, title: item.title, meetingDate: item.meetingDate, decisions: [...item.decisions],
    })),
    exceptions: exceptions.sort((a, b) =>
      (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1)
      || (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
      || a.id.localeCompare(b.id, 'en', { numeric: true }),
    ),
  }
}

export function generateProgressReport(domain: PmDomain, input: unknown): Promise<ProgressReport> {
  const fields = progressReportGenerateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    if (!domain.table('projects').get(fields.projectId)) {
      throw new ProgressReportProjectNotFoundError(`未找到项目：${fields.projectId}`)
    }
    validateExcerptReferences(domain, fields.projectId, fields.excerpts)
    const table = domain.table('reports')
    const at = new Date().toISOString()
    const excerpts = fields.excerpts
      ?? (fields.selectedRefs?.length ? freezeSelectedEntries(domain, fields.projectId, fields.selectedRefs, at) : undefined)
    let max = 0n
    for (const key of table.keys()) {
      const match = /^rpt-(\d+)$/.exec(key)
      if (match && BigInt(match[1]) > max) max = BigInt(match[1])
    }
    const id = `rpt-${String(max + 1n).padStart(4, '0')}`
    const project = domain.table('projects').get(fields.projectId)!
    const record = progressReportRecordSchema.parse({
      projectId: fields.projectId,
      periodStart: fields.periodStart,
      periodEnd: fields.periodEnd,
      title: fields.title ?? `${project.name} ${fields.periodStart} 至 ${fields.periodEnd} 进度汇报`,
      status: fields.status,
      executiveSummary: fields.executiveSummary,
      completedWork: fields.completedWork,
      nextPlans: fields.nextPlans,
      blockers: fields.blockers,
      ...(excerpts ? { excerpts } : {}),
      id,
      snapshotAt: at,
      snapshot: collectSnapshot(domain, fields.projectId, fields.periodStart, fields.periodEnd, at),
      sourceType: fields.sourceType,
      sourceSessionId: fields.sourceType === 'session' ? fields.sourceSessionId : null,
      createdAt: at,
      updatedAt: at,
    })
    await table.put(id, record)
    return structuredClone(record)
  })
}

export function listProgressReports(
  domain: PmDomain,
  projectId: string,
  status?: ProgressReportStatus,
): ProgressReport[] {
  projectIdSchema.parse(projectId)
  if (status) progressReportStatusSchema.parse(status)
  if (!domain.table('projects').get(projectId)) {
    throw new ProgressReportProjectNotFoundError(`未找到项目：${projectId}`)
  }
  return [...domain.table('reports').entries()].map(([, value]) => value)
    .filter(item => item.projectId === projectId && (!status || item.status === status))
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd) || b.id.localeCompare(a.id))
    .map(item => structuredClone(normalizeProgressReportRecord(item)))
}

export function getProgressReport(domain: PmDomain, id: string): ProgressReport | undefined {
  progressReportIdSchema.parse(id)
  const record = domain.table('reports').get(id)
  return record ? structuredClone(normalizeProgressReportRecord(record)) : undefined
}

export function updateProgressReport(domain: PmDomain, id: string, input: unknown): Promise<ProgressReport | undefined> {
  progressReportIdSchema.parse(id)
  const fields = progressReportUpdateSchema.parse(input)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('reports')
    const current = table.get(id)
    if (!current) return undefined
    const normalizedCurrent = normalizeProgressReportRecord(current)
    validateExcerptReferences(domain, normalizedCurrent.projectId, fields.excerpts)
    const next = progressReportRecordSchema.parse({
      ...normalizedCurrent,
      ...fields,
      id: normalizedCurrent.id,
      projectId: normalizedCurrent.projectId,
      periodStart: normalizedCurrent.periodStart,
      periodEnd: normalizedCurrent.periodEnd,
      snapshotAt: normalizedCurrent.snapshotAt,
      snapshot: normalizedCurrent.snapshot,
      sourceType: normalizedCurrent.sourceType,
      sourceSessionId: normalizedCurrent.sourceSessionId,
      createdAt: normalizedCurrent.createdAt,
      updatedAt: new Date().toISOString(),
    })
    await table.put(id, next)
    return structuredClone(next)
  })
}

export function deleteProgressReport(domain: PmDomain, id: string): Promise<ProgressReport | undefined> {
  progressReportIdSchema.parse(id)
  return enqueueDomainWrite(domain, async () => {
    const table = domain.table('reports')
    const current = table.get(id)
    if (!current) return undefined
    await table.delete(id)
    return structuredClone(current)
  })
}
