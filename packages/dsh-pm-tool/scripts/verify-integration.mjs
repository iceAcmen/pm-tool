/**
 * 第2步·非GUI集成回归（真覆盖）：
 * - 唯一临时目录在 open 前由本脚本创建，不接用户任意 argv、不 rmSync 用户路径。
 * - 同草稿首次 Promise.all 并发：spy 真实领域写入计数恰 1。
 * - restore dry-run 不 confirm -> collectBackup 快照不变。
 * - 修改任务字段后恢复旧备份 -> 回旧值；安全快照=恢复前值；七实体去 exportedAt deepEqual。
 * - 备份预校验：语法合法但 schema/关系非法 -> domain 与文件集合不变。
 * - 主进程自动 spawn 子进程 reopen 同一 root，断言磁盘字段，不靠手动第二条命令。
 */
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

// reopen 分支最先处理：只读指定 root 磁盘文件，不初始化 domain
if (process.argv[2] === '--reopen') {
  const rec = JSON.parse(readFileSync(join(process.argv[3], 'pmtool', 'tasks', process.argv[4] + '.json'), 'utf8')).record
  assert.equal(rec.assignee, 'ice', 'reopen 读盘 assignee')
  assert.equal(rec.progress, 40, 'reopen 读盘 progress')
  console.log('verify-integration reopen OK（子进程读盘：assignee=ice, progress=40）')
  process.exit(0)
}
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'

const PKG = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const TMP = join(PKG, '.tmp')
mkdirSync(TMP, { recursive: true })
// 唯一实验目录（旧目录每次重命名而非接受外部路径）
const ROOT = join(TMP, 'integ-' + Date.now().toString(36))
const BAKDIR = join(TMP, 'integ-bak-' + Date.now().toString(36))
mkdirSync(ROOT, { recursive: true })
mkdirSync(BAKDIR, { recursive: true })

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(ROOT))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', { register(d) { command = d; return () => {} } })
await apply(ctx)
const domain = facility.get('pmtool')
const run = async (raw) => command.handler({ rawInput: raw, attachments: [] })

await run('project add {"name":"集成","startDate":"2026-01-01","targetDate":"2026-12-31"}')
await run('task add {"projectId":"p-0001","title":"任务A","assignee":"ice","status":"todo","priority":"P1","startDate":"2026-03-01","dueDate":"2026-03-20","progress":0}')
await run('task add {"projectId":"p-0001","title":"任务B","assignee":"","status":"todo","priority":"P2"}')
const t1 = 't-0001'

// ===== 1) 同草稿首次 Promise.all 并发：spy 真实 tasks 表 put 计数恰 1 =====
{
  const acts = [{ op: 'task.update', id: t1, patch: { progress: 40 } }]
  // spy：包住真实 tasks 表 put，count++ 后 await 原函数，finally 还原
  const tasksTable = domain.table('tasks')
  const origPut = tasksTable.put.bind(tasksTable)
  let putCount = 0
  tasksTable.put = async (id, val) => { putCount++; return origPut(id, val) }
  try {
    const [rA, rB] = await Promise.all([
      run('ask-apply p-0001 ' + JSON.stringify(acts)),
      run('ask-apply p-0001 ' + JSON.stringify(acts)),
    ])
    assert.equal(putCount, 1, '同草稿首次并发只应真实写库一次')
    assert.equal(rA.text, rB.text, '两次并发返回一致')
    // 顺序重复同一草稿：TTL 幂等，count 不增
    await run('ask-apply p-0001 ' + JSON.stringify(acts))
    assert.equal(putCount, 1, '顺序重复同一草稿不应再写')
  } finally {
    tasksTable.put = origPut
  }
  assert.equal(domain.table('tasks').get(t1).progress, 40, '合法 patch 生效')
}

