// 独立断言调用生产源码与 JSON 存储；请求 adapter 不替换业务 domain。
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec } from './lib/core/storage.js'
import { addProject, enqueueDomainWrite } from './lib/core/projects.js'
import { addTask, getTask, updateTask } from './lib/core/tasks.js'
import { addMilestone } from './lib/core/milestones.js'
import { addDeliverable, updateDeliverable } from './lib/core/deliverables.js'
import { addRiskIssue } from './lib/core/risk-issues.js'
import { addMeeting } from './lib/core/meetings.js'
import { addOkr } from './lib/core/okr.js'
import { addHabit } from './lib/core/habits.js'
import { addLesson } from './lib/core/lessons.js'
import { bindSession } from './lib/core/session-bind.js'
import { ensureReflectionOnDone } from './lib/core/reflect.js'
import { handleTaskCommand } from './lib/commands/task.js'
import { handleMaterialCommand } from './lib/commands/material.js'
import { handleProgressCommand } from './lib/commands/progress.js'
import { handleProgressReportCommand } from './lib/commands/progress-report.js'
import { handleBackupCommand } from './lib/commands/backup.js'
import { progressAppend, progressEditRevision, progressSoftDelete, progressRestore,
  collectMaterials, taskHasMaterials, visibleProgressLog } from './lib/core/task-materials.js'
import { collectChecks } from './lib/core/check.js'
import { buildReviewMaterials } from './lib/core/review-materials.js'
import { collectProjectReport, renderProjectMarkdown } from './lib/core/report.js'
import { buildArchiveSnapshot } from './lib/core/archive.js'
import { stageUpload, readStage, deleteStage, StageNotFoundError } from './lib/core/file-staging.js'
import { attachFileToTask, applyTaskOpsWithFiles, gcOrphanAssets, writeAssetManifest,
  resolveFileRoot, FileRootUnavailableError } from './lib/core/file-asset-store.js'
import { FILE_ASSET_DEFAULTS, validateUploadedFile, storeAssetBuffer, resolveWithinRoot,
  readAssetBuffer, FileAssetRejectedError } from './lib/core/file-assets.js'
import { buildAssetRoutes } from './lib/core/http/asset-route.js'
import { generateProgressReport, previewProgressReport, getProgressReport, updateProgressReport } from './lib/core/progress-reports.js'
import { renderProgressReportMarkdown } from './lib/core/progress-report-markdown.js'
import { exportProgressReportMarkdown, exportProjectMarkdown, exportProjectWeb, exportProjectPlain } from './lib/core/export.js'
import { BACKUP_TABLES, EXTRA_BACKUP_TABLES, collectBackup, createBackup, precheckBackup,
  restoreBackup, applyBackup, readBackupFile, validateBackup } from './lib/core/backup.js'
import { precheckBackupBytes, backupJsonSha } from './lib/core/file-backup.js'
import { localTodayIso, addDaysIso } from './lib/core/derived.js'

const own = process.env.QA_OWN
const save = (n, v) => fs.writeFileSync(path.join(own,
  process.argv[2] === 'reopen' && ['results.json', 'actions.json', 'failures-live.json', 'fatal.json'].includes(n) ? 'reopen-' + n : n),
JSON.stringify(v, null, 2) + '\n')
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const bytesSha = b => createHash('sha256').update(b).digest('hex')
const rows = [], actions = [], facilities = []
let serial = 0
const D = localTodayIso(), D1 = addDaysIso(D, -1), D2 = addDaysIso(D, -2)
function manifest(dir, prefix = '') {
  if (!fs.existsSync(dir)) return {}
  return Object.fromEntries(fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(e => {
    const f = path.join(dir, e.name), rel = prefix ? prefix + '/' + e.name : e.name
    return e.isDirectory() ? Object.entries(manifest(f, rel)) :
      e.isFile() ? [[rel, { size: fs.statSync(f).size, sha256: sha(f) }]] :
        [[rel, { symlink: fs.readlinkSync(f) }]]
  }))
}
async function check(id, name, fn) {
  const start = new Date().toISOString(), actionStart = actions.length
  try {
    const observed = await fn()
    rows.push({ id, name, status: 'PASS', start, end: new Date().toISOString(), actionStart, actionEnd: actions.length, observed })
    console.log(`PASS ${id}: ${name}`)
  } catch (e) {
    rows.push({ id, name, status: 'FAIL', start, end: new Date().toISOString(), actionStart, actionEnd: actions.length,
      error: e.stack, actual: e.actual, expected: e.expected })
    console.error(`FAIL ${id}: ${name}\n${e.stack}`)
    // 每个失败即时另存，Main无需等待本轮其他用例。
    save('failures-live.json', rows.filter(r => r.status === 'FAIL'))
  }
  save('results.json', rows)
  save('actions.json', actions)
}
async function open(name, existing) {
  const base = existing?.base ?? path.join(own, 'domains', `${++serial}-${name}`)
  const root = existing?.root ?? path.join(base, 'data')
  const files = existing?.files ?? path.join(base, 'files')
  fs.mkdirSync(files, { recursive: true })
  process.env.DSH_PM_FILE_ROOT = files
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('json', new JsonStorageBackend(root))
  const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
  const domain = await facility.open(pmDomainSpec)
  facilities.push(facility)
  return { domain, root, files, base }
}
const tableRows = (d, name) => [...d.table(name).entries()].map(([, r]) => r)
const db = d => Object.fromEntries([...BACKUP_TABLES, ...EXTRA_BACKUP_TABLES, 'sessions', 'checks'].map(n => [n, [...d.table(n).entries()]]))
const clone = structuredClone
const jsonValue = v => JSON.parse(JSON.stringify(v))
async function barrier(d) { await enqueueDomainWrite(d, () => Promise.resolve()) }
async function command(d, kind, input, want = 'success') {
  const handler = { task: handleTaskCommand, material: handleMaterialCommand,
    progress: handleProgressCommand, report: handleProgressReportCommand }[kind]
  const result = await handler(input, d)
  actions.push({ rawInput: '/pm ' + kind + ' ' + input, result })
  assert.equal(result.kind, want, result.text)
  return result
}
async function zero(s, fn) {
  await barrier(s.domain)
  const before = { db: clone(db(s.domain)), disk: manifest(s.root), files: manifest(s.files) }
  const observed = await fn()
  await barrier(s.domain)
  const after = { db: clone(db(s.domain)), disk: manifest(s.root), files: manifest(s.files) }
  assert.deepEqual(after, before, '失败/只读动作必须 DB 与字节零写')
  return { before, after, observed }
}
async function seed(name) {
  const s = await open(name), d = s.domain
  const A = await addProject(d, { name: 'QA-A-' + name, startDate: '2026-01-01', targetDate: '2026-12-31' })
  const B = await addProject(d, { name: 'QA-B-' + name, startDate: '2026-01-01', targetDate: '2026-12-31' })
  const m = await addMilestone(d, { projectId: A.id, title: 'QA里程碑', targetDate: D })
  const v = await addDeliverable(d, { projectId: A.id, name: 'QA交付物V1', version: 'v1', milestoneId: m.id, note: '合法备注' })
  const bv = await addDeliverable(d, { projectId: B.id, name: 'QA-B V2', version: 'v2' })
  const t = await addTask(d, { projectId: A.id, title: 'F3-' + name, milestoneId: m.id,
    evidenceUrl: 'https://example.com/qa-legacy', deliverableId: v.id })
  const bt = await addTask(d, { projectId: B.id, title: 'QA-B任务' })
  await command(d, 'material', `link ${t.id} {"url":"https://example.com/qa-spec","title":"QA规范","note":"link原备注"}`)
  await command(d, 'material', `deliverable ${t.id} ${JSON.stringify({ deliverableId: v.id, note: '冻结V1' })}`)
  const link = getTask(d, t.id).attachments.find(a => a.kind === 'link').id
  const ea = await progressAppend(d, t.id, { author: '测试甲', date: D2, content: 'E1 rv1正文', refs: [link] })
  await progressEditRevision(d, t.id, ea.id, { author: '测试乙', date: D1, content: 'E1 rv2正文', refs: [link] })
  await progressEditRevision(d, t.id, ea.id, { author: '测试甲', date: D, content: 'E1 rv3正文', refs: [link] })
  const eb = await progressAppend(d, t.id, { author: '测试乙', date: D1, content: 'E2 rv1已删除' })
  await progressEditRevision(d, t.id, eb.id, { author: '测试乙', content: 'E2 rv2已删除' })
  await progressSoftDelete(d, t.id, eb.id)
  const ec = await progressAppend(d, t.id, { author: '测试乙', date: D2, content: 'E3 rv1同日异ID' })
  const be = await progressAppend(d, bt.id, { author: 'QA-B乙', date: D, content: 'QA-B不得入A' })
  s.ids = { A: A.id, B: B.id, T: t.id, BT: bt.id, M: m.id, V: v.id, BV: bv.id,
    link, dlvAt: getTask(d, t.id).attachments.find(a => a.kind === 'deliverable').id,
    E1: ea.id, E2: eb.id, E3: ec.id, BE: be.id }
  return s
}
function req(method, headers = {}, chunks = []) {
  const r = new EventEmitter()
  r.method = method; r.headers = headers; r.url = '/'
  r.resume = () => {}
  r[Symbol.asyncIterator] = async function* () { for (const b of chunks) yield b }
  return r
}
function res() {
  const r = { statusCode: 200, headers: {}, body: Buffer.alloc(0) }
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = String(v) }
  r.end = b => { r.body = Buffer.isBuffer(b) ? b : Buffer.from(b ?? '') }
  return r
}
async function download(s, asset, tid, auth) {
  process.env.DSH_PM_FILE_ROOT = s.files
  const r = res()
  await buildAssetRoutes({ getDomain: () => s.domain, auth }).download(req('GET'), r, asset, tid)
  return { status: r.statusCode, headers: r.headers, bytes: r.body.length, sha256: bytesSha(r.body),
    ...(r.statusCode === 200 ? {} : { error: r.body.toString('utf8') }) }
}
async function packageFixture(s, name) {
  process.env.DSH_PM_FILE_ROOT = s.files
  const dir = path.join(own, 'fixtures', name)
  fs.mkdirSync(dir, { recursive: true })
  const b = await createBackup(s.domain, dir)
  const raw = fs.readFileSync(b.path, 'utf8'), parsed = await readBackupFile(b.path)
  await precheckBackup(parsed)
  await precheckBackupBytes(parsed, b.path, backupJsonSha(raw))
  const destination = path.join(dir, 'backup.json')
  fs.copyFileSync(b.path, destination)
  fs.cpSync(b.path + '.files.' + parsed.fileBundleId, destination + '.files.' + parsed.fileBundleId, { recursive: true })
  // 复制后再次预检标准命名包，而不只验证创建时原路径。
  await precheckBackupBytes(parsed, destination, backupJsonSha(fs.readFileSync(destination, 'utf8')))
  fs.writeFileSync(path.join(dir, 'ids.json'), JSON.stringify(s.ids, null, 2) + '\n')
  fs.writeFileSync(path.join(dir, 'expected.json'), JSON.stringify({ date: D,
    tables: Object.fromEntries([...BACKUP_TABLES, ...EXTRA_BACKUP_TABLES].map(n => [n, db(s.domain)[n]])),
    manifest: Object.fromEntries((parsed.extra?.file_assets ?? []).map(([, a]) => [a.relPath, { size: a.size, sha256: a.sha256 }])),
    backupCounts: b.counts,
    selectedHistorical: [
      { taskId: s.ids.T, entryId: s.ids.E1, revisionId: 'rv-2' },
      { taskId: s.ids.T, entryId: s.ids.E3, revisionId: 'rv-1' },
    ], selectedCurrent: [
      { taskId: s.ids.T, entryId: s.ids.E1, revisionId: 'rv-3' },
      { taskId: s.ids.T, entryId: s.ids.E3, revisionId: 'rv-1' },
    ], reportPath: '已核B6：selectedRefs只冻结当时当前版；旧rv2须拒绝零写；历史完整excerpts另路合法',
    sessionsExcludedFromBackup: true }, null, 2) + '\n')
  return { path: destination, sha256: sha(destination), counts: b.counts, bytePrecheck: '通过', ids: s.ids }
}

