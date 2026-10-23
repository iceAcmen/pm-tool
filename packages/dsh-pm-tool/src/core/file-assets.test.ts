/**
 * B3/U2 文件安全底座纯单测（隔离 mkdtemp，零网络、零领域数据）。
 * 覆盖：扩展名白名单、声明类型一致、magic sniff、文本安全、大小上限、内容寻址幂等、root 越界/symlink 拒绝。
 */
import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, symlinkSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  validateUploadedFile,
  storeAssetBuffer,
  readAssetBuffer,
  contentAddressedRelPath,
  resolveWithinRoot,
  FileAssetRejectedError,
  FILE_ASSET_DEFAULTS,
} from './file-assets.js'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01])

describe('validateUploadedFile 白名单/魔数/大小', () => {
  it('合法 PNG（魔数命中）通过并产出 sha256/size', () => {
    const v = validateUploadedFile({ originalName: 'a.png', declaredMediaType: 'image/png', bytes: PNG_MAGIC })
    expect(v.mediaType).toBe('image/png')
    expect(v.size).toBe(PNG_MAGIC.length)
    expect(v.sha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it('声明类型与扩展名不一致 → 415 拒绝', () => {
    expect(() => validateUploadedFile({ originalName: 'a.jpg', declaredMediaType: 'image/png', bytes: PNG_MAGIC }))
      .toThrow(FileAssetRejectedError)
  })

  it('拒绝可执行/活动内容扩展名（.exe/.html/.svg）', () => {
    for (const bad of ['x.exe', 'x.html', 'x.svg', 'x.sh']) {
      expect(() => validateUploadedFile({ originalName: bad, bytes: Buffer.from('MZ') })).toThrow(FileAssetRejectedError)
    }
  })

  it('不在白名单的扩展名（.bin）拒绝', () => {
    expect(() => validateUploadedFile({ originalName: 'x.bin', bytes: Buffer.from('abc') })).toThrow(FileAssetRejectedError)
  })

  it('超过 maxBytes → 413', () => {
    expect(() => validateUploadedFile({ originalName: 'a.png', bytes: PNG_MAGIC, maxBytes: 4 }))
      .toThrow(FileAssetRejectedError)
  })

  it('空内容拒绝', () => {
    expect(() => validateUploadedFile({ originalName: 'a.txt', bytes: Buffer.alloc(0) })).toThrow(FileAssetRejectedError)
  })

  it('安全 UTF-8 文本（.md）通过；含 NUL / 脚本特征的文本拒绝', () => {
    const ok = validateUploadedFile({ originalName: 'note.md', bytes: Buffer.from('# 标题\n正文', 'utf-8') })
    expect(ok.mediaType).toBe('text/markdown')
    expect(() => validateUploadedFile({ originalName: 'n.md', bytes: Buffer.from([0x61, 0x00, 0x62]) })).toThrow(FileAssetRejectedError)
    expect(() => validateUploadedFile({ originalName: 'n.md', bytes: Buffer.from('<script>alert(1)</script>', 'utf-8') }))
      .toThrow(FileAssetRejectedError)
  })
})

describe('storeAssetBuffer 内容寻址幂等 + root 约束', () => {
  const root = mkdtempSync(join(tmpdir(), 'pm-asset-'))

  it('同 hash 二次写入幂等命中，不重复落字节', async () => {
    const v = validateUploadedFile({ originalName: 'a.png', bytes: PNG_MAGIC })
    const first = await storeAssetBuffer(root, v)
    expect(first.alreadyExisted).toBe(false)
    expect(first.relPath.startsWith(v.sha256.slice(0, 2) + '/')).toBe(true)
    expect(existsSync(resolve(root, first.relPath))).toBe(true)
    const second = await storeAssetBuffer(root, v)
    expect(second.alreadyExisted).toBe(true)
    expect(second.sha256).toBe(v.sha256)
  })

  it('resolveWithinRoot 拒绝 .. 越界与绝对路径', async () => {
    await expect(resolveWithinRoot(root, '../../etc/passwd')).rejects.toThrow(FileAssetRejectedError)
    await expect(resolveWithinRoot(root, '/tmp/outside')).rejects.toThrow(FileAssetRejectedError)
  })

  it('resolveWithinRoot 拒绝 symlink', async () => {
    const outside = mkdtempSync(join(tmpdir(), 'pm-asset-out-'))
    mkdirSync(resolve(root, 'ln'), { recursive: true })
    symlinkSync(outside, resolve(root, 'ln/evil'), 'dir')
    await expect(resolveWithinRoot(root, 'ln/evil')).rejects.toThrow(FileAssetRejectedError)
  })

  it('MFR-F01：拒绝内容寻址祖先symlink，不能写出根；合法重复字节仍可读', async () => {
    const isolated = mkdtempSync(join(tmpdir(), 'pm-asset-ancestor-'))
    const outside = mkdtempSync(join(tmpdir(), 'pm-asset-ancestor-out-'))
    const v = validateUploadedFile({ originalName: 'ancestor.md', bytes: Buffer.from('# ancestor\n') })
    symlinkSync(outside, join(isolated, v.sha256.slice(0, 2)), 'dir')
    await expect(storeAssetBuffer(isolated, v)).rejects.toThrow(FileAssetRejectedError)
    expect(existsSync(join(outside, `${v.sha256}.md`))).toBe(false)
    await expect(readAssetBuffer(isolated, contentAddressedRelPath(v))).rejects.toThrow(FileAssetRejectedError)
    const legal = mkdtempSync(join(tmpdir(), 'pm-asset-ancestor-legal-'))
    const stored = await storeAssetBuffer(legal, v)
    expect(await readAssetBuffer(legal, stored.relPath)).toEqual(v.bytes)
    expect(readFileSync(join(legal, stored.relPath))).toEqual(v.bytes)
    expect((await storeAssetBuffer(legal, v)).createdFile).toBe(false)
  })

  it('拒绝root自身symlink及嵌套祖先symlink，合法/tmp根父别名可用', async () => {
    const base = mkdtempSync(join(tmpdir(), 'pm-asset-root-link-'))
    const outside = mkdtempSync(join(tmpdir(), 'pm-asset-root-out-'))
    symlinkSync(outside, join(base, 'root'), 'dir')
    await expect(resolveWithinRoot(join(base, 'root'), 'file.md')).rejects.toThrow(FileAssetRejectedError)
    mkdirSync(join(base, 'nested'))
    symlinkSync(outside, join(base, 'nested', 'link'), 'dir')
    await expect(resolveWithinRoot(base, 'nested/link/file.md')).rejects.toThrow(FileAssetRejectedError)
    expect(await resolveWithinRoot(base, 'new/sub/file.md')).toBe(resolve(base, 'new/sub/file.md'))
  })

  it('拒绝配置根祖先symlink，包括根尚不存在的分支', async () => {
    const base = mkdtempSync(join(tmpdir(), 'pm-asset-config-ancestor-'))
    const outside = mkdtempSync(join(tmpdir(), 'pm-asset-config-out-'))
    mkdirSync(join(outside, 'existing'))
    symlinkSync(outside, join(base, 'link'), 'dir')
    await expect(resolveWithinRoot(join(base, 'link', 'existing'), 'file.md')).rejects.toThrow(FileAssetRejectedError)
    await expect(resolveWithinRoot(join(base, 'link', 'missing'), 'file.md')).rejects.toThrow(FileAssetRejectedError)
  })
})

describe('默认常量', () => {
  it('单文件上限为 10 MiB，白名单含 png/jpeg/gif/webp/pdf/md/txt/csv', () => {
    expect(FILE_ASSET_DEFAULTS.maxBytes).toBe(10 * 1024 * 1024)
    for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.md', '.txt', '.csv']) {
      expect(FILE_ASSET_DEFAULTS.allowExtensions.has(ext)).toBe(true)
    }
  })
})
