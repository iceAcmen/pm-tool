/**
 * K18 单向出站：三档分受众导出（技术 MD / 非技术在线增强 HTML / 离线纯文本兜底）
 * + 出站日志两类（审计只增流 pmExportAudit / 动作已发日志 pmExportSent（TTL 30 天归档））。
 *
 * 纪律（契约 docs/design/deep-integration-v2-p2-dev.md §二）：
 * - 出站写=显式触发、单向只增、不级联不镜像；导出是瞬时快照，导出后外部文件为唯一事实源，
 *   工具不做后续同步/镜像，任务状态后续变化不影响已导出文件；
 * - 审计流 append-only 长期保留，永不清理；已发日志 TTL=30 天，过期条目在下次导出时归档到
 *   pmExportSentArchive（同名结构，长期保留），活跃日志只留未过期；
 * - 纯渲染函数零墙钟（generatedAt 由调用方注入），墙钟只在命令层取；
 * - web 档自包含单文件：内联 CSS、无外链字体/图片/脚本、浅深双态（prefers-color-scheme）、
 *   空数据「暂无数据」占位，不嵌入虚构示例数据。
 */
import { link, lstat, mkdir, rename, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PmDomain } from './storage.js'
import { collectProjectReport, renderProjectMarkdown } from './report.js'
import { renderProgressReportMarkdown } from './progress-report-markdown.js'
import { getProgressReport } from './progress-reports.js'
import { enqueueDomainWrite } from './projects.js'
import { getDeliverable, listDeliverables } from './deliverables.js'
import { listReflections } from './reflect.js'
import { taskStatusLabels, projectStatusLabels, milestoneStatusLabels, deliverableStatusLabels } from './labels.js'
import type { Task } from './task.js'
import type { Milestone } from './milestone.js'
import type { Deliverable } from './deliverable.js'
import type { ReflectionRecord } from './storage.js'
import type { Project } from './project.js'

export const defaultExportDirectory = fileURLToPath(new URL('../../../../exports/', import.meta.url))

export class ExportFileExistsError extends Error {
  constructor(readonly path: string) {
    super(`导出文件已存在：${path}`)
    this.name = 'ExportFileExistsError'
  }
}

function expandDirectory(directory: string | undefined): string {
  if (!directory) return defaultExportDirectory
  const expanded = directory === '~'
    ? homedir()
    : directory.startsWith('~/')
      ? resolve(homedir(), directory.slice(2))
      : directory
  return isAbsolute(expanded) ? resolve(expanded) : resolve(defaultExportDirectory, '..', expanded)
}

/**
 * 候选隔离开关：仅当显式设置 DSH_PM_ISOLATED_ROOT 时生效（正常生产未设置，语义完全不变）。
 * 设置后所有文件导出收敛到 <root>/exports，用户给的绝对路径 / ~ / ../ 一律拒绝，fail-closed。
 */
export const ISOLATED_ROOT_ENV = 'DSH_PM_ISOLATED_ROOT'

export class ExportIsolationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExportIsolationError'
  }
}

export function isolatedExportBase(): string | undefined {
  const value = process.env[ISOLATED_ROOT_ENV]?.trim()
  return value ? resolve(value) : undefined
}

/**
 * 解析导出目录：
 *  - 未设隔离 env：走 legacy expandDirectory（生产默认语义，绝对/~/相对均允许）。
 *  - 已设隔离 env：默认落 <root>/exports；仅允许相对子目录，绝对、~、~/、越界 ..、symlink 全部拒绝且零写。
 */
export async function resolveIsolatedExportDirectory(directory: string | undefined): Promise<string> {
  const base = isolatedExportBase()
  if (!base) return expandDirectory(directory)
  const root = resolve(base, 'exports')
  const rel = directory?.trim()
  if (!rel) return root
  if (rel === '~' || rel.startsWith('~/') || isAbsolute(rel)) {
    throw new ExportIsolationError('候选隔离模式下仅允许相对导出子目录，拒绝绝对路径与主目录（~）。')
  }
  const abs = resolve(root, rel)
  if (abs !== root && !abs.startsWith(root + sep)) {
    throw new ExportIsolationError('导出路径越界，已拒绝（不得逃出隔离 root）。')
  }
  const stat = await lstat(abs).catch(() => undefined)
  if (stat?.isSymbolicLink()) throw new ExportIsolationError('拒绝符号链接导出目标。')
  return abs
}

