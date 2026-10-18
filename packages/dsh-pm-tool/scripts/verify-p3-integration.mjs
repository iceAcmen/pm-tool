/**
 * P3 集成验证：X7 习惯层（streak 档案/补记窗/收件区/定稿）+ K11 周期接线占位。
 * 机制与 verify-p2-integration.mjs 同构：真实 Context + JsonStorageBackend 临时根 + 真实命令 handler。
 * 不触碰 3172 / 正式 data/；不调模型。
 * 覆盖（对应 docs/design/deep-integration-v2-p3-dev.md）：
 *  1. habit add 落库（draft，可关联 OKR）
 *  2. checkin 今天 / 昨天回填 backfilled / 3 天前超窗拒
 *  3. streak 连续派生 + 断签（缺口>2 天）current 重置 0 但 longest/totalDays 永久保留
 *  4. suggest 只进收件区零写入 → inbox → confirm 建 draft → ignore 保留标 ignored
 *  5. finalize 幂等（draft→final；再次 final 不破坏）
 *  6. cycleHookPoint 占位 enabled:false（不启用调度）
 *  7. 跨项目 okrId 拒因（中文）
 *  8. snapshot.habits 携带 + 既有字段零破坏
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import { addOkr } from '../lib/core/okr.js'
import { deriveHabitStreak, buildHabitArchive } from '../lib/core/habits.js'
import { setFixedTodayIso, clearFixedTodayIso } from '../lib/core/derived.js'
import { cycleHookPoint, CYCLE_HOOKS } from '../lib/core/cycle-hooks.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-p3-integration-'))
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const results = []
const check = (k, ok, detail = '') => { results.push({ k, ok: !!ok, detail: String(detail) }); console.log(`[${ok ? 'OK' : 'XX'}] ${k} :: ${detail}`) }

try {
  await apply(ctx)
  const domain = facility.get('pmtool')
  assert.ok(domain)
  // 夹具以 2026-10-18 为「今天」：注入固定时钟解耦墙钟，不改任何断言预期。
  setFixedTodayIso('2026-10-18')
  const project = await addProject(domain, { name: 'P3 集成验证项目', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const pid = project.id
  const okr = await addOkr(domain, pid, { title: '年度目标：交付质量', kind: 'objective' })
  const otherProj = await addProject(domain, { name: '跨项目', startDate: '2026-10-01', targetDate: '2026-12-31' })

  // ===== 1) habit add 落库（draft + 关联 OKR）=====
  const addText = await run(`habit add ${pid} ${JSON.stringify({ title: '每日站会复盘', okrId: okr.id })}`)
  check('p3.add.draft', /草稿|draft/.test(addText), addText.split('\n')[0])
  const habit = [...domain.table('habits').entries()][0]?.[1]
  check('p3.add.record', !!habit && habit.status === 'draft' && habit.okrId === okr.id, `habit 落库 draft okrId=${habit?.okrId}`)
  const crossOkr = await run(`habit add ${otherProj.id} ${JSON.stringify({ title: '跨项目习惯', okrId: okr.id })}`, 'error')
  check('p3.crossOkr.deny', /不属于|跨项目|存在/.test(crossOkr), crossOkr)

  // ===== 2) checkin：今天 / 昨天回填 / 3 天前超窗拒 =====
  await run(`habit checkin ${habit.id} 2026-10-18 "站会完成"`)
  await run(`habit checkin ${habit.id} 2026-10-17`)
  const after2 = domain.table('habits').get(habit.id)
  check('p3.checkin.two', after2.checkIns.length === 2, `打卡 ${after2.checkIns.length} 条`)
  check('p3.checkin.backfill', after2.checkIns.find(c => c.at === '2026-10-17')?.backfilled === true, '昨天回填标 backfilled:true')
  check('p3.checkin.todayNoBackfill', after2.checkIns.find(c => c.at === '2026-10-18')?.backfilled === false, '今天打卡 backfilled:false')
  const early = await run(`habit checkin ${habit.id} 2026-10-15`, 'error')
  check('p3.checkin.windowDeny', /补记窗|过去 2 天/.test(early), early)

  // ===== 3) streak 派生（纯函数注入 today）+ 断签重置/累计档案保留 =====
  const s1 = deriveHabitStreak(after2, '2026-10-18')
  check('p3.streak.current', s1.current === 2, `当前连续 ${s1.current}`)
  check('p3.streak.longest', s1.longest === 2, `最长段 ${s1.longest}`)
  check('p3.streak.total', s1.totalDays === 2, `累计 ${s1.totalDays}`)
  // 断签：最新打卡距 today >2 天 → current 重置 0；longest/totalDays 保留
  const gapRecord = { ...after2, checkIns: [{ at: '2026-10-10', backfilled: false }, { at: '2026-10-08', backfilled: false }] }
  const s2 = deriveHabitStreak(gapRecord, '2026-10-18')
  check('p3.streak.reset', s2.current === 0, `断签超窗 current 重置 ${s2.current}`)
  check('p3.streak.longestKept', s2.longest === 2 && s2.totalDays === 2, `longest/totalDays 保留（${s2.longest}/${s2.totalDays}）`)
  const archive = buildHabitArchive([{ ...gapRecord, title: '旧习惯' }], '2026-10-18')
  check('p3.archive.line', /当前连续 0 天 · 历史最长 2 天 · 累计 2 天/.test(archive[0] ?? ''), archive[0])
  // 断签连续：10/10→10/12（缺 10/11 在 2 天窗内）算连续
  const s3 = deriveHabitStreak({ ...after2, checkIns: [{ at: '2026-10-10', backfilled: false }, { at: '2026-10-12', backfilled: false }] }, '2026-10-12')
  check('p3.streak.windowChain', s3.current === 2, `2 天窗内缺口算连续（${s3.current}）`)

  // ===== 4) suggest 只进收件区 → inbox → confirm → ignore =====
  const okrCountBefore = [...domain.table('habits').entries()].length
  await run(`habit suggest ${pid} ${JSON.stringify({ title: 'agent 建议：晨间计划', rationale: '近 7 天每日有任务更新' })}`)
  const inbox = domain.table('settings').get('pmHabitInbox')?.value?.entries ?? []
  check('p3.suggest.inbox', inbox.some(s => s.status === 'pending' && s.title === 'agent 建议：晨间计划'), `建议进收件区 ${inbox.length} 条`)
  check('p3.suggest.nowrite', [...domain.table('habits').entries()].length === okrCountBefore, 'suggest 后 habits 零写入（未确认不生效）')
  const sug = inbox.find(s => s.title === 'agent 建议：晨间计划')
  await run(`habit confirm ${sug.id}`)
  const confirmed = [...domain.table('habits').entries()].map(([, r]) => r)
  check('p3.confirm.record', confirmed.length === okrCountBefore + 1 && confirmed.some(r => r.title === 'agent 建议：晨间计划' && r.status === 'draft'), 'confirm 建 draft 记录')
  const inbox2 = domain.table('settings').get('pmHabitInbox')?.value?.entries ?? []
  check('p3.confirm.marked', inbox2.find(s => s.id === sug.id)?.status === 'confirmed', '建议标 confirmed')
  await run(`habit suggest ${pid} ${JSON.stringify({ title: '第二建议', rationale: '待核' })}`)
  const sug2 = [...domain.table('settings').get('pmHabitInbox')?.value?.entries ?? []].find(s => s.title === '第二建议')
  await run(`habit ignore ${sug2.id}`)
  const inbox3 = domain.table('settings').get('pmHabitInbox')?.value?.entries ?? []
  check('p3.ignore.kept', inbox3.find(s => s.id === sug2.id)?.status === 'ignored', 'ignore 保留标 ignored')
  const inboxText = await run(`habit inbox ${pid}`)
  check('p3.inbox.cmd', /待确认|建议/.test(inboxText), 'habit inbox 只读列出')

  // ===== 5) finalize 幂等 =====
  await run(`habit final ${habit.id}`)
  check('p3.final.status', domain.table('habits').get(habit.id).status === 'final', '人定稿 final')
  const finalAgain = await run(`habit final ${habit.id}`)
  check('p3.final.idempotent', /已定稿|final/.test(finalAgain), '重复 final 幂等')

  // ===== 6) K11 周期接线占位 =====
  check('p3.cycle.hooks', CYCLE_HOOKS.includes('daily-archive') && CYCLE_HOOKS.includes('quarterly-review'), `钩子清单 ${CYCLE_HOOKS.join(',')}`)
  const hp = cycleHookPoint('daily-archive', domain, '2026-10-18')
  check('p3.cycle.disabled', hp.enabled === false && /未启用|未实现/.test(hp.reason), `占位未启用 ${JSON.stringify(hp)}`)
  const hp2 = cycleHookPoint('quarterly-review', domain, '2026-10-18')
  check('p3.cycle.disabled2', hp2.enabled === false, 'quarterly-review 同样未启用')

  // ===== 7) habit list =====
  const listText = await run(`habit list ${pid}`)
  check('p3.list.archive', /当前连续/.test(listText) && /历史最长/.test(listText) && /累计/.test(listText), 'list 含 streak 文本档案')

  // ===== 8) snapshot.habits 携带 =====
  const snap = JSON.parse(await run(`web snapshot`))
  check('p3.snapshot.habits', Array.isArray(snap.habits) && snap.habits.some(h => h.id === habit.id), `snapshot.habits ${snap.habits?.length} 条`)
  check('p3.snapshot.backcompat', snap.projects != null && Array.isArray(snap.tasks) && Array.isArray(snap.okrs), 'snapshot 既有字段零破坏')

  // ===== 落盘核验 =====
  check('disk.habit', readFileSync(join(root, 'pmtool', 'habits', `${habit.id}.json`), 'utf8').includes('checkIns'), `habits/${habit.id}.json 落库`)

  const failed = results.filter(r => !r.ok)
  console.log(`\n=== P3 集成验证：${results.length - failed.length}/${results.length} PASS ===`)
  if (failed.length) {
    console.log('失败项：')
    for (const f of failed) console.log(`  ${f.k} :: ${f.detail}`)
    process.exitCode = 1
  } else {
    console.log('全部通过。')
  }
} catch (err) {
  console.error('\n[ERROR]', err)
  const failed = results.filter(r => !r.ok)
  console.log(`=== 已执行 ${results.length} 项，其中 ${failed.length} 项失败 ===`)
  for (const f of failed) console.log(`  ${f.k} :: ${f.detail}`)
  process.exitCode = 1
} finally {
  clearFixedTodayIso()
}
