/**
 * #21 口径配置化验证（表驱动，纯函数 + 命令持久化 + 全新进程读回 + UI 契约 + 零写静态 grep）。
 *
 * 覆盖：
 *  A. 默认等价：不传 settings 时，派生结果与配置化前硬编码逐值一致（健康分/灯号、临期窗口、过载阈值）。
 *  B. 覆盖生效：注入自定义 settings 后，健康分/灯号线/临期窗口/过载阈值相应变化。
 *  C. 非法值校验：越界/非整数/灯号倒挂被 normalizeProjectSettings 拒绝并回落默认，给出中文原因。
 *  D. 命令持久化：settings put 局部合并保留其它自定义；非法整份拒绝；reset 回落默认；
 *     web snapshot.settings 透传；全新进程（--reopen）读回；7 个业务字段不受影响。
 *  E. UI 契约：snapshot.settings 透传、SettingsPanel/菜单/视图 props 接线存在（静态）。
 *  F. 零写静态 grep：core 口径文件无 run/execute/fs 写。
 *
 * 全程使用独立系统临时目录，不污染正式 data/backups/exports。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import {
  DEFAULT_PROJECT_SETTINGS,
  normalizeProjectSettings,
  sameSettings,
  SETTING_FIELDS,
} from '../lib/core/settings.js'
import { scoreFromInputs } from '../lib/core/derived.js'
import { groupOpenTasksByAssignee } from '../lib/core/people-load.js'
import { computeKPI, buildAgenda } from '../lib/core/war-room.js'

// ---------- A. 默认等价：不传 settings == 显式默认，且等于硬编码基线 ----------
{
  const inputs = {
    taskTotal: 5, overdueTasks: 1, taskBlocked: 1,
    openHighRisk: 1, openCriticalRisk: 1, milestoneOverdue: 1,
  }
  const baseline = scoreFromInputs(inputs)
  const explicit = scoreFromInputs(inputs, DEFAULT_PROJECT_SETTINGS)
  assert.deepEqual(explicit, baseline, '显式默认应与缺省逐值一致（默认等价）')
  // 硬编码基线：扣分 3+4+(6+10=16)+8=31 → 69 分，60≤69<80 → 黄灯。
  assert.equal(baseline.score, 69, `默认健康分应为 69，实际 ${baseline.score}`)
  assert.equal(baseline.lamp, 'yellow', `默认灯号应为 yellow，实际 ${baseline.lamp}`)
  assert.ok(sameSettings(DEFAULT_PROJECT_SETTINGS, DEFAULT_PROJECT_SETTINGS))
  console.log('A 通过：默认等价（健康分 69/yellow，缺省=显式默认逐值一致）。')
}

// ---------- B. 覆盖生效 ----------
{
  const inputs = {
    taskTotal: 5, overdueTasks: 1, taskBlocked: 1,
    openHighRisk: 1, openCriticalRisk: 1, milestoneOverdue: 1,
  }
  // 把所有每任务扣分与封顶调到 0 → 不扣分 → 100 分绿灯。
  const zero = { ...DEFAULT_PROJECT_SETTINGS, healthOverduePer: 0, healthBlockedPer: 0, healthHighRiskPer: 0, healthCriticalRiskPer: 0, healthOverdueMilestonePer: 0 }
  const r = scoreFromInputs(inputs, zero)
  assert.equal(r.score, 100, `零扣分应为 100，实际 ${r.score}`)
  assert.equal(r.lamp, 'green')

  // 灯号线覆盖：69 分在默认是 yellow；把绿灯线降到 60、黄灯线降到 40 → 69 为 green。
  const relaxed = { ...DEFAULT_PROJECT_SETTINGS, healthGreenAt: 60, healthYellowAt: 40 }
  const r2 = scoreFromInputs(inputs, relaxed)
  assert.equal(r2.score, 69)
  assert.equal(r2.lamp, 'green', `灯号线覆盖后 69 应为 green，实际 ${r2.lamp}`)

  // 临期窗口覆盖：任务 10 天后到期；默认 7 天不计入 soon，14 天计入。
  const today = '2026-10-16'
  const tasks = [{
    id: 't1', projectId: 'p1', title: 'x', assignee: '甲', status: 'todo',
    dueDate: '2026-10-26', startDate: '2026-10-20', progress: 0,
  }]
  const projects = [{ id: 'p1', name: 'P' }]
  const defReport = groupOpenTasksByAssignee(tasks, projects, { today })
  assert.equal(defReport.people[0].dueSoon, 0, '默认 7 天窗口：10 天后到期不计 soon')
  const wideReport = groupOpenTasksByAssignee(tasks, projects, { today, settings: { ...DEFAULT_PROJECT_SETTINGS, reminderWithinDays: 14 } })
  assert.equal(wideReport.people[0].dueSoon, 1, '14 天窗口：10 天后到期应计入 soon')

  // 作战室近期里程碑窗口覆盖。
  const ms = [{ id: 'm1', projectId: 'p1', title: 'M', targetDate: '2026-10-22', status: 'planned' }]
  const kpiDef = computeKPI([], ms, [], today)
  const kpiWide = computeKPI([], ms, [], today, undefined, { ...DEFAULT_PROJECT_SETTINGS, reminderWithinDays: 7 })
  assert.equal(kpiDef.upcomingMilestones, 1)
  assert.equal(kpiWide.upcomingMilestones, 1)
  const agendaDef = buildAgenda([], ms, today)
  assert.equal(agendaDef.length, 1)
  console.log('B 通过：覆盖生效（零扣分 100/green、灯号线、临期窗口、作战室窗口）。')
}

// ---------- C. 非法值校验 ----------
{
  // 越界非整数回落默认并记录原因。
  const { settings, invalid } = normalizeProjectSettings({
    healthOverduePer: 999,           // 越界
    healthGreenAt: '80',             // 非整数（字符串）
    reminderWithinDays: 0,           // 越界（min 1）
    loadOverloadThreshold: 6.5,      // 非整数
    unknownKey: 123,                 // 未知键忽略
  })
  assert.equal(settings.healthOverduePer, DEFAULT_PROJECT_SETTINGS.healthOverduePer)
  assert.equal(settings.healthGreenAt, DEFAULT_PROJECT_SETTINGS.healthGreenAt)
  assert.equal(settings.reminderWithinDays, DEFAULT_PROJECT_SETTINGS.reminderWithinDays)
  assert.equal(settings.loadOverloadThreshold, DEFAULT_PROJECT_SETTINGS.loadOverloadThreshold)
  assert.ok(invalid.length >= 4, `应至少 4 条非法原因，实际 ${invalid.length}: ${invalid.join(' | ')}`)
  assert.ok(!('unknownKey' in settings))

  // 灯号倒挂：green<yellow 两者回落默认。
  const down = normalizeProjectSettings({ healthGreenAt: 30, healthYellowAt: 70 })
  assert.equal(down.settings.healthGreenAt, DEFAULT_PROJECT_SETTINGS.healthGreenAt)
  assert.equal(down.settings.healthYellowAt, DEFAULT_PROJECT_SETTINGS.healthYellowAt)
  assert.ok(down.invalid.some(x => x.includes('绿灯')))

  // 非对象 / null / 数组 → 全默认，不抛。
  for (const bad of [null, undefined, 'str', [1, 2], 42]) {
    const r = normalizeProjectSettings(bad)
    assert.deepEqual(r.settings, DEFAULT_PROJECT_SETTINGS)
  }
  // 合法值原样保留。
  const ok = normalizeProjectSettings({ reminderWithinDays: 14, loadOverloadThreshold: 6 })
  assert.equal(ok.settings.reminderWithinDays, 14)
  assert.equal(ok.settings.loadOverloadThreshold, 6)
  assert.equal(ok.invalid.length, 0)
  console.log('C 通过：非法值校验（越界/非整数/灯号倒挂回落默认并给出中文原因，未知键忽略）。')
}

// ---------- D. 命令持久化 + 全新进程读回（--reopen） ----------
const reopening = process.argv[2] === '--reopen'
const root = reopening ? process.argv[3] : mkdtempSync(join(tmpdir(), 'pm-tool-settings-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) { command = definition; return () => {} },
})

async function run(rawInput, expected = 'success') {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, expected, `${rawInput}：${result.text}`)
  return result.text
}
async function snapshot() { return JSON.parse(await run('web snapshot')) }

const BUSINESS = ['projects', 'tasks', 'milestones', 'riskIssues', 'meetings', 'reports', 'deliverables']

try {
  await apply(ctx)
  assert.ok(facility.get('pmtool'))

  if (reopening) {
    // 全新进程读回：上一进程已写 reminderWithinDays=14 + loadOverloadThreshold=6（局部合并保留）。
    const snap = await snapshot()
    assert.ok(snap.settings, 'snapshot.settings 必须存在')
    assert.equal(snap.settings.reminderWithinDays, 14, '重启后临期窗口应读回 14')
    assert.equal(snap.settings.loadOverloadThreshold, 6, '重启后过载阈值应读回 6')
    // 未列出字段回落默认。
    assert.equal(snap.settings.healthOverduePer, DEFAULT_PROJECT_SETTINGS.healthOverduePer)
    assert.equal(snap.settings.healthGreenAt, DEFAULT_PROJECT_SETTINGS.healthGreenAt)
    for (const key of BUSINESS) assert.ok(Array.isArray(snap[key]), `snapshot.${key} 应为数组`)
    console.log('D 通过：全新进程读回自定义口径，未列出字段回落默认，业务字段不受影响。')
  } else {
    // 默认：snapshot.settings 全等于默认。
    let snap = await snapshot()
    assert.ok(snap.settings, '默认也应透传 settings（全默认）')
    assert.ok(sameSettings(snap.settings, DEFAULT_PROJECT_SETTINGS), '无设置记录时 snapshot.settings 应全默认')
    for (const key of BUSINESS) assert.ok(Array.isArray(snap[key]), `snapshot.${key} 应为数组`)

    // 默认展示命令成功。
    await run('settings')
    await run('settings get')

    // 局部 put：只写临期窗口。
    await run('settings put {"reminderWithinDays":14}')
    snap = await snapshot()
    assert.equal(snap.settings.reminderWithinDays, 14)
    assert.equal(snap.settings.loadOverloadThreshold, DEFAULT_PROJECT_SETTINGS.loadOverloadThreshold)

    // 再次局部 put 过载阈值 → 前一个自定义（14）必须被合并保留（不被默认冲掉）。
    await run('settings put {"loadOverloadThreshold":6}')
    snap = await snapshot()
    assert.equal(snap.settings.reminderWithinDays, 14, '局部合并应保留 reminderWithinDays=14')
    assert.equal(snap.settings.loadOverloadThreshold, 6)

    // 非法整份拒绝、不落盘。
    for (const bad of [
      'settings put',
      'settings put not-json',
      'settings put {broken',
      'settings put {"healthOverduePer":999}',
      'settings put {"reminderWithinDays":0}',
      'settings put {"healthGreenAt":30,"healthYellowAt":70}',
      'settings bogus',
      'settings reset extra',
    ]) {
      await run(bad, 'error')
    }
    // 拒绝后自定义仍在。
    snap = await snapshot()
    assert.equal(snap.settings.reminderWithinDays, 14)

    // reset → 全默认。
    await run('settings reset')
    snap = await snapshot()
    assert.ok(sameSettings(snap.settings, DEFAULT_PROJECT_SETTINGS), 'reset 后应全默认')

    // 为 --reopen 准备磁盘：写两个自定义（局部合并）。
    await run('settings put {"reminderWithinDays":14}')
    await run('settings put {"loadOverloadThreshold":6}')
    console.log('D 通过：put 局部合并保留、非法整份拒绝、reset 回落默认、snapshot 透传。')
    await facility.closeAll()

    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--reopen', root], {
      encoding: 'utf8', env: process.env, timeout: 30_000,
    })
    assert.equal(child.status, 0, `${child.error ?? ''}\n${child.stdout}\n${child.stderr}`)
    console.log(child.stdout.trim())
  }

  // ---------- E. UI 契约（静态） ----------
  const read = (p) => readFileSync(join(new URL('..', import.meta.url).pathname, p), 'utf8')
  const indexTs = read('src/index.ts')
  assert.ok(indexTs.includes('settings: readProjectSettings(domain)'), 'index.ts snapshot 应透传 settings')
  const panel = read('src/client/panel.tsx')
  // S0 抽离后 SettingsPanel 由 panel.tsx 迁移到 shared/drawers/settings-drawer.tsx；
  // panel 仍注册 settings drawer 并导入组件，命令通道与文案留在抽离文件内。
  const settingsDrawer = read('src/client/shared/drawers/settings-drawer.tsx')
  assert.ok(panel.includes('kind: \'settings\''), 'panel.tsx 应注册 settings drawer')
  assert.ok(panel.includes('SettingsPanel'), 'panel.tsx 应导入 SettingsPanel')
  assert.ok(settingsDrawer.includes('function SettingsPanel'), 'settings-drawer.tsx 应定义 SettingsPanel')
  assert.ok(settingsDrawer.includes('settings put '), 'SettingsPanel 应调用 settings put')
  assert.ok(settingsDrawer.includes('settings reset'), 'SettingsPanel 应提供 settings reset')
  assert.ok(panel.includes('口径设置') || settingsDrawer.includes('口径设置'), '应有「口径设置」菜单/标题文案')
  const overview = read('src/client/views/overview.tsx')
  assert.ok(overview.includes('settings?: ProjectSettings'), 'Overview 应接收 settings prop')
  const people = read('src/client/views/people.tsx')
  assert.ok(people.includes('settings?: ProjectSettings'), 'PeopleView 应接收 settings prop')
  console.log('E 通过：UI 契约（snapshot 透传、SettingsPanel、菜单、视图 props）。')

  // ---------- F. 零写静态 grep：core 口径文件无 run/execute/fs 写 ----------
  const zeroWriteFiles = [
    'src/core/settings.ts', 'src/core/derived.ts', 'src/core/health.ts',
    'src/core/reminders.ts', 'src/core/people-load.ts', 'src/core/war-room.ts',
  ]
  for (const rel of zeroWriteFiles) {
    const txt = read(rel)
    for (const banned of ['execute(', 'run(', 'writeFile', 'writeFileSync', 'node:fs', 'require("fs")', 'require(\'fs\')']) {
      assert.ok(!txt.includes(banned), `${rel} 不应包含写操作标记：${banned}`)
    }
  }
  // 字段元数据数量与导出一致。
  assert.equal(SETTING_FIELDS.length, Object.keys(DEFAULT_PROJECT_SETTINGS).length)
  console.log('F 通过：core 口径文件零写（无 run/execute/fs），字段元数据与默认值数量一致。')
} finally {
  await facility.closeAll()
}

console.log('全部口径设置校验通过。')