export async function writeExportFile(
  target: string,
  content: string,
  overwrite: boolean,
): Promise<void> {
  const outputDirectory = resolve(target, '..')
  await mkdir(outputDirectory, { recursive: true, mode: 0o700 })
  const temporary = resolve(
    outputDirectory,
    `.${target.split('/').at(-1)}.${process.pid}.${Date.now()}.tmp`,
  )
  await writeFile(temporary, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
  try {
    if (overwrite) {
      await rename(temporary, target)
    } else {
      try {
        await link(temporary, target)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new ExportFileExistsError(target)
        throw error
      }
      await unlink(temporary).catch(() => {})
    }
  } catch (error) {
    await unlink(temporary).catch(() => {})
    throw error
  }
}

// ============================================================
// 出站日志两类（settings 表条目；串行写队列；只读派生）
// ============================================================

/** 项目级三档导出格式（整库 json 备份不进项目出站日志，无单一 projectId 口径）。 */
export type ProjectExportFormat = 'markdown' | 'web' | 'plain'

export const SETTING_EXPORT_AUDIT = 'pmExportAudit'
export const SETTING_EXPORT_SENT = 'pmExportSent'
export const SETTING_EXPORT_SENT_ARCHIVE = 'pmExportSentArchive'

/** 动作已发日志保留期（天）；过期条目下次导出时归档。 */
export const SENT_TTL_DAYS = 30

/** 审计只增流条目（长期保留，永不清理）。 */
export interface ExportAuditEntry {
  /** ISO 导出时刻。 */
  at: string
  projectId: string
  format: ProjectExportFormat
  targetPath: string
  /** 本次导出的任务条目数。 */
  itemCount: number
}

/** 动作已发日志条目（活跃只留未过期；归档后结构同名）。 */
export interface ExportSentEntry {
  at: string
  projectId: string
  format: ProjectExportFormat
  targetPath: string
}

const ONE_DAY_MS = 86_400_000

/** 纯谓词：条目相对 nowIso 是否已超过 TTL（日期不可解析时按未过期处理，绝不静默丢弃）。 */
export function isSentEntryExpired(at: string, nowIso: string, ttlDays: number = SENT_TTL_DAYS): boolean {
  const age = Date.parse(nowIso) - Date.parse(at)
  return Number.isFinite(age) && age >= ttlDays * ONE_DAY_MS
}

function isExportFormat(value: unknown): value is ProjectExportFormat {
  return value === 'markdown' || value === 'web' || value === 'plain'
}

function sanitizeAuditEntry(raw: unknown): ExportAuditEntry | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  if (typeof r.at !== 'string' || typeof r.projectId !== 'string'
    || !isExportFormat(r.format) || typeof r.targetPath !== 'string'
    || typeof r.itemCount !== 'number' || !Number.isFinite(r.itemCount)) return undefined
  return { at: r.at, projectId: r.projectId, format: r.format, targetPath: r.targetPath, itemCount: r.itemCount }
}

function sanitizeSentEntry(raw: unknown): ExportSentEntry | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  if (typeof r.at !== 'string' || typeof r.projectId !== 'string'
    || !isExportFormat(r.format) || typeof r.targetPath !== 'string') return undefined
  return { at: r.at, projectId: r.projectId, format: r.format, targetPath: r.targetPath }
}

function readSettingsArray(domain: PmDomain, key: string): unknown[] {
  const row = domain.table('settings').get(key) as { value?: unknown } | undefined
  const value = row?.value
  return Array.isArray(value) ? value : []
}

/** 读审计只增流（按追加顺序，旧→新）；缺省/损坏按空处理，绝不抛。 */
export function readExportAudit(domain: PmDomain): ExportAuditEntry[] {
  return readSettingsArray(domain, SETTING_EXPORT_AUDIT)
    .map(sanitizeAuditEntry)
    .filter((e): e is ExportAuditEntry => e !== undefined)
}

/** 读活跃已发日志（未过期口径由派生处过滤；这里只返回原始合法条目）。 */
export function readExportSent(domain: PmDomain): ExportSentEntry[] {
  return readSettingsArray(domain, SETTING_EXPORT_SENT)
    .map(sanitizeSentEntry)
    .filter((e): e is ExportSentEntry => e !== undefined)
}

/** 读归档已发日志（长期保留）。 */
export function readExportSentArchive(domain: PmDomain): ExportSentEntry[] {
  return readSettingsArray(domain, SETTING_EXPORT_SENT_ARCHIVE)
    .map(sanitizeSentEntry)
    .filter((e): e is ExportSentEntry => e !== undefined)
}

/** 纯函数：把已发日志切成活跃（未过期）与待归档（过期）。 */
export function partitionSentEntries(
  entries: ExportSentEntry[],
  nowIso: string,
  ttlDays: number = SENT_TTL_DAYS,
): { active: ExportSentEntry[], expired: ExportSentEntry[] } {
  const active: ExportSentEntry[] = []
  const expired: ExportSentEntry[] = []
  for (const entry of entries) {
    (isSentEntryExpired(entry.at, nowIso, ttlDays) ? expired : active).push(entry)
  }
  return { active, expired }
}

