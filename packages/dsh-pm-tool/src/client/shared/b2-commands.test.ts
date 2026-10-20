import { describe, it, expect } from 'vitest'
import {
  b2LinkValid,
  b2AuthorValid,
  b2ContentValid,
  b2LinkPayload,
  b2DeliverablePayload,
  b2ProgressAddPayload,
  b2ProgressEditPayload,
  materialLinkCmd,
  materialDeliverableCmd,
  materialRemoveCmd,
  progressAddCmd,
  progressEditCmd,
  progressDeleteCmd,
  progressRestoreCmd,
} from './b2-commands.js'

describe('B2 前置校验（前端拦截，不发命令）', () => {
  it('链接仅 http/https，拒绝 ftp/空白/控制字符', () => {
    expect(b2LinkValid('https://example.com/spec')).toBe(true)
    expect(b2LinkValid('http://host/a')).toBe(true)
    expect(b2LinkValid('ftp://x/y')).toBe(false)
    expect(b2LinkValid('javascript:alert(1)')).toBe(false)
    expect(b2LinkValid('  ')).toBe(false)
  })

  it('作者/正文 trim 后非空才算合法', () => {
    expect(b2AuthorValid('  Ice ')).toBe(true)
    expect(b2AuthorValid('   ')).toBe(false)
    expect(b2ContentValid('完成联调')).toBe(true)
    expect(b2ContentValid('')).toBe(false)
  })
})

describe('B2 payload 构造（空可选键省略，不写空串）', () => {
  it('link：title/note 空则省略，url trim', () => {
    expect(b2LinkPayload({ url: ' https://x ', title: ' ', note: '' }))
      .toEqual({ url: 'https://x' })
    expect(b2LinkPayload({ url: 'https://x', title: '规格', note: '评审' }))
      .toEqual({ url: 'https://x', title: '规格', note: '评审' })
  })

  it('deliverable：只存软引用 id，note 空省略', () => {
    expect(b2DeliverablePayload({ deliverableId: ' dlv-1 ', note: ' ' }))
      .toEqual({ deliverableId: 'dlv-1' })
  })

  it('progress add：date/refs 可选；edit 只带 author/content', () => {
    expect(b2ProgressAddPayload({ author: '我', content: '首版', date: '', refs: [] }))
      .toEqual({ author: '我', content: '首版' })
    expect(b2ProgressAddPayload({ author: '我', content: '首版', date: '2026-10-20', refs: ['at-1'] }))
      .toEqual({ author: '我', content: '首版', date: '2026-10-20', refs: ['at-1'] })
    expect(b2ProgressEditPayload({ author: '我', content: '修订' }))
      .toEqual({ author: '我', content: '修订' })
  })
})

describe('B2 命令串（与 core 命令面一致）', () => {
  it('material link/deliverable/remove', () => {
    expect(materialLinkCmd('t-1', { url: 'https://x', title: '规格' }))
      .toBe('material link t-1 {"url":"https://x","title":"规格"}')
    expect(materialDeliverableCmd('t-1', { deliverableId: 'dlv-1', note: '验收' }))
      .toBe('material deliverable t-1 {"deliverableId":"dlv-1","note":"验收"}')
    expect(materialRemoveCmd('t-1', ' at-1 ')).toBe('material remove t-1 at-1')
  })

  it('progress add/edit/delete/restore', () => {
    expect(progressAddCmd('t-1', { author: '我', content: '进展', date: '2026-10-20' }))
      .toBe('progress add t-1 {"author":"我","content":"进展","date":"2026-10-20"}')
    expect(progressEditCmd('t-1', 'pl-1', { author: '我', content: '修订' }))
      .toBe('progress edit t-1 pl-1 {"author":"我","content":"修订"}')
    expect(progressDeleteCmd('t-1', 'pl-1')).toBe('progress delete t-1 pl-1')
    expect(progressRestoreCmd('t-1', 'pl-1')).toBe('progress restore t-1 pl-1')
  })
})
