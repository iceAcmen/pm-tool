/**
 * B3 上传暂存区（staging）：新任务未保存 / 表单取消前，文件先落隔离暂存目录，
 * 不写 file_assets 元数据表、不挂任务；表单保存时由 addFile op 在同一域事务内提升为内容寻址资产。
 *
 * 安全：stageId 为不可猜 crypto 随机 hex；登录 gate 由路由层施加；绝不对外暴露磁盘路径。
 * 暂存文件带 TTL，崩溃后启动 sweep 清理过期；cancel 立即清字节。
 */
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, rename, readFile, unlink, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  validateUploadedFile,
  storeAssetBuffer,
  type ValidatedFile,
} from './file-assets.js'
import { resolveFileRoot, resolveFileRootOptional } from './file-asset-store.js'

export const STAGE_TTL_MS = 15 * 60 * 1000

export interface StageMeta {
  stageId: string
  fileName: string
  mediaType: string
  size: number
  sha256: string
  createdAt: string
  expiresAt: string
}

interface StageSidecar {
  fileName: string
  mediaType: string
  size: number
  sha256: string
  createdAt: string
  expiresAt: string
}

export class StageNotFoundError extends Error {}
export class StageExpiredError extends Error {}

function stageDir(root: string): string {
  return join(root, 'staging')
}

function safeStageId(stageId: string): boolean {
  return /^[a-f0-9]{32}$/.test(stageId)
}

export async function stageUpload(input: {
  originalName: string
  declaredMediaType?: string
  bytes: Buffer
  nowIso?: string
}): Promise<StageMeta> {
  const validated: ValidatedFile = validateUploadedFile({
    originalName: input.originalName,
    declaredMediaType: input.declaredMediaType,
    bytes: input.bytes,
  })
  const now = new Date(input.nowIso ?? Date.now())
  const createdAt = now.toISOString()
  const expiresAt = new Date(now.getTime() + STAGE_TTL_MS).toISOString()
  const stageId = randomBytes(16).toString('hex')
  const root = await resolveFileRoot()
  const dir = stageDir(root)
  await mkdir(dir, { recursive: true })

  const binPath = join(dir, `${stageId}.bin`)
  const sidecarPath = join(dir, `${stageId}.json`)
  const sidecar: StageSidecar = {
    fileName: validated.originalName,
    mediaType: validated.mediaType,
    size: validated.size,
    sha256: validated.sha256,
    createdAt,
    expiresAt,
  }
  // 先写临时再 rename，避免半截暂存。
  const binTmp = `${binPath}.tmp`
  const sideTmp = `${sidecarPath}.tmp`
  await writeFile(binTmp, validated.bytes)
  await writeFile(sideTmp, JSON.stringify(sidecar), 'utf8')
  await rename(binTmp, binPath)
  await rename(sideTmp, sidecarPath)

  return { stageId, ...sidecar }
}

async function loadStage(stageId: string, nowIso?: string): Promise<{ dir: string; binPath: string; sidecarPath: string; meta: StageSidecar }> {
  if (!safeStageId(stageId)) throw new StageNotFoundError('暂存不存在')
  const root = await resolveFileRoot()
  const dir = stageDir(root)
  const binPath = join(dir, `${stageId}.bin`)
  const sidecarPath = join(dir, `${stageId}.json`)
  let raw: string
  try {
    raw = await readFile(sidecarPath, 'utf8')
  } catch {
    throw new StageNotFoundError('暂存不存在')
  }
  let meta: StageSidecar
  try {
    meta = JSON.parse(raw) as StageSidecar
  } catch {
    throw new StageNotFoundError('暂存元数据损坏')
  }
  const now = new Date(nowIso ?? Date.now())
  if (new Date(meta.expiresAt).getTime() <= now.getTime()) {
    await Promise.all([unlink(binPath).catch(() => {}), unlink(sidecarPath).catch(() => {})])
    throw new StageExpiredError('暂存已过期')
  }
  return { dir, binPath, sidecarPath, meta }
}

