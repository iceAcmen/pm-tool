import { describe, it, expect } from 'vitest'
import {
  isValidIsoDate,
  isHttpUrl,
  extractJsonBlock,
  normalizeCaptureDraft,
  validateCaptureCandidate,
  validateCaptureDraft,
  buildCaptureUserPrompt,
  CaptureDraftParseError,
} from './capture.js'

// P0 K4/K3：capture 纯函数离线单测（零网络/零随机/零墙钟）。

describe('isValidIsoDate：YYYY-MM-DD 真实日历日期', () => {
  it('合法日期通过', () => {
    expect(isValidIsoDate('2026-10-18')).toBe(true)
    expect(isValidIsoDate('2026-02-28')).toBe(true)
  })
  it('拒绝不存在的日历日期', () => {
    expect(isValidIsoDate('2026-02-30')).toBe(false)
    expect(isValidIsoDate('2026-13-01')).toBe(false)
    expect(isValidIsoDate('2026-04-31')).toBe(false)
  })
  it('拒绝非标准格式与非字符串', () => {
    expect(isValidIsoDate('2026/10/18')).toBe(false)
    expect(isValidIsoDate('10-18-2026')).toBe(false)
    expect(isValidIsoDate('')).toBe(false)
    expect(isValidIsoDate(undefined)).toBe(false)
  })
})

describe('isHttpUrl：http/https 形状，不联网探测', () => {
  it('合法 http/https 通过', () => {
    expect(isHttpUrl('https://example.com/a?q=1')).toBe(true)
    expect(isHttpUrl('http://localhost:3080/x')).toBe(true)
  })
  it('拒绝非 http/https 协议与非法形状', () => {
    expect(isHttpUrl('ftp://example.com/f')).toBe(false)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('not a url')).toBe(false)
    expect(isHttpUrl(123)).toBe(false)
    expect(isHttpUrl('')).toBe(false)
  })
  it('拒绝超长链接（>2048）', () => {
    expect(isHttpUrl('https://example.com/' + 'a'.repeat(2048))).toBe(false)
  })
})

describe('extractJsonBlock：剥围栏、容忍多余文字', () => {
  it('抽取 ```json 围栏内对象', () => {
    const raw = '好的，整理如下：\n```json\n{"candidates":[{"title":"写周报"}]}\n```\n以上。'
    const parsed = extractJsonBlock(raw) as { candidates: unknown[] }
    expect(parsed.candidates).toHaveLength(1)
  })
  it('容忍无围栏的裸 JSON 对象', () => {
    const parsed = extractJsonBlock('{"candidates":[],"note":"x"}') as { note: string }
    expect(parsed.note).toBe('x')
  })
  it('容忍顶层裸数组', () => {
    expect(extractJsonBlock('[{"title":"a"}]')).toHaveLength(1)
  })
  it('空正文/无 JSON 抛 CaptureDraftParseError', () => {
    expect(() => extractJsonBlock('')).toThrow(CaptureDraftParseError)
    expect(() => extractJsonBlock('没有任何 JSON')).toThrow(CaptureDraftParseError)
  })
})

describe('normalizeCaptureDraft：防御性归一化', () => {
  it('顶层对象缺 candidates 视为空数组', () => {
    expect(normalizeCaptureDraft({ note: '观察模式' }).candidates).toEqual([])
  })
  it('顶层裸数组归一为 candidates', () => {
    const draft = normalizeCaptureDraft([{ title: '  访谈用户  ', dueDate: '2026-11-01' }])
    expect(draft.candidates[0].title).toBe('访谈用户')
    expect(draft.candidates[0].dueDate).toBe('2026-11-01')
  })
  it('证据链接逐项 trim 去空', () => {
    const draft = normalizeCaptureDraft({ candidates: [{ title: '收材料', evidence: [' https://a.com ', ''] }] })
    expect(draft.candidates[0].evidence).toEqual(['https://a.com'])
  })
})

describe('validateCaptureCandidate：单条候选严格校验', () => {
  it('合法候选通过并归一', () => {
    const { candidate, errors } = validateCaptureCandidate({
      title: '  整理验收报告  ',
      dueDate: '2026-11-30',
      assignee: 'Ice',
      description: '背景一句',
      evidence: ['https://a.com/x'],
    }, 0)
    expect(errors).toEqual([])
    expect(candidate?.title).toBe('整理验收报告')
    expect(candidate?.evidence).toEqual(['https://a.com/x'])
  })
  it('标题为空报错', () => {
    const { candidate, errors } = validateCaptureCandidate({ title: '   ' }, 1)
    expect(candidate).toBeNull()
    expect(errors.join('；')).toContain('标题（title）不能为空')
  })
  it('非法日期报错', () => {
    const { errors } = validateCaptureCandidate({ title: 'x', dueDate: '2026-02-30' }, 0)
    expect(errors.join('；')).toContain('合法 YYYY-MM-DD')
  })
  it('evidence 非数组/非法 URL 报错', () => {
    expect(validateCaptureCandidate({ title: 'x', evidence: 'https://a.com' }, 0).errors.join('；')).toContain('URL 数组')
    expect(validateCaptureCandidate({ title: 'x', evidence: ['ftp://a.com'] }, 0).errors.join('；')).toContain('http/https')
  })
  it('拒绝越权字段（status/priority/progress 等）', () => {
    const { errors } = validateCaptureCandidate({ title: 'x', status: 'done', progress: 50 }, 0)
    expect(errors.join('；')).toContain('不支持的字段')
    expect(errors.join('；')).toContain('status')
  })
})

describe('validateCaptureDraft：整批校验，errors 非空即整批拒绝', () => {
  it('全部合法 → accepted 等长、errors 空', () => {
    const { accepted, errors } = validateCaptureDraft({
      candidates: [{ title: 'A' }, { title: 'B', dueDate: '2026-12-01' }],
    })
    expect(accepted).toHaveLength(2)
    expect(errors).toEqual([])
  })
  it('缺 candidates 数组报错', () => {
    const { accepted, errors } = validateCaptureDraft({ note: 'x' })
    expect(accepted).toEqual([])
    expect(errors.join('；')).toContain('candidates 数组')
  })
  it('混合合法/非法：合法进 accepted，非法全部进 errors', () => {
    const { accepted, errors } = validateCaptureDraft({
      candidates: [{ title: '好候选' }, { title: '' }, { title: '坏日期', dueDate: '2026-13-99' }],
    })
    expect(accepted).toHaveLength(1)
    expect(accepted[0].title).toBe('好候选')
    expect(errors.length).toBe(2)
  })
  it('顶层未知字段报错', () => {
    const { errors } = validateCaptureDraft({ candidates: [], plan: [] })
    expect(errors.join('；')).toContain('不支持的字段')
  })
})

describe('buildCaptureUserPrompt：装配项目名/今天/原文', () => {
  it('包含项目名、今天与对话原文', () => {
    const text = buildCaptureUserPrompt('验收项目', '张三说周五前交报告', '2026-10-18')
    expect(text).toContain('验收项目')
    expect(text).toContain('2026-10-18')
    expect(text).toContain('张三说周五前交报告')
  })
})
