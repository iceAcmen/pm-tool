/** /pm health：项目健康分离线命令（纯派生、只读、不写盘）。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { computeProjectHealth } from '../core/health.js'
import type { PmDomain } from '../core/storage.js'

export const healthHelp = [
  '项目健康分命令（离线、纯派生，无需 API Key）：',
  '  /pm health p-0001   输出该项目健康分、红黄绿灯与扣分明细',
  '口径：基础 100，逾期任务/受阻任务/高影响风险/逾期里程碑逐项扣分（各项封顶），下限 0；无任务出灰灯「数据不足」。',
].join('\n')

const LAMP_LABEL: Record<string, string> = {
  green: '绿灯', yellow: '黄灯', red: '红灯', gray: '灰灯',
}

export async function handleHealthCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (input.toLowerCase() === 'help') return { kind: 'success', text: healthHelp }
  if (!domain) return { kind: 'error', text: '健康分依赖项目存储，请检查 pm profile 的存储配置及宿主日志。' }
  if (/\s/.test(input)) return { kind: 'error', text: '项目 ID 不应包含空格：/pm health [项目ID]' }
  if (!input) return { kind: 'error', text: '请指定项目：/pm health p-0001。' }

  try {
    const health = computeProjectHealth(domain, input)
    const lines: string[] = [`项目健康：${health.projectId}`]
    if (health.score === null) {
      lines.push(`${LAMP_LABEL[health.lamp]} · 数据不足（尚未拆分任务，暂不评分）`)
    } else {
      lines.push(`${LAMP_LABEL[health.lamp]} · ${health.score} 分`)
      if (health.factors.length) {
        lines.push('扣分明细：')
        for (const f of health.factors) lines.push(`  ${f.label} ×${f.count} ${f.deduction}`)
      } else {
        lines.push('无扣分项。')
      }
    }
    lines.push(`（${health.note}）`)
    return { kind: 'success', text: lines.join('\n') }
  } catch (error) {
    console.error('[pm-tool] 健康分计算失败：', error)
    return { kind: 'error', text: '健康分计算失败，请检查项目 ID 与存储配置后重试。' }
  }
}
