/**
 * schema v2 基线验证：domain version=2 + compatibleVersions=[1] 同 commit。
 * 手造 v1 信封文件，验证 v1 读、写盖 v2、未触记录仍 v1、外来版本缺席、strict 拒绝未知键。
 * 使用独立系统临时目录，不污染真实业务数据。
 */
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec, openPmDomain } from '../lib/core/storage.js'
import { getTask, updateTask } from '../lib/core/tasks.js'
import { addProject } from '../lib/core/projects.js'
import { apply as applyDomain } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY

// 1) spec 自身：version=2 且兼容 1。
assert.equal(pmDomainSpec.version, 2, 'domain version 必须为 2')
assert.ok(pmDomainSpec.compatibleVersions?.includes(1), 'compatibleVersions 必须包含 1')

const root = mkdtempSync(join(tmpdir(), 'pm-tool-schema-v2-'))
const now = '2026-10-13T08:00:00.000Z'

// 2) 手造 v1 信封记录（无 predecessorIds / repoUrl / branch 键）。
mkdirSync(join(root, 'pmtool', 'projects'), { recursive: true })
mkdirSync(join(root, 'pmtool', 'tasks'), { recursive: true })
const v1Project = {
  id: 'p-0001', name: 'v1 项目', description: '', owner: '', status: 'planning',
  startDate: '2026-10-01', targetDate: '2026-12-31', createdAt: now, updatedAt: now,
}
const v1Task = {
  id: 't-0001', projectId: 'p-0001', parentId: null, title: 'v1 任务',
  description: '', assignee: '', status: 'todo', priority: 'P1',
  progress: 0, milestoneId: null,
  code: '1', order: 1, createdAt: now, updatedAt: now,
}
writeFileSync(join(root, 'pmtool', 'projects', 'p-0001.json'), JSON.stringify({ version: 1, record: v1Project }, null, 2))
writeFileSync(join(root, 'pmtool', 'tasks', 't-0001.json'), JSON.stringify({ version: 1, record: v1Task }, null, 2))
// 外来版本（v3）文件：不在 accepted set → 读取应缺席，不得污染。
writeFileSync(join(root, 'pmtool', 'tasks', 't-0099.json'), JSON.stringify({ version: 3, record: { ...v1Task, id: 't-0099', title: '未来版本' } }, null, 2))

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
ctx.provide('commands', { register() { return () => {} } })

try {
  await applyDomain(ctx)
  const domain = facility.get('pmtool')

  // v1 记录可读、可选新键缺失即 undefined。
  assert.ok(domain.table('projects').get('p-0001'), 'v1 项目应被 v2 schema 读回')
  const task = getTask(domain, 't-0001')
  assert.ok(task, 'v1 任务应被读回')
  assert.equal(task.predecessorIds, undefined, 'v1 记录无 predecessorIds 键应读为 undefined')
  assert.equal(domain.table('tasks').size, 1, '外来 v3 文件应读作缺席，不进入表')

  // 更新一条 v1 记录 → 其信封被改写为 v2；未触碰的项目仍 v1。
  await updateTask(domain, 't-0001', { title: 'v1 任务（已更新）' })
  const taskEnvelope = JSON.parse(readFileSync(join(root, 'pmtool', 'tasks', 't-0001.json'), 'utf8'))
  assert.equal(taskEnvelope.version, 2, '更新过的记录信封应盖 v2')
  assert.equal(taskEnvelope.record.title, 'v1 任务（已更新）')
  const projectEnvelope = JSON.parse(readFileSync(join(root, 'pmtool', 'projects', 'p-0001.json'), 'utf8'))
  assert.equal(projectEnvelope.version, 1, '未触碰的 v1 记录信封必须仍为 1，不批量迁移')

  // strict：写入塞未知键必须 clean 拒绝（z.strictObject），不静默接受。
  let strictErr
  try {
    await addProject(domain, { name: '坏字段', startDate: '2026-01-01', targetDate: '2026-02-01', fooBar: 1 })
  } catch (error) {
    strictErr = error
  }
  assert.ok(strictErr, '写入未知键 fooBar 必须抛出')
  assert.match(String(strictErr), /fooBar|unrecognized/i, '错误应点名未知键')

  // PROD-21：repoUrl/branch optional 离线格式，合法读写、非法拒绝、留空合法。
  const repoOk = await addProject(domain, {
    name: '仓库项目', startDate: '2026-01-01', targetDate: '2026-02-01',
    repoUrl: 'https://github.com/org/repo.git', branch: 'feature/x-1',
  })
  assert.equal(repoOk.repoUrl, 'https://github.com/org/repo.git')
  assert.equal(repoOk.branch, 'feature/x-1')
  for (const bad of [
    { repoUrl: '不是地址' },
    { branch: 'bad~branch' },
    { branch: 'x y' },
  ]) {
    let err
    try { await addProject(domain, { name: '坏仓库', startDate: '2026-01-01', targetDate: '2026-02-01', ...bad }) }
    catch (e) { err = e }
    assert.ok(err, `应拒绝非法仓库字段 ${JSON.stringify(bad)}`)
  }

  console.log('通过：v1 信封读、写盖 v2、未触仍 v1、外来版本缺席、strict 拒绝未知键。')
  await facility.closeAll()
  console.log(`schema v2 校验通过。临时数据保留于：${root}`)
} finally {
  await facility.closeAll()
}

