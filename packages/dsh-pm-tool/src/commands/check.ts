/**
 * P0 能力 K6 交付检查（呈现层）的命令层。
 * `/pm check <任务ID>` 或 `/pm check <项目ID>`：只读规则提示，不下完成裁决；
 * 「未覆盖≠未完成」，最终验收由人判断。规则纯函数在 core/check.ts。
 * 契约见 docs/design/deep-integration-v2-p0-dev.md §三。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { collectChecks, type CheckFinding } from '../core/check.js'
import type { PmDomain } from '../core/storage.js'

export const checkHelp = [
  '交付检查命令（只读，不下完成裁决；未覆盖≠未完成，最终验收由人判断）：',
  '  /pm check <任务ID>     对照承诺/进度/材料指出该任务的未回应要求、日期冲突、缺依据',
  '  /pm check <项目ID>     检查项目全部任务（逾期未动 / 临期未动 / 完成有未完成清单 / 完成缺材料 / 进度100状态不符）',
  '  /pm check <任务ID|项目ID> YYYY-MM-DD   固化“今天”（便于核对，可选）',
  '本命令只提示缺口，不修改任务、不自动标记完成。',
].join('\n')

const RULE_LABELS: Record<CheckFinding['rule'], string> = {
  'overdue-untouched': '逾期未动',
  'due-soon-untouched': '临期未动（≤2天仍 todo）',
  'done-open-checklist': '完成却有未完成清单项',
  'done-missing-materials': '完成但缺交付/证据材料',
  'progress-100-not-done': '进度100但状态非 done',
}

function renderFindings(findings: CheckFinding[], scope: string): string {
  if (!findings.length) {
    return [
      `交付检查（${scope}）：未命中任何规则提示。`,
      '说明：这只代表当前未发现明显缺口，不构成完成验收；最终验收由人判断。',
    ].join('\n')
  }
  const lines = [
    `交付检查（${scope}）：命中 ${findings.length} 条提示（只读，不下完成裁决）。`,
    '',
    '```json',
    JSON.stringify(findings.map(f => ({
      rule: f.rule,
      ruleLabel: RULE_LABELS[f.rule],
      taskId: f.taskId,
      title: f.title,
      reason: f.reason,
      suggestion: f.suggestion,
    })), null, 2),
    '```',
    '',
    '逐条：',
    ...findings.map(f => `· [${RULE_LABELS[f.rule]}] ${f.taskId}｜${f.title}：${f.reason} 建议：${f.suggestion}`),
    '',
    '注：未覆盖≠未完成；以上仅为缺口提示，最终验收由人判断。',
  ]
  return lines.join('\n')
}

export function handleCheckCommand(argument: string, domain: PmDomain | undefined): CommandResult {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const tokens = argument.trim().split(/\s+/).filter(Boolean)
  if (!tokens.length || tokens[0].toLowerCase() === 'help') return { kind: 'success', text: checkHelp }

  let today: string | undefined
  const targets: string[] = []
  for (const token of tokens) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(token)) today = token
    else targets.push(token)
  }
  if (targets.length !== 1) {
    return { kind: 'error', text: '请使用：/pm check <任务ID|项目ID> [YYYY-MM-DD]\n' + checkHelp }
  }
  const target = targets[0]

  try {
    if (/^t-/.test(target)) {
      const task = domain.table('tasks').get(target)
      if (!task) return { kind: 'error', text: `未找到任务：${target}。` }
      const findings = collectChecks(domain, { taskId: target, today })
      return { kind: 'success', text: renderFindings(findings, `任务 ${target}`) }
    }
    if (/^p-/.test(target)) {
      if (!domain.table('projects').get(target)) return { kind: 'error', text: `未找到项目：${target}。` }
      const findings = collectChecks(domain, { projectId: target, today })
      return { kind: 'success', text: renderFindings(findings, `项目 ${target}`) }
    }
    return { kind: 'error', text: `无法识别目标「${target}」：任务 ID 以 t- 开头，项目 ID 以 p- 开头。\n` + checkHelp }
  } catch (error) {
    return { kind: 'error', text: `交付检查失败：${error instanceof Error ? error.message : String(error)}` }
  }
}
