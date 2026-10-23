/**
 * B3 文件资产域服务：校验 → 内容寻址落盘 → file_assets 元数据幂等登记。
 *
 * 边界：本模块不解析 multipart、不直接收网络 body；调用方（CLI base64 / 后续 web 路由）先完成
 * 编码长度预检与 decode，把字节 Buffer 交入。root 由显式 env 或候选隔离根决定，绝不取 process.cwd()。
 *
 * 一致性：validateUploadedFile → storeAssetBuffer（tmp→fsync→rename 原子）→ 域写队列内幂等登记；
 * 同 sha256 复用既有行/字节，不重复。DB 登记失败且本次确实新建了字节、且无任何元数据行引用该 hash 时，
 * 仅删除本次新建的孤儿字节（不删既有命中）。
 */
import { resolve, join, sep } from 'node:path'
import { fileURLToPath as f2p } from 'node:url'
import { mkdir, unlink, readdir, lstat, writeFile, rename } from 'node:fs/promises'
import {
  validateUploadedFile,
  storeAssetBuffer,
  readAssetBuffer,
  type ValidatedFile,
  FileAssetRejectedError,
} from './file-assets.js'
import { enqueueDomainWrite } from './projects.js'
import { taskWriteSchema, type AttachmentItem, type Task } from './task.js'
import type { PmDomain, FileAssetRecord } from './storage.js'
import { MaterialNotFoundError, applyTaskDraftOps, TaskOpsError, type TaskDraftOps } from './task-materials.js'
import { prepareStage, finalizeStage } from './file-staging.js'

export const FILE_ROOT_ENV = 'DSH_PM_FILE_ROOT'
export { FileAssetRejectedError, readAssetBuffer }

/** 包内默认资产目录（与 exports 同深度：src/core → 包根），仅 test/dev 回退，生产不可用。 */
const BUILTIN_ASSETS_DIR = f2p(new URL('../../../../assets/', import.meta.url))

export class FileRootUnavailableError extends Error {
  constructor() {
    super('文件根未配置：生产请设置 DSH_PM_FILE_ROOT（或由 profile 提供 DSH_HOME）；当前无法写入/上传资产。')
    this.name = 'FileRootUnavailableError'
  }
}

/** 候选隔离根（复用导出同一开关），未设置返回 undefined。 */
function isolatedBase(): string | undefined {
  const v = process.env.DSH_PM_ISOLATED_ROOT?.trim()
  return v ? resolve(v) : undefined
}

/** dev/test 信号：NODE_ENV=test 或显式 DSH_DEV；只有这些场景允许包内 builtin-dev 回退。 */
function allowBuiltinDev(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.DSH_DEV === '1' || process.env.DSH_DEV === 'true'
}

export type FileRootSource = 'explicit' | 'isolated' | 'profile' | 'builtin-dev' | 'unavailable'

/**
 * F2 文件根来源：
 *   explicit  DSH_PM_FILE_ROOT 显式（生产首选）
 *   isolated  DSH_PM_ISOLATED_ROOT/files（测试/隔离）
 *   profile   ${DSH_HOME}/profiles/pm/data/assets（跟运行 profile，不猜 ~/.dsh）
 *   builtin-dev 仅 test/dev 信号下的包内回退
 *   unavailable 生产且三者皆缺 → 写路径 fail-closed；读路径容忍。
 */
export async function describeFileRoot(): Promise<{ dir: string | undefined; source: FileRootSource }> {
  const explicit = process.env[FILE_ROOT_ENV]?.trim()
  if (explicit) {
    const dir = resolve(explicit)
    await mkdir(dir, { recursive: true, mode: 0o700 })
    return { dir, source: 'explicit' }
  }
  const iso = isolatedBase()
  if (iso) {
    const dir = `${iso}/files`
    await mkdir(dir, { recursive: true, mode: 0o700 })
    return { dir, source: 'isolated' }
  }
  const dshHome = process.env.DSH_HOME?.trim()
  if (dshHome) {
    const dir = resolve(dshHome, 'profiles', 'pm', 'data', 'assets')
    await mkdir(dir, { recursive: true, mode: 0o700 })
    return { dir, source: 'profile' }
  }
  if (allowBuiltinDev()) {
    await mkdir(BUILTIN_ASSETS_DIR, { recursive: true, mode: 0o700 })
    return { dir: BUILTIN_ASSETS_DIR, source: 'builtin-dev' }
  }
  return { dir: undefined, source: 'unavailable' }
}

