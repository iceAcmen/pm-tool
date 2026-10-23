import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResultCard } from './result-card.js'
import { buildActionLine, buildSuccessEnvelope, type FeedbackContext } from '../core/ui-feedback.js'

const A = '恢复失败：原文A'
const B = '恢复失败：原文B'
const noop = () => {}
let mounted: ReactTestRenderer | undefined
afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
})

function render(message: string, writer: (value: string) => Promise<void>, context?: FeedbackContext, messageGeneration?: number) {
  const element = createElement(ResultCard, { message, onClose: noop, onAction: noop, writeText: writer, context, messageGeneration })
  act(() => {
    if (mounted) mounted.update(element)
    else mounted = create(element)
  })
}

function feedback() {
  return mounted!.root.findAll(node =>
    typeof node.props.className === 'string' && node.props.className.includes('pm-result-card__copy-state'))
}

function copy() {
  return mounted!.root.findAllByType('button').find(node => node.children.includes('复制原文'))!.props.onClick()
}

describe('ResultCard 真实组件：每条原文独立复制反馈', () => {
  it('复制A后切B，B没有旧成功提示，只有复制B后才成功', async () => {
    const writer = vi.fn().mockResolvedValue(undefined)
    render(A, writer)
    await act(async () => { copy() })
    expect(feedback()[0].children).toEqual(['已复制'])
    render(B, writer)
    expect(feedback()).toHaveLength(0)
    await act(async () => { copy() })
    expect(feedback()[0].children).toEqual(['已复制'])
    expect(writer.mock.calls).toEqual([[A], [B]])
  })

  it.each(['resolve', 'reject'] as const)('A迟到%s不能给B标复制结果', async (outcome) => {
    let resolve!: () => void
    let reject!: (error: Error) => void
    const delayed = new Promise<void>((ok, bad) => { resolve = ok; reject = bad })
    const writer = vi.fn().mockReturnValueOnce(delayed).mockResolvedValue(undefined)
    render(A, writer)
    act(() => { copy() })
    render(B, writer)
    await act(async () => {
      if (outcome === 'resolve') resolve()
      else reject(new Error('Denied'))
    })
    expect(feedback()).toHaveLength(0)
    await act(async () => { copy() })
    expect(feedback()[0].children).toEqual(['已复制'])
    expect(writer.mock.calls).toEqual([[A], [B]])
  })

  it('复制失败保留原文，切下一条后错误提示清除', async () => {
    render(A, vi.fn().mockRejectedValue(new Error('Denied')))
    await act(async () => { copy() })
    expect(feedback()[0].children).toEqual(['复制失败，请手动复制'])
    expect(mounted!.root.findByProps({ className: 'pm-result-card__summary' }).children).toEqual([A])
    render(B, vi.fn().mockResolvedValue(undefined))
    expect(feedback()).toHaveLength(0)
  })
})

describe('A18 ResultCard 显式上下文与同值消息代际', () => {
  const message = `${buildActionLine('不能执行', 'task remove t-0001 confirm')}\n${
    buildSuccessEnvelope(['失败 / Failed / Error register'], '{"title":"完整原因"}')}`
  it.each(['resolve', 'reject'] as const)('同值正文context变化后旧复制%s不串新状态', async outcome => {
    let resolve!: () => void, reject!: (error: Error) => void
    const delayed = new Promise<void>((ok, no) => { resolve = ok; reject = no })
    const writer = vi.fn().mockReturnValueOnce(delayed).mockResolvedValue(undefined)
    render(message, writer)
    expect(mounted!.root.findByProps({ role: 'status', 'aria-live': 'polite' })).toBeDefined()
    act(() => { copy() })
    render(message, writer, { kind: 'error' })
    expect(mounted!.root.findByProps({ role: 'alert' })).toBeDefined()
    expect(mounted!.root.findByProps({ className: 'pm-result-card__summary' }).children).toEqual([message])
    expect(mounted!.root.findAllByProps({ className: 'pm-result-action' })).toHaveLength(0)
    expect(mounted!.root.findAllByProps({ className: 'pm-result-card__toggle' })).toHaveLength(0)
    await act(async () => { outcome === 'resolve' ? resolve() : reject(new Error('late denied')) })
    expect(feedback()).toHaveLength(0)
    await act(async () => { copy() })
    expect(writer.mock.calls).toEqual([[message], [message]])
    expect(feedback()[0].children).toEqual(['已复制'])
    render(message, writer)
    expect(feedback()).toHaveLength(0)
    expect(mounted!.root.findAllByProps({ role: 'alert' })).toHaveLength(0)
    expect(mounted!.root.findAllByProps({ className: 'pm-result-action' })).toHaveLength(1)
  })
  it('同正文同error的新消息代际清除已复制与迟到结果', async () => {
    let resolve!: () => void
    const writer = vi.fn().mockResolvedValueOnce(undefined)
      .mockReturnValueOnce(new Promise<void>(ok => { resolve = ok })).mockResolvedValue(undefined)
    render(message, writer, { kind: 'error' }, 1)
    await act(async () => { copy() })
    expect(feedback()[0].children).toEqual(['已复制'])
    act(() => { copy() })
    render(message, writer, { kind: 'error' }, 2)
    expect(feedback()).toHaveLength(0)
    await act(async () => { resolve() })
    expect(feedback()).toHaveLength(0)
    await act(async () => { copy() })
    expect(feedback()[0].children).toEqual(['已复制'])
  })
})
