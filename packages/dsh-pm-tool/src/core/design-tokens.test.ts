import { describe, it, expect } from 'vitest'
import {
  contrastRatio,
  SEMANTIC_ROLES,
  CLOSURE_ALIASES,
  PRESERVED_OLD_ALIASES,
  CHART_SERIES,
  AI_SLOTS,
  PRIMARY_FILL_RULE,
  FALLBACK_LIGHT,
} from './design-tokens.js'

// P2-2 Token 2.0 边界测试：纯契约 + 计算 AA，不依赖 DOM/浏览器。

describe('P2-2 语义角色 AA 基线（浅色 fallback 实算）', () => {
  it('每个文本角色在 fallback 面上达到 AA ≥4.5:1', () => {
    for (const role of SEMANTIC_ROLES) {
      const ratio = contrastRatio(role.fallback, role.surface)
      expect(ratio, `${role.role} 对比度 ${ratio.toFixed(2)} 未达 ${role.minContrast}`).toBeGreaterThanOrEqual(role.minContrast)
    }
  })

  it('muted #696e74 白底 5.14:1、surface-2 4.75:1 均达标', () => {
    expect(contrastRatio(FALLBACK_LIGHT.muted, FALLBACK_LIGHT.canvas)).toBeCloseTo(5.14, 1)
    expect(contrastRatio(FALLBACK_LIGHT.muted, FALLBACK_LIGHT.surface2)).toBeGreaterThanOrEqual(4.5)
  })

  it('faint #71767c 白底达标，但落 surface-2 不足 AA（文档化禁用面）', () => {
    expect(contrastRatio(FALLBACK_LIGHT.faint, FALLBACK_LIGHT.canvas)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(FALLBACK_LIGHT.faint, FALLBACK_LIGHT.surface2)).toBeLessThan(4.5)
  })

  it('链接 #4868b2 白底 5.39:1；on-primary 白/近黑 18.9:1', () => {
    expect(contrastRatio(FALLBACK_LIGHT.link, FALLBACK_LIGHT.canvas)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(FALLBACK_LIGHT.onPrimary, FALLBACK_LIGHT.primaryFill)).toBeGreaterThanOrEqual(18)
  })

  it('主按钮中性规则：填充不得为业务蓝', () => {
    expect(PRIMARY_FILL_RULE.mustBeNeutral).toBe(true)
    expect(PRIMARY_FILL_RULE.forbiddenFill).toBe('--dsw-alias-state-business-primary')
  })
})

describe('P2-2 历史别名闭合（G2-A07）', () => {
  it('12 个历史未定义/无 fallback 别名全部给出解析目标', () => {
    expect(Object.keys(CLOSURE_ALIASES)).toHaveLength(12)
    for (const [from, to] of Object.entries(CLOSURE_ALIASES)) {
      expect(from.startsWith('--')).toBe(true)
      expect(to.startsWith('--')).toBe(true)
      // 允许自闭合（如 --pm-text 直接成为新语义名），其余必须解析到不同目标
      if (from !== '--pm-text') expect(from).not.toBe(to)
    }
  })

  it('--c-link 必须闭合到链接语义 --pm-link', () => {
    expect(CLOSURE_ALIASES['--c-link']).toBe('--pm-link')
  })
})

describe('P2-2 旧别名保留与槽位状态', () => {
  it('旧 token 以同值别名保留，本批不改名不删除', () => {
    expect(PRESERVED_OLD_ALIASES.length).toBeGreaterThan(15)
    for (const alias of PRESERVED_OLD_ALIASES) expect(alias.startsWith('--')).toBe(true)
  })

  it('图表 S1–S3 启用，S4 violet 仅定义不启用', () => {
    const enabled = CHART_SERIES.filter(s => s.enabled)
    expect(enabled.map(s => s.id)).toEqual(['s1', 's2', 's3'])
    expect(CHART_SERIES.find(s => s.id === 's4')?.enabled).toBe(false)
  })

  it('P2-6 AI 槽位本批全部只定义不启用', () => {
    expect(AI_SLOTS.every(s => !s.enabled)).toBe(true)
  })
})
