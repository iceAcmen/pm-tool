/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { UserConfig } from 'tsdown'

const id = 'dsh-pm-tool'
const rawCssPlugin = {
  name: 'pm-tool-raw-css',
  resolveId(source: string, importer?: string) {
    if (!source.endsWith('.css?raw') || !importer) return null
    return `${resolve(dirname(importer), source.slice(0, -4))}?raw`
  },
  load(moduleId: string) {
    if (!moduleId.endsWith('.css?raw')) return null
    return `export default ${JSON.stringify(readFileSync(moduleId.slice(0, -4), 'utf8'))}`
  },
}

/** 宿主 CLIENT_CHUNK 正则：与 deepseek-harness 模块系统保持一致。 */
const CLIENT_CHUNK = /^client\.[A-Za-z0-9][A-Za-z0-9._-]*\.js$/

/**
 * 复刻宿主 asyncChunkRequirePlugin：CJS 动态 import 经 rolldown 生成
 *   Promise.resolve().then(() => require("./client.<name>.js"))
 * 改写为宿主分块加载操作
 *   require.async("./client.<name>.js")
 * （宿主 require.async 按 CLIENT_CHUNK 把 ./client.<name>.js 解析为同级资源 URL 拉取并注册）。
 * tsdown 0.15.10 不导出 RolldownMagicString，这里用确定性字符串替换（生成表达式唯一）。
 */
function asyncChunkRequirePlugin() {
  return {
    name: 'pm-tool-async-chunk-require',
    renderChunk(code: string, chunk: { dynamicImports: string[] }, outputOptions: { format?: string }) {
      if (outputOptions.format !== 'cjs') return null
      let changed = false
      for (const dynamicImport of chunk.dynamicImports) {
        const fileName = dynamicImport.startsWith('./') ? dynamicImport.slice(2) : dynamicImport
        if (!CLIENT_CHUNK.test(fileName)) continue
        const specifier = `./${fileName}`
        // 匹配 Promise.resolve().then(() => require("./client.x.js"))（单/双引号）
        const call = new RegExp(
          'Promise\\.resolve\\(\\)\\.then\\(\\(\\)\\s*=>\\s*require\\(([\'"])'
            + specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\1\\)\\)',
          'gu',
        )
        if (!call.test(code)) {
          throw new Error(`pm-tool async chunk: dynamic ${JSON.stringify(specifier)} 未找到生成的 import 表达式`)
        }
        code = code.replace(call, `require.async(${JSON.stringify(specifier)})`)
        changed = true
      }
      return changed ? code : null
    },
  }
}

/**
 * 清理 rolldown CJS 分块在【非入口块】里发出的对入口兄弟块的同步死引用：
 *   const require_client = require('./client.js');
 * 宿主模块表只能按 CLIENT_CHUNK 异步加载 ./client.<name>.js；同步 require('./client.js')
 * 既不在 seed/loadCache/factories 里，会在分块 materialize 时直接抛错。该变量在分块里
 * 实际未被引用（rolldown CJS 拆分产物），安全删除；仅当绑定在块内确无其它使用时才删。
 */