/** 写/上传用严格解析：生产无配置直接 fail-closed 抛错。 */
export async function resolveFileRoot(): Promise<string> {
  const { dir, source } = await describeFileRoot()
  if (source === 'unavailable' || !dir) throw new FileRootUnavailableError()
  return dir
}

/** 读/扫描用宽松解析：无配置返回 undefined，不抛错（snapshot/doctor/GC 空跑）。 */
export async function resolveFileRootOptional(): Promise<string | undefined> {
  const { dir } = await describeFileRoot()
  return dir
}

export interface RegisterAssetInput {
  projectId: string
  originalName: string
  declaredMediaType?: string
  bytes: Buffer
  note?: string
}

export interface RegisteredAsset extends FileAssetRecord {
  alreadyExisted: boolean
}

function rowsOf(table: { entries(): IterableIterator<[string, unknown]> }): FileAssetRecord[] {
  return [...table.entries()].map(([, v]) => v as FileAssetRecord)
}

function nextAssetId(rows: FileAssetRecord[]): string {
  let max = 0
  for (const r of rows) {
    const m = /^fa-(\d+)$/.exec(r.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `fa-${String(max + 1).padStart(4, '0')}`
}

/**
 * 登记一个上传文件：校验、内容寻址落盘、幂等元数据。
 * 同 sha256 已存在则复用既有行（alreadyExisted=true），不重复落盘/编号。
 */
export async function registerFileAsset(
  domain: PmDomain,
  input: RegisterAssetInput,
  nowIso?: string,
): Promise<RegisteredAsset> {
  const validated: ValidatedFile = validateUploadedFile({
    originalName: input.originalName,
    declaredMediaType: input.declaredMediaType,
    bytes: input.bytes,
  })
  const root = await resolveFileRoot()
  const stored = await storeAssetBuffer(root, validated)
  const at = nowIso ?? new Date().toISOString()

  try {
    return await enqueueDomainWrite(domain, async () => {
      const table = domain.table('file_assets')
      const existing = rowsOf(table).find(r => r.sha256 === validated.sha256)
      if (existing) return { ...existing, alreadyExisted: true }
      const record: FileAssetRecord = {
        id: nextAssetId(rowsOf(table)),
        projectId: input.projectId,
        fileName: validated.originalName,
        mediaType: validated.mediaType,
        size: validated.size,
        sha256: validated.sha256,
        relPath: stored.relPath,
        addedAt: at,
      }
      await table.put(record.id, record)
      return { ...record, alreadyExisted: false }
    })
  } catch (err) {
    // DB 登记失败：仅当本次新建了字节且无元数据行引用该 hash 时，清掉孤儿字节；不碰既有命中。
    if (!stored.alreadyExisted) {
      const stillReferenced = rowsOf(domain.table('file_assets')).some(r => r.sha256 === validated.sha256)
      if (!stillReferenced) {
        await unlink(resolve(root, stored.relPath)).catch(() => {})
      }
    }
    throw err
  }
}

function nextAttachmentId(attachments: AttachmentItem[] | undefined): string {
  let max = 0
  for (const a of attachments ?? []) {
    const m = /^at-(\d+)$/.exec(a.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `at-${max + 1}`
}

export interface AttachFileInput {
  originalName: string
  declaredMediaType?: string
  bytes: Buffer
  note?: string
}

/**
 * 把文件落盘、登记元数据、并挂到指定任务资料区，放在同一域写临界区完成逻辑绑定。
 * 文件系统先于 DB 落盘（内容寻址 tmp→rename 原子）；临界区内幂等复用同 hash 元数据，
 * 任务已挂同一 assetId 则去重返回。临界区抛错且本次新建字节、且无元数据引用时清孤儿字节。
 */
export async function attachFileToTask(
  domain: PmDomain,
  taskId: string,
  input: AttachFileInput,
  nowIso?: string,
): Promise<{ asset: FileAssetRecord; attachment: AttachmentItem; alreadyAttached: boolean }> {
  const validated = validateUploadedFile({
    originalName: input.originalName,
    declaredMediaType: input.declaredMediaType,
    bytes: input.bytes,
  })
  const root = await resolveFileRoot()
  const stored = await storeAssetBuffer(root, validated)
  const at = nowIso ?? new Date().toISOString()

  try {
    return await enqueueDomainWrite(domain, async () => {
      const taskRow = domain.table('tasks').get(taskId) as Record<string, unknown> | undefined
      if (!taskRow) throw new MaterialNotFoundError(`未找到任务：${taskId}`)
      const projectId = taskRow.projectId as string

      const table = domain.table('file_assets')
      let meta = rowsOf(table).find(r => r.sha256 === validated.sha256)
      if (!meta) {
        const record: FileAssetRecord = {
          id: nextAssetId(rowsOf(table)),
          projectId,
          fileName: validated.originalName,
          mediaType: validated.mediaType,
          size: validated.size,
          sha256: validated.sha256,
          relPath: stored.relPath,
          addedAt: at,
        }
        await table.put(record.id, record)
        meta = record
      }

      const attachments = structuredClone((taskRow.attachments as AttachmentItem[] | undefined) ?? [])
      const existing = attachments.find(a => a.kind === 'file' && a.assetId === meta!.id)
      if (existing) {
        return { asset: meta, attachment: existing, alreadyAttached: true }
      }
      const item: AttachmentItem = {
        id: nextAttachmentId(attachments),
        kind: 'file',
        assetId: meta.id,
        addedAt: at,
      }
      if (input.note?.trim()) item.note = input.note.trim()
      attachments.push(item)

      const nextInput: Record<string, unknown> = {
        ...taskRow,
        attachments,
        id: taskRow.id,
        updatedAt: at,
      }
      const next = taskWriteSchema.parse(nextInput)
      await domain.table('tasks').put(taskId, next)
      return { asset: meta, attachment: item, alreadyAttached: false }
    })
  } catch (err) {
    if (!stored.alreadyExisted) {
      const stillReferenced = rowsOf(domain.table('file_assets')).some(r => r.sha256 === validated.sha256)
      if (!stillReferenced) {
        await unlink(resolve(root, stored.relPath)).catch(() => {})
      }
    }
    throw err
  }
}

const STAGE_ID_RE = /^[a-f0-9]{32}$/
const CLIENT_ID_RE = /^c-[A-Za-z0-9_-]{1,32}$/

export interface PreparedFile {
  stageId: string
  note?: string
  clientId?: string
  assetId: string
  isNewAsset: boolean
  sha256: string
  relPath: string
  createdFile: boolean
  fileName: string
  mediaType: string
  size: number
}

/**
 * 预提升：prepare 全部 stage（校验、保留字节）→ storeAssetBuffer 内容寻址（共享幂等）→
 * 解析既有资产行或构造待登记新行；不写 DB。调用方在同一临界区 put 后再 finalize/回滚。
 */
export async function prepareFilePromotion(
  domain: PmDomain,
  projectId: string,
  fileOps: Array<{ op?: string; stageId?: string; clientId?: string; note?: string }>,
  at: string,
): Promise<{ prepared: PreparedFile[]; newRows: FileAssetRecord[] }> {
  const existingRows = rowsOf(domain.table('file_assets'))
  const newRows: FileAssetRecord[] = []
  const prepared: PreparedFile[] = []
  const seenStage = new Set<string>()
  const seenClient = new Set<string>()
  try {
    for (const o of fileOps) {
      const stageId = String(o.stageId ?? '')
      if (!STAGE_ID_RE.test(stageId)) throw new TaskOpsError('addFile 缺少合法 stageId（32 hex）')
      if (seenStage.has(stageId)) throw new TaskOpsError(`stageId 重复：${stageId}`)
      seenStage.add(stageId)
      if (o.clientId !== undefined) {
        if (!CLIENT_ID_RE.test(o.clientId)) throw new TaskOpsError(`clientId 格式非法：${o.clientId}`)
        if (seenClient.has(o.clientId)) throw new TaskOpsError(`clientId 重复：${o.clientId}`)
        seenClient.add(o.clientId)
      }
      const { validated } = await prepareStage(stageId, at)
      const root = await resolveFileRoot()
      let asset = existingRows.find(r => r.sha256 === validated.sha256)
        ?? newRows.find(r => r.sha256 === validated.sha256)
      // hash 已有身份时沿用其内容寻址扩展名，不因同内容上传为 .txt/.md 多写一份孤儿字节。
      const stored = await storeAssetBuffer(root, asset ? { ...validated, originalName: asset.relPath } : validated)
      let isNewAsset = false
      if (!asset) {
        asset = {
          id: nextAssetId([...existingRows, ...newRows]),
          projectId,
          fileName: validated.originalName,
          mediaType: validated.mediaType,
          size: validated.size,
          sha256: validated.sha256,
          relPath: stored.relPath,
          addedAt: at,
        }
        newRows.push(asset)
        isNewAsset = true
      }
      prepared.push({
        stageId,
        note: o.note,
        clientId: o.clientId,
        assetId: asset.id,
        isNewAsset,
        sha256: validated.sha256,
        relPath: stored.relPath,
        createdFile: stored.createdFile,
        fileName: validated.originalName,
        mediaType: validated.mediaType,
        size: validated.size,
      })
    }
    return { prepared, newRows }
  } catch (error) {
    // 调用方拿不到未完成的返回值，部分 prepare 必须在此补偿，保留所有 stage。
    await rollbackNewAssets(domain, newRows, prepared)
    throw error
  }
}

export type PreparedTaskFiles = Awaited<ReturnType<typeof prepareFilePromotion>>

/** 在同一写队列中调用；先 prepare，再按原附件顺序生成最终 ID，最后解析进展 refs。 */
export async function prepareTaskDraftWithFiles(
  domain: PmDomain,
  projectId: string,
  base: Parameters<typeof applyTaskDraftOps>[2],
  ops: TaskDraftOps,
  at: string,
): Promise<ReturnType<typeof applyTaskDraftOps> & { fileState: PreparedTaskFiles }> {
  const fileState = await prepareFilePromotion(
    domain, projectId, (ops.attachmentOps ?? []).filter(o => o.op === 'addFile'), at,
  )
  try {
    const files = new Map(fileState.prepared.map(p => [p.stageId, { assetId: p.assetId }]))
    return { ...applyTaskDraftOps(domain, projectId, base, ops, at, files), fileState }
  } catch (error) {
    await rollbackNewAssets(domain, fileState.newRows, fileState.prepared)
    throw error
  }
}

/** 元数据与任务一次主提交；异常的任务持久写（含写后抛错）先恢复，再由调用方补偿新资产。 */
export async function publishPreparedTask(
  domain: PmDomain,
  record: Task,
  fileState: PreparedTaskFiles | undefined,
  previous?: Task,
): Promise<void> {
  const assetTable = domain.table('file_assets')
  for (const row of fileState?.newRows ?? []) {
    try {
      await assetTable.put(row.id, row)
    } catch (error) {
      // 后端可能已经持久写入但尚未更新领域内存；不存在的内存键 delete 会短路。
      // 先恢复领域可见行，让外层补偿确实删除磁盘上的同键，而不是遗留 JSON。
      if (!assetTable.get(row.id)) await assetTable.put(row.id, row)
      throw error
    }
  }
  const table = domain.table('tasks')
  try {
    await table.put(record.id, record)
  } catch (error) {
    if (fileState?.prepared.length) {
      if (previous) await table.put(previous.id, previous)
      else {
        if (!table.get(record.id)) await table.put(record.id, record)
        await table.delete(record.id)
      }
    }
    throw error
  }
}

/** 回滚本次新建资产行（仅当全库无其它任务引用）并删除本次新建且无行引用的字节；保留 stage。 */
export async function rollbackNewAssets(
  domain: PmDomain,
  newRows: FileAssetRecord[],
  prepared: PreparedFile[],
): Promise<void> {
  const assetTable = domain.table('file_assets')
  for (const row of newRows) {
    const referenced = [...domain.table('tasks').entries()].some(([, t]) =>
      ((t as { attachments?: AttachmentItem[] }).attachments ?? []).some(a => a.kind === 'file' && a.assetId === row.id))
    if (!referenced) await assetTable.delete(row.id).catch(() => {})
  }
  if (!prepared.some(p => p.createdFile)) return
  const root = await resolveFileRoot()
  for (const p of prepared) {
    if (!p.createdFile) continue
    const rowStill = rowsOf(assetTable).some(r => r.relPath === p.relPath)
    if (!rowStill) await unlink(resolve(root, p.relPath)).catch(() => {})
  }
}

/** DB 全部成功后 finalize 所有 stage；失败仅 warning，残留由 sweep 清。 */
export async function finalizePreparedStages(prepared: PreparedFile[]): Promise<void> {
  for (const p of prepared) await finalizeStage(p.stageId).catch(() => {})
}

/**
 * material apply 与主任务保存共用 prepare/纯 ops/发布接缝；
 * 同一临界区映射最终附件 ID，任一步失败补偿新资产，成功才消费 stage。
 */
export async function applyTaskOpsWithFiles(
  domain: PmDomain,
  taskId: string,
  ops: TaskDraftOps,
  nowIso?: string,
): Promise<Record<string, unknown>> {
  const at = nowIso ?? new Date().toISOString()
  return enqueueDomainWrite(domain, async () => {
    const taskTable = domain.table('tasks')
    const record = taskTable.get(taskId)
    if (!record) throw new MaterialNotFoundError(`未找到任务：${taskId}`)
    const applied = await prepareTaskDraftWithFiles(
      domain,
      record.projectId,
      { attachments: record.attachments, progressLog: record.progressLog },
      ops,
      at,
    )
    try {
      const nextInput: Record<string, unknown> = {
        ...record,
        attachments: applied.attachments,
        progressLog: applied.progressLog,
        id: record.id,
        updatedAt: at,
      }
      const next = taskWriteSchema.parse(nextInput)
      await publishPreparedTask(domain, next, applied.fileState, record)
      await finalizePreparedStages(applied.fileState.prepared)
      return structuredClone(next)
    } catch (err) {
      await rollbackNewAssets(domain, applied.fileState.newRows, applied.fileState.prepared)
      throw err
    }
  })
}

const CONTENT_ADDR_RE = /^[0-9a-f]{2}\/[0-9a-f]{64}\.[a-z0-9]+$/

/**
 * 显式孤儿 GC（默认 dry-run，不删）：扫描内容寻址目录中未被 file_assets 元数据引用的字节。
 * 跳过 staging/ 与非内容寻址命名；apply=true 才 unlink，且只删匹配 sha 布局的文件。
 * 共享命中字节由元数据引用保护，绝不误删。
 */
export async function gcOrphanAssets(
  domain: PmDomain,
  options: { apply?: boolean; graceMs?: number } = {},
): Promise<{ orphans: string[]; removed: string[] }> {
  const root = await resolveFileRootOptional()
  if (!root) return { orphans: [], removed: [] }
  const referenced = new Set(rowsOf(domain.table('file_assets')).map(r => r.relPath))
  const graceMs = options.graceMs ?? 24 * 60 * 60 * 1000
  const cutoff = Date.now() - graceMs
  const orphans: string[] = []
  const walk = async (dir: string, prefix: string): Promise<void> => {
    let names: string[]
    try {
      names = await readdir(dir)
    } catch {
      return
    }
    for (const name of names) {
      const abs = join(dir, name)
      const rel = prefix ? `${prefix}/${name}` : name
      if (rel === 'staging' || rel.startsWith(`staging${sep}`)) continue
      let st
      try {
        st = await lstat(abs)
      } catch {
        continue
      }
      if (st.isSymbolicLink()) continue
      if (st.isDirectory()) {
        await walk(abs, rel)
        continue
      }
      if (!st.isFile()) continue
      if (!CONTENT_ADDR_RE.test(rel)) continue
      // 宽限：新落盘但元数据尚未提交的字节（写入与登记之间）不回收。
      // graceMs=0 表示显式关闭宽限（测试/立即回收），此时按年龄一律不再跳过。
      if (graceMs > 0 && st.mtimeMs > cutoff) continue
      if (!referenced.has(rel)) orphans.push(rel)
    }
  }
  await walk(root, '')
  const removed: string[] = []
  if (options.apply) {
    for (const rel of orphans) {
      await unlink(resolve(root, rel)).catch(() => {})
      removed.push(rel)
    }
  }
  return { orphans, removed }
}

export interface FileManifestAsset {
  relPath: string
  sha256: string
  size: number
  fileName: string
  mediaType: string
  projectIds: string[]
}

export interface FileManifest {
  format: 'pm-file-manifest'
  version: 1
  generatedAt: string
  count: number
  assets: FileManifestAsset[]
}

/**
 * P1 可迁移清单：从 file_assets 元数据（DB 为唯一源）生成根目录 manifest.json。
 * relPath 为相对内容寻址路径，绝不写绝对路径；可按 projectId 过滤。原子写（tmp→rename）。
 */
export async function writeAssetManifest(
  domain: PmDomain,
  projectId?: string,
  nowIso?: string,
): Promise<{ manifest: FileManifest; path: string }> {
  const root = await resolveFileRoot()
  const byRel = new Map<string, FileManifestAsset>()
  for (const row of rowsOf(domain.table('file_assets'))) {
    if (projectId && row.projectId !== projectId) continue
    const existing = byRel.get(row.relPath)
    if (existing) {
      if (!existing.projectIds.includes(row.projectId)) existing.projectIds.push(row.projectId)
    } else {
      byRel.set(row.relPath, {
        relPath: row.relPath,
        sha256: row.sha256,
        size: row.size,
        fileName: row.fileName,
        mediaType: row.mediaType,
        projectIds: [row.projectId],
      })
    }
  }
  const manifest: FileManifest = {
    format: 'pm-file-manifest',
    version: 1,
    generatedAt: nowIso ?? new Date().toISOString(),
    count: byRel.size,
    assets: [...byRel.values()].sort((a, b) => a.relPath.localeCompare(b.relPath)),
  }
  const path = join(root, 'manifest.json')
  const tmp = `${path}.tmp`
  await writeFile(tmp, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 })
  await rename(tmp, path)
  return { manifest, path }
}
