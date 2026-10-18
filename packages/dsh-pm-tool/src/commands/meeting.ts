/** /pm meeting：会议纪要与行动项离线命令。 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addMeeting,
  addMeetingAction,
  deleteMeeting,
  deleteMeetingAction,
  getMeeting,
  listMeetings,
  MeetingActionNotFoundError,
  MeetingProjectNotFoundError,
  MeetingRelationMismatchError,
  MeetingRelationNotFoundError,
  updateMeeting,
  updateMeetingAction,
  promoteActionToTask,
} from '../core/meetings.js'
import {
  describeMeetingValidation,
  meetingActionStatusLabels,
  meetingStatusLabels,
  type Meeting,
  type MeetingAction,
  type MeetingStatus,
} from '../core/meeting.js'
import { AiDraftError, type LlmGateway } from '../core/ai-client.js'
import {
  parseSummarizedDraft,
  summarizeTranscript,
  rememberSummary,
  recallSummary,
} from '../core/meeting-summarize.js'
import { getModelMode, resolveModelRoute, PROD_KEY_MISSING_TEXT } from '../core/model-route.js'
import { buildSourceRefs, CURRENT_SNAPSHOT_VERSION, CURRENT_RULE_REVISION, type SourceRecord } from '../core/provenance.js'
import { recordProvenance } from '../core/provenance-store.js'
import type { PmDomain } from '../core/storage.js'
import { buildActionLine, buildSuccessEnvelope } from '../core/ui-feedback.js'

export const meetingHelp = [
  '会议纪要命令（离线，无需 API Key）：',
  '  /pm meeting add {"projectId":"p-0001","title":"项目周会","meetingDate":"2026-10-10"}',
  '  /pm meeting list p-0001 [all|draft|final]',
  '  /pm meeting get mtg-0001',
  '  /pm meeting update mtg-0001 {"status":"final","summary":"确认发布范围"}',
  '  /pm meeting delete mtg-0001 confirm',
  '  /pm meeting action add mtg-0001 {"title":"完成验收","owner":"Ice","taskId":"t-0001"}',
  '  /pm meeting action update mtg-0001 ai-001 {"status":"done"}',
  '  /pm meeting action delete mtg-0001 ai-001 confirm',
  '  /pm meeting action promote mtg-0001 ai-001 [confirm]  把行动项转为项目任务并回写关联（幂等）',
  '  /pm meeting summarize p-0001 「粘贴的速记」     AI 归纳议题/结论/行动项草稿（预览，不落盘）',
  '  /pm meeting summarize p-0001 「粘贴的速记」confirm 按草稿建 draft 会议并挂行动项',
  'AI 纪要为草稿、confirm 才入库；失败时可手工 /pm meeting add。',
].join('\n')

function renderAction(action: MeetingAction): string {
  return `${action.id}｜${action.title}｜${meetingActionStatusLabels[action.status]}｜负责人 ${action.owner || '未填写'}｜任务 ${action.taskId ?? '-'}｜问题 ${action.riskIssueId ?? '-'}`
}

function renderMeeting(meeting: Meeting): string {
  return [
    `会议 ID：${meeting.id}`,
    `项目 ID：${meeting.projectId}`,
    `标题：${meeting.title}`,
    `日期：${meeting.meetingDate}${meeting.startTime ? ` ${meeting.startTime}` : ''}`,
    `状态：${meetingStatusLabels[meeting.status]}`,
    `主持人：${meeting.facilitator || '未填写'}`,
    `记录人：${meeting.recorder || '未填写'}`,
    `参会人：${meeting.participants.join('、') || '未填写'}`,
    `地点/链接：${meeting.location || '未填写'}`,
    `摘要：${meeting.summary || '未填写'}`,
    `议题：${meeting.topics.join('；') || '未填写'}`,
    `决议：${meeting.decisions.join('；') || '未填写'}`,
    `行动项（${meeting.actions.length}）：`,
    ...(meeting.actions.length ? meeting.actions.map(renderAction) : ['暂无']),
  ].join('\n')
}

/** update 变更字段中文短标签（只列本次传入字段；供短摘要第二行）。 */
function describeMeetingChanges(input: Record<string, unknown>): string {
  const labels: string[] = []
  if (input.title !== undefined) labels.push('标题')
  if (input.meetingDate !== undefined) labels.push('日期')
  if (input.startTime !== undefined) labels.push('开始时间')
  if (input.durationMinutes !== undefined) labels.push('时长')
  if (input.location !== undefined) labels.push('地点/链接')
  if (input.facilitator !== undefined) labels.push('主持人')
  if (input.recorder !== undefined) labels.push('记录人')
  if (input.participants !== undefined) labels.push('参会人')
  if (input.status !== undefined) labels.push('状态')
  if (input.summary !== undefined) labels.push('摘要')
  if (input.topics !== undefined) labels.push('议题')
  if (input.decisions !== undefined) labels.push('决议')
  if (input.notes !== undefined) labels.push('备注')
  return labels.length ? `已修改：${labels.join('、')}` : '已更新'
}

