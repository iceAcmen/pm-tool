/**
 * B3 备份字节：file_assets 元数据在备份 JSON extra 内，真实字节以「bundle sidecar 目录」随 JSON 一同发布。
 *
 * 发布顺序（writeBackupFile 编排）：先在临时目录写 JSON 与 `files.<bundleId>/`（字节 + manifest），
 *   再 rename sidecar 目录，最后 rename JSON 提交。JSON 最后提交保证：崩溃/失败时旧备份保持完好，
 *   新 JSON 一旦可见必能按 fileBundleId 找到匹配 sidecar。
 * sidecar 布局：`<backup.json>.files.<bundleId>/<relPath>` + `manifest.json`。staging 目录不备份。
 * 恢复：先于任何 DB 写做字节预检（缺 bundle/缺字节/sha256 不符/bundleId 不符 → 拒绝零写），
 *   通过后内容寻址提升到最终根；失败只删本次新写字节，不删既有。
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises'
import { join, resolve, normalize, isAbsolute } from 'node:path'
import { resolveFileRoot, resolveFileRootOptional, readAssetBuffer } from './file-asset-store.js'
import { storeAssetBuffer, validateUploadedFile, type ValidatedFile } from './file-assets.js'

export interface BackupFileEntry {
  relPath: string
  sha256: string
  size: number
}

interface FilesManifest {
  format: 'pm-tool-backup-files'
  bundleId: string
  jsonSha256: string
  count: number
  files: BackupFileEntry[]
}

interface FileAssetRow {
  id: string
  projectId: string
  fileName: string
  mediaType: string
  size: number
  sha256: string
  relPath: string
  addedAt: string
}

export function backupJsonSha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function assetRows(backup: { extra?: Record<string, [string, unknown][]> }): FileAssetRow[] {
  const rows = backup.extra?.file_assets ?? []
  return rows.map(([, r]) => r as FileAssetRow)
}

function sidecarDir(jsonPath: string, bundleId: string): string {
  return `${jsonPath}.files.${bundleId}`
}

/** bundle 内相对路径必须落在 sidecar 目录内；拒绝绝对路径、反斜杠、`..` 穿越与符号式越界。 */
function safeBundleRelPath(rootDir: string, relPath: string, label: string): string {
  if (typeof relPath !== 'string' || !relPath) throw new Error(`${label} 缺少相对路径`)
  if (isAbsolute(relPath) || relPath.includes('\\')) throw new Error(`${label} 路径不合法：${relPath}`)
  const normalized = normalize(relPath)
  if (normalized === '..' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`${label} 路径越界：${relPath}`)
  }
  const rootAbs = resolve(rootDir)
  const abs = resolve(rootAbs, normalized)
  if (abs !== rootAbs && !abs.startsWith(rootAbs + '/')) {
    throw new Error(`${label} 路径越界：${relPath}`)
  }
  return normalized
}

/** manifest 与 file_assets 元数据必须是同一组 relPath，不允许 bundle 多带未声明字节。 */
function assertExactManifest(rows: FileAssetRow[], manifest: FilesManifest): void {
  const metaRels = new Set(rows.map(r => r.relPath))
  for (const f of manifest.files) {
    if (!metaRels.has(f.relPath)) {
      throw new Error(`备份 manifest 含未在 file_assets 元数据声明的额外字节：${f.relPath}`)
    }
  }
  for (const row of rows) {
    if (!manifest.files.some(f => f.relPath === row.relPath)) {
      throw new Error(`备份缺少资产字节：${row.id}（${row.relPath}）`)
    }
  }
}

/** 把字节写入指定 bundle 目录并落 manifest（调用方负责在临时区构建后原子 rename 到正式位）。 */
export async function writeBundleDir(
  backup: { extra?: Record<string, [string, unknown][]> },
  targetDir: string,
  bundleId: string,
  jsonSha256: string,
): Promise<{ count: number }> {
  const rows = assetRows(backup)
  if (rows.length === 0) return { count: 0 }
  const root = await resolveFileRoot()
  await mkdir(targetDir, { recursive: true, mode: 0o700 })
  const manifest: FilesManifest = { format: 'pm-tool-backup-files', bundleId, jsonSha256, count: rows.length, files: [] }
  const written: string[] = []
  try {
    for (const row of rows) {
      const bytes = await readAssetBuffer(root, row.relPath)
      if (sha256Hex(bytes) !== row.sha256) throw new Error(`备份字节 sha256 不符：${row.id}`)
      if (bytes.length !== row.size) throw new Error(`备份字节大小不符：${row.id}`)
      const target = join(targetDir, row.relPath)
      await mkdir(resolve(targetDir, row.relPath, '..'), { recursive: true, mode: 0o700 })
      const tmp = `${target}.tmp`
      await writeFile(tmp, bytes, { mode: 0o600 })
      await rename(tmp, target)
      written.push(target)
      manifest.files.push({ relPath: row.relPath, sha256: row.sha256, size: row.size })
    }
    await writeFile(join(targetDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 })
    return { count: rows.length }
  } catch (error) {
    for (const p of written) await unlink(p).catch(() => {})
    throw error
  }
}

