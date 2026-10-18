/**
 * P1 能力 K11 补记队列 的命令层。
 * 子命令：
 *   - open <项目ID>   打卡（写 pmQueueOpened）→ 返回队列 JSON（同 list 口径）；
 *   - list <项目ID>   只读派生，返回 {top, rest, quietMode, openedAt}；
 *   - mute <任务ID> [天数=7]   写 pmQueueMute（二态静音，unmute 可逆）；
 *   - unmute <任务ID>  清除静音；
 *   - quiet <HH:MM> <HH:MM> / quiet off   写/清除时段静默（并入 K19）。
 *
 * 派生逻辑在 core/queue.ts（纯函数）；本层只负责打卡/mute/quiet 设置读写与取数。
 * 契约见 docs/design/deep-integration-v2-p1-dev.md §二/§2.3。
 * 能力边界：打开时呈现 ≠ 常驻推送；mute 压主动投递但不隐藏打开视图折叠列表。
 */
import type { CommandResult } from '@deepseek-ai/dsh-commands'
import type { PmDomain } from '../core/storage.js'
import { enqueueDomainWrite } from '../core/projects.js'
import { localTodayIso } from '../core/derived.js'
import {
  buildQueueForProject,
  isValidHhmm,
  mutedUntilOf,
  readQueueMute,
  readQueueOpened,
  SETTING_MUTE,
  SETTING_OPENED,
  SETTING_QUIET,
  type MuteMap,
} from '../core/queue.js'

export const queueHelp =
  '  /pm queue open <项目ID>    打卡并返回补记队列（读时派生）\n' +
  '  /pm queue list <项目ID>    只读返回补记队列 JSON\n' +
  '  /pm queue mute <任务ID> [天数=7]   静音该任务（不隐藏打开视图，可 unmute 撤销）\n' +
  '  /pm queue unmute <任务ID>  解除静音\n' +
  '  /pm queue quiet <HH:MM> <HH:MM> | off   设置/清除时段静默（并入 K19）'

/** 本地 HH:MM（命令层唯一取墙钟处；纯派生函数不碰墙钟）。 */
function localHhmm(now: Date): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const DEFAULT_MUTE_DAYS = 7
const MAX_MUTE_DAYS = 30

