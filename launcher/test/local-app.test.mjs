/**
 * 本机可点击入口（.app bundle）契约：零编译目录结构、Finder 无 nvm 也能定位 node22、
 * 壳仅转发稳定启动器、失败诚实弹窗、不含 token/cookie；不把 Chrome --app 当原生入口。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

import { buildLocalAppBundle } from '../src/local-app.mjs'

test('local-app：路径中的空格、中文与单引号只作为完整字面值，不变成壳命令', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pm-app-quoting-'))
  try {
    for (const suffix of ['plain', 'space path', '中文路径', "single'quote", "qa'; :; #"]) {
      const launcherBin = join(dir, suffix, 'main.mjs')
      const nodePath = join(dir, suffix, 'node')
      const bundle = buildLocalAppBundle({ outDir: join(dir, suffix), launcherBin, nodePath })
      const launch = join(bundle, 'Contents', 'MacOS', 'launch')
      execFileSync('/bin/sh', ['-n', launch])
      const header = readFileSync(launch, 'utf8').split('LOG_DIR=')[0]
      // 仅执行变量赋值和打印；不执行启动器主体、任何输入命令或服务。
      const parsed = execFileSync('/bin/sh', ['-c', `${header}\nprintf '%s\\n%s' "$LAUNCHER_BIN" "$BAKED_NODE"`], { encoding: 'utf8' })
      assert.equal(parsed, `${launcherBin}\n${nodePath}`)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('local-app：写出 PM工作台.app，plist 齐全，壳可执行、含 nvm 兜底与稳定启动器路径', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pm-app-'))
  try {
    const launcherBin = join(dir, 'bin', 'pm-launcher.mjs')
    const bundle = buildLocalAppBundle({
      outDir: dir,
      nodePath: '/stable/nvm/v22/bin/node',
      launcherBin,
    })
    const plist = readFileSync(join(bundle, 'Contents', 'Info.plist'), 'utf8')
    for (const key of ['CFBundleName', 'CFBundleIdentifier', 'CFBundleExecutable', 'CFBundlePackageType']) {
      assert.ok(plist.includes(key), `plist 含 ${key}`)
    }
    assert.ok(plist.includes('APPL'))

    const launcherPath = join(bundle, 'Contents', 'MacOS', 'launch')
    const st = statSync(launcherPath)
    assert.equal(st.mode & 0o111, 0o111, '壳有可执行位')
    // sh 语法自检（不执行、不启动服务）。
    execFileSync('/bin/sh', ['-n', launcherPath])

    const script = readFileSync(launcherPath, 'utf8')
    assert.ok(script.includes(launcherBin), '壳烤稳定启动器绝对路径')
    assert.ok(script.includes('/stable/nvm/v22/bin/node'), '壳烤稳定 node')
    assert.ok(script.includes('.nvm/nvm.sh') && script.includes('nvm use 22'), 'Finder 无 nvm 时有兜底')
    assert.ok(script.includes('display dialog'), '失败诚实弹窗，不假成功')
    // 不夹带任何令牌/凭据赋值（说明词不算）。
    assert.ok(!/token\s*=|MemToken\s*=|COOKIE=|PASSWORD=/i.test(script))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('local-app：构建时安全绑定 PM_PORT/DSH_HOME 烤进 export；默认不烤；非法值拒绝', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pm-app-'))
  try {
    const launcherBin = join(dir, 'bin', 'pm-launcher.mjs')
    const bundle = buildLocalAppBundle({
      outDir: dir, launcherBin, port: 3199, host: '127.0.0.1', dshHome: '/tmp/iso3-home',
    })
    const script = readFileSync(join(bundle, 'Contents', 'MacOS', 'launch'), 'utf8')
    assert.ok(script.includes("export PM_PORT='3199'"))
    assert.ok(script.includes("export PM_HOST='127.0.0.1'"))
    assert.ok(script.includes("export DSH_HOME='/tmp/iso3-home'"))
    execFileSync('/bin/sh', ['-n', join(bundle, 'Contents', 'MacOS', 'launch')])

    // 默认不烤 PM_PORT（走启动器默认 3172）。
    const plain = buildLocalAppBundle({ outDir: dir, launcherBin: join(dir, 'plain.mjs') })
    const plainScript = readFileSync(join(plain, 'Contents', 'MacOS', 'launch'), 'utf8')
    assert.ok(!plainScript.includes('export PM_PORT='))

    // 非法注入字符直接抛错，不写进壳。
    assert.throws(() => buildLocalAppBundle({ outDir: dir, launcherBin, port: '3199; rm -rf /' }))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('local-app：nodePath 留空时 BAKED_NODE 为空串，不烤私有/沙箱路径，仍可定位', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pm-app-'))
  try {
    const launcherBin = join(dir, 'bin', 'pm-launcher.mjs')
    const bundle = buildLocalAppBundle({ outDir: dir, launcherBin })
    const script = readFileSync(join(bundle, 'Contents', 'MacOS', 'launch'), 'utf8')
    assert.ok(script.includes("BAKED_NODE=''"), '无烤 node 时为空串')
    assert.ok(!/sandbox_runtime|agent_mode|sessions/.test(script), '不烤私有 session 路径')
    execFileSync('/bin/sh', ['-n', join(bundle, 'Contents', 'MacOS', 'launch')])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
