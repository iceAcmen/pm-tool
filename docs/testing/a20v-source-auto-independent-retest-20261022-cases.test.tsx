import { Context } from '/private/tmp/pmtool-a20v-closure-20261022-r1/packages/dsh-pm-tool/node_modules/@deepseek-ai/cordis/src/index.ts'
import { describe, expect, it, vi } from 'vitest'
import { apply } from '/private/tmp/pmtool-a20v-closure-20261022-r1/packages/dsh-pm-tool/src/client/index.tsx'

type CommandResult = { kind: 'success' | 'error', text?: string }
type Listener = (sessionId: string, name: string, result: CommandResult) => void

function createHarness(conversationOverride?: unknown) {
  const listeners: Listener[] = []
  const notifications = { a: vi.fn(), b: vi.fn() }
  const scopes = { a: { id: 'a' }, b: { id: 'b' } }
  const conversation = conversationOverride ?? {
    input: {
      for: vi.fn((scope: { id: 'a' | 'b' }) => ({ notify: notifications[scope.id] })),
    },
  }
  let panelApi: { executeRaw(line: string): Promise<CommandResult> } | undefined
  const remoteExecute = vi.fn()
  const create = vi.fn(async () => 'created')
  const ctx = {
    sessions: {
      list: { getSnapshot: () => ({ ids: ['a', 'b'] }) },
      create,
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
    on: vi.fn((name: string, listener: Listener) => {
      if (name === 'command/executed') listeners.push(listener)
      return () => {
        const index = listeners.indexOf(listener)
        if (index >= 0) listeners.splice(index, 1)
        return index >= 0
      }
    }),
  }
  apply(ctx as any)
  return {
    emit(sessionId: 'a' | 'b', name: string, result: CommandResult) {
      for (const listener of [...listeners]) listener(sessionId, name, result)
    },
    conversation,
    notifications,
    ctx,
    panelApi: () => panelApi,
    remoteExecute,
    create,
  }
}

describe('A20V 独立 SOURCE/AUTO 合同复验', () => {
  it('SR-A01 success 多行原文只通知事件 session 一次', () => {
    const h = createHarness()
    const text = '首行\n唯一中行\n末行'
    h.emit('b', 'pm', { kind: 'success', text })
    expect((h.conversation as any).input.for).toHaveBeenCalledOnce()
    expect((h.conversation as any).input.for).toHaveBeenCalledWith({ id: 'b' })
    expect(h.notifications.a).not.toHaveBeenCalled()
    expect(h.notifications.b).toHaveBeenCalledOnce()
    expect(h.notifications.b).toHaveBeenCalledWith('info', text)
  })

  it('SR-A02 error 原文只按 error 通知一次', () => {
    const h = createHarness()
    const text = '错误首行\n唯一错误末行'
    h.emit('a', 'pm', { kind: 'error', text })
    expect(h.notifications.a).toHaveBeenCalledOnce()
    expect(h.notifications.a).toHaveBeenCalledWith('error', text)
    expect(h.notifications.b).not.toHaveBeenCalled()
  })

  it('SR-A03 非精确命令完全隔离', () => {
    const h = createHarness()
    for (const name of ['help', 'pmx', 'PM']) h.emit('a', name, { kind: 'success', text: name })
    expect((h.conversation as any).input.for).not.toHaveBeenCalled()
    expect(h.notifications.a).not.toHaveBeenCalled()
    expect(h.notifications.b).not.toHaveBeenCalled()
  })

  it('SR-A04 当前首项为 A 时仍只路由事件所属 B', () => {
    const h = createHarness()
    h.emit('b', 'pm', { kind: 'success', text: '只属于 B' })
    expect(h.ctx.sessions.scope).toHaveBeenCalledWith('b')
    expect(h.notifications.a).not.toHaveBeenCalled()
    expect(h.notifications.b).toHaveBeenCalledWith('info', '只属于 B')
    expect(h.create).not.toHaveBeenCalled()
  })

  it.each([
    ['scope 缺失', () => {
      const h = createHarness()
      h.ctx.sessions.scope.mockReturnValueOnce(undefined)
      return h
    }],
    ['conversation 缺失', () => {
      const h = createHarness()
      h.ctx.get.mockReturnValueOnce(undefined)
      return h
    }],
    ['input 缺失', () => createHarness({})],
    ['for 返回 undefined', () => createHarness({ input: { for: vi.fn(() => undefined) } })],
    ['notify 缺失', () => createHarness({ input: { for: vi.fn(() => ({})) } })],
  ])('SR-A05 %s 时安全跳过且不产生副作用', (_label, factory) => {
    const h = factory()
    expect(() => h.emit('a', 'pm', { kind: 'success', text: '不得抛出' })).not.toThrow()
    expect(h.remoteExecute).not.toHaveBeenCalled()
    expect(h.create).not.toHaveBeenCalled()
  })

  it('SR-A06 真实 Cordis Context 卸载后移除监听且重装不累计', async () => {
    const ctx = new Context()
    const notices: Array<[string, string, string]> = []
    const scopes = { a: ctx.extend({ sessionId: 'a' }) }
    const sessions = {
      list: { getSnapshot: () => ({ ids: ['a'] }) },
      create: vi.fn(async () => 'a'),
      scope: (id: 'a') => scopes[id],
    }
    const slots = { inject: vi.fn(), register: vi.fn() }
    const remote = { commands: { execute: vi.fn() } }
    ctx.provide('sessions', sessions)
    ctx.provide('slots', slots)
    ctx.provide('remote', remote)
    ctx.provide('conversation', {
      input: {
        for: (scope: any) => ({
          notify: (level: string, text: string) => notices.push([scope.sessionId, level, text]),
        }),
      },
    })

    const first = ctx.plugin(apply)
    await first.await()
    ctx.emit('command/executed' as any, 'a', 'pm', { kind: 'success', text: 'first' })
    expect(notices).toEqual([['a', 'info', 'first']])
    await first.dispose()
    ctx.emit('command/executed' as any, 'a', 'pm', { kind: 'success', text: 'disposed' })
    expect(notices).toHaveLength(1)

    const second = ctx.plugin(apply)
    await second.await()
    ctx.emit('command/executed' as any, 'a', 'pm', { kind: 'success', text: 'second' })
    expect(notices).toEqual([['a', 'info', 'first'], ['a', 'info', 'second']])
    await second.dispose()
    await ctx.fiber.dispose()
  })

  it('SR-A07 executeRaw 成功只执行一次且不本地通知', async () => {
    const h = createHarness()
    h.remoteExecute.mockResolvedValue({
      ok: true,
      value: { result: { kind: 'success', text: 'pong' } },
    })
    await expect(h.panelApi()!.executeRaw('ping')).resolves.toEqual({ kind: 'success', text: 'pong' })
    expect(h.remoteExecute).toHaveBeenCalledOnce()
    expect(h.remoteExecute).toHaveBeenCalledWith('a', '/pm ping', [])
    expect(h.notifications.a).not.toHaveBeenCalled()
    expect(h.notifications.b).not.toHaveBeenCalled()
  })

  it('SR-A08 transport 与 CommandResult error 保持抛错且各只执行一次', async () => {
    const transport = createHarness()
    transport.remoteExecute.mockRejectedValue(new Error('transport-unique'))
    await expect(transport.panelApi()!.executeRaw('ping')).rejects.toThrow('transport-unique')
    expect(transport.remoteExecute).toHaveBeenCalledOnce()
    expect(transport.notifications.a).not.toHaveBeenCalled()

    const command = createHarness()
    command.remoteExecute.mockResolvedValue({
      ok: true,
      value: { result: { kind: 'error', text: 'command-unique' } },
    })
    await expect(command.panelApi()!.executeRaw('bad')).rejects.toThrow('command-unique')
    expect(command.remoteExecute).toHaveBeenCalledOnce()
    expect(command.notifications.a).not.toHaveBeenCalled()
  })

  it('SR-A09 连续事件保持次数、顺序、命令隔离与 session 隔离', () => {
    const order: string[] = []
    const conversation = {
      input: {
        for: vi.fn((scope: { id: string }) => ({
          notify: vi.fn((_level: string, text: string) => order.push(`${scope.id}:${text}`)),
        })),
      },
    }
    const h = createHarness(conversation)
    h.emit('a', 'pm', { kind: 'success', text: 'one' })
    h.emit('a', 'pm', { kind: 'success', text: 'two' })
    h.emit('a', 'help', { kind: 'success', text: 'ignored' })
    h.emit('b', 'pm', { kind: 'error', text: 'three' })
    expect(order).toEqual(['a:one', 'a:two', 'b:three'])
    expect(conversation.input.for).toHaveBeenCalledTimes(3)
  })
})
