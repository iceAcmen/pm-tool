import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve as resolvePath } from 'node:path'
import ts from '/private/tmp/pmtool-all-closure-20261021/packages/dsh-pm-tool/node_modules/typescript/lib/typescript.js'

const root = process.env.A10_SOURCE_ROOT
const source = join(root, 'src')
// 私有 SOURCE 设施：原 verify 保持字节不变，lib 模块引用仅映射至本轮冻结源码。
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    let path = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier)
    if (path.startsWith(join(root, 'lib') + '/')) path = source + path.slice(join(root, 'lib').length)
    if (path.startsWith(source + '/') && path.endsWith('.js')) {
      for (const extension of ['.ts', '.tsx']) {
        const candidate = path.slice(0, -3) + extension
        if (existsSync(candidate)) return { url: pathToFileURL(candidate).href, shortCircuit: true }
      }
    }
  }
  return nextResolve(specifier, context)
}
export async function load(url, context, nextLoad) {
  if (url.startsWith(pathToFileURL(source + '/').href) && /\.tsx?$/.test(url)) {
    const path = fileURLToPath(url)
    return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(path, 'utf8'), {
        fileName: path,
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      }).outputText,
    }
  }
  return nextLoad(url, context)
}
