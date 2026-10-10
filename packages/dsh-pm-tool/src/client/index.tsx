import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { PmPanel, type PmPanelApi } from './panel.js'

const PANEL_ID = 'pm-tool' as MainPanelId

export const inject = ['slots', 'remote', 'remote.commands', 'sessions']

export function apply(ctx: Context): void {
  const client = ctx as Context & {
    sessions: ISessions
    slots: { inject(name: string, callback: () => unknown): void, register(options: object, component: unknown): unknown }
    remote: { commands: { execute(sessionId: unknown, line: string, attachments: unknown[]): Promise<any> } }
  }
  const execute: PmPanelApi['execute'] = async (line) => {
    let sessionId = client.sessions.list.getSnapshot().ids[0]
    if (!sessionId) sessionId = await client.sessions.create()
    const result = await client.remote.commands.execute(sessionId, `/pm ${line}`, [])
    if (!result.ok) throw new Error(result.error.message)
    const command = result.value?.result
    if (!command) throw new Error('pm 命令没有返回结果')
    if (command.kind === 'error') throw new Error(command.text)
    return command.text ?? ''
  }
  client.slots.inject('main', () => client.slots.register({
    name: 'main',
    key: PANEL_ID,
    inject: (): PmPanelApi => ({ execute }),
  }, PmPanel))
  client.slots.inject('sidebar.panellist', () => client.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 15,
    label: () => '项目管理',
  }, PmIcon))
}

function PmIcon({ size }: { size: number }) {
  return <span aria-hidden style={{ fontSize: Math.max(11, size * 0.42), fontWeight: 800 }}>PM</span>
}
