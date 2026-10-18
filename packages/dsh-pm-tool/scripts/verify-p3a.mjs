/**
 * P3-A X7 习惯层 + K11 占位 真实链路自验（独立临时根，不触碰 3172 / 正式 data/）。
 * 机制同 verify-p2b-okr.mjs：真实 Context + JsonStorageBackend 临时根 + 真实命令 handler。
 * 覆盖：
 *  1. habit add 真实落库（draft，关联同项目 okrId）
 *  2. checkin 今天（backfilled=false）/ 昨天回填（backfilled=true）/ 3 天前超窗被拒（中文）
 *  3. streak 连续（今天+昨天 → current=2）；断签超窗 current 重置 0 但 longest/totalDays 保留
 *  4. habit suggest → 收件区出现且 habits 表无新记录（未确认不生效）
 *  5. inbox 列待确认；confirm → habits 表出现 draft 记录 + 建议已处理；final → final（幂等）
 *  6. K11 cycleHookPoint 占位：daily-archive / quarterly-review 均 enabled:false
 *  7. 落盘核验：habits/*.json 与 settings/pmHabitInbox.json 真实 JSON 文件
 *
 * 运行：pnpm 预编译后 `node scripts/verify-p3a.mjs`（从 lib 构建产物导入）；
 * 同时把全部输出写入 /tmp/p3a-verify.log。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { handleOkrCommand } from '../lib/commands/okr.js'
import { handleHabitCommand } from '../lib/commands/habit.js'
import { deriveHabitStreak } from '../lib/core/habits.js'
import { cycleHookPoint } from '../lib/core/cycle-hooks.js'
import { pmDomainSpec } from '../lib/core/storage.js'

const DAY_MS = 86_400_000
const root = mkdtempSync(join(tmpdir(), 'pm-tool-p3a-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)

const logLines = []
const results = []
const check = (k, ok, detail = '') => {
  results.push({ k, ok: !!ok, detail: String(detail) })
  const line = `[${ok ? 'OK' : 'XX'}] ${k} :: ${detail}`
  console.log(line)
  logLines.push(line)
}

function fmtLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const now = new Date()
const today = fmtLocal(now)
const yesterday = fmtLocal(new Date(now.getTime() - DAY_MS))
const threeDaysAgo = fmtLocal(new Date(now.getTime() - 3 * DAY_MS))

async function run(rawInput, expected = 'success') {
  const result = await handleHabitCommand(rawInput, domain)
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}

let domain
try {
  // 直接打开领域（复刻 apply() 内 openPmDomain），不经过 index.js，避免依赖其它分片在制品。
  domain = await ctx.storageDomain.open(pmDomainSpec)
  assert.ok(domain)
  const project = await addProject(domain, { name: 'P3-A 习惯验证项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const pid = project.id

  // 先建一条同项目 OKR，供习惯关联（走真实 okr 命令链）。
  const o1 = await handleOkrCommand(`add ${pid} ${JSON.stringify({ title: '做出稳定可交付的个人工作台', kind: 'objective' })}`, domain)
  assert.equal(o1.kind, 'success', o1.text)
  const o1Id = /(okr-[a-zA-Z0-9_-]+)/.exec(o1.text)[1]

  // ===== 1) add 真实落库：draft + 关联同项目 okrId =====
  const addText = await run(`add ${pid} ${JSON.stringify({ title: '每日晨走 20 分钟', okrId: o1Id })}`)
  const habitId = /(habit-[a-zA-Z0-9_-]+)/.exec(addText)[1]
  check('add.draftLinked', /草稿/.test(addText) && addText.includes(o1Id), addText.split('\n')[0])
  const added = domain.table('habits').get(habitId)
  check('add.statusDraft', added.status === 'draft' && added.okrId === o1Id, `status=${added.status}, okrId=${added.okrId}`)

  // ===== 2) checkin：今天 / 昨天回填 / 3 天前超窗被拒 =====
  const todayText = await run(`checkin ${habitId}`)
  check('checkin.today', /已打卡/.test(todayText) && !/回填/.test(todayText), todayText.split('\n')[0])
  const yestText = await run(`checkin ${habitId} ${yesterday} 昨天漏了补记`)
  check('checkin.backfill', /回填/.test(yestText), yestText.split('\n')[0])
  const neg = await run(`checkin ${habitId} ${threeDaysAgo}`, 'error')
  check('checkin.windowReject', /超出补记窗/.test(neg), neg)

  // ===== 3) streak 连续；断签超窗 current 重置 0，longest/totalDays 永久保留 =====
  const after = domain.table('habits').get(habitId)
  const live = deriveHabitStreak(after, today)
  check('streak.continuous', live.current === 2 && live.longest === 2 && live.totalDays === 2,
    `current=${live.current}, longest=${live.longest}, totalDays=${live.totalDays}`)

  // 断签超窗派生核验：历史连续 5 天（9 天前 ~ 5 天前），之后断签至今（最新日距今天 5 天 >2，超窗），
  // current 重置 0，longest/totalDays 从全量 checkIns 重算、永久保留（纯函数口径，同单测）。
  const oldCheckIns = []
  for (let i = 9; i >= 5; i--) oldCheckIns.push({ at: fmtLocal(new Date(now.getTime() - i * DAY_MS)), backfilled: false })
  const aged = deriveHabitStreak({ checkIns: oldCheckIns }, today)
  check('streak.breakReset', aged.current === 0 && aged.longest === 5 && aged.totalDays === 5,
    `断签后 current=${aged.current}（重置）, longest=${aged.longest}, totalDays=${aged.totalDays}（保留）`)

  // ===== 4) suggest：只进收件区，habits 表无新记录（未确认不生效）=====
  const beforeSuggest = [...domain.table('habits').entries()].length
  const sug = await run(`suggest ${pid} ${JSON.stringify({ title: '每日复盘 10 分钟', rationale: '晚间对话规律最稳定', okrId: o1Id })}`)
  const sugId = /(habitsug-[a-zA-Z0-9_-]+)/.exec(sug)[1]
  const afterSuggest = [...domain.table('habits').entries()].length
  check('suggest.noRecord', afterSuggest === beforeSuggest, `habits rows ${beforeSuggest}→${afterSuggest}（未确认不生效）`)
  const inboxRows = domain.table('settings').get('pmHabitInbox')?.value?.entries ?? []
  check('suggest.inbox', inboxRows.length === 1 && inboxRows[0].status === 'pending', `inbox=${inboxRows.length}`)

  // ===== 5) inbox → confirm 建 draft；final 定稿（幂等）=====
  const inboxText = await run(`inbox ${pid}`)
  check('inbox.pending', inboxText.includes(sugId) && /待确认/.test(inboxText), inboxText.split('\n')[1] ?? '')
  const confirmText = await run(`confirm ${sugId}`)
  check('confirm.record', /创建草稿习惯记录 habit-/.test(confirmText), confirmText.split('\n')[0])
  const afterConfirm = [...domain.table('habits').entries()].length
  check('confirm.rowAdded', afterConfirm === beforeSuggest + 1, `habits rows ${beforeSuggest}→${afterConfirm}`)
  const confirmedSug = domain.table('settings').get('pmHabitInbox').value.entries.find(e => e.id === sugId)
  check('confirm.marked', confirmedSug.status === 'confirmed' && !!confirmedSug.confirmedHabitId, `status=${confirmedSug.status}`)
  const newRec = domain.table('habits').get(confirmedSug.confirmedHabitId)
  check('confirm.draftNoAutoFinal', newRec.status === 'draft', `新记录 status=${newRec.status}`)

  const finalText = await run(`final ${habitId}`)
  check('final.humanFinal', /已定稿/.test(finalText), finalText.split('\n')[0])
  check('final.status', domain.table('habits').get(habitId).status === 'final', 'habit status=final')
  // 幂等：再 final 一次不报错、状态不变
  const finalAgain = await run(`final ${habitId}`)
  check('final.idempotent', /已定稿/.test(finalAgain), '重复 final 幂等')

  // ===== 6) K11 cycleHookPoint 占位：一律 enabled:false =====
  for (const hook of ['daily-archive', 'quarterly-review']) {
    const point = cycleHookPoint(hook, domain, today)
    check(`cycle.${hook}`, point.enabled === false && /H6/.test(point.reason), `enabled=${point.enabled}, reason=${point.reason}`)
  }

  // ===== 7) 落盘核验：真实 JSON 文件 =====
  const habitsDir = join(root, 'pmtool', 'habits')
  check('disk.habitsDir', existsSync(habitsDir) && readdirSync(habitsDir).length >= 2, `files=${readdirSync(habitsDir).length}`)
  const inboxFile = join(root, 'pmtool', 'settings', 'pmHabitInbox.json')
  check('disk.inbox', existsSync(inboxFile) && readFileSync(inboxFile, 'utf8').includes('每日复盘'), 'pmHabitInbox.json 落盘')
  const sample = readFileSync(join(habitsDir, `${habitId}.json`), 'utf8')
  check('disk.recordFields', sample.includes('晨走') && sample.includes('"checkIns"') && sample.includes('backfilled'), 'habits 记录含标题/打卡/回填标记')
} catch (e) {
  check('FATAL', false, e instanceof Error ? e.stack ?? e.message : String(e))
}

const failed = results.filter(r => !r.ok)
const summary = failed.length
  ? `\nP3A FAIL (${failed.length}/${results.length})`
  : `\nP3A PASS (${results.length}/${results.length})`
console.log(summary)
logLines.push(summary)
writeFileSync('/tmp/p3a-verify.log', logLines.join('\n') + '\n', 'utf8')
process.exit(failed.length ? 1 : 0)