function stripDeadEntryRequirePlugin() {
  return {
    name: 'pm-tool-strip-dead-entry-require',
    renderChunk(code: string, chunk: { isEntry: boolean }) {
      if (chunk.isEntry) return null
      let changed = false
      const out = code.replace(
        /(?:const|var|let)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(['"]\.\/client\.js['"]\);?\n?/g,
        (match, name) => {
          const uses = code.match(new RegExp(`\\b${name}\\b`, 'g'))?.length ?? 0
          if (uses <= 1) { changed = true; return '' }
          return match
        },
      )
      return changed ? out : null
    },
  }
}

/**
 * 内联 rolldown 抽出的共享运行时块（\0rolldown/runtime.js → client.chunk.js）。
 * rolldown CJS 多块时把 __toESM/__commonJS 等 helper 抽到独立运行时块，各块顶部发
 *   const require_chunk = require('./client.chunk.js');
 * 宿主只能异步加载 ./client.<name>.js，同步 require 这个运行时兄弟块会崩。这里把运行时
 * helper 内联进【每个消费者块】（运行时是纯函数、无状态，复制多份无害），并删掉该块。
 */
function inlineRuntimeChunkPlugin() {
  return {
    name: 'pm-tool-inline-runtime-chunk',
    generateBundle(_outputOptions: unknown, bundle: Record<string, { type: string, code?: string, fileName: string }>) {
      const runtimeName = Object.keys(bundle).find(n => n === 'client.chunk.js')
      if (!runtimeName) return
      const runtime = bundle[runtimeName]
      if (!runtime || runtime.type !== 'chunk' || !runtime.code) return
      let inner = runtime.code
        .replace(/^window\.__ModuleLoader__\.load\([^]*?factory: \(require\) => \{\n/, '')
        .replace(/var module = \{ exports: \{\} \}; var exports = module\.exports;\n?/, '')
        .replace(/\n?return module\.exports; \} \}\);\s*$/, '')
      for (const [name, out] of Object.entries(bundle)) {
        if (name === runtimeName || out.type !== 'chunk' || !out.code) continue
        const m = out.code.match(/(?:const|var|let)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(['"]\.\/client\.chunk\.js['"]\);?/)
        if (!m) continue
        const binding = m[1]
        out.code = out.code.replace(m[0], inner.trim())
        out.code = out.code.split(`${binding}.`).join('')
      }
      delete bundle[runtimeName]
      const mapName = runtimeName + '.map'
      if (bundle[mapName]) delete bundle[mapName]
    },
  }
}

/**
 * B8-2 内联【同步共享块】：rolldown 把入口与编辑器共用的 zod（校验 schema）抽成 client.schemas.js，
 * 入口/编辑器工厂同步 `require('./client.schemas.js')`。宿主模块表只注册入口工厂，无法 materialize
 * 未注册兄弟块 → missed module table / 插件加载失败。
 * 做法：把同步被消费者 require 的共享块（schemas）剥离 ModuleLoader 包装，取其 factory body，
 * 在每个消费者块里把 `const require_x = require('./client.schemas.js')` 替换为自包含 IIFE
 * `const require_x = (() => { var module={exports:{}}; var exports=module.exports; <body>; return module.exports })()`，
 * 并删除该共享块及其 sourcemap。异步 editor/formula-expr 的 require.async 保持不变（仍懒拆分）。
 * 安全：共享块无相对依赖（仅 zod 内部，已内联），body 无状态、纯函数，多份复制无害。
 */
function inlineSyncSharedChunkPlugin() {
  return {
    name: 'pm-tool-inline-sync-shared-chunk',
    generateBundle(_outputOptions: unknown, bundle: Record<string, { type: string, code?: string, fileName: string }>) {
      // 收集：被其它块同步 require 的非入口块（候选共享块）。
      const chunkFiles = Object.keys(bundle).filter(n => bundle[n].type === 'chunk')
      const syncRequired = new Set<string>()
      for (const name of chunkFiles) {
        const code = bundle[name].code || ''
        const re = /require\(['"]\.\/(client\.[A-Za-z0-9][A-Za-z0-9._-]*\.js)['"]\)/g
        let m: RegExpExecArray | null
        while ((m = re.exec(code))) syncRequired.add(m[1])
      }
      for (const sharedName of syncRequired) {
        const shared = bundle[sharedName]
        if (!shared || shared.type !== 'chunk' || !shared.code) continue
        // 剥离 ModuleLoader 外壳：头 `__ModuleLoader__.load({id, chunk, factory:(require)=>{`，尾 `return module.exports; } });`，
        // 去掉 intro `var module = {exports:{}}; var exports=module.exports;`（IIFE 内重新声明，避免重复）。
        let inner = shared.code
          .replace(/^window\.__ModuleLoader__\.load\([^]*?factory: \(require\) => \{\n/, '')
          .replace(/var module = \{ exports: \{\} \}; var exports = module\.exports;\n?/, '')
          .replace(/return module\.exports; \} \}\);/, '')
          .replace(/\/\/# sourceMappingURL=\S+/, '')
        const iife = `(() => { var module = { exports: {} }; var exports = module.exports;\n${inner.trim()}\nreturn module.exports })()`
        for (const name of chunkFiles) {
          if (name === sharedName) continue
          const out = bundle[name]
          if (out.type !== 'chunk' || !out.code) continue
          // 先剥离内嵌在字符串字面量里的死代码样本（避免声明替换误中字符串，破坏字符串/模板）。
          out.code = out.code.replace(/\\const require_schemas = require\(['"]\.\/client\.schemas\.js['"]\);?/g, '')
          out.code = out.code.replace(
            /(?:^|(?<=[;{}\n]))\s*(?:const|var|let)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(['"]\.\/client\.schemas\.js['"]\);?/gm,
            (_m: string, binding: string) => `const ${binding} = ${iife}`,
          )
        }
        delete bundle[sharedName]
        const mapName = sharedName + '.map'
        if (bundle[mapName]) delete bundle[mapName]
      }
    },
  }
}

const config: UserConfig = {
  entry: { client: 'lib/client/index.js' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  clean: false,
  dts: false,
  sourcemap: true,
  plugins: [rawCssPlugin, asyncChunkRequirePlugin(), stripDeadEntryRequirePlugin(), inlineRuntimeChunkPlugin(), inlineSyncSharedChunkPlugin()],
  // react-dom / react-dom/client 由 dsh Web 宿主冻结模块表提供（与 react 同列 PLATFORM_MODULES），
  // 必须 external：打进 bundle 会出现第二个 React 渲染器、hooks 崩。
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  // tsdown 默认把 dependencies 当 external；以下库需内联进 CJS（宿主模块表答不出它们）。
  // 浏览态拆分后：RGL 系 / zod / expr-eval 内联进【编辑器异步块】，主块不再静态引用它们。
  noExternal: [
    /^lucide-react(?:\/|$)/,
    /^react-grid-layout(?:\/|$)/,
    /^react-draggable(?:\/|$)/,
    /^react-resizable(?:\/|$)/,
    /^resize-observer-polyfill(?:\/|$)/,
    /^fast-equals(?:\/|$)/,
    /^clsx(?:\/|$)/,
    /^prop-types(?:\/|$)/,
    /^loose-envify(?:\/|$)/,
    /^js-tokens(?:\/|$)/,
    /^object-assign(?:\/|$)/,
    /^zod(?:\/|$)/,
    /^expr-eval(?:\/|$)/,
  ],
  // dnd-kit 式 CJS 分支所需：与宿主 clientConfig 对齐，避免运行时取错 dev/prod 构建。
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  inputOptions: {
    resolve: {
      conditionNames: ['production', 'browser', 'import', 'module', 'default'],
    },
  },
  outputOptions: {
    entryFileNames: 'client.js',
    // 非入口异步块命名为 client.<name>.js，与宿主 CLIENT_CHUNK 正则对齐。
    chunkFileNames: 'client.[name].js',
    // 入口块注册 {id, factory}；非入口块额外带 chunk 字段，宿主据此登记为包内分块。
    banner: (chunk: { isEntry: boolean, fileName: string }) =>
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, ${chunk.isEntry ? '' : `chunk: ${JSON.stringify(chunk.fileName)}, `}factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default config
