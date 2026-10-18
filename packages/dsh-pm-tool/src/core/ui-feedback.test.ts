import { describe, it, expect } from 'vitest'
import {
  parseFeedback,
  classifyFeedback,
  parseActionLine,
  feedbackIsError,
  formatNoticeLines,
  buildSuccessEnvelope,
  buildActionLine,
  PM_SUMMARY_PREFIX,
  PM_DETAIL_MARKER,
  PM_ACTION_MARKER,
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

describe('action 分离与信封构造（AI 草稿 content/action）', () => {
  it('parseActionLine：`[pm:action]文案：命令` 拆出 label/command；格式不符返回 null', () => {
    expect(parseActionLine(`${PM_ACTION_MARKER}确认入库：/pm report narrate p-0001 confirm`))
      .toEqual({ label: '确认入库', command: '/pm report narrate p-0001 confirm' })
    expect(parseActionLine(`${PM_ACTION_MARKER}无分隔符`)).toBeNull()
    expect(parseActionLine(`${PM_ACTION_MARKER}：`)).toBeNull()
  })

  it('非结构化草稿预览：content 原样进 summary，action 独立抽出，不混进正文', () => {
    const text = [
      'AI 进度叙述草稿（项目 p-0001）：',
      '本周进展：完成原型设计。',
      '以上为草稿（基于确定性数字生成），尚未写入。',
      buildActionLine('确认入库', '/pm report narrate p-0001 confirm'),
    ].join('\n')
    const f = parseFeedback(text)
    expect(f.structured).toBe(false)
    expect(f.action).toEqual({ label: '确认入库', command: '/pm report narrate p-0001 confirm' })
    expect(f.summary.join('\n')).toContain('本周进展：完成原型设计')
    expect(f.summary.join('\n')).not.toContain(PM_ACTION_MARKER)
    // 预览非结构化 → 持久（不自动消失）。
    expect(FEEDBACK_SUCCESS_TTL_MS).toBe(3000)
  })

  it('buildSuccessEnvelope：≤2 行短摘要加前缀，完整字段进 detail；空行被过滤', () => {
    const env = buildSuccessEnvelope(
      ['习惯已更新｜habit-x 读书', '已修改：标题、备注', ''],
      '完整字段卡',
    )
    const f = parseFeedback(env)
    expect(f.structured).toBe(true)
    expect(f.summary).toEqual(['习惯已更新｜habit-x 读书', '已修改：标题、备注'])
    expect(f.summary.length).toBeLessThanOrEqual(2)
    expect(f.detail).toBe('完整字段卡')
    expect(f.action).toBeNull()
  })

  it('结构化成功信封 → classifyFeedback 3s 自动消失；action 透传', () => {
    const env = buildSuccessEnvelope(
      ['任务已更新｜t-1 收尾', '已修改：状态'],
      '详情卡',
    )
    const fb = classifyFeedback(env)
    expect(fb.isError).toBe(false)
    expect(fb.structured).toBe(true)
    expect(fb.autoDismissMs).toBe(FEEDBACK_SUCCESS_TTL_MS)
  })
})
