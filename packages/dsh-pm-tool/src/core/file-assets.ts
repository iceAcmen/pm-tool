/**
 * B3/U2 文件安全底座（纯逻辑 + 内容寻址落盘 helper，零网络、零未审依赖）。
 *
 * 保守默认（可配置，见 DEFAULTS）：
 *  - 单文件上限 10 MiB；扩展名 + 声明 mediaType + magic-byte sniff 三重一致才放行；
 *  - 只收静态文档/图片：png/jpeg/gif/webp/pdf 与纯文本(md/txt/csv)；
 *  - 拒可执行/脚本/HTML/SVG 等 active 内容（exe/msi/bat/cmd/sh/html/svg/js…）；
 *  - sha256 内容寻址去重，同 hash 幂等；root 防穿越、拒 symlink；同目录 stage→fsync→rename，失败清 tmp。
 *
 * 边界：本模块不解析 multipart（宿主是否提供 multipart 依赖未定）；浏览器 File 的受控 body
 * 接入由 webServer 路由层负责，blob(JSON base64) 是宿主无 multipart 时的受限替代。
 */
import { createHash } from 'node:crypto'
import { basename, join, resolve, sep } from 'node:path'
import { lstat, mkdir, open, readFile, rename, rm } from 'node:fs/promises'

export class FileAssetRejectedError extends Error {
  constructor(readonly status: 400 | 413 | 415 | 422, message: string) {
    super(message)
    this.name = 'FileAssetRejectedError'
  }
}

export const FILE_ASSET_DEFAULTS = {
  /** 单文件硬上限 10 MiB（base64 包裹后的 JSON body 上限另在路由层放大到约 14 MiB）。 */
  maxBytes: 10 * 1024 * 1024,
  /** 允许的扩展名 → 规范 mediaType。 */
  allowExtensions: new Map<string, string>([
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.gif', 'image/gif'],
    ['.webp', 'image/webp'],
    ['.pdf', 'application/pdf'],
    ['.md', 'text/markdown'],
    ['.markdown', 'text/markdown'],
    ['.txt', 'text/plain'],
    ['.csv', 'text/csv'],
  ]),
  /** 明确拒绝的可执行/脚本/活动内容扩展名。 */
  rejectExtensions: new Set([
    '.exe', '.msi', '.bat', '.cmd', '.com', '.sh', '.ps1', '.js', '.mjs', '.cjs',
    '.html', '.htm', '.svg', '.xhtml', '.apk', '.dmg', '.pkg', '.deb', '.bin',
  ]),
} as const

export interface ValidatedFile {
  originalName: string
  mediaType: string
  size: number
  sha256: string
  bytes: Buffer
}

function extOf(name: string): string {
  const lower = basename(name).toLowerCase()
  const dot = lower.lastIndexOf('.')
  return dot >= 0 ? lower.slice(dot) : ''
}

/** 读前 N 字节做 magic sniff；返回识别出的规范 mediaType，无法识别返回 undefined。 */
function sniffMediaType(bytes: Buffer): string | undefined {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 6 && (bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a')) return 'image/gif'
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf'
  return undefined
}

/** 文本类：必须可 UTF-8 解码、无 NUL，且不含活动脚本特征。 */
function looksLikeSafeText(bytes: Buffer): boolean {
  if (bytes.includes(0)) return false
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return false
  }
  const head = text.slice(0, 256).toLowerCase()
  if (/<!doctype|<html|<script|on\w+\s*=|javascript:|data:application/.test(head)) return false
  return true
}

/**
 * 校验上传字节：大小、扩展名白名单、声明 mediaType、magic sniff（文本类走 UTF-8/无脚本检查）。
 * 任一不满足抛 FileAssetRejectedError；通过返回规整后的 ValidatedFile（含 sha256）。
 */
