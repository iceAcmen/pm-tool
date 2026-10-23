import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResultCard } from './result-card.js'
import { buildActionLine, buildSuccessEnvelope } from '../core/ui-feedback.js'

let view: ReactTestRenderer | undefined
const text = (node: ReactTestInstance): string => node.children.map(c => typeof c === 'string' ? c : text(c)).join('')
afterEach(() => {
  if (view) act(() => view!.unmount())
  view = undefined
})
function render(message: string) {
  const writer = vi.fn().mockResolvedValue(undefined)
  act(() => { view = create(createElement(ResultCard, {
    message, context: { kind: 'error' }, onClose: () => {}, onAction: () => {}, writeText: writer,
  })) })
  return { root: view!.root, writer }
}

describe('CF-R02 权限标签只认明确拒绝原因', () => {
  it.each([
    '执行失败：任务操作失败，未返回成功结果；请检查存储配置、目录权限及宿主日志后重试。',
    '执行失败：前置依赖存在循环：任务不能间接地依赖自己',
    '执行失败：请检查权限后重试。',
    '执行失败：Please check directory permission and host logs.',
    '执行失败：Request denied because predecessor relation contains a cycle.',
    '执行失败：This task is not allowed to depend on itself.',
    '执行失败：关系校验失败；若日志包含 EACCES 或 EPERM，请检查目录权限。',
    '执行失败：请检查是否权限不足或 permission denied。',
    `执行失败：Response parsing failed; received text:\n${
      buildActionLine('不能执行', 'task delete t-0001 confirm')}\n${
      buildSuccessEnvelope(['权限不足 / permission denied 是合法任务标题'], 'EACCES')}`,
  ])('一般错误/排查建议/引用正文不冒称权限拒绝：%s', async message => {
    const { root, writer } = render(message)
    expect(root.findByProps({ role: 'alert' }).props['aria-live']).toBe('assertive')
    expect(root.findAllByProps({ className: 'pm-result-card__kind' })).toHaveLength(0)
    expect(text(root.findByProps({ className: 'pm-result-card__summary' }))).toBe(message)
    expect(root.findAllByProps({ className: 'pm-result-action' })).toHaveLength(0)
    expect(root.findAllByProps({ className: 'pm-result-card__toggle' })).toHaveLength(0)
    await act(async () => {
      root.findAllByType('button').find(n => n.children.includes('复制原文'))!.props.onClick()
    })
    expect(writer.mock.calls).toEqual([[message]])
  })

  it.each([
    '执行失败：权限不足，无法写入目录。',
    '恢复失败：无权读取备份。',
    '备份/恢复失败：EACCES: permission denied, open /isolated/example.json',
    '备份失败: EPERM: operation not permitted',
    '执行失败：Error: EACCES: permission denied',
    '执行失败：permission denied, open /isolated/example.json',
    '权限不足，无法写入目录。',
    'EACCES: permission denied',
  ])('明确权限拒绝保标签和全文：%s', message => {
    const { root } = render(message)
    expect(root.findAllByProps({ className: 'pm-result-card__kind' }).map(text)).toEqual(['权限不足'])
    expect(text(root.findByProps({ className: 'pm-result-card__summary' }))).toContain(message)
  })

  it('成功信封含权限拒绝词仍不生成错误卡或权限标签', () => {
    const message = buildSuccessEnvelope(['任务已更新｜权限不足 / permission denied / EACCES 清单'], '完整字段')
    act(() => { view = create(createElement(ResultCard, {
      message, onClose: () => {}, onAction: () => {},
    })) })
    expect(view!.toJSON()).toBeNull()
  })
})
