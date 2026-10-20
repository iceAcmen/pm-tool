/**
 * B2 任务资料区 attachments[] / 进展日志 progressLog[] 专项（隔离 DSH_HOME，零正式数据）。
 * 覆盖：link/deliverable 软引用与冻结快照、非法协议零写、P3 append revision 不改旧文、
 * 软删/restore 不丢 revision、done 材料双读不误报、备份往返新键保留、AI 白名单拒写。
 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { createBackup, restoreBackup } from '../lib/core/backup.js'
import { collectChecks } from '../lib/core/check.js'
import { validateActions } from '../lib/core/copilot.js'

delete process.env.DEEPSEEK_API_KEY
const ROOT_BASE = mkdtempSync(join(tmpdir(), 'pm-tool-b2-'))
const root = join(ROOT_BASE, 'data root')
const backupDir = join(ROOT_BASE, 'backup')

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })

async function run(raw) {
  return command.handler({ rawInput: raw, attachments: [] })
}

try {
  await apply(ctx)
  const domain = facility.get('pmtool')

  await run('project add {"name":"B2项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  await run('task add {"projectId":"p-0001","title":"任务一"}')
  await run('task add {"projectId":"p-0001","title":"裸完成任务"}')
  await run('deliverable add {"projectId":"p-0001","name":"交付物一","version":"v1.0","owner":"Ice","status":"in_progress"}')
  const dlvId = [...domain.table('deliverables').entries()][0][0]
  assert.ok(dlvId, '交付物应已创建')

  // 1) material link：合法链接落库；非法 ftp 拦截且零写。
  const ok = await run('material link t-0001 {"url":"https://example.com/spec","title":"规范","note":"评审稿"}')
  assert.equal(ok.kind, 'success', ok.text)
  let t1 = domain.table('tasks').get('t-0001')
  assert.equal(t1.attachments.length, 1)
  assert.equal(t1.attachments[0].kind, 'link')
  assert.equal(t1.attachments[0].url, 'https://example.com/spec')

  const bad = await run('material link t-0001 {"url":"ftp://example.com/f"}')
  assert.equal(bad.kind, 'error', '非法协议必须拒绝')
  t1 = domain.table('tasks').get('t-0001')
  assert.equal(t1.attachments.length, 1, '非法链接零写，不新增资料项')

  // C8：progressLog.refs 写时必须指向本任务 active attachments；不存在/已移除拒绝且零写。
  const linkAt = t1.attachments[0].id
  const c8badRef = await run('progress add t-0001 {"author":"C8","content":"悬空引用","refs":["at-99"]}')
  assert.equal(c8badRef.kind, 'error', '不存在的 at-N 引用必须拒绝')
  assert.equal(domain.table('tasks').get('t-0001').progressLog?.length ?? 0, 0, '悬空 refs 零写，日志不新增')
  const c8okRef = await run(`progress add t-0001 {"author":"C8","content":"合法引用","refs":["${linkAt}"]}`)
  assert.equal(c8okRef.kind, 'success', c8okRef.text)
  // 删除/摘除处理：先在一次性任务上挂链接再 remove，再引用已摘除项必须拒绝。
  await run('task add {"projectId":"p-0001","title":"C8一次性任务"}')
  const c8task = [...domain.table('tasks').entries()].find(([, t]) => t.title === 'C8一次性任务')[0]
  await run(`material link ${c8task} {"url":"https://z.com/c8"}`)
  const c8removedId = domain.table('tasks').get(c8task).attachments[0].id
  await run(`material remove ${c8task} ${c8removedId}`)
  const c8removed = await run(`progress add ${c8task} {"author":"C8","content":"引用已摘除","refs":["${c8removedId}"]}`)
  assert.equal(c8removed.kind, 'error', '已移除的 attachment 引用必须拒绝')
  assert.equal((domain.table('tasks').get(c8task).progressLog?.length ?? 0), 0, '已摘除 refs 零写')

  // 2) material deliverable：软引用 + 冻结版本快照；重复/不存在零写。
  const dlv = await run(`material deliverable t-0001 {"deliverableId":"${dlvId}","note":"验收"}`)
  assert.equal(dlv.kind, 'success', dlv.text)
  t1 = domain.table('tasks').get('t-0001')
  const dlvAtt = t1.attachments.find(a => a.kind === 'deliverable')
  assert.ok(dlvAtt, '应存在 deliverable 软引用')
  assert.equal(dlvAtt.frozenVersion, 'v1.0', '关联时刻冻结版本快照')
  assert.equal(dlvAtt.frozenName, '交付物一')

  const dup = await run(`material deliverable t-0001 {"deliverableId":"${dlvId}"}`)
  assert.equal(dup.kind, 'error', '重复关联必须拒绝')
  const missing = await run('material deliverable t-0001 {"deliverableId":"dlv-99"}')
  assert.equal(missing.kind, 'error', '不存在交付物必须拒绝')
  t1 = domain.table('tasks').get('t-0001')
  assert.equal(t1.attachments.filter(a => a.kind === 'deliverable').length, 1, '失败零写')

  // 2b) remove 仅从本任务数组摘除，绝不删交付物记录/源（A12）。
  const removed = await run(`material remove t-0001 ${dlvAtt.id}`)
  assert.equal(removed.kind, 'success', removed.text)
  t1 = domain.table('tasks').get('t-0001')
  assert.equal(t1.attachments.filter(a => a.kind === 'deliverable').length, 0, 'deliverable 软引用已摘除')
  assert.ok(domain.table('deliverables').get(dlvId), '交付物记录仍在，remove 不删源')
  // 摘除后可重新关联（软引用恢复，不影响台账）。
  await run(`material deliverable t-0001 {"deliverableId":"${dlvId}"}`)

  // 2c) 原子新建 draft：任务与两区同临界区落库；任一草稿非法 → 整批零写（任务也不创建）。
  const tasksBeforeCreate = [...domain.table('tasks').entries()].length
  const atomicCreate = await run('task add {"projectId":"p-0001","title":"新建带草稿","draft":{"attachments":[{"kind":"link","url":"https://x.com/plan","title":"计划"}],"progressLog":[{"author":"A","content":"启动说明","date":"2026-10-20"}]}}')
  assert.equal(atomicCreate.kind, 'success', atomicCreate.text)
  const newId = [...domain.table('tasks').entries()].filter(([, t]) => t.title === '新建带草稿')[0][0]
  let nt = domain.table('tasks').get(newId)
  assert.equal(nt.attachments.length, 1, '新建 draft 资料区同写')
  assert.equal(nt.progressLog.length, 1, '新建 draft 日志同写')
  assert.equal(nt.progressLog[0].revisions.length, 1)

  const badCreate = await run('task add {"projectId":"p-0001","title":"应失败不创建","draft":{"attachments":[{"kind":"link","url":"ftp://bad"}]}}')
  assert.equal(badCreate.kind, 'error', '非法草稿必须拒绝')
  assert.equal([...domain.table('tasks').entries()].length, tasksBeforeCreate + 1, '非法 draft 零写：任务未创建')

  // 2c2) 新建 ops 信封：clientId 别名前向解析，任务与两区同写，refs 指向新分配 at-N。
  const opsCreate = await run('task add {"projectId":"p-0001","title":"新建ops","draft":{"attachmentOps":[{"op":"addLink","clientId":"c-1","url":"https://x.com/alias"}],"progressOps":[{"op":"add","author":"A","content":"别名引用","refs":["c-1"]}]}}')
  assert.equal(opsCreate.kind, 'success', opsCreate.text)
  const opsTask = [...domain.table('tasks').entries()].find(([, t]) => t.title === '新建ops')[1]
  assert.equal(opsTask.attachments.length, 1, '新建 ops 资料区同写')
  assert.deepEqual(opsTask.progressLog[0].revisions[0].refs, [opsTask.attachments[0].id], 'clientId 别名解析为真实 at-N')

  // 2d) 原子 apply ops：增量落库保历史；非法 op → 现有数组原样保留（零写）。
  const commitOk = await run('material apply t-0001 {"attachmentOps":[{"op":"addLink","url":"https://y.com/spec","title":"规格"}],"progressOps":[{"op":"add","author":"B","content":"提交说明","date":"2026-10-20"}]}')
  assert.equal(commitOk.kind, 'success', commitOk.text)
  t1 = domain.table('tasks').get('t-0001')
  assert.ok(t1.attachments.some(a => a.kind === 'link' && a.url === 'https://y.com/spec'), 'apply 资料区落库')
  assert.ok(t1.progressLog.some(e => e.revisions.some(r => r.content === '提交说明')), 'apply 日志落库')
  const snapshotAtts = t1.attachments.length
  const snapshotLog = t1.progressLog.length
  // 非空任务 raw commit 被守卫拒绝（保护 P3 历史），零写。
  const badCommit = await run('material commit t-0001 {"progressLog":[{"author":"","content":"空作者"}]}')
  assert.equal(badCommit.kind, 'error', '非空任务 raw commit 必须拒绝且零写')
  t1 = domain.table('tasks').get('t-0001')
  assert.equal(t1.attachments.length, snapshotAtts, '非法 commit 资料区不变')
  assert.equal(t1.progressLog.length, snapshotLog, '非法 commit 日志不变')

  // 3) P3 progress：追加首版 → 编辑追加 revision，旧正文保留，current=最新（动态取条目 id，不假定 pl-1）。
  const added = await run('progress add t-0001 {"author":"Ice","content":"首版正文","date":"2026-10-20"}')
  assert.equal(added.kind, 'success', added.text)
  t1 = domain.table('tasks').get('t-0001')
  const iceEntry = t1.progressLog.find(e => e.author === 'Ice' && e.revisions[0].content === '首版正文')
  assert.ok(iceEntry, '首版条目已落库')
  assert.equal(iceEntry.revisions.length, 1)
  const iceId = iceEntry.id

  const edited = await run(`progress edit t-0001 ${iceId} {"author":"Ice","content":"修订正文"}`)
  assert.equal(edited.kind, 'success', edited.text)

  // A13：空 author / 空 content / 坏 JSON 首错拦截且零写（以快照计数对照，不假定固定条数）。
  t1 = domain.table('tasks').get('t-0001')
  const snapLog = t1.progressLog.length
  const snapRev = t1.progressLog.find(e => e.id === iceId).revisions.length
  const snapLink = t1.attachments.filter(a => a.kind === 'link').length
  const emptyAuthor = await run('progress add t-0001 {"author":"","content":"应被拒"}')
  assert.equal(emptyAuthor.kind, 'error', '空作者必须拒绝')
  const emptyContent = await run(`progress edit t-0001 ${iceId} {"content":"  "}`)
  assert.equal(emptyContent.kind, 'error', '空正文必须拒绝')
  const badJson = await run('material link t-0001 {not-json}')
  assert.equal(badJson.kind, 'error', '坏 JSON 必须拒绝且零写')
  t1 = domain.table('tasks').get('t-0001')
  assert.equal(t1.progressLog.length, snapLog, '空校验零写，日志条数不变')
  assert.equal(t1.progressLog.find(e => e.id === iceId).revisions.length, snapRev, '空编辑零写，修订版不变')
  assert.equal(t1.attachments.filter(a => a.kind === 'link').length, snapLink, '坏 JSON 零写，链接数不变')

  t1 = domain.table('tasks').get('t-0001')
  const entry = t1.progressLog.find(e => e.id === iceId)
  assert.equal(entry.revisions.length, 2, '编辑追加新 revision')
  assert.equal(entry.revisions[0].content, '首版正文', '旧正文不可覆盖')
  assert.equal(entry.revisions[1].content, '修订正文')
  assert.ok(entry.revisions[1].revisedAt, '新版带 revisedAt')

  // A14 并发：同 task 并发 5 条 progress add，队列串行化后无丢条目、id 唯一、正文齐全。
  const beforeConcurrent = domain.table('tasks').get('t-0001').progressLog.length
  const concResults = await Promise.all(
    Array.from({ length: 5 }, (_, i) => run(`progress add t-0001 {"author":"C${i}","content":"并发条目${i}","date":"2026-10-20"}`)),
  )
  assert.ok(concResults.every(r => r.kind === 'success'), '并发 add 全部成功')
  t1 = domain.table('tasks').get('t-0001')
  assert.equal(t1.progressLog.length, beforeConcurrent + 5, '并发 5 条无丢失')
  const concurrentEntries = t1.progressLog.filter(e => ['C0','C1','C2','C3','C4'].includes(e.author ?? ''))
  assert.equal(concurrentEntries.length, 5)
  const cIds = new Set(concurrentEntries.map(e => e.id))
  assert.equal(cIds.size, 5, '并发条目 id 唯一，无覆盖')
  assert.ok(concurrentEntries.every(e => e.revisions[0].content), '并发条目正文齐全')

  // A14 并发 unlink：同 task 并发摘除两条不同资料项，最终都摘除且不误删其它项。
  // （先补两条可摘除的链接）
  await run('material link t-0001 {"url":"https://z.com/a"}')
  await run('material link t-0001 {"url":"https://z.com/b"}')
  t1 = domain.table('tasks').get('t-0001')
  const removable = t1.attachments.filter(a => a.kind === 'link' && /z\.com\/[ab]/.test(a.url)).map(a => a.id)
  assert.equal(removable.length, 2)
  const unlinkResults = await Promise.all(removable.map(id => run(`material remove t-0001 ${id}`)))
  assert.ok(unlinkResults.every(r => r.kind === 'success'), '并发 unlink 全部成功')
  t1 = domain.table('tasks').get('t-0001')
  assert.ok(!t1.attachments.some(a => removable.includes(a.id)), '并发 unlink 两条都摘除')

  // 4) 软删 → list 隐藏；restore → 可见且 revision 全保留。
  const del = await run(`progress delete t-0001 ${iceId}`)
  assert.equal(del.kind, 'success', del.text)
  t1 = domain.table('tasks').get('t-0001')
  assert.ok(t1.progressLog.find(e => e.id === iceId).deletedAt, '软删写 deletedAt')
  const listHidden = await run('progress list t-0001')
  assert.ok(!listHidden.text.includes('首版正文'), '软删条目不进列表（其它可见条目保留）')

  const restored = await run(`progress restore t-0001 ${iceId}`)
  assert.equal(restored.kind, 'success', restored.text)
  t1 = domain.table('tasks').get('t-0001')
  const restoredEntry = t1.progressLog.find(e => e.id === iceId)
  assert.equal(restoredEntry.deletedAt, undefined, 'restore 清除 deletedAt')
  assert.equal(restoredEntry.revisions.length, 2, 'restore 不丢 revision')

  // 5) done 材料双读：挂了 link 的 done 任务不误报缺材料；裸 done 仍命中。
  await run('task update t-0001 {"status":"done"}')
  await run('task update t-0002 {"status":"done"}')
  const findings = collectChecks(domain, { today: '2026-10-20' })
  const miss = findings.filter(f => f.rule === 'done-missing-materials')
  assert.ok(!miss.some(f => f.taskId === 't-0001'), '挂了资料的 done 任务不误报缺材料')
  assert.ok(miss.some(f => f.taskId === 't-0002'), '裸 done 任务仍命中缺材料')

  // P0：已有任务编辑，基本字段 + ops 信封在同一请求同事务原子落库；非法 op 零写、基本字段保持原值。
  // raw 数组为 create-only，update 拒绝；ops 保稳定 ID 与 P3 历史。
  await run('task add {"projectId":"p-0001","title":"P0原子编辑"}')
  const p0Id = [...domain.table('tasks').entries()].find(([, v]) => v.title === 'P0原子编辑')[0]
  const atomic = await run(`task update ${p0Id} {"progress":20,"draft":{"attachmentOps":[{"op":"addDeliverable","deliverableId":"${dlvId}"}],"progressOps":[{"op":"add","author":"Ice","date":"2026-10-20","content":"初版进展"}]}}`)
  assert.equal(atomic.kind, 'success', atomic.text)
  let p0 = domain.table('tasks').get(p0Id)
  assert.equal(p0.progress, 20, '基本字段随同请求落库')
  assert.equal(p0.attachments.length, 1, '资料区随同请求落库')
  assert.equal(p0.attachments[0].kind, 'deliverable')
  assert.equal(p0.progressLog.length, 1, '进展区随同请求落库')
  const firstEntryId = p0.progressLog[0].id
  // 编辑追加 revision 而非覆盖：旧 rv-1 保留，新 rv-2 接续。
  const editRev = await run(`task update ${p0Id} {"draft":{"progressOps":[{"op":"edit","id":"${firstEntryId}","content":"修订正文"}]}}`)
  assert.equal(editRev.kind, 'success', editRev.text)
  p0 = domain.table('tasks').get(p0Id)
  assert.equal(p0.progressLog[0].id, firstEntryId, '条目稳定 ID 不变')
  assert.equal(p0.progressLog[0].revisions.length, 2, '编辑追加修订版，历史保留')
  // 非法 op（不存在的交付物）整体拒绝：基本字段与两区都保持原值，不半写。
  const illegal = await run(`task update ${p0Id} {"progress":99,"draft":{"attachmentOps":[{"op":"addDeliverable","deliverableId":"t-9999"}]}}`)
  assert.equal(illegal.kind, 'error', illegal.text)
  p0 = domain.table('tasks').get(p0Id)
  assert.equal(p0.progress, 20, '非法 op 零写：基本字段保持原值')
  assert.equal(p0.attachments.length, 1, '非法 op 零写：资料区不变')
  assert.equal(p0.progressLog.length, 1, '非法 op 零写：进展区不变')
  // raw 数组在 update 被拒（create-only），零写。
  const rawRejected = await run(`task update ${p0Id} {"draft":{"attachments":[{"kind":"link","url":"https://example.com/raw"}]}}`)
  assert.equal(rawRejected.kind, 'error', rawRejected.text)
  p0 = domain.table('tasks').get(p0Id)
  assert.equal(p0.attachments.length, 1, 'raw 数组 update 零写')
  // 只提交 attachmentOps：进展区保留现状（未提交的区不清空），资料区按序追加。
  const zoneKeep = await run(`task update ${p0Id} {"draft":{"attachmentOps":[{"op":"addLink","url":"https://example.com/p0"}]}}`)
  assert.equal(zoneKeep.kind, 'success', zoneKeep.text)
  p0 = domain.table('tasks').get(p0Id)
  assert.equal(p0.attachments.length, 2, 'attachmentOps 按序追加，既有项保留')
  assert.equal(p0.progressLog.length, 1, '未提交的进展区保留')

  // 6) 备份/恢复往返：attachments/progressLog/revisions 完整保留，新键不清。
  const b = await createBackup(domain, backupDir)
  await restoreBackup(domain, b.path, backupDir)
  t1 = domain.table('tasks').get('t-0001')
  assert.ok(t1.attachments.length >= 1, '备份往返保留资料项')
  assert.ok(t1.progressLog.find(e => e.id === iceId)?.revisions.length === 2, '备份往返保留修订版')

  // A15 重启读回：同 root 新建独立 Context/facility（模拟进程重启），从落盘读回，新键/修订版不丢。
  {
    const ctx2 = new Context()
    await ctx2.plugin(Storage)
    ctx2.storage.backend.register('json', new JsonStorageBackend(root))
    const facility2 = new DomainFacility(ctx2, { backend: 'json', routes: {} })
    ctx2.provide('storageDomain', facility2)
    let cmd2
    ctx2.provide('commands', { register(d) { cmd2 = d; return () => {} } })
    await apply(ctx2)
    const d2 = facility2.get('pmtool')
    const rt1 = d2.table('tasks').get('t-0001')
    assert.ok(rt1, '重启后任务记录可读回')
    assert.ok(rt1.attachments.length >= 1, '重启后 attachments 保留')
    assert.ok(rt1.progressLog.length >= 1, '重启后 progressLog 保留')
    const revived = rt1.progressLog.find(e => e.revisions.length >= 2)
    assert.ok(revived, '重启后多修订版条目保留')
    const rnt = [...d2.table('tasks').entries()].find(([, t]) => t.title === '新建带草稿')
    assert.ok(rnt, '重启后新建 draft 任务可读回')
    assert.equal(rnt[1].progressLog[0].revisions[0].content, '启动说明', '重启后首版正文保留')
  }

  // 7) AI 白名单：task.update 带 attachments/progressLog 走未知字段拒绝。
  const v = validateActions(
    [{ op: 'task.update', id: 't-0001', patch: { attachments: [], progressLog: [] } }],
    { taskIds: ['t-0001'] },
  )
  assert.equal(v.accepted.length, 0, 'AI 不得写 attachments/progressLog')
  assert.equal(v.rejected.length, 1)
  assert.match(v.rejected[0].reason, /未知字段/)

  console.log('PASS verify-b2-materials')
} catch (error) {
  console.error('FAIL verify-b2-materials:', error)
  process.exit(1)
}
