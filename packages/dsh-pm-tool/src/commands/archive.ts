/**
 * P2 能力 K16 档案最小保存包 的命令层。
 * 子命令：/pm archive <项目ID> [目录] [confirm]
 * 默认目录 exports/archive-<项目ID>-<YYYYMMDD>/；默认拒覆盖，confirm 才覆盖。
 * 只读打包：任务/交付物/证据/复盘 known 行/里程碑通用字段 + README-字段说明.md；
 * 不写 K18 出站日志，包内记 archivedAt；原数据零改动。
 * 契约见 docs/design/deep-integration-v2-p2-dev.md §六。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import {
  buildArchiveSnapshot,
  defaultArchiveDirectory,
  writeArchivePackage,
  ArchiveProjectNotFoundError,
  ArchiveTargetExistsError,
} from '../core/archive.js'
import type { PmDomain } from '../core/storage.js'

export const archiveHelp =
  '  /pm archive <项目ID> [目录] [confirm]   只读打包最小保存包（任务/交付物/证据/复盘 known 行/里程碑 + README）\n' +
  '    默认目录 exports/archive-<项目ID>-<YYYYMMDD>/；目录已存在时默认拒覆盖，显式 confirm 才覆盖；原数据零改动、不写出站日志。'

export async function handleArchiveCommand(
  argument: string,
  domain: PmDomain | undefined,
): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const arg = argument.trim()
  if (!arg || arg.toLowerCase() === 'help') return { kind: 'success', text: archiveHelp }

  const tokens = arg.split(/\s+/).filter(Boolean)
  const projectId = tokens[0]
  if (!projectId) return { kind: 'error', text: '请使用：/pm archive <项目ID> [目录] [confirm]' }

  const confirm = tokens.includes('confirm')
  const extras = tokens.slice(1).filter(t => t !== 'confirm')
  const targetDir = extras[0] ?? defaultArchiveDirectory(projectId, new Date().toISOString())

  try {
    const snapshot = buildArchiveSnapshot(domain, projectId)
    const written = await writeArchivePackage(snapshot, targetDir, { confirm })
    return {
      kind: 'success',
      text: [
        `档案最小保存包已生成：${written}`,
        `  任务 ${snapshot.tasks.length} · 交付物 ${snapshot.deliverables.length} · 证据 ${snapshot.evidence.length} · 复盘 known 行 ${snapshot.reflections.length} · 里程碑 ${snapshot.milestones.length}`,
        '只读快照，原数据零改动；非全量镜像；未写 K18 出站日志。',
      ].join('\n'),
    }
  } catch (error) {
    if (error instanceof ArchiveProjectNotFoundError || error instanceof ArchiveTargetExistsError) {
      return { kind: 'error', text: error.message }
    }
    console.error('[pm-tool] 档案打包失败：', error)
    return { kind: 'error', text: `档案打包失败：${error instanceof Error ? error.message : String(error)}` }
  }
}