export interface OutboundLogSummary {
  auditCount: number
  activeSentCount: number
  archivedCount: number
}

/**
 * 记录一次项目级出站：审计流追加一条（只增不删）；已发日志先把过期条目归档，
 * 再追加本次条目。全部走 enqueueDomainWrite 串行队列；文件落盘成功后才调用。
 */
export async function recordExportOutbound(
  domain: PmDomain,
  entry: ExportAuditEntry,
  nowIso: string = new Date().toISOString(),
): Promise<OutboundLogSummary> {
  return enqueueDomainWrite(domain, async () => {
    const audit = [...readExportAudit(domain), entry]
    const { active, expired } = partitionSentEntries(readExportSent(domain), nowIso)
    const archive = [...readExportSentArchive(domain), ...expired]
    const sent: ExportSentEntry[] = [...active, {
      at: entry.at,
      projectId: entry.projectId,
      format: entry.format,
      targetPath: entry.targetPath,
    }]
    await domain.table('settings').put(SETTING_EXPORT_AUDIT, { value: audit, updatedAt: nowIso })
    await domain.table('settings').put(SETTING_EXPORT_SENT, { value: sent, updatedAt: nowIso })
    if (archive.length) {
      await domain.table('settings').put(SETTING_EXPORT_SENT_ARCHIVE, { value: archive, updatedAt: nowIso })
    }
    return { auditCount: audit.length, activeSentCount: sent.length, archivedCount: archive.length }
  })
}

// ============================================================
// 出站数据包（domain 只读采集；渲染纯函数消费）
// ============================================================

interface ExportBundle {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
  deliverables: Deliverable[]
  reflections: ReflectionRecord[]
  deliverableById: Map<string, Deliverable>
  reflectionByTask: Map<string, ReflectionRecord>
  fileAssetById: Map<string, { fileName: string; size: number; sha256: string }>
}

function collectExportBundle(domain: PmDomain, projectId: string): ExportBundle {
  const report = collectProjectReport(domain, projectId)
  const deliverables = listDeliverables(domain, projectId)
  const reflections = listReflections(domain, projectId)
  const deliverableById = new Map(deliverables.map(d => [d.id, d]))
  const fileAssetById = new Map<string, { fileName: string; size: number; sha256: string }>()
  for (const [, row] of domain.table('file_assets').entries() as IterableIterator<[string, unknown]>) {
    const r = row as { id: string; fileName: string; size: number; sha256: string }
    fileAssetById.set(r.id, { fileName: r.fileName, size: r.size, sha256: r.sha256 })
  }
  const reflectionByTask = new Map<string, ReflectionRecord>()
  for (const reflection of reflections) {
    if (reflection.taskId && !reflectionByTask.has(reflection.taskId)) {
      reflectionByTask.set(reflection.taskId, reflection)
    }
  }
  return {
    project: report.project,
    tasks: report.tasks,
    milestones: report.milestones,
    deliverables,
    reflections,
    deliverableById,
    reflectionByTask,
    fileAssetById,
  }
}

// ---------- Markdown 技术档：补 evidence/deliverable/reflection 引用行 ----------

function mdInline(value: string | undefined | null, fallback = '未填写'): string {
  const s = (value ?? '').trim()
  return s
    ? s
      .replaceAll('\\', '\\\\')
      .replaceAll('|', '\\|')
      .replace(/\r?\n/g, '<br>')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
    : fallback
}

