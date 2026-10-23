import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import KanbanSquare from 'lucide-react/dist/esm/icons/kanban-square.mjs'
import { PmPanel, type PmPanelApi } from './panel.js'

const PANEL_ID = 'pm-tool' as MainPanelId

export const inject = ['slots', 'remote', 'remote.commands', 'sessions', 'conversation']

interface CommandFeedbackClient {
  sessions: ISessions & { scope(sessionId: unknown): Context | undefined }
  get(name: 'conversation'): {
    input?: {
      for?(scope: Context): {
        notify?(level: 'info' | 'error', text: string): void
      } | undefined
    } | undefined
  } | undefined
  on(
    name: 'command/executed',
    listener: (sessionId: unknown, commandName: string, result: { kind: string, text?: string }) => void,
  ): unknown
}

function registerCommandFeedback(client: CommandFeedbackClient): void {
  client.on('command/executed', (sessionId, commandName, result) => {
    if (commandName !== 'pm' || result.text === undefined) return
    const scope = client.sessions.scope(sessionId)
    if (!scope) return
    const input = client.get('conversation')?.input
    if (typeof input?.for !== 'function') return
    const target = input.for(scope)
    if (typeof target?.notify !== 'function') return
    target.notify(result.kind === 'error' ? 'error' : 'info', result.text)
  })
}

export function apply(ctx: Context): void {
  const client = ctx as Context & {
    sessions: ISessions
    slots: { inject(name: string, callback: () => unknown): void, register(options: object, component: unknown): unknown }
    remote: { commands: { execute(sessionId: unknown, line: string, attachments: unknown[]): Promise<any> } }
  }
  registerCommandFeedback(client as unknown as CommandFeedbackClient)
  const executeRaw: PmPanelApi['executeRaw'] = async (line) => {
    let sessionId = client.sessions.list.getSnapshot().ids[0]
    if (!sessionId) sessionId = await client.sessions.create()
    const result = await client.remote.commands.execute(sessionId, `/pm ${line}`, [])
    if (!result.ok) throw new Error(result.error.message)
    // dsh 的 CommandResult 契约只透传 kind/text（sourceEventSeq 可选），不携带自定义字段。
    const command = result.value?.result as { kind: string, text?: string }
    if (!command) throw new Error('pm 命令没有返回结果')
    if (command.kind === 'error') throw new Error(command.text)
    return { kind: command.kind, text: command.text ?? '' }
  }
  const execute: PmPanelApi['execute'] = async (line) => (await executeRaw(line)).text ?? ''
  client.slots.inject('main', () => client.slots.register({
    name: 'main',
    key: PANEL_ID,
    inject: (): PmPanelApi => ({ execute, executeRaw }),
  }, PmPanel))
  client.slots.inject('sidebar.panellist', () => client.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 15,
    label: () => '项目管理',
  }, PmIcon))
}

function PmIcon({ size }: { size: number }) {
  const s = typeof size === 'number' && size > 0 ? size : 18
  return <KanbanSquare size={s} strokeWidth={2} aria-hidden/>
}
