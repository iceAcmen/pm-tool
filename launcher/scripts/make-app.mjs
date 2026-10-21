#!/usr/bin/env node
/**
 * 写出可点击本机应用入口 `*.app`（零编译、零重依赖、不写全局）。
 *
 * 绑定稳定路径：启动器指向仓内 bin/pm-launcher.mjs；node 优先烤稳定 nvm v22 真实路径，
 * 不烤沙箱/agent/私有 session 的临时 node；壳内仍有 nvm/`env node` 兜底。
 *
 * 构建时安全绑定（白名单字符，烤进壳内 export；不写 system env/launchctl）：
 *   --port 3199          隔离验收端口（默认不烤，走启动器默认 3172）
 *   --host 127.0.0.1
 *   --dsh-home <path>    独立 iso3 DSH_HOME（可选；服务 profile 由测试者决定启动）
 *   --name <名称>        bundle 名（默认 PM工作台）
 * 用法：node scripts/make-app.mjs [输出目录] [--port P] [--host H] [--dsh-home D] [--name N]
 */
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { buildLocalAppBundle } from '../src/local-app.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = dirname(here)

/** 稳定 nvm v22 真实 node（不使用当前进程的沙箱私有 node）。 */
function stableNvmNode() {
  const base = join(homedir(), '.nvm', 'versions', 'node')
  if (!existsSync(base)) return ''
  for (const v of readdirSync(base).sort().reverse()) {
    if (/^v22\./.test(v)) {
      const p = join(base, v, 'bin', 'node')
      if (existsSync(p)) return p
    }
  }
  return ''
}

const args = process.argv.slice(2)
const flags = {}
const positionals = []
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--port' || a === '--host' || a === '--dsh-home' || a === '--name') {
    flags[a.slice(2)] = args[++i]
  } else {
    positionals.push(a)
  }
}

const outDir = positionals[0] ? join(positionals[0]) : join(root, 'dist')
const bundle = buildLocalAppBundle({
  outDir,
  name: flags.name,
  nodePath: stableNvmNode(),
  launcherBin: join(root, 'bin', 'pm-launcher.mjs'),
  host: flags.host,
  port: flags.port,
  dshHome: flags['dsh-home'],
})

console.log(bundle)
