import { describe, it, expect } from 'vitest'
import { buildAskContext, type AskContext } from './ask-copilot.js'

// P0 K1：buildAskContext 任务行如实追加 备注/证据/交付物 三态；缺则标「无」，不编造。
// 纯函数、零 I/O、零墙钟（today 由调用方注入）。

const base: AskContext = {
  projectName: '演示项目',
  today: '2026-10-18',
  tasks: [],
  risks: [],
  milestones: [],
}

describe('P0 K1 buildAskContext 任务行新字段', () => {
  it('缺省三态均标注「无」，不编造备注/证据/交付物', () => {
    const ctx = buildAskContext({
      ...base,
      tasks: [{ id: 't-1', title: '联调', status: 'todo', progress: 0 }],
    })
    expect(ctx).toContain('备注=无')
    expect(ctx).toContain('证据=无')
    expect(ctx).toContain('交付物=无')
  })

  it('description 有值展示原文，超 40 字截断并加省略号，空白折叠为单空格', () => {
    const collapsed = '多行 备注 内容 ' + '一'.repeat(60)
    const expectedNote = collapsed.length > 40 ? `${collapsed.slice(0, 40)}…` : collapsed
    const ctx = buildAskContext({
      ...base,
      tasks: [{
        id: 't-1', title: '联调', status: 'in_progress', progress: 30,
        description: '  多行\n  备注\t内容 ' + '一'.repeat(60),
      }],
    })
    expect(ctx).toContain(`备注=${expectedNote}`)
    // 截断后不得出现完整 60 字长串。
    expect(ctx).not.toContain('一'.repeat(60))
    expect(ctx).not.toContain('备注=无')
  })

  it('hasEvidence=true 标「证据=有」；deliverableId 有值展示 ID，null 标「无」', () => {
    const ctx = buildAskContext({
      ...base,
      tasks: [
        { id: 't-1', title: 'A', status: 'done', progress: 100, hasEvidence: true, deliverableId: 'dlv-0001' },
        { id: 't-2', title: 'B', status: 'todo', progress: 0, hasEvidence: false, deliverableId: null },
      ],
    })
    expect(ctx).toContain('证据=有')
    expect(ctx).toContain('交付物=dlv-0001')
    expect(ctx).toContain('证据=无')
    expect(ctx).toContain('交付物=无')
  })

  it('description 为空白串时按「无」处理', () => {
    const ctx = buildAskContext({
      ...base,
      tasks: [{ id: 't-1', title: 'A', status: 'todo', progress: 0, description: '   \n\t ' }],
    })
    expect(ctx).toContain('备注=无')
  })
})