function parseJson(value: string): unknown {
  return JSON.parse(value)
}

export async function handleMeetingCommand(rawInput: string, domain?: PmDomain, llm?: LlmGateway): Promise<CommandResult> {
  const input = rawInput.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: meetingHelp }
  if (!domain) return { kind: 'error', text: '会议纪要存储未就绪，请检查 pm profile 的存储配置。' }
  try {
    const summarizeMatch = /^summarize\s+(\S+)\s+([\s\S]+)$/i.exec(input)
    if (summarizeMatch) {
      const projectId = summarizeMatch[1]
      let rest = summarizeMatch[2].trim()
      let confirmation = false
      let notes = ''
      const tail = /\s+confirm(\s+("[\s\S]*"))?$/i.exec(rest)
      if (tail) {
        confirmation = true
        rest = rest.slice(0, -tail[0].length).trim()
        if (tail[2]) { try { notes = JSON.parse(tail[2]) } catch {} }
      }
      const transcript = rest
      if (!transcript) return { kind: 'error', text: '请粘贴会议速记：/pm meeting summarize p-0001 「速记内容」' }
      const key = `${projectId}\n${transcript}`

      let draft
      try {
        const route = resolveModelRoute(getModelMode(domain), 'meeting')
        if (confirmation) {
          draft = recallSummary(key) ?? parseSummarizedDraft(await summarizeTranscript(llm, transcript, route))
        } else {
          draft = parseSummarizedDraft(await summarizeTranscript(llm, transcript, route))
          rememberSummary(key, draft)
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'PROD_KEY_MISSING') {
          return { kind: 'error', text: PROD_KEY_MISSING_TEXT }
        }
        throw error
      }

      if (!confirmation) {
        return {
          kind: 'success',
          text: [
            'AI 归纳草稿（当前未写入，仅预览）：',
            `标题：${draft.title}`,
            `摘要：${draft.summary || '（空）'}`,
            `议题：${draft.topics.join('；') || '（无）'}`,
            `决议：${draft.decisions.join('；') || '（无）'}`,
            `行动项（${draft.actions.length}）：`,
            ...(draft.actions.length
              ? draft.actions.map(a => `  - ${a.title}｜负责人 ${a.owner || '待定'}｜截止 ${a.dueDate ?? '未定'}`)
              : ['  （无）']),
            // content/action 分离：确认命令独立挂动作行，不进保存正文；预览本身持久（不加 success 信封）。
            buildActionLine('确认建会', `/pm meeting summarize ${projectId} ${transcript} confirm`),
          ].join('\n'),
        }
      }

      const meeting = await addMeeting(domain, {
        projectId,
        title: draft.title,
        meetingDate: new Date().toISOString().slice(0, 10),
        summary: draft.summary,
        topics: draft.topics,
        decisions: draft.decisions,
        status: 'draft',
        notes,
      })
      for (const action of draft.actions) {
        await addMeetingAction(domain, meeting.id, {
          title: action.title, owner: action.owner, dueDate: action.dueDate ?? undefined,
        })
      }
      const saved = getMeeting(domain, meeting.id)!
      // F15：会议建会 confirm 落盘后 best-effort 记录来源（basis=新建会议；原始逐字稿不入库，摘要中说明）。
      {
        const recMap = new Map<string, SourceRecord>()
        for (const [, rec] of (domain.table('meetings') as { entries(): IterableIterator<[string, unknown]> }).entries()) {
          const r = rec as SourceRecord
          if (r.projectId === projectId) recMap.set(`meetings:${r.id}`, r)
        }
        // M-2：如实口径，不做自指伪引用；只记录行动项真实关联的任务作为上下文。
        const linkedTasks = draft.actions
          .map(a => (a as { taskId?: string }).taskId)
          .filter((tid): tid is string => !!tid)
          .map(tid => ({ table: 'tasks' as const, id: tid }))
        const refs = buildSourceRefs({
          actions: [], records: recMap,
          context: linkedTasks,
          snapshotVersion: CURRENT_SNAPSHOT_VERSION, ruleRevision: CURRENT_RULE_REVISION,
        })
        void recordProvenance(domain, {
          projectId, kind: 'meeting-summarize',
          summary: `AI 归纳建会 ${saved.id}（行动项 ${draft.actions.length}；原始逐字稿不持久化）`,
          refs,
        })
      }
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`已按 AI 草稿创建 draft 会议纪要｜${saved.id} ${saved.title}`, `挂载 ${draft.actions.length} 个行动项；原始逐字稿不入库`],
          renderMeeting(saved),
        ),
      }
    }

    const actionMatch = /^action\s+(add|update|delete|promote)\s+([\s\S]+)$/i.exec(input)
    if (actionMatch) {
      const operation = actionMatch[1].toLowerCase()
      const argument = actionMatch[2].trim()
      if (operation === 'add') {
        const match = /^(\S+)\s+([\s\S]+)$/.exec(argument)
        if (!match) return { kind: 'error', text: '请使用：/pm meeting action add <会议ID> {JSON}' }
        const result = await addMeetingAction(domain, match[1], parseJson(match[2]))
        return {
          kind: 'success',
          text: buildSuccessEnvelope(
            [`行动项已新增｜${result.id} ${result.title}`, meetingActionStatusLabels[result.status]],
            renderAction(result),
          ),
        }
      }
      if (operation === 'update') {
        const match = /^(\S+)\s+(\S+)\s+([\s\S]+)$/.exec(argument)
        if (!match) return { kind: 'error', text: '请使用：/pm meeting action update <会议ID> <行动项ID> {JSON}' }
        const result = await updateMeetingAction(domain, match[1], match[2], parseJson(match[3]))
        return result
          ? {
              kind: 'success',
              text: buildSuccessEnvelope(
                [`行动项已更新｜${result.id} ${result.title}`, meetingActionStatusLabels[result.status]],
                renderAction(result),
              ),
            }
          : { kind: 'error', text: `未找到行动项：${match[2]}。` }
      }
      if (operation === 'promote') {
        const match = /^(\S+)\s+(\S+)(?:\s+(confirm))?$/i.exec(argument)
        if (!match) return { kind: 'error', text: '请使用：/pm meeting action promote <会议ID> <行动项ID> [confirm]' }
        const meeting = getMeeting(domain, match[1])
        const current = meeting?.actions.find(item => item.id === match[2])
        if (!current) return { kind: 'error', text: `未找到行动项：${match[1]}/${match[2]}。` }
        if (current.taskId) {
          return {
            kind: 'success',
            text: buildSuccessEnvelope(
              [`该行动项已转为任务 ${current.taskId}`, '无需重复转换'],
              null,
            ),
          }
        }
        if (!match[3]) {
          return {
            kind: 'success',
            text: [
              '即将把行动项转为项目任务（不新增父任务）：',
              `  标题：${current.title}`,
              `  负责人：${current.owner || '未填写'}`,
              `  截止：${current.dueDate || '未设置'}`,
              `  所属项目：${meeting!.projectId}`,
              '当前未创建任务。',
              buildActionLine('确认转任务', `/pm meeting action promote ${match[1]} ${match[2]} confirm`),
            ].join('\n'),
          }
        }
        const result = await promoteActionToTask(domain, match[1], match[2])
        return result.created
          ? {
              kind: 'success',
              text: buildSuccessEnvelope(
                [`已创建任务 ${result.taskId}（${result.title}）`, '并回写行动项关联'],
                null,
              ),
            }
          : {
              kind: 'success',
              text: buildSuccessEnvelope(
                [`该行动项已转为任务 ${result.taskId}`, '无需重复转换'],
                null,
              ),
            }
      }
      const match = /^(\S+)\s+(\S+)(?:\s+(confirm))?$/i.exec(argument)
      if (!match) return { kind: 'error', text: '请使用：/pm meeting action delete <会议ID> <行动项ID> confirm' }
      const meeting = getMeeting(domain, match[1])
      const current = meeting?.actions.find(item => item.id === match[2])
      if (!current) return { kind: 'error', text: `未找到行动项：${match[2]}。` }
      if (!match[3]) {
        return {
          kind: 'success',
          text: [
            `即将删除行动项：${renderAction(current)}。`,
            '当前未执行删除。',
            buildActionLine('确认删除', `/pm meeting action delete ${match[1]} ${match[2]} confirm`),
          ].join('\n'),
        }
      }
      const result = await deleteMeetingAction(domain, match[1], match[2])
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`行动项已删除｜${result!.id} ${result!.title}`],
          null,
        ),
      }
    }

    const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
    const operation = match[1].toLowerCase()
    const argument = match[2]?.trim() ?? ''
    if (operation === 'add') {
      const meeting = await addMeeting(domain, parseJson(argument))
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`会议纪要已新增｜${meeting.id} ${meeting.title}`, meetingStatusLabels[meeting.status]],
          renderMeeting(meeting),
        ),
      }
    }
    if (operation === 'list') {
      const parts = argument.split(/\s+/).filter(Boolean)
      if (parts.length < 1 || parts.length > 2 || !['all', 'draft', 'final'].includes(parts[1] ?? 'all')) {
        return { kind: 'error', text: '请使用：/pm meeting list <项目ID> [all|draft|final]' }
      }
      const status = (parts[1] && parts[1] !== 'all' ? parts[1] : undefined) as MeetingStatus | undefined
      const meetings = listMeetings(domain, parts[0], status)
      return {
        kind: 'success',
        text: meetings.length
          ? [`会议纪要（项目 ${parts[0]}，共 ${meetings.length} 项）：`, ...meetings.map(item =>
              `${item.id}｜${item.meetingDate}｜${item.title}｜${meetingStatusLabels[item.status]}｜行动项 ${item.actions.length}`,
            )].join('\n')
          : `项目 ${parts[0]} 暂无符合条件的会议纪要。`,
      }
    }
    if (operation === 'get') {
      if (!argument || /\s/.test(argument)) return { kind: 'error', text: '请指定会议 ID：/pm meeting get mtg-0001' }
      const meeting = getMeeting(domain, argument)
      return meeting ? { kind: 'success', text: renderMeeting(meeting) } : { kind: 'error', text: `未找到会议：${argument}。` }
    }
    if (operation === 'update') {
      const updateMatch = /^(\S+)\s+([\s\S]+)$/.exec(argument)
      if (!updateMatch) return { kind: 'error', text: '请使用：/pm meeting update <会议ID> {JSON片段}' }
      const meeting = await updateMeeting(domain, updateMatch[1], parseJson(updateMatch[2]))
      return meeting
        ? {
            kind: 'success',
            text: buildSuccessEnvelope(
              [`会议纪要已更新并保存｜${meeting.id} ${meeting.title}`, describeMeetingChanges(parseJson(updateMatch[2]) as Record<string, unknown>)],
              renderMeeting(meeting),
            ),
          }
        : { kind: 'error', text: `未找到会议：${updateMatch[1]}。` }
    }
    if (operation === 'delete') {
      const deleteMatch = /^(\S+)(?:\s+(confirm))?$/i.exec(argument)
      if (!deleteMatch) return { kind: 'error', text: '请使用：/pm meeting delete <会议ID> confirm' }
      const current = getMeeting(domain, deleteMatch[1])
      if (!current) return { kind: 'error', text: `未找到会议：${deleteMatch[1]}。` }
      if (!deleteMatch[2]) {
        return {
          kind: 'success',
          text: [
            `即将删除会议：${current.id}｜${current.title}。`,
            '当前未执行删除。',
            buildActionLine('确认删除', `/pm meeting delete ${current.id} confirm`),
          ].join('\n'),
        }
      }
      await deleteMeeting(domain, current.id)
      return {
        kind: 'success',
        text: buildSuccessEnvelope(
          [`会议纪要已删除｜${current.id} ${current.title}`],
          null,
        ),
      }
    }
    return { kind: 'error', text: `不支持的会议操作。\n${meetingHelp}` }
  } catch (error) {
    if (error instanceof SyntaxError) return { kind: 'error', text: '会议参数须为合法 JSON 对象，请使用英文双引号。' }
    if (error instanceof z.ZodError) return { kind: 'error', text: `会议参数不正确：${describeMeetingValidation(error)}。` }
    if (error instanceof MeetingProjectNotFoundError
      || error instanceof MeetingRelationNotFoundError
      || error instanceof MeetingRelationMismatchError
      || error instanceof MeetingActionNotFoundError) {
      return { kind: 'error', text: error.message }
    }
    if (error instanceof AiDraftError) {
      return { kind: 'error', text: `AI 纪要归纳暂不可用：${error.message}你仍可手工 /pm meeting add。` }
    }
    console.error('[pm-tool] 会议纪要操作失败：', error)
    return { kind: 'error', text: '会议纪要操作失败，请检查存储配置、目录权限及宿主日志后重试。' }
  }
}
