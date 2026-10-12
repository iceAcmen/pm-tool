/**
 * 第 0 步「打通验证」——存储链路独立校验脚本（不经过模型、不启动 Web）。
 *
 * 作用：用真实的 Cordis 内核装载 dsh 存储三件套（storage / storage-json /
 * storage-domain），然后执行与 src/index.ts 中 `/pm selftest` 完全相同的
 * defineDomain → open → put → get 流程，最后把落盘的可读 JSON 打印出来。
 *
 * 运行环境：macOS + Node v22（nvm）；在包目录执行 `node scripts/verify-storage.mjs`。
 *
 * 隔离约定（ADL-verify-isolation）：
 *   - 默认 dataRoot = os.tmpdir() 下一次性 mkdtemp，**绝不默认写正式 pm-tool/data**；
 *   - 仅当显式设置 PM_DATA_ROOT 时才使用指定目录（外层 guard 定向独立样本时使用）；
 *   - 启动时打印所用 root，便于人工核对落点。
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
import { pmDomainSpec } from '../lib/core/storage.js'

const here = dirname(fileURLToPath(import.meta.url))
// scripts/ 上三级即产品仓库根：packages/dsh-pm-tool/scripts -> pm-tool
// 默认隔离到系统临时目录；只有显式 PM_DATA_ROOT 才使用调用方指定的目录。
const dataRoot = process.env.PM_DATA_ROOT
  || mkdtempSync(join(tmpdir(), 'pm-tool-verify-storage-'))
console.log('[verify-storage] 数据根（隔离）= ' + dataRoot)
console.log('[verify-storage] PM_DATA_ROOT 环境变量 = ' + (process.env.PM_DATA_ROOT || '(未设置，使用一次性临时目录)'))

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