// S2：手改坏 v2 record 重开 → clean fail 点名表/键，且不 backup-skip 隔离。
{
  const badRoot = mkdtempSync(join(tmpdir(), 'pm-tool-badrecord-'))
  mkdirSync(join(badRoot, 'pmtool', 'tasks'), { recursive: true })
  mkdirSync(join(badRoot, 'pmtool', 'projects'), { recursive: true })
  writeFileSync(join(badRoot, 'pmtool', 'projects', 'p-0001.json'), JSON.stringify({ version: 2, record: v1Project }, null, 2))
  // 坏记录：progress=101 越界。
  writeFileSync(join(badRoot, 'pmtool', 'tasks', 't-0001.json'), JSON.stringify({ version: 2, record: { ...v1Task, progress: 101 } }, null, 2))
  const ctx2 = new Context()
  await ctx2.plugin(Storage)
  ctx2.storage.backend.register('json', new JsonStorageBackend(badRoot))
  const f2 = new DomainFacility(ctx2, { backend: 'json', routes: {} })
  ctx2.provide('storageDomain', f2)
  ctx2.provide('commands', { register() { return () => {} } })
  let openErr
  try {
    await openPmDomain(ctx2)
  } catch (error) {
    openErr = error
  }
  assert.ok(openErr, '坏 v2 记录重开必须 clean 失败，不得静默通过')
  assert.match(String(openErr), /tasks|t-0001|progress|record/i, '错误应点名表/键/字段')
  assert.ok(readFileSync(join(badRoot, 'pmtool', 'tasks', 't-0001.json')), '坏记录必须原地保留，不得被 backup-skip 移动/隔离')

  // formatDomainOpenError：相对路径 + 表/键/字段中文点名，绝不暴露绝对路径。
  const { formatDomainOpenError } = await import('../lib/core/domain-error.js')
  const msg = formatDomainOpenError(openErr)
  assert.match(msg, /pmtool\/tasks\/t-0001\.json/, '必须含相对路径 pmtool/<table>/<key>.json')
  assert.ok(!msg.includes(badRoot), '不得输出绝对路径/敏感目录')
  assert.match(msg, /tasks/, '应含表名 tasks')
  assert.match(msg, /t-0001/, '应含记录 id t-0001')
  assert.match(msg, /progress/, '应含字段 progress')
  console.log('通过：坏 v2 记录重开 clean fail，formatDomainOpenError 相对路径+表/键/字段中文点名，坏记录原地保留不隔离。')
  await f2.closeAll()
}
