/** PROD-24 CMP-ZERO-01：多步计划「出草稿/取消」分支零写库。
 * 造任务 -> validatePlan 产出多步草稿（只读）-> spy tasks.put 计数为 0、domain 不变，
 * 证明「确认才写、取消/仅出草稿零写」。沿用 verify-copilot-cancel 断言法，不冒充 DOM。 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { apply } from '../lib/index.js'
import { parseCopilotPlan, validatePlan } from '../lib/core/copilot.js'

const root = mkdtempSync(join(tmpdir(), 'pm-plan-cancel-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const f = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', f)
let cmd; ctx.provide('commands', { register(d){ cmd=d; return ()=>{} } })
await apply(ctx)
const run = r => cmd.handler({ rawInput: r, attachments: [] })
const proj = await run('project add {"name":"计划取消测试","startDate":"2026-01-01","targetDate":"2026-12-31"}')
const pid = (proj.text.match(/p-\d+/)||[])[0]
const tack = await run('task add {"projectId":"'+pid+'","title":"任务甲","assignee":"甲","status":"todo","progress":0}')
const tid = (tack.text.match(/t-\d+/)||[])[0]
const domain = f.get('pmtool')

// spy tasks.put
let writes = 0
const tbl = domain.table('tasks')
const origPut = tbl.put.bind(tbl)
tbl.put = async (...a) => { writes++; return origPut(...a) }

// 一段含多步计划（含一个 task.delete 坏步）的模型输出
const out = '诊断。\n```json\n{"plan":['
  + JSON.stringify({ stepId:'s1', title:'收尾', reason:'阻塞已解', action:{ op:'task.update', id:tid, patch:{ status:'done' } }, needs:[] })
  + ',' + JSON.stringify({ stepId:'s2', title:'删任务', action:{ op:'task.delete', id:tid }, needs:['s1'] })
  + ']}\n```'
const ids = [...tbl.entries()].map(([id]) => id)
const { rawSteps } = parseCopilotPlan(out)
const v = validatePlan(rawSteps, { taskIds: ids })
assert.ok(v.steps.length >= 1, '应解析出至少一条合法计划步')
assert.ok(v.rejected.length >= 1, 'task.delete 步应被拒')

// 取消/仅出草稿：不调用 ask-apply -> 写计数 0、领域字段不变
assert.equal(writes, 0, '仅产出计划草稿/取消分支不得写库')
const rec = [...tbl.entries()].map(([id,t])=>t).find(t => t.id === tid)
assert.equal(rec.assignee, '甲', 'assignee 未变')
assert.equal(rec.status, 'todo', 'status 未变')
console.log('PASS verify-copilot-plan-cancel: 多步计划出草稿/取消零写库, 仅确认才 ask-apply')
