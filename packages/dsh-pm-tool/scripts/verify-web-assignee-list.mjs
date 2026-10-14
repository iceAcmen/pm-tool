/**
 * T8 / v0.7.0 Web 接线专项：assignee 输入绑定 <datalist> 候选补全。
 *
 * 与 scripts/verify-person-candidates.mjs（core 纯函数 T8-C1..C6）分工：
 *  - core 专项断言纯函数本身的确定性 / 归一 / 空值剔除 / 零写盘；
 *  - 本脚本断言**浏览器接线**：client 把当前全量 web snapshot 五来源切片喂给
 *    `listAssigneeCandidates`，并在 TaskForm 把结果渲染成稳定 datalist 供「只建议、自由输入」。
 *
 * 诚实边界：datalist 的点选回填展示写法、自由输入落盘、浏览候选零 execute、
 * 候选随最新 snapshot 刷新（T8-W1..W5 的 DOM 交互细节）由真实浏览器 GUI 门实测；
 * 本 Node 脚本只证明（a）真实 snapshot 形状下纯函数输出可复算、（b）bundle 含稳定接线选择器。
 *
 * 运行：先 `pnpm run build` 生成 lib/，再 `node scripts/verify-web-assignee-list.mjs`。
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { listAssigneeCandidates } from '../lib/core/people-candidates.js'
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const here = dirname(fileURLToPath(import.meta.url))
const root = mkdtempSync(join(tmpdir(), 'pm-tool-assignee-list-'))
const ctx = new Context()
await ctx.plugin(Storage)
ctx.storage.backend.register('json', new JsonStorageBackend(root))
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.provide('storageDomain', facility)
let command
ctx.provide('commands', {
  register(definition) { command = definition; return () => {} },
})

async function run(rawInput) {
  const result = await command.handler({ rawInput, attachments: [] })
  assert.equal(result.kind, 'success', `${rawInput}：${result.text}`)
  return result.text
}

try {
  await apply(ctx)
  // 全量 snapshot 五来源各放一个人：project.owner=Alice、task.assignee=alice（仅大小写不同）、
  // riskIssue.owner=（空，验证空来源不报错）、deliverable.owner=Bob、meeting.participants=[Carol]。
  await run('project add {"name":"接线项目","startDate":"2026-10-10","targetDate":"2026-12-31","owner":"Alice"}')
  await run('task add {"projectId":"p-0001","title":"接线任务","assignee":"alice"}')
  await run('risk-issue add {"projectId":"p-0001","type":"risk","title":"接线风险","impact":"high","probability":"medium","owner":""}')
  await run('deliverable add {"projectId":"p-0001","name":"接线交付物","version":"v1.0","status":"planned","owner":"Bob","location":"x.md"}')
  await run('meeting add {"projectId":"p-0001","title":"接线周会","meetingDate":"2026-10-10","participants":["Carol"]}')

  const snapshot = JSON.parse(await run('web snapshot'))

  // (a) client 把全量 snapshot 五来源切片喂给纯函数——用真实 snapshot 形状复算候选。
  // Alice/alice 仅大小写不同 → 归一合并为一个候选；展示写法并列（各 1 次）取首见 "Alice"。
  // 次序 = 五来源固定扫描序的组首见序：project.owner → task.assignee → deliverable.owner → meeting.participants。
  const candidates = listAssigneeCandidates({
    projects: snapshot.projects,
    tasks: snapshot.tasks,
    riskIssues: snapshot.riskIssues,
    deliverables: snapshot.deliverables,
    meetings: snapshot.meetings,
  })
  assert.deepEqual(candidates, ['Alice', 'Bob', 'Carol'], `候选应大小写合并且按首见序：${JSON.stringify(candidates)}`)

  // 空来源安全：只给 tasks 也不抛。
  assert.deepEqual(listAssigneeCandidates({ tasks: [{ assignee: '  新人  ' }] }), ['新人'])

  // (b) bundle 接线契约：TaskForm 执行人 input 绑稳定 datalist，且存在同名 <datalist>。
  const bundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
  // datalist id 至少出现两次：一次是 input 的 list= 绑定，一次是 <datalist id=...> 本体。
  const occurrences = bundle.split('pm-assignee-list').length - 1
  assert.ok(occurrences >= 2, `执行人 datalist 稳定 id pm-assignee-list 应接线（list= 绑定 + <datalist id>），实际命中 ${occurrences} 次`)
  assert.match(bundle, /listAssigneeCandidates/, 'client 必须 import 并调用 listAssigneeCandidates（用全量 snapshot 实时算候选）')
  // datalist 是建议层：绝不下发写命令（候选计算不触发 execute）。这里只断言 import 的是只读纯函数模块名。

  console.log('通过：真实全量 snapshot 五来源喂入 listAssigneeCandidates，Alice/alice 大小写合并为一个、按首见序输出。')
  console.log('通过：client bundle 含稳定 datalist 接线（pm-assignee-list 绑定 + 本体）。')
} finally {
  await facility.closeAll()
}
