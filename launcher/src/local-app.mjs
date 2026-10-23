/**
 * 本机可点击应用入口（macOS .app bundle，零编译、零重依赖、不写全局系统）。
 *
 * 形态：最小 LaunchServices 可识别的 .app 目录；可执行壳负责在 Finder 极简环境里
 * 定位稳定的 Node 22 并转发到稳定的启动器可执行文件。不复制 cookie、不外取 token、
 * 不注册全局、不杀进程、不争端口；Chrome `--app=` 专用窗仅是浏览器专用窗，不替代本 bundle。
 *
 * 失败诚实：找不到 node / 启动器缺失时弹窗说明并退出，不假装成功；日志只落非敏感信息。
 */
import { mkdirSync, writeFileSync, chmodSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** POSIX 单引号字面量：路径中的引号通过结束/转义/重开保留，不参与壳语法。 */
function shellLiteral(value) {
  return "'" + String(value).replaceAll("'", "'\\''") + "'"
}

function plistXml({ name, identifier, executable }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>${name}</string>
  <key>CFBundleDisplayName</key><string>${name}</string>
  <key>CFBundleIdentifier</key><string>${identifier}</string>
  <key>CFBundleExecutable</key><string>${executable}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
`
}

/**
 * 在 outDir 写出 `<name>.app` 并返回 bundle 绝对路径。
 * @param {{outDir:string, name?:string, nodePath?:string, launcherBin:string, identifier?:string,
 *          host?:string, port?:string|number, dshHome?:string}} opts
 * nodePath 可为空：壳内按「已烤稳定 node → 加载 nvm 用 22 → env node」顺序兜底。
 * host/port/dshHome 为构建时安全绑定（仅白名单字符），烤进壳内 export；默认不烤，走启动器默认。
 */
export function buildLocalAppBundle(opts) {
  const outDir = resolve(opts.outDir)
  const name = opts.name || 'PM工作台'
  const identifier = opts.identifier || 'local.dev.pm-launcher'
  const bakedNode = opts.nodePath ? resolve(opts.nodePath) : ''
  const launcherBin = resolve(opts.launcherBin)

  // 构建时绑定值白名单：字母数字、_ . : / -；拒绝空格/引号/分号等，防壳注入。
  const SAFE = /^[A-Za-z0-9_.:/-]+$/
  const bakedEnv = []
  for (const [key, raw] of [['PM_HOST', opts.host], ['PM_PORT', opts.port], ['DSH_HOME', opts.dshHome]]) {
    if (raw === undefined || raw === null || raw === '') continue
    const v = String(raw)
    if (!SAFE.test(v)) throw new Error(`unsafe ${key} value: ${v}`)
    bakedEnv.push(`export ${key}='${v}'`)
  }
  const envBlock = bakedEnv.length ? bakedEnv.join('\n') + '\n' : ''

  const bundle = join(outDir, `${name}.app`)
  const macos = join(bundle, 'Contents', 'MacOS')
  mkdirSync(macos, { recursive: true })

  writeFileSync(join(bundle, 'Contents', 'Info.plist'), plistXml({ name, identifier, executable: 'launch' }))

  // POSIX sh；Finder 双击无 nvm/PATH，故壳内自行定位 node；日志脱敏、失败弹窗。
  const launcherScript = `#!/bin/sh
# PM工作台 可点击入口：定位稳定 Node 22 后转发启动器；不复制 cookie、不外取 token、不写全局。
LAUNCHER_BIN=${shellLiteral(launcherBin)}
BAKED_NODE=${shellLiteral(bakedNode)}
${envBlock}LOG_DIR="\${HOME}/Library/Logs/pm-launcher"
mkdir -p "\$LOG_DIR" 2>/dev/null
LOG="\$LOG_DIR/launcher.log"
log(){ printf '%s %s\\n' "\$(date '+%Y-%m-%d %H:%M:%S')" "\$1" >>"\$LOG" 2>/dev/null; }

find_node(){
  if [ -n "\$BAKED_NODE" ] && [ -x "\$BAKED_NODE" ]; then echo "\$BAKED_NODE"; return; fi
  if [ -s "\${HOME}/.nvm/nvm.sh" ]; then
    NVM_DIR="\${HOME}/.nvm"; . "\${HOME}/.nvm/nvm.sh" >/dev/null 2>&1
    if command -v nvm >/dev/null 2>&1 && nvm use 22 >/dev/null 2>&1; then command -v node; return; fi
  fi
  command -v node
}

NODE="\$(find_node)"
if [ -z "\$NODE" ] || [ ! -x "\$NODE" ]; then
  log 'Node 22 不可用：未启动 PM 工作台（未读取/复制任何凭据）。'
  osascript -e 'display dialog "找不到 Node 22 运行环境，PM 工作台未启动。" with title "PM工作台" buttons ["知道了"] default button 1' >/dev/null 2>&1
  exit 1
fi
if [ ! -f "\$LAUNCHER_BIN" ]; then
  log "启动器文件缺失：\$LAUNCHER_BIN（未启动、未读取凭据）。"
  osascript -e 'display dialog "本地启动器文件缺失，PM 工作台未启动。" with title "PM工作台" buttons ["知道了"] default button 1' >/dev/null 2>&1
  exit 1
fi
# stdout/stderr 落脱敏日志；启动器自身对 token 脱敏，不在可见终端打印令牌。
exec "\$NODE" "\$LAUNCHER_BIN" "\$@" >>"\$LOG" 2>&1
`
  const launcherPath = join(macos, 'launch')
  writeFileSync(launcherPath, launcherScript)
  chmodSync(launcherPath, 0o755)

  return bundle
}
