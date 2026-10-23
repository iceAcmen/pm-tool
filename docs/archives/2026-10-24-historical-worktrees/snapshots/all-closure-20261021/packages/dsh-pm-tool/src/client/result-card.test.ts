import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResultCard } from './result-card.js'

const A = '恢复失败：原文A'
const B = '恢复失败：原文B'
const noop = () => {}
let mounted: ReactTestRenderer | undefined
afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
})

function render(message: string, writer: (value: string) => Promise<void>) {
  const element = createElement(ResultCard, { message, onClose: noop, onAction: noop, writeText: writer })
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
