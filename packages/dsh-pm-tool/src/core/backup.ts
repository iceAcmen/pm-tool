/**
 * R18 备份/恢复：只覆盖 pmtool 领域七类实体（不含宿主会话/checks/任何密钥）。
 * 备份为带时间戳与 manifest 的 JSON；恢复前自动生成一份安全快照。
 */
import { readFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeExportFile } from './export.js'
import { atomicWriteFile } from './fs-atomic.js'
import type { Milestone } from './milestone.js'
import type { Project } from './project.js'
import type { PmDomain } from './storage.js'
import type { Task } from './task.js'
import type { RiskIssue } from './risk-issue.js'
import type { Meeting } from './meeting.js'
import type { ProgressReport } from './progress-report.js'
import type { Deliverable } from './deliverable.js'

/** 默认备份目录：产品仓库 backups/（gitignored）。 */
const BUILTIN_DEFAULT = fileURLToPath(new URL('../../../backups/', import.meta.url))

/** 默认备份目录：产品仓库 backups/，可由环境变量 DSH_PM_BACKUP_DIR 覆盖（隔离实例用）。 */
export function resolveBackupDirectory(override?: string): string {
  const env = override ?? process.env.DSH_PM_BACKUP_DIR
  if (env && env.trim()) return resolve(env)
  return BUILTIN_DEFAULT
}
export const defaultBackupDirectory = resolveBackupDirectory()

export const BACKUP_TABLES = [
  'projects', 'tasks', 'milestones', 'risk_issues', 'meetings', 'reports', 'deliverables',
] as const
export type BackupTable = (typeof BACKUP_TABLES)[number]

export interface PmBackup {
  format: 'pm-tool-backup'
  formatVersion: 1
  exportedAt: string
  projects: Project[]
  tasks: Task[]
  milestones: Milestone[]
  riskIssues: RiskIssue[]
  meetings: Meeting[]
  reports: ProgressReport[]
  deliverables: Deliverable[]
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id, 'en', { numeric: true })
}

type AnyTable = { entries(): IterableIterator<[string, unknown]>; get(key: string): unknown; put(key: string, value: unknown): Promise<unknown>; delete(key: string): Promise<unknown> }

function snapshotTable<T extends { id: string }>(domain: PmDomain, name: string): T[] {
  const table = domain.table(name as never) as unknown as AnyTable
  return [...table.entries()].map(([, value]) => structuredClone(value as T)).sort(byId)
}

export interface BackupSummary {
  path: string
  counts: Record<string, number>
}

/** 收集七类实体（不含 checks/宿主会话/密钥）。 */
export function collectBackup(domain: PmDomain, exportedAt = new Date().toISOString()): PmBackup {
  return {
    format: 'pm-tool-backup',
    formatVersion: 1,
    exportedAt,
    projects: snapshotTable(domain, 'projects'),
    tasks: snapshotTable(domain, 'tasks'),
    milestones: snapshotTable(domain, 'milestones'),
    riskIssues: snapshotTable(domain, 'risk_issues'),
    meetings: snapshotTable(domain, 'meetings'),
    reports: snapshotTable(domain, 'reports'),
    deliverables: snapshotTable(domain, 'deliverables'),
  }
}

/** 把一份已收集的备份原子落盘到指定/默认目录，返回路径与各类计数。 */
async function writeBackupFile(backup: PmBackup, directory?: string): Promise<BackupSummary> {
  const dir = directory ? resolve(directory) : resolveBackupDirectory()
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const stamp = backup.exportedAt.replace(/[:.]/g, '-')
  const path = resolve(dir, `pmtool-backup-${stamp}.json`)
  // 原子写：同目录 tmp + fsync + rename + fsync dir；崩溃不留撕裂备份。
  await atomicWriteFile(path, `${JSON.stringify(backup, null, 2)}\n`, { mode: 0o600 })
  return {
    path,
    counts: {
      projects: backup.projects.length,
      tasks: backup.tasks.length,
      milestones: backup.milestones.length,
      risk_issues: backup.riskIssues.length,
      meetings: backup.meetings.length,
      reports: backup.reports.length,
      deliverables: backup.deliverables.length,
    },
  }
}

/** 写带时间戳的备份文件到指定/默认目录，返回路径与各类计数。 */
export function createBackup(domain: PmDomain, directory?: string): Promise<BackupSummary> {
  return writeBackupFile(collectBackup(domain), directory)
}

