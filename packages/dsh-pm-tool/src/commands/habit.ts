/**
 * P3 能力 X7 习惯层 的命令层（分片A 实现）。
 * 子词分发（契约见 docs/design/deep-integration-v2-p3-dev.md §2.3）：
 *   - add     人录入习惯（draft；可关联同项目 okrId）
 *   - checkin 打卡；缺省今天；允许过去 2 天回填（backfilled:true），超窗/未来中文拒绝
 *   - list    只读列出（streak 纯文本档案 + 回填标注；空日如实留空不伪造）
 *   - suggest agent 代起草习惯建议（只进收件区 pmHabitInbox，不建记录、不自动生效）
 *   - inbox   列出本项目待确认建议
 *   - confirm 人确认建议 → 建 habit draft 记录 + 建议标 confirmed（不自动定稿）
 *   - ignore  忽略建议（保留在收件区标 ignored，可逆）
 *   - final   人定稿（draft/confirmed → final，幂等）
 * 边界：建议不自动生效；streak 是文本档案非激励动效（无积分/连胜动效/徽章）；
 * 周期触发归 K11 仅占位不启用（见 core/cycle-hooks.ts）。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import { z } from 'zod'
import {
  addHabit,
  checkinHabit,
  confirmHabitSuggestion,
  describeHabitValidation,
  finalizeHabit,
  formatHabitArchiveLine,
  ignoreHabitSuggestion,
  listHabitSuggestions,
  listHabitsByProject,
  suggestHabit,
  HabitCheckinWindowError,
  HabitNotFoundError,
  HabitOkrNotFoundError,
  HabitOkrProjectMismatchError,
  HabitProjectNotFoundError,
  HabitSuggestionAlreadyProcessedError,
  HabitSuggestionNotFoundError,
  type HabitSuggestion,
} from '../core/habits.js'
import { localTodayIso } from '../core/derived.js'
import type { PmDomain, HabitRecord } from '../core/storage.js'

export const habitHelp =
  '  /pm habit add <项目ID> <JSON>             人录入习惯（draft，可关联 okrId）\n' +
  '  /pm habit checkin <habitID> [YYYY-MM-DD] [note]   打卡；缺省今天；允许过去 2 天回填（backfilled:true）\n' +
  '  /pm habit list <项目ID>                   只读列出（streak 文本档案）\n' +
  '  /pm habit suggest <项目ID> <JSON>         agent 代起草习惯建议（只进收件区，不自动生效）\n' +
  '  /pm habit inbox <项目ID>                  列出未处理建议\n' +
  '  /pm habit confirm <建议ID>                人确认建议 → 建 habit draft 记录\n' +
  '  /pm habit ignore <建议ID>                 忽略建议（保留在收件区标 ignored）\n' +
  '  /pm habit final <habitID>                 人定稿（draft/confirmed → final，幂等）\n' +
  '说明：建议未确认不进主档；streak 仅纯文本档案（无积分/动效/徽章）；周期触发为占位不启用。'

const STATUS_LABELS: Record<HabitRecord['status'], string> = {
  draft: '草稿',
  confirmed: '已确认',
  final: '已定稿',
}

function parseJson(argument: string): unknown | undefined {
  try {
    return JSON.parse(argument)
  } catch {
    return undefined
  }
}

const DATE_TOKEN_RE = /^\d{4}-\d{2}-\d{2}$/

function renderHabitLine(rec: HabitRecord, todayIso: string): string[] {
  const meta = rec.okrId ? `（关联 ${rec.okrId}）` : ''
  const head = `· [${STATUS_LABELS[rec.status]}] ${rec.id}｜${rec.title}${meta}`
  const archive = `  ${formatHabitArchiveLine(rec, todayIso)}`
  const checkIns = rec.checkIns.map(c =>
    `${c.at}${c.backfilled ? '〔回填〕' : ''}${c.note ? `（${c.note}）` : ''}`,
  )
  const body = checkIns.length
    ? `  打卡记录：${checkIns.join('；')}`
    : '  打卡记录：（暂无；空日如实留空，不自动补、不伪造）'
  return [head, archive, body]
}

function renderSuggestion(s: HabitSuggestion): string {
  const status = s.status === 'confirmed'
    ? `已确认 → ${s.confirmedHabitId ?? ''}`
    : s.status === 'ignored'
      ? '已忽略'
      : '待确认'
  const okr = s.okrId ? `｜关联 ${s.okrId}` : ''
  const rationale = s.rationale ? `｜理由：${s.rationale}` : ''
  return `${s.id}｜${s.title}｜${status}${okr}${rationale}｜${s.at}`
}

export async function handleHabitCommand(
  argument: string,
  domain: PmDomain | undefined,
): Promise<CommandResult> {
  const input = argument.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: habitHelp }
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }

  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(input)!
  const action = match[1].toLowerCase()
  const rest = match[2]?.trim() ?? ''

  try {
    // ===== add <项目ID> <JSON> =====
    if (action === 'add') {
      const addMatch = /^(\S+)\s+([\s\S]+)$/.exec(rest)
      if (!addMatch) return { kind: 'error', text: '请使用：/pm habit add <项目ID> {JSON}' }
      const projectId = addMatch[1]
      const fields = parseJson(addMatch[2])
      if (fields === undefined) return { kind: 'error', text: '习惯参数须为合法 JSON 对象，请使用英文双引号。' }
      const record = await addHabit(domain, projectId, fields)
      return {
        kind: 'success',
        text: [
          '习惯已录入并保存（草稿；定稿请用 final）。',
          ...renderHabitLine(record, localTodayIso()),
          `创建时间：${record.createdAt}`,
        ].join('\n'),
      }
    }

    // ===== checkin <habitID> [YYYY-MM-DD] [note] =====
    if (action === 'checkin') {
      const ckMatch = /^(\S+)(?:\s+([\s\S]*))?$/.exec(rest)
      if (!ckMatch) return { kind: 'error', text: '请使用：/pm habit checkin <habitID> [YYYY-MM-DD] [note]' }
      const habitId = ckMatch[1]
      const tail = ckMatch[2]?.trim() ?? ''
      let dateIso: string | undefined
      let note: string | undefined
      if (tail) {
        const tokens = tail.split(/\s+/)
        if (DATE_TOKEN_RE.test(tokens[0])) {
          dateIso = tokens[0]
          note = tokens.slice(1).join(' ') || undefined
        } else {
          note = tail
        }
      }
      const record = await checkinHabit(domain, habitId, dateIso, note)
      const backfilled = record.checkIns.at(-1)?.backfilled === true
      return {
        kind: 'success',
        text: [
          `已打卡 ${record.id}（${record.checkIns.at(-1)?.at ?? ''}${backfilled ? '，补记已标 backfilled' : ''}）。`,
          ...renderHabitLine(record, localTodayIso()),
        ].join('\n'),
      }
    }

    // ===== list <项目ID> =====
    if (action === 'list') {
      if (!rest || /\s/.test(rest)) return { kind: 'error', text: '请指定一个项目 ID：/pm habit list <项目ID>' }
      const records = listHabitsByProject(domain, rest)
      if (!records.length) return { kind: 'success', text: `项目 ${rest} 暂无习惯记录。` }
      const todayIso = localTodayIso()
      const lines = [`项目 ${rest} 习惯记录（${records.length} 条；streak 为纯文本档案，无激励动效）：`]
      for (const rec of records) lines.push(...renderHabitLine(rec, todayIso))
      return { kind: 'success', text: lines.join('\n') }
    }

    // ===== suggest <项目ID> <JSON>：只进收件区，不建记录 =====
    if (action === 'suggest') {
      const sugMatch = /^(\S+)\s+([\s\S]+)$/.exec(rest)
      if (!sugMatch) return { kind: 'error', text: '请使用：/pm habit suggest <项目ID> {JSON}' }
      const projectId = sugMatch[1]
      const fields = parseJson(sugMatch[2])
      if (fields === undefined) return { kind: 'error', text: '建议参数须为合法 JSON 对象，请使用英文双引号。' }
      const suggestion = await suggestHabit(domain, projectId, fields)
      return {
        kind: 'success',
        text: [
          '建议已进入收件区（未确认不生效，不会创建习惯记录）。',
          renderSuggestion(suggestion),
          `确认：/pm habit confirm ${suggestion.id}｜忽略：/pm habit ignore ${suggestion.id}`,
        ].join('\n'),
      }
    }

    // ===== inbox <项目ID>：列出待确认建议 =====
    if (action === 'inbox') {
      if (!rest || /\s/.test(rest)) return { kind: 'error', text: '请使用：/pm habit inbox <项目ID>' }
      if (!domain.table('projects').get(rest)) return { kind: 'error', text: `未找到项目 ${rest}` }
      const items = listHabitSuggestions(domain, rest)
      if (!items.length) return { kind: 'success', text: `项目 ${rest} 暂无待确认习惯建议。` }
      return {
        kind: 'success',
        text: [
          `项目 ${rest} 待确认习惯建议（${items.length} 条；未确认不生效）：`,
          ...items.map(renderSuggestion),
        ].join('\n'),
      }
    }

    // ===== confirm <建议ID> =====
    if (action === 'confirm') {
      if (!rest || /\s/.test(rest)) return { kind: 'error', text: '请使用：/pm habit confirm <建议ID>' }
      const { record, suggestion } = await confirmHabitSuggestion(domain, rest)
      return {
        kind: 'success',
        text: [
          `已确认建议 ${suggestion.id}，创建草稿习惯记录 ${record.id}（定稿请用 final，无自动定稿）。`,
          ...renderHabitLine(record, localTodayIso()),
        ].join('\n'),
      }
    }

    // ===== ignore <建议ID> =====
    if (action === 'ignore') {
      if (!rest || /\s/.test(rest)) return { kind: 'error', text: '请使用：/pm habit ignore <建议ID>' }
      const suggestion = await ignoreHabitSuggestion(domain, rest)
      return {
        kind: 'success',
        text: `已忽略建议 ${suggestion.id}（保留在收件区标 ignored，可逆；不会创建记录）。`,
      }
    }

    // ===== final <habitID>：人定稿（幂等，已是 final 重复执行不变更）=====
    if (action === 'final') {
      if (!rest || /\s/.test(rest)) return { kind: 'error', text: '请使用：/pm habit final <habitID>' }
      const record = await finalizeHabit(domain, rest)
      if (!record) return { kind: 'error', text: `未找到习惯：${rest}。` }
      return {
        kind: 'success',
        text: [
          `习惯 ${record.id} 已定稿（draft/confirmed → final，仅人触发；重复执行幂等）。`,
          ...renderHabitLine(record, localTodayIso()),
        ].join('\n'),
      }
    }

    return { kind: 'error', text: `不识别的 habit 子命令「${action}」。\n${habitHelp}` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { kind: 'error', text: `习惯参数不正确：${describeHabitValidation(error)}。` }
    }
    if (
      error instanceof HabitProjectNotFoundError
      || error instanceof HabitOkrNotFoundError
      || error instanceof HabitOkrProjectMismatchError
      || error instanceof HabitNotFoundError
      || error instanceof HabitSuggestionNotFoundError
      || error instanceof HabitSuggestionAlreadyProcessedError
      || error instanceof HabitCheckinWindowError
    ) {
      return { kind: 'error', text: error.message }
    }
    return { kind: 'error', text: `习惯操作失败：${error instanceof Error ? error.message : String(error)}` }
  }
}
