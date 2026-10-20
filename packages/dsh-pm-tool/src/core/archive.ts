/**
 * P2 K16 档案最小保存包：只读打包（任务/交付物/证据/复盘 known 行/里程碑通用字段）。
 *
 * 能力边界（勿夸大）：
 * - 只读快照，不改写原数据；非全量镜像（不含评论/活动流/OKR/积分等）；
 * - 不写 K18 出站日志；包内只记 archivedAt；
 * - 默认拒覆盖，confirm 才允许写已有目录；
 * - 标注 exportedAt 与 origin:'pm-tool'，可追溯来源。
 *
 * 契约见 docs/design/deep-integration-v2-p2-dev.md §六。
 */
import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defaultExportDirectory, isolatedExportBase, resolveIsolatedExportDirectory } from './export.js'
import type { PmDomain } from './storage.js'

export class ArchiveProjectNotFoundError extends Error {}
export class ArchiveTargetExistsError extends Error {}

export interface ArchiveEvidence {
  kind: 'task-evidence' | 'task-repo' | 'deliverable-repo'
  refId: string
  url: string
}

export interface ArchiveSnapshot {
  origin: 'pm-tool'
  kind: 'pm-tool-archive'
  exportedAt: string
  archivedAt: string
  projectId: string
  project: Record<string, unknown>
  tasks: Record<string, unknown>[]
  deliverables: Record<string, unknown>[]
  evidence: ArchiveEvidence[]
  reflections: Record<string, unknown>[]
  milestones: Record<string, unknown>[]
  notes: string
}

/** 任务通用字段（最小集，不抄全量）。 */
function pickTask(t: Record<string, unknown>): Record<string, unknown> {
  return {
    id: t.id,
    code: t.code,
    title: t.title,
    status: t.status,
    progress: t.progress,
    priority: t.priority,
    assignee: t.assignee ?? '',
    startDate: t.startDate ?? null,
    dueDate: t.dueDate ?? null,
    completedDate: t.completedDate ?? null,
    evidenceUrl: t.evidenceUrl ?? null,
    repoUrl: t.repoUrl ?? null,
    branch: t.branch ?? null,
    deliverableId: t.deliverableId ?? null,
    milestoneId: t.milestoneId ?? null,
    description: t.description ?? '',
    // B2：资料区随任务进档案包（软引用/链接原样保留，不复制交付物台账正文）。
    attachments: Array.isArray(t.attachments) ? t.attachments : [],
  }
}

