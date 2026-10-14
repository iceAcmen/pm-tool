/**
 * R18 备份/恢复专项：备份含七类实体、恢复后与原数据一致（往返）、restore 缺 confirm 不执行、
 * 恢复前生成安全快照、备份内容不含 checks/密钥字段。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, existsSync, chmodSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { createBackup, readBackupFile, restoreBackup, defaultBackupDirectory, applyBackup, collectBackup, validateBackup, resolveBackupDirectory } from '../lib/core/backup.js'

delete process.env.DEEPSEEK_API_KEY
const ROOT_BASE = mkdtempSync(join(tmpdir(), 'pm-tool-space-'))
const root = join(ROOT_BASE, 'data root with space')
const backupDir = join(ROOT_BASE, 'backup dir with space')
function hashSet(dir) {
  try { return new Set(readdirSync(dir).map(f => f + ':' + createHash('sha256').update(readFileSync(join(dir,f))).digest('hex'))) }
  catch { return new Set() }
}
const before = hashSet(defaultBackupDirectory)

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw) {
  const r = await command.handler({ rawInput: raw, attachments: [] })
  return r
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  // 造七类实体数据
  await run('project add {"name":"备份项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  await run('task add {"projectId":"p-0001","title":"任务一"}')
  await run('milestone add {"projectId":"p-0001","title":"里程碑一","targetDate":"2026-06-01"}')
  await run('risk-issue add {"projectId":"p-0001","type":"risk","title":"风险一","impact":"high","probability":"medium"}')
  await run('meeting add {"projectId":"p-0001","title":"周会","meetingDate":"2026-10-11"}')
  await run('report generate p-0001 2026-10-01 2026-10-31 {"title":"十月进度汇报"}')
  await run('deliverable add {"projectId":"p-0001","name":"交付物一","version":"v1.0","owner":"Ice","status":"in_progress"}')

  // 1) 备份含七类实体
  const b = await createBackup(domain, backupDir)
  assert.ok(existsSync(b.path), '备份文件应写出')
  const parsed = await readBackupFile(b.path)
  assert.equal(parsed.projects.length, 1)
  assert.equal(parsed.tasks.length, 1)
  assert.equal(parsed.milestones.length, 1)
  assert.equal(parsed.riskIssues.length, 1)
  assert.equal(parsed.meetings.length, 1)
  assert.equal(parsed.reports.length, 1)
  assert.equal(parsed.deliverables.length, 1)
  assert.ok(!('checks' in parsed), '备份不得含 checks/自检表')

  // 2) 往库里再加点东西（模拟漂移）
  await run('task add {"projectId":"p-0001","title":"任务二"}')
  assert.equal([...domain.table('tasks').entries()].length, 2)

  // 3) restore 缺 confirm 不执行（演练）
  const drill = await run(`restore "${b.path}"`)
  assert.match(drill.text, /演练/)
  assert.equal([...domain.table('tasks').entries()].length, 2, '缺 confirm 不得恢复')

  // 4) restore confirm：先存安全快照，再用备份替换（任务数回到 1）
  const result = await restoreBackup(domain, b.path, backupDir)
  assert.ok(result.safetySnapshot, '恢复前当前有数据，应生成安全快照')
  assert.ok(existsSync(result.safetySnapshot), '安全快照文件应已写出')
  assert.equal([...domain.table('tasks').entries()].length, 1, '恢复后任务数应回到备份时的 1')
  assert.equal([...domain.table('projects').entries()].length, 1)

  // T-DEF-010 env 覆盖
process.env.DSH_PM_BACKUP_DIR = join(ROOT_BASE, 'env backup dir with space')
const r2 = await restoreBackup(domain, b.path, undefined)
assert.ok(r2.safetySnapshot.startsWith(process.env.DSH_PM_BACKUP_DIR), 'env 生效时安全快照落 env 目录')
delete process.env.DSH_PM_BACKUP_DIR
assert.deepEqual(hashSet(defaultBackupDirectory), before, '默认 packages/backups 在测试前后应不变')

  // ============ 第二批：原子写 + 中途自动回滚 + 内部故障注入 seam（不进用户命令面）============
  const tasksOf = () => [...domain.table('tasks').entries()].map(([, v]) => v)

  // 造富 before 态：p-0001 下 3 个任务
  await run('task add {"projectId":"p-0001","title":"回滚任务二"}')
  await run('task add {"projectId":"p-0001","title":"回滚任务三"}')
  assert.equal(tasksOf().length, 3, '预置 before：3 个任务')
  const targetBackup = await readBackupFile(b.path) // 已知只含 1 个任务

  // T1：原子写不留 .tmp 残留
  const b1 = await createBackup(domain, backupDir)
  assert.equal(readdirSync(backupDir).filter(f => f.startsWith('.') && f.endsWith('.tmp')).length, 0,
    'T1 原子写后不得残留 .tmp 临时文件')
  assert.ok(existsSync(b1.path), 'T1 备份文件已写出')

  // T2：写盘失败（只读目录）不产生目标文件、不残留 tmp
  const roDir = join(ROOT_BASE, 'ro-backup')
  mkdirSync(roDir, { recursive: true, mode: 0o700 })
  let t2err = null
  try {
    chmodSync(roDir, 0o500)
    try { await createBackup(domain, roDir) } catch (e) { t2err = e }
  } finally { chmodSync(roDir, 0o700) }
  assert.ok(t2err, 'T2 只读目录下备份应失败')
  assert.equal(readdirSync(roDir).filter(f => f.endsWith('.tmp')).length, 0, 'T2 失败不得残留 tmp')

  // 一次性故障 hook：第 failAt 次写抛错一次后即自废（后续不再抛）
  const oneShotHook = (failAt) => {
    let count = 0
    return { onWrite() { if (count++ === failAt) throw new Error('injected write') } }
  }

  // T3：前向中途失败 → 自动回滚到 before
  // 写序：projects 删1+写1=2；tasks 删3 在 #2/#3/#4。#3 必落在 tasks 删除中途。
  const beforeSnap = collectBackup(domain)
  const titlesBefore = beforeSnap.tasks.map(t => t.title).sort()
  let t3err = null
  try { await applyBackup(domain, targetBackup, backupDir, oneShotHook(3)) } catch (e) { t3err = e }
  assert.ok(t3err, 'T3 注入失败应抛错')
  assert.match(String(t3err.message), /已自动回滚/, 'T3 应提示已自动回滚')
  assert.equal(tasksOf().length, 3, 'T3 回滚后任务数应恢复 before=3')
  assert.deepEqual(tasksOf().map(t => t.title).sort(), titlesBefore, 'T3 回滚后任务内容应与 before 一致')

  // T6：持续故障（每次写都抛）→ 回滚也失败 → AggregateError
  const alwaysFail = { onWrite() { throw new Error('injected persistent') } }
  let t6err = null
  try { await applyBackup(domain, targetBackup, backupDir, alwaysFail) } catch (e) { t6err = e }
  assert.ok(t6err, 'T6 持续故障应抛错')
  assert.match(String(t6err.message), /自动回滚失败/, 'T6 应提示回滚也失败')
  assert.ok(t6err.cause instanceof AggregateError, 'T6 双重失败应聚合为 AggregateError')
  assert.match(String(t6err.message), /pmtool-backup-[^]*\.json/, 'T6 应在消息中给出安全快照路径')
  // 收敛到已知态
  await restoreBackup(domain, b.path, backupDir)

  // T4：precheck 失败（悬空 projectId）零触碰
  const badBackup = structuredClone(targetBackup)
  badBackup.tasks[0].projectId = 'p-NOPE'
  const midCount = tasksOf().length
  let t4err = null
  try { await applyBackup(domain, badBackup, backupDir) } catch (e) { t4err = e }
  assert.ok(t4err, 'T4 悬空 projectId 应被预检拒绝')
  assert.equal(tasksOf().length, midCount, 'T4 precheck 失败不得触碰数据')

  // T5：安全快照写失败（只读目录）→ 破坏性写不开始
  let t5err = null
  try {
    chmodSync(roDir, 0o500)
    try { await applyBackup(domain, targetBackup, roDir) } catch (e) { t5err = e }
  } finally { chmodSync(roDir, 0o700) }
  assert.ok(t5err, 'T5 安全快照写盘应失败')
  assert.equal(tasksOf().length, midCount, 'T5 安全快照失败不得进入破坏性写')

  // T7：空备份恢复；空库恢复时不生成安全快照
  const emptyBackup = {
    format: 'pm-tool-backup', formatVersion: 1, exportedAt: new Date().toISOString(),
    projects: [], tasks: [], milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [],
  }
  const r7a = await applyBackup(domain, emptyBackup, backupDir)
  assert.ok(r7a.safetySnapshot, 'T7a 恢复前有数据，应生成安全快照')
  assert.equal(tasksOf().length, 0, 'T7a 空备份后任务应为空')
  const r7b = await applyBackup(domain, targetBackup, backupDir)
  assert.equal(r7b.safetySnapshot, undefined, 'T7b 当前库为空，不应生成安全快照')

  // T8：v1 旧备份（缺新可选字段 predecessorIds）正常往返；未知 extra 字段被 strict schema 拒绝
  const oldTask = structuredClone(targetBackup.tasks[0])
  delete oldTask.predecessorIds // v1 旧记录无此键
  const v1old = {
    format: 'pm-tool-backup', formatVersion: 1, exportedAt: '2026-01-01T00:00:00.000Z',
    projects: targetBackup.projects, tasks: [oldTask],
    milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [],
  }
  validateBackup(v1old) // 通过即 v1 格式兼容
  await applyBackup(domain, v1old, backupDir)
  const after8 = collectBackup(domain)
  assert.equal(after8.tasks.length, 1, 'T8 v1 旧备份应往返')
  assert.equal(after8.tasks[0].title, oldTask.title, 'T8 v1 旧备份内容应一致')
  const withExtra = structuredClone(v1old)
  withExtra.tasks[0].futureField = 'v2-new-field'
  let t8err = null
  try { await applyBackup(domain, withExtra, backupDir) } catch (e) { t8err = e }
  assert.ok(t8err, 'T8 未知新字段应被 strict schema 拒绝（不得静默写入）')

  // T9：备份目录优先级——显式 directory 参数 > DSH_PM_BACKUP_DIR env > 内置 packages/backups（纯函数直测）。
  // 上一段 T-DEF-010 已 delete env，此处从干净 env 态起测。
  delete process.env.DSH_PM_BACKUP_DIR
  const builtinDir = resolveBackupDirectory()
  assert.ok(builtinDir.replace(/\/+$/, '').endsWith('/packages/backups'), `无 env 无 override 应回退内置 packages/backups（实得 ${builtinDir}）`)
  process.env.DSH_PM_BACKUP_DIR = join(ROOT_BASE, 'env wins')
  assert.equal(resolveBackupDirectory(), process.env.DSH_PM_BACKUP_DIR, 'env 设置时默认目录取 env')
  const explicitDir = join(ROOT_BASE, 'explicit wins')
  assert.equal(resolveBackupDirectory(explicitDir), explicitDir, '显式 directory 参数必须优先于 env')
  process.env.DSH_PM_BACKUP_DIR = '   '  // 纯空白视为未设置
  assert.ok(resolveBackupDirectory().replace(/\/+$/, '').endsWith('/packages/backups'), '空白 env 应回退内置默认目录')
  delete process.env.DSH_PM_BACKUP_DIR

  // ============ 第三批：恢复临界区并入全局单写者队列（并发安全）============
  // before 预置为 3 个任务；targetBackup 仍只含 1 个任务「任务一」。
  await run('task add {"projectId":"p-0001","title":"队列任务二"}')
  await run('task add {"projectId":"p-0001","title":"队列任务三"}')
  assert.equal(tasksOf().length, 3, 'T10 预置 before=3')

  // T10：恢复进行中触发普通写——必须排队等待临界区释放，且恢复完成后不得被 replaceAll 抹掉。
  let t10settledMid = false
  let t10queued = null
  let t10gateFired = false
  const t10hook = {
    async onWrite() {
      if (t10gateFired) return
      t10gateFired = true
      // 恢复第 1 次持久化写（projects 删 p-0001）时触发普通写
      t10queued = run('task add {"projectId":"p-0001","title":"并发任务-X"}')
        .then(() => { t10settledMid = true })
      await new Promise(r => setTimeout(r, 50))
      // 临界区仍持有全局写队列：普通写此刻必须尚未执行（否则即与恢复交错）
      assert.equal(t10settledMid, false, 'T10 恢复进行中触发的普通写必须排队，不得与恢复临界区交错执行')
    },
  }
  await applyBackup(domain, targetBackup, backupDir, t10hook)
  await t10queued
  assert.deepEqual(
    new Set(tasksOf().map(t => t.title)),
    new Set(['任务一', '并发任务-X']),
    'T10 最终 = 备份 1 + 排队写 1；排队的普通写不得被恢复 replaceAll 抹掉',
  )

  // 收敛回 before=3（任务一+队列任务二+队列任务三），再测故障回滚路径
  await restoreBackup(domain, b.path, backupDir)
  await run('task add {"projectId":"p-0001","title":"队列任务二"}')
  await run('task add {"projectId":"p-0001","title":"队列任务三"}')
  assert.equal(tasksOf().length, 3, 'T11 预置 before=3')

  // T11：故障 hook 下回滚语义——恢复中途失败自动回滚到 before，排队的普通写随后落库且不被回滚抹掉。
  let t11settledMid = false
  let t11queued = null
  let t11writes = 0
  let t11fired = false
  const t11hook = {
    async onWrite() {
      t11writes++
      if (!t11fired) {
        t11fired = true
        t11queued = run('task add {"projectId":"p-0001","title":"并发任务-Y"}')
          .then(() => { t11settledMid = true })
        await new Promise(r => setTimeout(r, 50))
        assert.equal(t11settledMid, false, 'T11 恢复进行中触发的普通写同样必须排队')
        return
      }
      // 第 3 次写（tasks 第一次 delete）注入失败 → 走自动回滚；回滚阶段的写不再注入。
      if (t11writes === 3) throw new Error('T11 injected mid-apply failure')
    },
  }
  let t11err = null
  try { await applyBackup(domain, targetBackup, backupDir, t11hook) } catch (e) { t11err = e }
  assert.ok(t11err, 'T11 注入失败应抛错')
  assert.match(String(t11err.message), /已自动回滚/, 'T11 中途失败应自动回滚')
  await t11queued
  assert.deepEqual(
    new Set(tasksOf().map(t => t.title)),
    new Set(['任务一', '并发任务-Y', '队列任务二', '队列任务三']),
    'T11 回滚恢复 before=3，排队的普通写随后落库且不被回滚 replaceAll 抹掉',
  )

console.log('verify-backup 全部通过（隔离目录+默认backups未变+原子写+中途回滚T1-T9+恢复入队并发安全T10-T11）。')
} finally {
  await facility.closeAll()
}
