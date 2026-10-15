/** 非GUI 真实 client bundle 激活测试：
 * vm 模拟宿主 ModuleLoader，require 仅允许 react/react-jsx-runtime（真实对象）；
 * 任何残留外部 require(如 zod)即失败。随后取 factory 返回 exports，断言 apply 为函数，
 * 并以最小 mock ctx（slots.inject/register + remote/sessions）调用 apply，
 * 断言 main 与 sidebar.panellist 两个 slot 注册被触发。 */
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import module from 'node:module'
const real = module.createRequire(import.meta.url)
// react-dom / react-dom/client 由 dsh 宿主 PLATFORM_MODULES 提供（react-grid-layout→react-draggable 顶层 require）；
// 本包不直接依赖 react-dom，故用最小 stub 镜像宿主冻结表（apply 仅注册 slot，不触发拖拽/findDOMNode），
// 避免把宿主提供的模块误判为 bundle 内泄漏。
const provide = {
  react: real('react'),
  'react/jsx-runtime': real('react/jsx-runtime'),
  'react-dom': { findDOMNode: () => null, default: { findDOMNode: () => null } },
  'react-dom/client': {},
}
const src = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
let captured = null
const win = { __ModuleLoader__: { load: ({ factory }) => { captured = factory } } }
const ctx = { window: win, console, process: { env: {} } }
vm.createContext(ctx)
vm.runInContext(src, ctx, { filename: 'client.js' })
assert.equal(typeof captured, 'function', '宿主 ModuleLoader 应收到 factory')
const mod = { exports: {} }
const exports_ = captured((id) => {
  if (!(id in provide)) throw new Error('client bundle 引用了宿主未提供的模块: ' + id)
  return provide[id]
}, mod)
const out = exports_ && typeof exports_ === 'object' ? exports_ : mod.exports
assert.equal(typeof out.apply, 'function', '应导出 apply 安装函数')
// 最小 mock ctx
const registeredNames = []
const slots = {
  inject(name, cb) { registeredNames.push(name); cb() },
  register() { return () => {} },
}
const mockCtx = {
  slots,
  remote: {},
  'remote.commands': { execute: async () => ({ kind: 'success', text: '' }) },
  sessions: { current: () => ({ on: () => {} }) },
}
out.apply(mockCtx)
assert.deepEqual(new Set(registeredNames), new Set(['main', 'sidebar.panellist']),
  'apply 应注册 main 与 sidebar.panellist')
console.log('PASS verify-client-bundle: factory 激活, apply 注册 main/sidebar, 仅 react 外部依赖')