async function loadManifest(jsonPath: string, bundleId: string, expectedJsonSha: string): Promise<FilesManifest> {
  const dir = sidecarDir(jsonPath, bundleId)
  let manifestRaw: string
  try {
    manifestRaw = await readFile(join(dir, 'manifest.json'), 'utf8')
  } catch {
    throw new Error('备份含 file_assets 元数据但缺少字节 bundle，拒绝恢复（避免清空既有资产）')
  }
  const manifest = JSON.parse(manifestRaw) as FilesManifest
  if (manifest.format !== 'pm-tool-backup-files') throw new Error('备份字节 manifest 格式不符')
  if (manifest.bundleId !== bundleId) throw new Error('备份字节 bundleId 与备份 JSON 不符')
  if (manifest.jsonSha256 !== expectedJsonSha) throw new Error('备份字节 manifest 与备份 JSON 摘要不符')
  return manifest
}

/** 恢复前预检：有元数据就必须有匹配 bundle，逐字节 sha256/relPath 校验；缺/错即拒绝（零 DB 写）。 */
export async function precheckBackupBytes(
  backup: { extra?: Record<string, [string, unknown][]>; fileBundleId?: string },
  jsonPath: string,
  expectedJsonSha: string,
): Promise<void> {
  const rows = assetRows(backup)
  if (rows.length === 0) return
  if (!backup.fileBundleId) throw new Error('备份含 file_assets 元数据但缺少 fileBundleId，拒绝恢复')
  const manifest = await loadManifest(jsonPath, backup.fileBundleId, expectedJsonSha)
  if (manifest.count !== rows.length) throw new Error('备份字节 manifest 计数不符')
  const dir = sidecarDir(jsonPath, backup.fileBundleId)
  for (const f of manifest.files) safeBundleRelPath(dir, f.relPath, 'manifest')
  assertExactManifest(rows, manifest)
  const byRel = new Map(manifest.files.map(f => [f.relPath, f]))
  for (const row of rows) {
    const relPath = safeBundleRelPath(dir, row.relPath, '资产')
    const entry = byRel.get(relPath)
    if (!entry) throw new Error(`备份缺少资产字节：${row.id}（${row.relPath}）`)
    if (entry.sha256 !== row.sha256 || entry.size !== row.size) throw new Error(`manifest 与元数据不符：${row.id}`)
    if (!relPath.startsWith(`${row.sha256.slice(0, 2)}/`)) throw new Error(`资产 relPath 与 sha256 不符：${row.id}`)
    let bytes: Buffer
    try {
      bytes = await readFile(join(dir, relPath))
    } catch {
      throw new Error(`备份字节缺失：${row.id}`)
    }
    if (sha256Hex(bytes) !== row.sha256) throw new Error(`备份字节损坏（sha256 不符）：${row.id}`)
  }
}

/** 恢复提升：从 bundle 目录按内容寻址写回最终根（同 hash 幂等）；onCreated 每写一条新字节回调，供中途失败增量回滚。 */
export async function restoreAssetBytes(
  backup: { extra?: Record<string, [string, unknown][]>; fileBundleId?: string },
  jsonPath: string,
  expectedJsonSha: string,
  onCreated?: (relPath: string) => void,
): Promise<{ newlyWritten: string[] }> {
  const rows = assetRows(backup)
  if (rows.length === 0) return { newlyWritten: [] }
  if (!backup.fileBundleId) throw new Error('缺少 fileBundleId，无法定位字节 bundle')
  const manifest = await loadManifest(jsonPath, backup.fileBundleId, expectedJsonSha)
  const dir = sidecarDir(jsonPath, backup.fileBundleId)
  for (const f of manifest.files) safeBundleRelPath(dir, f.relPath, 'manifest')
  assertExactManifest(rows, manifest)
  const root = await resolveFileRoot()
  const newlyWritten: string[] = []
  for (const row of rows) {
    const relPath = safeBundleRelPath(dir, row.relPath, '资产')
    if (!relPath.startsWith(`${row.sha256.slice(0, 2)}/`)) throw new Error(`资产 relPath 与 sha256 不符：${row.id}`)
    const bytes = await readFile(join(dir, relPath))
    const validated: ValidatedFile = validateUploadedFile({
      originalName: row.fileName,
      declaredMediaType: row.mediaType,
      bytes,
    })
    const stored = await storeAssetBuffer(root, validated)
    if (stored.createdFile) {
      newlyWritten.push(stored.relPath)
      onCreated?.(stored.relPath)
    }
  }
  return { newlyWritten }
}

/** 回滚：删除本次恢复新写的字节（既有共享字节不动）。 */
export async function rollbackAssetBytes(newlyWritten: string[]): Promise<void> {
  const root = await resolveFileRootOptional()
  if (!root) return
  for (const rel of newlyWritten) {
    await unlink(resolve(root, rel)).catch(() => {})
  }
}