export async function handleQueueCommand(
  argument: string,
  domain: PmDomain | undefined,
): Promise<CommandResult> {
  if (!domain) return { kind: 'error', text: '项目存储未就绪。' }
  const input = argument.trim()
  if (!input || input.toLowerCase() === 'help') return { kind: 'success', text: queueHelp }

  const space = input.search(/\s/)
  const sub = (space === -1 ? input : input.slice(0, space)).toLowerCase()
  const tail = space === -1 ? '' : input.slice(space + 1).trim()

  // ===== open <项目ID>：打卡写 pmQueueOpened → 返回队列（同 list 口径）=====
  if (sub === 'open') {
    const projectId = tail
    if (!projectId) return { kind: 'error', text: '用法：/pm queue open <项目ID>' }
    if (!domain.table('projects').get(projectId)) {
      return { kind: 'error', text: `未找到项目 ${projectId}` }
    }
    const nowIso = new Date().toISOString()
    await enqueueDomainWrite(domain, async () => {
      const prev = readQueueOpened(domain)
      await domain.table('settings').put(SETTING_OPENED, {
        value: { ...prev, [projectId]: { at: nowIso } },
        updatedAt: nowIso,
      })
    })
    const queue = buildQueueForProject(domain, projectId, {
      today: localTodayIso(),
      nowHhmm: localHhmm(new Date()),
      openedAt: nowIso,
    })
    return { kind: 'success', text: JSON.stringify(queue, null, 2) }
  }

  // ===== list <项目ID>：只读派生 =====
  if (sub === 'list') {
    const projectId = tail
    if (!projectId) return { kind: 'error', text: '用法：/pm queue list <项目ID>' }
    if (!domain.table('projects').get(projectId)) {
      return { kind: 'error', text: `未找到项目 ${projectId}` }
    }
    const queue = buildQueueForProject(domain, projectId, {
      today: localTodayIso(),
      nowHhmm: localHhmm(new Date()),
    })
    return { kind: 'success', text: JSON.stringify(queue, null, 2) }
  }

  // ===== mute <任务ID> [天数=7]：写 pmQueueMute（可逆）=====
  if (sub === 'mute') {
    const m = /^(\S+)(?:\s+(\S+))?$/.exec(tail)
    if (!m) return { kind: 'error', text: '用法：/pm queue mute <任务ID> [天数=7]' }
    const taskId = m[1]
    const task = domain.table('tasks').get(taskId)
    if (!task) return { kind: 'error', text: `未找到任务：${taskId}` }
    let ttlDays = DEFAULT_MUTE_DAYS
    if (m[2] !== undefined) {
      const parsed = Number(m[2])
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_MUTE_DAYS) {
        return { kind: 'error', text: `静音天数须为 1–${MAX_MUTE_DAYS} 的整数（缺省 ${DEFAULT_MUTE_DAYS}）。` }
      }
      ttlDays = parsed
    }
    const nowIso = new Date().toISOString()
    await enqueueDomainWrite(domain, async () => {
      const prev = readQueueMute(domain)
      const value: MuteMap = { ...prev, [taskId]: { mutedAt: nowIso, ttlDays } }
      await domain.table('settings').put(SETTING_MUTE, { value, updatedAt: nowIso })
    })
    const until = mutedUntilOf({ mutedAt: nowIso, ttlDays })
    return {
      kind: 'success',
      text: [
        `已静音任务 ${taskId}（${task.title}）：主动投递（首屏 Top1）已压制，打开视图折叠列表仍可见并标注「已静音」。`,
        `有效期 ${ttlDays} 天（至 ${until}，含当天），到期自动失效；/pm queue unmute ${taskId} 可立即撤销。`,
      ].join('\n'),
    }
  }

  // ===== unmute <任务ID>：清除静音（可逆写）=====
  if (sub === 'unmute') {
    const taskId = tail
    if (!taskId) return { kind: 'error', text: '用法：/pm queue unmute <任务ID>' }
    if (!domain.table('tasks').get(taskId)) {
      return { kind: 'error', text: `未找到任务：${taskId}` }
    }
    await enqueueDomainWrite(domain, async () => {
      const prev = readQueueMute(domain)
      if (!(taskId in prev)) return
      const value: MuteMap = { ...prev }
      delete value[taskId]
      const keys = Object.keys(value)
      if (keys.length === 0) {
        await domain.table('settings').delete(SETTING_MUTE)
      } else {
        await domain.table('settings').put(SETTING_MUTE, { value, updatedAt: new Date().toISOString() })
      }
    })
    return { kind: 'success', text: `已解除任务 ${taskId} 的静音，恢复主动投递资格。` }
  }

  // ===== quiet <HH:MM> <HH:MM> | off：写/清除时段静默 =====
  if (sub === 'quiet') {
    if (tail.toLowerCase() === 'off') {
      await enqueueDomainWrite(domain, async () => {
        await domain.table('settings').delete(SETTING_QUIET)
      })
      return { kind: 'success', text: '已清除时段静默，队列恢复正常呈现。' }
    }
    const q = /^(\S+)\s+(\S+)$/.exec(tail)
    if (!q || !isValidHhmm(q[1]) || !isValidHhmm(q[2])) {
      return { kind: 'error', text: '用法：/pm queue quiet <HH:MM> <HH:MM>（24 小时制，如 22:00 06:00）或 /pm queue quiet off' }
    }
    const from = q[1]
    const to = q[2]
    const nowIso = new Date().toISOString()
    await enqueueDomainWrite(domain, async () => {
      await domain.table('settings').put(SETTING_QUIET, { value: { from, to }, updatedAt: nowIso })
    })
    return {
      kind: 'success',
      text: `已设置时段静默 ${from}–${to}：时段内队列卡降级为不打扰样式（不首屏高亮 Top1，仅折叠列示），条目仍可见；/pm queue quiet off 可清除。`,
    }
  }

  return { kind: 'error', text: `不识别的 queue 子命令：${sub}。\n${queueHelp}` }
}
