import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeBundleDir, precheckBackupBytes, backupJsonSha, restoreAssetBytes, rollbackAssetBytes } from './file-backup.js'
import { storeAssetBuffer, validateUploadedFile } from './file-assets.js'
import { readAssetBuffer } from './file-asset-store.js'

async function readAssetBufferSafe(root: string, rel: string) {
  return readAssetBuffer(root, rel)
}

async function makeSourceAsset(root: string, text: string) {
  const validated = validateUploadedFile({ originalName: 'note.md', declaredMediaType: 'text/markdown', bytes: Buffer.from(text, 'utf8') })
  return storeAssetBuffer(root, validated)
}

describe('B3 backup bytes bundle', () => {
  let source: string
  let out: string
  let target: string
  beforeEach(async () => {
    source = await mkdtemp(join(tmpdir(), 'pm-bak-src-'))
    out = await mkdtemp(join(tmpdir(), 'pm-bak-out-'))
    target = await mkdtemp(join(tmpdir(), 'pm-bak-tgt-'))
    process.env.DSH_PM_FILE_ROOT = source
  })
  afterEach(async () => {
    delete process.env.DSH_PM_FILE_ROOT
    await rm(source, { recursive: true, force: true })
    await rm(out, { recursive: true, force: true })
    await rm(target, { recursive: true, force: true })
  })

  function backupJson(rows: unknown[], bundleId = 'b1') {
    return {
      fileBundleId: bundleId,
      extra: { file_assets: rows.map((r, i) => [`fa-${i + 1}`, r]) },
    }
  }
  const jsonOf = (b: unknown) => JSON.stringify(b)

  it('roundtrip：写 bundle → 预检通过 → manifest 含 sha/size/count/bundleId', async () => {
    const stored = await makeSourceAsset(source, 'hello backup')
    const row = {
      id: 'fa-1', projectId: 'p-0001', fileName: 'note.md', mediaType: 'text/markdown',
      size: stored.size, sha256: stored.sha256, relPath: stored.relPath, addedAt: new Date().toISOString(),
    }
    const backup = backupJson([row], 'b1')
    const jsonSha = backupJsonSha(jsonOf(backup))
    const jsonPath = join(out, 'pm.json')
    await writeBundleDir(backup, `${jsonPath}.files.b1`, 'b1', jsonSha)
    const manifest = JSON.parse(await readFile(join(out, 'pm.json.files.b1', 'manifest.json'), 'utf8'))
    expect(manifest.count).toBe(1)
    expect(manifest.bundleId).toBe('b1')
    expect(manifest.jsonSha256).toBe(jsonSha)
    expect(manifest.files[0].sha256).toBe(stored.sha256)
    await expect(precheckBackupBytes(backup, jsonPath, jsonSha)).resolves.toBeUndefined()
  })

  it('损坏字节（sha256 不符）→ 预检拒绝零写', async () => {
    const stored = await makeSourceAsset(source, 'original')
    const row = { id: 'fa-1', projectId: 'p-0001', fileName: 'note.md', mediaType: 'text/markdown', size: stored.size, sha256: stored.sha256, relPath: stored.relPath, addedAt: 't' }
    const backup = backupJson([row], 'b1')
    const jsonSha = backupJsonSha(jsonOf(backup))
    const jsonPath = join(out, 'pm.json')
    await writeBundleDir(backup, `${jsonPath}.files.b1`, 'b1', jsonSha)
    await writeFile(join(out, 'pm.json.files.b1', stored.relPath), Buffer.from('tampered'))
    await expect(precheckBackupBytes(backup, jsonPath, jsonSha)).rejects.toThrow(/损坏|sha256/)
  })

  it('缺少 bundle 目录 → 预检拒绝（不清空既有资产）', async () => {
    const row = { id: 'fa-1', projectId: 'p-0001', fileName: 'note.md', mediaType: 'text/markdown', size: 1, sha256: 'a'.repeat(64), relPath: 'aa/x.md', addedAt: 't' }
    await expect(precheckBackupBytes(backupJson([row], 'b1'), join(out, 'pm.json'), 'j')).rejects.toThrow(/bundle/)
  })

  it('bundleId 不符 → 预检拒绝', async () => {
    const stored = await makeSourceAsset(source, 'x')
    const row = { id: 'fa-1', projectId: 'p-0001', fileName: 'note.md', mediaType: 'text/markdown', size: stored.size, sha256: stored.sha256, relPath: stored.relPath, addedAt: 't' }
    const jsonSha = 'j'
    const jsonPath = join(out, 'pm.json')
    // JSON 声明 b2，但 bundle 目录下 manifest 自称 b1 → bundleId 不符。
    await writeBundleDir(backupJson([row], 'b1'), `${jsonPath}.files.b2`, 'b1', jsonSha)
    await expect(precheckBackupBytes(backupJson([row], 'b2'), jsonPath, jsonSha)).rejects.toThrow(/bundleId/)
  })

  it('manifest jsonSha256 与备份 JSON 摘要不符 → 预检拒绝', async () => {
    const stored = await makeSourceAsset(source, 'json-sha')
    const row = { id: 'fa-1', projectId: 'p-0001', fileName: 'note.md', mediaType: 'text/markdown', size: stored.size, sha256: stored.sha256, relPath: stored.relPath, addedAt: 't' }
    const backup = backupJson([row], 'b1')
    const jsonSha = backupJsonSha(jsonOf(backup))
    const jsonPath = join(out, 'pm.json')
    await writeBundleDir(backup, `${jsonPath}.files.b1`, 'b1', jsonSha)
    const manifestPath = join(out, 'pm.json.files.b1', 'manifest.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    manifest.jsonSha256 = 'deadbeef'
    await writeFile(manifestPath, JSON.stringify(manifest), 'utf8')
    await expect(precheckBackupBytes(backup, jsonPath, jsonSha)).rejects.toThrow(/摘要|jsonSha256/)
  })

  it('legacy 无 file_assets → no-op 不抛错', async () => {
    await expect(precheckBackupBytes({ extra: {} }, join(out, 'pm.json'), 'j')).resolves.toBeUndefined()
    await expect(precheckBackupBytes({}, join(out, 'pm.json'), 'j')).resolves.toBeUndefined()
  })

  it('提升中途失败：增量回滚只删本次新写字节，源既有字节不动', async () => {
    const a = await makeSourceAsset(source, 'alpha-one')
    const b2 = await makeSourceAsset(source, 'beta-two')
    const rowA = { id: 'fa-1', projectId: 'p-0001', fileName: 'a.md', mediaType: 'text/markdown', size: a.size, sha256: a.sha256, relPath: a.relPath, addedAt: 't' }
    const rowB = { id: 'fa-2', projectId: 'p-0001', fileName: 'b.md', mediaType: 'text/markdown', size: b2.size, sha256: b2.sha256, relPath: b2.relPath, addedAt: 't' }
    const backup = backupJson([rowA, rowB], 'b1')
    const jsonSha = backupJsonSha(jsonOf(backup))
    const jsonPath = join(out, 'pm.json')
    await writeBundleDir(backup, `${jsonPath}.files.b1`, 'b1', jsonSha)
    // 恢复根切到空 target，两条都会 createdFile；第二条提升时注入故障。
    process.env.DSH_PM_FILE_ROOT = target
    const created: string[] = []
    let second = false
    await expect(restoreAssetBytes(backup, jsonPath, jsonSha, rel => {
      created.push(rel)
      if (second) throw new Error('promote fault')
      second = true
    })).rejects.toThrow('promote fault')
    await rollbackAssetBytes(created)
    await expect(readFile(join(target, created[0]))).rejects.toThrow(/ENOENT/)
    // 源根既有字节未被删除。
    const kept = await readAssetBufferSafe(source, a.relPath)
    expect(kept.toString()).toBe('alpha-one')
  })

  it('relPath 伪造/越界（含前缀安全但 ../ 穿越）→ 拒绝', async () => {
    const row = { id: 'fa-1', projectId: 'p-0001', fileName: 'note.md', mediaType: 'text/markdown', size: 2, sha256: 'b'.repeat(64), relPath: 'aa/../../evil.md', addedAt: 't' }
    const jsonPath = join(out, 'pm.json')
    const dir = `${jsonPath}.files.b1`
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'manifest.json'), JSON.stringify({ format: 'pm-tool-backup-files', bundleId: 'b1', jsonSha256: 'j', count: 1, files: [{ relPath: 'aa/../../evil.md', sha256: 'b'.repeat(64), size: 2 }] }))
    await expect(precheckBackupBytes(backupJson([row], 'b1'), jsonPath, 'j')).rejects.toThrow(/越界|relPath|sha256/)
  })

  it('manifest 多带未在元数据声明的额外字节 → 拒绝', async () => {
    const stored = await makeSourceAsset(source, 'hello extra')
    const row = { id: 'fa-1', projectId: 'p-0001', fileName: 'note.md', mediaType: 'text/markdown', size: stored.size, sha256: stored.sha256, relPath: stored.relPath, addedAt: 't' }
    const backup = backupJson([row], 'b1')
    const jsonSha = backupJsonSha(jsonOf(backup))
    const jsonPath = join(out, 'pm.json')
    await writeBundleDir(backup, `${jsonPath}.files.b1`, 'b1', jsonSha)
    const manifestPath = join(out, 'pm.json.files.b1', 'manifest.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    manifest.files.push({ relPath: 'cc/extra.md', sha256: 'c'.repeat(64), size: 1 })
    await writeFile(manifestPath, JSON.stringify(manifest), 'utf8')
    await expect(precheckBackupBytes(backup, jsonPath, jsonSha)).rejects.toThrow(/额外字节/)
  })
})
