/**
 * T7 v0.7 专项：task / deliverable 可选 repoUrl·branch（冻结矩阵 T7-C1..C10 / X1..X3）。
 *
 * 验收口径：
 *  - 三级（project/task/deliverable）共享 core/repo.ts 正则，task/deliverable 不得各抄一份；
 *  - 合法值落盘原值、重启读回相等；trim 后空白值落盘省略该键（非空串）；
 *  - task 局部更新不误触其它字段；deliverable 只改 repo 不追加 history[]；
 *  - 非法值 clean 拒绝 + 中文文案 + 磁盘零变更；类型错误 zod 级拒绝；strict 不吞未知键；
 *  - 旧记录（v1 task / v0.6.0 deliverable）读回成功、open 后磁盘零改写；
 *  - domain 仍 version=2 / compatibleVersions 含 1；新备份 formatVersion=1；v1 旧备份照常 restore；
 *  - 写路径全程离线：断言不发起任何出站网络。
 *
 * 独立系统临时目录；正式 data/backups/exports 由 verify-isolation.mjs 统一守护。
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec, openPmDomain } from '../lib/core/storage.js'
import { addProject } from '../lib/core/projects.js'
import { addTask, getTask, updateTask } from '../lib/core/tasks.js'
import { addDeliverable, getDeliverable, updateDeliverable } from '../lib/core/deliverables.js'
import { collectBackup, validateBackup, applyBackup } from '../lib/core/backup.js'
import { describeTaskValidation } from '../lib/core/task.js'
import { describeDeliverableValidation } from '../lib/core/deliverable.js'

delete process.env.DEEPSEEK_API_KEY

// C8：信封/备份版本不抬（同 commit 断言）。
assert.equal(pmDomainSpec.version, 2, 'C8：domain version 必须仍为 2')
assert.ok(pmDomainSpec.compatibleVersions?.includes(1), 'C8：compatibleVersions 必须仍含 1')

const here = dirname(fileURLToPath(import.meta.url))
const repoDirOf = (root) => join(root, 'pmtool')
const readRecordFile = (root, table, id) => JSON.parse(readFileSync(join(repoDirOf(root), table, `${id}.json`), 'utf8')).record
const taskBytes = (root, id) => readFileSync(join(repoDirOf(root), 'tasks', `${id}.json`)).toString()
const deliverableBytes = (root, id) => readFileSync(join(repoDirOf(root), 'deliverables', `${id}.json`)).toString()

// ---------- 主隔离库：C1/C2/C3/C4/C5/C6/C9/C10 + C8 备份回归 ----------
const root = mkdtempSync(join(tmpdir(), 'pm-tool-task-repo-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
ctx.provide('commands', { register() { return () => {} } })

try {
  await (await import('../lib/index.js')).apply(ctx)
  const domain = facility.get('pmtool')
  const p = await addProject(domain, { name: 'T7项目', startDate: '2026-10-01', targetDate: '2026-12-31' })

  // C1：合法值写回 + 空值省略落盘。
  const tFull = await addTask(domain, {
    projectId: p.id, title: '全量仓库',
    repoUrl: 'https://github.com/org/r.git', branch: 'main',
  })
  assert.equal(tFull.repoUrl, 'https://github.com/org/r.git', 'C1：task repoUrl 原值落盘')
  assert.equal(tFull.branch, 'main', 'C1：task branch 原值落盘')
  assert.ok(tFull.updatedAt, 'C1：updatedAt 正常推进（ISO 字符串）')

  const tRepoOnly = await addTask(domain, { projectId: p.id, title: '仅URL', repoUrl: 'git@github.com:org/r.git' })
  assert.equal(tRepoOnly.repoUrl, 'git@github.com:org/r.git', 'C1：仅 repoUrl 应落盘')
  assert.equal(tRepoOnly.branch, undefined, 'C1：未传 branch 应为 undefined')

  const tBranchOnly = await addTask(domain, { projectId: p.id, title: '仅分支', branch: 'feature/x-1' })
  assert.equal(tBranchOnly.branch, 'feature/x-1', 'C1：仅 branch 应落盘')
  assert.equal(tBranchOnly.repoUrl, undefined, 'C1：未传 repoUrl 应为 undefined')

  const tBlank = await addTask(domain, { projectId: p.id, title: '全空白', repoUrl: '   ', branch: '  ' })
  assert.equal(tBlank.repoUrl, undefined, 'C1：空白 repoUrl 应归一为 undefined')
  assert.equal(tBlank.branch, undefined, 'C1：空白 branch 应归一为 undefined')
  const blankRecord = readRecordFile(root, 'tasks', tBlank.id)
  assert.ok(!('repoUrl' in blankRecord), 'C1：空白 repoUrl 落盘 JSON 不得含该键（非空串）')
  assert.ok(!('branch' in blankRecord), 'C1：空白 branch 落盘 JSON 不得含该键（非空串）')

  // C2：局部更新 branch main→develop，磁盘 diff 仅 branch/updatedAt。
  const beforeRec = readRecordFile(root, 'tasks', tFull.id)
  await updateTask(domain, tFull.id, { branch: 'develop' })
  const afterRec = readRecordFile(root, 'tasks', tFull.id)
  const changedKeys = Object.keys(afterRec).filter(k => JSON.stringify(beforeRec[k]) !== JSON.stringify(afterRec[k]))
  assert.deepEqual(changedKeys.sort(), ['branch', 'updatedAt'], `C2：局部更新磁盘 diff 仅 branch/updatedAt，实际：${changedKeys}`)
  for (const unchanged of ['projectId', 'parentId', 'title', 'code', 'order', 'assignee', 'progress', 'status', 'repoUrl']) {
    assert.deepEqual(afterRec[unchanged], beforeRec[unchanged], `C2：${unchanged} 不得漂移`)
  }

  // C3：task 非法 repoUrl clean 拒绝 + 中文文案 + 磁盘零变更。
  const tasksDir = join(repoDirOf(root), 'tasks')
  const treeBefore = () => [...readdirSync(tasksDir)].sort().map(f => readFileSync(join(tasksDir, f)).toString())
  const snapBefore = treeBefore()
  for (const bad of ['not a url', '中文仓库']) {
    let err
    try { await addTask(domain, { projectId: p.id, title: '坏仓库', repoUrl: bad }) } catch (e) { err = e }
    assert.ok(err, `C3：非法 repoUrl ${bad} 必须 clean 拒绝`)
    assert.match(describeTaskValidation(err), /仓库地址/, `C3：中文错误文案应映射仓库地址标签：${describeTaskValidation(err)}`)
  }
  assert.deepEqual(treeBefore(), snapBefore, 'C3：非法值拒绝后磁盘零变更（无部分写入）')

  // C4：非法 branch 白名单拒绝；合法值接受。
  for (const bad of ['bad~branch', 'x y', 'x'.repeat(65)]) {
    let err
    try { await addTask(domain, { projectId: p.id, title: '坏分支', branch: bad }) } catch (e) { err = e }
    assert.ok(err, `C4：非法 branch ${JSON.stringify(bad)} 必须拒绝`)
    assert.match(describeTaskValidation(err), /分支名/, `C4：中文错误文案应映射分支名标签`)
  }
  assert.deepEqual(treeBefore(), snapBefore, 'C4：非法 branch 拒绝后磁盘零变更')
  for (const ok of ['main', 'feature/x-1']) {
    const t = await addTask(domain, { projectId: p.id, title: `分支${ok}`, branch: ok })
    assert.equal(t.branch, ok, `C4：合法 branch ${ok} 应接受`)
  }

  // C9：类型错误 zod 级拒绝（非静默 coercion）。
  for (const bad of [{ repoUrl: 123 }, { branch: {} }]) {
    let err
    try { await addTask(domain, { projectId: p.id, title: '类型错', ...bad }) } catch (e) { err = e }
    assert.ok(err, `C9：${JSON.stringify(bad)} 必须 zod 级拒绝`)
    assert.match(describeTaskValidation(err), /仓库地址|分支名/, 'C9：类型错误应映射中文标签')
  }

  // C5：deliverable 合法值写回；仅改 repoUrl 时 history[] 条数与内容不变。
  const d1 = await addDeliverable(domain, {
    projectId: p.id, name: '交付物一',
    repoUrl: 'https://github.com/org/d.git', branch: 'release/1.0',
  })
  assert.equal(d1.repoUrl, 'https://github.com/org/d.git', 'C5：deliverable repoUrl 原值落盘')
  assert.equal(d1.branch, 'release/1.0', 'C5：deliverable branch 原值落盘')
  const historyBefore = structuredClone(d1.history)
  const d1Upd = await updateDeliverable(domain, d1.id, { repoUrl: 'https://github.com/org/d2.git' })
  assert.equal(d1Upd.repoUrl, 'https://github.com/org/d2.git', 'C6：deliverable repoUrl 更新落盘')
  assert.equal(d1Upd.branch, 'release/1.0', 'C6：只改 repoUrl 时 branch 不得漂移')
  assert.equal(d1Upd.history.length, historyBefore.length, 'C5：只改 repoUrl 时 history[] 条数不变')
  assert.deepEqual(d1Upd.history, historyBefore, 'C5：只改 repoUrl 时 history[] 内容不变（ADL-028 红线）')

  // C6：update 无 operator/changeNote 也被判定为业务更新；非法值中文拒绝零写。
  assert.ok(d1Upd, 'C6：仅 update repoUrl（无 operator/changeNote）应被判定业务更新并落盘')
  const dBytesBefore = deliverableBytes(root, d1.id)
  let dBadErr
  try { await updateDeliverable(domain, d1.id, { repoUrl: '不是地址' }) } catch (e) { dBadErr = e }
  assert.ok(dBadErr, 'C6：deliverable 非法 repoUrl 更新必须拒绝')
  assert.match(describeDeliverableValidation(dBadErr), /仓库地址/, 'C6：deliverable 非法值中文拒绝')
  assert.equal(deliverableBytes(root, d1.id), dBytesBefore, 'C6：deliverable 非法值拒绝后磁盘零变更')

  // C8：新备份 formatVersion 仍 1。
  const backup = collectBackup(domain)
  assert.equal(backup.formatVersion, 1, 'C8：新备份 formatVersion 必须仍为 1')

  // C10：写路径全程离线——临时把 fetch 换成探针，任何出站即炸。
  const originalFetch = globalThis.fetch
  let netTouched = false
  globalThis.fetch = () => { netTouched = true; throw new Error('T7-C10：写路径禁止联网探测') }
  try {
    await addTask(domain, { projectId: p.id, title: '离线写', repoUrl: 'https://github.com/org/off.git', branch: 'main' })
    await updateTask(domain, tRepoOnly.id, { branch: 'off' })
    await addDeliverable(domain, { projectId: p.id, name: '离线交付', repoUrl: 'https://github.com/org/offd.git' })
    await updateDeliverable(domain, d1.id, { branch: 'off' })
  } finally {
    globalThis.fetch = originalFetch
  }
  assert.equal(netTouched, false, 'C10：task/deliverable 写路径不得发起任何出站网络')

  // 重启读回：task / deliverable 两字段往返一致。
  await facility.closeAll()
  const reopened = await openPmDomain(ctx)
  const rtTask = getTask(reopened, tFull.id)
  assert.equal(rtTask.repoUrl, 'https://github.com/org/r.git', 'C1/X1：重启后 task repoUrl 读回相等')
  assert.equal(rtTask.branch, 'develop', 'C2/X1：重启后 task branch 读回更新值')
  const rtDeliverable = getDeliverable(reopened, d1.id)
  assert.equal(rtDeliverable.repoUrl, 'https://github.com/org/d2.git', 'C5：重启后 deliverable repoUrl 读回相等')
  assert.equal(rtDeliverable.branch, 'off', 'C5：重启后 deliverable branch 读回更新值')
  assert.deepEqual(rtDeliverable.history, historyBefore, 'C5：重启后 history[] 仍未因 repo 更新追加')

  // C8：v1 旧备份（task 无 repoUrl/branch/predecessorIds、deliverable 无两键）照常 restore 往返。
  const v1Backup = {
    format: 'pm-tool-backup', formatVersion: 1, exportedAt: '2026-01-01T00:00:00.000Z',
    projects: backup.projects,
    tasks: [structuredClone(rtTask)],
    milestones: [], riskIssues: [], meetings: [], reports: [],
    deliverables: [structuredClone(rtDeliverable)],
  }
  delete v1Backup.tasks[0].repoUrl
  delete v1Backup.tasks[0].branch
  delete v1Backup.tasks[0].predecessorIds
  delete v1Backup.deliverables[0].repoUrl
  delete v1Backup.deliverables[0].branch
  validateBackup(v1Backup) // 通过即 v1 信封兼容
  await applyBackup(reopened, v1Backup, join(root, 'backups'))
  const afterRestore = collectBackup(reopened)
  assert.equal(afterRestore.formatVersion, 1, 'C8：restore 后新备份 formatVersion 仍 1')
  const restoredTask = getTask(reopened, tFull.id)
  assert.equal(restoredTask.title, '全量仓库', 'C8：v1 旧备份 restore 后任务记录内容一致')
  assert.equal(restoredTask.repoUrl, undefined, 'C8：v1 旧备份 restore 后缺 repo 键按空语义读回（不补写迁移）')
  assert.equal(restoredTask.branch, undefined, 'C8：v1 旧备份 restore 后缺 branch 键按空语义读回（不补写迁移）')

  await facility.closeAll()
  console.log('通过：C1 合法写回+空值省略 / C2 局部更新零漂移 / C3-C4 非法拒绝中文零写 / C5-C6 deliverable history 不动 / C8 版本不抬+v1备份往返 / C9 类型拒绝 / C10 离线。')
  console.log(`T7 后端主流程通过。临时数据保留于：${root}`)
} finally {
  await facility.closeAll()
}

// ---------- C7：旧记录兼容（v1 task + v0.6.0 deliverable）：读回成功、open 后磁盘零改写 ----------
{
  const oldRoot = mkdtempSync(join(tmpdir(), 'pm-tool-task-repo-old-'))
  mkdirSync(join(oldRoot, 'pmtool', 'tasks'), { recursive: true })
  mkdirSync(join(oldRoot, 'pmtool', 'deliverables'), { recursive: true })
  mkdirSync(join(oldRoot, 'pmtool', 'projects'), { recursive: true })
  const now = '2026-10-13T08:00:00.000Z'
  const v1TaskRecord = {
    id: 't-0001', projectId: 'p-0001', parentId: null, title: 'v1 时代任务',
    description: '', assignee: '', status: 'todo', priority: 'P1',
    progress: 0, milestoneId: null, code: '1', order: 1, createdAt: now, updatedAt: now,
  }
  const v06DeliverableRecord = {
    id: 'dlv-0001', projectId: 'p-0001', name: 'v0.6.0 时代交付物',
    version: 'v0.9', owner: '', status: 'planned', location: '', description: '', dueDate: null,
    history: [{ at: now, field: 'created', from: '', to: 'planned', by: '', note: '创建交付物' }],
    createdAt: now, updatedAt: now,
  }
  const v1ProjectRecord = {
    id: 'p-0001', name: '旧项目', description: '', owner: '', status: 'planning',
    startDate: '2026-10-01', targetDate: '2026-12-31', createdAt: now, updatedAt: now,
  }
  writeFileSync(join(oldRoot, 'pmtool', 'projects', 'p-0001.json'), JSON.stringify({ version: 1, record: v1ProjectRecord }))
  writeFileSync(join(oldRoot, 'pmtool', 'tasks', 't-0001.json'), JSON.stringify({ version: 1, record: v1TaskRecord }))
  writeFileSync(join(oldRoot, 'pmtool', 'deliverables', 'dlv-0001.json'), JSON.stringify({ version: 2, record: v06DeliverableRecord }))
  const beforeTaskBytes = taskBytes(oldRoot, 't-0001')
  const beforeDeliverableBytes = deliverableBytes(oldRoot, 'dlv-0001')
  const beforeProjectBytes = readFileSync(join(oldRoot, 'pmtool', 'projects', 'p-0001.json')).toString()

  const ctxOld = new Context()
  await ctxOld.plugin(Storage)
  ctxOld.storage.backend.register('json', new JsonStorageBackend(oldRoot))
  const fOld = new DomainFacility(ctxOld, { backend: 'json', routes: {} })
  ctxOld.provide('storageDomain', fOld)
  ctxOld.provide('commands', { register() { return () => {} } })
  const oldDomain = await openPmDomain(ctxOld)
  const oldTask = getTask(oldDomain, 't-0001')
  const oldDeliverable = getDeliverable(oldDomain, 'dlv-0001')
  assert.ok(oldTask, 'C7：v1 形状 task（无 repoUrl/branch/predecessorIds）应读回成功')
  assert.equal(oldTask.repoUrl, undefined, 'C7：旧 task 缺两键按空语义处理')
  assert.equal(oldTask.branch, undefined, 'C7：旧 task 缺两键按空语义处理')
  assert.ok(oldDeliverable, 'C7：v0.6.0 形状 deliverable（无 repo 两键）应读回成功')
  assert.equal(oldDeliverable.repoUrl, undefined, 'C7：旧 deliverable 缺两键按空语义处理')
  assert.equal(oldDeliverable.branch, undefined, 'C7：旧 deliverable 缺两键按空语义处理')
  assert.equal(oldDeliverable.history.length, 1, 'C7：旧 deliverable 既有 history 条数零漂移')
  // open 后未触碰记录磁盘零改写（信封不批量迁移）。
  assert.equal(taskBytes(oldRoot, 't-0001'), beforeTaskBytes, 'C7：open 后 v1 task 文件零改写')
  assert.equal(deliverableBytes(oldRoot, 'dlv-0001'), beforeDeliverableBytes, 'C7：open 后旧 deliverable 文件零改写')
  assert.equal(readFileSync(join(oldRoot, 'pmtool', 'projects', 'p-0001.json')).toString(), beforeProjectBytes, 'C7：open 后旧项目信封零改写')
  await fOld.closeAll()
  console.log('通过：C7 v1 task / v0.6.0 deliverable 读回按空语义处理，open 后磁盘零改写。')
}

// ---------- X1/X2/X3：命令层透传、中文报错、strict 不吞未知键 ----------
{
  const cmdRoot = mkdtempSync(join(tmpdir(), 'pm-tool-task-repo-cmd-'))
  const ctxC = new Context()
  await ctxC.plugin(Storage)
  ctxC.storage.backend.register('json', new JsonStorageBackend(cmdRoot))
  const fC = new DomainFacility(ctxC, { backend: 'json', routes: {} })
  ctxC.provide('storageDomain', fC)
  let cmd
  ctxC.provide('commands', { register(def) { cmd = def; return () => {} } })
  await (await import('../lib/index.js')).apply(ctxC)
  const domC = fC.get('pmtool')
  const run = (rawInput) => cmd.handler({ rawInput, attachments: [] })

  await run('project add {"name":"命令库","startDate":"2026-10-01","targetDate":"2026-12-31"}')

  // X1：task add 透传两字段；update 改 branch；list/get 读回值往返一致。
  const addR = await run('task add {"projectId":"p-0001","title":"仓库任务","repoUrl":"https://github.com/org/r.git","branch":"main"}')
  assert.equal(addR.kind, 'success', `X1：task add 带 repoUrl/branch 应成功：${addR.text}`)
  assert.match(addR.text, /仓库：https:\/\/github\.com\/org\/r\.git@main/, 'X1：task get 渲染应展示 repoUrl@branch')
  const updR = await run('task update t-0001 {"branch":"develop"}')
  assert.equal(updR.kind, 'success', `X1：task update branch 应成功：${updR.text}`)
  assert.match(updR.text, /@develop/, 'X1：update 后读回应展示 @develop')
  const viaCore = getTask(domC, 't-0001')
  assert.equal(viaCore.repoUrl, 'https://github.com/org/r.git', 'X1：命令写入后 core 读回 repoUrl 一致')
  assert.equal(viaCore.branch, 'develop', 'X1：命令写入后 core 读回 branch 一致')

  // X1：空值省略落盘。
  await run('task add {"projectId":"p-0001","title":"空仓库","repoUrl":"","branch":""}')
  const blankRec = readRecordFile(cmdRoot, 'tasks', 't-0002')
  assert.ok(!('repoUrl' in blankRec) && !('branch' in blankRec), 'X1：空值落盘省略该键')

  // X2：deliverable 非法 repoUrl → 中文错误、非成功、磁盘零变更。
  const dlBefore = deliverableBytesSafe(cmdRoot, 'dlv-0001')
  const dlBad = await run('deliverable add {"projectId":"p-0001","name":"坏交付","repoUrl":"not a url"}')
  assert.equal(dlBad.kind, 'error', 'X2：deliverable add 非法 repoUrl 必须返回 error')
  assert.match(dlBad.text, /仓库地址/, `X2：错误输出应为中文文案：${dlBad.text}`)
  assert.equal(deliverableBytesSafe(cmdRoot, 'dlv-0001'), dlBefore, 'X2：非法 deliverable 写入磁盘零变更')

  // deliverable 合法往返。
  const dlOk = await run('deliverable add {"projectId":"p-0001","name":"好交付","repoUrl":"https://github.com/org/d.git","branch":"main"}')
  assert.equal(dlOk.kind, 'success', `X2：deliverable add 合法值应成功：${dlOk.text}`)

  // X3：strict 不吞未知键——大小写错 repoURL / 多写 foo。
  for (const badPayload of ['{"repoURL":"https://github.com/org/r.git"}', '{"foo":"bar"}']) {
    const before = taskBytes(cmdRoot, 't-0001')
    const r = await run(`task update t-0001 ${badPayload}`)
    assert.equal(r.kind, 'error', `X3：未知键 ${badPayload} 必须拒绝`)
    assert.match(r.text, /包含不支持的字段/, `X3：未知键应报中文 unrecognized_keys：${r.text}`)
    assert.equal(taskBytes(cmdRoot, 't-0001'), before, `X3：未知键 ${badPayload} 不落盘（磁盘零变更）`)
  }
  await fC.closeAll()
  console.log('通过：X1 命令透传往返+空值省略 / X2 deliverable 非法中文零写 / X3 strict 拒绝未知键。')
  console.log(`T7 命令层通过。临时数据保留于：${cmdRoot}`)
}

function deliverableBytesSafe(root, id) {
  try { return deliverableBytes(root, id) } catch { return null }
}

// ---------- 共享正则防漂移：task/deliverable 源文件必须复用 core/repo.ts，不得各抄一份 ----------
{
  const readSrc = (name) => readFileSync(join(here, '..', 'src', 'core', name), 'utf8')
  for (const name of ['task.ts', 'deliverable.ts']) {
    const src = readSrc(name)
    assert.match(src, /from '\.\/repo\.js'/, `${name} 必须从 core/repo.js 导入共享校验`)
    assert.doesNotMatch(src, /repoUrlPattern\s*=/, `${name} 不得自抄 repoUrlPattern 正则`)
    assert.doesNotMatch(src, /branchPattern\s*=/, `${name} 不得自抄 branchPattern 正则`)
    assert.doesNotMatch(src, /https\?:\\\//, `${name} 不得内嵌 URL/git 正则字面量`)
  }
  console.log('通过：task/deliverable 源文件复用 core/repo.ts，无第二份正则。')
}
