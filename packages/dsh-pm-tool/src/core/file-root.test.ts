import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fileSystem from 'node:fs/promises'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describeFileRoot, resolveFileRoot, FileRootUnavailableError } from './file-asset-store.js'

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return { ...actual, mkdir: vi.fn(actual.mkdir) }
})

const KEYS = ['DSH_PM_FILE_ROOT', 'DSH_PM_ISOLATED_ROOT', 'DSH_HOME', 'NODE_ENV', 'DSH_DEV'] as const
let saved: Record<string, string | undefined> = {}

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]]))
  for (const k of KEYS) delete process.env[k]
})
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe('F2 文件根 precedence / fail-closed', () => {
  it('DSH_PM_FILE_ROOT 显式优先于 isolated 与 DSH_HOME', async () => {
    const explicit = mkdtempSync(join(tmpdir(), 'pm-explicit-'))
    const iso = mkdtempSync(join(tmpdir(), 'pm-iso-'))
    const home = mkdtempSync(join(tmpdir(), 'pm-home-'))
    process.env.DSH_PM_FILE_ROOT = explicit
    process.env.DSH_PM_ISOLATED_ROOT = iso
    process.env.DSH_HOME = home
    const r = await describeFileRoot()
    expect(r.source).toBe('explicit')
    expect(r.dir).toBe(explicit)
    rmSync(explicit, { recursive: true, force: true })
    rmSync(iso, { recursive: true, force: true })
    rmSync(home, { recursive: true, force: true })
  })

  it('无显式时 isolated/files 优先于 DSH_HOME profile', async () => {
    const iso = mkdtempSync(join(tmpdir(), 'pm-iso-'))
    const home = mkdtempSync(join(tmpdir(), 'pm-home-'))
    process.env.DSH_PM_ISOLATED_ROOT = iso
    process.env.DSH_HOME = home
    const r = await describeFileRoot()
    expect(r.source).toBe('isolated')
    expect(r.dir).toBe(join(iso, 'files'))
    rmSync(iso, { recursive: true, force: true })
    rmSync(home, { recursive: true, force: true })
  })

  it('DSH_HOME 落到 profiles/pm/data/assets，不猜 ~/.dsh', async () => {
    const home = mkdtempSync(join(tmpdir(), 'pm-home-'))
    process.env.DSH_HOME = home
    const r = await describeFileRoot()
    expect(r.source).toBe('profile')
    expect(r.dir).toBe(join(home, 'profiles', 'pm', 'data', 'assets'))
    rmSync(home, { recursive: true, force: true })
  })

  it('生产（无 dev 信号、无任何根）→ unavailable，resolveFileRoot fail-closed 抛错', async () => {
    const r = await describeFileRoot()
    expect(r.source).toBe('unavailable')
    expect(r.dir).toBeUndefined()
    await expect(resolveFileRoot()).rejects.toBeInstanceOf(FileRootUnavailableError)
  })

  it('dev/test 信号允许 builtin-dev 回退，生产无信号不回退', async () => {
    // 本格验证默认路径选择与创建参数；隔离拦截唯一mkdir，不在仓库创建真实assets。
    // 显式/isolated/profile三格仍走真实文件系统，生产fail-closed不变。
    const mkdir = vi.mocked(fileSystem.mkdir).mockClear().mockResolvedValueOnce(undefined)
    try {
      process.env.DSH_DEV = '1'
      const dev = await describeFileRoot()
      expect(dev.source).toBe('builtin-dev')
      expect(dev.dir).toMatch(/\/assets\/?$/)
      expect(mkdir).toHaveBeenCalledWith(dev.dir, { recursive: true, mode: 0o700 })
      delete process.env.DSH_DEV
      const prod = await describeFileRoot()
      expect(prod.source).toBe('unavailable')
      expect(mkdir).toHaveBeenCalledTimes(1)
    } finally {
      mkdir.mockClear()
    }
  })
})
