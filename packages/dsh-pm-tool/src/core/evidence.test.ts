import { describe, it, expect } from 'vitest'
import { normalizeEvidenceUrl, isValidEvidenceUrl, EvidenceUrlInvalidError } from './evidence.js'

// P0 K3：attach-evidence URL 纯校验离线单测。

describe('normalizeEvidenceUrl：归一化 + 形状校验', () => {
  it('合法 http/https 返回 trim 后链接', () => {
    expect(normalizeEvidenceUrl('  https://example.com/a  ')).toBe('https://example.com/a')
    expect(normalizeEvidenceUrl('http://localhost:3080/x')).toBe('http://localhost:3080/x')
  })
  it('空/非字符串/非 http(s)/超长抛 EvidenceUrlInvalidError', () => {
    expect(() => normalizeEvidenceUrl('')).toThrow(EvidenceUrlInvalidError)
    expect(() => normalizeEvidenceUrl(123)).toThrow(EvidenceUrlInvalidError)
    expect(() => normalizeEvidenceUrl('ftp://example.com/f')).toThrow(EvidenceUrlInvalidError)
    expect(() => normalizeEvidenceUrl('https://example.com/' + 'a'.repeat(2048))).toThrow(EvidenceUrlInvalidError)
  })
  it('isValidEvidenceUrl 纯谓词与归一化一致', () => {
    expect(isValidEvidenceUrl('https://ok.com')).toBe(true)
    expect(isValidEvidenceUrl('mailto:a@b.com')).toBe(false)
  })
})