/** 技术 MD 引用附录：任务级佐证/交付物/复盘行 + 交付物台账 + 复盘记录清单。 */
function buildMarkdownReferenceAppendix(bundle: ExportBundle): string {
  const { tasks, deliverables, reflections, deliverableById, reflectionByTask, fileAssetById } = bundle
  const lines: string[] = ['## 证据 · 交付物 · 复盘引用', '']
  const taskRefs = tasks.map(task => {
    const refs: string[] = []
    if (task.evidenceUrl) refs.push(`客观佐证：${task.evidenceUrl}`)
    if (task.deliverableId) {
      const dlv = deliverableById.get(task.deliverableId)
      refs.push(dlv
        ? `关联交付物：\`${dlv.id}\`「${mdInline(dlv.name)}」（${deliverableStatusLabels[dlv.status] ?? dlv.status}）`
        : `关联交付物：\`${task.deliverableId}\`（台账中未找到）`)
    }
    // B2：资料区 link / deliverable 软引用进 MD 引用附录。
    for (const att of task.attachments ?? []) {
      if (att.kind === 'link') {
        refs.push(att.title ? `资料链接：${mdInline(att.title)}（${att.url}）` : `资料链接：${att.url}`)
      } else if (att.kind === 'deliverable') {
        const dlv = deliverableById.get(att.deliverableId)
        refs.push(dlv
          ? `资料交付物：\`${att.deliverableId}\`「${mdInline(dlv.name)}」（冻结版本 ${mdInline(att.frozenVersion, '未填')}）`
          : `资料交付物：\`${att.deliverableId}\`（台账中未找到）`)
      } else if (att.kind === 'file') {
        const fa = fileAssetById.get(att.assetId)
        refs.push(fa
          ? `资料文件：\`${att.assetId}\`「${mdInline(fa.fileName)}」（${fa.size} 字节 · sha256:${fa.sha256.slice(0, 8)}）`
          : `资料文件：\`${att.assetId}\`（资产记录未找到）`)
      }
    }
    const reflection = reflectionByTask.get(task.id)
    if (reflection) {
      refs.push(`复盘：\`${reflection.id}\`（${reflection.status === 'final' ? '定稿' : '草稿'}）${mdInline(reflection.draft.title)}`)
    }
    return { task, refs }
  }).filter(x => x.refs.length > 0)

  if (taskRefs.length === 0 && deliverables.length === 0 && reflections.length === 0) {
    lines.push('暂无证据、交付物与复盘引用。', '')
    return lines.join('\n')
  }

  if (taskRefs.length) {
    lines.push('### 任务引用', '')
    for (const { task, refs } of taskRefs) {
      lines.push(`- \`${task.id}\` **${mdInline(task.code)} ${mdInline(task.title)}**`)
      for (const ref of refs) lines.push(`  - ${ref}`)
    }
    lines.push('')
  }

  if (deliverables.length) {
    lines.push('### 交付物台账', '')
    lines.push('| ID | 名称 | 版本 | 状态 | 位置 | 关联里程碑 | 备注 |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- |')
    for (const dlv of deliverables) {
      lines.push(`| \`${dlv.id}\` | ${mdInline(dlv.name)} | ${mdInline(dlv.version, '未填写')} | ${deliverableStatusLabels[dlv.status] ?? dlv.status} | ${mdInline(dlv.location)} | ${mdInline(dlv.milestoneId, '未关联')} | ${mdInline(dlv.note, '未填写')} |`)
    }
    lines.push('')
  }

  if (reflections.length) {
    lines.push('### 复盘记录', '')
    for (const reflection of reflections) {
      const known = reflection.draft.lines.filter(l => l.mark === 'known').length
      lines.push(`- \`${reflection.id}\`（${reflection.status === 'final' ? '定稿' : '草稿'}）${mdInline(reflection.draft.title)}；已核 ${known} 行`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

/** 把引用附录插到技术 MD 的结束分隔线之前（footer 保持最后）。 */
function withReferenceAppendix(base: string, appendix: string): string {
  const marker = '\n---\n'
  const idx = base.indexOf(marker)
  if (idx === -1 || !appendix.trim()) return base
  return `${base.slice(0, idx)}\n${appendix}${base.slice(idx)}`
}

// ---------- web 非技术在线增强档：自包含只读 HTML 快照 ----------

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type TaskGroup = { key: string, label: string, dot: string, rows: Task[] }

function groupTasks(tasks: Task[]): TaskGroup[] {
  const groups: TaskGroup[] = [
    { key: 'in_progress', label: '进行中', dot: 'var(--acc)', rows: [] },
    { key: 'blocked', label: '受阻', dot: 'var(--warn)', rows: [] },
    { key: 'wrapped', label: '已收尾', dot: 'var(--fg3)', rows: [] },
    { key: 'todo', label: '未开始', dot: 'var(--line2)', rows: [] },
    { key: 'done', label: '已完成', dot: 'var(--ok)', rows: [] },
  ]
  const byKey = new Map(groups.map(g => [g.key, g]))
  for (const task of tasks) {
    byKey.get(task.status)?.rows.push(task)
  }
  return groups.filter(g => g.rows.length > 0)
}

/** 任务级佐证/交付物/复盘引用（纯文本，供 plain 与 MD；web 档另行转义）。 */
function taskReferenceTextLines(bundle: ExportBundle, task: Task): string[] {
  const refs: string[] = []
  if (task.evidenceUrl) refs.push(`客观佐证：${task.evidenceUrl}`)
  if (task.deliverableId) {
    const dlv = bundle.deliverableById.get(task.deliverableId)
    refs.push(dlv
      ? `关联交付物：${dlv.name}（${deliverableStatusLabels[dlv.status] ?? dlv.status}）`
      : `关联交付物：${task.deliverableId}（台账中未找到）`)
  }
  // B2：资料区 link 项与 deliverable 软引用一并纳入导出引用。
  for (const att of task.attachments ?? []) {
    if (att.kind === 'link') {
      refs.push(att.title ? `资料链接：${att.title}（${att.url}）` : `资料链接：${att.url}`)
    } else if (att.kind === 'deliverable') {
      const dlv = bundle.deliverableById.get(att.deliverableId)
      refs.push(dlv
        ? `资料交付物：\`${att.deliverableId}\`「${dlv.name}」（冻结版本 ${att.frozenVersion || '未填'}）`
        : `资料交付物：\`${att.deliverableId}\`（台账中未找到）`)
    } else if (att.kind === 'file') {
      const fa = bundle.fileAssetById.get(att.assetId)
      refs.push(fa
        ? `资料文件：\`${att.assetId}\`「${fa.fileName}」（${fa.size} 字节 · sha256:${fa.sha256.slice(0, 8)}）`
        : `资料文件：\`${att.assetId}\`（资产记录未找到）`)
    }
  }
  const reflection = bundle.reflectionByTask.get(task.id)
  if (reflection) refs.push(`复盘记录（${reflection.status === 'final' ? '定稿' : '草稿'}）：${reflection.draft.title}`)
  return refs
}

/** web 档引用行（HTML 转义）。 */
function taskReferenceHtmlLines(bundle: ExportBundle, task: Task): string[] {
  return taskReferenceTextLines(bundle, task).map(escapeHtml)
}

const SNAPSHOT_DECLARATION = '只读快照 · 非实时数据：本页冻结于生成时刻，不随台账变化，工具不做后续同步或镜像；页内不含虚构示例数据，空项以「暂无数据」占位；导出后外部文件为唯一事实源，任务状态后续变化不影响本页。'

/**
 * 自包含单文件 HTML：内联 CSS、无外链字体/图片/脚本；浅深双态跟随系统
 * （prefers-color-scheme）；三栏壳 token 沿用 S4 视觉基准；空数据「暂无数据」占位。
 */
export function renderProjectWebHtml(bundle: ExportBundle, generatedAt: string): string {
  const { project, tasks, milestones, deliverables, reflections } = bundle
  const groups = groupTasks(tasks)

  const overviewRows = [
    ['负责人', project.owner || '未填写'],
    ['周期', `${project.startDate || '未定'} → ${project.targetDate || '未定'}`],
    ['标签', project.tags?.length ? project.tags.join('、') : '无'],
    ['目标描述', project.description || '未填写'],
  ]

  const taskSections = groups.length === 0
    ? '<div class="empty">暂无数据</div>'
    : groups.map(group => `
    <section class="block">
      <h2><span class="dot" style="background:${group.dot}"></span>${escapeHtml(group.label)}（${group.rows.length}）</h2>
      ${group.rows.map(task => `
      <div class="item">
        <div class="item-head">
          <span class="item-title">${escapeHtml(task.code ? `${task.code} ${task.title}` : task.title)}</span>
          <span class="chip"><span class="dot" style="background:${group.dot}"></span>${escapeHtml(taskStatusLabels[task.status] ?? task.status)}</span>
        </div>
        <div class="item-meta">负责人：${escapeHtml(task.assignee || '未填写')} · ${escapeHtml(task.startDate || '未定')} → ${escapeHtml(task.dueDate || '未定')} · 进度 ${Math.round(Number(task.progress ?? 0))}%</div>
        <div class="bar"><div class="bar-fill" style="width:${Math.round(Number(task.progress ?? 0))}%"></div></div>
        ${taskReferenceHtmlLines(bundle, task).map(r => `<div class="ref">${r}</div>`).join('\n')}
      </div>`).join('\n')}
    </section>`).join('\n')

  const milestoneRows = milestones.length === 0
    ? '<div class="empty">暂无数据</div>'
    : `<table>
      <thead><tr><th>目标日期</th><th>标题</th><th>状态</th><th>实际达成</th><th>说明/达成标准</th></tr></thead>
      <tbody>${milestones.map(m => `<tr>
        <td>${escapeHtml(m.targetDate)}</td>
        <td>${escapeHtml(m.title)}</td>
        <td>${escapeHtml(milestoneStatusLabels[m.status] ?? m.status)}</td>
        <td>${escapeHtml(m.achievedDate ?? '未填写')}</td>
        <td>${escapeHtml(m.description || '未填写')}</td>
      </tr>`).join('')}</tbody>
    </table>`

  const deliverableRows = deliverables.length === 0
    ? '<div class="empty">暂无数据</div>'
    : deliverables.map(dlv => `
      <div class="item">
        <div class="item-head"><span class="item-title">${escapeHtml(dlv.name)}</span>
        <span class="chip">${escapeHtml(deliverableStatusLabels[dlv.status] ?? dlv.status)}</span></div>
        <div class="item-meta">版本：${escapeHtml(dlv.version || '未填写')} · 负责人：${escapeHtml(dlv.owner || '未填写')} · 位置：${escapeHtml(dlv.location || '未填写')} · 关联里程碑：${escapeHtml(dlv.milestoneId || '未关联')} · 备注：${escapeHtml(dlv.note || '未填写')}</div>
      </div>`).join('')

  const reflectionRows = reflections.length === 0
    ? '<div class="empty">暂无数据</div>'
    : reflections.map(r => `
      <div class="item">
        <div class="item-head"><span class="item-title">${escapeHtml(r.draft.title)}</span>
        <span class="chip">${r.status === 'final' ? '定稿' : '草稿'}</span></div>
        <div class="item-meta">${escapeHtml(r.draft.lines.filter(l => l.mark === 'known').length)} 条已核 · ${escapeHtml(r.createdAt.slice(0, 10))}</div>
      </div>`).join('')

  const counts = {
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    wrapped: tasks.filter(t => t.status === 'wrapped').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(project.name)} · 只读快照</title>
<style>
/* S4 三栏壳 token：浅深两态，自包含无外链；深色跟随系统偏好 */
:root{
  --bg:#f7f8fa; --panel:#ffffff; --panel2:#f2f4f7; --line:#e5e7eb; --line2:#d0d5dd;
  --fg:#1f2329; --fg2:#5b6472; --fg3:#8a93a0;
  --acc:#4f7cff; --acc-bg:#eef2ff;
  --ok:#168a5a; --ok-bg:#e8f6ef; --warn:#b7791f; --warn-bg:#fdf3e0; --bad:#c9404a; --bad-bg:#fdecef;
  --shadow:0 1px 2px rgba(16,24,40,.04),0 1px 3px rgba(16,24,40,.06);
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0f1115; --panel:#171a20; --panel2:#1d2129; --line:#2a2f3a; --line2:#3a4150;
    --fg:#d7dce3; --fg2:#9aa3b2; --fg3:#6b7484;
    --acc:#6f9cff; --acc-bg:#1c2740;
    --ok:#4cc08a; --ok-bg:#153226; --warn:#d9a13f; --warn-bg:#33291a; --bad:#e07a70; --bad-bg:#3a2025;
    --shadow:0 1px 2px rgba(0,0,0,.3);
  }
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--fg);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",system-ui,sans-serif;font-size:14px;line-height:1.6;padding:24px 16px;font-variant-numeric:tabular-nums}
.shell{max-width:960px;margin:0 auto;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:var(--shadow)}
.topbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 20px;background:var(--panel2);border-bottom:1px solid var(--line)}
.topbar .lock{color:var(--fg3);display:inline-flex}
.topbar b{font-weight:650}
.topbar .time{color:var(--fg2);font-size:12.5px}
.topbar .audience{margin-left:auto;font-size:11px;font-weight:700;color:var(--fg2);background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:3px 10px}
.declare{margin:14px 20px;padding:10px 14px;font-size:12.5px;color:var(--warn);background:var(--warn-bg);border-radius:8px;border:1px solid var(--line)}
.body{padding:6px 20px 18px}
.section{margin:14px 0}
.section>h2{font-size:14px;font-weight:650;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--line)}
.overview{display:grid;grid-template-columns:120px 1fr;gap:6px 14px;font-size:13px}
.overview dt{color:var(--fg3)}
.overview dd{color:var(--fg)}
.counts{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:var(--fg2);padding:8px 0}
.counts b{color:var(--fg)}
.block{margin:14px 0}
.block>h2{font-size:13.5px;font-weight:650;margin-bottom:8px;display:flex;align-items:center;gap:8px}
.item{padding:10px 12px;border:1px solid var(--line);border-radius:8px;margin:8px 0;background:var(--panel)}
.item-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.item-title{font-weight:600}
.item-meta{font-size:12.5px;color:var(--fg2);margin-top:4px}
.ref{font-size:12.5px;color:var(--fg3);margin-top:3px}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--fg2);white-space:nowrap}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex:none}
.bar{height:4px;background:var(--panel2);border-radius:999px;margin-top:6px;overflow:hidden}
.bar-fill{height:100%;background:var(--acc);border-radius:999px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-size:12px;font-weight:650;color:var(--fg3);padding:8px 10px;border-bottom:1px solid var(--line)}
td{padding:8px 10px;border-bottom:1px solid var(--line);color:var(--fg)}
.empty{color:var(--fg3);font-size:13px;padding:14px;text-align:center;border:1px dashed var(--line);border-radius:8px}
.foot{padding:12px 20px;border-top:1px solid var(--line);font-size:12px;color:var(--fg3)}
</style>
</head>
<body>
<div class="shell">
  <div class="topbar">
    <span class="lock" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
    <b>只读快照 · 非实时数据</b>
    <span class="time">生成于 ${escapeHtml(generatedAt)}</span>
    <span class="audience">非技术增强档</span>
  </div>
  <div class="declare">${escapeHtml(SNAPSHOT_DECLARATION)}</div>
  <div class="body">
    <div class="section">
      <h2>项目概览</h2>
      <dl class="overview">
        <dt>项目名称</dt><dd><b>${escapeHtml(project.name)}</b>（${escapeHtml(projectStatusLabels[project.status] ?? project.status)}）</dd>
        ${overviewRows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}
      </dl>
    </div>
    <div class="counts">
      <span>进行中 <b>${counts.in_progress}</b></span>
      <span>已完成 <b>${counts.done}</b></span>
      <span>受阻 <b>${counts.blocked}</b></span>
      <span>已收尾 <b>${counts.wrapped}</b></span>
      <span>未开始 <b>${counts.todo}</b></span>
    </div>
    ${taskSections}
    <div class="section"><h2>里程碑时间线</h2>${milestoneRows}</div>
    <div class="section"><h2>交付物</h2>${deliverableRows}</div>
    <div class="section"><h2>复盘记录</h2>${reflectionRows}</div>
  </div>
  <div class="foot">本页冻结于生成时刻，不随台账实时更新；本地静态文件，无需联网，可自行转发；导出后外部文件为唯一事实源。</div>
