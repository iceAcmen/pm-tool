/** 整库可读 JSON 数据包；不包含 checks 自检表。 */
import { resolveExportPath, writeExportFile } from './export.js'
import type { Milestone } from './milestone.js'
import type { Project } from './project.js'
import type { PmDomain } from './storage.js'
import type { Task } from './task.js'

export interface PmBackup {
  format: 'pm-tool-backup'
  formatVersion: 1
  exportedAt: string
  projects: Project[]
  tasks: Task[]
  milestones: Milestone[]
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id, 'en', { numeric: true })
}

export function collectBackup(domain: PmDomain, exportedAt = new Date().toISOString()): PmBackup {
  const values = <T>(table: { entries(): IterableIterator<[string, T]> }): T[] =>
    [...table.entries()].map(([, value]) => structuredClone(value))
  return {
    format: 'pm-tool-backup',
    formatVersion: 1,
    exportedAt,
    projects: values(domain.table('projects')).sort(byId),
    tasks: values(domain.table('tasks')).sort(byId),
    milestones: values(domain.table('milestones')).sort(byId),
  }
}

export async function exportBackupJson(
  domain: PmDomain,
  directory?: string,
  overwrite = false,
): Promise<{ path: string, content: string, backup: PmBackup }> {
  const backup = collectBackup(domain)
  const content = `${JSON.stringify(backup, null, 2)}\n`
  const path = resolveExportPath(directory, 'pmtool-backup.json')
  await writeExportFile(path, content, overwrite)
  return { path, content, backup }
}