export function validateUploadedFile(input: {
  originalName: string
  declaredMediaType?: string
  bytes: Buffer
  maxBytes?: number
}): ValidatedFile {
  const maxBytes = input.maxBytes ?? FILE_ASSET_DEFAULTS.maxBytes
  const originalName = basename(String(input.originalName ?? '')).trim()
  if (!originalName) throw new FileAssetRejectedError(400, '缺少文件名')
  const ext = extOf(originalName)
  if (FILE_ASSET_DEFAULTS.rejectExtensions.has(ext)) {
    throw new FileAssetRejectedError(415, `不允许的文件类型：${ext}`)
  }
  const allowedType = FILE_ASSET_DEFAULTS.allowExtensions.get(ext)
  if (!allowedType) throw new FileAssetRejectedError(415, `扩展名 ${ext} 不在允许名单`)
  const bytes = Buffer.isBuffer(input.bytes) ? input.bytes : Buffer.from(input.bytes as Uint8Array)
  if (bytes.length === 0) throw new FileAssetRejectedError(400, '文件内容为空')
  if (bytes.length > maxBytes) throw new FileAssetRejectedError(413, `文件超过 ${Math.floor(maxBytes / 1024 / 1024)} MiB 上限`)
  if (input.declaredMediaType) {
    const declared = input.declaredMediaType.split(';')[0].trim().toLowerCase()
    if (declared !== allowedType) throw new FileAssetRejectedError(415, `声明类型 ${declared} 与扩展名 ${ext} 不一致`)
  }
  // 二进制类必须 magic 命中；文本类走安全文本检查。
  if (allowedType.startsWith('image/') || allowedType === 'application/pdf') {
    const sniffed = sniffMediaType(bytes)
    if (sniffed !== allowedType) throw new FileAssetRejectedError(422, '文件魔数与声明类型不符，已拒绝')
  } else if (!looksLikeSafeText(bytes)) {
    throw new FileAssetRejectedError(422, '文本文件含 NUL 或活动脚本特征，已拒绝')
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  return { originalName, mediaType: allowedType, size: bytes.length, sha256, bytes }
}

/** 归一化存储相对路径：内容寻址 <hash前2>/<hash><ext>，并保证落在 root 内。 */
export function contentAddressedRelPath(validated: ValidatedFile): string {
  const ext = extOf(validated.originalName) || '.bin'
  return join(validated.sha256.slice(0, 2), `${validated.sha256}${ext}`)
}

/** 防穿越：resolve 后必须仍在 root 内；且不落 symlink。 */
export async function resolveWithinRoot(root: string, rel: string): Promise<string> {
  const abs = resolve(root, rel)
  const rootAbs = resolve(root)
  if (abs !== rootAbs && !abs.startsWith(rootAbs + sep)) {
    throw new FileAssetRejectedError(400, '路径越界，已拒绝')
  }
  const stat = await lstat(abs).catch(() => undefined)
  if (stat?.isSymbolicLink()) throw new FileAssetRejectedError(400, '拒绝符号链接')
  return abs
}

/**
 * 内容寻址落盘：同目录 tmp → fsync → rename；已存在同 hash 直接视为幂等命中，不重写。
 * 失败清理 tmp，绝不留下半截目标。返回 {relPath, sha256, size, alreadyExisted}。
 */
export async function storeAssetBuffer(
  root: string,
  validated: ValidatedFile,
): Promise<{ relPath: string; sha256: string; size: number; alreadyExisted: boolean; createdFile: boolean }> {
  const relPath = contentAddressedRelPath(validated)
  const abs = await resolveWithinRoot(root, relPath)
  await mkdir(resolve(root, validated.sha256.slice(0, 2)), { recursive: true, mode: 0o700 })
  // 幂等：同 hash 已存在直接返回（取消/重试不产生重复字节）。
  const existing = await lstat(abs).catch(() => undefined)
  if (existing?.isFile()) return { relPath, sha256: validated.sha256, size: validated.size, alreadyExisted: true, createdFile: false }

  const tmp = `${abs}.${createHash('md5').update(validated.sha256 + String(Date.now())).digest('hex')}.tmp`
  let renamed = false
  try {
    const handle = await open(tmp, 'wx', 0o600)
    try {
      await handle.writeFile(validated.bytes)
      await handle.sync()
    } finally {
      await handle.close()
    }
    await rename(tmp, abs)
    renamed = true
  } finally {
    if (!renamed) await rm(tmp, { force: true }).catch(() => {})
  }
  return { relPath, sha256: validated.sha256, size: validated.size, alreadyExisted: false, createdFile: true }
}

/** 供受控只读读取（路由鉴权后调用）；路径仍须落在 root 内，拒 symlink/越界。 */
export async function readAssetBuffer(root: string, relPath: string): Promise<Buffer> {
  const abs = await resolveWithinRoot(root, relPath)
  return readFile(abs)
}
