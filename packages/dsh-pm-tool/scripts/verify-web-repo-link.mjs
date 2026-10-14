/**
 * T7 / v0.7.0 Web 接线专项：task / deliverable 可选 repoUrl·branch 的浏览器侧往返。
 *
 * 与 scripts/verify-task-repo.mjs（core T7-C1..C10 / X1..X3）分工：
 *  - core 专项断言 schema / 落盘省略 / 局部更新不误触 / 非法拒绝 / 离线；
 *  - 本脚本断言**浏览器真正拿到的形状**：`web snapshot` 把 repoUrl/branch 透传到
 *    task / deliverable 记录（client 才能预填表单、渲染只读链接行），且清空传空串后
 *    落盘省略该键。
 *
 * 诚实边界：表单内联 role=alert / aria-invalid 拦截、抽屉只读 anchor target=_blank 的
 * 真实点击（T7-W1..W4）由真实浏览器 GUI 门实测；本 Node 脚本只证明 snapshot 形状与 bundle 锚点契约。
 *
 * 运行：先 `pnpm run build` 生成 lib/，再 `node scripts/verify-web-repo-link.mjs`。
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
import { apply } from '../lib/index.js'

delete process.env.DEEPSEEK_API_KEY
const here = dirname(fileURLToPath(import.meta.url))
const root = mkdtempSync(join(tmpdir(), 'pm-tool-web-repo-'))
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
  return result
}
async function runOk(rawInput) {
  const result = await run(rawInput)
  assert.equal(result.kind, 'success', `${rawInput}：${result.text}`)
  return result.text
}
async function snapshot() {
  return JSON.parse(await runOk('web snapshot'))
}

try {
  await apply(ctx)
  await runOk('project add {"name":"仓库项目","startDate":"2026-10-10","targetDate":"2026-12-31"}')

  // 任务：合法 repoUrl+branch 写入，web snapshot 应原值带出（client 据此预填/渲染链接行）。
  await runOk('task add {"projectId":"p-0001","title":"仓库任务","repoUrl":"https://github.com/org/repo.git","branch":"main"}')
  let snap = await snapshot()
  assert.equal(snap.tasks[0].repoUrl, 'https://github.com/org/repo.git', 'web snapshot 任务应带出 repoUrl')
  assert.equal(snap.tasks[0].branch, 'main', 'web snapshot 任务应带出 branch')

  // 任务：局部只改 branch（不动 repoUrl），repoUrl 不得漂移。
  await runOk('task update t-0001 {"branch":"develop"}')
  snap = await snapshot()
  assert.equal(snap.tasks[0].repoUrl, 'https://github.com/org/repo.git', '局部改 branch 不应误删 repoUrl')
  assert.equal(snap.tasks[0].branch, 'develop')

  // 任务：清空传空串 → core 落盘省略该键（snapshot 不含两键，非空串）。
  await runOk('task update t-0001 {"repoUrl":"","branch":""}')
  snap = await snapshot()
  assert.equal(Object.prototype.hasOwnProperty.call(snap.tasks[0], 'repoUrl'), false, '清空后任务记录不得含 repoUrl 键')
  assert.equal(Object.prototype.hasOwnProperty.call(snap.tasks[0], 'branch'), false, '清空后任务记录不得含 branch 键')

  // 任务：非法 repoUrl 经命令层中文拒绝（client 内联拦截的后端对齐口径）。
  const badTask = await run('task add {"projectId":"p-0001","title":"坏仓库","repoUrl":"not a url"}')
  assert.equal(badTask.kind, 'error', '非法 repoUrl 应被 clean 拒绝')
  assert.match(badTask.text, /仓库地址/)

  // 交付物：合法 repoUrl+branch 往返。
  await runOk('deliverable add {"projectId":"p-0001","name":"仓库交付物","version":"v1.0","status":"planned","location":"x.md","repoUrl":"git@github.com:org/d.git","branch":"release/1"}')
  snap = await snapshot()
  assert.equal(snap.deliverables[0].repoUrl, 'git@github.com:org/d.git')
  assert.equal(snap.deliverables[0].branch, 'release/1')
  // 交付物：只改 repoUrl 不追加 history（条数不变）——history 仍是创建时那一条。
  await runOk('deliverable update dlv-0001 {"repoUrl":"https://github.com/org/d2.git"}')
  snap = await snapshot()
  assert.equal(snap.deliverables[0].repoUrl, 'https://github.com/org/d2.git')
  assert.equal(snap.deliverables[0].history.length, 1, '只改 repoUrl 不得追加留痕')
  // 交付物：清空 repoUrl/branch → 省略键。
  await runOk('deliverable update dlv-0001 {"repoUrl":"","branch":""}')
  snap = await snapshot()
  assert.equal(Object.prototype.hasOwnProperty.call(snap.deliverables[0], 'repoUrl'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(snap.deliverables[0], 'branch'), false)

  // bundle 锚点契约：只读链接行复用 pm-repo-row + 稳定 data-repo-link，外链新标签安全打开。
  const bundle = readFileSync(join(here, '..', 'lib', 'client.js'), 'utf8')
  assert.match(bundle, /data-repo-link/, '抽屉只读链接行应有稳定 data-repo-link 钩子')
  assert.match(bundle, /target:\s*"_blank"/, '仓库外链应新标签打开')
  assert.match(bundle, /noopener noreferrer/, '外链应带 rel=noopener noreferrer')
  assert.match(bundle, /pm-repo-row/, '复用项目级 pm-repo-row 样式')
  // task / deliverable 抽屉新增的两个可选 repo 输入（区别于既有项目表单），稳定钩子。
  assert.match(bundle, /data-repo-field":\s*"repoUrl"/, '任务/交付物表单应有 repoUrl 可选输入（稳定 data-repo-field 钩子）')
  assert.match(bundle, /data-repo-field":\s*"branch"/, '任务/交付物表单应有 branch 可选输入（稳定 data-repo-field 钩子）')

  console.log('通过：task/deliverable 合法 repoUrl·branch 经 web snapshot 原值带出，局部更新不误触、清空省略键。')
  console.log('通过：deliverable 只改 repoUrl 不追加 history；非法 repoUrl 命令层中文拒绝。')
  console.log('通过：client bundle 含 pm-repo-row 只读链接行锚点契约（data-repo-link / target=_blank / noopener noreferrer）。')
} finally {
  await facility.closeAll()
}
