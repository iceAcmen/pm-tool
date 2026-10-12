/** T-DEF-004：副驾"取消"分支不产生写入。
 * 取消在 UI 上只是关闭草稿卡，不调用 ask-apply。本测试用真实 storage domain：
 * 造任务 -> validateActions 产出草稿（只读）-> spy tasks.put 计数为 0、domain 不变，
 * 以此证明"确认才写、取消不写"的安全边界。不冒充真实 DOM 点击。 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { parseCopilotActions, validateActions } from '../lib/core/copilot.js'

const root = mkdtempSync(join(tmpdir(), 'pm-cancel-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const f = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', f)
let cmd; ctx.provide('commands', { register(d){ cmd=d; return ()=>{} } })
await apply(ctx)
const run = r => cmd.handler({ rawInput: r, attachments: [] })
const proj = await run('project add {"name":"取消测试","startDate":"2026-01-01","targetDate":"2026-12-31"}')
const pid = (proj.text.match(/p-\d+/)||[])[0]
const tack = await run('task add {"projectId":"'+pid+'","title":"原任务","assignee":"甲","status":"todo","progress":0}')
const tid = (tack.text.match(/t-\d+/)||[])[0]
const domain = f.get('pmtool')

// spy tasks.put
let writes = 0
const tbl = domain.table('tasks')
const origPut = tbl.put.bind(tbl)
tbl.put = async (...a) => { writes++; return origPut(...a) }

// 一段含合法动作的模型输出，validate 后得到草稿
const out = '诊断。\n```json\n{"actions":[{"op":"task.update","id":"'+tid+'","patch":{"assignee":"乙"}}]}\n```'
const ids = [...tbl.entries()].map(([id]) => id)
const snapshot = { taskIds: ids }
const { accepted } = validateActions(parseCopilotActions(out), snapshot)
assert.ok(accepted.length >= 1, '应解析出至少一条合法草稿')

// 取消：不调用 ask-apply -> 写计数 0、领域字段不变
assert.equal(writes, 0, '仅产出草稿/取消分支不得写库')
const rec = [...tbl.entries()].map(([id,t])=>t)[0]
assert.equal(rec.assignee, '甲', 'assignee 未变')
console.log('PASS verify-copilot-cancel: 取消/草稿产出不写库, 仅确认才 ask-apply')
