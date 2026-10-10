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
  external: ['react', 'react/jsx-runtime'],
  noExternal: [/^lucide-react(?:\/|$)/],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default config