try {
  if (process.argv[2] === 'reopen') {
    const f = JSON.parse(fs.readFileSync(path.join(own, 'reopen.json')))
    const s = await open('new-process', f)
    await check('RA-F06/AUTO-new-process', '全新 Node 进程重开逐表/字节一致，不是宿主重启', async () => {
      assert.notEqual(process.pid, f.pid)
      assert.deepEqual(jsonValue(db(s.domain)), f.tables)
      assert.deepEqual(manifest(s.files), f.manifest)
      return { oldPid: f.pid, newPid: process.pid, tables: db(s.domain), files: manifest(s.files) }
    })
  } else {
    const s = await seed('materials'), d = s.domain, i = s.ids
    await check('RA-M01/AUTO', '真实 task update 单层信封三版追加、未提及软删/条目原样', async () => {
      const before = getTask(d, i.T)
      await command(d, 'task', `update ${i.T} ${JSON.stringify({ title: '基本字段已改',
        draft: { attachmentOps: [{ op: 'updateNote', id: i.link, title: '新标题', note: '新备注' }],
          progressOps: [{ op: 'edit', id: i.E1, author: '测试乙', content: 'E1 rv4主保存' }] } })}`)
      const after = getTask(d, i.T), e1 = after.progressLog.find(e => e.id === i.E1)
      assert.equal(after.title, '基本字段已改')
      assert.deepEqual(e1.revisions.slice(0, 3), before.progressLog.find(e => e.id === i.E1).revisions)
      assert.equal(e1.revisions[3].id, 'rv-4')
      for (const id of [i.E2, i.E3]) assert.deepEqual(after.progressLog.find(e => e.id === id), before.progressLog.find(e => e.id === id))
      assert.deepEqual(after.attachments.map(a => a.id), before.attachments.map(a => a.id))
      return { before, after }
    })
    for (const [label, patch] of [
      ['bad-basic-date', { dueDate: '2026-02-30', draft: { progressOps: [{ op: 'edit', id: i.E1, content: '不应写' }] } }],
      ['bad-author', { title: '不应写', draft: { progressOps: [{ op: 'add', author: '', content: '不应写' }] } }],
      ['bad-url', { title: '不应写', draft: { attachmentOps: [{ op: 'addLink', url: 'javascript:alert(1)' }] } }],
    ]) await check('RA-M02/AUTO-' + label, '真实命令非法 basic/ops 全内容与磁盘零写', () => zero(s,
      () => command(d, 'task', `update ${i.T} ${JSON.stringify(patch)}`, 'error')))
    await check('RA-M03/AUTO-first-restore', '软删三版以上保全、候选排除、恢复同ID/版本', async () => {
      const e = clone(getTask(d, i.T).progressLog.find(e => e.id === i.E1))
      await command(d, 'progress', `delete ${i.T} ${i.E1}`)
      const deleted = getTask(d, i.T).progressLog.find(e => e.id === i.E1)
      assert.ok(deleted.deletedAt); assert.deepEqual(deleted.revisions, e.revisions)
      assert.ok(!visibleProgressLog(getTask(d, i.T)).some(e => e.id === i.E1))
      assert.ok(!previewProgressReport(d, { projectId: i.A, periodStart: D2, periodEnd: D }).candidates.some(e => e.entryId === i.E1 && e.taskId === i.T))
      await command(d, 'progress', `restore ${i.T} ${i.E1}`)
      assert.deepEqual(getTask(d, i.T).progressLog.find(e => e.id === i.E1), e)
      return { original: e, deleted, restored: getTask(d, i.T).progressLog.find(e => e.id === i.E1) }
    })
    await check('RA-M03/AUTO-active-retry-rejected', '既有合同active重复restore错误且零写，未知ID仍拒绝', async () => {
      const outputs = []
      for (const entry of [i.E1, 'pl-9999']) outputs.push(await zero(s, () => command(d, 'progress', `restore ${i.T} ${entry}`, 'error')))
      return outputs
    })
    await check('RA-M04/AUTO-freeze', '源V2更新不改任务frozenName/version、断联不删源或旧refs', async () => {
      const old = clone(getTask(d, i.T))
      await updateDeliverable(d, i.V, { name: 'QA交付物V2', version: 'v2', changeNote: '源升级' })
      assert.deepEqual(getTask(d, i.T), old)
      await command(d, 'material', `remove ${i.T} ${i.dlvAt}`)
      assert.ok(d.table('deliverables').get(i.V))
      assert.deepEqual(getTask(d, i.T).progressLog, old.progressLog)
      return { frozen: old.attachments.find(a => a.id === i.dlvAt), source: d.table('deliverables').get(i.V), after: getTask(d, i.T) }
    })
    await check('RA-M05/AUTO-raw', '非空raw即使内容合法也拒绝，空任务首次raw允许', async () => {
      const rejected = await zero(s, async () => {
        const r = await command(d, 'material', `commit ${i.T} {"attachments":[],"progressLog":[]}`, 'error')
        assert.match(r.text, /已有资料|修订历史|apply/); return r
      })
      const empty = await addTask(d, { projectId: i.A, title: '空首次raw' })
      await command(d, 'material', `commit ${empty.id} {"attachments":[{"kind":"link","url":"https://example.com/first"}],"progressLog":[{"author":"测试甲","content":"首次raw"}]}`)
      assert.equal(getTask(d, empty.id).attachments.length, 1)
      assert.equal(getTask(d, empty.id).progressLog[0].revisions.length, 1)
      return { rejected, first: getTask(d, empty.id) }
    })
    await check('RA-M05/AUTO-apply', 'material apply改名/追加/软删/恢复保全未提交历史', async () => {
      const before = getTask(d, i.T)
      await command(d, 'material', `apply ${i.T} ${JSON.stringify({ attachmentOps: [{ op: 'updateNote', id: i.link, title: 'apply改名' }],
        progressOps: [{ op: 'edit', id: i.E1, content: 'E1 rv5 apply' }, { op: 'delete', id: i.E3 }, { op: 'restore', id: i.E3 }] })}`)
      const after = getTask(d, i.T)
      assert.deepEqual(after.progressLog.find(e => e.id === i.E1).revisions.slice(0, 4), before.progressLog.find(e => e.id === i.E1).revisions)
      for (const id of [i.E2, i.E3]) assert.deepEqual(after.progressLog.find(e => e.id === id), before.progressLog.find(e => e.id === id))
      return { before, after }
    })
    await check('RA-M06/AUTO', '两链接c-1/c-2别名真落库与坏alias整批零写', async () => {
      await command(d, 'task', `add ${JSON.stringify({ projectId: i.A, title: 'alias-两链接',
        draft: { attachmentOps: [{ op: 'addLink', clientId: 'c-1', url: 'https://example.com/c1' },
          { op: 'addLink', clientId: 'c-2', url: 'https://example.com/c2' }],
          progressOps: [{ op: 'add', author: '测试甲', content: '只引用第二资料', refs: ['c-2'] }] } })}`)
      const t = tableRows(d, 'tasks').find(t => t.title === 'alias-两链接')
      assert.deepEqual(t.progressLog[0].revisions[0].refs, [t.attachments[1].id])
      const bad = await zero(s, () => command(d, 'task', `add ${JSON.stringify({ projectId: i.A, title: '坏alias不能创建',
        draft: { attachmentOps: [{ op: 'addLink', clientId: 'c-1', url: 'https://example.com/c-bad' }],
          progressOps: [{ op: 'add', author: '甲', content: '拒绝', refs: ['c-missing'] }] } })}`, 'error'))
      return { actual: t, bad }
    })
    await check('RA-M07/AUTO', '旧单键新数组双读与basic保存保全、叙事不算材料', async () => {
      const before = getTask(d, i.T)
      const derived = await zero(s, () => {
        const materials = collectMaterials(before)
        assert.ok(materials.some(m => m.source === 'legacy' && m.url === before.evidenceUrl))
        assert.ok(materials.some(m => m.source === 'attachments' && m.url === 'https://example.com/qa-spec'))
        assert.equal(taskHasMaterials({ progressLog: before.progressLog }), false)
        const report = collectProjectReport(d, i.A)
        const md = renderProjectMarkdown(report)
        const checks = collectChecks(d, { today: D })
        const review = buildReviewMaterials({ projectId: i.A, tasks: [{ ...before, status: 'done', completedDate: D }],
          milestones: [], reflections: [], today: D })
        assert.equal(review.tasks[0].evidence, before.evidenceUrl)
        const archive = buildArchiveSnapshot(d, i.A)
        assert.ok(archive.evidence.some(e => e.url === before.evidenceUrl))
        assert.ok(archive.evidence.some(e => e.url === 'https://example.com/qa-spec'))
        assert.deepEqual(archive.tasks.find(t => t.id === i.T).attachments, before.attachments)
        return { materials, checks, review, archive, markdown: md }
      })
      const preExport = db(d)
      const exported = await exportProjectMarkdown(d, i.A, 'materials')
      assert.ok(exported.content.includes(before.evidenceUrl))
      assert.ok(exported.content.includes('https://example.com/qa-spec'))
      // 显式export有已批准审计settings写；只读派生已在上方独立证明。
      for (const name of Object.keys(preExport).filter(n => n !== 'settings')) assert.deepEqual(db(d)[name], preExport[name])
      await command(d, 'task', `update ${i.T} {"title":"仅改basic"}`)
      const after = getTask(d, i.T)
      for (const k of ['attachments', 'progressLog', 'evidenceUrl', 'deliverableId']) assert.deepEqual(after[k], before[k])
      return { derived, exported, before, after }
    })

    const f3 = await seed('fixture-F3')
    await check('F3/AUTO-valid-fixture', '合法多修订/软删/旧新键 F3标准备份及字节预检', () => packageFixture(f3, 'F3'))
    const f4 = await seed('files'), fd = f4.domain, fi = f4.ids
    const fileSource = path.join(own, 'fixtures', 'F4-source')
    fs.mkdirSync(fileSource, { recursive: true })
    const note = Buffer.from('# QA 文件\n版本一\n', 'utf8')
    const note2 = Buffer.from('# QA 文件\n版本二\n', 'utf8')
    fs.writeFileSync(path.join(fileSource, 'qa-note.md'), note)
    fs.writeFileSync(path.join(fileSource, 'qa-note-copy.md'), note)
    fs.writeFileSync(path.join(fileSource, 'qa-note-v2.md'), note2)
    await check('RA-F01/AUTO', 'stage无DB/取消无残留、两同hash真实task主save去重及finalize', async () => {
      process.env.DSH_PM_FILE_ROOT = f4.files
      const before = db(fd)
      const cancel = await stageUpload({ originalName: 'cancel.md', bytes: note })
      assert.deepEqual(db(fd), before)
      await deleteStage(cancel.stageId)
      await assert.rejects(() => readStage(cancel.stageId), StageNotFoundError)
      const a = await stageUpload({ originalName: 'qa-note.md', bytes: note })
      const b = await stageUpload({ originalName: 'qa-note-copy.md', bytes: note })
      const t = await addTask(fd, { projectId: fi.A, title: '同hash主保存', draft: {
        attachmentOps: [{ op: 'addFile', stageId: a.stageId }, { op: 'addFile', stageId: b.stageId }],
        progressOps: [{ op: 'add', author: '测试甲', content: '真文件单次主保存' }] } })
      assert.equal(t.attachments.length, 1)
      assert.equal(tableRows(fd, 'file_assets').length, 1)
      for (const id of [a.stageId, b.stageId]) await assert.rejects(() => readStage(id), StageNotFoundError)
      const meta = tableRows(fd, 'file_assets')[0]
      assert.deepEqual(await readAssetBuffer(f4.files, meta.relPath), note)
      f4.ids.FILE_TASK = t.id; f4.ids.ASSET = meta.id
      return { task: t, meta, stages: [a, b], files: manifest(f4.files) }
    })
    for (const [label, input] of [
      ['empty', { originalName: 'e.md', bytes: Buffer.alloc(0) }],
      ['10MiB+1', { originalName: 'big.txt', bytes: Buffer.alloc(10 * 1024 * 1024 + 1, 65) }],
      ['ext-mime', { originalName: 'x.png', declaredMediaType: 'application/pdf', bytes: Buffer.from('not-png') }],
      ['magic', { originalName: 'x.png', declaredMediaType: 'image/png', bytes: Buffer.from('not-png') }],
      ...['html', 'svg', 'exe', 'sh'].map(ext => [ext, { originalName: 'x.' + ext, bytes: Buffer.from('MZ') }]),
      ['NUL', { originalName: 'x.txt', bytes: Buffer.from([65, 0, 66]) }],
      ['invalid-UTF8', { originalName: 'x.txt', bytes: Buffer.from([255, 254]) }],
      ['script', { originalName: 'x.md', bytes: Buffer.from('<script>alert(1)</script>') }],
    ]) await check('RA-F03/AUTO-' + label, '真实暂存安全拒绝、DB/字节零写', () => zero(f4, async () => {
      let error
      try { await stageUpload(input) } catch (e) { error = e }
      assert.ok(error instanceof FileAssetRejectedError)
      return { name: input.originalName, size: input.bytes.length, status: error.status, error: error.message }
    }))
    await check('RA-F03/AUTO-allowlist', '实际所有扩展名白名单，二进制只验magic语义非完整图片解码', async () => {
      const binary = {
        'image/png': Buffer.from('89504e470d0a1a0a0102', 'hex'), 'image/jpeg': Buffer.from('ffd8ffe000', 'hex'),
        'image/gif': Buffer.from('GIF89a00'), 'image/webp': Buffer.from('RIFF1234WEBP'),
        'application/pdf': Buffer.from('%PDF-1.4\n%%EOF'),
      }
      return zero(f4, () => [...FILE_ASSET_DEFAULTS.allowExtensions].map(([ext, type]) => {
        const v = validateUploadedFile({ originalName: 'allow' + ext, declaredMediaType: type, bytes: binary[type] ?? note })
        assert.equal(v.mediaType, type)
        return { ext, mediaType: v.mediaType, sha256: v.sha256, size: v.size }
      }))
    })
    await check('RA-F03/AUTO-10MiB-boundary', '恰10MiB合法UTF8接受，验证器只读零写', () => zero(f4, () => {
      const v = validateUploadedFile({ originalName: 'exact.txt', bytes: Buffer.alloc(10 * 1024 * 1024, 65) })
      assert.equal(v.size, 10 * 1024 * 1024)
      return { size: v.size, sha256: v.sha256 }
    }))
    await check('RA-F02/AUTO-request-abort', '生产upload监听已安装后发aborted，真实库和字节零写', () => zero(f4, async () => {
      let release
      const request = req('POST', { 'x-pm-file-name': 'abort.md' })
      request[Symbol.asyncIterator] = async function* () { await new Promise(resolve => { release = resolve }); yield note }
      const response = res()
      const pending = buildAssetRoutes({ getDomain: () => fd, auth: { requestRejection: () => undefined } }).upload(request, response)
      assert.ok(request.listenerCount('aborted') > 0)
      request.emit('aborted')
      release()
      await pending
      assert.equal(response.statusCode, 400)
      assert.equal(JSON.parse(response.body).error.code, 'request_aborted')
      return { status: response.statusCode, response: response.body.toString() }
    }))
    await check('RA-F03/AUTO-streaming-limit', '无content-length真实流超10MiB拒绝零写', () => zero(f4, async () => {
      const response = res()
      await buildAssetRoutes({ getDomain: () => fd, auth: { requestRejection: () => undefined } })
        .upload(req('POST', { 'x-pm-file-name': 'stream.txt' }, [Buffer.alloc(10 * 1024 * 1024, 65), Buffer.from('B')]), response)
      assert.equal(response.statusCode, 413)
      return { status: response.statusCode, response: response.body.toString() }
    }))
    await check('RA-F03/AUTO-path-final', '路径穿越/绝对/最终节点symlink拒绝', async () => {
      const external = path.join(f4.base, 'outside')
      fs.mkdirSync(external, { recursive: true })
      fs.symlinkSync(external, path.join(f4.files, 'final-link'))
      const result = await zero(f4, async () => {
        for (const rel of ['../../escape', external, 'final-link']) await assert.rejects(() => resolveWithinRoot(f4.files, rel), FileAssetRejectedError)
        return { paths: ['../../escape', external, 'final-link'] }
      })
      fs.unlinkSync(path.join(f4.files, 'final-link'))
      return result
    })
    await check('RA-F03/AUTO-parent-symlink', '祖先hash目录symlink也必须拒绝，external仍在自有tmp', async () => {
      const external = path.join(f4.base, 'outside-parent')
      fs.mkdirSync(external, { recursive: true })
      const v = validateUploadedFile({ originalName: 'ancestor.md', bytes: Buffer.from('unique ancestor qa') })
      const hashDir = path.join(f4.files, v.sha256.slice(0, 2))
      fs.symlinkSync(external, hashDir)
      try {
        await assert.rejects(() => storeAssetBuffer(f4.files, v), FileAssetRejectedError)
        assert.deepEqual(manifest(external), {})
      } finally { fs.unlinkSync(hashDir) }
      return { external: manifest(external) }
    })
    await check('RA-F03/AUTO-root-symlink', 'file root本身symlink也按声明拒绝，external仅自有tmp', async () => {
      const outside = path.join(f4.base, 'root-outside'), linked = path.join(f4.base, 'root-link')
      fs.mkdirSync(outside, { recursive: true })
      fs.symlinkSync(outside, linked)
      try {
        const v = validateUploadedFile({ originalName: 'root.md', bytes: Buffer.from('root symlink unique') })
        await assert.rejects(() => storeAssetBuffer(linked, v), FileAssetRejectedError)
        assert.deepEqual(manifest(outside), {})
      } finally { fs.unlinkSync(linked) }
      return { outside: manifest(outside) }
    })
    for (const mode of ['existing', 'missing']) await check('RA-F03/AUTO-root-parent-' + mode, '配置根上层symlink的' + mode + ' root必须拒绝且外部零写', async () => {
      const outside = path.join(f4.base, 'root-parent-outside-' + mode), linked = path.join(f4.base, 'root-parent-link-' + mode)
      fs.mkdirSync(outside, { recursive: true })
      if (mode === 'existing') fs.mkdirSync(path.join(outside, 'files'))
      fs.symlinkSync(outside, linked)
      const before = manifest(outside)
      try {
        const v = validateUploadedFile({ originalName: 'parent.md', bytes: Buffer.from('parent root ' + mode) })
        await assert.rejects(() => storeAssetBuffer(path.join(linked, 'files'), v), FileAssetRejectedError)
        assert.deepEqual(manifest(outside), before)
      } finally { fs.unlinkSync(linked) }
      return { mode, before, after: manifest(outside) }
    })
    await check('RA-F03/AUTO-old-root-parent-counterexample', '旧冻结生产340c根上层symlink反证确会写到root外，全在自有tmp', async () => {
      assert.ok(process.env.QA_PREVIOUS_ASSET, '仅使用本专家前轮自有冻结输出副本')
      const old = await import(process.env.QA_PREVIOUS_ASSET)
      const outside = path.join(f4.base, 'old-parent-outside'), linked = path.join(f4.base, 'old-parent-link')
      fs.mkdirSync(outside, { recursive: true })
      fs.symlinkSync(outside, linked)
      try {
        const v = old.validateUploadedFile({ originalName: 'oldparent.md', bytes: Buffer.from('old parent counterexample') })
        const actual = await old.storeAssetBuffer(path.join(linked, 'files'), v)
        assert.ok(fs.existsSync(path.join(outside, 'files', actual.relPath)))
        return { previousFrozenSource: '340c6c1bce59baf5513fce21d1d00fe3b440ea48b9cffb0ceb7da63279f747f2',
          actual, outside: manifest(outside), scope: '旧函数反例不是当前source PASS，不触正式或其他role根' }
      } finally { fs.unlinkSync(linked) }
    })
    await check('RA-F03/AUTO-Darwin-tmp-alias', 'Darwin固定tmp父alias合法，不允许任意home/user symlink', async () => {
      assert.equal(process.platform, 'darwin')
      const root = path.join(own.replace('/private/tmp/', '/tmp/'), 'darwin-alias-files')
      const v = validateUploadedFile({ originalName: 'alias.md', bytes: Buffer.from('platform tmp alias allowed') })
      const actual = await storeAssetBuffer(root, v)
      assert.equal(bytesSha(await readAssetBuffer(root, actual.relPath)), v.sha256)
      return { root, actual, parentRealPath: fs.realpathSync('/tmp') }
    })
    await check('RA-F03/AUTO-unconfigured', '生产无配置upload fail-closed不触正式根', async () => {
      const keys = ['DSH_PM_FILE_ROOT', 'DSH_PM_ISOLATED_ROOT', 'DSH_HOME', 'NODE_ENV', 'DSH_DEV']
      const old = Object.fromEntries(keys.map(k => [k, process.env[k]]))
      keys.forEach(k => delete process.env[k]); process.env.NODE_ENV = 'production'
      try {
        await assert.rejects(() => resolveFileRoot(), FileRootUnavailableError)
        return await zero(f4, async () => {
          const r = res()
          await buildAssetRoutes({ getDomain: () => fd, auth: { requestRejection: () => undefined } })
            .upload(req('POST', { 'x-pm-file-name': 'qa.md', 'x-pm-media-type': 'text/markdown' }, [note]), r)
          assert.equal(r.statusCode, 400); assert.match(r.body.toString(), /文件根未配置/)
          return { status: r.statusCode, error: r.body.toString() }
        })
      } finally { for (const k of keys) old[k] === undefined ? delete process.env[k] : process.env[k] = old[k] }
    })
    await check('RA-F04/AUTO', '生产下载路由+真实库与文件；gate adapter非宿主认证GUI', () => zero(f4, async () => {
      const allowed = await download(f4, fi.ASSET, fi.FILE_TASK, { requestRejection: () => undefined })
      assert.equal(allowed.status, 200); assert.equal(allowed.sha256, bytesSha(note))
      assert.equal(allowed.headers['x-content-type-options'], 'nosniff')
      assert.equal(allowed.headers['cache-control'], 'no-store')
      assert.ok(allowed.headers['content-disposition'].startsWith("attachment; filename*=UTF-8''"))
      const denied = await download(f4, fi.ASSET, fi.FILE_TASK, undefined)
      assert.equal(denied.status, 401)
      const forbidden = await download(f4, fi.ASSET, fi.FILE_TASK, { requestRejection: () => 403 })
      assert.equal(forbidden.status, 403)
      return { allowed, denied, forbidden }
    }))
    await check('RA-F04/AUTO-unbound', '已授权但未绑定或跨项目任务不可凭assetID获取源字节', () => zero(f4, async () => {
      const gate = { requestRejection: () => undefined }
      const outputs = []
      for (const tid of [fi.BT, fi.T, 't-9999']) {
        const out = await download(f4, fi.ASSET, tid, gate)
        assert.notEqual(out.status, 200)
        assert.notEqual(out.sha256, bytesSha(note))
        outputs.push(out)
      }
      return outputs
    }))
    await check('RA-F04/AUTO-Chinese-filename', '生产upload净化中文空格名并以RFC5987安全download', async () => {
      const original = 'QA 中文 空格.md', content = Buffer.from('Chinese filename unique')
      const response = res()
      await buildAssetRoutes({ getDomain: () => fd, auth: { requestRejection: () => undefined } }).upload(
        req('POST', { 'x-pm-task-id': fi.T, 'x-pm-project-id': fi.A, 'x-pm-file-name': encodeURIComponent('../' + original),
          'x-pm-media-type': 'text/markdown' }, [content]), response)
      assert.equal(response.statusCode, 200)
      const asset = JSON.parse(response.body)
      const out = await download(f4, asset.assetId, fi.T, { requestRejection: () => undefined })
      assert.equal(out.status, 200)
      assert.equal(out.sha256, bytesSha(content))
      assert.equal(decodeURIComponent(out.headers['content-disposition'].split("UTF-8''")[1]), original)
      return { asset, original, sourceSha256: bytesSha(content), download: out }
    })
    await check('RA-F05/AUTO', '同项目共享源断联不删、GC按元数据而非task refs；dry/apply只孤儿', async () => {
      process.env.DSH_PM_FILE_ROOT = f4.files
      const shared = await addTask(fd, { projectId: fi.A, title: '共享文件第二任务' })
      await attachFileToTask(fd, shared.id, { originalName: '共享 中文 名.md', declaredMediaType: 'text/markdown', bytes: note })
      const sourceAssetCount = tableRows(fd, 'file_assets').length
      const firstAt = getTask(fd, fi.FILE_TASK).attachments.find(a => a.kind === 'file').id
      await command(fd, 'material', `remove ${fi.FILE_TASK} ${firstAt}`)
      assert.equal((await download(f4, fi.ASSET, shared.id, { requestRejection: () => undefined })).sha256, bytesSha(note))
      await command(fd, 'material', `remove ${shared.id} ${getTask(fd, shared.id).attachments[0].id}`)
      assert.equal(tableRows(fd, 'file_assets').length, sourceAssetCount)
      const orphan = await storeAssetBuffer(f4.files, validateUploadedFile({ originalName: 'orphan.md', bytes: note2 }))
      const before = manifest(f4.files)
      const dry = await gcOrphanAssets(fd, { graceMs: 0 })
      assert.deepEqual(manifest(f4.files), before)
      assert.ok(dry.orphans.includes(orphan.relPath))
      const applied = await gcOrphanAssets(fd, { apply: true, graceMs: 0 })
      assert.ok(applied.removed.includes(orphan.relPath))
      assert.deepEqual(await readAssetBuffer(f4.files, fd.table('file_assets').get(fi.ASSET).relPath), note)
      await attachFileToTask(fd, fi.T, { originalName: 'qa-note.md', bytes: note })
      fi.SHARED = shared.id
      return { dry, applied, gcReferenceSource: 'file_assets metadata', finalFiles: manifest(f4.files), task: getTask(fd, fi.T) }
    })
    await check('RA-F01/AUTO-file-alias', '主保存file别名可供进展refs，失败不得留下已提升字节', async () => {
      process.env.DSH_PM_FILE_ROOT = f4.files
      const stage = await stageUpload({ originalName: 'file-alias.md', bytes: Buffer.from('file alias own bytes') })
      const saved = await addTask(fd, { projectId: fi.A, title: 'file alias expected', draft: {
        attachmentOps: [{ op: 'addFile', stageId: stage.stageId, clientId: 'c-file' }],
        progressOps: [{ op: 'add', author: '甲', content: '引用真文件', refs: ['c-file'] }] } })
      assert.deepEqual(saved.progressLog[0].revisions[0].refs, [saved.attachments[0].id])
      return { saved }
    })
    await check('RA-F01/AUTO-two-file-alias', '同hash两file别名解析同最终at-ID、refs去重且只一个资产', async () => {
      process.env.DSH_PM_FILE_ROOT = f4.files
      const bytes = Buffer.from('same-hash two alias unique')
      const a = await stageUpload({ originalName: 'a.md', bytes }), b = await stageUpload({ originalName: 'b.txt', bytes })
      const t = await addTask(fd, { projectId: fi.A, title: '两filealias', draft: {
        attachmentOps: [{ op: 'addFile', stageId: a.stageId, clientId: 'c-f1' }, { op: 'addFile', stageId: b.stageId, clientId: 'c-f2' }],
        progressOps: [{ op: 'add', author: '甲', content: '两alias同源', refs: ['c-f1', 'c-f2'] }] } })
      assert.equal(t.attachments.length, 1)
      assert.ok(t.progressLog[0].revisions[0].refs.every(ref => ref === t.attachments[0].id))
      assert.equal(Object.keys(manifest(f4.files)).filter(rel => !rel.startsWith('staging/') && rel.includes(bytesSha(bytes))).length, 1)
      for (const stage of [a, b]) await assert.rejects(() => readStage(stage.stageId), StageNotFoundError)
      return { t }
    })
    await check('RA-J03/AUTO-prepare-second-stage', '首file已prepare后第二非法stage拒绝，无新final字节且首stage保留', async () => {
      process.env.DSH_PM_FILE_ROOT = f4.files
      const a = await stageUpload({ originalName: 'prepare.md', bytes: Buffer.from('prepare then missing stage unique') })
      return zero(f4, async () => {
        await assert.rejects(() => addTask(fd, { projectId: fi.A, title: '第二stage缺失', draft: {
          attachmentOps: [{ op: 'addFile', stageId: a.stageId }, { op: 'addFile', stageId: 'bad-stage' }] } }), /stageId/)
        return { stagePreserved: await readStage(a.stageId) }
      })
    })
    await check('RA-J03/AUTO-partial-db-failure', '真实asset已put后task put一次故障，回滚metadata/final且stage保留', async () => {
      process.env.DSH_PM_FILE_ROOT = f4.files
      const a = await stageUpload({ originalName: 'partial.md', bytes: Buffer.from('partial put own unique') })
      const table = fd.table('tasks'), put = table.put.bind(table)
      let injected = false
      // 仅真实DomainTable写缝一次故障，其余存储/领域/回滚皆为生产对象。
      table.put = async (...args) => { if (!injected) { injected = true; throw new Error('QA一次task put故障') }; return put(...args) }
      try {
        const observed = await zero(f4, async () => {
          await assert.rejects(() => addTask(fd, { projectId: fi.A, title: 'partial失败不半建', draft: {
            attachmentOps: [{ op: 'addFile', stageId: a.stageId }] } }), /QA一次task put故障/)
          return { stagePreserved: await readStage(a.stageId) }
        })
        assert.ok(injected)
        return observed
      } finally { table.put = put }
    })
    await check('RA-J03/AUTO-atomic-failure', '新建含文件+末尾坏op整批拒绝且不留最终孤儿字节', async () => {
      process.env.DSH_PM_FILE_ROOT = f4.files
      const stage = await stageUpload({ originalName: 'bad-last.md', bytes: Buffer.from('atomic last bad unique') })
      return zero(f4, async () => {
        await assert.rejects(() => addTask(fd, { projectId: fi.A, title: '失败不半建', draft: {
          attachmentOps: [{ op: 'addFile', stageId: stage.stageId }],
          progressOps: [{ op: 'add', author: '', content: '坏作者' }] } }), /作者/)
        return { retainedStage: await readStage(stage.stageId) }
      })
    })
    await check('RA-F01/AUTO-edit-file', '已存任务basic+file主save合法时应原子挂文件', async () => {
      process.env.DSH_PM_FILE_ROOT = f4.files
      const stage = await stageUpload({ originalName: 'edit-file.md', bytes: Buffer.from('edit file unique') })
      const before = getTask(fd, fi.T)
      await command(fd, 'task', `update ${fi.T} ${JSON.stringify({ title: '编辑加文件',
        draft: { attachmentOps: [{ op: 'addFile', stageId: stage.stageId }] } })}`)
      const after = getTask(fd, fi.T)
      assert.equal(after.title, '编辑加文件')
      assert.equal(after.attachments.length, before.attachments.length + 1)
      return { before, after }
    })
    await check('F4/AUTO-valid-fixture', 'F4真实文件标准包，纯负例残留不当合法包材料', async () => {
      // F4包仅取元数据声明的成功资产；stage/故障孤儿不进备份。
      return packageFixture(f4, 'F4')
    })

    const r = await seed('reports'), rd = r.domain, ri = r.ids
    const params = { projectId: ri.A, periodStart: D2, periodEnd: D }
    let frozenReport, currentRefReport
    await check('RA-R01/AUTO-preview', '预览复合三元组、不跨项目、不含软删、零写', () => zero(r, () => {
      const p = previewProgressReport(rd, params)
      assert.deepEqual(p.candidates.map(c => c.entryId).sort(), [ri.E1, ri.E3].sort())
      assert.ok(p.candidates.every(c => c.taskId === ri.T))
      const exact = previewProgressReport(rd, { ...params, selectedRefs: [{ taskId: ri.T, entryId: ri.E1, revisionId: 'rv-3' }] })
      assert.equal(exact.candidates.length, 1)
      return { all: p, exact }
    }))
    await check('RA-R01/AUTO-stale-selected-rejected', 'B6冻结合同旧rv2 selectedRefs拒绝且DB/字节零写，不静默抓最新', () => zero(r, async () => {
      await assert.rejects(() => generateProgressReport(rd, { ...params, selectedRefs: [
        { taskId: ri.T, entryId: ri.E1, revisionId: 'rv-2' }, { taskId: ri.T, entryId: ri.E3, revisionId: 'rv-1' }] }), /源已更新.*请重新预览/)
      return { rejectedRevision: 'rv-2', currentRevision: 'rv-3' }
    }))
    await check('RA-R01/AUTO-current-selected-save', '当前rv3+E3复合选择经真实report命令save冻结作者/日期/正文', async () => {
      await command(rd, 'report', `generate ${ri.A} ${D2} ${D} ${JSON.stringify({ selectedRefs: [
        { taskId: ri.T, entryId: ri.E1, revisionId: 'rv-3' }, { taskId: ri.T, entryId: ri.E3, revisionId: 'rv-1' }] })}`)
      currentRefReport = tableRows(rd, 'reports').at(-1)
      assert.equal(currentRefReport.excerpts.length, 2)
      const e1 = currentRefReport.excerpts.find(e => e.entryId === ri.E1)
      assert.equal(e1.revisionId, 'rv-3'); assert.equal(e1.contentSnapshot, 'E1 rv3正文')
      assert.equal(e1.author, '测试甲'); assert.equal(e1.date, D)
      return currentRefReport
    })
    await check('RA-R01/AUTO-explicit-excerpts', '真实历史版excerpts直路径存在/作者/日期吻合可冻结', async () => {
      const t = getTask(rd, ri.T)
      const picked = [[ri.E1, 'rv-2'], [ri.E3, 'rv-1']].map(([entryId, rev], n) => {
        const rv = t.progressLog.find(e => e.id === entryId).revisions.find(v => v.id === rev)
        return { id: 'ex-' + (n + 1), taskId: ri.T, sourceKind: 'progress', entryId, revisionId: rev,
          contentSnapshot: rv.content, author: rv.author, date: rv.date, capturedAt: new Date().toISOString() }
      })
      frozenReport = await generateProgressReport(rd, { ...params, title: 'rv2固定汇报', excerpts: picked })
      assert.deepEqual(frozenReport.excerpts, picked)
      return frozenReport
    })
    for (const [name, options] of [
      ['mutex', { selectedRefs: [], excerpts: [] }],
      ['unknown-rev', { selectedRefs: [{ taskId: ri.T, entryId: ri.E1, revisionId: 'rv-99' }] }],
      ['cross-project', { selectedRefs: [{ taskId: ri.BT, entryId: ri.BE }] }],
      ['soft-deleted', { selectedRefs: [{ taskId: ri.T, entryId: ri.E2 }] }],
    ]) await check('RA-R02/AUTO-' + name, '真实report命令非法refs/互斥拒绝及零写', () => zero(r,
      () => command(rd, 'report', `generate ${ri.A} ${D2} ${D} ${JSON.stringify(options)}`, 'error')))
    await check('RA-R02/AUTO-forged', '真实excerpts伪作者/正文/日期逐项拒绝零写', async () => {
      return Promise.all([]).then(async () => {
        const outputs = []
        for (const patch of [{ author: '伪作者' }, { date: D }, { contentSnapshot: '伪正文' }]) {
          outputs.push(await zero(r, async () => {
            await assert.rejects(() => generateProgressReport(rd, { ...params, excerpts: [{ ...frozenReport.excerpts[0], ...patch }] }), /不符|伪造/)
            return patch
          }))
        }
        return outputs
      })
    })
    await check('RA-R03/AUTO', '源新版本/作者/软删后旧报告snapshot+摘录+导出不变', async () => {
      const before = getProgressReport(rd, frozenReport.id), md = renderProgressReportMarkdown(before)
      const selectedBefore = clone(getProgressReport(rd, currentRefReport.id))
      await progressEditRevision(rd, ri.T, ri.E1, { author: '改源作者', content: 'E1 rv4后改' })
      await progressSoftDelete(rd, ri.T, ri.E1)
      assert.deepEqual(getProgressReport(rd, currentRefReport.id), selectedBefore)
      assert.deepEqual(getProgressReport(rd, before.id), before)
      assert.equal(renderProgressReportMarkdown(getProgressReport(rd, before.id)), md)
      const updated = await updateProgressReport(rd, before.id, { title: '仅改报告标题', executiveSummary: '仅改MD' })
      assert.deepEqual(updated.excerpts, before.excerpts); assert.deepEqual(updated.snapshot, before.snapshot)
      return { before, after: updated, markdownBefore: md, selectedBefore,
        selectedAfter: getProgressReport(rd, currentRefReport.id) }
    })
    await check('RA-R04/AUTO', 'sourceType枚举/session非空/manual-null/真实绑定及update来源只读', async () => {
      const binding = await bindSession(rd, { taskId: ri.T, sessionId: 'qa-materials-local-session', note: '自有合法来源' })
      const out = []
      for (const options of [{ sourceType: 'other' }, { sourceType: 'session' },
        { sourceType: 'session', sourceSessionId: '' }, { sourceType: 'session', sourceSessionId: '  ' },
        { sourceType: 'manual', sourceSessionId: 'bad' }]) {
        out.push(await zero(r, () => command(rd, 'report', `generate ${ri.A} ${D2} ${D} ${JSON.stringify(options)}`, 'error')))
      }
      const manual = await generateProgressReport(rd, params)
      const session = await generateProgressReport(rd, { ...params, sourceType: 'session', sourceSessionId: ' qa-materials-local-session ' })
      assert.equal(manual.sourceType, 'manual'); assert.equal(manual.sourceSessionId, null)
      assert.equal(session.sourceType, 'session'); assert.equal(session.sourceSessionId, 'qa-materials-local-session')
      for (const options of [{ sourceType: 'manual' }, { sourceSessionId: 'changed' }]) {
        out.push(await zero(r, () => command(rd, 'report', `update ${session.id} ${JSON.stringify(options)}`, 'error')))
      }
      const saved = await updateProgressReport(rd, session.id, { title: '保session标题', executiveSummary: 'MD变更' })
      assert.equal(saved.sourceType, session.sourceType); assert.equal(saved.sourceSessionId, session.sourceSessionId)
      r.ids.SESSION_REPORT = session.id; r.ids.MANUAL_REPORT = manual.id; r.ids.SESSION_BIND = binding
      return { binding, manual, session, saved, negative: out }
    })
    await check('RA-R05/AUTO-export', '固定MD导出字节与覆盖守卫；Web/plain为project出口非report出口', async () => {
      const md = '|A|B|\n|---|---|\n|1|2|\n\n```js\n<script>不可执行</script>\n```\n\n[坏](javascript:alert(1))'
      const saved = await updateProgressReport(rd, frozenReport.id, { executiveSummary: md })
      const dir = 'reports'
      const out = await exportProgressReportMarkdown(rd, saved.id, dir)
      assert.equal(fs.readFileSync(out.path, 'utf8'), out.content)
      assert.equal(out.content, renderProgressReportMarkdown(saved))
      await assert.rejects(() => exportProgressReportMarkdown(rd, saved.id, dir), /已存在/)
      const overwrite = await exportProgressReportMarkdown(rd, saved.id, dir, true)
      assert.equal(overwrite.content, out.content)
      const web = await exportProjectWeb(rd, ri.A, 'web')
      const plain = await exportProjectPlain(rd, ri.A, 'plain')
      assert.ok(!fs.readFileSync(web.path, 'utf8').includes('href="javascript:'))
      return { report: saved, markdown: { path: out.path, sha256: sha(out.path) },
        projectWeb: { path: web.path, sha256: sha(web.path) }, projectPlain: { path: plain.path, sha256: sha(plain.path) } }
    })

    const f5 = await seed('fixture-F5'), bd = f5.domain, bi = f5.ids
    process.env.DSH_PM_FILE_ROOT = f5.files
    const share = await addTask(bd, { projectId: bi.A, title: 'F5共享文件任务' })
    const attached = await attachFileToTask(bd, bi.T, { originalName: 'QA 中文 文件.md', bytes: note })
    await attachFileToTask(bd, share.id, { originalName: 'copy.md', bytes: note })
    await attachFileToTask(bd, bi.T, { originalName: 'version-two.md', bytes: note2 })
    bi.SHARED_TASK = share.id; bi.ASSET = attached.asset.id
    await addRiskIssue(bd, { projectId: bi.A, type: 'risk', title: 'F5风险', probability: 'medium', impact: 'high' })
    await addMeeting(bd, { projectId: bi.A, title: 'F5会议', meetingDate: D, decisions: ['保留标准来源'] })
    const okr = await addOkr(bd, bi.A, { title: 'F5目标', kind: 'objective' })
    const habit = await addHabit(bd, bi.A, { title: 'F5习惯', okrId: okr.id })
    const lesson = await addLesson(bd, { projectId: bi.A, taskId: bi.T, markdown: '- 已核：备份需保留原字节' })
    const reflection = await ensureReflectionOnDone(bd, { ...getTask(bd, bi.T), status: 'done' })
    const binding = await bindSession(bd, { taskId: bi.T, sessionId: 'qa-f5-session', note: '宿主表不备份' })
    const report = await generateProgressReport(bd, { projectId: bi.A, periodStart: D2, periodEnd: D,
      sourceType: 'session', sourceSessionId: 'qa-f5-session' })
    bi.OKR = okr.id; bi.HABIT = habit.id; bi.LESSON = lesson.id; bi.REFLECTION = reflection?.id; bi.REPORT = report.id; bi.SESSION = binding
    // 真实settings写动作：显式项目导出的生产出站审计。pilot实际是localStorage，不造同名DB设置。
    const fixtureExport = await exportProjectMarkdown(bd, bi.A, 'F5-audit')
    let pkg5
    await check('F5/AUTO-valid-fixture', 'core7+extra6真实记录/共享引用/字节标准包', async () => {
      pkg5 = await packageFixture(f5, 'F5')
      return { ...pkg5, backupTables: BACKUP_TABLES, extraTables: EXTRA_BACKUP_TABLES,
        excluded: ['sessions', 'checks'], settingsWrite: 'exportProjectMarkdown真实出站审计', fixtureExport }
    })
    await check('RA-J06/AUTO-content-file-restore', '当前GUI使用restore-content合法F5必须可恢复文件，不能凭路径restore绿替代', async () => {
      const q = await open('gui-content-restore'), raw = fs.readFileSync(pkg5.path, 'utf8')
      const preview = await zero(q, () => handleBackupCommand('restore-content ' + JSON.stringify(raw), q.domain))
      assert.equal(preview.observed.kind, 'success')
      const before = { db: jsonValue(db(q.domain)), data: manifest(q.root), files: manifest(q.files) }
      const observed = await handleBackupCommand('restore-content ' + JSON.stringify(raw) + ' confirm', q.domain)
      await barrier(q.domain)
      const after = { db: jsonValue(db(q.domain)), data: manifest(q.root), files: manifest(q.files) }
      const confirmation = { before, after, observed }
      save('content-restore-observation.json', { preview, confirmation, backupPath: pkg5.path })
      if (observed.kind !== 'success') assert.deepEqual(after, before, '恢复失败必须库/字节零写')
      assert.equal(observed.kind, 'success', observed.text)
      assert.equal(tableRows(q.domain, 'file_assets').length, 2)
      for (const row of tableRows(q.domain, 'file_assets')) assert.equal(bytesSha(await readAssetBuffer(q.files, row.relPath)), row.sha256)
      return { preview, confirmation }
    })
    await check('RA-F07/AUTO-content-precheck-path', 'JSON-only预检可识别越界relPath，须在confirm前拒绝', async () => {
      const q = await open('content-precheck'), b = await readBackupFile(pkg5.path)
      b.extra.file_assets[0][1].relPath = '../outside'
      const observed = await zero(q, () => handleBackupCommand('restore-content ' + JSON.stringify(JSON.stringify(b)), q.domain))
      save('content-precheck-observation.json', observed)
      assert.equal(observed.observed.kind, 'error', observed.observed.text)
      return observed
    })
    const target = await open('restore-empty'), td = target.domain
    await check('RA-F06/AUTO', '空目标restore逐core/extra+共享多revision/软删/字节一致', async () => {
      const parsed = await readBackupFile(pkg5.path)
      await restoreBackup(td, pkg5.path, path.join(target.base, 'backups'))
      const expected = jsonValue(db(bd))
      // JSON落盘按格式省略undefined；比较全部有值字段，不把省略可选键误作数据丢失。
      for (const name of [...BACKUP_TABLES, ...EXTRA_BACKUP_TABLES]) assert.deepEqual(jsonValue(db(td)[name]), expected[name])
      for (const row of tableRows(td, 'file_assets')) assert.equal(bytesSha(await readAssetBuffer(target.files, row.relPath)), row.sha256)
      save('reopen.json', { ...target, domain: undefined, pid: process.pid, tables: db(td), manifest: manifest(target.files) })
      return { sourceCounts: pkg5.counts, actual: db(td), manifest: manifest(target.files), backup: parsed }
    })
    for (const name of ['hash', 'missing', 'relPath']) await check('RA-F07/AUTO-' + name, '独立包单点损坏预检拒绝且目标库/字节零写', async () => {
      const dir = path.join(own, 'corrupt-' + name)
      fs.mkdirSync(dir, { recursive: true })
      const src = await readBackupFile(pkg5.path), p = path.join(dir, 'backup.json'), side = p + '.files.' + src.fileBundleId
      fs.copyFileSync(pkg5.path, p)
      fs.cpSync(pkg5.path + '.files.' + src.fileBundleId, side, { recursive: true })
      const first = src.extra.file_assets[0][1]
      if (name === 'hash') fs.writeFileSync(path.join(side, first.relPath), Buffer.from('damaged'))
      if (name === 'missing') fs.unlinkSync(path.join(side, first.relPath))
      if (name === 'relPath') {
        src.extra.file_assets[0][1].relPath = '../outside'
        fs.writeFileSync(p, JSON.stringify(src))
        const mp = path.join(side, 'manifest.json'), m = JSON.parse(fs.readFileSync(mp))
        m.jsonSha256 = backupJsonSha(fs.readFileSync(p, 'utf8')); m.files[0].relPath = '../outside'
        fs.writeFileSync(mp, JSON.stringify(m))
      }
      process.env.DSH_PM_FILE_ROOT = target.files
      return zero(target, async () => { await assert.rejects(() => restoreBackup(td, p, path.join(target.base, 'backups')), /损坏|缺失|越界|路径/)
        return { damagedCopy: p, negative: name } })
    })
    for (const seam of ['table-write', 'byte-promotion']) await check('RA-F07/AUTO-rollback-' + seam, '真实JSON库中途故障回滚，安全快照可核，不替身domain', async () => {
      const q = await open('rollback-' + seam), qd = q.domain
      const old = await addProject(qd, { name: '恢复前真实项目', startDate: '2026-01-01', targetDate: '2026-12-31' })
      const qt = await addTask(qd, { projectId: old.id, title: '恢复前真实任务' })
      await attachFileToTask(qd, qt.id, { originalName: 'shared.md', bytes: note })
      const before = db(qd), beforeFiles = manifest(q.files)
      const b = await readBackupFile(pkg5.path), raw = fs.readFileSync(pkg5.path, 'utf8')
      let injected = false
      const hook = seam === 'table-write' ? { onWrite: () => { if (!injected) { injected = true; throw new Error('QA一次落盘后故障') } } }
        : { onPromoteBytes: () => { if (!injected) { injected = true; throw new Error('QA一次新字节提升后故障') } } }
      await assert.rejects(() => applyBackup(qd, b, path.join(q.base, 'backups'), hook, pkg5.path, backupJsonSha(raw)), /已自动回滚/)
      assert.ok(injected); assert.deepEqual(db(qd), before); assert.deepEqual(manifest(q.files), beforeFiles)
      const snapshots = fs.readdirSync(path.join(q.base, 'backups')).filter(n => n.endsWith('.json'))
      assert.equal(snapshots.length, 1)
      const safety = await readBackupFile(path.join(q.base, 'backups', snapshots[0]))
      assert.equal(safety.projects[0].name, old.name)
      await precheckBackup(safety)
      return { injected, before, after: db(qd), files: manifest(q.files), safetySnapshot: safety }
    })
    await check('RA-F08/AUTO-legacy', '旧7表包恢复保extra，当前domain基本写保全；pilot切换为GUI未验', async () => {
      const q = await open('legacy-copy'), ld = q.domain
      await restoreBackup(ld, pkg5.path, path.join(q.base, 'backups'))
      const legacy = clone(collectBackup(ld))
      delete legacy.extra; delete legacy.fileBundleId
      legacy.reports.forEach(r => { delete r.sourceType; delete r.sourceSessionId })
      // 旧缺source必须合法标准precheck，实际JSON后端能否接收记录独立执行。
      await precheckBackup(legacy)
      const p = path.join(own, 'legacy.json')
      fs.writeFileSync(p, JSON.stringify(legacy))
      process.env.DSH_PM_FILE_ROOT = q.files
      const extraBefore = Object.fromEntries(EXTRA_BACKUP_TABLES.map(n => [n, clone([...ld.table(n).entries()])]))
      await restoreBackup(ld, p, path.join(q.base, 'backups'))
      assert.deepEqual(Object.fromEntries(EXTRA_BACKUP_TABLES.map(n => [n, [...ld.table(n).entries()]])), extraBefore)
      const before = getTask(ld, bi.T)
      await command(ld, 'task', `update ${bi.T} {"title":"pilot OFF basic保存"}`)
      const after = getTask(ld, bi.T)
      for (const k of ['attachments', 'progressLog', 'evidenceUrl', 'deliverableId']) assert.deepEqual(after[k], before[k])
      return { legacyPath: p, legacyExtraAbsent: true, before, after, extra: extraBefore }
    })
    await check('RA-F08/AUTO-historical-runtime', '历史v0.7.3独立core输出只读评估新键，拒绝不清键降版', async () => {
      assert.ok(process.env.QA_OLD_LIB, '历史core编译失败，不能假称历史runtime已验')
      const oldStorage = await import(path.join(process.env.QA_OLD_LIB, 'core/storage.js'))
      const oldTasks = await import(path.join(process.env.QA_OLD_LIB, 'core/tasks.js'))
      const oldTask = await import(path.join(process.env.QA_OLD_LIB, 'core/task.js'))
      const oldRoot = path.join(own, 'old-runtime-data')
      fs.cpSync(f5.root, oldRoot, { recursive: true })
      const before = manifest(oldRoot)
      assert.equal(oldTask.taskRecordSchema.safeParse(jsonValue(getTask(bd, bi.T))).success, false)
      const ctx = new Context()
      await ctx.plugin(Storage)
      ctx.storage.backend.register('json', new JsonStorageBackend(oldRoot))
      const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
      facilities.push(facility)
      let domain, openError, writeError
      try { domain = await facility.open(oldStorage.pmDomainSpec) } catch (e) { openError = String(e) }
      if (domain) {
        try { await oldTasks.updateTask(domain, bi.T, { title: '旧runtime不可清键保存' }) } catch (e) { writeError = String(e) }
        assert.ok(writeError, '旧runtime不接受新键时只能只读，不许落库丢新字段')
      }
      assert.deepEqual(manifest(oldRoot), before)
      return { oldTag: 'v0.7.3', openError, writeError, before, after: manifest(oldRoot),
        policy: '旧schema拒新keys；保原包只读，需forward fix。历史源core重编译非原发布bundle。' }
    })
    await check('RA-R03/AUTO-legacy-snapshot', '旧calcVersion缺键不回填、source归一只读再basic更新', async () => {
      const q = await seed('old-snapshot'), qd = q.domain, qi = q.ids
      const report = await generateProgressReport(qd, { projectId: qi.A, periodStart: D2, periodEnd: D })
      const backup = collectBackup(qd)
      delete backup.reports[0].snapshot.tasks.calcVersion
      await applyBackup(qd, backup, path.join(q.base, 'backups'))
      const read = await zero(q, () => getProgressReport(qd, report.id))
      assert.equal(Object.hasOwn(read.observed.snapshot.tasks, 'calcVersion'), false)
      const updated = await updateProgressReport(qd, report.id, { title: '旧快照只改标题' })
      assert.equal(Object.hasOwn(updated.snapshot.tasks, 'calcVersion'), false)
      return { read, updated }
    })
  }
} catch (e) {
  console.error('FATAL fixture/设施未完成：', e.stack)
  save('fatal.json', { error: e.stack })
  process.exitCode = 1
} finally {
  for (const facility of facilities) await facility.closeAll()
  save('results.json', rows); save('actions.json', actions)
  if (rows.some(r => r.status === 'FAIL')) process.exitCode = 1
}
