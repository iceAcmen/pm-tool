/**
 * B3 文件资产登记专项（隔离 DSH_PM_FILE_ROOT，零正式数据/零 cwd 依赖）。
 * 覆盖：合法 md 校验→内容寻址落盘→file_assets 元数据 fa-N；同 sha256 幂等复用不重复；
 * 拒绝 exe/空文件/超界；readAssetBuffer 字节一致；不落包内 assets、不碰生产。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { registerFileAsset, resolveFileRoot, FileAssetRejectedError } from '../lib/core/file-asset-store.js'
import { stageUpload, readStage } from '../lib/core/file-staging.js'

delete process.env.DEEPSEEK_API_KEY
const ROOT_BASE = mkdtempSync(join(tmpdir(), 'pm-tool-b3-'))
const root = join(ROOT_BASE, 'data root')
process.env.DSH_PM_FILE_ROOT = join(ROOT_BASE, 'files')
delete process.env.DSH_PM_ISOLATED_ROOT

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
  await run('project add {"name":"B3项目","startDate":"2026-10-01","targetDate":"2026-10-31"}')

  const md = Buffer.from('# 需求说明\n第一行正文。\n', 'utf8')
  // 1) 合法 md 登记：元数据行 + 磁盘字节。
  const a1 = await registerFileAsset(domain, { projectId: 'p-0001', originalName: 'spec.md', bytes: md })
  assert.match(a1.id, /^fa-\d+$/, '分配 fa-N')
  assert.equal(a1.mediaType, 'text/markdown')
  assert.equal(a1.size, md.length)
  assert.equal(a1.alreadyExisted, false)
  assert.ok(existsSync(resolve(await resolveFileRoot(), a1.relPath)), '字节已内容寻址落盘')
  assert.equal(domain.table('file_assets').size, 1, '元数据 1 行')

  // 2) 同 sha256 再次登记：幂等复用，不重复字节/行。
  const a2 = await registerFileAsset(domain, { projectId: 'p-0001', originalName: 'spec-copy.md', bytes: md })
  assert.equal(a2.id, a1.id, '同 hash 复用同一资产 id')
  assert.equal(a2.alreadyExisted, true)
  assert.equal(domain.table('file_assets').size, 1, '幂等不新增元数据行')

  // 3) 拒绝：可执行扩展名 / 空文件。
  await assert.rejects(() => registerFileAsset(domain, {
    projectId: 'p-0001', originalName: 'virus.exe', bytes: Buffer.from('MZ'),
  }), FileAssetRejectedError)
  await assert.rejects(() => registerFileAsset(domain, {
    projectId: 'p-0001', originalName: 'empty.md', bytes: Buffer.alloc(0),
  }), FileAssetRejectedError)
  assert.equal(domain.table('file_assets').size, 1, '拒绝零写')

  // 4) 读回字节一致。
  const { readAssetBuffer } = await import('../lib/core/file-asset-store.js')
  const back = await readAssetBuffer(await resolveFileRoot(), a1.relPath)
  assert.ok(back.equals(md), '读回字节与原文件一致')

  // 5) CLI material file：任务绑定落盘 + 挂接 at-N；同内容去重；exe/超长 base64 拒绝零写。
  await run('task add {"projectId":"p-0001","title":"文件挂接任务"}')
  const b64 = md.toString('base64')
  const up = await run(`material file t-0001 {"fileName":"cli-spec.md","mediaType":"text/markdown","base64":"${b64}","note":"CLI 上传"}`)
  assert.equal(up.kind, 'success', up.text)
  let t = domain.table('tasks').get('t-0001')
  const fileAtt = t.attachments.find(a => a.kind === 'file')
  assert.ok(fileAtt, '任务挂有 file 附件')
  assert.match(fileAtt.assetId, /^fa-\d+$/, '软引用 fa-N')
  assert.equal(t.attachments.length, 1, '仅一条附件')

  const dup = await run(`material file t-0001 {"fileName":"cli-spec.md","base64":"${b64}"}`)
  assert.equal(dup.kind, 'success', dup.text)
  t = domain.table('tasks').get('t-0001')
  assert.equal(t.attachments.length, 1, '同 hash/同任务去重，不重复挂接')

  const exe = await run('material file t-0001 {"fileName":"virus.exe","base64":"TVo="}')
  assert.equal(exe.kind, 'error', 'exe 必须被 magic/扩展名白名单拒绝')
  const overlong = await run(`material file t-0001 {"fileName":"big.md","base64":"${'A'.repeat(14000000)}"}`)
  assert.equal(overlong.kind, 'error', '超长 encoded 预检拒绝')
  t = domain.table('tasks').get('t-0001')
  assert.equal(t.attachments.length, 1, '拒绝零写')

  // 6) 新建任务带 stageId：addFile 事务提升挂接；失败 op 零写且 stage 保留可 retry。
  const md2 = Buffer.from('# 第二份\n独立正文。\n', 'utf8')
  const sid = (await stageUpload({ originalName: 'two.md', bytes: md2 })).stageId
  const beforeRows = domain.table('file_assets').size
  const created = await run(`task add {"projectId":"p-0001","title":"新建带文件","draft":{"attachmentOps":[{"op":"addFile","stageId":"${sid}","note":"n"}]}}`)
  assert.equal(created.kind, 'success', created.text)
  const newTask = [...domain.table('tasks').entries()].map(([, v]) => v).find(v => v.title === '新建带文件')
  assert.ok(newTask, '新任务已建')
  const newFileAtt = newTask.attachments.find(a => a.kind === 'file')
  assert.ok(newFileAtt, '新任务挂 file 附件')
  assert.match(newFileAtt.assetId, /^fa-\d+$/)
  assert.equal(domain.table('file_assets').size, beforeRows + 1, '新 hash 登记一条资产行')
  await assert.rejects(() => readStage(sid), '成功后 stage 已 finalize 清除')

  // 失败：addFile + 非法 progress author → 整批零写，stage 保留。
  const sid2 = (await stageUpload({ originalName: 'three.md', bytes: Buffer.from('# 三份\n', 'utf8') })).stageId
  const rowsBeforeFail = domain.table('file_assets').size
  const failed = await run(`task add {"projectId":"p-0001","title":"不该建成","draft":{"attachmentOps":[{"op":"addFile","stageId":"${sid2}"}],"progressOps":[{"op":"add","author":"","content":"空作者"}]}}`)
  assert.equal(failed.kind, 'error', '非法 op 必须拒绝')
  assert.equal(domain.table('file_assets').size, rowsBeforeFail, '失败零写：不新增资产行')
  await assert.doesNotReject(() => readStage(sid2), '失败后 stage 保留可 retry')
  // retry 幂等成功。
  const retry = await run(`task add {"projectId":"p-0001","title":"重试成功","draft":{"attachmentOps":[{"op":"addFile","stageId":"${sid2}"}]}}`)
  assert.equal(retry.kind, 'success', retry.text)
  assert.equal(domain.table('file_assets').size, rowsBeforeFail + 1, 'retry 登记一条资产行')

  console.log('PASS verify-b3-asset')
} catch (error) {
  console.error(error)
  process.exit(1)
} finally {
  await facility.closeAll()
}
