/**
 * R18 备份/恢复：覆盖七类强 schema 实体，以及白名单 extra 业务表（不含宿主会话/checks/任何密钥）。
 * 备份为带时间戳与 file bundle manifest 的 JSON；恢复前自动生成一份安全快照。
 */
import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises'
import { resolve, isAbsolute } from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { writeExportFile, resolveIsolatedExportDirectory, isolatedExportBase } from './export.js'
import { writeBundleDir, backupJsonSha, precheckBackupBytes, restoreAssetBytes, rollbackAssetBytes } from './file-backup.js'
import { contentAddressedRelPath, validateUploadedFile } from './file-assets.js'
import { enqueueDomainWrite } from './projects.js'
import type { Milestone } from './milestone.js'
import type { Project } from './project.js'
import type { FileAssetRecord, PmDomain } from './storage.js'
import type { Task } from './task.js'
import type { RiskIssue } from './risk-issue.js'
import type { Meeting } from './meeting.js'
import type { ProgressReport } from './progress-report.js'
import { normalizeProgressReportRecord } from './progress-report.js'
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

/**
 * 其余业务表（按原始 key/value 整表备份/恢复，预检复用现有 domain schema，不规整或迁移原值）：
 * settings（出站日志/收件区等设置键）、reflections（复盘草稿）、okrs、lessons、habits、file_assets（字节 bundle 随备份发布）。
 * 宿主表 checks/sessions 与任何密钥不进备份。
 */
export const EXTRA_BACKUP_TABLES = ['settings', 'reflections', 'okrs', 'lessons', 'habits', 'file_assets'] as const

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
  /**
   * 额外业务表：表名 → [key, row][] 键值对（保留 settings 等非 id 主键）。
   * 旧版备份无此键（undefined）时按空处理，legacy 读取/恢复不受影响。
   */
  extra?: Record<string, [string, unknown][]>
  /** B3：字节 sidecar 包 ID（随机 hex）；JSON 最后提交，旧备份在提交前保持完好。 */
  fileBundleId?: string
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id, 'en', { numeric: true })
}

type AnyTable = { entries(): IterableIterator<[string, unknown]>; get(key: string): unknown; put(key: string, value: unknown): Promise<unknown>; delete(key: string): Promise<unknown> }

function snapshotTable<T extends { id: string }>(domain: PmDomain, name: string): T[] {
  const table = domain.table(name as never) as unknown as AnyTable
  return [...table.entries()].map(([, value]) => structuredClone(value as T)).sort(byId)
}

/** 额外业务表按原始键值对快照（settings 等非 id 主键），unknown-safe 不逐条强 schema。 */
function snapshotEntries(domain: PmDomain, name: string): [string, unknown][] {
  const table = domain.table(name as never) as unknown as AnyTable
  return [...table.entries()].map(([key, value]) => [key, structuredClone(value)] as [string, unknown])
}

export interface BackupSummary {
  path: string
  counts: Record<string, number>
}

/** 收集七类强 schema 实体 + 其余业务表（extra，unknown-safe）。 */
export function collectBackup(domain: PmDomain, exportedAt = new Date().toISOString()): PmBackup {
  const extra: Record<string, [string, unknown][]> = {}
  for (const name of EXTRA_BACKUP_TABLES) {
    extra[name] = snapshotEntries(domain, name)
  }
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
    extra,
  }
}

/**
 * 把一份已收集的备份原子落盘：临时区写 JSON + 字节 bundle，先 rename bundle、最后 rename JSON 提交；
 * 任一步失败清理临时区，绝不覆盖/破坏既有备份。
 */
