// 独立领域断言；生产 schema、JSON 存储、真实动作。没有产品替身或改时钟。
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { syncBuiltinESMExports } from 'node:module'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec } from './lib/core/storage.js'
import { addProject, enqueueDomainWrite } from './lib/core/projects.js'
import { addTask, getTask, updateTask, listTasks, moveTask, deleteTask, renumberTasks } from './lib/core/tasks.js'
import { taskRecordSchema, taskChecklistSchema, checklistItemSchema, taskUpdateSchema } from './lib/core/task.js'
import { addTaskChecklistItem as addItem, setTaskChecklistItemDone as setDone,
  renameTaskChecklistItem as renameItem, removeTaskChecklistItem as removeItem } from './lib/core/task-checklist.js'
import { handleTaskCommand } from './lib/commands/task.js'
import { handleDoctorCommand } from './lib/commands/doctor.js'
import { deriveProgressMap as derive, deriveTaskProgress, deriveProjectProgress as projectProgress,
  resolveTaskProgressMeta as meta, progressHeadline, formatProgressValue, checklistFraction } from './lib/core/progress-derivation.js'
import { runDoctor } from './lib/core/doctor.js'
import { progressFill } from './lib/core/gantt.js'
import { generateProgressReport as generate, previewProgressReport, getProgressReport } from './lib/core/progress-reports.js'
import { snapshotCalcVersion } from './lib/core/progress-report.js'
import { diffAgainstPrevious } from './lib/core/report-diff.js'
import { collectStats } from './lib/core/stats.js'
import { buildQueueForProject } from './lib/core/queue.js'
import { ensureReflectionOnDone } from './lib/core/reflect.js'
import { createBackup, collectBackup, readBackupFile, restoreBackup, applyBackup, precheckBackup,
  exportBackupJson, restoreBackupFromContent } from './lib/core/backup.js'
import { collectProjectReport, renderProjectMarkdown } from './lib/core/report.js'
import { flattenVisible } from './lib/core/task-tree.js'
import { tallyTasksByStatus, tallyOpen, tallyTotal, donePercent } from './lib/client/views/tasks-tally.js'
import { collectChecks } from './lib/core/check.js'
import { localTodayIso, addDaysIso } from './lib/core/derived.js'

const own = process.env.QA_OWN
const pkg = process.env.QA_PACKAGE
const rows = []
const actions = []
const facilities = []
let serial = 0
const save = (name, value) => fs.writeFileSync(path.join(own, name), JSON.stringify(value, null, 2) + '\n')
const hash = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
function manifest(dir) {
  if (!fs.existsSync(dir)) return {}
  return Object.fromEntries(fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const f = path.join(dir, e.name)
    return e.isDirectory() ? Object.entries(manifest(f)) :
      e.isFile() ? [[f, { sha256: hash(f), mtimeMs: fs.statSync(f).mtimeMs }]] : []
  }))
}
async function check(id, name, fn) {
  const start = new Date().toISOString()
  const offset = actions.length
  try {
    const observed = await fn()
    rows.push({ id, name, status: 'PASS', start, end: new Date().toISOString(),
      actionStart: offset, actionEnd: actions.length, observed })
    console.log(`PASS ${id}: ${name}`)
  } catch (e) {
    rows.push({ id, name, status: 'FAIL', start, end: new Date().toISOString(),
      actionStart: offset, actionEnd: actions.length, error: e.stack, actual: e.actual, expected: e.expected })
    console.error(`FAIL ${id}: ${name}\n${e.stack}`)
  }
}
async function open(name, existingRoot) {
  const root = existingRoot ?? path.join(own, 'domain', `${++serial}-${name}`)
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  const domain = await facility.open(pmDomainSpec)
  facilities.push(facility)
  return { domain, root, facility }
}
const entries = (d, name) => [...d.table(name).entries()].map(([, v]) => v)
async function command(domain, input, want = 'success') {
  const result = await handleTaskCommand(input, domain)
  actions.push({ input: '/pm task ' + input, result })
  assert.equal(result.kind, want, result.text)
  return result
}
async function project(d, name = 'QA-OP') {
  const record = await addProject(d, { name, startDate: '2026-01-01', targetDate: '2026-12-31' })
  actions.push({ action: 'addProject', input: name, result: record })
  return record.id
}
async function task(d, pid, alias, extra = {}) {
  const input = { projectId: pid, title: alias, ...extra }
  const record = await addTask(d, input)
  actions.push({ action: 'addTask', input, result: record })
  return record.id
}
async function checklist(d, id, n, checked) {
  for (let i = 0; i < n; i++) {
    await command(d, `checklist add ${id} 验收项${i + 1}`)
    if (i < checked) await command(d, `checklist toggle ${id} ${getTask(d, id).checklist.at(-1).id} true`)
  }
}
async function small(name, fractions = []) {
  const s = await open(name)
  s.pid = await project(s.domain, name)
  s.parent = await task(s.domain, s.pid, 'P', { progress: 100 })
  s.leaves = []
  for (const [n, done, extra = {}] of fractions) {
    const id = await task(s.domain, s.pid, 'L' + s.leaves.length, { parentId: s.parent, ...extra })
    if (n) await checklist(s.domain, id, n, done)
    s.leaves.push(id)
  }
  return s
}
function value(d, id) { return derive(entries(d, 'tasks')).get(id) }
function stable(task) { const { updatedAt, ...rest } = task; return rest }
async function barrier(d) { await enqueueDomainWrite(d, () => Promise.resolve()) }
async function zeroWrite(root, fn) {
  const before = manifest(root)
  const result = await fn()
  const after = manifest(root)
  assert.deepEqual(after, before)
  return { result, before, after }
}
const clone = structuredClone
const cl = (n, k) => Array.from({ length: n }, (_, i) => ({ id: 'item-' + i, text: '项' + i, done: i < k }))