// ===== 2) restore dry-run（合法备份不带 confirm）：domain 与备份文件列表均不变 =====
const { createBackup, restoreBackupFromContent, collectBackup } = await import('../lib/core/backup.js')
const { handleBackupCommand } = await import('../lib/commands/backup.js')
{
  const bak = await createBackup(domain, BAKDIR)
  const legalTxt = readFileSync(bak.path, 'utf8')
  const filesBefore = readdirSync(BAKDIR).length
  const beforeCollect = collectBackup(domain)
  // 通过命令 dry-run：合法备份 + 不带 confirm -> 仅预览不写
  const preview = await handleBackupCommand('restore-content ' + legalTxt, domain)
  assert.notEqual(preview.kind, 'error', '合法备份预览不应报错')
  assert.match(preview.text, /预览|confirm|确认/, '应为预览提示而非已执行')
  assert.deepEqual(norm(collectBackup(domain)), norm(beforeCollect), 'dry-run 后 domain 实体不变')
  assert.equal(readdirSync(BAKDIR).length, filesBefore, 'dry-run 后备份文件列表不变')
}

// ===== 3) 修改字段后恢复旧备份 -> collectBackup 与旧备份一致；安全快照=恢复前全量 =====
{
  const oldTxt = readFileSync(readdirSync(BAKDIR).filter(f=>f.endsWith('.json')).map(f=>join(BAKDIR,f)).sort()[0],'utf8')
  // 修改任务A assignee -> 新人
  await run('task update ' + t1 + ' ' + JSON.stringify({ assignee: '新人' }))
  assert.equal(domain.table('tasks').get(t1).assignee, '新人')
  const preRestore = collectBackup(domain)
  // 恢复旧备份
  const res = await restoreBackupFromContent(domain, oldTxt, BAKDIR)
  assert.ok(res.safetySnapshot, '应生成安全快照')
  assert.equal(domain.table('tasks').get(t1).assignee, 'ice', '恢复后回到旧值')
  // 恢复后 domain 实体 与 旧备份 deepEqual（非自证 res.backup）
  assert.deepEqual(norm(collectBackup(domain)), norm(JSON.parse(oldTxt)), '恢复后 domain 与旧备份一致')
  // 安全快照全实体 与 恢复前(已修改)全量 deepEqual
  const snap = JSON.parse(readFileSync(res.safetySnapshot, 'utf8'))
  assert.deepEqual(norm(snap), norm(preRestore), '安全快照应=恢复前全量')
}

// ===== 4) 备份预校验：schema 非法 + 关系非法单例 -> domain 与文件集合不变 =====
{
  const filesBefore = readdirSync(BAKDIR).length
  const colBefore = collectBackup(domain)
  // schema 非法：status='bogus'
  const badSchema = { format: 'pm-tool-backup', formatVersion: 1, exportedAt: '2026-01-01T00:00:00Z',
    projects: [], tasks: [{ id: 'bad-1', projectId: 'p-x', title: 'x', description: '', assignee: '', status: 'bogus', priority: 'P1', progress: 0, code: '1', order: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
    milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [] }
  await assert.rejects(() => restoreBackupFromContent(domain, JSON.stringify(badSchema), BAKDIR), /.+/)
  // 关系非法：schema 合法但 projectId 指向不存在项目
  const badRel = { format: 'pm-tool-backup', formatVersion: 1, exportedAt: '2026-01-01T00:00:00Z',
    projects: [], tasks: [{ id: 'bad-2', projectId: 'nope', title: 'x', description: '', assignee: '', status: 'todo', priority: 'P1', progress: 0, code: '1', order: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
    milestones: [], riskIssues: [], meetings: [], reports: [], deliverables: [] }
  await assert.rejects(() => restoreBackupFromContent(domain, JSON.stringify(badRel), BAKDIR), /.+/)
  assert.deepEqual(norm(collectBackup(domain)), norm(colBefore), '坏备份后 domain 实体不变')
  assert.equal(readdirSync(BAKDIR).length, filesBefore, '坏备份后 backups 文件集合不变')
}

function norm(b){ const c=JSON.parse(JSON.stringify(b)); delete c.exportedAt; delete c.fileBundleId; return c }

// ===== 5) 自动 spawn 子进程 reopen 同一 root =====
{
  const r = spawnSync(process.execPath, [fileURLToPath(new URL(import.meta.url)), '--reopen', ROOT, t1], { encoding: 'utf8' })
  assert.equal(r.status, 0, 'reopen 子进程应退出 0：' + (r.stderr||r.stdout))
  console.log(r.stdout.trim())
}
console.log('verify-integration 全部真覆盖通过（并发1写/dry-run/恢复回滚+快照/坏备份/reopen）')