async function writeBackupFile(backup: PmBackup, directory?: string): Promise<BackupSummary> {
  const dir = directory ? resolve(directory) : resolveBackupDirectory()
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const stamp = backup.exportedAt.replace(/[:.]/g, '-')
  const bundleId = randomBytes(8).toString('hex')
  backup.fileBundleId = bundleId
  const path = resolve(dir, `pmtool-backup-${stamp}.json`)
  const jsonText = `${JSON.stringify(backup, null, 2)}\n`
  const jsonSha = backupJsonSha(jsonText)
  const staging = resolve(dir, `.staging-${stamp}-${bundleId}`)
  const bundleFinal = `${path}.files.${bundleId}`
  try {
    await mkdir(staging, { recursive: true, mode: 0o700 })
    // 临时 JSON（未提交）+ 临时 bundle（无资产行时也建空目录，保证 rename 存在）。
    await writeFile(resolve(staging, 'backup.json'), jsonText, { mode: 0o600 })
    await mkdir(resolve(staging, `files.${bundleId}`), { recursive: true, mode: 0o700 })
    await writeBundleDir(backup, resolve(staging, `files.${bundleId}`), bundleId, jsonSha)
    // bundle 先就位，JSON 最后提交；崩溃/失败时旧 JSON 完好、新 JSON 不可见。
    await rename(resolve(staging, `files.${bundleId}`), bundleFinal)
    await rename(resolve(staging, 'backup.json'), path)
  } catch (error) {
    await rm(staging, { recursive: true, force: true }).catch(() => {})
    await rm(bundleFinal, { recursive: true, force: true }).catch(() => {})
    throw error
  }
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
      ...Object.fromEntries(Object.entries(backup.extra ?? {}).map(([name, rows]) => [name, rows.length])),
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
  // legacy 备份无 extra（undefined）即按缺省、保留当前额外表；若提供必须是「白名单表名 → 键值对数组」映射。
  if (b.extra !== undefined) {
    if (!b.extra || typeof b.extra !== 'object' || Array.isArray(b.extra)) {
      throw new Error('备份 extra 段格式不认识（应为表名到键值对数组的映射）')
    }
    for (const name of Object.keys(b.extra)) {
      if (!EXTRA_BACKUP_TABLES.includes(name as (typeof EXTRA_BACKUP_TABLES)[number])) {
        throw new Error(`备份含未授权的额外表 ${name}，拒绝恢复（白名单：${EXTRA_BACKUP_TABLES.join('/')}）`)
      }
      if (!Array.isArray(b.extra[name]) || b.extra[name].some(row =>
        !Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string' || !row[0])) {
        throw new Error(`备份 extra.${name} 格式不正确（应为 [非空主键, 记录] 数组）`)
      }
    }
  }
  // B3：fileBundleId 是 envelope 身份/字节 sidecar 定位键，必须原样保留（绝不因 DB 内容往返而丢弃）；
  // 仅在提供时做字符串非空校验，缺省（旧备份）保持 undefined。
  if (b.fileBundleId !== undefined) {
    if (typeof b.fileBundleId !== 'string' || !b.fileBundleId.trim()) {
      throw new Error('备份 fileBundleId 格式不认识（应为非空字符串）')
    }
    b.fileBundleId = b.fileBundleId.trim()
  }
  return b
}

/** 读取并校验备份文件（不落盘）。 */
export async function readBackupFile(path: string): Promise<PmBackup> {
  return (await readBackupSource(path)).backup
}

async function readBackupSource(path: string): Promise<{ backup: PmBackup; path: string; jsonSha: string }> {
  const raw = await readFile(resolve(path), 'utf8')
  try {
    return { backup: validateBackup(JSON.parse(raw)), path: resolve(path), jsonSha: backupJsonSha(raw) }
  } catch (error) {
    throw new Error(`备份文件无法解析：${error instanceof Error ? error.message : String(error)}`)
  }
}

/** 路径演练：与确认恢复同级的只读 schema/关系/完整侧车字节预检，不生成安全快照。 */
export async function precheckBackupFile(path: string): Promise<PmBackup> {
  const source = await readBackupSource(path)
  await precheckBackupSource(source.backup, source.path, source.jsonSha)
  return source.backup
}

/**
 * 恢复：用备份替换七类实体表。恢复前若 currently 有数据，自动写一份安全快照。
 * 表以「先清空再逐条 put」方式替换；ID 原样保留（续号由各表自增逻辑在后续 add 时基于现有 max id 计算）。
 */
export async function restoreBackup(domain: PmDomain, path: string, directory?: string): Promise<{ safetySnapshot?: string; backup: PmBackup }> {
  const source = await readBackupSource(path)
  return applyBackup(domain, source.backup, directory, undefined, source.path, source.jsonSha)
}

/** OPT-06：按备份 JSON 内容（浏览器 FileReader 读入）恢复，区别于服务端路径。可注入 directory 使测试备份目录隔离。 */
export async function restoreBackupFromContent(domain: PmDomain, jsonText: string, directory?: string): Promise<{ safetySnapshot?: string; backup: PmBackup }> {
  return applyBackup(domain, parseBackupContent(jsonText), directory)
}

function parseBackupContent(jsonText: string): PmBackup {
  try {
    return validateBackup(JSON.parse(jsonText))
  } catch (error) {
    throw new Error(`备份内容无法解析（不是合法的 pmtool 备份 JSON）：${error instanceof Error ? error.message : String(error)}`)
  }
}

/** 网页 JSON-only 演练：先完整校验可识别内容，不能以缺少侧车掩盖结构或关系错误。 */
export async function precheckBackupContent(jsonText: string): Promise<PmBackup> {
  const backup = parseBackupContent(jsonText)
  await precheckBackupSource(backup)
  return backup
}

async function precheckBackupSource(backup: PmBackup, assetPath?: string, assetJsonSha?: string): Promise<void> {
  await precheckBackup(backup)
  if (assetPath == null || assetJsonSha == null) {
    assertContentHasNoFiles(backup)
    return
  }
  await precheckBackupBytes(backup, assetPath, assetJsonSha)
  // 复用提升时的文件白名单/媒体/大小校验，先拒绝不可提升或元数据与实际字节不一致的包。
  for (const [, value] of backup.extra?.file_assets ?? []) {
    const row = value as FileAssetRecord
    const bytes = await readFile(resolve(`${assetPath}.files.${backup.fileBundleId}`, row.relPath))
    const file = validateUploadedFile({ originalName: row.fileName, declaredMediaType: row.mediaType, bytes })
    if (file.size !== row.size || file.sha256 !== row.sha256) {
      throw new Error(`备份文件资产 ${row.id} 的实际字节大小或 sha256 与元数据不符`)
    }
    if (contentAddressedRelPath(file) !== row.relPath) {
      throw new Error(`备份文件资产 ${row.id} 的 relPath 与内容寻址路径不符`)
    }
  }
}

function assertContentHasNoFiles(backup: PmBackup): void {
  if ((backup.extra?.file_assets ?? []).length > 0) {
    throw new Error('备份含 file_assets 附件，但仅提供 JSON 内容，未检验侧车字节，不能判为预检通过或恢复。请填写本机标准备份 JSON 的完整路径，并保留同目录 .files.<fileBundleId> 侧车后重新预检。')
  }
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
  /** 每提升一条新字节后调用（测试故障注入可在此抛错，已写字节仍进入回滚清单）。 */
  onPromoteBytes?: (relPath: string) => void
}

/** 单域写链下逐表替换：先删当前全部 key，再 put 目标行。每步后触发并等待 hooks.onWrite。 */
async function replaceAll(
  domain: PmDomain,
  data: Record<string, { id: string }[]>,
  extra?: Record<string, [string, unknown][]>,
  hooks?: BackupWriteHooks,
): Promise<void> {
  for (const name of BACKUP_TABLES) {
    const table = domain.table(name as never) as unknown as AnyTable
    for (const [id] of [...table.entries()]) {
      await table.delete(id)
      await hooks?.onWrite?.(name, 'delete', id)
    }
    for (const row of data[name]) {
      await table.put(row.id, row)
      await hooks?.onWrite?.(name, 'put', row.id)
    }
  }
  // 额外业务表：
  //  - legacy 备份无 extra（undefined）→ 整块跳过，保留当前 settings/okrs/habits/lessons/reflections，绝不借旧备份清空新键。
  //  - extra 明确提供 → 只处理备份里【显式出现】的白名单表：显式空数组即意图清空该表；未出现的表保持现状。
  //  - 白名单外的未知表名一律拒绝，不得把任意 extra 覆盖进宿主/命名空间。
  if (extra !== undefined) {
    for (const [name, rows] of Object.entries(extra)) {
      if (!EXTRA_BACKUP_TABLES.includes(name as (typeof EXTRA_BACKUP_TABLES)[number])) {
        throw new Error(`备份含未授权的额外表 ${name}，拒绝恢复（白名单：${EXTRA_BACKUP_TABLES.join('/')}）`)
      }
      const table = domain.table(name as never) as unknown as AnyTable
      for (const [id] of [...table.entries()]) {
        await table.delete(id)
        await hooks?.onWrite?.(name, 'delete', id)
      }
      for (const [key, row] of rows) {
        await table.put(key, row)
        await hooks?.onWrite?.(name, 'put', key)
      }
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
  assetPath?: string,
  assetJsonSha?: string,
): Promise<{ safetySnapshot?: string; backup: PmBackup }> {
  // 1) 删除前先对全部七类实体做完整 schema + 关系预检；任何一条不合法直接抛错，不触碰现有数据。
  //    预检只读备份内容、不碰 domain，放全局写队列外，避免大备份校验期间占住写队列。
  await precheckBackupSource(backup, assetPath, assetJsonSha)

  // 2) 其余步骤整体进入全局单写者队列临界区：before 内存快照、安全快照落盘、replaceAll 破坏性替换、
  //    失败回滚必须与普通写严格互斥——否则恢复期间并发的普通写会被 replaceAll/回滚的整表清空抹掉。
  //    临界区内只做 collectBackup/replaceAll 这类表级直写，绝不再次调用 enqueueDomainWrite
  //    （嵌套入队会等待外层尾 promise，形成队列死锁）。
  return enqueueDomainWrite(domain, async () => {
    // 3) 预取 before 内存快照（entries 同步快照 + structuredClone，单 tick 一致）。
    //    它既是安全快照的落盘内容，也是中途失败后自动回滚的唯一来源——不回读磁盘，保证回滚源与落盘字节同源、确定性。
    const before = collectBackup(domain)
    const hasData = Object.values(rowsOf(before)).some(rows => rows.length > 0)
      || Object.values(before.extra ?? {}).some(rows => rows.length > 0)
    let safetySnapshot: string | undefined
    if (hasData) {
      // 安全快照先原子落盘；这一步失败即抛错，绝不进入破坏性写。
      safetySnapshot = (await writeBackupFile(before, directory)).path
    }

    // 4) 破坏性替换。单域写链「先落盘再改内存」：第 K 步失败时，已 await 的写均已持久化且在内存，
    //    后续表仍是旧态——因此 catch 里用 before 确定性重放回滚。
    let rollbackNewly: string[] = []
    try {
      await replaceAll(domain, rowsOf(backup), backup.extra, hooks)
      // DB 替换成功后再内容寻址提升字节；本次新写 relPath 供失败回滚。
      if (assetPath != null && assetJsonSha != null) {
        const promoted = await restoreAssetBytes(backup, assetPath, assetJsonSha, rel => {
          rollbackNewly.push(rel)
          hooks?.onPromoteBytes?.(rel)
        })
        rollbackNewly = promoted.newlyWritten
      }
      return { safetySnapshot, backup }
    } catch (applyError) {
      let rollbackError: unknown
      try {
        await replaceAll(domain, rowsOf(before), before.extra, hooks)
        await rollbackAssetBytes(rollbackNewly)
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
  })
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
  const { fileAssetRecordSchema, pmDomainSpec } = await import('./storage.js')

  const must = (rows: unknown[], schema: { parse(x: unknown): unknown }, kind: string): void => {
    if (!Array.isArray(rows)) throw new Error(`备份${kind}表应为数组`)
    for (const r of rows) schema.parse(r)
  }
  must(backup.projects, projectRecordSchema, '项目')
  must(backup.tasks, taskRecordSchema, '任务')
  must(backup.milestones, milestoneRecordSchema, '里程碑')
  must(backup.riskIssues, riskIssueRecordSchema, '风险')
  must(backup.meetings, meetingRecordSchema, '会议')
  must(backup.reports.map(normalizeProgressReportRecord), progressReportRecordSchema, '汇报')
  must(backup.deliverables, deliverableRecordSchema, '交付物')
  for (const [name, rows] of Object.entries(backup.extra ?? {})) {
    if (!EXTRA_BACKUP_TABLES.includes(name as (typeof EXTRA_BACKUP_TABLES)[number])) {
      throw new Error(`备份含未授权的额外表 ${name}，拒绝恢复`)
    }
    if (!Array.isArray(rows)) throw new Error(`备份 extra.${name} 格式不正确`)
    const keys = new Set<string>()
    for (const pair of rows) {
      if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || !pair[0] || keys.has(pair[0])) {
        throw new Error(`备份 extra.${name} 主键格式不正确或重复`)
      }
      keys.add(pair[0])
      pmDomainSpec.tables[name as (typeof EXTRA_BACKUP_TABLES)[number]].valueSchema.parse(pair[1])
    }
  }

  // 关系：任务所属项目存在、parentId/milestoneId 同项目存在、predecessorIds 存在/同项目/无环
  const pids = new Set(backup.projects.map(p => p.id))
  const assets = new Map<string, { projectId: string }>()
  for (const [key, value] of backup.extra?.file_assets ?? []) {
    const row = fileAssetRecordSchema.parse(value)
    if (key !== row.id || assets.has(key)) throw new Error(`文件资产 ${key} 的主键不符或重复`)
    if (!pids.has(row.projectId)) throw new Error(`文件资产 ${key} 的 projectId 不在备份项目内`)
    if (isAbsolute(row.relPath) || row.relPath.includes('\\') || row.relPath.includes('\0')) {
      throw new Error(`文件资产 ${key} 路径不合法：${row.relPath}`)
    }
    if (/(^|\/)\.\.(\/|$)/.test(row.relPath)) throw new Error(`文件资产 ${key} 路径越界：${row.relPath}`)
    if (!row.relPath.startsWith(`${row.sha256.slice(0, 2)}/`)) throw new Error(`文件资产 ${key} 路径与 sha256 不符`)
    assets.set(key, row)
  }
  const milestoneProjectById = new Map(backup.milestones.map(m => [m.id, m.projectId]))
  const deliverableProjectById = new Map(backup.deliverables.map(d => [d.id, d.projectId]))
  const tids = new Set(backup.tasks.map(t => t.id))
  const byId = new Map(backup.tasks.map(t => [t.id, t]))
  for (const t of backup.tasks) {
    if (!pids.has(t.projectId)) throw new Error(`任务 ${t.id} 的 projectId ${t.projectId} 不在备份项目内`)
    for (const attachment of t.attachments ?? []) {
      if (attachment.kind === 'file' && assets.get(attachment.assetId)?.projectId !== t.projectId) {
        throw new Error(`任务 ${t.id} 的文件资产 ${attachment.assetId} 不存在或不属于本项目`)
      }
    }
    if (t.parentId != null && !tids.has(t.parentId)) throw new Error(`任务 ${t.id} 的 parentId 不存在`)
    if (t.parentId != null && byId.get(t.parentId)?.projectId !== t.projectId) {
      throw new Error(`任务 ${t.id} 的 parentId 不属于本项目`)
    }
    const parents = new Set([t.id])
    let parentId = t.parentId
    while (parentId != null) {
      if (parents.has(parentId)) throw new Error(`任务 ${t.id} 的 parentId 存在循环`)
      parents.add(parentId)
      parentId = byId.get(parentId)?.parentId ?? null
    }
    if (t.milestoneId != null) {
      if (milestoneProjectById.get(t.milestoneId) !== t.projectId) {
        throw new Error(`任务 ${t.id} 的 milestoneId ${t.milestoneId} 不存在或不属于本项目`)
      }
    }
    if (t.deliverableId != null) {
      if (deliverableProjectById.get(t.deliverableId) !== t.projectId) {
        throw new Error(`任务 ${t.id} 的交付物 ${t.deliverableId} 不存在或不属于本项目`)
      }
    }
    for (const pid of t.predecessorIds ?? []) {
      if (pid === t.id) throw new Error(`任务 ${t.id} 把自己列为前置依赖`)
      const pre = backup.tasks.find(x => x.id === pid)
      if (!pre) throw new Error(`任务 ${t.id} 的前置依赖 ${pid} 不存在`)
      if (pre.projectId !== t.projectId) throw new Error(`任务 ${t.id} 的前置依赖 ${pid} 不在同一项目`)
    }
  }
  // U5：交付物非空 milestoneId 必须在备份内且同项目，避免恢复出悬空关联。
  for (const d of backup.deliverables) {
    if (!d.milestoneId) continue
    if (milestoneProjectById.get(d.milestoneId) !== d.projectId) {
      throw new Error(`交付物 ${d.id} 的 milestoneId ${d.milestoneId} 不存在或不属于本项目`)
    }
  }

  // 成环预检：沿 predecessorIds DFS，任一任务能回到自身即拒绝整份备份。
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
  const dir = isolatedExportBase()
    ? await resolveIsolatedExportDirectory(directory)
    : directory
      ? resolve(directory)
      : resolveBackupDirectory()
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const path = resolve(dir, 'pmtool-backup.json')
  await writeExportFile(path, content, overwrite)
  return { path, content, backup }
}
