/**
 * R18 备份/恢复：只覆盖 pmtool 领域七类实体（不含宿主会话/checks/任何密钥）。
 * 备份为带时间戳与 manifest 的 JSON；恢复前自动生成一份安全快照。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeExportFile } from './export.js'
import type { Milestone } from './milestone.js'
import type { Project } from './project.js'
import type { PmDomain } from './storage.js'
import type { Task } from './task.js'
import type { RiskIssue } from './risk-issue.js'
import type { Meeting } from './meeting.js'
import type { ProgressReport } from './progress-report.js'
import type { Deliverable } from './deliverable.js'

/** 默认备份目录：产品仓库 backups/（gitignored）。 */
export const defaultBackupDirectory = fileURLToPath(new URL('../../../backups/', import.meta.url))

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

/** 写带时间戳的备份文件到指定/默认目录，返回路径与各类计数。 */
export async function createBackup(domain: PmDomain, directory?: string): Promise<BackupSummary> {
  const backup = collectBackup(domain)
  const stamp = backup.exportedAt.replace(/[:.]/g, '-')
  const dir = directory ? resolve(directory) : defaultBackupDirectory
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const path = resolve(dir, `pmtool-backup-${stamp}.json`)
  await writeFile(path, `${JSON.stringify(backup, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
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

function validateBackup(value: unknown): PmBackup {
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
export async function restoreBackup(domain: PmDomain, path: string): Promise<{ safetySnapshot?: string; backup: PmBackup }> {
  const backup = await readBackupFile(path)

  // 恢复前自动安全快照（仅当当前已有任一实体）。
  let safetySnapshot: string | undefined
  const hasData = BACKUP_TABLES.some(name => (domain.table(name as never) as unknown as AnyTable).entries().next().done === false)
  if (hasData) {
    const safety = await createBackup(domain)
    safetySnapshot = safety.path
  }

  const data: Record<string, { id: string }[]> = {
    projects: backup.projects,
    tasks: backup.tasks,
    milestones: backup.milestones,
    risk_issues: backup.riskIssues,
    meetings: backup.meetings,
    reports: backup.reports,
    deliverables: backup.deliverables,
  }
  for (const name of BACKUP_TABLES) {
    const table = domain.table(name as never) as unknown as AnyTable
    for (const [id] of [...table.entries()]) await table.delete(id)
    for (const row of data[name]) await table.put(row.id, row)
  }
  return { safetySnapshot, backup }
}

/** 兼容旧导出入口（保留 R4 整库 JSON 导出）。 */
export async function exportBackupJson(
  domain: PmDomain,
  directory?: string,
  overwrite = false,
): Promise<{ path: string, content: string, backup: PmBackup }> {
  const backup = collectBackup(domain)
  const content = `${JSON.stringify(backup, null, 2)}\n`
  const dir = directory ? resolve(directory) : defaultBackupDirectory
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const path = resolve(dir, 'pmtool-backup.json')
  await writeExportFile(path, content, overwrite)
  return { path, content, backup }
}
