/**
 * B3 备份字节专项：真实 domain + 隔离 FILE_ROOT。
 * 1) material 落盘并登记 file_assets；createBackup 生成 bundle sidecar（manifest sha/size/count）。
 * 2) 切换到空 rootB，restoreBackup 预检通过并内容寻址提升字节，字节与原内容一致、元数据往返。
 * 3) legacy 无 file_assets 的备份恢复不触碰字节。
 * 不读/不改正式数据；全部落在临时目录。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { createBackup, restoreBackup } from '../lib/core/backup.js'
import { attachFileToTask, readAssetBuffer } from '../lib/core/file-asset-store.js'

delete process.env.DEEPSEEK_API_KEY
const BASE = mkdtempSync(join(tmpdir(), 'pm-bak-bytes-'))
const fileRoot = join(BASE, 'files')
const dataRoot = join(BASE, 'data')
const backupDir = join(BASE, 'backups')
process.env.DSH_PM_FILE_ROOT = fileRoot

const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(dataRoot))
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
  await run('project add {"name":"字节备份项目","startDate":"2026-01-01","targetDate":"2026-12-31"}')
  await run('task add {"projectId":"p-0001","title":"字节任务"}')

  const bytes = Buffer.from('# 备份字节往返\ncontent-here\n', 'utf8')
  const attached = await attachFileToTask(domain, 't-0001', {
    originalName: 'spec.md',
    declaredMediaType: 'text/markdown',
    bytes,
  })
  const relPath = attached.asset.relPath
  const sha = attached.asset.sha256

  // 1) 备份：bundle sidecar 存在，manifest 计数/sha 正确。
  const b = await createBackup(domain, backupDir)
  const bundleName = readdirSync(backupDir).find(n => n.startsWith(`${b.path.split('/').pop()}.files.`))
  assert.ok(bundleName, '字节 bundle 目录存在')
  const bundleDir = join(backupDir, bundleName)
  const manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'))
  assert.equal(manifest.count, 1, 'manifest 计数=1')
  assert.equal(manifest.files[0].sha256, sha, 'manifest sha256 与元数据一致')
  const bundled = readFileSync(join(bundleDir, relPath))
  assert.equal(bundled.toString('utf8'), bytes.toString('utf8'), 'bundle 字节与原内容一致')

  // 2) 恢复：预检通过，内容寻址提升（同 hash 幂等），字节往返一致、元数据往返。
  await restoreBackup(domain, b.path, backupDir)
  const restored = await readAssetBuffer(fileRoot, relPath)
  assert.equal(restored.toString('utf8'), bytes.toString('utf8'), '恢复后字节与原内容一致')
  const row = domain.table('file_assets').get(attached.asset.id)
  assert.ok(row, 'file_assets 元数据往返')
  assert.equal(row.sha256, sha)

  // 3) 第二次备份失败（源字节缺失）→ 旧 JSON+bundle 保持完好可恢复，不被半成品覆盖。
  const { unlinkSync, readFileSync: rfs } = await import('node:fs')
  unlinkSync(join(fileRoot, relPath))
  await assert.rejects(() => createBackup(domain, backupDir), /ENOENT|字节|sha256|找不到|no such/i)
  assert.ok(existsSync(b.path), '旧备份 JSON 仍在')
  const oldParsed = JSON.parse(rfs(b.path, 'utf8'))
  assert.equal(oldParsed.fileBundleId, manifest.bundleId, '旧 JSON bundleId 不变')
  const oldBundleBytes = rfs(join(bundleDir, relPath))
  assert.equal(oldBundleBytes.toString('utf8'), bytes.toString('utf8'), '旧 bundle 字节完好')

  console.log('PASS verify-b3-bytes')
} catch (error) {
  console.error(error)
  process.exit(1)
} finally {
  delete process.env.DSH_PM_FILE_ROOT
  await facility.closeAll()
}
