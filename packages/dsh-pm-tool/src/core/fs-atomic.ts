/**
 * 原子落盘 helper（与上游 @deepseek-ai/dsh-storage-json 的发布协议同形，上游只读故本包内镜像）。
 *
 * 发布协议：同目录临时文件 → 写内容 → fsync 文件 → 关闭 → 原子 rename 覆盖目标 → fsync 目录。
 * rename 之前任何一步失败都只清理临时文件，绝不触碰目标文件；rename 成功后临时文件已不存在。
 *
 * 边界：这是「单文件」崩溃可持久写；它不、也不能提供跨多记录的事务语义。
 * 进程被 kill -9 截断在跨记录写序列中间时，仍可能留下半成品，需依赖外部安全快照人工恢复。
 */
import { open, rename, rm } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { FileHandle } from 'node:fs/promises'

/** fsync 目录，使刚 rename 的目录项崩溃可持久；Windows 无目录 O_RDONLY fsync，直接跳过（与上游一致）。 */
async function fsyncDirectory(dir: string): Promise<void> {
  if (process.platform === 'win32') return
  const handle = await open(dir, 'r')
  try {
    await handle.sync()
  } finally {
    await handle.close()
  }
}

export interface AtomicWriteOptions {
  /** 文件 mode，默认 0o600（与备份/密钥类产物一致）。 */
  mode?: number
}

/**
 * 原子地用 `content` 覆盖写 `target`。
 * @param target 绝对目标文件路径。
 * @param content 完整新内容。
 * @returns 目标替换且（POSIX 下）目录项 fsync 完成后 resolve。
 */
export async function atomicWriteFile(
  target: string,
  content: string,
  options: AtomicWriteOptions = {},
): Promise<void> {
  const dir = dirname(target)
  // 临时文件必须与目标同目录：rename 在同文件系统内才是 POSIX 原子替换。
  const tmp = join(dir, `.${basename(target)}.${randomUUID()}.tmp`)
  let renamed = false
  try {
    // 'wx'：临时文件已存在即失败，避免误覆盖别人的临时产物。
    const handle: FileHandle = await open(tmp, 'wx', options.mode ?? 0o600)
    try {
      await handle.writeFile(content, 'utf8')
      await handle.sync() // fsync 文件内容/元数据后再 rename
    } finally {
      await handle.close()
    }
    await rename(tmp, target) // POSIX 原子覆盖
    renamed = true
    await fsyncDirectory(dir) // fsync 父目录，使新目录项崩溃可持久
  } finally {
    // 仅当 rename 未发生才需要清理残留 tmp；rename 成功后 tmp 已不存在，rm(force) 为 no-op。
    if (!renamed) await rm(tmp, { force: true }).catch(() => {})
  }
}
