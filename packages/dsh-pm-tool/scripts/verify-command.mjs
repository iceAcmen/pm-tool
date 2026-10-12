/**
 * 第 0 步「打通验证」——直接运行“已构建插件”的命令处理器（不启动 Web、不经过模型）。
 *
 * 做法：用真实 Cordis 内核 + 真实 storage-json 后端（root 指向一个**独立隔离的临时目录**，
 * 绝不默认写正式 pm-tool/data）+ 真实 DomainFacility 装配出 ctx.storageDomain；
 * 命令分发服务用一个仅捕获注册项的轻量桩代替（命令的 UI/会话分发与存储正确性无关）。
 * 随后导入已构建的 `lib/index.js`，执行其真实 apply()，再直接调用它注册的 `/pm`
 * 处理器，依次跑 `ping` 与 `selftest`，验证：
 *   - ping 离线返回中文 pong；
 *   - selftest 经真实处理器写入并读回记录，落为可读 JSON。
 *
 * 隔离约定（ADL-verify-isolation）：
 *   - 默认 dataRoot = os.tmpdir() 下一次性 mkdtemp，运行结束后自行保留（不删除），
 *     与正式 pm-tool/data、共享 packages/backups、用户 home profile 完全隔离；
 *   - 显式设置 PM_DATA_ROOT 时才使用指定目录（仅用于外层 guard 定向到独立样本）；
 *   - 启动时打印所用 root，便于人工核对落点。
 *
 * 运行环境：macOS + Node v22（nvm）；先 `pnpm run build`，再
 *   `node scripts/verify-command.mjs`
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'

const here = dirname(fileURLToPath(import.meta.url))
// 默认隔离到系统临时目录；只有显式 PM_DATA_ROOT 才使用调用方指定的目录。
const dataRoot = process.env.PM_DATA_ROOT
  || mkdtempSync(join(tmpdir(), 'pm-tool-verify-cmd-'))
console.log('[verify-command] 数据根（隔离）= ' + dataRoot)
console.log('[verify-command] PM_DATA_ROOT 环境变量 = ' + (process.env.PM_DATA_ROOT || '(未设置，使用一次性临时目录)'))

// --- 真实存储栈装配（与 verify-storage.mjs 相同，均为官方测试惯用法）---
const ctx = new Context()
await ctx.plugin(Storage)
const backend = new JsonStorageBackend(dataRoot)
ctx.storage.backend.register('json', backend)
const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })

// 提供 storageDomain（真实）与 commands（轻量桩，仅捕获注册的命令定义）
ctx.provide('storageDomain', facility)
let captured
ctx.provide('commands', {
  register(definition) {
    captured = definition
    return () => {}
  },
})

// --- 导入并执行“已构建的发货插件”的真实入口 ---
const pmPlugin = await import('../lib/index.js')
await pmPlugin.apply(ctx)

if (!captured) {
  console.error('未捕获到命令定义：插件 apply 未调用 ctx.commands.register')
  process.exit(1)
}
console.log('已注册命令：', captured.name, '—', captured.description)

// 直接调用真实处理器（绕过会话/UI；处理器只依赖 rawInput 与内部存储领域）
const ping = await captured.handler({ rawInput: 'ping', attachments: [] })
console.log('\n===== /pm ping =====')
console.log('[' + ping.kind + ']', ping.text)
assert.equal(ping.kind, 'success')
assert.match(ping.text, /pong：/)

const selftest = await captured.handler({ rawInput: 'selftest', attachments: [] })
console.log('\n===== /pm selftest =====')
console.log('[' + selftest.kind + ']')
console.log(selftest.text)
assert.equal(selftest.kind, 'success')
assert.match(selftest.text, /存储自检通过/)

const file = join(dataRoot, 'pmtool', 'checks', 'selftest.json')
const dir = join(dataRoot, 'pmtool', 'checks')
console.log('\n落盘文件存在 =', existsSync(file))
console.log('落盘文件路径 =', file)
console.log('目录权限位 =', '0' + (statSync(dir).mode & 0o777).toString(8))
console.log('---- 文件内容（人类可读 JSON）----')
console.log(readFileSync(file, 'utf8'))

const saved = JSON.parse(readFileSync(file, 'utf8'))
assert.equal(saved.version, 1)
assert.equal(saved.record.ok, true)
assert.equal(statSync(dir).mode & 0o777, 0o700)
await facility.closeAll()
