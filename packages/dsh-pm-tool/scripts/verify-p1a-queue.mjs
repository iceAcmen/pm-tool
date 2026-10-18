/**
 * P1 分片A 集成验证：K11 补记队列真实命令 + 真实 JSON 落盘。
 * 机制同 verify-p0-integration.mjs：真实 Context + JsonStorageBackend 临时根 + 真实命令 handler。
 * 不触碰 3172 / 正式 data/；不调模型（queue 全离线）。
 * 覆盖：
 *  1. queue open 打卡 → settings pmQueueOpened 落盘 + 返回队列 JSON
 *  2. queue list 只读（打卡不被刷新）
 *  3. queue mute 落盘 pmQueueMute + list 中该任务 muted 且 ttlDays 生效、top 排除
 *  4. queue unmute 清除（空表删行）
 *  5. queue quiet 00:00 23:59 → quietMode=true、top 置空、rest 保留；quiet off 清除
 *  6. K9 缺席条目真实出现（session bind 后零更新）
 *  7. 项目不存在报「未找到项目 X」；web snapshot 携带 queue 字段
 *  8. 真实 JSON 文件落盘核验
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { apply } from '../lib/index.js'

const root = mkdtempSync(join(tmpdir(), 'pm-tool-p1a-queue-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) {
    command = definition
    return () => {}
  },
})

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}

const results = []
const check = (k, ok, detail = '') => { results.push({ k, ok: !!ok, detail: String(detail) }); console.log(`[${ok ? 'OK' : 'XX'}] ${k} :: ${detail}`) }

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)

  const project = await addProject(domain, { name: 'P1A 队列验证项目', startDate: '2026-10-10', targetDate: '2026-12-31' })
  const pid = project.id

  // ===== 种子 =====
  await run(`task add ${JSON.stringify({ projectId: pid, title: '逾期未动（普通）', status: 'todo', dueDate: '2026-10-01' })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: 'P0 今天到期', status: 'in_progress', priority: 'P0', dueDate: '2026-10-18', progress: 20 })}`)
  await run(`task add ${JSON.stringify({ projectId: pid, title: '无截止日待跟进', status: 'todo' })}`)

  // ===== 1) queue open 打卡：pmQueueOpened 落盘 + 返回队列 =====
  const openText = await run(`queue open ${pid}`)
  const openQ = JSON.parse(openText)
  check('open.shape', openQ.projectId === pid && 'top' in openQ && 'rest' in openQ && 'quietMode' in openQ && 'openedAt' in openQ,
    `openedAt=${openQ.openedAt} top=${openQ.top?.taskId} rest=${openQ.rest.length}`)
  const openedRow = domain.table('settings').get('pmQueueOpened')
  check('open.diskRow', !!openedRow && openedRow.value[pid] && typeof openedRow.value[pid].at === 'string',
    `pmQueueOpened=${JSON.stringify(openedRow?.value)}`)
  check('open.topIsP0', openQ.top?.taskId === 't-0002' && openQ.top?.priority === 'P0', `top=${openQ.top?.taskId}/${openQ.top?.title}`)

  // ===== 2) queue list 只读：不刷新打卡 =====
  const beforeAt = openedRow.value[pid].at
  const listText = await run(`queue list ${pid}`)
  const listQ = JSON.parse(listText)
  const openedRow2 = domain.table('settings').get('pmQueueOpened')
  check('list.readOnly', openedRow2.value[pid].at === beforeAt, `at 未变=${openedRow2.value[pid].at === beforeAt}`)
  check('list.quietModeFalse', listQ.quietMode === false && listQ.top?.taskId === 't-0002', `quietMode=${listQ.quietMode} top=${listQ.top?.taskId}`)

  // ===== 3) mute t-0002（P0 今天到期，非豁免）：落盘 + top 排除 + rest 标 muted + ttlDays =====
  const muteText = await run('queue mute t-0002 7')
  check('mute.ack', /已静音任务 t-0002/.test(muteText), muteText.split('\n')[0])
  const muteRow = domain.table('settings').get('pmQueueMute')
  check('mute.diskRow', !!muteRow && muteRow.value['t-0002']?.mutedAt && muteRow.value['t-0002'].ttlDays === 7,
    `pmQueueMute=${JSON.stringify(muteRow?.value)}`)
  const afterMute = JSON.parse(await run(`queue list ${pid}`))
  check('mute.topSwitches', afterMute.top?.taskId === 't-0001', `top=${afterMute.top?.taskId}（静音 P0 被压下）`)
  const mutedItem = afterMute.rest.find(i => i.taskId === 't-0002')
  check('mute.restVisibleMuted', !!mutedItem && mutedItem.muted === true && !!mutedItem.mutedUntil,
    `muted=${mutedItem?.muted} until=${mutedItem?.mutedUntil}`)

  // ===== 4) unmute 清除 =====
  await run('queue unmute t-0002')
  const muteRowAfter = domain.table('settings').get('pmQueueMute')
  check('unmute.cleared', !muteRowAfter || !muteRowAfter.value['t-0002'], `row=${JSON.stringify(muteRowAfter?.value ?? '已删行')}`)
  const afterUnmute = JSON.parse(await run(`queue list ${pid}`))
  check('unmute.topRestored', afterUnmute.top?.taskId === 't-0002' && !afterUnmute.rest.some(i => i.taskId === 't-0002' && i.muted),
    `top=${afterUnmute.top?.taskId}`)

  // ===== 5) quiet 00:00 23:59 → quietMode=true、top 置空、rest 保留；quiet off 清除 =====
  await run('queue quiet 00:00 23:59')
  const quietRow = domain.table('settings').get('pmQueueQuiet')
  check('quiet.diskRow', !!quietRow && quietRow.value.from === '00:00' && quietRow.value.to === '23:59',
    `pmQueueQuiet=${JSON.stringify(quietRow?.value)}`)
  const quietQ = JSON.parse(await run(`queue list ${pid}`))
  check('quiet.quietMode', quietQ.quietMode === true && quietQ.top === null && quietQ.rest.length >= 2,
    `quietMode=${quietQ.quietMode} top=${quietQ.top} rest=${quietQ.rest.length}`)
  await run('queue quiet off')
  check('quiet.offCleared', !domain.table('settings').get('pmQueueQuiet'), 'pmQueueQuiet 行已删')
  const offQ = JSON.parse(await run(`queue list ${pid}`))
  check('quiet.offRestored', offQ.quietMode === false && offQ.top?.taskId === 't-0002', `quietMode=${offQ.quietMode} top=${offQ.top?.taskId}`)

  // 非法时段拒绝
  const bad = await run('queue quiet 25:00 06:00', 'error')
  check('quiet.invalidRejected', /HH:MM/.test(bad), bad.split('\n')[0])

  // ===== 6) K9 缺席：bind t-0003（绑定后零更新）→ 缺席条目进 rest，不进 top =====
  await run('session bind t-0003 s-e2e-01 "验证结存：待跟进"')
  const absQ = JSON.parse(await run(`queue list ${pid}`))
  const absent = absQ.rest.find(i => i.taskId === 't-0003')
  check('k9.absent', !!absent && absent.absent === true && absQ.top?.taskId !== 't-0003',
    `absent=${absent?.absent} top=${absQ.top?.taskId}`)

  // ===== 7) 项目不存在报错；snapshot 携带 queue =====
  const miss = await run('queue list p-9999', 'error')
  check('project.missing', /未找到项目 p-9999/.test(miss), miss)
  const snap = JSON.parse(await run('web snapshot'))
  check('snapshot.queue', snap.queue && snap.queue[pid] && 'top' in snap.queue[pid] && 'rest' in snap.queue[pid]
    && 'quietMode' in snap.queue[pid] && 'openedAt' in snap.queue[pid],
    `queue keys=${Object.keys(snap.queue ?? {}).join(',')}`)

  // ===== 8) 真实 JSON 文件落盘核验 =====
  const settingsDir = join(root, 'pmtool', 'settings')
  check('disk.opened', readFileSync(join(settingsDir, 'pmQueueOpened.json'), 'utf8').includes('"at"'), 'pmQueueOpened.json 含 at')
  check('disk.quietOff', !readdirSync(settingsDir).includes('pmQueueQuiet.json'), 'quiet off 后无 pmQueueQuiet.json')
  const sessDir = join(root, 'pmtool', 'sessions')
  check('disk.sessions', readdirSync(sessDir).length >= 1, 'sessions 目录有绑定记录')
} catch (e) {
  check('FATAL', false, e instanceof Error ? e.stack ?? e.message : String(e))
}

const failed = results.filter(r => !r.ok)
console.log(failed.length ? `\nP1A-QUEUE FAIL (${failed.length}/${results.length})` : `\nP1A-QUEUE PASS (${results.length}/${results.length})`)
process.exit(failed.length ? 1 : 0)
