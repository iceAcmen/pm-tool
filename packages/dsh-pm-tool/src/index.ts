/**
 * dsh-pm-tool：面向项目经理的项目管理工具。
 *
 * 第 0 步「打通验证」版本：只验证两件事——
 *   1) 独立仓库插件能被本地 dsh 装载，并注册离线斜杠命令 `/pm ping`；
 *   2) 经 storage-domain + storage-json 写入/读回一条记录，落为可读 JSON（`/pm selftest`）。
 * 业务功能（项目 / WBS / 里程碑）在打通后于后续步骤实现。
 *
 * @module dsh-pm-tool
 */

import type { Context } from '@deepseek-ai/cordis'
import { CommandDefinitionId } from '@deepseek-ai/dsh-commands/brand'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'

/** Cordis 插件名（注册、日志、配置 id 均以此为准）。 */
export const name = 'pm-tool'

/** 依赖的宿主服务：commands=离线斜杠命令；storageDomain=类型化文件存储。 */
export const inject = ['commands', 'storageDomain'] as const

/** 自检记录结构（schema 校验用 zod；存储后端为 JSON 文件）。 */
const checkRecordSchema = z.object({
  ok: z.boolean(),
  at: z.string(),
  note: z.string(),
})

/** 自检领域：单元名 pmtool，per-record 布局（每条记录一个 JSON 文件）。 */
const checkDomainSpec = defineDomain({
  name: 'pmtool',
  version: 1,
  layout: 'per-record',
  tables: {
    checks: domainTable(checkRecordSchema),
  },
})

/** 在给定上下文打开自检领域（包成函数以便 TypeScript 据具体 spec 推导表类型）。 */
function openCheckDomain(ctx: Context) {
  return ctx.storageDomain.open(checkDomainSpec)
}

/** 打开的领域句柄类型；存储未就绪时为 undefined，命令会给出友好提示。 */
type CheckDomain = Awaited<ReturnType<typeof openCheckDomain>>

/** `/pm` 帮助文本。 */
function renderHelp(): CommandResult {
  return {
    kind: 'success',
    text: [
      '项目管理工作台（dsh-pm-tool）已加载，当前为离线命令、无需 API Key。',
      '',
      '可用命令：',
      '  /pm ping      连通性自检',
      '  /pm selftest  写入并读回一条记录，验证可读 JSON 文件存储',
    ].join('\n'),
  }
}

/** 插件入口：注册命令并尝试打开存储领域。 */
export async function apply(ctx: Context): Promise<void> {
  let checkDomain: CheckDomain | undefined
  try {
    checkDomain = await openCheckDomain(ctx)
    console.info('[pm-tool] 存储领域 pmtool 已打开')
  } catch (error) {
    // 存储未配置好时不应阻断命令注册；selftest 会提示具体原因。
    console.warn('[pm-tool] 存储领域打开失败：', error)
  }

  ctx.commands.register({
    definitionId: CommandDefinitionId('dsh-pm-tool'),
    name: 'pm',
    description: '项目管理工作台：/pm ping、/pm selftest',
    input: { hint: '[ping|selftest]', attachments: false },
    handler: async (invocation: CommandInvocation): Promise<CommandResult> => {
      const sub = invocation.rawInput.trim().toLowerCase()

      if (sub === 'ping') {
        return {
          kind: 'success',
          text: 'pong：项目管理工作台插件已加载。这是离线命令，当前未使用任何模型或 API Key。',
        }
      }

      if (sub === 'selftest') {
        if (!checkDomain) {
          return {
            kind: 'error',
            text: '存储领域未就绪：请确认 profile 已启用 @deepseek-ai/dsh-storage-json（配置 root）与 dsh-storage-domain（backend: json）。',
          }
        }
        try {
          const at = new Date().toISOString()
          const table = checkDomain.table('checks')
          // 记录键名仅允许 [a-zA-Z0-9_-]+；put 为异步写盘，必须 await 后再读回
          await table.put('selftest', { ok: true, at, note: 'dsh-pm-tool 第 0 步打通验证' })
          const back = table.get('selftest')
          return {
            kind: 'success',
            text: [
              '存储自检通过：已写入并读回一条记录。',
              `内容：${JSON.stringify(back, null, 2)}`,
              '该记录以可读 JSON 落在 storage-json 的 root 目录下：pmtool/checks/selftest.json。',
            ].join('\n'),
          }
        } catch (error) {
          return { kind: 'error', text: `存储自检失败：${String(error)}` }
        }
      }

      return renderHelp()
    },
  })
}
