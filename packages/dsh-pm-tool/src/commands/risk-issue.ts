/** /pm risk-issue：风险与问题离线命令及中文输出。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addRiskIssue,
  deleteRiskIssue,
  getRiskIssue,
  listRiskIssues,
  RiskIssueProjectNotFoundError,
  RiskIssueReferencedByMeetingError,
  updateRiskIssue,
} from '../core/risk-issues.js'
import {
  describeRiskIssueValidation,
  riskImpactLabels,
  riskIssueStatusLabels,
  riskIssueTypeLabels,
  riskProbabilityLabels,
  type RiskIssue,
  type RiskIssueStatus,
  type RiskIssueType,
} from '../core/risk-issue.js'
import type { PmDomain } from '../core/storage.js'

export const riskIssueHelp = [
  '风险与问题命令（离线，无需 API Key）：',
  '  /pm risk-issue add {"projectId":"p-0001","type":"risk","title":"供应商延期","impact":"high","probability":"medium","responsePlan":"准备备选供应商"}',
  '  /pm risk-issue add {"projectId":"p-0001","type":"issue","title":"测试环境不可用","impact":"critical","solution":"联系运维修复"}',
  '  /pm risk-issue list p-0001 [all|risk|issue] [all|open|monitoring|closed]',
  '  /pm risk-issue get ri-0001',
  '  /pm risk-issue update ri-0001 {"status":"closed"}',
  '  /pm risk-issue delete ri-0001 confirm',
  '风险必须填写 probability 和 impact，可填写 responsePlan；问题填写 impact 和 solution。',
  '状态支持 open / monitoring / closed；删除不带 confirm 只显示提示。',
  '项目归属、类型、ID 和时间戳创建后不可修改。',
].join('\n')

function renderRiskIssue(record: RiskIssue): string {
  return [
    `记录 ID：${record.id}`,
    `项目 ID：${record.projectId}`,
    `类型：${riskIssueTypeLabels[record.type]}`,
    `标题：${record.title}`,
    `状态：${riskIssueStatusLabels[record.status]}`,
    `概率：${record.probability ? riskProbabilityLabels[record.probability] : '不适用'}`,
    `影响：${riskImpactLabels[record.impact]}`,
    `负责人：${record.owner || '未填写'}`,
    `截止日期：${record.dueDate ?? '未填写'}`,
    `说明：${record.description || '未填写'}`,
    `应对措施：${record.responsePlan || '未填写'}`,
    `解决方案：${record.solution || '未填写'}`,
    `创建时间：${record.createdAt}`,
    `更新时间：${record.updatedAt}`,
  ].join('\n')
}

function parseList(argument: string):
  | { projectId: string, type?: RiskIssueType, status?: RiskIssueStatus }
  | undefined {
  const parts = argument.split(/\s+/).filter(Boolean)
  if (parts.length < 1 || parts.length > 3) return undefined
  const [projectId, rawType = 'all', rawStatus = 'all'] = parts
  if (!['all', 'risk', 'issue'].includes(rawType)) return undefined
  if (!['all', 'open', 'monitoring', 'closed'].includes(rawStatus)) return undefined
  return {
    projectId,
    type: rawType === 'all' ? undefined : rawType as RiskIssueType,
    status: rawStatus === 'all' ? undefined : rawStatus as RiskIssueStatus,
  }
}

export async function handleRiskIssueCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: riskIssueHelp }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const argument = match[2]?.trim() ?? ''
  if (!['add', 'list', 'get', 'update', 'delete'].includes(action)) {
    return { kind: 'error', text: `不支持的风险/问题操作。\n${riskIssueHelp}` }
  }
  if (!domain) return { kind: 'error', text: '风险/问题存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }

  try {
    if (action === 'add') {
      let fields: unknown
      try {
        fields = JSON.parse(argument)
      } catch {
        return { kind: 'error', text: `风险/问题参数须为合法 JSON 对象，请使用英文双引号。\n${riskIssueHelp}` }
      }
      const record = await addRiskIssue(domain, fields)
      return { kind: 'success', text: `风险/问题已新增并保存。\n${renderRiskIssue(record)}` }
    }
    if (action === 'list') {
      const filter = parseList(argument)
      if (!filter) {
        return {
          kind: 'error',
          text: '请使用：/pm risk-issue list <项目ID> [all|risk|issue] [all|open|monitoring|closed]',
        }
      }
      const records = listRiskIssues(domain, filter.projectId, filter.type, filter.status)
      return {
        kind: 'success',
        text: records.length
          ? [
              `风险与问题（项目 ${filter.projectId}，共 ${records.length} 项）：`,
              ...records.map(record =>
                `${record.id}｜${riskIssueTypeLabels[record.type]}｜${record.title}｜${riskIssueStatusLabels[record.status]}｜影响${riskImpactLabels[record.impact]}`,
              ),
              '查看详情：/pm risk-issue get <记录ID>',
            ].join('\n')
          : `项目 ${filter.projectId} 暂无符合条件的风险或问题。`,
      }
    }
    if (action === 'get') {
      if (!argument || /\s/.test(argument)) {
        return { kind: 'error', text: '请指定一个记录 ID：/pm risk-issue get ri-0001' }
      }
      const record = getRiskIssue(domain, argument)
      return record
        ? { kind: 'success', text: renderRiskIssue(record) }
        : { kind: 'error', text: `未找到风险/问题：${argument}。` }
    }
    if (action === 'update') {
      const updateMatch = /^(\S+)(?:\s+([\s\S]+))?$/.exec(argument)
      if (!updateMatch?.[2]) {
        return { kind: 'error', text: '请使用：/pm risk-issue update <记录ID> {JSON片段}' }
      }
      let fields: unknown
      try {
        fields = JSON.parse(updateMatch[2])
      } catch {
        return { kind: 'error', text: '更新参数须为合法 JSON 对象，请使用英文双引号。' }
      }
      const record = await updateRiskIssue(domain, updateMatch[1], fields)
      return record
        ? { kind: 'success', text: `风险/问题已更新并保存。\n${renderRiskIssue(record)}` }
        : { kind: 'error', text: `未找到风险/问题：${updateMatch[1]}。` }
    }
    const deleteMatch = /^(\S+)(?:\s+(confirm))?$/i.exec(argument)
    if (!deleteMatch) return { kind: 'error', text: '请使用：/pm risk-issue delete <记录ID> confirm' }
    const [, id, confirmation] = deleteMatch
    const current = getRiskIssue(domain, id)
    if (!current) return { kind: 'error', text: `未找到风险/问题：${id}。` }
    if (!confirmation) {
      return {
        kind: 'success',
        text: [
          `即将删除${riskIssueTypeLabels[current.type]}：${current.id}｜${current.title}。`,
          '当前未执行删除。',
          `确认命令：/pm risk-issue delete ${current.id} confirm`,
        ].join('\n'),
      }
    }
    const deleted = await deleteRiskIssue(domain, id)
    return deleted
      ? { kind: 'success', text: `${riskIssueTypeLabels[deleted.type]}已删除：${deleted.id}｜${deleted.title}。` }
      : { kind: 'error', text: `未找到风险/问题：${id}。` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `风险/问题参数不正确：${describeRiskIssueValidation(error)}。` }
    }
    if (error instanceof RiskIssueProjectNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    if (error instanceof RiskIssueReferencedByMeetingError) {
      return { kind: 'error', text: `${error.message}，请先解除关联。` }
    }
    console.error('[pm-tool] 风险/问题操作失败：', error)
    return { kind: 'error', text: '风险/问题操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