</div>
</body>
</html>`
}

// ---------- plain 离线纯文本兜底：无 markdown 符号，含生成时间戳 ----------

function plainLine(label: string, value: string | undefined | null): string {
  return value && value.trim() ? `${label}：${value.trim()}` : `${label}：未填写`
}

function plainSafeNote(value: string | undefined | null): string {
  const safe = (value ?? '').trim().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return safe || '未填写'
}

/** 纯文本：不含 markdown 符号（井号标题、星号强调、竖线表格、反引号等）；空项「暂无数据」；含生成时间戳。 */
export function renderProjectPlain(bundle: ExportBundle, generatedAt: string): string {
  const { project, tasks, milestones, deliverables, reflections } = bundle
  const out: string[] = [
    '项目进展 · 只读快照（纯文本兜底）',
    `生成时间：${generatedAt}`,
    '',
    `声明：${SNAPSHOT_DECLARATION}`,
    '',
    '【项目概览】',
    plainLine('项目名称', project.name),
    plainLine('状态', projectStatusLabels[project.status] ?? project.status),
    plainLine('负责人', project.owner),
    plainLine('周期', `${project.startDate || '未定'} → ${project.targetDate || '未定'}`),
    plainLine('标签', project.tags?.length ? project.tags.join('、') : undefined),
    plainLine('目标描述', project.description),
    '',
  ]

  const groups = groupTasks(tasks)
  out.push('【进展概览】')
  out.push(`进行中 ${tasks.filter(t => t.status === 'in_progress').length} · 已完成 ${tasks.filter(t => t.status === 'done').length} · 受阻 ${tasks.filter(t => t.status === 'blocked').length} · 已收尾 ${tasks.filter(t => t.status === 'wrapped').length} · 未开始 ${tasks.filter(t => t.status === 'todo').length}`)
  out.push('')

  if (groups.length === 0) {
    out.push('【任务】')
    out.push('暂无数据')
    out.push('')
  } else {
    for (const group of groups) {
      out.push(`【任务 · ${group.label}】`)
      group.rows.forEach((task, i) => {
        out.push(`${i + 1}. ${task.code ? `${task.code} ` : ''}${task.title}`)
        out.push(`   状态：${taskStatusLabels[task.status] ?? task.status}；${plainLine('负责人', task.assignee)}；${plainLine('周期', `${task.startDate || '未定'} → ${task.dueDate || '未定'}`)}；进度 ${Math.round(Number(task.progress ?? 0))}%`)
        for (const ref of taskReferenceTextLines(bundle, task)) {
          out.push(`   ${ref}`)
        }
      })
      out.push('')
    }
  }

  out.push('【里程碑时间线】')
  if (milestones.length === 0) {
    out.push('暂无数据')
  } else {
    milestones.forEach((m, i) => {
      out.push(`${i + 1}. ${m.title}（${milestoneStatusLabels[m.status] ?? m.status}）`)
      out.push(`   目标日期：${m.targetDate}；实际达成：${m.achievedDate ?? '未填写'}；${plainLine('说明/达成标准', m.description)}`)
    })
  }
  out.push('')

  out.push('【交付物】')
  if (deliverables.length === 0) {
    out.push('暂无数据')
  } else {
    deliverables.forEach((d, i) => {
      out.push(`${i + 1}. ${d.name}（${deliverableStatusLabels[d.status] ?? d.status}）`)
      out.push(`   版本：${d.version || '未填写'}；负责人：${d.owner || '未填写'}；位置：${d.location || '未填写'}；关联里程碑：${d.milestoneId || '未关联'}；备注：${plainSafeNote(d.note)}`)
    })
  }
  out.push('')

  out.push('【复盘记录】')
  if (reflections.length === 0) {
    out.push('暂无数据')
  } else {
    reflections.forEach((r, i) => {
      const known = r.draft.lines.filter(l => l.mark === 'known').length
      out.push(`${i + 1}. ${r.draft.title}（${r.status === 'final' ? '定稿' : '草稿'}；已核 ${known} 行；${r.createdAt.slice(0, 10)}）`)
    })
  }
  out.push('')
  out.push(`本文件由 pm-tool 于 ${generatedAt} 生成；只读，不随台账更新；导出后外部文件为唯一事实源。`)
  return out.join('\n') + '\n'
}

// ============================================================
// 出站入口（文件落盘成功后才写日志）
// ============================================================

export interface ProjectExportOutcome {
  path: string
  content: string
  itemCount: number
  logs: OutboundLogSummary
}

async function writeProjectExport(
  domain: PmDomain,
  projectId: string,
  format: ProjectExportFormat,
  directory: string | undefined,
  overwrite: boolean,
  fileName: string,
  content: string,
  generatedAt: string,
  itemCount: number,
): Promise<ProjectExportOutcome> {
  const outputDirectory = await resolveIsolatedExportDirectory(directory)
  const target = resolve(outputDirectory, fileName)
  await writeExportFile(target, content, overwrite)
  const logs = await recordExportOutbound(domain, {
    at: generatedAt,
    projectId,
    format,
    targetPath: target,
    itemCount,
  }, generatedAt)
  return { path: target, content, itemCount, logs }
}

export async function exportProjectMarkdown(
  domain: PmDomain,
  projectId: string,
  directory?: string,
  overwrite = false,
): Promise<{ path: string, content: string } & Partial<ProjectExportOutcome>> {
  const generatedAt = new Date().toISOString()
  const report = collectProjectReport(domain, projectId)
  const bundle = collectExportBundle(domain, projectId)
  const base = renderProjectMarkdown(report, generatedAt)
  const content = withReferenceAppendix(base, buildMarkdownReferenceAppendix(bundle))
  const outcome = await writeProjectExport(
    domain, projectId, 'markdown', directory, overwrite,
    `${report.project.id}-report.md`, content, generatedAt, bundle.tasks.length,
  )
  return { path: outcome.path, content: outcome.content, itemCount: outcome.itemCount, logs: outcome.logs }
}

/** web 非技术在线增强档：自包含只读 HTML 静态快照。 */
export async function exportProjectWeb(
  domain: PmDomain,
  projectId: string,
  directory?: string,
  overwrite = false,
): Promise<ProjectExportOutcome> {
  const generatedAt = new Date().toISOString()
  const bundle = collectExportBundle(domain, projectId)
  const content = renderProjectWebHtml(bundle, generatedAt)
  return writeProjectExport(
    domain, projectId, 'web', directory, overwrite,
    `${bundle.project.id}-snapshot.html`, content, generatedAt, bundle.tasks.length,
  )
}

/** plain 离线纯文本兜底。 */
export async function exportProjectPlain(
  domain: PmDomain,
  projectId: string,
  directory?: string,
  overwrite = false,
): Promise<ProjectExportOutcome> {
  const generatedAt = new Date().toISOString()
  const bundle = collectExportBundle(domain, projectId)
  const content = renderProjectPlain(bundle, generatedAt)
  return writeProjectExport(
    domain, projectId, 'plain', directory, overwrite,
    `${bundle.project.id}-report.txt`, content, generatedAt, bundle.tasks.length,
  )
}

export async function exportProgressReportMarkdown(
  domain: PmDomain,
  reportId: string,
  directory?: string,
  overwrite = false,
): Promise<{ path: string, content: string }> {
  const report = getProgressReport(domain, reportId)
  if (!report) throw new Error(`未找到进度汇报：${reportId}`)
  const content = renderProgressReportMarkdown(report)
  const target = resolve(await resolveIsolatedExportDirectory(directory), `${report.id}-progress.md`)
  await writeExportFile(target, content, overwrite)
  return { path: target, content }
}
