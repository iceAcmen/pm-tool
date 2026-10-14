/** /pm deliverable：项目交付物台账离线命令及中文输出。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addDeliverable,
  deleteDeliverable,
  DeliverableProjectNotFoundError,
  getDeliverable,
  listDeliverables,
  updateDeliverable,
} from '../core/deliverables.js'
import {
  deliverableStatusLabels,
  describeDeliverableValidation,
  type Deliverable,
  type DeliverableStatus,
} from '../core/deliverable.js'
import { formatRepoRef, repoFieldHelpPhrase } from '../core/repo-format.js'
import type { PmDomain } from '../core/storage.js'

export const deliverableHelp = [
  '交付物台账命令（离线，无需 API Key）：',
  '  /pm deliverable add {"projectId":"p-0001","name":"需求说明书","version":"v1.0","owner":"Ice","status":"in_progress","location":"exports/需求说明书.md","dueDate":"2026-11-15"}',
  '  /pm deliverable list p-0001 [all|planned|in_progress|submitted|accepted]',
  '  /pm deliverable get dlv-0001',
  '  /pm deliverable update dlv-0001 {"status":"submitted","version":"v1.1","changeNote":"提交评审","operator":"Ice"}',
  '  /pm deliverable delete dlv-0001 confirm',
  '状态支持 planned（计划中）/ in_progress（制作中）/ submitted（已提交）/ accepted（已验收）。',
  '版本或状态变化会自动追加一条变更留痕；删除不带 confirm 只显示提示。',
  '项目归属、ID、变更历史和时间戳创建后不可直接修改。',
  // 共享句式与 project/task 同真源；deliverable 保留 history 专属后缀（只改 repo 不追加留痕）。
  repoFieldHelpPhrase.replace('全程离线不探测。', '只改这两项不追加留痕；全程离线不探测。'),
].join('\n')

function renderDeliverable(record: Deliverable): string {
  const lines = [
    `交付物 ID：${record.id}`,
    `项目 ID：${record.projectId}`,
    `名称：${record.name}`,
    `版本：${record.version || '未填写'}`,
    `状态：${deliverableStatusLabels[record.status]}`,
    `负责人：${record.owner || '未填写'}`,
    `计划交付日期：${record.dueDate ?? '未填写'}`,
    `位置：${record.location || '未填写'}`,
    `说明：${record.description || '未填写'}`,
    `仓库：${formatRepoRef(record) || '未填写'}`,
    `创建时间：${record.createdAt}`,
    `更新时间：${record.updatedAt}`,
  ]
  if (record.history.length) {
    lines.push('变更留痕：')
    const statusText = (value: string): string =>
      deliverableStatusLabels[value as DeliverableStatus] ?? value
    // 倒序展示最近变化在前。
    for (const change of [...record.history].reverse()) {
      const target = change.field === 'created' ? '创建' : change.field === 'status' ? '状态' : '版本'
      const transition = change.field === 'created'
        ? statusText(change.to)
        : `${change.field === 'status' ? statusText(change.from) : change.from} → ${change.field === 'status' ? statusText(change.to) : change.to}`
      const who = change.by ? `（${change.by}）` : ''
      const note = change.note ? `：${change.note}` : ''
      lines.push(`  · ${change.at.slice(0, 10)} ${target} ${transition}${who}${note}`)
    }
  }
  return lines.join('\n')
}

function parseList(argument: string): { projectId: string, status?: DeliverableStatus } | undefined {
  const parts = argument.split(/\s+/).filter(Boolean)
  if (parts.length < 1 || parts.length > 2) return undefined
  const [projectId, rawStatus = 'all'] = parts
  if (rawStatus !== 'all' && !Object.keys(deliverableStatusLabels).includes(rawStatus)) return undefined
  return { projectId, status: rawStatus === 'all' ? undefined : rawStatus as DeliverableStatus }
}

export async function handleDeliverableCommand(rawInput: string, domain?: PmDomain): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: deliverableHelp }
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const argument = match[2]?.trim() ?? ''
  if (!['add', 'list', 'get', 'update', 'delete'].includes(action)) {
    return { kind: 'error', text: `不支持的交付物操作。\n${deliverableHelp}` }
  }
  if (!domain) return { kind: 'error', text: '交付物存储未就绪，请检查 pm profile 的存储配置及宿主日志。' }

  try {
    if (action === 'add') {
      let fields: unknown
      try {
        fields = JSON.parse(argument)
      } catch {
        return { kind: 'error', text: `交付物参数须为合法 JSON 对象，请使用英文双引号。\n${deliverableHelp}` }
      }
      const record = await addDeliverable(domain, fields)
      return { kind: 'success', text: `交付物已新增并保存。\n${renderDeliverable(record)}` }
    }
    if (action === 'list') {
      const filter = parseList(argument)
      if (!filter) {
        return { kind: 'error', text: '请使用：/pm deliverable list <项目ID> [all|planned|in_progress|submitted|accepted]' }
      }
      const records = listDeliverables(domain, filter.projectId, filter.status)
      return {
        kind: 'success',
        text: records.length
          ? [
              `交付物（项目 ${filter.projectId}，共 ${records.length} 项）：`,
              ...records.map(record =>
                `${record.id}｜${record.name}｜${record.version || '无版本'}｜${deliverableStatusLabels[record.status]}｜${record.owner || '未指定负责人'}`),
              '查看详情：/pm deliverable get <交付物ID>',
            ].join('\n')
          : `项目 ${filter.projectId} 暂无符合条件的交付物。`,
      }
    }
    if (action === 'get') {
      if (!argument || /\s/.test(argument)) {
        return { kind: 'error', text: '请指定一个交付物 ID：/pm deliverable get dlv-0001' }
      }
      const record = getDeliverable(domain, argument)
      return record
        ? { kind: 'success', text: renderDeliverable(record) }
        : { kind: 'error', text: `未找到交付物：${argument}。` }
    }
    if (action === 'update') {
      const updateMatch = /^(\S+)(?:\s+([\s\S]+))?$/.exec(argument)
      if (!updateMatch?.[2]) {
        return { kind: 'error', text: '请使用：/pm deliverable update <交付物ID> {JSON片段}' }
      }
      let fields: unknown
      try {
        fields = JSON.parse(updateMatch[2])
      } catch {
        return { kind: 'error', text: '更新参数须为合法 JSON 对象，请使用英文双引号。' }
      }
      const record = await updateDeliverable(domain, updateMatch[1], fields)
      return record
        ? { kind: 'success', text: `交付物已更新并保存。\n${renderDeliverable(record)}` }
        : { kind: 'error', text: `未找到交付物：${updateMatch[1]}。` }
    }
    const deleteMatch = /^(\S+)(?:\s+(confirm))?$/i.exec(argument)
    if (!deleteMatch) return { kind: 'error', text: '请使用：/pm deliverable delete <交付物ID> confirm' }
    const [, id, confirmation] = deleteMatch
    const current = getDeliverable(domain, id)
    if (!current) return { kind: 'error', text: `未找到交付物：${id}。` }
    if (!confirmation) {
      return {
        kind: 'success',
        text: [
          `即将删除交付物：${current.id}｜${current.name}。`,
          '当前未执行删除。',
          `确认命令：/pm deliverable delete ${current.id} confirm`,
        ].join('\n'),
      }
    }
    const deleted = await deleteDeliverable(domain, id)
    return deleted
      ? { kind: 'success', text: `交付物已删除：${deleted.id}｜${deleted.name}。` }
      : { kind: 'error', text: `未找到交付物：${id}。` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `交付物参数不正确：${describeDeliverableValidation(error)}。` }
    }
    if (error instanceof DeliverableProjectNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    console.error('[pm-tool] 交付物操作失败：', error)
    return { kind: 'error', text: '交付物操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