export function validateBackup(value: unknown): PmBackup {
  if (!value || typeof value !== 'object') throw new Error('备份文件不是有效 JSON 对象')
  const b = value as PmBackup
  if (b.format !== 'pm-tool-backup' || b.formatVersion !== 1) throw new Error('备份文件格式不认识（format/formatVersion 不符）')
  return b
}

/** 读取并校验备份文件（不落盘）。 */
export async function readBackupFile(path: string): Promise<PmBackup> {
  const raw = await readFile(resolve(path), 'utf8')
  try {
    return validateBackup(JSON.parse(raw))
  } catch (error) {
    throw new Error(`备份文件无法解析：${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 恢复：用备份替换七类实体表。恢复前若 currently 有数据，自动写一份安全快照。
 * 表以「先清空再逐条 put」方式替换；ID 原样保留（续号由各表自增逻辑在后续 add 时基于现有 max id 计算）。
 */
export async function restoreBackup(domain: PmDomain, path: string, directory?: string): Promise<{ safetySnapshot?: string; backup: PmBackup }> {
  const backup = await readBackupFile(path)
  return applyBackup(domain, backup, directory)
}

/** OPT-06：按备份 JSON 内容（浏览器 FileReader 读入）恢复，区别于服务端路径。可注入 directory 使测试备份目录隔离。 */
export async function restoreBackupFromContent(domain: PmDomain, jsonText: string, directory?: string): Promise<{ safetySnapshot?: string; backup: PmBackup }> {
  let backup: PmBackup
  try {
    backup = validateBackup(JSON.parse(jsonText))
  } catch (error) {
    throw new Error(`备份内容无法解析（不是合法的 pmtool 备份 JSON）：${error instanceof Error ? error.message : String(error)}`)
  }
  return applyBackup(domain, backup, directory)
}

/** 把备份内容规整成「表名 → 行数组」，供逐表替换/回滚共用。 */
function rowsOf(b: PmBackup): Record<string, { id: string }[]> {
  return {
    projects: b.projects,
    tasks: b.tasks,
    milestones: b.milestones,
    risk_issues: b.riskIssues,
    meetings: b.meetings,
    reports: b.reports,
    deliverables: b.deliverables,
  }
}

/** 内部故障注入 seam：仅供测试在每次持久化写后观测/抛错，不进入任何用户命令面。 */
export interface BackupWriteHooks {
  onWrite?: (table: string, op: 'put' | 'delete', id: string) => void
}

/** 单域写链下逐表替换：先删当前全部 key，再 put 目标行。每步后触发 hooks.onWrite。 */
async function replaceAll(
  domain: PmDomain,
  data: Record<string, { id: string }[]>,
  hooks?: BackupWriteHooks,
): Promise<void> {
  for (const name of BACKUP_TABLES) {
    const table = domain.table(name as never) as unknown as AnyTable
    for (const [id] of [...table.entries()]) {
      await table.delete(id)
      hooks?.onWrite?.(name, 'delete', id)
    }
    for (const row of data[name]) {
      await table.put(row.id, row)
      hooks?.onWrite?.(name, 'put', row.id)
    }
  }
}

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e))

/** 内部入口：与 restoreBackup 同逻辑，但暴露可选 hooks 供测试注入故障；不进入任何用户命令面。 */
export async function applyBackup(
  domain: PmDomain,
  backup: PmBackup,
  directory?: string,
  hooks?: BackupWriteHooks,
): Promise<{ safetySnapshot?: string; backup: PmBackup }> {
  // 1) 删除前先对全部七类实体做完整 schema + 关系预检；任何一条不合法直接抛错，不触碰现有数据。
  await precheckBackup(backup)

  // 2) 预取 before 内存快照（entries 同步快照 + structuredClone，单 tick 一致）。
  //    它既是安全快照的落盘内容，也是中途失败后自动回滚的唯一来源——不回读磁盘，保证回滚源与落盘字节同源、确定性。
  const before = collectBackup(domain)
  const hasData = Object.values(rowsOf(before)).some(rows => rows.length > 0)
  let safetySnapshot: string | undefined
  if (hasData) {
    // 安全快照先原子落盘；这一步失败即抛错，绝不进入破坏性写。
    safetySnapshot = (await writeBackupFile(before, directory)).path
  }

  // 3) 破坏性替换。单域写链「先落盘再改内存」：第 K 步失败时，已 await 的写均已持久化且在内存，
  //    后续表仍是旧态——因此 catch 里用 before 确定性重放回滚。
  try {
    await replaceAll(domain, rowsOf(backup), hooks)
  } catch (applyError) {
    let rollbackError: unknown
    try {
      await replaceAll(domain, rowsOf(before), hooks)
    } catch (e) {
      rollbackError = e
    }
    if (rollbackError == null) {
      throw new Error(
        `恢复中途失败，但已自动回滚到恢复前状态；安全快照：${safetySnapshot ?? '（当前库为空，未生成快照）'}。` +
        `原始错误：${errMsg(applyError)}`,
        { cause: applyError },
      )
    }
    // 恢复失败 + 回滚也失败：合并为单一错误，明确指向安全快照人工恢复。
    throw new Error(
      `恢复失败且自动回滚失败；请勿继续操作，请用安全快照手动恢复：${safetySnapshot ?? '（无）'}。`,
      { cause: new AggregateError([applyError, rollbackError], 'apply 与 rollback 均失败') },
    )
  }
  return { safetySnapshot, backup }
}

/** 删除前预检：逐条按 record schema 校验，并校验任务 projectId/parentId/milestoneId 关系。 */
export async function precheckBackup(backup: PmBackup): Promise<void> {
  const { projectRecordSchema } = await import('./project.js')
  const { taskRecordSchema } = await import('./task.js')
  const { milestoneRecordSchema } = await import('./milestone.js')
  const { riskIssueRecordSchema } = await import('./risk-issue.js')
  const { meetingRecordSchema } = await import('./meeting.js')
  const { progressReportRecordSchema } = await import('./progress-report.js')
  const { deliverableRecordSchema } = await import('./deliverable.js')

  const must = (rows: unknown[], schema: { parse(x: unknown): unknown }, kind: string): void => {
    for (const r of rows) schema.parse(r)
  }
  must(backup.projects, projectRecordSchema, '项目')
  must(backup.tasks, taskRecordSchema, '任务')
  must(backup.milestones, milestoneRecordSchema, '里程碑')
  must(backup.riskIssues, riskIssueRecordSchema, '风险')
  must(backup.meetings, meetingRecordSchema, '会议')
  must(backup.reports, progressReportRecordSchema, '汇报')
  must(backup.deliverables, deliverableRecordSchema, '交付物')

  // 关系：任务所属项目存在、parentId/milestoneId 同项目存在、predecessorIds 存在/同项目/无环
  const pids = new Set(backup.projects.map(p => p.id))
  const mids = new Set(backup.milestones.map(m => m.id))
  const tids = new Set(backup.tasks.map(t => t.id))
  for (const t of backup.tasks) {
    if (!pids.has(t.projectId)) throw new Error(`任务 ${t.id} 的 projectId ${t.projectId} 不在备份项目内`)
    if (t.parentId != null && !tids.has(t.parentId)) throw new Error(`任务 ${t.id} 的 parentId 不存在`)
    if (t.milestoneId != null && !mids.has(t.milestoneId)) throw new Error(`任务 ${t.id} 的 milestoneId 不存在`)
    for (const pid of t.predecessorIds ?? []) {
      if (pid === t.id) throw new Error(`任务 ${t.id} 把自己列为前置依赖`)
      const pre = backup.tasks.find(x => x.id === pid)
      if (!pre) throw new Error(`任务 ${t.id} 的前置依赖 ${pid} 不存在`)
      if (pre.projectId !== t.projectId) throw new Error(`任务 ${t.id} 的前置依赖 ${pid} 不在同一项目`)
    }
  }
  // 成环预检：沿 predecessorIds DFS，任一任务能回到自身即拒绝整份备份。
  const byId = new Map(backup.tasks.map(t => [t.id, t]))
  for (const start of backup.tasks) {
    const seen = new Set<string>()
    const queue: string[] = [...(start.predecessorIds ?? [])]
    while (queue.length) {
      const cur = queue.shift()!
      if (cur === start.id) throw new Error(`任务 ${start.id} 的前置依赖存在循环`)
      if (seen.has(cur)) continue
      seen.add(cur)
      for (const next of byId.get(cur)?.predecessorIds ?? []) queue.push(next)
    }
  }
}

/** 兼容旧导出入口（保留 R4 整库 JSON 导出）。 */
export async function exportBackupJson(
  domain: PmDomain,
  directory?: string,
  overwrite = false,
): Promise<{ path: string, content: string, backup: PmBackup }> {
  const backup = collectBackup(domain)
  const content = `${JSON.stringify(backup, null, 2)}\n`
  const dir = directory ? resolve(directory) : resolveBackupDirectory()
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const path = resolve(dir, 'pmtool-backup.json')
  await writeExportFile(path, content, overwrite)
  return { path, content, backup }
}
