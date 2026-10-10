/**
 * 第 0 步「打通验证」——存储链路独立校验脚本（不经过模型、不启动 Web）。
 *
 * 作用：用真实的 Cordis 内核装载 dsh 存储三件套（storage / storage-json /
 * storage-domain），然后执行与 src/index.ts 中 `/pm selftest` 完全相同的
 * defineDomain → open → put → get 流程，最后把落盘的可读 JSON 打印出来。
 *
 * 运行环境：macOS + Node v22（nvm）；在包目录执行 `node scripts/verify-storage.mjs`。
 * 可选环境变量 PM_DATA_ROOT：自定义数据根目录（默认 pm-tool/data）。
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, readFileSync, statSync } from 'node:fs'
import assert from 'node:assert/strict'

import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { pmDomainSpec } from '../lib/core/storage.js'

const here = dirname(fileURLToPath(import.meta.url))
// scripts/ 上三级即产品仓库根：packages/dsh-pm-tool/scripts -> pm-tool
const dataRoot = process.env.PM_DATA_ROOT || join(here, '..', '..', '..', 'data')

// 按官方 storage-domain 测试的惯用法在裸 Cordis 上下文手动挂载：
// 裸 new Context() 不会触发插件 apply 内的 ctx.effect 生命周期，因此不直接
// plugin(storage-json/storage-domain)，而是手动 new 真实 JSON 后端并注册、
// 再挂载 DomainFacility。这与宿主内运行时的最终装配等价（后端都是 storage-json）。
const ctx = new Context()
await ctx.plugin(Storage)

const backend = new JsonStorageBackend(dataRoot)
ctx.storage.backend.register('json', backend)

const facility = new DomainFacility(ctx, { backend: 'json', routes: {} })
ctx.storage.mount('domain', facility)

console.log('已手动注册 json 存储后端（裸上下文不触发 effect，按官方测试惯用法手动挂载）')
const domain = await facility.open(pmDomainSpec)
const table = domain.table('checks')

const at = new Date().toISOString()
await table.put('selftest', { ok: true, at, note: 'dsh-pm-tool 第 0 步打通验证' })
const back = table.get('selftest')

const file = join(dataRoot, 'pmtool', 'checks', 'selftest.json')
const dir = join(dataRoot, 'pmtool', 'checks')

console.log('数据根目录 root =', dataRoot)
console.log('读回记录 get("selftest") =', JSON.stringify(back))
console.log('落盘文件存在 =', existsSync(file))
console.log('落盘文件路径 =', file)
console.log('目录权限位 =', '0' + (statSync(dir).mode & 0o777).toString(8))
console.log('---- 文件内容（人类可读 JSON）----')
console.log(readFileSync(file, 'utf8'))

assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).record, back)
assert.equal(back?.ok, true)
assert.equal(statSync(dir).mode & 0o777, 0o700)
await domain.close()
