import { describe, it, expect } from 'vitest'
import {
  parseFeedback,
  feedbackIsError,
  formatNoticeLines,
  PM_SUMMARY_PREFIX,
  PM_DETAIL_MARKER,
  FEEDBACK_SUCCESS_TTL_MS,
} from './ui-feedback.js'

describe('parseFeedback 反馈分型（J5）', () => {
  it('结构化信封：短摘要与完整字段分离，摘要无 HTML/MD/完整实体', () => {
    const text = [
      `${PM_SUMMARY_PREFIX}任务已更新｜t-0026 补充验收说明`,
      `${PM_SUMMARY_PREFIX}已修改：说明`,
      PM_DETAIL_MARKER,
      '```\n任务ID：t-0026\n标题：补充验收说明\n```',
    ].join('\n')
    const f = parseFeedback(text)
    expect(f.structured).toBe(true)
    expect(f.summary).toEqual(['任务已更新｜t-0026 补充验收说明', '已修改：说明'])
    // 摘要 ≤2 行、无 <details>、无「任务 ID：」、无代码围栏。
    expect(f.summary.length).toBeLessThanOrEqual(2)
    expect(f.summary.join('\n')).not.toContain('<details>')
    expect(f.summary.join('\n')).not.toContain('任务 ID：')
    expect(f.summary.join('\n')).not.toContain('```')
    // 完整字段只进 detail，不进摘要。
    expect(f.detail).toContain('任务ID：t-0026')
    expect(f.summary.join('\n')).not.toContain('任务ID：t-0026')
  })

  it('wrapped 提示进摘要（含 ≠），完整字段仍分离', () => {
    const text = [
      `${PM_SUMMARY_PREFIX}任务已更新｜t-1 收尾任务`,
      `${PM_SUMMARY_PREFIX}注意：已收尾（wrapped）≠ 正式完成（done）；该任务未计入完成，不催办、不计入 open 负载。`,
      PM_DETAIL_MARKER,
      '```\n全字段\n```',
    ].join('\n')
    const f = parseFeedback(text)
    expect(f.summary).toHaveLength(2)
    expect(f.summary[1]).toContain('已收尾')
    expect(f.summary[1]).toContain('≠')
  })

  it('无信封的既有命令原样回退，不被吞、不强行分型', () => {
    const plain = formatNoticeLines('任务已新增并保存。\n标题示例')
    const f = parseFeedback('任务已新增并保存。\n标题示例')
    expect(f.structured).toBe(false)
    expect(f.summary).toEqual(plain)
    expect(f.detail).toBeNull()
  })

  it('错误持久且单处：feedbackIsError 命中即错误态', () => {
    expect(feedbackIsError('未找到任务：t-9999')).toBe(true)
    expect(feedbackIsError('任务操作失败，未返回成功结果')).toBe(true)
    expect(feedbackIsError('任务已更新｜t-0026 补充验收说明')).toBe(false)
  })

  it('成功自动消失时长固定 3s（错误持久，不走该 TTL）', () => {
    expect(FEEDBACK_SUCCESS_TTL_MS).toBe(3000)
  })
})
