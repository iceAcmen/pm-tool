/**
 * R8 迁移反馈单测（纯函数，无 DOM/jsdom）：
 * - 摘要白话，不含 w-* 卡片 ID / 坐标；
 * - 详情默认折叠；
 * - 签名稳定；已读表 dismiss 后 reload 稳定、新签名未读可见；
 * - 模块不提供「撤销/undo/恢复迁移」假能力。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  buildMigrationSummary,
  migrationSignature,
  isMigrationRead,
  markMigrationRead,
  parseMigrationReadMap,
  MIG_DETAIL_DEFAULT_OPEN,
} from './migration-banner.js'

const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(here, 'migration-banner.ts'), 'utf-8')

const clampWarn = [
  '卡片 w-hero：坐标/尺寸越界已夹紧到网格（0,0 1×10 → 0,0 3×10）',
  '卡片 w-ms-deliver：坐标/尺寸越界已夹紧到网格（0,10 1×3 → 0,10 4×3）',
]
const skipped = ['riskMatrix（7）', 'okrCard（9）']

describe('白话摘要：不含 w-* / 坐标，只说调整了几张', () => {
  it('标题给出调整张数，且不含卡片 ID 与坐标', () => {
    const s = buildMigrationSummary(clampWarn, [])
    expect(s.title).toContain('2 张卡片')
    expect(s.title).toMatch(/避免重叠或越界/)
    // 不回显 w-* 与坐标元组
    expect(s.title).not.toMatch(/w-[a-z0-9-]+/)
    expect(s.title).not.toMatch(/\d+,\d+\s*\d+×\d+/)
    expect(s.skippedNote).toBeUndefined()
  })

  it('跳过未知卡片时给第二行白话，同样不含 ID/坐标', () => {
    const s = buildMigrationSummary([], skipped)
    expect(s.title).toMatch(/未改动卡片位置/)
    expect(s.skippedNote).toContain('2 个无法识别的卡片')
    expect(s.skippedNote).not.toMatch(/w-[a-z0-9-]+/)
    expect(s.skippedNote).not.toMatch(/\d+,\d+/)
  })
})

describe('详情默认折叠', () => {
  it('MIG_DETAIL_DEFAULT_OPEN 为 false（技术明细不默认占首屏）', () => {
    expect(MIG_DETAIL_DEFAULT_OPEN).toBe(false)
  })
})

describe('签名稳定 / 已读 dismiss reload 稳定 / 新签名可见', () => {
  it('同输入签名恒定，不同输入可区分', () => {
    const a = migrationSignature(clampWarn, skipped)
    const a2 = migrationSignature(clampWarn, skipped)
    const b = migrationSignature([clampWarn[0]], skipped)
    expect(a).toBe(a2)
    expect(a).not.toBe(b)
    expect(a).toMatch(/^mig-/)
  })

  it('dismiss 标记已读后，reload 解析同一 JSON 仍为已读；新签名未读可见', () => {
    const sig = migrationSignature(clampWarn, skipped)
    let map: ReturnType<typeof markMigrationRead> = {}
    expect(isMigrationRead(map, sig)).toBe(false)
    map = markMigrationRead(map, sig)
    // 模拟 reload：序列化再解析
    const reloaded = parseMigrationReadMap(JSON.stringify(map))
    expect(isMigrationRead(reloaded, sig)).toBe(true)
    // 新（不同）签名未被读，仍应可见
    const newSig = migrationSignature(['别的夹紧行（1,2 3×4）'], [])
    expect(isMigrationRead(reloaded, newSig)).toBe(false)
  })

  it('损坏/非对象的已读存储回退空表，不抛、不清整份', () => {
    expect(parseMigrationReadMap(null)).toEqual({})
    expect(parseMigrationReadMap('not-json{')).toEqual({})
    expect(parseMigrationReadMap('[1,2]')).toEqual({})
    const ok = parseMigrationReadMap(JSON.stringify({ [migrationSignature(clampWarn, skipped)]: 1 }))
    expect(isMigrationRead(ok, migrationSignature(clampWarn, skipped))).toBe(true)
  })
})

describe('无假 undo：模块不提供撤销/恢复迁移前的能力', () => {
  it('源码不出现撤销/undo/恢复迁移前的文案或导出', () => {
    expect(source).not.toMatch(/撤销/)
    expect(source).not.toMatch(/undo|Undo|UNDO/)
    expect(source).not.toMatch(/恢复迁移前|迁移前恢复/)
  })
})
