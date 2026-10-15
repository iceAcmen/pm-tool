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

const config: UserConfig = {
  entry: { client: 'lib/client/index.js' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  clean: false,
  dts: false,
  sourcemap: true,
  plugins: [rawCssPlugin],
  // react-dom / react-dom/client 由 dsh Web 宿主冻结模块表提供（与 react 同列 PLATFORM_MODULES），
  // 必须 external：打进 bundle 会出现第二个 React 渲染器、hooks 崩。
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  // tsdown 默认把 dependencies 当 external；以下库需内联进单 CJS（宿主模块表答不出它们）。
  // react-grid-layout 及其运行时传递依赖（隔离 POC 已验证可打包）。
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
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default config
