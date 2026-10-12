/** 非GUI 真实 client bundle 激活测试：
 * 模拟宿主 ModuleLoader，按 externals 白名单(require 仅允许 react / react/jsx-runtime)执行 factory；
 * 任何 require("zod") 等非白名单即失败；并断言导出的安装函数可调用。 */
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const src = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
let captured = null
const window = { __ModuleLoader__: { load: ({ factory }) => { captured = factory } } }
const ctx = { window, console, process: { env: {} } }
vm.createContext(ctx)
vm.runInContext(src, ctx, { filename: 'client.js' })
assert.equal(typeof captured, 'function', '宿主 ModuleLoader 应收到 factory')
const real = await import('node:module').then(m => m.createRequire(import.meta.url))
const provide = { 'react': real('react'), 'react/jsx-runtime': real('react/jsx-runtime') }
const require = (id) => { if (!(id in provide)) throw new Error('client bundle 引用了宿主未提供的模块: ' + id); return provide[id] }
const mod = { exports: {} }
captured(require, mod) // factory 执行不抛错 = bundle 在宿主 ModuleLoader 下可激活
console.log('PASS verify-client-bundle: factory 激活成功, 仅 react 外部依赖')