/** 读取暂存字节（不删除），供校验/预览；过期即清理并抛错。 */
export async function readStage(stageId: string, nowIso?: string): Promise<{ meta: StageMeta; bytes: Buffer }> {
  const loaded = await loadStage(stageId, nowIso)
  const bytes = await readFile(loaded.binPath)
  return { meta: { stageId, ...loaded.meta }, bytes }
}

/**
 * prepare：读取+校验暂存，**保留暂存字节不删**，供事务内先校验/预取；
 * DB 全部写成功后再调 finalizeStage 删除。DB 失败则 stage 原样保留可重试，且不动共享最终字节。
 */
export async function prepareStage(stageId: string, nowIso?: string): Promise<{
  validated: ValidatedFile
  bytes: Buffer
}> {
  const loaded = await loadStage(stageId, nowIso)
  const bytes = await readFile(loaded.binPath)
  const validated = validateUploadedFile({
    originalName: loaded.meta.fileName,
    declaredMediaType: loaded.meta.mediaType,
    bytes,
  })
  return { validated, bytes }
}

/** finalize：DB 成功后清理暂存字节与 sidecar（幂等，不存在忽略）。 */
export async function finalizeStage(stageId: string): Promise<void> {
  if (!safeStageId(stageId)) return
  const root = await resolveFileRoot()
  const dir = stageDir(root)
  await Promise.all([
    unlink(join(dir, `${stageId}.bin`)).catch(() => {}),
    unlink(join(dir, `${stageId}.json`)).catch(() => {}),
  ])
}

/**
 * 便捷一次性提升：prepare → storeAssetBuffer 内容寻址 → finalize。
 * 仅用于非事务直挂（快速保存任务）；事务 addFile op 必须自行 prepare/写 DB/finalize 以便失败补偿。
 */
export async function consumeStage(stageId: string, nowIso?: string): Promise<{
  validated: ValidatedFile
  relPath: string
  alreadyExisted: boolean
}> {
  const { validated } = await prepareStage(stageId, nowIso)
  const root = await resolveFileRoot()
  const stored = await storeAssetBuffer(root, validated)
  await finalizeStage(stageId)
  return { validated, relPath: stored.relPath, alreadyExisted: stored.alreadyExisted }
}

/** cancel：best-effort 删除暂存字节与元数据，不存在不报错。 */
export async function deleteStage(stageId: string): Promise<boolean> {
  if (!safeStageId(stageId)) return false
  const root = await resolveFileRoot()
  const dir = stageDir(root)
  const binPath = join(dir, `${stageId}.bin`)
  const sidecarPath = join(dir, `${stageId}.json`)
  let removed = false
  for (const p of [binPath, sidecarPath]) {
    try {
      await unlink(p)
      removed = true
    } catch {
      /* 不存在忽略 */
    }
  }
  return removed
}

/** 崩溃恢复：扫描暂存目录，删除已过期（或 sidecar 缺失/损坏）的条目，返回清理数。 */
export async function sweepExpiredStages(nowIso?: string, ttlMs: number = STAGE_TTL_MS): Promise<number> {
  const root = await resolveFileRootOptional()
  if (!root) return 0
  const dir = stageDir(root)
  let names: string[]
  try {
    names = await readdir(dir)
  } catch {
    return 0
  }
  const now = new Date(nowIso ?? Date.now()).getTime()
  let removed = 0
  const seen = new Set<string>()
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    const stageId = name.slice(0, -5)
    if (!safeStageId(stageId)) continue
    seen.add(stageId)
    const sidecarPath = join(dir, name)
    let expired = false
    try {
      const meta = JSON.parse(await readFile(sidecarPath, 'utf8')) as StageSidecar
      expired = new Date(meta.expiresAt).getTime() <= now
    } catch {
      expired = true
    }
    if (expired) {
      await Promise.all([unlink(join(dir, `${stageId}.bin`)).catch(() => {}), unlink(sidecarPath).catch(() => {})])
      removed++
    }
  }
  // 孤儿 bin（无 sidecar）一并清。
  for (const name of names) {
    if (!name.endsWith('.bin')) continue
    const stageId = name.slice(0, -4)
    if (!seen.has(stageId)) {
      await unlink(join(dir, name)).catch(() => {})
      removed++
    }
  }
  return removed
}
