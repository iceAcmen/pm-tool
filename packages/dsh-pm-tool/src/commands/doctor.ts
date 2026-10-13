/** /pm doctor：只读体检命令（报告悬空/不一致引用与残留临时文件，绝不自动修复）。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { runDoctor, renderDoctor, strayTmpFiles } from '../core/doctor.js'
import type { PmDomain } from '../core/storage.js'

export const doctorHelp = [
  '体检命令（离线、只读，绝不自动修复）：',
  '  /pm doctor        扫描悬空父任务/里程碑/前置依赖、跨项目引用等不一致项',
  '只报告、不改写任何记录；修复需在对应任务/项目中显式解除引用后重跑。',
].join('\n')

/**
 * 解析当前可用数据根：仅取宿主显式传入的 root，或文档约定的 PM_STORAGE_ROOT。
 * 绝不猜测 cwd；解析不到则跳过 .tmp 扫描（仍做内存引用一致性检查）。
 */
export function resolveStorageRoot(explicitRoot?: string): string | undefined {
  return explicitRoot || process.env.PM_STORAGE_ROOT || undefined
}

export async function handleDoctorCommand(
  rawInput: string,
  domain?: PmDomain,
  root?: string,
): Promise<CommandResult> {
  const input = rawInput.trim()
  if (input.toLowerCase() === 'help') return { kind: 'success', text: doctorHelp }
  if (!domain) return { kind: 'error', text: '体检依赖项目存储，请检查 pm profile 的存储配置及宿主日志。' }
  try {
    const findings = runDoctor(domain)
    const dataRoot = resolveStorageRoot(root)
    const stray = dataRoot ? await strayTmpFiles(dataRoot) : []
    return { kind: 'success', text: renderDoctor(findings, stray) }
  } catch (error) {
    console.error('[pm-tool] 体检失败：', error)
    return { kind: 'error', text: '体检执行失败，请检查存储配置后重试。' }
  }
}