try {
  if (process.argv[2] === 'reopen') {
    const fixture = JSON.parse(fs.readFileSync(path.join(own, 'f2.json'), 'utf8'))
    const s = await open('reopen', fixture.root)
    await check('OP-BD-01/AUTO-new-process', '新 Node 进程重开真实 domain（非宿主 PID 重启）', async () => {
      assert.notEqual(process.pid, fixture.pid)
      assert.deepEqual(entries(s.domain, 'tasks'), fixture.tasks)
      assert.deepEqual([...derive(entries(s.domain, 'tasks'))], fixture.derived)
      return { oldPid: fixture.pid, newPid: process.pid, root: fixture.root,
        tasks: entries(s.domain, 'tasks'), derived: [...derive(entries(s.domain, 'tasks'))] }
    })
  } else {
    const f = await open('F2')
    const d = f.domain
    const pid = await project(d)
    const ids = { project: pid }
    ids.P = await task(d, pid, 'F2-P', { progress: 100 })
    ids.M = await task(d, pid, 'F2-M', { parentId: ids.P })
    ids.L1 = await task(d, pid, 'F2-L1', { parentId: ids.M, progress: 40,
      startDate: localTodayIso(), dueDate: addDaysIso(localTodayIso(), 2) })
    await checklist(d, ids.L1, 2, 1)
    ids.L2 = await task(d, pid, 'F2-L2', { parentId: ids.M })
    await checklist(d, ids.L2, 4, 3)
    ids.L3 = await task(d, pid, 'F2-L3', { parentId: ids.P, progress: 40 })
    ids.L4 = await task(d, pid, 'F2-L4')
    await checklist(d, ids.L4, 4, 4)
    ids.L5 = await task(d, pid, 'F2-L5', { status: 'done' })
    await checklist(d, ids.L5, 5, 2)
    ids.L6 = await task(d, pid, 'F2-L6', { status: 'done', progress: 80 })
    ids.L7 = await task(d, pid, 'F2-L7')
    ids.L8 = await task(d, pid, 'F2-L8', { status: 'wrapped', dueDate: addDaysIso(localTodayIso(), -1) })
    await checklist(d, ids.L8, 1, 1)
    // 空数组是合法旧形态：通过标准备份预检/恢复，不写 raw JSON 入存储。
    const seed = collectBackup(d)
    seed.tasks.find(t => t.id === ids.L7).checklist = []
    await precheckBackup(seed)
    await applyBackup(d, seed, path.join(own, 'f2-safety'))
    const tasks = entries(d, 'tasks')
    for (const t of tasks) taskRecordSchema.parse(t)
    const expected = { parent: 63, parentCoverage: { coveredLeaves: 2, totalLeaves: 3 },
      project: 66, projectCoverage: { coveredLeaves: 4, totalLeaves: 7 },
      pending: 1, totalTasks: 10, done: 2, todo: 7, wrapped: 1, open: 7 }
    const b = await createBackup(d, path.join(own, 'f2-package'))
    const backup = await readBackupFile(b.path)
    await precheckBackup(backup)
    fs.copyFileSync(b.path, path.join(own, 'f2-backup.json'))
    fs.cpSync(b.path + '.files.' + backup.fileBundleId,
      path.join(own, 'f2-backup.json.files.' + backup.fileBundleId), { recursive: true })
    save('f2.json', { root: f.root, pid: process.pid, today: localTodayIso(), ids, tasks,
      derived: [...derive(tasks)], project: projectProgress(tasks, pid), expected, originalBackup: b.path })
    save('f2-commands.json', actions)

    await check('F2/AUTO-validity', '生产 schema 与标准恢复合法 F2', () => {
      assert.equal(tasks.length, 10)
      assert.equal(value(d, ids.P).value, 63)
      assert.deepEqual(value(d, ids.P).coverage, expected.parentCoverage)
      assert.equal(projectProgress(tasks, pid).value, 66)
      assert.deepEqual(projectProgress(tasks, pid).coverage, expected.projectCoverage)
      assert.equal(projectProgress(tasks, pid).pendingAcceptanceCount, 1)
      return { ids, expected, actual: projectProgress(tasks, pid), backupSha256: hash(path.join(own, 'f2-backup.json')) }
    })
    await check('OP-CK-01', 'item 三键、重复/空白/非布尔拒绝，旧记录与 ADL055 字段兼容', () => {
      const old = clone(tasks.find(t => t.id === ids.L3))
      assert.equal(Object.hasOwn(taskRecordSchema.parse(old), 'checklist'), false)
      for (const t of tasks) for (const item of t.checklist ?? []) assert.deepEqual(Object.keys(item).sort(), ['done', 'id', 'text'])
      for (const extra of ['doneAt', 'weight', 'title', 'progressMode']) assert.equal(checklistItemSchema.safeParse({ ...cl(1, 0)[0], [extra]: 1 }).success, false)
      assert.equal(taskChecklistSchema.safeParse([cl(1, 0)[0], cl(1, 0)[0]]).success, false)
      assert.equal(checklistItemSchema.safeParse({ id: 'x', text: ' ', done: false }).success, false)
      assert.equal(checklistItemSchema.safeParse({ id: 'x', text: 'x', done: 'true' }).success, false)
      taskRecordSchema.parse({ ...old, effortHours: 3.5, evidenceUrl: 'https://example.com/qa',
        manualProgress: 30, manualProgressNote: '来源', attachments: [], progressLog: [] })
      return { old, checklist: getTask(d, ids.L1).checklist }
    })
    await check('OP-CK-02', '内部节点 add 拒绝、中文、磁盘零写', () => zeroWrite(f.root, async () => {
      const r = await command(d, `checklist add ${ids.P} 不应挂清单`, 'error')
      assert.match(r.text, /有子任务的任务不挂清单/)
      assert.equal(getTask(d, ids.P).checklist, undefined)
      return r
    }))
    await check('OP-CK-03', '有非空清单 leaf 拒绝 add 子与 move，原父子/清单不变', () => zeroWrite(f.root, async () => {
      await assert.rejects(() => addTask(d, { projectId: pid, parentId: ids.L1, title: '拒绝子' }), /清空.*清单/)
      await assert.rejects(() => moveTask(d, ids.L3, ids.L1), /清空.*清单/)
      return { L1: getTask(d, ids.L1), L3: getTask(d, ids.L3) }
    }))
    const c = await small('checklist-command')
    const cd = c.domain
    const leaf = await task(cd, c.pid, '独立清单leaf', { progress: 40 })
    await check('OP-CK-04', '真实 add/rename/remove 单项，整数组 update 拒绝', async () => {
      await checklist(cd, leaf, 2, 0)
      const before = getTask(cd, leaf)
      const [one, two] = before.checklist
      await command(cd, `checklist rename ${leaf} ${one.id} 新文本`)
      assert.deepEqual(getTask(cd, leaf).checklist, [{ ...one, text: '新文本' }, two])
      await command(cd, `checklist remove ${leaf} ${one.id}`)
      assert.deepEqual(getTask(cd, leaf).checklist, [two])
      await command(cd, `update ${leaf} ${JSON.stringify({ checklist: [] })}`, 'error')
      assert.equal(taskUpdateSchema.safeParse({ checklist: [] }).success, false)
      return { before, after: getTask(cd, leaf) }
    })
    await check('OP-CK-05', 'expected=true 重试零写；false 显式目标合法，非法目标拒绝', async () => {
      const item = getTask(cd, leaf).checklist[0].id
      await command(cd, `checklist toggle ${leaf} ${item} true`)
      const retry = await zeroWrite(c.root, () => command(cd, `checklist toggle ${leaf} ${item} true`))
      assert.equal(getTask(cd, leaf).checklist[0].done, true)
      await command(cd, `checklist toggle ${leaf} ${item} false`)
      assert.equal(getTask(cd, leaf).checklist[0].done, false)
      const invalid = await zeroWrite(c.root, () => command(cd, `checklist toggle ${leaf} ${item} 1`, 'error'))
      return { retry, invalid }
    })
    await check('OP-CK-06', '单项落盘/新 domain 读回，不附带改兄弟/status/legacy', async () => {
      await command(cd, `checklist add ${leaf} 兄弟项`)
      const before = getTask(cd, leaf)
      await command(cd, `checklist toggle ${leaf} ${before.checklist[0].id} true`)
      const after = getTask(cd, leaf)
      assert.deepEqual(after.checklist[1], before.checklist[1])
      assert.equal(after.status, before.status)
      assert.equal(after.progress, before.progress)
      const reopened = await open('readback', c.root)
      assert.deepEqual(getTask(reopened.domain, leaf), after)
      return { before, after, disk: manifest(c.root) }
    })
    for (const [id, legacy] of [['OP-LEG-01', 40], ['OP-LEG-02', 80]]) {
      await check(id + '/AUTO', '无清单客观 null，legacy 原值仅旁注', () => {
        const input = { ...getTask(d, ids.L3), progress: legacy, status: 'in_progress' }
        const out = derive([input]).get(input.id)
        assert.equal(out.value, null)
        assert.equal(out.legacyProgress, legacy)
        assert.equal(meta(input, out).display, null)
        return out
      })
    }
    await check('OP-LEG-03', '清单50+legacy40父汇总50 coverage1/2', async () => {
      const s = await small('legacy-rollup', [[2, 1], [0, 0, { progress: 40 }]])
      const out = value(s.domain, s.parent)
      assert.equal(out.value, 50); assert.deepEqual(out.coverage, { coveredLeaves: 1, totalLeaves: 2 })
      return out
    })
    await check('OP-LEG-04/AUTO', '旧合法包恢复后只读开闭 domain/列表/derive 零写', async () => {
      const s = await open('legacy-read')
      const legacy = clone(backup)
      delete legacy.fileBundleId
      legacy.tasks = legacy.tasks.map(t => {
        const copy = clone(t)
        for (const k of ['checklist', 'manualProgress', 'manualProgressNote', 'effortHours', 'evidenceUrl', 'attachments', 'progressLog']) delete copy[k]
        return copy
      })
      await precheckBackup(legacy)
      await applyBackup(s.domain, legacy, path.join(own, 'legacy-safety'))
      return zeroWrite(s.root, async () => {
        const reopened = await open('legacy-newdomain', s.root)
        const read = listTasks(reopened.domain, pid)
        derive(read); runDoctor(reopened.domain)
        await reopened.facility.closeAll()
        assert.ok(read.every(t => !Object.hasOwn(t, 'checklist')))
        return read
      })
    })
    await check('OP-DV-01', '真实四项逐勾1/2/3/4：25/50/75/100，重复派生确定', async () => {
      const s = await small('quarters', [[4, 0]])
      const id = s.leaves[0], observed = []
      for (const [i, expected] of [25, 50, 75, 100].entries()) {
        await command(s.domain, `checklist toggle ${id} ${getTask(s.domain, id).checklist[i].id} true`)
        const out = value(s.domain, id); observed.push(out)
        assert.equal(out.value, expected); assert.deepEqual(out, value(s.domain, id))
      }
      return observed
    })
    await check('OP-DV-02/AUTO', 'F2全勾todo=100 pending，不自动验收', () => {
      const out = value(d, ids.L4)
      assert.equal(out.value, 100); assert.equal(out.pendingAcceptance, true)
      assert.equal(getTask(d, ids.L4).status, 'todo'); return out
    })
    await check('OP-DV-03', 'F2 done 2/5=40，软告警不补勾', () => {
      const out = value(d, ids.L5)
      assert.equal(out.value, 40); assert.ok(out.warnings.some(w => w.includes('2/5')))
      assert.equal(getTask(d, ids.L5).checklist.filter(i => i.done).length, 2); return out
    })
    await check('OP-DV-04', 'done无清单仍null', () => {
      assert.equal(value(d, ids.L6).value, null); return value(d, ids.L6)
    })
    await check('OP-DV-05/AUTO', '3/5与coverage1/1两个维度', () => {
      const input = { ...getTask(d, ids.L5), checklist: cl(5, 3) }
      const out = derive([input]).get(input.id)
      assert.deepEqual(out.checklist, { checked: 3, total: 5 })
      assert.deepEqual(out.coverage, { coveredLeaves: 1, totalLeaves: 1 })
      assert.equal(checklistFraction(out), '3/5'); return out
    })
    await check('OP-DV-06/AUTO', '合法空数组与缺键都null，不是0', () => {
      assert.equal(value(d, ids.L7).value, null)
      const input = clone(getTask(d, ids.L7)); delete input.checklist
      assert.equal(derive([input]).get(input.id).value, null)
      return { empty: value(d, ids.L7), absent: derive([input]).get(input.id) }
    })
    await check('OP-DV-07', '真实status变动不凭空改清单', async () => {
      const s = await small('status', [[4, 1]])
      const before = getTask(s.domain, s.leaves[0])
      await command(s.domain, `update ${before.id} {"status":"in_progress"}`)
      const after = getTask(s.domain, before.id)
      assert.deepEqual(after.checklist, before.checklist); assert.equal(value(s.domain, before.id).value, 25)
      return { before, after }
    })
    for (const [id, fractions, expectedValue, coverage, headline] of [
      ['OP-RU-01', [[2, 1], [4, 3]], 63, [2, 2], '整体完成率'],
      ['OP-RU-02', [[2, 1], [0, 0, { progress: 30 }], [0, 0]], 50, [1, 3], '已覆盖任务清单完成度'],
      ['OP-RU-04/AUTO', [[1, 0], [1, 1]], 50, [2, 2], '整体完成率'],
      ['OP-RU-05', [[0, 0, { progress: 80 }], [0, 0]], null, [0, 2], '尚未建立客观进度'],
    ]) await check(id, '等权叶子父汇总/coverage/命名', async () => {
      const s = await small(id.replaceAll('/', '-'), fractions), out = value(s.domain, s.parent)
      assert.equal(out.value, expectedValue)
      assert.deepEqual(out.coverage, { coveredLeaves: coverage[0], totalLeaves: coverage[1] })
      assert.equal(progressHeadline(out), headline); return out
    })
    await check('OP-RU-03/AUTO', '覆盖不足 helper 诚实命名（非GUI）', async () => {
      const s = await small('label', [[2, 1], [0, 0], [0, 0]])
      const out = value(s.domain, s.parent)
      assert.equal(progressHeadline(out), '已覆盖任务清单完成度'); return out
    })
    await check('OP-RU-06', 'F2中间层不重复leaf', () => {
      assert.equal(value(d, ids.M).value, 63)
      assert.deepEqual(value(d, ids.M).coverage, { coveredLeaves: 2, totalLeaves: 2 })
      assert.deepEqual(value(d, ids.P).coverage, { coveredLeaves: 2, totalLeaves: 3 })
      return { P: value(d, ids.P), M: value(d, ids.M) }
    })
    await check('OP-RU-07', '真实move/delete后新旧父重算，rename/order不改变百分比', async () => {
      const s = await small('move', [[2, 1], [4, 3]])
      const p2 = await task(s.domain, s.pid, '新父')
      await moveTask(s.domain, s.leaves[0], p2)
      assert.equal(value(s.domain, s.parent).value, 75); assert.equal(value(s.domain, p2).value, 50)
      await updateTask(s.domain, s.leaves[0], { title: '改名' })
      assert.equal(value(s.domain, p2).value, 50)
      const derivedBeforeOrder = [...derive(entries(s.domain, 'tasks'))]
      await renumberTasks(s.domain, s.pid)
      assert.deepEqual([...derive(entries(s.domain, 'tasks'))], derivedBeforeOrder)
      await deleteTask(s.domain, s.leaves[1])
      assert.equal(value(s.domain, s.parent).value, null)
      return entries(s.domain, 'tasks')
    })
    await check('OP-EX-01', '100/1000/10000深树：Map全量/确定；属性读取计数与后序源码', () => {
      const template = getTask(d, ids.L3), counts = []
      for (const n of [100, 1000, 10000]) {
        let reads = 0
        const tree = Array.from({ length: n }, (_, i) => new Proxy(taskRecordSchema.parse({
          ...template, id: 'deep-' + i, parentId: i ? 'deep-' + (i - 1) : null,
          code: String(i + 1), checklist: i === n - 1 ? cl(4, 3) : undefined,
        }), { get(target, key) { reads++; return Reflect.get(target, key) } }))
        const m = derive(tree)
        assert.equal(m.size, n); assert.equal(m.get('deep-0').value, 75)
        const firstReads = reads
        assert.deepEqual([...m], [...derive(tree)])
        assert.ok(firstReads < 40 * n, `读取计数 ${firstReads}/${n}`)
        counts.push({ n, reads: firstReads, root: m.get('deep-0') })
      }
      const source = fs.readFileSync(path.join(pkg, 'src/core/progress-derivation.ts'), 'utf8')
      assert.ok(source.includes('while (stack.length > 0)'))
      assert.ok(source.includes('frame.idx++'))
      assert.ok(source.includes('fold(stack[stack.length - 1].agg, parentAgg)'))
      return { counts, sourceSha256: hash(path.join(pkg, 'src/core/progress-derivation.ts')),
        boundary: '计数 + 显式后序/Map索引源码，无以单次耗时证明复杂度' }
    })
    const pure = (id, extra = {}) => ({ ...getTask(d, ids.L3), id, parentId: null, ...extra })
    await check('OP-EX-02', '仅纯函数A/B环不挂死，合法leaf保留', () => {
      const out = derive([pure('A', { parentId: 'B' }), pure('B', { parentId: 'A' }), pure('good', { checklist: cl(2, 1) })])
      for (const id of ['A', 'B']) { assert.ok(out.get(id).warnings.some(w => w.includes('环'))); assert.equal(out.get(id).value, null) }
      assert.equal(out.get('good').value, 50); return [...out]
    })
    await check('OP-EX-03', '仅纯函数缺ID/悬空父降级，合法leaf不吞', () => {
      const out = derive([pure('good', { checklist: cl(2, 1) }), pure(undefined), pure('orphan', { parentId: 'missing' })])
      assert.equal(out.size, 2); assert.equal(out.get('good').value, 50)
      assert.ok(out.get('good').warnings.some(w => w.includes('id')))
      assert.ok(out.get('orphan').warnings.some(w => w.includes('missing'))); return [...out]
    })
    await check('OP-EX-04', '仅纯函数跨项目父不混算；真实跨项目move拒绝', async () => {
      const tree = [pure('Q', { projectId: 'Q', checklist: cl(1, 1) }), pure('P', { projectId: 'P', parentId: 'Q' })]
      assert.equal(projectProgress(tree, 'P').value, null)
      assert.ok(derive(tree).get('P').warnings.some(w => w.includes('其他项目')))
      const s = await small('cross-project'), qid = await project(s.domain, 'Q')
      const qparent = await task(s.domain, qid, 'Q父')
      await zeroWrite(s.root, () => assert.rejects(() => moveTask(s.domain, s.parent, qparent), /不属于/))
      return { map: [...derive(tree)], project: projectProgress(tree, 'P') }
    })
    await check('OP-EX-05', '两待验收leaf+环，pendingCount准确不造数', () => {
      const tree = [pure('root'), pure('a', { parentId: 'root', checklist: cl(1, 1) }),
        pure('b', { parentId: 'root', checklist: cl(2, 2) }),
        pure('cycleA', { parentId: 'cycleB' }), pure('cycleB', { parentId: 'cycleA' })]
      const out = derive(tree)
      assert.equal(out.get('root').pendingAcceptanceCount, 2)
      assert.equal(projectProgress(tree, pid).pendingAcceptanceCount, 2)
      return [...out]
    })
    await check('OP-EV-01/AUTO', 'null缺清单 vs 非空零勾=0/文案可辨', () => {
      const a = derive([pure('a')]).get('a'), b = derive([pure('b', { checklist: cl(1, 0) })]).get('b')
      assert.equal(a.value, null); assert.equal(b.value, 0)
      assert.equal(formatProgressValue(a), '证据不足'); assert.equal(formatProgressValue(b), '0%')
      return { a, b }
    })
    await check('OP-EV-02', '重复derive/preview/只读collect report零回写', () => zeroWrite(f.root, () => {
      for (let i = 0; i < 5; i++) { derive(tasks); projectProgress(tasks, pid); deriveTaskProgress(ids.L1, derive(tasks)) }
      const preview = previewProgressReport(d, { projectId: pid, periodStart: '2026-01-01', periodEnd: '2026-12-31' })
      collectProjectReport(d, pid)
      assert.deepEqual(entries(d, 'tasks'), tasks); return preview
    }))
    await check('OP-EV-03', '真实doctor命令报告2/5且全库sha/mtime零写', () => zeroWrite(f.root, async () => {
      const result = await handleDoctorCommand('', d, f.root)
      actions.push({ action: '/pm doctor', result })
      assert.match(result.text, /2\/5/)
      const findings = runDoctor(d)
      assert.ok(findings.some(x => x.id === ids.L5 && x.kind === 'done-incomplete-checklist'))
      assert.deepEqual(entries(d, 'tasks'), tasks); return { result, findings }
    }))
    await check('OP-SRC-01/SOURCE', '四消费点同一客观真源，不另平均legacy', () => {
      const targets = ['src/client/views/tasks.tsx', 'src/client/views/overview.tsx', 'src/client/views/gantt.tsx', 'src/core/progress-reports.ts']
      const source = Object.fromEntries(targets.map(f => [f, fs.readFileSync(path.join(pkg, f), 'utf8')]))
      save('source-consumers.json', Object.fromEntries(targets.map(f => [f, { sha256: hash(path.join(pkg, f)),
        lines: source[f].split('\n').flatMap((text, i) => /deriveProgress|clampProgress\(t\.progress|rawAvg|progressFill|resolveTaskProgressMeta/.test(text) ? [{ line: i + 1, text }] : []) }])))
      assert.ok(/deriveProgressMap|deriveTaskProgress/.test(source[targets[0]]), '任务列表直接使用 legacy progress，不派生 objective')
      assert.ok(/deriveProgressMap|deriveProjectProgress/.test(source[targets[1]]), '总览阶段另算legacy平均值')
      return '四消费者真源接线'
    })
    await check('OP-SRC-02', '新calcVersion1/null，旧缺键按0读不写', async () => {
      const s = await small('new-report', [[0, 0]])
      const report = await generate(s.domain, { projectId: s.pid, periodStart: '2026-01-01', periodEnd: '2026-12-31' })
      assert.equal(report.snapshot.tasks.averageProgress, null); assert.equal(snapshotCalcVersion(report.snapshot), 1)
      const legacy = clone(collectBackup(s.domain))
      delete legacy.reports[0].snapshot.tasks.calcVersion
      await precheckBackup(legacy); await applyBackup(s.domain, legacy, path.join(own, 'report-old-safety'))
      const read = await zeroWrite(s.root, () => getProgressReport(s.domain, report.id))
      assert.equal(snapshotCalcVersion(read.result.snapshot), 0)
      assert.equal(Object.hasOwn(read.result.snapshot.tasks, 'calcVersion'), false)
      return { report, read }
    })
    await check('OP-SRC-03', '异版本/任侧null差值null，同版数值可减', () => {
      const observed = []
      for (const [cur, prev, cv, pv, want] of [[60, 40, 1, 0, null], [null, 40, 1, 1, null],
        [60, null, 1, 1, null], [60, 40, 1, 1, 20], [40, 40, 1, 1, 0]]) {
        const r = (id, v, version, end) => ({ id, periodEnd: end, snapshot: { tasks: { averageProgress: v, calcVersion: version }, exceptions: [] } })
        const out = diffAgainstPrevious([r('rpt-2', cur, cv, '2026-10-21'), r('rpt-1', prev, pv, '2026-10-20')])
        assert.equal(out.get('rpt-2').avgProgress, want); observed.push([...out])
      }
      return observed
    })
    await check('OP-SRC-04', '旧快照磁盘sha不回填，新报告仅新增', async () => {
      const s = await small('history', [[2, 1]])
      const old = await generate(s.domain, { projectId: s.pid, periodStart: '2026-01-01', periodEnd: '2026-09-30' })
      const legacy = collectBackup(s.domain); delete legacy.reports[0].snapshot.tasks.calcVersion
      legacy.reports[0].snapshot.tasks.averageProgress = 40
      await applyBackup(s.domain, legacy, path.join(own, 'history-safety'))
      const before = manifest(s.root)
      getProgressReport(s.domain, old.id); derive(entries(s.domain, 'tasks'))
      const fresh = await generate(s.domain, { projectId: s.pid, periodStart: '2026-10-01', periodEnd: '2026-10-31' })
      const after = manifest(s.root)
      for (const [p, v] of Object.entries(before)) assert.deepEqual(after[p], v, p)
      assert.equal(getProgressReport(s.domain, old.id).snapshot.tasks.averageProgress, 40)
      return { before, after, fresh, historical: getProgressReport(s.domain, old.id) }
    })
    await check('OP-SRC-05/AUTO-core', '甘特helper清单40=0.4，无信号null；meta人工70独立', () => {
      const inputs = [pure('forty', { checklist: cl(5, 2) }), pure('none'), pure('manual', { checklist: cl(5, 2), manualProgress: 70 })]
      const out = derive(inputs)
      assert.equal(progressFill(out.get('forty')), 0.4); assert.equal(progressFill(out.get('none')), null)
      const resolved = meta(inputs[2], out.get('manual'))
      assert.equal(resolved.display, 70); assert.equal(resolved.objective, 40); assert.equal(resolved.mode, 'manual')
      return { derived: [...out], resolved }
    })
    await check('OP-SRC-05/SOURCE-manual', '甘特渲染人工display/mode不能仍显示objective为唯一进度', () => {
      const file = path.join(pkg, 'src/client/views/gantt.tsx'), source = fs.readFileSync(file, 'utf8')
      assert.ok(source.includes('resolveTaskProgressMeta'), '甘特仅progressFill(progressMap.get(t.id))，manual70未接display/mode')
      return { sha256: hash(file) }
    })
    await check('OP-Q-01', '真实命令到领域单写队列，禁止普通update清单数组', () => {
      const cmd = fs.readFileSync(path.join(pkg, 'src/commands/task.ts'), 'utf8')
      const domainSource = fs.readFileSync(path.join(pkg, 'src/core/task-checklist.ts'), 'utf8')
      for (const name of ['addTaskChecklistItem', 'setTaskChecklistItemDone', 'renameTaskChecklistItem', 'removeTaskChecklistItem']) {
        assert.ok(cmd.includes(name + '(domain'))
        const body = domainSource.slice(domainSource.indexOf('export function ' + name))
        assert.ok(body.slice(0, body.indexOf('\n}\n') + 3).includes('enqueueDomainWrite(domain'))
      }
      assert.equal(taskUpdateSchema.safeParse({ checklist: [] }).success, false)
      return { commandSha256: hash(path.join(pkg, 'src/commands/task.ts')), domainSha256: hash(path.join(pkg, 'src/core/task-checklist.ts')) }
    })
    await check('OP-Q-02', '领域expected true幂等/预留actor rev不落盘', async () => {
      const one = getTask(cd, leaf).checklist[0].id
      const out = await zeroWrite(c.root, () => setDone(cd, leaf, one, true, { actor: 'QA', rev: 'QA' }))
      assert.equal(Object.hasOwn(out.result, 'actor'), false); assert.equal(Object.hasOwn(out.result, 'rev'), false)
      return out
    })
    await check('OP-Q-03', '分歧并发toggle两项/rename不同项不丢失', async () => {
      const before = getTask(cd, leaf), [a, b] = before.checklist
      await Promise.all([setDone(cd, leaf, a.id, false), setDone(cd, leaf, b.id, true),
        renameItem(cd, leaf, a.id, '并发改名')])
      const after = getTask(cd, leaf)
      assert.deepEqual(after.checklist, [{ ...a, text: '并发改名', done: false }, { ...b, done: true }])
      return { before, after }
    })
    await check('OP-Q-04/AUTO', '真实JSON adapter持久写拒绝，不半写/命令error/队列恢复', async () => {
      const before = getTask(cd, leaf), diskBefore = manifest(c.root)
      const target = path.join(c.root, 'pmtool/tasks', leaf + '.json')
      const original = fsp.rename
      const intercepted = []
      // 实际 JSON backend 已写/flush 临时文件，发布 rename 注入一次 EIO，验证真实清理/内存边界。
      fsp.rename = async (source, destination) => {
        if (path.resolve(destination) === target && intercepted.length === 0) {
          intercepted.push({ source, destination, tempSha256: hash(source) })
          const error = new Error('QA injected JSON publish EIO')
          error.code = 'EIO'
          throw error
        }
        return original(source, destination)
      }
      syncBuiltinESMExports()
      try {
        await command(cd, `checklist toggle ${leaf} ${before.checklist[0].id} true`, 'error')
        assert.equal(intercepted.length, 1, '必须命中真实 backend rename，不能仅假造错误响应')
        assert.deepEqual(getTask(cd, leaf), before); assert.deepEqual(manifest(c.root), diskBefore)
      } finally {
        fsp.rename = original
        syncBuiltinESMExports()
      }
      await command(cd, `checklist toggle ${leaf} ${before.checklist[0].id} true`)
      return { before, afterFailure: before, diskBefore, intercepted, recovered: getTask(cd, leaf),
        boundary: '真实JSON backend临时写+flush成功，rename前一次EIO；不声称rename后fsync失败也已覆盖' }
    })
    await check('OP-BD-02', 'JSON导出/内容恢复保清单ID/空数组，Markdown只渲染', async () => {
      const exported = await exportBackupJson(d, 'op-json')
      const s = await open('json-roundtrip')
      await restoreBackupFromContent(s.domain, exported.content, path.join(own, 'json-safety'))
      assert.deepEqual(entries(s.domain, 'tasks'), tasks)
      const markdown = renderProjectMarkdown(collectProjectReport(d, pid))
      assert.ok(markdown.includes('F2-L1'))
      return { exportPath: exported.path, contentSha256: hash(exported.path), tasks: entries(s.domain, 'tasks'),
        boundary: 'JSON无file_assets，因此内容恢复合法；MD非清单可重放导入' }
    })
    await check('OP-BD-03', '当前标准createBackup/restore新旧兼容，清单字段保全', async () => {
      const s = await open('backup-roundtrip')
      await restoreBackup(s.domain, b.path, path.join(own, 'backup-safety'))
      assert.deepEqual(entries(s.domain, 'tasks'), tasks)
      const old = clone(backup); delete old.extra; delete old.fileBundleId
      old.tasks = old.tasks.map(t => { const copy = clone(t); delete copy.checklist; return copy })
      await precheckBackup(old)
      await applyBackup(s.domain, old, path.join(own, 'backup-safety'))
      assert.ok(entries(s.domain, 'tasks').every(t => !Object.hasOwn(t, 'checklist')))
      return { formatVersion: backup.formatVersion, oldTasks: entries(s.domain, 'tasks'), standardPath: b.path }
    })
    await check('OP-BD-04', '旧缺清单记录doctor只读不迁移', async () => {
      const s = await small('legacy-doctor', [[0, 0, { status: 'done', progress: 80 }]])
      return zeroWrite(s.root, async () => {
        const result = await handleDoctorCommand('', s.domain, s.root)
        assert.ok(entries(s.domain, 'tasks').every(t => !Object.hasOwn(t, 'checklist')))
        return result
      })
    })
    await check('RA-OP01/AUTO', '真实manual30/0+备注，objective50/项目不变', async () => {
      const s = await small('manual', [[2, 1, { progress: 40 }]])
      const id = s.leaves[0], before = getTask(s.domain, id), observed = []
      for (const manualProgress of [30, 0]) {
        await command(s.domain, `update ${id} ${JSON.stringify({ manualProgress, manualProgressNote: '来源QA' })}`)
        const after = getTask(s.domain, id), resolved = meta(after, value(s.domain, id))
        assert.equal(resolved.objective, 50); assert.equal(resolved.display, manualProgress)
        assert.equal(resolved.manual, manualProgress); assert.equal(resolved.mode, 'manual')
        assert.equal(resolved.manualNote, '来源QA'); assert.deepEqual(after.checklist, before.checklist)
        assert.equal(after.status, before.status); assert.equal(after.progress, 40)
        assert.equal(projectProgress(entries(s.domain, 'tasks'), s.pid).value, 50)
        const report = await generate(s.domain, { projectId: s.pid, periodStart: '2026-01-01', periodEnd: '2026-12-31' })
        assert.equal(report.snapshot.tasks.averageProgress, 50)
        observed.push({ after, resolved, report })
      }
      return observed
    })
    await check('RA-OP02/AUTO', 'clear回落50/无清单null，纯draft取消零写', async () => {
      const s = await small('clear', [[2, 1, { manualProgress: 30, manualProgressNote: '来源' }], [0, 0, { progress: 80, manualProgress: 40 }]])
      const observed = []
      for (const [i, want] of [50, null].entries()) {
        const id = s.leaves[i], before = getTask(s.domain, id)
        await zeroWrite(s.root, () => { const draft = { ...clone(before), manualProgress: null }; meta(draft, value(s.domain, id)) })
        await command(s.domain, `update ${id} {"manualProgress":null}`)
        const after = getTask(s.domain, id), resolved = meta(after, value(s.domain, id))
        assert.equal(resolved.display, want); assert.equal(after.manualProgressNote, undefined)
        assert.deepEqual(after.checklist, before.checklist)
        observed.push({ before, after, resolved })
      }
      return { observed, boundary: '纯draft取消只读；实际按钮/主save/取消交Main GUI' }
    })
    await check('RA-OP03/AUTO', 'wrapped排除覆盖/pending/done/open/queue/复盘，改回纳入', async () => {
      const s = await small('wrapped', [[2, 1], [1, 1, { status: 'wrapped', dueDate: addDaysIso(localTodayIso(), -1) }]])
      const id = s.leaves[1], before = getTask(s.domain, id)
      const parent = value(s.domain, s.parent), pp = projectProgress(entries(s.domain, 'tasks'), s.pid)
      assert.equal(parent.value, 50); assert.deepEqual(parent.coverage, { coveredLeaves: 1, totalLeaves: 1 })
      assert.equal(pp.value, 50); assert.equal(pp.pendingAcceptanceCount, 0)
      assert.equal(value(s.domain, id).value, 100); assert.equal(value(s.domain, id).pendingAcceptance, false)
      const stats = collectStats(s.domain, s.pid, localTodayIso()).projects[0]
      assert.equal(stats.taskDone, 0); assert.equal(stats.taskWrapped, 1)
      assert.equal(stats.taskTodo + stats.taskInProgress + stats.taskBlocked, 2)
      const queue = buildQueueForProject(s.domain, s.pid, { today: localTodayIso() })
      assert.ok(![queue.top, ...queue.rest].filter(Boolean).some(q => q.taskId === id))
      const checks = collectChecks(s.domain, { projectId: s.pid, today: localTodayIso() })
      assert.ok(!checks.some(finding => finding.taskId === id))
      const summary = tallyTasksByStatus(entries(s.domain, 'tasks').map(t => t.status))
      assert.deepEqual(summary, { todo: 2, in_progress: 0, blocked: 0, done: 0, wrapped: 1 })
      assert.equal(tallyOpen(summary), 2)
      const reflectionsBefore = entries(s.domain, 'reflections')
      assert.equal(await ensureReflectionOnDone(s.domain, before), undefined)
      await barrier(s.domain); assert.deepEqual(entries(s.domain, 'reflections'), reflectionsBefore)
      await command(s.domain, `update ${id} {"status":"todo"}`)
      assert.equal(value(s.domain, s.parent).value, 75)
      assert.deepEqual(value(s.domain, s.parent).coverage, { coveredLeaves: 2, totalLeaves: 2 })
      assert.equal(value(s.domain, id).pendingAcceptance, true)
      const afterQueue = buildQueueForProject(s.domain, s.pid, { today: localTodayIso() })
      assert.ok([afterQueue.top, ...afterQueue.rest].filter(Boolean).some(q => q.taskId === id))
      return { parent, pp, stats, summary, checks, queue, after: value(s.domain, s.parent), afterQueue, before }
    })
    await check('RA-OP04/AUTO-fields', '工时3.5/证据合法持久；负工时/超长证据拒绝/不当权重', async () => {
      const s = await small('effort', [[2, 1], [4, 3]])
      const id = s.leaves[0]
      await command(s.domain, `update ${id} {"effortHours":3.5,"evidenceUrl":"https://example.com/qa"}`)
      assert.equal(getTask(s.domain, id).effortHours, 3.5); assert.equal(getTask(s.domain, id).evidenceUrl, 'https://example.com/qa')
      assert.equal(value(s.domain, s.parent).value, 63); assert.equal(value(s.domain, id).value, 50)
      assert.equal(getTask(s.domain, id).status, 'todo')
      await zeroWrite(s.root, () => command(s.domain, `update ${id} {"effortHours":-1}`, 'error'))
      await zeroWrite(s.root, () => command(s.domain, `update ${id} ${JSON.stringify({ evidenceUrl: 'x'.repeat(2049) })}`, 'error'))
      const exported = await exportBackupJson(s.domain, 'effort-json')
      assert.equal(JSON.parse(exported.content).tasks.find(t => t.id === id).effortHours, 3.5)
      return { task: getTask(s.domain, id), exported: exported.path }
    })
    await check('RA-OP04/AUTO-protocol', '非法协议应在真实domain入口拒绝（既有RA04）', async () => {
      const s = await small('evidence-protocol', [[2, 1]])
      const id = s.leaves[0], before = getTask(s.domain, id)
      const result = await handleTaskCommand(`update ${id} {"evidenceUrl":"javascript:alert(1)"}`, s.domain)
      actions.push({ input: `/pm task update ${id} {"evidenceUrl":"javascript:alert(1)"}`, result, before, after: getTask(s.domain, id) })
      assert.equal(result.kind, 'error', 'domain接受javascript:，与表单http(s)校验和RA04非法协议预期不一致')
      assert.deepEqual(getTask(s.domain, id), before)
      return result
    })
    await check('RA-OP05/AUTO', 'done本地当天/显式日期采纳/revert清除，不补清单/历史日期', async () => {
      const s = await small('completed-date', [[2, 1]])
      const id = s.leaves[0], before = getTask(s.domain, id)
      await command(s.domain, `update ${id} {"status":"done"}`)
      await barrier(s.domain)
      assert.equal(getTask(s.domain, id).completedDate, localTodayIso())
      await command(s.domain, `update ${id} {"completedDate":"2026-10-01"}`)
      assert.equal(getTask(s.domain, id).completedDate, '2026-10-01')
      await command(s.domain, `update ${id} {"status":"in_progress"}`)
      assert.equal(getTask(s.domain, id).completedDate, undefined)
      await command(s.domain, `update ${id} {"status":"done","completedDate":"2026-10-02"}`)
      await barrier(s.domain); assert.equal(getTask(s.domain, id).completedDate, '2026-10-02')
      assert.deepEqual(getTask(s.domain, id).checklist, before.checklist)
      assert.equal(getTask(d, ids.L6).completedDate, undefined)
      return { before, after: getTask(s.domain, id), today: localTodayIso() }
    })
    await check('RA-OP06', '1/3+2/3含中间层=50，重组不重复；额外31判别终round', async () => {
      const s = await small('last-round', [[3, 1], [3, 2], [0, 0]])
      const middle = await task(s.domain, s.pid, '中间层', { parentId: s.parent })
      await moveTask(s.domain, s.leaves[0], middle)
      assert.equal(value(s.domain, s.parent).value, 50)
      assert.equal(projectProgress(entries(s.domain, 'tasks'), s.pid).value, 50)
      const report = await generate(s.domain, { projectId: s.pid, periodStart: '2026-01-01', periodEnd: '2026-12-31' })
      assert.equal(report.snapshot.tasks.averageProgress, 50)
      const discriminant = [pure('r'), pure('a', { parentId: 'r', checklist: cl(3, 1) }),
        pure('m', { parentId: 'r' }), pure('b', { parentId: 'm', checklist: cl(3, 1) }),
        pure('c', { parentId: 'm', checklist: cl(4, 1) })]
      assert.equal(derive(discriminant).get('r').value, 31)
      assert.equal(projectProgress(discriminant, pid).value, 31)
      return { report, map: [...derive(discriminant)], project: projectProgress(discriminant, pid) }
    })
    await check('F2/AUTO-summary-stats-report', 'F2真实summary树/状态stats与新report客观均值不同维度', async () => {
      assert.deepEqual(flattenVisible(tasks).map(r => r.task.id).sort(), tasks.map(t => t.id).sort())
      const summary = tallyTasksByStatus(tasks.map(t => t.status))
      assert.deepEqual(summary, { todo: 7, in_progress: 0, blocked: 0, done: 2, wrapped: 1 })
      assert.equal(tallyTotal(summary), 10); assert.equal(tallyOpen(summary), 7)
      assert.equal(donePercent(summary, tasks.length), 20)
      const stats = collectStats(d, pid, localTodayIso()).projects[0]
      assert.equal(stats.taskTotal, 10); assert.equal(stats.taskDone, 2); assert.equal(stats.taskWrapped, 1)
      assert.equal(stats.taskTodo, 7); assert.equal(stats.completionRate, 20)
      const beforeTasks = entries(d, 'tasks')
      const report = await generate(d, { projectId: pid, periodStart: '2026-01-01', periodEnd: '2026-12-31' })
      assert.equal(report.snapshot.tasks.averageProgress, 66)
      assert.equal(report.snapshot.tasks.calcVersion, 1)
      assert.deepEqual(entries(d, 'tasks'), beforeTasks)
      return { summary, stats, tree: flattenVisible(tasks).map(r => ({ id: r.task.id, depth: r.depth })), report,
        boundary: 'stats完成率=done/全部任务20%，不是清单客观66%；不能互换' }
    })
  }
} catch (e) {
  rows.push({ id: 'EXECUTION', status: 'FAIL', error: e.stack })
  console.error(e.stack)
} finally {
  for (const facility of facilities) await facility.closeAll()
  const mode = process.argv[2]
  save(mode + '-results.json', { pid: process.pid, node: process.version, today: localTodayIso(),
    rows, actions, scope: 'AUTO/领域集成；GUI未操作；产品未更改' })
  console.log(`独立结果 ${rows.filter(r => r.status === 'PASS').length} PASS / ${rows.filter(r => r.status === 'FAIL').length} FAIL`)
  process.exitCode = rows.some(r => r.status === 'FAIL') ? 1 : 0
}
