/**
 * 任务表「按当前可见视图」前端序列化（零 I/O、零墙钟、确定性纯函数）。
 * 所有时间/逾期口径由调用方注入（generatedAt 展示串、today=YYYY-MM-DD），
 * core 不自行取墙钟；不写服务器文件，产物由 client 走 Blob 浏览器下载。
 */
import { taskStatusLabels } from './status.js'
import { isTaskOverdue } from './derived.js'

/** 与 client Task 结构兼容的结构化行（字段全部可选，便于离线单测构造）。 */
export interface ExportTaskRow {
  id: string
  code?: string
  title: string
  description?: string
  assignee?: string
  status: string
  priority?: string
  startDate?: string | null
  dueDate?: string | null
  progress?: number | null
  milestoneId?: string | null
  predecessorIds?: string[]
  checklist?: { id: string, text: string, done: boolean }[] | null
  repoUrl?: string
  branch?: string
  parentId?: string | null
  projectId?: string
}

/** 序列化上下文：展示元信息与注入式口径，core 不触碰环境。 */
export interface TaskExportCtx {
  projectName?: string
  viewName?: string
  filterSummary?: string
  /** 调用方注入的本地展示时间串（如 2026-10-17 14:32）。 */
  generatedAt: string
  /** 本地日历日 YYYY-MM-DD，用于逾期判定；core 不自行取墙钟。 */
  today: string
  /** 里程碑 id → 标题解析器（client 用 milestoneById 注入）。 */
  milestoneTitle?: (id: string) => string | undefined
}

export const TASK_EXPORT_VERSION = '1.0'

function statusLabel(status: string): string {
  return taskStatusLabels[status as keyof typeof taskStatusLabels] ?? status
}

function milestoneName(ctx: TaskExportCtx, row: ExportTaskRow): string {
  const id = row.milestoneId
  return id && ctx.milestoneTitle ? ctx.milestoneTitle(id) ?? '' : ''
}

function progressText(row: ExportTaskRow): string {
  return `${Math.round(Number(row.progress ?? 0))}%`
}

// ---------- CSV（UTF-8 BOM，Excel 直开不乱码） ----------

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** 导出可见行为 CSV；首行带 BOM，行尾 \r\n，列序固定。 */
export function tasksToCsv(rows: ExportTaskRow[], ctx: TaskExportCtx): string {
  const header = ['WBS编号', '标题', '状态', '负责人', '开始', '截止', '优先级', '进度', '里程碑']
  const lines = rows.map(r => [
    r.code ?? '',
    r.title,
    statusLabel(r.status),
    r.assignee ?? '',
    r.startDate ?? '',
    r.dueDate ?? '',
    r.priority ?? '',
    progressText(r),
    milestoneName(ctx, r),
  ].map(csvCell).join(','))
  // 首行 UTF-8 BOM（﻿）保证 Excel 直开不乱码。
  return '\uFEFF' + [header.join(','), ...lines].join('\r\n') + '\r\n'
}

// ---------- Markdown 周报 ----------

function mdCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}

interface SectionRows {
  overdue: ExportTaskRow[]
  blocked: ExportTaskRow[]
  active: ExportTaskRow[]
  done: ExportTaskRow[]
}

function splitRows(rows: ExportTaskRow[], today: string): SectionRows {
  const overdue: ExportTaskRow[] = []
  const blocked: ExportTaskRow[] = []
  const active: ExportTaskRow[] = []
  const done: ExportTaskRow[] = []
  for (const r of rows) {
    if (r.status === 'done') { done.push(r); continue }
    if (isTaskOverdue(r, today)) { overdue.push(r); continue }
    if (r.status === 'blocked') { blocked.push(r); continue }
    active.push(r)
  }
  return { overdue, blocked, active, done }
}

