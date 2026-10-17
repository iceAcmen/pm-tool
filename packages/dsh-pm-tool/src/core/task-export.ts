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

// ---------- 只读自包含 HTML 快照（零外链 / 无脚本 / 无可操作 CTA） ----------

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface StatusChip {
  label: string
  dot: string
  text: string
}

function chipFor(row: ExportTaskRow, today: string): StatusChip {
  if (isTaskOverdue(row, today)) return { label: '延期', dot: 'rgb(239,68,68)', text: 'rgb(239,68,68)' }
  switch (row.status) {
    case 'done': return { label: statusLabel('done'), dot: 'rgb(34,197,94)', text: 'rgb(28,28,30)' }
    case 'in_progress': return { label: statusLabel('in_progress'), dot: 'rgb(65,118,230)', text: 'rgb(28,28,30)' }
    case 'blocked': return { label: statusLabel('blocked'), dot: 'rgb(245,158,11)', text: 'rgb(28,28,30)' }
    default: return { label: statusLabel('todo'), dot: 'rgb(212,212,212)', text: 'rgb(127,130,135)' }
  }
}

/**
 * 自包含只读 HTML：全部 CSS 内联、无外链字体/图片、无脚本、无可操作按钮；
 * 冻结于生成时刻，可作为本地静态文件自行转发。
 */
export function buildTaskSnapshotHtml(rows: ExportTaskRow[], ctx: TaskExportCtx): string {
  const bodyRows = rows.map(r => {
    const chip = chipFor(r, ctx.today)
    return `<tr>
  <td class="c-code">${escapeHtml(r.code ?? '')}</td>
  <td class="c-title">${escapeHtml(r.title)}</td>
  <td><span class="chip"><span class="dot" style="background:${chip.dot}"></span><span style="color:${chip.text}">${chip.label}</span></span></td>
  <td>${escapeHtml(r.assignee ?? '')}</td>
  <td>${escapeHtml(r.startDate ?? '')}</td>
  <td>${escapeHtml(r.dueDate ?? '')}</td>
  <td>${escapeHtml(r.priority ?? '')}</td>
  <td class="num">${progressText(r)}</td>
  <td>${escapeHtml(milestoneName(ctx, r))}</td>
</tr>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(ctx.projectName ?? '任务只读快照')} · 只读快照</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  /* P2-2：自包含只读快照，中性值对齐冻结规范（surface-2 #f5f6f7 / muted #696e74 AA / md 12 圆角），无外链 */
  body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:#f5f6f7;color:rgb(28,28,30);font-size:14px;line-height:1.5;font-variant-numeric:tabular-nums;padding:28px 18px}
  .snapshot{max-width:1080px;margin:0 auto;background:#fff;border:1px solid rgba(16,18,20,.09);border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(16,18,20,.05)}
  .snap-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:13px 18px;background:#f5f6f7;border-bottom:1px solid rgba(16,18,20,.09);font-size:12.5px;color:#696e74}
  .snap-lock{display:inline-flex;align-items:center;justify-content:center;color:#696e74}
  .snap-bar b{color:rgb(28,28,30);font-weight:650}
  .snap-bar .ro{margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#696e74;background:#fff;border:1px solid rgba(16,18,20,.09);border-radius:999px;padding:3px 10px}
  .snap-note{padding:10px 18px;border-bottom:1px solid rgba(16,18,20,.05);font-size:12px;color:#696e74}
  .snap-body{padding:8px 18px 14px;overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;font-size:11.5px;font-weight:650;color:#696e74;padding:9px 10px;border-bottom:1px solid rgba(16,18,20,.09);white-space:nowrap}
  td{padding:10px;border-bottom:1px solid rgba(16,18,20,.05);color:rgb(28,28,30);vertical-align:top}
  tr:last-child td{border-bottom:0}
  .c-code{color:#696e74;white-space:nowrap}
  .c-title{font-weight:600;min-width:180px}
  .num{text-align:right;white-space:nowrap}
  .chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap}
  .dot{width:7px;height:7px;border-radius:50%;display:inline-block}
  .snap-foot{padding:11px 18px;border-top:1px solid rgba(16,18,20,.05);font-size:11.5px;color:#696e74}
</style>
</head>
<body>
<div class="snapshot">
  <div class="snap-bar">
    <!-- P2-2：锁用内联 SVG（非 emoji），当前色跟随 muted -->
    <span class="snap-lock" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
    <b>只读快照</b>
    <span>· 生成于 ${escapeHtml(ctx.generatedAt)} · 来自视图「${escapeHtml(ctx.viewName ?? '未命名视图')}」${ctx.filterSummary ? ` · ${escapeHtml(ctx.filterSummary)}` : ''}</span>
    <span class="ro">只读 · 不可编辑</span>
  </div>
  <div class="snap-note">此页冻结于生成时刻，不随台账变化；本地静态文件，可自行转发，无需联网。</div>
  <div class="snap-body">
    <table>
      <thead><tr><th>WBS编号</th><th>标题</th><th>状态</th><th>负责人</th><th>开始</th><th>截止</th><th>优先级</th><th style="text-align:right">进度</th><th>里程碑</th></tr></thead>
      <tbody>
${bodyRows}
      </tbody>
    </table>
  </div>
  <div class="snap-foot">此页冻结于生成时刻，不随台账实时更新；视图口径与导出文件一致。</div>
</div>
</body>
</html>`
}
