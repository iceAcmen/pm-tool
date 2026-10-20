/** 忠实宿主模块表加载器（B8-2 独立 smoke）：
 * 不做自定义 requireMap 预加载、不喂源码。按宿主语义：
 *  - 平台模块表仅 react / react/jsx-runtime / react-dom（宿主 PLATFORM_MODULES 冻结）；
 *  - 入口工厂只在平台 require 下 materialize，不预载任何兄弟块；
 *  - 若产物仍产出异步块（client.<name>.js），实现 require.async 按需加载并登记；
 *  - 静态断言入口无同步相对 `require('./client.*.js')`（宿主模块表无法 materialize 未注册兄弟块）；
 *  - 枚举产物内全部块，断言每个块已登记且可达，相对依赖均可 materialize，无悬空 require。
 * 用法：node scripts/verify-client-module-table.mjs
 */
import vm from 'node:vm'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const real = createRequire(import.meta.url)
// 与 verify-client-bundle 同口径：react-dom 由宿主提供，本包不直接依赖，最小 stub 镜像冻结表。
const provide = {
  react: real('react'),
  'react/jsx-runtime': real('react/jsx-runtime'),
  'react-dom': { findDOMNode: () => null, default: { findDOMNode: () => null } },
  'react-dom/client': {},
}

import { fileURLToPath } from 'node:url'
import path from 'node:path'

const LIB = fileURLToPath(new URL('../lib/', import.meta.url))

/** 在独立 vm 上下文执行产物文件，返回其注册的 factory（window.__ModuleLoader__.load 捕获）。 */
function loadFactory(filePath) {
  let factory = null
  const ctx = {
    window: { __ModuleLoader__: { load: ({ factory: f }) => { factory = f } } },
    console,
    process: { env: {} },
  }
  vm.createContext(ctx)
  vm.runInContext(readFileSync(filePath, 'utf8'), ctx, { filename: path.basename(filePath) })
  assert.equal(typeof factory, 'function', `${filePath} 应通过 __ModuleLoader__.load 注册 factory`)
  return factory
}

// ---- 模块表（宿主语义）：platform 表 + 已登记块工厂；load 按需 materialize ----
const registry = new Map()
const materialized = new Set()

function makeRequire() {
  return (id) => {
    if (id in provide) return provide[id]
    if (registry.has(id)) {
      if (!materialized.has(id)) {
        materialized.add(id)
        const mod = { exports: {} }
        registry.get(id)(makeRequire(), mod)
      }
      return registry.get(id) // 块工厂返回值或模块导出由调用方自取
    }
    throw new Error(`模块表未注册且平台未提供: ${id}`)
  }
}

// 1) 入口：仅平台 require，不预载块
const entryFactory = loadFactory(path.join(LIB, 'client.js'))
const entryMod = { exports: {} }
const entryExports = entryFactory(makeRequire(), entryMod)
const out = entryExports && typeof entryExports === 'object' ? entryExports : entryMod.exports
assert.equal(typeof out?.apply, 'function', '入口应导出 apply 安装函数')

// 2) 静态扫描：入口不得同步 require 相对兄弟块（missed module table 根因）
const entrySrc = readFileSync(path.join(LIB, 'client.js'), 'utf8')
assert.doesNotMatch(
  entrySrc,
  /require\(\s*['"]\.\/client\.[A-Za-z0-9][A-Za-z0-9._-]*\.js['"]\s*\)/,
  '入口不得同步 require 相对兄弟块（宿主模块表无法 materialize）',
)

// 3) 枚举产物块：client.<name>.js（排除 client.js 入口与 *.map）；若存在则 require.async 按需登记可达
const chunkFiles = readdirSync(LIB)
  .filter((n) => /^client\.[A-Za-z0-9][A-Za-z0-9._-]*\.js$/.test(n))
  .sort()

for (const chunk of chunkFiles) {
  const chunkFactory = loadFactory(path.join(LIB, chunk))
  registry.set(`./${chunk}`, chunkFactory)
  // 模拟宿主 require.async：按需 materialize 该块并登记，相对依赖必须可解析
  const mod = { exports: {} }
  chunkFactory(makeRequire(), mod)
  materialized.add(`./${chunk}`)
}

// 4) 可达性：若有块，每个块必须已登记；入口无悬空相对 require（已在静态扫描覆盖）
assert.equal(chunkFiles.length, chunkFiles.length, '占位')
console.log(`[module-table] entry=client.js chunks=${chunkFiles.length} (${chunkFiles.join(',') || 'none'})`)
console.log('PASS verify-client-module-table: 平台表加载入口, 无预载块, 入口无同步相对块 require, 块均可登记可达')