function mdTable(rows: ExportTaskRow[], ctx: TaskExportCtx): string {
  if (!rows.length) return '_（无）_\n'
  const head = '| WBS | 标题 | 负责人 | 截止 | 优先级 | 进度 | 里程碑 |\n| --- | --- | --- | --- | --- | --- | --- |'
  const body = rows.map(r => '| ' + [
    r.code ?? '',
    mdCell(r.title),
    mdCell(r.assignee ?? ''),
    r.dueDate ?? '',
    r.priority ?? '',
    progressText(r),
    mdCell(milestoneName(ctx, r)),
  ].join(' | ') + ' |')
  return head + '\n' + body.join('\n') + '\n'
}

/** 周报式 Markdown：头部元信息 + 完成/逾期/受阻/未完成分区与小计。 */
export function tasksToMarkdown(rows: ExportTaskRow[], ctx: TaskExportCtx): string {
  const { overdue, blocked, active, done } = splitRows(rows, ctx.today)
  const meta = [
    `# ${ctx.projectName ? `${ctx.projectName} · 任务周报` : '任务周报'}`,
    '',
    `- 生成时间：${ctx.generatedAt}`,
    `- 视图：${ctx.viewName ?? '未命名视图'}`,
    ctx.filterSummary ? `- 过滤口径：${ctx.filterSummary}` : null,
    `- 任务数：${rows.length}（已完成 ${done.length} · 进行中 ${active.length} · 受阻 ${blocked.length} · 逾期 ${overdue.length}）`,
  ].filter(Boolean).join('\n')

  const parts = [
    meta,
    '',
    `## 逾期 / 受阻（${overdue.length + blocked.length}）`,
    '',
    `### 已逾期（${overdue.length}）`,
    mdTable(overdue, ctx),
    `### 受阻（${blocked.length}）`,
    mdTable(blocked, ctx),
    `## 未完成（${active.length}）`,
    mdTable(active, ctx),
    `## 已完成（${done.length}）`,
    mdTable(done, ctx),
  ]
  return parts.join('\n') + '\n'
}

// ---------- JSON 结构化（返回对象，由 client stringify） ----------

/** 全字段记录（含解析出的里程碑标题）。 */
export interface ExportRecord {
  id: string
  code: string
  title: string
  description: string
  assignee: string
  status: string
  statusLabel: string
  priority: string
  startDate: string | null
  dueDate: string | null
  progress: number
  milestoneId: string | null
  milestone: string
  predecessorIds: string[]
  checklist: ExportTaskRow['checklist']
  repoUrl: string | undefined
  branch: string | undefined
}

export interface ExportPayload {
  meta: {
    project: string
    view: string
    filterSummary: string
    generatedAt: string
    version: string
    count: number
  }
  records: ExportRecord[]
}

/** 结构化对象（不 stringify，便于断言与二次加工）。 */
export function tasksToJson(rows: ExportTaskRow[], ctx: TaskExportCtx): ExportPayload {
  const records: ExportRecord[] = rows.map(r => ({
    id: r.id,
    code: r.code ?? '',
    title: r.title,
    description: r.description ?? '',
    assignee: r.assignee ?? '',
    status: r.status,
    statusLabel: statusLabel(r.status),
    priority: r.priority ?? '',
    startDate: r.startDate ?? null,
    dueDate: r.dueDate ?? null,
    progress: Math.round(Number(r.progress ?? 0)),
    milestoneId: r.milestoneId ?? null,
    milestone: milestoneName(ctx, r),
    predecessorIds: r.predecessorIds ?? [],
    checklist: r.checklist ?? null,
    repoUrl: r.repoUrl,
    branch: r.branch,
  }))
  return {
    meta: {
      project: ctx.projectName ?? '',
      view: ctx.viewName ?? '未命名视图',
      filterSummary: ctx.filterSummary ?? '',
      generatedAt: ctx.generatedAt,
      version: TASK_EXPORT_VERSION,
      count: records.length,
    },
    records,
  }
}
