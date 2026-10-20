/**
 * 候选隔离 export root gate 专项（纯解析 + fs，零领域数据）。
 * DSH_PM_ISOLATED_ROOT 显式开关：设置后导出收敛 root/exports，绝对/~/越界/symlink 拒零写；
 * 未设置时生产 legacy 语义（默认目录、绝对/~/相对）完全不变。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, symlinkSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  ISOLATED_ROOT_ENV,
  ExportIsolationError,
  resolveIsolatedExportDirectory,
  defaultExportDirectory,
} from './export.js'

const savedEnv = process.env[ISOLATED_ROOT_ENV]
afterEach(() => {
  if (savedEnv === undefined) delete process.env[ISOLATED_ROOT_ENV]
  else process.env[ISOLATED_ROOT_ENV] = savedEnv
})

describe('未设 DSH_PM_ISOLATED_ROOT：生产 legacy 语义不变', () => {
  it('缺省目录回落到默认 exports，绝对/~/相对照常解析', async () => {
    delete process.env[ISOLATED_ROOT_ENV]
    expect(await resolveIsolatedExportDirectory(undefined)).toBe(defaultExportDirectory)
    expect(await resolveIsolatedExportDirectory('/tmp/legacy')).toBe(resolve('/tmp/legacy'))
    expect(await resolveIsolatedExportDirectory('~')).not.toBeUndefined()
  })
})

describe('设置 DSH_PM_ISOLATED_ROOT：全部收敛 root/exports', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pm-iso-'))
    process.env[ISOLATED_ROOT_ENV] = root
  })

  it('缺省落到 <root>/exports', async () => {
    const dir = await resolveIsolatedExportDirectory(undefined)
    expect(dir).toBe(resolve(root, 'exports'))
  })

  it('相对子目录落在 root/exports 内', async () => {
    const dir = await resolveIsolatedExportDirectory('reports/oct')
    expect(dir).toBe(resolve(root, 'exports/reports/oct'))
    expect(dir.startsWith(resolve(root, 'exports'))).toBe(true)
  })

  it('绝对路径拒绝且零写', async () => {
    await expect(resolveIsolatedExportDirectory('/etc/evil')).rejects.toBeInstanceOf(ExportIsolationError)
    await expect(resolveIsolatedExportDirectory('/tmp/other')).rejects.toBeInstanceOf(ExportIsolationError)
  })

  it('主目录 ~ 与 ~/ 拒绝', async () => {
    await expect(resolveIsolatedExportDirectory('~')).rejects.toBeInstanceOf(ExportIsolationError)
    await expect(resolveIsolatedExportDirectory('~/secret')).rejects.toBeInstanceOf(ExportIsolationError)
  })

  it('.. 越界逃出 root/exports 拒绝', async () => {
    await expect(resolveIsolatedExportDirectory('../escape')).rejects.toBeInstanceOf(ExportIsolationError)
    await expect(resolveIsolatedExportDirectory('a/../../escape')).rejects.toBeInstanceOf(ExportIsolationError)
  })

  it('符号链接导出目标拒绝', async () => {
    const outside = mkdtempSync(join(tmpdir(), 'pm-iso-out-'))
    mkdirSync(resolve(root, 'exports'), { recursive: true })
    const link = resolve(root, 'exports/linkdir')
    symlinkSync(outside, link, 'dir')
    expect(existsSync(link)).toBe(true)
    await expect(resolveIsolatedExportDirectory('linkdir')).rejects.toBeInstanceOf(ExportIsolationError)
  })
})
