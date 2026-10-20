import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gcOrphanAssets, resolveFileRoot, writeAssetManifest } from './file-asset-store.js'

function stubDomain(referenced: string[], rows?: Array<Record<string, unknown>>) {
  const data = rows ?? referenced.map((r, i) => ({ relPath: r, projectId: 'p-0001', sha256: 'x', size: 1, fileName: 'a.md', mediaType: 'text/markdown' }))
  return {
    table: () => ({ entries: () => data.map((r, i) => [`fa-${i + 1}`, r]) }),
  } as never
}

describe('B3 orphan GC', () => {
  let root: string
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'pm-gc-'))
    process.env.DSH_PM_FILE_ROOT = root
    await resolveFileRoot()
  })
  afterEach(async () => {
    delete process.env.DSH_PM_FILE_ROOT
    await rm(root, { recursive: true, force: true })
  })

  it('dry-run 只列出未引用的内容寻址文件，不删除；staging 跳过；引用文件保留', async () => {
    await mkdir(join(root, 'ab'), { recursive: true })
    await mkdir(join(root, 'cd'), { recursive: true })
    await mkdir(join(root, 'staging'), { recursive: true })
    const orphan = join(root, 'ab', `${'a'.repeat(64)}.md`)
    const kept = join(root, 'cd', `${'c'.repeat(64)}.md`)
    await writeFile(orphan, 'orphan')
    await writeFile(kept, 'kept')
    await writeFile(join(root, 'staging', 'x.bin'), 'stage')
    const res = await gcOrphanAssets(stubDomain(['cd/' + 'c'.repeat(64) + '.md']), { graceMs: 0 })
    expect(res.orphans).toEqual(['ab/' + 'a'.repeat(64) + '.md'])
    expect(res.removed).toEqual([])
    await expect(readFile(orphan, 'utf8')).resolves.toBe('orphan')
    await expect(readFile(kept, 'utf8')).resolves.toBe('kept')
  })

  it('apply 删除孤儿，保留被引用与 staging', async () => {
    await mkdir(join(root, 'ab'), { recursive: true })
    await mkdir(join(root, 'cd'), { recursive: true })
    const orphan = join(root, 'ab', `${'b'.repeat(64)}.md`)
    const kept = join(root, 'cd', `${'d'.repeat(64)}.md`)
    await writeFile(orphan, 'o')
    await writeFile(kept, 'k')
    const res = await gcOrphanAssets(stubDomain(['cd/' + 'd'.repeat(64) + '.md']), { apply: true, graceMs: 0 })
    expect(res.removed).toEqual(['ab/' + 'b'.repeat(64) + '.md'])
    await expect(readFile(orphan, 'utf8')).rejects.toThrow(/ENOENT/)
    await expect(readFile(kept, 'utf8')).resolves.toBe('k')
  })

  it('manifest 从 DB 分组去重、按项目过滤，只写相对 relPath，无绝对路径', async () => {
    const rows = [
      { relPath: 'ab/' + 'a'.repeat(64) + '.md', projectId: 'p-0001', sha256: 'a'.repeat(64), size: 11, fileName: 'a.md', mediaType: 'text/markdown' },
      { relPath: 'ab/' + 'a'.repeat(64) + '.md', projectId: 'p-0002', sha256: 'a'.repeat(64), size: 11, fileName: 'a.md', mediaType: 'text/markdown' },
      { relPath: 'cd/' + 'c'.repeat(64) + '.pdf', projectId: 'p-0002', sha256: 'c'.repeat(64), size: 22, fileName: 'b.pdf', mediaType: 'application/pdf' },
    ]
    const { manifest } = await writeAssetManifest(stubDomain([], rows))
    expect(manifest.count).toBe(2)
    const first = manifest.assets.find(a => a.relPath.startsWith('ab/'))!
    expect(first.projectIds).toEqual(['p-0001', 'p-0002'])
    const onlyP2 = await writeAssetManifest(stubDomain([], rows), 'p-0002')
    expect(onlyP2.manifest.count).toBe(2)
    for (const a of manifest.assets) {
      expect(a.relPath).not.toMatch(/^[\/~]|:/)
    }
    const onDisk = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'))
    expect(onDisk.format).toBe('pm-file-manifest')
  })
})
