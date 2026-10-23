import { describe, expect, it, vi } from 'vitest'
import { apply } from './index.js'

type CommandResult = { kind: 'success' | 'error', text?: string }

function createHarness() {
  const listeners = new Map<string, (...args: any[]) => void>()
  const notifications = {
    a: vi.fn(),
    b: vi.fn(),
  }
  const scopes = {
    a: { id: 'a' },
    b: { id: 'b' },
  }
  const conversation = {
    input: {
      for: vi.fn((scope: { id: 'a' | 'b' }) => ({ notify: notifications[scope.id] })),
    },
  }
  let panelApi: { executeRaw(line: string): Promise<CommandResult> } | undefined
  const remoteExecute = vi.fn()
  const ctx = {
    sessions: {
      list: { getSnapshot: () => ({ ids: ['a'] }) },
      create: vi.fn(async () => 'a'),
      scope: vi.fn((sessionId: 'a' | 'b') => scopes[sessionId]),
    },
    slots: {
      inject: vi.fn((_name: string, register: () => unknown) => register()),
      register: vi.fn((options: { key?: string, inject?: () => unknown }) => {
        if (options.key === 'pm-tool') panelApi = options.inject?.() as typeof panelApi
      }),
    },
    remote: { commands: { execute: remoteExecute } },
    get: vi.fn((name: string) => name === 'conversation' ? conversation : undefined),
    on: vi.fn((name: string, listener: (...args: any[]) => void) => {
      listeners.set(name, listener)
    }),
  }
  apply(ctx as any)
  return {
    emitCommand(sessionId: 'a' | 'b', name: string, result: CommandResult) {
      const listener = listeners.get('command/executed')
      if (!listener) throw new Error('command/executed listener missing')
      listener(sessionId, name, result)
    },
    notifications,
    conversation,
    ctx,
    panelApi: () => panelApi,
    remoteExecute,
  }
}

describe('slash-only session 的 /pm 结果回显', () => {
  it('把 success 原文逐字回显到事件所属 session', () => {
    const harness = createHarness()
    const text = '首行\n资料区已登记：1 个文件（质量由人复核）\n末行'

    harness.emitCommand('b', 'pm', { kind: 'success', text })

    expect(harness.conversation.input.for).toHaveBeenCalledOnce()
    expect(harness.conversation.input.for).toHaveBeenCalledWith({ id: 'b' })
    expect(harness.notifications.a).not.toHaveBeenCalled()
    expect(harness.notifications.b).toHaveBeenCalledOnce()
    expect(harness.notifications.b).toHaveBeenCalledWith('info', text)
  })

  it('把 error 原文逐字映射为错误通知', () => {
    const harness = createHarness()
    const text = '参数错误\n唯一错误末行'

    harness.emitCommand('a', 'pm', { kind: 'error', text })

    expect(harness.notifications.a).toHaveBeenCalledWith('error', text)
    expect(harness.notifications.b).not.toHaveBeenCalled()
  })

  it.each(['help', 'pmx', 'PM'])('忽略非精确 pm 命令：%s', (name) => {
    const harness = createHarness()

    harness.emitCommand('a', name, { kind: 'success', text: '不得回显' })

    expect(harness.conversation.input.for).not.toHaveBeenCalled()
    expect(harness.notifications.a).not.toHaveBeenCalled()
  })

  it('scope 或 conversation 缺失时安全跳过，后续合法事件仍可处理', () => {
    const harness = createHarness()
    harness.ctx.sessions.scope.mockReturnValueOnce(undefined)
    expect(() => harness.emitCommand('a', 'pm', { kind: 'success', text: '无 scope' })).not.toThrow()
    harness.ctx.get.mockReturnValueOnce(undefined)
    expect(() => harness.emitCommand('a', 'pm', { kind: 'success', text: '无 conversation' })).not.toThrow()

    harness.emitCommand('b', 'pm', { kind: 'success', text: '后续正常' })

    expect(harness.notifications.a).not.toHaveBeenCalled()
    expect(harness.notifications.b).toHaveBeenCalledWith('info', '后续正常')
  })

  it('input、for 返回值或 notify 能力缺失时安全跳过', () => {
    const harness = createHarness()
    const incomplete = [
      {},
      { input: {} },
      { input: { for: () => undefined } },
      { input: { for: () => ({}) } },
    ]

    for (const conversation of incomplete) {
      harness.ctx.get.mockReturnValueOnce(conversation)
      expect(() => harness.emitCommand('a', 'pm', { kind: 'success', text: '跳过' })).not.toThrow()
    }

    harness.emitCommand('b', 'pm', { kind: 'success', text: '仍可继续' })
    expect(harness.notifications.a).not.toHaveBeenCalled()
    expect(harness.notifications.b).toHaveBeenCalledWith('info', '仍可继续')
  })

  it('undefined 正文不制造文案，空字符串仍逐字通知', () => {
    const harness = createHarness()

    harness.emitCommand('a', 'pm', { kind: 'success' })
    expect(harness.conversation.input.for).not.toHaveBeenCalled()
    harness.emitCommand('a', 'pm', { kind: 'success', text: '' })

    expect(harness.notifications.a).toHaveBeenCalledOnce()
    expect(harness.notifications.a).toHaveBeenCalledWith('info', '')
  })

  it('面板 executeRaw 只执行一次且不触发 slash 回显', async () => {
    const harness = createHarness()
    harness.remoteExecute.mockResolvedValue({
      ok: true,
      value: { result: { kind: 'success', text: 'pong' } },
    })

    await expect(harness.panelApi()!.executeRaw('ping')).resolves.toEqual({ kind: 'success', text: 'pong' })

    expect(harness.remoteExecute).toHaveBeenCalledOnce()
    expect(harness.remoteExecute).toHaveBeenCalledWith('a', '/pm ping', [])
    expect(harness.notifications.a).not.toHaveBeenCalled()
    expect(harness.notifications.b).not.toHaveBeenCalled()
  })
})
