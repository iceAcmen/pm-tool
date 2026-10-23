/** 独立组件补充复验，复制到自有 tmp 的 src/client 内运行，不改产品测试。 */
import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResultCard } from './result-card.js'
import { buildSuccessEnvelope, buildActionLine } from '../core/ui-feedback.js'

let mounted: ReactTestRenderer | undefined
afterEach(() => {
  if (mounted) act(() => mounted!.unmount())
  mounted = undefined
})
const noop = () => {}
function render(message: string, writer: (value: string) => Promise<void>, onClose = noop, onAction = noop) {
  act(() => {
    const element = createElement(ResultCard, { message, writeText: writer, onClose, onAction })
    if (mounted) mounted.update(element)
    else mounted = create(element)
  })
}
const buttons = () => mounted!.root.findAllByType('button')
const click = (label: string) => buttons().find(n => n.children.includes(label))!.props.onClick()
const feedback = () => mounted!.root.findAll(n =>
  typeof n.props.className === 'string' && n.props.className.includes('pm-result-card__copy-state'))
function delayed() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((ok, bad) => { resolve = ok; reject = bad })
  return { promise, resolve, reject }
}

describe('独立ResultCard：代际与抽离原语', () => {
  it.each(['resolve', 'reject'] as const)('B先复制成功，A迟到%s不得覆盖B', async outcome => {
    const gate = delayed()
    const writer = vi.fn().mockReturnValueOnce(gate.promise).mockResolvedValue(undefined)
    render('恢复失败：A', writer)
    act(() => { click('复制原文') })
    render('恢复失败：B', writer)
    await act(async () => { click('复制原文') })
    expect(feedback()[0].children).toEqual(['已复制'])
    await act(async () => {
      if (outcome === 'resolve') gate.resolve()
      else gate.reject(new Error('QA denied'))
    })
    expect(feedback()[0].children).toEqual(['已复制'])
    expect(writer.mock.calls).toEqual([['恢复失败：A'], ['恢复失败：B']])
  })

  it('A→B→A不是原旅程，最初A的迟到反馈仍拒', async () => {
    const gate = delayed()
    render('恢复失败：A', () => gate.promise)
    act(() => { click('复制原文') })
    render('恢复失败：B', async () => {})
    render('恢复失败：A', async () => {})
    await act(async () => { gate.resolve() })
    expect(feedback()).toHaveLength(0)
  })

  it('结构化纯成功仍不常驻，隐藏期间旧复制不泄漏到下一错误卡', async () => {
    const gate = delayed()
    render('恢复失败：A', () => gate.promise)
    act(() => { click('复制原文') })
    render(buildSuccessEnvelope(['任务已更新'], '完整字段'), async () => {})
    expect(mounted!.toJSON()).toBeNull()
    await act(async () => { gate.resolve() })
    render('恢复失败：B', async () => {})
    expect(feedback()).toHaveLength(0)
  })

  it('权限错误role/原文/关闭回调与复制全文不变', async () => {
    const message = '恢复失败：permission denied\n第二行原文'
    const writer = vi.fn().mockResolvedValue(undefined)
    const close = vi.fn()
    render(message, writer, close)
    const card = mounted!.root.findByProps({ role: 'alert' })
    expect(card.props['aria-live']).toBe('assertive')
    expect(mounted!.root.findByProps({ className: 'pm-result-card__kind' }).children).toEqual(['权限不足'])
    expect(mounted!.root.findByProps({ className: 'pm-result-card__summary' }).children.at(-1)).toBe(message)
    await act(async () => { click('复制原文') })
    expect(writer).toHaveBeenCalledWith(message)
    act(() => mounted!.root.findByProps({ 'aria-label': '关闭结果卡' }).props.onClick())
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('持久成功动作/详情展开、消息替换详情收起、动作命令保真', () => {
    const action = vi.fn()
    const message = buildSuccessEnvelope(['预览已准备'], '长详情A') + '\n' + buildActionLine('确认入库', '/pm qa confirm')
    render(message, async () => {}, noop, action)
    expect(mounted!.root.findByProps({ role: 'status' }).props['aria-live']).toBe('polite')
    act(() => { click('详情 ▾') })
    expect(mounted!.root.findByProps({ className: 'pm-result-card__detail' }).children[0]).toContain('长详情A')
    act(() => { click('确认入库') })
    expect(action).toHaveBeenCalledWith('/pm qa confirm')
    const next = buildSuccessEnvelope(['预览B'], '详情B') + '\n' + buildActionLine('确认入库', '/pm qb confirm')
    render(next, async () => {}, noop, action)
    expect(mounted!.root.findAllByProps({ className: 'pm-result-card__detail' })).toHaveLength(0)
    expect(buttons().find(n => n.props.className === 'pm-result-card__toggle')!.props['aria-expanded']).toBe(false)
  })

  it('卸载后迟到writer不会影响新挂载卡', async () => {
    const gate = delayed()
    render('恢复失败：A', () => gate.promise)
    act(() => { click('复制原文'); mounted!.unmount() })
    mounted = undefined
    render('恢复失败：B', async () => {})
    await act(async () => { gate.reject(new Error('QA denied')) })
    expect(feedback()).toHaveLength(0)
    await act(async () => { click('复制原文') })
    expect(feedback()[0].children).toEqual(['已复制'])
  })
})