function pickDeliverable(d: Record<string, unknown>): Record<string, unknown> {
  return {
    id: d.id,
    name: d.name,
    version: d.version,
    owner: d.owner,
    status: d.status,
    location: d.location ?? '',
    description: d.description ?? '',
    dueDate: d.dueDate ?? null,
    repoUrl: d.repoUrl ?? null,
    branch: d.branch ?? null,
    history: Array.isArray(d.history) ? d.history : [],
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

function pickMilestone(m: Record<string, unknown>): Record<string, unknown> {
  return {
    id: m.id,
    title: m.title,
    status: m.status,
    targetDate: m.targetDate,
    achievedDate: m.achievedDate ?? null,
    description: m.description ?? '',
  }
}

/** 复盘只收 known（已核）行；pending/blank 不进包，gaps 留白清单原样保留。 */
function pickReflection(r: Record<string, unknown>): Record<string, unknown> {
  const lines = Array.isArray(r.lines) ? r.lines : []
  return {
    id: r.id,
    taskId: r.taskId ?? null,
    milestoneId: r.milestoneId ?? null,
    deliverableId: r.deliverableId ?? null,
    sourceEvent: r.sourceEvent,
    status: r.status,
    knownLines: lines.filter((l: { mark?: string }) => l?.mark === 'known').map((l: { text: string }) => l.text),
    gaps: Array.isArray(r.gaps) ? r.gaps : [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

/** 纯只读构建快照（不写盘、不改原数据）。nowIso 注入便于测试。 */
export function buildArchiveSnapshot(
  domain: PmDomain,
  projectId: string,
  nowIso = new Date().toISOString(),
): ArchiveSnapshot {
  const project = domain.table('projects').get(projectId) as Record<string, unknown> | undefined
  if (!project) throw new ArchiveProjectNotFoundError(`未找到项目：${projectId}`)

  const tasks = [...domain.table('tasks').entries()]
    .map(([, t]) => t as Record<string, unknown>)
    .filter(t => t.projectId === projectId)
    .map(pickTask)

  const deliverables = [...domain.table('deliverables').entries()]
    .map(([, d]) => d as Record<string, unknown>)
    .filter(d => d.projectId === projectId)
    .map(pickDeliverable)

  const milestones = [...domain.table('milestones').entries()]
    .map(([, m]) => m as Record<string, unknown>)
    .filter(m => m.projectId === projectId)
    .map(pickMilestone)

  const reflections = [...domain.table('reflections').entries()]
    .map(([, r]) => r as Record<string, unknown>)
    .filter(r => r.projectId === projectId)
    .map(pickReflection)

  // 证据：任务 evidenceUrl、任务/交付物 repoUrl；按 kind+url 去重。
  const evidence: ArchiveEvidence[] = []
  const seen = new Set<string>()
  const pushEvidence = (kind: ArchiveEvidence['kind'], refId: unknown, url: unknown) => {
    if (typeof url !== 'string' || !url.trim()) return
    const key = `${kind}:${url}`
    if (seen.has(key)) return
    seen.add(key)
    evidence.push({ kind, refId: String(refId), url })
  }
  for (const t of tasks) {
    pushEvidence('task-evidence', t.id, t.evidenceUrl)
    pushEvidence('task-repo', t.id, t.repoUrl)
    // B2：资料区 link 项的 url 同样纳入证据去重集合。
    for (const att of Array.isArray(t.attachments) ? t.attachments : []) {
      if (att && att.kind === 'link') pushEvidence('task-evidence', t.id, att.url)
    }
  }
  for (const d of deliverables) pushEvidence('deliverable-repo', d.id, d.repoUrl)

  return {
    origin: 'pm-tool',
    kind: 'pm-tool-archive',
    exportedAt: nowIso,
    archivedAt: nowIso,
    projectId,
    project: {
      id: project.id,
      name: project.name,
      description: project.description ?? '',
      owner: project.owner ?? '',
      status: project.status,
      startDate: project.startDate ?? null,
      targetDate: project.targetDate ?? null,
      tags: Array.isArray(project.tags) ? project.tags : [],
      repoUrl: project.repoUrl ?? null,
      branch: project.branch ?? null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    tasks,
    deliverables,
    evidence,
    reflections,
    milestones,
    notes: 'K16 最小保存包：只读快照，非全量镜像；不写 K18 出站日志；原数据零改动。',
  }
}

/** 默认目录：exports/archive-<项目ID>-<YYYYMMDD>/（相对包根 exports/）。 */
export function defaultArchiveDirectory(projectId: string, nowIso: string): string {
  const day = nowIso.slice(0, 10).replace(/-/g, '')
  return path.join(defaultExportDirectory, `archive-${projectId}-${day}`)
}

const README_MARKDOWN = `# pm-tool 档案最小保存包（K16）

本包是项目的只读快照，由 pm-tool 生成（origin: pm-tool），非全量镜像；不写 K18 出站日志，原数据零改动。

## package.json 字段说明
- origin：来源标识，固定为 "pm-tool"，标明本包由本工具生成。
- kind：包类型标识，固定为 "pm-tool-archive"。
- exportedAt：本快照导出时刻（ISO 8601）。
- archivedAt：本包归档时刻（ISO 8601），与 exportedAt 同刻生成。
- projectId：被归档项目的 ID。
- project：项目通用字段（名称/负责人/状态/起止日期/标签/项目仓库）。
- tasks：任务通用字段快照（ID/WBS/标题/状态/进度/负责人/起止与完成日期/证据与仓库/关联交付物与里程碑/说明）。
- deliverables：交付物快照（名称/版本/负责人/状态/位置/截止/仓库/状态变更 history 留痕）。
- evidence：从任务 evidenceUrl 与任务/交付物 repoUrl 归集的证据链接（kind 区分来源）。
- reflections：复盘草稿的 known（已核）行与 gaps 留白清单；pending/blank 不进包。
- milestones：里程碑通用字段（标题/状态/目标日/达成日/说明）。
- notes：能力边界说明（最小保存包、非全量镜像、原数据零改动）。
`

/**
 * 写包：目录已存在且未 confirm → 拒覆盖（ArchiveTargetExistsError）；
 * confirm 时覆盖写 package.json 与 README-字段说明.md。只读构建，不改原数据。
 */
export async function writeArchivePackage(
  snapshot: ArchiveSnapshot,
  targetDir: string,
  options: { confirm?: boolean } = {},
): Promise<string> {
  // 候选隔离模式（DSH_PM_ISOLATED_ROOT）：导出目标一律收敛到 root/exports，绝对/~/越界/symlink 拒绝；
  // 未设 env 时保持原有生产解析语义不变。
  const absolute = isolatedExportBase()
    ? await resolveIsolatedExportDirectory(targetDir)
    : path.isAbsolute(targetDir)
      ? targetDir
      : path.join(defaultExportDirectory, targetDir)
  let exists = false
  try {
    await access(absolute)
    exists = true
  } catch {
    exists = false
  }
  if (exists && !options.confirm) {
    throw new ArchiveTargetExistsError(`目标目录已存在（${absolute}）；如需覆盖请显式加 confirm。`)
  }
  await mkdir(absolute, { recursive: true })
  await writeFile(path.join(absolute, 'package.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  await writeFile(path.join(absolute, 'README-字段说明.md'), README_MARKDOWN, 'utf8')
  return absolute
}
