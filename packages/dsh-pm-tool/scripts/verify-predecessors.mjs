/**
 * PROD-11 前置依赖（predecessorIds）验证：整体替换/清空、存在·同项目·自指·成环写时拒绝、
 * 删除与级联删除被外部前置引用时拒绝并点名引用方。独立临时目录。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { addProject } from '../lib/core/projects.js'
import {
  addTask, getTask, listTasks, updateTask, deleteTask, deleteTaskCascade,
  TaskReferencedByPredecessorError,
} from '../lib/core/tasks.js'

delete process.env.DEEPSEEK_API_KEY
const root = mkdtempSync(join(tmpdir(), 'pm-tool-predecessors-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
ctx.provide('commands', { register() { return () => {} } })

try {
  await (await import('../lib/index.js')).apply(ctx)
  const domain = facility.get('pmtool')

  const p = await addProject(domain, { name: 'P', startDate: '2026-10-01', targetDate: '2026-12-31' })
  const q = await addProject(domain, { name: 'Q', startDate: '2026-10-01', targetDate: '2026-12-31' })

  const a = await addTask(domain, { projectId: p.id, title: 'A' })
  const b = await addTask(domain, { projectId: p.id, title: 'B' })
  const c = await addTask(domain, { projectId: p.id, title: 'C' })
  const qt = await addTask(domain, { projectId: q.id, title: '跨项目' })

  // 写入读回：B 依赖 A。
  const bUpd = await updateTask(domain, b.id, { predecessorIds: [a.id] })
  assert.deepEqual(bUpd.predecessorIds, [a.id], '前置依赖写入后读回应精确回读')

  // 整体替换为 [A, C]，再清空为缺键。
  const b2 = await updateTask(domain, b.id, { predecessorIds: [a.id, c.id] })
  assert.deepEqual(b2.predecessorIds, [a.id, c.id], '整体替换应覆盖原列表')
  const b3 = await updateTask(domain, b.id, { predecessorIds: [] })
  assert.equal(b3.predecessorIds, undefined, '空数组应归一为缺键（清空前置）')

  // 拒绝：不存在、跨项目、自指。
  for (const bad of [
    { title: 'x', predecessorIds: ['t-9999'] },
    { title: 'x', predecessorIds: [qt.id] },
  ]) {
    let err
    try { await addTask(domain, { projectId: p.id, ...bad }) } catch (e) { err = e }
    assert.ok(err, `应拒绝 ${JSON.stringify(bad.predecessorIds)}`)
  }
  let selfErr
  try { await updateTask(domain, a.id, { predecessorIds: [a.id] }) } catch (e) { selfErr = e }
  assert.ok(selfErr, '自指前置应拒绝')

  // 成环：A 依赖 B，再让 B 依赖 A → 后者拒绝。
  await updateTask(domain, a.id, { predecessorIds: [b.id] })
  let cycleErr
  try { await updateTask(domain, b.id, { predecessorIds: [a.id] }) } catch (e) { cycleErr = e }
  assert.ok(cycleErr, '成环前置应拒绝')

  // 删除保护：A 依赖 B，删 B 应被拒并点名 A；不执行删除。
  let refErr
  try { await deleteTask(domain, b.id) } catch (e) { refErr = e }
  assert.ok(refErr instanceof TaskReferencedByPredecessorError, '删除被前置引用的任务应抛 TaskReferencedByPredecessorError')
  assert.ok(/t-0001|A/.test(refErr.message), '错误应点名引用方任务')
  assert.ok(getTask(domain, b.id), '取消后任务应仍在')
  assert.deepEqual(getTask(domain, a.id).predecessorIds, [b.id], '引用关系应保持不变')

  // 级联删除保护：B 有子任务 D；A 依赖 B。删 B 子树会悬空 → 拒绝。
  const d = await addTask(domain, { projectId: p.id, parentId: b.id, title: 'D' })
  let cascadeErr
  try { await deleteTaskCascade(domain, b.id) } catch (e) { cascadeErr = e }
  assert.ok(cascadeErr instanceof TaskReferencedByPredecessorError, '级联删除被外部前置引用应拒绝')
  assert.ok(getTask(domain, d.id), '被阻止时子任务应仍在')

  // S4：只读读取（listTasks/getTask）前后落盘 hash 与记录数不变（读不触发写）。
  const { collectBackup, precheckBackup } = await import('../lib/core/backup.js')
  const taskDir = join(root, 'pmtool', 'tasks')
  const readTree = () => [...readdirSync(taskDir)].sort().map(f => readFileSync(join(taskDir, f)))
  const beforeRead = readTree().map(b => b.toString())
  listTasks(domain, p.id); getTask(domain, a.id)
  const afterRead = readTree().map(b => b.toString())
  assert.deepEqual(afterRead, beforeRead, '纯读取不得改写落盘记录')

  // S3：precheckBackup 对悬空/成环前置必须拒绝，且全程零写。
  const goodBackup = collectBackup(domain)
  await precheckBackup(goodBackup)  // 合法备份应通过
  const dangling = structuredClone(goodBackup)
  dangling.tasks[0].predecessorIds = ['t-9999']
  let dErr
  try { await precheckBackup(dangling) } catch (e) { dErr = e }
  assert.ok(dErr, '悬空前置的备份必须被 precheck 拒绝')
  const cyclic = structuredClone(goodBackup)
  // 造环：前两条任务互相依赖。
  if (cyclic.tasks.length >= 2) {
    cyclic.tasks[0].predecessorIds = [cyclic.tasks[1].id]
    cyclic.tasks[1].predecessorIds = [cyclic.tasks[0].id]
  }
  let cErr
  try { await precheckBackup(cyclic) } catch (e) { cErr = e }
  assert.ok(cErr, '成环前置的备份必须被 precheck 拒绝')

  // close/reopen：predecessorIds 精确读回（数组原样，非 undefined/被改写）。
  const { openPmDomain } = await import('../lib/core/storage.js')
  await facility.closeAll()
  const reopened = await openPmDomain(ctx)
  assert.deepEqual(getTask(reopened, a.id).predecessorIds, [b.id], '重开后 predecessorIds 必须精确读回 [b.id]')
  await facility.closeAll()

  console.log('通过：前置增改清、存在/跨项目/自指/成环拒绝、删除与级联外部引用保护、读取零写、precheck 悬空/环拒绝、重开精确读回。')
  console.log(`前置依赖校验通过。临时数据保留于：${root}`)
} finally {
  await facility.closeAll()
}

// predecessorIds 误写成字符串（非数组）：重开 clean fail 且坏记录原地不 skip。
{
  const badRoot = mkdtempSync(join(tmpdir(), 'pm-tool-predectype-'))
  mkdirSync(join(badRoot, 'pmtool', 'tasks'), { recursive: true })
  mkdirSync(join(badRoot, 'pmtool', 'projects'), { recursive: true })
  const nowIso = '2026-10-13T08:00:00.000Z'
  writeFileSync(join(badRoot, 'pmtool', 'projects', 'p-0001.json'), JSON.stringify({ version: 2, record: { id: 'p-0001', name: 'p', status: 'active', createdAt: nowIso, updatedAt: nowIso } }))
  writeFileSync(join(badRoot, 'pmtool', 'tasks', 't-0001.json'), JSON.stringify({ version: 2, record: { id: 't-0001', projectId: 'p-0001', parentId: null, title: 'x', description: '', assignee: '', status: 'todo', priority: 'P1', progress: 0, milestoneId: null, code: '1', order: 1, createdAt: nowIso, updatedAt: nowIso, predecessorIds: 't-0002' } }))
  const ctxB = new Context()
  await ctxB.plugin(Storage)
  ctxB.storage.backend.register('json', new JsonStorageBackend(badRoot))
  const fB = new DomainFacility(ctxB, { backend: 'json', routes: {} })
  ctxB.provide('storageDomain', fB)
  ctxB.provide('commands', { register() { return () => {} } })
  const before = readFileSync(join(badRoot, 'pmtool', 'tasks', 't-0001.json'))
  let typeErr
  try { await openPmDomain(ctxB) } catch (e) { typeErr = e }
  assert.ok(typeErr, 'predecessorIds 为字符串（非数组）必须 clean 拒绝')
  const after = readFileSync(join(badRoot, 'pmtool', 'tasks', 't-0001.json'))
  assert.equal(after.toString(), before.toString(), '坏记录原地零写，不得移动/隔离')
  await fB.closeAll()
  console.log('通过：predecessorIds 误写为字符串被重开拒绝，坏记录原地零写不 skip。')
}
